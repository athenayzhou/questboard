import { useState, useMemo } from "react";
import { useOverlay } from "../../store/overlay";
import { SkillDetail } from "../secondary/SkillDetail";
import { levelToProgress } from "../../utils/skill/analysis/experience";
import { ProgressBar } from "../ui/ProgressBar";
import { useSkillStore } from "../../store/skill";
import { useNameStore } from "../../store/name";
import { DECAY, MS } from "../../utils/constants";
import { NameSkill } from "../secondary/NameSkill";
import type { Skill } from "../../types/skills";
import type { PendingSkill } from "../../store/name";

type SortKey = "name" | "level" | "lastSeen";
type LedgerTab = "skills" | "pending";

export function SkillLedger() {
  const closeOverlay = useOverlay((s) => s.closeOverlay);
  const [activeTab, setActiveTab] = useState<LedgerTab>("skills");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastSeen");
  const [showDormantOnly, setShowDormantOnly] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [renamingSkill, setRenamingSkill] = useState<Skill | null>(null);
  const [namingPendingSkill, setNamingPendingSkill] = useState<PendingSkill | null>(null);

  const skillsRecord = useSkillStore((s) => s.skills);
  const pendingSkills = useNameStore((s) => s.pendingSkills);

  const ledgerEntries = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const DORMANT_AFTER = DECAY.DORMANT_THRESHOLD_DAYS * MS.DAY;
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
          <div className="ledger-header-tabs">
            <button
              type="button"
              className={activeTab === "skills" ? "active" : ""}
              onClick={() => setActiveTab("skills")}
            >
              skills
            </button>
            <button
              type="button"
              className={activeTab === "pending" ? "active" : ""}
              onClick={() => setActiveTab("pending")}
            >
              pending
              {pendingSkills.length > 0 && (
                <span className="ledger-tab-badge">{pendingSkills.length}</span>
              )}
            </button>
          </div>
          <button className="close skill-btn" onClick={closeOverlay}>close</button>
        </div>
      </div>

      {activeTab === "skills" && (
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
              {ledgerEntries.length === 0 ? (
                <div className="ledger-empty-state">
                  no skills yet — complete quests to discover and level up skills
                </div>
              ) : filteredSkills.length === 0 ? (
                <div className="ledger-empty-state">
                  no skills match your search or filters
                </div>
              ) : (
                filteredSkills.map(skill => {
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
                })
              )}
            </div>
          </div>
          <div className="ledger-detail-column">
            {selectedSkill ? (
              <>
                <SkillDetail
                  skill={selectedSkill}
                  onClose={() => setSelectedSkillId(null)}
                  onRename={() => {
                    const skill = useSkillStore((s) => s.getById(selectedSkill.id));
                    if (skill) setRenamingSkill(skill);
                  }}
                />
                {renamingSkill && (
                  <NameSkill
                    isOpen={!!renamingSkill}
                    skill={renamingSkill}
                    onNameSelected={(name) => {
                      useSkillStore.getState().updateName(renamingSkill.id, name);
                      setRenamingSkill(null);
                    }}
                    onCancel={() => setRenamingSkill(null)}
                    currentName={renamingSkill.name}
                  />
                )}
                {namingPendingSkill && (
                  <NameSkill
                    isOpen={!!namingPendingSkill}
                    candidate={namingPendingSkill.candidate}
                    onNameSelected={(name) => {
                      useNameStore.getState().promotePendingSkill(namingPendingSkill.id, name);
                      setNamingPendingSkill(null);
                    }}
                    onCancel={() => setNamingPendingSkill(null)}
                  />
                )}
              </>
            ) : (
              <div className="no-selection">select a skill to see details</div>
            )}
          </div>
        </div>
      )}

      {activeTab === "pending" && (
        <div className="ledger-pending-body">
          {pendingSkills.length === 0 ? (
            <div className="ledger-pending-empty">
              <p className="ledger-pending-empty-title">no pending skills</p>
              <p className="ledger-pending-empty-hint">Skip naming after a quest to send new skills here. Name them anytime from this tab.</p>
            </div>
          ) : (
            <>
              <p className="ledger-pending-intro">
                <span className="ledger-pending-count">{pendingSkills.length}</span> {pendingSkills.length === 1 ? "skill" : "skills"} waiting to be named
              </p>
              <div className="ledger-pending-list">
                {pendingSkills.map((pendingSkill) => (
                  <div key={pendingSkill.id} className="ledger-pending-card">
                    <div className="ledger-pending-card-content">
                      <span className="ledger-pending-card-label">new skill from quest</span>
                      <small className="ledger-pending-card-origin">
                        {(() => {
                          const origin = pendingSkill.candidate.origin ?? [];
                          const titles = origin
                            .map((o) => o.split(":")[1])
                            .filter(Boolean)
                            .slice(0, 3);
                          return titles.length > 0
                            ? `from "${titles.join('", "')}"`
                            : "from quest completion";
                        })()}
                      </small>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNamingPendingSkill(pendingSkill)}
                      className="name-pending-btn"
                    >
                      name skill
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {namingPendingSkill && (
        <NameSkill
          isOpen
          candidate={namingPendingSkill.candidate}
          pendingId={namingPendingSkill.id}
          onNameSelected={(name, id) => {
            if (id) {
              useNameStore.getState().promotePendingSkill(id, name);
            }
            setNamingPendingSkill(null);
          }}
          onCancel={() => setNamingPendingSkill(null)}
        />
      )}
    </div>
  );
}