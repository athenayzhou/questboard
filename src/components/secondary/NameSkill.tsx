import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { generateSkillNames } from "../../utils/skill/generation/name";
import type { Candidate, Skill } from "../../types/skills";

type NameSkillProps = {
  isOpen: boolean;
  candidate?: Candidate;
  skill?: Skill;
  onNameSelected: (name: string, pendingId?: string) => void;
  onCancel: () => void;
  currentName?: string;
  pendingId?: string | null;
  presentationTitle?: string;
  presentationDescription?: string;
}

export function NameSkill({
  isOpen,
  candidate,
  skill,
  onNameSelected,
  onCancel,
  currentName,
  pendingId,
  presentationTitle,
  presentationDescription,
}: NameSkillProps) {
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
  const [customName, setCustomName] = useState(currentName || "");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const prevOpenRef = useRef(false);

  const context = useMemo(() => {
    if (presentationTitle) {
      return {
        title: presentationTitle,
        description: presentationDescription ?? "",
        questTitles: [],
      };
    }
    if (skill) {
      return {
        title: "rename this skill",
        description: `this skill was first seen ${new Date(skill.firstSeenAt).toLocaleDateString()}.`,
        questTitles: [],
      };
    }

    if(candidate){
      const questTitles = candidate.origin
      .map(origin => origin.split(':')[1])
      .filter((title, index, arr) => arr.indexOf(title) === index)
      .slice(0, 3);

      return {
        title: 'new skill discovered',
        description: questTitles.length > 0
         ? `new skill discovered from completing quests like "${questTitles.join('", "')}".`
         : `new skill discovered.`,
         questTitles
      };
    }

    return {
      title: "name skill",
      description: "what should we call this skill?",
      questTitles: [],
    };
  }, [candidate, skill, presentationTitle, presentationDescription]);

  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    prevOpenRef.current = isOpen;
    if (isOpen && (candidate || skill)) {
      const target = candidate || {
        id: skill!.id,
        key: skill!.key,
        verb: skill!.verb,
        objects: skill!.objects,
        clusters: [],
        xp: skill!.xp,
        readiness: skill!.proficiency,
        origin: [],
        firstSeenAt: skill!.firstSeenAt,
        lastSeenAt: skill!.lastSeenAt,
        state: "ready" as const,
      };
      const suggestions = generateSkillNames(target);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local dialog state to latest props when opened
      setSuggestedNames(suggestions);
      setCustomName(currentName || "");
      if (justOpened) {
        setSelectedOption(null);
      }
    }
  }, [isOpen, candidate, skill, currentName]);
 
  const submittedName =
    selectedOption && selectedOption !== "custom"
      ? selectedOption
      : customName.trim();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (submittedName.length === 0) return;
    onNameSelected(submittedName, pendingId ?? undefined);
  };

  if (!isOpen) return null;

  const dialog = (
    <div className="skill-naming-overlay">
      <div className="skill-naming-dialog">
        <h3>{context.title}</h3>
        <p className="skill-context">{context.description}</p>

        <form onSubmit={handleFormSubmit} className="skill-naming-form">
          <div className="suggested-names">
            <h4>suggested names:</h4>
            {suggestedNames.map((name) => (
              <button
                key={name}
                type="button"
                className={`name-option ${selectedOption === name ? "selected" : ""}`}
                onClick={() => setSelectedOption(name)}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="custom-name">
            <h4>or enter custom name:</h4>
            <input
              type="text"
              value={customName}
              onChange={(e) => {
                setCustomName(e.target.value);
                setSelectedOption("custom");
              }}
              placeholder="enter skill name..."
              onFocus={() => setSelectedOption("custom")}
            />
          </div>

          <div className="dialog-actions">
            <button type="button" onClick={() => onCancel()}>
              {currentName ? "cancel" : "skip for now"}
            </button>
            <button
              type="submit"
              disabled={submittedName.length === 0}
            >
              {currentName ? "rename" : "name skill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}