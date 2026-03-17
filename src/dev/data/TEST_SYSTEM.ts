import type { SystemItem, SystemTitle, SystemBadge } from "../../types/system";

export const TEST_SYSTEM_ITEMS: Record<string, SystemItem> = {
    soup_ladle: {
        id: "soup_ladle",
        name: "soup ladle",
        slot: "weapon",
        rarity: "legendary",
        description: "stirs good soup"
    },
    yellow_apron: {
        id: "yellow_apron",
        name: "yellow apron",
        slot: "body",
        rarity: "common",
    },
    pink_bandana: {
        id: "pink_bandana",
        name: "pink bandana",
        slot: "head",
        rarity: "rare",
    },
    salt_shaker: {
        id: "salt_shaker",
        name: "salt shaker",
        slot: "accessory",
        rarity: "ultra",
        description: "ultimate battle resource in cooking"
    },
    thin_frame_glasses: {
        id: "thin_frame_glasses",
        name: "thin frame glasses",
        slot: "accessory",
        rarity: "legendary",
    }
}

export const TEST_SYSTEM_TITLES: Record<string, SystemTitle> = {
    amateur_stewer: {
        id: "amateur_stewer",
        display: "amateur stewer",
        description: "bad at making soup"
    },
    human_dishwasher: {
        id: "human_dishwasher",
        display: "human dishwasher",
        description: "washes dishes faster than average machine dishwasher cycle"
    },
    confection_visionary: {
        id: "confection_visionary",
        display: "confection visionary",
    },
    garden_caretaker: {
        id: "garden_caretaker",
        display: "garden caretaker",
    },
}

export const TEST_SYSTEM_BADGES: Record<string, SystemBadge> = {
  daily_streak: { id: "daily_streak", display: "daily streak" },
  productive_bursts: { id: "productive_bursts", display: "productive bursts" },
  quest_crusher: { id: "quest_crusher", display: "quest crusher" },
  well_rounded: { id: "well_rounded", display: "well rounded" },
  back_in_saddle: { id: "back_in_saddle", display: "back in the saddle" },
  daredevil: { id: "daredevil", display: "daredevil" },
  on_time: { id: "on_time", display: "on time" },
  deep_diver: { id: "deep_diver", display: "deep diver" },
  perfectionist: { id: "perfectionist", display: "perfectionist" },
  steady_pace: { id: "steady_pace", display: "steady pace" },
  jack_of_all_trades: { id: "jack_of_all_trades", display: "jack of all trades" },
  phoenix: { id: "phoenix", display: "phoenix" },
  early_bird: { id: "early_bird", display: "early bird" },
  century_club: { id: "century_club", display: "century club" },
  specialist: { id: "specialist", display: "specialist" },
};