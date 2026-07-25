export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "–";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function parseDuration(value) {
  const match = value.match(/^(\d+):([0-5]?\d)$/);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  return minutes * 60 + seconds;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}

// Datum als lokales Mitternacht – so verrutscht der Tagesvergleich nicht durch
// Zeitzonen (ein "2026-07-25" ist hier immer der 25. Juli vor Ort).
function parseLocalDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

// z.B. "Sa, 15.08.2026" – der Wochentag ist bei Proben und Gigs die
// Information, die man zuerst sucht.
export function formatDateWithWeekday(isoDate) {
  return `${WEEKDAYS[parseLocalDate(isoDate).getDay()]}, ${formatDate(isoDate)}`;
}

// Umgangssprachlicher Abstand zu heute: "heute", "morgen", "in 3 Tagen",
// "vor 2 Wochen" …
export function relativeDay(isoDate) {
  const days = Math.round((parseLocalDate(isoDate) - parseLocalDate(todayIso())) / 86400000);

  if (days === 0) return "heute";
  if (days === 1) return "morgen";
  if (days === 2) return "übermorgen";
  if (days === -1) return "gestern";

  const distance = Math.abs(days);
  let count, unit;
  if (distance < 14) [count, unit] = [distance, ["Tag", "Tagen"]];
  else if (distance < 60) [count, unit] = [Math.round(distance / 7), ["Woche", "Wochen"]];
  else if (distance < 365) [count, unit] = [Math.round(distance / 30), ["Monat", "Monaten"]];
  else [count, unit] = [Math.round(distance / 365), ["Jahr", "Jahren"]];

  const label = `${count} ${count === 1 ? unit[0] : unit[1]}`;
  return days > 0 ? `in ${label}` : `vor ${label}`;
}

export function formatDateTime(isoTimestamp) {
  const d = new Date(isoTimestamp);
  const date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${date}, ${time} Uhr`;
}
