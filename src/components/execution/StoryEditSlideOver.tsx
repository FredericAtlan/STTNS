"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SttnsSlideOver } from "@/components/ui/SttnsSlideOver";
import { UserStoryForm } from "@/components/execution/UserStoryForm";
import { StoryTasksPanel } from "@/components/execution/StoryTasksPanel";
import {
  fetchProjectMembersForTasksAction,
  fetchStoryTasksAction,
  type StoryTaskProjectMember,
} from "@/app/projects/[slug]/user-stories/actions";
import type {
  StoryCycleOption,
  StoryFeatureOption,
  StoryTaskRow,
} from "@/lib/sttns/storiesSpine";
import type { WorkItemStatus } from "@/lib/sttns/types";

export type StoryEditData = {
  id: string;
  title: string;
  description?: string | null;
  doc_url?: string | null;
  feature_id: string | null;
  cycle_id: string | null;
  effort_days?: 0.5 | 1 | 2 | 3 | 5 | null;
  complexity?: 1 | 2 | 3 | null;
  metadata?: unknown;
  /** @deprecated */
  effort_points?: number;
  status: WorkItemStatus;
  assignee_id?: string | null;
};

interface Props {
  open: boolean;
  story: StoryEditData | null;
  projectId: string;
  projectSlug: string;
  features: StoryFeatureOption[];
  cycles: StoryCycleOption[];
  onClose: () => void;
  onSaved: () => void;
}

export function StoryEditSlideOver({
  open,
  story,
  projectId,
  projectSlug,
  features,
  cycles,
  onClose,
  onSaved,
}: Props) {
  const [tasks, setTasks] = useState<StoryTaskRow[]>([]);
  const [projectMembers, setProjectMembers] = useState<StoryTaskProjectMember[]>([]);
  const [readOnly, setReadOnly] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    if (!open || !story?.id) {
      setTasks([]);
      setProjectMembers([]);
      setReadOnly(false);
      return;
    }

    let cancelled = false;
    setLoadingTasks(true);

    Promise.all([
      fetchStoryTasksAction(story.id),
      fetchProjectMembersForTasksAction(projectId),
    ]).then(([tasksResult, membersResult]) => {
      if (cancelled) return;
      setLoadingTasks(false);
      if (tasksResult.ok) setTasks(tasksResult.tasks);
      if (membersResult.ok) {
        setProjectMembers(membersResult.members);
        setReadOnly(membersResult.readOnly);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, story?.id, projectId]);

  return (
    <SttnsSlideOver
      open={open && !!story}
      onClose={onClose}
      title={story?.title ?? "Story"}
      eyebrow="Stories Backlogs"
      size="lg"
    >
      {story && (
        <div className="space-y-6">
          <UserStoryForm
            key={`story:${story.id ?? "new"}`}
            projectId={projectId}
            projectSlug={projectSlug}
            features={features}
            cycles={cycles}
            projectMembers={projectMembers}
            initial={{
              id: story.id,
              title: story.title,
              description: story.description ?? "",
              doc_url: story.doc_url ?? "",
              feature_id: story.feature_id,
              cycle_id: story.cycle_id,
              effort_days: story.effort_days,
              complexity: story.complexity,
              metadata: story.metadata,
              status: story.status,
              assignee_id: story.assignee_id ?? null,
            }}
            hideTitle
            readOnly={readOnly}
            onSuccess={() => {
              onSaved();
              onClose();
            }}
          />

          {loadingTasks ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement des tasks…
            </div>
          ) : (
            <StoryTasksPanel
              storyId={story.id}
              projectId={projectId}
              projectSlug={projectSlug}
              initialTasks={tasks}
              projectMembers={projectMembers}
              readOnly={readOnly}
            />
          )}
        </div>
      )}
    </SttnsSlideOver>
  );
}
