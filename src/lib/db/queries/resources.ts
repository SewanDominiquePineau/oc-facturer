import { getDbPool } from '../connection';
import { RessourceDpl } from '../types';
import { RowDataPacket } from 'mysql2';

export async function getResourcesByBdcId(bdcId: string): Promise<RessourceDpl[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT r.*
     FROM ressource_dpl r
     WHERE r.id_commande = ?
     ORDER BY r.id_dpl`,
    [bdcId]
  );
  return rows as unknown as RessourceDpl[];
}

export async function updateResource(
  id: string,
  fields: Record<string, any>
): Promise<void> {
  const pool = getDbPool();
  const allowedKeys = [
    'gdc_catalogRef', 'gdc_categoryId', 'gdc_serviceId', 'gdc_productName',
    'gdc_productName_update', 'gdc_contractId',
    'gdc_id_product', 'gdc_itemStatus', 'gdc_hidden', 'id_site_sophia_go', 'gdc_concernedSiteId', 'code_produit',
  ];

  const sets: string[] = [];
  const values: any[] = [];

  for (const [key, val] of Object.entries(fields)) {
    if (allowedKeys.includes(key) && val !== undefined) {
      sets.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (sets.length === 0) return;
  values.push(id);

  await pool.execute(
    `UPDATE ressource_dpl SET ${sets.join(', ')} WHERE id_dpl = ?`,
    values
  );
}

export async function hideResource(id: string, hidden: boolean): Promise<void> {
  await updateResource(id, { gdc_hidden: hidden ? 1 : 0 });
}
