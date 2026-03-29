import { useMemo } from "react";
import type { SkillLedgerEntry } from "../../types/skills";
import { useXPEventStore } from "../../store/xpEvent";
import { getSkillCooccurence } from "../../utils/skill/analysis/cooccurence";
import { useStreakStore } from "../../store/streak";
import { IconX, IconPencil } from "../ui/icons";
import { formatDateUsSlash } from "../../utils/format/date";
import { xpEventActivityLabel } from "../../utils/xpEventLabel";

type Props = {
  skill: SkillLedgerEntry;
  onClose: () => void;
  onRename?: () => void;
  onSelectRelatedSkill?: (skillId: string) => void;
};

function formatActivityAmount(amount: number): string {
  const rounded = Math.round(amount * 10) / 10;
  if (rounded > 0) return `+${rounded} xp`;
  if (rounded < 0) return `${rounded} xp`;
  return "0 xp";
}

export function SkillDetail({
  skill,
  onClose,
  onRename,
  onSelectRelatedSkill,
}: Props) {
  const skillId = skill.id;
  const events = useXPEventStore((s) => s.events);
  const streakDays = useStreakStore((s) => s.currentDays);
  const streakLastDate = useStreakStore((s) => s.lastCompletion);

  const xpEvents = useMemo(() => {
    const fs = skill.firstSeenAt ?? 0;
    return events.filter((e) => {
      if (e.skillId !== skillId) return false;
      if (fs > 0 && e.timestamp < fs) return false;
      return true;
    });
  }, [events, skillId, skill.firstSeenAt]);

  const sortedActivity = useMemo(
    () => [...xpEvents].sort((a, b) => b.timestamp - a.timestamp),
    [xpEvents]
  );

  const cooccuring = useMemo(
    () => getSkillCooccurence(skillId),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recomputes when XP events change (helper reads store)
    [skillId, events],
  );

  return (
    <div className="skill-detail">
      <button
        type="button"
        className="close-btn"
        onClick={onClose}
        aria-label="Close"
        title="Close"
      >
        <IconX size={18} />
      </button>
      {onRename && (
        <button
          type="button"
          className="rename-btn"
          onClick={onRename}
          aria-label="Rename skill"
          title="Rename skill"
        >
          <IconPencil size={16} />
        </button>
      )}
      <h2>{skill.name}</h2>
      <div className="skill-summary">
        <p className="skill-last-practiced">
          last practiced: {formatDateUsSlash(skill.lastSeenAt)}
        </p>
        <p className="skill-activity-count">
          activity: {xpEvents.length}{" "}
          {xpEvents.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      <div className="streak-display">
        <h3>daily quest streak</h3>
        <p>
          {streakDays} {streakDays === 1 ? "day" : "days"}
          {streakLastDate
            ? ` (last completion: ${formatDateUsSlash(streakLastDate)})`
            : ""}
        </p>
      </div>

      <div className="ledger-activity-log">
        <h4>activity</h4>
        {sortedActivity.length === 0 ? (
          <p className="ledger-activity-empty">
            no entries yet — complete quests that match this skill to log XP here.
          </p>
        ) : (
          <ul>
            {sortedActivity.map((e) => (
              <li key={e.id} className="ledger-activity-row">
                <span className="activity-date">
                  {formatDateUsSlash(e.timestamp)}
                </span>
                <span className="activity-source">{e.source}</span>
                <span className="activity-name">{xpEventActivityLabel(e)}</span>
                <span
                  className={
                    e.amount < 0 ? "activity-amount is-negative" : "activity-amount"
                  }
                >
                  {formatActivityAmount(e.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {cooccuring.length > 0 && (
        <div className="cooccurrence-block">
          <h3>practiced with</h3>
          <ul className="cooccurrence-list">
            {cooccuring.map((c) => (
              <li key={c.id} className="cooccurrence-row">
                {onSelectRelatedSkill ? (
                  <button
                    type="button"
                    className="cooccurrence-skill-btn"
                    onClick={() => onSelectRelatedSkill(c.id)}
                  >
                    <span className="cooccurrence-name">{c.name}</span>
                    <span className="cooccurrence-meta">
                      {c.count} shared {c.count === 1 ? "activity" : "activities"}
                    </span>
                  </button>
                ) : (
                  <div className="cooccurrence-row-static">
                    <span className="cooccurrence-name">{c.name}</span>
                    <span className="cooccurrence-meta">
                      {c.count} shared {c.count === 1 ? "activity" : "activities"}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
