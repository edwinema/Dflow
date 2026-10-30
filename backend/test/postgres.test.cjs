const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Pool}=require('pg');
const {randomUUID}=require('node:crypto');
const {readFileSync}=require('node:fs');
const {Database}=require('../dist/database');
const {DomainService}=require('../dist/domain/domain.service');
const {NativeService}=require('../dist/native.service');

test('PostgreSQL multi-connection transactions prevent lost updates and duplicate approvals', {skip:!process.env.TEST_DATABASE_URL},async()=>{
  const schema='qp_test_'+randomUUID().replaceAll('-','');
  const adminPool=new Pool({connectionString:process.env.TEST_DATABASE_URL});
  await adminPool.query(`CREATE SCHEMA ${schema}`);
  const db=new Database();await db.pool.end();
  db.pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,options:`-c search_path=${schema}`,max:10});
  const actor={id:'admin',userId:'admin',userName:'Admin',nickName:'Admin',roles:['admin']};
  const service=new DomainService(db,new NativeService());
  const req=(path,body)=>service.dispatch({method:'POST',path,body,query:{},headers:{'x-request-id':randomUUID()}},actor);
  try {
    await db.pool.query(readFileSync('migrations/001_initial.sql','utf8'));
    await db.transaction(true,async c=>{
      const before=await db.load(c),s=structuredClone(before);
      s.orgUsers=[{id:'admin',userName:'admin',status:'0',accessRoles:['admin']}];
      s.archTypes=[{id:'arch_root',parentId:'',label:'Root'}];
      await db.save(c,before,s);
    });
    const models=await Promise.all(Array.from({length:12},(_,i)=>req('/api/flow/model',{label:`Flow ${i}`,parentId:'arch_root'})));
    assert.equal((await db.pool.query('SELECT count(*)::int AS count FROM flow_models')).rows[0].count,12);
    const logs=(await db.pool.query('SELECT changed_entities FROM audit_log')).rows;
    assert.equal(logs.length,12);
    assert.ok(logs.every(row=>Array.isArray(row.changed_entities)&&row.changed_entities.includes('flows')));
    const audit=(await req('/api/flow/audits/apply',{modelId:models[0].body.data.id})).body.data;
    const decisions=await Promise.allSettled([req('/api/flow/audits/action',{id:audit.id,action:'approve'}),req('/api/flow/audits/action',{id:audit.id,action:'approve'})]);
    assert.equal(decisions.filter(r=>r.status==='fulfilled').length,1);
    assert.equal(decisions.find(r=>r.status==='rejected').reason.getStatus(),409);
    assert.equal((await db.pool.query('SELECT count(*)::int AS count FROM publication_versions')).rows[0].count,1);
  }finally{
    await db.pool.end();await adminPool.query(`DROP SCHEMA ${schema} CASCADE`);await adminPool.end();
  }
});
