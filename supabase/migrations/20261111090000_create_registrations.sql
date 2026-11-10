-- Phase 2: registrations and everything that records what happened to them.
--
-- Locked down by default: RLS on every table, no anon access at all, and no INSERT/UPDATE/DELETE
-- for anon or authenticated. Writes come from server code with the secret key (checkout, the
-- Stripe webhook) or, for admin actions, from security definer functions added by later cards
-- that check is_admin() themselves - a raw UPDATE would let a status skip the state machine
-- (src/lib/registration/status.ts) and skip the audit log. Admins can read everything.
--
-- Every closed set is an enum mirrored by a tuple in src/lib/registration/ (drift is tested).
-- Text length limits mirror FIELD_LIMITS in src/lib/registration/schema.ts.

-- Closed sets ---------------------------------------------------------------------------------

create type public.membership_choice as enum ('current_member', 'joining_member', 'non_member');

-- 'paid' is deliberately not a status: payment moves pending_payment straight to confirmed or
-- awaiting_verification in one transaction, and "has paid" is the fact paid_at is not null.
create type public.registration_status as enum (
  'pending_payment',
  'confirmed',
  'awaiting_verification',
  'approved',
  'rejected',
  'refunded',
  'abandoned',
  'cancelled'
);

create type public.dietary_requirement as enum ('none', 'vegetarian', 'vegan', 'gluten_free', 'other');

create type public.gestalt_connection as enum (
  'gestalt_practitioner',
  'gestalt_student',
  'educator_supervisor',
  'researcher_academic',
  'interested_not_practising',
  'other_mental_health_professional',
  'other'
);

create type public.heard_about as enum ('ganz_newsletter', 'social_media', 'colleague_friend', 'training_institute', 'other');

create type public.audit_actor as enum ('admin', 'system', 'stripe_webhook');

create type public.audit_action as enum (
  'registration_created',
  'payment_received',
  'checkout_abandoned',
  'membership_approved',
  'membership_rejected',
  'refund_recorded',
  'partial_refund_recorded',
  'registration_cancelled',
  'attendee_details_corrected'
);

create type public.stripe_event_outcome as enum ('processed', 'ignored', 'needs_review', 'error');

create type public.email_template as enum (
  'non_member_confirmation',
  'member_payment_received',
  'membership_approved',
  'membership_not_verified',
  'refund_processed',
  'admin_new_registration_alert'
);

create type public.email_status as enum ('queued', 'sent', 'failed');

create type public.email_trigger as enum ('automatic', 'manual');

-- Helpers -------------------------------------------------------------------------------------

-- Both member choices pay the member price; the audience is never entered separately.
-- Mirrors audienceFor() in src/lib/registration/options.ts.
create function public.audience_for(choice public.membership_choice)
returns public.audience
language sql
immutable
set search_path = ''
as $$
  select case choice when 'non_member' then 'non_member'::public.audience else 'member'::public.audience end;
$$;

-- True when an array has no repeated values (used by the dietary check).
create function public.array_is_distinct(values_ anyarray)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(values_) = (select count(distinct value_) from unnest(values_) as value_);
$$;

-- registrations -------------------------------------------------------------------------------

-- One attendee per registration. Guest checkout, no accounts.
create table public.registrations (
  id                          uuid primary key default gen_random_uuid(),
  -- Unguessable reference for the success/cancelled pages, separate from the primary key
  public_ref                  text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  status                      public.registration_status not null default 'pending_payment',

  membership_choice           public.membership_choice not null,
  audience                    public.audience not null generated always as (public.audience_for(membership_choice)) stored,
  ticket_option               public.ticket_option not null,
  tier                        public.price_tier not null,
  -- Snapshot of the price at creation, so later admin price edits never change this registration
  price_cents                 integer not null check (price_cents > 0),
  currency                    text not null default 'AUD' check (currency = 'AUD'),

  full_name                   text not null check (full_name = btrim(full_name) and length(full_name) between 1 and 200),
  pronouns                    text check (pronouns <> '' and length(pronouns) <= 50),
  email                       text not null check (email = lower(btrim(email)) and length(email) <= 254 and email like '%_@_%'),
  phone                       text check (phone <> '' and length(phone) <= 40),
  connection_to_gestalt       public.gestalt_connection,
  heard_about                 public.heard_about,

  -- The name and email the person used to join GANZ (members only)
  membership_name             text check (membership_name = btrim(membership_name) and length(membership_name) between 1 and 200),
  membership_email            text check (membership_email = lower(btrim(membership_email)) and length(membership_email) <= 254 and membership_email like '%_@_%'),

  -- Which version of the (CMS-editable) policy text was accepted
  policy_version              text not null check (length(policy_version) between 1 and 100),
  policy_text_sha256          text not null check (policy_text_sha256 ~ '^[0-9a-f]{64}$'),
  policy_accepted_at          timestamptz not null default now(),

  stripe_checkout_session_id  text unique,
  checkout_expires_at         timestamptz not null,
  stripe_payment_intent_id    text unique,
  amount_paid_cents           integer check (amount_paid_cents > 0),
  paid_at                     timestamptz,
  refunded_amount_cents       integer not null default 0,
  refunded_at                 timestamptz,

  membership_decided_at       timestamptz,
  membership_decided_by       uuid,
  cancelled_at                timestamptz,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  -- Members carry the verification name and email; non-members never do
  constraint registrations_membership_fields check (
    case when membership_choice = 'non_member'
      then membership_name is null and membership_email is null
      else membership_name is not null and membership_email is not null
    end
  ),
  -- The payment facts are recorded together or not at all...
  constraint registrations_payment_facts check (
    (stripe_payment_intent_id is null) = (paid_at is null) and (paid_at is null) = (amount_paid_cents is null)
  ),
  -- ...and exactly the statuses after payment have them
  constraint registrations_paid_status check ((status in ('pending_payment', 'abandoned')) = (paid_at is null)),
  constraint registrations_refund_amount check (
    refunded_amount_cents >= 0
    and refunded_amount_cents <= coalesce(amount_paid_cents, 0)
    and (refunded_amount_cents = 0) = (refunded_at is null)
  ),
  constraint registrations_refunded_status check (status <> 'refunded' or refunded_amount_cents > 0),
  constraint registrations_membership_decision check (
    (membership_decided_at is null) = (membership_decided_by is null)
    and (status not in ('approved', 'rejected') or membership_decided_at is not null)
  ),
  constraint registrations_cancelled_status check (status <> 'cancelled' or cancelled_at is not null),
  -- Only members go through verification; only non-members are confirmed straight away
  constraint registrations_status_matches_membership check (
    case when membership_choice = 'non_member'
      then status not in ('awaiting_verification', 'approved', 'rejected')
      else status <> 'confirmed'
    end
  )
);

create index registrations_status_idx on public.registrations (status);
create index registrations_email_idx on public.registrations (email);
create index registrations_ticket_option_status_idx on public.registrations (ticket_option, status);

create trigger registrations_set_updated_at
  before update on public.registrations
  for each row execute function public.set_updated_at();

-- registration_private_details ------------------------------------------------------------------

-- The sensitive answers, kept apart so list queries can't select them by accident and so the
-- post-conference retention step is a single delete. Dietary and access answers can reveal health
-- information.
create table public.registration_private_details (
  registration_id      uuid primary key references public.registrations (id) on delete cascade,
  dietary              public.dietary_requirement[] not null check (
    cardinality(dietary) >= 1
    and array_position(dietary, null) is null
    and public.array_is_distinct(dietary)
    -- 'none' can't be combined with anything else
    and (not ('none' = any (dietary)) or cardinality(dietary) = 1)
  ),
  dietary_details      text check (dietary_details <> '' and length(dietary_details) <= 2000),
  access_requirements  text check (access_requirements <> '' and length(access_requirements) <= 4000),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger registration_private_details_set_updated_at
  before update on public.registration_private_details
  for each row execute function public.set_updated_at();

-- stripe_events -------------------------------------------------------------------------------

-- One row per webhook delivery we've seen; the Stripe event id is the idempotency key.
-- No payloads are stored, ever: the shared Stripe account also sends events for unrelated
-- (WooCommerce) payments, and Stripe keeps payloads for debugging anyway. Ignored events keep only
-- id, type, created, livemode and outcome.
create table public.stripe_events (
  id                 text primary key check (id ~ '^evt_'),
  type               text not null,
  stripe_created_at  timestamptz not null,
  livemode           boolean not null,
  outcome            public.stripe_event_outcome not null,
  registration_id    uuid references public.registrations (id) on delete set null,
  -- Our object id (cs_/ch_...), only for events that concern a registration
  object_id          text,
  -- A machine-readable reason, e.g. 'amount_mismatch'. Never personal data.
  detail             text check (length(detail) <= 100),
  attempts           integer not null default 1 check (attempts >= 1),
  received_at        timestamptz not null default now(),
  processed_at       timestamptz
);

create index stripe_events_registration_idx on public.stripe_events (registration_id);
create index stripe_events_needs_review_idx on public.stripe_events (outcome) where outcome in ('needs_review', 'error');

-- registration_audit_log ------------------------------------------------------------------------

-- Append-only history: who did what, when, with the changed values before and after.
-- before/after only ever hold the allowlisted fields in src/lib/registration/audit.ts; a change
-- to a private detail is recorded with its values replaced by '[redacted]'.
create table public.registration_audit_log (
  id               bigint generated always as identity primary key,
  registration_id  uuid not null references public.registrations (id) on delete cascade,
  actor            public.audit_actor not null,
  -- No foreign key, so the history survives an admin account being removed
  actor_user_id    uuid,
  action           public.audit_action not null,
  from_status      public.registration_status,
  to_status        public.registration_status,
  before           jsonb not null default '{}',
  after            jsonb not null default '{}',
  stripe_event_id  text references public.stripe_events (id),
  created_at       timestamptz not null default now(),
  constraint registration_audit_log_admin_user check ((actor = 'admin') = (actor_user_id is not null))
);

create index registration_audit_log_registration_idx on public.registration_audit_log (registration_id, created_at);

-- email_log -----------------------------------------------------------------------------------

-- Every email we send or try to send. The unique idempotency key stops a replayed webhook from
-- queueing an automatic email twice, and is also sent to Resend as its Idempotency-Key.
-- See src/lib/registration/emails.ts for the key formats.
create table public.email_log (
  id                 uuid primary key default gen_random_uuid(),
  registration_id    uuid not null references public.registrations (id) on delete cascade,
  template           public.email_template not null,
  trigger            public.email_trigger not null,
  idempotency_key    text not null unique check (length(idempotency_key) <= 256),
  to_address         text not null,
  status             public.email_status not null default 'queued',
  attempts           integer not null default 0 check (attempts >= 0),
  -- Resend's error code and HTTP status only
  last_error         text check (length(last_error) <= 200),
  resend_message_id  text,
  -- The admin who asked for a manual resend
  requested_by       uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  sent_at            timestamptz,
  constraint email_log_manual_requester check ((trigger = 'manual') = (requested_by is not null)),
  constraint email_log_sent_at check ((status = 'sent') = (sent_at is not null))
);

create index email_log_registration_idx on public.email_log (registration_id);
create index email_log_unsent_idx on public.email_log (status) where status <> 'sent';

create trigger email_log_set_updated_at
  before update on public.email_log
  for each row execute function public.set_updated_at();

-- RLS and grants ------------------------------------------------------------------------------

alter table public.registrations enable row level security;
alter table public.registration_private_details enable row level security;
alter table public.stripe_events enable row level security;
alter table public.registration_audit_log enable row level security;
alter table public.email_log enable row level security;

-- Grants first: anon gets nothing at all, authenticated can only select (and RLS narrows that to admins)
revoke all on public.registrations, public.registration_private_details, public.stripe_events,
  public.registration_audit_log, public.email_log from anon;
revoke insert, update, delete, truncate on public.registrations, public.registration_private_details,
  public.stripe_events, public.registration_audit_log, public.email_log from authenticated;

create policy "Admins can read registrations"
  on public.registrations for select
  to authenticated
  using (public.is_admin());

create policy "Admins can read registration private details"
  on public.registration_private_details for select
  to authenticated
  using (public.is_admin());

create policy "Admins can read stripe events"
  on public.stripe_events for select
  to authenticated
  using (public.is_admin());

create policy "Admins can read the registration audit log"
  on public.registration_audit_log for select
  to authenticated
  using (public.is_admin());

create policy "Admins can read the email log"
  on public.email_log for select
  to authenticated
  using (public.is_admin());

-- Capacity ------------------------------------------------------------------------------------

-- The one counting rule for workshop places; enforcement and the public "places left" both use it.
-- A pending registration holds its place until its Checkout Session expires plus a grace period,
-- so a payment completing right at expiry can't find its place already re-sold. The expired webhook
-- moves it to 'abandoned', which releases the place straight away.
-- Mirrors HOLDS_PLACE and CHECKOUT_HOLD_GRACE_MINUTES in src/lib/registration/.
create function public.registration_holds_place(status public.registration_status, checkout_expires_at timestamptz)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when status in ('confirmed', 'awaiting_verification', 'approved') then true
    when status = 'pending_payment' then checkout_expires_at + interval '15 minutes' > now()
    else false
  end;
$$;

-- Places left on conference + workshop, for the public ticket cards and the form.
-- Security definer so anon gets the count without being able to read any registration.
create function public.workshop_places_left()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(
    settings.workshop_capacity - (
      select count(*)::integer
      from public.registrations as registration
      where registration.ticket_option = 'conference_workshop'
        and public.registration_holds_place(registration.status, registration.checkout_expires_at)
    ),
    0
  )
  from public.registration_settings as settings;
$$;

-- Creates a pending registration, deciding the tier, the price snapshot and capacity in one
-- transaction. Called by server code with the secret key only (P2-15).
--
-- Locking the single settings row serialises every creation, so two people can't both take the
-- last workshop place. Raises 'tier_changed' if the tier the form showed is no longer current,
-- 'price_unavailable' if the price row is missing or inactive, and 'sold_out' at the workshop cap.
-- The Checkout Session must be created with expires_at = the returned checkout_expires_at
-- (35 minutes leaves room for Stripe's 30-minute minimum). See CreatePendingRegistrationError.
create function public.create_pending_registration(
  p_membership_choice      public.membership_choice,
  p_ticket_option          public.ticket_option,
  p_quoted_tier            public.price_tier,
  p_full_name              text,
  p_email                  text,
  p_dietary                public.dietary_requirement[],
  p_policy_version         text,
  p_policy_text_sha256     text,
  p_pronouns               text default null,
  p_phone                  text default null,
  p_connection_to_gestalt  public.gestalt_connection default null,
  p_heard_about            public.heard_about default null,
  p_membership_name        text default null,
  p_membership_email       text default null,
  p_dietary_details        text default null,
  p_access_requirements    text default null
)
returns table (
  registration_id      uuid,
  public_ref           text,
  price_cents          integer,
  tier                 public.price_tier,
  checkout_expires_at  timestamptz
)
language plpgsql
volatile
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_settings      public.registration_settings;
  v_price         public.ticket_prices;
  v_places_taken  integer;
  v_registration  public.registrations;
begin
  select * into v_settings from public.registration_settings as settings where settings.id for update;

  if v_settings.current_tier <> p_quoted_tier then
    raise exception 'tier_changed' using errcode = 'P0001';
  end if;

  select * into v_price
  from public.ticket_prices as price
  where price.ticket_option = p_ticket_option
    and price.audience = public.audience_for(p_membership_choice)
    and price.tier = v_settings.current_tier;

  if not found or not v_price.is_active then
    raise exception 'price_unavailable' using errcode = 'P0001';
  end if;

  if p_ticket_option = 'conference_workshop' then
    select count(*)::integer into v_places_taken
    from public.registrations as registration
    where registration.ticket_option = 'conference_workshop'
      and public.registration_holds_place(registration.status, registration.checkout_expires_at);

    if v_places_taken >= v_settings.workshop_capacity then
      raise exception 'sold_out' using errcode = 'P0001';
    end if;
  end if;

  insert into public.registrations (
    membership_choice, ticket_option, tier, price_cents,
    full_name, pronouns, email, phone, connection_to_gestalt, heard_about,
    membership_name, membership_email,
    policy_version, policy_text_sha256, checkout_expires_at
  ) values (
    p_membership_choice, p_ticket_option, v_settings.current_tier, v_price.amount_cents,
    p_full_name, p_pronouns, lower(btrim(p_email)), p_phone, p_connection_to_gestalt, p_heard_about,
    p_membership_name, lower(btrim(p_membership_email)),
    p_policy_version, p_policy_text_sha256, now() + interval '35 minutes'
  )
  returning * into v_registration;

  insert into public.registration_private_details (registration_id, dietary, dietary_details, access_requirements)
  values (v_registration.id, p_dietary, p_dietary_details, p_access_requirements);

  insert into public.registration_audit_log (registration_id, actor, action, to_status, after)
  values (
    v_registration.id, 'system', 'registration_created', 'pending_payment',
    jsonb_build_object(
      'ticket_option', v_registration.ticket_option,
      'tier', v_registration.tier,
      'price_cents', v_registration.price_cents
    )
  );

  return query select
    v_registration.id, v_registration.public_ref, v_registration.price_cents,
    v_registration.tier, v_registration.checkout_expires_at;
end;
$$;

-- New functions are executable by everyone by default; open up only what's meant to be public
revoke execute on function public.audience_for(public.membership_choice) from public, anon, authenticated;
revoke execute on function public.array_is_distinct(anyarray) from public, anon, authenticated;
revoke execute on function public.registration_holds_place(public.registration_status, timestamptz) from public, anon, authenticated;
revoke execute on function public.workshop_places_left() from public;
revoke execute on function public.create_pending_registration(
  public.membership_choice, public.ticket_option, public.price_tier, text, text, public.dietary_requirement[],
  text, text, text, text, public.gestalt_connection, public.heard_about, text, text, text, text
) from public, anon, authenticated;

grant execute on function public.audience_for(public.membership_choice) to service_role;
grant execute on function public.array_is_distinct(anyarray) to service_role;
grant execute on function public.registration_holds_place(public.registration_status, timestamptz) to service_role;
grant execute on function public.workshop_places_left() to anon, authenticated, service_role;
grant execute on function public.create_pending_registration(
  public.membership_choice, public.ticket_option, public.price_tier, text, text, public.dietary_requirement[],
  text, text, text, text, public.gestalt_connection, public.heard_about, text, text, text, text
) to service_role;