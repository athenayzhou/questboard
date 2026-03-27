import type { Quest } from "@/types/quest";
import { useQuestStore } from "@/store/quest";
import { dedupeQuestsById } from "@/lib/questDedupe";
import { notifyDebouncedSyncFailure } from "@/lib/syncNotify";
import {
  isSessionExpiredError,
  throwIfUnauthorized,
} from "@/lib/sessionRecovery";
import { isPersonalQuest } from "@/lib/boardScope";

/** Parallel callers (e.g. bootstrap + quest overlay) share one GET /api/me/quests. */
let personalQuestsInflight: Promise<Quest[]> | null = null;

let suppressQuestSync = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const DELAY_MS = 800;

export function setQuestSyncSuppressed(suppressed: boolean) {
  suppressQuestSync = suppressed;
  if(suppressed && timer){
    clearTimeout(timer);
    timer = null;
  }
}

export async function saveQuestsToServer(quests: unknown[]) {
  const list = Array.isArray(quests) ? quests : [];
  const deduped = dedupeQuestsById(list as Quest[]).filter(isPersonalQuest);
  const res = await fetch("/api/me/quests", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quests: deduped }),
  });

  await throwIfUnauthorized(res);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`save quests failed: ${res.status} ${t}`);
  }
}

export async function fetchPersonalQuestsFromServer(): Promise<Quest[]> {
  if (!personalQuestsInflight) {
    personalQuestsInflight = (async () => {
      const res = await fetch("/api/me/quests", { credentials: "include" });
      await throwIfUnauthorized(res);
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`fetch quests failed: ${res.status} ${t}`);
      }
      const json = (await res.json().catch(() => null)) as {
        quests?: unknown;
      } | null;
      const list = json?.quests;
      return Array.isArray(list) ? (list as Quest[]) : [];
    })().finally(() => {
      personalQuestsInflight = null;
    });
  }
  return personalQuestsInflight;
}

export async function sendQuestToFriend(args: {
  toUserCode: string;
  quest: Quest;
  note?: string | null;
}) {
  const res = await fetch("/api/me/quests/send", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });

  await throwIfUnauthorized(res);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`send quest failed: ${res.status} ${t}`);
  }
}

export function scheduleQuestSync() {
  if(suppressQuestSync) return;
  if(timer) clearTimeout(timer);

  timer = setTimeout(async () => {
    timer = null;
    if(suppressQuestSync) return;
    const quests = useQuestStore.getState().quests;
    try {
      await saveQuestsToServer(quests);
    } catch (e) {
      if (isSessionExpiredError(e)) return;
      console.error(e);
      notifyDebouncedSyncFailure();
    }
  }, DELAY_MS);
}