-- Adds the registration terms content (shown on /register) to an existing database (the live
-- project): the privacy statement and the agreement checkbox sentence from Michelle's form.
-- Local gets the same row from seed.sql, so only run this where the seed has already been applied.
--
-- Run once in the Supabase SQL editor. It's one transaction: if anything fails nothing
-- changes, and a second run fails cleanly on the unique `sections.type`.

begin;

-- heading = privacy title, body = privacy statement, excerpt = agreement checkbox sentence,
-- subheading = full privacy policy link (null hides it until GANZ send one; set it in the CMS
-- on /register). Last in sort order - it isn't on the home page.
insert into public.sections (type, heading, subheading, body, excerpt, sort_order) values
    ('register',
        'Privacy',
        null,
        'The information you provide will be used to administer your conference registration, arrange catering and accessibility requirements, process payments and communicate important conference information. Access to personal information will be limited to those who need it for these purposes, in accordance with GANZ''s applicable privacy obligations.',
        'I have read and agree to the above privacy and registration and cancellation terms. I understand that conference registrations are non-refundable.',
        (select max(sort_order) + 1 from public.sections));

commit;