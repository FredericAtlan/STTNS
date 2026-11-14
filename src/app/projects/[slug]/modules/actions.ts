"use server";

import { revalidatePath } from "next/cache";
import {
  deleteModule,
  duplicateModule,
  saveModuleMetadata,
  syncModuleFeatures,
} from "@/lib/sttns/saveModule";

function revalidateModulePaths(projectSlug: string) {
  revalidatePath(`/projects/${projectSlug}/modules`);
  revalidatePath(`/projects/${projectSlug}/features/arbitrage`);
  revalidatePath(`/projects/${projectSlug}/summary`);
}

export async function saveModuleAction(
  projectId: string,
  projectSlug: string,
  data: {
    id?: string;
    name: string;
    code: string;
    description: string;
    sort_order: number;
  }
) {
  const result = await saveModuleMetadata(projectId, data);
  if (result.ok) revalidateModulePaths(projectSlug);
  return result;
}

export async function saveModuleWithFeaturesAction(
  projectId: string,
  projectSlug: string,
  moduleId: string,
  moduleCode: string,
  metadata: {
    name: string;
    code: string;
    description: string;
    sort_order: number;
  },
  selectedFeatureIds: string[]
) {
  const meta = await saveModuleMetadata(projectId, { ...metadata, id: moduleId });
  if (!meta.ok) return meta;

  const sync = await syncModuleFeatures(
    projectId,
    moduleId,
    metadata.code.trim() || moduleCode,
    selectedFeatureIds
  );
  if (!sync.ok) return sync;

  revalidateModulePaths(projectSlug);
  return { ok: true as const, id: moduleId };
}

export async function createModuleWithFeaturesAction(
  projectId: string,
  projectSlug: string,
  metadata: {
    name: string;
    code: string;
    description: string;
    sort_order: number;
  },
  selectedFeatureIds: string[]
) {
  const created = await saveModuleMetadata(projectId, metadata);
  if (!created.ok) return created;

  if (selectedFeatureIds.length) {
    const sync = await syncModuleFeatures(
      projectId,
      created.id,
      metadata.code.trim() || metadata.name,
      selectedFeatureIds
    );
    if (!sync.ok) return sync;
  }

  revalidateModulePaths(projectSlug);
  return created;
}

export async function deleteModuleAction(
  moduleId: string,
  projectId: string,
  projectSlug: string
) {
  const result = await deleteModule(moduleId, projectId);
  if (result.ok) revalidateModulePaths(projectSlug);
  return result;
}

export async function duplicateModuleAction(
  moduleId: string,
  projectId: string,
  projectSlug: string
) {
  const result = await duplicateModule(moduleId, projectId);
  if (result.ok) revalidateModulePaths(projectSlug);
  return result;
}
