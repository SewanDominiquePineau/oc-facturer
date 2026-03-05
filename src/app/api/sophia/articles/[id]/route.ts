import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { UPDATE_ARTICLE } from '@/lib/sophia/mutations';
import { GET_ARTICLE } from '@/lib/sophia/queries';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await context.params;
    const client = getSophiaClient();

    const result = await client.executeGraphQL(GET_ARTICLE, { id });

    return NextResponse.json({
      success: true,
      data: result?.contract?.getArticle,
    });
  } catch (error) {
    console.error('GET /api/sophia/articles/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const client = getSophiaClient();

    const result = await client.executeGraphQL(UPDATE_ARTICLE, {
      id,
      article: body.article,
    });

    return NextResponse.json({
      success: true,
      data: result?.contract?.updateArticle,
    });
  } catch (error) {
    console.error('PATCH /api/sophia/articles/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
