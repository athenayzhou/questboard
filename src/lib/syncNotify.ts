import { showToast } from "@/utils/toast";

let lastSyncFailureToastAt = 0;
const SYNC_FAILURE_TOAST_COOLDOWN_MS = 4500;

export function notifyDebouncedSyncFailure() {
  const now = Date.now();
  if (now - lastSyncFailureToastAt < SYNC_FAILURE_TOAST_COOLDOWN_MS) return;
  lastSyncFailureToastAt = now;
  showToast(
    "error",
    "could not save to the server. check connection, or use settings → save to server now",
    { duration: 9000 },
  );
}
