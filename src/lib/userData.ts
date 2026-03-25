import type { UserData } from "@/types/user";
import {
  DEFAULT_CHARACTER_IMAGE,
  DEFAULT_DISPLAY_NAME_PLACEHOLDER,
} from "./defaultUserData";
import { migrateBadges } from "@/lib/userBadges";

export function normalizeUserData(raw: unknown): UserData {
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
          : DEFAULT_DISPLAY_NAME_PLACEHOLDER,
      character: DEFAULT_CHARACTER_IMAGE,
    },
    badges: migrateBadges(badgesRaw),
    equipment:
      p.equipment && typeof p.equipment === "object"
        ? (p.equipment as UserData["equipment"])
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
        ? (p.inventory as UserData["inventory"])
        : { items: {} },
    currencies: {
      coins: Number((p.currencies as Record<string, unknown> | undefined)?.coins) || 0,
      gems: Number((p.currencies as Record<string, unknown> | undefined)?.gems) || 0,
    },
  };
}
