import { useState, useMemo, useEffect, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useXPEventStore } from "../../store/xpEvent";
import { useOverlay } from "../../store/overlay";
import { SkillDetail } from "../secondary/SkillDetail";
import { levelToProgress } from "../../utils/skill/analysis/experience";
import { ProgressBar } from "../ui/ProgressBar";
import { useSkillStore } from "../../store/skill";
import { useNameStore } from "../../store/name";
import { DECAY, MS } from "../../utils/constants";
import { NameSkill } from "../secondary/NameSkill";
import type { Mastery, Skill, XPEvent } from "../../types/skills";
import type { PendingSkill } from "../../store/name";
import { useMasteryStore } from "../../store/mastery";
import { IconPencil, IconX } from "../ui/icons";
import { formatDateUsSlash } from "../../utils/format/date";
import { xpEventActivityLabel } from "../../utils/xpEventLabel";

function barXpFromEvents(skill: Skill, events: XPEvent[]): number {
  const firstSeenAt = skill.firstSeenAt ?? 0;
  if (firstSeenAt <= 0) return skill.xp;
  return Math.max(
    0,
    events
      .filter((e) => e.skillId === skill.id && e.timestamp >= firstSeenAt)
      .reduce((s, e) => s + e.amount, 0),
  );
}

type SortKey = "name" | "level" | "lastSeen";
type LedgerTab = "skills" | "pending";

export function SkillLedger() {
  const closeOverlay = useOverlay((s) => s.closeOverlay);
  const [activeTab, setActiveTab] = useState<LedgerTab>("skills");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastSeen");
  const [showDormantOnly, setShowDormantOnly] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedMasteryId, setSelectedMasteryId] = useState<string | null>(null);
  const [renamingSkill, setRenamingSkill] = useState<Skill | null>(null);
  const [renamingMastery, setRenamingMastery] = useState<Mastery | null>(null);
  const [namingPendingSkill, setNamingPendingSkill] = useState<PendingSkill | null>(null);

  const skillsRecord = useSkillStore((s) => s.skills);
  const pendingSkills = useNameStore((s) => s.pendingSkills);
  const masteries = useMasteryStore((s) => s.masteries);
  const xpEvents = useXPEventStore((s) => s.events);

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const ledgerEntries = useMemo(() => {
    const now = nowMs;
    const DORMANT_AFTER = DECAY.DORMANT_THRESHOLD_DAYS * MS.DAY;
    const skills = Object.values(skillsRecord);
    return skills.map((skill) => {
      const firstSeenAt = skill.firstSeenAt ?? 0;
      const barXp = barXpFromEvents(skill, xpEvents);
      return {
        id: skill.id,
        skillId: skill.id,
        name: skill.name,
        xp: barXp,
        level: levelToProgress(barXp).level,
        lastSeenAt: skill.lastSeenAt ?? 0,
        firstSeenAt,
        isDormant: skill.lastSeenAt ? now - skill.lastSeenAt > DORMANT_AFTER : true,
      };
    });
  }, [skillsRecord, xpEvents, nowMs]);

  const selectedSkill = useMemo(
    () => ledgerEntries.find((s) => s.id === selectedSkillId) ?? null,
    [ledgerEntries, selectedSkillId]
  );

  const selectedMastery = useMemo(
    () => masteries.find((m) => m.id === selectedMasteryId) ?? null,
    [masteries, selectedMasteryId]
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
          case "name":
            return a.name.localeCompare(b.name);
          case "level":
            return b.xp - a.xp;
          case "lastSeen":
            return (b.lastSeenAt ?? 0) - (a.lastSeenAt ?? 0);
        }
      });
  }, [ledgerEntries, search, sortKey, showDormantOnly]);

  const contributingSkills = useMemo(() => {
    if (!selectedMasteryId) return [];
    const mastery = masteries.find((m) => m.id === selectedMasteryId);
    if (!mastery) return [];
    return (mastery.skillIds ?? [])
      .map((id) => skillsRecord[id])
      .filter(Boolean) as Skill[];
  }, [selectedMasteryId, masteries, skillsRecord]);

  const pathActivity = useMemo(() => {
    if (!selectedMasteryId) return [];
    const mastery = masteries.find((m) => m.id === selectedMasteryId);
    if (!mastery) return [];
    const idSet = new Set(mastery.skillIds ?? []);
    return [...xpEvents]
      .filter((e) => {
        if (!e.skillId || !idSet.has(e.skillId)) return false;
        const sk = skillsRecord[e.skillId];
        const fs = sk?.firstSeenAt ?? 0;
        if (fs > 0 && e.timestamp < fs) return false;
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [selectedMasteryId, masteries, xpEvents, skillsRecord]);

  function selectSkill(id: string) {
    setRenamingMastery(null);
    setSelectedSkillId(id);
    setSelectedMasteryId(null);
  }

  function selectMastery(id: string) {
    if (id !== selectedMasteryId) setRenamingMastery(null);
    setSelectedMasteryId(id);
    setSelectedSkillId(null);
  }

  return (
    <div className="overlay skill-overlay">
      <div className="header skill-header">
        <h2>skill ledger</h2>
        <div className="header-actions">
          <div className="ledger-header-tabs">
            <button
              type="button"
              className={`ledger-tab${activeTab === "skills" ? " active" : ""}`}
              onClick={() => {
                setRenamingMastery(null);
                setActiveTab("skills");
              }}
            >
              skills
            </button>
            <button
              type="button"
              className={`ledger-tab${activeTab === "pending" ? " active" : ""}`}
              onClick={() => {
                setRenamingMastery(null);
                setActiveTab("pending");
              }}
            >
              pending
              {pendingSkills.length > 0 && (
                <span className="ledger-tab-badge">{pendingSkills.length}</span>
              )}
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
                onChange={(e) => setSearch(e.target.value)}
              />
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
                <option value="lastSeen">recent</option>
                <option value="level">level</option>
                <option value="name">name</option>
              </select>
              <label>
                <input
                  type="checkbox"
                  checked={showDormantOnly}
                  onChange={(e) => setShowDormantOnly(e.target.checked)}
                />{" "}
                dormant
              </label>
            </div>

            <div className="ledger-masteries-box">
              <h3 className="ledger-box-title">mastery</h3>
              <div className="ledger-masteries-list">
                {masteries.length === 0 ? (
                  <div className="ledger-empty-state ledger-empty-state--compact">
                    no masteries yet
                  </div>
                ) : (
                  masteries.map((mastery) => (
                    <div
                      key={mastery.id}
                      className={`ledger-item ${selectedMasteryId === mastery.id ? "selected" : ""}`}
                      onClick={() => selectMastery(mastery.id)}
                    >
                      <div className="ledger-header">
                        <div className="ledger-name ledger-path-name">
                          <span>{mastery.name}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="ledger-skills-box">
              <h3 className="ledger-box-title">skills</h3>
              <div className="ledger-skills-list">
                {ledgerEntries.length === 0 ? (
                  <div className="ledger-empty-state ledger-empty-state--compact">
                    no skills yet — complete quests to discover and level up skills
                  </div>
                ) : filteredSkills.length === 0 ? (
                  <div className="ledger-empty-state ledger-empty-state--compact">
                    no skills match your search or filters
                  </div>
                ) : (
                  filteredSkills.map((skill) => {
                    const { progress } = levelToProgress(skill.xp);
                    return (
                      <div
                        key={skill.id}
                        className={`ledger-item ${skill.isDormant ? "dormant" : ""} ${
                          selectedSkillId === skill.id ? "selected" : ""
                        }`}
                        data-spotlight="ledger-skill-row"
                        onClick={() => selectSkill(skill.id)}
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
                  onSelectRelatedSkill={(id) => {
                    setSelectedSkillId(id);
                    setSelectedMasteryId(null);
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
              </>
            ) : selectedMastery ? (
              <div className="mastery-detail">
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => {
                    setRenamingMastery(null);
                    setSelectedMasteryId(null);
                  }}
                  aria-label="Close"
                  title="Close"
                >
                  <IconX size={18} />
                </button>
                <button
                  type="button"
                  className="rename-btn"
                  onClick={() => {
                    const m = useMasteryStore
                      .getState()
                      .getAll()
                      .find((x) => x.id === selectedMastery.id);
                    if (m) setRenamingMastery(m);
                  }}
                  aria-label="Rename path"
                  title="Rename path"
                >
                  <IconPencil size={16} />
                </button>
                <h2 className="mastery-detail-title">
                  <span>{selectedMastery.name}</span>
                </h2>
                {(selectedMastery.title ?? "").trim().length > 0 && (
                  <p className="mastery-detail-subtitle">{selectedMastery.title}</p>
                )}
                <p className="mastery-earned">
                  earned {formatDateUsSlash(selectedMastery.earnedAt)}
                </p>
                <h3 className="mastery-section-heading">skills in this path</h3>
                <ul className="mastery-contributing-list">
                  {contributingSkills.map((skill) => {
                    const { level } = levelToProgress(
                      barXpFromEvents(skill, xpEvents),
                    );
                    return (
                      <li key={skill.id}>
                        <button
                          type="button"
                          className="mastery-contributing-skill"
                          onClick={() => selectSkill(skill.id)}
                        >
                          <span>{skill.name}</span>{" "}
                          <span className="mastery-contributing-level">(level {level})</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <h3 className="mastery-section-heading">activity</h3>

                {pathActivity.length === 0 ? (
                  <p className="mastery-activity-empty">no activity logged yet</p>
                ) : (
                  <ul className="mastery-activity-list">
                    {pathActivity.map((e) => {
                      const sk = e.skillId ? skillsRecord[e.skillId] : undefined;
                      const amt = Math.round(e.amount * 10) / 10;
                      const amtLabel =
                        amt > 0 ? `+${amt} xp` : amt < 0 ? `${amt} xp` : "0 xp";
                      const context =
                        e.source === "decay"
                          ? e.name?.trim() || "idle decay"
                          : xpEventActivityLabel(e);
                      return (
                        <li key={e.id} className="mastery-activity-item">
                          <div className="mastery-activity-top">
                            <span className="mastery-activity-date">
                              {formatDateUsSlash(e.timestamp)}
                            </span>
                            <span className="mastery-activity-skill">
                              {sk?.name ?? "skill"}
                            </span>
                            <span
                              className={
                                e.amount < 0
                                  ? "mastery-activity-xp is-negative"
                                  : "mastery-activity-xp"
                              }
                            >
                              {amtLabel}
                            </span>
                          </div>
                          <div className="mastery-activity-bottom">
                            <span className="mastery-activity-src">{e.source}</span>
                            <span className="mastery-activity-context" title={context}>
                              {context}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : (
              <div className="no-selection">
                select a path or skill to see details
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "pending" && (
        <div className="ledger-pending-body">
          {pendingSkills.length === 0 ? (
            <div className="ledger-pending-empty">
              <p className="ledger-pending-empty-title">no pending skills</p>
              <p className="ledger-pending-empty-hint">
                skip naming upon discovery to send new skills here. name them anytime from this tab.
              </p>
            </div>
          ) : (
            <>
              <p className="ledger-pending-intro">
                <span className="ledger-pending-count">{pendingSkills.length}</span>{" "}
                {pendingSkills.length === 1 ? "skill" : "skills"} waiting to be named
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

      {renamingMastery && (
        <RenameMasteryDialog
          key={renamingMastery.id}
          mastery={renamingMastery}
          onSave={(name, title) => {
            useMasteryStore.getState().updateMastery(renamingMastery.id, {
              name,
              title,
            });
            setRenamingMastery(null);
          }}
          onCancel={() => setRenamingMastery(null)}
        />
      )}
    </div>
  );
}

function RenameMasteryDialog({
  mastery,
  onSave,
  onCancel,
}: {
  mastery: Mastery;
  onSave: (name: string, title: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(mastery.name ?? "");
  const [title, setTitle] = useState(mastery.title ?? "");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    onSave(n, title.trim());
  };

  return createPortal(
    <div
      className="skill-naming-overlay"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="skill-naming-dialog"
        role="dialog"
        aria-labelledby="rename-mastery-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="rename-mastery-title">rename path</h3>
        <p className="skill-context">
          verb:{" "}
          <span className="mastery-detail-verb">{mastery.verb}</span>
        </p>
        <form onSubmit={handleSubmit} className="skill-naming-form">
          <div className="custom-name">
            <h4>display name</h4>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="path name"
              autoComplete="off"
            />
          </div>
          <div className="custom-name">
            <h4>title (subtitle)</h4>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="optional subtitle"
              autoComplete="off"
            />
          </div>
          <div className="dialog-actions">
            <button type="button" onClick={onCancel}>
              cancel
            </button>
            <button type="submit" disabled={name.trim().length === 0}>
              save
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
