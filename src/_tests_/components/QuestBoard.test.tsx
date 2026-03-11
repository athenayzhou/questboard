import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestBoard } from "../../components/overlay/QuestBoard";
import { createTestQuest } from "../../test/utils";
import * as overlayStore from "../../store/overlay";

vi.mock('../../store/overlay', () => ({
  useOverlay: vi.fn(() => ({
    activeOverlay: 'quests',
    openOverlay: vi.fn(),
    closeOverlay: vi.fn(),
    closeAllQuests: vi.fn(),
    boardTab: 'available',
    setBoardTab: vi.fn(),
    openQuestPages: [],
    questSearch: '',
    questFilters: {},
    openQuest: vi.fn(),
    closeQuest: vi.fn(),
    bringToFront: vi.fn(),
    moveQuest: vi.fn(),
    setQuestSearch: vi.fn(),
    setQuestFilters: vi.fn(),
    clearQuestFilters: vi.fn(),
  }))
}))

describe('QuestBoard', () => {
  const mockOnSelect = vi.fn()
  const mockQuests = [
    createTestQuest({ title: 'quest 1', status: 'available' }),
    createTestQuest({ title: 'quest 2', status: 'accepted' })
  ]

  it('should render quest board when active overlay is quests', () => {
    render(
      <QuestBoard
        quests={mockQuests}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByText('quest board')).toBeInTheDocument()
    expect(screen.getByText('available')).toBeInTheDocument()
    expect(screen.getByText('accepted')).toBeInTheDocument()
  })

  it("should not render when active overlay is not quests", () => {
    const mockUseOverlay = vi.mocked(overlayStore.useOverlay);
    mockUseOverlay.mockReturnValueOnce({
      activeOverlay: 'settings',
      openOverlay: vi.fn(),
      closeOverlay: vi.fn(),
      closeAllQuests: vi.fn(),
      boardTab: 'available',
      setBoardTab: vi.fn(),
      openQuestPages: [],
      questSearch: '',
      questFilters: {},
      openQuest: vi.fn(),
      closeQuest: vi.fn(),
      bringToFront: vi.fn(),
      moveQuest: vi.fn(),
      setQuestSearch: vi.fn(),
      setQuestFilters: vi.fn(),
      clearQuestFilters: vi.fn(),
    })

    const { container } = render(
      <QuestBoard
        quests={mockQuests}
        onSelect={mockOnSelect}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should filter quests by current tab', () => {
    render(
      <QuestBoard
        quests={mockQuests}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByText('quest 1')).toBeInTheDocument()
    expect(screen.queryByText('quest 2')).not.toBeInTheDocument()
  })

  it('should call onSelect when quest card is clicked', () => {
    render(
      <QuestBoard
        quests={mockQuests.filter(q=> q.status === 'available')}
        onSelect={mockOnSelect}
      />
    )
    const questCard = screen.getByText('quest 1')
    fireEvent.click(questCard)
    expect(mockOnSelect).toHaveBeenCalledWith(mockQuests[0].id)
  })
})