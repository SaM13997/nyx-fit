import { WorkoutSet, Workout, type WeightUnit } from "@/lib/types";
import { Copy, Minus, Plus, Trash2, X } from "lucide-react";
import { ViewTransition, startTransition, useEffect, useId, useRef, useState } from "react";
import { Sheet } from "@/components/motion/Sheet";
import { v4 as uuidv4 } from "uuid";
import { formatWeight, formatWeightUnit, getWeightStep } from "@/lib/units";

const DEFAULT_REP_DECREMENT = 2;
const MIN_REPS = 1;
const MIN_WEIGHT = 0;
const MAX_WEIGHT = 100000;
const MAX_REPS = 10000;

const STEPPER_BUTTON_CLASS =
  "flex h-11 flex-1 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-fill-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:opacity-40";

type SetField = "weight" | "reps";

type SetDraft = {
  setId: string;
  field: SetField;
  text: string;
};

interface SetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  unit: WeightUnit;
  workout: Workout;
  onUpdate: (exerciseId: string, sets: WorkoutSet[]) => Promise<boolean>;
  isSaving?: boolean;
}

const clampFieldValue = (value: number, field: SetField): number =>
  field === "reps"
    ? Math.min(MAX_REPS, Math.max(0, Math.round(value)))
    : Math.min(MAX_WEIGHT, Math.max(0, value));

const canNudgeFieldValue = (
  value: number,
  field: SetField,
  delta: number
): boolean => {
  const next = value + delta;

  return field === "reps"
    ? next >= MIN_REPS && next <= MAX_REPS
    : next >= MIN_WEIGHT && next <= MAX_WEIGHT;
};

const SAVE_FAILED_MESSAGE = "Couldn't save that change.";
const REMOTE_CHANGE_MESSAGE =
  "This workout changed elsewhere. Your unsaved edit was discarded.";

export function SetDrawer({
  isOpen,
  onClose,
  exerciseId,
  unit,
  workout,
  onUpdate,
  isSaving = false,
}: SetDrawerProps) {
  const exercise = workout.exercises.find((e) => e.id === exerciseId);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [draft, setDraft] = useState<SetDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const revisionRef = useRef(workout.revision);
  const weightStep = getWeightStep(unit);
  const titleId = useId();

  useEffect(() => {
    if (exercise) {
      setSets(exercise.sets);
    }
  }, [exercise]);

  useEffect(() => {
    if (revisionRef.current === workout.revision) return;
    revisionRef.current = workout.revision;

    if (draft !== null) {
      setCommitError(REMOTE_CHANGE_MESSAGE);
    }

    setDraft(null);
  }, [draft, workout.revision]);

  if (!exercise) return null;

  const controlsDisabled = isSaving || isSubmitting;

  const runSubmit = async (nextSets: WorkoutSet[]) => {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const saved = await onUpdate(exerciseId, nextSets);

      if (saved) {
        const structural =
          nextSets.length !== sets.length ||
          nextSets.some((set, index) => set.id !== sets[index]?.id);
        if (structural) startTransition(() => setSets(nextSets));
        else setSets(nextSets);
        setDraft(null);
        setCommitError(null);
      } else {
        setCommitError(SAVE_FAILED_MESSAGE);
      }
    } catch (e) {
      console.error("Failed to save set change:", e);
      setCommitError(SAVE_FAILED_MESSAGE);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const commitFieldValue = (setId: string, field: SetField, value: number) => {
    const nextSets = sets.map((set) =>
      set.id === setId ? { ...set, [field]: clampFieldValue(value, field) } : set
    );
    void runSubmit(nextSets);
  };

  const nudgeFieldValue = (setId: string, field: SetField, delta: number) => {
    const target = sets.find((set) => set.id === setId);

    if (!target) return;

    commitFieldValue(setId, field, target[field] + delta);
  };

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    const newSet: WorkoutSet = {
      id: uuidv4(),
      weight: lastSet ? lastSet.weight : 0,
      reps: lastSet ? lastSet.reps : 0,
    };
    void runSubmit([...sets, newSet]);
  };

  const handleAddIncrementedSet = () => {
    const lastSet = sets[sets.length - 1];

    if (!lastSet) {
      handleAddSet();
      return;
    }

    const newSet: WorkoutSet = {
      id: uuidv4(),
      weight: clampFieldValue(lastSet.weight + weightStep, "weight"),
      reps: Math.max(0, lastSet.reps - DEFAULT_REP_DECREMENT),
    };
    void runSubmit([...sets, newSet]);
  };

  const handleDuplicateLastSet = () => {
    const lastSet = sets[sets.length - 1];

    if (!lastSet) {
      return;
    }

    const duplicatedSet: WorkoutSet = {
      ...lastSet,
      id: uuidv4(),
    };
    void runSubmit([...sets, duplicatedSet]);
  };

  const handleDeleteSet = (setId: string) => {
    void runSubmit(sets.filter((set) => set.id !== setId));
  };

  const startDraft = (setId: string, field: SetField, value: number) => {
    setDraft({ setId, field, text: String(value) });
    setCommitError(null);
  };

  const updateDraft = (setId: string, field: SetField, text: string) => {
    setDraft({ setId, field, text });
    setCommitError(null);
  };

  const draftValue = (setId: string, field: SetField, value: number): string =>
    draft !== null && draft.setId === setId && draft.field === field
      ? draft.text
      : String(value);

  const commitDraft = () => {
    if (draft === null) return;

    const parsed = Number(draft.text);

    if (!Number.isFinite(parsed)) {
      setDraft(null);
      return;
    }

    const nextValue = clampFieldValue(parsed, draft.field);

    if (sets.some((set) => set.id === draft.setId && set[draft.field] === nextValue)) {
      setDraft(null);
      setCommitError(null);
      return;
    }

    const nextSets = sets.map((set) =>
      set.id === draft.setId ? { ...set, [draft.field]: nextValue } : set
    );
    void runSubmit(nextSets);
  };

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      header={
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 pb-3 pt-2">
          <h2 id={titleId} tabIndex={-1} className="min-w-0 truncate text-xl font-bold outline-none">
            {exercise.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fill-strong transition-colors hover:bg-line-strong active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      }
    >
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="grid grid-cols-10 gap-2 text-sm text-muted-foreground font-medium px-2">
        <div className="col-span-1 text-center">Set</div>
        <div className="col-span-4 text-center">{formatWeightUnit(unit)}</div>
        <div className="col-span-4 text-center">Reps</div>
        <div className="col-span-1"></div>
      </div>

      {sets.map((set, index) => (
        <ViewTransition
          key={set.id}
          name={`set-row-${set.id}`}
          enter="vt-item-enter"
          exit="vt-item-exit"
        >
          <div
            className="grid grid-cols-10 gap-2 items-center bg-fill p-2 rounded-xl"
          >
            <div className="col-span-1 text-center font-bold text-ink-subtle">
              {index + 1}
            </div>
            <div className="col-span-4 space-y-1">
              <div className="flex items-center bg-fill-strong rounded-lg p-1">
                <input
                  type="number"
                  value={draftValue(set.id, "weight", set.weight)}
                  disabled={controlsDisabled}
                  onFocus={() =>
                    startDraft(set.id, "weight", set.weight)
                  }
                  onChange={(e) =>
                    updateDraft(set.id, "weight", e.target.value)
                  }
                  onBlur={commitDraft}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-full min-w-0 bg-transparent text-center font-bold outline-none disabled:opacity-40"
                />
                <span className="pr-2 text-xs text-ink-subtle">{formatWeight(set.weight, unit, 0)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Decrease weight"
                  onClick={() => nudgeFieldValue(set.id, "weight", -weightStep)}
                  disabled={
                    controlsDisabled ||
                    !canNudgeFieldValue(set.weight, "weight", -weightStep)
                  }
                  className={STEPPER_BUTTON_CLASS}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Increase weight"
                  onClick={() => nudgeFieldValue(set.id, "weight", weightStep)}
                  disabled={
                    controlsDisabled ||
                    !canNudgeFieldValue(set.weight, "weight", weightStep)
                  }
                  className={STEPPER_BUTTON_CLASS}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="col-span-4 space-y-1">
              <div className="flex items-center bg-fill-strong rounded-lg p-1">
                <input
                  type="number"
                  value={draftValue(set.id, "reps", set.reps)}
                  disabled={controlsDisabled}
                  onFocus={() => startDraft(set.id, "reps", set.reps)}
                  onChange={(e) =>
                    updateDraft(set.id, "reps", e.target.value)
                  }
                  onBlur={commitDraft}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-full min-w-0 bg-transparent text-center font-bold outline-none disabled:opacity-40"
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Decrease reps"
                  onClick={() => nudgeFieldValue(set.id, "reps", -1)}
                  disabled={
                    controlsDisabled ||
                    !canNudgeFieldValue(set.reps, "reps", -1)
                  }
                  className={STEPPER_BUTTON_CLASS}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Increase reps"
                  onClick={() => nudgeFieldValue(set.id, "reps", 1)}
                  disabled={
                    controlsDisabled ||
                    !canNudgeFieldValue(set.reps, "reps", 1)
                  }
                  className={STEPPER_BUTTON_CLASS}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="col-span-1 flex flex-col items-center gap-1">
              {index === sets.length - 1 && (
                <button
                  onClick={handleDuplicateLastSet}
                  disabled={controlsDisabled}
                  className="p-2 text-ink-secondary hover:bg-fill-strong rounded-lg transition-colors disabled:opacity-40"
                  aria-label="Duplicate last set"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => handleDeleteSet(set.id)}
                disabled={controlsDisabled}
                className="p-2 text-danger-ink hover:bg-danger-ink/10 rounded-lg transition-colors disabled:opacity-40"
                aria-label="Delete set"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </ViewTransition>
      ))}

      {commitError !== null ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-ink/20 bg-danger-ink/10 px-3 py-1.5">
          <p className="text-xs text-danger-ink">{commitError}</p>
          {draft !== null ? (
            <button
              type="button"
              onClick={commitDraft}
              disabled={controlsDisabled}
              className="min-h-11 rounded-lg border border-danger-ink/30 px-3 text-xs font-semibold text-danger-ink transition-colors hover:bg-danger-ink/10 disabled:opacity-40"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleAddSet}
          disabled={controlsDisabled}
          className="w-full py-4 bg-brand-tint hover:bg-purple-600/30 text-brand-ink font-bold rounded-xl border border-brand-line transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Plus className="h-5 w-5" />
          Add Set
        </button>
        <button
          onClick={handleAddIncrementedSet}
          disabled={controlsDisabled}
          className="w-full py-4 bg-success-tint hover:bg-emerald-500/25 text-success-ink font-bold rounded-xl border border-success-line transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Plus className="h-5 w-5" />
          Auto +{formatWeight(weightStep, unit, unit === "kgs" ? 1 : 0)}/-2
        </button>
      </div>
    </div>
    </Sheet>
  );
}
