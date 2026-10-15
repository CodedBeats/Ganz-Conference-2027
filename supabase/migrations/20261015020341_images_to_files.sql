-- Images -> files: the registry now covers PDFs too, and file_ref points at an
-- object in the `files` Storage bucket (or a /public path for legacy rows).
alter table public.images
rename to files;

alter table public.files
rename constraint images_pkey to files_pkey;

alter trigger images_set_updated_at on public.files
rename to files_set_updated_at;

alter policy "Public can read images" on public.files
rename to "Public can read files";

alter policy "Admins can insert images" on public.files
rename to "Admins can insert files";

alter policy "Admins can update images" on public.files
rename to "Admins can update files";

alter policy "Admins can delete images" on public.files
rename to "Admins can delete files";

-- Lets the CMS tell images from PDFs without guessing from the path.
-- Keep in sync with FILE_MIME_TYPES in src/lib/cms/files.ts and the bucket below.
alter table public.files
add column mime_type text;

update public.files
set
    mime_type = case
        when file_ref ilike '%.png' then 'image/png'
        when file_ref ilike '%.jpg'
        or file_ref ilike '%.jpeg' then 'image/jpeg'
        when file_ref ilike '%.webp' then 'image/webp'
        when file_ref ilike '%.pdf' then 'application/pdf'
    end;

alter table public.files
alter column mime_type set not null,
add constraint files_mime_type_check check (
    mime_type in ('image/png', 'image/jpeg', 'image/webp', 'application/pdf')
),
add constraint files_file_ref_key unique (file_ref);

-- Section headers used to silently lose their image when the file was deleted.
-- Every reference now blocks the delete, matching people and stat items.
alter table public.sections
drop constraint sections_image_id_fkey;

alter table public.sections
add constraint sections_image_id_fkey foreign key (image_id) references public.files (id) on delete restrict;

-- Public bucket: objects are served by URL without auth. Storage enforces the
-- size and type limits itself, whatever the uploader claims.
insert into
    storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
    (
        'files',
        'files',
        true,
        20971520, -- 20MB, keep in sync with MAX_FILE_BYTES
        array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
    )
on conflict (id) do nothing;

-- Only admins can write. insert covers createSignedUploadUrl; select is needed
-- by info() and remove(). No update policy - uploads never overwrite.
create policy "Admins can upload files" on storage.objects for insert to authenticated
with
    check (
        bucket_id = 'files'
        and public.is_admin ()
    );

create policy "Admins can read file objects" on storage.objects for
select
    to authenticated using (
        bucket_id = 'files'
        and public.is_admin ()
    );

create policy "Admins can delete files" on storage.objects for delete to authenticated using (
    bucket_id = 'files'
    and public.is_admin ()
);