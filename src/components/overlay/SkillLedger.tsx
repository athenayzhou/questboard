import { useState, useMemo } from "react";
import { useOverlay } from "../../store/overlay";
import { SkillDetail } from "../secondary/SkillDetail";
import { levelToProgress } from "../../utils/skill/analysis/experience";
import { ProgressBar } from "../ui/ProgressBar";
import { useSkillStore } from "../../store/skill";
import { DECAY, DEFAULT } from "../../utils/constants";

type SortKey = "name" | "level" | "lastSeen";

export function SkillLedger() {
  const closeOverlay = useOverlay((s) => s.closeOverlay);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastSeen");
  const [showDormantOnly, setShowDormantOnly] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const skillsRecord = useSkillStore((s) => s.skills);

  const ledgerEntries = useMemo(() => {
    const now = Date.now();
    const DORMANT_AFTER = DECAY.DORMANT_THRESHOLD_DAYS * DEFAULT.DAY;
    const skills = Object.values(skillsRecord);
    return skills.map((skill) => ({
      id: skill.id,
      skillId: skill.id,
      name: skill.name,
      xp: skill.xp,
      level: levelToProgress(skill.xp, 1).level,
      lastSeenAt: skill.lastSeenAt ?? 0,
      isDormant: skill.lastSeenAt ? now - skill.lastSeenAt > DORMANT_AFTER : true,
    }));
  }, [skillsRecord]);

  const selectedSkill = useMemo(
    () => ledgerEntries.find((s) => s.id === selectedSkillId) ?? null,
    [ledgerEntries, selectedSkillId]
  );

  const filteredSkills = useMemo(() => {
    return ledgerEntries
      .filter((skill) => {
        if (showDormantOnly && !skill.isDormant) return false;
        if (!skill.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "name": return a.name.localeCompare(b.name);
          case "level": return b.xp - a.xp;
          case "lastSeen": return (b.lastSeenAt ?? 0) - (a.lastSeenAt ?? 0);
        }
      });
  }, [ledgerEntries, search, sortKey, showDormantOnly]);

  return (
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
              placeholder="search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}>
              <option value="lastSeen">recent</option>
              <option value="level">level</option>
              <option value="name">name</option>
            </select>
            <label>
              <input
                type="checkbox"
                checked={showDormantOnly}
                onChange={e => setShowDormantOnly(e.target.checked)}
              /> dormant
            </label>
          </div>
          <div className="ledger-list">
            {filteredSkills.map(skill => {
              const { progress } = levelToProgress(skill.xp);
              return (
                <div
                  key={skill.id}
                  className={`ledger-item ${skill.isDormant ? "dormant" : ""} ${selectedSkillId === skill.id ? "selected" : ""}`}
                  onClick={() => setSelectedSkillId(skill.id)}
                >
                  <div className="ledger-header">
                    <div className="ledger-name">{skill.name}</div>
                    <ProgressBar level={skill.level} progress={progress} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="ledger-detail-column">
          {selectedSkill ? (
            <SkillDetail skill={selectedSkill} onClose={() => setSelectedSkillId(null)} />
          ) : (
            <div className="no-selection">select a skill to see details</div>
          )}
        </div>
      </div>
    </div>
  );
}