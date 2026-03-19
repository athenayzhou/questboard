import { useState } from "react";
import { useOverlay } from "../../store/overlay";
import { useQuestStore } from "../../store/quest";
import { useSkillStore } from "../../store/skill";
import { useNameStore } from "../../store/name";
import { candidateStore, clusterStore, evidenceStore } from "../../store/bundledStores";
import { useXPEventStore } from "../../store/xpEvent";
import { useMasteryStore } from "../../store/mastery";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { showToast } from "../../utils/toast";
import { APP, CANDIDATE } from "../../utils/constants";
import { autoNameSkill, generateSkillNames } from "../../utils/skill/generation/name";

export function Settings() {
  const closeOverlay = useOverlay((s) => s.closeOverlay);
  const [autoNameSkills, setAutoNameSkills] = useState(() => 
    localStorage.getItem('autoNameSkills') !== 'false'
  );
  const [autoFailOverdue, setAutoFailOverdue] = useState(() => 
    localStorage.getItem('autoFailOverdueQuests') === 'true'
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleAutoNameToggle = (enabled: boolean) => {
    setAutoNameSkills(enabled);
    localStorage.setItem('autoNameSkills', enabled.toString());
    if (enabled) {
      const maxClusterCount = (c: { clusters: { count: number }[] }) =>
        c.clusters.length ? Math.max(...c.clusters.map((cl) => cl.count)) : 0;
      const ready = candidateStore
        .getAll()
        .filter(
          (c) => c.state === "ready" && maxClusterCount(c) >= CANDIDATE.MIN_SIZE
        );
      if (ready.length > 0) {
        autoNameSkill(ready, candidateStore);
      }
      const pending = useNameStore.getState().pendingSkills;
      for (const p of pending) {
        const name = generateSkillNames(p.candidate)[0];
        if (name) useNameStore.getState().promotePendingSkill(p.id, name);
      }
      const named = ready.length + pending.length;
      if (named > 0) {
        showToast("success", `Named ${named} skill${named === 1 ? "" : "s"}.`);
      }
    }
  };

  const handleAutoFailToggle = (enabled: boolean) => {
    setAutoFailOverdue(enabled);
    localStorage.setItem('autoFailOverdueQuests', enabled.toString());
    if (enabled) {
      useQuestStore.getState().processAutoFail();
    }
  };

  const handleResetData = () => {
    useQuestStore.getState().setQuest([]);
    useSkillStore.setState({ skills: {} });
    useXPEventStore.getState().clear();
    useMasteryStore.setState({ masteries: [] });
    useNameStore.setState({
      isNaming: false,
      pendingNaming: [],
      currentNameIndex: 0,
      pendingSkills: [],
    });

    // Clear non-zustand stores used by skill generation.
    candidateStore.clear();
    clusterStore.clear();
    evidenceStore.clear();

    // Clear persisted keys (some stores don't remove from storage on "clear").
    try {
      localStorage.setItem("skills", "{}");
      localStorage.setItem("xpEvents", "[]");
      localStorage.setItem("masteries", "[]");
      localStorage.setItem("pendingSkills", "[]");
      localStorage.setItem("candidates", "[]");
      localStorage.setItem("clusters", "[]");
      localStorage.removeItem("evidence");
      localStorage.removeItem("learnedVerbs");
    } catch {
      // ignore storage errors
    }

    useOverlay.getState().closeAllQuests();
    showToast("success", "Data reset (quests, skills, and skill history).");
    setShowResetConfirm(false);
    closeOverlay();
  };

  return (
    <div className="overlay settings-overlay">
      <div className="header settings-header">
        <h2>settings</h2>
        <div className="header-actions">
          <button className="close" onClick={closeOverlay}>close</button>
        </div>
      </div>
      <div className="settings-content">
        <div className="settings-main">
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={autoNameSkills}
              onChange={(e) => handleAutoNameToggle(e.target.checked)}
            />
            auto-name new skills
          </label>

          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={autoFailOverdue}
              onChange={(e) => handleAutoFailToggle(e.target.checked)}
            />
            auto-fail overdue quests
          </label>
        </div>

        <div className="settings-footer">
          <button
            type="button"
            className="settings-reset-btn"
            onClick={() => setShowResetConfirm(true)}
          >
            reset quest & skill data
          </button>

          <div className="settings-meta">
            <span>version {APP.VERSION}</span>
            <span>dev by {APP.DEV_NAME}</span>
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showResetConfirm}
        options={{
          title: "reset data",
          message: "clear all quests and skills? this action cannot be undone.",
          confirmText: "reset",
          type: "danger",
        }}
        onConfirm={handleResetData}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}