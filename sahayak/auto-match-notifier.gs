/**
 * Sahayak — Auto-Match Notifier
 * ------------------------------------------------------------
 * Lives in: Google Sheet (Form Responses) → Extensions → Apps Script
 *
 * What it does:
 *  - Runs every time the Sahayak form is submitted.
 *  - Compares the new entry against all previous entries.
 *  - If two entries have the same flight number + same travel date,
 *    and one is "Looking for help" while the other is "Offering to help",
 *    it emails BOTH people letting them know about the match —
 *    without sharing each other's contact details directly.
 *    They go to the Sahayak portal to find the listing and connect.
 *
 * IMPORTANT PREREQUISITE:
 *  This requires an email address for each respondent. In your Google Form,
 *  go to Settings → Responses → turn ON "Collect email addresses".
 *  That adds an "Email Address" column to the sheet, which this script
 *  will detect automatically.
 *
 * SETUP (one-time):
 *  1. Open your Sahayak Google Sheet (the Form Responses sheet).
 *  2. Extensions → Apps Script.
 *  3. Delete any placeholder code, paste this whole file in.
 *  4. Run the function `logHeaders` once (top toolbar: select it from the
 *     function dropdown, click Run). Approve the permissions prompt.
 *  5. Open View → Logs (or Executions) and check the printed list.
 *     Confirm these keys exist on the left side:
 *        name, flight_number, travel_date, looking_for_or_offering
 *     and that an "email" key exists too.
 *     If any key looks different, edit the COL constants below to match.
 *  6. Run the function `setupTrigger` once. This installs the trigger
 *     that fires on every new form submission.
 *  7. Test: submit two test entries via the form with the same flight
 *     number + date, opposite roles ("Looking for help" / "Offering to
 *     help"), and a real email address you can check.
 *
 * Emails are sent from YOUR Gmail account (the one that owns this script),
 * via Gmail's free MailApp service (100 emails/day limit).
 */

// ---- CONFIG ----------------------------------------------------------

const PORTAL_URL = 'https://maharashtraineurope.com/sahayak/';

// Normalized header names (lowercase, spaces -> underscore, punctuation
// stripped) that this script looks for. Adjust if logHeaders() shows
// different keys for your sheet.
const COL = {
  name: 'name',
  flightNumber: 'flight_number',
  travelDate: 'travel_date',
  role: 'looking_for_or_offering', // values: "Looking for help" / "Offering to help"
};

// ---- MAIN TRIGGER ------------------------------------------------------

function onSahayakFormSubmit(e) {
  try {
    const sheet = e.range.getSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const headerMap = {};
    headers.forEach((h, i) => { headerMap[normalizeHeader(h)] = i; });

    const emailColIdx = findEmailColIndex(headerMap);
    if (emailColIdx === -1) {
      Logger.log('No email column found — enable "Collect email addresses" on the form.');
      return;
    }

    const newRowIdx = e.range.getRow() - 1; // 0-based index into data[]
    const newEntry = extractEntry(data[newRowIdx], headerMap, emailColIdx);

    // Need flight + date + role + email to even consider matching
    if (!newEntry.flight || !newEntry.date || !roleGroup(newEntry.role) || !newEntry.email) {
      return;
    }

    for (let i = 1; i < data.length; i++) {
      if (i === newRowIdx) continue;

      const existing = extractEntry(data[i], headerMap, emailColIdx);
      if (!existing.flight || !existing.date || !roleGroup(existing.role) || !existing.email) continue;
      if (existing.email === newEntry.email) continue;          // same person
      if (existing.flight !== newEntry.flight) continue;        // different flight
      if (existing.date !== newEntry.date) continue;            // different date
      if (roleGroup(existing.role) === roleGroup(newEntry.role)) continue; // same role, not useful

      sendMatchEmail(existing, newEntry);
      sendMatchEmail(newEntry, existing);
    }
  } catch (err) {
    // Email yourself if something breaks, so it doesn't fail silently
    MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Sahayak auto-match script error', String(err) + '\n' + err.stack);
  }
}

// ---- ONE-TIME SETUP ------------------------------------------------------

function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onSahayakFormSubmit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onSahayakFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();
  Logger.log('Trigger installed on form submit.');
}

function logHeaders() {
  const headers = SpreadsheetApp.getActiveSheet().getDataRange().getValues()[0];
  headers.forEach(h => Logger.log(normalizeHeader(h) + '   <-   "' + h + '"'));
}

// ---- HELPERS ------------------------------------------------------------

function normalizeHeader(h) {
  return h.toString().trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
}

function findEmailColIndex(headerMap) {
  if (headerMap['email_address'] !== undefined) return headerMap['email_address'];
  for (const key in headerMap) {
    if (key.indexOf('email') !== -1) return headerMap[key];
  }
  return -1;
}

function normalizeFlight(value) {
  return (value || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Handles real Date objects (Sheets date columns) and DD/MM/YYYY strings
function normalizeDateValue(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const s = (value || '').toString().trim();
  if (!s) return '';
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const d2 = new Date(s);
  if (!isNaN(d2.getTime())) {
    return Utilities.formatDate(d2, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return s.toLowerCase();
}

function formatDateDisplay(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'd MMM yyyy');
  }
  return (value || '').toString().trim();
}

function roleGroup(role) {
  const r = (role || '').toString().toLowerCase();
  if (r.indexOf('looking') !== -1) return 'looking';
  if (r.indexOf('offering') !== -1) return 'offering';
  return '';
}

function extractEntry(row, headerMap, emailColIdx) {
  const flightRaw = row[headerMap[COL.flightNumber]];
  const dateRaw = row[headerMap[COL.travelDate]];
  return {
    name: (row[headerMap[COL.name]] || '').toString().trim(),
    flight: normalizeFlight(flightRaw),
    flightDisplay: (flightRaw || '').toString().trim(),
    date: normalizeDateValue(dateRaw),
    dateDisplay: formatDateDisplay(dateRaw),
    role: (row[headerMap[COL.role]] || '').toString().trim(),
    email: (row[emailColIdx] || '').toString().trim().toLowerCase(),
  };
}

// other.flight is already normalized (uppercase, alphanumeric only),
// which matches the IATA flight designator format (no space, e.g. "AI2028").
// Keeps the email's flight number consistent with how it's shown on the
// Sahayak cards (see formatFlightDisplay in sahayak/index.html).
function formatFlightDisplay(flight) {
  return (flight || '').toString();
}

function sendMatchEmail(recipient, other) {
  const otherRoleText = roleGroup(other.role) === 'offering' ? 'offering to help' : 'looking for help';
  const flightDisplay = formatFlightDisplay(other.flight);
  const subject = `✈️ Possible match on Sahayak — flight ${flightDisplay}`;
  const body =
`Namaste ${recipient.name || 'there'},

Good news — there's a possible match for your Sahayak listing!

Someone named ${other.name} also posted about flight ${flightDisplay} on ${other.dateDisplay}, and they're ${otherRoleText}.

Visit Sahayak and look for their listing (search by flight number ${flightDisplay}) to connect:
${PORTAL_URL}

— Maharashtra in Europe`;

  MailApp.sendEmail(recipient.email, subject, body);
}
