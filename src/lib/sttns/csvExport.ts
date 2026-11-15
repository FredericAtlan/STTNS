const FORMULA_START = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^[-+]?\d+(?:[.,]\d+)?$/;

/**
 * Neutralise l'injection de formules (Excel, LibreOffice, Sheets) : une cellule texte qui
 * commence par = + - @ tabulation ou retour chariot est préfixée d'une apostrophe.
 */
export function neutralizeCsvFormula(text: string): string {
  return FORMULA_START.test(text) && !PLAIN_NUMBER.test(text) ? `'${text}` : text;
}

/** Inverse de neutralizeCsvFormula, pour réimporter nos propres exports sans apostrophe parasite. */
export function restoreCsvFormula(text: string): string {
  return text.startsWith("'") && FORMULA_START.test(text.slice(1)) ? text.slice(1) : text;
}

export function csvCell(value: unknown): string {
  const raw = value == null ? "" : String(value);
  const text = typeof value === "string" ? neutralizeCsvFormula(raw) : raw;
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildCsvContent(headers: string[], rows: unknown[][]): string {
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
