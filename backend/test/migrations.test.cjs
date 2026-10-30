const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Pool}=require('pg');
const {randomUUID}=require('node:crypto');
const {mkdtempSync,copyFileSync,writeFileSync,rmSync}=require('node:fs');
const {tmpdir}=require('node:os');
const {join}=require('node:path');
const {migrate,readMigrations}=require('../dist/migrations');

test('PostgreSQL migrations upgrade existing data, serialize runners, reject history edits and rollback failures',
  {skip:!process.env.TEST_DATABASE_URL},async()=>{
  const schema='qp_migration_'+randomUUID().replaceAll('-','');
  const admin=new Pool({connectionString:process.env.TEST_DATABASE_URL});
  const directory=mkdtempSync(join(tmpdir(),'qp-migrations-'));
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,options:`-c search_path=${schema}`});
  try {
    copyFileSync('migrations/001_initial.sql',join(directory,'001_initial.sql'));
    assert.deepEqual(await migrate(pool,directory),['001']);
    await pool.query('INSERT INTO flow_architectures(id,payload) VALUES($1,$2)', ['preserved',{id:'preserved',label:'Existing data'}]);
    const actual=readMigrations('migrations');
    for(const migration of actual.slice(1))copyFileSync(join('migrations',migration.file),join(directory,migration.file));
    assert.deepEqual(await migrate(pool,directory),actual.slice(1).map(m=>m.version));
    const next=String(Number(actual.at(-1).version)+1).padStart(3,'0');
    const broken=String(Number(next)+1).padStart(3,'0');
    const upgradeFile=join(directory,`${next}_upgrade.sql`);
    writeFileSync(upgradeFile,'ALTER TABLE flow_architectures ADD COLUMN upgrade_probe text;');
    const results=await Promise.all([migrate(pool,directory),migrate(pool,directory)]);
    assert.equal(results.flat().filter(version=>version===next).length,1);
    assert.equal((await pool.query("SELECT payload->>'label' AS label FROM flow_architectures WHERE id='preserved'")).rows[0].label,'Existing data');
    assert.deepEqual(await migrate(pool,directory),[]);
    writeFileSync(join(directory,`${broken}_broken.sql`),'CREATE TABLE should_rollback(id int); SELECT missing_column FROM flow_architectures;');
    await assert.rejects(migrate(pool,directory));
    assert.equal((await pool.query("SELECT to_regclass('should_rollback') AS name")).rows[0].name,null);
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM schema_migrations')).rows[0].count,actual.length+1);
    writeFileSync(upgradeFile,'-- changed history');
    await assert.rejects(migrate(pool,directory),/removed, reordered or modified/);
    rmSync(upgradeFile);
    await assert.rejects(migrate(pool,directory),/removed, reordered or modified/);
  } finally {
    await pool.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();
    rmSync(directory,{recursive:true,force:true});
  }
});
