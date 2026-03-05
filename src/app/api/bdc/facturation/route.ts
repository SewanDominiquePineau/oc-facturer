import { NextRequest, NextResponse } from 'next/server';
import { getFacturationResources } from '@/lib/db/queries/facturation';
import { requireAuth } from '@/lib/auth/middleware';
import { safePagination } from '@/lib/validation';

const VALID_TABS = ['cmes', 'fac_anticipees'] as const;
const VALID_FILTERS = ['tous', 'a_facturer', 'masquees', 'dans_gdc'] as const;

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = request.nextUrl;
    const rawTab = searchParams.get('tab') || 'cmes';
    const tab = VALID_TABS.includes(rawTab as typeof VALID_TABS[number])
      ? (rawTab as typeof VALID_TABS[number])
      : 'cmes';
    const rawFilter = searchParams.get('filter') || 'tous';
    const filter = VALID_FILTERS.includes(rawFilter as typeof VALID_FILTERS[number])
      ? (rawFilter as typeof VALID_FILTERS[number])
      : 'tous';
    const search = searchParams.get('search') || undefined;
    const { page, pageSize } = safePagination(searchParams);
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
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
