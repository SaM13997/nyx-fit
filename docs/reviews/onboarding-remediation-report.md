# Onboarding remediation — final implementation report (Phase 5)

## 1. Completed phases and files changed

Phases 1–4 were already implemented in the working tree on branch `dev-pwa` and were left intact:

- `src/components/login-form.tsx` — Google-only sign-in, returned/thrown error handling, single-flight guard, no local navigation on provider handoff.
- `src/components/onboarding/OnboardingFlow.tsx` — four-screen flow (Welcome → Experience → Sign in → Complete), versioned draft, explicit save-status union, bounded Convex-readiness wait, retry/abandon, single entrance fade.
- `src/components/onboarding/config.ts` — new draft contract alongside legacy exports (see §3 B1).
- `src/components/onboarding/QuestionStep.tsx`, `src/components/InstallPrompt.tsx` (suppressed on `/login` + `/onboarding`), `src/routes/login.tsx`, `src/routes/onboarding.tsx`, `src/lib/redirect.ts` (new, shared destination policy).

Phase 5 work by this agent — one app file touched, no route/backend/config changes:

- `src/components/onboarding/OnboardingFlow.test.tsx` — full rewrite, 414 → 749 lines, 31 tests covering every required regression case in `docs/reviews/onboarding-remediation-tasks.md` Phase 5. Auth mocks return realistic `{ data, error }` (never bare `undefined` for success); `convex/react` `useConvexAuth` and router history (`push`/`replace`) are mocked; normal vs reduced motion are separate tests with no global `matchMedia` forcing.

## 2. Defect disposition

| ID | Status | Evidence |
| --- | --- | --- |
| A1 returned-error treated as success | Fixed | `login-form.tsx` branches on `result.error`; tests: resolved-error stays + retry (onboarding + standalone) |
| A2 empty-password email signup | Fixed | No `password`/`email`/navigation references remain in `login-form.tsx` (grep clean); standalone copy is Google-only with “New here? Set up your profile” link test |
| A3 immediate local navigate after Google request | Fixed | No router usage in `login-form.tsx` (grep clean); success tests assert `push`/`replace`/`navigate` uncalled and button stays pending |
| U1 guest loop | Fixed | No `guest` references in `OnboardingFlow.tsx`; no guest path in tests |
| U2 unsupported plan/coach promises | Fixed | Flow copy limited to profile setup + dashboard; old copy keys survive only for unused remnants (§3 B1) |
| D1 fire-and-forget save / discarded drafts | Fixed | `idle\|saving\|saved\|error` union; failure retains draft + Retry succeeds; only abandonment discards; timeout keeps draft |
| M1 duplicated building reveal | Fixed | `BuildingStep` unimported from app code (only self-references remain) |
| M2 header/content mismatch | Fixed | Single state, one `motion.div`, no `AnimatePresence`/`direction` state; outgoing-controls-absent + progress-sync tests |
| M3 unstable centering/scroll | Fixed | `items-start` top alignment, one `scrollTo(0,0)` + `preventScroll` focus per screen change; focus assertion in tests |
| M4 duplicate backdrop filters | Fixed | No `backdrop` in `OnboardingFlow.tsx` |
| U3 coach auto-advance | Fixed | `QuestionStep` selection only sets value; radios-require-Continue test |
| U4 frequency-as-experience | Fixed | Direct beginner/intermediary/advanced options; backend spelling `intermediary` preserved and asserted in mutation payloads |
| U5 simulated logger | Fixed | `LoggerPeekStep` unimported from app code |
| U6 progress/refresh/legal-return inconsistency | Fixed | Current-step `progressbar` + `Step X of 4`; draft restore on remount; malformed/old/inconsistent rejection tests |
| U7 install overlay + motion | Fixed | `InstallPrompt` suppressed on both routes with deferred event preserved; `BottomNav` hidden; hidden-after-sign-in test |
| M1–M4 | Fixed | See M1–M4 rows above |

No new P0/P1 findings. The review loop converges here.

## 3. Problems and blockers

- **B1 (blocked): legacy `config.ts` exports not removed.** The task brief describes `BuildingStep.tsx`, `ScheduleStep.tsx`, `PreviewSteps.tsx` as untracked; they are in fact git-tracked, unmodified, and still import `Goal`, `QuizAnswers`, `derivePlan`, `defaultDays`, `buildSequence`, `STAGED_KEY` helpers and old `copy` keys. Removing those exports breaks `npx tsc --noEmit` on files this phase is forbidden to touch or delete. `config.ts` was therefore left untouched. Grep confirms the remnants are unreachable from application code (references only each other). Deleting the three files needs explicit user approval; the legacy config cluster can be removed immediately after.
- **B2 (worked around, stated): storage-failure simulation.** In this repo’s jsdom, `window.sessionStorage`’s prototype is not the test-realm `Storage.prototype`, so neither prototype nor instance spies intercept `setItem` (verified by probe). The degraded-path test instead installs a throwing `sessionStorage` getter (Safari-private-mode shape), which exercises the same guarded code paths (`isDraftStorageAvailable` → false, degraded copy, no false save claim, post-sign-in fallback).
- **B3 (worked around, stated): per-test reduced-motion switching.** framer-motion v12 (`motion-dom`) lazily initializes its reduced-motion sensor once per module lifetime and queries `(prefers-reduced-motion)` a single time, so per-test `matchMedia` flipping cannot work. Motion tests instead drive the `useReducedMotion` boundary via a partial `framer-motion` mock: normal motion asserts the entrance starts at opacity 0 and reaches 1; reduced motion asserts opacity is never 0 and the flow stays usable.
- **B4 (blocked): browser/device and performance checks.** No browser tool exists in this environment. Human checklist: 320×568 / 375×667 / 390×844 / desktop; 200% text and short-height landscape; OS normal + reduced motion; keyboard-only (Tab, arrows on radios, Enter, Back); installed-PWA safe areas; long error wrapping; rapid forward/back; Terms/Privacy leave-and-return + refresh at Experience and Sign in; real Google success/cancel/callback on a configured test account; simulated save failure/retry against a test account; install-eligibility overlay suppression. Perf: profile a production build under CPU throttling, inspect long tasks/frames around the 160ms entrance; do not claim 60fps from dev timing.
- **B5 (noted): `window.localStorage` is undefined** in this vitest jsdom setup (vitest warns localStorage is unavailable), so `InstallPrompt` dismissal persistence is unexercised; route suppression assertions are unaffected.

## 4. Assumptions and confidence

- Google-only login and the four-screen scope are taken as approved product decisions per the plan; if email auth is required, that is separate specified work. Confidence: high that the code matches the plan, approval itself is a human gate.
- `useUpsertCurrentProfile()` takes no arguments and the mutation takes `{ updates: { fitnessLevel } }`; all save assertions use exactly this shape. Confidence: high (hook source read).
- Tests stop at the auth/mutation boundary with no mock backend, so real Convex latency, real OAuth redirects, and real OS motion settings are unverified. Confidence: high on logic, none claimed on visual/performance sign-off.

## 5. Verification evidence

- `npx tsc --noEmit` → exit 0, no output.
- `npm test -- --config docs/reviews/onboarding-vitest.config.ts` → exit 0, 1 file, 31/31 passed.
- `npm run build` → exit 0 (production bundle + service worker generated).
- `git -c core.whitespace=cr-at-eol diff --check` → exit 0.
- No other test files exist (`src/**/*.test.*` glob returns only the onboarding suite), so no further shared login/install suites to run.
- Scoped diff inspection: the only file modified by this phase is the test file; Phase 1–4 diffs, `src/lib/redirect.ts`, and all other working-tree entries are untouched by this agent. No `routeTree.gen.ts`, `convex/`, or other route edits.

## 6. Remaining P2/P3 findings and simplification results

- **P2:** after user approval to delete the three remnant step files, remove the legacy `config.ts` cluster (`Goal`, `LastWeekSessions`, `DaysPerWeek`, `Equipment`, `QuizAnswers`, `StagedOnboarding`, `dayOptions`, `equipmentOptions`, `deriveFitnessLevel`, `defaultDays`, `derivePlan`, `buildSequence`, `STAGED_KEY` family, old `copy.schedule/building/preview/logger` keys) and fold `clearLegacyStagedOnboarding` into a one-line legacy-key clear.
- **P3:** the 749-line suite is as small as the required case list allows; shared helpers (`reachSetupAuth`, `findHeading`, `seedDraft`, `entrancePanel`, `renderLoginRoute`) are each used ≥2×.
- Simplification pass: `delete:` blocked by B1, nothing else removable; `stdlib:` no new utilities; `native:` native RTL role queries only, no custom framework; `yagni:` no cases beyond the required list; `shrink:` helpers factored as above. Measured scoped change for files touched by this phase: `OnboardingFlow.test.tsx` +622/−287 (414 → 749 lines). Full-tree stat is dominated by carried Phase 1–4 work and is reported in §5’s diff inspection, not claimed as this phase’s result.
