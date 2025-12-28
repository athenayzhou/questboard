import type { Quest } from "../types/quest";

export const TEST_DATA: Quest[] = [
  {
    id: "q-001",
    title: "Tidy the Desk Realm",
    description: "Clear visual clutter from your workspace to restore focus.",
    category: ["cleaning", "environment"],
    difficulty: "easy",
    priority: "low",
    frequency: "once",
    duration: 15,
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    status: "available",
    completedAt: null,
    subquests: [
      { id: "q-001-1", title: "Clear surface", completed: false },
      { id: "q-001-2", title: "Organize cables", completed: false }
    ]
  },
  {
    id: "q-002",
    title: "Prepare a Nourishing Meal",
    description: "Cook something warm and sustaining.",
    category: ["cooking", "self-care"],
    difficulty: "medium",
    priority: "high",
    frequency: "daily",
    duration: 45,
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    status: "accepted",
    completedAt: null,
    subquests: [
      { id: "q-002-1", title: "Choose recipe", completed: true },
      { id: "q-002-2", title: "Cook meal", completed: false },
      { id: "q-002-3", title: "Clean dishes", completed: false }
    ]
  },
  {
    id: "q-003",
    title: "Inbox Zero (Lite)",
    description: "Reduce inbox anxiety without aiming for perfection.",
    category: ["admin", "mental-load"],
    difficulty: "medium",
    frequency: "weekly",
    duration: 30,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    status: "completed",
    completedAt: Date.now() - 1000 * 60 * 60 * 2,
    subquests: [
      { id: "q-003-1", title: "Delete spam", completed: true },
      { id: "q-003-2", title: "Reply to 2 emails", completed: true }
    ]
  },
  {
    id: "q-004",
    title: "Stretch Between Worlds",
    description: "Reconnect with your body after long screen time.",
    category: ["health", "movement"],
    difficulty: "easy",
    frequency: "daily",
    duration: 10,
    createdAt: Date.now() - 1000 * 60 * 30,
    status: "accepted",
    completedAt: null,
    subquests: [
      { id: "q-004-1", title: "Neck stretch", completed: true },
      { id: "q-004-2", title: "Back stretch", completed: false }
    ]
  },
  {
    id: "q-005",
    title: "Laundry of Holding",
    description: "Wash, dry, and reclaim wearable inventory.",
    category: ["cleaning", "maintenance"],
    difficulty: "hard",
    frequency: "weekly",
    duration: 90,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    status: "failed",
    completedAt: Date.now() - 1000 * 60 * 60 * 12,
    subquests: [
      { id: "q-005-1", title: "Wash", completed: true },
      { id: "q-005-2", title: "Dry", completed: false },
      { id: "q-005-3", title: "Fold", completed: false }
    ]
  },
  {
    id: "q-006",
    title: "Step Outside Briefly",
    description: "Change scenery, even if just for a moment.",
    category: ["wellbeing", "exploration"],
    difficulty: "easy",
    frequency: "daily",
    duration: 5,
    createdAt: Date.now() - 1000 * 60 * 10,
    status: "available",
    completedAt: null
  },
  {
    id: "q-007",
    title: "Reflect on the Day",
    description: "Write one sentence about how today felt.",
    category: ["reflection", "journaling"],
    difficulty: "easy",
    frequency: "daily",
    duration: 5,
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
    status: "completed",
    completedAt: Date.now() - 1000 * 60 * 60,
    subquests: [
      { id: "q-007-1", title: "Name the mood", completed: true },
      { id: "q-007-2", title: "Write one sentence", completed: true }
    ]
  },
  {
    id: "q-008",
    title: "Digital Declutter",
    description: "Remove unused files or apps.",
    category: ["digital", "maintenance"],
    difficulty: "medium",
    frequency: "monthly",
    duration: 30,
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    status: "available",
    completedAt: null,
    subquests: [
      { id: "q-008-1", title: "Delete unused files", completed: false },
      { id: "q-008-2", title: "Remove one app", completed: false }
    ]
  },
  {
    id: "q-009",
    title: "Morning System Check",
    description: "Get yourself online for the day.",
    category: ["meta", "routine"],
    difficulty: "easy",
    frequency: "daily",
    duration: 10,
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    status: "accepted",
    completedAt: null,
    subquests: [
      { id: "q-009-1", title: "Drink water", completed: true },
      { id: "q-009-2", title: "Open blinds", completed: false },
      { id: "q-009-3", title: "Review quests", completed: false }
    ]
  },
  {
    id: "q-010",
    title: "Unfinished Quest Review",
    description: "Decide the fate of lingering quests.",
    category: ["meta", "planning"],
    difficulty: "medium",
    frequency: "weekly",
    duration: 20,
    createdAt: Date.now() - 1000 * 60 * 60 * 36,
    status: "available",
    completedAt: null,
    subquests: [
      { id: "q-010-1", title: "Complete 1 quest", completed: false },
      { id: "q-010-2", title: "Archive 1 quest", completed: false }
    ]
  },
  {
    id: "q-011",
    title: "Hydration Checkpoint",
    description: "Drink a full glass of water.",
    category: ["health"],
    difficulty: "easy",
    frequency: "daily",
    duration: 2,
    createdAt: Date.now() - 1000 * 60 * 15,
    status: "available",
    completedAt: null,
    subquests: [
      { id: "q-011-1", title: "Fill glass", completed: false },
      { id: "q-011-2", title: "Drink water", completed: false }
    ]
  },
  {
    id: "q-012",
    title: "Creative Spark",
    description: "Make something small with no outcome in mind.",
    category: ["creative", "play"],
    difficulty: "medium",
    frequency: "custom",
    duration: 25,
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    status: "accepted",
    completedAt: null,
    subquests: [
      { id: "q-012-1", title: "Pick medium", completed: true },
      { id: "q-012-2", title: "Create", completed: false }
    ]
  },
  {
    id: "q-013",
    title: "Evening Wind Down",
    description: "Start disconnecting from screens and relax.",
    category: ["self-care", "wellbeing"],
    difficulty: "easy",
    frequency: "daily",
    duration: 15,
    createdAt: Date.now() - 1000 * 60 * 60 * 7,
    status: "completed",
    completedAt: Date.now() - 1000 * 60 * 30,
    subquests: [
      { id: "q-013-1", title: "Turn off notifications", completed: true },
      { id: "q-013-2", title: "Read a book", completed: true }
    ]
  },
  {
    id: "q-014",
    title: "Weekly Reflection",
    description: "Summarize your wins and lessons from the week.",
    category: ["reflection", "journaling"],
    difficulty: "medium",
    frequency: "weekly",
    duration: 30,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    status: "available",
    completedAt: null,
    subquests: [
      { id: "q-014-1", title: "List 3 wins", completed: false },
      { id: "q-014-2", title: "List 3 lessons", completed: false }
    ]
  },
  {
    id: "q-015",
    title: "Organize Digital Notes",
    description: "Sort, rename, and archive old notes.",
    category: ["digital", "maintenance"],
    difficulty: "medium",
    frequency: "monthly",
    duration: 40,
    createdAt: Date.now() - 1000 * 60 * 60 * 36,
    status: "failed",
    completedAt: Date.now() - 1000 * 60 * 60 * 12,
    subquests: [
      { id: "q-015-1", title: "Archive old notes", completed: true },
      { id: "q-015-2", title: "Rename important notes", completed: false },
      { id: "q-015-3", title: "Tag notes", completed: false }
    ]
  },
  {
    id: "q-016",
    title: "Morning Stretch Routine",
    description: "Wake your body up with light stretches.",
    category: ["health", "movement"],
    difficulty: "easy",
    frequency: "daily",
    duration: 10,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    status: "accepted",
    completedAt: null,
    subquests: [
      { id: "q-016-1", title: "Neck & shoulders", completed: true },
      { id: "q-016-2", title: "Back & spine", completed: false },
      { id: "q-016-3", title: "Legs & calves", completed: false }
    ]
  },
  {
    id: "q-017",
    title: "Plan Tomorrow",
    description: "Set up your schedule for the next day.",
    category: ["planning", "meta"],
    difficulty: "medium",
    frequency: "daily",
    duration: 20,
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
    status: "completed",
    completedAt: Date.now() - 1000 * 60 * 60,
    subquests: [
      { id: "q-017-1", title: "Review tasks", completed: true },
      { id: "q-017-2", title: "Add new priorities", completed: true }
    ]
  },
  {
    id: "q-018",
    title: "Cook a New Recipe",
    description: "Try cooking something you’ve never made before.",
    category: ["cooking", "creative"],
    difficulty: "hard",
    frequency: "once",
    duration: 60,
    createdAt: Date.now() - 1000 * 60 * 60 * 10,
    status: "available",
    completedAt: null,
    subquests: [
      { id: "q-018-1", title: "Choose recipe", completed: false },
      { id: "q-018-2", title: "Buy ingredients", completed: false },
      { id: "q-018-3", title: "Cook & plate", completed: false }
    ]
  },
  {
    id: "q-019",
    title: "Declutter Workspace",
    description: "Remove items you don’t use and organize drawers.",
    category: ["cleaning", "environment"],
    difficulty: "medium",
    frequency: "weekly",
    duration: 35,
    createdAt: Date.now() - 1000 * 60 * 60 * 20,
    status: "accepted",
    completedAt: null,
    subquests: [
      { id: "q-019-1", title: "Clear desk surface", completed: true },
      { id: "q-019-2", title: "Sort drawers", completed: false }
    ]
  },
  {
    id: "q-020",
    title: "Read for 30 Minutes",
    description: "Immerse yourself in a book or article.",
    category: ["learning", "self-care"],
    difficulty: "easy",
    frequency: "daily",
    duration: 30,
    createdAt: Date.now() - 1000 * 60 * 60 * 1,
    status: "available",
    completedAt: null
  }
];
