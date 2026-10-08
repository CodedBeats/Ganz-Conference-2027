-- Stat items: most stats on the site have no image, some need nesting
-- (registration tiers -> price rows), extra copy, and an explicit order.
-- image stays unique; Postgres allows many NULLs in a unique column.
alter table public.stat_items
alter column image drop not null;

alter table public.stat_items
add column parent_id uuid references public.stat_items (id) on delete cascade,
add column description text,
add column sort_order integer not null default 0;

-- Presenters -> people: the same shape covers keynotes and committee members,
-- told apart by section_id and styled via `style`.
alter table public.presenters
rename to people;

alter trigger presenters_set_updated_at on public.people
rename to people_set_updated_at;

alter table public.people
rename constraint presenters_pkey to people_pkey;

alter table public.people
rename constraint presenters_image_key to people_image_key;

alter table public.people
rename constraint presenters_image_fkey to people_image_fkey;

alter table public.people
rename constraint presenters_section_id_fkey to people_section_id_fkey;

alter policy "Public can read presenters of published sections" on public.people
rename to "Public can read people of published sections";

alter policy "Admins can insert presenters" on public.people
rename to "Admins can insert people";

alter policy "Admins can update presenters" on public.people
rename to "Admins can update people";

alter policy "Admins can delete presenters" on public.people
rename to "Admins can delete people";

-- TBA keynotes and committee members without photos have no image yet
alter table public.people
alter column image drop not null;

alter table public.people
add column style text not null default 'primary' check (style in ('primary', 'secondary', 'tertiary')),
add column sort_order integer not null default 0;
