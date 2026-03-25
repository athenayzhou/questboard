import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import type { Skill, XPEvent } from "../../types/skills";
import { MS, MASTERY } from "../../utils/constants";
import { getEligibleSkills } from "../../utils/skill/generation/grant";
import { useQuestStore } from "../../store/quest";
import { useSkillStore } from "../../store/skill";
import { useXPEventStore } from "../../store/xpEvent";
import { useMasteryStore } from "../../store/mastery";
import { useSettingsStore } from "../../store/settings";
import {
  evidenceStore,
  clusterStore,
  candidateStore,
} from "../../store/bundledStores";

vi.mock("../../utils/toast", () => ({
  showToast: vi.fn(),
}));

vi.mock("../../lib/apiQuests", () => ({
  scheduleQuestSync: vi.fn(),
  setQuestSyncSuppressed: vi.fn(),
}));

vi.mock("../../lib/apiSkills", () => ({
  scheduleSkillSync: vi.fn(),
  setSkillSyncSuppressed: vi.fn(),
}));

vi.mock("../../lib/apiXPEvents", () => ({
  scheduleXPEventSync: vi.fn(),
  setXPEventSyncSuppressed: vi.fn(),
}));

vi.mock("../../lib/apiExtension", () => ({
  scheduleExtensionSync: vi.fn(),
  setExtensionSyncSuppressed: vi.fn(),
  flushExtensionSyncNow: vi.fn(),
}));

function seedSkillsMeetingMasteryFloor(anchor: number): Skill[] {
  const objects = ["obj1", "obj2", "obj3", "obj4", "obj5"];
  const perSkillXp = Math.ceil(MASTERY.DEPTH_XP / objects.length);
  return objects.map((obj, i) => ({
    id: `skill-write-${i}`,
    key: `write:${obj}`,
    name: `write ${obj}`,
    verb: "write",
    objects: [obj],
    xp: perSkillXp,
    proficiency: 0.5,
    firstSeenAt: anchor - 8 * MS.WEEK,
    lastSeenAt: anchor,
    lastDecayAt: anchor,
    isDormant: false,
  }));
}

function seedConsistencyEvents(skillIds: string[], anchor: number): XPEvent[] {
  const events: XPEvent[] = [];
  for (let w = 0; w < MASTERY.CONSISTENCY_ACTIVE_WEEKS; w++) {
    const skillId = skillIds[w % skillIds.length];
    events.push({
      id: crypto.randomUUID(),
      skillId,
      amount: 40,
      source: "quest",
      sourceId: `seed-week-${w}`,
      name: "seed",
      timestamp: anchor - w * MS.WEEK,
    });
  }
  return events;
}

describe("mastery + quest completion integration", () => {
  beforeEach(() => {
    evidenceStore.clear();
    clusterStore.clear();
    candidateStore.clear();
    useQuestStore.getState().setQuest([]);
    useSkillStore.setState({ skills: {} });
    useXPEventStore.setState({ events: [] });
    useMasteryStore.setState({ masteries: [] });
    useSettingsStore.getState().setAutoNameSkills(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("grants mastery after completing a quest when skills and XP history already meet thresholds", async () => {
    const anchor = Date.now();
    const skills = seedSkillsMeetingMasteryFloor(anchor);
    const skillRecord = Object.fromEntries(skills.map((s) => [s.id, s]));
    useSkillStore.setState({ skills: skillRecord });

    const events = seedConsistencyEvents(
      skills.map((s) => s.id),
      anchor,
    );
    useXPEventStore.setState({ events });

    const totalXp = skills.reduce((sum, s) => sum + s.xp, 0);
    expect(totalXp).toBeGreaterThanOrEqual(MASTERY.DEPTH_XP);

    const eligibleBefore = getEligibleSkills(
      useSkillStore.getState().getAll(),
      useXPEventStore.getState().getAll(),
      [],
    );
    expect(eligibleBefore.some((e) => e.verb === "write")).toBe(true);

    const { addQuest, acceptQuest, completeQuest } = useQuestStore.getState();
    const quest = addQuest({
      title: "write obj1 report",
      description: "integration mastery path",
      difficulty: "medium",
      duration: 10,
    });
    acceptQuest(quest.id);
    completeQuest(quest.id);

    expect(useXPEventStore.getState().getAll().length).toBeGreaterThan(
      events.length,
    );

    // gainXP schedules dynamic import + queueMicrotask; flush is async in Vitest
    await waitFor(() => {
      expect(useMasteryStore.getState().getAll().length).toBeGreaterThanOrEqual(
        1,
      );
    });

    const masteries = useMasteryStore.getState().getAll();
    expect(masteries.length).toBeGreaterThanOrEqual(1);
    const writeMastery = masteries.find(
      (m) => m.verb.toLowerCase() === "write",
    );
    expect(writeMastery).toBeDefined();
    expect(writeMastery!.skillIds.length).toBe(skills.length);
  });
});
