import { create } from "zustand";
import type { PlayerData } from "../types/player";
import type { CurrencyId } from "../types/system";
import { getSystemItemById } from "../data/systemItems";
import { devLog } from "../dev/devLogs";
import { createDefaultPlayerData } from "@/lib/defaultPlayerData";
import { schedulePlayerSync } from "@/lib/apiPlayer";

type PlayerStore = {
    player: PlayerData;
    setPlayer: (p: PlayerData) => void;
    unlockTitle: (title: string) => void;
    unlockBadge: (badge: string) => void;

    acquireItem: (itemId: string, quantity?: number) => void;
    addCurrency: (currency: CurrencyId, amount: number) => void;
    spendCurrency: (currency: CurrencyId, amount: number) => boolean;
};

export const usePlayerStore = create<PlayerStore>((set) => ({
    player: createDefaultPlayerData(),
    setPlayer: (player) => {
        set({ player });
        schedulePlayerSync();
    },

    unlockTitle: (title) => {
        set((state: PlayerStore): Partial<PlayerStore> => {
            const list = state.player.achievements.unlockedTitles ?? [];
            if (list.includes(title)) {
                return {};
            }
            devLog("player", `title acquired: "${title}"`);
            const nextPlayer: PlayerData = {
                ...state.player,
                achievements: {
                    ...state.player.achievements,
                    unlockedTitles: [...list, title],
                },
            };
            schedulePlayerSync();
            return { player: nextPlayer };
        });
    },

    unlockBadge: (badge) => {
        set((state: PlayerStore): Partial<PlayerStore> => {
            const list = state.player.achievements.unlockedBadges ?? [];
            if (list.includes(badge)) return {};
            devLog("player", `badge acquired: "${badge}"`);
            const nextPlayer: PlayerData = {
                ...state.player,
                achievements: {
                    ...state.player.achievements,
                    unlockedBadges: [...list, badge],
                },
            };
            schedulePlayerSync();
            return { player: nextPlayer };
        });
    },

    acquireItem: (itemId, quantity = 1) => {
        if (!quantity || quantity <= 0) return;
        const item = getSystemItemById(itemId);
        const itemName = item?.name ?? itemId;
        devLog("player", `item acquired: "${itemName}"`);
        set((state) => {
            const items = state.player.inventory.items ?? {};
            const existing = items[itemId];

            const nextQuantity = (existing?.quantity ?? 0) + quantity;
            const nextItems = {
                ...items,
                [itemId]: {
                    quantity: nextQuantity,
                    acquiredAt: existing?.acquiredAt ?? new Date().toISOString(),
                },
            };

            const nextPlayer: PlayerData = {
                ...state.player,
                inventory: { items: nextItems },
            };

            schedulePlayerSync();
            return { player: nextPlayer };
        });
    },

    addCurrency: (currency, amount) => {
        if (amount <= 0) return;
        devLog("player", `currency awarded: ${amount} ${currency}`);
        set((state) => {
            const currencies = state.player.currencies ?? {};
            const nextCurrencies = {
                ...currencies,
                [currency]: (currencies[currency] ?? 0) + amount,
            };
            const nextPlayer: PlayerData = {
                ...state.player,
                currencies: nextCurrencies,
            };
            schedulePlayerSync();
            return { player: nextPlayer };
        });
    },

    spendCurrency: (currency, amount) => {
        if (amount <= 0) return false;
        let success = false;
        set((state) => {
            const currencies = state.player.currencies ?? {};
            const balance = currencies[currency] ?? 0;
            if (balance < amount) return state;
            const nextCurrencies = {
                ...currencies,
                [currency]: balance - amount,
            };
            const nextPlayer: PlayerData = {
                ...state.player,
                currencies: nextCurrencies,
            };
            schedulePlayerSync();
            success = true;
            return { player: nextPlayer };
        });
        return success;
    },

}));

export const playerStore = usePlayerStore;