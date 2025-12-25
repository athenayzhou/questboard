import type { Quest } from "../types/quest";

type QuestPageProps = {
  quest: Quest;
  onAccept?: () => void;
  onClose: () => void;
};

export function QuestPage({ 
  quest,
  onAccept,
  onClose, 
} : QuestPageProps) {

  return (
    <div className="overlay quest-page-overlay">
      <header className="quest-page-header">
        <button onClick={onClose}>back</button>
        <h2>{quest.title}</h2>
      </header>

      {quest.category && (
        <div className="quest-tags">
          {quest.category.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}

      <section className="quest-meta">
        <Meta label="difficulty" value={quest.difficulty} />
        {quest.priority && <Meta label="priority" value={quest.priority} />}
        {quest.frequency && <Meta label="frequency" value={quest.frequency} />}
        {quest.duration && <Meta label="duration" value={`${quest.duration} min`} />}
        {quest.deadline && <Meta label="deadline" value={new Date(quest.deadline).toLocaleDateString()} />}
      </section>

      {quest.subquests && quest.subquests.length > 0 && (
        <section className="quest-subquests">
          <h3>subquests</h3>
          <ul>
            {quest.subquests.map((action) => (
              <li key={action.id}>
                <input
                  type="checkbox"
                  checked={action.completed}
                  readOnly
                />
                <span>{action.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {quest.reward && (
        <section className="quest-rewards">
          <h3>rewards</h3>
          <ul>
            {quest.reward.xp && <li>xp: {quest.reward.xp}</li>}
            {quest.reward.currency && <li>currency: {quest.reward.currency}</li>}
            {quest.reward.items && quest.reward.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <footer className="quest-actions">
        {quest.status === "available" && (
          <button className="accept" onClick={onAccept}>
            accept quest
          </button>
        )}
      </footer>

    </div>
  )
}

function Meta({ 
  label, 
  value 
}: {
  label: string;
  value: string;
}) {
  return(
    <div className="meta-row">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value}</span>
    </div>
  )
}