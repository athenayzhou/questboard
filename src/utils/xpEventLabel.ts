import type { XPEvent } from "@/types/skills";

/** Primary line for activity / path logs: quest title when present, else skill name or id. */
export function xpEventActivityLabel(e: XPEvent): string {
  if (e.source === "quest") {
    const t = e.questTitle?.trim();
    if (t) return t;
  }
  if (e.source === "decay") {
    return e.name?.trim() || "decay";
  }
  return e.name?.trim() || e.sourceId || "—";
}
