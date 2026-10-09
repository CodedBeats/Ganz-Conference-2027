-- Seed mirrors the hardcoded content in src/components/sections and src/lib/content.
-- Text conventions: paragraphs split by a blank line (\n\n), forced line breaks
-- by \n, and *asterisks* mark the accent-coloured highlight spans.
-- style: 'primary' = normal look, 'secondary' = alternate look (TBC / TBA / dark card).

-- Images: only real assets in /public/design. Anything without one (committee
-- photos, TBA keynotes, sponsor logos) stays null so the UI shows its placeholder.
insert into public.images (name, file_ref) values
    ('ganz-logo',                '/design/logo/GANZLogo_FullColour.png'),
    ('welcome',                  '/design/imgs/welcome.jpg'),
    ('accommodation',            '/design/imgs/accommodation.jpg'),
    ('keynote-michael-clemmens', '/design/imgs/Michael Clemons.jpg');

-- Sections: `type` matches each section's DOM id
insert into public.sections (type, heading, subheading, body, excerpt, sort_order, image_id) values
    ('hero',
        E'In Our Bodies,\n*Of The Field*',
        'Celebrating 30 years of GANZ',
        null,
        '13th National *Gestalt Australia & New Zealand* Conference',
        1, (select id from public.images where name = 'ganz-logo')),
    ('welcome',
        'It is with great pleasure that we welcome you to the 13th Gestalt Australia & New Zealand Conference, *In Our Bodies, Of The Field*, held on the lands of the Yugambeh people of the Gold Coast, and marking 30 years of Gestalt Australia & New Zealand.',
        null,
        -- the excerpt (gold blockquote) currently sits between paragraphs 3 and 4
        array_to_string(array[
            'On behalf of GANZ Council and the Conference Organising Group, it is a joy to invite you into this gathering - a space to come together, to think, to feel, to question, to move, to connect and to be changed by one another.',
            'Our theme, In Our Bodies, Of The Field, invites us to turn our attention towards embodiment: to the ways we experience ourselves through and with our bodies, and to the ways our bodies are always situated within families, relationships, cultures, histories and wider social and political fields.',
            'We will explore what it means to practise Gestalt when we take seriously the diversity of bodies and body experiences. Bodies shaped by race, gender, sexuality, disability, neurodivergence, chronic illness, ageing and developmental change. Bodies arriving in the world, growing, changing, becoming parents, becoming adolescents, experiencing pleasure and pain, illness and health, loss and grief, ageing and death. Bodies that are welcomed, watched, judged, celebrated, marginalised and politicised.',
            'This conference is also a celebration. Thirty years of GANZ is thirty years of people gathering, learning, challenging, creating, supporting one another and carrying Gestalt forward. We want to honour that history while also making room for what comes next.',
            'We hope you will bring your whole self to this gathering - your clinical knowledge and your questions, your experience and your uncertainty, your curiosity, your creativity, your body and your way of being in relationship.',
            'There will be opportunities to listen and to learn, to present and to participate, to move and to rest, to think deeply and to simply be together. We hope the conversations that begin here will continue well beyond the conference itself.',
            'We look forward to welcoming you to the Gold Coast in June 2027, as we celebrate 30 years of GANZ and gather together to imagine, question and create the next chapter of our community.'
        ], E'\n\n'),
        'And we will ask what happens when we bring this awareness more fully into our therapeutic relationships and into our understanding of field.',
        2, (select id from public.images where name = 'welcome')),
    ('program',
        'Explore a dynamic three-day program featuring keynote presentations, clinical conversations, research discussions, experiential workshops, and somatic offerings that invite us to *move, rest, play* and reconnect with our bodies.',
        null, null, null,
        3, null),
    ('keynotes',
        'Keynote Presenters',
        null,
        'Further keynote presenters will be announced through 2026.',
        null,
        4, null),
    ('registrations',
        'Join us on the Gold Coast.',
        null,
        'Registration opens in 2026. Rates are being finalised - join the mailing list and we will let you know the moment early bird opens.',
        null,
        5, null),
    ('location',
        'Finding us on campus.',
        null,
        'Griffith University''s Gold Coast campus at Southport - not the Nathan, Mt Gravatt or Logan campuses.',
        null,
        6, null),
    ('accommodation',
        'Where to stay',
        null,
        'We are securing a selection of accommodation options close to the Griffith University Gold Coast campus, across a range of price points. Details will be published here.',
        'Details to be confirmed',
        7, (select id from public.images where name = 'accommodation')),
    ('sponsors',
        'Supporting thirty years of Gestalt practice.',
        null,
        'Sponsorship opportunities are open. To discuss partnering with the 13th GANZ Conference, contact the committee.',
        null,
        8, null),
    ('committee',
        'Held by many hands.',
        null,
        'The committee continues to grow. Bios and photographs to follow.',
        null,
        9, null),
    ('faqs',
        E'Questions,\nanswered.',
        null,
        'Full answers will be published as arrangements are confirmed. Anything else, write to us.',
        null,
        10, null),
    ('contact',
        'We''d love to hear from you.',
        null,
        'contact@ganz.org.au',
        null,
        11, null);

-- Top-level stat items
insert into public.stat_items (label, value, style, description, sort_order, section_id) values
    -- hero
    ('Dates', '25-27 June 2027',                     'primary', null, 1, (select id from public.sections where type = 'hero')),
    ('Venue', 'Griffith University, Gold Coast QLD', 'primary', null, 2, (select id from public.sections where type = 'hero')),

    -- program
    ('Days',          '3',   'primary',   null, 1, (select id from public.sections where type = 'program')),
    ('Years of GANZ', '30',  'primary',   null, 2, (select id from public.sections where type = 'program')),
    ('Keynotes',      '3',   'primary',   null, 3, (select id from public.sections where type = 'program')),
    ('Workshops',     'TBC', 'secondary', null, 4, (select id from public.sections where type = 'program')),

    -- registrations: tiers (label = title, value = subtitle); price rows are children below
    ('GANZ Members',  'Current financial members',   'primary',   null, 1, (select id from public.sections where type = 'registrations')),
    ('Non-Members',   'All welcome',                 'primary',   null, 2, (select id from public.sections where type = 'registrations')),
    ('Scholarships',  'Trainees & supported places', 'secondary',
        'A limited number of supported places will be offered. Application details to follow.',
        3, (select id from public.sections where type = 'registrations')),

    -- location
    ('Venue',        'Griffith University Gold Coast Campus',                'primary', null, 1, (select id from public.sections where type = 'location')),
    ('Address',      E'1 Parklands Dr,\nSouthport QLD 4215\nAustralia',     'primary', null, 2, (select id from public.sections where type = 'location')),
    ('Getting here', 'G:link tram to Griffith University station. Approx. 25 minutes from Surfers Paradise, 30 minutes from Gold Coast Airport.',
        'primary', null, 3, (select id from public.sections where type = 'location')),

    -- sponsors: value holds the sponsor's link once known, image holds the logo
    ('Sponsor one',   '', 'primary', null, 1, (select id from public.sections where type = 'sponsors')),
    ('Sponsor two',   '', 'primary', null, 2, (select id from public.sections where type = 'sponsors')),
    ('Sponsor three', '', 'primary', null, 3, (select id from public.sections where type = 'sponsors')),
    ('Sponsor four',  '', 'primary', null, 4, (select id from public.sections where type = 'sponsors')),

    -- faqs: label = question, value = answer
    ('When do registrations open?',
        'Registrations open in 2026. Rates, including early bird and scholarship places, are being finalised and will be published here.',
        'primary', null, 1, (select id from public.sections where type = 'faqs')),
    ('Where is the conference held?',
        'At Griffith University''s Gold Coast campus, Parklands Drive, Southport, on the lands of the Yugambeh people, 25-27 June 2027.',
        'primary', null, 2, (select id from public.sections where type = 'faqs')),
    ('Is the conference open to trainees?',
        'Yes. Trainees and students are warmly welcome, and a limited number of supported scholarship places will be offered.',
        'primary', null, 3, (select id from public.sections where type = 'faqs')),
    ('Will there be experiential and somatic sessions?',
        'Yes - alongside keynotes and clinical conversations, the program includes experiential workshops and somatic offerings that invite movement, rest and play.',
        'primary', null, 4, (select id from public.sections where type = 'faqs')),
    ('Can I present or run a workshop?',
        'A call for papers and workshop proposals will be released ahead of the conference. Details to be confirmed.',
        'primary', null, 5, (select id from public.sections where type = 'faqs'));

-- Registration price rows, nested under their tier
insert into public.stat_items (label, value, sort_order, section_id, parent_id)
select rows.label, rows.value, rows.sort_order, tier.section_id, tier.id
from (values
    ('GANZ Members', 'Early Bird',        'TBC', 1),
    ('GANZ Members', 'Full Registration', 'TBC', 2),
    ('Non-Members',  'Early Bird',        'TBC', 1),
    ('Non-Members',  'Full Registration', 'TBC', 2),
    ('Scholarships', 'Scholarship Rate',  'TBC', 1)
) as rows (tier_label, label, value, sort_order)
join public.stat_items tier
    on tier.label = rows.tier_label
    and tier.parent_id is null
    and tier.section_id = (select id from public.sections where type = 'registrations');

-- People: keynotes and committee
insert into public.people (image, name, title, location, description, link, style, sort_order, section_id) values
    ((select id from public.images where name = 'keynote-michael-clemmens'),
        'Michael Clemmens', null, 'Pittsburgh, USA',
        'Psychologist, Gestalt trainer and author whose work centres the body as the ground of contact. He teaches internationally on embodiment, addiction and the somatic field of the therapeutic relationship.',
        'https://michaelclemmens.com',
        'primary', 1, (select id from public.sections where type = 'keynotes')),
    (null, 'To be announced', 'Keynote Two', null,
        'Our second keynote presenter will be announced soon.', null,
        'secondary', 2, (select id from public.sections where type = 'keynotes')),
    (null, 'To be announced', 'Keynote Three', null,
        'Our third keynote presenter will be announced soon.', null,
        'secondary', 3, (select id from public.sections where type = 'keynotes')),

    (null, 'Michelle Sier', 'GANZ President', null, 'Bio coming soon.', null, 'primary', 1, (select id from public.sections where type = 'committee')),
    (null, 'Tegan Mumford', 'Committee',      null, 'Bio coming soon.', null, 'primary', 2, (select id from public.sections where type = 'committee')),
    (null, 'Zoe Webber',    'Committee',      null, 'Bio coming soon.', null, 'primary', 3, (select id from public.sections where type = 'committee')),
    (null, 'Mia O''Brian',  'Committee',      null, 'Bio coming soon.', null, 'primary', 4, (select id from public.sections where type = 'committee')),
    (null, 'Gina Denholm',  'Committee',      null, 'Bio coming soon.', null, 'primary', 5, (select id from public.sections where type = 'committee')),
    (null, 'Michael Pitt',  'Committee',      null, 'Bio coming soon.', null, 'primary', 6, (select id from public.sections where type = 'committee')),
    -- secondary = the pale "More to come" placeholder card
    (null, 'More to come',  'Committee',      null, 'Further members to be announced.', null, 'secondary', 7, (select id from public.sections where type = 'committee'));
