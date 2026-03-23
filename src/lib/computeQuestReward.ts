import type { Quest } from "@/types/quest";
import { calculateXP } from "@/utils/skill/analysis/experience";
import { CURRENCY } from "@/utils/constants";

export function isSystemGeneratedQuest(quest: Quest): boolean {
  return Boolean(quest.isSystemGenerated && quest.systemType);
}

export function calculateQuestCoinReward(quest: Quest): number {
  const xp = calculateXP(quest);
  const raw = Math.floor(xp / CURRENCY.QUEST_COINS_PER_XP);
  return Math.max(
    CURRENCY.QUEST_COINS_MIN,
    Math.min(
      CURRENCY.QUEST_COINS_MAX,
      raw > 0 ? raw : CURRENCY.QUEST_COINS_MIN
    )
  );
}

export function computePlayerQuestReward(
  quest: Quest
): NonNullable<Quest["reward"]> {
  return {
    xp: calculateXP(quest),
    coins: calculateQuestCoinReward(quest),
  };
}

export function withComputedReward(quest: Quest): Quest {
  if (isSystemGeneratedQuest(quest)) {
    return quest;
  }
  return {
    ...quest,
    reward: computePlayerQuestReward(quest),
  };
}
