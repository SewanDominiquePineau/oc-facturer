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

const RESOURCE_ALLOWED_KEYS = [
  'gdc_catalogRef', 'gdc_categoryId', 'gdc_serviceId', 'gdc_productName',
  'gdc_productName_update', 'gdc_contractId',
  'gdc_id_product', 'gdc_itemStatus', 'gdc_hidden', 'id_site_sophia_go', 'gdc_concernedSiteId', 'code_produit',
] as const;

export async function updateResource(
  id: string,
  fields: Record<string, unknown>
): Promise<void> {
  const pool = getDbPool();

  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, val] of Object.entries(fields)) {
    if ((RESOURCE_ALLOWED_KEYS as readonly string[]).includes(key) && val !== undefined) {
      sets.push(`${key} = ?`);
      values.push(val as string | number | null);
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
