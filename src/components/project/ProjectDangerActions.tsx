"use client";

import { useRouter } from "next/navigation";
import { Copy, Archive, Loader2, Edit2 } from "lucide-react";
import { useState } from "react";
import { archiveProjectAction, duplicateProjectAction, renameProjectAction } from "@/app/projects/actions";
import { projectHomePath } from "@/lib/sttns/paths";
import { SttnsIconTip } from "@/components/ui/SttnsIconTip";

type Props = {
  projectId: string;
  projectSlug: string;
  projectName: string;
};

export function ProjectDangerActions({ projectId, projectSlug, projectName }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleRename() {
    const newName = window.prompt("Nouveau nom du projet :", projectName);
    if (!newName || newName.trim() === "" || newName === projectName) return;
    
    setBusy(true);
    const result = await renameProjectAction(projectId, newName);
    setBusy(false);
    if (!result.ok) {
      alert(`Error renaming: ${result.error}`);
      return;
    }
    router.refresh();
  }

  async function handleDuplicate() {
    setBusy(true);
    const result = await duplicateProjectAction(projectId);
    setBusy(false);
    if (!result.ok) {
      alert(`Error duplicating: ${result.error}`);
      return;
    }
    router.push(projectHomePath(result.slug));
    router.refresh();
  }

  async function handleArchive() {
    if (!confirm(`Archive project "${projectSlug}"?`)) return;
    setBusy(true);
    const result = await archiveProjectAction(projectId);
    setBusy(false);
    if (!result.ok) {
      alert(`Error: ${result.error}`);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <SttnsIconTip label="Renommer" placement="bottom">
        <button type="button" onClick={handleRename} disabled={busy} className="sttns-btn-icon text-zinc-600 hover:text-zinc-900">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="h-4 w-4" />}
        </button>
      </SttnsIconTip>
      <SttnsIconTip label="Dupliquer" placement="bottom">
        <button type="button" onClick={handleDuplicate} disabled={busy} className="sttns-btn-icon text-zinc-600 hover:text-zinc-900">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
        </button>
      </SttnsIconTip>
      <SttnsIconTip label="Archiver" placement="bottom">
        <button
          type="button"
          onClick={handleArchive}
          disabled={busy}
          className="sttns-btn-icon text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Archive className="h-4 w-4" />
        </button>
      </SttnsIconTip>
    </>
  );
}
