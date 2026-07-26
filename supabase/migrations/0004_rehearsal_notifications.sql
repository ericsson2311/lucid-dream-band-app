-- Ergänzt next_rehearsal um "wer hat zuletzt gespeichert", damit die
-- "Neue Probe"-Benachrichtigung die Person ausnehmen kann, die die Probe
-- selbst angelegt/geändert hat. rehearsal_attendance braucht keine neue
-- Spalte – dort ist user_id bereits die handelnde Person.
alter table public.next_rehearsal
  add column if not exists updated_by uuid references auth.users (id) on delete set null default auth.uid();
