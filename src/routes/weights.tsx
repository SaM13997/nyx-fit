import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
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
import { PageShell, PageHero, ContentContainer, StateBlock } from "@/components/page-shell";
import type { WeightEntry } from "@/lib/types";

export const Route = createFileRoute("/weights")({
  component: WeightsPage,
});

function WeightsPage() {
  const { weights, isLoading } = useWeights();
  const { goal } = useWeightGoal();
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
    <PageShell>
      <PageHero
        title="Weights"
        description="Track your body weight and progress."
        accentColor="orange"
        height="large"
      />

      <ContentContainer>
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
          <StateBlock variant="loading" />
        )}
      </ContentContainer>

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
    </PageShell>
  );
}
