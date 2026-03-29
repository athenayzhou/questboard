import type { XPEvent } from "@/types/skills";

export function xpEventActivityLabel(e: XPEvent): string {
  if (e.source === "quest") {
    const t = e.questTitle?.trim() || e.name?.trim();
    if (t) return t;
  }
  if (e.source === "decay") {
    return e.name?.trim() || "decay";
  }
  return e.name?.trim() || e.sourceId || "—";
}
