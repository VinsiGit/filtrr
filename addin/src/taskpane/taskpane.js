// Constants
const API_SITE = "https://s144272.devops-ap.be/api";
const BEARER_DATA = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxNTg0NDk2MiwianRpIjoiNjQ3YTJiNWItMDA3YS00ZWE2LTg3OTktYzVkNmZmYmM0ZTYwIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIn0sIm5iZiI6MTcxNTg0NDk2MiwiY3NyZiI6Ijc1YmU4M2U3LTVkMmItNGFmNi1hOTJhLTc4MmZiN2Y2Y2VkZSIsImV4cCI6MTcxNjQ0OTc2Mn0.ikjgrbNFJ8xE2rjEB9-FzX5n1z0IXsVuheE8WcAW0Rg";

// POST is voor sturen van Initialize data en PUT is voor updates van data  

const initialAppState = document.getElementById('app-body').innerHTML

const COLORS = {
  label1: "#6460af",
  label2: "#b872de",
  shadow: "#607D8B",
  radialText: "#46494c",
  radialTrack: "#F5F4FF",
  radialBackground: "#ffffff",
  opacity: 0.1,
};

// Initialize data



let data = {
  item_id: "",
  sender: "",
  sender_email: "",
  datetime_received: 0,
  subject: "",
  body: "",
  predicted_label: "",
  actual_label: null,
  certainty: 0,
  rating: 0,
};
function resetData() {
  data.item_id = "";
  data.sender = "";
  data.sender_email = "";
  data.datetime_received = 0;
  data.subject = "";
  data.body = "";
  data.predicted_label = "";
  data.actual_label = null;
  data.certainty = 0;
  data.rating = 0;
}


// Group 1
const buttonsGroup1 = document.querySelectorAll('#pos, #neg');

buttonsGroup1.forEach(button => {
  button.addEventListener('click', (event) => {
    // Remove the 'active' class from all buttons in the group
    buttonsGroup1.forEach(btn => {
      btn.classList.remove('active');
    });

    // Add the 'active' class to the clicked button
    event.target.classList.add('active');
  });
});

// Group 2
const buttonsGroup2 = document.querySelectorAll('#IRRELEVANT, #DATA_ENGINEER, #BI_ENGINEER');

buttonsGroup2.forEach(button => {
  button.addEventListener('click', (event) => {
    // Remove the 'active' class from all buttons in the group
    buttonsGroup2.forEach(btn => {
      btn.classList.remove('active');
    });

    // Add the 'active' class to the clicked button
    event.target.classList.add('active');
  });
});
// Reload when clicking on the sswitch
document.getElementById("sendSwitch").addEventListener("click", () => {
  updateDataOnItemChange(data);
});

document.getElementById("pos").addEventListener("click", () => {
  // Hide the second container
  document.querySelector(".container-label").style.display = "none";
  // Call the rate function
  rate(1, data, null);
});

// Add event listeners for rating buttons
document.getElementById("neg").addEventListener("click", () => {
  // Show the second container
  document.querySelector(".container-label").style.display = "block";
  // Call the rate function
  rate(-1, data, null);
});

document.getElementById("IRRELEVANT").addEventListener("click", () => { rate(-1, data, "IRRELEVANT"); })
document.getElementById("DATA_ENGINEER").addEventListener("click", () => { rate(-1, data, "DATA_ENGINEER"); })
document.getElementById("BI_ENGINEER").addEventListener("click", () => { rate(-1, data, "BI_ENGINEER"); })

// Office.js initialization
Office.onReady((info) => {
  if (info.host === Office.HostType.Outlook) {
    document.getElementById("app-body").style.display = "flex";
    run();
  }
});

// Update data function
function updateData(data, newData) {
  console.log("newData:", newData);
  console.log("Updating data with new_data");
  data.predicted_label = newData.predicted_label;
  data.certainty = newData.certainty;
  updateCategories(data);
}

function updateItemData(item) {
  data.item_id = item.itemId;
  data.sender = item.sender.displayName;
  data.sender_email = item.sender.emailAddress;
  data.datetime_received = item.dateTimeCreated.getTime();
  data.subject = item.subject;
}

function resetActiveButtons() {
  const buttons = document.querySelectorAll('#pos, #neg, #IRRELEVANT, #DATA_ENGINEER, #BI_ENGINEER');
  buttons.forEach(button => {
    button.classList.remove('active');
  });
  document.querySelector(".container-label").style.display = "none";

}

// Run function
async function run() {
  document.getElementById("loading-screen").style.display = "block";
  resetData();
  resetActiveButtons(); // Reset active state of buttons
  updateDataOnItemChange(data);

  Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged, () => {
    document.getElementById("loading-screen").style.display = "block";
    resetData();
    resetActiveButtons(); // Reset active state of buttons
    updateDataOnItemChange(data);
  });
}

function updateCategories(data) {
  Office.context.mailbox.masterCategories.getAsync((asyncResult) => {
    if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
      const masterCategories = asyncResult.value;
      if (!masterCategories.includes(data.predicted_label)) {
        const categoryDetails = {
          displayName: data.predicted_label,
          color: Office.MailboxEnums.CategoryColor.Preset0,
        };
        Office.context.mailbox.masterCategories.addAsync([categoryDetails], (asyncResult) => {
          if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
            console.log("Successfully added category to master list");
          } else {
            console.log("masterCategories.addAsync call failed with error:", asyncResult.error.message);
          }
        });
      }
    } else {
      console.log("masterCategories.getAsync call failed with error:", asyncResult.error.message);
    }
  });
  Office.context.mailbox.item.categories.addAsync([data.predicted_label], (asyncResult) => {
    if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
      console.log("Successfully added categories");
    } else {
      console.log("categories.addAsync call failed with error:", asyncResult.error.message);
    }
  });
}

// Update data on item change function
function updateDataOnItemChange(data) {
  const mail = Office.context.mailbox;
  const item = mail.item;
  updateItemData(item);
  item.body.getAsync("text", (result) => {
    if (result.status === Office.AsyncResultStatus.Succeeded) {
      data.body = result.value;
      if (document.getElementById("sendSwitch").checked) {
        document.getElementById("ui").style.display = "block";
        sendEmailBodyToServer(data)
          .then((newData) => {
            updateData(data, newData);
            updateChart(data) //updateChart(data); //debug(data);
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      } else {
        document.getElementById("ui").style.display = "none";
      }
    }
  });
}
let chartInstance = null;
function updateChart(data) {
  const chartOptions = {
    series: [Math.round(data.certainty * 100 * 100) / 100],
    chart: {
      id: "certaintyWheel",
      height: 350,
      type: "radialBar",
    },
    colors: [COLORS.label1],
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 0,
          size: "65%",
          background: COLORS.radialBackground,
        },
        track: {
          background: COLORS.radialTrack,
          dropShadow: {
            enabled: true,
            top: 1,
            left: 1,
            blur: 2,
            opacity: COLORS.opacity,
            color: COLORS.shadow,
          },
        },
        dataLabels: {
          name: {
            offsetY: -10,
            color: COLORS.radialText,
            fontSize: "13px",
          },
          value: {
            color: COLORS.radialText,
            fontSize: "30px",
            show: true,
          },
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "vertical",
        gradientToColors: [COLORS.label2],
        stops: [0, 200],
      },
    },
    stroke: {
      lineCap: "round",
    },
    labels: [data.predicted_label],
  };
  if (chartInstance) {
    chartInstance.updateSeries([Math.round(data.certainty * 100 * 100) / 100]);
    chartInstance.updateOptions(chartOptions);
  } else {
    chartInstance = new ApexCharts(document.querySelector("#chart"), chartOptions);
    chartInstance.render();
  }
}

// Display function
async function debug(data) {
  const itemLabel = document.getElementById("item-label");
  const itemActualLabel = document.getElementById("item-ActualLabel");
  const itemProba = document.getElementById("item-proba");
  const itemRating = document.getElementById("item-rating");

  console.log(data.rating);
  itemLabel.innerHTML = `<b>Label:</b> ${data.predicted_label}`;
  itemActualLabel.innerHTML = `<b>Actual label:</b> ${data.actual_label}`;

  itemProba.innerHTML = `<b>Probability:</b> ${data.certainty}`;
  itemRating.innerHTML = `<b>Rating:</b> ${data.rating}`;
  updateChart(data);
}

// Check server status function
async function checkServerStatus() {
  try {
    const response = await fetch(API_SITE, { method: "GET" });
    if (response.ok) {
      // Remove the check server button
      const checkServerButton = document.getElementById("check-server");
      if (checkServerButton) {
        checkServerButton.remove();
      }
      document.getElementById("app-body").innerHTML = initialAppState;
      console.log("The server is online.");
    }
  } catch (error) {
    console.log("The server is offline.");
  }
}

// Rate function
async function rate(value, data, actual_label) {
  const mail = Office.context.mailbox;
  const item = mail.item;
  updateItemData(item);
  if (value === 1 || value === -1) {
    data.rating = value;
    data.actual_label = actual_label;

  } else {
    console.error("Invalid rating. Please provide a rating of 1 or -1.");
  }
  console.log("data.rating");
  console.log(data.rating);
  item.body.getAsync("text", function (result) {
    if (result.status === Office.AsyncResultStatus.Succeeded) {
      console.log("result");
      console.log(result.value);
      const requestBody = {
        "body": data.body,
        "rating": data.rating
      };
      if (actual_label !== null) {
        requestBody.actual_label = actual_label;
      }
      fetch(API_SITE, {
        method: "PUT",
        headers: {
          "Source": "Outlook",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${BEARER_DATA}`,
        },
        body: JSON.stringify(requestBody),
      });
      updateDataOnItemChange(data);
    }
  });
}


export async function sendEmailBodyToServer(data) {
  console.log(data.body);

  try {
    const response = await fetch(API_SITE, {
      method: "POST",
      headers: {
        "Source": "Outlook",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${BEARER_DATA}`,
      },
      body: JSON.stringify({ body: data.body }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const responseData = await response.json();

    console.log(responseData);
    return responseData;
  } catch (error) {
    handleServerError();
    console.error("Error:", error);
  } finally {
    document.getElementById("loading-screen").style.display = "none";
  }
}

function handleServerError() {
  document.getElementById("app-body").innerHTML = API_SITE + "/login";
  const checkServerButton = document.createElement("button");
  checkServerButton.id = "check-server";
  checkServerButton.innerText = "Check Server Status";
  document.getElementById("app-body").appendChild(checkServerButton);
  checkServerButton.addEventListener("click", () => checkServerStatus());
}
