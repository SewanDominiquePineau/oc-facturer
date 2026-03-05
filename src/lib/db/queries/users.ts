import { getDbPool } from '../connection';
import { RowDataPacket } from 'mysql2';
import type { Utilisateur, SafeUtilisateur } from '@/lib/auth/types';

export async function getUserByEmail(email: string): Promise<Utilisateur | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM utilisateur WHERE email_utilisateur = ?',
    [email]
  );
  return (rows[0] as unknown as Utilisateur) ?? null;
}

export async function getUserById(id: string): Promise<Utilisateur | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM utilisateur WHERE id_utilisateur = ?',
    [id]
  );
  return (rows[0] as unknown as Utilisateur) ?? null;
}

export async function getAllUsers(): Promise<SafeUtilisateur[]> {
  const pool = getDbPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id_utilisateur, nom_utilisateur, email_utilisateur, last_login, appVersion,
            id_manager, acces_commerce, acces_adv, acces_planif, acces_admin,
            acces_cdp, acces_attribution, acces_deploiement, acces_rgpd, actif
     FROM utilisateur
     ORDER BY nom_utilisateur`
  );
  return rows as unknown as SafeUtilisateur[];
}

export async function updateUserActif(id: string, actif: boolean): Promise<void> {
  const pool = getDbPool();
  await pool.execute('UPDATE utilisateur SET actif = ? WHERE id_utilisateur = ?', [actif ? 1 : 0, id]);
}

export async function updateUserAccesAdv(id: string, accesAdv: boolean): Promise<void> {
  const pool = getDbPool();
  await pool.execute('UPDATE utilisateur SET acces_adv = ? WHERE id_utilisateur = ?', [accesAdv ? 1 : 0, id]);
}

export async function updateUserAccesAdmin(id: string, accesAdmin: boolean): Promise<void> {
  const pool = getDbPool();
  await pool.execute('UPDATE utilisateur SET acces_admin = ? WHERE id_utilisateur = ?', [accesAdmin ? 1 : 0, id]);
}

export async function updateUserPassword(id: string, hash: string): Promise<void> {
  const pool = getDbPool();
  await pool.execute('UPDATE utilisateur SET mot_de_passe_hash = ? WHERE id_utilisateur = ?', [hash, id]);
}

export async function createUser(data: {
  id: string;
  nom: string;
  email: string;
  passwordHash: string;
  accesAdv?: boolean;
  accesAdmin?: boolean;
}): Promise<void> {
  const pool = getDbPool();
  await pool.execute(
    `INSERT INTO utilisateur (id_utilisateur, nom_utilisateur, email_utilisateur, mot_de_passe_hash, acces_adv, acces_admin, actif)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [data.id, data.nom, data.email, data.passwordHash, data.accesAdv ? 1 : 0, data.accesAdmin ? 1 : 0]
  );
}

export async function updateLastLogin(id: string): Promise<void> {
  const pool = getDbPool();
  await pool.execute('UPDATE utilisateur SET last_login = NOW() WHERE id_utilisateur = ?', [id]);
}
