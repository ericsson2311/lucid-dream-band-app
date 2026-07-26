const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// "2026-07-28" -> "Di, 28.07.2026". Reine Kalenderrechnung aus Jahr/Monat/Tag,
// daher unabhängig von der Zeitzone, in der die Function gerade läuft.
export function formatDateWithWeekday(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];
  return `${weekday}, ${pad(day)}.${pad(month)}.${year}`;
}
