# Quiet Finance — Design Guide

"Quiet fintech." A composed, premium personal-finance app. Polish comes from
spacing, hierarchy, and restraint — never decoration. Numbers are the heroes;
everything else stays quiet. Mobile-first, works on web.

**Hard bans:** purple/neon gradients, heavy drop shadows, skeuomorphism, busy
textures, emoji, more than one accent color. If a screen feels flat/empty, fix
the spacing and hierarchy — do not add ornament.

---

## 1. Color

Predominantly light and near-neutral. **One** accent (ink indigo) used sparingly:
primary actions, the hero card, active states, key figures. A quiet green/brick
pair carries income vs expense. Nothing else is colored.

Defined as CSS custom properties on the app root; reference with `var(--x)`.

| Token          | Hex       | Use                                                              |
| -------------- | --------- | ---------------------------------------------------------------- |
| `--bg`         | `#F4F5F7` | App canvas (behind cards)                                        |
| `--card`       | `#FFFFFF` | Card / surface fill                                              |
| `--ink`        | `#141733` | Primary text, headings                                           |
| `--muted`      | `#6B7180` | Secondary text, labels, subtitles                                |
| `--faint`      | `#9AA0AE` | Tertiary text, captions, inactive icons                          |
| `--line`       | `#ECEDF2` | Hairline borders, row dividers                                   |
| `--accent`     | `#3A46E0` | THE accent — primary buttons, hero, active nav/tabs, key figures |
| `--accentTint` | `#EEF0FE` | Accent wash — icon chips, soft accent buttons, selected pills    |
| `--pos`        | `#178A5E` | Income / positive amounts (green)                                |
| `--neg`        | `#C24C3A` | Expense / negative amounts (brick)                               |

Supporting values (not tokenized, used inline):

- Device shell backdrop `#E7E8EC`; segmented-control track `#EFEFF3` / `#E5E6EC`.
- Warning (budget near limit) `#C9902B`.
- Income icon chip bg `#E7F5EF`; expense/neutral icon chip bg `#F3F4F7`.
- Positive pill tint `#E7F5EF`; negative pill tint `#FBEDEA`.
- Analytics category palette (donut + bars, in order):
  `#3A46E0, #6E77E8, #9AA0EE, #5E6474, #8A90A0, #C3C7F4`.
- Avatar/profile color choices: `#3A46E0, #178A5E, #C24C3A, #8A5A2B`.

**Rules**

- Max 1–2 background colors per screen. The accent is a spotlight, not a theme —
  if two things on screen are indigo, ask whether both earn it.
- Amounts are the only text that gets semantic color: `--pos` for income (`+`),
  `--neg` for expense (`−`). Neutral figures stay `--ink`.
- Need a new shade? Derive it in `oklch` from an existing token; don't invent
  unrelated hues.
- Light theme first. Dark theme is a later, optional layer.

---

## 2. Typography

Two families, loaded from Google Fonts.

- **Space Grotesk** (400–700) — all money figures and numerics. Always set
  `font-variant-numeric: tabular-nums` so digits align in columns.
- **Manrope** (400–800) — everything else: labels, titles, body, buttons, nav.

Strong size/weight contrast is the core device: **big bold numbers, quiet small
labels around them.**

| Role              | Family        | Size        | Weight | Notes                                             |
| ----------------- | ------------- | ----------- | ------ | ------------------------------------------------- |
| Hero balance      | Space Grotesk | 42px        | 600    | letter-spacing −.8px; the anchor of the dashboard |
| Add-screen amount | Space Grotesk | 44px        | 600    | letter-spacing −1px                               |
| Screen title (H1) | Manrope       | 22px        | 800    | letter-spacing −.02em                             |
| Section header    | Manrope       | 15–15.5px   | 700    |                                                   |
| Card figure       | Space Grotesk | 14–26px     | 600    | tabular-nums                                      |
| Row title         | Manrope       | 14.5px      | 700    |                                                   |
| Label / subtitle  | Manrope       | 11.5–12.5px | 600    | `--muted`                                         |
| Eyebrow / caption | Manrope       | 11px        | 700    | letter-spacing .1em, uppercase, `--faint`         |
| Nav label         | Manrope       | 10px        | 700    |                                                   |

- Money always renders through Space Grotesk + tabular-nums, at every size,
  including inside rows and pills.
- Use `text-wrap: pretty` on multi-line text.
- Minimum readable size in the UI is ~10px (nav labels only); body/labels ≥11.5px.

---

## 3. Currency & numbers (PKR)

- Format: `Rs<nbsp>` + South-Asian digit grouping. Grouping is **last 3 digits,
  then pairs**: `Rs 142,300`, `Rs 1,42,300`, `Rs 1,80,000`.
- Signed amounts: `+Rs 4,500` (income, `--pos`), `−Rs 8,450` (expense, `--neg`).
  Use the real minus `−` (U+2212), not a hyphen.
- Privacy mode masks figures as `Rs ••••••` / `••••`.
- Never abbreviate (no "1.4k") — this is a data app; show the full figure.

Reference implementation:

```js
grp(n){ n=Math.round(Math.abs(n)); let x=String(n); if(x.length<=3) return x;
  let l=x.slice(-3); let r=x.slice(0,-3).replace(/\B(?=(\d\d)+(?!\d))/g,',');
  return r+','+l; }
money(n){ return 'Rs\u00A0'+grp(n); }
signed(n,isIncome){ return (isIncome?'+':'−')+'Rs\u00A0'+grp(n); }
```

---

## 4. Layout & shape

Card-based, generous whitespace, soft rounded corners. Whitespace is a design
element — let it breathe.

- **Screen padding:** 16–20px horizontal; sections separated by 20–24px.
- **Corner radii:** hero/large cards 22–26px; standard cards 18–20px; inner
  chips/inputs 13–15px; icon chips 10–14px; pills/toggles 999px.
- **Borders over shadows:** surfaces are white with a `1px solid var(--line)`
  hairline. Avoid box-shadows except: the raised nav "+" FAB, and segmented-
  control active thumb (`0 1px 2px rgba(20,23,51,.09)`).
- **Layout primitive:** flex/grid with `gap:` — never margin-spaced inline
  siblings. Chip rows, toolbars, nav, card grids all use gap.
- **Hero card:** the one place the accent fills a whole surface. Indigo bg,
  white text, balance in Space Grotesk 42, inner sub-stats on
  `rgba(255,255,255,.13)` panels.
- **Frame:** designed in a 400×840 phone shell (44px radius) but the app content
  is fluid and works full-width on web.

---

## 5. Iconography

Crisp line icons, drawn as inline `<svg>` on a 24×24 viewBox:
`fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round;
stroke-linejoin:round`. Color via the parent's `color`. Sizes 15–23px depending
on context (nav 23, row/chip 17–20, inline 15).

Leading transaction icon sits in a rounded square chip (42×42, radius 13):
income → `#E7F5EF` bg with `--pos` stroke; expense/neutral → `#F3F4F7` bg with
`#4A4F63` stroke. Never use emoji as icons.

---

## 6. Components

**Buttons**

- Primary: `--accent` fill, white text, radius 16px, padding ~16px, Manrope 700
  15px. Disabled → `#C7CBF2`.
- Secondary: white fill, `--line` border, `--ink`/`--muted` text.
- Soft accent: `--accentTint` fill, `--accent` text (e.g. "See all", small CTAs).
- Icon button: 36–40px square, radius 12–13px, white + `--line` border,
  `--muted` icon.

**Segmented control** (period/filter/type toggles)

- Track `#EFEFF3`/`#E5E6EC`, radius 12px, 4px padding. Active thumb: white,
  radius 9px, subtle shadow, `--ink` text. Inactive: transparent, `--muted`.

**Chips & pills**

- Category chip: solid outline, radius 13px, icon + label; selected → `--accent`
  fill + white. Category rows scroll **horizontally** (`overflow-x:auto`, hidden
  scrollbar), not wrap.
- Tag pill: **dashed** border (`1px dashed #C7CBF2`), radius 999px, `#`-prefixed.
  Dashed vs solid is how tags stay visually distinct from categories.
- Status/delta pill: tinted bg + colored text, radius 999px (e.g. `▲ +14%` on
  `--neg` tint).

**Transaction row**

- Leading icon chip · title (700 14.5) + subtitle (`category · time`, `--muted` 12) · right-aligned signed amount (Space Grotesk 600, `--pos`/`--neg`).
  Rows divided by `1px solid var(--bg)`.

**Progress bar** (budget spent/limit)

- Track `var(--bg)`, height 6–9px, radius 999px. Fill `--accent` normally,
  `#C9902B` when ≥85%, `--neg` when ≥100%.

**Charts** (hand-drawn inline SVG, no chart lib)

- Bar: single accent series, tallest bar `--accent`, rest `#CBCFF3`.
- Grouped bar (cash flow): income `#1FA574`, expense `--accent`.
- Donut: `stroke-dasharray` on `r=15.915` circles, palette above, center total.
- Sparkline: white line + faint area fill, used only inside the indigo hero.
- Axis/label text: Manrope 600 ~10.5px `--faint`.

**Bottom nav**

- 5 slots: Home / Analytics / (+) / Wallet / Profile. White bar, `--line` top
  border. Active item `--accent`, inactive `--faint`. Center is a raised
  `--accent` FAB (58px, radius 20, 4px white border, the one allowed glow shadow).

**Sheets vs full screens**

- Small focused tasks = bottom sheet (radius 28px top, slide-up, scrim
  `rgba(20,23,51,.4)`): switch profile, add category, add tag, create profile.
- Dense multi-field forms = full screen with sticky header (✕ + title) and a
  pinned footer action: Add transaction.

---

## 7. Motion

Gentle and quick. Nothing bouncy.

- Sheets: `sheetUp .28–.3s cubic-bezier(.32,.72,0,1)`; scrims `fadeIn .2s`.
- Inline reveals (calendar, panels): `popIn .2s ease`.
- State changes (chips, toggles, tabs): `transition: all .15–.2s ease`.

```css
@keyframes sheetUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes popIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 8. Information architecture

- **Phases:** Login → first-run Setup → App. Setup = Create profile (required,
  name + color) → Categories → Tags → Budgets (all optional, skippable).
- **Profiles:** multi-profile (Home / Personal / user-created). A switch sheet
  with a "Create profile" action; each profile has its own balance, transactions,
  budgets, recurring. New profiles start at Rs 0 with empty data.
- **Categories:** a 2–3 level hierarchy (e.g. Bills & Home → Essentials →
  Grocery). Budgets attach to a category node; a category's spend rolls up its
  whole subtree.
- **Tags:** flat, cross-category labels for slicing spending independently.
- **Recurring:** quick-log templates — tap one to prefill the Add screen; save a
  transaction "as recurring" to create one.
- **Analytics lenses:** Overview (period comparison + trend), Cash flow
  (in-vs-out + savings rate), Categories (donut + list + budgets together).

---

## 9. Content voice

Calm, plain, respectful of attention. Short labels ("Spent this month",
"Household · shared", "nearly at limit"). No hype, no exclamation, no filler
sections. Every element earns its place — one thousand no's for every yes.
