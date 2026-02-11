import { useSyncExternalStore } from "react";
import { listenSkillLedger, getRecentActivity } from "../store/skillLedger";

export function useRecentSkills() {
  return useSyncExternalStore(
    listenSkillLedger,
    getRecentActivity,
    getRecentActivity
  );
}