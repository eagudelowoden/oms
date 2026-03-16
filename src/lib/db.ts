// src/lib/db.ts
import sql from 'mssql';

const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || '',
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '14331'),
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

// Singleton para no saturar a Amazon RDS de conexiones
let pool: sql.ConnectionPool | null = null;

export const getDBConnection = async () => {
  if (pool) return pool; // Si ya existe la conexión, la reutiliza
  
  try {
    console.log(`📡 Conectando a AWS RDS: ${sqlConfig.server}...`);
    pool = await sql.connect(sqlConfig);
    console.log(`✅ Conexión establecida con ${sqlConfig.database}`);
    return pool;
  } catch (err) {
    console.error('❌ Error crítico de DB:', err);
    pool = null;
    throw err;
  }
};