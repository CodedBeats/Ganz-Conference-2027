-- Replaces the Registrations cards on an existing database (the live project) with the
-- final ticket prices: 3 tickets x 2 membership groups, and no Scholarships card.
-- Local gets the same rows from seed.sql, so only run this where the seed has already been applied.
--
-- Run once in the Supabase SQL editor. It's one transaction: if anything fails nothing changes.
-- It deletes every stat item in the Registrations section first (price rows go with their tier
-- via `on delete cascade`), so any CMS edits made to these cards on live are lost. The section's
-- heading and intro are untouched. Safe to re-run - it lands on the same rows each time.

begin;

delete from public.stat_items
where section_id = (select id from public.sections where type = 'registrations');

-- tiers: label = title, value = subtitle, description = note
insert into public.stat_items (label, value, style, description, sort_order, section_id) values
    ('3-day Conference',              'GANZ Members', 'primary',   null,                                                1, (select id from public.sections where type = 'registrations')),
    ('2-day Pre-Conference Workshop', 'GANZ Members', 'primary',   'Workshop only. Conference not included.',           2, (select id from public.sections where type = 'registrations')),
    ('Bundle',                        'GANZ Members', 'secondary', '3-day Conference + 2-day Pre-Conference Workshop.', 3, (select id from public.sections where type = 'registrations')),
    ('3-day Conference',              'Non-Members',  'primary',   null,                                                4, (select id from public.sections where type = 'registrations')),
    ('2-day Pre-Conference Workshop', 'Non-Members',  'primary',   'Workshop only. Conference not included.',           5, (select id from public.sections where type = 'registrations')),
    ('Bundle',                        'Non-Members',  'secondary', '3-day Conference + 2-day Pre-Conference Workshop.', 6, (select id from public.sections where type = 'registrations'));

-- price rows, matched to their tier on title + subtitle
insert into public.stat_items (label, value, sort_order, section_id, parent_id)
select rows.label, rows.value, rows.sort_order, tier.section_id, tier.id
from (values
    ('3-day Conference',              'GANZ Members', 'Early Bird',        '$485',  1),
    ('3-day Conference',              'GANZ Members', 'Full Registration', '$585',  2),
    ('2-day Pre-Conference Workshop', 'GANZ Members', 'Early Bird',        '$650',  1),
    ('2-day Pre-Conference Workshop', 'GANZ Members', 'Full Registration', '$750',  2),
    ('Bundle',                        'GANZ Members', 'Early Bird',        '$1045', 1),
    ('Bundle',                        'GANZ Members', 'Full Registration', '$1145', 2),
    ('3-day Conference',              'Non-Members',  'Early Bird',        '$635',  1),
    ('3-day Conference',              'Non-Members',  'Full Registration', '$735',  2),
    ('2-day Pre-Conference Workshop', 'Non-Members',  'Early Bird',        '$800',  1),
    ('2-day Pre-Conference Workshop', 'Non-Members',  'Full Registration', '$900',  2),
    ('Bundle',                        'Non-Members',  'Early Bird',        '$1195', 1),
    ('Bundle',                        'Non-Members',  'Full Registration', '$1295', 2)
) as rows (tier_label, tier_subtitle, label, value, sort_order)
join public.stat_items tier
    on tier.label = rows.tier_label
    and tier.value = rows.tier_subtitle
    and tier.parent_id is null
    and tier.section_id = (select id from public.sections where type = 'registrations');

commit;