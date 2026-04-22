import "server-only";
import sql from "mssql";
import { getDBConnection } from "./index";

type ProcInput = {
  type: sql.ISqlType | (() => sql.ISqlType);
  value: unknown;
};

export async function execProc<T = unknown>(
  name: string,
  inputs: Record<string, ProcInput> = {},
): Promise<T[]> {
  const pool = await getDBConnection();
  const request = pool.request();

  for (const [key, { type, value }] of Object.entries(inputs)) {
    request.input(key, type, value);
  }

  const result = await request.execute(name);
  return (result.recordset ?? []) as T[];
}
