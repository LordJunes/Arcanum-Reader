/**
 * Google Drive API & Picker Integration
 */

// =======================================================
// HIER DEINE SCHLÜSSEL EINTRAGEN (STRG + F):
// =======================================================
const CLIENT_ID = '605629948330-v4llhu3aud8hlq3k6glourvkjmu7dum6.apps.googleusercontent.com';
const API_KEY = 'AIzaSyC7BaGcp1g8Z2-GQug45HobQfDzdgtcC4E';

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
let tokenClient = null;
let accessToken = null;
let pickerInited = false;
let gisInited = false;

function gapiLoaded() {
  gapi.load('picker', () => {
    pickerInited = true;
  });
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '',
  });
  gisInited = true;
}

window.addEventListener('load', () => {
  if (typeof gapi !== 'undefined') gapiLoaded();
  if (typeof google !== 'undefined' && google.accounts) gisLoaded();
});

function openGoogleDrivePicker() {
  if (!tokenClient) {
    alert("Google API lädt noch... bitte einen Moment gedulden.");
    return;
  }

  tokenClient.callback = async (resp) => {
    if (resp.error) throw resp;
    accessToken = resp.access_token;
    createPicker();
  };

  if (accessToken === null) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    createPicker();
  }
}

function createPicker() {
  const view = new google.picker.View(google.picker.ViewId.DOCS);
  view.setMimeTypes('application/pdf');

  const picker = new google.picker.PickerBuilder()
    .enableFeature(google.picker.Feature.NAV_HIDDEN)
    .setAppId(CLIENT_ID)
    .setOAuthToken(accessToken)
    .addView(view)
    .setDeveloperKey(API_KEY)
    .setCallback(pickerCallback)
    .build();

  picker.setVisible(true);
}

async function pickerCallback(data) {
  if (data.action === google.picker.Action.PICKED) {
    const doc = data.docs[0];
    const fileId = doc.id;
    const fileName = doc.name;

    document.getElementById('book-meta').textContent = "Lade Magie aus Google Drive...";

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const blob = await response.blob();
      
      // Lokal sichern
      await saveBookToDB(fileId, fileName, blob);
      
      // In Grimoire laden
      if (window.arcanumApp) {
        window.arcanumApp.loadPDFFromBlob(blob, fileName, fileId);
      }
    } catch (err) {
      alert("Fehler beim Laden aus Google Drive: " + err.message);
      document.getElementById('book-meta').textContent = "Fehler beim Laden";
    }
  }
}