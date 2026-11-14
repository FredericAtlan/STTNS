"use client";

import { SttnsContextHelp } from "@/components/ui/SttnsContextHelp";
import type { SttnsContextHelpContent } from "@/lib/sttns/sttnsContext";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  help: SttnsContextHelpContent;
  className?: string;
  labelClassName?: string;
};

export function MatrixAxisLabel({ label, help, className, labelClassName }: Props) {
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      <span
        className={cn(
          "text-[9px] font-bold uppercase tracking-wider text-zinc-500",
          labelClassName
        )}
      >
        {label}
      </span>
      <SttnsContextHelp {...help} placement="top" size="sm" />
    </div>
  );
}

type QuadrantProps = {
  label: string;
  help: SttnsContextHelpContent;
  toneClassName?: string;
  positionClassName?: string;
};

export function MatrixQuadrantLabel({
  label,
  help,
  toneClassName,
  positionClassName,
}: QuadrantProps) {
  return (
    <span
      className={cn(
        "absolute inline-flex max-w-[46%] items-start gap-0.5 rounded-md bg-white/85 px-1.5 py-1 shadow-sm ring-1 ring-zinc-200/70 backdrop-blur-[1px]",
        positionClassName
      )}
    >
      <span className={cn("text-[9px] font-semibold leading-tight", toneClassName)}>{label}</span>
      <SttnsContextHelp {...help} placement="top" size="sm" />
    </span>
  );
}
