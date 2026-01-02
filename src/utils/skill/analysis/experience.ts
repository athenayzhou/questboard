import type { Quest } from "../../../types/quest";
import type { Cluster, Skill, Progress } from "../../../types/skills";
import { listenActivity } from "../store/skillActivity";

export function calculateXP(quest: Quest): number {
  const base = 10;
  const difficultyMultiplier =
    quest.difficulty === "easy" ? 1 :
    quest.difficulty === "medium" ? 2 :
    3;
  const duration = quest.duration ?? 10;
  const durationMultiplier = 
    duration <= 5 ? 0.25 :
    duration <= 15 ? 0.6 :
    duration <= 45 ? 1.0 :
    1.6;
  return Math.round(base * difficultyMultiplier * durationMultiplier);
}
export function applyXP(entity: Cluster | Skill, xp: number) {
  entity.xp += xp;
  entity.level = xpToLevel(entity.xp);
  entity.lastSeenAt = Date.now(); 
}

export const XP_TABLE = [3, 8, 20, 40, 70];
export function xpToLevel(xp: number): number {
  for(let i=0; i<XP_TABLE.length; i++) {
    if(xp< XP_TABLE[i]) return i;
  }
  return XP_TABLE.length;
}
export function levelToProgress(xp: number): Progress {
  const level = xpToLevel(xp);
  const minXP = level === 0 ? 0 : XP_TABLE[level - 1];
  const maxXP = XP_TABLE[level] ?? Infinity;
  const xpLevel = xp - minXP;
  const xpMax = maxXP - minXP;
  return {
    level,
    xp,
    xpMax,
    progress: xpMax === Infinity ? 1 : xpLevel / xpMax,
  }
}