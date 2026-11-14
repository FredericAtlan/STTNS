"use client";

import { Plus, X } from "lucide-react";
import {
  emptyStoryAction,
  STORY_ACTOR_LABELS,
} from "@/lib/sttns/userStories";
import type { SttnsInitiative, SttnsPersona, SttnsStoryActorType, SttnsUserStoryAction } from "@/types/sttns";

const STORY_FORM_ACTOR_TYPES: SttnsStoryActorType[] = ["persona", "platform"];

interface Props {
  actions: SttnsUserStoryAction[];
  onChange: (actions: SttnsUserStoryAction[]) => void;
  personas: SttnsPersona[];
  linkedPersonaIds: string[];
  initiatives: SttnsInitiative[];
  readOnly?: boolean;
}

export function UserStoryActionsEditor({
  actions,
  onChange,
  personas,
  linkedPersonaIds,
  initiatives,
  readOnly = false,
}: Props) {
  const defaultPersona = linkedPersonaIds[0] ?? personas[0]?.id ?? null;

  function update(index: number, patch: Partial<SttnsUserStoryAction>) {
    onChange(actions.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }

  function setActorType(index: number, actorType: SttnsStoryActorType) {
    update(index, {
      actor_type: actorType,
      persona_id: actorType === "persona" ? defaultPersona : null,
      external_label: actorType === "external" ? "" : null,
    });
  }

  function addAction() {
    onChange([...actions, emptyStoryAction(actions.length + 1, defaultPersona)]);
  }

  function removeAction(index: number) {
    onChange(actions.length <= 1 ? actions : actions.filter((_, i) => i !== index));
  }

  const personaOptions =
    linkedPersonaIds.length > 0
      ? personas.filter((p) => linkedPersonaIds.includes(p.id))
      : personas;

  return (
    <section className="sttns-card border-l-4 border-l-violet-500 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-bold text-zinc-900">Actions d&apos;échange</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Séquence ordonnée — sujet (persona ou plateforme), verbe, objet. Lien feature optionnel.
          </p>
          {readOnly && (
            <p className="mt-2 text-xs text-amber-800">
              Lecture seule — story validée ou vous n&apos;êtes pas l&apos;auteur du brouillon.
            </p>
          )}
        </div>
        {!readOnly && (
          <button type="button" onClick={addAction} className="sttns-btn-secondary rounded-full py-2 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        )}
      </div>

      <fieldset disabled={readOnly} className="mt-4 space-y-3 border-0 p-0 m-0 min-w-0">
      <ul className="space-y-3">
        {actions.map((action, index) => (
          <li
            key={index}
            className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-600">
                Étape {index + 1}
              </span>
              {actions.length > 1 && !readOnly && (
                <button
                  type="button"
                  onClick={() => removeAction(index)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                >
                  <X className="h-3.5 w-3.5" />
                  Retirer
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="sttns-label">Sujet</label>
                <select
                  className="sttns-input"
                  value={action.actor_type}
                  onChange={(e) => setActorType(index, e.target.value as SttnsStoryActorType)}
                >
                  {STORY_FORM_ACTOR_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {STORY_ACTOR_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              {action.actor_type === "persona" && (
                <div>
                  <label className="sttns-label">Persona</label>
                  <select
                    className="sttns-input"
                    value={action.persona_id ?? ""}
                    onChange={(e) => update(index, { persona_id: e.target.value || null })}
                  >
                    <option value="">— Choisir —</option>
                    {personaOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {action.actor_type === "platform" && <div className="hidden sm:block" aria-hidden />}

              <div>
                <label className="sttns-label">Verbe *</label>
                <input
                  className="sttns-input"
                  value={action.verb}
                  onChange={(e) => update(index, { verb: e.target.value })}
                  placeholder="scanne, valide, extrait…"
                  required
                />
              </div>

              <div className={action.actor_type === "platform" ? "sm:col-span-2" : ""}>
                <label className="sttns-label">Objet *</label>
                <input
                  className="sttns-input"
                  value={action.object}
                  onChange={(e) => update(index, { object: e.target.value })}
                  placeholder="sur quoi porte l'action"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="sttns-label">Feature liée (optionnel)</label>
                <select
                  className="sttns-input"
                  value={action.initiative_id ?? ""}
                  onChange={(e) => update(index, { initiative_id: e.target.value || null })}
                >
                  <option value="">— Aucune —</option>
                  {initiatives.map((init) => (
                    <option key={init.id} value={init.id}>
                      {init.feature_code ? `${init.feature_code} — ` : ""}
                      {init.feature_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="sttns-label">Note (optionnel)</label>
                <textarea
                  className="sttns-input min-h-[56px]"
                  value={action.note ?? ""}
                  onChange={(e) => update(index, { note: e.target.value })}
                  placeholder="Détail système, règle métier…"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      </fieldset>
    </section>
  );
}
