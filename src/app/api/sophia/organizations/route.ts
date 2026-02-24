import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { GET_ORGANIZATION } from '@/lib/sophia/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const orgId = searchParams.get('id') || process.env.SOPHIA_ORGANIZATION_ID!;

    const client = getSophiaClient();
    const result = await client.executeGraphQL(GET_ORGANIZATION, { id: orgId });

    return NextResponse.json({
      success: true,
      data: result?.organization?.getOrganization || null,
    });
  } catch (error) {
    console.error('GET /api/sophia/organizations error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
