import type { Quest } from "@/types/quest";
import type { PlayerData } from "@/types/player";
import type { Skill, XPEvent } from "@/types/skills";
import { setQuestSyncSuppressed } from "@/lib/apiQuests";
import { setPlayerSyncSuppressed } from "@/lib/apiPlayer";
import { setSkillSyncSuppressed } from "@/lib/apiSkills";
import { setXPEventSyncSuppressed } from "@/lib/apiXPEvents";
import { setExtensionSyncSuppressed } from "@/lib/apiExtension";
import {
  applyClientGameBlob,
  normalizeClientGameBlob,
} from "@/lib/clientExtensionPayload";
import { resetSessionExpiryState } from "@/lib/sessionRecovery";
import { useQuestStore } from "@/store/quest";
import { usePlayerStore } from "@/store/player";
import { useSkillStore } from "@/store/skill";
import { useXPEventStore } from "@/store/xpEvent";

export type BootstrapStatus =
  | "idle"
  | "loading"
  | "ready"
  | "unauthorized"
  | "error";

/** Thrown when `fetch` fails before a response (offline, DNS, etc.). */
export class BootstrapNetworkError extends Error {
  constructor() {
    super("Failed to reach the server");
    this.name = "BootstrapNetworkError";
  }
}

type BootstrapData = {
  player: unknown;
  quests: unknown;
  skills: unknown;
  xpEvents: unknown;
  clientGame?: unknown;
};

type BootstrapOkResponse = {
  ok: true;
  data: BootstrapData;
};

type BootstrapErrResponse = {
  ok: false;
  error?: string;
};

function normalizePlayer(raw: unknown): PlayerData {
  const p = raw as PlayerData;
  return {
    ...p,
    profile: p.profile ?? { name: "player" },
    achievements: {
      unlockedTitles: p.achievements?.unlockedTitles ?? [],
      unlockedBadges: p.achievements?.unlockedBadges ?? [],
      activeTitle: p.achievements?.activeTitle ?? null,
      activeBadge: p.achievements?.activeBadge ?? null,
    },
    equipment: p.equipment ?? {
      equipped: { head: null, body: null, accessory: null, weapon: null },
    },
    inventory: p.inventory ?? { items: {} },
    currencies: {
      coins: p.currencies?.coins ?? 0,
      gems: p.currencies?.gems ?? 0,
    },
  };
}

function normalizeQuests(raw: unknown): Quest[] {
  if (!Array.isArray(raw)) return [];
  return raw as Quest[];
}

function normalizeSkills(raw: unknown): Record<string, Skill> {
  if (!raw || typeof raw !== "object") return {};
  return raw as Record<string, Skill>;
}

function normalizeXPEvents(raw: unknown): XPEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw as XPEvent[];
}

function applyBootstrapData(data: BootstrapData) {
  const quests = normalizeQuests(data.quests);
  const player = normalizePlayer(data.player);
  const skills = normalizeSkills(data.skills);
  const events = normalizeXPEvents(data.xpEvents);

  setQuestSyncSuppressed(true);
  setPlayerSyncSuppressed(true);
  setSkillSyncSuppressed(true);
  setXPEventSyncSuppressed(true);
  setExtensionSyncSuppressed(true);
  try {
    useQuestStore.getState().setQuest(quests);
    usePlayerStore.getState().setPlayer(player);
    useSkillStore.setState({ skills });
    useXPEventStore.setState({ events });
    applyClientGameBlob(normalizeClientGameBlob(data.clientGame));
  } finally {
    setQuestSyncSuppressed(false);
    setPlayerSyncSuppressed(false);
    setSkillSyncSuppressed(false);
    setXPEventSyncSuppressed(false);
    setExtensionSyncSuppressed(false);
  }
}

/** Used by tests and the bootstrap hook. */
export async function fetchBootstrapOnce(): Promise<BootstrapStatus> {
  let res: Response;
  try {
    res = await fetch("/api/me/bootstrap", { credentials: "include" });
  } catch {
    throw new BootstrapNetworkError();
  }

  if (res.status === 401) {
    return "unauthorized";
  }

  let json: BootstrapOkResponse | BootstrapErrResponse;
  try {
    json = (await res.json()) as BootstrapOkResponse | BootstrapErrResponse;
  } catch {
    return "error";
  }

  if (!res.ok || !json.ok || !("data" in json) || !json.data) {
    return "error";
  }

  applyBootstrapData(json.data);
  resetSessionExpiryState();
  return "ready";
}
