import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/connection';
import { getSophiaClient } from '@/lib/sophia/client';

export async function GET() {
  const checks: Record<string, { status: string; message?: string }> = {};

  // Check DB
  try {
    const pool = getDbPool();
    await pool.execute('SELECT 1');
    checks.database = { status: 'ok' };
  } catch (error) {
    checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown',
    };
  }

  // Check Sophia
  try {
    const client = getSophiaClient();
    const ok = await client.testConnection();
    checks.sophia = ok
      ? { status: 'ok' }
      : { status: 'error', message: 'Connection test failed' };
  } catch (error) {
    checks.sophia = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown',
    };
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok');

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
