import { getDbPool } from '../connection';
import { RowDataPacket } from 'mysql2';

type FacturationTab = 'cmes' | 'fac_anticipees';
type FacturationFilter = 'tous' | 'a_facturer' | 'masquees' | 'dans_gdc';

const SORTABLE_COLUMNS: Record<string, string> = {
  numero_bdc: 'b.numero_bdc',
  per_name: 'b.per_name',
  code_produit: 'r.code_produit',
  duree_mois: 'd.valeur',
  gdc_productName: 'COALESCE(r.gdc_productName_update, r.gdc_productName)',
  quantite: 'r.quantite',
  abo: 'r.abo',
  fas: 'r.fas',
  J2_date_CMES: 'r.J2_date_CMES',
  date_factu_anticipee: 'r.date_factu_anticipee',
  nom_site: 'r.nom',
  gdc_itemStatus: 'r.gdc_itemStatus',
};

export async function getFacturationResources(
  tab: FacturationTab,
  filter: FacturationFilter,
  search?: string,
  page = 1,
  pageSize = 50,
  sortKey?: string,
  sortDir: 'asc' | 'desc' = 'desc'
) {
  const pool = getDbPool();

  const dateColumn = tab === 'cmes' ? 'r.J2_date_CMES' : 'r.date_factu_anticipee';

  let where = `${dateColumn} IS NOT NULL`;

  switch (filter) {
    case 'a_facturer':
      where += ` AND (r.gdc_itemStatus IS NULL OR r.gdc_itemStatus != 'ACTIVATED') AND (r.gdc_hidden IS NULL OR r.gdc_hidden != 1)`;
      break;
    case 'masquees':
      where += ` AND r.gdc_hidden = 1`;
      break;
    case 'dans_gdc':
      where += ` AND r.gdc_itemStatus IS NOT NULL`;
      break;
  }

  if (search) {
    where += ` AND (b.numero_bdc LIKE ? OR b.per_name LIKE ? OR r.code_produit LIKE ? OR r.nom LIKE ?)`;
  }

  const searchParams = search
    ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`]
    : [];

  // Count total
  const countQuery = `
    SELECT COUNT(*) as total
    FROM ressource_dpl r
    JOIN bon_de_commande b ON r.id_commande = b.id_bon_de_commande
    WHERE ${where}
  `;
  const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, searchParams);
  const total = (countRows[0] as RowDataPacket & { total: number }).total;

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(200, Math.max(1, pageSize));
  const offset = (safePage - 1) * safePageSize;
  const dataQuery = `
    SELECT r.*, b.numero_bdc, b.per_name, b.gdc_contractId as bdc_gdc_contractId,
           b.gdc_contractName as bdc_gdc_contractName, b.gdc_invoicedEntityId as bdc_gdc_invoicedEntityId,
           b.gdc_invoicedEntityName as bdc_gdc_invoicedEntityName,
           b.date_annulation as bdc_date_annulation,
           b.file_name as bdc_file_name, b.opportunite_path as bdc_opportunite_path,
           COALESCE(s.site_nom_sophia, s2.site_nom_sophia) as site_site_nom_sophia,
           COALESCE(s.id_sophia_go, s2.id_sophia_go) as site_sophia_go,
           COALESCE(s.per_id, s2.per_id) as site_per_id,
           c.id_sophia_go as client_id_sophia_go, c.nom_sophia as client_nom_sophia,
           d.valeur as duree_mois,
           va.numero_bdc_annule as bdc_annule_numero,
           b_ann.file_name as bdc_annule_file_name,
           b_ann.opportunite_path as bdc_annule_opportunite_path
    FROM ressource_dpl r
    JOIN bon_de_commande b ON r.id_commande = b.id_bon_de_commande
    LEFT JOIN site s ON r.site = s.id_site
    LEFT JOIN (
      SELECT id_sophia_go, MIN(site_nom_sophia) as site_nom_sophia, MIN(per_id) as per_id
      FROM site
      WHERE id_sophia_go IS NOT NULL
      GROUP BY id_sophia_go
    ) s2 ON s2.id_sophia_go = r.id_site_sophia_go
    LEFT JOIN (
      SELECT id_client_dynamics, MIN(id_sophia_go) as id_sophia_go, MIN(nom_sophia) as nom_sophia
      FROM client
      WHERE id_client_dynamics IS NOT NULL
      GROUP BY id_client_dynamics
    ) c ON c.id_client_dynamics = b.dynamics_account_id
    LEFT JOIN duree d ON r.offre_duree = d.id_duree
    LEFT JOIN vue_bdc_annules va ON va.id_bon_origine = b.id_bon_de_commande
    LEFT JOIN bon_de_commande b_ann ON b_ann.id_bon_de_commande = va.id_bon_annule
    WHERE ${where}
    ORDER BY ${sortKey && SORTABLE_COLUMNS[sortKey] ? `${SORTABLE_COLUMNS[sortKey]} ${sortDir === 'asc' ? 'ASC' : 'DESC'}` : `${dateColumn} DESC`}
    LIMIT ${safePageSize} OFFSET ${offset}
  `;

  const [rows] = await pool.execute<RowDataPacket[]>(dataQuery, searchParams);
  return { data: rows, total };
}

export async function getFacturationStats() {
  const pool = getDbPool();

  const [statsResult, topClientsResult, monthlyResult] = await Promise.all([
    pool.execute<RowDataPacket[]>(`
      SELECT
        SUM(CASE WHEN r.J2_date_CMES IS NOT NULL THEN 1 ELSE 0 END) as cmes_total,
        SUM(CASE WHEN r.J2_date_CMES IS NOT NULL AND (r.gdc_itemStatus IS NULL OR r.gdc_itemStatus != 'ACTIVATED') AND (r.gdc_hidden IS NULL OR r.gdc_hidden != 1) THEN 1 ELSE 0 END) as cmes_a_facturer,
        SUM(CASE WHEN r.J2_date_CMES IS NOT NULL AND r.gdc_itemStatus = 'ACTIVATED' THEN 1 ELSE 0 END) as cmes_activated,
        SUM(CASE WHEN r.J2_date_CMES IS NOT NULL AND r.gdc_itemStatus = 'INPROGRESS' THEN 1 ELSE 0 END) as cmes_inprogress,
        SUM(CASE WHEN r.J2_date_CMES IS NOT NULL AND r.gdc_hidden = 1 THEN 1 ELSE 0 END) as cmes_hidden,
        SUM(CASE WHEN r.J2_date_CMES IS NOT NULL AND (r.gdc_itemStatus IS NULL OR r.gdc_itemStatus != 'ACTIVATED') AND (r.gdc_hidden IS NULL OR r.gdc_hidden != 1) THEN CAST(r.abo AS DECIMAL(10,2)) ELSE 0 END) as cmes_abo_restant,
        SUM(CASE WHEN r.J2_date_CMES IS NOT NULL AND (r.gdc_itemStatus IS NULL OR r.gdc_itemStatus != 'ACTIVATED') AND (r.gdc_hidden IS NULL OR r.gdc_hidden != 1) THEN CAST(r.fas AS DECIMAL(10,2)) ELSE 0 END) as cmes_fas_restant,
        SUM(CASE WHEN r.J2_date_CMES IS NOT NULL AND r.gdc_itemStatus = 'ACTIVATED' THEN CAST(r.abo AS DECIMAL(10,2)) ELSE 0 END) as cmes_abo_fait,
        SUM(CASE WHEN r.J2_date_CMES IS NOT NULL AND r.gdc_itemStatus = 'ACTIVATED' THEN CAST(r.fas AS DECIMAL(10,2)) ELSE 0 END) as cmes_fas_fait,
        SUM(CASE WHEN r.date_factu_anticipee IS NOT NULL THEN 1 ELSE 0 END) as fac_total,
        SUM(CASE WHEN r.date_factu_anticipee IS NOT NULL AND (r.gdc_itemStatus IS NULL OR r.gdc_itemStatus != 'ACTIVATED') AND (r.gdc_hidden IS NULL OR r.gdc_hidden != 1) THEN 1 ELSE 0 END) as fac_a_facturer,
        SUM(CASE WHEN r.date_factu_anticipee IS NOT NULL AND r.gdc_itemStatus = 'ACTIVATED' THEN 1 ELSE 0 END) as fac_activated,
        SUM(CASE WHEN r.date_factu_anticipee IS NOT NULL AND r.gdc_itemStatus = 'INPROGRESS' THEN 1 ELSE 0 END) as fac_inprogress,
        SUM(CASE WHEN r.date_factu_anticipee IS NOT NULL AND r.gdc_hidden = 1 THEN 1 ELSE 0 END) as fac_hidden,
        COUNT(DISTINCT CASE WHEN r.J2_date_CMES IS NOT NULL AND (r.gdc_itemStatus IS NULL OR r.gdc_itemStatus != 'ACTIVATED') AND (r.gdc_hidden IS NULL OR r.gdc_hidden != 1) THEN b.per_name END) as cmes_clients_restants,
        COUNT(DISTINCT CASE WHEN r.J2_date_CMES IS NOT NULL THEN b.per_name END) as cmes_clients_total
      FROM ressource_dpl r
      JOIN bon_de_commande b ON r.id_commande = b.id_bon_de_commande
    `),
    pool.execute<RowDataPacket[]>(`
      SELECT b.per_name, COUNT(*) as nb
      FROM ressource_dpl r
      JOIN bon_de_commande b ON r.id_commande = b.id_bon_de_commande
      WHERE r.J2_date_CMES IS NOT NULL
        AND (r.gdc_itemStatus IS NULL OR r.gdc_itemStatus != 'ACTIVATED')
        AND (r.gdc_hidden IS NULL OR r.gdc_hidden != 1)
      GROUP BY b.per_name
      ORDER BY nb DESC
      LIMIT 10
    `),
    pool.execute<RowDataPacket[]>(`
      SELECT
        DATE_FORMAT(r.J2_date_CMES, '%Y-%m') as mois,
        COUNT(*) as total,
        SUM(CASE WHEN r.gdc_itemStatus = 'ACTIVATED' THEN 1 ELSE 0 END) as fait
      FROM ressource_dpl r
      JOIN bon_de_commande b ON r.id_commande = b.id_bon_de_commande
      WHERE r.J2_date_CMES IS NOT NULL
      GROUP BY DATE_FORMAT(r.J2_date_CMES, '%Y-%m')
      ORDER BY mois DESC
      LIMIT 12
    `),
  ]);

  return {
    stats: statsResult[0][0],
    topClients: topClientsResult[0],
    monthlyProgress: monthlyResult[0],
  };
}

export async function getCancelledBdcIds(): Promise<string[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id_bon_origine FROM vue_bdc_annules`
  );
  return (rows as Array<{ id_bon_origine: string }>).map(r => r.id_bon_origine);
}
