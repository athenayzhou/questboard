import { showToast } from "@/utils/toast";
import { isSessionExpiredError } from "@/lib/sessionRecovery";
import { saveQuestsToServer } from "@/lib/apiQuests";
import { saveUserToServer } from "@/lib/apiUser";
import { saveSkillsToServer } from "@/lib/apiSkills";
import { saveXPEventsToServer } from "@/lib/apiXPEvents";
import { flushExtensionSyncNow } from "@/lib/apiExtension";
import { useQuestStore } from "@/store/quest";
import { useUserStore } from "@/store/user";
import { useSkillStore } from "@/store/skill";
import { useXPEventStore } from "@/store/xpEvent";

export type FlushAllServerSyncsOptions = {
  suppressSuccessToast?: boolean;
  suppressErrorToast?: boolean;
};

export async function flushAllServerSyncs(
  options?: FlushAllServerSyncsOptions,
): Promise<boolean> {
  const suppressSuccessToast = options?.suppressSuccessToast ?? false;
  const suppressErrorToast = options?.suppressErrorToast ?? false;
  const results = await Promise.allSettled([
    saveQuestsToServer(useQuestStore.getState().quests),
    saveUserToServer(useUserStore.getState().user),
    saveSkillsToServer(useSkillStore.getState().skills as Record<string, unknown>),
    saveXPEventsToServer(useXPEventStore.getState().events),
    flushExtensionSyncNow(),
  ]);

  if (results.some((r) => r.status === "rejected" && isSessionExpiredError(r.reason))) {
    return false;
  }

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    if (!suppressErrorToast) {
      showToast(
        "error",
        `${failed.length} of 5 saves failed. check connection and try again`,
        { duration: 8000 },
      );
    }
    return false;
  }

  if (!suppressSuccessToast) {
    showToast("success", "saved to server");
  }
  return true;
}
