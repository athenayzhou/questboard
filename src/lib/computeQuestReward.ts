import type { Quest } from "@/types/quest";
import { calculateXP } from "@/utils/skill/analysis/experience";
import { CURRENCY } from "@/utils/constants";

/** System-generated quests (seasonal, etc.) keep template `reward` (e.g. gems). */
export function isSystemGeneratedQuest(quest: Quest): boolean {
  return Boolean(quest.isSystemGenerated && quest.systemType);
}

/** Coins scale with the same inputs as skill XP (`calculateXP`). */
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

/** Player / non-system quests: XP + coins only (gems come from system templates). */
export function computePlayerQuestReward(
  quest: Quest
): NonNullable<Quest["reward"]> {
  return {
    xp: calculateXP(quest),
    coins: calculateQuestCoinReward(quest),
  };
}

/** Attach computed `reward` for player quests; leave system quests unchanged. */
export function withComputedReward(quest: Quest): Quest {
  if (isSystemGeneratedQuest(quest)) {
    return quest;
  }
  return {
    ...quest,
    reward: computePlayerQuestReward(quest),
  };
}
