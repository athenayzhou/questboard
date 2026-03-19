import type { EquipSlot } from "./system";
import type { CurrencyId } from "./system";

export type PlayerProfile = {
    name: string;
    // Optional character image path (e.g. `/donna.png` from `public/`)
    character?: string;
}
export type PlayerAchievements = {
    unlockedTitles: string[];
    unlockedBadges: string[];
    activeTitle: string | null;
    activeBadge: string | null;
}
export type PlayerEquipment = {
    equipped: Record<EquipSlot, string | null>;
}
export type PlayerItem = {
    quantity: number;
    acquiredAt?: string;
}
export type PlayerInventory = {
    items: Record<string, PlayerItem>
}
export type PlayerCurrencies = {
    [currency in CurrencyId]: number;
}


export type PlayerData = {
    profile: PlayerProfile;
    achievements: PlayerAchievements;
    equipment: PlayerEquipment;
    inventory: PlayerInventory;
    currencies: PlayerCurrencies;
}
