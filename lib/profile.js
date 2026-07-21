import { supabase } from "@/lib/supabase";

// Leitet einen lesbaren Standardnamen aus der E-Mail ab:
// "eric.bernburg@…" -> "Eric Bernburg"
export function defaultNameFromEmail(email) {
  const local = (email || "").split("@")[0];
  if (!local) return "Mitglied";
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "Mitglied"
  );
}

// Stellt sicher, dass für den aktuellen Nutzer ein Profil existiert, und gibt es
// zurück. Beim ersten Aufruf wird ein Profil mit aus der E-Mail abgeleitetem
// Namen angelegt.
export async function ensureProfile(user) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const name = defaultNameFromEmail(user.email);
  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: user.id, name })
    .select()
    .single();
  if (insertError) throw insertError;
  return created;
}
