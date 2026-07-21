// Gemeinsames Hilfsmodul für alle Push-Edge-Functions: verschickt eine
// Web-Push-Nachricht an alle (oder alle außer einer Person) registrierten
// Geräte und räumt abgelaufene Abos dabei automatisch auf.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// Schützt die Function davor, dass sie öffentlich von außen aufgerufen wird
// (Database Webhooks und der Cron-Job schicken diesen Header mit).
export function checkSecret(req: Request) {
  const expected = Deno.env.get("FUNCTIONS_SECRET");
  return Boolean(expected) && req.headers.get("x-webhook-secret") === expected;
}

export async function notifyAll(
  payload: { title: string; body: string; url?: string },
  excludeUserId?: string | null
) {
  const supabase = adminClient();
  let query = supabase.from("push_subscriptions").select("*");
  if (excludeUserId) query = query.neq("user_id", excludeUserId);
  const { data: subs, error } = await query;
  if (error) throw error;

  await Promise.all(
    (subs ?? []).map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth_key },
      };
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}
