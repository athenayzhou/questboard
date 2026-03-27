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

export async function emitBoardEvent(
  tx: TransactionQuery,
  boardId: string,
  eventType: string,
  payload: Record<string, unknown> = {},
) {
  await tx(
    `insert into shared_board_events (board_id, event_type, payload)
    values ($1::uuid, $2, $3::jsonb)`,
    [boardId, eventType, JSON.stringify(payload)],
  );
}

export async function ensureSharedBoardsSchema(txQuery: TransactionQuery) {
  try {
    await txQuery(`create extension if not exists pgcrypto`);
  } catch (e) {
    if (!isIgnorableExtensionError(e)) throw e;
  }

  await txQuery(`
    create table if not exists shared_boards (
      id uuid primary key,
      name text not null,
      created_at timestamptz not null default now()
    );
  `);

  await txQuery(`
    create table if not exists shared_board_memberships (
      board_id uuid not null references shared_boards(id) on delete cascade,
      tester_id uuid not null,
      user_code text not null,
      display_name text not null,
      role text not null default 'member',
      created_at timestamptz not null default now(),
      primary key (board_id, tester_id)
    );
  `);

  await txQuery(`
    create table if not exists shared_board_quests (
      id uuid primary key,
      board_id uuid not null references shared_boards(id) on delete cascade,
      data jsonb not null,
      status text not null,
      created_at bigint not null,
      updated_at timestamptz not null default now()
    );
  `);

  await txQuery(
    `create index if not exists shared_board_quests_board_status_idx on shared_board_quests (board_id, status);`,
  );

  await txQuery(`
    create table if not exists shared_board_events (
      id bigserial primary key,
      board_id uuid not null references shared_boards(id) on delete cascade,
      event_type text not null,
      payload jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );
  `);

  await txQuery(`
    create index if not exists shared_board_events_board_id_id_idx
    on shared_board_events (board_id, id);
  `);

  await txQuery(`
    create table if not exists shared_board_invites (
      id uuid primary key default gen_random_uuid(),
      board_id uuid not null references shared_boards(id) on delete cascade,
      inviter_tester_id uuid not null,
      invitee_tester_id uuid not null,
      status text not null default 'pending',
      created_at timestamptz not null default now(),
      unique(board_id, invitee_tester_id)
    );
  `);

  await txQuery(`
    create index if not exists shared_board_invites_invitee_status_idx
    on shared_board_invites (invitee_tester_id, status);
  `);

  await txQuery(`
    create index if not exists shared_board_invites_board_id_idx
    on shared_board_invites (board_id);
  `);

  // Required for INSERT ... ON CONFLICT (board_id, invitee_tester_id); older DBs may lack this.
  await txQuery(`
    create unique index if not exists shared_board_invites_board_invitee_uniq
    on shared_board_invites (board_id, invitee_tester_id);
  `);
}

