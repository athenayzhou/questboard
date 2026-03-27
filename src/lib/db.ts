import { Pool } from "pg";
import type { QueryResult, QueryResultRow } from "pg";

const caRaw = process.env.DO_DB_CA_PEM ?? "";
const ca = caRaw.includes("\\n") ? caRaw.replace(/\\n/g, "\n") : caRaw;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: ca
    ? {
        ca,
        rejectUnauthorized: true,
      }
    : {
        rejectUnauthorized: true,
      },
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

type TransactionQuery = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) => Promise<QueryResult<T>>;

export async function withTransaction<T>(
  run: (txQuery: TransactionQuery) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const txQuery: TransactionQuery = <R extends QueryResultRow = QueryResultRow>(
      text: string,
      params: unknown[] = [],
    ) => client.query<R>(text, params);
    const result = await run(txQuery);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}