// Constants
const API_SITE = "https://s144272.devops-ap.be/api";
const BEARER_DATA = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxNzA2MDQxNSwianRpIjoiZThhZWI2MTItY2EwNS00YzEwLWI3MTMtMTFiZDI3MDU2MDFhIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIn0sIm5iZiI6MTcxNzA2MDQxNSwiY3NyZiI6IjAxNjQxODc2LTJlNDQtNGJlMS1hMzFiLTIwOGYxNzI3NDhhNSIsImV4cCI6MTc0ODU5NjQxNX0.u9eUtedvU2ZvlkdsJpfmNoO4-FOdZpaaPJFuEjMOa3A"
// POST is voor sturen van Initialize data en PUT is voor updates van data  

const initialAppState = document.getElementById('app-body').innerHTML

// Initialize data
const COLORS = {
  label1: "#6460af",
  label2: "#b872de",
  shadow: "#607D8B",
  radialText: "#46494c",
  radialTrack: "#F5F4FF",
  radialBackground: "#ffffff",
  opacity: 0.1,
};

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

// Office.js initialization
Office.onReady((info) => {
  if (info.host === Office.HostType.Outlook) {
    document.getElementById("app-body").style.display = "flex";
    run();
  }
});

/**
 * Function: run
 * Description: This function initializes the application. It displays the loading screen, resets the data, and updates the data for the new mail item. It also sets up an event handler to update the data whenever the mail item changes.
 * @async
 */
async function run() {
  document.getElementById("loading-screen").style.display = "block";
  resetData();
  updateDataOnItemChangeNewMail(data);

  Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged, async () => {
    document.getElementById("loading-screen").style.display = "block";
    resetData();
    updateDataOnItemChangeNewMail(data);
    ; // Activate button based on data
  });
}


// Group 1
const buttonsGroup1 = document.querySelectorAll('#pos, #neg');

buttonsGroup1.forEach(button => {
  button.addEventListener('click', (event) => {
    buttonsGroup1.forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');
  });
});

// Group 2
const buttonsGroup2 = document.querySelectorAll('#IRRELEVANT, #DATA_ENGINEER, #BI_ENGINEER');

buttonsGroup2.forEach(button => {
  button.addEventListener('click', (event) => {
    buttonsGroup2.forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');
  });
});

document.getElementById("sendSwitch").addEventListener("click", () => {
  updateDataOnItemChange(data);
});

document.getElementById("pos").addEventListener("click", () => {
  document.querySelector(".container-label").style.display = "none";
  rate(1, data, null);
});

document.getElementById("neg").addEventListener("click", () => {
  document.querySelector(".container-label").style.display = "block";
  if (data.actual_label === null) {
    data.actual_label = data.predicted_label;
  }
  rate(-1, data, data.actual_label);
  activateButtonBasedOnData(data)
});

document.getElementById("IRRELEVANT").addEventListener("click", () => { rate(-1, data, "IRRELEVANT"); })
document.getElementById("DATA_ENGINEER").addEventListener("click", () => { rate(-1, data, "DATA_ENGINEER"); })
document.getElementById("BI_ENGINEER").addEventListener("click", () => { rate(-1, data, "BI_ENGINEER"); })

/**
 * Function: activateButtonBasedOnData
 * Description: This function activates a button based on the actual label of the data. It first resets all active buttons, then activates the button that corresponds to the actual label. If the rating is -1, it also shows the second container and activates the 'neg' button.
 * @param {Object} dataUsing - The data object containing the actual label and rating.
 */
function activateButtonBasedOnData(dataUsing) {
  resetActiveButtons();

  let buttonId;
  console.log(dataUsing);
  switch (dataUsing.actual_label) {
    case 'IRRELEVANT':
      buttonId = 'IRRELEVANT';
      break;
    case 'DATA_ENGINEER':
      buttonId = 'DATA_ENGINEER';
      break;
    case 'BI_ENGINEER':
      buttonId = 'BI_ENGINEER';
      break;
    default:
      break;
  }

  // Activate the button
  const button = document.getElementById(buttonId);
  if (button !== null) {
    button.classList.add('active');
  } else {
    console.error("Button is null");
  }
  // Show the second container if the button is not 'pos'
  if (dataUsing.rating == -1) {
    console.log("aaa");
    document.querySelector(".container-label").style.display = "block";
    document.getElementById("neg").classList.add('active');
  }
  if (dataUsing.rating == 1) {
    console.log("bbbb");

    document.getElementById("pos").classList.add('active');
  }
  console.log("data.ratisqdng");
  console.log(dataUsing.actual_label);
  console.log(dataUsing.rating);
}

// Add event listeners for rating buttons



/**
 * Function: updateData
 * Description: This function updates the data with new data. It logs the new data, then updates the predicted label and certainty of the data. It also updates the categories of the data.
 * @async
 * @param {Object} data - The original data object.
 * @param {Object} newData - The new data object.
 */
async function updateData(data, newData) {
  console.log("newData:", newData);
  console.log("Updating data with new_data");
  data.predicted_label = newData.predicted_label;
  data.certainty = newData.certainty;
  updateCategories(data);
}

/**
 * Function: updateItemData
 * Description: This function updates the item data with the details of the item. It sets the item ID, sender, sender email, received datetime, and subject of the data.
 * @param {Object} item - The item object containing the item details.
 */
function updateItemData(item) {
  data.item_id = item.itemId;
  data.sender = item.sender.displayName;
  data.sender_email = item.sender.emailAddress;
  data.datetime_received = item.dateTimeCreated.getTime();
  data.subject = item.subject;
}

/**
 * Function: resetActiveButtons
 * Description: This function resets all active buttons. It removes the 'active' class from all buttons and hides the second container.
 */
function resetActiveButtons() {
  const buttons = document.querySelectorAll('#pos, #neg, #IRRELEVANT, #DATA_ENGINEER, #BI_ENGINEER');
  buttons.forEach(button => {
    button.classList.remove('active');
  });
  document.querySelector(".container-label").style.display = "none";

}

/**
 * Function: updateCategories
 * Description: This function updates the categories of an email item in Office context. It adds a new category if it doesn't exist.
 * @param {Object} data - The data object containing the predicted label.
 */
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


/**
 * Function: updateDataOnItemChangeNewMail
 * Description: This function updates the data when a new mail item is changed. It sends the email body to the server and updates the UI based on the response.
 * @param {Object} data - The data object containing the email details.
 */
async function updateDataOnItemChangeNewMail(data) {
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
            activateButtonBasedOnData(newData)
            updateData(data, newData);
            updateChart(data) //updateChart(data); //debug(data);
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }
      else {
        document.getElementById("ui").style.display = "none";
        document.getElementById("loading-screen").style.display = "none";
      }
    }
  })
}

/**
 * Function: updateDataOnItemChange
 * Description: This function updates the data when a mail is updated (rating). It sends the email body to the server and updates the UI based on the response.
 * @param {Object} data - The data object containing the email details.
 */
async function updateDataOnItemChange(data) {
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
      }
      else {
        document.getElementById("ui").style.display = "none";
        document.getElementById("loading-screen").style.display = "none";
      }
    }
  })
}

let chartInstance = null;
/**
 * Function: updateChart
 * Description: This function updates the chart with the provided data.
 * @param {Object} data - The data object containing the certainty and predicted label.
 */
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

/**
 * Function: debug
 * Description: This function displays the data in the UI and updates the chart.
 * @param {Object} data - The data object containing the email details.
 */
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

/**
 * Function: sendEmailBodyToServer
 * Description: This function sends the email body to the server and returns the response.
 * @param {Object} data - The data object containing the email body.
 * @returns {Object} The response data from the server.
 */
async function sendEmailBodyToServer(data) {

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

    return responseData;
  } catch (error) {
    handleServerError();
    console.error("Error:", error);
  } finally {
    document.getElementById("loading-screen").style.display = "none";
  }
}

/**
 * Function: rate
 * Description: This function rates an email item and sends the rating to the server. It updates the data based on the rating.
 * @param {Number} value - The rating value. It should be 1 or -1.
 * @param {Object} data - The data object containing the email details.
 * @param {String} actual_label - The actual label of the email item.
 */
async function rate(value, data, actual_label) {
  const mail = Office.context.mailbox;
  const item = mail.item;
  updateItemData(item);
  if (value === 1 || value === -1) {
    data.rating = value;
    data.actual_label = actual_label;
    console.log(data);
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



/**
 * Function: handleServerError
 * Description: This function handles server errors by displaying a login URL and a button to check the server status. When the button is clicked, it calls the checkServerStatus function.
 */
function handleServerError() {
  document.getElementById("app-body").innerHTML = API_SITE + "/login";
  const checkServerButton = document.createElement("button");
  checkServerButton.id = "check-server";
  checkServerButton.innerText = "Check Server Status";
  document.getElementById("app-body").appendChild(checkServerButton);
  checkServerButton.addEventListener("click", () => checkServerStatus());
}

/**
 * Function: checkServerStatus
 * Description: This function checks the server status by sending a GET request to the server. If the server is online, it removes the check server button and resets the app state. If the server is offline, it logs a message to the console.
 * @async
 * @returns {Promise<void>} Nothing
 */
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