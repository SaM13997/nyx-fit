# Expo React Native Migration Checklist

> **For agentic workers:** Execute this checklist task-by-task. Keep changes surgical, verify each phase before moving on, and do not expand scope beyond converting the existing app to React Native Expo with HeroUI Native and Expo UI.

**Goal:** Convert the current Nyx Fit web app into a React Native Expo app while preserving the existing product behavior and mobile-first dark performance aesthetic.

**Architecture:** This is a rebuild-on-Expo migration, not a bundler swap. The current app uses TanStack Start, TanStack Router, Tailwind/shadcn/Radix, Framer Motion, Convex, and Better Auth; Expo requires replacing web routing, DOM UI primitives, CSS styling, and browser APIs with native equivalents.

**Tech Stack:** Expo, React Native, Expo Router, HeroUI Native (`heroui-native`), Expo UI (`@expo/ui`), Convex, Better Auth mobile-compatible auth/session storage, React Native Reanimated, Expo Notifications, Expo Image Picker.

---

## Key Constraint

Use **HeroUI Native (`heroui-native`)** for Expo screens, not `@heroui/react`. HeroUI React is web-oriented; HeroUI Native is the Expo/React Native path. Use **Expo UI (`@expo/ui`)** selectively for native OS controls and primitives, not as the full design system.

---

## Phase 1: Set the Expo Foundation

- [ ] Create a new Expo app shell, preferably in a separate branch or an `apps/mobile` folder.
- [ ] Install Expo Router, React Native, React Native Reanimated, Gesture Handler, Safe Area Context, HeroUI Native, and Expo UI.
- [ ] Decide whether the Expo app replaces the web app or lives as a parallel mobile app.
- [ ] Port shared TypeScript config aliases from `tsconfig.json`.
- [ ] Keep `convex/` backend code in place unless mobile auth requires backend changes.
- [ ] Add basic Expo scripts: `expo start`, `expo run:ios`, `expo run:android`, plus test and lint commands.

## Phase 2: Replace Routing and App Shell

- [ ] Replace `src/router.tsx`, `src/routeTree.gen.ts`, and `src/routes/*` with Expo Router routes under `app/`.
- [ ] Map `/` to `app/(tabs)/index.tsx`.
- [ ] Map `/workouts` to `app/(tabs)/workouts.tsx`.
- [ ] Map `/workout/$id` to `app/workout/[id].tsx`.
- [ ] Map `/weights` to `app/(tabs)/weights.tsx`.
- [ ] Map `/stats` to `app/(tabs)/stats.tsx`.
- [ ] Map `/settings` to `app/(tabs)/settings.tsx`.
- [ ] Map `/settings/profile` to `app/settings/profile.tsx`.
- [ ] Map `/login` to `app/login.tsx`.
- [ ] Replace `BottomNav.tsx` with Expo Router tabs.
- [ ] Replace TanStack `Link`, `useNavigate`, and route state with Expo Router `Link`, `router.push`, `router.replace`, and `usePathname`.
- [ ] Recreate root providers from `src/routes/__root.tsx` inside `app/_layout.tsx`.

## Phase 3: Port Shared Logic Before Screens

- [ ] Move framework-neutral utilities unchanged where possible: `src/lib/units.ts`, `src/lib/profile.ts`, `src/lib/types.ts`, `src/lib/constants.ts`, and `src/lib/exerciseCategories.ts`.
- [ ] Review `src/lib/convex/hooks.ts` and keep the Convex query/mutation logic, but remove browser-only assumptions.
- [ ] Replace `localStorage` usage in `AppearanceContext.tsx` with `AsyncStorage` or Expo SecureStore.
- [ ] Replace browser toast/portal logic in `src/lib/toast.tsx` with a React Native toast implementation or a small native overlay.
- [ ] Remove server-only TanStack Start helpers from mobile code, especially `src/lib/auth-server.ts`.

## Phase 4: Rebuild the UI System

- [ ] Treat `src/styles.css`, shadcn components, Radix primitives, and Tailwind CSS classes as design references, not reusable native code.
- [ ] Recreate core primitives using HeroUI Native: Button, Input, Avatar, Card/surface patterns, and modal or sheet-like containers where available.
- [ ] Use Expo UI only where native platform controls are wanted, such as native lists, context menus, pickers, or system-styled controls.
- [ ] Convert design tokens from `src/styles.css` into a native theme object: dark backgrounds, orange action accent, purple identity accent, border colors, radius, spacing, and typography.
- [ ] Replace `framer-motion` with React Native Reanimated or simple Expo/React Native animations.
- [ ] Replace Radix dropdowns, dialogs, portals, labels, separators, and inputs with native components.

## Phase 5: Port Screens in Dependency Order

- [ ] Port login first: `src/routes/login.tsx` and `src/components/login-form.tsx`.
- [ ] Port the root/home screen: `src/routes/index.tsx` plus `src/components/home/*`.
- [ ] Port workouts list: `src/routes/workouts.tsx`, `WorkoutCard.tsx`, and related home workout components.
- [ ] Port workout detail/editor: `src/routes/workout.$id.tsx`, `SetDrawer.tsx`, `AddExerciseDrawer.tsx`, `ExerciseItem.tsx`, and `RestTimer.tsx`.
- [ ] Port weights: `src/routes/weights.tsx`, `WeightStatsCard.tsx`, `WeightHistoryList.tsx`, `LogWeightDrawer.tsx`, and `WeightChart.tsx`.
- [ ] Port settings/profile: `src/routes/settings.tsx`, `src/routes/settings_.profile.tsx`, and `UserButton.tsx`.
- [ ] Port `stats.tsx` last because it is currently a placeholder.

## Phase 6: Replace Browser-Only Features

- [ ] Remove `InstallPrompt.tsx`; Expo apps do not need the PWA install flow.
- [ ] Replace `window`, `document`, DOM portals, and CSS animations with native equivalents.
- [ ] Replace web notifications in `RestTimer.tsx` with `expo-notifications`.
- [ ] Replace browser vibration with React Native `Vibration`.
- [ ] Replace file inputs and profile uploads with `expo-image-picker` and the existing Convex storage upload flow.
- [ ] Replace Recharts in `WeightChart.tsx` with a React Native chart library or a custom SVG chart.
- [ ] Replace `wheel-picker` with a React Native picker/wheel component or Expo UI picker where appropriate.

## Phase 7: Auth and Backend Validation

- [ ] Confirm Better Auth supports the exact mobile flow needed before porting login behavior.
- [ ] Do not reuse the TanStack Start API route directly in the mobile app.
- [ ] Keep Convex schema/functions unless mobile auth requires backend changes.
- [ ] Verify mobile session persistence using SecureStore or the auth library’s recommended React Native storage.
- [ ] Test sign-in, sign-out, session restore, profile fetch, workout queries, weight queries, and image upload from a real Expo runtime.

## Phase 8: QA Checklist

- [ ] `expo start` launches successfully.
- [ ] iOS simulator opens without red-screen errors.
- [ ] Android emulator opens without red-screen errors.
- [ ] Login works and persists after app restart.
- [ ] Tabs navigate correctly.
- [ ] Home data loads from Convex.
- [ ] Workout creation and editing work.
- [ ] Rest timer notification and vibration work.
- [ ] Weight logging and chart display work.
- [ ] Settings/profile update works.
- [ ] No mobile-code imports remain from `@tanstack/react-router`, `@tanstack/react-start`, Radix UI, shadcn web components, Recharts, or Framer Motion.
