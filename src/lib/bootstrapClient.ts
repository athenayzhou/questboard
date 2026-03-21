import type { Quest } from "@/types/quest";
import type { PlayerData } from "@/types/player";
import { normalizePlayerData } from "@/lib/playerData";
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
import { useIdentityStore } from "@/store/identity";
import { applyDevFriendsSeed } from "@/dev/applyDevFriendsSeed";
import { applyDevMasterySeed } from "@/dev/applyDevMasterySeed";

export type BootstrapStatus =
  | "idle"
  | "loading"
  | "ready"
  | "unauthorized"
  | "error";

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
  playerCode?: unknown;
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
  return normalizePlayerData(raw);
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
    applyDevFriendsSeed();
    applyDevMasterySeed();
    useIdentityStore.getState().setPlayerCode(typeof data.playerCode === "string" ? data.playerCode : null)
  } finally {
    setQuestSyncSuppressed(false);
    setPlayerSyncSuppressed(false);
    setSkillSyncSuppressed(false);
    setXPEventSyncSuppressed(false);
    setExtensionSyncSuppressed(false);
  }
}

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
