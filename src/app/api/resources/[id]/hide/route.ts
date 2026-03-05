import { NextRequest, NextResponse } from 'next/server';
import { hideResource } from '@/lib/db/queries/resources';
import { requireAuth } from '@/lib/auth/middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    await hideResource(params.id, !!body.hidden);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`PATCH /api/resources/${params.id}/hide error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
