import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { CONTRACTS_LIST } from '@/lib/sophia/queries';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';
    const orgId = searchParams.get('organizationId') || process.env.SOPHIA_ORGANIZATION_ID!;
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const client = getSophiaClient();
    const result = await client.executeGraphQL(CONTRACTS_LIST, {
      organizationId: orgId,
      pagination: { page, limit },
      status: [],
      search,
      sort: [{ id: 'contractNumber', desc: false }],
    });

    const data = result?.contract?.list;
    const contracts = (data?.edges || []).map((edge: any) => ({
      id: edge.id,
      name: edge.contractNumber,
      status: edge.status,
      organization: { id: edge.client?.id, name: edge.client?.name },
      lastUpdate: edge.lastUpdate,
    }));

    return NextResponse.json({
      success: true,
      data: contracts,
      pagination: {
        total: data?.pageInfo?.count || 0,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('GET /api/sophia/contracts error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
