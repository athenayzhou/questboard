import { showToast } from "@/utils/toast";

let lastSyncFailureToastAt = 0;
const SYNC_FAILURE_TOAST_COOLDOWN_MS = 4500;

/** Avoid spamming the user when several debounced saves fail close together. */
export function notifyDebouncedSyncFailure() {
  const now = Date.now();
  if (now - lastSyncFailureToastAt < SYNC_FAILURE_TOAST_COOLDOWN_MS) return;
  lastSyncFailureToastAt = now;
  showToast(
    "error",
    "Could not save to the server. Check your connection, or use Settings → Save to server now.",
    { duration: 9000 },
  );
}
