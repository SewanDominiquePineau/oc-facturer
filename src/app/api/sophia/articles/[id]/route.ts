import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { UPDATE_ARTICLE } from '@/lib/sophia/mutations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const client = getSophiaClient();

    const result = await client.executeGraphQL(UPDATE_ARTICLE, {
      id: params.id,
      article: body.article,
    });

    return NextResponse.json({
      success: true,
      data: result?.contract?.updateArticle,
    });
  } catch (error) {
    console.error(`PATCH /api/sophia/articles/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
