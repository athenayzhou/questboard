import { useSyncExternalStore } from "react";
import { listenActivity, getRecent } from "../utils/skill/store/skillActivity";

export function useRecentSkills() {
  return useSyncExternalStore(
    listenActivity,
    getRecent,
    getRecent
  );
}