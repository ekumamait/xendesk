import { cn } from "@/lib/utils";

export function AppLoader({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-4",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative h-12 w-12">
        <span className="absolute inset-0 animate-ping rounded-full bg-indigo-500/25" />
        <span className="absolute inset-2 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-400" />
      </div>
    </div>
  );
}
