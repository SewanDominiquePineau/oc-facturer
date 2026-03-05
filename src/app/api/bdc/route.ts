import { NextRequest, NextResponse } from 'next/server';
import { getBdcList } from '@/lib/db/queries/bdc';
import { requireAuth } from '@/lib/auth/middleware';
import { safePagination } from '@/lib/validation';

const VALID_FILTERS = ['all', 'sans_contrat', 'plus_1mois', 'enregistre'] as const;
type BdcFilter = (typeof VALID_FILTERS)[number];

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = request.nextUrl;
    const rawFilter = searchParams.get('filter') || 'all';
    const filter: BdcFilter = VALID_FILTERS.includes(rawFilter as BdcFilter)
      ? (rawFilter as BdcFilter)
      : 'all';
    const search = searchParams.get('search') || undefined;
    const { page, pageSize } = safePagination(searchParams);

    const { data, total } = await getBdcList(filter, search, page, pageSize);

    return NextResponse.json({
      success: true,
      data,
      count: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('GET /api/bdc error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
