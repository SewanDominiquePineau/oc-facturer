import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { CHECK_SITE_IN_CONTRACT } from '@/lib/sophia/queries';
import { requireAuth } from '@/lib/auth/middleware';
import { getDbPool } from '@/lib/db/connection';
import { isValidUUID } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = request.nextUrl;
    const siteId = searchParams.get('siteId');
    const contractId = searchParams.get('contractId');

    if (!siteId || !contractId) {
      return NextResponse.json(
        { success: false, message: 'siteId et contractId requis' },
        { status: 400 }
      );
    }

    if (!isValidUUID(siteId) || !isValidUUID(contractId)) {
      return NextResponse.json(
        { success: false, message: 'siteId et contractId doivent être des UUID valides' },
        { status: 400 }
      );
    }

    const client = getSophiaClient();
    const result = await client.executeGraphQL<{ contract?: { get?: { client?: { id?: string; name?: string } } }; organization?: { getHierarchy?: { id: string; name: string; type: string }[] }; site?: { getSite?: { livePerId?: string } } }>(CHECK_SITE_IN_CONTRACT, {
      contractId,
      siteId,
    });

    const contractClient = result?.contract?.get?.client;
    const hierarchy: { id: string; name: string; type: string }[] =
      result?.organization?.getHierarchy || [];
    const siteData = result?.site?.getSite;

    if (!contractClient?.id) {
      return NextResponse.json(
        { success: false, message: 'Contrat introuvable dans Sophia' },
        { status: 404 }
      );
    }

    const verified = hierarchy.some(node => node.id === contractClient.id);

    if (siteData?.livePerId && siteId) {
      try {
        const pool = getDbPool();
        await pool.execute(
          'UPDATE site SET per_id = ? WHERE id_sophia_go = ? AND (per_id IS NULL OR per_id != ?)',
          [siteData.livePerId, siteId, siteData.livePerId]
        );
      } catch (dbErr) {
        console.error('Failed to update site.per_id:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        verified,
        clientId: contractClient.id,
        clientName: contractClient.name,
        livePerId: siteData?.livePerId || null,
        hierarchy,
      },
    });
  } catch (error) {
    console.error('GET /api/sophia/sites/verify error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
