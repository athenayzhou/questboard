import { useState } from "react";
import { useQuestStore } from "../../store/quest";
import { useOverlay } from "../../store/overlay";
import { LoadingButton } from "../ui/LoadingButton";
import { useValidation } from "../../hooks/useValidation";
import { VALIDATION_RULES } from "../../utils/constants";

export function AddQuestOverlay() {
  const setOverlay = useOverlay((s) => s.openOverlay);
  const addQuest = useQuestStore((s) => s.addQuest)

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState("");
  const [difficulty, setDifficulty] = useState<"easy"|"medium"|"hard">("easy");
  const [priority, setPriority] = useState<"high"|"low">("low");
  const [frequency, setFrequency] = useState<"once"|"daily"|"weekly"|"monthly">("once");
  const [deadline, setDeadline] = useState<string | null>(null);

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
      addQuest({
        title,
        description,
        category: categories.length > 0 ? categories : undefined,
        difficulty,
        priority,
        frequency,
        deadline,
      });
      setTitle("");
      setDescription("");
      setCategories([]);
      setCurrentCategory("");
      setOverlay("quests");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setOverlay("quests")
  };

  return (
    <div className="overlay addQuest-overlay">
      <div className="modal quest-create">

        <h2>new quest</h2>

        <div className="form-field">
        <input
          placeholder="title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className={errors.title ? 'error' : ''}
        />
        {errors.title && <div className="error-message">{errors.title}</div>}
        </div>

        <div className="form-field">
        <textarea
          placeholder = "description"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          className={errors.description ? 'error' : ''}
        />
        {errors.description && <div className="error-message">{errors.description}</div>}
        </div>

        <div className="row">
          <label>categories</label>
          {categories.length > 0 && (
            <div className="category-tags">
              {categories.map(category => (
                <span key={category} className="category-tag">
                  {category}
                  <button onClick={() => removeCategory(category)}>x</button>
                </span>
              ))}
            </div>
          )}
          <div className="category-input">
            <input
              placeholder="add category"
              value={currentCategory}
              onChange={(e) => setCurrentCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
            />
            <button type="button" onClick={addCategory}>add</button>
          </div>

          <label>difficulty</label>
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value as any)}
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
        </div>

        <div className="row">
          <label>priority</label>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value as any)}
            >
              <option value="low">low</option>
              <option value="high">high</option>
            </select>
        </div>

        <div className="row">
          <label>frequency</label>
          <select
            value={frequency}
            onChange={e => setFrequency(e.target.value as any)}
            >
              <option value="once">once</option>
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
            </select>
        </div>

        <div className="row">
          <label>deadline</label>
          <input
            type="date"
            onChange={e => setDeadline(e.target.value)}
            />
        </div>

        <div className="form-actions">
        <button onClick={handleCancel}>cancel</button>
        <LoadingButton 
          onClick={handleCreate}
          loading={isCreating}
          disabled={hasErrors || !title.trim()}
          className="primary"
        >create</LoadingButton>
        </div>
      </div>

    </div>
  )
}