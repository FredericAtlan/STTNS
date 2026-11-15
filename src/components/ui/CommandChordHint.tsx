"use client";

import { SttnsModal } from "@/components/ui/SttnsModal";
import { groupChordsForHelp } from "@/lib/sttns/commandChords";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Aide keymap KF2 — modal listant tous les accords `g …` / `n …`.
 * Ouverte par la touche `?` (hors saisie) ou depuis la palette.
 */
export function CommandChordHint({ open, onClose }: Props) {
  const groups = groupChordsForHelp();

  return (
    <SttnsModal
      open={open}
      onClose={onClose}
      eyebrow="Accords clavier"
      title="Command Chord Spine"
      size="md"
      ariaLabelClose="Fermer l'aide clavier"
    >
      <div className="space-y-5 text-sm text-foreground">
        <p className="text-muted-foreground">
          Deux touches à la suite (moins de 1,5 s) pour naviguer ou créer sans
          quitter le clavier. La palette globale reste accessible par{" "}
          <Shortcut>⌘K</Shortcut> ou <Shortcut>Ctrl K</Shortcut>.
        </p>

        {groups.map((group) => (
          <section key={group.prefix} className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {group.title}
            </h3>
            <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
              {group.entries.map((entry) => (
                <li
                  key={`${entry.prefix}${entry.key}`}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <span className="min-w-0 truncate text-foreground">
                    {entry.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-muted-foreground">
                    <Shortcut>{entry.prefix}</Shortcut>
                    <span aria-hidden>then</span>
                    <Shortcut>{entry.key}</Shortcut>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="text-xs text-muted-foreground">
          Astuce : appuyer <Shortcut>?</Shortcut> depuis n&apos;importe quelle page
          projet pour rouvrir cette aide. Les accords sont ignorés dans les
          champs de saisie.
        </p>
      </div>
    </SttnsModal>
  );
}

function Shortcut({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 font-mono text-[10px] font-semibold uppercase text-foreground">
      {children}
    </kbd>
  );
}
