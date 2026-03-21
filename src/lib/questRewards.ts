import type { Quest } from "@/types/quest";
import { usePlayerStore } from "@/store/player";
import { calculateQuestCoinReward } from "@/lib/computeQuestReward";

/** Legacy `reward.currency` counts as coins (display / saved rows only). */
export function getRewardCoins(reward: Quest["reward"]): number {
  if (!reward) return 0;
  if (typeof reward.coins === "number" && reward.coins > 0) return reward.coins;
  if (typeof reward.currency === "number" && reward.currency > 0)
    return reward.currency;
  return 0;
}

export function getRewardGems(reward: Quest["reward"]): number {
  const g = reward?.gems;
  return typeof g === "number" && g > 0 ? g : 0;
}

/**
 * Grants currency when a quest is completed. Amounts are **system-calculated** for player
 * quests; seasonal quests use template `reward.gems` only.
 */
export function grantQuestRewards(quest: Quest): void {
  const player = usePlayerStore.getState();

  if (quest.systemType === "seasonal") {
    const gems = getRewardGems(quest.reward);
    if (gems > 0) player.addCurrency("gems", gems);
    return;
  }

  const coins = calculateQuestCoinReward(quest);
  if (coins > 0) player.addCurrency("coins", coins);
}
