import { NextRequest, NextResponse } from 'next/server';
import { getClientByDynamicsId } from '@/lib/db/queries/clients';
import { requireAuth } from '@/lib/auth/middleware';

const DYNAMICS_ID_REGEX = /^[a-zA-Z0-9_-]{1,100}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: { dynamicsAccountId: string } }
) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    if (!params.dynamicsAccountId || !DYNAMICS_ID_REGEX.test(params.dynamicsAccountId)) {
      return NextResponse.json({ success: false, message: 'ID client invalide' }, { status: 400 });
    }

    const client = await getClientByDynamicsId(params.dynamicsAccountId);

    if (!client) {
      return NextResponse.json({ success: false, message: 'Client introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    console.error('GET /api/clients/[dynamicsAccountId] error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
