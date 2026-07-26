// Wird per Supabase Database Webhook bei INSERT/UPDATE auf
// public.next_rehearsal aufgerufen. Benachrichtigt nur, wenn sich das
// Probendatum tatsächlich ändert (nicht bei jedem Speichern, z.B. wenn nur
// die Songliste angepasst wird).
import { notifyAll, checkSecret } from "../_shared/push.ts";
import { formatDateWithWeekday } from "../_shared/germanDate.ts";

Deno.serve(async (req) => {
  if (!checkSecret(req)) return new Response("Unauthorized", { status: 401 });

  const payload = await req.json();
  const record = payload.record;
  const oldRecord = payload.old_record;
  if (!record?.rehearsal_date) return new Response("no date set");

  const dateChanged =
    payload.type === "INSERT" || record.rehearsal_date !== oldRecord?.rehearsal_date;
  if (!dateChanged) return new Response("date unchanged, skipped");

  const when = formatDateWithWeekday(record.rehearsal_date);
  const body = record.rehearsal_time
    ? `${when}, ${record.rehearsal_time} Uhr. Bist du dabei?`
    : `${when}. Bist du dabei?`;

  await notifyAll({ title: "Neue Probe", body, url: "/" }, record.updated_by ?? null);

  return new Response("ok");
});
