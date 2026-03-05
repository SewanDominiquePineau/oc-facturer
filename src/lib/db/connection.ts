import mysql from 'mysql2/promise';

const globalForDb = globalThis as unknown as {
  dbPool: mysql.Pool | undefined;
};

function validateDbEnv() {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Variables d'environnement DB manquantes: ${missing.join(', ')}`);
  }
}

export function getDbPool(): mysql.Pool {
  if (!globalForDb.dbPool) {
    validateDbEnv();
    globalForDb.dbPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: 'utf8mb4',
    });
  }
  return globalForDb.dbPool;
}
