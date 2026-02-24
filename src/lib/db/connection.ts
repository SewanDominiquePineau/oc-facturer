import mysql from 'mysql2/promise';

const globalForDb = globalThis as unknown as {
  dbPool: mysql.Pool | undefined;
};

export function getDbPool(): mysql.Pool {
  if (!globalForDb.dbPool) {
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
    });
  }
  return globalForDb.dbPool;
}
