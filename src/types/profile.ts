export type EquipSlot = "head" | "body" | "accessory" | "weapon";
export type Rarity = "common" | "rare" | "ultra" | "legendary";


export type SystemItem = {
    id: string;
    name: string;
    slot: EquipSlot;
    rarity: Rarity;
    icon?: string;
    description?: string;
}
export type SystemTitle = {
    id: string;
    display: string;
    description?: string;
}
export type SystemBadge = {
    id: string;
    display: string;
    icon?: string;
}


export type PlayerProfile = {
    name: string;
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


export type PlayerData = {
    profile: PlayerProfile;
    achievements: PlayerAchievements;
    equipment: PlayerEquipment;
    inventory: PlayerInventory;
}
