import type { SttnsInitiative, SttnsInitiativeTask } from "@/types/sttns";

export type DeliveryLinks = {
  docUrl: string | null;
  deliveryDocUrl: string | null;
  gitUrl: string | null;
};

export type DeliveryLinkField = keyof DeliveryLinks;

export const DELIVERY_LINK_LABELS: Record<
  DeliveryLinkField,
  { label: string; placeholder: string }
> = {
  docUrl: { label: "Doc feature", placeholder: "Notion, Confluence…" },
  deliveryDocUrl: { label: "Doc livraison", placeholder: "Release notes, changelog…" },
  gitUrl: { label: "Git", placeholder: "PR, branche ou dépôt" },
};

export function linksFromFeature(feature: Pick<
  SttnsInitiative,
  "execution_doc_url" | "execution_delivery_doc_url" | "execution_git_url"
>): DeliveryLinks {
  return {
    docUrl: feature.execution_doc_url?.trim() || null,
    deliveryDocUrl: feature.execution_delivery_doc_url?.trim() || null,
    gitUrl: feature.execution_git_url?.trim() || null,
  };
}

export function linksFromTask(
  task: Pick<SttnsInitiativeTask, "doc_url" | "delivery_doc_url" | "git_url">
): DeliveryLinks {
  return {
    docUrl: task.doc_url?.trim() || null,
    deliveryDocUrl: task.delivery_doc_url?.trim() || null,
    gitUrl: task.git_url?.trim() || null,
  };
}

export function countFilledLinks(links: DeliveryLinks): number {
  return [links.docUrl, links.deliveryDocUrl, links.gitUrl].filter(Boolean).length;
}

/** Nombre de sous-étapes ayant renseigné chaque type de lien. */
export function aggregateLinkCountsFromTasks(
  tasks: Pick<SttnsInitiativeTask, "doc_url" | "delivery_doc_url" | "git_url">[]
): Record<DeliveryLinkField, number> {
  const counts: Record<DeliveryLinkField, number> = {
    docUrl: 0,
    deliveryDocUrl: 0,
    gitUrl: 0,
  };
  for (const task of tasks) {
    const links = linksFromTask(task);
    for (const field of Object.keys(counts) as DeliveryLinkField[]) {
      if (links[field]) counts[field] += 1;
    }
  }
  return counts;
}
