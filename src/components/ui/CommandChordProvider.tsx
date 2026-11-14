"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandChordHint } from "@/components/ui/CommandChordHint";
import {
  CHORD_TIMEOUT_MS,
  chordNavigateUrl,
  detectChordPrefix,
  findChord,
  shouldIgnoreForChord,
  type ChordPrefix,
} from "@/lib/sttns/commandChords";

type Props = {
  projectSlug: string;
};

/**
 * KF2 — Command Chord Spine.
 *
 * Provider client-only monté dans `AppShell` uniquement dans le contexte
 * projet. Il écoute les touches au niveau document et déclenche :
 *   - navigation (préfixe `g`) — via `router.push`
 *   - quick action (préfixe `n`) — via `sttns:open-quick-action`
 *   - aide keymap (`?`) — modal `CommandChordHint`
 *
 * Toutes les touches sont ignorées dans un champ de saisie ou lorsqu'un
 * modifieur est actif (Ctrl/Meta/Alt). L'accord expire après
 * `CHORD_TIMEOUT_MS`.
 */
export function CommandChordProvider({ projectSlug }: Props) {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  const pendingPrefix = useRef<ChordPrefix | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    pendingPrefix.current = null;
    if (pendingTimer.current) {
      clearTimeout(pendingTimer.current);
      pendingTimer.current = null;
    }
  }, []);

  const armPending = useCallback(
    (prefix: ChordPrefix) => {
      clearPending();
      pendingPrefix.current = prefix;
      pendingTimer.current = setTimeout(clearPending, CHORD_TIMEOUT_MS);
    },
    [clearPending]
  );

  useEffect(() => {
    if (!projectSlug) return;

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as (HTMLElement & { isContentEditable?: boolean }) | null;
      if (
        shouldIgnoreForChord(
          {
            key: event.key,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            altKey: event.altKey,
            shiftKey: event.shiftKey,
          },
          target
        )
      ) {
        clearPending();
        return;
      }

      // Un slide-over / modal ouvert = focus produit. On n'intercepte pas.
      // (L'aide keymap `CommandChordHint` reste accessible via son bouton
      // Fermer et laisse alors le chord repartir.)
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
        clearPending();
        return;
      }

      if (event.key === "?") {
        event.preventDefault();
        clearPending();
        setHelpOpen(true);
        return;
      }

      if (event.key === "Escape") {
        clearPending();
        return;
      }

      if (pendingPrefix.current) {
        const entry = findChord(pendingPrefix.current, event.key);
        clearPending();
        if (!entry) return;
        event.preventDefault();

        if (entry.navigate) {
          const url = chordNavigateUrl(entry, projectSlug);
          if (url) router.push(url);
          return;
        }

        if (entry.quickAction) {
          window.dispatchEvent(
            new CustomEvent("sttns:open-quick-action", {
              detail: { actionId: entry.quickAction },
            })
          );
        }
        return;
      }

      const prefix = detectChordPrefix(event.key);
      if (prefix) {
        event.preventDefault();
        armPending(prefix);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const onOpenHelp = () => setHelpOpen(true);
    window.addEventListener("sttns:open-chord-help", onOpenHelp);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("sttns:open-chord-help", onOpenHelp);
      clearPending();
    };
  }, [projectSlug, router, armPending, clearPending]);

  return <CommandChordHint open={helpOpen} onClose={() => setHelpOpen(false)} />;
}
