-- Adds the Terms & Policies page content (shown on /policies) to an existing database
-- (the live project), starting with the refund and cancellation policy.
-- Local gets the same rows from seed.sql, so only run this where the seed has already been applied.
--
-- Run once in the Supabase SQL editor. It's one transaction: if anything fails nothing
-- changes, and a second run fails cleanly on the unique `sections.type`.

begin;

-- heading = page heading, body = optional intro, each stat item = one policy
-- (label = title, value = paragraphs). Last in sort order - it isn't on the home page.
insert into public.sections (type, heading, sort_order) values
    ('policies', 'Terms & Policies', (select max(sort_order) + 1 from public.sections));

insert into public.stat_items (label, value, sort_order, section_id) values
    ('Refund & Cancellation Policy',
        array_to_string(array[
            'All conference registrations are non-refundable. Please consider your availability carefully before registering, as GANZ is required to make financial commitments in advance of the conference.',
            'If you are unable to attend, you may request to transfer your registration to another person, subject to approval by GANZ and any applicable registration requirements. Transfer requests must be received in writing before the conference.',
            'In the unlikely event that GANZ needs to cancel the conference, registered attendees will be advised of the arrangements for refunds or other remedies. If the conference is postponed or substantially changed, GANZ will communicate directly with registered attendees regarding the options available.',
            'By registering, you acknowledge and agree to this policy.'
        ], E'\n\n'),
        1, (select id from public.sections where type = 'policies'));

commit;