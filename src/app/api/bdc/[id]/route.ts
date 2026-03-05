import { NextRequest, NextResponse } from 'next/server';
import { getBdcById, updateBdc } from '@/lib/db/queries/bdc';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const bdc = await getBdcById(params.id);
    if (!bdc) {
      return NextResponse.json({ success: false, message: 'BDC not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: bdc });
  } catch (error) {
    console.error(`GET /api/bdc/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();

    const allowedFields = [
      'gdc_contractId', 'gdc_contractName',
      'gdc_invoicedEntityId', 'gdc_invoicedEntityName', 'ajout_gdc',
    ];
    const fields: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) fields[key] = body[key];
    }

    await updateBdc(params.id, fields);
    const updated = await getBdcById(params.id);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(`PATCH /api/bdc/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
