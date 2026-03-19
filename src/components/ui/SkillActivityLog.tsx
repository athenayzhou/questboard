import { useMemo } from "react";
import { useXPEventStore } from "../../store/xpEvent";
import { useSkillStore } from "../../store/skill";
import { levelToProgress } from "../../utils/skill/analysis/experience";
import { ProgressBar } from "./ProgressBar";

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 30_000) return "now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function SkillActivityLog() {
  const events = useXPEventStore((s) => s.events);
  const skills = useSkillStore((s) => s.skills);

  const items = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ skillId: string; amount: number; timestamp: number }> = [];
    for (const e of events) {
      if (!e.skillId) continue;
      if (seen.has(e.skillId)) continue;
      if (!skills[e.skillId]) continue;
      out.push({ skillId: e.skillId, amount: e.amount, timestamp: e.timestamp });
      seen.add(e.skillId);
      if (out.length >= 3) break;
    }
    return out;
  }, [events, skills]);

  if (items.length === 0) return null;

  return (
    <div className="skill-activity-log" aria-label="Recent skills">
      <div className="skill-activity-log__title">recent skill activity</div>
      <ul className="skill-activity-log__list">
        {items.map((i) => {
          const skill = skills[i.skillId];
          const name = skill?.name ?? "skill";
          const xp = skill?.xp ?? 0;
          const { level, progress } = levelToProgress(xp);
          return (
            <li key={i.skillId} className="skill-activity-log__item">
              <div className="skill-activity-log__row">
                <span className="skill-activity-log__name">{name}</span>
                <span className="skill-activity-log__meta">
                  +{i.amount} · {timeAgo(i.timestamp)}
                </span>
              </div>
              <div className="skill-activity-log__bar">
                <ProgressBar level={level} progress={progress} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

