const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const ts=require('typescript');
function load(file,globals={}){
 const source=fs.readFileSync(require('node:path').resolve(__dirname,'../../frontend/src',file),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(js,{exports,URL,Request,Response,Event,CustomEvent,setTimeout,...globals});return exports;
}
test('role capabilities bound menu grants, including all-menu and legacy admin labels',()=>{
 const {canAccessPath}=load('utils/menuPermissions.ts');
 const viewer={id:'reader',roles:['viewer'],menuPermissions:['all'],roleLabel:'超级管理员'};
 for(const path of ['/org/role','/org/dept','/system/models','/system/company','/build/design','/sysdoc/index2','/risk/index'])assert.equal(canAccessPath(path,viewer),false,path);
 for(const path of ['/dashboard/index','/property/overview','/sysdoc/indexview','/approval/pending?type=sysDoc'])assert.equal(canAccessPath(path,viewer),true,path);
 assert.equal(canAccessPath('/risk/riskview',{...viewer,menuPermissions:['risk']}),true);
 assert.equal(canAccessPath('/sysdoc/indexview',{...viewer,menuPermissions:['risk']}),true);
 assert.equal(canAccessPath('/risk/index',{...viewer,menuPermissions:['risk']}),false);
 const editor={id:'editor',roles:['editor']};assert.equal(canAccessPath('/build/design',editor),true);assert.equal(canAccessPath('/org/role',editor),false);
 assert.equal(canAccessPath('/system/models',{id:'admin',roles:['admin']}),true);
 assert.equal(canAccessPath('/build/design',{...editor,menuPermissions:['property']}),false);
 assert.equal(canAccessPath('/build/design',{...editor,menuPermissions:['build']}),true);
 assert.equal(canAccessPath('/property/overview',{...viewer,menuPermissions:[]}),false);
 assert.equal(canAccessPath('/org/role',{}),false);
});
test('403 emits readable global error, rejects optimistic success, keeps session and ignores third parties',async()=>{
 const win=new EventTarget();win.location={href:'https://dflow.test/',origin:'https://dflow.test'};let next;
 win.fetch=async()=>next;const errors=[],expired=[];win.addEventListener('api-error',e=>errors.push(e.detail));win.addEventListener('session-expired',e=>expired.push(e));
 load('utils/sessionFetch.ts',{window:win});let saved=false;
 next=new Response(JSON.stringify({status:0,info:'仅流程责任人可保存'}),{status:403});
 await assert.rejects(win.fetch('/api/flow/test/xml',{method:'POST'}).then(()=>saved=true),/仅流程责任人可保存/);
 await new Promise(resolve=>setTimeout(resolve,0));assert.equal(saved,false);assert.equal(errors[0].message,'仅流程责任人可保存');assert.equal(expired.length,0);
 next=new Response('<html>Forbidden</html>',{status:403});await assert.rejects(win.fetch('/api/dict/item'),/权限不足/);await new Promise(resolve=>setTimeout(resolve,0));assert.equal(errors.length,2);
 next=new Response('{}',{status:403});assert.equal((await win.fetch('https://external.test/api/item')).status,403);assert.equal(errors.length,2);
 next=new Response('{}',{status:401});await win.fetch('/api/session',{method:'POST'});assert.equal(expired.length,0);
 await win.fetch('/api/flow/models');assert.equal(expired.length,1);
 next=new Response('{"status":1}',{status:200});assert.equal((await win.fetch('/api/flow/models')).status,200);
});
