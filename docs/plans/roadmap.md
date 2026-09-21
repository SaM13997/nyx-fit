# Nyx Fit Roadmap (consolidated)

Single source of truth for remaining work, created 2026-09-20. It merges every plan,
checklist, and roadmap from both workout-app repos into one backlog. The roadmap spec
(`docs/superpowers/specs/2026-03-17-nyx-fit-roadmap-design.md`) remains the backbone;
its lanes are used as-is.

Item tags: `[done]` verified in `dev-pwa` code, `[open]` not built anywhere,
`[verify]` likely present or partially present, needs a code check before planning,
`[dropped]` intentionally not carried forward.

## Sources and disposition

| Source | Repo | Disposition |
|---|---|---|
| `ai-context/features.md` (original features roadmap, v1.0.0) | nyx-fitness | Merged here; repo deprecated |
| `ai-context/sync.md` (Dexie + Supabase sync guide) | nyx-fitness | Dropped, obsolete architecture |
| `ai-context/CONVEX_MIGRATION_PLAN.md` | nyx-fitness | Dropped, obsolete (nyx-fit already on D1) |
| `ai-context/daily-todo.md` | nyx-fitness | Deleted upstream; nothing outstanding found |
| `docs/checklist.md` (build status, 2026-08-21) | nyx-fit-final | Deferred items merged; repo disposition undecided |
| `docs/features.md` (product roadmap v2.0.0, 2026-08-21) | nyx-fit-final | Merged here |
| `docs/superpowers/specs/2026-03-17-nyx-fit-roadmap-design.md` | nyx-fit | Active backbone (8 lanes) |
| `docs/superpowers/specs/2026-03-17-foundation-mode-ready-shells-design.md` | nyx-fit | Partially landed; see Branch hygiene |
| `docs/plans/cloudflare-migration.md` | nyx-fit | `[done]` historical |
| `docs/plans/linear-tickets-cloudflare-followup.md` | nyx-fit | 5 of 8 tickets verified fixed; remainder below |
| `docs/superpowers/plans/2026-09-20-port-nyx-fitness-gaps.md` | nyx-fit | `[done]` 9/9 tasks committed |
| `docs/reviews/onboarding-remediation-tasks.md` | nyx-fit | `[done]` onboarding shipped; checkboxes unmaintained, keep as historical |

## Current state snapshot (verified 2026-09-20)

- Stack: React 19 + TanStack Start/Router, Tailwind v4, framer-motion, Cloudflare
  Workers + D1 + R2, better-auth, Bun; generated service worker (`scripts/generate-sw.mjs`).
- Core loop: start/resume/finish/edit workouts, set drawer with duplicate-last-set,
  wheel-picker weight/reps entry, category inference with manual override,
  custom free-text exercises (name cap 120), body-part tags, revision CAS conflict handling.
- Progress: weights log with 5-per-page pagination, recharts trend chart, goal weight,
  lbs/kgs unit switch persisted in profile and applied app-wide, weekly volume and
  top-exercise stats, per-exercise total volume on cards.
- Account: Google auth, profile editor (name, gender, fitness level, units),
  notifications suite (permission helpers, settings toggle with live state, test action,
  onboarding reminders opt-in, SW notificationclick handler), app version in About.
- Platform: installable PWA with offline root shell, `InstallPrompt`, offline banner,
  TWA Android pipeline (`docs/android-twa.md`), Capacitor iOS wrapper (`docs/ios-capacitor.md`),
  store checklists (`docs/pwa-store-publish-checklist.md`).
- Quality gates: `bun run typecheck` + `bun run test` (vitest, two projects), TypeScript strict.

## Immediate fixes in this repo (from the Cloudflare follow-up review, re-verified)

Resolved 2026-09-21:
1. `[done]` Empty-updates saves now CAS-check the provided revision before returning the
   current row unchanged; a stale no-op revision returns `conflict`
   (`src/lib/api/store.server.ts`).
2. `[done]` `dev-dist/` untracked and ignored.
3. `[done]` The stats sort was already cache-safe (copy before sort); no change needed.
4. `[done]` Reactivation UNIQUE failures now return a distinct `active-exists` reason
   instead of revision `conflict`; `isStarting` resets in a `finally`; the dead
   `setWeightGoal` trio is deleted. `public/assetlinks.json` is intentional dual-write
   output of `scripts/sync-assetlinks.mjs` (verified), not a stale duplicate.

Open decision:
- `[open]` P3: adopt `.gitattributes` (`* text=auto eol=lf`). Note the tradeoff: ~30 legacy
  files are committed with CRLF and will show one-time normalization diffs as they get touched.

## Lane status and open backlog

### Lane 1: Foundation
- `[done]` User level captured during onboarding (Lumen flow) and editable in profile settings.
- `[done]` Settings as control hub: units, appearance/font theme, rest timer duration,
  notifications, app version.
- `[open]` Shared page-shell components across stats/settings at the same quality level as
  workouts/weights (first-epic spec). Salvage from the unmerged
  `feature/foundation-mode-ready-shells` branch rather than re-planning from scratch.

### Lane 2: Core Logging
- `[done]` Edit after finish, category inference + select, wheel pickers, rest timer with
  configurable duration, duplicate set, body-part grouping, custom names, per-exercise volume.
- `[done]` Quick-adjust steppers (weight ± unit step, reps ± 1) and exercise-picker search,
  ported from `c6c44d1` on 2026-09-21.
- `[open]` Auto-progression on duplicate/next set (e.g. weight +5, reps -2, values editable in
  settings). Duplicate currently copies the last set verbatim (`SetDrawer.tsx:136-148`).
- `[open]` Guided workouts (pre-defined templates per level, check-off flow). Marked paid
  feature in the original roadmap; belongs behind Lane 5 gating. Large epic, needs its own plan.

### Lane 3: Progress
- `[open]` Weights chart polish: uniform x-padding, W/M/Y range buttons (week view was broken in
  the old app; re-verify here), integer y-axis labels, 3-month range (explicitly deferred from
  the port plan to this lane).
- `[open]` Stats page alignment with the workouts/weights design language; record surfacing
  (PRs), volume trends, body-part training frequency.
- `[verify]` Exercise-specific progression charts and body-weight correlation.

### Lane 4: Mode System
- `[open]` Mode system v1: beginner/intermediate/advanced/coach behavior differences (defaults,
  copy, guidance level, feature visibility). `fitnessLevel` exists; nothing consumes it for UX
  differentiation yet. Own epic (`mode-system-v1`) per the roadmap spec.

### Lane 5: Premium
- `[open]` Entirely unbuilt: provider selection, free-tier limits, entitlement source of truth,
  upgrade UX, gating for guided workouts and workout publishing.
- `[dropped]` Dexie/Supabase paid-subscriber sync concept (nyx-fitness `sync.md`); replaced by
  the D1/server-function architecture.

### Lane 6: Platform
- `[done]` SW quality batch (notificationclick, offline root shell, offline-resilient root auth).
- `[open]` Device QA: iOS runtime (needs macOS), Android emulator, login-to-session smoke on a
  real device (carried from nyx-fit-final checklist).
- `[open]` Store publishing itself (TWA signed builds, Capacitor iOS submission,
  store checklist execution).
- `[verify]` Brand-consistent splash/loading states.

### Lane 7: Growth
- `[open]` Entirely unbuilt: metrics, funnels, event taxonomy for onboarding/logging/retention/
  upgrade. Blocked behind Lane 5 decisions for upgrade events.

### Lane 8: Launch Assets
- `[open]` Short-form ad concept system (IG/TikTok), mode-positioned messaging hooks.
  Design-system playground routes (`src/routes/design.*.tsx`) exist as raw material.

## Cross-cutting quality items carried from the old roadmaps

- `[open]` Data export/import (CSV/JSON backup). Explicitly deferred by the port plan; revisit
  when a real export format exists.
- `[open]` Push notifications (beyond local system notifications).
- `[open]` Full offline data sync (offline indicator and root shell exist; conflict-free
  background sync does not). Large; treat as its own epic if pursued.
- `[dropped]` Light/multi-theme system; product is dark-forced per current design direction.
- `[dropped]` Zustand/Redux global state; TanStack Query + local state covers it.
- `[dropped]` Zod validation; hand-written "parse, don't validate" guards are the house style.
- `[open]` Error boundaries, loading/empty-state audits, E2E (Playwright) if the team wants them;
  none are committed anywhere yet.

## Dropped with the nyx-fitness deprecation

Everything nyx-fitness-specific: Convex migration plan, Dexie/Supabase sync layers,
Firestore/RxDB todo experiments, its recharts chart bugfixes (nyx-fit's chart is a
different implementation), and its install-prompt/service-worker era code. Behavior
parity items were already ported by `2026-09-20-port-nyx-fitness-gaps.md`.

## Branch hygiene (updated 2026-09-21)

- Deleted after salvage: `feature/foundation-mode-ready-shells`, `feature/core-logging-speed`
  (tips preserved as tags `archive/foundation-mode-ready-shells`, `archive/core-logging-speed`).
- Deleted as fully merged: `androidbuild`, `auth-components`, `polish-round`, `stats`, `master`.
- Remaining, unmerged and likely stale, awaiting confirmation: `dev-opencode`,
  `dev-opencode-stats`, `expo-app`, `ios-and-android-ft-add`.

## Repo deprecation checklist

- nyx-fitness: deprecation banner + pre-deprecation snapshot committed locally on master
  (39aeb0c, bdb21a4, 2026-09-21). Pending user credentials: `git push origin master`, then
  `gh repo archive SaM13997/nyx-fitness --yes` (gh was not authenticated in this environment).
- nyx-fit-final (Expo prototype): decide archive vs keep; its unique deferred items are
  already merged above. No code to port; the 33-template exercise catalog idea overlaps
  nyx-fit's existing picker data.
