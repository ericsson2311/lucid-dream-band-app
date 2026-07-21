// Wird täglich per Cron aufgerufen (siehe supabase/PUSH_SETUP.md) und
// erinnert alle Mitglieder, wenn die geplante Probe morgen stattfindet.
import { notifyAll, checkSecret, adminClient } from "../_shared/push.ts";

const REHEARSAL_ID = "00000000-0000-0000-0000-000000000001";

function tomorrowInBerlin(now: Date) {
  const todayBerlin = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // YYYY-MM-DD
  const tomorrow = new Date(`${todayBerlin}T00:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (!checkSecret(req)) return new Response("Unauthorized", { status: 401 });

  const supabase = adminClient();
  const { data: rehearsal, error } = await supabase
    .from("next_rehearsal")
    .select("*")
    .eq("id", REHEARSAL_ID)
    .maybeSingle();
  if (error || !rehearsal?.rehearsal_date) return new Response("no rehearsal planned");

  const tomorrow = tomorrowInBerlin(new Date());
  if (rehearsal.rehearsal_date !== tomorrow) return new Response("not tomorrow");
  if (rehearsal.reminder_sent_for === rehearsal.rehearsal_date) {
    return new Response("reminder already sent");
  }

  await notifyAll({
    title: "Probe morgen",
    body: rehearsal.rehearsal_time
      ? `Erinnerung: Probe morgen um ${rehearsal.rehearsal_time} Uhr.`
      : "Erinnerung: Morgen ist Probe.",
    url: "/",
  });

  await supabase
    .from("next_rehearsal")
    .update({ reminder_sent_for: rehearsal.rehearsal_date })
    .eq("id", REHEARSAL_ID);

  return new Response("reminder sent");
});
