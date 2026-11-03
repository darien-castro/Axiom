// Local prototype persistence, scoped to this browser and origin. This is not
// Canvas-account synchronization. Store stable IDs only, never assignment data.
export const FOCUS_STORAGE_KEY = "axiom.demo.focus-list";

export function readFocusIds(storage: Pick<Storage, "getItem">, validIds: ReadonlySet<string>): string[] {
  const raw = storage.getItem(FOCUS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1 ||
      !("ids" in value) || !Array.isArray(value.ids)) return [];
    return [...new Set(value.ids.filter((id): id is string => typeof id === "string" && validIds.has(id)))];
  } catch {
    return [];
  }
}

export function writeFocusIds(storage: Pick<Storage, "setItem">, ids: readonly string[]): void {
  storage.setItem(FOCUS_STORAGE_KEY, JSON.stringify({ version: 1, ids: [...new Set(ids)] }));
}
