const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {randomUUID}=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
const {Database}=require('../dist/database');
const {DomainService,registry,match}=require('../dist/domain/domain.service');
const {NativeService,diagram}=require('../dist/native.service');
const {AuthService}=require('../dist/security/auth.service');
const {hashPassword,verifyPassword}=require('../dist/security/password');
const {emptyState}=require('../dist/domain/state');
const {assertInvariants}=require('../dist/domain/validation');

let pg,db,service,auth;
const admin={id:'u_admin',userId:'admin',userName:'管理员',nickName:'管理员',roles:['admin']};
const password='A-long-test-password-123';
async function request(method,path,body={},query={},actor=admin,headers={}) {
  return service.dispatch({method,path,body,query,headers:{'x-request-id':randomUUID(),...headers}},actor);
}
async function status(promise,code) {
  await assert.rejects(promise,e=>{assert.equal(e.getStatus?.(),code,e.stack);return true;});
}
before(async()=>{
  pg=new PGlite();
  await pg.exec(readFileSync('migrations/001_initial.sql','utf8'));
  await pg.exec(readFileSync('migrations/002_flow_attachments.sql','utf8'));
  await pg.exec(readFileSync('migrations/003_process_metadata_projection.sql','utf8'));
  // PGlite runs PostgreSQL in one process; the adapter serializes transactions.
  // Real PostgreSQL multi-connection advisory locks are exercised by the optional integration suite.
  const query=async(sql,args=[])=>{
    if(sql.includes('pg_advisory_xact_lock'))return {rows:[],rowCount:1};
    const result=await pg.query(sql,args);return {...result,rowCount:result.affectedRows??result.rows.length};
  };
  db=new Database();await db.pool.end();
  let tail=Promise.resolve();
  db.pool={query,connect:async()=>{
    const previous=tail;let release;tail=new Promise(resolve=>release=resolve);await previous;
    return {query,release};
  },end:async()=>{}};
  service=new DomainService(db,new NativeService());auth=new AuthService(db);
  process.env.APP_ORIGIN='http://localhost:3000';
  await db.transaction(true,async c=>{
    const initial=await db.load(c),s=structuredClone(initial);
    s.orgUsers.push({id:'u_admin',userName:'admin',nickName:'管理员',status:'0',accessRoles:['admin']});
    s.archTypes.push({id:'arch_root',parentId:'',label:'根架构',versionNo:'V0'});
    await db.save(c,initial,s);
    await c.query('INSERT INTO credentials(user_id,password_hash) VALUES($1,$2)',['u_admin',await hashPassword(password)]);
  });
});
after(async()=>{await pg?.close();});

test('DDL creates persisted aggregate tables, unique keys and FK constraints',async()=>{
  assert.ok((await db.pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")).rows.length>30);
  await assert.rejects(db.pool.query("INSERT INTO credentials(user_id,password_hash) VALUES('missing','x')"));
  await assert.rejects(db.pool.query("INSERT INTO users(id,payload) VALUES('bad', $1)",[{id:'bad',password:'plaintext'}]));
  const projected=await db.pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='flow_models' AND column_name IN ('flow_no','flow_level','applicable_scope','dept_name','owner_name')");
  assert.equal(projected.rows.length,5);
});
test('scrypt password validation, hashing and verification',async()=>{
  const hash=await hashPassword(password);assert.ok(!hash.includes(password));
  assert.equal(await verifyPassword(password,hash),true);
  assert.equal(await verifyPassword('wrong',hash),false);
  await status(hashPassword('123456'),400);
});
test('all 133 prototype routes have a domain or explicit native implementation',()=>{
  const routes=registry(emptyState(),admin).routes;
  const nativePaths=new Set(['/api/session','/api/app/site/logout','/api/dict/doc/download','/api/system/license/generate-code','/api/system/license/activate',
    '/api/flow/type/publishVersionHistories','/api/flow/model/publishVersionHistories',
    '/api/ai/form-fields-generate','/api/ai/drawio-generate','/api/ai/flow-chat',
    '/api/mining/overview','/api/mining/switch-dataset','/api/mining/extract','/api/mining/import-logs','/api/mining/ai-diagnose']);
  const original=JSON.parse(readFileSync('docs/routes.json','utf8'));assert.equal(original.length,133);
  for(const r of original)assert.ok(routes.some(x=>x.method===r.method&&x.path===r.path)||nativePaths.has(r.path),`${r.method} ${r.path}`);
  for(const [method,path]of [['POST','/api/build/roles/batch-import'],['POST','/api/build/roles/123/assign-users'],['DELETE','/api/flow/model'],['PUT','/api/flow/model'],['POST','/api/flow/reorder'],['GET','/api/flow/models']])assert.ok(match(routes,method,path),`${method} ${path}`);
});
test('session is password-authenticated, independent, revocable and origin-protected',async()=>{
  await request('POST','/api/org/users',{userName:'reader',nickName:'Reader',password,status:'0',deptId:'',deptName:'',deptCode:''});
  const cookies=[];const res={cookie:(name,value,options)=>cookies.push({name,value,options}),clearCookie:()=>{}};
  const req={method:'POST',path:'/api/session',ip:'127.0.0.1',headers:{origin:process.env.APP_ORIGIN},cookies:{},body:{userId:'admin',password}};
  await status(auth.login({...req,body:{userId:'admin',password:'wrong'}},res),401);
  await auth.login(req,res);await auth.login({...req,body:{userId:'reader',password}},res);
  assert.notEqual(cookies[0].value,cookies[1].value);assert.equal(cookies[0].options.httpOnly,true);
  const a={method:'GET',path:'/api/session',headers:{},cookies:{qp_session:cookies[0].value}};
  const b={...a,cookies:{qp_session:cookies[1].value}};
  assert.equal((await auth.authenticate(a)).id,'u_admin');assert.equal((await auth.authenticate(b)).userId,'reader');
  await status(auth.authenticate({...a,method:'POST',headers:{origin:'https://evil.invalid'}}),403);
  await auth.logout({...a,method:'POST',headers:{origin:process.env.APP_ORIGIN}},res);
  await status(auth.authenticate(a),401);assert.equal((await auth.authenticate(b)).userId,'reader');
});
test('create/update/publish/copy persist across service instances and record real history',async()=>{
  const created=await request('POST','/api/flow/model',{label:'采购流程',parentId:'arch_root'});
  const id=created.body.data.id;assert.ok(id.startsWith('flow_'));
  await request('PUT','/api/flow/model',{id,label:'新采购流程'});
  await request('POST','/api/flow/model/publish',{id});
  const history=await request('GET','/api/flow/model/publishVersionHistories',{}, {id});assert.equal(history.body.data.length,1);
  const restarted=new DomainService(db,new NativeService());
  const found=await restarted.dispatch({method:'GET',path:'/api/flow/model/full',body:{},query:{id},headers:{}},admin);
  assert.equal(found.body.data.label,'新采购流程');assert.equal(found.body.data.status,'published');
  const clone=await request('POST','/api/flow/model/copy',{id});assert.notEqual(clone.body.data.id,id);assert.equal(clone.body.data.status,'draft');
  await status(request('GET','/api/flow/model/full',{}, {id:'missing'}),404);
});
test('idempotency replays safely and rejects key reuse with different body',async()=>{
  const headers={'idempotency-key':randomUUID()};const body={parentId:'arch_root',label:'幂等流程'};
  const a=await request('POST','/api/flow/model',body,{},admin,headers);
  const b=await request('POST','/api/flow/model',body,{},admin,headers);assert.equal(a.body.data.id,b.body.data.id);
  await status(request('POST','/api/flow/model',{...body,label:'changed'},{},admin,headers),409);
});
test('failed writes rollback fully; FK use and tree cycles are rejected',async()=>{
  const created=await request('POST','/api/flow/type',{parentId:'arch_root',label:'子架构'});
  await status(request('PUT','/api/flow/type/full',{id:'arch_root',parentId:created.body.data.id}),409);
  const root=await request('GET','/api/flow/type',{}, {id:'arch_root'});assert.equal(root.body.data.parentId,'');
  await status(request('DELETE','/api/flow/type',{}, {id:'arch_root'}),409);
  const before=(await request('GET','/api/org/users')).body.total;
  await status(request('POST','/api/org/users',{userName:'weak',nickName:'Weak',password:'123456'}),400);
  assert.equal((await request('GET','/api/org/users')).body.total,before);
});
test('flow approval state machine forbids replay',async()=>{
  const model=(await request('POST','/api/flow/model',{label:'审批流程',parentId:'arch_root'})).body.data;
  const audit=(await request('POST','/api/flow/audits/apply',{modelId:model.id})).body.data;
  await request('POST','/api/flow/audits/action',{id:audit.id,action:'approve',operator:'伪造审批人'});
  const flow=(await request('GET','/api/flow/model/full',{}, {id:model.id})).body.data;assert.equal(flow.status,'published');assert.equal(flow.publishUserName,'管理员');
  await status(request('POST','/api/flow/audits/action',{id:audit.id,action:'approve'}),409);
});
test('duty manual multi-level approval advances one level and updates item atomically',async()=>{
  const manual=(await request('POST','/api/flowdoc/manuals',{manualNo:'MAN-1',manualName:'年度手册'})).body.data;
  const item=(await request('POST',`/api/flowdoc/manuals/${manual.id}/items`,{dutyName:'费用审批',categoryId:manual.categoryTree[0].id})).body.data;
  const submit=await request('POST','/api/flowdoc/audit/submit',{manualId:manual.id,itemIds:[item.id],levels:[{approverName:'管理员'},{approverName:'管理员'}]});
  const task=submit.body.createdTasks[0];
  await request('POST',`/api/flowdoc/audit/tasks/${task.id}/approve`,{opinion:'初审同意'});
  const second=await request('POST',`/api/flowdoc/audit/tasks/${task.id}/approve`,{opinion:'终审同意'});assert.equal(second.body.data.status,'已通过');
  const detail=await request('GET',`/api/flowdoc/manuals/${manual.id}/detail`);assert.equal(detail.body.data.items[0].status,'已发布');
  await status(request('POST',`/api/flowdoc/audit/tasks/${task.id}/reject`,{}),409);
});
test('role aliases match frontend POST assignedUsers and import conventions',async()=>{
  await request('POST','/api/build/roles/batch-import',{items:[{roleName:'采购员',roleCode:'BUYER'}]});
  const roles=await request('GET','/api/build/roles');const role=roles.body.rows.find(r=>r.roleCode==='BUYER');
  const assigned=await request('POST',`/api/build/roles/${role.id}/assign-users`,{assignedUsers:[{id:'u_admin',name:'管理员'}]});
  assert.equal(assigned.body.data.assignedUsers.length,1);
  assert.ok((await request('GET','/api/dict/bundle')).body.data.flowRole.some(r=>r.id===role.id));
});
test('CSV and JSON mining import real rows, deduplicates and computes overview',async()=>{
  const body={rawData:'CaseId,Activity,Timestamp,SourceSystem\nC1,申请,2026-10-01T00:00:00Z,ERP\nC1,审批,2026-10-02T00:00:00Z,ERP'};
  assert.equal((await request('POST','/api/mining/import-logs',body)).body.data.importedRows,2);
  assert.equal((await request('POST','/api/mining/import-logs',body)).body.data.importedRows,0);
  const data=(await request('GET','/api/mining/overview')).body.data;assert.equal(data.dataset.caseCount,1);assert.equal(data.dataset.eventCount,2);assert.equal(data.dataset.avgLeadTime,'1.00 天');assert.equal(data.dataset.edges.length,1);
  await status(request('POST','/api/mining/import-logs',{rawData:'CaseId,Activity,Timestamp\nC2,申请,bad'}),400);
  assert.equal((await request('GET','/api/mining/overview')).body.data.dataset.eventCount,2);
});
test('missing connectors, AI keys, fake license and missing attachments never return fabricated success',async()=>{
  await status(request('POST','/api/mining/extract'),503);
  await status(request('POST','/api/ai/drawio-generate',{prompt:'采购'}),503);
  await status(request('POST','/api/system/license/activate',{licenseKey:'fake'}),503);
  await status(request('POST','/api/system/license/generate-code'),403);
  await status(request('GET','/api/dict/doc/download',{}, {id:'missing'}),404);
  await status(request('POST','/api/org/users/reset'),409);
});
test('passwords never appear in read responses; viewers cannot mutate',async()=>{
  const bundle=await request('GET','/api/org/bundle');assert.ok(!JSON.stringify(bundle.body).includes(password));assert.ok(!JSON.stringify(bundle.body).includes('password'));
  const viewer={...admin,roles:['viewer']};await status(request('POST','/api/flow/type',{label:'forbidden'}, {},viewer),403);
  const malicious=JSON.parse('{"__proto__":{"polluted":true}}');await status(request('POST','/api/flow/type',malicious),400);assert.equal({}.polluted,undefined);
});
test('generated diagrams XML-escape untrusted values',()=>{
  const xml=diagram([{title:'A"/><script>x</script>',role:'R',desc:'<&',out:'O',judge:false,kcp:false}]);
  assert.ok(!xml.includes('<script>'));assert.ok(xml.includes('&lt;script&gt;'));
});
test('execution is based on published XML activities and cannot finish with incomplete steps',async()=>{
  const model=(await request('POST','/api/flow/model',{label:'执行验证',parentId:'arch_root'})).body.data;
  await status(request('POST','/api/execute/tasks/assign',{modelId:model.id,assignee:'管理员'}),409);
  await request('POST','/api/flow/model/publish',{id:model.id});
  const task=(await request('POST','/api/execute/tasks/assign',{modelId:model.id,assignee:'管理员'})).body.data;
  assert.equal(task.steps.length,2);
  await status(request('POST',`/api/execute/tasks/${task.id}/submit`),409);
  for(const step of task.steps)await request('PUT',`/api/execute/tasks/${task.id}/step`,{stepId:step.id,status:'已办'});
  assert.equal((await request('POST',`/api/execute/tasks/${task.id}/submit`)).body.data.status,'已办结');
});
test('uploaded bytes are downloaded exactly; dictionary folder rename is persisted',async()=>{
  const original=Buffer.from('真实文件内容');
  const file=(await request('POST','/api/files',{filename:'制度.txt',base64:original.toString('base64')})).body.data;
  const folder=(await request('POST','/api/dict/tree',{treeType:'sysDoc',action:'create',label:'制度目录'})).body.data;
  await request('POST','/api/dict/tree',{treeType:'sysDoc',action:'rename',id:folder.id,label:'更新目录'});
  const doc=(await request('POST','/api/dict/item',{itemType:'sysDoc',action:'create',item:{label:'制度.txt',fileId:file.id,categoryId:folder.id}})).body.data;
  const downloaded=await request('GET','/api/dict/doc/download',{}, {id:doc.id});
  assert.deepEqual(Buffer.from(downloaded.body),original);
  await status(request('POST','/api/dict/tree',{treeType:'sysDoc',action:'delete',id:folder.id}),409);
});
test('flow attachments persist metadata, associate real bytes and reject metadata-only downloads',async()=>{
  const flow=(await request('POST','/api/flow/model',{label:'附件流程',parentId:'arch_root'})).body.data;
  const missing=await request('POST','/api/flow/model/upload-attachment',{flowId:flow.id,label:'待上传.pdf'});
  assert.equal(missing.body.status,1);
  await status(request('GET','/api/flow/attachment/download',{}, {id:missing.body.data.id}),409);
  const bytes=(await request('POST','/api/files',{filename:'正式附件.txt',contentType:'text/plain',base64:Buffer.from('附件内容').toString('base64')})).body.data;
  const uploaded=(await request('POST','/api/flow/model/upload-attachment',{flowId:flow.id,label:'正式附件.txt',fileId:bytes.id})).body.data;
  const downloaded=await request('GET','/api/flow/attachment/download',{}, {id:uploaded.id});
  assert.deepEqual(Buffer.from(downloaded.body),Buffer.from('附件内容'));
  assert.ok((await request('GET','/api/dict/bundle')).body.data.attachments.some(a=>a.id===uploaded.id));
});
test('updated GitHub process card metadata round-trips and populates relational projections',async()=>{
  const flow=(await request('POST','/api/flow/model',{label:'卡片元数据流程',parentId:'arch_root',flowNo:'IPD-TR-900'})).body.data;
  await request('PUT','/api/flow/model/full',{...flow,flowNo:'IPD-TR-901',flowLevel:'L3',businessScope:'产品开发',applicableScope:'结构开发部,质量部',adaptScope:'旧字段不应覆盖',deptName:'流程管理部',ownerName:'流程管理员',collaborators:[{id:'u_admin',userName:'管理员',deptName:'流程管理部'}]});
  const row=(await db.pool.query('SELECT flow_no,flow_level,business_scope,applicable_scope,dept_name,owner_name FROM flow_models WHERE id=$1',[flow.id])).rows[0];
  assert.deepEqual(row,{flow_no:'IPD-TR-901',flow_level:'L3',business_scope:'产品开发',applicable_scope:'结构开发部,质量部',dept_name:'流程管理部',owner_name:'流程管理员'});
  const persisted=(await request('GET','/api/flow/model/full',{}, {id:flow.id})).body.data;
  assert.deepEqual(persisted.collaborators,[{id:'u_admin',userName:'管理员',deptName:'流程管理部'}]);
});
test('real Nest HTTP routing, exception filter, cookies and OpenAPI',async()=>{
  process.env.DATABASE_URL='postgresql://unused/test';
  const {createApp}=require('../dist/main');
  const app=await createApp();
  const provider=app.get(Database);await provider.pool.end();provider.pool=db.pool;
  try {
    await app.listen(0,'127.0.0.1');
    const base=await app.getUrl();
    assert.equal((await fetch(base+'/health/live')).status,200);
    assert.equal((await fetch(base+'/api/flow/fulltypes')).status,401);
    const malformed=await fetch(base+'/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:'{broken'});assert.equal(malformed.status,400);
    const login=await fetch(base+'/api/session',{method:'POST',headers:{'Content-Type':'application/json',Origin:process.env.APP_ORIGIN},body:JSON.stringify({userId:'admin',password})});
    assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
    const response=await fetch(base+'/api/flow/fulltypes',{headers:{Cookie:cookie}});assert.equal(response.status,200);assert.equal((await response.json()).status,1);
    const docs=await fetch(base+'/api/openapi.json',{headers:{Cookie:cookie}});assert.ok((await docs.json()).paths['/api/session']);
    const missing=await fetch(base+'/api/flow/model/full?id=missing',{headers:{Cookie:cookie}});assert.equal(missing.status,404);assert.equal((await missing.json()).status,0);
  } finally {await app.close();}
});
