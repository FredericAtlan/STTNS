"use client";

import { useRouter } from "next/navigation";
import JSZip from "jszip";
import { CsvActionButtons } from "@/components/csv/CsvActionButtons";
import {
  exportWhyMatrixAction,
  importWhyMatrixAction,
} from "@/app/projects/[slug]/why/whyCsvActions";
import type { ImportMode } from "@/lib/sttns/types";
import { generateCsv, parseCsv } from "@/lib/csv/csvUtils";
import { WHY_CSV_ENTITIES } from "@/lib/sttns/whyCsv";

type Props = {
  projectId: string;
  projectSlug: string;
};

/**
 * Export / import Matrice Besoins (ZIP Spine) :
 * personas.csv · pain_points.csv · jtbd.csv (+ manifest.json).
 */
export function CsvWhyActions({ projectId, projectSlug }: Props) {
  const router = useRouter();

  const handleExport = async () => {
    const res = await exportWhyMatrixAction(projectId);
    if (!res.ok) throw new Error(res.error || "Erreur d'export");

    const zip = new JSZip();
    for (const entity of WHY_CSV_ENTITIES) {
      const rows = res.data[entity] as Record<string, unknown>[];
      if (rows.length > 0) {
        zip.file(`${entity}.csv`, generateCsv(rows));
      }
    }
    zip.file("manifest.json", JSON.stringify(res.metadata, null, 2));

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    const projectName = res.metadata.projectName.replace(/\s+/g, "_");
    link.download = `${projectName}_Matrice_Besoins_${dateStr}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (mode: ImportMode, file: File) => {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    const projectData: Record<string, unknown[]> = {};

    for (const [filename, zipEntry] of Object.entries(contents.files)) {
      if (zipEntry.dir || !filename.endsWith(".csv")) continue;
      const base = filename.split("/").pop() ?? filename;
      const entity = base.replace(/\.csv$/i, "");
      if (!(WHY_CSV_ENTITIES as readonly string[]).includes(entity)) continue;
      const text = await zipEntry.async("text");
      projectData[entity] = parseCsv<Record<string, unknown>>(text);
    }

    if (Object.keys(projectData).length === 0) {
      throw new Error(
        "L'archive ZIP doit contenir personas.csv, pain_points.csv et/ou jtbd.csv."
      );
    }

    const res = await importWhyMatrixAction(
      projectId,
      projectSlug,
      mode,
      projectData
    );
    if (!res.ok) throw new Error(res.error);
    router.refresh();
  };

  return (
    <CsvActionButtons
      onExport={handleExport}
      onImport={handleImport}
      entityName="Matrice Besoins (ZIP)"
      isZip
    />
  );
}
