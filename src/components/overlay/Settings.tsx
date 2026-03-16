import { useState } from "react";
import { useOverlay } from "../../store/overlay";
import { useQuestStore } from "../../store/quest";
import { useSkillStore } from "../../store/skill";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { showToast } from "../../utils/toastAPI";
import { APP } from "../../utils/constants";

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
  };

  const handleAutoFailToggle = (enabled: boolean) => {
    setAutoFailOverdue(enabled);
    localStorage.setItem('autoFailOverdueQuests', enabled.toString());
  }

  const handleResetData = () => {
    useQuestStore.getState().setQuest([]);
    useSkillStore.setState({ skills: {} });
    localStorage.setItem("skills", "{}");
    showToast("success", "Quest and skill data reset.");
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

        <button
          type="button"
          className="text-red-600 hover:text-red-700 font-medium"
          onClick={() => setShowResetConfirm(true)}
        >
          reset quest & skill data
        </button>

        <div className="settings-meta">
          <span>version {APP.VERSION}</span>
          <span>dev by {APP.DEV_NAME}</span>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showResetConfirm}
        options={{
          title: "Reset data",
          message: "Clear all quests and skills? This cannot be undone.",
          confirmText: "reset",
          type: "danger",
        }}
        onConfirm={handleResetData}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}