function normalizeNullableString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

/** Description textuelle stockée dans metadata.description (Epic, Feature, Story, etc.). */
export function readMetadataDescription(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as Record<string, unknown>).description;
  if (typeof value !== "string") return null;
  return normalizeNullableString(value);
}

/** Lien documentation externe (Notion, Confluence, etc.) — metadata.doc_url ; tasks : notion_url. */
export function readMetadataDocUrl(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const record = metadata as Record<string, unknown>;
  const value = record.doc_url ?? record.notion_url;
  if (typeof value !== "string") return null;
  return normalizeNullableString(value);
}

export function parseMetadataDocUrlInput(
  value: string | undefined | null
): { ok: true; url: string | null } | { ok: false; error: string } {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return { ok: true, url: null };
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, error: "L'URL doit commencer par http:// ou https://." };
    }
    return { ok: true, url: trimmed };
  } catch {
    return { ok: false, error: "URL de documentation invalide." };
  }
}
