import { useSyncExternalStore } from "react";
import { listenActivity, recentActivity } from "../utils/skill/store/skillActivity";

export function useRecentSkills(limit = 3) {
  return useSyncExternalStore(
    listenActivity,
    () => recentActivity(limit)
  );
}