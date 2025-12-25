import { useState } from "react";
import type { Quest } from "../types/quest";

export function useQuests() {
  const [quests, setQuests] = useState<Quest[]>([]);

  function addQuest(quest: Quest) {
    setQuests(q => [...q, quest]);
  };

  function updateQuest(id: string, updates: Partial<Quest>) {
    setQuests(q =>
      q.map(quest =>
        quest.id === id ? { ...quest, ...updates } : quest
      )
    );
  }

  function deleteQuest(id: string) {
    setQuests(q => q.filter(quest => quest.id !== id));
  }

  return {
    quests,
    addQuest,
    updateQuest,
    deleteQuest,
  };
}