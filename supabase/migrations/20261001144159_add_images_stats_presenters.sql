-- Images registry, referenced by sections and presenters
create table
    public.images (
        id uuid primary key default gen_random_uuid (),
        name text not null,
        file_ref text not null,
        created_at timestamptz not null default now (),
        updated_at timestamptz not null default now ()
    );

create trigger images_set_updated_at before
update on public.images for each row execute function public.set_updated_at ();

alter table public.images enable row level security;

create policy "Public can read images" on public.images for
select
    to anon,
    authenticated using (true);

create policy "Admins can insert images" on public.images for insert to authenticated
with
    check (public.is_admin ());

create policy "Admins can update images" on public.images for
update to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

create policy "Admins can delete images" on public.images for delete to authenticated using (public.is_admin ());

-- Add the header image reference to sections (images didn't exist yet in the first migration)
alter table public.sections
add column image_id uuid references public.images (id) on delete set null;

-- Stat cards (days, years active, workshops, etc.)
create table
    public.stat_items (
        id uuid primary key default gen_random_uuid (),
        image uuid not null unique references public.images (id) on delete restrict,
        label text not null,
        value text not null,
        style text not null default 'primary' check (style in ('primary', 'secondary', 'tertiary')),
        section_id uuid not null references public.sections (id) on delete cascade,
        updated_at timestamptz not null default now ()
    );

create trigger stat_items_set_updated_at before
update on public.stat_items for each row execute function public.set_updated_at ();

alter table public.stat_items enable row level security;

create policy "Public can read stat items of published sections" on public.stat_items for
select
    to anon,
    authenticated using (
        public.is_admin ()
        or exists (
            select
                1
            from
                public.sections s
            where
                s.id = stat_items.section_id
                and s.is_published
        )
    );

create policy "Admins can insert stat items" on public.stat_items for insert to authenticated
with
    check (public.is_admin ());

create policy "Admins can update stat items" on public.stat_items for
update to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

create policy "Admins can delete stat items" on public.stat_items for delete to authenticated using (public.is_admin ());

-- Keynote / workshop presenters
create table
    public.presenters (
        id uuid primary key default gen_random_uuid (),
        image uuid not null unique references public.images (id) on delete restrict,
        name text not null,
        title text,
        location text,
        description text,
        link text,
        section_id uuid not null references public.sections (id) on delete restrict,
        updated_at timestamptz not null default now ()
    );

create trigger presenters_set_updated_at before
update on public.presenters for each row execute function public.set_updated_at ();

alter table public.presenters enable row level security;

create policy "Public can read presenters of published sections" on public.presenters for
select
    to anon,
    authenticated using (
        public.is_admin ()
        or exists (
            select
                1
            from
                public.sections s
            where
                s.id = presenters.section_id
                and s.is_published
        )
    );

create policy "Admins can insert presenters" on public.presenters for insert to authenticated
with
    check (public.is_admin ());

create policy "Admins can update presenters" on public.presenters for
update to authenticated using (public.is_admin ())
with
    check (public.is_admin ());

create policy "Admins can delete presenters" on public.presenters for delete to authenticated using (public.is_admin ());