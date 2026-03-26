type TransactionQuery = (text: string, params?: unknown[]) => Promise<unknown>;

function isMissingTableError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: string }).code === "42P01"
  );
}

/**
 * Creates shared-board tables if missing.
 * This is a stopgap until you add proper migrations.
 */
export async function ensureSharedBoardsSchema(txQuery: TransactionQuery) {
  try {
    await txQuery(`select 1 from shared_boards limit 1`);
    return;
  } catch (e) {
    if (!isMissingTableError(e)) throw e;
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
}

