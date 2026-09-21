# Nyx Fit Roadmap Design

## Goal

Define a product and delivery roadmap for Nyx Fit that aligns the current codebase, known backlog, and future monetization/platform work into a sequence of focused epics. The roadmap should preserve Nyx Fit's mobile-first workout logging priority while expanding the app into a mode-aware product for beginners, intermediate lifters, advanced athletes, and coaches.

## Product Intent

Nyx Fit is a dark-first fitness app that should feel powerful, precise, and playful. Its primary use case is quick mobile workout logging with minimal friction. The product must support multiple user levels and later adapt the experience by mode, while keeping one coherent design system and one maintainable architecture.

## Current State

### What already exists

- React 19 + TanStack Start + Tailwind v4 + shadcn + Convex + better-auth stack
- Mobile-responsive home, workouts, stats, weights, settings, and profile screens
- Workout creation and tracking
- Weight logging and history
- Basic statistics and progress views
- Appearance preferences such as font themes and attendance display variants
- PWA groundwork via `vite-plugin-pwa`
- Dark-first visual language with glassy cards, animated hero sections, and bold typography

### Current design and product signals from the codebase

- Fast-access mobile navigation is already a priority
- Dark mode is the primary aesthetic, with light mode partially supported in tokens
- Purple, orange, and cyan are recurring accents
- Motion and blur are used for premium energy rather than utilitarian minimalism
- The codebase already hints at user profile segmentation through `fitnessLevel`

### Gaps between current state and target product

- No complete user-mode system that meaningfully changes product behavior
- Settings are incomplete relative to the desired control surface
- Stats and weights need polish and consistency improvements
- Workout logging lacks advanced speed features like smart defaults, timers, and duplication
- Monetization, feature gating, and subscription flows are not yet implemented
- PWA/distribution work is incomplete despite partial setup
- Analytics, growth tracking, and acquisition assets are not yet in place

## Design Context Summary

### Users

Nyx Fit serves beginners, intermediate lifters, advanced athletes, and coaches. The app should prompt for user level after login during profile creation, then tailor defaults, guidance, and feature emphasis to that mode. The selected mode must remain switchable in settings.

### Primary job to optimize

The fastest and most polished experience in the app should be logging workouts on mobile.

### Emotional and brand direction

- Emotional baseline: confidence and focus
- Brand personality: powerful, precise, playful
- Reference products: Apple Fitness for polish and premium motion, Duolingo for approachable progression and motivation
- Anti-references: generic SaaS dashboards, hardcore bro-gym apps, cheap gaming UI

### Accessibility baseline

- WCAG AA should be treated as the default bar
- Reduced-motion accommodations should be supported as a first-class quality requirement

## Roadmap Structure

The roadmap should be organized as product lanes so design, frontend, backend, and business work can progress in a dependency-aware order without mixing unrelated concerns into one giant implementation effort.

### Lane 1: Foundation

Purpose: establish the product rules, profile data, UX standards, and shared primitives that every other lane depends on.

Scope:

- Complete profile and onboarding foundations
- Capture and persist user level/mode
- Expand settings into a real control hub
- Standardize page-shell patterns across home, workouts, stats, weights, and settings
- Normalize accessibility, loading, and empty states
- Formalize design-system tokens and reusable layout components where needed

Exit criteria:

- User level is captured and editable
- Shared page architecture exists across core surfaces
- Settings can host experience, units, rest timer, and future mode controls cleanly
- Core screens meet an agreed accessibility and motion baseline

### Lane 2: Core Logging

Purpose: make the main logging loop faster, more expressive, and better suited to repeat use.

Scope:

- Edit workouts after completion
- Infer exercise category from name and present a select-based flow
- Integrate wheel pickers for reps and weight
- Add rest timer entry points and customizable defaults
- Add duplicate-set and smart add-set actions
- Group exercises by body part where helpful
- Preserve speed for advanced users while keeping interaction understandable for beginners

Exit criteria:

- Logging common workout actions takes fewer taps
- Editing a completed workout is supported safely
- Set entry flows are faster and more consistent on mobile

### Lane 3: Progress

Purpose: make user progress obvious, trustworthy, and motivating without slowing down the core product.

Scope:

- Weights page chart fixes and pagination
- Units switching between lbs and kgs across the app
- Stats page alignment with the workouts/weights design language
- Better record surfacing, trend clarity, and empty/loading states
- Future progress surfaces such as volume trends, PRs, and body-part frequency

Exit criteria:

- Weights and stats feel equally polished and production-ready
- Unit preferences propagate consistently
- Progress data is easier to scan and compare

### Lane 4: Mode System

Purpose: turn the app from one generalized workout tracker into one adaptable product with multiple training philosophies.

Scope:

- Define beginner, intermediate, advanced, and coach modes
- Establish what changes per mode: defaults, onboarding copy, guidance level, workout flow emphasis, and feature visibility
- Define the mode rules that later guided and freeform workout experiences must follow

Mode design rules:

- Beginners get more guidance, explanation, and safer defaults
- Intermediate users get balanced support and speed
- Advanced users get maximum efficiency and fewer interruptions
- Coaches get management-oriented tools and future client workflows

Exit criteria:

- Mode choice is set during onboarding and adjustable later
- At least one onboarding or settings-driven UX difference is visible for each mode
- The app can resolve the active mode from persistent user data without fallback ambiguity
- A documented contract exists for which future features may vary by mode

### Lane 5: Premium

Purpose: create a monetization model that feels additive rather than punitive.

Scope:

- Subscription architecture and provider selection
- Free-tier limits
- Premium-only features
- Gated guided workouts and future workout publishing once those features exist
- Subscription state handling and upgrade UX

Product rules:

- Free tier must remain useful for solo workout logging
- Premium should unlock leverage, structure, and extended value
- Upgrade prompts should appear in context, not as spammy overlays

Exit criteria:

- A provider is selected and documented before billing implementation begins
- Users can see plan boundaries and upgrade entry points clearly
- Premium entitlement checks have a single source of truth

### Lane 6: Platform

Purpose: complete the installable app experience and prepare for distribution.

Scope:

- Finish PWA installability and manifest/service-worker quality
- Add splash and loading experiences consistent with the brand
- Evaluate packaging/distribution path for Play Store and App Store
- Close gaps between web app behavior and mobile-app expectations

Exit criteria:

- Install prompt, manifest, and service-worker behavior work in manual verification
- Loading, splash, and install states match the shared design system
- Distribution prerequisites are documented as an actionable checklist

### Lane 7: Growth

Purpose: support launch, learning, and monetization optimization.

Scope:

- Product metrics and subscription analytics
- User-behavior tracking for onboarding, retention, and upgrade funnels
- Success metrics for mode adoption and premium conversion

Exit criteria:

- Key funnels are measurable
- Core business events are tracked
- A documented event list exists for onboarding, logging, retention, and upgrade flows

### Lane 8: Launch Assets

Purpose: create outward-facing assets that match the product's visual direction and launch goals.

Scope:

- Creative asset pipeline for Instagram and TikTok ads
- Messaging hooks aligned with beginner, intermediate, advanced, and coach positioning
- Reusable visual motifs that stay consistent with the app brand

Exit criteria:

- At least one reusable ad concept system exists for short-form channels
- Launch assets clearly align with the in-product brand direction
- Asset production requirements are documented for future execution

## Epic Sequence

The work should be executed in this order to minimize rework:

1. Foundation
2. Core Logging
3. Progress
4. Mode System
5. Premium
6. Platform
7. Growth
8. Launch Assets

Rationale:

- Foundation is required before mode-aware or monetized UX can stay coherent
- Core Logging and Progress improve the core product before adding business complexity
- Mode System depends on stable settings, profile, and core workout flows
- Premium depends on a clear product boundary and value ladder
- Platform and Growth are most effective once product behavior and value are more stable
- Launch assets are best produced after the product positioning and value story are clearer

## Candidate Epics To Write As Separate Plans

Each of these should become its own implementation plan so separate agents can work without overwhelming context.

1. `foundation-mode-ready-shells`
2. `core-logging-speed-improvements`
3. `progress-pages-polish-and-units`
4. `mode-system-v1`
5. `premium-subscriptions-and-gating`
6. `pwa-and-distribution-readiness`
7. `growth-analytics-instrumentation`
8. `launch-assets-and-channel-creative`

## Recommended First Epic

The first implementation plan should be `foundation-mode-ready-shells`.

Why this goes first:

- It unlocks the user-level prompt and mode-aware architecture the product now depends on
- It creates the settings and profile surface needed for future controls
- It gives stats, weights, and settings a shared page system before more features are layered on
- It reduces visual and architectural drift across the app

### First epic scope

- Add or refine profile onboarding to capture user level after login
- Make user mode editable in settings
- Bring stats and settings into the same page-shell quality level as workouts/weights
- Define shared page-surface patterns, header treatments, and section spacing
- Prepare settings to host future controls like units, timers, and mode philosophy toggles

### Explicitly out of scope for the first epic

- Subscription billing implementation
- Full guided workout system
- App-store packaging
- Marketing asset production
- Broad analytics instrumentation

## Architecture Implications

This roadmap implies a few implementation constraints that future plans should preserve:

- One shared design system should adapt by mode rather than forking the app into separate products
- Page shells and reusable feature sections should be composed from app-level components, not copy-pasted route markup
- Profile and settings become the control plane for personalization
- Convex should remain the source of truth for persistent product data, while temporary UI preferences may stay local until they become user-account features

## Ownership Boundaries

- `better-auth`: authentication identity and session lifecycle
- Convex profile data: persisted user profile, selected mode, and account-level preferences that should survive devices/sessions
- Client-local UI state: temporary display preferences that are not yet promoted to account-level settings
- Premium entitlement layer: one authoritative source for subscription status and feature access checks
- Analytics layer: event capture for onboarding, retention, workout usage, and upgrades, with a consent/privacy strategy defined before broad rollout

## Error Handling and Edge Cases To Carry Into Planning

- Users may skip or partially complete profile setup
- Onboarding persistence may fail after auth succeeds and must recover without trapping the user in a broken state
- Mode switching must not destroy workout or stats data
- Free vs premium boundaries must fail safely and visibly
- Subscription sync or webhook failure must not silently grant or remove paid access
- Unit conversion must be consistent across stored values, displays, and charts
- Guided mode must not make freeform logging harder for advanced users
- Reduced-motion users still need a premium-feeling experience without forced animation
- Offline or weak-network states must not break active workout logging or leave profile/settings updates in an unclear state
- Analytics collection must respect privacy requirements and any future consent model

## Success Criteria

The roadmap is successful if it enables future plans to answer these questions clearly:

- Which product lane does this task belong to?
- What existing code and UX foundations does it depend on?
- Is this work improving mobile workout logging, mode adaptation, monetization, platform readiness, or growth?
- Can the work be implemented as a focused epic without mixing unrelated business, design, and platform changes?

## Testing and Validation Expectations For Future Plans

Every implementation plan derived from this roadmap should include:

- Route-level UI verification for mobile and desktop widths
- Accessibility checks for contrast, semantics, keyboard support, and reduced motion
- Loading, empty, and error state coverage
- Convex/auth validation where persistent settings or entitlements are involved
- Regression checks for workout logging speed and navigation stability

## Open Decisions Reserved For Later Epics

These are intentionally deferred to later plans rather than solved in this roadmap spec:

- Exact subscription provider and billing model details
- Exact free-tier limits and premium packaging
- Full coach/client feature depth
- App-store packaging approach beyond feasibility and prerequisites
- Exact analytics vendor and event taxonomy

## Non-Goals

This roadmap spec does not define:

- Detailed wireframes for each page
- Exact backend schema changes per epic
- The full guided workout content model
- Marketing campaign creative execution details

Those belong in the individual epic plans.
