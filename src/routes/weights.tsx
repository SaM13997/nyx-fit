import { createFileRoute } from "@tanstack/react-router";
import { Plus, Loader2 } from "lucide-react";
import {
  useWeights,
  useLogWeight,
  useUpdateWeight,
  useDeleteWeight,
  useWeightGoal,
  useCurrentProfile,
} from "@/lib/api/hooks";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { WeightStatsCard } from "@/components/weights/WeightStatsCard";
import { WeightHistoryList } from "@/components/weights/WeightHistoryList";
import type { WeightEntry } from "@/lib/types";
import { useToast } from "@/lib/toast";
import { uploadImageFile } from "@/lib/api/images";

const WeightChart = lazy(() =>
  import("@/components/weights/WeightChart").then((module) => ({
    default: module.WeightChart,
  }))
);

const LogWeightDrawer = lazy(() =>
  import("@/components/weights/LogWeightDrawer").then((module) => ({
    default: module.LogWeightDrawer,
  }))
);

export const Route = createFileRoute("/weights")({
  component: WeightsPage,
});

function WeightsPage() {
  const { weights, isLoading, isError, refetch } = useWeights();
  const { goal } = useWeightGoal();
  const { profile } = useCurrentProfile();
  const { logWeight } = useLogWeight();
  const { updateWeight } = useUpdateWeight();
  const { deleteWeight } = useDeleteWeight();
  const { error: showError } = useToast();
  const weightUnit = profile?.weightUnit ?? "lbs";

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    setIsChartReady(true);
  }, []);

  const handleOpenLog = () => {
    setEditingEntry(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (entry: WeightEntry) => {
    setEditingEntry(entry);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWeight({ id });
    } catch (e) {
      showError("Couldn't delete that entry. Please try again.");
    }
  };

  const handleSave = async (
    weight: number,
    date: string,
    note?: string,
    photo?: File
  ): Promise<boolean> => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      showError("You're offline. Reconnect before saving a weight entry.");
      return false;
    }

    try {
      setIsSaving(true);
      const newNote = note !== undefined && note.length > 0 ? note : undefined;
      const photoUrl = photo
        ? await uploadImageFile(photo)
        : editingEntry?.photoUrl;
      if (editingEntry) {
        await updateWeight({
          id: editingEntry.id,
          weight,
          date,
          note: note ?? "",
          photoUrl,
        });
      } else {
        await logWeight({
          weight,
          date,
          note: newNote,
          photoUrl,
        });
      }
      setIsDrawerOpen(false);
      return true;
    } catch (e) {
      showError(
        e instanceof Error && e.message.trim().length > 0
          ? e.message
          : "Couldn't save that entry. Please check your connection and try again."
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const latestWeight = weights.length > 0 ? weights[0].weight : undefined;
  const oldestWeight = weights.length > 0 ? weights[weights.length - 1].weight : undefined;
  const drawerInitialValues = useMemo(
    () =>
      editingEntry
        ? {
            weight: editingEntry.weight,
            date: editingEntry.date,
            note: editingEntry.note,
            photoUrl: editingEntry.photoUrl,
          }
        : undefined,
    [editingEntry?.id],
  );

  return (
    <div className="bg-black text-white font-sans relative min-h-screen overflow-x-clip pb-24">
      {/* Visual Design Element - Top 35% */}
      <div className="relative h-[35vh] pointer-events-none overflow-hidden">
        {/* Animated hexagonal pattern background with ORANGE override */}
        <div
          className="absolute inset-0 animated-hex-bg opacity-50"
          style={{ "--c": "#f97316" } as any}
        />

        {/* Backdrop blur layer */}
        <div className="absolute inset-0 backdrop-blur-sm" />

        {/* Gradient fade from black (top-left) to transparent (bottom-right) */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black h-10 to-transparent" />

        {/* Content */}
        <div className="relative flex flex-col justify-end h-full px-4 pt-12">
          <div className="max-w-md mx-auto w-full">
            <h1 className="text-6xl font-bold tracking-tighter text-orange-500">
              Weights
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative px-4">
        <div className="mx-auto max-w-md space-y-6">
          <div className="px-1">
            <p className="text-sm text-zinc-400 font-medium">
              Track your body weight and progress.
            </p>
          </div>

          {isError && weights.length === 0 ? (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
              <h2 className="text-lg font-bold text-white break-words">
                Couldn&apos;t load your weigh-ins
              </h2>
              <p className="mt-2 text-sm text-zinc-400 break-words">
                Check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-4 min-h-11 rounded-xl bg-orange-500 px-6 text-sm font-semibold text-black transition-colors hover:bg-orange-400"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {isError ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2">
                  <p className="text-sm text-red-200">
                    Connection issue. Showing saved weigh-ins.
                  </p>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="min-h-11 shrink-0 rounded-xl border border-red-500/30 px-4 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/10"
                  >
                    Try again
                  </button>
                </div>
              ) : null}
              <WeightStatsCard
                currentWeight={latestWeight}
                startWeight={oldestWeight}
                unit={weightUnit}
              />

              <div className="rounded-3xl bg-zinc-900/30 border border-zinc-800/50 p-4 relative overflow-hidden backdrop-blur-xs">
                {isChartReady ? (
                  <Suspense
                    fallback={
                      <div className="h-64 animate-pulse rounded-xl bg-zinc-900/60" />
                    }
                  >
                    <WeightChart weights={weights} goal={goal} unit={weightUnit} />
                  </Suspense>
                ) : (
                  <div className="h-64 animate-pulse rounded-xl bg-zinc-900/60" />
                )}
              </div>

              <WeightHistoryList
                weights={weights}
                unit={weightUnit}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />

              {!isLoading && weights.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-orange-500/20 bg-orange-500/5 p-8 text-center">
                  <h2 className="text-lg font-bold text-white break-words">No weigh-ins yet</h2>
                  <p className="mt-2 text-sm text-zinc-400 break-words">
                    Log your first entry to start tracking trends, changes, and milestones over time.
                  </p>
                </div>
              ) : null}

              {isLoading && (
                <div className="text-center text-zinc-500 py-10">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 opacity-50" />
                  Loading history...
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* FAB for Log Weight - ORANGE */}
      <button
        onClick={handleOpenLog}
        aria-label="Log weight entry"
        className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 h-14 w-14 min-h-11 min-w-11 bg-linear-to-tr from-orange-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-900/40 text-white z-40 hover:scale-105 active:scale-95 transition-all outline-hidden ring-4 ring-orange-500/10"
      >
        <Plus className="w-8 h-8" strokeWidth={3} />
      </button>

      {isDrawerOpen ? (
        <Suspense fallback={null}>
          <LogWeightDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            onSave={handleSave}
            isSaving={isSaving}
            unit={weightUnit}
            initialValues={drawerInitialValues}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
