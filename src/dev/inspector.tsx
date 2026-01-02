import { ProgressBar } from "../components/ui/ProgressBar";
import type { Evidence, Cluster, Candidate, Skill } from "../types/skills"
import { evidenceFromQuest, clusterFromEvidence, candidateFromCluster } from "./pipeline";
import { useState } from "react";
// import { xpFromQuest } from "../utils/skill/analysis/xp";

// {selectedQuest && (
//   <Inspector
//     questId={selectedQuest.id}
//     evidences={evidenceStore.getAll()}
//     clusters={clusterStore.getAll()}
//     candidates={candidateStore.getAll()}
//     skills={skillStore.getAll()}
//   />
// )}

type InspectorProps = {
  questId: string;
  evidences: Evidence[];
  clusters: Cluster[];
  candidates: Candidate[];
  skills: Skill[];
}

export function Inspector({
  questId, 
  evidences,
  clusters,
  candidates,
  skills
}: InspectorProps) {
  const [open, setOpen] = useState(false);

  const evidence = evidenceFromQuest(evidences, questId);
  const cluster = clusterFromEvidence(clusters, evidence);
  const candidate = candidateFromCluster(candidates, cluster);
  const skill = candidate
    ? skills.find(s => s.verb === candidate.verb)
    : undefined;
  // const questXP = xpFromQuest(evidence);
  return (
    <div className="dev">
      <button 
        className="dev-toggle"
        onClick={() => setOpen(o => !o)}
      >
        dev panel {open ? "▼" : "▲"}
      </button>

    {open && (
      <div className="dev-panel">
        <Section title="xp">
          <div className="xp-gain">
            {/* +{questXP.toFixed(2)} XP */}
          </div>
        </Section>
        <Section title="evidence">
          {evidence.length === 0 && <Muted>none</Muted>}
          {evidence.map(e => (
            <Row key={e.id}>
              {e.verb} {e.object} - {e.timespent}m
            </Row>
          ))}
        </Section>
        <Section title="clusters">
          {cluster.length === 0 && <Muted>none</Muted>}
          {cluster.map(c => (
            <Row key={c.key}>
              {c.verb}:{c.object}
              <ProgressBar xp={c.xp} />
              conf {c.confidence.toFixed(2)}
            </Row>
          ))}
        </Section>
        {candidate && (
          <Section title="candidate">
            <Row>
              xp {candidate.xp}
              <ProgressBar xp={candidate.xp} />
              state {candidate.state}
            </Row>
        </Section>
        )}
        {skill && (
          <Section title="skill">
            <Row>
              {skill.name}
              <ProgressBar xp={skill.xp} />
            </Row>
        </Section>
        )}
      </div>
    )}
  </div>
  )
}

function Section({ title, children }: any){
  return(
    <div className = "section">
      <h4>{title}</h4>
      {children}
    </div>
  )
}

function Row({ children }: any) {
  return <div className="row">{children}</div>
}

function Muted({ children }: any) {
  return <div className="muted">{children}</div>
}