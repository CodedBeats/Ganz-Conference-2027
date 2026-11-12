# Plan/Prompt for plan

I'm just going to include everything in my trello cards I wrote out.

## extra context
i know this file has changed, but use all the context from before. i also understand the trello cards don't have perfect context of the project in code so fill in or ask where needed

## questions
feel free to ask me any questions, better to ask that it be missed, theres a lot here and lot to come so i won't be surpriesed if i miss something.

## this file
this is a large file, if the output is going to be too big and you want to split it into multiple plans (especially if they would go better in different git branches and we can safely commit, push and merge other chunks first), thats totally fine. but edit this document to split it up putting in like big obvious page breaks. even if that means reordering things a bit thats ok too, but don't loose any content (adding to it is ok).

## how to read the cards
- The cards are written as I wrote them in Trello (P2-xx numbers, "Needs first", "Goal", "Tasks", dated "Update" notes). Treat them as the requirements, not as a description of the code. Check each task against the code first and mark what's already done (like the earlier "*(done ...)*" notes), so the plan only covers what's left.
- "P2-03 item N" means the numbered open questions on the P2-03 card (decisions with GANZ, each with a default). Use the default unless I say otherwise, and keep anything that depends on an unanswered item in one place so it's easy to change later.
- Names in the cards (Michelle, Zoë, Tegan) are the GANZ people the answers came from.



################################################################################
################################################################################
####                                                                        ####
####   WHERE WE ARE (12 Nov)                                                ####
####                                                                        ####
################################################################################
################################################################################

Done (Parts 1-3 of the previous plan; 1 and 2 are merged, 3 merges before this starts):
- `ticket-pricing`: Admin Tickets editor saves the 8 prices and the current tier to the DB, and the public ticket cards read prices and places left from the DB (P2-10, P2-11).
- `register-page`: the `/register` form (P2-12). It's admin-only, unlinked and noindex until registration opens (P2-34). Submitting is a **preview**: it checks the honeypot, the rate limit, the schema, the policy version and the price, then shows what would be charged and **saves nothing**.
- `register-followups`: the member route wording (pending until GANZ confirm, and what happens if the check fails), the registration terms made CMS-editable (new `register` section), and the shared-pool tests for the 27 workshop places.
  - Still to do by me: run `supabase/snippets/add_register_section.sql` on the live DB after merging.

Already built for the next step, but not wired to the form yet:
- `create_pending_registration` RPC (secret key only): decides the tier, the price snapshot and workshop capacity in one locked transaction, and returns the id, public ref, price, tier and `checkout_expires_at` (35 minutes). It raises `tier_changed`, `price_unavailable` or `sold_out`.
- The status machine (`status.ts`), audit log, email log tables, `stripe_events` table, and `STRIPE_SOURCE` / `CHECKOUT_SESSION_MINUTES` / `CHECKOUT_HOLD_GRACE_MINUTES` in `config.ts`.
- `CreateRegistrationResult` in `schema.ts` (the shape `submitRegistration` returns once it redirects to Stripe).

Still waiting on GANZ (each has a default in P2-03):
- Item 1: failed membership check, full refund or charge the difference (form wording is hedged for now).
- Item 3: approval turnaround (default 2 business days).
- Item 8: are prices GST-inclusive, and do attendees need tax invoices beyond a Stripe receipt? **This one blocks P2-15.**
- Item 13: the Join GANZ link. Plus the full privacy policy URL (now set in the CMS on `/register`), and the accommodation question (item 15).



################################################################################
################################################################################
####                                                                        ####
####   NEXT - save the registration to the DB + Stripe Checkout (P2-15)     ####
####                                                                        ####
################################################################################
################################################################################

We're now ready to create a registration as a real DB entry when the form is submitted, and to build the Stripe Checkout process: swap the `/register` preview for a pending registration plus a redirect to Stripe.

## P2-15: Create registration + Stripe Checkout Session
**Needs first:** P2-06, P2-08, P2-09, P2-13, P2-14, and P2-03 item 8 (GST / tax invoice answer).

Goal: submitting the form creates a pending registration and sends the person to Stripe to pay.

Tasks

Server action or route: validate everything again server-side

Recompute the price on the server from `ticket_prices` and the current tier. Ignore any amount from the browser

Insert the registration as pending_payment with the price snapshot (cents, AUD)

Create the Checkout Session: payment mode, AUD, price sent as dynamic price data with a clear line-item description, customer email, the registration id in metadata and as the client reference, an idempotency key, and a sensible expiry (for example 30 minutes)

Save the session id on the registration, then redirect to Stripe

success and cancel URLs go to the pages built in P2-18 using an unguessable reference

Guard against double-clicks creating two registrations or sessions

If Stripe fails, show a friendly error and don't leave a confusing orphan record

Test with Stripe's test card 4242 4242 4242 4242

## (paste the related cards here: P2-16, P2-17 webhook, P2-18 success/cancel pages, and anything else that should go in this chunk)
