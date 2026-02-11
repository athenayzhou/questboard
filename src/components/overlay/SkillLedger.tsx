import { useState, useMemo } from "react";
import { useOverlay } from "./overlay";
import { useSkillLedger } from "../../hooks/useSkillLedger";
import type { SkillLedgerEntry } from "../../types/skills";
import { SkillDetail } from "../secondary/SkillDetail";
import { levelToProgress } from "../../utils/skill/analysis/experience";
// import { XPEventStoreInstance } from "../../store/xpEvent";
import { ProgressBar } from "../ui/ProgressBar";

type SortKey = "name" | "level" | "lastSeen";

export function SkillLedger() {
  const closeOverlay = useOverlay((s)=> s.closeOverlay);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastSeen");
  const [showDormantOnly, setShowDormantOnly] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillLedgerEntry | null>(null);

  const skills = useSkillLedger();

  const filteredSkills = useMemo(() => {
    return skills
      .filter(skill => {
        if(showDormantOnly && !skill.isDormant) return false;
        if(!skill.name.includes(search)) return false;
        return true;
      })
      .sort((a,b) => {
        switch(sortKey) {
          case "name": return a.name.localeCompare(b.name);
          case "level": return b.xp - a.xp;
          case "lastSeen": return b.lastSeenAt - a.lastSeenAt;
        }
      });
  }, [skills, search, sortKey, showDormantOnly]);

  return(
  <div className="overlay skill-overlay">
    <div className="header skill-header">
      <h2>skill ledger</h2>
      <div className="header-actions">
        <button className="close skill-btn" onClick={closeOverlay}>close</button>
      </div>
    </div>
    <div className="ledger-content">
    <div className="ledger-list-column">
      <div className="ledger-controls">
        <input
          type="text"
          placeholder="search skills..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}>
          <option value="lastSeen">most recent</option>
          <option value="level">highest level</option>
          <option value="name">name</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={showDormantOnly}
            onChange={e => setShowDormantOnly(e.target.checked)}
          /> dormant only
        </label>
      </div>
      <div className="ledger-list">
      {filteredSkills.map(skill => {
        const { progress } = levelToProgress(skill.xp);
        // const xpEvents = XPEventStoreInstance.getBySkill(skill.skillId ?? "") ?? [];
      return (
        <div
          key={skill.id}
          className={`ledger-item ${skill.isDormant ? "dormant" : ""} ${selectedSkill === skill ? "selected" : ""}`}
          onClick={() => setSelectedSkill(skill)}
        >
          <div className="ledger-header">
            <div className="ledger-name">{skill.name}</div>
            <ProgressBar level={skill.level} progress={progress} />
          </div>
          {/* <div className="ledger-meta">
            last used: {xpEvents.length > 0
              ? `${new Date(xpEvents[xpEvents.length-1].timestamp).toLocaleDateString()} (${xpEvents[xpEvents.length-1].source})`
              : "never"
            }
          </div> */}
        </div>
      );
      })}
      </div>
    </div>
    <div className="ledger-detail-column">
      {selectedSkill ? (
        <SkillDetail skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
      ) : (
        <div className="no-selection">select a skill to see details</div>
      )}
    </div>
  </div>
  </div>
  );
}