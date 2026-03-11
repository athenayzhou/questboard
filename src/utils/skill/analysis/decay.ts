import type { Skill } from "../../../types/skills";
import { DECAY, MS } from "../../constants";
import { clusterStore, candidateStore } from "../../../store/bundledStores";
import { useSkillStore } from "../../../store/skill";
import { devLog } from "../../../dev/devLogs";

export function shouldDecaySkill(skill: Skill, now: number): boolean {
  const timeSinceLastDecay = now - skill.lastDecayAt;
  return timeSinceLastDecay >= DECAY.DECAY_CHECK_INTERVAL;
}

export function calculateSkillDecay(skill: Skill, now: number): number {
  const daysSinceLastSeen = (now - skill.lastSeenAt) / MS.DAY;
  const daysSinceLastDecay = (now - skill.lastDecayAt) / MS.DAY;

  const decayRate = skill.isDormant
    ? DECAY.DECAY_RATE_DORMANT
    : DECAY.DECAY_RATE_ACTIVE;

  if (daysSinceLastSeen < DECAY.SKILL_DECAY_IDLE_DAYS) return 0;

  const effectiveDays = Math.sqrt(daysSinceLastDecay);
  const decayAmount = skill.xp * decayRate * effectiveDays;

  return Math.min(decayAmount, Math.max(0, skill.xp - DECAY.MIN_XP_BEFORE_DECAY));
}

export function checkDormancy(skill: Skill, now: number): boolean {
  const daysSinceLastSeen = (now - skill.lastSeenAt) / MS.DAY;
  return daysSinceLastSeen >= DECAY.DORMANT_THRESHOLD_DAYS;
}

export class DecaySystem {
  static processAllDecay(){
    const now = Date.now();

    const before = {
      clusters: clusterStore.getAll().length,
      candidates: candidateStore.getAll().length,
      skills: useSkillStore.getState().getAll().length,
    };

    clusterStore.decay(now);
    candidateStore.decay(now);
    useSkillStore.getState().processDecay();

    const after = {
      clusters: clusterStore.getAll().length,
      candidates: candidateStore.getAll().length,
      skills: useSkillStore.getState().getAll().length,
    };

    devLog("decay", "decay tick processed", { now, before, after });
  }

  static startBackgroundDecay(){
    this.processAllDecay();
    setInterval(() => {
      this.processAllDecay();
    }, MS.DAY);
  }
}