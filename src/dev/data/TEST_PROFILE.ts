import type { PlayerData } from "../../types/player";

export const TEST_PLAYER_DATA: PlayerData = {
    profile: {
        name: "donna",
        character: "/donna.png",
    },
    achievements: {
        activeTitle: "amateur_stewer",
        activeBadge: "daily_streak",
        unlockedTitles: ["amateur_stewer", "human_dishwasher"],
        unlockedBadges: ["daily_streak"]
    },
    equipment: {
        equipped: {
            head: "pink-headband",
            body: "yellow-apron",
            accessory: "salt-shaker",
            weapon: "soup-ladle",
        },
    },
    inventory: {
        items: {
            "pink-headband": { quantity: 1, acquiredAt: "2026-02-07" },
            "yellow-apron": { quantity: 1, acquiredAt: "2026-02-07" },
            "sturdy-sponge": { quantity: 1, acquiredAt: "2026-02-07" },
            "soup-ladle": { quantity: 1, acquiredAt: "2026-02-07" },
            "salt-shaker": { quantity: 2, acquiredAt: "2026-02-08" },
        },
    },
    currencies: {
        coins: 250,
        gems: 50,
    },
}