-- Folders for the CMS file library. Plain metadata - storage paths stay flat, so moving
-- a file is just an update. Keep in sync with FILE_FOLDERS in src/lib/cms/files.ts.
alter table public.files
add column folder text not null default 'general' check (folder in ('keynotes', 'committee', 'misc', 'general'));

update public.files
set
    folder = 'keynotes'
where
    name like 'keynote-%';

-- The same photo can now be used in several places (e.g. a keynote who's also on the
-- committee). The foreign keys and their `on delete restrict` stay.
alter table public.people
drop constraint people_image_key;

alter table public.stat_items
drop constraint stat_items_image_key;