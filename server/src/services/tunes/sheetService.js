// server/src/services/tunes/sheetService.js
import { parse as csvParse } from "csv-parse/sync";
import { fetchWithTimeout } from "../../utils/fetchWithTimeout.js";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRoMIis2XZig04Jfxh764tdQ4XiZcuM_I3FP8ViiCo2OsWL763BKPfQzg6MzrUnS1jwis2_GaTIbSb8/pub?gid=0&single=true&output=csv";

let sheetCache = { events: [], ts: 0 };
const SHEET_TTL_MS = 15 * 60 * 1000;

const MONTHS = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function stripWeekdayPrefix(s = "") {
  const raw = (s || "").toString().trim();

  let out = raw.replace(
    /^\s*(?:mon|monday|tue|tues|tuesday|wed|weds|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday|sun|sunday|sday)\s*[:;,]?\s*/i,
    ""
  );

  if (/sday\s*[:;,]/i.test(out)) {
    out = out.split(/[:;,]/).slice(1).join(":").trim();
  }
  return out.trim();
}

function tzOffsetMinutes(tz, date) {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
      timeZoneName: "shortOffset",
    });

    const parts = fmt.formatToParts(date);
    const tzName = parts.find((p) => p.type === "timeZoneName")?.value || "";

    let m =
      tzName.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/i) ||
      tzName.match(/UTC([+-]\d{1,2})(?::(\d{2}))?/i);

    if (m) {
      const sign = m[1].startsWith("-") ? -1 : 1;
      const h = Math.abs(parseInt(m[1], 10)) || 0;
      const mm = m[2] ? parseInt(m[2], 10) : 0;
      return (h * 60 + mm) * sign * -1;
    }

    const fmt2 = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" });
    const name2 = fmt2.formatToParts(date).find((p) => p.type === "timeZoneName")?.value || "";

    if (/CDT/i.test(name2)) return 300;
    if (/CST/i.test(name2)) return 360;
  } catch {}

  return 360;
}

function chicagoNoonISO(y, m, d) {
  const guess = new Date(Date.UTC(y, m - 1, d, 18, 0, 0));
  const offMin = tzOffsetMinutes("America/Chicago", guess);
  const utcMs = Date.UTC(y, m - 1, d, 12, 0, 0) + offMin * 60 * 1000;
  return new Date(utcMs).toISOString();
}

function parseSheetDate(dateStr) {
  const raw = (dateStr || "").toString().trim().replace(/\u00A0/g, " ");
  if (/^date$/i.test(raw)) return null;

  const s = stripWeekdayPrefix(raw);

  let m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (m) {
    let y = parseInt(m[3], 10);
    if (y < 100) y += 2000;
    return { y, m: parseInt(m[1], 10), d: parseInt(m[2], 10) };
  }

  m = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (m) return { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) };

  m = s.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+(\d{1,2})(?:,)?\s+(\d{4})/i
  );
  if (m) {
    const mm = MONTHS[m[1].toLowerCase().replace(/\.$/, "")];
    return { y: parseInt(m[3], 10), m: mm, d: parseInt(m[2], 10) };
  }

  m = s.match(/^([^@]+?)\s+\d{1,2}:\d{2}\s*(AM|PM)?/i);
  if (m) return parseSheetDate(m[1]);

  const dt = new Date(s);
  if (!isNaN(dt.getTime())) {
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
  }

  console.warn("[sheet] Unrecognized date format:", s);
  return null;
}

export async function fetchTunesAtNoonEvents() {
  const now = Date.now();
  const age = now - (sheetCache.ts || 0);
  if (sheetCache.events.length && age < SHEET_TTL_MS) return sheetCache.events;

  try {
    const r = await fetchWithTimeout(SHEET_CSV_URL, { headers: { Accept: "text/csv" } }, 12000);
    const text = await r.text();

    const rows = csvParse(text, { skip_empty_lines: true, relax_column_count: true });

    const out = [];
    for (const row of rows) {
      const [dateRaw, artistRaw] = row;
      const dateStr = (dateRaw || "").toString().trim();
      const artistSheet = (artistRaw || "").toString().trim();
      if (!dateStr || !artistSheet) continue;

      const pd = parseSheetDate(dateStr);
      if (!pd) continue;

      const artistClean = stripWeekdayPrefix(artistSheet);
      if (!artistClean) continue;

      const startsAt = chicagoNoonISO(pd.y, pd.m, pd.d);

      out.push({
        id: `tunes-noon:${startsAt}`,
        title: "Tunes @ Noon",
        startsAt,
        location: "The Church Studio",
        description: `Artist: ${artistClean}`,
        tunesArtist: artistClean,
        _eventId: null,
        _source: "sheet",
      });
    }

    sheetCache = { events: out, ts: now };
    return out;
  } catch (e) {
    console.warn("[spreadsheet] fetch failed:", e?.message || e);
    return sheetCache.events || [];
  }
}
