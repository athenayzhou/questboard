import { create } from "zustand";
import type { PlayerData } from "../types/player";
import type { CurrencyId } from "../types/system";
import { getSystemItemById } from "../data/systemItems";
import { devLog } from "../dev/devLogs";

const STORAGE_KEY = "playerData";

function loadPlayer(): PlayerData | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if(!raw) return null;
        const parsed =  JSON.parse(raw);
        parsed.currencies = {
          coins: parsed.currencies?.coins ?? 0,
          gems: parsed.currencies?.gems ?? 0,
        };
        return parsed as PlayerData;
    } catch {
        return null;
    }
}
function savePlayer(player: PlayerData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
}

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
    player: loadPlayer() ?? {
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
    },
    setPlayer: (player) => {
        savePlayer(player);
        set({ player });
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
            savePlayer(nextPlayer);
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
            savePlayer(nextPlayer);
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

            savePlayer(nextPlayer);
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
            savePlayer(nextPlayer);
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
            savePlayer(nextPlayer);
            success = true;
            return { player: nextPlayer };
        });
        return success;
    },

}));

export const playerStore = usePlayerStore;