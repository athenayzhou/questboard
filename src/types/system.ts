export type CurrencyId = "coins" | "gems";
export type EquipSlot = "head" | "body" | "accessory" | "weapon";


export type SystemItem = {
    id: string;
    name: string;
    slot: EquipSlot;
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

