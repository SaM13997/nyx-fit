import { createFileRoute } from "@tanstack/react-router";
import { Plus, Loader2 } from "lucide-react";
import {
  useWeights,
  useLogWeight,
  useUpdateWeight,
  useDeleteWeight,
  useWeightGoal,
} from "@/lib/convex/hooks";
import { useState } from "react";
import { WeightChart } from "@/components/weights/WeightChart";
import { WeightStatsCard } from "@/components/weights/WeightStatsCard";
import { WeightHistoryList } from "@/components/weights/WeightHistoryList";
import { LogWeightDrawer } from "@/components/weights/LogWeightDrawer";
import type { WeightEntry } from "@/lib/types";

export const Route = createFileRoute("/weights")({
  component: WeightsPage,
});

function WeightsPage() {
  const { weights, isLoading } = useWeights();
  const { goal } = useWeightGoal(); // For chart reference
  const { logWeight } = useLogWeight();
  const { updateWeight } = useUpdateWeight();
  const { deleteWeight } = useDeleteWeight();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
      await deleteWeight({ id: id as any });
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  const handleSave = async (
    weight: number,
    date: string,
    note?: string,
    photoStorageId?: string
  ) => {
    try {
      setIsSaving(true);
      if (editingEntry) {
        await updateWeight({
          id: editingEntry.id as any,
          weight,
          date,
          note,
          photoUrl: photoStorageId,
        });
      } else {
        await logWeight({
          weight,
          date,
          note,
          photoUrl: photoStorageId,
        });
      }
      setIsDrawerOpen(false);
    } catch (e) {
      console.error("Failed to save", e);
    } finally {
      setIsSaving(false);
    }
  };

  const latestWeight = weights.length > 0 ? weights[0].weight : undefined;
  const oldestWeight = weights.length > 0 ? weights[weights.length - 1].weight : undefined;

  return (
    <div className="bg-black text-white font-sans relative min-h-screen pb-24">
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

          <WeightStatsCard
            currentWeight={latestWeight}
            startWeight={oldestWeight}
          />

          <div className="rounded-3xl bg-zinc-900/30 border border-zinc-800/50 p-4 relative overflow-hidden backdrop-blur-xs">
            <WeightChart weights={weights} goal={goal} />
          </div>

          <WeightHistoryList
            weights={weights}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {isLoading && (
            <div className="text-center text-zinc-500 py-10">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 opacity-50" />
              Loading history...
            </div>
          )}
        </div>
      </div>

      {/* FAB for Log Weight - ORANGE */}
      <button
        onClick={handleOpenLog}
        className="fixed bottom-6 right-6 h-16 w-16 bg-linear-to-tr from-orange-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-900/40 text-white z-50 hover:scale-105 active:scale-95 transition-all outline-hidden ring-4 ring-orange-500/10"
      >
        <Plus className="w-8 h-8" strokeWidth={3} />
      </button>

      <LogWeightDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSave}
        isSaving={isSaving}
        initialValues={editingEntry ? {
          weight: editingEntry.weight,
          date: editingEntry.date,
          note: editingEntry.note,
          photoUrl: editingEntry.photoUrl
        } : undefined}
      />
    </div>
  );
}
