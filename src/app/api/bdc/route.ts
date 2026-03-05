import { NextRequest, NextResponse } from 'next/server';
import { getBdcList } from '@/lib/db/queries/bdc';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = request.nextUrl;
    const filter = (searchParams.get('filter') || 'all') as 'all' | 'sans_contrat' | 'plus_1mois' | 'enregistre';
    const search = searchParams.get('search') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));

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
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
