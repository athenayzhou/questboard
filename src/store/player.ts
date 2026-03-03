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
}));

export const playerStore = usePlayerStore;