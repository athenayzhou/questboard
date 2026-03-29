import type { TutorialQuest } from "./tutorialTypes";

export const TUTORIAL_QUEST_TEMPLATES: TutorialQuest[] = [
  {
    templateId: "tutorial-01-first-loop",
    chainIndex: 0,
    title: "Accept & Add Quests",
    description:
      "we'll walk you through accepting, creating, and completing quests",
    reward: { coins: 12 },
    subquests: [
      {
        id: "t01-a0",
        title: "open quest board",
        omitFromQuest: true,
        spotlight: "entry-quests",
      },
      {
        id: "t01-a1",
        title: "open tutorial quest",
        omitFromQuest: true,
        spotlight: "board-tutorial-card-available",
      },
      {
        id: "t01-a2",
        title: "accept this quest",
        omitFromQuest: false,
        spotlight: "qp-accept",
      },
      {
        id: "t01-a4",
        title: "open tutorial quest",
        omitFromQuest: true,
        spotlight: "board-tutorial-card-accepted",
      },
      {
        id: "t01-a5",
        title: "pin this quest",
        omitFromQuest: false,
        spotlight: "qp-pin",
      },
      {
        id: "t01-a6",
        title: "expand active panel",
        omitFromQuest: true,
        spotlight: "pinned-handle",
      },
      {
        id: "t01-a7",
        title: "add a new quest",
        omitFromQuest: false,
        spotlight: "board-add-quest",
      },
      {
        id: "t01-a7b",
        title: "create your quest",
        omitFromQuest: false,
        spotlight: "addq-submit",
      },
      {
        id: "t01-a8",
        title: "open active panel",
        omitFromQuest: true,
        spotlight: "pinned-strip",
      },
      {
        id: "t01-a9",
        title: "complete from panel",
        omitFromQuest: true,
        spotlight: "pinned-complete",
      },
    ],
  },
  {
    templateId: "tutorial-02-quest-log",
    chainIndex: 1,
    title: "Check Quest Log",
    description:
      "completed and failed runs land in the quest log. rows with the same title stay grouped. use 'add as new quest' on a row to create a fresh copy with similar settings.",
    reward: { coins: 12 },
    subquests: [
      {
        id: "t02-a",
        title: "open quest log",
        omitFromQuest: true,
        spotlight: "entry-logs",
      },
      {
        id: "t02-b",
        title: "browse log entries",
        omitFromQuest: true,
        spotlight: "log-browse-entry",
      },
    ],
  },
  {
    templateId: "tutorial-03-nameplate",
    chainIndex: 2,
    title: "Use New Badge",
    description:
      "add your new badge to the nameplate",
    reward: { coins: 12 },
    subquests: [
      {
        id: "t03-a",
        title: "open profile",
        omitFromQuest: false,
        spotlight: "entry-profile",
      },
      {
        id: "t03-c",
        title: "add badge to nameplate",
        omitFromQuest: false,
        spotlight: "profile-badges",
      },
      {
        id: "t03-d",
        title: "save profile",
        omitFromQuest: false,
        spotlight: "profile-save",
      },
    ],
  },
  {
    templateId: "tutorial-04-skill-ledger",
    chainIndex: 3,
    title: "Look at New Skill",
    description:
      "skills are the habits and strengths you grow by questing. matching quests to a skill earns XP, raises its level, and can feed mastery paths. browse skills, open one to see XP history and activity, co-occurring skills, and rename anything you’ve named before in the skill ledger.",
    reward: { coins: 14 },
    subquests: [
      {
        id: "t04-a",
        title: "open skill ledger",
        omitFromQuest: true,
        spotlight: "entry-skills",
      },
      {
        id: "t04-b",
        title: "expand skill details",
        omitFromQuest: true,
        spotlight: "ledger-skill-row",
      },
    ],
  },
  {
    templateId: "tutorial-05-shop",
    chainIndex: 4,
    title: "Buy an Item and Equip it",
    description:
      "use tutorial money to buy something from the shop",
    reward: { items: ["lucky-coin"] },
    subquests: [
      {
        id: "t05-profile",
        title: "open profile",
        omitFromQuest: true,
        spotlight: "entry-profile",
      },
      {
        id: "t05-shoplink",
        title: "open shop",
        omitFromQuest: true,
        spotlight: "profile-shop",
      },
      {
        id: "t05-d",
        title: "buy an item",
        omitFromQuest: true,
        spotlight: "shop-starter-buy",
      },
      {
        id: "t05-e",
        title: "close shop",
        omitFromQuest: true,
        spotlight: "close-shop",
      },
      {
        id: "t05-f",
        title: "equip item",
        omitFromQuest: true,
        spotlight: "inventory",
      },
      {
        id: "t05-save",
        title: "save changes",
        omitFromQuest: true,
        spotlight: "profile-save",
      },
    ],
  },
];

export function getTutorialTemplate(
  id: TutorialQuest["templateId"],
): TutorialQuest | undefined {
  return TUTORIAL_QUEST_TEMPLATES.find((t) => t.templateId === id);
}
