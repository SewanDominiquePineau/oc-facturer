import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { LIST_ARTICLES } from '@/lib/sophia/queries';
import { getDbPool } from '@/lib/db/connection';
import { requireAuth } from '@/lib/auth/middleware';
import { isValidUUID } from '@/lib/validation';
import { RowDataPacket } from 'mysql2';

interface GoArticle {
  id: string;
  catalogRef?: string;
  customName?: string;
  itemStatus?: string;
  amount?: number;
  SAF?: number;
  qty?: number;
  productName?: string;
  inServiceDate?: string;
  invoiceDate?: string;
  terminationDate?: string;
}

interface ListArticlesResult {
  contract?: {
    listArticles?: {
      edges?: GoArticle[];
    };
  };
}

export async function GET(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');
    const siteId = searchParams.get('siteId');

    if (!contractId || !isValidUUID(contractId)) {
      return NextResponse.json(
        { success: false, message: 'contractId requis (UUID valide)' },
        { status: 400 }
      );
    }

    if (siteId && !isValidUUID(siteId)) {
      return NextResponse.json(
        { success: false, message: 'siteId invalide (UUID attendu)' },
        { status: 400 }
      );
    }

    const client = getSophiaClient();
    const variables: Record<string, unknown> = {
      contractId,
      pagination: { page: 1, limit: 200 },
    };
    if (siteId) {
      variables.concernedSiteId = [siteId];
    }

    const result = await client.executeGraphQL<ListArticlesResult>(LIST_ARTICLES, variables);
    const goArticles: GoArticle[] = result?.contract?.listArticles?.edges || [];

    if (goArticles.length === 0) {
      return NextResponse.json({ success: true, data: [], totalGo: 0 });
    }

    const goIds = goArticles.map(a => a.id);

    const pool = getDbPool();
    const placeholders = goIds.map(() => '?').join(',');
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT gdc_id_product FROM ressource_dpl WHERE gdc_id_product IN (${placeholders})`,
      goIds
    );
    const knownIds = new Set((rows as Array<{ gdc_id_product: string }>).map(r => r.gdc_id_product));

    const orphans = goArticles.filter(a => !knownIds.has(a.id));

    return NextResponse.json({
      success: true,
      data: orphans,
      totalGo: goArticles.length,
      totalOrphans: orphans.length,
    });
  } catch (error) {
    console.error('GET /api/sophia/articles/orphans error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
