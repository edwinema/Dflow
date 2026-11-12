// Run after build. Compare both browser source trees to executable backend routes.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const {registry,match}=require('../dist/domain/domain.service');
const {emptyState}=require('../dist/domain/state');
const routes=registry(emptyState(),{id:'',userId:'',userName:'',nickName:'',roles:[]}).routes;
const native=new Set(["POST /api/session", "GET /api/session", "POST /api/app/site/logout", "GET /api/openapi.json", "GET /api/dict/doc/download", "GET /api/dict/doc/preview", "POST /api/system/license/generate-code", "POST /api/system/license/activate", "GET /api/flow/type/publishVersionHistories", "GET /api/flow/model/publishVersionHistories", "POST /api/ai/form-fields-generate", "POST /api/ai/drawio-generate", "POST /api/ai/flow-chat", "GET /api/mining/overview", "POST /api/mining/switch-dataset", "POST /api/mining/extract", "POST /api/mining/import-logs", "POST /api/mining/ai-diagnose", "POST /api/system/models/test", "POST /api/system/apis/debug", "POST /api/files"]);
const result={checked:[],unresolved:[],missing:[]};
function scan(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){
 const file=path.join(dir,item.name);if(item.isDirectory()){scan(file);continue;}if(!/\.tsx?$/.test(file))continue;
 const tree=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function resolve(n,depth=0){
  if(!n||depth>8)return ['PARAM'];
  if(ts.isParenthesizedExpression(n))return resolve(n.expression,depth+1);
  if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))return [n.text];
  if(ts.isConditionalExpression(n))return [...resolve(n.whenTrue,depth+1),...resolve(n.whenFalse,depth+1)];
  if(ts.isTemplateExpression(n)){
   let variants=[n.head.text];
   for(const span of n.templateSpans)variants=variants.flatMap(v=>resolve(span.expression,depth+1).map(x=>v+x+span.literal.text));
   return variants;
  }
  if(ts.isIdentifier(n)){
   let found;
   function find(v){if(ts.isVariableDeclaration(v)&&v.name.getText(tree)===n.text&&v.getStart(tree)<n.getStart(tree)&&v.initializer)found=v.initializer;ts.forEachChild(v,find);}
   find(tree);if(found)return resolve(found,depth+1);
  }
  return ['PARAM'];
 }
 function walk(n){if(ts.isCallExpression(n)&&['fetch','safeFetchJson','templateRequest'].includes(n.expression.getText(tree))){
  // Resolve wrapper call sites, rather than counting its generic fetch(url, options).
  if(n.expression.getText(tree)==='fetch'&&(path.basename(file)==='safeFetch.ts'||path.basename(file)==='DocumentTemplateTools.tsx'))return;
  let methods=n.expression.getText(tree)==='templateRequest'&&n.arguments[1]?resolve(n.arguments[1]):['GET'];const options=n.arguments[1];
  if(options&&ts.isObjectLiteralExpression(options)){
   const prop=options.properties.find(p=>p.name?.getText(tree)==='method');
   if(prop)methods=resolve(prop.initializer||prop.name);
  }
  const urls=resolve(n.arguments[0]);
  for(const [mi,method] of methods.entries())for(let url of (methods.length===urls.length&&methods.length>1?[urls[mi]]:urls)) {
   const row={file,line:tree.getLineAndCharacterOfPosition(n.getStart(tree)).line+1,method,expression:n.arguments[0]?.getText(tree)};
   if(!url.startsWith('/api/')||!['GET','POST','PUT','DELETE'].includes(method))result.unresolved.push(row);
   else {url=url.split('?')[0];row.path=url;result.checked.push(row);if(!native.has(`${method} ${url}`)&&!match(routes,method,url))result.missing.push(row);}
  }
 }ts.forEachChild(n,walk);}walk(tree);
}}
for(const dir of process.argv.slice(2))scan(dir);
console.log(JSON.stringify(result,null,2));if(result.missing.length||result.unresolved.length)process.exitCode=1;
