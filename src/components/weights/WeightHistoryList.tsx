import { Trash2, Edit2 } from "lucide-react";
import type { WeightEntry } from "@/lib/types";
import { format } from "date-fns";
import { useStorageUrl } from "@/lib/convex/hooks";
// import { Drawer } from "some-drawer-lib"; // If we want to view image, or just simple img tag

interface WeightHistoryListProps {
  weights: WeightEntry[];
  onDelete: (id: string) => void;
  onEdit: (entry: WeightEntry) => void;
}

export function WeightHistoryList({ weights, onDelete, onEdit }: WeightHistoryListProps) {
  if (weights.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-zinc-200 px-1">History</h3>
      <div className="space-y-3">
        {weights.map((entry) => (
          <WeightHistoryItem
            key={entry.id}
            entry={entry}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}

function WeightHistoryItem({
  entry,
  onDelete,
  onEdit
}: {
  entry: WeightEntry;
  onDelete: (id: string) => void;
  onEdit: (entry: WeightEntry) => void;
}) {
  const { url } = useStorageUrl(entry.photoUrl as string); // Handle if undefined, hook is safe

  return (
    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-xl font-bold text-white">{entry.weight} <span className="text-sm font-normal text-zinc-500">lbs</span></span>
          <span className="text-xs text-zinc-400">{format(new Date(entry.date), "MMM d, yyyy")}</span>
        </div>
        {url && (
          <div className="h-10 w-10 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800 relative">
            <img src={url} alt="Progress" className="h-full w-full object-cover" />
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
