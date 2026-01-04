# Implementation Tasks: Weights Feature

## Backend & Schema
- [x] **Install Dependencies**
  - [x] Install `recharts` for visualization.
- [x] **Schema Updates**
  - [x] Update `convex/schema.ts`:
    - Add `photoUrl` to `weightEntries` table.
    - Create `weightGoals` table (`userId`, `targetWeight`, `weeklyGoal`, `startDate`, `startWeight`).
- [x] **Type Definitions**
  - [x] Update `src/lib/types.ts`:
    - Add `photoUrl` to `WeightEntry`.
    - Add `WeightGoal` type.

## Data Layer (Convex Functions)
- [x] **Weights Management**
  - [x] Implement `api.weights.logWeight` (mutation).
  - [x] Implement `api.weights.getWeights` (query) - support limits/pagination if needed.
  - [x] Implement `api.weights.updateWeight` (mutation).
  - [x] Implement `api.weights.deleteWeight` (mutation).
- [x] **Goals Management**
  - [x] Implement `api.weights.setWeightGoal` (mutation).
  - [x] Implement `api.weights.getWeightGoal` (query).

## UI Components
- [x] **Input & Forms**
  - [x] Create `LogWeightDrawer` (or Dialog).
    - Inputs: Weight (decimal), Date, Time, Text Note, Photo (Upload logic).
  - [ ] Create `SetGoalModal`.
- [x] **Visualization**
  - [x] Create `WeightChart` component using `recharts`.
    - Line chart for weight history.
    - Reference line for Goal.
    - Trend line logic.
  - [x] Create `WeightStatsCard`.
    - Current Weight, Start Weight, Change, BMI (calculate from Profile height + current weight).
- [x] **Lists**
  - [x] Create `WeightHistoryList`.
    - Group by month/week? or just list.
    - Edit/Delete actions.

## Route Integration
- [x] **Weights Page (`src/routes/weights.tsx`)**
  - [x] Integrate `WeightStatsCard` (Top prominent).
  - [x] Integrate `WeightChart`.
  - [x] Integration `WeightHistoryList`.
  - [x] FAB or Button to "Log Weight".

## Verification
- [ ] **Manual Testing**
  - [ ] Log a weight.
  - [ ] Edit the weight.
  - [ ] Delete the weight.
  - [ ] Set a goal.
  - [ ] Verify chart updates.
  - [ ] Verify BMI calculation.
