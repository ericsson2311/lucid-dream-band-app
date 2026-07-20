// Supabase Storage erlaubt keine Nicht-ASCII-Zeichen im Dateipfad
// (z.B. Umlaute) und lehnt solche Uploads mit "Invalid key" ab.
// Umlaute werden umgeschrieben, restliche Sonderzeichen entfernt.

const UMLAUTS = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  Ä: "Ae",
  Ö: "Oe",
  Ü: "Ue",
  ß: "ss",
};

export function sanitizeFileName(name) {
  const cleaned = name
    .replace(/[äöüÄÖÜß]/g, (c) => UMLAUTS[c])
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // übrige Akzente entfernen (é -> e)
    .replace(/[^\x20-\x7E]/g, "") // alles weitere Nicht-ASCII verwerfen
    .replace(/\s+/g, " ")
    .trim();
  // Bleibt nach dem Entfernen nur noch die Endung übrig, Namen ergänzen
  if (!cleaned || cleaned.startsWith(".")) return `datei${cleaned}`;
  return cleaned;
}
