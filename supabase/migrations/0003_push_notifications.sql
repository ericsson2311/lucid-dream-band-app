-- Web-Push: Geräte-Abos, Ersteller-Tracking, Erinnerungs-Status für die Probe.
-- Im Supabase-Dashboard unter "SQL Editor" einmalig ausführen.

-- ── Push-Abos ───────────────────────────────────────────────────────────────
-- Ein Abo pro Gerät/Browser (endpoint ist dabei eindeutig).
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth_key   text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  to authenticated
  using (auth.uid() = user_id);

-- ── Ersteller-Tracking ──────────────────────────────────────────────────────
-- Damit die Benachrichtigungs-Funktion die Person, die den Termin/die Notiz
-- selbst angelegt hat, von der Benachrichtigung ausnehmen kann. Bestehende
-- Zeilen bleiben unangetastet (created_by = null), neue füllen sich automatisch.
alter table public.dates
  add column if not exists created_by uuid references auth.users (id) on delete set null default auth.uid();

alter table public.notes
  add column if not exists created_by uuid references auth.users (id) on delete set null default auth.uid();

-- ── Probe-Erinnerung ────────────────────────────────────────────────────────
-- Hält fest, für welches Probendatum zuletzt erinnert wurde, damit der
-- tägliche Cron-Job nicht mehrfach für dieselbe Probe benachrichtigt.
alter table public.next_rehearsal
  add column if not exists reminder_sent_for date;
