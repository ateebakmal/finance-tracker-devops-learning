# Personal Finance App — Feature Reference

> A living reference for what we're building. Feature- and behavior-focused,
> not a schema or API spec. Use this to onboard future chats and Claude Code.

---

## 1. Overview

A personal finance tracker for a single user, mobile-first (also usable on web).
The user logs in once and manages one or more **profiles** (e.g. "Personal",
"House") to keep separate areas of their financial life fully isolated from each
other. Within a profile, they record transactions, organize them with a category
tree and tags, set budgets, save reusable recurring templates for fast entry, and
view reports.

**Currency:** PKR (Pakistani Rupee), single currency for v1.

**Core philosophy:** The only things ever written are transactions and definitions
(profiles, categories, tags, budgets, templates). Everything a user *reads* —
balance, period net, budget progress, breakdowns — is **computed from transactions
at read time**, never stored. Nothing derived is persisted, so nothing can desync.

---

## 2. Scope & Ownership Model

The single most important structural rule. Everything hangs off it.

- **User owns:** Profiles (and nothing else directly).
- **Profile owns:** Categories, Tags, Transactions, Budgets, Recurring Templates.

Consequence: switching the active profile swaps the *entire* world — transactions,
budgets, templates, **and** the category/tag lists you pick from. Profiles are
fully isolated at both the data level and the interface level. The House profile
never sees Personal's categories, tags, transactions, or reports, and vice versa.

Every request follows one uniform scoping rule:
`verify user → resolve active profile → confirm profile belongs to this user →
scope everything to that profile.`

---

## 3. Authentication & User

- Google (Gmail) login via OAuth.
- Single user account per login — no household sharing, no multiple real users.
- Auth handled once in a shared core layer; every request is scoped to the user
  and their active profile.

---

## 4. Profiles

- A user can create multiple profiles to separate areas of finance (e.g.
  Personal vs House).
- **Profiles are a v1 requirement**, not optional.
- Exactly one profile is "active" at a time; it determines what data is shown.
- On first login, a default profile (e.g. "Personal") is auto-created so there's
  always an active profile and no empty state.
- New profiles are **seeded with a starter set of categories** (Food, Bills,
  Transport, etc.) so they aren't empty on creation; the user can then edit/delete
  freely within that profile.
- Full isolation: no cross-profile data or vocabulary leakage. Reports are always
  single-profile by default.

*(Deferred: profile deletion — needs a "what happens to the data" decision
(cascade vs archive) before building.)*

---

## 5. Transactions

The core entity. A record of money that moved.

Fields (behavioral, not schema):
- **Amount** — stored as integer PKR (paisa-level precision, never floats, to
  avoid floating-point money bugs).
- **Type** — income or expense. Required. This is the axis all reporting measures
  along (net = income − expense).
- **Date** — when it happened. Drives all period filtering and reports.
- **Category** — exactly one, always the *most specific* node chosen (see §6).
- **Tags** — zero or more (see §7).
- **Note** — optional free text.
- **Source template link** — optional; if the transaction was created from a
  recurring template, it remembers which one (for future "logged N times" views).

Behavior:
- Adding a transaction writes *only* the transaction. It never updates budgets,
  balances, or any running total — those are computed on read.
- An ATM withdrawal / moving your own cash around is **not** a transaction (net
  worth doesn't change). Only actual income and spending are recorded. (This is
  why v1 has no accounts — see §12.)

---

## 6. Categories

- A **self-referential tree**: each category can have a parent, enabling
  "Bills → Electricity", "Bills → Gas", etc. Supports more than two levels.
- **Per-profile** — each profile has its own fully isolated category list.
- Full CRUD — the user creates/edits/deletes their own categories and
  subcategories per profile.

**Selection (on a transaction):**
- The user may pick **any node** — a parent *or* a leaf. Spending can sit directly
  on a parent ("Bills") when no child fits.
- The transaction stores only that single chosen node. The parent is never copied
  onto the transaction (the tree already knows each node's parent — single source
  of truth).
- **UI pattern:** tap a parent → the UI lets you either keep the parent as the
  category or drill into a child. A cascading/browsable picker that allows stopping
  at any level.

**Parent-level filtering & rollups:**
- Filtering or budgeting by a parent resolves to *that node plus all its
  descendants*. So "Bills" includes Electricity + Gas + Water **and** anything
  logged directly to Bills.
- This gives both parent-level and child-level views from a single stored field,
  with no redundant data.

---

## 7. Tags

- Lightweight, cross-cutting labels (e.g. #reimbursable, #shared, #urgent, #gift).
- **Per-profile** — each profile has its own tag vocabulary.
- Many tags per transaction.
- Used as a filter dimension across transactions and reports.

---

## 8. Budgets

- A budget is a **limit attached to a category, for a period** (e.g. a monthly
  cap). It stores *only* the target amount — never a running "spent" total.
- **Per-profile** — the category is a profile's category; the limit belongs to the
  profile.
- **"Spent so far" is always computed** from transactions: sum of expenses in that
  category (including descendants) within the period. Adding a transaction requires
  **zero** budget updates.
- **Parent budgets act as umbrellas:** a budget on "Bills" counts all its
  descendant spending plus anything on Bills directly. A budget on a child is a
  tighter sub-limit inside that umbrella.
- Nested budgets (parent + child both budgeted) must **not** be summed into a grand
  total — they overlap; show them nested, not added.
- Budgets apply to **expenses only** (you don't budget income).

---

## 9. Recurring Transactions (Templates)

Templates for **fast entry**, explicitly **not reminders/scheduling**.

- A recurring template is a saved bundle of transaction details (name, amount,
  type, category, tags, default note) **minus the date**. It is *not* a transaction
  itself — it's a reusable blueprint.
- Templates are **per-profile**.
- **Cadence** (monthly / weekly) is an optional, purely *cosmetic* field for v1 —
  used only to sort/group the recurring screen. No scheduler, no notifications.
- Using a template pre-fills the add-transaction screen with all its fields,
  stamped with **today's date** by default. The user confirms (one tap) or tweaks
  before saving. The result is a completely normal transaction that flows into
  reports and budgets like any other.
- Each transaction created this way optionally remembers its source template.

**Mental model:** templates are things you *own*; transactions are things that
*happened*. Different concepts, never confused.

---

## 10. Key User Flows

**Add a transaction (primary path):**
Tap "Add transaction" → the add screen opens empty and ready → enter
amount/type/category/tags/note → save. No mode-choosing gate up front.

**Use a recurring template (shortcut, not a separate mode):**
On the add screen, tap a "From recurring" entry point → pick from a list of
templates → the same screen fills with all the template's fields (dated today) →
adjust if needed → save.

**Create a recurring template (from the add screen):**
While adding a transaction, toggle "Save as recurring" (placed low on the form,
near save) → prompt for a name → saving logs the transaction *and* creates a
template from the same input.

**Design principle behind these flows:** avoid modes. One add screen serves
creating a transaction, using a template, and creating a template. The frequent
case (a one-off transaction) is never taxed by a decision gate; the template is an
optional accelerator the user can ignore entirely.

**Manage templates:** a separate recurring-transactions screen handles viewing,
editing, and deleting templates (housekeeping) — kept distinct from the fast add
path (speed).

**Switch profile:** changes all data *and* vocabulary; feels like the same app in
a different context.

---

## 11. Reports & Analytics

All reports read from transactions, scoped to the active profile. Two lenses:

- **Period report (flow):** for a chosen date range — total income, total expense,
  and net. Example: "June: +100k / −70k / net +30k." A negative net month is valid
  and meaningful (dipped into savings), not an error.
- **Balance (stock):** all-time cumulative income minus expenses = what the profile
  actually has right now. Carried-over money is never re-added; it persists
  automatically because balance is cumulative.

Additional views:
- **Category breakdown** — spending grouped by category for a period (with
  parent/descendant rollups).
- **Budget vs actual** — each budgeted category's spend against its limit
  (progress + over/under status).

**Dashboard:** a hero summary (balance / period net), quick actions, recent
transactions, and at-a-glance insights.

*(Note: cross-profile "combined" reports are intentionally out of scope — per-
profile categories don't share identity across profiles, and full separation is a
core requirement.)*

---

## 12. Filtering

Applies to transaction lists and reports:
- **Date range**
- **Category** — resolves to the node plus all its descendants
- **Type** — income / expense
- **Tag**

---

## 13. Design Direction (UI)

High-level guidelines (specifics generated separately):
- **"Quiet fintech":** modern, clean, calm, confident, minimal — not flashy.
  Explicitly avoid purple gradients, neon, heavy shadows, skeuomorphism, busy
  textures. Polish comes from spacing, hierarchy, and restraint.
- **One strong accent color** used sparingly; everything else neutral. Predominantly
  light background. Generous whitespace as a design element.
- **A semantic income/expense color pair** — the one place color carries meaning.
- **Typography:** a clean modern sans with personality; large bold money figures as
  the visual anchor; **tabular figures** so amounts align in columns.
- **Card-based layout**, soft rounded corners, persistent bottom nav (Home /
  Analytics / Wallet / Profile style).
- **Signature elements:** category chips/pills, tags, budget progress bars, clean
  bar & line/area charts, transaction rows (leading icon · title · category/time ·
  right-aligned signed amount, color-coded).
- Legibility and numbers come first. Accessible contrast. Light theme first, dark
  theme optional later.

---

## 14. Architecture

- **Backend:** a **modular monolith** — one FastAPI app, one database, one shared
  auth/core layer. Each "app" is a self-contained module with its own routes,
  models, schemas, and services. Finance lives under `/api/finance/*`. Future
  modules drop in as new modules + registered routers, no rewrite.
- **Frontend:** React, organized **feature-first** (a `finance` feature folder with
  its own api/components/hooks), one shared API client that attaches auth centrally.
- The only coupling between front and back is the URL prefix and the JSON shape
  (schemas). FastAPI's auto-generated OpenAPI spec can produce a typed TypeScript
  client for free.

---

## 15. Explicitly Deferred (not in v1)

Design leaves room for these, but they are **not** being built now:
- **Accounts / wallets & transfers** — the piece that caused pain before. Returns
  later as an optional account on transactions, with a transfer modeled as a
  *single atomic operation* (not two hand-made transactions).
- **Grocery list** — a separate to-do domain; a future module.
- **Recurring transactions as scheduled/automatic entries** — v1 is manual
  quick-add only.
- **Multi-currency**
- **Shared households / multiple real users**
- **Cross-profile combined reporting**
- **CSV export, receipt attachments**
- **Profile deletion** (needs a data-handling decision first)

---

## 16. Long-Term Vision

This finance tracker is the **first module** of a broader personal app. The
modular-monolith structure exists so additional life-management modules (grocery,
etc.) can be added later without re-architecting. **Finance is built end-to-end and
made genuinely usable first** before any second module begins — proving the pattern
once so later modules are quick to add.
