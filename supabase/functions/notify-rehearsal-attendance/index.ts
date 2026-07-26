// Wird per Supabase Database Webhook bei INSERT/UPDATE auf
// public.rehearsal_attendance aufgerufen (also wenn jemand Ja/Vielleicht/Nein
// setzt oder ändert – nicht beim Zurückziehen einer Antwort, das ist ein
// DELETE und wird hier bewusst nicht separat gemeldet).
import { notifyAll, checkSecret, adminClient } from "../_shared/push.ts";

const STATUS_LABELS: Record<string, string> = {
  yes: "Ja",
  maybe: "Vielleicht",
  no: "Nein",
};

Deno.serve(async (req) => {
  if (!checkSecret(req)) return new Response("Unauthorized", { status: 401 });

  const payload = await req.json();
  const record = payload.record;
  if (!record?.user_id || !record?.status) return new Response("ignored");

  const supabase = adminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", record.user_id)
    .maybeSingle();
  const name = profile?.name ?? "Jemand";
  const label = STATUS_LABELS[record.status] ?? record.status;

  await notifyAll(
    { title: "Anwesenheit zur Probe", body: `${name}: ${label}`, url: "/" },
    record.user_id
  );

  return new Response("ok");
});
