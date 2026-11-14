"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  EffortBadge,
  ImpactBadge,
  RiskBadge,
  RiskyCountBadge,
} from "@/components/ui/ValueEffortBadges";
import type { SpineFeatureChild, SpineStoryChild } from "@/lib/sttns/spineChildren";
import { cn } from "@/lib/utils";

interface EpicTreeProps {
  mode: "epic";
  features: SpineFeatureChild[];
  projectSlug: string;
  epicId: string;
  onOpenFeature: (featureId: string) => void;
  onOpenStory: (storyId: string) => void;
  createFeatureHref?: string;
}

interface FeatureTreeProps {
  mode: "feature";
  stories: SpineStoryChild[];
  projectSlug: string;
  featureId: string;
  onOpenStory: (storyId: string) => void;
  createStoryHref?: string;
  /** Shape Up : aucune story encore. */
  shapeUpHint?: boolean;
}

type Props = EpicTreeProps | FeatureTreeProps;

function StoryRow({
  story,
  onOpen,
  indented,
}: {
  story: SpineStoryChild;
  onOpen: () => void;
  indented?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left text-sm transition hover:border-zinc-200 hover:bg-white",
        indented && "ml-6"
      )}
    >
      <SpineObjectIcon type="story" className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate font-medium text-zinc-800">{story.title}</span>
      <StatusBadge status={story.status} size="sm" />
      <EffortBadge days={story.effortDays} />
      <RiskBadge risk={story.complexity} showIcon />
    </button>
  );
}

function FeatureBlock({
  feature,
  onOpenFeature,
  onOpenStory,
  defaultOpen,
}: {
  feature: SpineFeatureChild;
  onOpenFeature: () => void;
  onOpenStory: (id: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? feature.stories.length > 0);

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/60">
      <div className="flex items-stretch gap-0.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center px-2 text-zinc-400 hover:text-zinc-700"
          aria-label={open ? "Replier" : "Déplier"}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onOpenFeature}
          className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2.5 text-left hover:bg-white/80"
        >
          <SpineObjectIcon type="feature" className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900">
            {feature.title}
          </span>
          <StatusBadge status={feature.status} size="sm" />
          <ImpactBadge impact={feature.impact} />
          <EffortBadge days={feature.effortDays} />
          <RiskyCountBadge count={feature.riskyCount} />
        </button>
      </div>
      {open && (
        <div className="space-y-0.5 border-t border-zinc-100 px-2 py-1.5">
          {feature.stories.length === 0 ? (
            <p className="ml-6 py-1.5 text-xs text-zinc-500">
              Aucune Story — Shape Up sur cette Feature.
            </p>
          ) : (
            feature.stories.map((story) => (
              <StoryRow
                key={story.id}
                story={story}
                indented
                onOpen={() => onOpenStory(story.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** Arbre Structure — Features→Stories (Epic) ou Stories (Feature). */
export function SpineChildrenTree(props: Props) {
  if (props.mode === "feature") {
    const { stories, featureId, projectSlug, onOpenStory, createStoryHref, shapeUpHint } =
      props;
    const href =
      createStoryHref ??
      `/projects/${projectSlug}/user-stories/new?feature_id=${featureId}`;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">
            Stories ({stories.length})
          </h3>
          <Link
            href={href}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Story
          </Link>
        </div>

        {stories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/70 px-4 py-5 text-sm text-amber-900">
            <p className="font-medium">Aucune Story rattachée</p>
            <p className="mt-1 text-xs text-amber-800">
              {shapeUpHint !== false
                ? "Mode Shape Up : Effort et Risque sont saisis sur la Feature jusqu'à la première Story."
                : "Créez une Story pour démarrer l'exécution."}
            </p>
            <Link
              href={href}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Créer une Story
            </Link>
          </div>
        ) : (
          <div className="space-y-0.5 rounded-lg border border-zinc-200 bg-zinc-50/40 p-1.5">
            {stories.map((story) => (
              <StoryRow key={story.id} story={story} onOpen={() => onOpenStory(story.id)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const { features, epicId, projectSlug, onOpenFeature, onOpenStory, createFeatureHref } =
    props;
  const href =
    createFeatureHref ?? `/projects/${projectSlug}/features/new?epic_id=${epicId}`;
  const storyTotal = features.reduce((n, f) => n + f.stories.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">
          Features ({features.length})
          <span className="ml-1.5 font-normal text-zinc-500">· {storyTotal} stories</span>
        </h3>
        <Link
          href={href}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Feature
        </Link>
      </div>

      {features.length === 0 ? (
        <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/70 px-4 py-5 text-sm text-amber-900">
          <p className="font-medium">Cet Epic n&apos;a aucune Feature</p>
          <p className="mt-1 text-xs text-amber-800">
            Les indicateurs V/E resteront vides tant qu&apos;aucune Feature n&apos;est rattachée.
            Créez la première Feature ici.
          </p>
          <Link
            href={href}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 underline"
          >
            <Plus className="h-3.5 w-3.5" />
            Créer une Feature
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {features.map((feature) => (
            <FeatureBlock
              key={feature.id}
              feature={feature}
              onOpenFeature={() => onOpenFeature(feature.id)}
              onOpenStory={onOpenStory}
            />
          ))}
        </div>
      )}
    </div>
  );
}
