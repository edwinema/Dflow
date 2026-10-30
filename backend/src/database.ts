import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { collections, emptyState, settings } from './domain/state';
import { State } from './domain/types';

@Injectable()
export class Database implements OnModuleDestroy {
  readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DB_POOL_SIZE || 10),
    connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000,
    statement_timeout: 15000,
  });
  async onModuleDestroy() { await this.pool.end(); }

  async transaction<T>(write: boolean, fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      // Obtain lock before reading under READ COMMITTED, so queued writers see committed changes.
      await client.query(write ? 'BEGIN' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      await client.query("SET LOCAL lock_timeout = '5s'");
      if (write) await client.query('SELECT pg_advisory_xact_lock(716241)');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally { client.release(); }
  }

  async load(client: PoolClient): Promise<State> {
    const state = emptyState();
    for (const [key, table] of Object.entries(collections)) {
      const result = await client.query(`SELECT payload FROM ${table} ORDER BY sort_order, id`);
      state[key] = result.rows.map(r => r.payload);
    }
    for (const row of (await client.query('SELECT key, value FROM app_settings')).rows) state[row.key] = row.value;
    return state;
  }

  async save(client: PoolClient, before: State, after: State): Promise<void> {
    for (const [key, table] of Object.entries(collections)) {
      const identity = (row: any) => String(row.id ?? row.formKey);
      const previous = new Map<string, any>(before[key].map((row: any, i: number) => [identity(row), { row, i }]));
      const next = new Set<string>();
      for (let i = 0; i < after[key].length; i++) {
        const row = after[key][i], id = identity(row), old = previous.get(id);
        if (next.has(id) || id === 'undefined') throw new Error(`Invalid identity in ${table}`);
        next.add(id);
        if (!old || old.i !== i || JSON.stringify(old.row) !== JSON.stringify(row)) {
          await client.query(`INSERT INTO ${table}(id,payload,sort_order) VALUES($1,$2,$3)
            ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload,sort_order=EXCLUDED.sort_order,
            revision=${table}.revision+1,updated_at=now()`, [id, JSON.stringify(row), i]);
        }
      }
      const removed = [...previous.keys()].filter(id => !next.has(id));
      if (removed.length) await client.query(`DELETE FROM ${table} WHERE id=ANY($1::text[])`, [removed]);
    }
    for (const key of settings) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        await client.query(`INSERT INTO app_settings(key,value) VALUES($1,$2)
          ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`, [key, JSON.stringify(after[key])]);
      }
    }
  }
}
