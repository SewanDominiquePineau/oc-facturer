/**
 * Seed script: hash and set a password for the admin user.
 * Usage: npx tsx scripts/seed-admin.ts
 *
 * Targets the svc-oc user (acces_admin=1) by default.
 * Change EMAIL and PASSWORD below before running.
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const EMAIL = 'dominique.pineau@sewan.fr';
const PASSWORD = 'Admin123!'; // Change this before running

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  // Check if user exists
  const [rows] = await conn.execute<mysql.RowDataPacket[]>(
    'SELECT id_utilisateur, nom_utilisateur, email_utilisateur, acces_admin FROM utilisateur WHERE email_utilisateur = ?',
    [EMAIL]
  );

  if (rows.length === 0) {
    console.error(`User with email ${EMAIL} not found in the database.`);
    await conn.end();
    process.exit(1);
  }

  const user = rows[0];
  const hash = await bcrypt.hash(PASSWORD, 10);

  await conn.execute(
    'UPDATE utilisateur SET mot_de_passe_hash = ?, acces_admin = 1, actif = 1 WHERE id_utilisateur = ?',
    [hash, user.id_utilisateur]
  );

  console.log(`Admin seeded successfully:`);
  console.log(`  User: ${user.nom_utilisateur} (${user.email_utilisateur})`);
  console.log(`  ID: ${user.id_utilisateur}`);
  console.log(`  acces_admin: 1`);
  console.log(`  Password has been hashed and stored.`);

  await conn.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
