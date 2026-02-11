import { useMemo } from "react";
import type { SkillLedgerEntry } from "../../types/skills";
import { XPEventStoreInstance } from "../../store/xpEvent";
import { getSkillCooccurence } from "../../utils/skill/analysis/cooccurence";
import { getSkillKeyFromLedger } from "../../store/skillLedger";

type Props = {
  skill: SkillLedgerEntry;
  onClose: () => void;
}

export function SkillDetail({ skill, onClose }: Props) {
  const skillKey = useMemo(
    () => getSkillKeyFromLedger(skill),
    [skill]
  );

  const xpEvents = useMemo(() => {
    return XPEventStoreInstance.getBySkill(skillKey);
  }, [skillKey]);
  const cooccuring = useMemo(() => {
    return getSkillCooccurence(skillKey);
  }, [skillKey]);

  // console.log({
  //   skill: skill.name,
  //   skillKey,
  //   matchingEvents: xpEvents,
  //   allEvents: XPEventStoreInstance.getAll()
  // });

  return (
    <div className="skill-detail">
      <button className="close-btn" onClick={onClose}>x</button>
      <h2>{skill.name}</h2>

      {xpEvents.length > 0 && (
        <div className="ledger-xp-log">
          <h4>recent xp log</h4>
          <ul>
            {xpEvents
              .slice()
              .reverse()
              .map((e) => (
                <li key={e.id}>
                  <span className="xp-date">{new Date(e.timestamp).toLocaleDateString()}</span>
                  <span className="xp-source">{e.source}</span>
                  <span className="xp-source-name">{e.sourceId}</span>
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