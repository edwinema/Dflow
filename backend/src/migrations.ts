import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { Pool } from 'pg';

export function readMigrations(directory: string) {
  // maintenance.sql is an existing operator-run retention task, never a schema migration.
  const files = readdirSync(directory).filter(name => name.endsWith('.sql') && name !== 'maintenance.sql').sort();
  const versions = new Set<string>();
  const migrations = files.map(file => {
    const match = /^(\d{3})_[a-z0-9_]+\.sql$/.exec(file);
    if (!match || versions.has(match[1])) throw new Error(`Invalid or duplicate migration: ${file}`);
    versions.add(match[1]);
    const sql = readFileSync(join(directory, file), 'utf8');
    return { version: match[1], file, sql, checksum: createHash('sha256').update(sql).digest('hex') };
  });
  if (migrations[0]?.version !== '001') throw new Error('Migration 001 is required');
  return migrations;
}

// One locked transaction: failed batches leave neither partial DDL nor ledger entries.
export async function migrate(pool: Pool, directory: string) {
  const migrations = readMigrations(directory);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '15s'");
    await client.query('SELECT pg_advisory_xact_lock(716242)');
    const exists = (await client.query("SELECT to_regclass('schema_migrations') AS name")).rows[0].name;
    const applied = exists ? (await client.query('SELECT version, checksum FROM schema_migrations ORDER BY version')).rows : [];
    for (let i = 0; i < applied.length; i++) {
      if (migrations[i]?.version !== applied[i].version || migrations[i]?.checksum !== applied[i].checksum) {
        throw new Error(`Applied migration removed, reordered or modified: ${applied[i].version}`);
      }
    }
    const pending = migrations.slice(applied.length);
    for (const entry of pending) {
      await client.query(entry.sql);
      await client.query('INSERT INTO schema_migrations(version,checksum) VALUES($1,$2)', [entry.version, entry.checksum]);
    }
    await client.query('COMMIT');
    return pending.map(entry => entry.version);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
