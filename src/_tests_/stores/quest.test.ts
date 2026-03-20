import { describe, it, expect, beforeEach, vi } from "vitest";
import { useQuestStore } from "../../store/quest";
import { createTestQuest } from "../../test/utils";

vi.mock("../../hooks/onQuestComplete", () => ({
  onQuestComplete: vi.fn(),
}));

vi.mock("../../lib/apiQuests", () => ({
  scheduleQuestSync: vi.fn(),
  setQuestSyncSuppressed: vi.fn(),
}));

describe('quest store', () => {
  beforeEach(() => {
    useQuestStore.getState().setQuest([])
    localStorage.clear()
  })

  describe('addQuest', () => {
    it('should add a new quest with generated id and default status', () => {
      const { addQuest } = useQuestStore.getState()
      const quest = addQuest({
        title: 'test quest',
        description: 'description for test quest',
        difficulty: 'medium'
      })

      expect(quest.id).toBeDefined()
      expect(quest.status).toBe('available')
      expect(quest.createdAt).toBeDefined()
      expect(quest.title).toBe('test quest')
    })

    it('should schedule server sync (debounced PUT)', async () => {
      const { scheduleQuestSync } = await import("../../lib/apiQuests");
      const { addQuest } = useQuestStore.getState();
      addQuest({
        title: "synced quest",
        description: "server-backed",
        difficulty: "easy",
      });
      expect(vi.mocked(scheduleQuestSync)).toHaveBeenCalled();
    })
  })

  describe('getAvailable', () => {
    it('should return only available quests', () => {
      const { addQuest, acceptQuest, getAvailable } = useQuestStore.getState()

      const quest1 = addQuest(createTestQuest())
      const quest2 = addQuest(createTestQuest())
      acceptQuest(quest1.id)

      const available= getAvailable()
      expect(available).toHaveLength(1)
      expect(available[0].id).toBe(quest2.id)
    })
  })
})