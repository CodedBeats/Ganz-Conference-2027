-- Phase 2: the public ticket cards read their prices from ticket_prices, and admins edit those
-- prices (and the tier) in Admin -> Tickets, with every change recorded.

-- Ticket cards ---------------------------------------------------------------------------------

-- A registration tier card (a top-level stat item in the `registrations` section) is linked to the
-- ticket it sells. The card's title, dates and note stay CMS-editable; its prices come from
-- ticket_prices. These columns are deliberately not CMS-editable (see EDITABLE_FIELDS).
alter table public.stat_items
  add column ticket_option public.ticket_option,
  add column audience public.audience,
  add constraint stat_items_ticket_link check ((ticket_option is null) = (audience is null));

-- One card per ticket
create unique index stat_items_ticket_link_idx on public.stat_items (ticket_option, audience)
  where ticket_option is not null;

-- Link the existing cards from their titles ("GANZ Members Conference Only", "Non Members -
-- Conference + Workshop", ...). Only the first card per ticket is linked, so an unexpected
-- duplicate leaves a card unlinked (it then shows no prices) instead of failing the migration.
with tiers as (
  select
    item.id,
    item.sort_order,
    (case when item.label ilike '%workshop%' then 'conference_workshop' else 'conference_only' end)::public.ticket_option as ticket_option,
    (case when item.label ilike 'non%' then 'non_member' else 'member' end)::public.audience as audience
  from public.stat_items as item
  join public.sections as section on section.id = item.section_id
  where section.type = 'registrations'
    and item.parent_id is null
    and item.style <> 'tertiary'
),
ranked as (
  select id, ticket_option, audience,
    row_number() over (partition by ticket_option, audience order by sort_order, id) as position
  from tiers
)
update public.stat_items as item
set ticket_option = ranked.ticket_option, audience = ranked.audience
from ranked
where ranked.id = item.id and ranked.position = 1;

-- The linked cards' old CMS price rows are dead data now
delete from public.stat_items as child
using public.stat_items as tier
where child.parent_id = tier.id and tier.ticket_option is not null;

-- Pricing audit log ----------------------------------------------------------------------------

-- Who changed a price or the tier, and from what to what. A null ticket_price_id is a change to
-- registration_settings (the tier or the Early Bird close date).
create table public.pricing_audit_log (
  id               bigint generated always as identity primary key,
  ticket_price_id  uuid references public.ticket_prices (id),
  before           jsonb not null,
  after            jsonb not null,
  -- No foreign key, so the history survives an admin account being removed
  changed_by       uuid not null,
  created_at       timestamptz not null default now()
);

create index pricing_audit_log_created_idx on public.pricing_audit_log (created_at desc);

alter table public.pricing_audit_log enable row level security;

revoke all on public.pricing_audit_log from anon;
revoke insert, update, delete, truncate on public.pricing_audit_log from authenticated;

create policy "Admins can read the pricing audit log"
  on public.pricing_audit_log for select
  to authenticated
  using (public.is_admin());

-- Saving ---------------------------------------------------------------------------------------

-- Saves the Admin -> Tickets form: the 8 amounts, the current tier and the informational Early Bird
-- close date, in one transaction, with an audit row per change. Only rows that actually changed are
-- written. Returns the number of changes.
--
-- Security definer so the price update and its audit row can't be separated; it checks is_admin()
-- itself and stamps auth.uid() as the author. It never touches workshop_capacity or is_active.
-- Raises (SQLSTATE 42501) 'not_admin', or (22023) 'invalid_prices' / 'unknown_price' / 'invalid_amount'.
create function public.save_ticket_pricing(
  p_price_ids             uuid[],
  p_amounts_cents         integer[],
  p_current_tier          public.price_tier,
  p_early_bird_closes_on  date default null
)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user      uuid := auth.uid();
  v_changes   integer := 0;
  v_index     integer;
  v_amount    integer;
  v_price     public.ticket_prices;
  v_settings  public.registration_settings;
begin
  if v_user is null or not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  if p_current_tier is null
    or coalesce(cardinality(p_price_ids), 0) <> coalesce(cardinality(p_amounts_cents), 0)
    or coalesce(cardinality(p_price_ids), 0) <> (select count(distinct price_id) from unnest(p_price_ids) as price_id)
  then
    raise exception 'invalid_prices' using errcode = '22023';
  end if;

  for v_index in 1 .. coalesce(cardinality(p_price_ids), 0) loop
    v_amount := p_amounts_cents[v_index];
    if v_amount is null or v_amount <= 0 then
      raise exception 'invalid_amount' using errcode = '22023';
    end if;

    select * into v_price from public.ticket_prices as price where price.id = p_price_ids[v_index] for update;
    if not found then
      raise exception 'unknown_price' using errcode = '22023';
    end if;

    if v_price.amount_cents <> v_amount then
      update public.ticket_prices as price set amount_cents = v_amount where price.id = v_price.id;
      insert into public.pricing_audit_log (ticket_price_id, before, after, changed_by)
      values (
        v_price.id,
        jsonb_build_object('amount_cents', v_price.amount_cents),
        jsonb_build_object('amount_cents', v_amount),
        v_user
      );
      v_changes := v_changes + 1;
    end if;
  end loop;

  select * into v_settings from public.registration_settings as settings where settings.id for update;

  if v_settings.current_tier is distinct from p_current_tier
    or v_settings.early_bird_closes_on is distinct from p_early_bird_closes_on
  then
    update public.registration_settings as settings
    set current_tier = p_current_tier, early_bird_closes_on = p_early_bird_closes_on
    where settings.id;

    insert into public.pricing_audit_log (ticket_price_id, before, after, changed_by)
    values (
      null,
      jsonb_build_object('current_tier', v_settings.current_tier, 'early_bird_closes_on', v_settings.early_bird_closes_on),
      jsonb_build_object('current_tier', p_current_tier, 'early_bird_closes_on', p_early_bird_closes_on),
      v_user
    );
    v_changes := v_changes + 1;
  end if;

  return v_changes;
end;
$$;

revoke execute on function public.save_ticket_pricing(uuid[], integer[], public.price_tier, date) from public, anon;
grant execute on function public.save_ticket_pricing(uuid[], integer[], public.price_tier, date) to authenticated;