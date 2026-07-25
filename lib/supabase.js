import { createClient } from "@supabase/supabase-js";

// Fällt nur während des Next.js-Build-Schritts zurück (dort läuft dieses Modul
// einmal serverseitig, bevor die echten NEXT_PUBLIC_-Werte im Browser verfügbar sind).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Bei Uhr-Abweichung zwischen Gerät und Server lehnt Supabase Abfragen mit
// "JWT issued at future" ab – der Zugriffstoken sieht für den Server so aus, als
// wäre er in der Zukunft ausgestellt. Das blieb bisher hängen, bis die App neu
// gestartet wurde. Dieser Wrapper holt bei genau diesem Fehler einmalig einen
// frischen Token und wiederholt die Abfrage – für alle Aufrufe im ganzen Client.
const CLOCK_SKEW = /issued at future|issued in the future|token used before issued/i;

let refreshing = null;

async function fetchWithClockSkewRetry(input, init) {
  const url = typeof input === "string" ? input : input?.url || "";
  // Auth-Endpunkte (u.a. der Token-Refresh selbst) nicht umleiten – sonst Endlosschleife.
  if (url.includes("/auth/v1/")) return fetch(input, init);

  const res = await fetch(input, init);
  if (res.ok) return res;

  const body = await res.clone().text().catch(() => "");
  if (!CLOCK_SKEW.test(body)) return res;

  // Frischen Token holen (parallele Aufrufe teilen sich denselben Refresh).
  try {
    refreshing = refreshing || supabase.auth.refreshSession();
    const { data } = await refreshing;
    refreshing = null;
    const token = data?.session?.access_token;
    if (!token) return res;

    const headers = new Headers(init?.headers || {});
    if (!headers.has("Authorization")) return res;
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  } catch {
    refreshing = null;
    return res;
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: fetchWithClockSkewRetry },
});
