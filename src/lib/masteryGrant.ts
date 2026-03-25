import { showToast } from "@/utils/toast";
import { useMasteryStore } from "@/store/mastery";
import { devError } from "@/dev/devLogs";

let masteryCheckQueued = false;

/**
 * Coalesces to one run per synchronous turn (multiple gainXP / addSkill calls
 * in the same quest-completion stack share a single eligibility pass).
 */
export function scheduleMasteryEligibilityCheck(): void {
  if (masteryCheckQueued) return;
  masteryCheckQueued = true;
  queueMicrotask(() => {
    masteryCheckQueued = false;
    try {
      const granted = useMasteryStore.getState().grantMastery();
      if (granted.length === 0) return;
      if (granted.length === 1) {
        showToast("success", `mastery earned: ${granted[0].name}`);
      } else {
        showToast(
          "success",
          `${granted.length} masteries earned: ${granted.map((g) => g.name).join(", ")}`,
          { duration: 7000 },
        );
      }
    } catch (e) {
      devError("mastery", "eligibility check failed", e);
    }
  });
}
