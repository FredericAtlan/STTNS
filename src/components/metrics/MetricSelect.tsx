"use client";

import type { MetricSelectOption } from "@/lib/sttns/metrics";
import { cn } from "@/lib/utils";

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: MetricSelectOption[];
  placeholder?: string;
  className?: string;
}

export function MetricSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "— Choisir —",
  className,
}: Props) {
  return (
    <select
      id={id}
      className={cn("sttns-input", className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option
          key={opt.value}
          value={opt.value}
          className={opt.level === "sub" ? "pl-4" : undefined}
        >
          {opt.level === "sub"
            ? `${"  ".repeat(Math.max(0, opt.depth ?? 0))}↳ ${opt.label.split(" › ").pop()}`
            : opt.label}
        </option>
      ))}
    </select>
  );
}
