import type { Quest } from "../../../types/quest";
import type { Cluster, Skill, Progress } from "../../../types/skills";
import { LEVELS } from "../../constants";

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
  entity.lastSeenAt = Date.now(); 
}

export function xpToLevel(xp: number): number {
  for(let i=0; i<LEVELS.length; i++) {
    if(xp< LEVELS[i]) return i;
  }
  return LEVELS.length;
}
export function levelToProgress(xp: number, startLevel = 0): Progress {
  const level = xpToLevel(xp) + startLevel;
  const minXP = level <= startLevel ? 0 : LEVELS[level - 1 - startLevel];
  const maxXP = LEVELS[level - startLevel] ?? Infinity;
  const xpLevel = xp - minXP;
  const xpMax = maxXP - minXP;
  return {
    level,
    xp,
    xpMax,
    progress: xpMax === Infinity ? 1 :Math.max(0.05, xpLevel / xpMax) ,
  }
}