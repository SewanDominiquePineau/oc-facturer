import { NextRequest, NextResponse } from 'next/server';
import { getFacturationResources } from '@/lib/db/queries/facturation';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = request.nextUrl;
    const tab = (searchParams.get('tab') || 'cmes') as 'cmes' | 'fac_anticipees';
    const filter = (searchParams.get('filter') || 'tous') as 'tous' | 'a_facturer' | 'masquees' | 'dans_gdc';
    const search = searchParams.get('search') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));
    const sortKey = searchParams.get('sortKey') || undefined;
    const sortDir = (searchParams.get('sortDir') || 'asc') as 'asc' | 'desc';

    const { data, total } = await getFacturationResources(tab, filter, search, page, pageSize, sortKey, sortDir);

    return NextResponse.json({
      success: true,
      data,
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('GET /api/bdc/facturation error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
