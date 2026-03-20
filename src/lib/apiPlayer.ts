import { usePlayerStore } from "@/store/player";
import { notifyDebouncedSyncFailure } from "@/lib/syncNotify";
import {
  isSessionExpiredError,
  throwIfUnauthorized,
} from "@/lib/sessionRecovery";

let suppressPlayerSync = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const DELAY_MS = 800;

export function setPlayerSyncSuppressed(suppressed: boolean) {
  suppressPlayerSync = suppressed;
  if(suppressed && timer){
    clearTimeout(timer);
    timer = null;
  }
}

export async function savePlayerToServer(player: unknown) {
  const res = await fetch("/api/me/player", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player }),
  });
  await throwIfUnauthorized(res);
  if(!res.ok){
    const t = await res.text().catch(() => "");
    throw new Error(`save player failed: ${res.status} ${t}`);
  }
}

export function schedulePlayerSync() {
  if(suppressPlayerSync) return;
  if(timer) clearTimeout(timer);

  timer = setTimeout(async () => {
    timer = null;
    if(suppressPlayerSync) return;
    const player = usePlayerStore.getState().player;
    try{
      await savePlayerToServer(player);
    } catch (e) {
      if (isSessionExpiredError(e)) return;
      console.error(e);
      notifyDebouncedSyncFailure();
    }
  }, DELAY_MS);
}