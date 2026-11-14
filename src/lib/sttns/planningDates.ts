/** Valeur ISO `YYYY-MM-DD` pour `<input type="date">`. */
export function planningDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const raw = String(value).trim();
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

/** Payload Supabase DATE (colonne Postgres). */
export function normalizePlanningDateInput(
  value: string | null | undefined
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}
