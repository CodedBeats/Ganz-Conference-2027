-- Adds the "Make a Submission" section to an existing database (the live project).
-- Local gets the same rows from seed.sql, so only run this where the seed has already been applied.
--
-- Run once in the Supabase SQL editor. It's one transaction: if anything fails nothing
-- changes, and a second run fails cleanly on the unique `sections.type`.
-- Afterwards, upload the guidelines PDF through the CMS (Submissions section -> PDF button);
-- the guidelines button stays hidden until a file is set.

begin;

-- make room after Registrations (5): Location moves to 7, ..., Footer to 13
update public.sections
set sort_order = sort_order + 1
where type in ('location', 'accommodation', 'sponsors', 'committee', 'faqs', 'contact', 'footer');

-- body = invitation, excerpt = virtual note, subheading = line above the guidelines button,
-- image = the guidelines PDF (null until uploaded)
insert into public.sections (type, heading, subheading, body, excerpt, sort_order, image_id) values
    ('submissions',
        'Make a *submission*.',
        'Full submission guidelines, including information about each contribution format and what to include in your proposal.',
        array_to_string(array[
            'For the 13th GANZ Conference, *In Our Bodies, Of The Field*, we are inviting contributions that explore embodiment and somatic Gestalt in ways that are thoughtful, experiential, provocative, clinically grounded and alive.',
            'We welcome submissions from students, emerging practitioners, researchers and experienced clinicians alike. We value lived experience, clinical wisdom, embodied knowledge, creativity and community knowledge alongside academic and theoretical expertise.'
        ], E'\n\n'),
        'The conference will be an in-person event, but if you''re overseas and interested in presenting virtually, we''d love to work with you to make an online contribution possible.',
        6, null);

-- unrendered group rows - "Formats" and "Details" own the editable rows
insert into public.stat_items (label, value, sort_order, section_id)
select group_label, '', group_order, (select id from public.sections where type = 'submissions')
from (values ('Formats', 1), ('Details', 2)) as groups (group_label, group_order);

insert into public.stat_items (label, value, sort_order, section_id, parent_id)
select rows.label, rows.value, rows.sort_order, submissions.id, grp.id
from (values
    ('Formats', 'Experiential Workshops',  '',                          1),
    ('Formats', 'Clinical Conversations',  '',                          2),
    ('Formats', 'Local Keynote Proposals', '',                          3),
    ('Details', 'Submissions close',       'Friday 11th December 2026', 1),
    ('Details', 'Send your submission to', 'contact@ganz.org.au',       2)
) as rows (group_label, label, value, sort_order)
cross join (select id from public.sections where type = 'submissions') as submissions
join public.stat_items grp
    on grp.label = rows.group_label
    and grp.parent_id is null
    and grp.section_id = submissions.id;

commit;