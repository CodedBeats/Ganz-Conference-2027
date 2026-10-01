-- Images: every seed image reuses the one placeholder in /public/seed until
-- real conference photography is uploaded through the CMS.
insert into public.images (name, file_ref) values
    ('hero-header',             '/seed/wtf-did-i-make.png'),
    ('stat-years-running',      '/seed/wtf-did-i-make.png'),
    ('stat-days',               '/seed/wtf-did-i-make.png'),
    ('stat-workshops',          '/seed/wtf-did-i-make.png'),
    ('stat-attendees',          '/seed/wtf-did-i-make.png'),
    ('presenter-aroha-ngata',   '/seed/wtf-did-i-make.png'),
    ('presenter-daniel-whitford', '/seed/wtf-did-i-make.png'),
    ('presenter-mei-lin-chen',  '/seed/wtf-did-i-make.png'),
    ('presenter-samuel-okafor', '/seed/wtf-did-i-make.png');

insert into public.sections (type, heading, subheading, body, excerpt, sort_order, image_id) values
    ('hero',     'Welcome to GANZ 2027', 'Gestalt Australia & New Zealand Conference', null, null, 1,
        (select id from public.images where name = 'hero-header')),
    ('about',    'About the Conference', 'Three days of Gestalt practice, theory and community',
        'GANZ 2027 brings together Gestalt therapists, counsellors, educators and students from across Australia and New Zealand for three days of workshops, keynote presentations and community connection.',
        null, 2, null),
    ('stats',    'By the Numbers', null, null, null, 3, null),
    ('program',  'A program built around connection', null, null, null, 4, null),
    ('keynotes', 'Keynote Presenters', 'Voices shaping Gestalt practice today', null, null, 5, null),
    ('location', 'Find your way to the venue', null, null, null, 6, null);

insert into public.stat_items (image, label, value, style, section_id) values
    ((select id from public.images where name = 'stat-years-running'), 'Years running',      '38',  'primary',
        (select id from public.sections where type = 'stats')),
    ((select id from public.images where name = 'stat-days'),          'Conference days',    '3',   'secondary',
        (select id from public.sections where type = 'stats')),
    ((select id from public.images where name = 'stat-workshops'),     'Workshops',          '24',  'tertiary',
        (select id from public.sections where type = 'stats')),
    ((select id from public.images where name = 'stat-attendees'),     'Attendees expected', '450', 'primary',
        (select id from public.sections where type = 'stats'));

insert into public.presenters (image, name, title, location, description, link, section_id) values
    ((select id from public.images where name = 'presenter-aroha-ngata'),
        'Dr. Aroha Ngata', 'Clinical Director, Gestalt Institute of Aotearoa', 'Wellington, NZ',
        'Aroha has spent two decades integrating Maori approaches to wellbeing with Gestalt practice, and leads training programs across the North Island.',
        'https://example.com/presenters/aroha-ngata',
        (select id from public.sections where type = 'keynotes')),
    ((select id from public.images where name = 'presenter-daniel-whitford'),
        'Daniel Whitford', 'Senior Lecturer, University of Melbourne', 'Melbourne, AU',
        'Daniel researches the application of Gestalt field theory in organisational settings and consults widely with Australian workplaces on team dynamics.',
        'https://example.com/presenters/daniel-whitford',
        (select id from public.sections where type = 'keynotes')),
    ((select id from public.images where name = 'presenter-mei-lin-chen'),
        'Mei-Lin Chen', 'Founder, Chen Therapy Collective', 'Auckland, NZ',
        'Mei-Lin specialises in Gestalt approaches to intergenerational trauma and runs one of the busiest group practices in Auckland.',
        'https://example.com/presenters/mei-lin-chen',
        (select id from public.sections where type = 'keynotes')),
    ((select id from public.images where name = 'presenter-samuel-okafor'),
        'Samuel Okafor', 'Private Practice & Clinical Supervisor', 'Sydney, AU',
        'Samuel has supervised over 100 trainee Gestalt therapists and writes regularly on ethics in contemporary therapeutic practice.',
        'https://example.com/presenters/samuel-okafor',
        (select id from public.sections where type = 'keynotes'));
