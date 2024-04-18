// Constants for colors and site URL
const SITE_URL = "https://s144272.devops-ap.be/api";
const INITIAL_APP_STATE = document.getElementById("app-body").innerHTML;
const COLORS = {
  label1: "#6460af",
  label2: "#b872de",
  shadow: "#607D8B",
  radialText: "#46494c",
  radialTrack: "#F5F4FF",
  radialBackground: "#ffffff",
};
const SHADOW_OPACITY = 0.1;

const initializeData = () => ({
  item_id: "",
  sender: "",
  sender_email: "",
  datetime_received: 0,
  subject: "",
  body: "",
  label: "",
  certainty: 0,
});

// Function to run when Office.js is fully loaded
Office.onReady((info) => {
  if (info.host === Office.HostType.Outlook) {
    document.getElementById("app-body").style.display = "flex";
    run();
  }
});

// Main function to run
export async function run() {
  const data = initializeData();
  const sendSwitch = document.getElementById("sendSwitch");

  sendSwitch.addEventListener("change", function () {
    if (this.checked) {
      document.getElementById("ui").style.display = "inline";

      sendEmailBodyToServer(data)
        .then((new_data) => {
          updateData(data, new_data);
          display(data);
        })
        .catch(console.error);
    } else {
      // Code to disable UI goes here
      // For example, if you have a div with id "ui", you can disable it like this:
      document.getElementById("ui").style.display = "none";
    }
  });

  Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged, function () {
    updateDataOnItemChange(data);
  });
}

const updateData = (data, new_data) => {
  data.label = new_data.label;
  data.certainty = new_data.certainty;
};

const updateDataOnItemChange = async (data) => {
  const mail = Office.context.mailbox;
  const item = mail.item;
  data.item_id = item.itemId;
  data.sender = item.sender.displayName;
  data.sender_email = item.sender.emailAddress;
  data.datetime_received = item.dateTimeCreated.getTime();
  data.subject = mail.item.subject;

  const result = await item.body.getAsync("text");
  if (result.status === Office.AsyncResultStatus.Succeeded) {
    data.body = result.value;
    const sendSwitch = document.getElementById("sendSwitch");
    if (sendSwitch.checked) {
      try {
        const new_data = await sendEmailBodyToServer(data);
        updateData(data, new_data);
        display(data);
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }
};


let chartInstance = null;

export async function display(data) {
  const item_class = document.getElementById("item-class")
  const item_proba = document.getElementById("item-proba")

  item_class.innerHTML = "<b>Class:</b> <br/>" + data.label;
  item_proba.innerHTML = "<b>Probability:</b> <br/>" + data.certainty;

  let chartOptions = {
    series: [Math.round((data.certainty*100) * 100) / 100], //round to 2 decimal places
    chart: {
      id: "certaintyWheel",
      height: 350,
      type: "radialBar"
    },
    colors: [COLORS.label1],  
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 0,
          size: "65%",
          background: COLORS.radialBackground
        },
        track: {
          background: COLORS.radialTrack,
          dropShadow: {
            enabled: true,
            top: 1,
            left: 1,
            blur: 2,
            opacity: SHADOW_OPACITY,
            color:  COLORS.shadow
          }
        },
        dataLabels: {
          name: {
            offsetY: -10,
            color:  COLORS.radialText,
            fontSize: "13px"
          },
          value: {
            color: COLORS.radialText,
            fontSize: "30px",
            show: true
          }
        }
      }
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "vertical",
        gradientToColors: [COLORS.label2],
        stops: [0, 200]
      }
    },
    stroke: {
      lineCap: "round"
    },
    labels: [data.label]
  };

  if (chartInstance) {
    chartInstance.updateSeries([Math.round((data.certainty*100) * 100) / 100]);
    chartInstance.updateOptions(chartOptions);
  } else {
    chartInstance = new ApexCharts(document.querySelector("#chart"), chartOptions);
    chartInstance.render();
  }
}


export async function checkServerStatus() {
  try {
    const response = await fetch(SITE_URL, { method: 'GET' });
    if (response.ok) {

      // Remove the check server button
      const checkServerButton = document.getElementById("check-server");
      if (checkServerButton) {
        checkServerButton.remove();
      }
      document.getElementById("app-body").innerHTML = INITIAL_APP_STATE;

      console.log('The server is offline.');
    }
  } catch (error) {
    console.log('The server is offline.');
  }
}


export async function sendEmailBodyToServer(data) {
    document.getElementById("loading-screen").style.display = "block";
    console.log(data.body);
    try {
        const BearerData = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxMzQyODQxNiwianRpIjoiMjBmMWMxNmItNjBhOS00NTVjLWE3NjUtNGU3NGE1YzA0NmQ5IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIn0sIm5iZiI6MTcxMzQyODQxNiwiY3NyZiI6IjY4NjcyNDA2LTRkOTUtNGRlYS1iZWYwLTQ2MWFhOGRiOGY4MSIsImV4cCI6MTcxNDAzMzIxNn0.zeotClcJrS_eFUbXp_Z00fmKUCm165dy3VQ_PIqMnbY";
              

        const response = await fetch(SITE_URL, {
            method: 'POST',
            headers: {
                'Source':"Outlook",
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${BearerData}` // .access_token
            },
            body: JSON.stringify({ "body": data.body }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log(responseData);

        // Remove the check server button if it exists
        const checkServerButton = document.getElementById("check-server");
        if (checkServerButton) {
            checkServerButton.remove();
        }

        return responseData;
    } catch (error) {
      document.getElementById("app-body").innerHTML = SITE_URL+"/login"; // "The server is currently offline. Please try again later.";

      // Create the check server button
      const checkServerButton = document.createElement("button");
      checkServerButton.id = "check-server";
      checkServerButton.innerText = "Check Server Status";
      document.getElementById("app-body").appendChild(checkServerButton);

      // Add an event listener to the button
      checkServerButton.addEventListener("click", () => checkServerStatus());

      console.error('Error:', error);
    } finally {
      document.getElementById("loading-screen").style.display = "none";
    }
}



