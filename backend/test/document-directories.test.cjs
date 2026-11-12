const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
const {emptyState}=require('../dist/domain/state');

test('empty directory migration restores roots idempotently and preserves existing catalogs and records',async()=>{
  const pg=new PGlite();
  try {
    await pg.exec(readFileSync('migrations/001_initial.sql','utf8'));
    const sql=readFileSync('migrations/005_document_directory_roots.sql','utf8');
    const current={...emptyState().dictBundle,sysDocTree:[],riskTree:[],sysDoc:[{id:'existing',label:'已有制度'}],extraSetting:{preserved:true}};
    await pg.query('INSERT INTO app_settings(key,value) VALUES($1,$2)',['dictBundle',current]);
    await pg.exec(sql);await pg.exec(sql);
    const repaired=(await pg.query("SELECT value FROM app_settings WHERE key='dictBundle'")).rows[0].value;
    assert.equal(repaired.sysDocTree.length,1);assert.equal(repaired.riskTree.length,1);
    assert.deepEqual(repaired.sysDoc,current.sysDoc);assert.deepEqual(repaired.extraSetting,current.extraSetting);
    repaired.sysDocTree=[{id:'custom',parentId:'',label:'已更名目录'},{id:'child',parentId:'custom',label:'已建子目录'}];
    repaired.riskTree=[];
    await pg.query("UPDATE app_settings SET value=$1 WHERE key='dictBundle'",[repaired]);
    await pg.exec(sql);
    const existing=(await pg.query("SELECT value FROM app_settings WHERE key='dictBundle'")).rows[0].value;
    assert.deepEqual(existing.sysDocTree,repaired.sysDocTree);assert.equal(existing.riskTree.length,1);
  } finally {await pg.close();}
});
