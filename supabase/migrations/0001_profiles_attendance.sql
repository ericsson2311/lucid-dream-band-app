-- Profile (Anzeigename pro Mitglied) und Zu-/Absagen pro Termin.
-- Im Supabase-Dashboard unter "SQL Editor" einmalig ausführen.

-- ── Profiles ────────────────────────────────────────────────────────────────
-- Ein Profil pro Auth-Nutzer, hält den frei wählbaren Anzeigenamen.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Alle eingeloggten Mitglieder dürfen alle Namen lesen (für die Anzeige).
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Jeder darf ausschließlich sein eigenes Profil anlegen bzw. ändern.
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── Zu-/Absagen ─────────────────────────────────────────────────────────────
-- Genau eine Antwort pro Termin und Mitglied (unique).
create table if not exists public.date_attendance (
  id         uuid primary key default gen_random_uuid(),
  date_id    uuid not null references public.dates (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  status     text not null check (status in ('yes', 'maybe', 'no')),
  updated_at timestamptz not null default now(),
  unique (date_id, user_id)
);

alter table public.date_attendance enable row level security;

-- Alle eingeloggten Mitglieder sehen alle Antworten.
create policy "attendance_select_authenticated"
  on public.date_attendance for select
  to authenticated
  using (true);

-- Jeder darf nur seine eigene Antwort setzen, ändern oder zurücknehmen.
create policy "attendance_insert_own"
  on public.date_attendance for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "attendance_update_own"
  on public.date_attendance for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "attendance_delete_own"
  on public.date_attendance for delete
  to authenticated
  using (auth.uid() = user_id);
