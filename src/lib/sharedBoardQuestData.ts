/**
 * Normalizes `shared_board_quests.data` JSON for API responses.
 * Handles stringified JSON, alternate keys (categories, sub_quests), etc.
 */
export function normalizeSharedBoardQuestRowData(raw: unknown): unknown {
  if (raw == null) return raw;

  let o: Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      if (!p || typeof p !== "object" || Array.isArray(p)) return raw;
      o = { ...(p as Record<string, unknown>) };
    } catch {
      return raw;
    }
  } else if (typeof raw === "object" && !Array.isArray(raw)) {
    o = { ...(raw as Record<string, unknown>) };
  } else {
    return raw;
  }

  if (o.category == null) {
    const alt = o.categories ?? o.Category;
    if (Array.isArray(alt)) {
      o.category = alt.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
    } else if (typeof alt === "string" && alt.trim()) {
      o.category = [alt.trim()];
    }
    delete o.categories;
    delete o.Category;
  }

  if (o.subquests == null) {
    const alt = o.sub_quests ?? o.subTasks;
    if (Array.isArray(alt)) {
      o.subquests = alt;
    }
    delete o.sub_quests;
    delete o.subTasks;
  }

  return o;
}
