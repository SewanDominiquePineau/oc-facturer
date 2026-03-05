import { NextRequest, NextResponse } from 'next/server';
import { updateBdc, getBdcById } from '@/lib/db/queries/bdc';
import { requireAuth } from '@/lib/auth/middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();

    await updateBdc(params.id, { ajout_gdc: body.ajout_gdc ? 1 : 0 });
    const updated = await getBdcById(params.id);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(`PATCH /api/bdc/${params.id}/ajout-gdc error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
