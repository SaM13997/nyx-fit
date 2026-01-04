import { AnimatePresence, motion } from "framer-motion";
import { X, Camera, Calendar, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useUploadUrl } from "@/lib/convex/hooks";
import { WheelPicker } from "../wheel-picker";
import { format, getYear, getMonth, getDate, lastDayOfMonth } from "date-fns";

interface LogWeightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weight: number, date: string, note?: string, photoStorageId?: string) => Promise<void>;
  isSaving: boolean;
  initialValues?: {
    weight: number;
    date: string;
    note?: string;
    photoUrl?: string;
  };
}

const YEARS = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const WEIGHT_INTEGERS = Array.from({ length: 400 }, (_, i) => (i + 1).toString());
const WEIGHT_DECIMALS = Array.from({ length: 10 }, (_, i) => i.toString());

export function LogWeightDrawer({ isOpen, onClose, onSave, isSaving, initialValues }: LogWeightDrawerProps) {
  // Weight state split into integer and decimal
  const [weightInt, setWeightInt] = useState("180");
  const [weightDec, setWeightDec] = useState("0");

  // Date state split into components
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [day, setDay] = useState(new Date().getDate().toString());

  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { generateUploadUrl } = useUploadUrl();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        const w = initialValues.weight;
        setWeightInt(Math.floor(w).toString());
        setWeightDec(Math.round((w % 1) * 10).toString());

        const d = new Date(initialValues.date);
        setYear(getYear(d).toString());
        setMonth(MONTHS[getMonth(d)]);
        setDay(getDate(d).toString());
        setNote(initialValues.note || "");
      } else {
        const now = new Date();
        setWeightInt("180");
        setWeightDec("0");
        setYear(now.getFullYear().toString());
        setMonth(MONTHS[now.getMonth()]);
        setDay(now.getDate().toString());
        setNote("");
      }
      setPhoto(null);
    }
  }, [isOpen, initialValues]);

  const daysInMonth = (mName: string, yStr: string) => {
    const mIndex = MONTHS.indexOf(mName);
    const date = new Date(parseInt(yStr), mIndex, 1);
    return lastDayOfMonth(date).getDate();
  };

  const dayOptions = Array.from({ length: daysInMonth(month, year) }, (_, i) => (i + 1).toString());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    const weightNum = parseFloat(`${weightInt}.${weightDec}`);
    const monthIndex = MONTHS.indexOf(month);
    const dateObj = new Date(parseInt(year), monthIndex, parseInt(day));
    const dateISO = dateObj.toISOString();

    try {
      let photoStorageId: string | undefined = undefined;

      if (photo) {
        setIsUploading(true);
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": photo.type },
          body: photo,
        });
        if (!result.ok) throw new Error("Upload failed");
        const { storageId } = await result.json();
        photoStorageId = storageId;
        setIsUploading(false);
      }

      await onSave(weightNum, dateISO, note, photoStorageId);
      onClose();
    } catch (e) {
      console.error("Error logging weight:", e);
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl z-[100] max-h-[90vh] flex flex-col border-t border-white/10"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{initialValues ? "Edit Entry" : "Log Weight"}</h2>
              <button
                onClick={onClose}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-8 overflow-y-auto pb-12 scrollbar-hide">
              {/* Weight Wheel Picker */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider text-center">Weight (lbs)</label>
                <div className="flex justify-center items-center gap-2">
                  <div className="relative h-40 w-24 overflow-hidden rounded-xl bg-zinc-800/50">
                    <WheelPicker
                      options={WEIGHT_INTEGERS.map(w => ({ value: w, label: w }))}
                      value={weightInt}
                      onValueChange={(val) => setWeightInt(val)}
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-zinc-900/80 via-transparent to-zinc-900/80" />
                  </div>
                  <span className="text-3xl font-bold text-zinc-600">.</span>
                  <div className="relative h-40 w-20 overflow-hidden rounded-xl bg-zinc-800/50">
                    <WheelPicker
                      options={WEIGHT_DECIMALS.map(w => ({ value: w, label: w }))}
                      value={weightDec}
                      onValueChange={(val) => setWeightDec(val)}
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-zinc-900/80 via-transparent to-zinc-900/80" />
                  </div>
                </div>
              </div>

              {/* Date Wheel Picker */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider text-center flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" /> Date
                </label>
                <div className="flex justify-center gap-2">
                  <div className="relative h-32 w-28 overflow-hidden rounded-xl bg-zinc-800/50">
                    <WheelPicker
                      options={MONTHS.map(m => ({ value: m, label: m.substring(0, 3) }))}
                      value={month}
                      onValueChange={(val) => setMonth(val)}
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-zinc-900/80 via-transparent to-zinc-900/80" />
                  </div>
                  <div className="relative h-32 w-20 overflow-hidden rounded-xl bg-zinc-800/50">
                    <WheelPicker
                      options={dayOptions.map(d => ({ value: d, label: d }))}
                      value={day}
                      onValueChange={(val) => setDay(val)}
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-zinc-900/80 via-transparent to-zinc-900/80" />
                  </div>
                  <div className="relative h-32 w-24 overflow-hidden rounded-xl bg-zinc-800/50">
                    <WheelPicker
                      options={YEARS.map(y => ({ value: y, label: y }))}
                      value={year}
                      onValueChange={(val) => setYear(val)}
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-zinc-900/80 via-transparent to-zinc-900/80" />
                  </div>
                </div>
              </div>

              {/* Note Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Note (Optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="How are you feeling?"
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 transition-all resize-none h-20"
                />
              </div>

              {/* Photo Input */}
              <div>
                <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2 block">Progress Photo</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-800/50 transition-colors",
                    photo ? "border-orange-500/50 bg-orange-500/10" : ""
                  )}
                >
                  {photo ? (
                    <div className="text-center">
                      <div className="text-orange-300 font-medium truncate max-w-[200px] text-sm">{photo.name}</div>
                      <div className="text-xs text-orange-400/60 mt-1">Click to change</div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div className="text-zinc-400 text-xs text-center">Tap to upload photo</div>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSaving || isUploading}
                className="w-full bg-linear-to-r from-orange-600 to-rose-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {(isSaving || isUploading) ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isUploading ? "Uploading..." : "Saving..."}
                  </>
                ) : (
                  "Save Entry"
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
