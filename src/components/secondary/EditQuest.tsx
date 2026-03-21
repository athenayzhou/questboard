import { useEffect, useState } from "react";
import type { Quest } from "../../types/quest";
import { useQuestStore } from "../../store/quest";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useValidation } from "../../hooks/useValidation";
import { VALIDATION_RULES } from "../../utils/constants";
import type { Quest as QuestType } from "../../types/quest";

type EditQuestProps = {
  quest: Quest;
  onSave: (updates: Partial<Quest>) => void;
  onCancel: () => void;
  onDelete: () => void;
};

type FormData = {
  title: string;
  description: string;
  category: string[];
  difficulty: "easy" | "medium" | "hard";
  priority: "high" | "low" | "";
  frequency: "once" | "daily" | "weekly" | "monthly" | "custom" | "";
  customFrequency?: number;
  duration: number | "";
  deadline: string;
  subquests: NonNullable<QuestType["subquests"]>;
};

export function EditQuest({ quest, onSave, onCancel, onDelete }: EditQuestProps) {
  const pauseRecurrence = useQuestStore((s) => s.pauseRecurrence);
  const resumeRecurrence = useQuestStore((s) => s.resumeRecurrence);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: quest.title,
    description: quest.description || "",
    category: quest.category || [],
    difficulty: quest.difficulty,
    priority: quest.priority || "",
    frequency: quest.frequency || "",
    customFrequency: quest.customFrequency,
    duration: quest.duration || "",
    deadline: quest.deadline || "",
    subquests: quest.subquests ? [...quest.subquests] : [],
  });
  const [currentCategory, setCurrentCategory] = useState("");
  const [currentSubquest, setCurrentSubquest] = useState("");

  const { errors, setError } = useValidation();

  function getTitleError(value: string): string | undefined {
    if (!value.trim()) {
      return "title is required";
    }
    if (value.length < VALIDATION_RULES.TITLE_MIN) {
      return `title must be at least ${VALIDATION_RULES.TITLE_MIN} characters`;
    }
    if (value.length > VALIDATION_RULES.TITLE_MAX) {
      return `title must be less than ${VALIDATION_RULES.TITLE_MAX} characters`;
    }
    return undefined;
  }

  function getDescriptionError(value: string): string | undefined {
    if (value.length > VALIDATION_RULES.DESCRIPTION_MAX) {
      return `Description must be less than ${VALIDATION_RULES.DESCRIPTION_MAX} characters`;
    }
    return undefined;
  }

  const titleError = getTitleError(formData.title);
  const descriptionError = getDescriptionError(formData.description);

  useEffect(() => {
    setError("title", titleError);
    setError("description", descriptionError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const titleError = getTitleError(formData.title);
    const descriptionError = getDescriptionError(formData.description);
    setError("title", titleError);
    setError("description", descriptionError);
    if (titleError || descriptionError) return;

    const updates: Partial<Omit<Quest, "id" | "status" | "createdAt">> = {
      title: formData.title,
      description: formData.description || undefined,
      category: formData.category.length > 0 ? formData.category : undefined,
      difficulty: formData.difficulty,
      priority: formData.priority || undefined,
      frequency: formData.frequency || undefined,
      customFrequency: formData.customFrequency,
      duration: formData.duration === "" ? undefined : Number(formData.duration),
      deadline: formData.deadline || null,
      subquests: formData.subquests.length > 0 ? formData.subquests : undefined,
    };
    onSave(updates);
  };

  const addCategory = () => {
    if (
      currentCategory.trim() &&
      !formData.category.includes(currentCategory.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        category: [...prev.category, currentCategory.trim()],
      }));
      setCurrentCategory("");
    }
  };

  const removeCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      category: prev.category.filter((c) => c !== category),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="quest-edit-form">
      <div className="quest-edit-intro">
        <div className="form-group">
          <label htmlFor="quest-edit-title">title</label>
          <input
            id="quest-edit-title"
            type="text"
            value={formData.title}
              onChange={(e) => {
                const next = e.target.value;
                setFormData((prev) => ({ ...prev, title: next }));
                setError("title", getTitleError(next));
              }}
              className={errors.title ? "error" : ""}
            required
          />
            {errors.title && (
              <div className="error-message">{errors.title}</div>
            )}
        </div>
        <div className="form-group">
          <label htmlFor="quest-edit-desc">description</label>
          <textarea
            id="quest-edit-desc"
            value={formData.description}
              onChange={(e) => {
                const next = e.target.value;
                setFormData((prev) => ({ ...prev, description: next }));
                setError("description", getDescriptionError(next));
              }}
            rows={4}
            placeholder="optional details…"
              className={errors.description ? "error" : ""}
          />
            {errors.description && (
              <div className="error-message">{errors.description}</div>
            )}
        </div>
      </div>

      <section className="quest-edit-section" aria-labelledby="edit-tags">
        <div className="form-group">
          <label htmlFor="quest-edit-cat">categories</label>
          <div className="category-input">
            <input
              id="quest-edit-cat-input"
              type="text"
              value={currentCategory}
              onChange={(e) => setCurrentCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
              placeholder="type a tag, press enter or add"
            />
            <button type="button" className="quest-edit-chip-btn" onClick={addCategory}>
              add
            </button>
          </div>
          <div className="category-tags">
            {formData.category.map((cat) => (
              <span key={cat} className="category-tag">
                {cat}
                <button
                  type="button"
                  className="category-tag-remove"
                  onClick={() => removeCategory(cat)}
                  aria-label={`remove ${cat}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="quest-edit-section" aria-labelledby="edit-challenge">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quest-edit-diff">difficulty</label>
            <select
              id="quest-edit-diff"
              value={formData.difficulty}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  difficulty: e.target.value as FormData["difficulty"],
                }))
              }
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="quest-edit-prio">priority</label>
            <select
              id="quest-edit-prio"
              value={formData.priority || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  priority: e.target.value as "high" | "low" | "",
                }))
              }
            >
              <option value="">none</option>
              <option value="high">high</option>
              <option value="low">low</option>
            </select>
          </div>
        </div>
      </section>

      <section className="quest-edit-section" aria-labelledby="edit-schedule">
        <div className="form-group">
          <label htmlFor="quest-edit-freq">frequency</label>
          <select
            id="quest-edit-freq"
            value={formData.frequency}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                frequency: e.target.value as FormData["frequency"],
              }))
            }
          >
            <option value="once">once</option>
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
            <option value="custom">custom</option>
          </select>
        </div>
        {formData.frequency === "custom" && (
          <div className="form-group">
            <label htmlFor="quest-edit-custom-freq">every N days</label>
            <input
              id="quest-edit-custom-freq"
              type="number"
              min={1}
              max={365}
              value={formData.customFrequency ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  customFrequency:
                    e.target.value === ""
                      ? undefined
                      : Number(e.target.value) || undefined,
                }))
              }
              placeholder="e.g. 3"
            />
          </div>
        )}
        {quest.isTemplate && (
          <div className="quest-edit-template-callout">
            <button
              type="button"
              className="quest-edit-template-btn"
              onClick={() =>
                quest.paused
                  ? resumeRecurrence(quest.id)
                  : pauseRecurrence(quest.id)
              }
            >
              {quest.paused ? "resume recurrence" : "pause recurrence"}
            </button>
            <p className="quest-edit-template-hint">
              Changes apply to this template and matching board instances.
            </p>
          </div>
        )}
      </section>

      <section className="quest-edit-section" aria-labelledby="edit-when">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quest-edit-dur">duration (min)</label>
            <input
              id="quest-edit-dur"
              type="number"
              min={0}
              value={formData.duration || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  duration:
                    e.target.value === ""
                      ? ""
                      : Number(e.target.value) || "",
                }))
              }
              placeholder="optional"
            />
          </div>
          <div className="form-group">
            <label htmlFor="quest-edit-deadline">deadline</label>
            <input
              id="quest-edit-deadline"
              type="date"
              value={formData.deadline || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, deadline: e.target.value }))
              }
            />
          </div>
        </div>
      </section>

      <section className="quest-edit-section" aria-labelledby="edit-subquests">
        <div className="form-group">
          <label htmlFor="quest-edit-subquest-input">subquests</label>
          <div className="subquest-input">
            <input
              id="quest-edit-subquest-input"
              type="text"
              placeholder="add a subquest, press enter"
              value={currentSubquest}
              onChange={(e) => setCurrentSubquest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const t = currentSubquest.trim();
                  if (!t) return;
                  setFormData((prev) => ({
                    ...prev,
                    subquests: [
                      ...(prev.subquests ?? []),
                      { id: crypto.randomUUID(), title: t, completed: false },
                    ],
                  }));
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
                setFormData((prev) => ({
                  ...prev,
                  subquests: [
                    ...(prev.subquests ?? []),
                    { id: crypto.randomUUID(), title: t, completed: false },
                  ],
                }));
                setCurrentSubquest("");
              }}
            >
              add
            </button>
          </div>

          {formData.subquests.length > 0 && (
            <div className="subquest-list" role="list">
              {formData.subquests.map((sq) => (
                <div key={sq.id} className="subquest-row" role="listitem">
                  <input
                    type="checkbox"
                    checked={sq.completed}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subquests: prev.subquests.map((p) =>
                          p.id === sq.id ? { ...p, completed: e.target.checked } : p
                        ),
                      }))
                    }
                  />
                  <input
                    className="subquest-title"
                    type="text"
                    value={sq.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subquests: prev.subquests.map((p) =>
                          p.id === sq.id ? { ...p, title: e.target.value } : p
                        ),
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="subquest-remove"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        subquests: prev.subquests.filter((p) => p.id !== sq.id),
                      }))
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
        <button
          type="button"
          className="quest-edit-delete"
          onClick={() => setConfirmDeleteOpen(true)}
        >
          delete quest
        </button>
        <div className="quest-edit-actions-main">
          <button type="button" className="quest-edit-cancel" onClick={onCancel}>
            cancel
          </button>
          <button
            type="submit"
            className="quest-edit-save"
            disabled={Boolean(titleError || descriptionError)}
          >
            save changes
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        options={{
          title: "delete quest?",
          message: quest.isTemplate
            ? "this removes the recurring quest and any instances still on the board. this cannot be undone."
            : "this cannot be undone.",
          confirmText: "delete",
          cancelText: "cancel",
          type: "danger",
        }}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          onDelete();
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </form>
  );
}
