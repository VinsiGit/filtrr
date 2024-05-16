let rateButton = CardService.newTextButton()
  .setText("Rate")
  .setOnClickAction(CardService.newAction().setFunctionName("rateFunction")); // replace with the name of your function

section.addWidget(rateButton);

function processEmailAndSendToServer(e) {
  Logger.log("test2a");

  // Check event object
  if (!e || !e.gmail || !e.gmail.accessToken || !e.gmail.messageId) {
    Logger.log("Invalid event object");
    return;
  }

  let lock = LockService.getScriptLock();
  lock.waitLock(30000); // wait 30 seconds before timing out

  let accessToken = e.gmail.accessToken;
  GmailApp.setCurrentMessageAccessToken(accessToken);

  let messageId = e.gmail.messageId;
  let message = GmailApp.getMessageById(messageId);

  let body = message.getPlainBody();
  Logger.log(body);
  Logger.log("test");

  lock.releaseLock();

  Logger.log("test2b");
  if (!body) {
    Logger.log("No email body to send.");
    return;
  }

  // Send the body to the server
  const site = "https://s144272.devops-ap.be/api"; //"https://s139913.devopps.be/9090"; // https://s144272.devops-ap.be/api/site
  const BearerData =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxNDMyMjM1MywianRpIjoiMTgwNjYxYzgtM2RlOC00OTExLTg4NmUtYTg4N2RlMDlmNTJjIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIn0sIm5iZiI6MTcxNDMyMjM1MywiY3NyZiI6Ijg5YjFlZWM1LTRmNjAtNDg5Ny04MmE2LTBiM2M5NTMxNmM5NSIsImV4cCI6MTcxNDkyNzE1M30.hqVESXm0iZmjgp_TJ7L026ZpyQbZT8Yh7XDtNT-ezO8";

  Logger.log(body);
  Logger.log(JSON.stringify({ body: body }));
  let options = {
    method: "POST",
    headers: {
      Source: "Gmail",
      "Content-Type": "application/json",
      Authorization: `Bearer ${BearerData}`, // .access_token
    },
    payload: JSON.stringify({ body: body }),
  };

  try {
    let response = UrlFetchApp.fetch(site, options);
    let responseData = JSON.parse(response.getContentText());
    PropertiesService.getScriptProperties().setProperty("responseData", JSON.stringify(responseData));
    Logger.log(responseData);
    let bodyViewer_label = CardService.newTextParagraph().setText(responseData.label);
    let bodyViewer_certainty = CardService.newTextParagraph().setText(responseData.certainty);

    let header = CardService.newCardHeader().setTitle("Email Certainty");

    let section = CardService.newCardSection();
    section.addWidget(bodyViewer_label);
    section.addWidget(bodyViewer_certainty);

    let label = GmailApp.getUserLabelByName(responseData.label);
    if (!label) {
      label = GmailApp.createLabel(responseData.label);
    }
    let mail = message.getThread();
    mail.addLabel(label);

    let ss = SpreadsheetApp.create("Temp Spreadsheet for Chart");
    let sheet = ss.getSheets()[0];

    // Populate the spreadsheet with data
    let data = [
      ["label", "certainty"],

      [responseData.label, responseData.certainty],
      ["", 1.0 - responseData.certainty],
    ];
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

    // Create a pie chart in the spreadsheet
    let chartBuilder = sheet
      .newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(sheet.getRange("A1:B3"))
      .setPosition(1, 1, 0, 0)
      .setOption("title", "Certainty Chart")
      .setOption("legend", { textStyle: { font: 200 } });

    let chart = chartBuilder.build();
    sheet.insertChart(chart);

    // Get the chart as an image and encode it in base64
    let charts = sheet.getCharts();
    let blob = charts[0].getBlob();
    let base64Image = Utilities.base64Encode(blob.getBytes());

    // Display the base64 image in the Gmail add-on
    let imageWidget = CardService.newImage()
      .setAltText("Pie Chart")
      .setImageUrl("data:image/png;base64," + base64Image);
    let sectionnew = CardService.newCardSection().addWidget(imageWidget);
    return CardService.newCardBuilder().setHeader(header).addSection(section).addSection(sectionnew).build();

    //return CardService.newCardBuilder().setHeader(header).addSection(section).build();
  } catch (error) {
    Logger.log("Error:", error);

    // Create a card that displays the error message
    let errorViewer = CardService.newTextParagraph().setText("Error: " + error);
    let header = CardService.newCardHeader().setTitle("Error");

    let section = CardService.newCardSection();
    section.addWidget(errorViewer);
    let button = CardService.newTextButton()
      .setText("Resend")
      .setOnClickAction(CardService.newAction().setFunctionName("processEmailAndSendToServer")); // replace with the name of your function

    section.addWidget(button);

    return CardService.newCardBuilder().setHeader(header).addSection(section).build();
  }
}

function getResponseData() {
  let responseData = PropertiesService.getScriptProperties().getProperty("responseData");
  return JSON.parse(responseData);
}
