# Web-Push einrichten

Diese Schritte kann nur du ausführen (Login bei Supabase/Vercel). Reihenfolge einhalten.

## 0. Status

Dieses Setup wurde bereits einmal komplett durchgeführt (Migration, Functions, Secrets,
Webhooks, Cron, Vercel-Env-Var). Diese Datei dient als Referenz, falls z. B. Functions
neu deployt oder Secrets rotiert werden müssen.

**Geheimwerte** (`VAPID_PRIVATE_KEY`, `FUNCTIONS_SECRET`) stehen bewusst **nicht** in
dieser Datei — die liegen ausschließlich in den Supabase Edge Function Secrets
(Dashboard → Edge Functions → Secrets). Der `VAPID_PUBLIC_KEY` ist unkritisch (steckt
ohnehin im Browser-Code) und liegt in `.env.local` sowie in der Vercel-Umgebungsvariable
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`.

Falls die Secrets neu gesetzt werden müssen: neue Werte generieren
(`npx web-push generate-vapid-keys --json` für VAPID, `openssl rand -hex 24` für das
Webhook-Secret) und unten überall dort einsetzen, wo `<VAPID_PRIVATE_KEY>` bzw.
`<FUNCTIONS_SECRET>` steht — inklusive in den beiden Database-Webhook-Headern und der
Cron-Job-SQL (Schritt 3 und 4 müssten dann erneut ausgeführt werden).

## 1. Datenbank-Migration ausführen

Im Supabase-Dashboard → **SQL Editor** → Inhalt von `supabase/migrations/0003_push_notifications.sql` einfügen → **Run**.

## 2. Edge Functions deployen

Im Terminal, im Projektordner:

```bash
npx supabase login
npx supabase link --project-ref hcwvkxdxxiigrxrpvzjo

npx supabase functions deploy notify-new-date
npx supabase functions deploy notify-new-note
npx supabase functions deploy rehearsal-reminder

npx supabase secrets set \
  VAPID_PUBLIC_KEY=BO3i9zxQLkqCHwbpDkzkVMMJML3xfI0rPQpP4XWCEepdsUM8a1zyxlkVZaOhgxrZJTLSSWe2MAxtWhCZ_YGHWyM \
  VAPID_PRIVATE_KEY=<VAPID_PRIVATE_KEY> \
  VAPID_SUBJECT=mailto:eric.bernburg@t-online.de \
  FUNCTIONS_SECRET=<FUNCTIONS_SECRET>
```

`SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` setzt Supabase Edge Functions automatisch selbst — die musst du nicht angeben.

Nach dem Deploy findest du die Function-URLs im Dashboard unter **Edge Functions**, Format:
`https://hcwvkxdxxiigrxrpvzjo.supabase.co/functions/v1/<name>`

## 3. Database Webhooks einrichten (Benachrichtigung bei neuem Termin/Notiz)

Im Dashboard → **Database** → **Webhooks** → **Create a new webhook**, zweimal:

**Webhook 1 — neue Termine**
- Name: `notify-new-date`
- Table: `dates`
- Events: nur `Insert`
- Type: `HTTP Request`
- Method: `POST`
- URL: `https://hcwvkxdxxiigrxrpvzjo.supabase.co/functions/v1/notify-new-date`
- HTTP Headers hinzufügen: `x-webhook-secret` = `<FUNCTIONS_SECRET>`

**Webhook 2 — neue Notizen**
- Name: `notify-new-note`
- Table: `notes`
- Events: nur `Insert`
- URL: `https://hcwvkxdxxiigrxrpvzjo.supabase.co/functions/v1/notify-new-note`
- Gleicher `x-webhook-secret`-Header wie oben

## 4. Täglicher Cron-Job für die Probe-Erinnerung

Im Dashboard → **SQL Editor**, folgendes ausführen (schaltet die nötigen Extensions frei und legt den täglichen Job an, hier 18:00 Uhr UTC ≈ 19:00/20:00 Uhr deutscher Zeit — Uhrzeit nach Wunsch anpassen):

```sql
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'rehearsal-reminder-daily',
  '0 18 * * *',
  $$
  select net.http_post(
    url := 'https://hcwvkxdxxiigrxrpvzjo.supabase.co/functions/v1/rehearsal-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '<FUNCTIONS_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Falls `pg_cron`/`pg_net` in deinem Projekt nicht aktivierbar sind (manche Supabase-Pläne schränken das ein), alternativ: Dashboard → **Edge Functions** → `rehearsal-reminder` → **Schedule** (falls verfügbar) oder einen externen Cron-Dienst (z. B. cron-job.org) verwenden, der täglich einmal `POST` auf dieselbe URL mit demselben Header schickt.

## 5. Vercel: öffentlichen VAPID-Key eintragen

Im Vercel-Projekt → **Settings → Environment Variables**:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY = BO3i9zxQLkqCHwbpDkzkVMMJML3xfI0rPQpP4XWCEepdsUM8a1zyxlkVZaOhgxrZJTLSSWe2MAxtWhCZ_YGHWyM
```

(Der Public Key ist unkritisch, darf öffentlich sein — er steckt sowieso im Browser-Code.) Danach einmal neu deployen, damit der Wert im Build ankommt.

## 6. Testen

1. Seite neu laden, oben rechts auf deinen Profil-Namen klicken → unten "Auf diesem Gerät aktivieren" klicken → Browser-Erlaubnis bestätigen.
2. Von einem zweiten Account/Gerät aus einen Termin oder eine Notiz anlegen → Benachrichtigung sollte auf dem ersten Gerät erscheinen.
3. Für die Probe-Erinnerung: `rehearsal_date` in `next_rehearsal` testweise auf "morgen" setzen und die Function manuell aufrufen:

```bash
curl -X POST https://hcwvkxdxxiigrxrpvzjo.supabase.co/functions/v1/rehearsal-reminder \
  -H "x-webhook-secret: <FUNCTIONS_SECRET>"
```
