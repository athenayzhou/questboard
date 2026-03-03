import { useMemo } from "react";
import { useSkillStore } from "../store/skill";
import { useXPEventStore } from "../store/xpEvent";
import { levelToProgress } from "../utils/skill/analysis/experience";

export function useSkillLedger() {
    const skills = useSkillStore((s) => s.skills);
    const events = useXPEventStore((s) => s.events);

    return useMemo(() => {
        const now = Date.now();
        const DORMANT_AFTER = 1000 * 60 * 60 * 24 * 14;

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
                isDormant: now - lastSeenAt > DORMANT_AFTER,
            };
        });
    }, [skills, events]);
}