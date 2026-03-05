import { NextRequest, NextResponse } from 'next/server';
import { getCancelledBdcIds } from '@/lib/db/queries/facturation';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const cancelledIds = await getCancelledBdcIds();
    return NextResponse.json({ success: true, data: cancelledIds });
  } catch (error) {
    console.error('GET /api/bdc/facturation/cancelled error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
