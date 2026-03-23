import { useXPEventStore } from "@/store/xpEvent";
import { notifyDebouncedSyncFailure } from "@/lib/syncNotify";
import { isSessionExpiredError } from "@/lib/sessionRecovery";

let suppressXPEventSync = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const DELAY_MS = 800;

export function setXPEventSyncSuppressed(suppressed: boolean) {
  suppressXPEventSync = suppressed;
  if (suppressed && timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export async function saveXPEventsToServer(xpEvents: unknown[]) {
  const res = await fetch("/api/me/xp-events", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ xpEvents }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`save xp events failed: ${res.status} ${t}`);
  }
}

export function scheduleXPEventSync() {
  if (suppressXPEventSync) return;
  if (timer) clearTimeout(timer);

  timer = setTimeout(async () => {
    timer = null;
    if (suppressXPEventSync) return;
    const events = useXPEventStore.getState().events;
    try {
      await saveXPEventsToServer(events);
    } catch (e) {
      if (isSessionExpiredError(e)) return;
      console.error(e);
      notifyDebouncedSyncFailure();
    }
  }, DELAY_MS);
}