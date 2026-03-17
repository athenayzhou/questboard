import type { SystemItem, EquipSlot, Rarity } from "../types/system";
import type { ShopItem } from "../types/shop";

/** Base path for item images in public/item/ */
export const ITEM_IMAGE_BASE = "/item";

/** Returns the icon URL for an item by id (public/item/{id}.png) */
export function getItemIconUrl(id: string): string {
  return `${ITEM_IMAGE_BASE}/${id}.png`;
}

export const RARITY_COLORS: Record<string, string> = {
    common: "#777",
    rare: "#4f8cff",
    ultra: "#b86cff",
    legendary: "#ffb347"
}

export const SYSTEM_ITEMS: SystemItem[] = [
  {
    id: "planner-satchel",
    name: "planner's satchel",
    slot: "accessory",
    rarity: "rare",
    description: "a well loved bag that hums when plans finally click.",
  },
  {
    id: "focus-band",
    name: "focus band",
    slot: "head",
    rarity: "rare",
    description: "helps you stay on task.",
  },
  {
    id: "sturdy-sponge",
    name: "sturdy sponge",
    slot: "accessory",
    rarity: "ultra",
    description: "never wears out.",
  },
  {
    id: "enchanted-cloak",
    name: "enchanted cloak",
    slot: "body",
    rarity: "common",
    description: "light and durable.",
  },
  {
    id: "lucky-coin",
    name: "lucky coin",
    slot: "accessory",
    rarity: "common",
    description: "a small charm.",
  },
  {
    id: "soup-ladle",
        name: "soup ladle",
        slot: "weapon",
        rarity: "legendary",
        description: "stirs good soup"
    },
  {
        id: "yellow-apron",
        name: "yellow apron",
        slot: "body",
        rarity: "common",
    },
{
        id: "pink-bandana",
        name: "pink bandana",
        slot: "head",
        rarity: "rare",
    },
  {
        id: "salt-shaker",
        name: "salt shaker",
        slot: "accessory",
        rarity: "ultra",
        description: "ultimate battle resource in cooking"
    },
];

export const MASTERY__ITEMS: Record<string, string> = {
  plan: "planner-satchel",
  clean: "sturdy-sponge",
  focus: "focus-band",
};


export const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  { id: "shop-planner-satchel", itemId: "planner-satchel", price: 80, currency: "coins", requiredMasteryVerb: "plan" },
  { id: "shop-focus-band", itemId: "focus-band", price: 120, currency: "coins", requiredMasteryVerb: "focus" },
  { id: "shop-sturdy-sponge", itemId: "sturdy-sponge", price: 200, currency: "coins", requiredMasteryVerb: "clean" },
  { id: "shop-enchanged-cloak", itemId: "enchanted-cloak", price: 30, currency: "coins" },
  { id: "shop-lucky-coin", itemId: "lucky-coin", price: 25, currency: "gems" },
];


export const SYSTEM_ITEMS_BY_ID: Record<string, SystemItem> = Object.fromEntries(
  SYSTEM_ITEMS.map((item) => [item.id, item])
);

export function getSystemItemById(id: string): SystemItem | undefined {
  return SYSTEM_ITEMS.find((item) => item.id === id);
}

export function getSystemItemBySlot(slot: EquipSlot):  SystemItem[] {
  return SYSTEM_ITEMS.filter((item) => item.slot === slot);
}

export function getSystemItemByRarity(rarity: Rarity): SystemItem[]{
  return SYSTEM_ITEMS.filter((item) => item.rarity === rarity);
}