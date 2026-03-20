import { showToast } from "@/utils/toast";
import { isSessionExpiredError } from "@/lib/sessionRecovery";
import { saveQuestsToServer } from "@/lib/apiQuests";
import { savePlayerToServer } from "@/lib/apiPlayer";
import { saveSkillsToServer } from "@/lib/apiSkills";
import { saveXPEventsToServer } from "@/lib/apiXPEvents";
import { flushExtensionSyncNow } from "@/lib/apiExtension";
import { useQuestStore } from "@/store/quest";
import { usePlayerStore } from "@/store/player";
import { useSkillStore } from "@/store/skill";
import { useXPEventStore } from "@/store/xpEvent";

/**
 * Immediately pushes all domains to the server (manual retry).
 * Returns true only if every PUT succeeded.
 */
export async function flushAllServerSyncs(): Promise<boolean> {
  const results = await Promise.allSettled([
    saveQuestsToServer(useQuestStore.getState().quests),
    savePlayerToServer(usePlayerStore.getState().player),
    saveSkillsToServer(useSkillStore.getState().skills as Record<string, unknown>),
    saveXPEventsToServer(useXPEventStore.getState().events),
    flushExtensionSyncNow(),
  ]);

  if (results.some((r) => r.status === "rejected" && isSessionExpiredError(r.reason))) {
    return false;
  }

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    showToast(
      "error",
      `${failed.length} of 5 saves failed. Check your connection and try again.`,
      { duration: 8000 },
    );
    return false;
  }

  showToast("success", "Saved to server.");
  return true;
}
