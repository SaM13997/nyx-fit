# Nyx Fit — Onboarding Redesign Design Language Spec

Status: source of truth for the Paper foundations, screen builders, and reviewers of the light-world onboarding redesign.
Scope: the shipped 4-step flow (Welcome, Experience, Auth, Done) plus a reusable light component kit. The in-app product shell stays dark.

## 1. Context & intent

This spec defines a deliberate light world for onboarding only: the app is dark and precise, but first contact with a new user should feel like daylight, low stakes, and forward motion. It binds the existing flow, copy, and state machine (`src/components/onboarding/`) to a new visual language so every agent builds the same thing.

Continuity: brand fonts carry over from `src/styles.css` (`--font-heading: "Chakra Petch"`, `--font-sans: "Titillium Web"`), but the palette does not — onboarding values are scoped (suggested `.theme-onboarding`) and must not replace the incumbent dark tokens (`--radius: 0.625rem`, zinc surfaces, purple-600 actions).

Core pillar — thumb reachability (Sep 11, 2026): primary actions sit in the bottom third of the 390 × 844 frame, where a one-handed thumb can reach them. The Welcome landing is chrome-free — no header, no step rail — with its action cluster anchored to the bottom; later screens keep the header and still place their primary action low. Nothing actionable is pinned to the top of the frame.

Continuity check from `src/styles.css`: the app radius base is 10px and is intentionally not used here; light onboarding uses its own 16/20/24/28 ladder. Existing CTA geometry (56px primary, 44px minimum hit) and `MotionConfig reducedMotion="user"` are carried over.

## 2. Mood

| Candidate | Verdict | Why |
| --- | --- | --- |
| Calibrated Dawn | Chosen | Morning-lab light with instrument precision; calm enough for beginners, exact enough for athletes |
| Recovery Clinic | Rejected | Clinical white reads sterile and bureaucratic; loses playfulness |
| Sport Studio | Rejected | High-contrast studio look drifts toward bro-gym energy |
| Neon Night Gym | Rejected | Already the product's world; raises stakes and looks like "more app to learn" |

Why not the first instinct: the obvious move was to stretch the product's dark night-gym aesthetic into onboarding, but onboarding is a first meeting, not a performance — it should lower adrenaline, not raise it.

Physical scene: a recovery lab at first light — matte white surfaces on pale concrete, a frosted glass wall diffusing lavender dawn light into the room, mint vapor drifting from a cold plunge, one high-vis lime marker resting on a slate tray, and a single coral LED on an otherwise quiet instrument panel.

Color derivation:

| Color | Derived from |
| --- | --- |
| canvas `#FAF9FB` | Frosted glass wall washed by morning light |
| wash-lavender `#EDE9FE` | Dawn light through the frosted wall |
| wash-mint `#DDF3E7` | Cold plunge vapor |
| wash-peach `#FFF1E6` | Low sun spill across the floor |
| ink `#17171A` | Slate equipment and tray (also the dark data card) |
| lime `#C6F25E` | High-vis marker on the slate tray (selection, positive) |
| action ink `#17171A` / progress green `#147233` | Slate tray and instrument readout (action, progress) |
| coral `#F5502E` | The one alert LED on the panel (data emphasis only) |

## 3. Palette

**Palette amendment — Sep 11, 2026:** the purple action family was removed as an explicit design decision (it reads as a generic AI default). Action is now ink (`#17171A` rest, `#2E2E36` hover, `#0B0B0E` pressed) and the focus ring follows `action`, so it is ink too; progress is green (`#147233`) on `track #EDECF0`. The lavender/mint/peach atmosphere washes are unchanged — lavender is retained as atmosphere only, never as action or progress. Contrast re-verified: white on action 17.89, on action-hover 13.47, on action-active 19.65; progress arc 5.13 on track, 5.74 on canvas, 6.03 on card; ink focus ring 17.86 on card, 17.02 on canvas, 15.07 on lavender.

### 3.1 Tokens

| Token | Hex | Role | Where used |
| --- | --- | --- | --- |
| `canvas` | `#FAF9FB` | Page base | Every screen |
| `card` | `#FFFFFF` | Resting surface | Option cards, chart card, alerts, kit |
| `wash-lavender` | `#EDE9FE` | Atmosphere | Welcome, Experience, Done glow |
| `wash-mint` | `#DDF3E7` | Atmosphere | Auth, Done, Experience shoulder |
| `wash-peach` | `#FFF1E6` | Atmosphere | Welcome lower glow |
| `ink` | `#17171A` | Primary text, dark surface | Headings, data, dark card, selected border |
| `ink-secondary` | `#63636D` | Secondary text | Body copy, captions, details, labels |
| `control-line` | `#7C7C87` | Control strokes | Unselected radio ring, chart baseline |
| `disabled-fill` | `#ECEAF0` | Disabled surface | Disabled Continue button |
| `surface-soft` | `#F1F0F4` | Neutral fill | Neutral chips, icon-button pressed |
| `hairline` | `rgba(23,23,26,0.06)` | Divider only | Row separators, never card borders |
| `lime` | `#C6F25E` | Selection, positive | Selected day, check badge, lime chip |
| `green` | `#147233` | Positive text, dot | Chips, status labels, online dots |
| `green-tint` | `#E7F6E7` | Positive fill | Soft-tint chips, status pills |
| `action` | `#17171A` | Primary action | Primary button, focus ring |
| `action-hover` | `#2E2E36` | Action hover | Primary button hover |
| `action-active` | `#0B0B0E` | Action pressed | Primary button pressed |
| `progress` | `#147233` | Progress arc | Ring arc, thin progress fill |
| `track` | `#EDECF0` | Track fill | Ring track, soft neutral fills |
| `coral` | `#F5502E` | One data emphasis | Single bar in a chart, max one per screen |
| `red-notice` | `#DC2626` | Notification dot | 8px dot on circular icon button |
| `alert-bg` | `#FEF2F2` | Error alert fill | Inline alert only |
| `alert-line` | `#FECACA` | Error alert hairline | Inline alert only |
| `alert-text` | `#B91C1C` | Error alert copy | Inline alert only |
| `bar-rest` | `#EDECF0` | Chart bar fill | Non-emphasis bars (decorative) |

### 3.2 Gradient recipes

CSS-ready values (replace the placeholder variables with the token hexes above):

```css
--wash-lavender: radial-gradient(120% 62% at 16% -8%, #EDE9FE 0%, rgba(237, 233, 254, 0.62) 34%, rgba(237, 233, 254, 0) 74%);
--wash-mint: radial-gradient(130% 58% at 86% -6%, #DDF3E7 0%, rgba(221, 243, 231, 0.55) 38%, rgba(221, 243, 231, 0) 78%);
--wash-peach: radial-gradient(95% 46% at 50% 108%, #FFF1E6 0%, rgba(255, 241, 230, 0.55) 42%, rgba(255, 241, 230, 0) 78%);
--wash-base: linear-gradient(180deg, #FFFFFF 0%, #FAF9FB 42%, #FAF9FB 100%);
```

Composition rules:

| Screen | Layers (bottom to top) | Notes |
| --- | --- | --- |
| Welcome | base, lavender top-left, peach bottom | Dark data art card overlaps the lavender edge |
| Experience | base, lavender top, mint right shoulder | Mint stays behind the upper third only |
| Auth | base, mint top, lavender lower glow | Mirrors the reference's mint/ring screen |
| Done | base, mint top, lavender glow behind ring | Wash anchors the ring center |

Placement and rendering:
- One full-bleed layer, `position: absolute; inset: 0 0 auto 0; height: 46svh; pointer-events: none; aria-hidden`, content scrolls over it.
- Softness comes from multi-stop gradient falloff, not `filter: blur()` — blur on full-bleed layers is a mobile paint trap.
- Max two washes per screen; washes are static (no drift, no parallax).
- Text may sit directly on washes where the contrast table passes; data surfaces (cards) stay white.

### 3.3 Contrast table (computed, WCAG 2.1)

Text pairs (need >= 4.5:1):

| Pair | Ratio | Verdict |
| --- | --- | --- |
| ink on canvas | 17.04 | Pass |
| ink on card | 17.89 | Pass |
| ink on lavender | 15.07 | Pass |
| ink on mint | 15.37 | Pass |
| ink on peach | 16.17 | Pass |
| ink on surface-soft | 15.77 | Pass |
| ink on lime | 13.85 | Pass |
| ink on alert-bg | 16.35 | Pass |
| ink-secondary on card | 5.94 | Pass |
| ink-secondary on canvas | 5.66 | Pass |
| ink-secondary on lavender | 5.00 | Pass |
| ink-secondary on mint | 5.10 | Pass |
| ink-secondary on peach | 5.37 | Pass |
| ink-secondary on green-tint | 5.30 | Pass |
| ink-secondary on surface-soft | 5.23 | Pass |
| ink-secondary on alert-bg | 5.43 | Pass |
| white on action | 17.89 | Pass |
| white on action-hover | 13.47 | Pass |
| white on action-active | 19.65 | Pass |
| white on dark card (ink) | 17.89 | Pass |
| green on card | 6.03 | Pass |
| green on green-tint | 5.38 | Pass |
| green on mint | 5.18 | Pass |
| green on canvas | 5.74 | Pass |
| green on lime | 4.67 | Pass |
| alert-text on alert-bg | 5.91 | Pass |
| alert-text on card | 6.47 | Pass |
| disabled text `#7C7C87` on disabled-fill | 3.46 | Pass (disabled is exempt; we hold 3:1) |
| white 72% (`#B3B3B8`) on dark card | 8.57 | Pass |

Large text (>= 24px, or >= 18.66px bold) and non-text UI (need >= 3:1):

| Pair | Ratio | Verdict |
| --- | --- | --- |
| coral data mark on card | 3.46 | Pass (large/non-text only) |
| coral data mark on canvas | 3.30 | Pass (large/non-text only) |
| progress arc on track | 5.13 | Pass |
| progress arc on canvas | 5.74 | Pass |
| red-notice dot on card | 4.83 | Pass |
| red-notice dot on canvas | 4.60 | Pass |
| green dot on green-tint | 5.38 | Pass |
| control-line on card | 4.13 | Pass |
| control-line on canvas | 3.93 | Pass |
| focus ring on card | 17.86 | Pass |
| focus ring on canvas | 17.02 | Pass |
| focus ring on lavender | 15.07 | Pass |

Known exceptions and required pairings:
- `lime` is 1.23:1 vs canvas and can never be the sole state indicator. Every lime surface that carries state pairs with ink: ink text/glyph on it (13.85:1) and, for the selected day square and lime chip, a 1.5px ink stroke when the shape sits on canvas.
- `coral` carries no text and appears at most once per screen; it is an emphasis mark inside a data surface, never a status color.
- `bar-rest` is decorative (1.18:1 vs card) and is excluded from contrast requirements because every bar row also carries text labels or values.

### 3.4 Adjustments (provisional hex -> spec hex)

| Token | Before | After | New worst ratio | Reason |
| --- | --- | --- | --- | --- |
| ink-secondary | `#6E6E78` | `#63636D` | 5.00 on lavender | Failed 4.5:1 on lavender (4.25), mint (4.33), tint (4.50) |
| green | `#15803D` | `#147233` | 5.38 on green-tint | Failed 4.5:1 on green-tint (4.47), mint (4.31), lime (3.88) |
| progress | `#A78BFA` | `#8B5CF6` | 3.52 on track | Data-bearing arc failed 3:1 non-text (2.26). Superseded Sep 11, 2026: progress is now `#147233` (5.13 on track). |
| coral | `#FF5A3C` | `#F5502E` | 3.30 on canvas | Failed 3:1 non-text on canvas (2.95) |
| disabled text | `#8A8A94` | `#7C7C87` | 3.46 on disabled-fill | 2.86 failed; held 3:1 for legibility though disabled is exempt |

Added tokens not present in the provisional palette, each contrast-verified above: `red-notice #DC2626`, `alert-bg #FEF2F2`, `alert-line #FECACA`, `alert-text #B91C1C`, `bar-rest #EDECF0`, `control-line #7C7C87`, `disabled-fill #ECEAF0`.

## 4. Typography

### 4.1 Families, fallbacks, Paper availability

Paper `get_font_family_info` result (verified this session): both brand families are available.

| Family | Paper availability | Weights/styles returned | We use |
| --- | --- | --- | --- |
| Chakra Petch | Available | 300, 400, 500, 600, 700 plus italics for each | 600 for every scale role; roman only |
| Titillium Web | Available | 200, 300, 400, 600, 700, 900 (900 roman only) plus italics for 200-700 | 400, 600, 700; roman only |

Fallback stacks (keep the existing CSS variable names):

```css
--font-heading: "Chakra Petch", "Titillium Web", system-ui, sans-serif;
--font-sans: "Titillium Web", system-ui, -apple-system, "Segoe UI", sans-serif;
```

No substitution is needed; no fallback font choice was required. If a fallback is ever forced, Titillium Web is the closest available substitute for Chakra Petch metrics at the same weights (both are compact, angular, high-x-height).

### 4.2 Scale

| Role | Family | Size / line-height | Weight | Tracking | Applied to |
| --- | --- | --- | --- | --- | --- |
| Hero H1 (Welcome only) | Chakra Petch | 34 / 40 | 600 | -0.01em | "Train with intent." |
| Screen H1 (question) | Chakra Petch | 30 / 38 | 600 | -0.01em | Experience, Auth, Done headings; 2 lines max |
| Hero number XL | Chakra Petch | 40 / 44 | 600 | -0.02em | Ring center value |
| Data number L | Chakra Petch | 32 / 36 | 600 | -0.02em | Dark card number |
| Data number M | Chakra Petch | 24 / 28 | 600 | -0.01em | Kit totals, chart summary |
| Section title | Chakra Petch | 18 / 24 | 600 | 0 | Card headers |
| Row / option title | Titillium Web | 17 / 22 | 600 | 0 | Option labels, list names |
| Body | Titillium Web | 16 / 24 | 400 | 0 | Screen descriptions |
| Body strong | Titillium Web | 16 / 24 | 600 | 0 | Inline emphasis |
| Option detail | Titillium Web | 14 / 20 | 400 | 0 | Option details, alert copy |
| Button | Titillium Web | 16 / 20 | 700 | 0.01em | Primary and Google buttons |
| Link | Titillium Web | 14 / 20 | 600 | 0 | Text links, legal links |
| Data label | Titillium Web | 13 / 18 | 600 | 0.01em | "hours", chips, greeting line |
| Greeting (kit) | Titillium Web | 13 / 18 over 16 / 20 | 400 / 600 | 0 | Support line + name line |
| Caption | Titillium Web | 12 / 16 | 400 | 0 | Ring caption, legal copy |
| Micro label | Chakra Petch | 11 / 14 | 600 | 0.06em uppercase | Weekdays, step counter |

### 4.3 Numerals and measure

- All data numerals are tabular: `font-variant-numeric: tabular-nums` (already the codebase convention). Applies to ring values, chart values, dates, day numbers, step counters, chips with counts.
- Standalone data heroes render in Chakra Petch 600 with negative tracking; inline numerals inside prose stay Titillium Web.
- Never italicize numerals and never apply positive tracking to standalone data values; tracked micro labels ("Step 1 of 4") are the only tracked strings that may contain digits, and those digits stay tabular. Never use numerals as decorative texture; every displayed number must be true or explicitly illustrative art (kit only).
- Reading measure: body copy <= 60ch; centered onboarding copy <= 34ch (max-width 320px at 390 frame); option details wrap inside card padding without hyphenation; ragged right, never justified.

## 5. Shape & depth

Frame: 390px design width, 20px page gutters, 350px content width, safe-area padding top/bottom. All screens are single-column; nothing is nested inside a card except a chip, badge, or icon.

| Element | Radius |
| --- | --- |
| Standard card | 24 |
| Hero card (chart card, dark data card) | 28 |
| Option card | 20 |
| Primary / Google button | 16 |
| Inline alert | 16 |
| Chips / pills | 999 |
| Day-strip selected square | 16 |
| Chart bar | 10 top, 2 bottom |
| Bars, avatars, icon buttons, rings | full / circle |

Shadows (no card borders):

| Token | Value | Used on |
| --- | --- | --- |
| `shadow-rest` | `0 1px 2px rgba(23,23,26,0.04), 0 8px 24px rgba(23,23,26,0.06)` | White cards at rest, icon buttons |
| `shadow-float` | `0 2px 6px rgba(23,23,26,0.05), 0 16px 40px rgba(23,23,26,0.10)` | Selected option card, dark card, floating kit nav |
| `shadow-action` | `0 8px 20px rgba(23,23,26,0.18)` | Primary button only |

Hairlines: `1px solid rgba(23,23,26,0.06)`, dividers and alerts only. Selected option cards use a `1.5px solid ink` state border; resting cards never use borders.

Spacing rhythm: 4px base, steps 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56. Page gutter 20. Card padding 20 (option cards) or 24 (hero and data cards). Deliberate variance, not uniform gaps:

| Relationship | Gap |
| --- | --- |
| H1 -> body | 8 |
| Body -> first content block | 24 |
| Option cards between each other | 12 |
| Options -> primary CTA | 32 |
| CTA -> text link | 8 |
| Screen top -> first element | 24 |
| Header -> screen content | 24 |
| Kit grid items | 16 |

Touch: every interactive target >= 44x44, including text links, chips, and icon buttons. Primary button height 56; pills 32 tall; day-strip cells 44 tall (40px visual square).

Icon stroke: lucide line icons only, single stroke width 1.75 at 24px and 1.5 at 20px and below. Never mix stroke widths in one row. No emoji, no filled decorative icon sets.

## 6. Component inventory

Each component lists anatomy, specs, and states. All colors refer to Section 3.

**Primary button** — the single action per screen.
- Anatomy: full-width 350 x 56, radius 16, `action` fill, white Button label, optional 20px icon right, gap 8, `shadow-action`.
- States: rest; hover `action-hover`; pressed `action-active` + scale 0.98 (120ms); focus ring; disabled (below); loading shows 20px spinner + status label ("Saving your profile...") at 60% content opacity while retaining size.

**Primary button, disabled** — Experience's Continue until a selection exists.
- Spec: same geometry, `disabled-fill` fill, `#7C7C87` label, no shadow, `cursor: not-allowed`, `aria-disabled` behavior unchanged.
- Rule: never fade the whole button below 3:1; use the solid disabled pair (3.46:1) instead of opacity.

**Text link** — secondary paths ("I already have an account", "Continue without saving").
- Spec: Link type in `ink-secondary`, underline 1px currentColor/30% with 4px offset; rendered as a button or anchor; >= 44px hit area via padding; centered when it is a screen-level secondary action.
- States: rest; hover text `ink`; focus ring; pressed no layout shift.

**Google auth button** — the Auth action.
- Spec: identical geometry to primary button (`action` fill, radius 16, height 56) + white Google "G" mark 20px + "Continue with Google"; using the white monochrome mark on a colored button is the sanctioned Google treatment.
- States: rest; loading swaps the mark for a spinner and label "Signing in with Google..." (existing behavior); pressed scale 0.98; error surfaces in the inline alert, never inside the button.

**Pill chip** — tags, statuses, and filters.
- Variants: neutral (`surface-soft` fill, `ink-secondary` text), soft-tint (`green-tint` fill, `green` text), lime-solid (`lime` fill, `ink` text; selection/positive only), dark (`ink` fill, white text), inverse (white fill on dark card, `green` text).
- Spec: height 32 (28 compact in kit), radius 999, padding 0 12, Data label type, optional 8px dot or 14px icon; single-line, no wrapping.
- States: static (most); interactive variant adds hover `surface-soft` -> `#E8E7EC`, pressed scale 0.98, focus ring. Lime-solid is never interactive on canvas without its ink pairing.

**Status chip with dot** — "Online", "On track", "Saving".
- Spec: 8px dot + 6px gap + label; dot and label share the variant color; dot is `aria-hidden`, the label carries meaning. Positive = `green` dot on `green-tint` (5.38:1 non-text); neutral = `ink-secondary` dot on `surface-soft`; attention = `red-notice` dot on `alert-bg` with `alert-text` label.
- Never use color alone: the label text states the status.

**Option card** — Experience's three choices.
- Anatomy: white card, radius 20, padding 20, min-height 76, `shadow-rest`; leading micro index ("01", "02", "03", 11/14 Chakra 600 `ink-secondary`), title 17/22 600, detail 14/20 `ink-secondary`, trailing 24px state mark.
- Default: white, shadow-rest, trailing 2px `control-line` ring (4.13:1 vs card).
- Selected: 1.5px `ink` border, `shadow-float`, trailing 24px lime check badge (ink check); label stays ink, detail stays secondary. Lime never appears without the ink check glyph.
- Pressed: scale 0.99, 150ms, no color change.
- Disabled-continue context: cards remain fully interactive while the Continue button is disabled; the disabled button is the only "not yet" signal.

**Step rail** — main-path setup progress (4 segments).
- Spec: 4 equal flex segments, height 4, radius 999, gap 6; complete + active `ink`, upcoming `rgba(23,23,26,0.10)`; sits under the header on the main path, hidden on the existing-account path (matches current behavior).
- Accessibility: `role="progressbar"` with `aria-valuemin/max/now` plus the visible "Step n of 4" Micro label; state is never color-only (the label repeats it).

**Thin progress bar** — kit-level determinate progress.
- Spec: 350 x 4, radius 999, track `rgba(23,23,26,0.08)`, fill `progress` (5.74:1 vs canvas); no stripes, no shimmer; pairs with a value label in Data label type when the value is not obvious.

**Progress ring** — data-art hero (Done at 100%, kit demo at 65%).
- Spec: 132px box, 26px stroke, round caps, `progress` arc on `track` (5.13:1), starts at 12 o'clock; center stack = Hero number XL + Data label unit + 12px `ink-secondary` caption, centered.
- Accessibility: `role="progressbar"` with `aria-valuenow`; the arc is decorative, the centered value is the accessible value.
- States: determinate only; reduced motion renders the final arc immediately.

**Mini bar chart** — the reference's 7-bar data art.
- Spec: white hero card, radius 28, padding 20, `shadow-rest`; header row = 20px icon in a `surface-soft` circle + Section title + green-tint status pill; 7 bars, 26px wide visual, 8px gap, radius 10/2, `bar-rest` fill with exactly one `coral` bar (3.46:1 vs card).
- Axis: Micro label weekdays and Data label values in `ink-secondary`; bars `aria-hidden` with a visually hidden value list for screen readers.
- States: static; the one emphasis bar may rise last on entrance (Section 9).

**Dark data card** — the single near-black surface, data hero.
- Spec: `ink` fill, radius 28, padding 24, `shadow-float`; 20px white line icon stroke 1.5; label 13/18 at 72% white (8.57:1); Data number L white; optional top-right white pill with `green` text (6.03:1 on white).
- Rule: max one dark card per screen; never nest cards inside it; never place it on another card.

**Circular icon button** — icon actions and kit header.
- Spec: 44px circle, white fill, `shadow-rest`, 20px `ink` icon stroke 1.75; optional 8px `red-notice` dot (4.83:1 vs card) at top-right inside the circle, with an accessible label that includes the alert state.
- States: rest; hover fill `surface-soft`; pressed scale 0.98 + fill `surface-soft`; focus ring; dark variant = 48px `ink` circle with white icon (active kit nav item).

**Monogram avatar** — replaces all photography.
- Spec: 44px (header) or 40px (list rows) circle, deterministic fill from `surface-soft` / `wash-lavender` / `wash-mint` / `wash-peach` / `track` keyed by name hash, 1-2 initials in 15/20 Titillium 700 `ink`. During setup the brand mark is the letters "NF".
- Rule: no photos, no fake names; initials derive only from real account data, otherwise the brand mark.

**Check badge** — selection and completion.
- Spec: 24px circle, `lime` fill, `ink` check 14px stroke 2.5 (13.85:1); Done variant 64px with 28px check; on dark surfaces use white fill with ink check.
- Rule: lime always contains an ink or white glyph; the badge is never an empty dot.

**Inline alert (error)** — one generic pattern for save/sign-in failures.
- Spec: `alert-bg` fill, 1px `alert-line` border, radius 16, padding 14 16, 20px `alert-text` icon + 14/20 `alert-text` message (5.91:1), `role="alert"`, appears between the body copy and the CTA, full content width.
- Coverage: one shell for the save-failure copy ("We couldn't save your training experience. Check your connection and try again.") and the existing offline / 403 / 429 variants; only the message string changes. Recovery actions sit below: primary "Retry saving", text link "Continue without saving".
- Rule: max one alert per screen; no shake, no red button, no color flood.

**Legal microcopy row** — Auth footer.
- Spec: centered Caption type in `ink-secondary` (5.66:1 on canvas) with "Terms" and "Privacy Policy" as 600 underline links to `/terms` and `/privacy`; links keep >= 44px hit area via inline padding; exact copy: "By clicking continue, you agree to our Terms and Privacy Policy."

**Focus ring** — universal.
- Spec: 2px `action` outline, 2px offset, radius follows the element; `:focus-visible` only; contrast 17.02-17.86 on canvas/card, 15.07 on lavender. Never remove an outline without an equal-or-better replacement; screen H1 keeps `tabIndex={-1}` programmatic focus from the existing flow.

## 7. Screen blueprint

Shared frame (Experience, Auth, Done): 390px column, 20px gutters; static wash layer (Section 3.2); header = 44px brand mark (lime or lavender circle with "NF") + two-line stack "Built around you" (13/18 `ink-secondary`) over "Nyx Fit" (16/20 600 `ink`) + 44px circular icon button with `red-notice` dot; step rail + "Step n of 4" from Experience onward; Back control in the header on Experience and Auth, not on Done; H1 receives programmatic focus on step change. Welcome is the exception: a chrome-free landing — no header, no rail, no eyebrow — with its content anchored to the bottom third (core pillar, Section 1).

Copy below is exact and must not be paraphrased.

**Welcome**
| Field | Detail |
| --- | --- |
| Purpose | Name the premise, route to setup or existing account. |
| Reading order | Data-art hero -> H1 -> body -> primary CTA -> text link, anchored to the bottom third; the landing carries no header, no rail, and no eyebrow. |
| Components | Data-art hero (white card, radius 24, `shadow-float`, 7 bars with one coral, decorative labels from the shipped art such as "Your effort." / "Your progress."), Hero H1, Body, Primary button, Text link. |
| Copy | H1 "Train with intent."; body "Log workouts and follow your progress. Start by setting your training experience."; CTA "Set up my profile"; link "I already have an account". |
| Hierarchy | Art card and action cluster form one bottom-anchored column; the top half stays open wash. The hero card is rotated -3deg and is atmosphere only (no fake numbers, no claims). |
| Wash | Lavender top-left, peach bottom glow. |

**Experience**
| Field | Detail |
| --- | --- |
| Purpose | One decision, resumable, low load. |
| Reading order | Header/rail -> H1 (two lines) -> body -> three option cards -> Continue. |
| Components | Screen H1, Body, 3 Option cards, Primary button (disabled until selection). |
| Copy | H1 "What is your training experience?"; body "Choose the closest fit. You can change this in your profile settings."; options "Beginner" / "I'm learning the basics or building a foundation."; "Intermediate" / "I'm comfortable with the basics and have trained consistently."; "Advanced" / "I have extensive training experience and manage my own programming."; CTA "Continue". |
| Hierarchy | Heading and the three cards are the whole screen; cards are equal width, 12px apart; selection is lime check + ink border + float; Continue turns `action` ink only after a selection. |
| Wash | Lavender top, mint right shoulder; both fade before the first card. |

**Auth**
| Field | Detail |
| --- | --- |
| Purpose | Convert with Google, preserve the draft, explain why in one line. |
| Reading order | Header/rail -> H1 -> body -> Google button -> [inline alert if error] -> legal row. |
| Components | Screen H1, Body, Google auth button, Inline alert (error state only), Legal microcopy row, plus the existing saving status and error recovery pair. |
| Copy | H1 "Save your profile."; body "Sign in with Google to save your training experience and track your workouts."; button "Continue with Google"; legal "By clicking continue, you agree to our Terms and Privacy Policy."; error "We couldn't save your training experience. Check your connection and try again."; save status "Saving your profile..."; recovery "Retry saving" + "Continue without saving". |
| Hierarchy | Button is the only saturated element; error swaps the button for alert + recovery actions without moving the H1; alert sits directly above the recovery stack. |
| Wash | Mint top, lavender lower glow (mirrors the reference's right screen). |
| Existing-account shortcut | Welcome -> Auth: rail and step counter hidden, heading "Welcome back.", body "Sign in with Google to continue.", same button, alert, and legal row. |

**Done**
| Field | Detail |
| --- | --- |
| Purpose | Confirm completion, hand off to the product. |
| Reading order | Header/rail (all 4 segments complete) -> ring hero -> H1 -> body -> CTA. |
| Components | Progress ring at 100% with 64px lime check badge centered and Micro label caption "Setup complete", Screen H1, Body, Primary button. |
| Copy | H1 "Your profile is ready."; body "You can update your training experience in profile settings."; CTA "Open dashboard". |
| Hierarchy | Centered composition; ring is the only large graphic; CTA keeps the standard width and position so the thumb target is predictable. |
| Wash | Mint top, lavender glow behind the ring. |

## 8. Do / Don't

- Do keep white cards on the pastel canvas; don't place cards on cards or nest surfaces.
- Do treat lime as selection/positive only, always with an ink glyph or stroke; don't use lime for actions or decoration.
- Do reserve `action` ink for the one primary action and focus ring; don't repurpose it for progress text or chips (progress is the ring only).
- Do allow exactly one coral mark per screen, inside a data surface; don't introduce coral as a status or text color.
- Do keep one dark data card maximum, as a hero; don't use dark surfaces for form controls or alerts.
- Do use white cards with soft shadows; don't add visible resting borders, gradients inside cards, or glass effects.
- Do keep gradients as full-bleed background atmosphere only; don't gradient-fill text, buttons, or icons.
- Do keep one authored motion moment per screen; don't animate washes, loops, or ambient particles.
- Do use lucide line icons at a single stroke width; don't use emoji, filled icon sets, or mixed stroke weights.
- Do use monogram avatars or brand marks; don't use photography, stock imagery, or fake user names.
- Do set all data numerals tabular; don't letter-space, italicize, or proportionally tune numbers.
- Do keep 44px minimum targets and 4.5:1 text; don't shrink links, chips, or icon buttons below the bar, and never encode state with color alone.
- Do anchor primary actions in the bottom third of the frame (thumb reachability, Section 1); don't pin landing screens behind header chrome or eyebrows.
- Do keep copy exactly as specified; don't add feature claims, testimonials, or invented stats to the art.
- Do keep the light world scoped to onboarding; don't leak these tokens into the dark app shell.

## 9. Motion notes (implementation reference)

- Entrances: opacity 0 -> 1 + translateY 8px -> 0, 160ms `ease-out`; option cards stagger 40ms, max 3 items. This matches the existing 0.16s screen fade in `OnboardingFlow`.
- One authored moment per screen: Welcome = hero card settles (scale 0.98 -> 1, 240ms) while the coral bar rises last on a spring (stiffness 260, damping 24); Experience = check badge pops (scale 0.8 -> 1, spring stiffness 320, damping 22) with card shadow rest -> float 160ms; Auth = button press scale 0.98 at 120ms, alert enters opacity + 4px rise 160ms with no shake; Done = ring arc sweeps to 100% over 600ms `ease-out` and the check badge scales in.
- Spring only for badges, bars, and the ring sweep; everything else uses `ease-out`. No bounce on layout or text.
- Reduced motion: keep `MotionConfig reducedMotion="user"`; drop all transforms and stagger, render the ring and bars at final values, keep opacity transitions <= 160ms or make them instant. The global `prefers-reduced-motion` rule in `src/styles.css` stays the backstop.
- Never animate the wash layers; they are static paint.

## 10. Open questions / assumptions

| # | Item | Status |
| --- | --- | --- |
| 1 | Hero art labels on Welcome reuse the shipped strings from the current art ("Your effort.", "Your progress.") rather than new copy. | Assumption, medium confidence |
| 2 | Done uses a 100% progress ring with a check badge as the completion hero (derived from the reference ring); the 59-hours/65% state stays kit-only. | Decision, flag for reviewer |
| 3 | Light tokens ship behind a scoped class (suggested `.theme-onboarding`) so `src/styles.css` dark tokens are untouched. | Assumption, high confidence |
| 4 | Chakra Petch renders tabular figures correctly in Paper and in the browser; verify during implementation and fall back to Titillium Web for the affected number if not. | Assumption to verify |
| 5 | Legal links keep 44px hit areas when wrapped across two lines on narrow devices. | Assumption to verify |
| 6 | Floating kit nav uses `backdrop-filter: blur(16px)`; a solid `surface-soft` fallback is required where blur is unsupported. | Assumption |
| 7 | Existing-account path keeps the rail hidden (matches current shipped behavior); no separate rail state is designed. | Confirmed against code |
| 8 | The reference image cannot be re-examined by this agent; all visual facts derive from the orchestrator's reading plus the computed values in this document. | Constraint |

## 11. Implementation notes (2026-09-11, in-app build)

Deviations applied during implementation, all intentional:

- Wash falloffs were strengthened for in-browser rendering (lavender/mint mid-stops rgba(.62/.55) -> .80/.75 with larger extents; peach .55 -> .70; lavender bottom .60 -> .78) and layer heights use % of the container instead of svh so fixed-height previews match the page.
- Primary button loading keeps the full white label on `action` (17.89:1) instead of the 60% content opacity; the 60% composite fails the AA bar this spec promises.
- The shared header's top-right circular icon ships as decorative paint (aria-hidden, non-interactive); the kit documents the real interactive IconButton with its dot variant.
- Kit Progress ring demo uses a 148px box for its three-line center stack; the shipped Done ring stays 132px with only the badge centered.
- All 20px/14px icons use stroke 1.5 (24px stay 1.75); 44px targets and the AA contrast table are unchanged.
- Sep 11, 2026 (thumb reachability amendment, Section 1): the Welcome landing dropped its header, step rail, and "2 minute setup" chip (`copy.welcome.meta` removed) and now anchors its action cluster to the bottom third; the rail starts at Experience. The dev-only screens page is organized as an explainer column plus a mockup stage.
- Sep 11, 2026 (header simplification + thumb reachability for every screen): the shared header is now a single centered "Nyx Fit" wordmark with the step rail only — the NF brand mark, "Built around you" eyebrow, notification bell, Back control, and "Step n of 4" counter are removed. Experience, Auth, Done, and the Auth error state anchor their primary action to the bottom third alongside Welcome. On the dev-only screens page the explainer column, frame captions, and dev-note card are gone; the board sits left-aligned under a top nav bar with the shortened "Design language" title.
