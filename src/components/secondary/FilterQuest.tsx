import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { useOverlay } from "../../store/overlay";
import { useQuestStore } from "../../store/quest";
import { useDebounce } from "../../hooks/useDebounce";
import { IconFilter, IconEraser } from "../ui/icons";

const DROPDOWN_MIN_W = 280;
const DROPDOWN_MAX_W = 400;
const GAP = 8;
const VIEWPORT_PAD = 12;

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
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState({
    top: 0,
    left: 0,
    width: DROPDOWN_MAX_W,
  });

  useEffect(() => {
    setQuestSearch(debouncedSearch);
  }, [debouncedSearch, setQuestSearch]);

  const activeCount =
    (questSearch ? 1 : 0) +
    (questFilters.category ? 1 : 0) +
    (questFilters.difficulty ? 1 : 0);

  const updatePanelPosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    let width = Math.min(DROPDOWN_MAX_W, vw - VIEWPORT_PAD - r.left);
    width = Math.max(DROPDOWN_MIN_W, width);
    let left = r.left;
    if (left + width > vw - VIEWPORT_PAD) {
      left = vw - VIEWPORT_PAD - width;
    }
    left = Math.max(VIEWPORT_PAD, left);
    setPanelPos({
      top: r.bottom + GAP,
      left,
      width,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        wrapRef.current?.contains(t) ||
        panelRef.current?.contains(t)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const panel = open && (
    <div
      ref={panelRef}
      id="quest-filter-panel"
      className="quest-filter-dropdown quest-filter-dropdown--portal"
      role="region"
      aria-label="Filter quests"
      style={{
        position: "fixed",
        top: panelPos.top,
        left: panelPos.left,
        width: panelPos.width,
        zIndex: 10050,
      }}
    >
      <div className="search-row">
        <input
          type="text"
          placeholder="search quests…"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="search-input"
        />
        <button
          type="button"
          onClick={() => {
            setLocalSearch("");
            clearQuestFilters();
          }}
          className="clear-filters-btn"
          disabled={!localSearch && Object.keys(questFilters).length === 0}
          aria-label="Clear search and filters"
          title="Clear search and filters"
        >
          <IconEraser size={16} />
        </button>
      </div>

      <div className="filter-row">
        <select
          value={questFilters.category || ""}
          onChange={(e) =>
            setQuestFilters({
              category: e.target.value || undefined,
            })
          }
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
          onChange={(e) =>
            setQuestFilters({
              difficulty: e.target.value || undefined,
            })
          }
          className="filter-select"
        >
          <option value="">all difficulties</option>
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>
      </div>
    </div>
  );

  return (
    <>
      <div className="quest-filter-wrap" ref={wrapRef}>
        <button
          ref={buttonRef}
          type="button"
          className="quest-filter-toggle"
          aria-expanded={open}
          aria-controls="quest-filter-panel"
          aria-label="Filter quests"
          title="Filter quests"
          onClick={() => setOpen((v) => !v)}
        >
          <IconFilter size={16} className="quest-filter-toggle-icon" />
          {activeCount > 0 && (
            <span className="quest-filter-toggle-badge">{activeCount}</span>
          )}
        </button>
      </div>
      {panel && createPortal(panel, document.body)}
    </>
  );
}
