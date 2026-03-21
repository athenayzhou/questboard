import { describe, it, expect, beforeEach } from "vitest";
import { getRewardCoins, getRewardGems, grantQuestRewards } from "../../lib/questRewards";
import { usePlayerStore } from "../../store/player";
import type { Quest } from "../../types/quest";
import { createDefaultPlayerData } from "../../lib/defaultPlayerData";
import { calculateQuestCoinReward } from "../../lib/computeQuestReward";

describe("questRewards", () => {
  beforeEach(() => {
    usePlayerStore.setState({ player: createDefaultPlayerData() });
  });

  it("maps legacy currency to coins", () => {
    expect(getRewardCoins({ currency: 12 })).toBe(12);
    expect(getRewardCoins({ coins: 5 })).toBe(5);
    expect(getRewardCoins({ coins: 5, currency: 12 })).toBe(5);
  });

  it("seasonal grants gems from template only", () => {
    const q = {
      id: "s1",
      title: "seasonal",
      difficulty: "medium",
      duration: 30,
      reward: { xp: 10, gems: 3, coins: 99 },
      systemType: "seasonal",
      isSystemGenerated: true,
      status: "accepted",
      createdAt: Date.now(),
    } as Quest;
    grantQuestRewards(q);
    expect(usePlayerStore.getState().player.currencies.gems).toBe(3);
    expect(usePlayerStore.getState().player.currencies.coins).toBe(0);
  });

  it("regular grants coins from formula, not stored reward", () => {
    const q = {
      id: "r1",
      title: "regular",
      difficulty: "easy",
      duration: 15,
      reward: { coins: 999, gems: 2 },
      status: "accepted",
      createdAt: Date.now(),
    } as Quest;
    const expected = calculateQuestCoinReward(q);
    grantQuestRewards(q);
    expect(usePlayerStore.getState().player.currencies.coins).toBe(expected);
    expect(usePlayerStore.getState().player.currencies.gems).toBe(0);
  });
});
