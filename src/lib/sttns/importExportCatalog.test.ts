import { describe, expect, it } from "vitest";
import {
  ALL_EXPORT_ENTITY_KEYS,
  filesForEntitySelection,
  parseMetadataJson,
  STTNS_EXPORT_FORMAT,
} from "@/lib/sttns/importExportCatalog";

describe("importExportCatalog", () => {
  it("expose le format pack v2", () => {
    expect(STTNS_EXPORT_FORMAT).toBe("sttns-spine-pack-v2");
    expect(ALL_EXPORT_ENTITY_KEYS.length).toBeGreaterThanOrEqual(6);
  });

  it("agrège les fichiers pour une sélection", () => {
    const files = filesForEntitySelection(["why", "features"]);
    expect(files).toContain("why/personas.csv");
    expect(files).toContain("links/feature_context.csv");
  });

  it("parse metadata_json", () => {
    expect(parseMetadataJson('{"impact":2}')).toEqual({ impact: 2 });
    expect(parseMetadataJson("")).toEqual({});
  });
});
