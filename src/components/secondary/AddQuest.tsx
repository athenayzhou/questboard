import { useState } from "react";
import { useQuestStore } from "../../store/quest";
import { useOverlay } from "../../store/overlay";

export function AddQuestOverlay() {
  const setOverlay = useOverlay((s) => s.openOverlay);
  const addQuest = useQuestStore((s) => s.addQuest)

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"easy"|"medium"|"hard">("easy");
  const [priority, setPriority] = useState<"high"|"low">("low");
  const [frequency, setFrequency] = useState<"once"|"daily"|"weekly"|"monthly">("once");
  const [deadline, setDeadline] = useState<string | null>(null);

  const handleCreate = () => {
    if(!title.trim()) return;

    addQuest({
      title,
      description,
      difficulty,
      priority,
      frequency,
      deadline,
    });

    setTitle("");
    setDescription("");

    setOverlay("quests")
  };

  const handleCancel = () => {
    setOverlay("quests")
  };

  return (
    <div className="overlay addQuest-overlay">
      <div className="modal quest-create">

        <h2>new quest</h2>

        <input
          placeholder="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder = "description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="row">
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


        <button onClick={handleCreate}>create</button>
        <button onClick={handleCancel}>cancel</button>
      </div>

    </div>
  )
}