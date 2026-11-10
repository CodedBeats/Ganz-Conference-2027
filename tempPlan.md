# Plan/Prompt for plan

I'm just going to include everything in my trello cards I wrote out. Then repeat a bunch of info with further context

> **Split (10 Nov):** this file is split into three chunks, separated by the big `####` banners below:
> - **SHARED DESIGN**: applies to both branches. Read it first.
> - **PART A**: branch `registration`. Ticket prices + settings migration, seed, regenerated types, options/money/pricing libs and tests (P2-07 + the pricing half of P2-09). Merge first.
> - **PART B**: branch `registration-model`, after A merges. Registrations, private details, stripe_events, audit log, email log, capacity functions, status machine, zod schema, query-param parser, read model, RLS tests (P2-08 + the rest).
>
> The approved implementation plan is at `~/.claude/plans/look-at-tempplan-md-giggly-quail.md`.

## more context
You can ignore a bunch of the info from these cards that would ask you to do something that doesn't translate to code (e.g. creating erd diagrams). In those cards there is also a bunch of references to other trello cards, you can ignore that for the most part.

## questions
feel free to ask me any questions, better to ask that it be missed, theres a lot here and lot to come so i won't be surpriesed if i miss something.

## this file
this is a large file, if the output is going to be too big and you want to split it into multiple plans (especially if they would go better in different git branches and we can safely commit, push and merge other chunks first), thats totally fine. but edit this document to split it up putting in like big obvious page breaks. even if that means reordering things a bit thats ok too, but don't loose any content (adding to it is ok).



################################################################################
################################################################################
####                                                                        ####
####   SHARED DESIGN - applies to both PART A and PART B                    ####
####                                                                        ####
################################################################################
################################################################################

## Data model design (ERD, statuses, state machine)
Goal: settle the schema before writing migrations, as with the Phase 1 schema card.

Tasks

Sketch an ERD (Mermaid in the repo) for: ticket_prices, a small settings table (current tier, early bird end), registrations, stripe_events, registration_audit_log, and an email log or sent flags

registrations: one attendee per registration, form answers, member verification fields (name and email used to join; no order number, per Michelle 6 Nov), ticket option / audience / tier, a snapshot of the price paid in cents (so later admin price edits never change past registrations), AUD, Stripe session id, payment intent id, policy accepted at + version, status, timestamps

Statuses and allowed moves: pending_payment, then paid; non-member paid becomes confirmed; member paid becomes awaiting_verification, then approved or rejected; rejected leads to refunded; plus abandoned/expired and cancelled. Write this down as a transition table, because the code in P2-17, P2-22 and P2-23 will enforce it

Money is always integer cents

Guest checkout, no attendee accounts, per the P2-03 default

RLS plan: no public access to registrations; writes only by server code using the secret key; admins read and update through is_admin()

Note which fields are sensitive (dietary, accessibility) and who can read them

Update 2 Nov, capacity: Conference + Workshop is capped at 27 places in total across its four prices (member / non-member x Early Bird / Full), not 27 per price. The venue holds 30 and 3 places are held for Michelle, Tegan and Zoë. Decide where the cap lives (settings table or on the ticket option) and how places are counted (paid plus unexpired pending_payment, so the last place can't be taken twice). See P2-15a

Update 10 Nov, form data: the registration form arrived 6 Nov (see P2-12). Store: full name, pronouns (optional), email, phone (optional), dietary (multi-select plus details), access requirements, role or connection to Gestalt practice (optional), how they heard (optional), and the policy acceptance. Dietary and access answers are the sensitive fields. The member check uses name and email only. If the accommodation question goes ahead (P2-03 item 15), add a field for the price range preference

## Forced typing requirements (the core of this task)

I want it to be a compile error, a failing test or a DB constraint violation to introduce an option value that one layer does not know about. The plan must deliver all of these, with short TypeScript sketches:

1. **One source of truth per closed set.** Each set from section 3 (and the status, email template, audit action and handled Stripe event sets) is an `as const` tuple exported with a derived union type. Labels live in `Record<Key, string>` declared with `satisfies`, so adding a key without a label fails to compile.
2. **DB alignment.** For each set decide: Postgres enum, `text` plus `CHECK`, or a lookup table (fixed workflow sets such as status are different from content-like sets such as "how did you hear"). Whatever you choose, the generated `Database` types must line up with the TS unions, and a **Vitest drift test** must fail if the DB's allowed values and the TS constants diverge. Explain how renaming or removing a value later would work once real data exists.
3. **Validation derived from the same constants.** The registration form schema is built from the constants (use zod if the repo already uses it; otherwise propose the lightest option consistent with the repo). It must express: a discriminated union on membership choice (member audiences **require** the verification name and email; `non_member` must not carry them), `none` exclusive in dietary, optional selects that accept empty and become `null`, and the policy acceptance as a required literal true. The same schema runs on client and server.
4. **Exhaustiveness.** Any `switch` or lookup over status, option, audience, tier or email template ends with an `assertNever`-style guard or an exhaustive `Record`. The transition table is `Record<Status, readonly Status[]>` plus a `canTransition(from, to, actor)` helper with a test that covers **every ordered pair** of statuses.
5. **Price keys.** A `PriceKey = { option, audience, tier }` type, a helper that enumerates all 8 keys, and a test that the seeded `ticket_prices` rows are exactly those 8 (no missing, no extras, no duplicates).
6. **Money.** A branded `Cents` type (or equivalent) with one formatter. `amount_cents` integer, non-negative check, currency constant `AUD`. No floats anywhere.
7. **Row types that match reality.** Decide whether to model `Registration` as a discriminated union by status (for example `awaiting_verification` guarantees `paid_at` and a payment intent id; `refunded` guarantees `refunded_at` and `refunded_amount_cents`) for read paths, with DB `CHECK` constraints protecting the write path. Recommend a pragmatic level.
8. **Boundary types.** Typed Stripe metadata (`source`, `registration_id`), a typed audit action union, a typed set of handled Stripe event types, typed server-action input and output, and a typed parser for the `/register` query parameters.
9. **Module layout.** Propose where these live (suggestion: a `src/lib/registration/` area with `options`, `schema`, `status`, `pricing` modules), following the repo's existing structure. The constants module must be importable from both server and client code and must not import anything server-only.

> Part A delivers 1, 2, 5, 6 and 9 for the price sets (option / audience / tier). Part B delivers the rest and extends 1 and 2 to every other set.

## Security, RLS and sensitivity

- RLS enabled on every table. **No anon policies** on registrations, `stripe_events`, the audit log or the email log. Writes come only from server code using the secret key (webhook, checkout). Admins read and update through `is_admin()`.
- `ticket_prices` and the settings table: public read (the public ticket cards and the form need them), admin-only write.
- Sensitive fields: `dietary`, `dietary_details`, `access_requirements` (access answers may reveal health information), plus contact details. They must be readable only by admins. Decide whether to segregate the sensitive columns into their own table (so list queries cannot accidentally select them, and so a post-conference retention or deletion step is a single operation) and recommend yes or no with reasons.
- The audit log stores before and after values. State how sensitive fields are redacted or excluded from those snapshots.
- The success and cancelled pages (P2-18) look up a registration by an **unguessable public reference** that is separate from the primary key; design that column.
- Retention: do not decide the policy, but make sure the design can delete or null the sensitive data in bulk after the conference (card P2-25 will decide the retention plan with GANZ).

## Tables in scope (from the Trello cards)

Design all of these; migrations come later (P2-07, P2-08).

- **[PART A]** `ticket_prices`: option, audience, tier, amount in cents, currency AUD, unique per combination, RLS public read and admin write. Seeded with the 8 prices above.
- **[PART A]** A small **settings** table (single row): `current_tier`, `early_bird_closes_on` (nullable, informational), the conference + workshop capacity (27). Propose any other setting only if clearly needed.
- **[PART B]** `registrations`: one attendee per registration; the form answers; the member verification fields (name and email used to join); membership choice and the derived audience; ticket option and tier; a **price snapshot** (cents, AUD) so later admin price edits never alter past registrations; Stripe session id, payment intent id, `checkout_expires_at`; refunded amount and time; policy accepted at plus version/hash; status; the public reference; timestamps (use `set_updated_at()`).
- **[PART B]** `stripe_events`: Stripe event id unique, used for idempotency.
- **[PART B]** `registration_audit_log`: who (admin user, `system` or `stripe_webhook`), what (typed action), when, before and after.
- **[PART B]** Email log or sent flags (section 6).
- **[PART B]** Indexes: unique Checkout Session id; status; email; and whatever the capacity query needs.

## Defaults already adopted (so you do not need to ask)

These are the answers to the open questions on the P2-03 card. Treat them as decided unless the repo shows a technical reason not to.

| # | Question | Default used |
|---|---|---|
| 1 | Failed membership check: refund or charge difference | Full refund first; price-difference path designed for later |
| 2 | Admins edit attendee names for transfers | Yes, always with an audit log entry |
| 3 | Approval turnaround shown to people | 2 business days, single constant |
| 4 | Student rule | $50 "other" option removed; only Australian Gestalt students get free membership; this is main-site copy, not modelled here |
| 5 | Form fields | Exactly as in section 3 |
| 6 | Privacy policy link | Config placeholder until GANZ send it; policy text version stored on acceptance |
| 7 | Early Bird to Full switch | Manual in admin; 5 March 2027 stored as informational |
| 8 | GST and tax invoices | Amounts are final charged totals; no tax columns yet |
| 9 | Capacity | 27 total on conference + workshop; fixed setting in the DB; no waitlist |
| 10 | One attendee per registration | Yes |
| 11 | Email sender and alert address | Own domain, reply-to `contact@ganz.org.au`; alert address from config |
| 13 | Join GANZ link | Config constant, default in section 3.8 |
| 14 | Attendee accounts | No, guest checkout |
| 15 | Accommodation question | Not built |

## Out of scope (do not design or build)

Waitlist; attendee accounts; membership purchase on this site (membership is sold on the main GANZ site); scholarships; the accommodation question (section 3.9, constant only); CSV export of attendees (not in the quoted scope; confirm with me before it is ever built); admin editing of the capacity cap; the price-difference refund path beyond making sure the design can accommodate it later; Stripe receipt configuration; email template content.

## Downstream cards that consume this design

State, for each, what it needs from the model and flag anything in its current text that conflicts:

P2-07 (ticket prices migration and seed), P2-08 (registrations, `stripe_events`, audit log, email log migration), P2-09 (regenerate types, pricing logic and Vitest tests), P2-10 (admin tickets editor), P2-11 (public ticket cards), P2-12 (registration form), P2-13 (member route and Join GANZ link), P2-14 (policy checkbox and acceptance record), P2-15 and P2-15a (create registration, Checkout Session, capacity), P2-16 and P2-17 (webhook and fulfilment), P2-18 (success and cancelled pages), P2-19 (emails), P2-20 to P2-24 (admin list, detail, approve, reject and refund, edit name and resend), P2-25 (security and privacy pass), P2-26 (unit tests), P2-27 (Playwright E2E).



################################################################################
################################################################################
####                                                                        ####
####   PART A - branch `registration`                                       ####
####   ticket prices + settings migration, seed, types, pricing logic       ####
####   (P2-07 + pricing half of P2-09) - merge this first                   ####
####                                                                        ####
################################################################################
################################################################################

## Migration - ticket prices + seed the 8 prices
Goal: prices live in the database, so the admin dashboard is the single source.

Tasks

Migration for ticket_prices: option (conference_only / conference_workshop), audience (member / non_member), tier (early_bird / full), amount in cents, currency AUD, unique per combination

Small settings table holding the current tier (and early bird end date, if P2-03 item 7 says date-based)

RLS on, with public read (the public ticket cards need it) and admin-only write using is_admin()

Seed the 8 final prices (Michelle, 23 Oct):

Members: Conference only EB $485, Full $585. Conference + Workshop EB $1,085, Full $1,185

Non-members: Conference only EB $635, Full $735. Conference + Workshop EB $1,235, Full $1,335

Run npx supabase db reset locally and confirm it rebuilds cleanly, then commit the migration

Test through supabase-js with the publishable key (Studio's SQL editor bypasses RLS): anon can read, anon cannot write, admin can write

Update 2 Nov: if the Early Bird switch is date-based, seed the end date as Friday 5 March 2027 (Michelle)

Update 2 Nov: include somewhere to store the Conference + Workshop capacity of 27 (see P2-05 and P2-15a)

## Regenerate types + pricing logic with Vitest tests
Goal: one tested place in src/lib that decides what a ticket costs. The server is the only thing that ever sets the amount charged.

Tasks

Regenerate types: npx supabase gen types typescript --local > src/types/database.ts

Pure functions: get the price for (option, audience, tier); work out the current tier from the settings row and the date; format cents as dollars

Vitest tests, including: all 8 combinations, the cutoff boundary if date-based, a missing price row, and an inactive price

Make sure nothing in the client can pass an amount that gets charged, because P2-15 will recompute everything server-side

Update 2 Nov: the Early Bird close date is Friday 5 March 2027 (Michelle), so use it for the cutoff boundary test if date-based

> Part B adds the remaining Part B type regeneration, the schema/status modules and their tests.

## Ticket option, tier, audience (form Q2, required, select one)

Three closed sets combine into **8 prices**:

| Set | Keys | Labels |
|---|---|---|
| `TicketOption` | `conference_only`, `conference_workshop` | "Three-day conference only"; "Conference + two-day pre-conference workshop" (shown as a "Bundle") |
| `Audience` | `member`, `non_member` | GANZ members; Non-members |
| `Tier` | `early_bird`, `full` | Early Bird; Full Registration |

Prices (final, Michelle 23 Oct, AUD, store as cents):

| Audience | Option | Early Bird | Full |
|---|---|---|---|
| member | conference_only | 48500 ($485) | 58500 ($585) |
| member | conference_workshop | 108500 ($1,085) | 118500 ($1,185) |
| non_member | conference_only | 63500 ($635) | 73500 ($735) |
| non_member | conference_workshop | 123500 ($1,235) | 133500 ($1,335) |

Rules:
- The **form shows only the 2 options that apply to that person** (their audience, and the current tier). Example: a member registering in January sees only the two member Early Bird options. The full 8-price table stays in the public Registrations section (Michelle agreed, 6 Nov). Model a typed function such as `availableOptions(audience, tier)`.
- Early Bird closes **Friday 5 March 2027**. Default: the switch from Early Bird to Full is **manual, done by GANZ in the admin dashboard** (a `current_tier` value in a small settings table). Store the 5 March 2027 date as informational (`early_bird_closes_on`, nullable) so the logic can become date-driven later without a schema change. If it ever becomes date-driven, interpret the cutoff as end of day Friday 5 March 2027 in `Australia/Brisbane` unless GANZ say otherwise.
- The **server always decides the price and the tier**. The browser never supplies an amount. Query parameters such as `/register?option=...&audience=...` only **preselect** the form; type them with a safe parser that returns a typed value or `undefined`. *(The query-param parser is built in Part B.)*
- Scholarships are a text-only card on the public site, with no price and no registration link. Not part of this data model.
- Prices live in the database (`ticket_prices`, admin-editable in P2-10). The *keys* of a price are typed in TypeScript; the *amounts* come from the DB.

> The capacity **setting** (27) is stored in Part A's settings table; the counting rule and enforcement are Part B (see Capacity below).



################################################################################
################################################################################
####                                                                        ####
####   PART B - branch `registration-model` (after PART A merges)           ####
####   registrations, private details, stripe_events, audit log,            ####
####   email log, capacity functions, status machine, zod schema,           ####
####   query-param parser, read model, RLS tests                            ####
####   (P2-08 + rest of P2-09)                                              ####
####                                                                        ####
################################################################################
################################################################################

> **Decision (10 Nov):** `paid` is **not stored** as a status. The webhook moves `pending_payment` straight to `confirmed` (non-member) or `awaiting_verification` (member) in one transaction; "has paid" is the fact `paid_at is not null`. That leaves 8 stored statuses. P2-17 / P2-22 / P2-23 wording that says `paid` should be read as that step.

## Migration - registrations, stripe_events, audit log
Goal: the tables that hold registrations and payment records, locked down by default.

Tasks

Migrations for registrations, stripe_events (Stripe event id as a unique key, used for idempotency in P2-16), registration_audit_log (who, what, when, before and after), and the email log or sent flags

Unique index on the Stripe checkout session id; indexes on status and email

Reuse the existing set_updated_at() trigger

RLS enabled on every table with no anon policies at all. Inserts and updates come only from server code using the secret key (webhook, checkout). Admins get select and update through is_admin()

Test matrix through supabase-js with the publishable key: anon read fails, anon write fails, logged-in non-admin read and write fail, admin read works

Commit the migration files and confirm supabase db reset rebuilds everything from scratch

## Membership choice

| Key | Label shown to the person | Audience (derived) |
|---|---|---|
| `current_member` | Yes, I'm a current GANZ member. | `member` |
| `joining_member` | I'd like to join GANZ. | `member` |
| `non_member` | I'd prefer to proceed as a non-member. | `non_member` |

Rules:
- `audience` is **derived** from the membership choice, not entered separately. It selects the price column.
- Both member choices pay the member price and are then verified by GANZ **after** payment (the "option 2" member route agreed on 23 Oct: the person joins on the main GANZ site in a new tab, comes back to the still-open registration, registers at the member price and pays; GANZ confirms the membership afterwards).
- For `joining_member`, the form shows short instructions and a "Join GANZ" link that opens in a new tab. The conference site never takes membership payments and has no connection to the main GANZ site.
- GANZ members receive $150 off conference registration (the member and non-member prices differ by exactly $150 on all four ticket types).
- Membership must be active at the time of purchase (per Michelle; confirm the wording against the thread if it matters).
- Membership verification uses **name and email only**: the name and email the person used to join GANZ. No membership order number (Michelle, 6 Nov; about 216 members, the name is enough). The UI may offer a "same as my details" convenience button; that is UI only and does not change the model.

## Capacity

- **Conference + workshop is capped at 27 places in total**, shared across all four of its prices (member/non-member x Early Bird/Full). It is 27 in total, **not** 27 per price.
- The venue holds 30. Three places are held outside the system for Michelle, Tegan and Zoë, so there are no database rows for them.
- Conference only has **no limit**. No waitlist.
- The form and the public ticket cards show **how many places are left** on conference + workshop (Michelle's request, replacing the form's old "limited to 30 spaces" line), then a sold-out state with conference only still available. The remaining count is derived from the same counting rule as enforcement, never stored.
- Default: the cap is a **fixed setting stored in the DB settings table, changed by me, not editable by GANZ in the admin dashboard**.
- Counting rule (default, plan must confirm or refine): places taken = registrations on `conference_workshop` in a status that holds a place. Holding statuses: `pending_payment` with an **unexpired** Checkout Session, `paid`, `confirmed`, `awaiting_verification`, `approved`. Releasing statuses: `abandoned`, `rejected`, `refunded`, `cancelled`. Pending registrations therefore need a stored `checkout_expires_at`.

## Attendee details (form Q3 to Q6)

| Field | Required | Type | Notes |
|---|---|---|---|
| Full name | yes | short text | "The name you'd like us to use for your registration and name badge." |
| Pronouns | no | short text | Listed on the name badge if provided |
| Email | yes | email | Used for confirmation and important conference information |
| Phone | no | short text | For urgent conference communication only |

One attendee per registration (groups register separately). Guest checkout, no accounts.

## Dietary (form Q7 required multi-select, Q8 optional long text)

| Key | Label |
|---|---|
| `none` | No dietary requirements |
| `vegetarian` | Vegetarian |
| `vegan` | Vegan |
| `gluten_free` | Gluten-free |
| `other` | Other dietary requirement or food allergy |

Rules: select all that apply, at least one selection required. `none` is **exclusive** (cannot be combined with any other value); enforce this in the form schema and in the DB. Q8 `dietary_details` is optional long text (Michelle: "optional, but helpful if you selected any requirements"). Default: do not require details even when `other` is chosen.

## Access requirements (form Q9, optional long text)

Free text about access, adjustments and sensory or participation needs. Optional, as much or as little as the person wishes.

## About you (form Q10 and Q11, both optional, select one)

`ConnectionToGestalt` (Q10: "What best describes your current role or connection to Gestalt practice?"):

| Key | Label |
|---|---|
| `gestalt_practitioner` | Gestalt practitioner / psychotherapist |
| `gestalt_student` | Gestalt student or trainee |
| `educator_supervisor` | Educator / supervisor |
| `researcher_academic` | Researcher / academic |
| `interested_not_practising` | Interested in Gestalt but not currently practising |
| `other_mental_health_professional` | Other counsellor/psychotherapist/mental health professional |
| `other` | Other |

`HeardAbout` (Q11: "How did you hear about the conference?"):

| Key | Label |
|---|---|
| `ganz_newsletter` | GANZ newsletter or email |
| `social_media` | Social media |
| `colleague_friend` | Colleague or friend |
| `training_institute` | Gestalt training institute |
| `other` | Other |

The "Other" options have **no free-text field** in the client's form; do not add one. Optional means nullable, and an empty submission is stored as `null`.

## Policies and consent (form Q12 to Q14)

- Q12 is a privacy statement (display only).
- Q13 is the cancellation policy plus a **required checkbox**: "I have read and agree to the above privacy and registration and cancellation terms. I understand that conference registrations are non-refundable."
- Store, per registration, when the policy was accepted and **which version of the text** was shown (a version label and/or a hash of the exact text, since the policy text will be CMS-editable in P2-14). The server rejects a submission without acceptance.
- Q14 is payment via Stripe Checkout.
- A full-privacy-policy link is still pending from GANZ; use a config placeholder. The Join GANZ link default is `https://www.ganz.org.au/product-category/membership-options/` (suggested by Zoë; not yet formally confirmed). Both are config constants, not DB fields.

## Parked: accommodation interest (do not build)

Zoë (9 Nov) asked about capturing a price range so GANZ can estimate hotel rooms. **Not agreed, default is not to build until GANZ answer my questions.** Define the constant for completeness but keep it out of the schema and out of the form:

`AccommodationRange`: `premium`, `high`, `low`, `billeting` (labels: Premium, High, Low, Billeting).

In the plan, state in one short paragraph how it would be added later as an additive, nullable column plus a privacy-statement line, with no breaking change.

---

## Registration lifecycle (state machine)

Candidate statuses, from the Trello card (the plan must produce the final list and may justify changes):

`pending_payment`, `paid`, `confirmed`, `awaiting_verification`, `approved`, `rejected`, `refunded`, `abandoned`, `cancelled`.

Intended flow:
- `pending_payment` -> `paid` on Stripe `checkout.session.completed` (payment status paid, and the amount equals the registration's price snapshot).
- `paid` -> `confirmed` for non-members; `paid` -> `awaiting_verification` for members.
- `awaiting_verification` -> `approved` (admin approves) or `rejected` (admin rejects).
- `rejected` -> `refunded` (full refund by default; the refund result arrives via the `charge.refunded` webhook).
- `pending_payment` -> `abandoned` on `checkout.session.expired`.
- A refund done from the Stripe dashboard must also sync to the site, so `charge.refunded` can move `confirmed`, `awaiting_verification` or `approved` to `refunded`, and records the refunded amount.
- `cancelled` exists for GANZ-side cancellation handled case by case; define who can trigger it.

The plan must:
- Decide whether `paid` is a stored status or a transient step, and whether `approved` and `confirmed` stay separate. **Default: keep the single status machine with these names**, because P2-17, P2-22 and P2-23 already reference them. If you recommend a two-axis alternative (payment status plus a separate membership verification status), present it as an option with the downstream card impact, but do not adopt it unless you find a concrete problem.
- Provide the transition table as data: allowed `(from, to)` pairs with the allowed actor. Late or duplicate Stripe events must never move a registration backwards, and an unknown registration id or an amount mismatch must be flagged for manual review, not silently accepted.
- Say which statuses hold a capacity place (section 3.3), and which are terminal.

**Design question to resolve explicitly: one payment per registration, or a payments child table?** P2-03 item 1 says that when a membership check fails GANZ may either refund in full (**default, build first**) or **charge the $150 price difference** so the person becomes a non-member registration. Note that P2-23 currently words the second option as "a partial refund of the $150 difference", which looks like a slip (the member paid $150 *less* than the non-member price, so the difference would be an extra charge, not a refund). Default flat columns (one Checkout Session and one payment intent per registration) are fine for the default path, but tell me exactly what would have to change to support a second payment later (for example a `registration_payments` table) and recommend whether to pay that cost now.

---

## Payments (Stripe) constraints that affect the model

- Stripe Checkout (hosted). Prices are sent from the database as dynamic price data, so there are no Stripe Products to sync.
- Our Checkout Sessions carry the registration id in `client_reference_id` and in metadata, plus a constant `metadata.source = 'ganz-conference-2027'`.
- Webhook events to handle: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`. Idempotency: the Stripe event id is a unique key in `stripe_events`.
- Unique index on the Checkout Session id. Store the payment intent id (and a charge id if the plan decides refund correlation needs it). Store `refunded_amount_cents` and `refunded_at`.
- **Shared Stripe account.** GANZ's Stripe account appears (from the dashboard logs) to be used mainly by WooCommerce on their main WordPress site, so our webhook endpoint will receive events for payments that have nothing to do with the conference. This is something I observed, not yet confirmed with GANZ. Consequences the plan must design for:
  - The handler ignores any event whose object lacks our `source` metadata (return 200, change nothing).
  - `stripe_events` stores the event id, type, received time, outcome (`processed`, `ignored`, `needs_review`, `error`) and `registration_id` when relevant. **It must not persist the raw payload of unrelated events** (they contain other people's payment details). Decide whether to store payloads for our own events at all, and if so minimise them.
  - No personal data or secrets in logs.
- Whether Stripe's own receipt email is on is decided in P2-19, not here. Do not model receipts, except note whether a stored receipt URL is worth having.
- GST: whether prices are GST-inclusive and whether tax invoices are needed is still unanswered (P2-03 item 8). Default: treat each amount as the **final charged total** in cents, with no separate tax columns. State exactly which columns or tables would be added if tax invoices turn out to be required.

## Email (Resend) constraints that affect the model

Typed set `EmailTemplate` (from P2-19):

| Key | When |
|---|---|
| `non_member_confirmation` | Non-member payment confirmed (confirmation and receipt) |
| `member_payment_received` | Member paid, membership pending verification (shows the turnaround) |
| `membership_approved` | Admin approved |
| `membership_not_verified` | Admin rejected (refund path) |
| `refund_processed` | Refund completed |
| `admin_new_registration_alert` | Internal alert to GANZ |

Defaults: sender on the `ganzconference2027.com.au` domain with reply-to `contact@ganz.org.au`; the alert recipient is not yet known, so it comes from config (`ADMIN_ALERT_EMAIL`). The approval turnaround shown on the form and in emails defaults to **2 business days** (Zoë suggested 24 to 48 hours; not yet confirmed by Michelle); keep it as one constant, not scattered strings.

The plan must design an **email log** (or sent-flags) that supports: logging every send, retry on failure without ever failing the webhook, idempotent automatic sends (do not double-send on a replayed webhook), and deliberate manual resends from the admin (P2-24). Say what the idempotency key is.

## Worked scenarios the model must handle

Walk each one through the statuses and tables in the plan and confirm it works:

1. Non-member, conference only, Early Bird, pays $635 -> confirmed, place count unchanged.
2. Member (`current_member`), conference + workshop, Full ($1,185), when 26 places are taken: succeeds and takes the 27th; the next person sees conference + workshop as sold out and is offered conference only.
3. Two people submit for the last place at the same moment: exactly one gets a Checkout Session.
4. A `joining_member` abandons checkout; the session expires and the place is released.
5. A member fails verification: rejected, full refund of the amount paid, refunded, place released, correct email sent once.
6. The same `checkout.session.completed` webhook is delivered twice, and one arrives out of order after the status has already moved on: only one state change happens.
7. GANZ edit a price in admin while someone is mid-checkout: the in-flight registration keeps its snapshot price and the webhook amount is verified against the snapshot.
8. Admin corrects an attendee's name for a written transfer request: audit entry records old and new values and who.
9. A refund is made from the Stripe dashboard instead of the admin: the site syncs through `charge.refunded`.
10. A WooCommerce payment event from the shared Stripe account hits the webhook: ignored, nothing stored beyond the minimal event record, no personal data logged.
11. Early Bird is switched to Full by GANZ: new registrations use Full prices; existing ones are unchanged.