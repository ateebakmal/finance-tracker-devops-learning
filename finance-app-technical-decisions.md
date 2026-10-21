# Personal Finance App — Technical & Internal Design Decisions

> Companion to the feature spec. This file records the **engineering decisions**
> (how the data is stored, how login works, how we keep the data trustworthy) and
> the reasoning behind each — so it can be handed to future chats / Claude Code.
> The feature spec says *what* the app does; this file says *why it's built this
> way*. Terms are explained the first time they appear.

---

## Core Principle: Calculate Numbers, Don't Store Them

Some values in the app are **facts we record** (a transaction happened: 500 rupees,
food, June 3rd). Others are **summaries of those facts** (your balance, how much
you spent this month, how much is left in a budget). The rule:

**We only ever save the facts. Every summary is calculated fresh from those facts
when the screen needs it — never saved.**

Why not save the summaries too (e.g. keep a `total_balance` number updated as you
go)? Because the moment you store the same information in two places — the
transactions *and* a running total — the two can disagree. Any bug, crash, or
missed update leaves the saved total wrong, and wrong silently, with no way to
notice until much later. Keeping one authoritative copy of each fact and
calculating everything else from it means nothing can fall out of sync.

The worry is "won't recalculating be slow?" — no. Adding up a few thousand rows is
work a database does in a fraction of a millisecond, and your dashboard is only
loaded a handful of times a day. We'd only be trading that tiny, invisible cost
for a permanent risk of wrong numbers. Not worth it.

A nice bonus: **there's no monthly "reset" to build.** "Spent this month" is just
"add up transactions dated on or after the 1st of this month." When a new month
starts, that same calculation naturally only picks up the new month's rows. No
scheduled job at midnight, no reset button, no special handling — the problem
simply doesn't exist because we never stored a monthly total in the first place.

(If we ever *measure* that a calculation is genuinely too slow — unlikely here —
there's a ladder of fixes to climb, cheapest first: add an index, then let the
database maintain a pre-computed view, and only as a last resort hand-maintain a
stored total. We start at the bottom of that ladder and only climb if forced.)

---

## Keeping the Data Trustworthy (Referential Integrity)

"Referential integrity" just means: the database never contains a reference that
points to something that doesn't exist (a transaction pointing at a deleted
category, a tag that was removed but still attached to rows, etc.).

Two guiding ideas:

- **Let the database enforce the rules, not just the app code.** Every change to
  the data — whether from your app, a one-off fix you run by hand, or a second
  program you add next year — passes through the database. App code is only *one*
  of those paths. So a rule enforced *in the database* can never be bypassed,
  while a rule enforced only in app code can be. A **foreign key** (a column that
  says "this must point to a real row in that other table") is the database
  enforcing it for you, automatically, at the moment of every write.
- **Design so a bad value literally can't be entered**, rather than trusting code
  to remember not to enter it.

### Tags use a "junction table," not a list
A transaction can have many tags, and a tag can be on many transactions
(a "many-to-many" relationship). It's tempting to store the tags as a list inside
the transaction row (e.g. a text field `"food,urgent"` or an array of tag IDs).
Don't — because the database can't guarantee integrity on items *inside* a list.
A foreign key checks a whole column value, not each element in a list, so if a tag
is deleted, the list quietly keeps pointing at the now-missing tag and nothing
catches it.

The fix is a small in-between table (a **junction table**) called
`transaction_tags`, where each row links one transaction to one tag. Now both
sides are real foreign keys the database enforces. Delete a tag and its link rows
are cleanly removed automatically. The same approach is used for template tags
(`template_tags`). Each pair (transaction + tag) is only allowed once, so you
can't accidentally attach the same tag twice.

### What happens on delete (CASCADE vs RESTRICT)
For each link, we decide what a delete does. Two behaviors:
- **RESTRICT** = refuse the delete if things still depend on it.
- **CASCADE** = automatically delete the dependent rows too.

Decisions:
- Deleting a category that still has transactions → **RESTRICT** (never leave
  financial records pointing at nothing, and never silently move them elsewhere).
- Deleting a category that still has sub-categories → **RESTRICT** (or make the
  user move them first).
- Deleting a tag → **CASCADE** its link rows in the junction table (clean, safe).
- Deleting a profile (a feature we're deferring) → either delete everything under
  it or archive it; decided later, with the feature.

---

## How Money Is Stored

- Money is stored as a **whole number of paisa** (the smallest unit), never as a
  decimal. Decimals (`10.10`) are stored on computers in a way that causes tiny
  rounding errors that accumulate — a well-known source of money bugs. So 1 rupee
  is stored as `100`. The UI turns it back into "Rs 1.00" for display.
- The stored amount is always **positive**. Whether it's money in or money out is
  recorded in a separate field, `transaction_type` (income or expense). So your
  net is "add up all income, subtract all expenses." (We use an explicit
  income/expense field rather than storing negative numbers for expenses — it's
  harder to introduce a sign mistake, easier to filter, and leaves room for a
  future "transfer" type.)
- **The list of transactions is the single source of truth for how much money you
  have.** The balance is always calculated from that list, never stored as an
  editable number. This is the same principle behind traditional accounting
  ledgers: keep the record of what happened, and derive the totals from it — which
  also means every number you show can always be traced back to the exact rows
  that produced it.

---

## How Dates and Times Are Stored

There are two different kinds of "time" here, and mixing them up causes
off-by-one-day bugs in reports.

- **A moment something happened in the system** — like when a row was created
  (`created_at`). Store these in **UTC** (a single worldwide reference time, so
  there's no ambiguity) and convert to Pakistan time only when showing it on
  screen. Don't hard-code "+5 hours" anywhere — store the neutral UTC value and do
  the conversion at the edge. (Pakistan is UTC+5 with no daylight-saving today,
  but it has changed before and could again, so we don't bake the offset in.)
- **The day a transaction belongs to** (`transaction_date`) — this is a plain
  **calendar date** the user picks, like "June 30", with no time attached. Store
  it as a `DATE` (just the day, no clock, no timezone). Here's why this matters: if
  you stored it as a precise moment instead, an expense entered at 2am on July 1st
  in Pakistan is actually still "June 30, 9pm" in UTC — and a report that groups by
  UTC would wrongly file it under June. Storing the user's chosen calendar day
  avoids that entirely.

Rule of thumb: is the field *a moment in time* (store UTC) or *a calendar day a
human picked* (store a plain date)?

---

## Login (Google sign-in only)

We only support "Sign in with Google." A few decisions:

- **We identify a user by Google's permanent ID for them (`google_sub`), not by
  their email.** Google gives each account a stable ID that never changes; email
  addresses *can* change. Using email as the identity is a classic mistake — if
  someone changes their Gmail, they'd look like a brand-new person. So `google_sub`
  is the real identity; email is just stored for display/contact.
- **No password field.** Google handles the password; we never see or store one.
- **We don't store any Google tokens.** We use Google only to *prove who the user
  is* at login — we never call Google's services on their behalf afterward — so
  there's nothing from Google worth keeping.
- We do store, for display: name, email, and profile picture.

### Staying logged in: access tokens and refresh tokens
After Google proves who you are, our own server takes over the session with two
of its own tokens (a token is just a signed string that proves "this request is
from this logged-in user").

- **Access token** — a short-lived token (about 15 minutes) sent with every
  request to prove you're logged in. It's a **JWT** ("JSON Web Token"): a bundle of
  facts (your user ID, an expiry time) that our server *signs*, so the server can
  later check the signature and trust it without looking anything up in the
  database. That's what makes it fast. The downside of not checking the database
  each time is that you can't easily cancel one mid-life — so we keep it
  short-lived to limit the damage if it's ever stolen.
- **Refresh token** — a long-lived token (say 2–4 weeks) used *only* to get a
  fresh access token when the old one expires, so the user isn't forced to log in
  again every 15 minutes. Because this one lasts a long time, we make it
  **cancellable**.
- **Where refresh tokens live (server side):** in their own `sessions` table, one
  row per device you're logged in on. We store a scrambled (hashed) version of the
  token, not the real one — same way you'd store a password — plus which user it
  belongs to and when it expires. One row per device gives us multi-device login,
  the ability to log out a single device, and a "log out everywhere" option. (This
  is why a single `refresh_token` column on the user record is the wrong shape — it
  can't do any of that.)
- **Rotation:** every time a refresh token is used, we hand out a new one and
  retire the old. If an already-used (retired) one ever shows up again, that's a
  sign it was stolen and copied — so we cancel that whole session. This turns
  refresh tokens into their own theft alarm.
- **Where tokens live in the browser:** the refresh token goes in a special cookie
  that JavaScript is not allowed to read (an "httpOnly" cookie), so even if a
  malicious script sneaks onto the page it can't steal it. The access token is kept
  only in memory (a variable in the running app), never in `localStorage` (which
  any script can read). When the app reloads, it quietly uses the refresh cookie to
  get a new access token.
- **The automatic loop:** when a request fails because the access token expired,
  the app's shared network layer silently fetches a new one and retries — the user
  never notices. (This is the same shared network layer that attaches the login
  token to every request.)
- **On the backend (FastAPI):** one reusable piece checks the token and loads the
  user (that's *authentication* — "who are you"); on top of it sits the
  active-profile check (that's *authorization* — "are you allowed to touch this
  profile's data"). A library handles the Google sign-in handshake so we don't
  hand-roll the security-sensitive parts.

---

## Who Owns What (Scoping)

- **A user owns their profiles** (e.g. "Personal", "House") — and nothing else
  directly.
- **A profile owns everything financial**: its categories, tags, transactions,
  budgets, and recurring templates.
- Every one of those tables carries a `profile_id` so each row belongs to exactly
  one profile. Switching profiles simply filters everything by the active profile,
  which is why profiles stay completely separate.
- **Every request is scoped to the active profile** by one reusable backend check:
  confirm who the user is → figure out which profile is active → confirm that
  profile actually belongs to this user → only then show/allow that profile's data.
  That "belongs to this user" step is the important guard against someone trying to
  reach another user's data.

---

## Categories (the income/expense tree)

- Categories form a **tree**: a category can have a parent, so "Bills" can contain
  "Electricity". This is done with a `parent_id` column that points back to another
  row in the same categories table (a category pointing at its parent category).
  Top-level categories have no parent.
- A transaction is tagged with **one** category — the most specific one you picked
  (the child if you chose a child, the parent if you stopped at the parent). We do
  **not** also copy the parent onto the transaction; the tree already knows each
  category's parent, and storing it twice would just be a second copy that can go
  out of date.
- **Filtering or budgeting by a parent automatically includes everything under
  it.** Asking for "Bills" means "Bills and all its children" — worked out at the
  moment of the query by walking down the tree. So you get both parent-level and
  child-level views from the single category stored on each transaction.
- Categories are **per-profile** — each profile has its own separate list, filled
  with a starter set when the profile is created.
- **Current usage note:** for now categories are being used for one transaction
  type only (the rest added later if wanted). The categories table has no
  income/expense field on it, so this is purely a choice about what starter data to
  create and what the picker shows — it doesn't change the table. (Double-check the
  intended type matches the mockup, which showed *expense* categories like Bills,
  Food, Transport.) If categories ever need to be locked to income-only or
  expense-only, that's the point to add a type field to the categories table.

---

## Budgets

- A budget just stores a **limit** for a category and how often it applies
  (weekly or monthly). It never stores how much you've *spent* — that's calculated
  from your transactions whenever you view the budget.
- **Decision for v1: a budget is a standing rule, not a per-month record.** "Food,
  monthly, 20,000" means "in whatever month I'm looking at, Food should stay under
  20,000," and spending is added up for that month on the fly. The trade-off: the
  limit is the same every month and there's no saved history of past months'
  limits — fine for now. (Supporting different limits per month, with history,
  would mean adding a "which month" field and a row per month — deferred.)
- A budget on a parent category covers the parent and all its children (an
  umbrella over the whole branch).
- If you budget both a parent and one of its children, don't add the two limits
  together — the child's spending is already inside the parent's, so they overlap.
- Only one budget per category per cadence (you can't have two "Food monthly"
  budgets).

---

## Recurring Transactions (quick-entry templates)

- A "recurring transaction" here is a **template** — a saved shortcut for entering
  a transaction quickly. It is **not** a reminder and does **not** create anything
  automatically on a schedule.
- It stores the same details as a transaction except the date: a name (like
  "Rent"), amount, income/expense, category, an optional default note, optional
  tags, and an optional cadence label (weekly/monthly) used only for grouping the
  list — there's no scheduler behind it.
- Templates are per-profile.
- When you use a template it fills in the new-transaction screen (stamped with
  today's date), you confirm or tweak, and it saves as a completely normal
  transaction. That saved transaction keeps an optional link back to the template
  it came from (handy later; harmless if unused).

---

## The Income/Expense Field (shared by transactions and categories)

Both transactions and categories carry an income/expense value. These aren't two
unrelated fields that happen to look alike — they're **the same idea** (the
income-vs-expense direction) used in two places, and they have to agree (an
expense transaction should use an expense category). So we define the allowed
values **once** and both use that one definition. Defining them separately would
risk the two drifting apart over time.

- **How it's stored:** the value is kept as ordinary text limited to the two
  allowed words by a **CHECK rule** on the column — a small rule the database
  enforces that says the value must be either `'income'` or `'expense'` and rejects
  anything else. In the app code, those two allowed words are written in exactly
  one place so the list never gets duplicated.
- **Why text-with-a-rule instead of the database's built-in fixed-list type:** the
  built-in type (called an "enum") works, but *changing* the allowed list later in
  PostgreSQL is a genuine hassle. The text-plus-rule approach gives the same
  guarantee (nothing outside the two values can ever be saved) while being easy to
  change later.
- **Why not a separate lookup table for the two values:** a whole extra table
  would only earn its keep if the list were long, frequently changing, or needed
  extra info per value (a color, an icon, a sort order). Income/expense is a tiny,
  fixed, plain pair — a table would be over-engineering.
- **The one thing that would make us revisit this:** if transactions later gain a
  third value like "transfer" but categories should *not* have it, the two would
  stop being identical — and that's the moment to split them apart or tighten the
  rule on categories. We don't build for that now; "transfer" is just the signal to
  come back to it.

The matching rule itself — "an expense transaction must use an expense category" —
is checked in the app code when saving, since a plain foreign key can't express
"and their types must match."

---

## First-Time Setup (onboarding)

- A single true/false field on the user, `setup_completed` (starts false), is the
  one place that records whether they've finished the initial setup.
- Every time the app loads, it asks the server "who am I and is my setup done?" and
  routes accordingly. A not-yet-set-up user is sent into the setup flow no matter
  what web address they try — because this check lives on the server, they can't
  skip it by typing a different URL or clearing browser data.
- Finishing *or* skipping setup flips the field to true; the only difference is how
  much starter data got created.
- The app is essentially unusable without a profile anyway (every transaction needs
  one), so the setup flow isn't really a gate we bolt on — it's making that
  unavoidable first step pleasant instead of a wall of errors.
- The setup flow creates the first profile and its starter categories. As a safety
  net, if someone skips everything, we still auto-create a default "Personal"
  profile so there's always one.
- For v1 we don't save partial progress through the wizard — if abandoned it starts
  over, with each step skipping work that's already been done so nothing is
  duplicated.

---

## Platform & Delivery

- **A website built for phones first**, using React and Tailwind CSS, talking to a
  single backend and single database.
- We'll make it an **installable web app** ("PWA" — a website that can be added to
  your phone's home screen and opens full-screen like an app), so it feels like a
  real app without building a separate native one.
- **We are not using React Native** (the tool for building true native iPhone/
  Android apps) for v1. It adds a whole extra world of tooling that has nothing to
  do with the goal of learning the backend, and getting a native app onto an iPhone
  without a Mac needs either a paid Apple developer account or a fiddly, expiring
  free workaround. We'd only revisit this if we truly needed native-only features
  (fingerprint unlock, native notifications, solid offline use, or App Store
  distribution).
- **Desktop layout is deferred.** The phone-first site already opens on a computer
  (just as a narrow column); making it look good on wide screens is a nice add-on
  later that teaches nothing about the backend, so it's out of v1.

---

## How the Code Is Organized

- **One app, split into tidy modules** (sometimes called a "modular monolith"):
  a single backend and database, with shared plumbing (login, database connection,
  config) in one place, and the finance feature as its own self-contained section
  under web addresses starting `/api/finance/`. A future "app" (e.g. groceries)
  drops in as another section without a rewrite.
- **The frontend is organized by feature too**, with one shared network layer that
  attaches your login to every request (so no feature has to redo that). The only
  thing the frontend must line up with is those `/api/...` address prefixes.
- **Optional convenience:** the backend can automatically publish a description of
  all its endpoints, and a tool can turn that into matching frontend code — so if
  the backend changes shape, the frontend shows an error at build time instead of
  breaking silently. Worth doing once the design settles.

---

## Indexing (making lookups fast)

An **index** is a behind-the-scenes lookup structure the database keeps so it can
find rows fast, the way a book index lets you jump to a page instead of reading
every page. It speeds up reading but slightly slows down writing (the index must be
updated too), so you add them deliberately, not everywhere.

Guiding rules:
- Index the columns you **search by, join on, or sort by**.
- PostgreSQL automatically indexes primary keys and "must be unique" columns, but
  **not** ordinary foreign-key columns — so index the foreign keys you actually
  search through.
- When an index covers several columns, list the "must equal exactly" ones before
  the "falls in a range" ones (e.g. `(profile_id, transaction_date)`: profile is an
  exact match, date is a range).
- **Don't add indexes on a hunch.** Add the ones below; add more only when a real
  query is measured to be slow.

**Already automatic (nothing to do):** every `id`; the user's `google_sub` and
`email` (both unique — and `google_sub` being indexed is what makes login fast).

**Most important (the busiest queries):**
- `transaction (profile_id, transaction_date)` — powers the period reports and
  date-range filters. The main one.
- `transaction (profile_id, category_id, transaction_date)` — powers budget
  "spent" and per-category breakdowns for a period. (Can start without the date and
  add it if needed.)
- `transaction_tags` — index it both ways: the pair `(transaction_id, tag_id)` for
  "the tags on this transaction" (and to block duplicates), plus `(tag_id)` for the
  reverse "which transactions have this tag."
- `category (parent_id)` — for walking the tree to find a category's children.
- `profile (user_id)` — for listing a user's profiles.

**Medium (foreign keys / list screens; some double as uniqueness rules):**
- `tag` unique on `(profile_id, tag_name)` — blocks duplicate tag names and speeds
  listing.
- `budget` unique on `(profile_id, category_id, budget_type)` — blocks duplicates
  and speeds lookups.
- `category` on `profile_id` (or unique on `(profile_id, parent_id, category_name)`)
  — for listing a profile's categories.
- `recurring_transaction_template` on `profile_id` — for listing templates.

**Low / only if needed:**
- `transaction (source_template_id)` — only if you build the "transactions made
  from this template" view.
- Don't index the income/expense column on its own — with only two possible values
  it barely helps; it works fine as part of the combined indexes above.

---

## Schema Reference (target tables)

Reflects the agreed structure. Items marked **(add)** are recommended additions not
yet in the diagram. All `created_at`/`updated_at` are stored in UTC;
`transaction_date` is a plain user-picked calendar date.

**users**
- `id` (primary key)
- `google_sub` (unique) ← the real identity, from Google
- `email` (unique) ← for display/contact; can change
- `name`, `picture` **(add — shown in the UI)**
- `setup_completed` (true/false, starts false)
- `refresh_token` — **remove this**: replaced by the `sessions` table below
- `created_at`, `updated_at`

**sessions** **(add — holds refresh tokens)**
- `id` (primary key), `user_id` (→ users)
- `token_hash` (scrambled refresh token, never the real value)
- `expires_at`, `created_at`, optional device info
- One row per logged-in device; delete a row to log that device out.

**profiles**
- `id` (primary key), `user_id` (→ users)
- `profile_name` (required)
- `created_at`, `updated_at`

**categories**
- `id` (primary key), `profile_id` (→ profiles)
- `category_name` (required)
- `parent_id` (→ categories; empty for top-level) ← the tree link
- `created_at`
- Consider requiring names unique within `(profile_id, parent_id)`.
- Deleting one that has transactions or children → refuse (RESTRICT).

**tags**
- `id` (primary key), `profile_id` (→ profiles)
- `tag_name` (required)
- `created_at`
- Unique on `(profile_id, tag_name)` **(add)**

**transactions**
- `id` (primary key), `profile_id` (→ profiles), `category_id` (→ categories)
- `amount` (whole-number paisa, always > 0)
- `transaction_type` (text limited to income/expense by a CHECK rule)
- `transaction_date` (plain date the user picked)
- `notes` (optional)
- `source_template_id` (→ recurring_transaction_template; optional/empty)
- `created_at` **(add — the audit moment, separate from transaction_date)**
- Deleting a category still used here → refuse (RESTRICT).

**transaction_tags** (the transaction↔tag link table)
- `transaction_id` (→ transactions), `tag_id` (→ tags)
- The pair `(transaction_id, tag_id)` is the key, so no tag repeats on a
  transaction. (Fix the `transacton_id` typo.)
- Deleting either side removes the link row automatically (CASCADE).

**budgets**
- `id` (primary key), `profile_id` (→ profiles), `category_id` (→ categories)
- `budget_name` (required)
- `budget_limit` (whole-number, > 0, required)
- `budget_type` (weekly / monthly) ← how often; no "which month" stored
- `created_at`
- Unique on `(profile_id, category_id, budget_type)` **(add)**

**recurring_transaction_template**
- `id` (primary key), `profile_id` (→ profiles), `category_id` (→ categories)
- `name` **(add — required; the label you pick from the list)**
- `amount` (whole-number paisa, > 0)
- `transaction_type` (income/expense, same CHECK rule)
- `default_note` **(add — optional)**
- `cadence` (weekly / monthly) **(add — optional, just for grouping)**
- `created_at` **(add)**

**template_tags** (the template↔tag link table) **(add — mirrors transaction_tags)**
- `template_id` (→ recurring_transaction_template), `tag_id` (→ tags)
- The pair is the key; deleting either side removes the link (CASCADE).
