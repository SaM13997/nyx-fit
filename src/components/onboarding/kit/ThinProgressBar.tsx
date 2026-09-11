export function ThinProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-ob-ink/[0.08]">
      <div
        className="h-full rounded-full bg-ob-progress"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
