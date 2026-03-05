import { getDbPool } from '../connection';
import { Client } from '../types';
import { RowDataPacket } from 'mysql2';

export async function getClientByDynamicsId(dynamicsAccountId: string): Promise<Client | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM client WHERE id_client_dynamics = ? LIMIT 1`,
    [dynamicsAccountId]
  );
  return (rows[0] as unknown as Client) ?? null;
}

export async function getLastBdcWithContractForClient(
  dynamicsAccountId: string,
  excludeBdcId: string
): Promise<{ gdc_contractId: string; gdc_contractName: string; gdc_invoicedEntityId: string; gdc_invoicedEntityName: string } | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT gdc_contractId, gdc_contractName, gdc_invoicedEntityId, gdc_invoicedEntityName
     FROM bon_de_commande
     WHERE dynamics_account_id = ?
       AND id_bon_de_commande != ?
       AND gdc_contractId IS NOT NULL AND gdc_contractId != ''
     ORDER BY modifie_le DESC
     LIMIT 1`,
    [dynamicsAccountId, excludeBdcId]
  );
  return (rows[0] as RowDataPacket & { gdc_contractId: string; gdc_contractName: string; gdc_invoicedEntityId: string; gdc_invoicedEntityName: string } | undefined) ?? null;
}
