import type { SystemItem, EquipSlot } from "../types/system";
import type { ShopItem } from "../types/shop";

export const ITEM_IMAGE_BASE = "/item";

export function getItemIconUrl(id: string): string {
  return `${ITEM_IMAGE_BASE}/${id}.png`;
}

export const SYSTEM_ITEMS: SystemItem[] = [
  {
    id: "planner-satchel",
    name: "planner's satchel",
    slot: "accessory",
    description: "a well loved bag that hums when plans finally click.",
  },
  {
    id: "focus-band",
    name: "focus band",
    slot: "head",
    description: "helps you stay on task.",
  },
  {
    id: "sturdy-sponge",
    name: "sturdy sponge",
    slot: "accessory",
    description: "never wears out",
  },
  {
    id: "enchanted-cloak",
    name: "enchanted cloak",
    slot: "body",
    description: "light and durable.",
  },
  {
    id: "lucky-coin",
    name: "lucky coin",
    slot: "accessory",
    description: "a small charm.",
  },
  {
    id: "soup-ladle",
    name: "soup ladle",
    slot: "weapon",
    description: "stirs good soup"
  },
  {
    id: "yellow-apron",
    name: "yellow apron",
    slot: "body",
    description: "yellow apron",
  },
  {
    id: "pink-headband",
    name: "pink headband",
    slot: "head",
    description: "cute headband",
  },
  {
    id: "salt-shaker",
    name: "salt shaker",
    slot: "accessory",
    description: "ultimate battle resource in cooking"
  },
  {
    id: "knights-helmet",
    name: "drifter's hood",
    slot: "head",
    description: "worn leather and stitched lining—keeps rain off the road.",
  },
  {
    id: "rangers-sash",
    name: "ranger's sash",
    slot: "accessory",
    description: "faded cloth and a few spare knots for charms and trail markers.",
  },
  {
    id: "rusty-sword",
    name: "rusty sword",
    slot: "weapon",
    description: "pitted steel and a loose grip—still points the right way.",
  },
  {
    id: "wayfinder-staff",
    name: "wayfinder staff",
    slot: "weapon",
    description: "knotted ash and iron ferrule; lean on it when the path gets long.",
  },
  {
    id: "field-jacket",
    name: "field jacket",
    slot: "body",
    description: "pockets for snacks and notes.",
  },
];

export const MASTERY__ITEMS: Record<string, string> = {
  plan: "planner-satchel",
  clean: "sturdy-sponge",
  focus: "focus-band",
};

export const STARTER_SHOP_ITEM_IDS: string[] = [
  "shop-knights-helmet",
  "shop-wayfinder-staff",
  "shop-rangers-sash",
  "shop-rusty-sword",
];

export const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  { id: "shop-knights-helmet", itemId: "knights-helmet", price: 50, currency: "coins" },
  { id: "shop-rangers-sash", itemId: "rangers-sash", price: 50, currency: "coins" },
  { id: "shop-rusty-sword", itemId: "rusty-sword", price: 50, currency: "coins" },
  { id: "shop-wayfinder-staff", itemId: "wayfinder-staff", price: 50, currency: "coins" },
  { id: "shop-enchanted-cloak", itemId: "enchanted-cloak", price: 75, currency: "coins" },
  { id: "shop-field-jacket", itemId: "field-jacket", price: 140, currency: "coins" },
  { id: "shop-yellow-apron", itemId: "yellow-apron", price: 95, currency: "coins" },
  { id: "shop-pink-headband", itemId: "pink-headband", price: 100, currency: "coins" },
  { id: "shop-salt-shaker", itemId: "salt-shaker", price: 60, currency: "coins" },
  { id: "shop-lucky-coin", itemId: "lucky-coin", price: 25, currency: "gems" },
  { id: "shop-planner-satchel", itemId: "planner-satchel", price: 280, currency: "coins", requiredMasteryVerb: "plan" },
  { id: "shop-focus-band", itemId: "focus-band", price: 120, currency: "coins", requiredMasteryVerb: "focus" },
  { id: "shop-sturdy-sponge", itemId: "sturdy-sponge", price: 200, currency: "coins", requiredMasteryVerb: "clean" },
  { id: "shop-soup-ladle", itemId: "soup-ladle", price: 180, currency: "coins", requiredMasteryVerb: "cook" },
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