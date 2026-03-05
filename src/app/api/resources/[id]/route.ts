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

    const ALLOWED = [
      'gdc_catalogRef', 'gdc_categoryId', 'gdc_serviceId', 'gdc_productName',
      'gdc_productName_update', 'gdc_contractId',
      'gdc_id_product', 'gdc_itemStatus', 'gdc_hidden',
      'id_site_sophia_go', 'gdc_concernedSiteId', 'code_produit',
    ];
    const raw = body as Record<string, unknown>;
    const fields: Record<string, unknown> = {};
    for (const key of ALLOWED) {
      if (raw[key] !== undefined) fields[key] = raw[key];
    }

    await updateResource(params.id, fields);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`PATCH /api/resources/${params.id} error:`, error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
