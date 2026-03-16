import type { PlayerData } from "../../types/player";

export const TEST_PLAYER_DATA: PlayerData = {
    profile: {
        name: "donna"
    },
    achievements: {
        activeTitle: "amateur_stewer",
        activeBadge: "daily_streak",
        unlockedTitles: ["amateur_stewer", "human_dishwasher"],
        unlockedBadges: ["daily_streak"]
    },
    equipment: {
        equipped: {
            head: "pink_bandana",
            body: "yellow_apron",
            accessory: null,
            weapon: "soup_ladle",
        },
    },
    inventory: {
        items: {
            soup_ladle:       { quantity: 1, acquiredAt: "2026-02-07" },
            yellow_apron:     { quantity: 1, acquiredAt: "2026-02-07" },
            pink_bandana:     { quantity: 1, acquiredAt: "2026-02-07" },
            salt_shaker:      { quantity: 1, acquiredAt: "2026-02-07" },
            thin_frame_glasses: { quantity: 1, acquiredAt: "2026-02-08" },
        },
    },
    currencies: {
        coins: 0,
        gems: 0,
    },
}