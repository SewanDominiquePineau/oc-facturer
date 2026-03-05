import { NextRequest, NextResponse } from 'next/server';
import { getResourcesByBdcId } from '@/lib/db/queries/resources';
import { requireAuth } from '@/lib/auth/middleware';
import { validateId } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  const invalid = validateId(params.id);
  if (invalid) return invalid;

  try {
    const resources = await getResourcesByBdcId(params.id);
    return NextResponse.json({ success: true, data: resources, count: resources.length });
  } catch (error) {
    console.error(`GET /api/bdc/${params.id}/resources error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
