function pad(n) {
  return String(n).padStart(2, "0");
}

function escapeIcs(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// Lädt einen Termin als .ics-Datei herunter, damit er im Kalender landet.
export function downloadIcs(dateEntry) {
  const { id, title, event_date, event_time, location, address, notes } = dateEntry;
  const [year, month, day] = event_date.split("-").map(Number);
  const allDay = !event_time;
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(
    now.getUTCDate()
  )}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  let dtStartLine, dtEndLine;
  if (allDay) {
    const start = `${year}${pad(month)}${pad(day)}`;
    const endDate = new Date(year, month - 1, day + 1);
    const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}`;
    dtStartLine = `DTSTART;VALUE=DATE:${start}`;
    dtEndLine = `DTEND;VALUE=DATE:${end}`;
  } else {
    const [hour, minute] = event_time.split(":").map(Number);
    const start = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
    // Standarddauer von 3 Stunden, falls kein Ende angegeben ist
    const endDate = new Date(year, month - 1, day, hour + 3, minute);
    const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(
      endDate.getDate()
    )}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
    dtStartLine = `DTSTART:${start}`;
    dtEndLine = `DTEND:${end}`;
  }

  // Ort und Adresse landen gemeinsam im Kalender, damit die Navigation funktioniert
  const fullLocation = [location, address].filter(Boolean).join(", ");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bandverwaltung//DE",
    "BEGIN:VEVENT",
    `UID:${id}@bandverwaltung`,
    `DTSTAMP:${dtstamp}`,
    dtStartLine,
    dtEndLine,
    `SUMMARY:${escapeIcs(title)}`,
    ...(fullLocation ? [`LOCATION:${escapeIcs(fullLocation)}`] : []),
    ...(notes ? [`DESCRIPTION:${escapeIcs(notes)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]+/gi, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
