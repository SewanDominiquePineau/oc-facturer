import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db/connection';
import { getSophiaClient } from '@/lib/sophia/client';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const checks: Record<string, { status: string }> = {};

  try {
    const pool = getDbPool();
    await pool.execute('SELECT 1');
    checks.database = { status: 'ok' };
  } catch {
    checks.database = { status: 'error' };
  }

  try {
    const client = getSophiaClient();
    const ok = await client.testConnection();
    checks.sophia = { status: ok ? 'ok' : 'error' };
  } catch {
    checks.sophia = { status: 'error' };
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok');

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', checks },
    { status: allOk ? 200 : 503 }
  );
}
