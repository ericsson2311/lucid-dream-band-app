// Wird per Supabase Database Webhook bei INSERT auf public.notes aufgerufen.
import { notifyAll, checkSecret } from "../_shared/push.ts";

Deno.serve(async (req) => {
  if (!checkSecret(req)) return new Response("Unauthorized", { status: 401 });

  const payload = await req.json();
  const record = payload.record ?? payload;

  await notifyAll(
    {
      title: "Neue Notiz",
      body: record?.title || "Ohne Titel",
      url: "/",
    },
    record?.created_by ?? null
  );

  return new Response("ok");
});
