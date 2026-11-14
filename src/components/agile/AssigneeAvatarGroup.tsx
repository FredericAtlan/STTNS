import { AssigneeInitials } from "@/components/agile/AssigneeInitials";
import { profileDisplayName } from "@/lib/sttns/memberDisplay";
import type { SttnsProfile } from "@/types/sttns";
import { cn } from "@/lib/utils";

interface Props {
  /** Responsable feature (pilote global). */
  featureAssignee?: SttnsProfile | null;
  /** Responsables des sous-étapes (uniques). */
  partAssignees?: SttnsProfile[];
  size?: "sm" | "md";
  maxPartVisible?: number;
  className?: string;
}

export function AssigneeAvatarGroup({
  featureAssignee = null,
  partAssignees = [],
  size = "md",
  maxPartVisible = 4,
  className,
}: Props) {
  const visibleParts = partAssignees.slice(0, maxPartVisible);
  const overflow = partAssignees.length - visibleParts.length;
  const hasFeature = Boolean(featureAssignee);
  const hasParts = visibleParts.length > 0;

  if (!hasFeature && !hasParts) {
    return <AssigneeInitials profile={null} size={size} className={className} />;
  }

  return (
    <div
      className={cn("flex items-center", className)}
      title={[
        featureAssignee ? `Feature : ${profileDisplayName(featureAssignee)}` : null,
        hasParts
          ? `Sous-étapes : ${partAssignees.map((p) => profileDisplayName(p)).join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")}
    >
      {hasFeature && (
        <AssigneeInitials
          profile={featureAssignee}
          size={size}
          emphasis="primary"
          className="relative z-20"
        />
      )}
      {hasParts && (
        <div
          className={cn(
            "flex items-center",
            hasFeature && "-ml-1.5",
            !hasFeature && "gap-1"
          )}
        >
          {visibleParts.map((profile, index) => (
            <AssigneeInitials
              key={profile.id}
              profile={profile}
              size="sm"
              emphasis="part"
              className={cn("relative", hasFeature && index > 0 && "-ml-1.5")}
              style={{ zIndex: 10 - index }}
            />
          ))}
          {overflow > 0 && (
            <span
              className={cn(
                "relative z-0 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-zinc-200 bg-zinc-100 text-[10px] font-bold text-zinc-600",
                hasFeature && "-ml-1.5"
              )}
            >
              +{overflow}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
