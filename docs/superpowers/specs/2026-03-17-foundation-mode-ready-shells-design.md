# Foundation Mode-Ready Shells Design

## Goal

Create the first implementation-ready epic for Nyx Fit by establishing a shared page-shell system, a persistent user-mode foundation, and a settings/profile control surface that future mode, progress, and premium work can build on safely.

## Why This Epic Comes First

Nyx Fit already has several functional surfaces, but they are drifting in structure and polish. The product now also depends on user mode as a core concept. Before adding guided workouts, premium gating, or distribution work, the app needs one coherent foundation for:

- how pages are visually structured
- where user-level preferences live
- how the app resolves and exposes the active user mode
- how settings and profile pages control future personalization

This epic should reduce design drift and create the product boundary that later epics depend on.

## In Scope

- Capture a user's mode during post-login profile completion if no mode has been selected yet
- Persist the selected mode as account-level profile data
- Make user mode editable from settings
- Upgrade `stats`, `weights`, and `settings` page shells so they follow one shared visual and structural system
- Keep `workouts` as the visual reference for the shell direction in this epic, without requiring a full route rewrite unless a small compatibility adjustment is needed
- Prepare settings to host future controls such as units, timers, and mode-dependent preferences
- Establish the first explicit mode contract for what can vary by mode in later epics
- Normalize loading, empty, and error states on the touched routes

## Out of Scope

- Guided workout content or templates
- Subscription billing or premium entitlements
- App-store packaging
- Marketing asset production
- Advanced analytics implementation
- Full unit-conversion rollout beyond making room for it in settings architecture

## User Experience Summary

### Core behavior

- A newly authenticated user who has not completed profile mode selection should be guided to finish profile setup before the app treats personalization as complete.
- An existing user should be able to review and change their mode from settings without losing workout, stats, or profile data.
- Core routes should feel like part of one product family, not separate experiments.

### UX priorities

1. Keep access to workout logging fast and unblocked.
2. Make mode selection feel meaningful but lightweight.
3. Keep settings understandable now while leaving obvious room for future controls.
4. Preserve the premium dark-first athletic aesthetic without adding more visual noise.

## Shared Page-Shell Design

### Problem

Current route shells use different header heights, hero treatments, spacing rules, and content containers. This creates inconsistency between `workouts`, `weights`, `stats`, and `settings`.

### Target pattern

All core product routes touched in this epic should use the same page-shell vocabulary:

- `PageShell`: shared route wrapper that owns vertical layout, bottom-nav-safe spacing, and content width
- `PageHero`: top visual area with route identity, accent treatment, and short page description
- `Content container`: shared max width, horizontal padding, and vertical rhythm
- `SectionBlock`: cards or grouped modules with consistent corner radius, border treatment, and backdrop blur rules
- `StateBlock`: standardized loading, empty, and inline error containers

### Unit boundaries

- `PageShell` owns page-level spacing, viewport behavior, and the main route container
- `PageHero` is a shared route header primitive used on every touched top-level route in this epic
- `SectionBlock` is owned by each route or feature section and composes content inside the shell
- `StateBlock` is a shared presentation primitive for loading, empty, and inline error states that routes can render inside `SectionBlock` or directly inside the shell content area when no section exists yet

### Shell rules

- The hero region may vary by accent color, iconography, and title, but not by overall spacing model
- The content container should use one shared width and one consistent spacing scale
- A route can be visually richer than another, but not structurally different without a product reason
- Settings should feel equally premium even if it uses less chart-heavy content
- The plan should prefer shared app-level shell components over route-by-route copy-paste layout code

## Mode Contract

This epic defines the contract, not the full implementation depth, of the mode system.

### Supported modes

- `beginner`
- `intermediate`
- `advanced`
- `coach`

### What may change by mode in future epics

- onboarding copy and guidance density
- default workout behaviors and suggested flows
- feature emphasis and page ordering
- educational hints and helper text
- future guided-workout defaults

### What must stay shared across modes

- authentication model
- core workout data model
- bottom navigation and route structure unless a later spec says otherwise
- settings and profile as the control plane
- design system primitives, accessibility behavior, and baseline interaction quality

### Mode resolution rules

- The app should resolve the active mode from persisted account-level profile data
- If no mode is present, the user is considered incomplete for personalization and should be routed into completion UX
- Temporary local UI state must not override the persisted mode silently
- Changing mode later updates the persisted source of truth and any mode-dependent UI derived from it
- An invalid or legacy persisted mode value should be treated as missing mode and routed through the same completion UX

## Missing-Mode Routing Contract

- Users with a missing or invalid mode are soft-gated, not hard-blocked from the entire product
- The app should redirect them into completion UX from profile/settings entry points and from any post-login personalization prompt
- Workout logging access should remain available so the core job stays fast and unblocked
- After a successful mode save, the user should return to the route they were using when that context exists; otherwise the app may return them to the default home route
- The UI should not repeatedly interrupt a user within the same in-progress save or retry state

### Route access matrix

- `home`: accessible, but may show a lightweight completion prompt
- `workouts` and active workout logging routes: accessible, but may show a lightweight completion prompt
- `stats`: accessible, but may show a lightweight completion prompt until mode is saved
- `weights`: accessible, but may show a lightweight completion prompt until mode is saved
- `settings`: accessible and may host mode editing directly
- `settings_/profile`: accessible and may host first-time completion messaging

No route in this epic should hard-block the user away from workout logging solely because mode is missing.

## Profile Completion Flow

### Trigger condition

The flow should trigger after login when the user has an authenticated session but no persisted mode selection.

### Placement

The first-time completion UX should reuse the profile/settings surface rather than introducing a separate onboarding route in this epic. The plan should treat `settings_/profile` as the first completion destination after login when mode is missing, while `settings` remains the long-term home of the authoritative mode-editing control.

### Requirements

- It should feel like profile completion, not a separate onboarding product
- It should explain why mode matters in simple language
- It should require one explicit mode choice before personalization is considered complete
- It should avoid blocking the user behind a long multi-step funnel

### Definition of complete

For this epic, `profile setup complete` means `a valid user mode has been selected and persisted`. Other profile fields may remain editable and are not part of the completion gate for this first version.

### UX rules

- Keep the selection concise and mobile-friendly
- Each mode option should communicate philosophy, not just skill level labels
- The user should understand that mode is changeable later in settings

## Settings and Profile Control Surface

### Settings responsibilities after this epic

- expose current mode
- own the authoritative mode-editing UI
- organize appearance, current controls, and future preference categories cleanly
- act as the future home for units, timers, and personalization toggles

### Profile responsibilities after this epic

- own persisted personal/account-level fields
- clearly show whether profile setup is complete
- support editing foundational user attributes without mixing in unrelated premium or analytics settings

### Boundary between profile and settings

- `Profile` owns identity-like and account-level attributes
- `Settings` owns experience configuration and entry points into editable profile data
- If a value changes product behavior across sessions and devices, it should eventually live in persisted profile/account data even if the first version uses existing UI scaffolding

## Data Ownership

- `better-auth`: identity and session
- Convex profile data: selected mode and other account-level preferences promoted from local-only state
- Client state: temporary UI-only values that are safe to keep local until promoted

This epic should not create competing sources of truth for mode.

## Shared Mode Architecture

The plan for this epic should define shared units for mode handling so routes do not duplicate logic.

- `active mode accessor`: a shared hook or accessor that resolves the current persisted mode, treats invalid values as missing, and exposes completion status
- `mode persistence interface`: a shared save path used by both first-time completion and settings editing
- `missing-mode prompt/redirect logic`: a shared route-aware mechanism that decides when to show a lightweight prompt and when to route the user into completion UX
- `post-save return handler`: a shared mechanism for returning the user to their prior route context after successful first-time completion

First-time completion and later settings editing should reuse the same selector component and persistence interface, with differences limited to surrounding copy, placement, and layout.

## Route-Level Outcomes

### `home`

- remain accessible when mode is missing
- may show a lightweight completion prompt that links into the first-time completion flow
- should not duplicate its own standalone mode resolution logic outside the shared architecture

### `settings`

- adopt the shared page shell
- surface the current mode clearly
- host the authoritative mode-editing UI
- reorganize sections so future units/timers/preferences can fit without redesigning the page again

### `settings_/profile`

- support the first-time completion state cleanly
- coordinate with missing-mode completion messaging, but not own the long-term mode-editing UI
- make completion state obvious without bloating the form
- reuse the shared mode selector and persistence path used by `settings`

### `workouts`

- remain the reference route for the shell direction in this epic
- only receive changes if needed to stay compatible with newly extracted shell primitives

### `stats`

- adopt the shared page shell
- align spacing, section hierarchy, and state presentations with the newer product direction

### `weights`

- align to the same shell vocabulary used by stats/workouts/settings
- preserve the orange-accent identity while reducing one-off layout differences

## Error Handling

- If profile completion persistence fails, the user should see a clear retry path and should not end up in an ambiguous partially-configured state
- If mode update fails from settings, the current persisted mode should remain visible and trustworthy
- If profile data is still loading, touched pages should show consistent loading containers rather than route-specific ad hoc placeholders
- If data is empty, the empty state should still match the shared shell and route tone

## Offline and Network Expectations

- Active workout logging must remain the higher priority than personalization prompts
- If mode/profile persistence fails because of network issues, the UI should explain that the change was not saved
- This epic does not need full offline sync, but it must not imply that unsaved mode changes succeeded when they did not

## Accessibility Expectations

- WCAG AA contrast on route headers, cards, controls, and mode selectors
- Touch targets remain mobile-friendly
- Mode selection remains understandable without relying on color alone
- Any motion added to unify page shells must degrade safely under reduced-motion preferences

## Acceptance Checks

This epic is done when all of the following are true:

- A new authenticated user with no selected mode is guided through completing that choice
- The `home` route can surface a lightweight completion prompt without blocking workout access
- An existing user can find and change their mode from settings
- The active mode is read from one persisted account-level source of truth
- `stats`, `weights`, and `settings` use the same shell structure and spacing system
- Loading and empty states on touched routes follow one consistent presentation style
- Mode changes do not alter or delete workout history, stats history, or weight history

## Testing Expectations For The Plan

The implementation plan for this epic should include:

- route-level UI checks for mobile and desktop widths
- first-time user flow verification for missing mode
- lightweight missing-mode prompt behavior on `home`
- existing-user edit flow verification from settings
- failure-state checks for profile/mode save operations
- reduced-motion and keyboard-accessibility verification for the touched controls

## Non-Goals To Protect During Planning

- do not redesign the entire app while introducing the shell system
- do not implement all future settings categories in this epic
- do not build the full guided workout model here
- do not couple mode selection to subscription logic

## Deliverable From This Spec

The next planning step should produce a focused implementation plan for this epic only. That plan should identify the exact routes, components, profile data hooks, and shared layout units needed to deliver the shell system and mode foundation without pulling in premium, analytics, or platform work.
