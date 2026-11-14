import JSZip from "jszip";
import { parseCsv } from "@/lib/csv/csvUtils";
import { STTNS_EXPORT_FORMAT } from "@/lib/sttns/importExportCatalog";

type CsvRow = Record<string, unknown>;

export type ParsedSpinePack = {
  manifest: Record<string, unknown> | null;
  why?: { personas: CsvRow[]; pain_points: CsvRow[]; jtbd: CsvRow[] };
  jtbd_solves?: CsvRow[];
  feature_context?: CsvRow[];
  epics?: CsvRow[];
  features?: CsvRow[];
  stories?: CsvRow[];
  tasks?: CsvRow[];
  cycles?: CsvRow[];
  discovery?: { sessions?: unknown[] };
};

async function readZipText(zip: JSZip, relativePath: string): Promise<string | null> {
  const direct = zip.file(relativePath);
  if (direct) return direct.async("text");

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (path === relativePath || path.endsWith(`/${relativePath}`)) {
      return entry.async("text");
    }
  }
  return null;
}

async function readCsvPath(zip: JSZip, relativePath: string): Promise<CsvRow[] | undefined> {
  const text = await readZipText(zip, relativePath);
  if (text == null) return undefined;
  if (!text.trim()) return [];
  return parseCsv<CsvRow>(text);
}

/** Dézippe un pack STTNS (v2 ou archive Matrice à la racine) pour import serveur. */
export async function parseSpinePackZip(file: File): Promise<ParsedSpinePack> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  let manifest: Record<string, unknown> | null = null;
  const manifestText = await readZipText(zip, "manifest.json");
  if (manifestText) {
    try {
      manifest = JSON.parse(manifestText) as Record<string, unknown>;
    } catch {
      manifest = null;
    }
  }

  const format = manifest?.format;
  const isV2 = format === STTNS_EXPORT_FORMAT;

  const personas =
    (await readCsvPath(zip, "why/personas.csv")) ??
    (await readCsvPath(zip, "personas.csv"));
  const pain_points =
    (await readCsvPath(zip, "why/pain_points.csv")) ??
    (await readCsvPath(zip, "pain_points.csv"));
  const jtbd =
    (await readCsvPath(zip, "why/jtbd.csv")) ?? (await readCsvPath(zip, "jtbd.csv"));

  const pack: ParsedSpinePack = { manifest };

  if (personas?.length || pain_points?.length || jtbd?.length) {
    pack.why = {
      personas: personas ?? [],
      pain_points: pain_points ?? [],
      jtbd: jtbd ?? [],
    };
  }

  const jtbd_solves = await readCsvPath(zip, "links/jtbd_solves.csv");
  if (jtbd_solves?.length) pack.jtbd_solves = jtbd_solves;

  const feature_context = await readCsvPath(zip, "links/feature_context.csv");
  if (feature_context?.length) pack.feature_context = feature_context;

  const epics = await readCsvPath(zip, "spine/epics.csv");
  if (epics?.length) pack.epics = epics;
  const features = await readCsvPath(zip, "spine/features.csv");
  if (features?.length) pack.features = features;
  const stories = await readCsvPath(zip, "spine/stories.csv");
  if (stories?.length) pack.stories = stories;
  const tasks = await readCsvPath(zip, "spine/tasks.csv");
  if (tasks?.length) pack.tasks = tasks;
  const cycles = await readCsvPath(zip, "cycles/cycles.csv");
  if (cycles?.length) pack.cycles = cycles;

  const discoveryText = await readZipText(zip, "discovery/sessions.json");
  if (discoveryText) {
    try {
      const parsed = JSON.parse(discoveryText) as { sessions?: unknown[] };
      if (parsed.sessions?.length) {
        pack.discovery = { sessions: parsed.sessions };
      }
    } catch {
      /* ignore malformed discovery bundle */
    }
  }

  const hasPayload =
    pack.why ||
    pack.epics ||
    pack.features ||
    pack.stories ||
    pack.tasks ||
    pack.cycles ||
    pack.discovery ||
    pack.jtbd_solves?.length ||
    pack.feature_context?.length;

  if (!hasPayload) {
    throw new Error(
      isV2
        ? "Archive reconnue mais sans données importables (CSV/JSON vides)."
        : "Archive non reconnue : attendu manifest sttns-spine-pack-v2 ou CSV Why/Spine."
    );
  }

  return pack;
}
