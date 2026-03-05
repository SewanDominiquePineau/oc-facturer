import { NextRequest, NextResponse } from 'next/server';
import { getBdcById, updateBdc } from '@/lib/db/queries/bdc';
import { requireAuth } from '@/lib/auth/middleware';
import { validateId, safeJson } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  const invalid = validateId(params.id);
  if (invalid) return invalid;

  try {
    const bdc = await getBdcById(params.id);
    if (!bdc) {
      return NextResponse.json({ success: false, message: 'BDC not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: bdc });
  } catch (error) {
    console.error(`GET /api/bdc/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
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

  const invalid = validateId(params.id);
  if (invalid) return invalid;

  try {
    const body = await safeJson(request);
    if (body instanceof NextResponse) return body;

    const allowedFields = [
      'gdc_contractId', 'gdc_contractName',
      'gdc_invoicedEntityId', 'gdc_invoicedEntityName',
      'id_sophia_go_facturation', 'nom_sophia_facturation',
      'ajout_gdc',
    ];
    const fields: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if ((body as Record<string, unknown>)[key] !== undefined) fields[key] = (body as Record<string, unknown>)[key];
    }

    await updateBdc(params.id, fields);
    const updated = await getBdcById(params.id);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(`PATCH /api/bdc/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
