type QueryFn = (
  text: string,
  params?: unknown[],
) => Promise<unknown>;

/** Per-tester quest card positions per board surface (personal / collab tab). */
export async function ensureBoardLayoutSchema(q: QueryFn) {
  await q(`
    create table if not exists quest_board_layouts (
      tester_id uuid not null,
      surface_key text not null,
      layout jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now(),
      primary key (tester_id, surface_key)
    );
  `);
}
