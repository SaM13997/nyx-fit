# Nyx Fit PRD — Existing Features & Design

**Product:** Nyx Fit

**Document purpose:** Define the current product scope, feature set, interaction model, and visual design standards for the existing app so future work can be evaluated against a shared product baseline.

**Audience:** Product, design, and engineering contributors working on the current workout logging experience.

---

## 1. Product Summary

Nyx Fit is a mobile-first workout logger designed to help users create workouts, track exercises and sets, review weight history, and monitor training progress over time. The app emphasizes fast in-session logging, low-friction navigation, and a clean dark-themed interface optimized for phones.

The current product focuses on the core workout lifecycle:

1. Start or continue a workout
2. Add exercises and sets quickly
3. Track weights, reps, and timing
4. Review workout and weight history
5. Inspect progress through charts and stats
6. Adjust preferences in settings

---

## 2. Product Goals

### Primary goals
- Make workout logging fast enough to use during a live training session.
- Keep the UI simple, mobile-friendly, and visually consistent.
- Help users track progress without requiring manual spreadsheet-style input.
- Provide clear historical views for workouts, weights, and statistics.

### Secondary goals
- Reduce friction when adding exercises or sets.
- Support future extensibility for advanced workout workflows.
- Maintain a polished, modern design using reusable UI primitives.

### Success criteria
- Users can create and update workouts with minimal taps.
- Users can view workout history and stats without leaving the app flow.
- The app feels responsive on mobile devices and avoids layout shifts.
- Key actions remain discoverable through bottom navigation and clear CTAs.

---

## 3. Target Users

### Primary user: Gym trainee
A person who logs workouts regularly and wants a quick way to track exercises, sets, and weights while training.

### Secondary user: Progress-focused lifter
A user who wants to compare training sessions, visualize improvements, and monitor body-part or weight trends.

### Tertiary user: Casual fitness tracker
A user who exercises less frequently but still wants a lightweight app to store workouts and reference past sessions.

---

## 4. Core Product Principles

### Speed over complexity
The app should minimize required input and avoid unnecessary steps during training.

### Mobile-first usability
The interface should be optimized for one-handed use, small screens, and touch interactions.

### Clear visual hierarchy
The user should always understand:
- what workout is active
- what exercise they are editing
- what the next action is

### Stable, predictable interactions
Reusable drawers, cards, and navigation patterns should behave consistently across the app.

### Modern but restrained aesthetic
The design should feel contemporary without sacrificing clarity or legibility.

---

## 5. Current Feature Inventory

This section documents the existing feature set as the current product baseline.

### 5.1 Core Workout Features

#### Workout creation and tracking
- Users can create workouts.
- Workouts can be tracked as active sessions.
- Workout state persists so users can continue progress within a session.

#### Exercise management
- Users can add exercises to a workout.
- Each exercise can contain multiple sets.
- Set data includes weight and reps.

#### Active workout timer
- An active workout timer is available during training.
- The timer supports session awareness and helps users track workout duration.

#### Weight tracking with history
- The app tracks weight entries over time.
- Historical weight records are available for review.

#### Statistics page with charts
- The app includes a stats view with chart-based visualization.
- Charts are used to represent training and weight trends.

#### Workouts page
- A dedicated workouts page exists for browsing all workouts.
- This page is not exposed through the bottom navigation.
- It is reachable from the home screen via a “View All” interaction.

### 5.2 UX and UI Features

#### Dark theme
- The app uses a dark theme as part of the current design language.
- Visual treatment is suited to gym usage and modern fitness app aesthetics.

#### Mobile-responsive layout
- The UI adapts to smaller screens.
- The layout is designed to avoid cramped interactions and preserve readability.

#### Drawer-based interactions
- Drawer components are used for improved interaction flows.
- Drawers reduce layout shifts and create focused entry points for tasks such as adding exercises and editing sets.

#### Bottom navigation
- The app includes bottom navigation for primary destinations.
- Navigation is optimized for mobile thumb reach.

#### Status bar component
- A status bar is part of the interface.
- It provides at-a-glance session or state information.

### 5.3 Technical/UI infrastructure already in use
- Local IndexedDB storage for client-side persistence.
- shadcn/ui component library for the design system.
- Recharts-based charting for statistics.
- React 19 and TanStack Start as the application foundation.
- Convex + Better Auth in the app stack for backend/auth architecture.
- Bun as the runtime/tooling preference.

---

## 6. Information Architecture

### Primary navigation
The app currently organizes the experience around a small set of high-value views:
- Home / active workout entry point
- Workouts list
- Stats / weight analytics
- Settings

### Home screen responsibilities
The home experience should be the operational hub of the product. It should surface:
- current or recent workout context
- quick access to workout actions
- entry points to deeper history and analytics

### Workouts view responsibilities
The workouts page should support:
- browsing all workouts
- inspecting prior sessions
- drilling into workout details

### Stats/weights view responsibilities
The stats area should support:
- monitoring weight history
- viewing training charts
- comparing performance over time

### Settings responsibilities
The settings area should support:
- app preferences
- units and timing preferences
- controls that influence training workflow

---

## 7. Functional Requirements by Existing Surface

## 7.1 Home / Workout Session

### Purpose
Provide the fastest route into a live or recent workout session.

### Requirements
- Display the current workout state clearly.
- Show a primary action for continuing or starting a workout.
- Offer access to workout creation and add-exercise flows.
- Present the most relevant summary information without overwhelming the screen.
- Preserve touch-friendly spacing and legibility.

### Interaction rules
- Primary CTAs should be visually dominant.
- Secondary actions should remain visible but de-emphasized.
- Editing actions should not interrupt the workout flow unnecessarily.

---

## 7.2 Workout Detail / Active Session

### Purpose
Support live logging during a workout session.

### Requirements
- Users can add exercises to the workout.
- Users can add multiple sets per exercise.
- Users can enter weight and reps for each set.
- Active session timing should remain visible or accessible.
- Workouts should feel editable while maintaining session continuity.

### Existing UX patterns
- Drawers are used for focused data entry.
- Set controls are designed to minimize accidental disruption.
- The interface should prioritize quick completion over verbose configuration.

---

## 7.3 Workouts List Page

### Purpose
Provide a complete history of workouts outside the bottom nav flow.

### Requirements
- Show all workouts in a browsable list.
- Make the page reachable from the home screen’s “View All” action.
- Present metadata that helps users identify sessions quickly.
- Support tapping into a specific workout for review.

### Design implications
- The list should feel like a secondary but important history view.
- The content density should be higher than the home screen, but still readable on mobile.

---

## 7.4 Stats / Weight Page

### Purpose
Help users understand progress through charts and historical data.

### Requirements
- Show chart-based views of weight or training data.
- Display historical trends clearly.
- Keep the experience mobile-friendly.
- Use pagination or progressive loading where data density would otherwise overwhelm the screen.

### Current design direction
- Charts should be clean, legible, and structured around the app’s dark theme.
- Visual emphasis should support quick interpretation rather than dense analysis.

---

## 7.5 Settings Page

### Purpose
Let users control preferences that affect logging behavior and display.

### Requirements
- Settings should feel like a first-class page, not a hidden utility screen.
- Preferences should be organized clearly.
- Any unit or timing controls should be easy to find and understand.
- Changes should have visible effects throughout the app.

### Design expectations
- The settings page should use the same design language as the rest of the app.
- Controls should be grouped by theme: workout behavior, units, timers, and app preferences.

---

## 8. Design Requirements

## 8.1 Visual Style

### Overall look and feel
- Dark mode by default.
- Clean, modern, fitness-oriented aesthetic.
- Minimal visual noise.
- Strong contrast for readability.

### Tone
- Focused
- Athletic
- Efficient
- Slightly premium, but not flashy

### Colors
- Dark surfaces should dominate the UI.
- Accent colors should highlight active states, progress, and primary actions.
- Charts should use distinct but harmonious colors for data series.

---

## 8.2 Layout Principles

### Mobile-first structure
- Single-column layouts should dominate.
- Critical actions should stay within thumb reach.
- Content should stack clearly and avoid crowded UI blocks.

### Spacing and rhythm
- Sections should have clear separation.
- Lists and cards should use consistent padding.
- Touch targets should be comfortably sized.

### Responsiveness
- The design should scale to larger screens without breaking the mobile logic.
- Desktop and tablet layouts should preserve the same conceptual structure.

---

## 8.3 Components and Interaction Patterns

### Cards
Used for summarizing workouts, stats, or list items in a scannable format.

### Drawers
Used for add/edit workflows where the app should preserve the underlying page context.

### Bottom navigation
Used for top-level destinations and primary app sections.

### Charts
Used for trend visualization and progress tracking.

### Status bar
Used for ongoing session state and lightweight feedback.

### Buttons and CTAs
- Primary actions should be obvious.
- Destructive or secondary actions should be visually distinct.
- Button hierarchy should remain consistent across pages.

---

## 9. Data and Storage Expectations

### Current state
The app currently uses IndexedDB for local persistence.

### Product implications
- The app should remain usable offline or with limited connectivity for core logging.
- Local state should survive refreshes and session restarts.
- Stored workout data must remain consistent and recoverable within the current client-side model.

### Future readiness
Even if the backend evolves, the current product should maintain a clear persistence contract for workouts, sets, and stats.

---

## 10. Non-Functional Requirements

### Performance
- The app should load quickly on mobile devices.
- Interactions should feel immediate.
- Charts and long lists should avoid blocking the UI.

### Accessibility
- Text should remain readable in dark mode.
- Touch targets must be large enough for mobile use.
- Color alone should not be the only indicator of state.

### Reliability
- Logging actions should not silently fail.
- State should persist reliably after edits or navigation.
- The UI should avoid unexpected layout shifts.

### Maintainability
- Components should remain reusable and modular.
- New features should follow the existing design system.
- UX patterns should be extended instead of reinvented.

---

## 11. Design System Baseline

### Existing design primitives
- shadcn/ui components form the UI foundation.
- Drawer-based flows are already part of the interaction model.
- Chart components are used for data visualization.

### Baseline conventions
- Use consistent card, sheet, dialog, and button styling.
- Prefer composed components over bespoke one-off elements.
- Keep spacing, typography, and interaction states consistent.

### Component behavior expectations
- Components should work well in both the active workout flow and the historical views.
- Reusable primitives should support future growth without rework.

---

## 12. Out of Scope for This PRD

This PRD describes the current product baseline, not the future roadmap. The following are intentionally excluded as requirements for the existing app:
- subscription/paywall logic
- social/community features
- wearable integrations
- full AI coaching or exercise recognition
- advanced nutrition tracking
- PWA publishing and offline sync enhancements beyond current baseline
- complex guided workout templates

---

## 13. Known Gaps in the Current Product Baseline

These are not necessarily defects, but they are areas where the current experience may be intentionally minimal:
- Advanced workout planning is not yet part of the baseline.
- The app’s analytics are centered on charts rather than deep insights.
- Settings likely contain only the essentials needed for current workout flows.
- The workouts list is separate from bottom nav to keep primary navigation simple.

---

## 14. Acceptance Criteria for the Current Product Definition

The existing app can be considered aligned with this PRD if:
- Users can create and log workouts without confusion.
- Exercises and sets are easy to add during a live session.
- Historical workouts are accessible from a dedicated list view.
- Weight and stats views communicate progress clearly.
- Settings are discoverable and affect app behavior meaningfully.
- The visual design remains dark, mobile-first, and consistent across screens.

---

## 15. Summary

Nyx Fit’s current product identity is a streamlined workout logger with a modern dark UI, mobile-first navigation, drawer-based input, historical workout browsing, and chart-driven progress tracking. The design system is intentionally focused on speed, clarity, and consistency so that future feature expansion can build on a stable baseline rather than replacing core interaction patterns.

This PRD should serve as the source of truth for describing the app as it exists today.
