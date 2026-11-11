const {test}=require('node:test');
const assert=require('node:assert/strict');
const {mkdtempSync,writeFileSync,rmSync}=require('node:fs');
const {tmpdir}=require('node:os');
const {join,resolve}=require('node:path');
const {spawnSync}=require('node:child_process');

test('frontend coverage follows JSON wrapper calls and fails on unknown URLs or wrong native methods',()=>{
  const dir=mkdtempSync(join(tmpdir(),'dflow-coverage-'));
  const scan=()=>{
    const result=spawnSync(process.execPath,[resolve('scripts/check-frontend.cjs'),dir],{encoding:'utf8'});
    assert.ok(result.stdout,result.stderr);
    return {code:result.status,...JSON.parse(result.stdout)};
  };
  try {
    writeFileSync(join(dir,'safeFetch.ts'),'export function safeFetchJson(url:string,options?:RequestInit){return fetch(url,options)}');
    writeFileSync(join(dir,'view.tsx'),"safeFetchJson('/api/org/jobs'); fetch('/api/files',{method:'POST'});");
    let result=scan();assert.equal(result.code,0);assert.equal(result.checked.length,2);
    writeFileSync(join(dir,'view.tsx'),"safeFetchJson('/api/not-implemented'); fetch('/api/files',{method:'DELETE'});");
    result=scan();assert.equal(result.code,1);assert.equal(result.missing.length,2);
    writeFileSync(join(dir,'view.tsx'),'fetch(dynamicUrl)');
    result=scan();assert.equal(result.code,1);assert.equal(result.unresolved.length,1);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
