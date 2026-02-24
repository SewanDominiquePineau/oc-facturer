import { NextRequest, NextResponse } from 'next/server';
import { getResourcesByBdcId } from '@/lib/db/queries/resources';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resources = await getResourcesByBdcId(params.id);
    return NextResponse.json({ success: true, data: resources, count: resources.length });
  } catch (error) {
    console.error(`GET /api/bdc/${params.id}/resources error:`, error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
