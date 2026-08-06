-- next_rehearsal.songs ist eine Momentaufnahme (jsonb-Array mit id/title/source),
-- keine echte Verknüpfung zu covers/originals. Wird ein Song gelöscht, blieb der
-- Eintrag bisher als "Geisterlied" in der Probe-Songliste stehen.

-- 1) Einmalige Aufräumaktion: bereits verwaiste Einträge (Song existiert nicht
--    mehr in covers/originals) sofort aus der aktuellen Probe entfernen.
update public.next_rehearsal
set songs = coalesce(
  (
    select jsonb_agg(song)
    from jsonb_array_elements(coalesce(songs, '[]'::jsonb)) as song
    where
      (song->>'source' = 'covers' and exists (
        select 1 from public.covers c where c.id::text = song->>'id'
      ))
      or
      (song->>'source' = 'originals' and exists (
        select 1 from public.originals o where o.id::text = song->>'id'
      ))
  ),
  '[]'::jsonb
);

-- 2) Ab jetzt automatisch: Song löschen -> gleicher Eintrag verschwindet auch
--    aus der Probe-Songliste, egal ob er aus covers oder originals gelöscht wird.
create or replace function public.remove_deleted_song_from_next_rehearsal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.next_rehearsal
  set songs = coalesce(
    (
      select jsonb_agg(song)
      from jsonb_array_elements(coalesce(songs, '[]'::jsonb)) as song
      where not (song->>'id' = old.id::text and song->>'source' = TG_TABLE_NAME)
    ),
    '[]'::jsonb
  )
  where songs @> jsonb_build_array(jsonb_build_object('id', old.id::text, 'source', TG_TABLE_NAME));
  return old;
end;
$$;

drop trigger if exists covers_remove_from_next_rehearsal on public.covers;
create trigger covers_remove_from_next_rehearsal
  after delete on public.covers
  for each row
  execute function public.remove_deleted_song_from_next_rehearsal();

drop trigger if exists originals_remove_from_next_rehearsal on public.originals;
create trigger originals_remove_from_next_rehearsal
  after delete on public.originals
  for each row
  execute function public.remove_deleted_song_from_next_rehearsal();
