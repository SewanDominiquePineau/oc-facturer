import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { GET_ORGANIZATION } from '@/lib/sophia/queries';
import { requireAuth } from '@/lib/auth/middleware';
import { isValidUUID } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = request.nextUrl;
    const orgId = searchParams.get('id') || process.env.SOPHIA_ORGANIZATION_ID;
    if (!orgId) return NextResponse.json({ success: false, message: 'Configuration serveur manquante' }, { status: 500 });
    if (!isValidUUID(orgId)) return NextResponse.json({ success: false, message: 'ID organisation invalide' }, { status: 400 });

    const client = getSophiaClient();
    const result = await client.executeGraphQL<{ organization?: { getOrganization?: unknown } }>(GET_ORGANIZATION, { id: orgId });

    return NextResponse.json({
      success: true,
      data: result?.organization?.getOrganization || null,
    });
  } catch (error) {
    console.error('GET /api/sophia/organizations error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
