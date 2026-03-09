import { useOverlay } from "../../store/overlay";
import { useDebounce } from "../../hooks/useDebounce";
import { useState, useEffect } from "react";

export function FilterQuest(){
  const {
    questSearch,
    setQuestSearch,
    questFilters,
    setQuestFilters,
    clearQuestFilters,
  } = useOverlay();

  const [localSearch, setLocalSearch] = useState(questSearch);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    setQuestSearch(debouncedSearch);
  }, [debouncedSearch, setQuestSearch]);

  const categories = [
    "cleaning", "cooking", "exercise", "work", "social", "learning", "creative", "maintenance", "shopping", "personal"
  ];

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
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0) + cat.slice(1)}
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