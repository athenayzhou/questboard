type QueryFn = (
  text: string,
  params?: unknown[],
) => Promise<unknown>;

export async function ensureFriendEdgesSchema(q: QueryFn) {
  await q(`
    create table if not exists friend_edges (
      tester_low uuid not null,
      tester_high uuid not null,
      created_at timestamptz not null default now(),
      primary key (tester_low, tester_high),
      constraint friend_edges_ordered check (tester_low < tester_high)
    );
  `);
}
