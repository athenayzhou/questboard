import { useSyncExternalStore } from "react";
import { listenActivity, getRecent } from "../store/skillActivity";

export function useRecentSkills() {
  return useSyncExternalStore(
    listenActivity,
    getRecent,
    getRecent
  );
}