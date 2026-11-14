/**
 * @deprecated Widget legacy Personas — encore consommé par Why (`ContextMatrix`).
 * Migrer vers `components/why` ou `components/ui` à l’Étape C/A ; ne pas brancher de nouvelles routes `/personas`.
 */
import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  xs: "h-8 w-8 text-[10px] rounded-lg",
  sm: "h-10 w-10 text-xs rounded-xl",
  md: "h-12 w-12 text-sm rounded-xl",
} as const;

function personaInitials(name: string, code?: string | null): string {
  const fromCode = code?.trim();
  if (fromCode) return fromCode.slice(0, 2).toUpperCase();

  const trimmed = name.trim();
  if (!trimmed) return "??";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

interface Props {
  name: string;
  code?: string | null;
  avatarUrl?: string | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}

/** Miniature persona — photo ou initiales / code. */
export function PersonaAvatar({
  name,
  code,
  avatarUrl,
  size = "xs",
  className,
}: Props) {
  const trimmedUrl = avatarUrl?.trim() || null;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden border-2 border-emerald-200 bg-emerald-50 font-bold uppercase tracking-tight text-emerald-900",
        SIZE_CLASS[size],
        className
      )}
      title={name}
    >
      {trimmedUrl ? (
        <Image
          src={trimmedUrl}
          alt=""
          width={48}
          height={48}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {personaInitials(name, code)}
        </span>
      )}
    </div>
  );
}
