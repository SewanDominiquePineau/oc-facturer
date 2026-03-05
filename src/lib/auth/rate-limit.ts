import { getDbPool } from '@/lib/db/connection';
import { RowDataPacket } from 'mysql2';

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;

let tableChecked = false;

async function ensureTable() {
  if (tableChecked) return;
  const pool = getDbPool();
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS rate_limit (
      rl_key VARCHAR(255) PRIMARY KEY,
      count INT NOT NULL DEFAULT 1,
      reset_at BIGINT NOT NULL
    )
  `);
  tableChecked = true;
}

export async function checkRateLimit(
  key: string,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  windowMs = DEFAULT_WINDOW_MS
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  await ensureTable();
  const pool = getDbPool();
  const now = Date.now();

  await pool.execute('DELETE FROM rate_limit WHERE reset_at < ?', [now]);

  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT count, reset_at FROM rate_limit WHERE rl_key = ? FOR UPDATE',
    [key]
  );

  const entry = rows[0] as (RowDataPacket & { count: number; reset_at: number }) | undefined;

  if (!entry) {
    await pool.execute(
      'INSERT INTO rate_limit (rl_key, count, reset_at) VALUES (?, 1, ?)',
      [key, now + windowMs]
    );
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  const newCount = entry.count + 1;
  await pool.execute(
    'UPDATE rate_limit SET count = ? WHERE rl_key = ?',
    [newCount, key]
  );

  if (newCount > maxAttempts) {
    return { allowed: false, remaining: 0, retryAfterMs: Number(entry.reset_at) - now };
  }

  return { allowed: true, remaining: maxAttempts - newCount, retryAfterMs: 0 };
}

export async function resetRateLimit(key: string): Promise<void> {
  try {
    await ensureTable();
    const pool = getDbPool();
    await pool.execute('DELETE FROM rate_limit WHERE rl_key = ?', [key]);
  } catch {
    // silently ignore cleanup errors
  }
}
