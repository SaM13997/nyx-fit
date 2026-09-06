# Onboarding remediation: phased implementation checklist

## Assignment

Implement a simpler, truthful, reliable `/onboarding` flow. Fix the authentication and persistence defects before polishing motion. Work through the phases in order and tick tasks only after their acceptance criteria pass.

This document is a proposed implementation plan. It does not authorize new dependencies, backend/schema changes, or new authentication providers. Follow the repository's human-approval requirement before implementation.

Read `AGENTS.md` and `CLAUDE.md` first. Read this entire document before editing code. The older `docs/reviews/implementor-prompt.md` describes the implementation being replaced; do not use its exact-copy or accepted-trade-off instructions as requirements for this work.

## Product decisions used by this plan

These decisions keep the repair frontend-only and remove features that currently exist only as onboarding promises:

1. Use four screens: **Welcome → Experience → Sign in → Complete**.
2. Ask about training experience directly. Save the answer to the existing `fitnessLevel` profile field.
3. Remove goal, equipment, schedule, artificial building, sample-plan, and simulated-logger screens from this flow.
4. Use the existing **Google sign-in** integration. Remove the nonworking email-only form from both onboarding and standalone login. Do not submit an empty password or pretend an email-only signup exists.
5. Remove guest exploration until a useful guest experience exists. Existing-account users can go directly to sign-in without answering the experience question.
6. Completion opens the existing dashboard or a valid preserved destination. It does not claim to create a workout or program.
7. Keep the current visual identity: dark surfaces, existing fonts, purple primary actions, restrained decoration, and accessible controls.

**Approval checkpoint:** the user must accept this reduced scope, particularly Google-only login and removal of the unsupported setup questions. If email authentication is required, stop and request a separately specified email/password or passwordless implementation. Do not invent that scope while executing this plan.

## Repository constraints

- No commits unless explicitly requested.
- No new dependencies or provider changes.
- No Convex schema/backend edits. The existing profile mutation is sufficient.
- Edit application files under `src/` and documentation under `docs/` only.
- Do not manually edit `src/routeTree.gen.ts`; build regenerates it.
- Preserve unrelated user changes. The working tree already contains extensive changes, including line-ending differences.
- Use named exports, `type` aliases, existing import conventions, and strict TypeScript. No `any` or unchecked casts of storage/JSON.
- No new code comments or UI emojis.
- Guard browser APIs and perform storage access after mount, never during server render.
- Keep native buttons, radios, fieldsets, and legends. Interactive targets must be at least 44px.
- Support reduced motion in both CSS and JavaScript-driven animation.
- Prefer one current-step state and a small explicit save-status union. Do not add a state-machine library, global onboarding store, generic wizard framework, or animation coordination framework.

## Known defects to eliminate

| ID | Defect | Required outcome |
| --- | --- | --- |
| A1 | A resolved Better Auth error is treated as successful authentication | Returned errors stay on sign-in and display an actionable message |
| A2 | Empty-password email sign-in cannot provide the advertised email-only signup | No empty-password requests or unsupported email-only UI |
| A3 | Local navigation runs immediately after requesting a Google redirect | Provider callback owns post-authentication navigation |
| U1 | Guest completion loops back to Get Started | No unsupported guest path |
| U2 | Plan, coach, and first-session promises are unsupported | Copy accurately describes profile setup and dashboard access |
| D1 | Saving is fire-and-forget and failed drafts are discarded | Save success, failure, retry, and abandonment are explicit |
| M1 | Building reveals a plan, removes it, then animates a fresh copy | Remove this duplicated reveal entirely |
| M2 | Header advances while outgoing content still appears | Header and displayed screen update together |
| M3 | Variable-height centering and focus can move the viewport unexpectedly | Stable top alignment and deliberate focus/scroll behavior |
| M4 | Duplicate backdrop filters increase compositing work | No overlapping blurred reveal layers |
| U3 | Coach radio selection auto-navigates | Selecting an answer never changes screen |
| U4 | Recent frequency is treated as experience | Ask experience directly |
| U5 | Tutorial teaches controls different from the actual logger | Remove the simulated logger |
| U6 | Progress, refresh, and legal-page return are inconsistent | Truthful current-step progress and resumable setup |
| U7 | Install prompt can overlay onboarding and add separate motion | Suppress it during onboarding and login |

## Phase 0 — Establish the baseline

### Tasks

- [ ] Confirm the product decisions above with the user before implementation.
- [ ] Read the current onboarding files and their tests:
  - `src/routes/onboarding.tsx`
  - `src/components/onboarding/OnboardingFlow.tsx`
  - `src/components/onboarding/config.ts`
  - `src/components/onboarding/QuestionStep.tsx`
  - `src/components/onboarding/ScheduleStep.tsx`
  - `src/components/onboarding/BuildingStep.tsx`
  - `src/components/onboarding/PreviewSteps.tsx`
  - `src/components/onboarding/OnboardingFlow.test.tsx`
- [ ] Read integration points:
  - `src/components/login-form.tsx`
  - `src/routes/login.tsx`
  - `src/routes/index.tsx`
  - `src/routes/__root.tsx`
  - `src/components/BottomNav.tsx`
  - `src/components/InstallPrompt.tsx`
  - `src/lib/auth-client.ts`
  - `src/lib/convex/hooks.ts`
  - `src/lib/types.ts`
  - `src/styles.css`
- [ ] Read `convex/auth.ts` and `convex/profiles.ts` to verify existing APIs. Do not modify them.
- [ ] Record relevant existing changes using `git status --short` and a scoped `git diff --ignore-space-at-eol`.
- [ ] Run the baseline checks:

```bash
npx tsc --noEmit
npm test -- --config docs/reviews/onboarding-vitest.config.ts
```

### Acceptance criteria

- Product decisions are approved or the unresolved decision is explicitly reported.
- Baseline failures, if any, are recorded before editing.
- The implementer understands that `useUpsertCurrentProfile()` takes no arguments and returns `{ upsertCurrentProfile }`; the mutation takes `{ updates: { fitnessLevel } }`.

## Phase 1 — Correct shared authentication

### Files

- `src/components/login-form.tsx`
- `src/routes/login.tsx`
- `src/components/onboarding/OnboardingFlow.tsx` as needed to remove obsolete props
- Relevant authentication tests

### Tasks

- [ ] Replace the unsupported email-only form with the existing Google sign-in action. Remove email input, empty-password submission, and email-specific hints/counter/loading copy.
- [ ] Preserve the `LoginForm` named export to avoid unnecessary import churn.
- [ ] Keep configurable heading, description, and callback URL where useful. Remove the email-only `onAuthenticated` callback when no caller needs it.
- [ ] Read the returned result of `authClient.signIn.social(...)`. If `result.error` exists, show its message or the existing useful fallback and remain on the screen.
- [ ] Also handle thrown/network errors. Clear submitting state on failure so retry works.
- [ ] Prevent duplicate requests while one request is pending. Keep the loading label specific to Google sign-in.
- [ ] Remove the unconditional post-request `navigateAfterAuth()` call. A successful redirect response is a request to visit Google, not evidence that the user is signed in.
- [ ] Keep the button pending during a successful provider handoff. A response without either an error or a usable redirect/success outcome must not silently appear successful; use the installed client response type to handle it.
- [ ] Preserve the existing onboarding OAuth callback URL and its encoded destination.
- [ ] For standalone login, explicitly return through `/login` with the preserved destination so its authenticated-session handling can finish navigation.
- [ ] Use the same local-destination validation policy for `/login` and `/onboarding`: reject external/protocol-relative URLs, backslashes, and control/whitespace characters. Exclude `/login` and `/onboarding` destinations, including query/hash variants, to prevent self-redirect loops.
- [ ] Update standalone copy to describe Google sign-in accurately. Change “New here? Build your plan” to “New here? Set up your profile”.
- [ ] Keep Terms and Privacy links keyboard-accessible and at least 44px high.

### Acceptance criteria

- A resolved `{ data: null, error: ... }` response shows an error and does not navigate.
- A thrown error behaves similarly.
- A successful OAuth initiation does not call router navigation before provider authentication.
- Repeated taps send one active request.
- There are no `password: ""` calls or email-only signup claims in the affected login UI.
- Both standalone and onboarding callback URLs preserve valid destinations.

## Phase 2 — Replace the questionnaire with a truthful four-screen flow

### Files

- `src/components/onboarding/config.ts`
- `src/components/onboarding/OnboardingFlow.tsx`
- `src/components/onboarding/QuestionStep.tsx`
- `src/routes/index.tsx` only if entry copy needs adjustment

### Target copy and behavior

| Screen | Copy | Primary action | Secondary action |
| --- | --- | --- | --- |
| Welcome | “Train with intent.” / “Log workouts and follow your progress. Start by setting your training experience.” | “Set up my profile” → Experience | “I already have an account” → Sign in, with no staged profile update |
| Experience | “What is your training experience?” / “Choose the closest fit. You can change this in your profile settings.” | “Continue” → Sign in; disabled until selected | Back → Welcome |
| Sign in, setup path | “Save your profile.” / “Sign in with Google to save your training experience and track your workouts.” | Existing Google sign-in action | Back → Experience |
| Sign in, existing-account path | “Welcome back.” / “Sign in with Google to continue.” | Existing Google sign-in action | Back → Welcome |
| Complete, successful setup | “Your profile is ready.” / “You can update your training experience in profile settings.” | “Open dashboard” for `/`, otherwise “Continue” | None required |

The existing-account path redirects to the destination after verified authentication; it does not show a profile-saved confirmation or write a fitness level.

### Tasks

- [ ] Replace the old step union/sequence with the four screens above. Keep completion/save status separate from the questionnaire answer.
- [ ] Replace frequency options with three direct experience options:
  - `beginner`: “Beginner” — “I'm learning the basics or building a foundation.”
  - `intermediary`: “Intermediate” — “I'm comfortable with the basics and have trained consistently.”
  - `advanced`: “Advanced” — “I have extensive training experience and manage my own programming.”
- [ ] Preserve the backend spelling `intermediary`; display “Intermediate” in the UI.
- [ ] Do not change an existing account's `pro` value merely because it signs in. Profile writes require an explicit setup answer.
- [ ] Reuse the native radio/fieldset structure in `QuestionStep`. Selection changes only the selected value; Continue performs navigation.
- [ ] Remove coach, goal, days-per-week, equipment, generated-plan, and simulated-logger behavior from the rendered flow.
- [ ] Remove the artificial building delay and every timer used only for onboarding presentation/auto-advance.
- [ ] Remove unsupported guest exploration and “Start first workout” actions.
- [ ] Replace highest-reached/endowed progress with actual current-screen progress. Back must update both the visible label and accessible value consistently.
- [ ] Use “Step X of 4” for the setup path. Hide the setup progress rail on the existing-account shortcut so it does not imply that skipped setup was completed.
- [ ] Keep bottom navigation hidden for all onboarding screens, including after authentication.
- [ ] Do not create a workout, plan, roster, template, or coach mode as part of this repair.

### Acceptance criteria

- Only the approved screens are reachable.
- Every displayed promise corresponds to an existing action or persisted field.
- All experience options use the same select-then-Continue behavior.
- Existing-account sign-in does not overwrite profile experience.
- Progress always describes the currently displayed setup screen.

## Phase 3 — Make draft restoration and saving reliable

### Files

- `src/components/onboarding/config.ts`
- `src/components/onboarding/OnboardingFlow.tsx`
- `src/routes/onboarding.tsx`

### Draft contract

Use one small versioned `sessionStorage` draft with this information:

```ts
type OnboardingDraft = {
  version: 2;
  step: "experience" | "auth";
  fitnessLevel: "beginner" | "intermediary" | "advanced" | null;
};
```

- `auth` requires a non-null answer. Reject inconsistent drafts.
- Existing-account sign-in has no profile draft.
- Never persist a claim that saving succeeded.
- The old `{ goal, fitnessLevel }` payload is obsolete; ignore/clear it instead of silently committing it after this redesign.

### Tasks

- [ ] Implement guarded, try/catch-protected storage helpers with an explicit type guard for the new contract.
- [ ] Restore the draft after client mount. Use a stable loading shell while auth and draft initialization resolve so Welcome does not flash before a resumed screen.
- [ ] Persist the experience selection and the resumable step when they change.
- [ ] Verify that visiting Terms or Privacy and returning restores the setup screen and answer.
- [ ] Deliberately starting a fresh setup or choosing existing-account sign-in clears obsolete setup staging.
- [ ] If storage is unavailable, keep in-memory interaction working and explain before leaving for OAuth that the answer cannot survive the redirect. Offer “Continue to sign in” with guidance that experience can be set in profile settings. Do not claim automatic profile saving in this branch.
- [ ] On authenticated OAuth return with a valid `auth` draft, wait for Convex authentication readiness before saving. Use the existing `convex/react` authentication hook; inspect its installed API rather than assuming Better Auth session presence means Convex is ready.
- [ ] Save only the explicitly selected `fitnessLevel` using the existing mutation.
- [ ] Use an explicit save-status union such as `idle | saving | saved | error`. Show a status message while saving and show Complete only after success.
- [ ] Prevent duplicate concurrent mutations caused by re-renders/session updates. An explicit Retry may start a new attempt after failure.
- [ ] On failure, retain the draft, show a useful error, and provide “Retry saving” and “Continue without saving”. Do not silently retry in the background.
- [ ] “Continue without saving” must explicitly discard the draft and navigate to the authenticated destination. It must not render “Your profile is ready.”
- [ ] Clear the draft after successful persistence. Clear it after explicit abandonment, not in an unconditional `finally` block.
- [ ] Give authentication-readiness waiting a bounded failure path. If it does not become ready within 10 seconds, retain the draft and offer retry/continue-without-saving. Clean up this timeout on unmount or readiness; this is a recovery timeout, not a presentation delay.
- [ ] Ignore late async UI/navigation updates after unmount. Do not assume an already-sent mutation can be cancelled.
- [ ] A signed-in visit without a valid ready-to-save draft redirects to the validated destination without writing a profile.
- [ ] Use replacement navigation for automatic post-auth redirects and final completion where appropriate, so browser Back does not repeatedly reopen a completed onboarding route.

### Acceptance criteria

- Refresh and legal-page return preserve the unfinished setup.
- Malformed, old, or inconsistent storage never causes a profile mutation.
- No mutation is sent before Convex authentication is ready.
- Save failure retains recoverable data and does not display success.
- Retry works without duplicate concurrent writes.
- Explicit abandonment is the only failed-save path that discards the draft.
- Signed-in existing users with no setup draft are not reclassified.
- OAuth completion never depends on an email-form callback.

## Phase 4 — Simplify layout and motion

### Files

- `src/components/onboarding/OnboardingFlow.tsx`
- `src/components/onboarding/QuestionStep.tsx`
- `src/components/login-form.tsx`
- `src/components/InstallPrompt.tsx`
- `src/styles.css` only if a scoped rule is needed

### Motion implementation choice

Use **one short incoming opacity animation**, approximately 160ms, on the current screen content. Remove outgoing-screen retention and horizontal slide animation from this flow. Under reduced motion, use no animation.

This lets header, progress, controls, and content switch together without separate requested/displayed-step state or a transition lock.

### Tasks

- [ ] Remove onboarding's `AnimatePresence mode="wait"`, directional variants, `direction` state, exit-presence plumbing, and presentation timers once unused.
- [ ] Keep only one screen's interactive content mounted at a time.
- [ ] Apply the short entrance fade to screen content. Do not animate the entire page/background or use staggered child entrances.
- [ ] Keep reduced-motion handling explicit. CSS media rules alone do not disable Framer Motion animations.
- [ ] Top-align screen headings beneath the header. Remove vertical centering based on each screen's content height.
- [ ] Reduce welcome artwork and vertical spacing so decoration does not dominate small mobile screens.
- [ ] Use a consistent action-area layout. On short screens and with the keyboard visible, content and actions must remain reachable by scrolling.
- [ ] Keep safe-area padding. Do not fix the page to a height that clips text, errors, buttons, or keyboard-obscured content.
- [ ] On user-driven screen changes, focus the incoming heading with `preventScroll: true`. Explicitly reset scroll to the top once for the screen change; do not scroll again during the fade.
- [ ] Do not steal focus on the initial Welcome render. Restore focus appropriately for resumed screens and error states.
- [ ] Remove `whileTap` scaling from radio labels. Selection/focus styling is sufficient feedback.
- [ ] Use ordinary translucent/solid card backgrounds. Remove onboarding backdrop filters and large blurred decorative layers; no duplicate skeleton/card layers should remain.
- [ ] Avoid a long descendant-selector override on `LoginForm`. Put shared accessible styling in the shared component and use a small explicit prop only if onboarding truly needs a variant.
- [ ] Suppress rendering the install prompt on `/onboarding` and `/login`, including when an install event was already captured. Preserve the deferred event so the prompt can be used later on an eligible route.
- [ ] Keep native radio keyboard behavior, visible focus, at least 44px targets, and clear selected indicators.

### Acceptance criteria

- Header and screen content cannot display different steps.
- No revealed element is immediately destroyed and animated again.
- No artificial waiting or automatic advancement remains.
- Back and Continue remain predictable under rapid repeated taps.
- At 320px width, large text, short height, and keyboard-open layouts, all content/actions are reachable without horizontal scrolling.
- Reduced motion removes the entrance fade and interaction scaling.
- The install prompt cannot overlay authentication/setup.

## Phase 5 — Remove obsolete code and update regression coverage

### Cleanup tasks

- [ ] Search all references before removing old helpers, props, imports, and types.
- [ ] Remove obsolete code associated with goal, equipment, schedule, plan derivation, fake building, coach branching, and logger auto-advance.
- [ ] `BuildingStep.tsx`, `ScheduleStep.tsx`, and `PreviewSteps.tsx` should no longer be imported. These are currently user-owned/untracked files: delete them only with explicit user approval. If approval is absent, leave them intact and report them as unused remnants.
- [ ] Rewrite the onboarding tests around the new behavior; remove assertions that require false success, silent save failure, or artificial delays.
- [ ] Make auth mocks return realistic `{ data, error }` results. A resolved `undefined` must not stand in for authenticated success.
- [ ] Test normal-motion and reduced-motion behavior separately. Do not globally force every `matchMedia` query to return true.
- [ ] Keep tests at the auth/mutation boundaries; do not implement a mock backend.

### Required meaningful regression cases

- [ ] Resolved Google error stays on auth, displays the error, and permits retry.
- [ ] Thrown/network auth error has the same recovery behavior.
- [ ] Successful provider initiation sends the correct callback and does not locally navigate before authentication.
- [ ] Repeated auth taps do not start concurrent requests.
- [ ] Existing-account sign-in has no profile mutation.
- [ ] Setup radios require an explicit Continue and preserve the selected experience on Back.
- [ ] Refresh/route remount restores a valid draft; malformed/old/inconsistent drafts are rejected.
- [ ] Storage failure uses the explicit degraded path and does not falsely claim a saved answer.
- [ ] OAuth return waits for Convex readiness, then saves exactly the chosen experience.
- [ ] Save failure retains staging; Retry can succeed; abandonment clears staging and uses accurate navigation.
- [ ] Unmount prevents late UI/navigation updates; readiness timeout is cleaned up.
- [ ] Progress and visible screen agree during forward/back navigation.
- [ ] Outgoing controls are absent rather than retained during an entrance fade.
- [ ] Onboarding BottomNav and install prompt remain hidden after session state changes.
- [ ] Valid redirects preserve query/hash; invalid and self-loop redirects use the dashboard fallback.
- [ ] Standalone login still supports Google error handling and its authenticated callback.

### Acceptance criteria

- The tests would fail if the original returned-error or silent-data-loss bugs were reintroduced.
- Tests do not claim to measure FPS, browser layout, or real OAuth.
- No obsolete behavior remains reachable from the application.

## Phase 6 — Browser/device verification and final review

### Automated checks

Run the existing commands after implementation:

```bash
npx tsc --noEmit
npm test -- --config docs/reviews/onboarding-vitest.config.ts
npm run build
git -c core.whitespace=cr-at-eol diff --check
```

- [ ] Record exit codes and relevant output.
- [ ] Run other existing tests affected by shared login/install-prompt changes, if present.
- [ ] Inspect the final scoped diff for unrelated edits and generated-file surprises.
- [ ] Do not broaden scope to unrelated baseline failures without reporting them.

### Browser/device checks

Use an available browser tool or installed browser. Do not install dependencies without approval. If no browser is available, mark this subsection blocked and provide the checklist for human verification.

- [ ] Check 320×568, 375×667, 390×844, and a desktop-width viewport.
- [ ] Check 200% text/zoom and a short-height/landscape viewport.
- [ ] Check normal motion and OS reduced motion.
- [ ] Check keyboard-only navigation: Tab, Shift+Tab, radio arrow keys, Space, Enter, and Back.
- [ ] Check safe areas in installed mobile/PWA presentation when a device is available.
- [ ] Check that long auth/save errors wrap and do not obscure actions.
- [ ] Advance and go back rapidly. Confirm there is no stale heading, counter mismatch, ghost control, or unexpected second navigation.
- [ ] Scroll a short screen, navigate, and verify the next heading lands predictably without a second scroll snap.
- [ ] Visit Terms/Privacy during setup, return, and refresh at Experience and Sign in.
- [ ] Exercise real Google success, cancellation, and callback on a configured test environment. Use a test account; do not change backend provider configuration during this task.
- [ ] Check authenticated save success and an intentionally simulated client-side save failure/retry without damaging real account data.
- [ ] Trigger or simulate install eligibility and confirm the overlay is suppressed on login/onboarding.

### Performance checks

- [ ] Profile a production build; do not use dev-mode timing as the release result.
- [ ] Record forward/back transitions under CPU throttling and, if available, on a representative phone.
- [ ] Inspect main-thread long tasks, layout/paint activity, and frame timing around screen changes.
- [ ] Verify there are no repeated layout/paint operations throughout the opacity-only entrance attributable to the onboarding implementation.
- [ ] At 60Hz, inspect frames exceeding the approximately 16.7ms budget. Record device/throttle settings and observed results; do not claim universal 60fps from one desktop trace.
- [ ] If remaining jank is observed, identify the operation responsible before adding optimization code. Do not blanket-apply `will-change`, `translateZ(0)`, memoization, or animated heights.

### Final review

- [ ] Recheck every defect ID in the table at the top and state its disposition.
- [ ] Classify new findings as P0/P1/P2/P3. Resolve P0/P1 and re-review until none remain; report blocked verification separately.
- [ ] Perform the repository simplification pass using `delete:`, `stdlib:`, `native:`, `yagni:`, and `shrink:` labels where applicable.
- [ ] Record actual net line change from the final scoped diff. Do not present the earlier audit's estimated savings as measured results.
- [ ] Stop adding changes once the requirements and relevant checks pass.

## Definition of done

- Authentication errors cannot produce a success screen.
- A profile-saved message requires a successful profile mutation.
- Existing-account login does not modify experience.
- No unsupported guest, saved-plan, adaptive-program, coach-mode, or first-workout promise remains in the affected flow.
- Drafts survive ordinary refresh/legal-page navigation and remain recoverable after save failure.
- Screen changes have one short entrance treatment, stable layout, synchronized progress, and predictable focus.
- The reduced flow and shared login have meaningful passing regression tests, a passing typecheck, and a passing production build.
- Browser/device verification is completed or explicitly listed as outstanding; code tests alone are not a visual-performance sign-off.

## Required final implementation report

Write a concise report under `docs/reviews/` and summarize it to the user:

1. **Completed phases and files changed.**
2. **Defect disposition:** each ID fixed, blocked, or intentionally deferred with the reason.
3. **Problems and blockers:** product decisions, baseline failures, unavailable browser/live auth, or denied file deletion.
4. **Assumptions and confidence:** especially Google-only scope and any unverified environment behavior.
5. **Verification evidence:** commands, exit codes, test counts, browser/device settings, and performance observations.
6. **Remaining P2/P3 findings and actual simplification results.**

## Planning evidence and assumptions

- This checklist was derived from a read-only audit of the current implementation and its integration points.
- Audit baseline: 21 onboarding tests passed and `tsc --noEmit` passed.
- Additional in-memory probes reproduced false success on an auth error, header/content timing mismatch, and plan DOM replacement at the building handoff.
- Browser frame drops and live authentication were not measured during that audit. Browser verification remains necessary.
- High confidence: the existing profile mutation can store the selected experience without backend changes.
- Proposed product assumption, requiring confirmation: Google-only login and the reduced four-screen setup are acceptable.
- This planning task changes documentation only; no application build or new tests are required for the document itself.

## Reference guidance

- Better Auth results and OAuth callbacks: https://www.better-auth.com/docs/basic-usage
- Animation lifecycle semantics: https://motion.dev/docs/react-animate-presence
- Animation performance and profiling: https://web.dev/articles/animations-guide
- Contextual onboarding guidance: https://www.nngroup.com/articles/onboarding-tutorials/
- Predictable behavior when changing inputs: https://www.w3.org/WAI/WCAG22/Understanding/on-input.html
