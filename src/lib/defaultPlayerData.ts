import type { PlayerData } from "@/types/player";

export function createDefaultPlayerData(): PlayerData {
  return {
    profile: { name: "player" },
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
