import { useMemo, useState, useEffect } from "react";
import { useOverlay } from "../../store/overlay";
import { useQuestStore } from "../../store/quest";
import { useDebounce } from "../../hooks/useDebounce";

export function FilterQuest() {
  const {
    questSearch,
    setQuestSearch,
    questFilters,
    setQuestFilters,
    clearQuestFilters,
    boardTab,
  } = useOverlay();

  const quests = useQuestStore((s) => s.quests);
  const categories = useMemo(() => {
    const byTab = quests.filter((q) => q.status === boardTab);
    const set = new Set<string>();
    for (const q of byTab) {
      for (const cat of q.category ?? []) {
        if (cat?.trim()) set.add(cat.trim());
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [quests, boardTab]);

  const [localSearch, setLocalSearch] = useState(questSearch);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    setQuestSearch(debouncedSearch);
  }, [debouncedSearch, setQuestSearch]);

  return (
    <div className="quest-search-filter">
      <div className="search-row">
        <input 
          type="text"
          placeholder="search quests..."
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
          className="search-input"
        />
        <button
          onClick={() => {
            setLocalSearch("");
            clearQuestFilters();
          }}
          className="clear-filters-btn"
          disabled={!localSearch && Object.keys(questFilters).length === 0}
        >clear</button>
      </div>

      <div className="filter-row">
        <select
          value={questFilters.category || ""}
          onChange={e => setQuestFilters({
            category: e.target.value || undefined
          })}
          className="filter-select"
        >
          <option value="">all categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()}
            </option>
          ))}
        </select>

        <select
          value={questFilters.difficulty || ""}
          onChange={e => setQuestFilters({
            difficulty: e.target.value || undefined
          })}
          className="filter-select"
        >
          <option value="">all difficulties</option>
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>

      </div>
    </div>
  )
}