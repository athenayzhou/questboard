/**
 * Fixtures for DB beta seed (`db:seed-beta`) and any scripts that import this module.
 * Not used in production builds unless the env flag is set.
 */
import type { PlayerData } from "@/types/player";
import type { Quest } from "@/types/quest";
import type { Skill } from "@/types/skills";
import type { Mastery } from "@/types/skills";
import { SYSTEM_BADGES } from "@/data/systemBadges";
import { SYSTEM_ITEMS } from "@/data/systemItems";
import { withComputedReward } from "@/lib/computeQuestReward";

export const ALL_BADGE_IDS = Object.keys(SYSTEM_BADGES);

const ISO = () => new Date().toISOString().slice(0, 10);

export function buildDevInventory(): PlayerData["inventory"]["items"] {
  return Object.fromEntries(
    SYSTEM_ITEMS.map((item) => [
      item.id,
      { quantity: 2, acquiredAt: ISO() },
    ])
  );
}

export function buildRichDevPlayer(): PlayerData {
  return {
    profile: {
      name: "dev atheba",
      character: "/donna.png",
    },
    badges: {
      unlockedBadges: [...ALL_BADGE_IDS],
      displayedBadgeIds: ["daily-streak", "productive-bursts", "quest-crusher"],
      badgePlacements: [
        { id: "daily-streak", x: 0.1, y: 0.1 },
        { id: "productive-bursts", x: 0.5, y: 0.08 },
        { id: "quest-crusher", x: 0.9, y: 0.1 },
      ],
    },
    equipment: {
      equipped: {
        head: "pink-headband",
        body: "yellow-apron",
        accessory: "salt-shaker",
        weapon: "soup-ladle",
      },
    },
    inventory: { items: buildDevInventory() },
    currencies: { coins: 9_999, gems: 999 },
  };
}

const now = Date.now();
const day = 86400000;

/** UUIDs for `quests` / `skills` rows and `/api/me/*` sync (Postgres requires uuid). */
export const RICH_DEV_QUEST_IDS = {
  washDishes: "e1000001-0000-4000-8000-000000000001",
  cookDinner: "e1000002-0000-4000-8000-000000000002",
  foldLaundry: "e1000003-0000-4000-8000-000000000003",
  groceryRun: "e1000004-0000-4000-8000-000000000004",
  deepClean: "e1000005-0000-4000-8000-000000000005",
  organizeCloset: "e1000006-0000-4000-8000-000000000006",
} as const;

export const RICH_DEV_SKILL_IDS = {
  soup: "f1000001-0000-4000-8000-000000000001",
  stew: "f1000002-0000-4000-8000-000000000002",
  dishes: "f1000003-0000-4000-8000-000000000003",
  floor: "f1000004-0000-4000-8000-000000000004",
  plan: "f1000005-0000-4000-8000-000000000005",
} as const;

const skillBase = {
  proficiency: 0.6,
  firstSeenAt: now - day * 40,
  lastSeenAt: now - day,
  lastDecayAt: now,
  isDormant: false,
} as const;


export const RICH_DEV_SKILLS: Record<string, Skill> = {
  [RICH_DEV_SKILL_IDS.soup]: {
    ...skillBase,
    id: RICH_DEV_SKILL_IDS.soup,
    key: "cook:soup",
    name: "soup craft",
    verb: "cook",
    objects: ["soup", "broth"],
    xp: 3200,
  },
  [RICH_DEV_SKILL_IDS.stew]: {
    ...skillBase,
    id: RICH_DEV_SKILL_IDS.stew,
    key: "cook:stew",
    name: "stew timing",
    verb: "cook",
    objects: ["stew", "stock"],
    xp: 2800,
  },
  [RICH_DEV_SKILL_IDS.dishes]: {
    ...skillBase,
    id: RICH_DEV_SKILL_IDS.dishes,
    key: "clean:dishes",
    name: "dish washing",
    verb: "clean",
    objects: ["dishes", "sink"],
    xp: 2600,
  },
  [RICH_DEV_SKILL_IDS.floor]: {
    ...skillBase,
    id: RICH_DEV_SKILL_IDS.floor,
    key: "clean:floor",
    name: "floor care",
    verb: "clean",
    objects: ["floor", "mop"],
    xp: 2200,
  },
  [RICH_DEV_SKILL_IDS.plan]: {
    ...skillBase,
    id: RICH_DEV_SKILL_IDS.plan,
    key: "plan:week",
    name: "weekly planning",
    verb: "plan",
    objects: ["calendar", "tasks"],
    xp: 1500,
  },
};

export const RICH_DEV_MASTERIES: Mastery[] = [
  {
    id: "dev-mastery-cook",
    verb: "cook",
    name: "soup & stew",
    title: "master of cook",
    earnedAt: now - day * 5,
    skillIds: [RICH_DEV_SKILL_IDS.soup, RICH_DEV_SKILL_IDS.stew],
  },
  {
    id: "dev-mastery-clean",
    verb: "clean",
    name: "dishes & floor",
    title: "master of clean",
    earnedAt: now - day * 3,
    skillIds: [RICH_DEV_SKILL_IDS.dishes, RICH_DEV_SKILL_IDS.floor],
  },
];

/**
 * Sample quests for rich dev + DB beta seed: every status plus some pinned.
 * IDs are UUIDs so `/api/me/quests` sync works in dev-rich mode.
 */
export const RICH_DEV_QUESTS: Quest[] = [
  {
    id: RICH_DEV_QUEST_IDS.washDishes,
    title: "wash the dishes",
    category: ["cleaning", "kitchen"],
    difficulty: "easy",
    priority: "low",
    frequency: "daily",
    duration: 15,
    subquests: [
      {
        id: `${RICH_DEV_QUEST_IDS.washDishes}-rinse`,
        title: "rinse dishes",
        completed: false,
      },
      {
        id: `${RICH_DEV_QUEST_IDS.washDishes}-soap`,
        title: "wash with soap",
        completed: false,
      },
      {
        id: `${RICH_DEV_QUEST_IDS.washDishes}-dry`,
        title: "dry and put away",
        completed: false,
      },
    ],
    status: "available",
    pinned: true,
    order: 0,
    createdAt: now - day * 2,
    completedAt: null,
  },
  {
    id: RICH_DEV_QUEST_IDS.cookDinner,
    title: "cook dinner",
    category: ["cooking", "kitchen"],
    difficulty: "medium",
    priority: "low",
    frequency: "daily",
    duration: 45,
    status: "available",
    pinned: false,
    createdAt: now - day,
    completedAt: null,
  },
  {
    id: RICH_DEV_QUEST_IDS.foldLaundry,
    title: "fold laundry",
    category: ["cleaning", "hallway"],
    difficulty: "easy",
    priority: "low",
    frequency: "weekly",
    duration: 30,
    status: "accepted",
    pinned: true,
    order: 1,
    createdAt: now - day * 3,
    completedAt: null,
  },
  {
    id: RICH_DEV_QUEST_IDS.groceryRun,
    title: "grocery run",
    category: ["errands", "kitchen"],
    difficulty: "medium",
    priority: "high",
    frequency: "weekly",
    duration: 60,
    status: "accepted",
    pinned: false,
    createdAt: now - day * 4,
    completedAt: null,
  },
  {
    id: RICH_DEV_QUEST_IDS.deepClean,
    title: "deep clean bathroom",
    category: ["cleaning", "bathroom"],
    difficulty: "hard",
    priority: "low",
    frequency: "monthly",
    duration: 90,
    status: "completed",
    pinned: false,
    createdAt: now - day * 10,
    completedAt: now - day * 2,
  },
  {
    id: RICH_DEV_QUEST_IDS.organizeCloset,
    title: "organize closet",
    category: ["cleaning", "bedroom"],
    difficulty: "hard",
    priority: "low",
    frequency: "once",
    duration: 120,
    reward: { xp: 25, coins: 12 },
    status: "failed",
    pinned: false,
    createdAt: now - day * 8,
    completedAt: now - day * 1,
  },
];

export function buildRichDevQuests(): Quest[] {
  return RICH_DEV_QUESTS.map((q) => {
    const base =
      q.status === "accepted" && q.acceptedAt == null
        ? { ...q, acceptedAt: q.createdAt }
        : q;
    return withComputedReward(base);
  });
}
