import { NextRequest, NextResponse } from 'next/server';
import { getBdcList } from '@/lib/db/queries/bdc';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filter = (searchParams.get('filter') || 'all') as 'all' | 'sans_contrat' | 'plus_1mois' | 'enregistre';
    const search = searchParams.get('search') || undefined;

    const bdcList = await getBdcList(filter, search);

    return NextResponse.json({ success: true, data: bdcList, count: bdcList.length });
  } catch (error) {
    console.error('GET /api/bdc error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
