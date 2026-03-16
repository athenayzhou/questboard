import { useState } from "react";
import type { Quest } from "../../types/quest";
import { useQuestStore } from "../../store/quest";

type EditQuestProps = {
  quest: Quest;
  onSave: (updates: Partial<Quest>) => void;
  onCancel: () => void;
}

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
}

export function EditQuest({ quest, onSave, onCancel }: EditQuestProps) {
  const pauseRecurrence = useQuestStore((s) => s.pauseRecurrence);
  const resumeRecurrence = useQuestStore((s) => s.resumeRecurrence);

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
  });
  const [currentCategory, setCurrentCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<Omit<Quest, "id"|"status"|"createdAt">> = {
      title: formData.title,
      description: formData.description || undefined,
      category: formData.category.length > 0 ? formData.category : undefined,
      difficulty: formData.difficulty,
      priority: formData.priority || undefined,
      frequency: formData.frequency || undefined,
      customFrequency: formData.customFrequency,
      duration: formData.duration === "" ? undefined : Number(formData.duration),
      deadline: formData.deadline || null,
    };
    onSave(updates);
  };

  const addCategory = () => {
    if(currentCategory.trim() && !formData.category.includes(currentCategory.trim())) {
      setFormData(prev => ({
        ...prev,
        category: [...prev.category, currentCategory.trim()]
      }));
      setCurrentCategory("");
    }
  };

  const removeCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category: prev.category.filter(c => c !== category)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="quest-edit-form">
      <div className="form-group">
        <label>title</label>
        <input
          type="text"
          value={formData.title}
          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>

        <div className="form-group">
          <label>description</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>category</label>
          <div className="cateogry-input">
            <input
              type="text"
              value={currentCategory}
              onChange={e => setCurrentCategory(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
              placeholder="add category"
            />
            <button type="button" onClick={addCategory}>add</button>
          </div>
          <div className="category-tags">
            {formData.category.map(cat => (
              <span key={cat} className="category-tag">
                {cat}
                <button type="button" onClick={() => removeCategory(cat)}>x</button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>difficulty</label>
            <select
              value={formData.difficulty}
              onChange={e => setFormData(prev => ({...prev, difficulty: e.target.value as any}))}
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
          </div>

          <div className="form-group">
            <label>priority</label>
            <select
              value={formData.priority || ""}
              onChange={e => setFormData(prev => ({...prev, priority: e.target.value as "high" | "low" | ""}))}
            >
              <option value="">none</option>
              <option value="high">high</option>
              <option value="low">low</option>
            </select>
          </div>
        </div>

        <select
          value={formData.frequency}
          onChange={e => setFormData(prev => ({...prev, frequency: e.target.value as FormData['frequency']}))}
        >
          <option value="once">once</option>
          <option value="daily">daily</option>
          <option value="weekly">weekly</option>
          <option value="monthly">monthly</option>
          <option value="custom">custom</option>
        </select>
        {formData.frequency === "custom" && (
          <div className="form-group">
            <label>custom frequency (days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={formData.customFrequency ?? ""}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  customFrequency: e.target.value === "" ? undefined : Number(e.target.value) || undefined,
                }))
              }
              placeholder="e.g. 3"
            />
          </div>
        )}

        {quest.isTemplate && (
          <div className="template-controls">
            <button
              type="button"
              onClick={() => (quest.paused ? resumeRecurrence(quest.id) : pauseRecurrence(quest.id))}
            >
              {quest.paused ? "Resume" : "Pause"} recurrence
            </button>
            <p className="template-note">
              Changes to this template apply to future instances.
            </p>
          </div>
        )}
          
        <div className="form-row">
          <div className="form-group">
            <label>duration (min)</label>
            <input
              type="number"
              value={formData.duration || ""}
              onChange={e => setFormData(prev => ({...prev, duration: e.target.value === "" ? "" : Number(e.target.value) || ""}))}
            />
          </div>

          <div className="form-group">
            <label>deadline</label>
            <input
              type="date"
              value={formData.deadline || ""}
              onChange={e => setFormData(prev => ({...prev, deadline: e.target.value}))}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel}>cancel</button>
          <button type="submit">save changes</button>
        </div>

    </form>
  )
}