"use client";

import JSZip from "jszip";
import { CsvActionButtons } from "./CsvActionButtons";
import { exportEntityAction, importEntityAction } from "@/app/projects/csvActions";
import type { ImportMode } from "@/lib/sttns/types";
import { generateCsv, parseCsv } from "@/lib/csv/csvUtils";

type Props = {
  projectId: string;
  projectSlug: string;
};

export function CsvPersonaActions({ projectId, projectSlug }: Props) {
  const entities = ["personas", "pain_points", "jtbd"] as const;

  const handleExport = async () => {
    const zip = new JSZip();
    let metadata: any = null;
    
    for (const entity of entities) {
      const res = await exportEntityAction(projectId, entity);
      if (!res.ok || !res.data) throw new Error(res.error || "Erreur d'export");
      
      if (!metadata && res.metadata) {
        metadata = res.metadata;
      }
      
      if (res.data && res.data.length > 0) {
        const csvContent = generateCsv(res.data);
        zip.file(`${entity}.csv`, csvContent);
      }
    }
    
    if (metadata) {
      zip.file("manifest.json", JSON.stringify(metadata, null, 2));
    }
    
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    const projectName = metadata?.projectName?.replace(/\s+/g, "_") || projectSlug;
    link.download = `${projectName}_Personas_${dateStr}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (mode: ImportMode, file: File) => {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    
    const projectData: Record<string, any[]> = {};
    
    for (const [filename, zipEntry] of Object.entries(contents.files)) {
      if (!zipEntry.dir && filename.endsWith(".csv")) {
        const entity = filename.replace(".csv", "");
        if (entities.includes(entity as any)) {
          const text = await zipEntry.async("text");
          projectData[entity] = parseCsv<any>(text);
        }
      }
    }
    
    if (Object.keys(projectData).length === 0) {
      throw new Error("L'archive ZIP ne contient aucun fichier CSV valide pour les personas.");
    }
    
    // Order matters for foreign keys
    const entitiesOrder = ["personas", "pain_points", "jtbd"];

    // If replace, delete in reverse order to respect foreign keys
    if (mode === "replace") {
      for (const entity of [...entitiesOrder].reverse()) {
        if (projectData[entity]) {
          await importEntityAction(projectId, entity, "replace", []);
        }
      }
    }

    // Import in order
    for (const entity of entitiesOrder) {
      if (projectData[entity] && projectData[entity].length > 0) {
        const currentMode = mode === "replace" ? "append" : mode;
        const res = await importEntityAction(projectId, entity, currentMode, projectData[entity]);
        if (!res.ok) {
          throw new Error(`Erreur lors de l'import de ${entity}: ${res.error}`);
        }
      }
    }
  };

  return (
    <CsvActionButtons
      onExport={handleExport}
      onImport={handleImport}
      entityName="Personas (ZIP)"
      isZip
    />
  );
}