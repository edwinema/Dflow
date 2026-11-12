import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Actor, DomainRequest, State } from './types';

export function validateInput(value: any, depth = 0) {
  if (depth > 30) throw new BadRequestException('嵌套层级过深');
  if (typeof value === 'string' && value.length > 2_000_000) throw new BadRequestException('文本过长');
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value) && value.length > 10000) throw new BadRequestException('批次不能超过 10000 项');
  for (const [key, child] of Object.entries(value)) {
    if (['__proto__','prototype','constructor'].includes(key)) throw new BadRequestException('非法属性');
    validateInput(child, depth + 1);
  }
}
const required: Record<string, string[]> = {
  'POST /api/flow/type': ['label'], 'POST /api/flow/model': ['label','parentId'],
  'POST /api/flow/model/copy': ['id'], 'POST /api/flow/model/publish': ['id'],
  'POST /api/flow/type/publish': ['id'], 'POST /api/flow/audits/apply': ['modelId'],
  'POST /api/flow/repeal/apply': ['modelId','reason'],
  'POST /api/execute/tasks/assign': ['modelId','assignee'],
  'POST /api/org/users': ['userName','nickName','password'],
};
export function authorize(method: string, path: string, actor: Actor, body: any = {}) {
  if (actor.roles.includes('admin')) return;
  if (method === 'GET') return;
  if(method==='POST'&&/^\/api\/training\/courses\/[^/]+\/(exam|practical|sections\/[^/]+\/complete|records\/[^/]+\/confirm)$/.test(path))return;
  if (path.startsWith('/api/org/') || path.startsWith('/api/system/')) throw new ForbiddenException('需要管理员权限');
  const approval = (path==='/api/dict/item'&&['approve','reject'].includes(body?.action)) || /\/audits\/(action|batch-action)|\/audit\/tasks\/|\/repeal\/(action|approveStep|confirmArchive|restore)$|\/publish$|\/batch-publish$/.test(path);
  const editorAction=(path==='/api/flow/model/publish'&&body?.audit===true)||(path.startsWith('/api/flow/audits/')&&body?.action==='withdraw');
  if ((approval&&!editorAction) ? !actor.roles.includes('auditor') : !actor.roles.includes('editor')) throw new ForbiddenException('权限不足');
}
export function prepare(method: string, path: string, req: DomainRequest, state: State, actor: Actor) {
  validateInput(req.body);
  if (!req.body || Array.isArray(req.body) || typeof req.body !== 'object') throw new BadRequestException('请求体必须为对象');
  for (const field of required[`${method} ${path}`] || []) {
    if (typeof req.body[field] !== 'string' || !req.body[field].trim()) throw new BadRequestException(`${field} 不能为空`);
  }
  for (const key of ['pageNum', 'pageSize']) {
    if (req.query[key] !== undefined && (!/^\d+$/.test(String(req.query[key])) || Number(req.query[key]) < 1)) throw new BadRequestException('分页参数无效');
  }
  if (Number(req.query.pageSize) > 200) throw new BadRequestException('pageSize 最大为 200');
  for (const key of ['ids','taskIds','itemIds','users','items','fields','fieldIds','levels','refIds','collaborators','orderedItems','cells']) {
    if (req.body[key] !== undefined && !Array.isArray(req.body[key])) throw new BadRequestException(`${key} 必须为数组`);
  }
  for(const key of ['userName','nickName','deptName','deptCode','label','name','roleName','roleCode','manualName','manualNo','dutyName','formKey','formName','parentId','versionNo','xml','prompt','message','opinion','reason','assignee']) {
    if(req.body[key]!==undefined&&req.body[key]!==null&&typeof req.body[key]!=='string')throw new BadRequestException(`${key} 必须为字符串`);
  }
  // Identity cannot be changed through bulk object assignment.
  const entityId=req.params.itemId??req.params.catId??req.params.id;
  if (entityId && req.body.id !== undefined && String(req.body.id) !== entityId) throw new BadRequestException('不能修改记录主键');
  if (method !== 'GET') {
    for (const key of ['operator','submitter','creator','updater','publishUserName']) {
      if (key in req.body || ['operator','submitter'].includes(key)) req.body[key] = actor.userName;
    }
    if (req.body.accessRoles && !actor.roles.includes('admin')) throw new ForbiddenException('不能分配权限');
  }
  const find = (rows: any[], id: any) => {
    const row = rows.find(r => String(r.id ?? r.formKey) === String(id));
    if (!row) throw new NotFoundException('记录不存在');
    return row;
  };
  const id = req.params.id ?? req.body.id ?? req.query.id;
  if(path.includes('batch-')) {
    const ids=req.body.ids??req.body.taskIds??req.body.itemIds??req.body.items;
    if(!Array.isArray(ids)||(!ids.length&&!path.endsWith('/items/batch-publish')))throw new BadRequestException('批量操作不能为空');
  }
  const maps: [string, string][] = [['/api/flow/model','flows'],['/api/flow/type','archTypes'],
    ['/api/execute/tasks','flowProcessTasks'],['/api/org/users','orgUsers'],['/api/org/depts','orgDepts'],
    ['/api/build/roles','buildProcessRoles'],['/api/build/role-categories','roleCategoriesStore'],
    ['/api/flow/terms','flowTerms'],['/api/flow/term-categories','flowTermCategories'],
    ['/api/flowdoc/manuals','dutyManuals'],['/api/flowdoc/duties','dutyTables']];
  for (const [prefix, key] of maps) if (path.startsWith(prefix) && id !== undefined) find(state[key], id);
  if (path === '/api/flow/:id/xml') find(state.flows, id);
  if (req.params.formKey) find(state.formEngineSchemas, req.params.formKey);
  if (req.body.modelId && !path.startsWith('/api/system/models')) find(state.flows, req.body.modelId);
  if(path.startsWith('/api/flow/repeal/action')) {
    const record=find(state.flowRepealRecords,id);
    if(record.status!=='待审核')throw new ConflictException('废止申请已处理');
    if(!['approve','reject'].includes(req.body.action))throw new BadRequestException('废止审批动作无效');
  }
  if (method === 'POST' && path === '/api/flow/repeal/apply') {
    const flow = find(state.flows, req.body.modelId);
    if (flow.status !== 'published') throw new ConflictException('只有已发布流程可以申请废止');
    if (state.flowRepealRecords.some((row: any) => row.modelId === flow.id && ['待审核','待部门审批','待合规复核','待集团流程管理员确认归档'].includes(row.status))) throw new ConflictException('该流程已有待处理废止申请');
    req.body.applicant = actor.userName;
  }
  if (method === 'POST' && ['/api/flow/repeal/approveStep','/api/flow/repeal/confirmArchive','/api/flow/repeal/restore'].includes(path)) {
    const record = req.body.id ? find(state.flowRepealRecords, req.body.id) : state.flowRepealRecords.find((row: any) => row.modelId === req.body.modelId && row.status === '已废止归档');
    if (!record) throw new NotFoundException('废止申请不存在');
    if (req.body.modelId && req.body.modelId !== record.modelId) throw new BadRequestException('废止申请与流程不匹配');
    req.body.id = record.id;
    if (path.endsWith('/approveStep')) {
      if (!['approve','reject'].includes(req.body.action)) throw new BadRequestException('废止审批动作无效');
      if (!['待部门审批','待合规复核'].includes(record.status)) throw new ConflictException('当前阶段不能审批');
    } else if (path.endsWith('/confirmArchive')) {
      if (record.status !== '待集团流程管理员确认归档') throw new ConflictException('完成部门审批和合规复核后才能归档');
    } else {
      const flow = find(state.flows, record.modelId);
      if (record.status !== '已废止归档' || flow.status !== 'repealed') throw new ConflictException('只有已废止归档的流程可以还原');
      if (req.body.restoreStatus !== undefined && !['draft','published'].includes(req.body.restoreStatus)) throw new BadRequestException('还原状态无效');
      if (req.body.targetParentId) find(state.archTypes, req.body.targetParentId);
    }
  }
  if(path.startsWith('/api/execute/tasks/')&&(/\/step$|\/submit$/.test(path))) {
    const task=find(state.flowProcessTasks,id);
    if(!actor.roles.includes('admin')&&![actor.id,actor.userId,actor.userName].includes(task.assignee))throw new ForbiddenException('仅任务受理人可以执行步骤');
  }
  for(const [prefix,key] of maps)if(path.startsWith(prefix)) {
    for(const target of req.body.ids??req.body.taskIds??[])find(state[key],target);
  }
  if(path==='/api/dict/item') {
    if(!['sysDoc','risk'].includes(req.body.itemType)||!['create','update','delete','approve','reject','resubmit'].includes(req.body.action))throw new BadRequestException('字典操作无效');
    if(req.body.action!=='create')find(state.dictBundle[req.body.itemType],req.body.id??req.body.item?.id);
  }
  if(path.startsWith('/api/flowdoc/manuals/')&&req.body.itemIds) {
    const manual=find(state.dutyManuals,req.params.id);
    for(const iid of req.body.itemIds)find(manual.items,iid);
  }
  if(path==='/api/flowdoc/audit/submit') {
    const manual=find(state.dutyManuals,req.body.manualId);
    for(const iid of req.body.itemIds||[])find(manual.items,iid);
    for(const level of req.body.levels||[]) {
      if(!state.orgUsers.some((u:any)=>u.status==='0'&&[u.userName,u.nickName].includes(level.approverName)))throw new BadRequestException('审批人必须为启用的真实用户');
    }
  }
  if (req.body.targetId) find(req.body.targetType === 'arch' ? state.archTypes : state.flows, req.body.targetId);
  if (req.body.parentId && (path === '/api/flow/model' || path.startsWith('/api/flow/type'))) find(state.archTypes, req.body.parentId);
  if (path.startsWith('/api/flow/audits/') && /action$/.test(path)) {
    if (!['approve','reject','withdraw'].includes(req.body.action)) throw new BadRequestException('审核动作无效');
    for (const aid of req.body.ids || [id]) {
      const row = find(state.flowAuditRecords, aid);
      if (row.auditStatus !== '待审核') throw new ConflictException('该审批已处理');
    }
  }
  if (path.startsWith('/api/flowdoc/audit/tasks/') && method !== 'GET') {
    for (const tid of req.body.taskIds || [id]) {
      const task = find(state.dutyAuditTasks, tid);
      if (!['待审核','审核中'].includes(task.status)) throw new ConflictException('该审批已处理');
      if (!actor.roles.includes('admin') && task.currentApprover !== actor.userName && task.currentApprover !== actor.userId) throw new ForbiddenException('仅当前审批人可操作');
    }
  }
  if (path === '/api/flowdoc/audit/submit') {
    for (const itemId of req.body.itemIds || []) {
      if (state.dutyAuditTasks.some((t: any) => t.manualId === req.body.manualId && t.dutyItemId === itemId && ['待审核','审核中'].includes(t.status))) throw new ConflictException('该事项已有待处理审批');
    }
  }
}

export function assertInvariants(state: State) {
  const unique = (rows: any[], key: string) => {
    const values = rows.map(r => String(r[key] || '').toLowerCase()).filter(Boolean);
    if (new Set(values).size !== values.length) throw new ConflictException(`${key} 必须唯一`);
  };
  unique(state.orgUsers, 'userName'); unique(state.orgDepts, 'deptCode');
  unique(state.orgPositions, 'postCode'); unique(state.orgJobTitles, 'jobCode');
  unique(state.buildProcessRoles, 'roleCode'); unique(state.buildProcessRoles, 'roleName');
  unique(state.flowTermCategories, 'name'); unique(state.formEngineSchemas, 'formKey');
  const tree = (rows: any[], key: string, parent: string) => {
    const index = new Map(rows.map(row => [row[key], row]));
    for (const row of rows) {
      const seen = new Set(); let cursor = row;
      while (cursor) {
        if (seen.has(cursor[key])) throw new ConflictException('树结构不能包含循环');
        seen.add(cursor[key]);
        if (cursor[parent] && !index.has(cursor[parent])) throw new ConflictException('父节点不存在或仍有子节点');
        cursor = index.get(cursor[parent]);
      }
    }
  };
  tree(state.archTypes, 'id', 'parentId'); tree(state.orgDepts, 'deptCode', 'parentDeptCode');
  tree(state.roleCategoriesStore, 'id', 'parentId');
  for (const flow of state.flows) if (!state.archTypes.some((a: any) => a.id === flow.parentId)) throw new ConflictException('流程所属架构不存在');
  for (const user of state.orgUsers) if (user.deptId && !state.orgDepts.some((d: any) => d.id === user.deptId)) throw new ConflictException('用户所属部门不存在');
  for (const position of state.orgPositions) if (position.deptId && !state.orgDepts.some((d: any) => d.id === position.deptId)) throw new ConflictException('仍有岗位引用该部门');
  for (const task of [...state.flowProcessTasks, ...state.flowAuditRecords, ...state.flowRepealRecords]) {
    if (task.modelId && !state.flows.some((f: any) => f.id === task.modelId)) throw new ConflictException('仍有任务或审批引用该流程');
  }
  for (const form of state.formEngineSchemas) { unique(form.fields, 'id'); unique(form.fields, 'fieldKey'); }
  for (const task of state.dutyAuditTasks) {
    if (!state.dutyManuals.some((m: any) => m.id === task.manualId && m.items.some((i: any) => i.id === task.dutyItemId))) throw new ConflictException('仍有审批引用该权责事项');
  }
}

export function redact(value: any): any {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) return Object.fromEntries(
    Object.entries(value).filter(([k]) => !['password','passwordHash','password_hash','accessRoles','apiKey','encryptedApiKey','trainingCourses','trainingRecords'].includes(k)).map(([k,v]) => [k,redact(v)]));
  return value;
}
