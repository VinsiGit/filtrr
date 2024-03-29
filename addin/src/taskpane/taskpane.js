const site = "https://s144272.devops-ap.be/api"; 

let initialAppState = document.getElementById("app-body").innerHTML;

let label1color = "#6460af";
let label2color = "#b872de";

let shadowcolor = "#607D8B";
let shadowOpacity = 0.1;

let radial_textcolor = "#46494c";
let radial_trackcolor = "#F5F4FF";
let radial_backgroundcolor = "#ffffff";


// This function is called when Office.js is fully loaded.
Office.onReady((info) => {
  if (info.host === Office.HostType.Outlook) {
    document.getElementById("app-body").style.display = "flex";
    run();
  }
});

// This function gets the body of the email in text format
export async function run() {
  let data = initializeData();
  const sendSwitch = document.getElementById("sendSwitch");

  sendSwitch.addEventListener("change", function() {
    if (this.checked) {
      sendEmailBodyToServer(data).then(new_data => {
        updateData(data, new_data);
        display(data);
      }).catch(error => {
        console.error('Error:', error);
      });        
    }
  });

  Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged, function() {
    updateDataOnItemChange(data);
  });
}

function initializeData() {
  return {
    "item_id": "",
    "sender": "",
    "sender_email": "",
    "datetime_received": 0,
    "subject": "",
    "body":"",
    "label":"",
    "certainty":0 
  }
}

function updateData(data, new_data) {
  console.log(new_data.label);
  data.label = new_data.label;
  data.certainty = new_data.certainty
}

function updateDataOnItemChange(data) {
  let mail = Office.context.mailbox
  let item = mail.item;
  data.item_id = item.itemId
  data.sender = item.sender.displayName;
  data.sender_email = item.sender.emailAddress;
  data.datetime_received = item.dateTimeCreated.getTime();
  data.subject = mail.item.subject

  item.body.getAsync("text", function(result) {
    if (result.status === Office.AsyncResultStatus.Succeeded) {
      data.body = result.value ;
      const sendSwitch = document.getElementById("sendSwitch");
      if (sendSwitch.checked) {
        sendEmailBodyToServer(data).then(new_data => {
          updateData(data, new_data);
          display(data);
        }).catch(error => {
          console.error('Error:', error);
        });
      }
    }
  }); 
}

export async function downloadEmailBody(body) {
  let blob = new Blob([body], { type: "text/plain" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "emailBody.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 

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
    colors: [label1color],  
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 0,
          size: "65%",
          background: radial_backgroundcolor
        },
        track: {
          background: radial_trackcolor,
          dropShadow: {
            enabled: true,
            top: 1,
            left: 1,
            blur: 2,
            opacity: shadowOpacity,
            color: shadowcolor
          }
        },
        dataLabels: {
          name: {
            offsetY: -10,
            color: radial_textcolor,
            fontSize: "13px"
          },
          value: {
            color: radial_textcolor,
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
        gradientToColors: [label2color],
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
    const response = await fetch(site, { method: 'GET' });
    if (response.ok) {

      // Remove the check server button
      const checkServerButton = document.getElementById("check-server");
      if (checkServerButton) {
        checkServerButton.remove();
      }
      document.getElementById("app-body").innerHTML = initialAppState;

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
        const BearerData = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxMTYyODY2MSwianRpIjoiMmY3OTQyOTctYTA5OC00MmNmLTk0MmMtODI0ZTQ4N2U3N2IyIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6eyJ1c2VybmFtZSI6ImFkZGluIiwicm9sZSI6InVzZXIifSwibmJmIjoxNzExNjI4NjYxLCJjc3JmIjoiZWM2MjM3YzktMDdmMC00YmIwLWEwZTktNDI1YmU0ZDg4ZDRjIiwiZXhwIjoxNzEyMjMzNDYxfQ.SHf665JkfvzXFBG1EA0zzQ5tMaC1X83MIceI5JzCBUA";
              

        const response = await fetch(site, {
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
      document.getElementById("app-body").innerHTML = site+"/login"; // "The server is currently offline. Please try again later.";

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



