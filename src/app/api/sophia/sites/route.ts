import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { SEARCH_SITES_DETAILED } from '@/lib/sophia/queries';
import { requireAuth } from '@/lib/auth/middleware';
import { getClientByDynamicsId, getClientOrgIds } from '@/lib/db/queries/clients';

interface SitesResult { site?: { getSites?: { edges?: unknown[]; pageInfo?: { count?: number } } } }

async function searchSites(client: ReturnType<typeof getSophiaClient>, orgId: string, search: string, page: number, limit: number) {
  const result = await client.executeGraphQL<SitesResult>(SEARCH_SITES_DETAILED, {
    organizationId: orgId,
    internalRecursive: true,
    filters: search ? { textSearch: search } : undefined,
    pagination: { page, limit },
  });
  return result?.site?.getSites;
}

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = request.nextUrl;
    const organizationId = searchParams.get('organizationId') || searchParams.get('orgId') || null;
    const dynamicsId = searchParams.get('dynamicsAccountId') || null;
    const search = searchParams.get('search') || '';
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 100);

    // Collect all candidate orgIds (from param, client table, and invoicedEntityIds)
    const candidateOrgIds: string[] = [];
    if (organizationId) candidateOrgIds.push(organizationId);

    if (dynamicsId) {
      const clientRow = await getClientByDynamicsId(dynamicsId);
      if (clientRow?.id_sophia_go && !candidateOrgIds.includes(clientRow.id_sophia_go)) {
        candidateOrgIds.push(clientRow.id_sophia_go);
      }
      // Also get distinct invoicedEntityIds for this client (these often point to the right child org)
      const orgIds = await getClientOrgIds(dynamicsId);
      for (const id of orgIds) {
        if (!candidateOrgIds.includes(id)) candidateOrgIds.push(id);
      }
    }

    if (candidateOrgIds.length === 0) {
      const fallback = process.env.SOPHIA_ORGANIZATION_ID;
      if (fallback) candidateOrgIds.push(fallback);
    }

    if (candidateOrgIds.length === 0) {
      return NextResponse.json({ success: false, message: 'Configuration serveur manquante' }, { status: 500 });
    }

    const client = getSophiaClient();

    // Try each candidate orgId, keep the one with the most results
    let bestData: { edges?: unknown[]; pageInfo?: { count?: number } } | null = null;
    let bestCount = 0;

    for (const orgId of candidateOrgIds) {
      try {
        const data = await searchSites(client, orgId, search, page, limit);
        const count = data?.pageInfo?.count || 0;
        if (count > bestCount) {
          bestData = data ?? null;
          bestCount = count;
          if (count > 10) break; // Good enough, stop searching
        }
      } catch {
        // Skip invalid orgIds
      }
    }

    return NextResponse.json({
      success: true,
      data: bestData?.edges || [],
      pagination: { count: bestData?.pageInfo?.count || 0, page },
    });
  } catch (error) {
    console.error('GET /api/sophia/sites error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
