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
    const orgId = process.env.SOPHIA_ORGANIZATION_ID;
    if (!orgId) return NextResponse.json({ success: false, message: 'Configuration serveur manquante' }, { status: 500 });
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '25', 10) || 25, 1), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);

    const client = getSophiaClient();
    const result = await client.executeGraphQL<{ contract?: { list?: { edges?: unknown[]; pageInfo?: { count?: number } } } }>(CONTRACTS_LIST, {
      organizationId: orgId,
      pagination: { page, limit },
      status: [],
      search,
      sort: [{ id: 'contractNumber', desc: false }],
    });

    const data = result?.contract?.list;
    interface ContractEdge { id?: string; contractNumber?: string; status?: string; client?: { id?: string; name?: string }; lastUpdate?: string }
    const contracts = ((data?.edges || []) as ContractEdge[]).map((edge) => ({
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
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
