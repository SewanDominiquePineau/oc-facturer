import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { UPDATE_ARTICLE } from '@/lib/sophia/mutations';
import { GET_ARTICLE } from '@/lib/sophia/queries';
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
    const client = getSophiaClient();
    const result = await client.executeGraphQL(GET_ARTICLE, { id: params.id });

    return NextResponse.json({
      success: true,
      data: result?.contract?.getArticle,
    });
  } catch (error) {
    console.error('GET /api/sophia/articles/[id] error:', error);
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

    const client = getSophiaClient();
    const result = await client.executeGraphQL(UPDATE_ARTICLE, {
      id: params.id,
      article: (body as Record<string, unknown>).article,
    });

    return NextResponse.json({
      success: true,
      data: result?.contract?.updateArticle,
    });
  } catch (error) {
    console.error('PATCH /api/sophia/articles/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
