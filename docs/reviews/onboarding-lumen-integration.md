# Live Lumen onboarding integration

Date: 2026-09-12

## Implementation

The production `/onboarding` route now renders the same four Lumen screens as
`/design/onboarding`. The design board retains its simulated authentication and save timer;
the live route uses the existing authentication, draft recovery, and Convex persistence.

Six implementer-profile agents covered integration, shared presentation, design/slop review,
Emil/motion review, performance, and independent final review. The final independent review
approved the implementation with no P0, P1, or P2 findings.

### Main changes

- `src/components/onboarding/OnboardingFlow.tsx`: shared Lumen screen composition,
  full-viewport light theme, real-step transitions, focus management, and existing-account
  presentation. Auth readiness, profile mutation, retry/abandon, and redirect behavior remain
  in the production controller.
- `src/lib/use-google-sign-in.ts` and `src/components/login-form.tsx`: one shared Google
  sign-in implementation with per-caller callback URLs and the existing error handling.
- `src/components/onboarding/lumen/screens/`: real pending/error/completion props, shadcn
  error/status UI, accessible headings, compact action wrapping, and legal targets at least
  44 by 44 px. The approved art, copy, and existing radio descriptions remain shared.
- `LumenSaveProfileScreen.tsx`: pending and error states reveal the action region with native
  nearest scrolling. Status changes preserve the screen instance and artwork rather than
  replaying a whole-screen entrance or resetting the internal scroll.
- `LumenBackground.tsx`, `LumenShell.tsx`, and scoped `src/styles.css`: native 34-second
  background drift, image-level blur, asynchronous decoding, Welcome image priority,
  reduced-motion-safe press feedback, and horizontal clipping at the original boundary.
- `OnboardingConceptBoard.tsx`: consumes the shared screen props and explicitly describes
  its simulated behavior.

The complete UI catalog is intentionally retained. The earlier onboarding kit still serves
other design boards. No dependencies, schema, backend, or authentication providers were added.

## Verification

| Check | Result |
| --- | --- |
| `bun x tsc --noEmit` | Passed after the final status-visibility fix |
| `bun x vitest run --config docs/reviews/onboarding-vitest.config.ts` | 34/34 passed |
| `bun run --bun build` | Passed directly in final review, exit code 0 |
| Mechanical design detector | No findings on changed UI, background, shell, and CSS |
| Final headless Edge checks | 30/30 passed |
| axe WCAG A/AA scans | 13 scans, zero violations |

The 31 existing tests retain their behavioral coverage, with updated Lumen copy, Radix radio
assertions, and three-stage progress semantics. Three regressions are additionally covered:
Back preserves the selected level; leaving/re-entering clears sign-in errors; and save status
changes retain the panel while revealing its actions.

Browser checks covered 320 x 568, 390 x 844, and 1280 x 900: layout, focus, selection, Back,
radio descriptions, errors, callback preservation, pending controls, legal targets, and
reduced/normal motion. Twelve accessibility scans cover the live unauthenticated screens and
their error states; one covers the shared Ready screen in the design board.

Provider requests were intercepted in the isolated browser for pending/error verification.
No real Google account sign-in or live Convex profile mutation was performed during browser
verification; the automated integration suite exercises those orchestration paths with mocks.

## Performance

Measurements compare the pre-migration and completed production manifests using the same
gzip method, excluding shared main/CSS from the route-specific row.

| Metric | Before | After |
| --- | ---: | ---: |
| Onboarding route JavaScript, gzip | 24,635 B | 39,603 B |
| Cold JavaScript + CSS, gzip | 245,057 B | 260,017 B |
| Service-worker precache | 6,866,539 B | 6,869,587 B |
| Existing onboarding PNGs | 4,512,577 B | 4,512,577 B |

The live route adds approximately 15 KB gzipped JavaScript (+6.1% to cold JS/CSS), accounting
for the Lumen screens and Radix primitives. Its import graph excludes the design board,
prototype controller, old onboarding kit, and unused catalog components. Main/CSS sizes are
essentially unchanged.

The existing 4.51 MB image precache is a non-blocking performance note. Supplied assets and
current offline caching were retained. Image conversion and service-worker policy changes
were outside this integration.

## Final independent review

Approved: no P0, P1, or P2 findings. The reviewer independently traced OAuth handoff against
the installed Better Auth client, auth readiness, persistence, retry/abandon, existing-account
behavior, redirects, focus, status visibility, and reduced motion.

Two optional P3 simplifications remain in `LumenSaveProfileScreen.tsx`: the sign-in error
message ref duplicates protection already provided by the effect dependencies, and the error
message is extracted twice. Together these could remove approximately eight lines; neither
affects behavior or blocks completion.

The independent reviewer ran the build directly, confirming exit code 0 and matching final
precache sizes. This resolved the performance agent's earlier PowerShell stderr-redirection
status ambiguity. Existing dependency/tooling build warnings were also present in the
baseline and do not indicate a new migration failure.

No unresolved implementation blockers remain. Verification confidence is high for the
reviewed code paths and automated behavior; physical iOS/Android devices and an actual
Google account round trip were not part of this verification.
