import { describe, it, expect, beforeEach } from "vitest";
import { getRewardCoins, grantQuestRewards } from "../../lib/questRewards";
import { useUserStore } from "../../store/user";
import type { Quest } from "../../types/quest";
import { createDefaultUserData } from "../../lib/defaultUserData";
import { calculateQuestCoinReward } from "../../lib/computeQuestReward";

describe("questRewards", () => {
  beforeEach(() => {
    useUserStore.setState({ user: createDefaultUserData() });
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
    expect(useUserStore.getState().user.currencies.gems).toBe(3);
    expect(useUserStore.getState().user.currencies.coins).toBe(0);
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
    expect(useUserStore.getState().user.currencies.coins).toBe(expected);
    expect(useUserStore.getState().user.currencies.gems).toBe(0);
  });

  it("tutorial grants template coins and items, not XP formula", () => {
    const q = {
      id: "tutorial-01-first-loop",
      title: "tutorial",
      difficulty: "easy",
      status: "accepted",
      createdAt: Date.now(),
      systemType: "tutorial",
      isSystemGenerated: true,
      reward: { coins: 10, items: ["lucky-coin"] },
    } as Quest;
    grantQuestRewards(q);
    expect(useUserStore.getState().user.currencies.coins).toBe(10);
    expect(
      useUserStore.getState().user.inventory.items["lucky-coin"]?.quantity,
    ).toBe(1);
  });
});
