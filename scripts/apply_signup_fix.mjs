/**
 * Apply signup database fix to remote Supabase.
 *
 * Usage (pick one):
 *   SUPABASE_DB_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" node scripts/apply_signup_fix.mjs
 *   SUPABASE_ACCESS_TOKEN="..." node scripts/apply_signup_fix.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260704120000_005_fix_signup_complete.sql');
const sql = readFileSync(migrationPath, 'utf8');
const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = (process.env.VITE_SUPABASE_URL || '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

async function applyWithPg() {
  const pg = await import('pg').catch(() => null);
  if (!pg) {
    console.error('Install pg first: npm install --save-dev pg');
    process.exit(1);
  }

  const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log('Signup fix migration applied successfully via direct DB connection.');
  } finally {
    await client.end();
  }
}

function applyWithSupabaseCli() {
  if (!projectRef) {
    console.error('Could not derive project ref from VITE_SUPABASE_URL.');
    process.exit(1);
  }

  const args = ['supabase', 'db', 'execute', '--project-ref', projectRef, '--file', migrationPath];
  const env = { ...process.env };
  if (accessToken) env.SUPABASE_ACCESS_TOKEN = accessToken;

  const result = spawnSync('npx', args, { stdio: 'inherit', env, shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log('Signup fix migration applied successfully via Supabase CLI.');
}

async function main() {
  if (dbUrl) {
    await applyWithPg();
    return;
  }

  if (accessToken && projectRef) {
    applyWithSupabaseCli();
    return;
  }

  console.error(`
Could not apply migration automatically.

Run the SQL file manually in Supabase Dashboard → SQL Editor:
  ${migrationPath}

Or set one of:
  SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres
  SUPABASE_ACCESS_TOKEN=...  (with "npx supabase login" or env var)
`);
  process.exit(1);
}

main().catch((err) => {
  console.error('Failed to apply signup fix:', err);
  process.exit(1);
});
