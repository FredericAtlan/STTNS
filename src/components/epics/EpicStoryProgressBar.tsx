import { epicStoryValidationCounts } from "@/lib/sttns/epicCatalog";
import type { SttnsUserStory } from "@/types/sttns";
import { cn } from "@/lib/utils";

export function EpicStoryProgressBar({
  stories,
  className,
}: {
  stories: Pick<SttnsUserStory, "status">[];
  className?: string;
}) {
  const { total, validated } = epicStoryValidationCounts(stories);

  if (total === 0) {
    return (
      <span className={cn("text-xs font-medium text-amber-700", className)}>0 story</span>
    );
  }

  const pct = Math.round((validated / total) * 100);
  const tone =
    validated === 0 ? "bg-red-500" : validated < total ? "bg-amber-500" : "bg-emerald-600";

  return (
    <div className={cn("min-w-[7rem] space-y-1", className)}>
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold tabular-nums text-zinc-600">
        <span>
          {validated}/{total} validée{validated > 1 ? "s" : ""}
        </span>
        <span className="text-zinc-400">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
