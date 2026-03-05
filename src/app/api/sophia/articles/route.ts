import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { ADD_ARTICLE, DELETE_ARTICLES } from '@/lib/sophia/mutations';
import { requireAuth } from '@/lib/auth/middleware';
import { isValidUUID } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  let article: Record<string, any> | undefined;

  try {
    const body = await request.json();

    if (!body.article || typeof body.article !== 'object') {
      return NextResponse.json(
        { success: false, message: 'article requis (objet)' },
        { status: 400 }
      );
    }

    const { contractId, catalogRef } = body.article;
    if (!contractId || !catalogRef) {
      return NextResponse.json(
        { success: false, message: 'contractId et catalogRef requis dans article' },
        { status: 400 }
      );
    }

    article = { ...body.article };
    if (article.amount != null) article.amount = parseFloat(String(article.amount)) || 0;
    if (article.SAF != null) article.SAF = parseFloat(String(article.SAF)) || 0;
    if (article.qty != null) article.qty = parseInt(String(article.qty), 10) || 1;

    if (article.SAF === 0) delete article.SAF;
    if (article.amount === 0) delete article.amount;

    console.log('[SOPHIA] addArticle payload:', JSON.stringify(article, null, 2));

    const client = getSophiaClient();
    const result = await client.executeGraphQL(ADD_ARTICLE, { article });

    return NextResponse.json({
      success: true,
      data: result?.contract?.addArticle,
      sentPayload: article,
    });
  } catch (error) {
    console.error('POST /api/sophia/articles error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        sentPayload: article,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  let payload: { ids?: unknown } | undefined;

  try {
    const body = await request.json();
    payload = body;
    const ids = body.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, message: 'ids requis (tableau non vide)' }, { status: 400 });
    }

    if (ids.some((id: unknown) => typeof id !== 'string' || !isValidUUID(id))) {
      return NextResponse.json({ success: false, message: 'Tous les ids doivent etre des UUID valides' }, { status: 400 });
    }

    console.log('[SOPHIA] deleteArticles payload:', JSON.stringify(ids));

    const client = getSophiaClient();
    const result = await client.executeGraphQL(DELETE_ARTICLES, { ids });

    return NextResponse.json({
      success: true,
      data: result?.contract?.deleteArticles,
      sentPayload: { ids },
    });
  } catch (error) {
    console.error('DELETE /api/sophia/articles error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        sentPayload: payload,
      },
      { status: 500 }
    );
  }
}
