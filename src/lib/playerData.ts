import type { PlayerData } from "@/types/player";
import { migrateBadges } from "@/lib/playerBadges";

/**
 * Coerce bootstrap / API / local JSON into `PlayerData` and migrate legacy fields.
 */
export function normalizePlayerData(raw: unknown): PlayerData {
  const p = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const profileRaw = p.profile;
  const profile =
    profileRaw && typeof profileRaw === "object"
      ? (profileRaw as Record<string, unknown>)
      : {};

  const badgesRaw =
    p.badges !== undefined
      ? p.badges
      : (p as Record<string, unknown>).achievements;

  return {
    profile: {
      name:
        typeof profile.name === "string" && profile.name.trim()
          ? profile.name
          : "player",
      ...(typeof profile.character === "string" && profile.character
        ? { character: profile.character }
        : {}),
    },
    badges: migrateBadges(badgesRaw),
    equipment:
      p.equipment && typeof p.equipment === "object"
        ? (p.equipment as PlayerData["equipment"])
        : {
            equipped: {
              head: null,
              body: null,
              accessory: null,
              weapon: null,
            },
          },
    inventory:
      p.inventory && typeof p.inventory === "object"
        ? (p.inventory as PlayerData["inventory"])
        : { items: {} },
    currencies: {
      coins: Number((p.currencies as Record<string, unknown> | undefined)?.coins) || 0,
      gems: Number((p.currencies as Record<string, unknown> | undefined)?.gems) || 0,
    },
  };
}
