import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { SEARCH_SITES_DETAILED } from '@/lib/sophia/queries';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = request.nextUrl;
    const organizationId = searchParams.get('organizationId') || searchParams.get('orgId') || process.env.SOPHIA_ORGANIZATION_ID!;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const client = getSophiaClient();
    const result = await client.executeGraphQL<{ site?: { getSites?: { edges?: unknown[]; pageInfo?: { count?: number } } } }>(SEARCH_SITES_DETAILED, {
      organizationId,
      internalRecursive: true,
      filters: search ? { textSearch: search } : undefined,
      pagination: { page, limit },
    });

    const data = result?.site?.getSites;

    return NextResponse.json({
      success: true,
      data: data?.edges || [],
      pagination: { count: data?.pageInfo?.count || 0, page },
    });
  } catch (error) {
    console.error('GET /api/sophia/sites error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
