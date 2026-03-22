import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../util/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
  const seedsDir = path.join(__dirname, '..', 'db', 'seeds');

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const seedFiles = fs
    .readdirSync(seedsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  console.log('▶ Running migrations...');
  for (const file of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
  }
  console.log('▶ Running seeds...');
  for (const file of seedFiles) {
    const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
    await pool.query(sql);
  }

  console.log('✅ Done.');
  await pool.end();
}

run().catch(async (e) => {
  console.error('❌ seed failed:', e);
  try { await pool.end(); } catch {}
  process.exit(1);
});
