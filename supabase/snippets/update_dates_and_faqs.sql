-- Brings the live copy that mentions dates, the venue or registration up to date: the venue
-- moved to UQ St Lucia (Brisbane), the pre-conference workshop runs 22-23 June 2027,
-- registration opens November 2026 and submissions are open.
-- Rows are matched on their live ids (local shares them after syncing with export_content.sql),
-- so this does nothing on a database seeded from scratch.
--
-- Run once in the Supabase SQL editor. It's one transaction: if anything fails nothing changes.
-- Safe to re-run. Any CMS edits made to these rows since are overwritten.

begin;

-- FAQ: Where is the conference held? (still said Griffith Gold Coast)
update public.stat_items
set value = 'At The University of Queensland''s St Lucia campus in Brisbane, on the lands of the Turrbal and Jagera people. The conference runs 25-27 June 2027, with the pre-conference workshop on 22-23 June.'
where id = 'bb5a0bda-4915-487b-a066-2ae3fa9fcf05';

-- FAQ: When do registrations open?
update public.stat_items
set value = 'Registration opens in November 2026. Ticket prices, including early bird rates, are listed under [Registrations](#registrations), along with how to apply for a scholarship.'
where id = 'a664236b-7f44-4429-8328-c3b1269834bf';

-- FAQ: Can I present or run a workshop?
update public.stat_items
set value = 'Yes - submissions are open until Friday 11 December 2026. See [Make a submission](#submissions) for the formats and guidelines.'
where id = '69e867b3-215e-441c-8ffd-df874a8d1480';

-- Footer: Dates detail
update public.stat_items
set value = E'Conference 25-27 June 2027\nWorkshop 22-23 June 2027'
where id = '59b0f59d-a33e-4dbe-9cff-c6e9f3806673';

commit;