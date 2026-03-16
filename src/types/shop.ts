import type { CurrencyId } from "./system";

export type ShopItem = {
  id: string;
  itemId: string;
  price: number;
  currency: CurrencyId;
  requiredMasteryVerb?: string;
  seasonalTag?: string;
};