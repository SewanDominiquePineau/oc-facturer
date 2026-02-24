import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { ADD_ARTICLE, DELETE_ARTICLES } from '@/lib/sophia/mutations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSophiaClient();

    const result = await client.executeGraphQL(ADD_ARTICLE, { article: body.article });

    return NextResponse.json({
      success: true,
      data: result?.contract?.addArticle,
    });
  } catch (error) {
    console.error('POST /api/sophia/articles error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const ids = body.ids as string[];

    if (!ids || ids.length === 0) {
      return NextResponse.json({ success: false, message: 'ids required' }, { status: 400 });
    }

    const client = getSophiaClient();
    const result = await client.executeGraphQL(DELETE_ARTICLES, { ids });

    return NextResponse.json({
      success: true,
      data: result?.contract?.deleteArticles,
    });
  } catch (error) {
    console.error('DELETE /api/sophia/articles error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
