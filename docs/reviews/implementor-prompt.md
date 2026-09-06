# IMPLEMENTOR PROMPT — Nyx Fit onboarding redesign (plan v3, review-converged)

Copy everything below the line into the agent.

---

You are the IMPLEMENTOR agent for the Nyx Fit codebase at /var/home/sarthak13997/D/dev/personal/nyx-fit.

FIRST: read `AGENTS.md` (repo root — your operating contract) and `CLAUDE.md` (design principles). Then read these reference files to match conventions before writing anything: `src/routes/login.tsx`, `src/routes/index.tsx`, `src/routes/settings_.profile.tsx`, `src/components/login-form.tsx`, `src/components/BottomNav.tsx`, `src/lib/convex/hooks.ts`, `src/lib/types.ts`, `convex/schema.ts`, `package.json`, `tsconfig.json`.

Execute the implementation plan below EXACTLY. Do NOT commit. No code comments. No emojis. No new dependencies. No Convex schema changes, no new auth providers.

## Context

Replace the static 3-slide onboarding carousel in `src/routes/login.tsx` with a modern, conversion-driven `/onboarding` flow. This plan passed a two-cycle review loop (0 open P0/P1). Known-verified facts: TanStack Start SSR app (route `beforeLoad` runs server-side — do not add one); `useUpsertCurrentProfile()` hook takes NO arguments and returns `{ upsertCurrentProfile }`; the mutation takes `{ updates }` and `profileUpsertValidator` accepts `v.optional(fitnessLevel)` (i.e., `undefined` ok, `null` REJECTED); `FitnessLevel = "beginner" | "intermediary" | "advanced" | "pro"` (no coach value — coach users must NOT write fitnessLevel); better-auth 1.3.27 `signIn.social` accepts `callbackURL?: string`; framer-motion v12 installed; `onExitComplete` on `AnimatePresence mode="wait"` fires BEFORE the entering child is committed to the DOM (verified in installed source) — never use it for focus; tsconfig has `noUnusedLocals: true`; there is NO typecheck script and `vite build` does NOT typecheck.

## Files to CREATE (7)

### 1. `src/routes/onboarding.tsx`
`createFileRoute("/onboarding")` with `validateSearch` exposing `redirect?: string` — same shape as `src/routes/login.tsx` lines 10–15, PLUS hardening: only accept `redirect` if it starts with `"/"` and does not start with `"//"`; otherwise undefined (open-redirect hardening). Render `<OnboardingFlow redirect={redirect} />`. NO `beforeLoad`, NO route-level authenticated redirect (server-side beforeLoad destroyed staged answers on the OAuth full-page return — this was P1-1 in review; do not reintroduce it). `src/routeTree.gen.ts` regenerates on build — never hand-edit it.

### 2. `src/components/onboarding/config.ts`
No React. Contains all types, copy, options, derivation, storage helpers.

```ts
type Goal = "build-muscle" | "get-stronger" | "stay-consistent" | "coach";
type LastWeekSessions = "0" | "1-2" | "3-4" | "5+";
type DaysPerWeek = 2 | 3 | 4 | 5;
type Equipment = "barbell" | "dumbbells" | "machines" | "bodyweight" | "bands";
type QuizAnswers = {
  goal: Goal | null;
  lastWeekSessions: LastWeekSessions | null;
  daysPerWeek: DaysPerWeek | null;
  equipment: Equipment[];
};
type StepId =
  | "welcome" | "goal" | "level" | "schedule"
  | "building" | "plan-preview" | "logger-peek" | "auth" | "done";
type StagedOnboarding = {
  fitnessLevel: "beginner" | "intermediary" | "advanced" | "pro" | null;
  goal: Goal;
};
```

- `deriveFitnessLevel(answers)`: `"0" | "1-2"` → `"beginner"`, `"3-4"` → `"intermediary"`, `"5+"` → `"advanced"`, `goal === "coach"` → `null` (coach NEVER writes fitnessLevel — "pro" is wrong data; schema has no coach value).
- `derivePlan(answers)`: pure static lookup → `{ levelLabel, days, sessions: string[] }` for the plan-preview card. E.g. beginner/3d → `["Full Body A — Squat, Press, Row", "Full Body B — Hinge, Push, Pull", "Full Body C — Legs, Push, Core"]`. Scale sessions with `daysPerWeek` (2 → 2 sessions; 4 → Upper/Lower ×2; 5 → PPL+Upper/Lower style). `goal === "coach"` → coach-framed sessions ("Roster ready — templates for your athletes" framing). Keep honest — this is a static preview, not generated programs. Do NOT thread `equipment` into derivePlan if it isn't an input (ponytail).
- `buildSequence(goal)`: coach → `["welcome","goal","building","plan-preview","logger-peek","auth","done"]`; else `["welcome","goal","level","schedule","building","plan-preview","logger-peek","auth","done"]`.
- Storage: key constant `"nyx:onboarding:staged"`. `readStagedOnboarding()` / `clearStaged()` / `writeStaged(payload)` helpers: all access wrapped in `typeof window !== "undefined"`, `JSON.parse` inside try/catch, then hand-written type guard `isStagedOnboarding(value: unknown): value is StagedOnboarding` checking both fields' literal unions (must accept `fitnessLevel: null` for the coach path). Parse-don't-validate — no bare casts of untrusted data.
- Copy deck (exact strings — see "Copy deck" section below) and quiz option configs exported from here.

### 3. `src/components/onboarding/OnboardingFlow.tsx`
Orchestrator. State: `const [index, setIndex]`, `[maxIndex, setMaxIndex]` (init `1` — endowed progress: welcome is credited, rail never starts at 0%), `[answers, setAnswers]`, and `flowStartedRef = useRef(false)`.

- Sequence: `buildSequence(answers.goal)`. The coach sequence shortens mid-flow when goal = coach is chosen (goal is index 1 in BOTH sequences, so no step jump). Key rendered steps by `step.id` so radio state survives.
- ProgressRail rendered INLINE (~10 lines, no separate file): segments = `sequence.length`, `h-1.5 flex-1 rounded-full`, filled `bg-white` when `segmentIdx <= maxIndex` else `bg-white/10` (highest-reached, forward-only). Wrapper: `role="progressbar" aria-label="Onboarding progress" aria-valuemin={1} aria-valuemax={sequence.length} aria-valuenow={maxIndex + 1}`. Key the rail container on `answers.goal` to avoid a width-snap when the coach path shortens it.
- Step transitions: `<MotionConfig reducedMotion="user">` wraps the flow; `<AnimatePresence mode="wait" custom={direction}>`; enter `{ x: 20 * dir, opacity: 0 }` → `{ x: 0, opacity: 1 }`, exit `{ x: -20 * dir, opacity: 0 }`, duration 0.3, `ease: [0.32, 0.72, 0, 1]`. Animate only transform/opacity. NO `console.debug` in shipped code (P3 — do not add step-transition logging at all).
- **Focus (P1-B fix)**: focus is driven by the INCOMING step's mount `useEffect`, NOT by `onExitComplete` (which fires before the entering child exists in the DOM). Mechanism: `OnboardingFlow` keeps a `focusStepId` state (or `shouldFocusOnMount` boolean passed as prop); after each transition completes, set it so the newly mounted step's h1 receives focus in its own `useEffect`. Each step's heading is an `h1` with `tabIndex={-1}` and `focus:outline-none`. Suppress focus on the very first (Welcome) mount via a ref so page load doesn't steal focus.
- **Exhaustive step switch**: `switch (step.id)` with `default` branch containing `step satisfies never` — adding a StepId must fail the build.
- **Mount effect (P1-A fix — the guard is mandatory)**:
```ts
useEffect(() => {
  if (isSessionPending) return;
  if (!session) return;
  if (flowStartedRef.current) return;
  flowStartedRef.current = true;
  const staged = readStagedOnboarding();
  if (staged) {
    if (staged.fitnessLevel) {
      commitStaged(staged).finally(() => clearStaged()).then(() => router.history.push(redirect ?? "/"));
    } else {
      clearStaged();
      router.history.push(redirect ?? "/");
    }
  } else {
    router.history.push(redirect ?? "/");
  }
}, [isSessionPending, session, redirect, router.history]);
```
  - `flowStartedRef` prevents the effect from re-firing when `session` flips truthy mid-flow after email sign-in (otherwise it would double-commit and yank the user off the Done step — this exact bug was P1-A in review).
  - `session && !staged` (absent/invalid JSON/failed guard) → silent redirect home, no error UI, ever (P3-3).
- `commitStaged(staged)` (P2-1 + P2-3):
```ts
const commitStaged = async (staged: StagedOnboarding) => {
  if (staged.fitnessLevel === null) return;      // coach: v.optional rejects null; skip entirely
  try {
    await upsertCurrentProfile({ updates: { fitnessLevel: staged.fitnessLevel } });
  } catch {
    if (cancelledRef.current) return;
    await new Promise((r) => setTimeout(r, 1500));
    if (cancelledRef.current) return;
    try {
      await upsertCurrentProfile({ updates: { fitnessLevel: staged.fitnessLevel } });
    } catch {
      return;                                     // silent: fitnessLevel unset, flow never blocked
    }
  }
};
```
  Uses `useUpsertCurrentProfile()` from `src/lib/convex/hooks.ts` (no args; returns `{ upsertCurrentProfile }`; mutation takes `{ updates }`). `cancelledRef` set true in unmount cleanup. Only `fitnessLevel` is sent to Convex (goal has no schema field).
- **Auth step** (rendered inline):
```tsx
<LoginForm
  heading="Save your plan."
  description="One account keeps your plan, history, and progress safe."
  callbackURL={authCallbackUrl}
  onAuthenticated={handleEmailAuthenticated}
/>
```
  where `authCallbackUrl = redirect ? \`/onboarding?redirect=${encodeURIComponent(redirect)}\` : "/onboarding"`.
  `handleEmailAuthenticated`: set `flowStartedRef.current = true`; read staged → `commitStaged(staged)` fire-and-forget then `clearStaged()`; advance to `done`. Below the form: small text link "Not now — explore without saving" → `clearStaged()` then advance to `done` WITHOUT commit (P2-2: staged must not linger and commit stale data later).
- **Done step** (rendered inline): h1 "You're set." sub "Session 1 is waiting. Start strong." single CTA "Start first workout" → `clearStaged()` then `router.history.push(redirect ?? "/")`, disabled after first tap. This is the ONLY large CTA on this screen.

### 4. `src/components/onboarding/QuestionStep.tsx`
Config-driven quiz renderer for the goal and level questions. Native controls only:
- `<fieldset>` + `<legend>` — the legend text is the question and the accessible group name.
- Options: `<label>` cards wrapping visually-hidden native `<input type="radio">` (shared `name` per question, `value` = answer literal). No ARIA-recreated radio pattern.
- Card: `min-h-11` minimum (prefer `py-4`), rounded-xl, `border-white/10 bg-white/5`; selected (`:checked` via peer/group) = `border-purple-500 bg-purple-500/10` + trailing `Check` icon (never color-alone state); `focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2 focus-within:ring-offset-black` (WCAG 2.4.7); `whileTap={{ scale: 0.97 }}`; `transition-colors duration-150`.
- Goal "I coach others": advances immediately on select; others select → Continue.

### 5. `src/components/onboarding/ScheduleStep.tsx`
- Days pills 2/3/4/5, default derived from level answer (`"0"→3`, `"1-2"→3`, `"3-4"→4`, `"5+"→5`). Radio-style native inputs same pattern as QuestionStep.
- Equipment multi-select chips: `aria-pressed` toggle buttons (Barbell, Dumbbells, Machines, Bodyweight, Bands); defaults `dumbbells` + `bodyweight` preselected; same focus-visible treatment.
- CTA "Build my plan" — advancing past this step (or past goal, on the coach path) writes the staged payload via `writeStaged({ fitnessLevel: deriveFitnessLevel(answers), goal })`.

### 6. `src/components/onboarding/BuildingStep.tsx`
The 2.8s "building your plan" beat:
- Staggered lines: "Goal locked in." → "Calibrated to last week." → "Split set for {days} days." (coach variant: "Roster ready."-framed lines).
- Status copy "Building your plan…" in an element with `role="status"` (`aria-live="polite"`).
- Advance driver: a `setTimeout` — 2800ms full motion, 500ms under `useReducedMotion()` — stored in a ref and CLEARED on unmount. The timer is the ONLY advance mechanism (never `onAnimationComplete`).
- Skeleton plan card crossfades (~300ms) into the real card at the end of the beat.

### 7. `src/components/onboarding/PreviewSteps.tsx`
Two exports in one file:
- `PlanPreviewStep`: h1 "Your first week". Glassy card (`border-white/10 bg-white/5 backdrop-blur rounded-2xl`): mode badge `text-cyan-300`, `"{Level} · {days} days"` stat `text-orange-300` (cyan/orange ONLY here — purple stays for CTAs/selected, red never), session rows stagger 70ms, sub "Your plan adapts as you log.", CTA "Looks right".
- `LoggerPeekStep`: h1 "Logging takes seconds.". Card "Push Day", row "Bench Press — 3 × 8" with a tappable set circle that fills with a check (120ms, scale 0.6→1). After first tap, auto-advance ~1.2s (timer cleared on unmount). Link "Skip preview" (small text). CTA "Continue".

## Files to MODIFY (4)

### A. `src/routes/login.tsx`
STRIP the entire STEPS carousel (lines ~19–50 and all carousel rendering). Keep: `validateSearch` + `redirect` logic + auth guard + session-redirect effect verbatim; the `bg-black` canvas and existing gradient-orb recipe (`bg-purple-900/20` / `bg-blue-900/10` `rounded-full blur-3xl`); `<LoginForm />` centered. Add ONE small text link: "New here? Build your plan" → `/onboarding` (preserve the `redirect` param in the link's search). `/login` must remain a fully working standalone sign-in (it is the entry point from `settings.tsx:105`, `UserButton.tsx:33`, `settings_.profile.tsx:202`, legal pages — do not change those). With `noUnusedLocals: true`, remove every import the carousel strip orphans (AnimatePresence, motion, lucide icons, Button, useState if unused) or `npx tsc --noEmit` will fail.

### B. `src/components/login-form.tsx`
```ts
type LoginFormProps = React.ComponentProps<"div"> & {
  heading?: string;
  description?: string;
  onAuthenticated?: () => void;
  callbackURL?: string;
};
```
Defaults: `heading = "Welcome Back"`, `description = "Enter your email to sign in or create an account"` — rendered in the existing h1/p; the h1 also gets `id="login-heading"` `tabIndex={-1}` `focus:outline-none` (it is the Auth step's focus target).
- Email path (`handleEmailSignIn`): `onAuthenticated ? onAuthenticated() : navigateAfterAuth()` — when provided, it REPLACES navigation entirely (no double navigate).
- Social path (`handleGoogleSignIn`): `await authClient.signIn.social({ provider: "google", ...(callbackURL ? { callbackURL } : {}) });` — keep the existing post-await `navigateAfterAuth()` line untouched (unreachable on real redirect; preserves `/login` behavior).
- With all props absent, `/login` behavior is byte-identical to today. Auth/error logic otherwise untouched.

### C. `src/routes/index.tsx`
Signed-out "Get Started" (line ~75) → `/onboarding` instead of `/login` (preserve the redirect param if present; note `/` has no `validateSearch` — read the param via `router.state.location.search` or add matching validateSearch, whichever matches existing conventions).

### D. `src/components/BottomNav.tsx`
Add `pathname === "/onboarding"` to the hide condition on line 20. REQUIRED, not redundant (P2-2 evidence): after email auth mid-flow, `session` is truthy while still on `/onboarding` — without the pathname check the nav pops in over the Done step.

## Copy deck (exact strings)

| Step | Copy |
|---|---|
| Welcome | h1 "Train with intent." · sub "Log sets in seconds, see your progress build week after week." · meta "2 minute setup" · CTA "Get Started" · small link "I already have an account" (jumps straight to auth step) |
| Goal | legend/h1 "What are you chasing?" · sub "We'll shape your plan around it." · options "Build muscle" / "Get stronger" / "Stay consistent" / "I coach others" · CTA "Continue" |
| Level | legend/h1 "How many days did you train last week?" · sub "Honest beats ambitious. We'll calibrate from here." · options "0 — Starting fresh" / "1–2 days" / "3–4 days" / "5 or more" · CTA "Continue" |
| Schedule | h1 "Set your week." · label "Training days per week" · label "What can you train with?" · chips "Barbell" "Dumbbells" "Machines" "Bodyweight" "Bands" · CTA "Build my plan" |
| Building | lines "Goal locked in." / "Calibrated to last week." / "Split set for {days} days." · status "Building your plan…" |
| Plan preview | h1 "Your first week" · sub "Your plan adapts as you log." · CTA "Looks right" |
| Logger peek | h1 "Logging takes seconds." · card "Push Day" · row "Bench Press — 3 × 8" · link "Skip preview" · CTA "Continue" |
| Auth | via LoginForm props: heading "Save your plan." · description "One account keeps your plan, history, and progress safe." · link "Not now — explore without saving" |
| Done | h1 "You're set." · sub "Session 1 is waiting. Start strong." · CTA "Start first workout" |

## A11y bar (from AGENTS.md)
Native fieldset/legend/radio throughout; legend = accessible group name; focus-visible rings on all interactive elements; ≥ `min-h-11` targets; headings `tabIndex={-1}` + `focus:outline-none`; `role="status"` on building; progressbar aria attrs; selected state = border + bg + check icon (never color alone); body copy `text-zinc-400`+ (no new `text-gray-500`); `MotionConfig reducedMotion="user"` + timer-driven building beat.

## Verification gates (ALL required before you finish)
1. `npx tsc --noEmit` — MUST pass (no typecheck script exists; vite build does not typecheck). This also validates the better-auth 1.3.27 `callbackURL` input type.
2. `npm run build` — MUST pass; regenerates `src/routeTree.gen.ts` for the new route.
3. Self-review checklist: `/login` renders identically with props absent; email onboarding path reaches Done with no BottomNav visible; Google path returns to `/onboarding` then redirects with upsert attempted (coach: no upsert); signed-in visit to `/onboarding` with no staged payload → silent redirect home; "Not now" path clears staged storage; coach sequence = 7 steps, rail consistent; no unused imports anywhere (noUnusedLocals).

## Known accepted trade-offs (do NOT "fix" these)
- Single 1.5s retry in commitStaged masks genuine duplicate mutations.
- Done copy does not reflect a failed upsert.
- `goal` is staged client-side only — no Convex field exists; do NOT touch the schema.
- sessionStorage lost if the tab is killed mid-OAuth → silent skip of upsert (already handled).

## Report when done
Per AGENTS.md: (1) files created/modified; (2) explicit "Problems & blockers" section; (3) assumptions + confidence; (4) verification evidence (tsc output tail, build result, checklist results).
