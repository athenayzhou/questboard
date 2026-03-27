import { query } from "./db";

export async function getDisplayNameForTester(
  testerId: string,
): Promise<string | null> {
  const res = await query<{ name: string | null }>(
    `
    select data->'profile'->>'name' as name
    from user_states
    where user_id = $1
    limit 1
    `,
    [testerId],
  );
  const raw = res.rows[0]?.name?.trim();
  return raw && raw.length > 0 ? raw : null;
}
