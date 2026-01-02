import type { Skill, XPEvent } from "../../../types/skills";
import { levelToProgress } from "../analysis/experience";
import { RECENT_SKILLS } from "../../constants";

type SkillActivity ={
  id: string;
  name: string;
  level: number;
  progress: number;
  lastSeenAt: number;
}

const skills = new Map<string, SkillActivity>();
const listeners = new Set<() => void>();
let cachedRecent: SkillActivity[] = [];
let cachedLimit = RECENT_SKILLS;

export function listenActivity(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function recordXP(e: {
  id: string;
  name: string;
  xp: number;
  level: number;
  timestamp: number
}) {
  skills.set(e.id, {
    id: e.id,
    name: e.name ?? "skill",
    level: e.level,
    progress: levelToProgress(e.xp).progress,
    lastSeenAt: e.timestamp,
  })
  recomputeRecent(cachedLimit);
  listeners.forEach(l => l());
}

export function recomputeRecent(limit: number){
  cachedLimit = limit;
  cachedRecent = [...skills.values()]
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
    .slice(0, limit)
}

export function recentActivity(limit = 3): SkillActivity[] {
  if(limit !== cachedLimit){
    recomputeRecent(limit);
  }
  return cachedRecent;
}