const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validateContract}=require('../dist/contracts');
test('runtime request schemas reject renamed and invalid fields while preserving withdrawal and dynamic fields',()=>{
  assert.throws(()=>validateContract('POST','/api/session',{username:'admin',password:'password'}));
  assert.throws(()=>validateContract('POST','/api/flow/model',{label:123,parentId:'arch_root'}));
  validateContract('POST','/api/flow/audits/action',{id:'audit1',action:'withdraw'});
  validateContract('PUT','/api/flow/model/full',{id:'flow1',customField:{value:'dynamic form'}});
});
