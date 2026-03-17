// src/lib/db.ts
import sql from 'mssql';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  dbName?: string;
}

const pools = new Map<string, sql.ConnectionPool>();

export const getDBConnection = async (forceGeneral: boolean = false): Promise<sql.ConnectionPool> => {
  // Si forceGeneral es true, ignoramos TODO y vamos a la Maestra
  let dbName = forceGeneral ? "WmsWdGeneral" : "WmsWdGeneral";

  if (!forceGeneral) {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      if (token) {
        const decoded = jwt.decode(token) as JWTPayload;
        if (decoded?.dbName) dbName = decoded.dbName;
      }
    } catch (e) {
      console.warn("⚠️ Usando DB General por defecto.");
    }
  }

  // REVISIÓN DE POOL: Verificamos si el pool en el mapa coincide con la dbName que queremos
  if (pools.has(dbName)) {
    const p = pools.get(dbName)!;
    if (p.connected) return p;
    pools.delete(dbName);
  }

  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || '',
    database: dbName, // "WmsWdGeneral" o "WmsWdLegacyCostaRica"
    port: 14331,
    options: { 
      encrypt: true, 
      trustServerCertificate: true,
      enableArithAbort: true 
    }
  };

  try {
    const pool = await new sql.ConnectionPool(config).connect();
    pools.set(dbName, pool);
    return pool;
  } catch (err) {
    console.error(`❌ Error conectando a ${dbName}:`, err);
    throw err;
  }
};