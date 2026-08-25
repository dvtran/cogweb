/**
 * NeuroAssess results backend — Google Apps Script Web App.
 *
 * Deploy this bound to a Google Sheet (Extensions > Apps Script from the
 * sheet). It stores each submitted assessment session as one row (the full
 * session JSON in one cell, plus a few flattened columns for easy reading
 * directly in the sheet), and serves them back as JSON for the dashboard.
 *
 * See ../README.md for full deployment steps.
 */

var SHEET_NAME = 'Sessions';
var HEADERS = ['id', 'type', 'name', 'startedAt', 'summary', 'json'];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function summarize_(session) {
  if (session.type === 'verbal') {
    return 'Category: ' + session.category + ' — Correct: ' + session.hits + '/12, False alarms: ' + session.falseAlarms + '/12';
  }
  return 'Dominant: ' + session.meanDominant + ' — Non-dominant: ' + session.meanNonDominant;
}

/**
 * GET — returns every stored session as { sessions: [...] }.
 * Apps Script serves this with permissive CORS by default for plain GET
 * requests, so the dashboard's fetch() can read it directly cross-origin.
 */
function doGet(e) {
  var sheet = getSheet_();
  var rows = sheet.getDataRange().getValues();
  var sessions = [];
  for (var i = 1; i < rows.length; i++) {
    var jsonCell = rows[i][5];
    if (!jsonCell) continue;
    try {
      sessions.push(JSON.parse(jsonCell));
    } catch (err) {
      // skip a malformed row rather than failing the whole response
    }
  }
  return ContentService
    .createTextOutput(JSON.stringify({ sessions: sessions }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST — appends one session. The page sends this with mode:"no-cors" and
 * Content-Type: text/plain (to avoid a CORS preflight, which Apps Script
 * web apps don't handle), so we parse the body manually here rather than
 * relying on a JSON content type.
 */
function doPost(e) {
  var body = e.postData && e.postData.contents;
  if (!body) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'no body' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var session;
  try {
    session = JSON.parse(body);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'bad json' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (!session.id || !session.type || !session.name) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'missing required fields' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var sheet = getSheet_();
  sheet.appendRow([
    session.id,
    session.type,
    session.name,
    session.startedAt || new Date().toISOString(),
    summarize_(session),
    JSON.stringify(session)
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, id: session.id }))
    .setMimeType(ContentService.MimeType.JSON);
}
