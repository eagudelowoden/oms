// src/lib/db.ts
import sql from 'mssql';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  dbName?: string;
}

const pools = new Map<string, sql.ConnectionPool>();

export const getDBConnection = async (forceGeneral: boolean = false): Promise<sql.ConnectionPool> => {
  let dbName = "WmsWdGeneral";

  if (!forceGeneral) {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      if (token) {
        const decoded = jwt.decode(token) as JWTPayload;
        if (decoded?.dbName) dbName = decoded.dbName;
      }
    } catch {
      // En TS moderno, si no usas el error, puedes dejar el catch vacío
      console.warn("⚠️ No se pudo leer el token, usando DB General.");
    }
  }

  if (pools.has(dbName)) {
    const p = pools.get(dbName)!;
    if (p.connected) return p;
    pools.delete(dbName);
  }

  const config: sql.config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || '',
    database: dbName,
    port: Number(process.env.DB_PORT) || 1433,
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true,
      connectTimeout: 15000
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };

  try {
    const pool = await new sql.ConnectionPool(config).connect();
    pools.set(dbName, pool);
    console.log(`✅ Conexión exitosa a: ${dbName}`);
    return pool;
  } catch (err: unknown) {
    // Tipado seguro para el error
    const errorMessage = err instanceof Error ? err.message : String(err);

    console.error(`❌ Error de Login en ${dbName}:`, errorMessage);

    if (dbName !== "WmsWdGeneral") {
      console.warn(`🔄 Reintentando conectar a WmsWdGeneral como respaldo...`);
      return getDBConnection(true);
    }

    throw err;
  }
};