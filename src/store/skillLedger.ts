import type { XPEvent, SkillLedgerEntry } from "../types/skills";
import { levelToProgress } from "../utils/skill/analysis/experience";
import { NUMOF_SKILLS } from "../utils/constants";
import { XPEventStoreInstance } from "./xpEvent";

const listeners = new Set<() => void>();
let cachedRecent: SkillLedgerEntry[] = [];
let cachedLedger: SkillLedgerEntry[] = [];

export function listenSkillLedger(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSkillKeyFromEvent(e: XPEvent){
  if(e.skillId) return e.skillId;
  return e.name?.trim().toLowerCase() ?? "unnamed-skill";
}
export function getSkillKeyFromLedger(skill: SkillLedgerEntry) {
  if(skill.skillId) return skill.skillId;
  return skill.name?.trim().toLowerCase() ?? "unnamed-skill";
}

export function recomputeSkillLedger() {
  const now = Date.now();
  const DORMANT_AFTER = 1000 * 60 * 60 * 24 * 14;

  const ledgerMap = new Map<string, SkillLedgerEntry>();
  const events = XPEventStoreInstance.getAll();

  for(const e of events){
    const key = getSkillKeyFromEvent(e);
    const prev = ledgerMap.get(key);
    const nextXP = (prev?.xp ?? 0) + e.amount;
    const { level } = levelToProgress(nextXP);

    ledgerMap.set(key, {
      id: key,
      skillId: e.skillId ?? null,
      name: e.name ?? prev?.name ?? "unnamed-skill",
      xp: nextXP,
      level,
      lastSeenAt: Math.max(prev?.lastSeenAt ?? 0, e.timestamp),
      isDormant: false,
    });
  }

  cachedLedger = [...ledgerMap.values()]
    .map(skill => ({
      ...skill,
      isDormant: now - skill.lastSeenAt > DORMANT_AFTER,
    }))
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt);

    cachedRecent = cachedLedger.slice(0, NUMOF_SKILLS);
    listeners.forEach(l => l());
}

export function getRecentActivity(): SkillLedgerEntry[] {
  return cachedRecent;
}
export function getSkillLedger(): SkillLedgerEntry[] {
  return cachedLedger;
}

export function clearSkillLedger() {
  cachedRecent = [];
  cachedLedger = [];
  listeners.forEach(l => l());
}