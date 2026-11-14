const {test}=require('node:test');
const assert=require('node:assert/strict');
const {authorize}=require('../dist/domain/validation');
const {effectiveRoles}=require('../dist/security/role-capabilities');
const actor=role=>({id:'test',roles:['viewer',role]});
test('domain editors cannot write across business domains or publish directly',()=>{
 for(const [role,type] of [['document_editor','sysDoc'],['risk_editor','risk']]){
  authorize('POST','/api/dict/item',actor(role),{itemType:type,action:'create'});
  assert.throws(()=>authorize('POST','/api/dict/item',actor(role),{itemType:type==='risk'?'sysDoc':'risk',action:'update'}));
  assert.throws(()=>authorize('POST','/api/dict/item',actor(role),{itemType:type,action:'approve'}));
  assert.throws(()=>authorize('POST','/api/flow/model',actor(role),{}));
 }
 authorize('PUT','/api/flowdoc/manuals/:id',actor('duty_editor'),{});
 assert.throws(()=>authorize('POST','/api/flowdoc/manuals/:id/items/batch-publish',actor('duty_editor'),{}));
 authorize('POST','/api/dict/approval-path',actor('approval_manager'),{});
 assert.throws(()=>authorize('POST','/api/flow/model/publish',actor('approval_manager'),{}));
});
test('only the system administrator role may confer full access; disabled roles do not grant access',()=>{
 const user={roleNames:['系统管理员','制度管理员'],accessRoles:['viewer']};
 assert.ok(effectiveRoles(user,[{roleName:'系统管理员',status:'0',apiRoles:['admin']}]).includes('admin'));
 assert.ok(!effectiveRoles(user,[{roleName:'制度管理员',status:'0',apiRoles:['admin']}]).includes('admin'));
 assert.ok(!effectiveRoles(user,[{roleName:'系统管理员',status:'1',apiRoles:['admin']}]).includes('admin'));
 assert.ok(effectiveRoles(user,[{roleName:'制度管理员',status:'0',apiRoles:['document_editor']}]).includes('document_editor'));
});
