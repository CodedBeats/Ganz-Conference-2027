-- Phase 2: ticket prices and registration settings.
-- Prices live here so the admin dashboard is the single source of what a ticket costs.
-- The closed sets are Postgres enums so the generated types are literal unions, and
-- src/lib/registration/options.ts mirrors them (tests/registration-enums.test.ts checks drift).

create type public.ticket_option as enum ('conference_only', 'conference_workshop');
create type public.audience as enum ('member', 'non_member');
create type public.price_tier as enum ('early_bird', 'full');

-- One row per (option, audience, tier): exactly 8 rows, seeded below.
-- Money is always integer cents; the amount is the final charged total (no GST columns yet).
create table public.ticket_prices (
  id            uuid primary key default gen_random_uuid(),
  ticket_option public.ticket_option not null,
  audience      public.audience not null,
  tier          public.price_tier not null,
  amount_cents  integer not null check (amount_cents > 0),
  currency      text not null default 'AUD' check (currency = 'AUD'),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (ticket_option, audience, tier)
);

create trigger ticket_prices_set_updated_at
  before update on public.ticket_prices
  for each row execute function public.set_updated_at();

-- Single-row settings table: the boolean primary key can only ever be true.
create table public.registration_settings (
  id                   boolean primary key default true check (id),
  -- The Early Bird -> Full switch is manual, done by GANZ in the admin dashboard
  current_tier         public.price_tier not null default 'early_bird',
  -- Informational only (shown to people, and an admin nudge); it never decides the price
  early_bird_closes_on date,
  -- Total places on conference + workshop across all four of its prices.
  -- Changed only by a migration, never from the dashboard (see the column grants below).
  workshop_capacity    integer not null check (workshop_capacity >= 0),
  updated_at           timestamptz not null default now()
);

create trigger registration_settings_set_updated_at
  before update on public.registration_settings
  for each row execute function public.set_updated_at();

-- RLS: public read (the ticket cards and the form need both), admin-only update.
-- No insert or delete policies, so the 8 prices and the 1 settings row are fixed.
alter table public.ticket_prices enable row level security;
alter table public.registration_settings enable row level security;

create policy "Public can read ticket prices"
  on public.ticket_prices for select
  to anon, authenticated
  using (true);

create policy "Admins can update ticket prices"
  on public.ticket_prices for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can read registration settings"
  on public.registration_settings for select
  to anon, authenticated
  using (true);

create policy "Admins can update registration settings"
  on public.registration_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Column grants decide *what* an admin may change: amounts and the active flag on prices,
-- the tier switch and the informational date on settings. The price keys and the capacity
-- stay fixed even for an admin.
revoke insert, update, delete, truncate on public.ticket_prices from anon, authenticated;
revoke insert, update, delete, truncate on public.registration_settings from anon, authenticated;
grant update (amount_cents, is_active) on public.ticket_prices to authenticated;
grant update (current_tier, early_bird_closes_on) on public.registration_settings to authenticated;

-- Seeded here rather than in seed.sql, which only runs locally - production needs these rows.
-- Final prices from Michelle, 23 Oct.
insert into public.ticket_prices (ticket_option, audience, tier, amount_cents) values
  ('conference_only',     'member',     'early_bird',  48500),
  ('conference_only',     'member',     'full',        58500),
  ('conference_workshop', 'member',     'early_bird', 108500),
  ('conference_workshop', 'member',     'full',       118500),
  ('conference_only',     'non_member', 'early_bird',  63500),
  ('conference_only',     'non_member', 'full',        73500),
  ('conference_workshop', 'non_member', 'early_bird', 123500),
  ('conference_workshop', 'non_member', 'full',       133500);

-- Early Bird closes Friday 5 March 2027 (Michelle). 27 = venue's 30 minus 3 held for the organisers.
insert into public.registration_settings (current_tier, early_bird_closes_on, workshop_capacity)
values ('early_bird', '2027-03-05', 27);