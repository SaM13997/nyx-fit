# Nyx Fit - Weight Tracking System PRD

## Overview
Comprehensive body weight tracking system with visualizations, goal setting, progress analysis, and health insights. Designed for users serious about their fitness journey.

---

## Goals

### Primary Goals
1. Enable effortless weight logging with multiple input methods
2. Provide clear visual progress tracking with multiple chart types
3. Support goal-oriented weight management (loss/gain/maintenance)
4. Deliver actionable insights and trends
5. Integrate seamlessly with workout data for holistic health view

### Success Metrics
- Daily active users logging weight: >60%
- Average time to log weight: <10 seconds
- User retention for weight tracking: >80% after 30 days

---

## User Stories

### Beginner
- "I want to see if I'm losing weight from my workouts"
- "I need simple reminders to weigh myself"
- "I want to know if I'm on track with my goal"

### Intermediate
- "I want to see my weight trend over time, not daily fluctuations"
- "I need to track my bulk/cut cycles"
- "I want to correlate weight changes with workout intensity"

### Advanced
- "I need to track body composition, not just weight"
- "I want to export my data for analysis"
- "I need to see weekly averages and compare periods"

### Coach
- "I need to monitor multiple clients' progress"
- "I want to see compliance with weigh-in schedules"
- "I need trend analysis to adjust programs"

---

## Core Features

### 1. Weight Logging

#### Input Methods
- **Manual Entry**: Numeric input with unit toggle (kg/lbs)
- **Smart Scale Integration**: Bluetooth/WiFi scale auto-sync (future)
- **Photo Capture**: Optional progress photos with weight entry
- **Voice Input**: "Log 180 pounds" (future)

#### Data Points Per Entry
```typescript
interface WeightEntry {
  id: string;
  userId: string;
  weight: number;           // stored in kg, display in user preference
  date: string;            // YYYY-MM-DD
  time: string;            // Optional, HH:MM
  notes: string;           // Optional, e.g., "after workout", "morning fasted"
  photoUrl: string;        // Optional progress photo
  source: "manual" | "scale" | "import";
  createdAt: number;
}
```

#### Smart Defaults
- Default to today's date
- Suggest time based on previous entries
- Auto-calculate day streak
- Show last 3 entries for quick comparison

### 2. Goal Setting

#### Goal Types
- **Weight Loss**: Target weight + weekly loss rate (0.5-2 lbs/week)
- **Weight Gain**: Target weight + weekly gain rate (0.5-1 lbs/week)
- **Maintenance**: Target weight + acceptable variance range
- **Body Recomposition**: Weight range + body fat % goal (future)

#### Goal Configuration
```typescript
interface WeightGoal {
  id: string;
  userId: string;
  goalType: "loss" | "gain" | "maintenance" | "recomp";
  targetWeight: number;
  startWeight: number;
  startDate: string;
  targetDate?: string;     // Optional deadline
  weeklyRate?: number;     // lbs/kg per week
  acceptableVariance?: number; // For maintenance (default: ±2 lbs)
  isActive: boolean;
}
```

#### Smart Goal Recommendations
- Recommend safe rates based on user profile
- Calculate realistic target dates
- Warn if goal is too aggressive (>2 lbs/week loss)

### 3. Visualizations

#### Chart Types

**Line Chart (Default)**
- Weight over time with trend line
- 7-day moving average overlay
- Zoom: 1 week / 1 month / 3 months / 6 months / 1 year / All time
- Annotations for goal start, milestones, PRs

**Range Chart**
- Min/max weight per week
- Highlights consistency

**Progress Bar**
- Goal completion percentage
- Current → Target visualization
- "X lbs to go" indicator

**Calendar Heatmap**
- Daily weigh-in frequency
- Color intensity by weight relative to goal
- Missed days shown clearly

#### Display Options
- Toggle kg/lbs
- Toggle raw weight vs 7-day average
- Toggle show/hide photos
- Toggle goal line overlay

### 4. Insights & Analytics

#### Automatic Calculations
- **Current Trend**: 7-day average slope
- **Weekly Change**: Average difference from previous week
- **Monthly Change**: Average difference from previous month
- **Total Change**: From goal start to now
- **Estimated Completion**: Based on current trend
- **Best/Worst Day**: Min/max weights in period
- **Consistency Score**: % of days logged in period

#### Smart Insights
```typescript
interface WeightInsight {
  type: "milestone" | "trend" | "warning" | "achievement";
  title: string;
  description: string;
  severity: "info" | "success" | "warning" | "alert";
  date: string;
}
```

**Example Insights:**
- "🎉 New low! You've hit 180 lbs for the first time"
- "📈 You're losing 1.2 lbs/week - right on target!"
- "⚠️ Weight has been plateauing for 2 weeks"
- "🏆 30-day logging streak!"
- "💡 Try weighing in at the same time daily for more consistency"

#### Correlation Analysis (Future)
- Weight vs workout volume
- Weight vs rest days
- Weight vs specific exercises

### 5. Notifications & Reminders

#### Smart Reminders
- Daily weigh-in reminder (user-set time, default 7 AM)
- Goal check-in (weekly)
- Milestone celebrations
- Streak notifications
- Missed day gentle reminder (after 2 days)

#### Notification Types
- Push notifications
- Email summaries (weekly)
- In-app badge

### 6. Data Management

#### Import/Export
- **Export**: CSV with date, weight, notes
- **Import**: CSV/JSON from other apps (MyFitnessPal, Apple Health, etc.)
- **Backup**: Automatic cloud backup

#### Data Integrity
- Prevent duplicate entries for same date (warn + confirm)
- Allow editing previous entries
- Soft delete with 30-day recovery
- Audit log for changes

### 7. Integrations

#### Health Platforms
- Apple Health (iOS)
- Google Fit (Android)
- MyFitnessPal (future)
- Fitbit (future)
- Withings/Nokia Health (future)

#### Internal Integration
- Link to workouts on same day
- Show weight on workout completion screen
- Stats dashboard correlation

---

## UI/UX Design

### Main Weight Screen Layout

```
┌─────────────────────────────────────┐
│  Weight Tracking                    │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │  [CURRENT WEIGHT]             │  │
│  │  182.5 lbs                    │  │
│  │  ↓ 1.2 lbs this week          │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  [LOG WEIGHT] Button (Large)        │
├─────────────────────────────────────┤
│  Goal Progress: 75%                 │
│  ████████████░░░░░░  182.5 → 175    │
│  7.5 lbs to go • ~6 weeks           │
├─────────────────────────────────────┤
│  Chart: 3 Months                    │
│  [Line graph with trend]            │
│  [1W] [1M] [3M] [6M] [1Y] [All]    │
├─────────────────────────────────────┤
│  📊 Stats                           │
│  • Trend: -1.2 lbs/week            │
│  • 30-day avg: 183.4 lbs           │
│  • Best: 182.5 (today)             │
│  • Streak: 12 days                 │
├─────────────────────────────────────┤
│  🔔 Recent Insights                 │
│  🎉 New low! Hit 182.5 lbs         │
│  📈 On track for goal              │
├─────────────────────────────────────┤
│  📅 History                         │
│  • Today: 182.5                    │
│  • Yesterday: 183.1                │
│  • 2 days ago: 183.4               │
│  [View Full History →]              │
└─────────────────────────────────────┘
```

### Log Weight Flow

```
[Log Weight Button]
    ↓
[Modal Opens]
    ↓
┌────────────────────┐
│ Log Weight         │
├────────────────────┤
│ [1][8][2].[5] lbs │
│ 7← 8 9            │
│ 4 5 6              │
│ 1 2 3              │
│ 0 . ⌫             │
├────────────────────┤
│ 📅 Today, 7:30 AM │
├────────────────────┤
│ 📝 Add note...     │
│ 📷 Add photo       │
├────────────────────┤
│ [Save Weight]      │
└────────────────────┘
    ↓
[Success Animation]
[Update Chart + Stats]
```

### Goal Setting Flow

```
[Set Goal Button]
    ↓
[Goal Type Selection]
  • Lose Weight
  • Gain Weight
  • Maintain
    ↓
[Target Weight Entry]
    ↓
[Weekly Rate Selection]
  Slider: 0.5 - 2.0 lbs/week
  Or: Target Date
    ↓
[Confirmation]
  "You'll reach 175 lbs by March 15"
    ↓
[Goal Active]
```

---

## Technical Implementation

### Database Schema

```typescript
// Already exists: weightEntries
// Already exists: weightGoals

// Add these indexes in schema.ts
weightEntries: defineTable({
  userId: v.string(),
  date: v.string(),
  weight: v.number(),
  note: v.optional(v.string()),
  photoUrl: v.optional(v.string()),
  time: v.optional(v.string()),
  source: v.optional(v.union(v.literal("manual"), v.literal("scale"), v.literal("import"))),
})
  .index("byUserId", ["userId"])
  .index("byUserDate", ["userId", "date"])
  .index("byDate", ["date"]), // For range queries

weightGoals: defineTable({
  userId: v.string(),
  goalType: v.union(v.literal("loss"), v.literal("gain"), v.literal("maintenance")),
  targetWeight: v.number(),
  startWeight: v.number(),
  startDate: v.string(),
  targetDate: v.optional(v.string()),
  weeklyRate: v.optional(v.number()),
  isActive: v.boolean(),
})
  .index("byUserId", ["userId"])
  .index("byActive", ["userId", "isActive"]),

// New: Weight insights/notifications
weightInsights: defineTable({
  userId: v.string(),
  type: v.union(v.literal("milestone"), v.literal("trend"), v.literal("warning"), v.literal("achievement")),
  title: v.string(),
  description: v.string(),
  severity: v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("alert")),
  date: v.string(),
  isRead: v.boolean(),
})
  .index("byUserId", ["userId"])
  .index("byUserUnread", ["userId", "isRead"]),
```

### API Endpoints

```typescript
// queries
getWeightEntries(args: { limit?: number; startDate?: string; endDate?: string })
getWeightGoal(args: {})
getWeightStats(args: { period: "1w" | "1m" | "3m" | "6m" | "1y" | "all" })
getWeightInsights(args: { limit?: number })
getWeightChartData(args: { period: string; granularity: "daily" | "weekly" })

// mutations
logWeight(args: { weight: number; date?: string; time?: string; note?: string; photo?: File })
updateWeightEntry(args: { id: string; weight?: number; note?: string })
deleteWeightEntry(args: { id: string })
setWeightGoal(args: { goalType: string; targetWeight: number; weeklyRate?: number; targetDate?: string })
updateWeightGoal(args: { id: string; ... })
archiveWeightGoal(args: { id: string })
markInsightRead(args: { id: string })

// scheduled actions (daily)
generateDailyInsights()
cleanupOldInsights()
```

### Calculations

```typescript
// Moving average
function calculateMovingAverage(entries: WeightEntry[], days: number): number[] {
  const result = [];
  for (let i = 0; i < entries.length; i++) {
    const start = Math.max(0, i - days + 1);
    const subset = entries.slice(start, i + 1);
    const avg = subset.reduce((sum, e) => sum + e.weight, 0) / subset.length;
    result.push(avg);
  }
  return result;
}

// Trend line (simple linear regression)
function calculateTrend(entries: WeightEntry[]): { slope: number; intercept: number } {
  const n = entries.length;
  const x = entries.map((_, i) => i);
  const y = entries.map((e) => e.weight);
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

// Weight change over period
function calculateChange(entries: WeightEntry[], days: number): number {
  const now = entries[entries.length - 1]?.weight;
  const past = entries.find((e) => {
    const daysDiff = (new Date().getTime() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff >= days;
  })?.weight;
  
  return past ? now - past : 0;
}
```

---

## Implementation Phases

### Phase 1: Core Logging (Week 1)
- [ ] Update weightEntries schema with time, source fields
- [ ] Create logWeight mutation with validation
- [ ] Build LogWeightDrawer component
- [ ] Add weight to home screen quick actions
- [ ] Show recent entries list

### Phase 2: Visualizations (Week 2)
- [ ] Create WeightChart component (Recharts)
- [ ] Implement 7-day moving average
- [ ] Add time period toggles (1W, 1M, 3M, 6M, 1Y, All)
- [ ] Build weight history page
- [ ] Add photo upload support

### Phase 3: Goals (Week 3)
- [ ] Extend weightGoals schema
- [ ] Create SetGoal flow
- [ ] Build GoalProgressCard component
- [ ] Calculate estimated completion dates
- [ ] Add goal line to charts

### Phase 4: Insights (Week 4)
- [ ] Create weightInsights table
- [ ] Build insight generation algorithm
- [ ] Create InsightsCard component
- [ ] Add milestone detection
- [ ] Implement trend analysis

### Phase 5: Polish & Integration (Week 5)
- [ ] Add unit conversion (kg/lbs)
- [ ] Export to CSV
- [ ] Notifications/reminders
- [ ] Integrate with workout stats
- [ ] Testing & bug fixes

---

## Success Metrics & Analytics

### Metrics to Track
- Daily active weight loggers
- Average time to log
- Retention (7d, 30d, 90d)
- Goal completion rate
- Feature usage (charts, photos, insights)
- Error rates

### A/B Testing Ideas
- Log button placement (home vs weights tab)
- Default chart period (1M vs 3M)
- Insight frequency (daily vs weekly)
- Reminder timing

---

## Future Enhancements

### Phase 2 Features
- Body measurements (chest, waist, arms, etc.)
- Body fat % estimation
- Progress photo comparison slider
- BMI tracking
- Weight prediction algorithm
- Social features (share progress)
- Challenges/competitions

### Phase 3 Features
- AI-powered insights
- Personalized recommendations
- Integration with nutrition tracking
- Smart scale partnerships
- Wearable device correlations
- Professional coach dashboard

---

**Status:** PRD Complete
**Next Step:** Begin Phase 1 implementation
