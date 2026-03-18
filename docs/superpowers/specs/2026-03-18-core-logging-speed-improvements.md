# Core Logging Speed Improvements

## Goal

Make the main workout logging loop faster, more expressive, and better suited for repeat use while preserving speed for advanced users and keeping interactions understandable for beginners.

## Why This Epic Comes Next

The primary job to optimize is fast mobile workout logging. Foundation created the shared page-shell system and user mode foundation. Now the app needs to improve the core logging experience before adding business complexity (premium) or more surfaces (progress). Speed improvements here directly impact the core value proposition.

## In Scope

- Edit workouts after completion
- Infer exercise category from name and present a select-based flow
- Integrate wheel pickers for reps and weight entry
- Add rest timer entry points and customizable defaults
- Add duplicate-set and smart add-set actions
- Group exercises by body part where helpful
- Preserve speed for advanced users while keeping interaction understandable for beginners

## Out of Scope

- Guided workout content or templates
- Subscription billing or premium gating
- Advanced analytics
- App-store packaging
- Full offline support

## User Experience Summary

### Core behavior

- Users can quickly log sets with minimal taps using wheel pickers
- Users can edit past workouts to fix mistakes or add missing data
- Users can duplicate previous sets to speed up logging
- Users have easy access to rest timers with customizable defaults
- Exercise selection is smarter with category inference

### UX priorities

1. Every action should require fewer taps than before
2. Wheel picker interactions must feel smooth on mobile
3. Editing completed workouts should be safe (no data loss)
4. Rest timer should be accessible without leaving the workout flow
5. Advanced users can bypass helpers; beginners get guidance

## Feature Specifications

### 1. Edit Completed Workouts

**Trigger**: User navigates to a completed workout detail view

**Behavior**:
- Completed workouts show an "Edit" button
- Edit mode allows modifying exercises, sets, reps, weights
- Changes are saved back to the same workout record
- Cannot change workout date in edit mode (preserves history integrity)
- Delete individual exercises or sets within the workout

**Data model**: Update existing workout mutation that allows patching exercises array

### 2. Exercise Category Inference

**Trigger**: User adds a new exercise by typing name

**Behavior**:
- As user types exercise name, system matches against known exercises
- Matching suggestions show category (chest, back, legs, etc.)
- User can accept suggestion or manually set category
- Category affects exercise grouping in lists and future suggestions

**Known categories**: chest, back, shoulders, arms, legs, core, cardio, full-body

### 3. Wheel Pickers for Reps and Weight

**Trigger**: User is entering a new set

**Behavior**:
- Replace text inputs with scrollable wheel pickers
- Reps wheel: 1-100+ with common ranges (1-20 for hypertrophy, 1-12 for strength)
- Weight wheel: 0-500+ lbs/kg with appropriate increments
- User can still type manually if preferred
- Last used values shown as defaults

**Implementation**: Use existing wheel-picker component or create native-feeling scroll UX

### 4. Rest Timer Entry Points

**Trigger**: User completes a set

**Behavior**:
- After logging a set, rest timer can be started with one tap
- Timer shows as overlay/mini-player during rest
- Default duration from user settings (30s, 1m, 3m, 5m)
- Can customize timer duration inline before starting
- Audio/vibration notification when timer completes
- Timer accessible from workout header even when not between sets

### 5. Duplicate Set Action

**Trigger**: User wants to repeat previous set

**Behavior**:
- Each set row has a duplicate icon button
- Tapping duplicates the set (same weight, reps) below current
- User can then adjust as needed
- Works within same exercise and across exercises

### 6. Smart Add-Set Actions

**Trigger**: User is building a set

**Behavior**:
- "Add +1 rep" quick action on each set
- "Add 5lbs/2.5kg" quick weight adjustment buttons
- "Copy from previous" for same exercise across workouts
- Reduce friction for small adjustments

### 7. Exercise Grouping by Body Part

**Trigger**: User browses exercise selection

**Behavior**:
- Exercises organized under category headers
- "Recent" section for frequently used exercises
- "Favorites" section for user-marked exercises
- Search filters by category
- Categories: Chest, Back, Shoulders, Arms, Legs, Core, Cardio

## Technical Implementation

### Route Changes

- Update `workout.$id.tsx` to support edit mode
- Add exercise picker with category inference
- Add wheel picker component integration
- Add rest timer controls inline

### Data Layer

- Update workout mutation to support patch updates
- Add exercise categories to exercise definitions
- Track exercise usage frequency for smart ordering

### Components Needed

- `ExercisePicker`: Searchable exercise list with category inference
- `WheelPickerSetInput`: reps and weight entry via wheel
- `RestTimerWidget`: inline timer with controls
- `SetDuplicateButton`: duplicate action per set
- `QuickSetAdjust`: +1 rep, +5lbs quick actions

## Error Handling

- If workout update fails, show error toast and preserve edit state
- If exercise inference fails, default to uncategorized
- If timer fails to start, show manual input fallback
- Handle concurrent edits gracefully (last-write-wins with warning)

## Accessibility

- Wheel pickers must be keyboard accessible
- Timer must have audio cues for visual impairments
- All actions must work with voice control
- Touch targets minimum 44x44pt

## Acceptance Checks

This epic is done when all of the following are true:

- [ ] Users can edit completed workouts and save changes
- [ ] Exercise selection shows category suggestions
- [ ] Wheel pickers work smoothly for reps and weight entry
- [ ] Rest timer can be started from workout screen
- [ ] Users can duplicate sets with one tap
- [ ] Quick adjustment buttons work (+1 rep, +5lbs)
- [ ] Exercises are grouped by body part in selection
- [ ] Common workout actions require fewer taps than before

## Testing Expectations

- Route-level UI checks for mobile and desktop widths
- Edit flow verification: create workout → complete → edit → save
- Wheel picker scrolling smoothness verification
- Timer start/stop/reset functionality
- Duplicate set creates correct copy
- Exercise picker category inference accuracy
