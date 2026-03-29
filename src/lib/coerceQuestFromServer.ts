import type { Quest } from "@/types/quest";

/**
 * Normalizes category/subquests from JSONB (legacy shapes, odd encodings).
 */
export function coerceQuestCategoryAndSubquests<T extends Partial<Quest>>(q: T): T {
  const out = { ...q } as T & Partial<Quest>;

  const rawCat: unknown =
    out.category ??
    (out as { categories?: unknown }).categories ??
    (out as { Category?: unknown }).Category;
  if (typeof rawCat === "string" && rawCat.trim()) {
    out.category = [rawCat.trim()];
  } else if (Array.isArray(rawCat)) {
    out.category = rawCat.filter((c): c is string => typeof c === "string" && c.trim().length > 0);
    if (out.category.length === 0) delete out.category;
  } else if (rawCat != null) {
    delete out.category;
  }
  delete (out as { categories?: unknown }).categories;
  delete (out as { Category?: unknown }).Category;

  const rawSubs =
    out.subquests ??
    (out as { sub_quests?: unknown }).sub_quests ??
    (out as { subTasks?: unknown }).subTasks;
  if (Array.isArray(rawSubs)) {
    const next: NonNullable<Quest["subquests"]> = [];
    for (const s of rawSubs) {
      if (!s || typeof s !== "object") continue;
      const idRaw = (s as { id?: unknown }).id;
      const titleRaw = (s as { title?: unknown }).title;
      const id =
        typeof idRaw === "string"
          ? idRaw
          : typeof idRaw === "number" && Number.isFinite(idRaw)
            ? String(idRaw)
            : null;
      const title = typeof titleRaw === "string" ? titleRaw : "";
      if (!id || !title.trim()) continue;
      const completed = (s as { completed?: unknown }).completed;
      const done =
        completed === true ||
        completed === "true" ||
        completed === 1 ||
        completed === "1";
      next.push({
        id,
        title,
        completed: done,
      });
    }
    if (next.length > 0) out.subquests = next;
    else delete out.subquests;
  } else if (rawSubs != null) {
    delete out.subquests;
  }
  delete (out as { sub_quests?: unknown }).sub_quests;
  delete (out as { subTasks?: unknown }).subTasks;

  return out;
}
