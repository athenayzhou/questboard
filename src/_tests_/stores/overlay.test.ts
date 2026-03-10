import { describe, it, expect, beforeEach } from "vitest";
import { useOverlay } from "../../store/overlay";

describe("overlay store", () => {
  beforeEach(() => {
    useOverlay.setState({
      activeOverlay: null,
      openQuestPages: [],
      boardTab: "available",
      questSearch: "",
      questFilters: {},
    });
  });

  it("should open and close overlay", () => {
    expect(useOverlay.getState().activeOverlay).toBe(null);
    useOverlay.getState().openOverlay("quests");
    expect(useOverlay.getState().activeOverlay).toBe("quests");
    useOverlay.getState().closeOverlay();
    expect(useOverlay.getState().activeOverlay).toBe(null);
  });

  it("should open quest pages", () => {
    useOverlay.getState().openOverlay("quests");
    useOverlay.getState().openQuest("quest-1");
    expect(useOverlay.getState().openQuestPages).toHaveLength(1);
    expect(useOverlay.getState().openQuestPages[0].id).toBe("quest-1");

    useOverlay.getState().openQuest("quest-2");
    expect(useOverlay.getState().openQuestPages).toHaveLength(2);
  });

  it("should not add duplicate quest page", () => {
    useOverlay.getState().openOverlay("quests");
    useOverlay.getState().openQuest("quest-1");
    useOverlay.getState().openQuest("quest-1");
    expect(useOverlay.getState().openQuestPages).toHaveLength(1);
  });

  it("should close quest and close all quests", () => {
    useOverlay.getState().openOverlay("quests");
    useOverlay.getState().openQuest("quest-1");
    useOverlay.getState().openQuest("quest-2");
    useOverlay.getState().closeQuest("quest-1");
    expect(useOverlay.getState().openQuestPages).toHaveLength(1);
    expect(useOverlay.getState().openQuestPages[0].id).toBe("quest-2");

    useOverlay.getState().closeAllQuests();
    expect(useOverlay.getState().openQuestPages).toHaveLength(0);
  });

  it("should set board tab", () => {
    expect(useOverlay.getState().boardTab).toBe("available");
    useOverlay.getState().setBoardTab("accepted");
    expect(useOverlay.getState().boardTab).toBe("accepted");
  });

  it("should set quest search and filters", () => {
    useOverlay.getState().setQuestSearch("test");
    expect(useOverlay.getState().questSearch).toBe("test");

    useOverlay.getState().setQuestFilters({ category: "work", difficulty: "easy" });
    expect(useOverlay.getState().questFilters).toEqual({
      category: "work",
      difficulty: "easy",
    });

    useOverlay.getState().clearQuestFilters();
    expect(useOverlay.getState().questFilters).toEqual({});
  });
});
