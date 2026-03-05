import { NextRequest, NextResponse } from 'next/server';
import { updateResource } from '@/lib/db/queries/resources';
import { requireAuth } from '@/lib/auth/middleware';
import { validateId, safeJson } from '@/lib/validation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  const invalid = validateId(params.id);
  if (invalid) return invalid;

  try {
    const body = await safeJson(request);
    if (body instanceof NextResponse) return body;

    await updateResource(params.id, body as Record<string, unknown>);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`PATCH /api/resources/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
