import { useMemo } from "react";
import { useSkillStore } from "../store/skill";
import { useXPEventStore } from "../store/xpEvent";
import { levelToProgress } from "../utils/skill/analysis/experience";

export function useSkillLedger() {
    const skills = useSkillStore((s) => s.skills);
    const events = useXPEventStore((s) => s.events);

    return useMemo(() => {
        return Object.values(skills).map(skill => {
            const skillEvents = events.filter(e => e.skillId === skill.id);
            const lastSeenAt =
                skillEvents.length > 0
                ? skillEvents[0].timestamp
                : 0;
            const { level } = levelToProgress(skill.xp);

            return {
                id: skill.id,
                skillId: skill.id,
                name: skill.name,
                xp: skill.xp,
                level,
                lastSeenAt,
                isDormant: skill.isDormant,
            };
        });
    }, [skills, events]);
}