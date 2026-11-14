/** Tri alphanumérique des codes persona (P1 < P2 < P10). */

const PERSONA_CODE_PATTERN = /^P(\d+)$/i;

export function normalizePersonaCode(raw: string): string {
  const trimmed = raw.trim().toUpperCase();
  const match = PERSONA_CODE_PATTERN.exec(trimmed);
  if (match) return `P${Number(match[1])}`;
  return trimmed;
}

export function isValidPersonaCode(raw: string): boolean {
  const normalized = normalizePersonaCode(raw);
  return /^P\d+$/.test(normalized) && normalized.length >= 2;
}

export function comparePersonaCode(a: string | null | undefined, b: string | null | undefined): number {
  const na = a?.trim() ? normalizePersonaCode(a) : "";
  const nb = b?.trim() ? normalizePersonaCode(b) : "";
  if (!na && !nb) return 0;
  if (!na) return 1;
  if (!nb) return -1;

  const ma = PERSONA_CODE_PATTERN.exec(na);
  const mb = PERSONA_CODE_PATTERN.exec(nb);
  if (ma && mb) return Number(ma[1]) - Number(mb[1]);
  return na.localeCompare(nb, "fr", { numeric: true, sensitivity: "base" });
}

export function suggestNextPersonaCode(existing: (string | null | undefined)[]): string {
  let max = 0;
  for (const code of existing) {
    if (!code?.trim()) continue;
    const normalized = normalizePersonaCode(code);
    const match = PERSONA_CODE_PATTERN.exec(normalized);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `P${max + 1}`;
}
