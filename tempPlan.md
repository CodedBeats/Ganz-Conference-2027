# Plan/Prompt for plan

I'm just going to include everything in my trello cards I wrote out. 

> **Split (11 Nov):** two chunks, separated by the big `####` banners below.
> - **PART 1**: branch `ticket-pricing`. Admin Tickets editor + public ticket cards from the DB (P2-10, P2-11). Merge first.
> - **PART 2**: branch `register-page`, after Part 1 merges. The /register form page (P2-12).
>
> Approved plan: `~/.claude/plans/look-at-tempplan-md-giggly-quail.md`. Decisions: CMS tier cards are linked to DB prices (card text stays CMS-editable); /register submit is a preview only (validates, rate-limits in Supabase, saves nothing); you push migrations to live yourself.

## extra context
i know this file has changed, but use all the context from before. i also understand the trello cards don't have perfect context of the project in code so fill in or ask where needed

## questions
feel free to ask me any questions, better to ask that it be missed, theres a lot here and lot to come so i won't be surpriesed if i miss something.

## this file
this is a large file, if the output is going to be too big and you want to split it into multiple plans (especially if they would go better in different git branches and we can safely commit, push and merge other chunks first), thats totally fine. but edit this document to split it up putting in like big obvious page breaks. even if that means reordering things a bit thats ok too, but don't loose any content (adding to it is ok).



################################################################################
################################################################################
####                                                                        ####
####   PART 1 - branch `ticket-pricing`                                     ####
####   admin Tickets editor + public ticket cards from the DB               ####
####   (P2-10, P2-11) - merge this first                                    ####
####                                                                        ####
################################################################################
################################################################################

## Admin Tickets editor saves prices to the database
Goal: GANZ edit the 8 prices and the current tier in the admin dashboard, and that becomes the source for the public ticket cards. The Tickets card in admin has been display-only until now.

Tasks

Admin Tickets page: edit the 8 prices as dollars (stored as cents), with validation (no negatives, no blanks), clear saving and error states

Control to switch Early Bird to Full (or set the cutoff date) per P2-03 item 7

Only admins can save (re-check on the server, not just in the UI)

Record who changed what in the audit log

Trigger revalidation of the public pages after a save, using the same revalidation approach as the Phase 1 CMS

Related earlier card: "CMS: Registration pricing"

## Public ticket cards read prices from the database
Goal: the Registrations section on the public site shows the prices set in admin, with no second place to edit them.

Tasks

Replace the CMS-stored price values on the ticket cards with ticket_prices read in server components

Show the current tier's price prominently and keep the existing member / non-member layout and the separate Scholarships text card

Fallbacks if a price row is missing, so the page never breaks

Confirm a price change in admin appears on the public site after revalidation

Card buttons stay on the "Registration opening soon" state until P2-34, but build the links now as /register?option=...&audience=.... These query values only preselect the form; the server never trusts them for pricing



################################################################################
################################################################################
####                                                                        ####
####   PART 2 - branch `register-page` (after PART 1 merges)                ####
####   the /register form page (P2-12)                                      ####
####                                                                        ####
################################################################################
################################################################################

## Registration form page (/register)
Goal: the public form people fill in before paying.

Tasks

New /register route styled to the Brand & Style Reference. Not linked from the site until P2-34, and set to noindex until then

Preselect ticket option and member / non-member from the card links (P2-11); let the person change them

Show the live price from the database, including the current tier

Fields per Michelle's form (received 6 Nov, see the update below)

Validation on both client and server, with clear error messages and accessible labels

Spam protection: honeypot field plus server-side rate limiting on submit

Student wording: the $50 option is gone (Michelle, 6 Nov). The council agreed only Australian Gestalt students get free membership (Zoë, 7 Nov). Wording to be confirmed with Michelle

Mobile layout checked at the same widths as the nav fix (1280, 1366, 1440 and phone)

Submit isn't wired to payment yet; that's P2-15

Update 2 Nov: Michelle is building the form now and will send it 2 or 3 Nov. Dietary, sensory and accessibility requirements are part of it. When Conference + Workshop reaches its 27 place cap, the form needs a sold-out message for that option (see P2-15a)

Update 10 Nov, form received 6 Nov: this replaces the default field list.

Section 1: Q1 has three choices (current GANZ member / I'd like to join GANZ / non-member). Q2 is the registration option

Section 2: full name (used on the badge), pronouns (optional), email, phone (optional)

Section 3: dietary multi-select (none, vegetarian, vegan, gluten-free, other) plus a details box

Section 4: access requirements, long answer, optional

Section 5: role or connection to Gestalt practice (optional select), how they heard about the conference (optional select)

Section 6: privacy statement, cancellation policy with an agree checkbox, payment

Pronouns, role and how-heard weren't in my defaults, so add them to the data model (P2-05) *(done in the registration data model)*

Q2 shows only the 2 options that apply to that person (membership plus whether Early Bird is still open). The full 8 price table stays in Registrations (Michelle agreed)

Workshop is Tuesday 22 and Wednesday 23 June 2027 (the form said 23 and 24)

Venue line is The University of Queensland, St Lucia, Brisbane QLD

Conference + Workshop shows how many places are left instead of "30 spaces" (see P2-15a)

Possible accommodation question (Premium, High, Low, Billeting): not agreed yet, see P2-03 item 15