// server/src/utils/time.js
export function formatInTZ(date, tz) {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(d)
    .reduce((acc, p) => ((acc[p.type] = p.value), acc), {});
  return { y: Number(parts.year), m: Number(parts.month), d: Number(parts.day) };
}

export function isSameDayInTZ(aISO, bDate, tz) {
  if (!aISO) return false;
  const A = formatInTZ(aISO, tz);
  const B = formatInTZ(bDate, tz);
  return A.y === B.y && A.m === B.m && A.d === B.d;
}
