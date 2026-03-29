import type { Quest } from "@/types/quest";
import type { Skill } from "@/types/skills";
import { TUTORIAL } from "@/utils/constants";
import { calculateXP } from "@/utils/skill/analysis/experience";
import { useSkillStore } from "@/store/skill";

export function createTutorialSkill(): Skill {
  const now = Date.now();
  return {
    id: TUTORIAL.SKILL_ID,
    key: TUTORIAL.SKILL_KEY,
    name: TUTORIAL.SKILL_NAME,
    verb: TUTORIAL.SKILL_VERB,
    objects: ["app"],
    xp: 0,
    proficiency: 0,
    firstSeenAt: now,
    lastSeenAt: now,
    lastDecayAt: now,
    isDormant: false,
  };
}

export function ensureTutorialSkill(): Skill {
  const store = useSkillStore.getState();
  const existing =
    store.getById(TUTORIAL.SKILL_ID) ?? store.getByKey(TUTORIAL.SKILL_KEY);
  if (existing) return existing;
  const skill = createTutorialSkill();
  store.addSkill(skill);
  return skill;
}

export function awardTutorialQuestSkillXP(quest: Quest): void {
  const xp = calculateXP(quest);
  if (xp <= 0) return;
  const skill = ensureTutorialSkill();
  useSkillStore.getState().gainXP(skill.id, xp, quest.id, quest.title);
}
