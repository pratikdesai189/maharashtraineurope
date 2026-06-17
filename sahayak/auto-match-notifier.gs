/**
 * Sahayak — Auto-Match Notifier
 * ------------------------------------------------------------
 * Lives in: Google Sheet (Form Responses) → Extensions → Apps Script
 *
 * Matching rules
 * ──────────────
 * 1. Need companion  ↔  Offer companion  →  same flight + same date (strict)
 * 2. Need companion  ↔  Offer carrier    →  same flight + same date (strict)
 *    (carrier is travelling anyway, can accompany)
 * 3. Need carrier    ↔  Offer carrier    →  same route + same month (flexible)
 * 4. Need carrier    ↔  Offer companion  →  same route + same month (flexible)
 *    (companion is travelling anyway, can carry a letter)
 *
 * Spam cap: max 3 match emails per new submission (earliest dates first).
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
 *     Confirm these keys exist:
 *        name, flight_number, travel_date, looking_for_or_offering,
 *        what_kind_of_help, city_in_europe, city_in_india, direction
 *     and that an "email" key exists too.
 *     If any key looks different, edit the COL constants below to match.
 *  6. Run the function `setupTrigger` once. This installs the trigger
 *     that fires on every new form submission.
 *  7. Test: submit two test entries via the form on the same route/month
 *     with opposite roles and a real email you can check.
 *
 * Emails are sent from YOUR Gmail account (the one that owns this script),
 * via Gmail's free MailApp service (100 emails/day limit).
 */

// ---- CONFIG ----------------------------------------------------------

const PORTAL_URL = 'https://maharashtraineurope.com/sahayak/';

const MAX_MATCHES_PER_SUBMISSION = 3;

// Normalized header names. Run logHeaders() to verify these match your sheet.
const COL = {
  name:       'name',
  flightNumber: 'flight_number',
  travelDate: 'travel_date',
  role:       'looking_for_or_offering', // "Looking for help" / "Offering to help"
  helpType:   'what_kind_of_help',       // "🧳 Travel companion, ✉️ Letter / Documents" etc.
  cityEurope: 'city_in_europe',
  cityIndia:  'city_in_india',
  direction:  'direction',               // "Europe to India" / "India to Europe"
};

const COMPANION_LABEL = '🧳 Travel companion';

// ---- MAIN TRIGGER ------------------------------------------------------

function onSahayakFormSubmit(e) {
  try {
    const sheet = e.range.getSheet();
    const data  = sheet.getDataRange().getValues();
    const headers = data[0];

    const headerMap = {};
    headers.forEach((h, i) => { headerMap[normalizeHeader(h)] = i; });

    const emailColIdx = findEmailColIndex(headerMap);
    if (emailColIdx === -1) {
      Logger.log('No email column found — enable "Collect email addresses" on the form.');
      return;
    }

    const newRowIdx = e.range.getRow() - 1; // 0-based index into data[]
    const newEntry  = extractEntry(data[newRowIdx], headerMap, emailColIdx);

    if (!roleGroup(newEntry.role) || !newEntry.email) return;

    // Collect all candidates, score by travel date (soonest first)
    const candidates = [];

    for (let i = 1; i < data.length; i++) {
      if (i === newRowIdx) continue;

      const existing = extractEntry(data[i], headerMap, emailColIdx);
      if (!roleGroup(existing.role) || !existing.email) continue;
      if (existing.email === newEntry.email) continue;

      const reason = matchReason(newEntry, existing);
      if (!reason) continue;

      candidates.push({ entry: existing, reason });
    }

    // Sort by travel date ascending (soonest need first), cap at MAX_MATCHES
    candidates.sort((a, b) => {
      const da = parseNormalizedDate(a.entry.date);
      const db = parseNormalizedDate(b.entry.date);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da - db;
    });

    const toNotify = candidates.slice(0, MAX_MATCHES_PER_SUBMISSION);

    toNotify.forEach(({ entry: existing, reason }) => {
      sendMatchEmail(existing, newEntry, reason);
      sendMatchEmail(newEntry, existing, reason);
    });

  } catch (err) {
    MailApp.sendEmail(
      Session.getActiveUser().getEmail(),
      'Sahayak auto-match script error',
      String(err) + '\n' + err.stack
    );
  }
}

// ---- MATCH LOGIC -------------------------------------------------------

/**
 * Returns a match reason string if the two entries should be connected,
 * or null if they don't match.
 *
 * Rules:
 *  Companion-side (one needs companion) → strict: same flight + same date
 *  Carrier-side   (one needs carrier)   → flexible: same route + same month
 */
function matchReason(a, b) {
  const aRole = roleGroup(a.role); // 'looking' | 'offering'
  const bRole = roleGroup(b.role);
  if (!aRole || !bRole || aRole === bRole) return null; // same role = no match

  const aLooking  = aRole === 'looking';
  const bLooking  = bRole === 'looking';

  const needsCompanion = aLooking ? a.isCompanion : b.isCompanion;
  const offersTravel   = aLooking
    ? (b.isCompanion || b.isCarrier)   // b is offering; companion or carrier both travel
    : (a.isCompanion || a.isCarrier);

  const needsCarrier   = aLooking ? a.isCarrier   : b.isCarrier;
  const offersTravel2  = offersTravel; // same check — offering companion or carrier

  // Companion-side: strict flight + date match
  if (needsCompanion && offersTravel) {
    if (a.flight && b.flight && a.flight === b.flight && a.date && a.date === b.date) {
      return 'companion';
    }
  }

  // Carrier-side: flexible route + month match
  if (needsCarrier && offersTravel2) {
    if (
      a.cityEurope && a.cityEurope === b.cityEurope &&
      a.cityIndia  && a.cityIndia  === b.cityIndia  &&
      a.direction  && a.direction  === b.direction   &&
      a.month      && a.month      === b.month
    ) {
      return 'carrier';
    }
  }

  return null;
}

// ---- ONE-TIME SETUP ----------------------------------------------------

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

// ---- HELPERS -----------------------------------------------------------

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

// Returns a Date object from a normalized yyyy-MM-dd string (for sorting)
function parseNormalizedDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

// Returns "yyyy-MM" for month-level matching
function monthOf(normalizedDate) {
  return normalizedDate ? normalizedDate.slice(0, 7) : '';
}

function formatDateDisplay(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'd MMM yyyy');
  }
  return (value || '').toString().trim();
}

function roleGroup(role) {
  const r = (role || '').toString().toLowerCase();
  if (r.indexOf('looking')  !== -1) return 'looking';
  if (r.indexOf('offering') !== -1) return 'offering';
  return '';
}

function helpItems(helpRaw) {
  return (helpRaw || '').toString().split(',').map(s => s.trim()).filter(Boolean);
}

function normalizeCity(value) {
  return (value || '').toString().trim().toLowerCase();
}

function normalizeDirection(value) {
  return (value || '').toString().trim().toLowerCase();
}

function extractEntry(row, headerMap, emailColIdx) {
  const flightRaw  = row[headerMap[COL.flightNumber]];
  const dateRaw    = row[headerMap[COL.travelDate]];
  const helpRaw    = headerMap[COL.helpType] !== undefined ? row[headerMap[COL.helpType]] : '';
  const items      = helpItems(helpRaw);
  const normalizedDate = normalizeDateValue(dateRaw);

  return {
    name:        (row[headerMap[COL.name]] || '').toString().trim(),
    flight:      normalizeFlight(flightRaw),
    flightDisplay: (flightRaw || '').toString().trim(),
    date:        normalizedDate,
    month:       monthOf(normalizedDate),
    dateDisplay: formatDateDisplay(dateRaw),
    role:        (row[headerMap[COL.role]] || '').toString().trim(),
    isCompanion: items.includes(COMPANION_LABEL),
    isCarrier:   items.some(i => i !== COMPANION_LABEL && i.length > 0),
    cityEurope:  normalizeCity(headerMap[COL.cityEurope]  !== undefined ? row[headerMap[COL.cityEurope]]  : ''),
    cityIndia:   normalizeCity(headerMap[COL.cityIndia]   !== undefined ? row[headerMap[COL.cityIndia]]   : ''),
    direction:   normalizeDirection(headerMap[COL.direction] !== undefined ? row[headerMap[COL.direction]] : ''),
    email:       (row[emailColIdx] || '').toString().trim().toLowerCase(),
  };
}

// ---- EMAIL -------------------------------------------------------------

function sendMatchEmail(recipient, other, reason) {
  const otherRoleText = roleGroup(other.role) === 'offering' ? 'offering to help' : 'looking for help';

  let matchContext;
  if (reason === 'companion') {
    matchContext =
      `They are ${otherRoleText} on flight ${other.flightDisplay || other.flight} on ${other.dateDisplay} — the same flight as your listing.`;
  } else {
    // carrier match — route + month
    const monthDisplay = other.month
      ? new Date(other.month + '-01').toLocaleString('en-GB', { month: 'long', year: 'numeric' })
      : other.dateDisplay;
    matchContext =
      `They are ${otherRoleText} on the same route in ${monthDisplay}.` +
      (other.flight ? ` Their flight: ${other.flightDisplay || other.flight}.` : '');
  }

  const subject = reason === 'companion'
    ? `✈️ Possible companion match on Sahayak — flight ${other.flightDisplay || other.flight}`
    : `📦 Possible carrier match on Sahayak — ${monthOf(other.date) ? new Date(other.month + '-01').toLocaleString('en-GB', { month: 'long', year: 'numeric' }) : other.dateDisplay}`;

  const body =
`Namaste ${recipient.name || 'there'},

Good news — there's a possible match for your Sahayak listing!

Someone named ${other.name} also posted on Sahayak. ${matchContext}

Visit Sahayak and look for their listing to connect:
${PORTAL_URL}

— Maharashtra in Europe`;

  MailApp.sendEmail(recipient.email, subject, body);
}
