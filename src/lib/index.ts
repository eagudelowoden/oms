// lib/db/index.ts
import "server-only";
import { Kysely, MssqlDialect } from "kysely";
import * as Tedious from "tedious";
import * as Tarn from "tarn";
import sql, { type ConnectionPool } from "mssql";
import type { DB } from "./types";

// ── Kysely (para queries tipadas) ──
const dialect = new MssqlDialect({
  tarn: { ...Tarn, options: { min: 0, max: 10 } },
  tedious: {
    ...Tedious,
    connectionFactory: () =>
      new Tedious.Connection({
        authentication: {
          type: "default",
          options: {
            userName: process.env.DB_USER!,
            password: process.env.DB_PASSWORD!,
          },
        },
        server: process.env.DB_SERVER!,
        options: {
          database: process.env.DB_NAME!,
          encrypt: true,
          trustServerCertificate: true,
        },
      }),
  },
});

export const db = new Kysely<DB>({ dialect });
//                         ^^^^ ← ESTO es lo importante

// ── mssql pool (para stored procedures) ──
let poolPromise: Promise<ConnectionPool> | null = null;

export function getDBConnection(): Promise<ConnectionPool> {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool({
      server: process.env.DB_SERVER!,
      database: process.env.DB_NAME!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      options: { encrypt: true, trustServerCertificate: true },
    });
    poolPromise = pool.connect();
  }
  return poolPromise;
}
