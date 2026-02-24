import { NextRequest, NextResponse } from 'next/server';
import { getFacturationResources } from '@/lib/db/queries/facturation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const tab = (searchParams.get('tab') || 'cmes') as 'cmes' | 'fac_anticipees';
    const filter = (searchParams.get('filter') || 'tous') as 'tous' | 'a_facturer' | 'masquees' | 'dans_gdc';
    const search = searchParams.get('search') || undefined;

    const resources = await getFacturationResources(tab, filter, search);

    return NextResponse.json({
      success: true,
      data: resources,
      count: resources.length,
    });
  } catch (error) {
    console.error('GET /api/bdc/facturation error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
