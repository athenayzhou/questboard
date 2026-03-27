import { Pool } from "pg";
import type { QueryResult, QueryResultRow } from "pg";

const caRaw = process.env.DO_DB_CA_PEM?.trim() ?? "";
const ca = caRaw.includes("\\n") ? caRaw.replace(/\\n/g, "\n") : caRaw;
const hasValidCaPem =
  ca.includes("-----BEGIN CERTIFICATE-----") &&
  ca.includes("-----END CERTIFICATE-----");
const rawDatabaseUrl = process.env.DATABASE_URL ?? "";

function stripSslQueryParams(url: string): string {
  try {
    const parsed = new URL(url);
    const sslKeys = [
      "ssl",
      "sslmode",
      "sslrootcert",
      "sslcert",
      "sslkey",
      "sslpassword",
      "sslcrl",
      "ssl_min_protocol_version",
      "ssl_max_protocol_version",
      "sslnegotiation",
      "channel_binding",
      "gssencmode",
      "usetlibpqcompat",
      "uselibpqcompat",
    ];
    for (const key of sslKeys) parsed.searchParams.delete(key);
    return parsed.toString();
  } catch {
    // If DATABASE_URL is malformed, keep original and let pg throw normally.
    return url;
  }
}

const connectionString = stripSslQueryParams(rawDatabaseUrl);

const pool = new Pool({
  connectionString,
  ssl: hasValidCaPem
    ? {
        ca,
        rejectUnauthorized: true,
      }
    : {
        rejectUnauthorized: false,
      },
});

console.info(
  `[db] SSL mode: ${hasValidCaPem ? "strict-ca" : "tls-no-verify"} (DO_DB_CA_PEM ${
    caRaw ? "present" : "absent"
  }, ssl params in URL stripped)`,
);

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