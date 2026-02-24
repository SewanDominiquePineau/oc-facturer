import { getDbPool } from '../connection';
import { BonDeCommande } from '../types';
import { RowDataPacket } from 'mysql2';

type BdcFilter = 'all' | 'sans_contrat' | 'plus_1mois' | 'enregistre';

export async function getBdcList(filter: BdcFilter, search?: string): Promise<BonDeCommande[]> {
  const pool = getDbPool();

  let where = `b.statut_bdc = 3 AND b.date_annulation IS NULL`;

  switch (filter) {
    case 'sans_contrat':
      where += ` AND (b.gdc_contractId IS NULL OR b.gdc_contractId = '')`;
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

  const query = `
    SELECT b.*
    FROM bon_de_commande b
    WHERE ${where}
    ORDER BY b.cree_le DESC
  `;

  const params = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
  return rows as unknown as BonDeCommande[];
}

export async function getBdcById(id: string): Promise<BonDeCommande | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM bon_de_commande WHERE id_bon_de_commande = ?',
    [id]
  );
  return (rows[0] as unknown as BonDeCommande) ?? null;
}

export async function updateBdc(
  id: string,
  fields: Partial<Pick<BonDeCommande, 'gdc_contractId' | 'gdc_contractName' | 'gdc_invoicedEntityId' | 'gdc_invoicedEntityName' | 'ajout_gdc'>>
): Promise<void> {
  const pool = getDbPool();
  const sets: string[] = [];
  const values: any[] = [];

  for (const [key, val] of Object.entries(fields)) {
    if (val !== undefined) {
      sets.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (sets.length === 0) return;
  values.push(id);

  await pool.execute(
    `UPDATE bon_de_commande SET ${sets.join(', ')} WHERE id_bon_de_commande = ?`,
    values
  );
}
