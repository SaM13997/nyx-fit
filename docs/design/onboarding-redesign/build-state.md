# Nyx Fit — Onboarding Paper Build State

## Status update — 2026-09-11: redesign implemented in-app; Paper paused

The onboarding redesign was implemented directly in the app (user decision: no Paper Pro). The resume plan below is history; the spec remains the source of truth.

- Shipped in code: scoped light world `.theme-onboarding` (tokens/washes/shadows in `src/styles.css`), kit `src/components/onboarding/kit/`, screens `src/components/onboarding/screens/`, flow wiring `OnboardingFlow.tsx` (state machine and effects preserved), `login-form.tsx` onboarding variant, dev-only `/design` route.
- Evidence: `tsc --noEmit` clean; vitest 31/31 via `bun run test -- --config docs/reviews/onboarding-vitest.config.ts`; `vite build` clean; axe-core 0 violations on Welcome/Experience/Auth; impeccable detector clean; reviewer verdict ship (no P0/P1; P2 fixes applied).
- Board pages: `src/components/onboarding/board/*` + `src/routes/design.tsx` were reorganized by a parallel writer and consume the same kit/screens; preserved as-is. Known drift: `WashPanel` shows spec §3.2 alphas while the app CSS uses strengthened falloffs.
- Paper file `01M26NHJ32B1AYQJAP4WVWD7AR` stays as reference; the free quota resets weekly and nothing there blocks the app.

Status: PAUSED — Paper artifact only; the weekly-limit notes below still apply to the Paper file.
Error: "Weekly MCP limit reached. It resets tomorrow. Upgrade to Paper Pro to continue."
While limited: `get_basic_info` still reads; `finish_working_on_nodes` still worked and both built boards were released cleanly. Do not rebuild anything from scratch.

## In-app continuation (Sep 11, 2026)

The Paper decisions and the four screen boards now live in the app at the dev-only `/design` route (`src/routes/design.tsx`, boards under `src/components/onboarding/board/`):

- 01 composed wash, 02 palette, 03 type scale, 04 shape & depth mirror the Paper "00 Design Language" export.
- 05 components shows the full kit inventory with its states.
- 06 screens shows the four Paper screen boards (Welcome, Experience, Auth, Done) plus the existing-account, saving, error, and no-selection states that were still unbuilt in Paper.
- Palette amendment (Sep 11, 2026): the purple action family was removed as an explicit design decision (it reads as a generic AI default); action is now ink #17171A (hover #2E2E36, pressed #0B0B0E, focus ring follows) with progress green #147233 on track #EDECF0; lavender/mint/peach atmosphere washes unchanged; contrast re-verified in spec §3.3.

Paper itself can be resumed when the limit resets; this page is the working board in the meantime.

## Artifacts

- Design language spec (source of truth): `docs/design/onboarding-redesign/onboarding-redesign-spec.md`
- Paper file: "Nyx Fit Onboarding" — https://app.paper.design/file/01M26NHJ32B1AYQJAP4WVWD7AR/1-0
- Page name: "Page 1" (MCP has no page rename; will stay)

## Artboard map (node ids)

| Artboard | Node id | Size | World position |
| --- | --- | --- | --- |
| 00 Design Language | `1-0` | 1600 × 4054 (fit-content) | (0, 0) |
| 01 Components | `2-0` | 1600 × 2400 (needs fit-content) | (1690, 0) |
| 02 Welcome | `3-0` | 390 × 844 | (0, 2500) |
| 03 Experience | `4-0` | 390 × 844 | (480, 2500) |
| 04 Auth | `5-0` | 390 × 844 | (960, 2500) |
| 05 Done | `6-0` | 390 × 844 | (1440, 2500) |

Footgun: the page id is also the string `1-0`. Always pass explicit `fileId` + `nodeId` so calls do not land on the page root.

## Done

- 85 design tokens created in the Paper file (colors, fonts, weights, tracking, 16 size + line-height pairs, spacing 4-56, radii, shadows). Full list via `get_basic_info`.
- "00 Design Language" board: complete and screenshot-verified — title block, gradient atmosphere panel (1504 × 420), 25 palette cards, all 16 type-scale rows with a 320px caption lane, radius ladder + elevation trio + spacing rhythm.
- "01 Components" board: board header (`B5-0`), Buttons section complete and screenshot-verified (`BF-0`; rows `BL-0`, `CD-0`: primary rest/hover/pressed/loading, disabled, text link, Google auth with white SVG G), Pills & chips section header (`D0-0`) + variant row (`D7-0`) written but NOT screenshot-verified.

## Remaining work (in order)

1. Board 01 (`2-0`), resume at pills row `D7-0`:
   - Screenshot + verify the pills variant row; fix if needed.
   - Add status-chip row (positive / neutral / attention) inside `D0-0`.
   - Add sections: Selection (option cards default/selected/pressed), Progress & data (step rail 2 of 4, thin bar 65%, ring 65% with illustrative value, ring 100% + 64px lime check, mini bar chart with exactly one coral bar, dark data card), Surfaces & iconography (circular icon button rest / with notice dot / dark 48px; single-stroke icon row: back, bell, clock, check, arrow-right, bar-chart), Feedback (inline alert with exact copy, legal microcopy row, focus-ring demo), Avatars & badges (monogram 44/40, "NF" + sample initial; check badges 24/64).
   - Section wrapper pattern: `padding: 40px 48px 44px 48px; border-top: 1px solid var(--color-hairline)`; 350px specimen cells; 12px ink-secondary spec labels; 16px in-group, 32-48px between sections.
   - Switch `2-0` to `height: fit-content`, run final screenshots, `finish_working_on_nodes`.
2. Four screens (`3-0`..`6-0`) per spec section 7 + recipes below. Depict:
   - Welcome: brand header + rail + white chart art card (rotated ~-3deg, overlaps lavender edge; decorative labels "Your effort." / "Your progress.", no invented numbers) + "2 minute setup" chip with clock icon + H1 "Train with intent." + body + primary "Set up my profile" + text link "I already have an account". Wash: lavender top-left, peach bottom.
   - Experience: H1 + body + 3 option cards with option 2 ("Intermediate") SELECTED (1.5px ink border, shadow-float, 24px lime check badge) + Continue ENABLED, to show the language's signature moment. Wash: lavender top, mint right shoulder.
   - Auth: H1 "Save your profile." + body + Google button + legal row. Wash: mint top, lavender lower glow.
   - Done: 100% ring + 64px lime check + caption "Setup complete" + H1 + body + CTA "Open dashboard"; centered. Wash: mint top, lavender behind ring.
   - Header (identical on all four): 44px "NF" brand mark + "Built around you" (13/18) over "Nyx Fit" (16/20 600) + 44px circular icon button with red-notice dot; step rail + "Step n of 4" under it. Back control on Experience/Auth only. Keep 20px gutters, 350px content, 44px minimum targets.
3. Fresh reviewer pass: screenshots of all boards vs spec + craft floor (spacing, typography, contrast, alignment, artboard fit, repetition); findings by severity; targeted fixes via the same screen agents.
4. Final: verify screenshots myself, report verdict + open items to the user; update spec/doc if micro-decisions changed.

## Paper tool quirks (learned during build)

- Negative-anchor radial gradients collapse to center. Paper-safe: anchors at `0%` with taller ellipse (`120% 70%` lavender, `130% 66%` mint). App CSS keeps the spec strings verbatim.
- `create_tokens` has no shadow type — `--shadow-*` stored under spacing (still export fine); `--text-*-line-height` double-dash normalized to single dash.
- Paper sometimes flattens a plain div out of a flex wrapper — verify spacing after writes, patch with `update_styles`.
- `get_screenshot` may return a null payload while the image still renders; treat the session image as evidence.
- Page/root screenshots unsupported — capture per artboard; large boards get downscaled.
- `update_styles` argument shape: `{ nodeId, updates: {...}, fileId? }` (not `styles`).
- Do not touch other Paper files; file stays sticky per agent session via explicit `fileId`.

## Kit recipes (match exactly; tokens already exist)

```
GRADIENT LAYER STACK (full-bleed, absolute, 100% x 46svh, pointer-events none)
base:     linear-gradient(180deg, #FFFFFF 0%, #FAF9FB 42%, #FAF9FB 100%)
lavender: radial-gradient(120% 62% at 16% -8%, #EDE9FE 0%, rgba(237,233,254,.62) 34%, rgba(237,233,254,0) 74%)
mint:     radial-gradient(130% 58% at 86% -6%, #DDF3E7 0%, rgba(221,243,231,.55) 38%, rgba(221,243,231,0) 78%)
peach:    radial-gradient(95% 46% at 50% 108%, #FFF1E6 0%, rgba(255,241,230,.55) 42%, rgba(255,241,230,0) 78%)
Paper-safe: lavender/mint anchors at 0%, sizes 120% 70% / 130% 66%.

PRIMARY BUTTON      350x56, r16, gap 8; fill var(--color-action), shadow 0 8px 20px rgba(23,23,26,.18)
  label Titillium 700 16/20 +0.01em #FFF; optional right icon 20px
  hover #2E2E36; pressed #0B0B0E + scale(.98) 120ms; disabled #ECEAF0 fill + #7C7C87 label, no shadow
  loading: 20px spinner (2px border rgba(255,255,255,.30), top #FFF) + label 60% opacity, size retained
GOOGLE BTN          same geometry; white G mark 20px + "Continue with Google"
TEXT LINK           Titillium 600 14/20 ink-secondary; underline 1px rgba(99,99,109,.30) offset 4; padding 12 8 (>=44)
PILL CHIP           h32 r999 pad 0 12; Titillium 600 13/18 +0.01em
  neutral #F1F0F4/#63636D; soft #E7F6E7/#147233; lime #C6F25E/#17171A + 1.5px ink stroke on canvas;
  dark #17171A/#FFF; inverse white/green on dark card
STATUS CHIP         8px dot + 6px gap: green/green-tint · ink-secondary/surface-soft · red-notice dot + alert-text on #FEF2F2
OPTION CARD         350w, r20, p20, min-h76, shadow 0 1px 2px rgba(23,23,26,.04), 0 8px 24px rgba(23,23,26,.06)
  index Chakra 600 11/14 ink-secondary; title Titillium 600 17/22 ink; detail 400 14/20 ink-secondary
  default trailing 24px ring 2px #7C7C87; selected 1.5px #17171A border + shadow-float + 24px lime badge (14px ink check stroke 2.5)
  pressed scale(.99) 150ms; no other color change
STEP RAIL           4 flex segments h4 r999 gap 6; done+active #17171A, upcoming rgba(23,23,26,.10); "Step n of 4" micro label
THIN BAR            350x4 r999, track rgba(23,23,26,.08), fill #147233
RING                132px box, stroke 26, r53 (C=333.01), round caps, start 12 o'clock
  track #EDECF0; arc #147233; 100% dashoffset 0; 65% dashoffset 116.55; transform rotate(-90 66 66)
  center: 40/44 Chakra 600 -0.02em tabular + 13/18 600 unit + 12/16 ink-secondary caption
MINI BAR CHART      white r28 p20 shadow-rest; 36px surface-soft circle + 20px icon + 18/24 600 title + green-tint pill right
  7 bars 26w gap 8, radius 10px 10px 2px 2px, #EDECF0, exactly one #F5502E; weekday micro 11/14; footer label/value
DARK CARD           #17171A r28 p24, shadow-float; icon 20px #FFF stroke 1.5; label 13/18 600 rgba(255,255,255,.72)
  number 32/36 600 #FFF tabular; top-right white pill h28, green text
ICON BUTTON         44 circle #FFF shadow-rest, icon 20 stroke 1.75 #17171A; notice dot 8px #DC2626 top-right inset
  dark variant 48px #17171A circle, white icon
AVATAR              44/40 circle; fills surface-soft / wash-lavender / wash-mint / wash-peach / track; initials Titillium 700 15/20 ink; setup = "NF"
CHECK BADGE         24px #C6F25E + 14px ink check stroke 2.5; 64px + 28px check; dark surfaces white fill
INLINE ALERT        #FEF2F2, 1px #FECACA, r16, p 14 16; 20px #B91C1C icon + Titillium 14/20 #B91C1C
  copy: "We couldn't save your training experience. Check your connection and try again."
LEGAL ROW           Titillium 12/16 ink-secondary centered; "Terms" + "Privacy Policy" 600 underlined
FOCUS RING          2px #17171A outline, 2px offset (:focus-visible only)
HAIRLINE            1px rgba(23,23,26,.06) — dividers only, never card borders
```

## Micro-decisions to keep

- Welcome (Sep 11, 2026): the "2 minute setup" chip, header, and step rail were removed; the landing is chrome-free and its action cluster anchors to the bottom third (spec §1 core pillar).
- Welcome art card is WHITE (spec section 7 governs over the section 3.2 mention of a dark card); the dark card stays kit-only.
- Exactly one coral element per screen (Welcome: one bar; Done/Experience/Auth: none).
- Kit numbers are illustrative only; screens carry no invented stats.
- Header/action revision (Sep 11, 2026): every screen header is a centered "Nyx Fit" wordmark plus the step rail (brand mark, eyebrow, bell, Back control, and step counter removed), and every screen anchors its primary action to the bottom third.
