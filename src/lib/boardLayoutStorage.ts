import { useBoardLayoutStore } from "@/store/boardLayout";
import type { BoardLayoutMap } from "@/types/boardLayout";
import { scheduleBoardLayoutSync } from "@/lib/boardLayoutSync";

export type { BoardLayoutMap, BoardLayoutEntry } from "@/types/boardLayout";

const PREFIX = "qb.boardLayout.v1";

export { PREFIX as BOARD_LAYOUT_STORAGE_PREFIX };

/**
 * Layout is scoped per visible board surface. Personal available/accepted must always use
 * `personal` — `activeBoardId` can stay set from a previously selected collab board while the
 * user is on the personal top tabs, and must not leak into the key. Collab uses the active
 * shared board id + inner available/accepted tab.
 */
export function boardLayoutStorageKey(args: {
  questTopTab: "available" | "accepted" | "collab";
  activeBoardId: string | null;
  boardTab: "available" | "accepted";
}): string {
  const boardSegment =
    args.questTopTab === "collab"
      ? args.activeBoardId ?? "no-board"
      : "personal";
  return `${PREFIX}:${args.questTopTab}:${boardSegment}:${args.boardTab}`;
}

function loadBoardLayoutFromLocalStorage(key: string): BoardLayoutMap {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as BoardLayoutMap;
  } catch {
    return {};
  }
}

/** Merge: store (server/session) wins over localStorage for overlapping quest ids. */
export function loadBoardLayout(key: string): BoardLayoutMap {
  const fromStore = useBoardLayoutStore.getState().layouts[key];
  const fromLs = loadBoardLayoutFromLocalStorage(key);
  return { ...fromLs, ...(fromStore ?? {}) };
}

export function saveBoardLayout(key: string, map: BoardLayoutMap): void {
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // ignore quota / private mode
  }
  useBoardLayoutStore.getState().setLayout(key, map);
  scheduleBoardLayoutSync(key, map);
}

export function questStateToLayoutMap(
  state: Array<{ id: string; x: number; y: number; zIndex?: number }>,
): BoardLayoutMap {
  const out: BoardLayoutMap = {};
  for (const q of state) {
    out[q.id] = { x: q.x, y: q.y, zIndex: q.zIndex ?? 1 };
  }
  return out;
}

/** Remove cached board layout keys from localStorage (e.g. sign out). */
export function clearBoardLayoutLocalStorageKeys(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`${PREFIX}:`)) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    // ignore
  }
}
