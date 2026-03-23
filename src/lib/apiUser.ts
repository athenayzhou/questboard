import { useUserStore } from "@/store/user";
import { notifyDebouncedSyncFailure } from "@/lib/syncNotify";
import {
  isSessionExpiredError,
  throwIfUnauthorized,
} from "@/lib/sessionRecovery";

let suppressUserSync = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const DELAY_MS = 800;

export function setUserSyncSuppressed(suppressed: boolean) {
  suppressUserSync = suppressed;
  if (suppressed && timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export async function saveUserToServer(user: unknown) {
  const res = await fetch("/api/me/user", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user }),
  });
  await throwIfUnauthorized(res);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`save user failed: ${res.status} ${t}`);
  }
}

export function scheduleUserSync() {
  if (suppressUserSync) return;
  if (timer) clearTimeout(timer);

  timer = setTimeout(async () => {
    timer = null;
    if (suppressUserSync) return;
    const user = useUserStore.getState().user;
    try {
      await saveUserToServer(user);
    } catch (e) {
      if (isSessionExpiredError(e)) return;
      console.error(e);
      notifyDebouncedSyncFailure();
    }
  }, DELAY_MS);
}
