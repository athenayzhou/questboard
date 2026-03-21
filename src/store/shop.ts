import { create } from "zustand";
import type { ShopItem } from "../types/shop";
import { usePlayerStore } from "./player";
import { useMasteryStore } from "./mastery";

type PurchaseResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "not_found"
        | "insufficient_funds"
        | "missing_mastery"
        | "already_owned";
    };

type ShopState = {
  items: ShopItem[];

  getAll: () => ShopItem[];
  getById: (id: string) => ShopItem | undefined;
  setItems: (items: ShopItem[]) => void;

  purchase: (shopItemId: string) => PurchaseResult;
};

export const useShopStore = create<ShopState>((set, get) => ({
  items: [],

  getAll: () => get().items,

  getById: (id) => get().items.find((item) => item.id === id),

  setItems: (items) => {
    set({ items });
  },

  purchase: (shopItemId) => {
    const shopItem = get().items.find((it) => it.id === shopItemId);
    if(!shopItem) {
      return { ok: false, reason: "not_found" as const };
    }

    const playerState = usePlayerStore.getState();
    const masteryState = useMasteryStore.getState();

    if(shopItem.requiredMasteryVerb){
      const verbNorm = shopItem.requiredMasteryVerb.toLowerCase().trim();
      const hasMastery = masteryState
        .getAll()
        .some((m) => m.verb.toLowerCase().trim() === verbNorm);
      if(!hasMastery) {
        return { ok: false, reason: "missing_mastery" as const};
      }
    }

    const ownedQty =
      playerState.player.inventory.items[shopItem.itemId]?.quantity ?? 0;
    if (ownedQty >= 1) {
      return { ok: false, reason: "already_owned" as const };
    }

    const spent = playerState.spendCurrency(shopItem.currency, shopItem.price);
    if(!spent) {
      return { ok: false, reason: "insufficient_funds" as const };
    }

    playerState.acquireItem(shopItem.itemId, 1);
    return { ok: true };
  },


}));