import { useState } from "react";
import { useOverlay } from "../../store/overlay";
import { useQuestStore } from "../../store/quest";
import { useNameStore } from "../../store/name";
import { useSettingsStore } from "../../store/settings";
import { candidateStore } from "../../store/bundledStores";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { showToast } from "../../utils/toast";
import { flushAllServerSyncs } from "../../lib/syncFlush";
import { clearLocalState } from "../../lib/clearLocalState";
import { scheduleSkillSync } from "../../lib/apiSkills";
import { signOutFromApp } from "../../lib/sessionRecovery";
import { APP, CANDIDATE } from "../../utils/constants";
import { useIdentityStore } from "../../store/identity";
import { IconX, IconCloudUpload, IconLogOut, IconTrash2, IconMessage } from "../ui/icons";
import { autoNameSkill, generateSkillNames } from "../../utils/skill/generation/name";

export function Settings() {
  const closeOverlay = useOverlay((s) => s.closeOverlay);
  const openOverlay = useOverlay((s) => s.openOverlay);
  const userCode = useIdentityStore((s) => s.userCode);
  const autoNameSkills = useSettingsStore((s) => s.autoNameSkills);
  const setAutoNameSkillsStore = useSettingsStore(
    (s) => s.setAutoNameSkills,
  );
  const autoFailOverdue = useSettingsStore((s) => s.autoFailOverdueQuests);
  const setAutoFailOverdueQuests = useSettingsStore(
    (s) => s.setAutoFailOverdueQuests,
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleAutoNameToggle = (enabled: boolean) => {
    setAutoNameSkillsStore(enabled);
    if (enabled) {
      const maxClusterCount = (c: { clusters: { count: number }[] }) =>
        c.clusters.length ? Math.max(...c.clusters.map((cl) => cl.count)) : 0;
      const ready = candidateStore
        .getAll()
        .filter(
          (c) => c.state === "ready" && maxClusterCount(c) >= CANDIDATE.MIN_SIZE,
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
    setAutoFailOverdueQuests(enabled);
    if (enabled) {
      useQuestStore.getState().processAutoFail();
    }
  };

  const handleResetData = async () => {
    clearLocalState({ closeOverlays: true });
    scheduleSkillSync();
    setShowResetConfirm(false);
    closeOverlay();

    const ok = await flushAllServerSyncs({ suppressSuccessToast: true });
    if (ok) {
      showToast(
        "success",
        "data reset and saved to the server.",
      );
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutFromApp();
      setShowSignOutConfirm(false);
      closeOverlay();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="overlay settings-overlay">
      <div className="header settings-header">
        <h2>settings</h2>
        <div className="header-actions">
          <button
            type="button"
            className="close"
            onClick={closeOverlay}
            aria-label="Close settings"
            title="Close"
          >
            <IconX size={18} />
          </button>
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

          <div className="settings-cloud-sync">
            <p className="settings-section-title">cloud sync</p>
            <button
              type="button"
              className="settings-sync-btn"
              disabled={syncing}
              onClick={async () => {
                setSyncing(true);
                try {
                  await flushAllServerSyncs();
                } finally {
                  setSyncing(false);
                }
              }}
            >
              <IconCloudUpload size={16} />
              <span>{syncing ? "saving…" : "save to server now"}</span>
            </button>
            <p className="settings-cloud-sync-hint">
              sync all changes
            </p>
          </div>

          <div className="settings-account">
            <p className="settings-section-title">account</p>
            {userCode ? (
              <div className="settings-player-id">
                <span className="settings-player-id-label">user id</span>
                <code className="settings-player-id-code">{userCode}</code>
                <button
                  type="button"
                  className="settings-copy-id-btn"
                  onClick={() => {
                    void navigator.clipboard.writeText(userCode).then(
                      () => showToast("success", "copied"),
                      () => showToast("error", "could not copy"),
                    );
                  }}
                >
                  copy
                </button>
              </div>
            ) : (
              <p className="settings-cloud-sync-hint">user id loads after sync</p>
            )}
            <button
              type="button"
              className="settings-feedback-btn"
              onClick={() => openOverlay("feedback")}
            >
              <IconMessage size={16} />
              <span>send feedback or report a problem</span>
            </button>
            <button
              type="button"
              className="settings-signout-btn"
              disabled={signingOut}
              onClick={() => setShowSignOutConfirm(true)}
            >
              <IconLogOut size={16} />
              <span>{signingOut ? "signing out…" : "sign out"}</span>
            </button>
            <p className="settings-cloud-sync-hint">
              make sure to save before leaving or risk clearing unsaved changes in this session
            </p>
          </div>
        </div>

        <div className="settings-footer">
          <button
            type="button"
            className="settings-reset-btn"
            onClick={() => setShowResetConfirm(true)}
          >
            <IconTrash2 size={16} />
            <span>reset quest & skill data</span>
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
          message:
            "clear all quests and skills on this device? cannot revert changes",
          confirmText: "reset",
          type: "danger",
        }}
        onConfirm={handleResetData}
        onCancel={() => setShowResetConfirm(false)}
      />
      <ConfirmDialog
        isOpen={showSignOutConfirm}
        options={{
          title: "sign out",
          message:
            "sign out and clear local data? you’ll need your invite code to sign back in",
          confirmText: "sign out",
          type: "warning",
        }}
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </div>
  );
}
