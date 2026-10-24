-- Adds the Pre-Conference Workshop section (before Registrations) to an existing database
-- (the live project), and links the Conference + Workshop ticket cards to it.
-- Local gets the same rows from seed.sql, so only run this where the seed has already been applied.
--
-- Run once in the Supabase SQL editor. It's one transaction: if anything fails nothing
-- changes, and a second run fails cleanly on the unique `sections.type`.
-- The copy is placeholder until Michelle sends the workshop details.

begin;

-- make room before Registrations: it and everything after it move down one
update public.sections
set sort_order = sort_order + 1
where sort_order >= (select sort_order from public.sections where type = 'registrations');

-- body = description paragraphs, image = optional photo (set through the CMS)
insert into public.sections (type, heading, body, sort_order) values
    ('workshop',
        'Two days to *go deeper*.',
        array_to_string(array[
            'Before the conference begins, join us for a two-day pre-conference workshop on Tuesday 22 and Wednesday 23 June 2027.',
            'Full details, including the facilitator and program, will be announced soon.'
        ], E'\n\n'),
        (select sort_order - 1 from public.sections where type = 'registrations'));

-- details card rows: label = caption, value = text
insert into public.stat_items (label, value, sort_order, section_id)
select rows.label, rows.value, rows.sort_order, (select id from public.sections where type = 'workshop')
from (values
    ('Dates',       'Tuesday 22 - Wednesday 23 June 2027', 1),
    ('Facilitator', 'To be announced',                     2),
    ('Times',       'To be confirmed',                     3)
) as rows (label, value, sort_order);

-- "Find out more" on the Conference + Workshop ticket cards
update public.stat_items
set description = concat_ws(E'\n', nullif(description, ''), '[Find out more about the workshop](#workshop)')
where section_id = (select id from public.sections where type = 'registrations')
    and parent_id is null
    and label like '%Conference + Workshop%'
    and coalesce(description, '') not like '%(#workshop)%';

commit;