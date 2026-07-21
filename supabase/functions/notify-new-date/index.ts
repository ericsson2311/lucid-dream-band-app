// Wird per Supabase Database Webhook bei INSERT auf public.dates aufgerufen.
import { notifyAll, checkSecret } from "../_shared/push.ts";

Deno.serve(async (req) => {
  if (!checkSecret(req)) return new Response("Unauthorized", { status: 401 });

  const payload = await req.json();
  const record = payload.record ?? payload;
  if (!record?.title) return new Response("ignored");

  await notifyAll(
    {
      title: "Neuer Termin",
      body: record.title,
      url: "/",
    },
    record.created_by ?? null
  );

  return new Response("ok");
});
