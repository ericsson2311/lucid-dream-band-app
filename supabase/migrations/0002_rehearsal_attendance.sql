-- Zu-/Absagen nur noch für die geplante Probe (nicht für allgemeine Termine).
-- Im Supabase-Dashboard unter "SQL Editor" einmalig ausführen.
--
-- Die Antworten sind an das Probendatum gekoppelt: Wird eine neue Probe mit
-- anderem Datum geplant, beginnt automatisch ein frischer Stand.

create table if not exists public.rehearsal_attendance (
  id             uuid primary key default gen_random_uuid(),
  rehearsal_date date not null,
  user_id        uuid not null references auth.users (id) on delete cascade,
  status         text not null check (status in ('yes', 'maybe', 'no')),
  updated_at     timestamptz not null default now(),
  unique (rehearsal_date, user_id)
);

alter table public.rehearsal_attendance enable row level security;

create policy "rehearsal_attendance_select_authenticated"
  on public.rehearsal_attendance for select
  to authenticated
  using (true);

create policy "rehearsal_attendance_insert_own"
  on public.rehearsal_attendance for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "rehearsal_attendance_update_own"
  on public.rehearsal_attendance for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "rehearsal_attendance_delete_own"
  on public.rehearsal_attendance for delete
  to authenticated
  using (auth.uid() = user_id);

-- Aufräumen: die in 0001 angelegte, jetzt ungenutzte Termin-Zusagen-Tabelle
-- entfernen. Löscht automatisch auch ihre Policies. Die profiles-Tabelle aus
-- 0001 bleibt bestehen (wird für die Anzeigenamen weiter gebraucht).
drop table if exists public.date_attendance;
