import { useMemo } from "react";
import { useSkillStore } from "../store/skill";
import { useXPEventStore } from "../store/xpEvent";
import { levelToProgress } from "../utils/skill/analysis/experience";
import { NUMOF_SKILLS } from "../utils/constants";

export function useRecentSkills(){
  const skills = useSkillStore((s) => s.skills);
  const events = useXPEventStore((s) => s.events);

  return useMemo(() => {
    const sorted = Object.values(skills)
    .map(skill => {
      const event = events.find(e => e.skillId === skill.id);
      const lastSeenAt = event?.timestamp ?? 0;
      const { level } = levelToProgress(skill.xp);

      return {
        id: skill.id,
        name: skill.name,
        xp: skill.xp,
        level,
        lastSeenAt,
      };
    })
    .sort((a,b) => b.lastSeenAt - a.lastSeenAt)
    .slice(0, NUMOF_SKILLS);

    return sorted;
  }, [skills, events]);
}