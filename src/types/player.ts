import type { EquipSlot } from "./system";
import type { CurrencyId } from "./system";

export type PlayerProfile = {
  name: string;
  character?: string;
};

/** Normalized 0–1 coordinates within the name-plate badge layer (center anchor). */
export type BadgePlatePlacement = {
  id: string;
  x: number;
  y: number;
};

/** Unlocked badges + which ones appear on the name plate and where. */
export type PlayerBadges = {
  unlockedBadges: string[];
  /** Badges shown on the 3D / profile name plate (subset of unlocked). */
  displayedBadgeIds: string[];
  /** Positions for badges in `displayedBadgeIds`. */
  badgePlacements: BadgePlatePlacement[];
};

export type PlayerEquipment = {
  equipped: Record<EquipSlot, string | null>;
};
export type PlayerItem = {
  quantity: number;
  acquiredAt?: string;
};
export type PlayerInventory = {
  items: Record<string, PlayerItem>;
};
export type PlayerCurrencies = {
  [currency in CurrencyId]: number;
};

export type PlayerData = {
  profile: PlayerProfile;
  badges: PlayerBadges;
  equipment: PlayerEquipment;
  inventory: PlayerInventory;
  currencies: PlayerCurrencies;
};
