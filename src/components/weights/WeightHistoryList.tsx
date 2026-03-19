import { Trash2, Edit2 } from "lucide-react";
import type { WeightEntry } from "@/lib/types";
import { useStorageUrl } from "@/lib/convex/hooks";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { WeightUnit } from "@/lib/types";
import { formatWeight, formatWeightUnit } from "@/lib/units";
import { formatLocaleDate } from "@/lib/utils";

interface WeightHistoryListProps {
  weights: WeightEntry[];
  unit: WeightUnit;
  onDelete: (id: string) => void;
  onEdit: (entry: WeightEntry) => void;
}

export function WeightHistoryList({ weights, unit, onDelete, onEdit }: WeightHistoryListProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(weights.length / 5));

  useEffect(() => {
    setPage(1);
  }, [weights.length]);

  const visibleWeights = useMemo(() => {
    const startIndex = (page - 1) * 5;
    return weights.slice(startIndex, startIndex + 5);
  }, [page, weights]);

  if (weights.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-bold text-zinc-200">History</h3>
        <span className="text-xs font-medium text-zinc-500">
          Page {page} of {totalPages}
        </span>
      </div>
      <div className="space-y-3">
        {visibleWeights.map((entry) => (
          <WeightHistoryItem
            key={entry.id}
            entry={entry}
            unit={unit}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-800 hover:text-white"
          >
            Previous
          </Button>
          <div className="text-xs text-zinc-500">
            Showing {(page - 1) * 5 + 1}-{Math.min(page * 5, weights.length)} of {weights.length}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages}
            className="border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-800 hover:text-white"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function WeightHistoryItem({
  entry,
  unit,
  onDelete,
  onEdit
}: {
  entry: WeightEntry;
  unit: WeightUnit;
  onDelete: (id: string) => void;
  onEdit: (entry: WeightEntry) => void;
}) {
  const { url } = useStorageUrl(entry.photoUrl as string); // Handle if undefined, hook is safe

  return (
    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between group">
      <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white">{formatWeight(entry.weight, unit)} <span className="text-sm font-normal text-zinc-500">{formatWeightUnit(unit)}</span></span>
            <span className="text-xs text-zinc-400">{formatLocaleDate(entry.date, { year: "numeric", month: "short", day: "numeric" })}</span>
          </div>
        {url && (
          <div className="h-10 w-10 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800 relative">
            <img
              src={url}
              alt="Progress"
              width="40"
              height="40"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        )}
        {entry.note && (
          <div className="hidden sm:block text-xs text-zinc-500 italic max-w-[150px] truncate">
            "{entry.note}"
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(entry)}
          className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            if (confirm("Are you sure you want to delete this entry?")) {
              onDelete(entry.id);
            }
          }}
          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-900/10 rounded-full transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
