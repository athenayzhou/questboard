import type { Quest } from "@/types/quest";
import { useUserStore } from "@/store/user";
import { calculateQuestCoinReward } from "@/lib/computeQuestReward";

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


export function grantQuestRewards(quest: Quest): void {
  const user = useUserStore.getState();

  if (quest.systemType === "seasonal") {
    const gems = getRewardGems(quest.reward);
    if (gems > 0) user.addCurrency("gems", gems);
    return;
  }

  if (quest.systemType === "tutorial") {
    const coins = getRewardCoins(quest.reward);
    if (coins > 0) user.addCurrency("coins", coins);
    const gems = getRewardGems(quest.reward);
    if (gems > 0) user.addCurrency("gems", gems);
    const items = quest.reward?.items;
    if (items?.length) {
      for (const itemId of items) {
        user.acquireItem(itemId, 1);
      }
    }
    return;
  }

  const coins = calculateQuestCoinReward(quest);
  if (coins > 0) user.addCurrency("coins", coins);
}
