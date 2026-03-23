/**
 * Server/DB seed payloads: quests / skills / client_game blob.
 * Quest and skill IDs are UUIDs in `richDevSeedData` so DB rows match client sync.
 * Used by `scripts/seed-beta-user.ts` only (not bundled for the browser).
 */
import type { Quest } from "@/types/quest";
import type { Skill } from "@/types/skills";
import type { Mastery } from "@/types/skills";
import type { ClientGameBlobV1 } from "@/types/clientExtension";
import {
  buildRichDevUser,
  buildRichDevQuests,
  RICH_DEV_SKILLS,
  RICH_DEV_MASTERIES,
} from "@/dev/data/richDevSeedData";
export function buildBetaSeedQuestsForDb(): Quest[] {
  return buildRichDevQuests().map((q) => {
    const acceptedAt =
      q.status === "accepted" && q.acceptedAt == null
        ? q.createdAt
        : q.acceptedAt;
    return { ...q, acceptedAt };
  });
}

export function buildBetaSeedSkillsForDb(): Skill[] {
  return Object.values(RICH_DEV_SKILLS).map((s) => ({ ...s }));
}

export function buildBetaSeedMasteriesForDb(): Mastery[] {
  return RICH_DEV_MASTERIES.map((m) => ({ ...m }));
}

export function buildBetaSeedClientGameBlob(): ClientGameBlobV1 {
  return {
    v: 1,
    evidence: [],
    candidates: [],
    clusters: [],
    learnedVerbs: [],
    pendingSkills: [],
    masteries: buildBetaSeedMasteriesForDb(),
    streak: {
      currentDays: 7,
      lastCompletion: new Date().toISOString().slice(0, 10),
    },
    friends: [],
    settings: { autoNameSkills: true, autoFailOverdueQuests: false },
  };
}

export { buildRichDevUser as buildBetaSeedUser };
