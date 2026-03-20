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
import { useMasteryStore } from "../../store/mastery";
import { IconX } from "../ui/icons";

type SortKey = "name" | "level" | "lastSeen";
type LedgerTab = "skills" | "pending" | "masteries";

export function SkillLedger() {
  const closeOverlay = useOverlay((s) => s.closeOverlay);
  const [activeTab, setActiveTab] = useState<LedgerTab>("skills");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastSeen");
  const [showDormantOnly, setShowDormantOnly] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [renamingSkill, setRenamingSkill] = useState<Skill | null>(null);
  const [namingPendingSkill, setNamingPendingSkill] = useState<PendingSkill | null>(null);
  const [selectedMasteryId, setSelectedMasteryId] = useState<string|null>(null);

  const skillsRecord = useSkillStore((s) => s.skills);
  const pendingSkills = useNameStore((s) => s.pendingSkills);
  const masteries = useMasteryStore((s) => s.masteries);

  const ledgerEntries = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- now used only for dormant threshold
    const now = Date.now();
    const DORMANT_AFTER = DECAY.DORMANT_THRESHOLD_DAYS * MS.DAY;
    const skills = Object.values(skillsRecord);
    return skills.map((skill) => ({
      id: skill.id,
      skillId: skill.id,
      name: skill.name,
      xp: skill.xp,
      level: levelToProgress(skill.xp).level,
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

  const contributingSkills = useMemo(() => {
    if(!selectedMasteryId) return [];
    const mastery = masteries.find((m) => m.id === selectedMasteryId);
    if(!mastery) return [];
    return mastery.skillIds
      .map((id) => skillsRecord[id])
      .filter(Boolean) as Skill[];
  }, [selectedMasteryId, masteries, skillsRecord])

  return (
    <div className="overlay skill-overlay">
      <div className="header skill-header">
        <h2>skill ledger</h2>
        <div className="header-actions">
          <div className="ledger-header-tabs">
            <button
              type="button"
              className={`ledger-tab${activeTab === "skills" ? " active" : ""}`}
              onClick={() => setActiveTab("skills")}
            >
              skills
            </button>
            <button
              type="button"
              className={`ledger-tab${activeTab === "pending" ? " active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              pending
              {pendingSkills.length > 0 && (
                <span className="ledger-tab-badge">{pendingSkills.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`ledger-tab${activeTab === "masteries" ? " active" : ""}`}
              onClick={() => setActiveTab("masteries")}
            >
              masteries
            </button>
          </div>
          <button
            type="button"
            className="close skill-btn"
            onClick={closeOverlay}
            aria-label="Close skill ledger"
            title="Close"
          >
            <IconX size={18} />
          </button>
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
                    const skill = useSkillStore.getState().getById(selectedSkill.id);
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
              <p className="ledger-pending-empty-hint">skip naming upon discovery to send new skills here. name them anytime from this tab.</p>
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

      {activeTab === "masteries" && (
        <div className="ledger-content">
          <div className="ledger-list-column">
            <div className="ledger-list">
              {masteries.length === 0 ? (
                <div className="ledger-empty-state">
                  no masteries yet — develop skils to gain mastery
                </div>
              ) : (
                masteries.map((mastery) => (
                  <div
                    key={mastery.id}
                    className={`ledger-item ${selectedMasteryId === mastery.id ? "selected" : ""}`}
                    onClick={() => setSelectedMasteryId(mastery.id)}
                  >
                    <div className="ledger-header">
                      <div className="ledger-name">{mastery.name}</div>
                      <div className="ledger-subtitle">{mastery.title}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="ledger-detail-column">
              {selectedMasteryId ? (
                <div className="mastery-detail">
                  <h2>{masteries.find((m) => m.id === selectedMasteryId)?.name}</h2>
                  <p>title: {masteries.find((m)=> m.id === selectedMasteryId)?.title}</p>
                  <p>earned: {new Date(masteries.find((m) => m.id === selectedMasteryId)?.earnedAt || 0).toLocaleDateString()}</p>
                  <h3>contributing skills</h3>
                  <ul>
                    {contributingSkills.map((skill) => {
                      const { level } = levelToProgress(skill.xp);
                      return (
                        <li
                          key={skill.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setActiveTab("skills");
                            setSelectedSkillId(skill.id);
                          }}
                        >
                          <span>{skill.name}</span> (level {level})
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className="no-selection">select a mastery to see details</div>
              )}
          </div>
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