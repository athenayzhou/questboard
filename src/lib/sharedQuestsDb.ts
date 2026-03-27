type TransactionQuery = (text: string, params?: unknown[]) => Promise<unknown>;

function isIgnorableExtensionError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "code" in err &&
    ((err as { code?: string }).code === "42501" ||
      (err as { code?: string }).code === "0A000")
  );
}

export async function emitQuestCollabEvent(
  tx: TransactionQuery,
  questId: string,
  eventType: string,
  payload: Record<string, unknown> = {},
) {
  await tx(
    `
    insert into shared_quest_events (quest_id, event_type, payload)
    values ($1::uuid, $2, $3::jsonb)
    `,
    [questId, eventType, JSON.stringify(payload)],
  );
}

export async function ensureSharedQuestsSchema(txQuery: TransactionQuery) {
  try {
    await txQuery(`create extension if not exists pgcrypto`);
  } catch (e) {
    if (!isIgnorableExtensionError(e)) throw e;
  }

  await txQuery(`
    create table if not exists shared_quest_quests (
      id uuid primary key,
      data jsonb not null,
      status text not null,
      created_at bigint not null,
      updated_at timestamptz not null default now()
    );
  `);

  await txQuery(`
    create index if not exists shared_quest_quests_status_idx
    on shared_quest_quests (status);
  `);

  await txQuery(`
    create table if not exists shared_quest_memberships (
      quest_id uuid not null references shared_quest_quests(id) on delete cascade,
      tester_id uuid not null,
      user_code text not null,
      display_name text not null,
      role text not null default 'member',
      state text not null default 'active',
      created_at timestamptz not null default now(),
      primary key (quest_id, tester_id)
    );
  `);

  await txQuery(`
    create index if not exists shared_quest_memberships_quest_idx
    on shared_quest_memberships (quest_id);
  `);

  await txQuery(`
    create table if not exists shared_quest_invites (
      id uuid primary key default gen_random_uuid(),
      quest_id uuid not null references shared_quest_quests(id) on delete cascade,
      inviter_tester_id uuid not null,
      invitee_tester_id uuid not null,
      status text not null default 'pending',
      created_at timestamptz not null default now(),
      unique(quest_id, invitee_tester_id)
    );
  `);

  await txQuery(`
    create index if not exists shared_quest_invites_invitee_status_idx
    on shared_quest_invites (invitee_tester_id, status);
  `);

  await txQuery(`
    create index if not exists shared_quest_invites_quest_idx
    on shared_quest_invites (quest_id);
  `);

  await txQuery(`
    create table if not exists shared_quest_events (
      id bigserial primary key,
      quest_id uuid not null references shared_quest_quests(id) on delete cascade,
      event_type text not null,
      payload jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );
  `);

  await txQuery(`
    create index if not exists shared_quest_events_quest_id_id_idx
    on shared_quest_events (quest_id, id);
  `);
}
