import type { SystemItem, EquipSlot, Rarity } from "../types/system";
import type { ShopItem } from "../types/shop";

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
    id: "enchanted-sponge",
    name: "enchanted sponge",
    slot: "accessory",
    rarity: "ultra",
    description: "never wears out.",
  },
  {
    id: "traveler-cloak",
    name: "traveler's cloak",
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
    id: "quest-blade",
    name: "quest blade",
    slot: "weapon",
    rarity: "legendary",
    description: "for those who finish what they start.",
  },
];

export const MASTERY__ITEMS: Record<string, string> = {
  plan: "planner-satchel",
  clean: "enchanted-sponge",
  focus: "focus-band",
};

/** Shop catalog: items available to purchase. Uses system item ids. */
export const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  { id: "shop-planner-satchel", itemId: "planner-satchel", price: 80, currency: "coins", requiredMasteryVerb: "plan" },
  { id: "shop-focus-band", itemId: "focus-band", price: 120, currency: "coins", requiredMasteryVerb: "focus" },
  { id: "shop-enchanted-sponge", itemId: "enchanted-sponge", price: 200, currency: "coins", requiredMasteryVerb: "clean" },
  { id: "shop-traveler-cloak", itemId: "traveler-cloak", price: 30, currency: "coins" },
  { id: "shop-lucky-coin", itemId: "lucky-coin", price: 25, currency: "coins" },
  { id: "shop-quest-blade", itemId: "quest-blade", price: 15, currency: "gems" },
];


export function getSystemItemById(id: string): SystemItem | undefined {
  return SYSTEM_ITEMS.find((item) => item.id === id);
}

export function getSystemItemBySlot(slot: EquipSlot):  SystemItem[] {
  return SYSTEM_ITEMS.filter((item) => item.slot === slot);
}

export function getSystemItemByRarity(rarity: Rarity): SystemItem[]{
  return SYSTEM_ITEMS.filter((item) => item.rarity === rarity);
}