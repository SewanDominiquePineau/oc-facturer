import { NextRequest, NextResponse } from 'next/server';
import { getClientByDynamicsId } from '@/lib/db/queries/clients';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { dynamicsAccountId: string } }
) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const client = await getClientByDynamicsId(params.dynamicsAccountId);

    if (!client) {
      return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    console.error(`GET /api/clients/${params.dynamicsAccountId} error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
