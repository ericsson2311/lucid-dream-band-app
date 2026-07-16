import { createClient } from "@supabase/supabase-js";

// Fällt nur während des Next.js-Build-Schritts zurück (dort läuft dieses Modul
// einmal serverseitig, bevor die echten NEXT_PUBLIC_-Werte im Browser verfügbar sind).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
);
