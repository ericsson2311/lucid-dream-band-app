-- Wird ein Song umbenannt, soll der neue Name auch in der "Nächste Probe"-
-- Arbeitsliste ankommen (next_rehearsal.songs ist wie in Migration 0006 nur
-- eine Momentaufnahme aus id/title/source). Gespeicherte Setlists bleiben
-- bewusst unangetastet – die sind ein historisches Dokument, kein Arbeitsstand.
create or replace function public.sync_song_title_to_next_rehearsal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.title is distinct from old.title then
    update public.next_rehearsal
    set songs = coalesce(
      (
        select jsonb_agg(
          case
            when song->>'id' = new.id::text and song->>'source' = TG_TABLE_NAME
              then jsonb_set(song, '{title}', to_jsonb(new.title))
            else song
          end
        )
        from jsonb_array_elements(coalesce(songs, '[]'::jsonb)) as song
      ),
      '[]'::jsonb
    )
    where songs @> jsonb_build_array(jsonb_build_object('id', new.id::text, 'source', TG_TABLE_NAME));
  end if;
  return new;
end;
$$;

drop trigger if exists covers_sync_title_to_next_rehearsal on public.covers;
create trigger covers_sync_title_to_next_rehearsal
  after update on public.covers
  for each row
  execute function public.sync_song_title_to_next_rehearsal();

drop trigger if exists originals_sync_title_to_next_rehearsal on public.originals;
create trigger originals_sync_title_to_next_rehearsal
  after update on public.originals
  for each row
  execute function public.sync_song_title_to_next_rehearsal();
