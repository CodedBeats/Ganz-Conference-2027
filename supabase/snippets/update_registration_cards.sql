-- Final ticket layout on an existing database (the live project): the four tier cards stay
-- as they are (2x2), the blank "x" spacer cards go, and a Scholarships info card takes the
-- column on the right. Also fills in the registration button's label and link.
-- Local gets the same rows from seed.sql, so only run this where the seed has already been applied.
--
-- Run once in the Supabase SQL editor. It's one transaction: if anything fails nothing changes.
-- Safe to re-run - the spacers are already gone and the info card isn't added twice.
-- The scholarship wording is placeholder until Michelle sends the number, criteria and email.

begin;

-- the client's spacer cards (label "x", no subtitle); their price rows go via on delete cascade
delete from public.stat_items
where section_id = (select id from public.sections where type = 'registrations')
    and parent_id is null
    and label = 'x'
    and value = '';

-- info card: tertiary marks it as not-a-ticket. label = title, value = availability line,
-- description = criteria, child row = contact email
insert into public.stat_items (label, value, style, description, sort_order, section_id)
select
    'Scholarships',
    'Number of places to be confirmed',
    'tertiary',
    array_to_string(array[
        'A number of scholarships are available for people who meet the following criteria.',
        'Criteria to be confirmed.',
        'To apply, email us with a short note about yourself and why you would like to attend.'
    ], E'\n\n'),
    7,
    (select id from public.sections where type = 'registrations')
where not exists (
    select 1 from public.stat_items
    where section_id = (select id from public.sections where type = 'registrations')
        and style = 'tertiary'
);

insert into public.stat_items (label, value, sort_order, section_id, parent_id)
select 'Email', 'contact@ganz.org.au', 1, card.section_id, card.id
from public.stat_items card
where card.section_id = (select id from public.sections where type = 'registrations')
    and card.style = 'tertiary'
    and card.parent_id is null
    and not exists (select 1 from public.stat_items child where child.parent_id = card.id);

-- registration button: subheading = label, excerpt = link (#registrations = not open yet)
update public.sections
set subheading = 'Registration opening soon', excerpt = '#registrations'
where type = 'registrations';

commit;