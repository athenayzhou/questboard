export type CurrencyId = "coins" | "gems";


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

