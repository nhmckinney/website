const CLIENT_ID = '1028652948222-o3p1o6afcb16q774bcucgdse00dol2hs.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDu-nZY6vNGAZNihqn_dPAxz3BWqrEYFIw';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // Will be set later
  });
  gisInited = true;
  maybeEnableButtons();
}

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById('authorize_button').style.display = 'block';
  }
}

document.getElementById('authorize_button').onclick = () => {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    document.getElementById('signout_button').style.display = 'block';
    listUpcomingEvents();
  };

  tokenClient.requestAccessToken({ prompt: 'consent' });
};

document.getElementById('signout_button').onclick = () => {
  google.accounts.oauth2.revoke(gapi.client.getToken().access_token, () => {
    document.getElementById('content').innerHTML = '<p>Signed out.</p>';
    document.getElementById('signout_button').style.display = 'none';
  });
};

async function listUpcomingEvents() {
  let response;
  try {
    response = await gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 10,
      orderBy: 'startTime'
    });
  } catch (err) {
    document.getElementById('content').innerText = err.message;
    return;
  }

  const events = response.result.items;
  if (!events || events.length === 0) {
    document.getElementById('content').innerHTML = '<p>No upcoming events found.</p>';
    return;
  }

  let output = '<h3>Upcoming Dates:</h3><pre>';
  events.forEach((event) => {
    const when = event.start.dateTime || event.start.date;
    output += `${event.summary} (${when})\n`;
  });
  output += '</pre>';
  document.getElementById('content').innerHTML = output;
}