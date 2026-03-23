import type { EquipSlot } from "./system";
import type { CurrencyId } from "./system";

export type UserProfile = {
  name: string;
  character?: string;
};

export type BadgePlatePlacement = {
  id: string;
  x: number;
  y: number;
};

export type UserBadges = {
  unlockedBadges: string[];
  displayedBadgeIds: string[];
  badgePlacements: BadgePlatePlacement[];
};

export type UserEquipment = {
  equipped: Record<EquipSlot, string | null>;
};
export type UserItem = {
  quantity: number;
  acquiredAt?: string;
};
export type UserInventory = {
  items: Record<string, UserItem>;
};
export type UserCurrencies = {
  [currency in CurrencyId]: number;
};

export type UserData = {
  profile: UserProfile;
  badges: UserBadges;
  equipment: UserEquipment;
  inventory: UserInventory;
  currencies: UserCurrencies;
};
