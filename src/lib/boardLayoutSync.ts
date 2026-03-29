import type { BoardLayoutMap } from "@/types/boardLayout";
import { throwIfUnauthorized } from "@/lib/sessionRecovery";

const DEBOUNCE_MS = 900;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let suppressed = false;

export function setBoardLayoutSyncSuppressed(next: boolean) {
  suppressed = next;
  if (next) {
    for (const t of timers.values()) clearTimeout(t);
    timers.clear();
  }
}

export function scheduleBoardLayoutSync(surfaceKey: string, layout: BoardLayoutMap) {
  if (suppressed) return;
  const existing = timers.get(surfaceKey);
  if (existing) clearTimeout(existing);
  timers.set(
    surfaceKey,
    setTimeout(() => {
      timers.delete(surfaceKey);
      void pushBoardLayout(surfaceKey, layout);
    }, DEBOUNCE_MS),
  );
}

async function pushBoardLayout(surfaceKey: string, layout: BoardLayoutMap) {
  try {
    const res = await fetch("/api/me/board-layout", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surfaceKey, layout }),
    });
    await throwIfUnauthorized(res);
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("board layout sync failed:", res.status, t);
    }
  } catch (e) {
    if (e && typeof e === "object" && "name" in e && (e as Error).name === "SessionExpiredError") {
      return;
    }
    console.error("board layout sync failed:", e);
  }
}
