import { cn } from "../lib/utils";

export function StatTile({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-black/20 p-4",
        className,
      )}
    >
      <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-black tracking-tighter text-white">
        {value}
      </div>
    </div>
  );
}
