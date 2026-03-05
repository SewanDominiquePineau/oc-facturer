import { NextRequest, NextResponse } from 'next/server';
import { getSophiaClient } from '@/lib/sophia/client';
import { GET_SITE_DETAIL, CHECK_SITE_IN_CONTRACT } from '@/lib/sophia/queries';
import { requireAuth } from '@/lib/auth/middleware';
import { getDbPool } from '@/lib/db/connection';
import { isValidUUID, safeJson } from '@/lib/validation';
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await safeJson(request);
    if (body instanceof NextResponse) return body;

    const { siteId, resourceId, contractId } = body as { siteId?: string; resourceId?: string; contractId?: string };

    if (!siteId || !resourceId || !contractId) {
      return NextResponse.json(
        { success: false, message: 'siteId, resourceId et contractId requis' },
        { status: 400 }
      );
    }

    if (!isValidUUID(siteId) || !isValidUUID(contractId) || !isValidUUID(resourceId)) {
      return NextResponse.json(
        { success: false, message: 'siteId, contractId et resourceId doivent etre des identifiants valides' },
        { status: 400 }
      );
    }

    const sophia = getSophiaClient();

    // 1. Verify site belongs to contract client
    const verifyResult = await sophia.executeGraphQL<{ contract?: { get?: { client?: { id?: string; name?: string } } }; organization?: { getHierarchy?: { id: string; name: string; type: string }[] } }>(CHECK_SITE_IN_CONTRACT, {
      contractId,
      siteId,
    });

    const contractClient = verifyResult?.contract?.get?.client;
    const hierarchy: { id: string; name: string; type: string }[] =
      verifyResult?.organization?.getHierarchy || [];

    if (!contractClient?.id) {
      return NextResponse.json(
        { success: false, message: 'Contrat introuvable dans Sophia' },
        { status: 404 }
      );
    }

    const verified = hierarchy.some(node => node.id === contractClient.id);
    if (!verified) {
      return NextResponse.json(
        { success: false, message: `Le site n'appartient pas au client "${contractClient.name}" du contrat` },
        { status: 400 }
      );
    }

    // 2. Get site details from Sophia
    const siteResult = await sophia.executeGraphQL<{ site?: { getSite?: { id?: string; name?: string; address?: { street?: string; zipCode?: string; city?: string; complement?: string } } } }>(GET_SITE_DETAIL, { id: siteId });
    const site = siteResult?.site?.getSite;

    if (!site) {
      return NextResponse.json(
        { success: false, message: 'Site introuvable dans Sophia' },
        { status: 404 }
      );
    }

    // 3. Upsert into site table
    const pool = getDbPool();
    const address = site.address || {};
    const addressStr = [address.street, address.zipCode, address.city]
      .filter(Boolean).join(', ');

    // Check if site already exists by id_sophia_go
    const [existingRows] = await pool.execute<RowDataPacket[]>(
      `SELECT id_site FROM site WHERE id_sophia_go = ? LIMIT 1`,
      [site.id ?? '']
    );
    const existingRow = existingRows[0];

    let siteIdFk: string;

    if (existingRow) {
      // Update existing site
      await pool.execute(
        `UPDATE site SET site_nom_sophia = ?, adresse_voie = ?, adresse_code_postal = ?, adresse_ville = ?, adresse_complement = ?
         WHERE id_site = ?`,
        [
          site.name ?? null,
          address.street ?? null,
          address.zipCode ?? null,
          address.city ?? null,
          address.complement ?? null,
          existingRow.id_site,
        ]
      );
      siteIdFk = existingRow.id_site;
    } else {
      // Insert new site with UUID
      siteIdFk = crypto.randomUUID();
      await pool.execute(
        `INSERT INTO site (id_site, id_sophia_go, site_nom_sophia, adresse_voie, adresse_code_postal, adresse_ville, adresse_complement)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          siteIdFk,
          site.id ?? '',
          site.name ?? null,
          address.street ?? null,
          address.zipCode ?? null,
          address.city ?? null,
          address.complement ?? null,
        ]
      );
    }

    // 4. Update resource with site references + gdc_concernedSiteId (verified)
    await pool.execute(
      `UPDATE ressource_dpl SET id_site_sophia_go = ?, gdc_concernedSiteId = ?, site = ?, nom_site = ? WHERE id_dpl = ?`,
      [site.id ?? null, site.id ?? null, siteIdFk, site.name ?? null, resourceId]
    );

    return NextResponse.json({
      success: true,
      data: {
        siteId: site.id,
        siteName: site.name,
        address: addressStr,
      },
    });
  } catch (error) {
    console.error('POST /api/sophia/sites/select error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
