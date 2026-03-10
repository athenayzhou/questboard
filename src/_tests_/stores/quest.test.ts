import { describe, it, expect, beforeEach, vi } from "vitest";
import { useQuestStore } from "../../store/quest";
import { createTestQuest } from "../../test/utils";

vi.mock("../../hooks/onQuestComplete", () => ({
  onQuestComplete: vi.fn(),
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

    it('should persist to locale storage', () => {
      const { addQuest } = useQuestStore.getState()
      addQuest({
        title: 'persistent quest',
        description: 'should be saved',
        difficulty: 'easy'
      })

      const stored = JSON.parse(localStorage.getItem('quests') || '[]')
      expect(stored).toHaveLength(1)
      expect(stored[0].title).toBe('persistent quest')
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