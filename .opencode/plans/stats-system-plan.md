# Nyx Fit Stats System - Technical Implementation Plan

## Overview
Pre-computed workout statistics system with 1/3/6 month rollups, Redis caching, and nightly aggregation jobs.

---

## Data Model

### Core Tables

#### 1. `user_workouts` (Source of Truth)
```typescript
user_workouts {
  _id: id,
  userId: id,
  name: string,
  startedAt: number,  // Unix timestamp
  completedAt: number | null,
  exercises: Exercise[]
}

Exercise {
  exerciseId: string,
  sets: Set[]
}

Set {
  weight: number,      // kg
  reps: number,
  completed: boolean
}
```

#### 2. `user_stats_daily` (Pre-computed)
```typescript
interface UserStatsDaily {
  _id: id;
  userId: id;
  date: string;           // "2026-03-18" format
  
  // Volume Metrics
  totalVolume: number;    // sum(sets × reps × weight)
  totalSets: number;
  totalReps: number;
  exerciseCount: number;
  
  // Time Metrics
  durationMinutes: number;
  
  // Personal Records
  prCount: number;
  
  // Muscle Group Distribution
  muscleVolumes: {
    chest: number;
    back: number;
    shoulders: number;
    legs: number;
    arms: number;
    core: number;
  };
  
  // Computed at insert time
  computedAt: number;
}
```

#### 3. `user_stats_periodic` (1/3/6 Month Aggregates)
```typescript
interface UserStatsPeriodic {
  _id: id;
  userId: id;
  periodType: '1m' | '3m' | '6m';
  periodStart: string;    // "2026-03-01"
  periodEnd: string;      // "2026-03-31"
  
  // Aggregate Volume
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  workoutCount: number;
  
  // Averages
  avgVolumePerWorkout: number;
  avgSetsPerWorkout: number;
  avgDurationMinutes: number;
  avgWorkoutsPerWeek: number;
  
  // Consistency
  consistencyScore: number;  // 0-100 (actual/planned workouts)
  longestStreak: number;     // days
  
  // Progress Tracking
  volumeGrowthRate: number;  // % vs previous period
  prCount: number;
  
  // Muscle Balance
  muscleDistribution: {
    chest: number;     // % of total volume
    back: number;
    shoulders: number;
    legs: number;
    arms: number;
    core: number;
  };
  
  // Exercise-Specific Progress
  topExercises: Array<{
    exerciseId: string;
    name: string;
    totalVolume: number;
    bestSet: { weight: number; reps: number };
    volumeGrowth: number;  // % vs previous period
  }>;
  
  computedAt: number;
}
```

#### 4. `user_pr_history` (Personal Records)
```typescript
interface UserPRHistory {
  _id: id;
  userId: id;
  exerciseId: string;
  
  // Current PRs by rep range
  prs: {
    '1': { weight: number; date: string };    // 1RM equivalent
    '3': { weight: number; date: string };
    '5': { weight: number; date: string };
    '8': { weight: number; date: string };
    '10': { weight: number; date: string };
    '12': { weight: number; date: string };
  };
  
  // History for trends
  history: Array<{
    date: string;
    weight: number;
    reps: number;
    estimated1RM: number;  // using Brzycki formula
  }>;
  
  lastUpdated: number;
}
```

---

## Caching Strategy

### Redis Keys

```
# Hot stats (updated on workout completion)
stats:user:{userId}:current_streak              -> TTL: 7 days
stats:user:{userId}:weekly_volume:{week}        -> TTL: 14 days
stats:user:{userId}:last_workout                -> TTL: 30 days

# Pre-computed aggregates (updated nightly)
stats:user:{userId}:dashboard:{periodType}      -> TTL: 7 days
  Example: {
    period: '1m',
    totalVolume: 45000,
    workoutCount: 12,
    consistencyScore: 85,
    volumeGrowthRate: 12.5,
    prCount: 3,
    topExercises: [...]
  }

# Computed on-demand, cached briefly
stats:user:{userId}:exercise:{exerciseId}:progress  -> TTL: 1 hour
```

### Cache Invalidation

1. **On workout completion:**
   - Invalidate: `stats:user:{userId}:current_streak`
   - Invalidate: `stats:user:{userId}:weekly_volume:*`
   - Queue: daily stats recomputation (async)

2. **Nightly job:**
   - Recompute all `user_stats_periodic` records
   - Update Redis with fresh aggregates
   - Warm cache for active users

---

## API Design

### Endpoints

```typescript
// GET /api/stats/dashboard
// Returns cached dashboard data for all periods
interface DashboardResponse {
  periods: {
    '1m': UserStatsPeriodic;
    '3m': UserStatsPeriodic;
    '6m': UserStatsPeriodic;
  };
  currentStreak: number;
  lastWorkout: {
    date: string;
    volume: number;
    duration: number;
  };
}

// GET /api/stats/exercise/:exerciseId
// Exercise-specific progress
interface ExerciseStatsResponse {
  exerciseId: string;
  name: string;
  currentPRs: UserPRHistory['prs'];
  volumeProgression: Array<{
    period: string;
    totalVolume: number;
    bestSet: { weight: number; reps: number };
  }>;
  estimated1RM: number;
  strengthLevel: 'beginner' | 'intermediate' | 'advanced'; // based on bodyweight multipliers
}

// GET /api/stats/compare?periods=1m,3m
// Side-by-side comparison
interface CompareResponse {
  comparisons: Array<{
    period: string;
    totalVolume: number;
    workoutCount: number;
    consistencyScore: number;
    volumeGrowthRate: number;
  }>;
}
```

---

## Aggregation Job (Nightly)

### Algorithm

```typescript
async function runNightlyStatsJob() {
  const yesterday = getYesterday();
  const activeUsers = await getUsersActiveInLast7Days();
  
  for (const userId of activeUsers) {
    // 1. Compute yesterday's daily stats
    await computeDailyStats(userId, yesterday);
    
    // 2. Recompute rolling 1/3/6 month aggregates
    await recomputePeriodicStats(userId, '1m');
    await recomputePeriodicStats(userId, '3m');
    await recomputePeriodicStats(userId, '6m');
    
    // 3. Update PRs if any new records
    await updateExercisePRs(userId, yesterday);
    
    // 4. Warm cache
    await warmUserCache(userId);
  }
}

async function computeDailyStats(userId: string, date: string) {
  const workouts = await db.workouts.find({
    userId,
    completedAt: { $gte: startOfDay(date), $lt: endOfDay(date) }
  });
  
  const stats = aggregateWorkouts(workouts);
  await db.userStatsDaily.upsert({ userId, date }, stats);
}

async function recomputePeriodicStats(userId: string, periodType: '1m' | '3m' | '6m') {
  const endDate = new Date();
  const startDate = subMonths(endDate, periodType === '1m' ? 1 : periodType === '3m' ? 3 : 6);
  
  const dailyStats = await db.userStatsDaily.find({
    userId,
    date: { $gte: format(startDate), $lte: format(endDate) }
  });
  
  const aggregate = computePeriodAggregate(dailyStats, periodType);
  
  // Get previous period for growth calculation
  const prevPeriodStats = await db.userStatsPeriodic.findOne({
    userId,
    periodType,
    periodEnd: { $lt: format(startDate) }
  }, { sort: { periodEnd: -1 } });
  
  aggregate.volumeGrowthRate = prevPeriodStats 
    ? ((aggregate.totalVolume - prevPeriodStats.totalVolume) / prevPeriodStats.totalVolume) * 100
    : 0;
  
  await db.userStatsPeriodic.upsert({ userId, periodType, periodStart: format(startDate) }, aggregate);
}
```

---

## Formulas

### Estimated 1RM (Brzycki Formula)
```
1RM = weight / (1.0278 - 0.0278 × reps)
```

### Consistency Score
```
score = (actual_workouts / expected_workouts) × 100
capped at 100
expected_workouts = user_goal_per_week × weeks_in_period
```

### Volume Growth Rate
```
growth = ((current_volume - previous_volume) / previous_volume) × 100
```

### Muscle Distribution
```
distribution[muscle] = (muscle_volume / total_volume) × 100
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create `user_stats_daily` table
- [ ] Create `user_stats_periodic` table  
- [ ] Create `user_pr_history` table
- [ ] Build workout completion hook to trigger daily stats update
- [ ] Set up Redis connection

### Phase 2: Aggregation (Week 2)
- [ ] Implement daily stats computation
- [ ] Implement periodic (1/3/6m) aggregation
- [ ] Build nightly job scheduler
- [ ] Implement PR tracking

### Phase 3: API & Cache (Week 3)
- [ ] Build `/api/stats/dashboard` endpoint
- [ ] Implement Redis caching layer
- [ ] Build cache invalidation on workout completion
- [ ] Add cache warming for active users

### Phase 4: Exercise-Specific Stats (Week 4)
- [ ] Build `/api/stats/exercise/:id` endpoint
- [ ] Implement strength level calculation
- [ ] Build progress visualization data
- [ ] Add comparison endpoint

### Phase 5: Polish (Week 5)
- [ ] Add error handling and retries
- [ ] Implement monitoring/metrics
- [ ] Performance testing
- [ ] Documentation

---

## Database Indexes

```sql
-- For daily stats queries
CREATE INDEX idx_daily_user_date ON user_stats_daily(userId, date);

-- For periodic stats queries
CREATE INDEX idx_periodic_user_type ON user_stats_periodic(userId, periodType);
CREATE INDEX idx_periodic_date ON user_stats_periodic(periodStart, periodEnd);

-- For PR lookups
CREATE INDEX idx_pr_user_exercise ON user_pr_history(userId, exerciseId);

-- For workout lookups (existing table)
CREATE INDEX idx_workouts_user_completed ON user_workouts(userId, completedAt);
```

---

## Monitoring

Track these metrics:
- Nightly job duration
- Cache hit rate
- Stats computation errors
- User stats freshness (max age of periodic stats)

---

## Storage Estimates

Assumptions: 10,000 users, avg 4 workouts/week

- `user_stats_daily`: ~2.1M rows/year (~500MB)
- `user_stats_periodic`: ~180K rows/year (~50MB)
- `user_pr_history`: ~500K rows (exercises × users) (~100MB)

**Total: ~650MB/year** (very manageable)

---

## Future Enhancements (Post-MVP)

- Real-time streak updates via websockets
- Custom date range queries (on-demand, no pre-compute)
- Comparative analytics (vs similar users)
- Export to CSV/PDF
- Predictive fatigue modeling

---

**Status:** Plan Complete  
**Next Step:** Begin Phase 1 implementation
