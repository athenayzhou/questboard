"use client";

import { useMemo, useState } from "react";

type GuideParagraph = { kind: "p"; text: string };
type GuideList = { kind: "ul" | "ol"; items: string[] };
type GuideBlock = GuideParagraph | GuideList;
type GuideSection = {
  id: string;
  title: string;
  preview: string;
  advanced: GuideBlock[];
};

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "questboard-overview",
    title: "Questboard",
    preview:
      "A quest-based workspace for real life. Add quests, accept what you’re committing to, complete or fail them, and the app turns that into XP, skills, badges, and currency.",
    advanced: [
      {
        kind: "ul",
        items: [
          "Click props in the room to open focused panels (profile, board, log, friends, skills, settings).",
          "Orbit the camera to look around the room, or use the bottom-right control to lock the view in place.",
          "Pin active or high-priority accepted quests and reach them from the side panel.",
          "After a few skills exist, the skill activity snapshot on the bottom-left shows what you’ve been practicing lately.",
        ],
      },
      {
        kind: "p",
        text:
          "Core loop: open the Quest Board → add or pick quests → accept what you’re doing → do the work in real life → come back and complete or fail → use Quest Log and Skill Ledger when you want the bigger picture.",
      },
    ],
  },
  {
    id: "scene-overlays",
    title: "Overlays",
    preview:
      "Each object in the scene opens a different part of the app—planning, history, skills, social, or account tools.",
    advanced: [
      {
        kind: "ul",
        items: [
          "Profile: nameplate, badges, inventory, equipment, and a path to the shop.",
          "Quest Board: create, filter, accept, and open full quest pages.",
          "Quest Log: grouped history of what you ran and how it ended.",
          "Skill Ledger: skills, activity, pending names, streak, decay context.",
          "Friends: nameplate, status, and a short recent activity peek.",
          "Settings: automation toggles, sync, account, this guide.",
        ],
      },
    ],
  },
  {
    id: "profile-shop",
    title: "Profile",
    preview:
      "Customize your nameplate, drag badges into place, equip four gear slots, and open the shop from Profile. Use coins and gems to buy items and decorate your character.",
    advanced: [
      {
        kind: "p",
        text:
          "Set your display name. Earn badges through play (tutorial, milestones, playstyle). Choose which badges to show and drag them on your nameplate.",
      },
      {
        kind: "p",
        text:
          "You have four equipment slots (head, body, accessory, weapon). Inventory lists everything you own; Profile is where you equip one item per slot. You only own a single copy of each item—collecting and styling matters more than duplicates.",
      },
      {
        kind: "p",
        text: "Currencies:",
      },
      {
        kind: "ul",
        items: [
          "Coins: mostly from finishing quests and general progression (including streak momentum).",
          "Gems: rarer, often from seasonal or special quests and similar sources.",
        ],
      },
      {
        kind: "p",
        text:
          "Some shop items need extra requirements (like mastery-related unlocks).",
      },
    ],
  },
  {
    id: "quest-board",
    title: "Quest Board",
    preview:
      "Available vs Accepted tabs keep options separate from commitments. Add quests, flesh them out with subquests, deadlines, tags, duration, and priority. Then accept, pin, and complete from the board or floating quest pages.",
    advanced: [
      {
        kind: "p",
        text:
          "Use filters and search so the board stays readable. New quests land under Available. Accepting them moves them to Accepted.",
      },
      {
        kind: "p",
        text: "When creating or editing an eligible quest, you can use:",
      },
      {
        kind: "ul",
        items: [
          "Subquests — break a big quest into smaller steps.",
          "Category tags — your own system for sorting and scanning.",
          "Difficulty — easy, medium, or hard.",
          "Priority — what deserves attention first.",
          "Estimated duration — how long you think it will take.",
          "Deadline — when it should be done.",
          "Frequency — one-off, or recurring so repeating quests schedule their next run.",
        ],
      },
      {
        kind: "p",
        text:
          "Click a card to open the full quest page. Drag windows if you have several open. System or tutorial quests may stay fixed so rewards and guidance stay reliable. Your own drafts are easier to edit before you commit in ways the app locks.",
      },
      {
        kind: "p",
        text:
          "Pin accepted quests you want at the front of mind. Pinned quests surface in the active strip for quick complete actions and shortcuts to full detail.",
      },
    ],
  },
  {
    id: "quest-log",
    title: "Quest Log",
    preview:
      "A record of your history. Related and repeating quests group into threads so you see one story instead of duplicate noise.",
    advanced: [
      {
        kind: "p",
        text:
          "Each grouped row rolls up tags and the latest status. Expand a row to see individual runs (complete, fail, etc.) and the details for that attempt. Within a group, newer activity sorts with the story in mind.",
      },
      {
        kind: "p",
        text:
          "When a pattern worked before, use “add as new quest” to start a fresh quest with similar settings instead of retyping everything.",
      },
    ],
  },
  {
    id: "skill-ledger",
    title: "Skill Ledger",
    preview:
      "Long-term growth. Named skills and masteries, an activity log, daily streak, co-occurrence between related actions, and decay when a skill goes quiet.",
    advanced: [
      {
        kind: "p",
        text:
          "Skills, built from quest completions, summarize what you actually practice over time.",
      },
      {
        kind: "p",
        text: "Activity log:",
      },
      {
        kind: "ul",
        items: [
          "Records recent XP-style events tied to skills.",
          "Decay shows up here too. Inactive skills slowly lose momentum so your profile reflects current habits.",
        ],
      },
      {
        kind: "p",
        text:
          "Co-occurrence: when you finish related quests close together in time, the app can link that evidence so skills cluster sensibly and repeating combos stand out as routines.",
      },
      {
        kind: "p",
        text:
          "Daily streak: a light consistency signal (consecutive days with at least one quest completion) appears in this area.",
      },
      {
        kind: "p",
        text:
          "Pending skills: if you skip naming when a skill is ready, it can land in the pending tab for later naming. Turn on auto-name in Settings if you want the app to name emerging skills for you.",
      },
    ],
  },
  {
    id: "skill-pipeline",
    title: "Skill Pipeline",
    preview:
      "Finishing quests leaves traces of what you did. Repeated, similar activity forms patterns; strong patterns become named skills and eventually feed mastery.",
    advanced: [
      {
        kind: "ol",
        items: [
          "Quest completion adds activity evidence.",
          "Related evidence forms repeated patterns.",
          "Strong patterns become candidates for a real skill.",
          "Named skills gain XP and show up in the ledger.",
          "Related skills and consistency over time contribute to mastery paths.",
        ],
      },
      {
        kind: "p",
        text:
          "Tip: steady, similar quests build clearer skills than one-off vague tasks.",
      },
    ],
  },
  {
    id: "friends-list",
    title: "Friends list",
    preview:
      "Add people using the user ID from Settings. You’ll see a compact nameplate, status, and a short peek at recent skill activity—light social context, not a full feed.",
    advanced: [],
  },
  {
    id: "cloud-sync",
    title: "Cloud Sync",
    preview:
      "Use “save to server now” after big sessions so progress isn’t only on this device. Treat manual save as a checkpoint after important edits: big quest changes, naming passes, profile updates.",
    advanced: [],
  },
  {
    id: "reset-signout",
    title: "Reset data & sign out",
    preview:
      "Reset clears quest and skill-style progress on purpose. Sign out ends your session. You may need your invite code to return.",
    advanced: [],
  },
];

const EXPANDABLE_SECTION_IDS = GUIDE_SECTIONS.filter(
  (s) => s.advanced.length > 0,
).map((s) => s.id);

function GuideChevron() {
  return (
    <span className="settings-guide-chevron" aria-hidden>
      <svg
        className="settings-guide-chevron-svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

function GuideBlockView({ block }: { block: GuideBlock }) {
  if (block.kind === "p") {
    return <p className="settings-guide-advanced-p">{block.text}</p>;
  }
  if (block.kind === "ul") {
    return (
      <ul className="settings-guide-advanced-list">
        {block.items.map((item, i) => (
          <li key={`${i}-${item.slice(0, 48)}`}>{item}</li>
        ))}
      </ul>
    );
  }
  return (
    <ol className="settings-guide-advanced-list">
      {block.items.map((item, i) => (
        <li key={`${i}-${item.slice(0, 48)}`}>{item}</li>
      ))}
    </ol>
  );
}

function GuideRow({
  section,
  expanded,
  onToggle,
}: {
  section: GuideSection;
  expanded: boolean;
  onToggle: () => void;
}) {
  const expandable = section.advanced.length > 0;

  if (!expandable) {
    return (
      <article className="settings-guide-row">
        <div className="settings-guide-row-static">
          <h4 className="settings-guide-title">{section.title}</h4>
          <p className="settings-guide-preview">{section.preview}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="settings-guide-row">
      <button
        type="button"
        className="settings-guide-row-trigger"
        aria-expanded={expanded}
        aria-controls={`guide-advanced-${section.id}`}
        id={`guide-trigger-${section.id}`}
        onClick={onToggle}
      >
        <span className="settings-guide-row-trigger-text">
          <span className="settings-guide-title">{section.title}</span>
          <span className="settings-guide-preview">{section.preview}</span>
        </span>
        <GuideChevron />
      </button>

      {expanded ? (
        <div
          id={`guide-advanced-${section.id}`}
          role="region"
          aria-labelledby={`guide-trigger-${section.id}`}
          className="settings-guide-advanced"
        >
          {section.advanced.map((block, idx) => (
            <GuideBlockView key={`${section.id}-${idx}`} block={block} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function Guide() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const allExpanded = useMemo(() => {
    if (EXPANDABLE_SECTION_IDS.length === 0) return false;
    return EXPANDABLE_SECTION_IDS.every((id) => expandedIds.has(id));
  }, [expandedIds]);

  function toggleSection(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setExpandedIds((prev) => {
      const allOpen = EXPANDABLE_SECTION_IDS.every((id) => prev.has(id));
      if (allOpen) return new Set();
      return new Set(EXPANDABLE_SECTION_IDS);
    });
  }

  return (
    <section className="settings-guide">
      <div className="settings-guide-toolbar">
        <p className="settings-guide-toolbar-copy">
        </p>
        <button
          type="button"
          className="settings-guide-toggle-all-btn"
          onClick={toggleAll}
        >
          {allExpanded ? "collapse all" : "expand all"}
        </button>
      </div>

      <div className="settings-guide-list">
        {GUIDE_SECTIONS.map((section) => (
          <GuideRow
            key={section.id}
            section={section}
            expanded={expandedIds.has(section.id)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>
    </section>
  );
}
