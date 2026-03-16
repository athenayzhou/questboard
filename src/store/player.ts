import { create } from "zustand";
import type { PlayerData } from "../types/profile";

const STORAGE_KEY = "playerData";

function loadPlayer(): PlayerData | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
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
            }
        },
        inventory: { items: {} },
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

}));

export const playerStore = usePlayerStore;