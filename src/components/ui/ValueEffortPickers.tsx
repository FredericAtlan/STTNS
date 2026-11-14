"use client";

import { cn } from "@/lib/utils";
import {
  RISK_LABELS,
  COMPLEXITY_OPTIONS,
  EFFORT_DAYS_OPTIONS,
  IMPACT_LABELS,
  IMPACT_OPTIONS,
  type ComplexityLevel,
  type EffortDays,
  type ImpactLevel,
} from "@/lib/sttns/valueEffort";

type ImpactPickerProps = {
  value: ImpactLevel | null;
  onChange: (value: ImpactLevel) => void;
  disabled?: boolean;
  /** Grille dense pour tableaux (Matrice Discovery). */
  compact?: boolean;
};

/** Saisie Impact Feature (domaine Produit). */
export function ImpactPicker({ value, onChange, disabled, compact }: ImpactPickerProps) {
  if (compact) {
    return (
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (IMPACT_OPTIONS.includes(n as ImpactLevel)) onChange(n as ImpactLevel);
        }}
        className={cn(
          "sttns-input",
          value === 0 && "border-destructive/20 bg-destructive/10 text-destructive"
        )}
        aria-label="Impact"
      >
        <option value="" disabled>
          —
        </option>
        {IMPACT_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            I:{opt} {IMPACT_LABELS[opt]}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="space-y-2">
      <p className="sttns-label mb-0">Impact (valeur) *</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {IMPACT_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={cn(
              "rounded-lg border px-2 py-2 text-left text-xs transition",
              value === opt
                ? opt === 0
                  ? "border-destructive bg-destructive/5 text-destructive"
                  : "border-primary bg-primary/5 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted",
              disabled && "opacity-50"
            )}
          >
            <span className="block font-semibold">I:{opt}</span>
            <span className="text-[10px] leading-tight">{IMPACT_LABELS[opt]}</span>
          </button>
        ))}
      </div>
      {value === 0 && (
        <p className="text-xs text-destructive">
          Gaspillage : passage en cours bloqué jusqu&apos;à revalorisation.
        </p>
      )}
    </div>
  );
}

type EffortDaysPickerProps = {
  value: EffortDays | null;
  onChange: (value: EffortDays) => void;
  disabled?: boolean;
  label?: string;
  compact?: boolean;
};

/** Saisie Effort en jours (Story, ou Feature Shape Up sans stories). */
export function EffortDaysPicker({
  value,
  onChange,
  disabled,
  label = "Jours d'effort *",
  compact,
}: EffortDaysPickerProps) {
  if (compact) {
    return (
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (EFFORT_DAYS_OPTIONS.includes(n as EffortDays)) onChange(n as EffortDays);
        }}
        className="sttns-input"
        aria-label="Effort jours"
      >
        <option value="" disabled>
          —
        </option>
        {EFFORT_DAYS_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}j
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="space-y-2">
      <p className="sttns-label mb-0">{label}</p>
      <div className="flex flex-wrap gap-2">
        {EFFORT_DAYS_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={cn(
              "min-w-[3rem] rounded-lg border px-3 py-2 text-sm font-semibold transition",
              value === opt
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
              disabled && "opacity-50"
            )}
          >
            {opt}j
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Plafond 5j — découpez si c&apos;est plus gros.
      </p>
    </div>
  );
}

type RiskPickerProps = {
  value: ComplexityLevel | null;
  onChange: (value: ComplexityLevel) => void;
  disabled?: boolean;
  compact?: boolean;
};

/**
 * Saisie Risque 1–3 (stocké en metadata.complexity).
 * Badge compact : R:1 / R:2 / R:3.
 */
export function RiskPicker({ value, onChange, disabled, compact }: RiskPickerProps) {
  if (compact) {
    return (
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (COMPLEXITY_OPTIONS.includes(n as ComplexityLevel)) {
            onChange(n as ComplexityLevel);
          }
        }}
        className={cn(
          "sttns-input",
          value === 3 && "border-warning/20 bg-warning/10 font-semibold text-warning"
        )}
        aria-label="Risque"
      >
        <option value="" disabled>
          —
        </option>
        {COMPLEXITY_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            R:{opt} {RISK_LABELS[opt]}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="space-y-2">
      <p className="sttns-label mb-0">Risque *</p>
      <div className="grid grid-cols-3 gap-2">
        {COMPLEXITY_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={cn(
              "rounded-lg border px-2 py-2 text-left text-xs transition",
              value === opt
                ? opt === 3
                  ? "border-warning bg-warning/5 text-warning"
                  : "border-primary bg-primary/5 text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
              disabled && "opacity-50"
            )}
          >
            <span className="block font-semibold">R:{opt}</span>
            <span className="text-[10px] leading-tight">{RISK_LABELS[opt]}</span>
          </button>
        ))}
      </div>
      {value === 3 && (
        <p className="text-xs text-warning">
          Risque Inconnu — envisagez un POC (Spike) avant engagement.
        </p>
      )}
    </div>
  );
}

/** @deprecated Alias — préférer RiskPicker. */
export const ComplexityPicker = RiskPicker;
