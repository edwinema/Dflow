import { Pool } from 'pg';
import { migrate } from '../src/migrations';
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const pool = new Pool({connectionString: process.env.DATABASE_URL});
  try {
    const applied = await migrate(pool, 'migrations');
    console.log(applied.length ? `Applied migrations: ${applied.join(', ')}` : 'Schema is current');
  } finally { await pool.end(); }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
