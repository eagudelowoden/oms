// src/lib/db-helpers.ts
import sql from "mssql";
import { getDBConnection } from "./db";

type InputSpec = {
  type?: sql.ISqlType | (() => sql.ISqlType);
  value: unknown;
};

export async function execProc<T = unknown>(
  name: string,
  inputs: Record<string, InputSpec | unknown> = {}, // 1. Permitimos unknown para evitar el error de 'any'
): Promise<T[]> {
  const pool = await getDBConnection();
  const request = pool.request();

  for (const [key, val] of Object.entries(inputs)) {
    // 2. Verificamos si es un objeto InputSpec { type, value }
    if (val !== null && typeof val === "object" && "value" in val) {
      const spec = val as InputSpec;

      // 3. Evitamos pasar 'undefined' al segundo argumento de .input()
      if (spec.type) {
        request.input(key, spec.type, spec.value);
      } else {
        request.input(key, spec.value);
      }
    } else {
      // 4. Si es un valor directo (ej: string o number), lo pasamos directamente
      request.input(key, val);
    }
  }

  const result = await request.execute(name);
  return (result.recordset ?? []) as T[];
}
export async function execQuery<T = unknown>(
  query: string,
  inputs: Record<string, InputSpec | unknown> = {},
): Promise<T[]> {
  const pool = await getDBConnection();
  const request = pool.request();

  for (const [key, val] of Object.entries(inputs)) {
    if (val !== null && typeof val === "object" && "value" in val) {
      const spec = val as InputSpec;

      // LA CORRECCIÓN:
      // Si existe el tipo, lo pasamos. Si no, solo pasamos el valor.
      if (spec.type) {
        request.input(key, spec.type, spec.value);
      } else {
        request.input(key, spec.value);
      }
    } else {
      request.input(key, val);
    }
  }

  const { recordset } = await request.query(query);
  return (recordset ?? []) as T[];
}
