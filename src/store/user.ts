import { create } from "zustand";
import type { UserData } from "../types/user";
import type { CurrencyId } from "../types/system";
import { getSystemItemById } from "../data/systemItems";
import { devLog } from "../dev/devLogs";
import { createDefaultUserData } from "@/lib/defaultUserData";
import { normalizeUserData } from "@/lib/userData";
import { scheduleUserSync } from "@/lib/apiUser";

type UserStore = {
  user: UserData;
  setUser: (u: UserData) => void;
  unlockBadge: (badge: string) => void;

  acquireItem: (itemId: string, quantity?: number) => void;
  addCurrency: (currency: CurrencyId, amount: number) => void;
  spendCurrency: (currency: CurrencyId, amount: number) => boolean;
};

export const useUserStore = create<UserStore>((set) => ({
  user: createDefaultUserData(),
  setUser: (user) => {
    set({
      user: normalizeUserData(user),
    });
    scheduleUserSync();
  },

  unlockBadge: (badge) => {
    set((state: UserStore): Partial<UserStore> => {
      const list = state.user.badges.unlockedBadges ?? [];
      if (list.includes(badge)) return {};
      devLog("user", `badge acquired: "${badge}"`);
      const nextUser: UserData = {
        ...state.user,
        badges: {
          ...state.user.badges,
          unlockedBadges: [...list, badge],
        },
      };
      scheduleUserSync();
      return { user: nextUser };
    });
  },

  acquireItem: (itemId, quantity = 1) => {
    if (!quantity || quantity <= 0) return;
    const item = getSystemItemById(itemId);
    const itemName = item?.name ?? itemId;
    devLog("user", `item acquired: "${itemName}"`);
    set((state) => {
      const items = state.user.inventory.items ?? {};
      const existing = items[itemId];

      const nextQuantity = Math.min(
        1,
        (existing?.quantity ?? 0) + quantity,
      );
      const nextItems = {
        ...items,
        [itemId]: {
          quantity: nextQuantity,
          acquiredAt: existing?.acquiredAt ?? new Date().toISOString(),
        },
      };

      const nextUser: UserData = {
        ...state.user,
        inventory: { items: nextItems },
      };

      scheduleUserSync();
      return { user: nextUser };
    });
  },

  addCurrency: (currency, amount) => {
    if (amount <= 0) return;
    devLog("user", `currency awarded: ${amount} ${currency}`);
    set((state) => {
      const currencies = state.user.currencies ?? {};
      const nextCurrencies = {
        ...currencies,
        [currency]: (currencies[currency] ?? 0) + amount,
      };
      const nextUser: UserData = {
        ...state.user,
        currencies: nextCurrencies,
      };
      scheduleUserSync();
      return { user: nextUser };
    });
  },

  spendCurrency: (currency, amount) => {
    if (amount <= 0) return false;
    let success = false;
    set((state) => {
      const currencies = state.user.currencies ?? {};
      const balance = currencies[currency] ?? 0;
      if (balance < amount) return state;
      const nextCurrencies = {
        ...currencies,
        [currency]: balance - amount,
      };
      const nextUser: UserData = {
        ...state.user,
        currencies: nextCurrencies,
      };
      scheduleUserSync();
      success = true;
      return { user: nextUser };
    });
    return success;
  },
}));

export const userStore = useUserStore;
