import { useState } from "react";
import { createPortal } from "react-dom";
import { useQuestStore } from "../../store/quest";
import { useOverlay } from "../../store/overlay";
import { LoadingButton } from "../ui/LoadingButton";
import { useValidation } from "../../hooks/useValidation";
import { VALIDATION_RULES } from "../../utils/constants";
import type { Quest } from "../../types/quest";
import { IconPlus } from "../ui/icons";
import { tryCompleteTutorialSpotlight } from "@/onboarding/tutorialProgress";
import { useTutorialStore } from "@/onboarding/tutorialStore";

export function AddQuestOverlay() {
  const setOverlay = useOverlay((s) => s.openOverlay);
  const addQuest = useQuestStore((s) => s.addQuest);
  const acceptQuest = useQuestStore((s) => s.acceptQuest);
  const togglePin = useQuestStore((s) => s.togglePin);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState("");
  const [difficulty, setDifficulty] = useState<"easy"|"medium"|"hard">("easy");
  const [priority, setPriority] = useState<"high"|"low">("low");
  const [frequency, setFrequency] = useState<"once"|"daily"|"weekly"|"monthly"|"custom">("once");
  const [customFrequency, setCustomFrequency] = useState<number | undefined>(undefined);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | "">("");
  const [subquests, setSubquests] = useState<NonNullable<Quest["subquests"]>>([]);
  const [currentSubquest, setCurrentSubquest] = useState("");

  const { errors, setError, hasErrors } = useValidation();
  const [isCreating, setIsCreating] = useState(false);

  const addCategory = () => {
    if(currentCategory.trim() && !categories.includes(currentCategory.trim())){
      setCategories(prev => [...prev, currentCategory.trim()]);
      setCurrentCategory("");
    }
  };
  const removeCategory = (category: string) => {
    setCategories(prev => prev.filter(c => c !== category));
  }

  const handleTitleChange = (value: string) => {
    setTitle(value);
    
    if(!value.trim()){
      setError('title', 'title is required');
    } else if (value.length < VALIDATION_RULES.TITLE_MIN){
      setError('title', `title must be at least ${VALIDATION_RULES.TITLE_MIN} characters`)
    } else if (value.length > VALIDATION_RULES.TITLE_MAX) {
      setError('title', `title must be less than ${VALIDATION_RULES.TITLE_MAX} characters`);
    } else {
      setError('title', undefined);
    }
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (value.length > 1000) {
      setError('description', 'Description must be less than 1000 characters');
    } else {
      setError('description', undefined);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || hasErrors) return;
    
    setIsCreating(true);
    
    try {
      const created = addQuest({
        title,
        description,
        category: categories.length > 0 ? categories : undefined,
        difficulty,
        priority,
        frequency,
        customFrequency: frequency === "custom" ? customFrequency : undefined,
        deadline,
        duration: duration === "" ? undefined : Number(duration),
        subquests: subquests.length > 0 ? subquests : undefined,
      });
      if (
        useTutorialStore.getState().currentSubquest?.spotlight === "addq-submit"
      ) {
        acceptQuest(created.id);
        togglePin(created.id);
      }
      tryCompleteTutorialSpotlight("addq-submit");
      setTitle("");
      setDescription("");
      setCategories([]);
      setCurrentCategory("");
      setDuration("");
      setSubquests([]);
      setCurrentSubquest("");
      useOverlay.getState().setBoardTab("available");
      setOverlay("quests");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setOverlay("quests")
  };

  const portalTarget = document.body;
  if (!portalTarget) return null;

  return createPortal(
    <>
      <div
        className="overlay-backdrop"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setOverlay("quests");
        }}
      />
      <div className="modal quest-create addQuest-modal">
        <h2>new quest</h2>
        <form
          data-spotlight="addq-form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreate();
          }}
          className="quest-edit-form"
        >
          <div className="quest-edit-intro">
            <div className="form-group">
              <label htmlFor="addq-title">title</label>
              <input
                id="addq-title"
                type="text"
                placeholder="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={errors.title ? "error" : ""}
              />
              {errors.title && (
                <div className="error-message">{errors.title}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="addq-desc">description</label>
              <textarea
                id="addq-desc"
                placeholder="optional details…"
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                className={errors.description ? "error" : ""}
                rows={4}
              />
              {errors.description && (
                <div className="error-message">{errors.description}</div>
              )}
            </div>
          </div>

          <section className="quest-edit-section" aria-labelledby="addq-categories">
            <div className="form-group">
              <label htmlFor="addq-categories">categories</label>
              <div className="category-input">
                <input
                  type="text"
                  placeholder="type a tag, press enter or add"
                  value={currentCategory}
                  onChange={(e) => setCurrentCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCategory();
                    }
                  }}
                />
                <button
                  type="button"
                  className="quest-edit-chip-btn"
                  onClick={addCategory}
                  aria-label="Add category"
                  title="Add"
                >
                  <IconPlus size={14} />
                </button>
              </div>

              {categories.length > 0 && (
                <div className="category-tags">
                  {categories.map((category) => (
                    <span key={category} className="category-tag">
                      {category}
                      <button
                        type="button"
                        className="category-tag-remove"
                        onClick={() => removeCategory(category)}
                        aria-label={`remove ${category}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="quest-edit-section" aria-labelledby="addq-effort">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="addq-difficulty">difficulty</label>
                <select
                  id="addq-difficulty"
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as "easy" | "medium" | "hard")
                  }
                >
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="addq-priority">priority</label>
                <select
                  id="addq-priority"
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as "high" | "low")
                  }
                >
                  <option value="low">low</option>
                  <option value="high">high</option>
                </select>
              </div>
            </div>

            <p className="quest-edit-hint">
              coins and XP rewards are calculated automatically from difficulty and
              duration (gems are only used for seasonal system quests).
            </p>
          </section>

          <section className="quest-edit-section" aria-labelledby="addq-schedule">
            <div className="form-group">
              <label htmlFor="addq-frequency">frequency</label>
              <select
                id="addq-frequency"
                value={frequency}
                onChange={(e) =>
                  setFrequency(
                    e.target.value as
                      | "once"
                      | "daily"
                      | "weekly"
                      | "monthly"
                      | "custom",
                  )
                }
              >
                <option value="once">once</option>
                <option value="daily">daily</option>
                <option value="weekly">weekly</option>
                <option value="monthly">monthly</option>
                <option value="custom">custom</option>
              </select>
            </div>

            {frequency === "custom" && (
              <div className="form-group">
                <label htmlFor="addq-custom-frequency">every N days</label>
                <input
                  id="addq-custom-frequency"
                  type="number"
                  min="1"
                  max="365"
                  value={customFrequency ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (!raw) return setCustomFrequency(undefined);
                    setCustomFrequency(Number(raw));
                  }}
                  placeholder="e.g. 3"
                />
              </div>
            )}
          </section>

          <section className="quest-edit-section" aria-labelledby="addq-time">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="addq-duration">duration (min)</label>
                <input
                  id="addq-duration"
                  type="number"
                  min="1"
                  max={1440}
                  value={duration === "" ? "" : duration}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (!raw) return setDuration("");
                    const n = Number(raw);
                    if (Number.isFinite(n) && n > 0) setDuration(n);
                  }}
                  placeholder="e.g. 30"
                />
              </div>
              <div className="form-group">
                <label htmlFor="addq-deadline">deadline</label>
                <input
                  id="addq-deadline"
                  type="date"
                  value={deadline ?? ""}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="quest-edit-section" aria-labelledby="addq-subquests">
            <div className="form-group">
              <label htmlFor="addq-subquest-input">subquests</label>
              <div className="subquest-input">
                <input
                  id="addq-subquest-input"
                  type="text"
                  placeholder="add a subquest, press enter"
                  value={currentSubquest}
                  onChange={(e) => setCurrentSubquest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const t = currentSubquest.trim();
                      if (!t) return;
                      setSubquests((prev) => [
                        ...prev,
                        { id: crypto.randomUUID(), title: t, completed: false },
                      ]);
                      setCurrentSubquest("");
                    }
                  }}
                />
                <button
                  type="button"
                  className="quest-edit-chip-btn"
                  onClick={() => {
                    const t = currentSubquest.trim();
                    if (!t) return;
                    setSubquests((prev) => [
                      ...prev,
                      { id: crypto.randomUUID(), title: t, completed: false },
                    ]);
                    setCurrentSubquest("");
                  }}
                >
                  add
                </button>
              </div>

              {subquests.length > 0 && (
                <div className="subquest-list" role="list">
                  {subquests.map((sq) => (
                    <div key={sq.id} className="subquest-row" role="listitem">
                      <input
                        type="checkbox"
                        checked={sq.completed}
                        onChange={(e) =>
                          setSubquests((prev) =>
                            prev.map((p) =>
                              p.id === sq.id ? { ...p, completed: e.target.checked } : p
                            )
                          )
                        }
                      />
                      <input
                        className="subquest-title"
                        type="text"
                        value={sq.title}
                        onChange={(e) =>
                          setSubquests((prev) =>
                            prev.map((p) =>
                              p.id === sq.id ? { ...p, title: e.target.value } : p
                            )
                          )
                        }
                      />
                      <button
                        type="button"
                        className="subquest-remove"
                        onClick={() =>
                          setSubquests((prev) => prev.filter((p) => p.id !== sq.id))
                        }
                        aria-label={`remove ${sq.title}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="quest-edit-actions">
            <div className="quest-edit-actions-main">
              <button type="button" className="quest-edit-cancel" onClick={handleCancel}>
                cancel
              </button>
              <LoadingButton
                type="submit"
                loading={isCreating}
                disabled={hasErrors || !title.trim()}
                className="quest-edit-save"
                data-spotlight="addq-submit"
              >
                create quest
              </LoadingButton>
            </div>
          </div>
        </form>
      </div>
    </>,
    portalTarget,
  );
}