import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/sttns-logo.png";

type Props = {
  /** Taille en pixels (carré). */
  size?: number;
  className?: string;
  title?: string;
};

/** Logo STTNS officiel — asset PNG tel quel (hexagone + étoile). */
export function SttnsLogo({ size = 24, className, title = "STTNS" }: Props) {
  return (
    <Image
      src={LOGO_SRC}
      alt={title}
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      priority
    />
  );
}

/** Marque complète : pictogramme + libellé (sidebar). */
export function SttnsLogoMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <SttnsLogo size={compact ? 32 : 40} />
      {!compact && (
        <div>
          <p className="text-lg font-semibold leading-tight text-zinc-900">
            Straight to the North Star
          </p>
        </div>
      )}
    </div>
  );
}
