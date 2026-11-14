"use client";

import { useState } from "react";

interface Props {
  projectId: string;
  projectSlug: string;
  initiativeId: string;
  tasks: { id: string; title: string }[];
  members: { user_id: string; role: string }[];
}

export function FeatureSubtasksPanel({
  tasks,
}: Props) {
  const [newTaskTitle, setNewTaskTitle] = useState("");

  return (
    <div className="rounded border border-zinc-200 bg-white p-4">
      <h3 className="font-medium text-zinc-900">Sous-tâches</h3>

      <div className="mt-3 space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucune sous-tâche.</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled className="rounded" />
              <span className="text-zinc-700">{task.title}</span>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Nouvelle tâche..."
          disabled
          className="flex-1 rounded border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-sm text-zinc-500"
        />
        <button
          disabled
          className="rounded bg-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-500"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
