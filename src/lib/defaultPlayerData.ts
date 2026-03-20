import type { PlayerData } from "@/types/player";

/** Fresh player profile for resets / signed-out state (matches store defaults). */
export function createDefaultPlayerData(): PlayerData {
  return {
    profile: { name: "player" },
    achievements: {
      unlockedTitles: [],
      unlockedBadges: [],
      activeTitle: null,
      activeBadge: null,
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
