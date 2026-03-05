import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { UPDATE_ARTICLE } from '@/lib/sophia/mutations';
import { GET_ARTICLE } from '@/lib/sophia/queries';
import { requireAuth } from '@/lib/auth/middleware';
import { validateId, safeJson } from '@/lib/validation';

const ARTICLE_UPDATE_FIELDS = new Set([
  'amount', 'SAF', 'qty', 'startDate', 'endDate', 'description',
  'concernedSiteId', 'billingMode', 'commitment', 'status',
]);

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
    const result = await client.executeGraphQL<{ contract?: { getArticle?: unknown } }>(GET_ARTICLE, { id: params.id });

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

    const rawArticle = (body as Record<string, unknown>).article;
    if (!rawArticle || typeof rawArticle !== 'object') {
      return NextResponse.json({ success: false, message: 'article requis (objet)' }, { status: 400 });
    }

    const filteredArticle: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rawArticle as Record<string, unknown>)) {
      if (ARTICLE_UPDATE_FIELDS.has(k)) filteredArticle[k] = v;
    }

    const client = getSophiaClient();
    const result = await client.executeGraphQL<{ contract?: { updateArticle?: unknown } }>(UPDATE_ARTICLE, {
      id: params.id,
      article: filteredArticle,
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
