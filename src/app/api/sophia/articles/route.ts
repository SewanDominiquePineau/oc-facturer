import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { ADD_ARTICLE, DELETE_ARTICLES } from '@/lib/sophia/mutations';
import { requireAuth } from '@/lib/auth/middleware';
import { isValidUUID, safeJson } from '@/lib/validation';

const ARTICLE_ALLOWED_FIELDS = new Set([
  'contractId', 'catalogRef', 'concernedSiteId', 'description',
  'amount', 'SAF', 'qty', 'startDate', 'endDate', 'productId',
  'billingMode', 'commitment',
]);

export async function POST(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  let articleRef = '';

  try {
    const body = await safeJson(request);
    if (body instanceof NextResponse) return body;
    const rawBody = body as Record<string, unknown>;

    if (!rawBody.article || typeof rawBody.article !== 'object') {
      return NextResponse.json(
        { success: false, message: 'article requis (objet)' },
        { status: 400 }
      );
    }

    const rawArticle = rawBody.article as Record<string, unknown>;
    const { contractId, catalogRef } = rawArticle;
    if (!contractId || !catalogRef || typeof contractId !== 'string' || typeof catalogRef !== 'string') {
      return NextResponse.json(
        { success: false, message: 'contractId et catalogRef requis dans article' },
        { status: 400 }
      );
    }

    if (!isValidUUID(contractId)) {
      return NextResponse.json(
        { success: false, message: 'contractId doit etre un UUID valide' },
        { status: 400 }
      );
    }

    const article: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rawArticle)) {
      if (ARTICLE_ALLOWED_FIELDS.has(k)) article[k] = v;
    }
    articleRef = String(catalogRef);
    if (article.amount != null) article.amount = parseFloat(String(article.amount)) || 0;
    if (article.SAF != null) article.SAF = parseFloat(String(article.SAF)) || 0;
    if (article.qty != null) article.qty = parseInt(String(article.qty as string), 10) || 1;

    const isMZ = articleRef.endsWith('-M') || articleRef.endsWith('-Z');
    if (article.SAF === 0 && !isMZ) delete article.SAF;
    if (article.amount === 0 && !isMZ) delete article.amount;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[SOPHIA] addArticle catalogRef:', articleRef);
    }

    const client = getSophiaClient();
    const result = await client.executeGraphQL<{ contract?: { addArticle?: unknown } }>(ADD_ARTICLE, { article });

    return NextResponse.json({
      success: true,
      data: result?.contract?.addArticle,
    });
  } catch (error) {
    console.error('POST /api/sophia/articles error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur serveur',
        ref: articleRef,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await safeJson(request);
    if (body instanceof NextResponse) return body;
    const ids = (body as Record<string, unknown>).ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, message: 'ids requis (tableau non vide)' }, { status: 400 });
    }

    if (ids.some((id: unknown) => typeof id !== 'string' || !isValidUUID(id))) {
      return NextResponse.json({ success: false, message: 'Tous les ids doivent etre des UUID valides' }, { status: 400 });
    }

    const client = getSophiaClient();
    const result = await client.executeGraphQL<{ contract?: { deleteArticles?: unknown } }>(DELETE_ARTICLES, { ids });

    return NextResponse.json({
      success: true,
      data: result?.contract?.deleteArticles,
    });
  } catch (error) {
    console.error('DELETE /api/sophia/articles error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}
