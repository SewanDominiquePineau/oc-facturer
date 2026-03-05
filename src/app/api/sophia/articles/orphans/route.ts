import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { LIST_ARTICLES } from '@/lib/sophia/queries';
import { getDbPool } from '@/lib/db/connection';
import { requireAuth } from '@/lib/auth/middleware';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');
    const siteId = searchParams.get('siteId');

    if (!contractId) {
      return NextResponse.json(
        { success: false, message: 'contractId requis' },
        { status: 400 }
      );
    }

    const client = getSophiaClient();
    const variables: Record<string, any> = {
      contractId,
      pagination: { page: 1, limit: 200 },
    };
    if (siteId) {
      variables.concernedSiteId = [siteId];
    }

    const result = await client.executeGraphQL(LIST_ARTICLES, variables);
    const goArticles: any[] = result?.contract?.listArticles?.edges || [];

    if (goArticles.length === 0) {
      return NextResponse.json({ success: true, data: [], totalGo: 0 });
    }

    const goIds = goArticles.map((a: any) => a.id);

    const pool = getDbPool();
    const placeholders = goIds.map(() => '?').join(',');
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT gdc_id_product FROM ressource_dpl WHERE gdc_id_product IN (${placeholders})`,
      goIds
    );
    const knownIds = new Set((rows as any[]).map(r => r.gdc_id_product));

    const orphans = goArticles.filter((a: any) => !knownIds.has(a.id));

    return NextResponse.json({
      success: true,
      data: orphans,
      totalGo: goArticles.length,
      totalOrphans: orphans.length,
    });
  } catch (error) {
    console.error('GET /api/sophia/articles/orphans error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
