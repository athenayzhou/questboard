import { notifyDebouncedSyncFailure } from "@/lib/syncNotify";
import {
  isSessionExpiredError,
  throwIfUnauthorized,
} from "@/lib/sessionRecovery";
import { buildClientGameBlob } from "@/lib/clientExtensionPayload";

let suppressExtensionSync = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const DELAY_MS = 800;

export function setExtensionSyncSuppressed(suppressed: boolean) {
  suppressExtensionSync = suppressed;
  if (suppressed && timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export async function saveExtensionToServer(clientGame: unknown) {
  const res = await fetch("/api/me/extension", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientGame }),
  });
  await throwIfUnauthorized(res);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`save extension failed: ${res.status} ${t}`);
  }
}

export function scheduleExtensionSync() {
  if (suppressExtensionSync) return;
  if (timer) clearTimeout(timer);

  timer = setTimeout(async () => {
    timer = null;
    if (suppressExtensionSync) return;
    const clientGame = buildClientGameBlob();
    try {
      await saveExtensionToServer(clientGame);
    } catch (e) {
      if (isSessionExpiredError(e)) return;
      console.error(e);
      notifyDebouncedSyncFailure();
    }
  }, DELAY_MS);
}

export async function flushExtensionSyncNow(): Promise<void> {
  if (suppressExtensionSync) return;
  const clientGame = buildClientGameBlob();
  await saveExtensionToServer(clientGame);
}
