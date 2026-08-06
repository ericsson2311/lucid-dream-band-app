-- 1) updated_by soll bei JEDER Änderung automatisch gesetzt werden. Ein
--    reiner Spalten-Default (aus Migration 0004) greift nur bei INSERT, nicht
--    beim UPDATE-Zweig eines Upserts – deshalb blieb updated_by bisher immer
--    NULL, obwohl jede Speicherung eigentlich ein UPDATE ist (die Proben-Zeile
--    hat immer dieselbe feste ID).
create or replace function public.set_next_rehearsal_updated_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists next_rehearsal_set_updated_by on public.next_rehearsal;
create trigger next_rehearsal_set_updated_by
  before insert or update on public.next_rehearsal
  for each row
  execute function public.set_next_rehearsal_updated_by();

-- 2) Zusagen sind an das Probendatum gekoppelt (rehearsal_attendance.rehearsal_date).
--    Ändert sich das Datum, sollen die Antworten zum ALTEN Datum verschwinden,
--    statt beim erneuten Verwenden dieses Datums unerwartet wieder aufzutauchen.
create or replace function public.clear_stale_rehearsal_attendance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rehearsal_date is distinct from old.rehearsal_date then
    delete from public.rehearsal_attendance where rehearsal_date = old.rehearsal_date;
  end if;
  return new;
end;
$$;

drop trigger if exists next_rehearsal_clear_stale_attendance on public.next_rehearsal;
create trigger next_rehearsal_clear_stale_attendance
  after update on public.next_rehearsal
  for each row
  execute function public.clear_stale_rehearsal_attendance();
