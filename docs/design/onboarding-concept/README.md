# Nyx Fit — Onboarding concept ("Lumen"), design section only

Status: implemented and verified 2026-09-11. Scope: dev-only design section. The shipped
onboarding flow, authentication, and Convex persistence are untouched.

## What this is

A warm-light onboarding concept for Nyx Fit, implemented as a live interactive prototype in
the design section:

- Route: `/design/onboarding` (DEV only, same guard as the rest of `/design`).
- Full-screen presentation: `/design/onboarding?present=1&step=welcome`.
  - `step`: `welcome | experience | save | ready`
  - `size`: `phone` (390 × 844) or `compact` (320 × 568)
  - `level`: `beginner | intermediary | advanced` (seeds the draft for review)
- The board includes step tabs, 390 × 844 and 320 × 568 stage toggles, a draft-level
  readout, and a clearly labeled note that the prototype's Google save is simulated.

The four screens (`src/components/onboarding/lumen/screens/`) form one flow with real local
state: selection survives Back, propagates into the Save profile card and the Ready summary,
Continue is disabled until a level is chosen, and "Get fit" navigates to `/`.

## Source decisions

React Bits references were inspected at source before integration:

| Reference | Actual implementation | Decision |
| --- | --- | --- |
| [Background Studio](https://reactbits.dev/tools/background-studio) | Customizer tool, no runtime component | Not applicable |
| [Color Bends](https://reactbits.dev/backgrounds/color-bends) | `three` WebGL shader | No new dependency allowed; the ambient background is now the user-supplied raster art in `public/onboarding/` rendered by `LumenBackground.tsx` (CSS washes and SVG ribbons served as the interim stand-in and were removed) |
| [Grainient](https://reactbits.dev/backgrounds/grainient) | `ogl` WebGL shader | Same: the supplied art already contains grain and falloff, so no separate grain layer remains |
| [Spotlight Card](https://reactbits.dev/components/spotlight-card) | Plain CSS: pointer-tracked `--mouse-x/--mouse-y` radial over a card | Adapted in `LumenChoiceCard.tsx`; selected state renders the lime/mint illumination without hover so it is visible on touch |
| [Magic Rings](https://reactbits.dev/animations/magic-rings) | `three` WebGL shader | Replaced with SVG concentric rings, a rotating lime arc, and orbit dots (`RingsArt` in `artwork.tsx`) |

The `three`/`ogl` engines were rejected per the repository rule against new dependencies and
"do not install several competing background engines". What remains is CSS/SVG plus one
raster art layer, so there is no GPU-context failure mode to fall back from.

## Tokens (`.theme-lumen`, `src/styles.css`)

Start tokens from the brief: background `#FAF9F7`, text `#171719`, lavender `#DDD4FA`,
mint `#D9F0E4`, lime `#C8F65C`, forest `#1A683D`, tomato `#F34E32`.

Adjustments made for AA and for the light direction:

| Token | Value | Note |
| --- | --- | --- |
| `--lm-ink-soft` | `#5F5E63` | 6.1:1 on the canvas |
| `--lm-ink-faint` | `#6E6D73` | 4.9:1 on white, used for captions/micro labels |
| `--lm-line` | `rgba(23,23,25,0.07)` | Fine card edges |
| `--lm-bar-rest` | `#EAE8EE` | Decorative bars |
| `--lm-disabled` / `--lm-disabled-ink` | `#EDECE8` / `#808086` | 3.3:1 disabled pair instead of opacity |
| `--lm-shadow-*` | card / float / action / lime | Soft card shadows, lime-tinted selected card |

Typography keeps the project's Google Fonts loading and uses Space Grotesk (headings) with
DM Sans (body), both already loaded in `src/routes/__root.tsx`. Scale: welcome 46px, screen
headings 36px, body 16px, primary buttons 56px, 24px gutters.

## Background art

The four ambient backgrounds are supplied raster art (887 × 1774 PNG, ~1 MB each) in
`public/onboarding/`. They are matched to the screens by content, not by file number:

| Screen | File | Why |
| --- | --- | --- |
| Welcome | `1.png` | Sweeping lavender/mint ribbons in the upper half, plain canvas where the copy and CTA sit |
| Experience | `4.png` | Airy ribbons at the edges; the middle stays clear for the three choice cards |
| Save profile | `2.png` | Interwoven loops behind the floating profile card (freed up once Experience took `4.png`) |
| Ready | `3.png` | Glowing concentric rings with lime orbit dots, aligning with the ring artwork |

`LumenBackground.tsx` renders the art with `object-cover object-top` and a 34 s scale
breathing loop (1 → 1.03). A remount on `wash` change gives each step a 300 ms crossfade.

## Motion

- Ambient background scale breathing (34 s), floating hero card (7s), continuous ring
  rotation and orbit dots (30–44s), selection check pop, and a 200ms opacity/8px step
  transition between screens.
- All continuous motion flows through framer-motion (`requestAnimationFrame`), so it pauses
  when the tab is hidden, and unmounts with its screen inside `AnimatePresence`.
- `MotionConfig reducedMotion="user"` plus `useReducedMotion` render static artwork and
  skip transforms; the global `prefers-reduced-motion` rule remains the backstop.

## Accessibility

- Each screen has a semantic `h1`; the Experience options are a native radio group in a
  `fieldset`/`legend` with arrow-key navigation, `:focus-visible` rings, and 44px+ targets.
- The stepper is a labeled `progressbar` with three segments (the Welcome step does not
  count); the back control is an icon button in the bottom action row, labeled "Go back".
- Decorative layers (`LumenBackground`, the backdrop blur/wash layer, artwork) are
  `aria-hidden` and `pointer-events-none`.
- axe-core 4.10.2 (injected from the CDN in a headless browser only, not a project
  dependency): 0 violations on all four screens and the board page.

## Files

- `src/styles.css` — `.theme-lumen` tokens and shadows (background washes and grain were
  removed once the raster art landed).
- `public/onboarding/{1,2,3,4}.png` — the supplied ambient backgrounds.
- `src/components/onboarding/lumen/config.ts` — copy, options, step labels (reuses the real
  `ExperienceLevel` union from `../config`).
- `.../classes.ts` — type recipes.
- `.../LumenBackground.tsx` — per-screen background art plus the ambient scale loop.
- `.../LumenStepper.tsx`, `.../LumenShell.tsx` — shared stepper, header, scroll body.
- `.../LumenButton.tsx`, `.../LumenBackButton.tsx`, `.../LumenChoiceCard.tsx` — actions and
  spotlight choice card.
- `.../artwork.tsx` — bars card, capsule, rings, profile-card illustration, level icon.
- `.../screens/Lumen*Screen.tsx` — the four screens.
- `.../OnboardingConceptBoard.tsx` — prototype stage, tabs, viewport toggle, flow state.
- `.../GoogleColorMark.tsx` — the official four-colour Google mark used on the white save
  button (the shipped kit keeps its monochrome mark; `kit/GoogleButton.tsx` is untouched).
- `src/routes/design.onboarding.tsx` — route + search parsing for presentation mode.
- `src/routes/design.tsx` — nav entry, `main` landmark, presentation layout.

## Verification (2026-09-11)

- `bunx tsc --noEmit` — clean.
- `bunx vitest run --config docs/reviews/onboarding-vitest.config.ts` — 31/31 pass (the
  shipped onboarding suite, exit 0).
- `bun run build` — clean, including service worker generation.
- Headless Edge (CDP, forced reduced motion for stable capture): screenshots of all four
  screens at 390 × 844, Experience at 320 × 568 (no horizontal overflow), the desktop board,
  the mobile board, and the shipped `/onboarding` + `/design/screens` for regression.
- Interaction run: 14/14 checks — step advance, disabled Continue, radio click and arrow-key
  selection, Back, selection persistence, simulated save loading state, Ready summary value,
  and dashboard navigation.
- axe: 5/5 surfaces with 0 violations.
- Post-background-swap re-run (same day): screenshots recaptured, 14/14 interaction checks,
  5/5 axe surfaces, 31/31 vitest, `bunx tsc --noEmit` clean, `bun run build` clean (exit 0,
  the service worker precaches 72 files / 6.7 MB including the four PNGs).
- Experience redesign re-run: 14/14 interaction checks, 5/5 axe surfaces, 31/31 vitest, tsc
  clean, build clean (exit 0), compact 320 × 568 stage still free of horizontal overflow.
- No lint script exists in `package.json`; no lint run was performed.

## Constraints and notes

- The reference image was available for the second pass, so bar colours, the sparkle brand
  mark, the white Google button, the chevron back control, and the centred profile card were
  all matched to it.
- The Experience screen was then matched to a later reference: the bars artwork, the level
  icons, and the numeric index were removed, leaving title, detail, and radio; the selected
  card is a lime-tinted fill with a 2px ink border and a lime check. A later feedback pass
  made the choice cards flat (no shadow), removed the helper line and the header step
  counter, moved the chevron back control into the bottom action row, gave the stepper three
  counted segments, and added a subtle backdrop blur/wash between the art and the content.
  A Welcome follow-up removed the landing brand header (sparkle mark included) and the
  "Built around you" eyebrow.
- A Save profile feedback pass removed the two support rows, moved the body line below the
  profile-card artwork, and made that artwork span the content width instead of a centered
  fixed-width card.
- The ambient art is user-supplied; it is raster, so swapping the mapping is a one-line change
  in `LumenBackground.tsx` (`backgroundSrc`).
- The prototype's Google button simulates the save only inside the design board and says so
  on the page. Wiring real Google auth/persistence would require replacing the real
  onboarding flow, which was explicitly out of scope.
- No production state or persistence changed, so no new automated tests were added; the
  existing onboarding suite covers the shipped flow.
