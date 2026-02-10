import type { XPEvent, SkillActivity } from "../types/skills";
import { levelToProgress } from "../utils/skill/analysis/experience";
import { NUMOF_SKILLS } from "../utils/constants";

type InternalActivity = SkillActivity & {
  xp: number;
};
const listeners = new Set<() => void>();
const skills = new Map<string, InternalActivity>();
let cachedRecent: SkillActivity[] = [];

export function listenActivity(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function recordXP(e: XPEvent) {
  const prev = skills.get(e.id);
  const nextXP = (prev?.xp ?? 0) + e.amount;
  const { level } = levelToProgress(nextXP);

  const internal: InternalActivity = {
    id: e.id,
    name: e.name ?? prev?.name ?? "unnamed skill",
    level,
    lastSeenAt: e.timestamp,
    xp: nextXP
  }
  skills.set(e.id, internal);

  recomputeRecent(NUMOF_SKILLS);
  listeners.forEach(l => l());
}

export function recomputeRecent(limit: number){
  cachedRecent = [...skills.values()]
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
    .slice(0, limit)
    .map(skill => ({
      id: skill.id,
      name: skill.name,
      xp: skill.xp,
      level: skill.level,
      lastSeenAt: skill.lastSeenAt,
    }))
}

export function getRecent() {
  return cachedRecent;
}