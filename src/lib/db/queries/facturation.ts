import { getDbPool } from '../connection';
import { RowDataPacket } from 'mysql2';

type FacturationTab = 'cmes' | 'fac_anticipees';
type FacturationFilter = 'tous' | 'a_facturer' | 'masquees' | 'dans_gdc';

export async function getFacturationResources(
  tab: FacturationTab,
  filter: FacturationFilter,
  search?: string
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

  const query = `
    SELECT r.*, b.numero_bdc, b.per_name, b.gdc_contractId as bdc_gdc_contractId,
           b.gdc_contractName as bdc_gdc_contractName, b.gdc_invoicedEntityId as bdc_gdc_invoicedEntityId,
           b.date_annulation as bdc_date_annulation
    FROM ressource_dpl r
    JOIN bon_de_commande b ON r.id_commande = b.id_bon_de_commande
    WHERE ${where}
    ORDER BY ${dateColumn} DESC
  `;

  const params = search
    ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`]
    : [];

  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
  return rows;
}

export async function getCancelledBdcIds(): Promise<string[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id_bon_origine FROM vue_bdc_annules`
  );
  return (rows as any[]).map(r => r.id_bon_origine);
}
