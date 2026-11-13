const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {mkdtempSync,writeFileSync,rmSync}=require('node:fs');
const {tmpdir}=require('node:os');
const {join}=require('node:path');
const {randomUUID,generateKeyPairSync,sign}=require('node:crypto');
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
  await status(hashPassword('12345'),400);
  for(const value of ['123456','x'.repeat(32)]) assert.equal(await verifyPassword(value,await hashPassword(value)),true);
  await status(hashPassword('x'.repeat(33)),400);
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
test('editable document templates persist, render company fields and snapshot independently of later revisions',async()=>{
  const builtin=(await request('GET','/api/dict/document-templates')).body.data[0];
  const created=(await request('POST','/api/dict/document-templates',{name:'公司制度模板',content:{...builtin.content,headerTitle:'{{companyName}}文件',body:'第一章\n真实自定义正文 <script>alert(1)</script>',signatory:'签发部门'}})).body.data;
  await db.transaction(true,async c=>{const before=await db.load(c),state=structuredClone(before);state.companyAuthData.companyName='模板测试公司';await db.save(c,before,state);});
  const snapshot=(await request('POST',`/api/dict/document-templates/${created.id}/apply`,{docNo:'ZD-CUSTOM',title:'模板制度'})).body.data;
  assert.equal(snapshot.documentContent.headerTitle,'模板测试公司文件');assert.equal(snapshot.documentContent.officialNo,'ZD-CUSTOM');
  assert.equal(snapshot.documentContent.title,'模板制度');assert.ok(snapshot.documentContent.body.includes('<script>'));
  const item=(await request('POST','/api/dict/item',{itemType:'sysDoc',action:'create',item:{label:'模板制度',...snapshot}})).body.data;
  const updated=(await request('PUT',`/api/dict/document-templates/${created.id}`,{name:created.name,revision:created.revision,content:{...created.content,body:'第二版模板正文'}})).body.data;
  assert.equal(updated.revision,2);
  await status(request('PUT',`/api/dict/document-templates/${created.id}`,{name:created.name,revision:1,content:created.content}),409);
  const restarted=new DomainService(db,new NativeService());
  const result=await restarted.dispatch({method:'GET',path:'/api/dict/bundle',body:{},query:{},headers:{}},admin);
  assert.equal(result.body.data.sysDoc.find(row=>row.id===item.id).documentContent.body,snapshot.documentContent.body);
  await request('POST','/api/dict/item',{itemType:'sysDoc',action:'update',item:{...item,documentContent:{...snapshot.documentContent,body:'该文件单独修改后的正文'}}});
  assert.equal((await request('GET','/api/dict/bundle')).body.data.sysDoc.find(row=>row.id===item.id).documentContent.body,'该文件单独修改后的正文');
  await status(request('POST','/api/dict/document-templates',{name:'越权模板',content:builtin.content},{},{...admin,roles:['viewer']}),403);
  await status(request('POST','/api/dict/document-templates',{name:'坏样式',content:{...builtin.content,headerColor:'url(javascript:alert(1))'}}),400);
});
test('document catalog roots support persisted child creation and rename with safe deletion',async()=>{
  for(const treeType of ['sysDoc','risk']) {
    const treeKey=treeType+'Tree';
    const root=(await request('GET','/api/dict/bundle')).body.data[treeKey].find(node=>!node.parentId);
    assert.ok(root);
    const folder=(await request('POST','/api/dict/tree',{treeType,action:'create',parentId:root.id,label:'业务目录'})).body.data;
    assert.equal(folder.parentId,root.id);
    await status(request('POST','/api/dict/tree',{treeType,action:'create',parentId:root.id,label:'业务目录'}),409);
    await request('POST','/api/dict/tree',{treeType,action:'rename',id:folder.id,label:'研发制度目录'});
    const restarted=new DomainService(db,new NativeService());
    const bundle=(await restarted.dispatch({method:'GET',path:'/api/dict/bundle',body:{},query:{},headers:{}},admin)).body.data;
    assert.equal(bundle[treeKey].find(node=>node.id===folder.id).label,'研发制度目录');
    const item=(await request('POST','/api/dict/item',{itemType:treeType,action:'create',item:{label:'目录引用文档',folderId:folder.id}})).body.data;
    await status(request('POST','/api/dict/tree',{treeType,action:'delete',id:folder.id}),409);
    await status(request('POST','/api/dict/tree',{treeType,action:'delete',id:root.id}),409);
    await status(request('POST','/api/dict/tree',{treeType,action:'rename',id:folder.id,label:'越权'}, {},{...admin,roles:['viewer']}),403);
    await request('POST','/api/dict/item',{itemType:treeType,action:'delete',id:item.id});
    await request('POST','/api/dict/tree',{treeType,action:'delete',id:folder.id});
    assert.equal((await request('GET','/api/dict/bundle')).body.data[treeKey].some(node=>node.id===folder.id),false);
  }
});
test('positions and job titles support persisted manual creation and atomic validated CSV imports',async()=>{
  const dept=(await request('POST','/api/org/depts',{deptName:'目录测试部门',deptCode:'CAT001',parentDeptCode:''})).body.data;
  const position=(await request('POST','/api/org/positions',{postCode:'CAT_POST_1',postName:'岗位一',deptId:dept.id,sort:2,status:'0'})).body.data;
  assert.equal(position.deptName,'目录测试部门');assert.ok(position.id);
  await status(request('POST','/api/org/positions',{postCode:'cat_post_1',postName:'重复编号',deptId:dept.id}),409);
  const csv='\uFEFF岗位编号,岗位名称,部门编号,排序号,状态,职责概述\r\nCAT_POST_2,"岗位,二",CAT001,1,正常,"职责含逗号,及引号"\r\nCAT_POST_3,岗位三,CAT001,3,停用,其他职责';
  const before=(await request('GET','/api/org/positions')).body.data.length;
  const preview=(await request('POST','/api/org/positions/import/preview',{rawData:csv})).body.data;
  assert.equal(preview.length,2);assert.equal(preview[0].postName,'岗位,二');assert.equal(preview[1].status,'1');
  assert.equal((await request('GET','/api/org/positions')).body.data.length,before);
  await status(request('POST','/api/org/positions/import',{items:[...preview,{postCode:'CAT_BAD',postName:'无效部门',deptCode:'missing'}]}),400);
  assert.equal((await request('GET','/api/org/positions')).body.data.length,before);
  assert.equal((await request('POST','/api/org/positions/import',{items:preview})).body.data.imported,2);
  await status(request('POST','/api/org/positions/import',{rawData:csv}),409);
  const job=(await request('POST','/api/org/job-titles',{jobCode:'CAT_JOB_1',jobName:'职位一',rankLevel:'P3',jobSeries:'技术',status:'0'})).body.data;
  assert.ok(job.id);assert.equal(job.rankLevel,'P3');
  const jobCsv='职位编号,职位名称,职级等阶,所属职系,排序号,状态,职责概述\nCAT_JOB_2,职位二,P4,管理,1,正常,管理职责';
  assert.equal((await request('POST','/api/org/job-titles/import',{rawData:jobCsv})).body.data.imported,1);
  await status(request('POST','/api/org/job-titles/import',{items:[{jobCode:'CAT_DUP',jobName:'一'},{jobCode:'cat_dup',jobName:'二'}]}),409);
  await status(request('POST','/api/org/job-titles',{jobCode:'BAD',jobName:'格式错误',sort:-1}),400);
  await status(request('POST','/api/org/job-titles',{jobCode:'FORGED',jobName:'权限越界'}, {},{...admin,roles:['editor']}),403);
  await status(request('POST','/api/org/positions/import',{rawData:csv}, {},{...admin,roles:['viewer']}),403);
  const restarted=new DomainService(db,new NativeService());
  const bundle=(await restarted.dispatch({method:'GET',path:'/api/org/bundle',body:{},query:{},headers:{}},admin)).body.data;
  assert.ok(bundle.positions.some(p=>p.id===position.id));assert.ok(bundle.jobTitles.some(j=>j.id===job.id));
  assert.equal((await db.pool.query('SELECT payload FROM positions WHERE id=$1',[position.id])).rows[0].payload.postName,'岗位一');
  assert.equal((await db.pool.query('SELECT payload FROM job_titles WHERE id=$1',[job.id])).rows[0].payload.jobName,'职位一');
});
test('latest GitHub catalog CRUD and jobs alias preserve persisted references and atomic deletion',async()=>{
  const dept=(await request('POST','/api/org/depts',{deptName:'GitHub目录部门',deptCode:'GH_CAT',parentDeptCode:''})).body.data;
  const post=(await request('POST','/api/org/positions',{postCode:'GH_POST',postName:'原岗位',deptName:dept.deptName})).body.data;
  const otherDept=(await request('POST','/api/org/depts',{deptName:'GitHub调入部门',deptCode:'GH_OTHER',parentDeptCode:''})).body.data;
  const moved=(await request('PUT',`/api/org/positions/${post.id}`,{deptName:otherDept.deptName,deptCode:dept.deptCode})).body.data;
  assert.equal(moved.deptId,otherDept.id);
  await status(request('DELETE',`/api/org/depts/${otherDept.id}`),409);
  const user=(await request('POST','/api/org/users',{userName:'catalog-user',nickName:'Catalog user',password,positionName:'原岗位'})).body.data;
  await request('PUT',`/api/org/positions/${post.id}`,{postName:'新岗位',postCode:'GH_NEW'});
  assert.equal((await db.pool.query('SELECT payload FROM users WHERE id=$1',[user.id])).rows[0].payload.positionName,'新岗位');
  await status(request('DELETE',`/api/org/positions/${post.id}`),409);
  const unused=(await request('POST','/api/org/positions',{postCode:'GH_UNUSED',postName:'可删除岗位',deptCode:'GH_CAT'})).body.data;
  await status(request('POST','/api/org/positions/batch-delete',{ids:[unused.id,post.id]}),409);
  assert.ok((await request('GET','/api/org/positions')).body.data.some(row=>row.id===unused.id));
  await status(request('PUT',`/api/org/positions/${unused.id}`,{postCode:'gh_new'}),409);
  await status(request('PUT',`/api/org/positions/${unused.id}`,{deptCode:'MISSING'}),400);
  await request('DELETE',`/api/org/positions/${unused.id}`);
  await status(request('DELETE',`/api/org/positions/${unused.id}`),404);
  const job=(await request('POST','/api/org/jobs',{jobCode:'GH_JOB',jobName:'原职位',rankLevel:'P4',jobSeries:'研发'})).body.data;
  await request('PUT',`/api/org/jobs/${job.id}`,{jobName:'新职位',sort:3});
  assert.equal((await request('GET','/api/org/job-titles')).body.data.find(row=>row.id===job.id).jobName,'新职位');
  await status(request('POST','/api/org/jobs/import',{items:[{jobCode:'GH_JOB_2',jobName:'二'},{jobCode:'gh_job',jobName:'重复'}]}),409);
  assert.equal((await request('GET','/api/org/jobs')).body.data.some(row=>row.jobCode==='GH_JOB_2'),false);
  await status(request('POST','/api/org/jobs/batch-delete',{ids:[job.id,job.id]}),400);
  await request('POST','/api/org/jobs/batch-delete',{ids:[job.id]});
  assert.equal((await db.pool.query('SELECT id FROM job_titles WHERE id=$1',[job.id])).rows.length,0);
  await status(request('POST','/api/org/jobs',{jobCode:'DENIED',jobName:'越权'}, {},{...admin,roles:['editor']}),403);
});
test('repeal review enforces stages, permissions, rejection safety and archived-only restoration',async()=>{
  const flow=(await request('POST','/api/flow/model',{label:'废止测试流程',parentId:'arch_root'})).body.data;
  await status(request('POST','/api/flow/repeal/apply',{modelId:flow.id,reason:'测试'}),409);
  await request('POST','/api/flow/model/publish',{id:flow.id});
  const record=(await request('POST','/api/flow/repeal/apply',{modelId:flow.id,reason:'流程整合',applicant:'伪造发起人'})).body.data;
  assert.equal(record.applicant,admin.userName);
  assert.ok(record.approvalLogs.filter(log=>!log.time).every(log=>log.operator===''));
  await status(request('POST','/api/flow/repeal/apply',{modelId:flow.id,reason:'重复'}),409);
  await status(request('POST','/api/flow/repeal/confirmArchive',{id:record.id}),409);
  await status(request('POST','/api/flow/repeal/approveStep',{id:record.id,action:'approve'}, {},{...admin,roles:['editor']}),403);
  await status(request('POST','/api/flow/repeal/approveStep',{id:record.id,action:'invalid'}),400);
  await request('POST','/api/flow/repeal/approveStep',{id:record.id,action:'reject'});
  assert.equal((await db.pool.query('SELECT payload FROM flow_models WHERE id=$1',[flow.id])).rows[0].payload.status,'published');
  await status(request('POST','/api/flow/repeal/approveStep',{id:record.id,action:'approve'}),409);
  const second=(await request('POST','/api/flow/repeal/apply',{modelId:flow.id,reason:'再次评估'})).body.data;
  await request('POST','/api/flow/repeal/approveStep',{id:second.id,action:'approve'});
  await status(request('POST','/api/flow/repeal/confirmArchive',{id:second.id}),409);
  await request('POST','/api/flow/repeal/approveStep',{id:second.id,action:'approve'});
  await request('POST','/api/flow/repeal/confirmArchive',{id:second.id});
  await status(request('POST','/api/flow/repeal/confirmArchive',{id:second.id}),409);
  await status(request('POST','/api/flow/repeal/restore',{id:second.id,restoreStatus:'published'}, {},{...admin,roles:['editor']}),403);
  await status(request('POST','/api/flow/repeal/restore',{id:second.id,restoreStatus:'invalid'}),400);
  await request('POST','/api/flow/repeal/restore',{id:second.id,restoreStatus:'draft'});
  assert.equal((await db.pool.query('SELECT payload FROM flow_models WHERE id=$1',[flow.id])).rows[0].payload.status,'draft');
  await status(request('POST','/api/flow/repeal/restore',{id:second.id}),409);
  // Historical single-step records must not unpublish a flow when rejected.
  const legacy=(await request('POST','/api/flow/model',{label:'历史废止审批流程',parentId:'arch_root'})).body.data;
  await request('POST','/api/flow/model/publish',{id:legacy.id});
  await db.pool.query('INSERT INTO flow_repeals(id,payload) VALUES($1,$2)',['legacy_repeal',{id:'legacy_repeal',modelId:legacy.id,status:'待审核'}]);
  await request('POST','/api/flow/repeal/action',{id:'legacy_repeal',action:'reject'});
  assert.equal((await db.pool.query('SELECT payload FROM flow_models WHERE id=$1',[legacy.id])).rows[0].payload.status,'published');
});
test('asset panorama reads published snapshots while drafts remain editable and legacy architecture status is repaired',async()=>{
  const arch=(await request('POST','/api/flow/type',{parentId:'arch_root',label:'正式架构'})).body.data;
  await request('POST','/api/flow/type/publish',{id:arch.id});
  assert.equal((await request('GET','/api/flow/fulltypes')).body.data.find(a=>a.id===arch.id).status,'published');
  const flow=(await request('POST','/api/flow/model',{parentId:arch.id,label:'正式流程'})).body.data;
  await request('POST','/api/flow/model/publish',{id:flow.id});
  await request('PUT','/api/flow/model',{id:flow.id,label:'尚未发布的修改'});
  const working=(await request('GET','/api/flow/fullSimpleModels')).body.data.find(f=>f.id===flow.id);
  assert.equal(working.status,'draft');assert.equal(working.label,'尚未发布的修改');
  const asset=(await request('GET','/api/flow/fullSimpleModels',{}, {view:'published'})).body.data.find(f=>f.id===flow.id);
  assert.equal(asset.label,'正式流程');assert.equal(asset.status,'published');assert.ok(Number.isFinite(Date.parse(asset.publishTime)));
  const never=(await request('POST','/api/flow/type',{parentId:'arch_root',label:'未发布架构'})).body.data;
  await db.pool.query("UPDATE flow_architectures SET payload=payload-'status' WHERE id=$1",[arch.id]);
  await pg.exec(readFileSync('migrations/004_architecture_publication_status.sql','utf8'));
  const rows=(await request('GET','/api/flow/fulltypes')).body.data;
  assert.equal(rows.find(a=>a.id===arch.id).status,'published');assert.notEqual(rows.find(a=>a.id===never.id).status,'published');
  const panorama=(await request('GET','/api/flow/fulltypes',{}, {view:'published'})).body.data;
  assert.ok(panorama.some(a=>a.id===arch.id));assert.ok(!panorama.some(a=>a.id===never.id));
  const history=(await request('GET','/api/flow/model/publishVersionHistories',{}, {id:flow.id})).body.data;
  assert.ok(Number.isFinite(Date.parse(history[0].publishTime)));
  await db.pool.query("UPDATE flow_models SET payload=jsonb_set(payload,'{status}','\"repealed\"'::jsonb) WHERE id=$1",[flow.id]);
  assert.ok(!(await request('GET','/api/flow/fullSimpleModels',{}, {view:'published'})).body.data.some(f=>f.id===flow.id));
});
test('published asset order follows numeric labels and published custom sorting instead of UUID order',async()=>{
  const ids=[];
  for(const label of ['4.0 IPD','2.0 MTL','10.0 Other','1.0 DSTE','3.0 LTC']) {
    const arch=(await request('POST','/api/flow/type',{parentId:'arch_root',label})).body.data;
    ids.push(arch.id);await request('POST','/api/flow/type/publish',{id:arch.id});
  }
  const rows=()=>request('GET','/api/flow/fulltypes',{}, {view:'published'}).then(r=>r.body.data.filter(a=>ids.includes(a.id)));
  assert.deepEqual((await rows()).map(a=>a.label),['1.0 DSTE','2.0 MTL','3.0 LTC','4.0 IPD','10.0 Other']);
  // Draft edits to ordering or names must not alter the published arrangement.
  await request('PUT','/api/flow/type/full',{id:ids[0],label:'0.0 Draft IPD',sort:0});
  assert.equal((await rows())[0].label,'1.0 DSTE');
  await request('POST','/api/flow/type/publish',{id:ids[0]});
  assert.equal((await rows())[0].sortOrder,0);
  assert.equal((await rows())[0].label,'0.0 Draft IPD');
});
test('failed writes rollback fully; FK use and tree cycles are rejected',async()=>{
  const created=await request('POST','/api/flow/type',{parentId:'arch_root',label:'子架构'});
  await status(request('PUT','/api/flow/type/full',{id:'arch_root',parentId:created.body.data.id}),409);
  const root=await request('GET','/api/flow/type',{}, {id:'arch_root'});assert.equal(root.body.data.parentId,'');
  await status(request('DELETE','/api/flow/type',{}, {id:'arch_root'}),409);
  const before=(await request('GET','/api/org/users')).body.total;
  await status(request('POST','/api/org/users',{userName:'weak',nickName:'Weak',password:'12345'}),400);
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
test('signed certificates bind company, machine, quota and expiry and persist across restarts',async()=>{
  const prior={publicKey:process.env.LICENSE_PUBLIC_KEY,machine:process.env.MACHINE_ID,file:process.env.LICENSE_PUBLIC_KEY_FILE};
  const pair=generateKeyPairSync('rsa',{modulusLength:2048});
  const claims={companyName:'苏州全元数字科技有限公司',machineCode:'test-deployment',edition:'Enterprise',authUsersCount:200,expireDate:'2099-12-31T15:59:59.000Z'};
  const token=c=>{const payload=Buffer.from(JSON.stringify(c)).toString('base64url');return payload+'.'+sign('sha256',Buffer.from(payload),pair.privateKey).toString('base64url');};
  try {
    process.env.LICENSE_PUBLIC_KEY=pair.publicKey.export({format:'pem',type:'spki'});process.env.MACHINE_ID=claims.machineCode;
    const config=(await request('GET','/api/system/company')).body.data.licenseConfiguration;
    assert.equal(config.ready,true);assert.equal(config.machineCode,claims.machineCode);assert.ok(!JSON.stringify(config).includes('PUBLIC KEY'));
    await status(request('POST','/api/system/license/activate',{companyName:claims.companyName,licenseKey:'DFLOW-ENTP-fake'}),400);
    await status(request('POST','/api/system/license/activate',{companyName:claims.companyName,licenseKey:token({...claims,machineCode:'another-server'})}),400);
    await status(request('POST','/api/system/license/activate',{companyName:claims.companyName,licenseKey:token({...claims,expireDate:'2000-01-01T00:00:00.000Z'})}),400);
    const valid=token(claims),[payload,signature]=valid.split('.');
    await status(request('POST','/api/system/license/activate',{companyName:claims.companyName,licenseKey:Buffer.from(JSON.stringify({...claims,authUsersCount:9999})).toString('base64url')+'.'+signature}),400);
    await status(request('POST','/api/system/license/activate',{companyName:'其他公司',licenseKey:valid}),400);
    const active=(await request('POST','/api/system/license/activate',{companyName:claims.companyName,licenseKey:valid,authUsersCount:9999})).body.data;
    assert.equal(active.authUsersCount,200);assert.equal(active.license.status,'ACTIVE');assert.equal(active.license.licenseKey,valid);
    const restarted=new DomainService(db,new NativeService());
    const saved=(await restarted.dispatch({method:'GET',path:'/api/system/license',body:{},query:{},headers:{}},admin)).body.data;
    assert.equal(saved.license.status,'ACTIVE');assert.equal(saved.companyName,claims.companyName);assert.equal(saved.license.auditLogs[0].operator,admin.userName);
    await status(request('POST','/api/system/company',{companyName:'绕过签名更名'}),400);
    await request('POST','/api/system/company',{systemDisplayName:'授权后的展示设置'});
    assert.equal((await request('GET','/api/system/company')).body.data.license.status,'ACTIVE');
    process.env.MACHINE_ID='another-server';assert.equal((await request('GET','/api/system/company')).body.data.license.status,'INVALID');
    process.env.LICENSE_PUBLIC_KEY='invalid key';assert.equal((await request('GET','/api/system/company')).body.data.licenseConfiguration.ready,false);
    const directory=mkdtempSync(join(tmpdir(),'dflow-license-'));
    try {
      delete process.env.LICENSE_PUBLIC_KEY;process.env.LICENSE_PUBLIC_KEY_FILE=join(directory,'public.pem');process.env.MACHINE_ID=claims.machineCode;
      writeFileSync(process.env.LICENSE_PUBLIC_KEY_FILE,pair.publicKey.export({format:'pem',type:'spki'}));
      assert.equal((await request('GET','/api/system/company')).body.data.license.status,'ACTIVE');
      await db.transaction(true,async c=>{const before=await db.load(c),state=structuredClone(before);const expired={...claims,expireDate:'2000-01-01T00:00:00.000Z'};Object.assign(state.companyAuthData.license,expired,{licenseKey:token(expired)});await db.save(c,before,state);});
      const expired=(await request('GET','/api/system/company')).body.data.license;
      assert.equal(expired.status,'EXPIRED');assert.equal(expired.hardwareVerified,false);
    } finally {rmSync(directory,{recursive:true,force:true});}
  } finally {
    for(const [env,value]of [['LICENSE_PUBLIC_KEY',prior.publicKey],['MACHINE_ID',prior.machine],['LICENSE_PUBLIC_KEY_FILE',prior.file]]) {if(value===undefined)delete process.env[env];else process.env[env]=value;}
  }
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
    const headers={'Content-Type':'application/json',Origin:process.env.APP_ORIGIN,Cookie:cookie};
    const user={userName:'new-user-http',nickName:'新增用户',deptId:'',deptName:'',deptCode:'',positionName:'知识运营专家',roleNames:[],phonenumber:'13800000001',email:'new-user@example.invalid',sex:'0',status:'0',remark:'新增用户回归测试'};
    for(const password of ['11111','x'.repeat(33)]) {
      const invalid=await fetch(base+'/api/org/users',{method:'POST',headers,body:JSON.stringify({...user,password})});
      assert.equal(invalid.status,400);assert.equal((await invalid.json()).info,'密码长度必须为 6–32 个字符');
    }
    const initialPassword='123456';
    const created=await fetch(base+'/api/org/users',{method:'POST',headers,body:JSON.stringify({...user,password:initialPassword})});
    assert.equal(created.status,200);const added=await created.json();assert.ok(added.data.id);assert.ok(!JSON.stringify(added).includes(initialPassword));
    assert.equal((await fetch(base+'/api/session',{method:'POST',headers,body:JSON.stringify({userId:user.userName,password:initialPassword})})).status,200);
    const invalidReset=await fetch(base+`/api/org/users/${added.data.id}/reset-password`,{method:'POST',headers,body:JSON.stringify({newPassword:'11111'})});
    assert.equal(invalidReset.status,400);assert.equal((await invalidReset.json()).info,'密码长度必须为 6–32 个字符');
    for(const newPassword of ['x'.repeat(32),'654321']) {
      const reset=await fetch(base+`/api/org/users/${added.data.id}/reset-password`,{method:'POST',headers,body:JSON.stringify({newPassword})});
      assert.equal(reset.status,200);
      assert.equal((await fetch(base+'/api/session',{method:'POST',headers,body:JSON.stringify({userId:user.userName,password:newPassword})})).status,200);
    }
    const longReset=await fetch(base+`/api/org/users/${added.data.id}/reset-password`,{method:'POST',headers,body:JSON.stringify({newPassword:'x'.repeat(33)})});
    assert.equal(longReset.status,400);
  } finally {await app.close();}
});

test('dictionary approval paths persist and enforce progressive review, rejection and resubmission',async()=>{
  const chain=[{approverName:'管理员',levelName:'初审'},{approverName:'管理员',levelName:'终审'}];
  await request('POST','/api/dict/approval-path',{sysDoc:chain,risk:chain});
  const restarted=new DomainService(db,new NativeService());
  assert.equal((await restarted.dispatch({method:'GET',path:'/api/dict/approval-path',body:{},query:{},headers:{}},admin)).body.data.risk.length,2);
  const row=(await request('POST','/api/dict/item',{itemType:'sysDoc',action:'create',item:{label:'新增制度',status:'approved'}})).body.data;
  assert.equal(row.status,'pending');assert.equal(row.approvalFlow.length,2);
  const first=await request('POST','/api/dict/item',{itemType:'sysDoc',action:'approve',id:row.id,auditor:'伪造人'});
  assert.equal(first.body.data.status,'pending');assert.equal(first.body.data.currentLevel,2);assert.equal(first.body.data.approvalFlow[0].auditor,'管理员');
  const rejected=await request('POST','/api/dict/item',{itemType:'sysDoc',action:'reject',id:row.id,auditRemark:'补充材料'});
  assert.equal(rejected.body.data.status,'rejected');
  await status(request('POST','/api/dict/item',{itemType:'sysDoc',action:'approve',id:row.id}),409);
  const resubmitted=await request('POST','/api/dict/item',{itemType:'sysDoc',action:'resubmit',id:row.id});
  assert.equal(resubmitted.body.data.currentLevel,1);assert.equal(resubmitted.body.data.approvalHistory.length,1);
  await request('POST','/api/dict/item',{itemType:'sysDoc',action:'approve',id:row.id});
  const final=await request('POST','/api/dict/item',{itemType:'sysDoc',action:'approve',id:row.id});assert.equal(final.body.data.status,'approved');
  const edited=await request('POST','/api/dict/item',{itemType:'sysDoc',action:'update',item:{id:row.id,label:'修订制度',status:'approved'}});assert.equal(edited.body.data.status,'pending');
  await status(request('POST','/api/dict/approval-path',{sysDoc:[{approverName:'不存在'}]}),400);
});
test('approval history returns filters, metadata and chronological logs from persisted tasks',async()=>{
  const manual=(await request('POST','/api/flowdoc/manuals',{manualName:'履历手册',manualNo:'HISTORY-01'})).body.data;
  const item=(await request('POST',`/api/flowdoc/manuals/${manual.id}/items`,{dutyName:'履历事项',categoryId:manual.categoryTree[0].id})).body.data;
  const submit=await request('POST','/api/flowdoc/audit/submit',{manualId:manual.id,itemIds:[item.id],levels:[{approverName:'管理员',roleName:'审核员',levelName:'初核'}]});
  await request('POST',`/api/flowdoc/audit/tasks/${submit.body.createdTasks[0].id}/approve`,{opinion:'履历测试'});
  const history=(await request('GET','/api/flowdoc/audit/history',{}, {manualId:manual.id,sort:'asc'})).body;
  assert.ok(history.total>=2);assert.ok(history.data.every(r=>r.manualId===manual.id));assert.ok(history.meta.availableManuals.some(m=>m.id===manual.id));
  const filtered=(await request('GET','/api/flowdoc/audit/history',{}, {manualId:manual.id,keyword:'履历测试'})).body;assert.equal(filtered.total,1);
});
test('frontend publish respects configured approval levels and durable scheduled publication',async()=>{
  const flow=(await request('POST','/api/flow/model',{label:'逐级定时发布',parentId:'arch_root'})).body.data;
  await request('POST','/api/flow/model/publish',{id:flow.id,audit:true,approvalLevels:[{approverName:'管理员'},{approverName:'管理员'}],publishPolicy:'scheduled',scheduledTime:new Date(Date.now()+60000).toISOString()});
  const audit=(await request('GET','/api/flow/audits')).body.data.find(a=>a.modelId===flow.id);
  const first=await request('POST','/api/flow/audits/action',{id:audit.id,action:'approve'});assert.equal(first.body.data.auditStatus,'待审核');assert.equal(first.body.data.currentLevel,2);
  await request('POST','/api/flow/audits/action',{id:audit.id,action:'approve'});
  assert.equal((await request('GET','/api/flow/model/full',{}, {id:flow.id})).body.data.status,'scheduled');
  await db.transaction(true,async c=>{const before=await db.load(c),state=structuredClone(before);state.flows.find(f=>f.id===flow.id).scheduledTime=new Date(Date.now()-1000).toISOString();await db.save(c,before,state);});
  await new DomainService(db,new NativeService()).publishScheduled();
  assert.equal((await request('GET','/api/flow/model/full',{}, {id:flow.id})).body.data.status,'published');
  assert.equal((await request('GET','/api/flow/model/publishVersionHistories',{}, {id:flow.id})).body.data.length,1);
  await service.publishScheduled();assert.equal((await request('GET','/api/flow/model/publishVersionHistories',{}, {id:flow.id})).body.data.length,1);
});
test('architecture integration diagrams and organization role mutations persist',async()=>{
  const arch=(await request('POST','/api/flow/type',{label:'集成测试架构',parentId:'arch_root'})).body.data;
  const xml='<mxfile><diagram><mxGraphModel><root><mxCell id="0"/></root></mxGraphModel></diagram></mxfile>';
  await request('POST',`/api/flow/arch/${arch.id}/integration-xml`,{xml,title:'集成图'});
  assert.equal((await request('GET',`/api/flow/arch/${arch.id}/integration-xml`)).body.data.xml,xml);
  const role=(await request('POST','/api/org/roles',{roleName:'测试业务角色',roleKey:'sync-test'})).body.data;
  await request('POST',`/api/org/roles/${role.id}/permissions`,{menuPermissions:['property'],featurePermissions:{edit:true}});
  const bundle=(await request('GET','/api/org/bundle')).body.data;assert.equal(bundle.roles.find(r=>r.id===role.id).featurePermissions.edit,true);
  await request('DELETE',`/api/org/roles/${role.id}`);
});

test('model configurations encrypt secrets, survive reads and drive the selected provider contract',async()=>{
  process.env.MODEL_CONFIG_KEY=Buffer.alloc(32,7).toString('base64');
  const model=(await request('POST','/api/system/models',{name:'测试模型',modelId:'test-model',baseUrl:'https://api.openai.com/v1',apiKey:'secret-test-key',maxTokens:100})).body.data;
  assert.equal(model.hasApiKey,true);assert.equal(model.apiKey,undefined);assert.equal(model.encryptedApiKey,undefined);
  await request('POST',`/api/system/models/${model.id}/set-default`);
  const stored=await db.transaction(false,async c=>(await db.load(c)).dictBundle.aiModels.find(m=>m.id===model.id));
  assert.ok(!stored.encryptedApiKey.includes('secret-test-key'));
  const {generateWithModel,modelEndpoint}=require('../dist/model-provider');
  let called=false;
  const result=await generateWithModel(stored,'生成JSON',true,async(url,options)=>{
    called=true;assert.equal(String(url),'https://api.openai.com/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer secret-test-key');assert.equal(options.redirect,'error');
    assert.equal(JSON.parse(options.body).model,'test-model');return new Response(JSON.stringify({choices:[{message:{content:'{"valid":true}'}}]}));
  });
  assert.equal(called,true);assert.equal(result.valid,true);
  assert.throws(()=>modelEndpoint('http://127.0.0.1/v1'));assert.throws(()=>modelEndpoint('https://evil.invalid/v1'));
  await status(request('DELETE',`/api/system/models/${model.id}`),409);
  const bundle=await request('GET','/api/dict/bundle');assert.ok(!JSON.stringify(bundle.body).includes('secret-test-key'));assert.ok(!JSON.stringify(bundle.body).includes(stored.encryptedApiKey));
});

test('auditor-only users review their own step; editors cannot bypass approval or alter global paths',async()=>{
  const reviewer=(await request('POST','/api/org/users',{userName:'review-sync',nickName:'同步审核员',password,accessRoles:['auditor'],status:'0'})).body.data;
  const editor=(await request('POST','/api/org/users',{userName:'edit-sync',nickName:'同步编制员',password,accessRoles:['editor'],status:'0'})).body.data;
  const asReviewer={id:reviewer.id,userId:'review-sync',userName:'同步审核员',nickName:'同步审核员',roles:['auditor']};
  const asEditor={id:editor.id,userId:'edit-sync',userName:'同步编制员',nickName:'同步编制员',roles:['editor']};
  const doc=(await request('POST','/api/dict/item',{itemType:'risk',action:'create',item:{label:'风控',approvalFlow:[{approverName:'同步审核员'}]}},{},asEditor)).body.data;
  await status(request('POST','/api/dict/item',{itemType:'risk',action:'approve',id:doc.id},{},asEditor),403);
  await status(request('POST','/api/dict/approval-path',{risk:[]},{},asEditor),403);
  const result=await request('POST','/api/dict/item',{itemType:'risk',action:'approve',id:doc.id},{},asReviewer);
  assert.equal(result.body.data.status,'approved');assert.equal(result.body.data.auditor,'同步审核员');
  const flow=(await request('POST','/api/flow/model',{label:'编制送审',parentId:'arch_root'},{},asEditor)).body.data;
  await request('POST','/api/flow/model/publish',{id:flow.id,audit:true,approvalLevels:[{approverName:'同步审核员'}]},{},asEditor);
  const audit=(await request('GET','/api/flow/audits')).body.data.find(a=>a.modelId===flow.id);
  await request('POST','/api/flow/audits/action',{id:audit.id,action:'withdraw'},{},asEditor);
  assert.equal((await request('GET','/api/flow/model/full',{}, {id:flow.id})).body.data.status,'draft');
  await status(request('POST','/api/flow/model/publish',{id:flow.id},{},asEditor),403);
});
test('editing a scheduled flow cancels the pending publication instead of publishing unreviewed changes',async()=>{
  const flow=(await request('POST','/api/flow/model',{label:'待修改定时流程',parentId:'arch_root'})).body.data;
  await request('POST','/api/flow/model/publish',{id:flow.id,publishPolicy:'scheduled',scheduledTime:new Date(Date.now()+60000).toISOString()});
  await request('PUT','/api/flow/model',{id:flow.id,label:'已修改草稿'});
  const result=(await request('GET','/api/flow/model/full',{}, {id:flow.id})).body.data;
  assert.equal(result.status,'draft');assert.equal(result.scheduledTime,undefined);
});

test('training persists revisions, isolates progress, grades on server and requires independent review',async()=>{
  const learner={id:'tr_learn',userId:'tr_learn',userName:'学员',nickName:'学员',roles:['viewer']};
  const peer={id:'tr_peer',userId:'tr_peer',userName:'复核人',nickName:'复核人',roles:['viewer']};
  const outsider={id:'tr_out',userId:'tr_out',userName:'其他人',nickName:'其他人',roles:['viewer']};
  await db.transaction(true,async client=>{const before=await db.load(client),s=structuredClone(before);
    s.orgUsers.push(...[learner,peer,outsider].map(a=>({id:a.id,userName:a.userId,nickName:a.nickName,status:'0',deptName:a===outsider?'其他部':'学习部',accessRoles:['viewer']})));
    s.flows.push({id:'tr_flow',parentId:'arch_root',label:'培训依据',status:'published',versionNo:'V1',xml:'<mxfile/>',flowNo:'TRAIN-01',publishTime:'2026-11-12',publishUserName:'管理员'});await db.save(client,before,s);
  });
  const payload={title:'流程实操课程',flowId:'tr_flow',importance:'必修',targetDepts:['学习部'],deadlineDays:30,sections:[{id:'s1',title:'准入要求',content:'必须核对申请材料。',time:'5分钟'}],questions:[{id:'q1',type:'choice',question:'材料缺失怎么办？',options:['补齐','跳过'],correctIndex:0,explanation:'准入要求',relatedNode:'准入节点'}],passingScore:80,practicalTask:{taskName:'填写申请',requirement:'提交填写结果',reviewer:peer.id}};
  const course=(await request('POST','/api/training/courses',payload)).body.data,url=`/api/training/courses/${course.id}`;
  assert.equal(course.sections[0].content,payload.sections[0].content);assert.equal(course.approvedVersion.versionNo,'V1');
  const bundle=(await request('GET','/api/dict/bundle',{}, {},outsider)).body.data;assert.equal(bundle.trainingCourses,undefined);assert.equal(bundle.trainingRecords,undefined);
  const list=async actor=>(await request('GET','/api/training/courses',{}, {},actor)).body.data.courses.find(c=>c.id===course.id);
  assert.equal(await list(outsider),undefined);await status(request('POST',url+'/exam',{answers:{q1:0},revision:1}, {},outsider),403);
  await status(request('POST','/api/training/courses',payload,{},learner),403);
  await status(request('POST',url+'/exam',{answers:{q1:0},score:100,revision:1},{},learner),400);
  await request('POST',url+'/sections/s1/complete',{revision:1}, {},learner);
  assert.equal((await list(learner)).myRecord.readStatus,'read');assert.notEqual((await list(learner)).status,'completed');assert.equal((await list(peer)).progress,0);
  await status(request('POST',url+'/exam',{answers:{},revision:1},{},learner),400);
  const failed=(await request('POST',url+'/exam',{answers:{q1:1},score:100,revision:1},{},learner)).body.data;assert.equal(failed.score,0);assert.equal(failed.passed,false);
  await request('POST',url+'/exam',{answers:{q1:0},revision:1},{},learner);
  await request('POST',url+'/practical',{evidence:'申请单 TEST-1，字段齐全',revision:1},{},learner);
  await status(request('POST',url+`/records/${learner.id}/confirm`,{revision:1},{},learner),403);
  await request('POST',url+`/records/${learner.id}/confirm`,{revision:1},{},peer);assert.equal((await list(learner)).status,'completed');
  const updated=(await request('PUT',url,{...payload,revision:course.revision,title:'更新课程'})).body.data;assert.equal(updated.revision,2);assert.equal(updated.progress,0);
  const weighted=(await request('PUT',url,{...payload,revision:2,kcpAllMustCorrect:true,timeLimitMinutes:25,maxAttempts:4,questions:[{...payload.questions[0],score:90},{...payload.questions[0],id:'q2',score:10,isKcpMandatory:true}]})).body.data;assert.equal(weighted.timeLimitMinutes,25);assert.equal(weighted.maxAttempts,4);
  await request('POST',url+'/sections/s1/complete',{revision:3},{},learner);const redline=(await request('POST',url+'/exam',{revision:3,answers:{q1:0,q2:1}},{},learner)).body.data;assert.equal(redline.score,90);assert.equal(redline.passed,false);

  await status(request('PUT',url,{...payload,revision:1}),409);await request('DELETE',url);assert.equal(await list(learner),undefined);
  await db.transaction(false,async client=>assert.ok((await db.load(client)).dictBundle.trainingRecords.some(r=>r.courseId===course.id&&r.practiceConfirmed)));
});

test('unified approvals isolate views, delegate four business actions and reject stale or unauthorized decisions',async()=>{
  const make=(id,name,roles)=>({id,userId:id,userName:name,nickName:name,roles});
  const applicant=make('ac_owner','审批申请人',['editor']),reviewer=make('ac_reviewer','审批处理人',['auditor']),next=make('ac_next','后续审批人',['auditor']),outsider=make('ac_out','其他审批人',['auditor']),cc=make('ac_cc','抄送用户',['viewer']);
  const step=name=>({level:1,levelName:'部门审批',approverName:name,status:'pending'});
  await db.transaction(true,async c=>{const before=await db.load(c),s=structuredClone(before);
    s.orgUsers.push(...[applicant,reviewer,next,outsider,cc].map(a=>({id:a.id,userName:a.userId,nickName:a.userName,status:'0',accessRoles:a.roles})));
    s.flows.push({id:'ac_model',parentId:'arch_root',label:'统一审批流程',versionNo:'V1',status:'verified',xml:'<mxfile><diagram><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>'});
    s.flowAuditRecords.push({id:'ac_flow',modelId:'ac_model',flowName:'统一审批流程',submitUserId:applicant.id,submitUser:applicant.userName,submitTime:new Date().toISOString(),auditStatus:'待审核',currentLevel:1,versionNo:'V2',approvalLevels:[step(reviewer.userName),{...step(next.userName),level:2,status:'waiting'}],ccUserIds:[cc.id]});
    s.dutyManuals.push({id:'ac_manual',manualName:'测试手册',items:[{id:'ac_item',status:'待审核'}]});
    s.dutyAuditTasks.push({id:'ac_duty',manualId:'ac_manual',dutyItemId:'ac_item',dutyName:'统一权责审批',submitterId:applicant.id,submitter:applicant.userName,status:'待审核',levels:[step(reviewer.userName)],currentLevelIndex:0,currentApprover:reviewer.userName,history:[]});
    for(const type of ['sysDoc','risk'])s.dictBundle[type].push({id:'ac_'+type,name:'统一'+type+'审批',applicantId:applicant.id,status:'pending',approvalFlow:[step(reviewer.userName)],currentLevel:1,approvalHistory:[]});
    await db.save(c,before,s);
  });
  const list=async(actor,view='pending')=>(await request('GET','/api/approvals',{}, {view},actor)).body.data;
  assert.equal((await list(reviewer)).items.filter(r=>r.id.startsWith('ac_')).length,4);
  assert.equal((await list(applicant,'mine')).items.filter(r=>r.id.startsWith('ac_')).length,4);
  assert.equal((await list(outsider,'query')).items.length,0);assert.equal((await list(next)).items.length,0);
  assert.equal((await list(cc,'cc')).items.length,1);
  await status(request('GET','/api/approvals/flow/ac_flow',{}, {},outsider),403);
  const detail=async(type,id,actor=reviewer)=>(await request('GET',`/api/approvals/${type}/${id}`,{}, {},actor)).body.data;
  const act=(type,id,row,action='approve',actor=reviewer)=>request('POST',`/api/approvals/${type}/${id}/action`,{action,revision:row.revision,opinion:'审批意见'}, {},actor);
  const first=await detail('flow','ac_flow');assert.equal(first.canAct,true);
  await status(act('flow','ac_flow',{revision:'stale'}),409);await status(act('flow','ac_flow',first,'approve',cc),403);
  await act('flow','ac_flow',first);assert.equal((await list(next)).items.length,1);assert.equal((await list(reviewer,'processed')).items.some(r=>r.id==='ac_flow'),true);
  await status(act('flow','ac_flow',first),403);
  await act('flow','ac_flow',await detail('flow','ac_flow',next),'approve',next);
  for(const type of ['duty','sysDoc','risk']){const row=await detail(type,'ac_'+type);await act(type,'ac_'+type,row,type==='risk'?'reject':'approve');}
  const own=await list(applicant,'mine');assert.equal(own.items.find(r=>r.id==='ac_flow').status,'approved');assert.equal(own.items.find(r=>r.id==='ac_risk').status,'rejected');assert.equal((await list(reviewer)).items.filter(r=>r.id.startsWith('ac_')).length,0);
  await db.transaction(false,async c=>{const s=await db.load(c);assert.equal(s.flows.find(r=>r.id==='ac_model').status,'published');assert.equal(s.dutyAuditTasks.find(r=>r.id==='ac_duty').status,'已通过');assert.equal(s.dictBundle.sysDoc.find(r=>r.id==='ac_sysDoc').status,'approved');});
  const created=(await request('POST','/api/flow/audits/apply',{modelId:'ac_model',approvalLevels:[{approverName:reviewer.userName}]},{},applicant)).body.data;
  const withdrawing=await detail('flow',created.id,applicant);assert.equal(withdrawing.canWithdraw,true);
  await act('flow',created.id,withdrawing,'withdraw',applicant);
  assert.equal((await detail('flow',created.id,applicant)).status,'withdrawn');

});
