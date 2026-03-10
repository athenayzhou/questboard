import { describe, it, expect, beforeEach, vi } from "vitest";
import { useQuestStore } from "../../store/quest";
import { createTestQuest } from "../../test/utils";

vi.mock("../../hooks/onQuestComplete", () => ({
  onQuestComplete: vi.fn(),
}));

describe('quest flow integration', () => {
  beforeEach(() => {
    useQuestStore.getState().setQuest([])
  })

  it('should complete full quest lifecycle', async () => {
    const { addQuest, acceptQuest, completeQuest, getAvailable, getAccepted } = useQuestStore.getState()

    const quest = addQuest({
      title: 'integration test quest',
      description: 'testing full quest flow',
      difficulty: 'medium'
    })

    expect(getAvailable().some((q) => q.id === quest.id)).toBe(true)

    acceptQuest(quest.id)
    expect(getAccepted().some((q) => q.id === quest.id)).toBe(true)
    expect(getAvailable().some((q) => q.id === quest.id)).toBe(false)

    completeQuest(quest.id)
    const completedQuest = useQuestStore.getState().quests.find(q => q.id === quest.id)
    expect(completedQuest?.status).toBe('completed')
    expect(completedQuest?.completedAt).toBeDefined()
  })

  it('should persist quest state across store recreations', () => {
    const { addQuest, setQuest } = useQuestStore.getState()

    const quest = addQuest(createTestQuest())
    expect(useQuestStore.getState().quests).toHaveLength(1)

    const savedQuests = useQuestStore.getState().quests
    setQuest([])
    setQuest(savedQuests)

    expect(useQuestStore.getState().quests).toHaveLength(1)
    expect(useQuestStore.getState().quests[0].id).toBe(quest.id)
  })
})