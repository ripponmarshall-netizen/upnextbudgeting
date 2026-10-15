/**
 * UpNext Budgeting — Gmail bank alert bridge (Google Apps Script).
 *
 * Runs in your own Google account and hands bank alert emails to the app.
 * Nothing goes through a server we run; the app talks to this script only.
 *
 * Setup (about 5 minutes, works in Safari on iPhone with "Request Desktop Website"):
 * 1. In Gmail, create a filter for your bank alert senders and have it apply
 *    the label  upnext-alerts  (e.g. From: the address your NCB/Scotia alerts come from).
 * 2. Go to script.google.com → New project. Replace the code with this file.
 * 3. Pick the  setup  function in the toolbar and press Run. Approve access
 *    (Advanced → Go to project if Google warns the app is unverified: it is
 *    your own script). Open Executions / the log and copy the key it prints.
 * 4. Deploy → New deployment → type Web app.
 *      Execute as: Me      Who has access: Anyone
 *    Copy the Web app URL (https://script.google.com/macros/s/…/exec).
 * 5. In UpNext → Settings → Bank alerts, paste the URL and the key.
 *
 * "Anyone" means anyone holding BOTH the URL and the key can read the alerts
 * under that label. Keep them private. To revoke, run  setup  again (new key)
 * or archive the deployment.
 */

const LABEL = 'upnext-alerts';
const MAX_THREADS = 60;
const MAX_BODY = 3000;

function doGet(e) {
  const params = (e && e.parameter) || {};
  const key = PropertiesService.getScriptProperties().getProperty('UPNEXT_KEY');
  if (!key || params.key !== key) return json_({ error: 'unauthorised' });

  const since = Number(params.since) || 0;
  // Gmail search is day-granular; the exact cut-off is applied below.
  const days = since ? Math.min(90, Math.ceil((Date.now() - since) / 86400000) + 1) : 45;
  const threads = GmailApp.search('label:' + LABEL + ' newer_than:' + days + 'd', 0, MAX_THREADS);

  const messages = [];
  threads.forEach(function (thread) {
    thread.getMessages().forEach(function (message) {
      const date = message.getDate();
      if (date.getTime() <= since) return;
      messages.push({
        id: message.getId(),
        date: date.toISOString(),
        from: message.getFrom(),
        subject: message.getSubject(),
        body: message.getPlainBody().slice(0, MAX_BODY)
      });
    });
  });
  return json_({ messages: messages });
}

// Run once from the editor. Creates (or replaces) the key the app must send.
function setup() {
  const key = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
  PropertiesService.getScriptProperties().setProperty('UPNEXT_KEY', key);
  if (!GmailApp.getUserLabelByName(LABEL)) GmailApp.createLabel(LABEL);
  Logger.log('UpNext key: ' + key);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
