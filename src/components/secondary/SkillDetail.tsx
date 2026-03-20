import { useMemo } from "react";
import type { SkillLedgerEntry } from "../../types/skills";
import { useXPEventStore } from "../../store/xpEvent";
import { getSkillCooccurence } from "../../utils/skill/analysis/cooccurence";
import { useStreakStore } from "../../store/streak";
import { IconX, IconPencil } from "../ui/icons";

type Props = {
  skill: SkillLedgerEntry;
  onClose: () => void;
  onRename?: () => void;
}

export function SkillDetail({ skill, onClose, onRename }: Props) {
  const skillId = skill.id;
  const events = useXPEventStore((s) => s.events);
  const streakDays = useStreakStore((s) => s.currentDays);
  const streakLastDate = useStreakStore((s) => s.lastCompletion);

  const xpEvents = useMemo(
    () => events.filter((e) => e.skillId === skillId),
    [events, skillId]
  );

  const sortedXP = useMemo(
    () => [...xpEvents].sort((a,b) => b.timestamp - a.timestamp),
    [xpEvents]
  );
  const totalXP = useMemo(
    () => xpEvents.reduce((sum, e) => sum + e.amount, 0),
    [xpEvents]
  );

  const cooccuring = useMemo(
    () => getSkillCooccurence(skillId),
    [skillId]
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
        <p>total xp: {totalXP}</p>
        <p>sessions: {xpEvents.length}</p>
      </div>

      <div className="streak-display">
        <h3>daily quest streak</h3>
        <p>{streakDays} days (last: {streakLastDate || "none"})</p>
      </div>

      {sortedXP.length > 0 && (
        <div className="ledger-xp-log">
          <h4>recent xp log</h4>
          <ul>
            {sortedXP.map((e) => (
              <li key={e.id}>
                <span className="xp-date">{new Date(e.timestamp).toLocaleDateString()}</span>
                <span className="xp-source">{e.source}</span>
                <span className="xp-source-name">{e.name || e.sourceId}</span>
                <span className="xp-amount">+{e.amount} xp</span>
              </li>
            ))
          }
        </ul>
      </div>
    )}

      {cooccuring.length > 0 && (
        <div className = "cooccurence">
          <h3>often practiced with</h3>
          <ul>
            {cooccuring.map(c => (
              <li key={c.id}>{c.name} ({c.count} sessions)</li>
            ))}
          </ul>
        </div>
      )}

    </div>
  )
}