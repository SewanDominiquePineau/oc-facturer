import { getDbPool } from '../connection';
import { BonDeCommande } from '../types';
import { RowDataPacket } from 'mysql2';

type BdcFilter = 'all' | 'sans_contrat' | 'plus_1mois' | 'enregistre';

export async function getBdcList(
  filter: BdcFilter,
  search?: string,
  page = 1,
  pageSize = 50
): Promise<{ data: BonDeCommande[]; total: number }> {
  const pool = getDbPool();

  let where = `b.statut_bdc = 3 AND b.date_annulation IS NULL`;

  switch (filter) {
    case 'sans_contrat':
      where += ` AND (b.gdc_contractId IS NULL OR b.gdc_contractId = '') AND (b.ajout_gdc IS NULL OR b.ajout_gdc != 1)`;
      break;
    case 'plus_1mois':
      where += ` AND b.cree_le < DATE_SUB(NOW(), INTERVAL 1 MONTH)`;
      break;
    case 'enregistre':
      where += ` AND b.gdc_contractId IS NOT NULL AND b.gdc_contractId != ''`;
      break;
  }

  if (search) {
    where += ` AND (b.numero_bdc LIKE ? OR b.per_name LIKE ? OR b.commercial_nom LIKE ?)`;
  }

  const searchParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];

  // Count total
  const countQuery = `SELECT COUNT(*) as total FROM bon_de_commande b WHERE ${where}`;
  const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, searchParams);
  const total = (countRows[0] as RowDataPacket & { total: number }).total;

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(200, Math.max(1, pageSize));
  const offset = (safePage - 1) * safePageSize;
  const dataQuery = `
    SELECT b.*
    FROM bon_de_commande b
    WHERE ${where}
    ORDER BY b.cree_le DESC
    LIMIT ${safePageSize} OFFSET ${offset}
  `;

  const [rows] = await pool.execute<RowDataPacket[]>(dataQuery, searchParams);
  return { data: rows as unknown as BonDeCommande[], total };
}

export async function getBdcById(id: string): Promise<BonDeCommande | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM bon_de_commande WHERE id_bon_de_commande = ?',
    [id]
  );
  return (rows[0] as unknown as BonDeCommande) ?? null;
}

const BDC_ALLOWED_FIELDS = new Set([
  'gdc_contractId', 'gdc_contractName',
  'gdc_invoicedEntityId', 'gdc_invoicedEntityName',
  'id_sophia_go_facturation', 'nom_sophia_facturation',
  'ajout_gdc',
]);

export async function updateBdc(
  id: string,
  fields: Record<string, unknown>
): Promise<void> {
  const pool = getDbPool();
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined && BDC_ALLOWED_FIELDS.has(key)) {
      sets.push(`${key} = ?`);
      values.push(val as string | number | null);
    }
  }

  if (sets.length === 0) return;
  values.push(id);

  await pool.execute(
    `UPDATE bon_de_commande SET ${sets.join(', ')} WHERE id_bon_de_commande = ?`,
    values
  );
}
