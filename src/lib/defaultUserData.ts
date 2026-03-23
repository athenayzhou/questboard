import type { UserData } from "@/types/user";

export const DEFAULT_DISPLAY_NAME_PLACEHOLDER = "default_no_name";

export function isUnsetDisplayName(name: string): boolean {
  const n = name.trim().toLowerCase();
  return (
    n === "" ||
    n === DEFAULT_DISPLAY_NAME_PLACEHOLDER.toLowerCase()
  );
}

export function isReservedDisplayName(name: string): boolean {
  return name.trim().toLowerCase() === DEFAULT_DISPLAY_NAME_PLACEHOLDER.toLowerCase();
}


export function createDefaultUserData(): UserData {
  return {
    profile: { name: DEFAULT_DISPLAY_NAME_PLACEHOLDER },
    badges: {
      unlockedBadges: [],
      displayedBadgeIds: [],
      badgePlacements: [],
    },
    equipment: {
      equipped: {
        head: null,
        body: null,
        accessory: null,
        weapon: null,
      },
    },
    inventory: { items: {} },
    currencies: {
      coins: 0,
      gems: 0,
    },
  };
}
