import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Actor, Registry, State } from './types';

export function registerFrontendSync(app: Registry, s: State, actor: Actor) {
  const { dutyAuditTasks, archTypes, flows, orgRoles } = s;
  const config = () => s.dictBundle.approvalPaths || {sysDoc: [], risk: []};
  const levels = (value: any) => {
    if (!Array.isArray(value) || value.length > 20) throw new BadRequestException('审批路径必须为最多20级的数组');
    return value.map((node: any, i: number) => {
      if (!node || typeof node.approverName !== 'string' || !s.orgUsers.some((u:any)=>u.status==='0' && [u.userName,u.nickName].includes(node.approverName))) throw new BadRequestException('审批人必须为启用的真实用户');
      return {level:i+1,levelName:String(node.levelName||`第${i+1}级审批`),approverName:node.approverName,roleName:String(node.roleName||''),deptName:String(node.deptName||''),status:i===0?'pending':'waiting',auditor:'',auditRemark:'',auditTime:''};
    });
  };
  app.get('/api/dict/approval-path', (_req,res)=>res.json({status:1,data:config(),info:'ok'}));
  app.post('/api/dict/approval-path', (req,res)=>{
    if (!actor.roles.includes('admin')) throw new ForbiddenException('配置审批路径需要管理员权限');
    const body=req.body, next=structuredClone(config());
    if(body.type!==undefined) {
      if(!['sysDoc','risk'].includes(body.type)) throw new BadRequestException('目录类型无效');
      next[body.type]=levels(body.paths);
    }
    for(const key of ['sysDoc','risk']) if(body[key]!==undefined)next[key]=levels(body[key]);
    s.dictBundle.approvalPaths=next;
    res.json({status:1,data:next,info:'审批路径配置已保存'});
  });
  app.post('/api/dict/item', (req,res)=>{
    const {itemType,action,item,id,auditRemark}=req.body;
    const list=s.dictBundle[itemType];
    const now=new Date().toISOString();
    const reply=(row:any)=>res.json({status:1,data:row,bundle:s.dictBundle,info:'ok'});
    if(action==='create') {
      if(!item || typeof item!=='object' || Array.isArray(item))throw new BadRequestException('条目不能为空');
      const chain=levels(item.approvalFlow?.length?item.approvalFlow:config()[itemType]);
      const row={...item,id:`${itemType}_${randomUUID()}`,status:'pending',approvalFlow:chain,currentLevel:1,applyTime:now,validityPeriod:item.validityPeriod||'',publishTime:'',auditTime:'',auditor:'',auditRemark:'',approvalHistory:[]};
      delete row.resubmitApproval; list.unshift(row); return reply(row);
    }
    const target=list.find((r:any)=>r.id===(id||item?.id));
    if(!target)throw new NotFoundException('条目不存在');
    if(action==='delete') { list.splice(list.indexOf(target),1); return reply(target); }
    if(action==='update') {
      if(!item || typeof item!=='object')throw new BadRequestException('条目不能为空');
      const chain=levels(item.approvalFlow??target.approvalFlow??config()[itemType]);
      // Editing content invalidates prior approval; clients cannot forge approval state.
      const previous=structuredClone(target);
      Object.assign(target,item,{id:target.id,status:'pending',approvalFlow:chain,currentLevel:1,applyTime:now,publishTime:'',auditTime:'',auditor:'',auditRemark:''});
      target.approvalHistory=[...(previous.approvalHistory||[]),{time:now,action:'修订送审',operator:actor.userName,approvalFlow:previous.approvalFlow||[]}];
      delete target.resubmitApproval; return reply(target);
    }
    if(action==='resubmit') {
      if(target.status!=='rejected')throw new ConflictException('只有驳回的条目可重新送审');
      target.approvalHistory=[...(target.approvalHistory||[]),{time:now,action:'重新送审',operator:actor.userName,approvalFlow:structuredClone(target.approvalFlow||[])}];
      target.approvalFlow=levels(target.approvalFlow?.length?target.approvalFlow:config()[itemType]);
      Object.assign(target,{status:'pending',currentLevel:1,applyTime:now,auditTime:'',auditor:'',auditRemark:''});return reply(target);
    }
    if(!['approve','reject'].includes(action))throw new BadRequestException('审核动作无效');
    if(!actor.roles.some(r=>['admin','auditor'].includes(r)))throw new ForbiddenException('需要审批权限');
    if(target.status!=='pending')throw new ConflictException('该审批已处理');
    const chain=target.approvalFlow||[], index=chain.findIndex((n:any)=>n.status==='pending'), current=chain[index];
    if(chain.length && !current)throw new ConflictException('审批路径没有待审核节点');
    if(current && !actor.roles.includes('admin') && ![actor.userName,actor.userId].includes(current.approverName))throw new ForbiddenException('仅当前审批人可操作');
    if(current)Object.assign(current,{status:action==='approve'?'approved':'rejected',auditor:actor.userName,auditRemark:typeof auditRemark==='string'?auditRemark:'',auditTime:now});
    Object.assign(target,{auditTime:now,auditor:actor.userName,auditRemark:typeof auditRemark==='string'?auditRemark:''});
    if(action==='reject')target.status='rejected';
    else if(index+1<chain.length) {chain[index+1].status='pending';target.currentLevel=index+2;}
    else {target.status='approved';target.publishTime=now;}
    return reply(target);
  });
app.get('/api/flowdoc/audit/history', (req, res) => {
  const { manualId, dutyNo, roleName, operator, action, keyword, sort = 'desc' } = req.query as Record<string, string>;

  let historyLogs: any[] = [];

  dutyAuditTasks.forEach((task) => {
    if (!Array.isArray(task.history)) return;
    task.history.forEach((h: any, idx: number) => {
      // Find matching level for this history item to get roleName and deptName
      const matchedLevel = task.levels?.find((lvl: any) =>
        lvl.levelName === h.nodeName ||
        lvl.approverName === h.operator
      );

      const role = h.roleName || matchedLevel?.roleName || (h.action === '提交送审' ? '送审发起人' : '审批责任人');
      const dept = h.deptName || matchedLevel?.deptName || (h.action === '提交送审' ? '编制部门' : '审核部门');

      historyLogs.push({
        id: `${task.id}-h-${idx}`,
        taskId: task.id,
        manualId: task.manualId,
        manualName: task.manualName,
        dutyItemId: task.dutyItemId,
        dutyNo: task.dutyNo,
        dutyName: task.dutyName,
        categoryName: task.categoryName,
        scope: task.scope,
        time: h.time,
        operator: h.operator,
        roleName: role,
        deptName: dept,
        action: h.action,
        nodeName: h.nodeName,
        opinion: h.opinion || '',
        urgency: task.urgency,
        taskStatus: task.status,
      });
    });
  });

  // Sort chronologically (default latest first)
  if (sort === 'asc') {
    historyLogs.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  } else {
    historyLogs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }

  // Filter by document / manual
  if (manualId && manualId !== '全部') {
    historyLogs = historyLogs.filter((l) => l.manualId === manualId);
  }
  // Filter by specific duty item
  if (dutyNo && dutyNo !== '全部') {
    historyLogs = historyLogs.filter((l) => l.dutyNo === dutyNo || l.dutyItemId === dutyNo);
  }
  // Filter by role
  if (roleName && roleName !== '全部') {
    historyLogs = historyLogs.filter((l) => l.roleName === roleName);
  }
  // Filter by actor / operator
  if (operator && operator !== '全部') {
    historyLogs = historyLogs.filter((l) => l.operator === operator);
  }
  // Filter by action
  if (action && action !== '全部') {
    historyLogs = historyLogs.filter((l) => l.action === action);
  }
  // Keyword search
  if (keyword) {
    const k = keyword.trim().toLowerCase();
    historyLogs = historyLogs.filter(
      (l) =>
        l.dutyName?.toLowerCase().includes(k) ||
        l.dutyNo?.toLowerCase().includes(k) ||
        l.manualName?.toLowerCase().includes(k) ||
        l.operator?.toLowerCase().includes(k) ||
        l.roleName?.toLowerCase().includes(k) ||
        l.nodeName?.toLowerCase().includes(k) ||
        l.opinion?.toLowerCase().includes(k) ||
        l.taskId?.toLowerCase().includes(k)
    );
  }

  // Distinct meta for frontend filter dropdowns
  const availableManualsMap = new Map();
  const availableRolesSet = new Set<string>();
  const availableActorsSet = new Set<string>();
  const availableActionsSet = new Set<string>();

  dutyAuditTasks.forEach((t) => {
    if (t.manualId && t.manualName) {
      availableManualsMap.set(t.manualId, t.manualName);
    }
  });

  historyLogs.forEach((l) => {
    if (l.roleName) availableRolesSet.add(l.roleName);
    if (l.operator) availableActorsSet.add(l.operator);
    if (l.action) availableActionsSet.add(l.action);
  });

  const meta = {
    availableManuals: Array.from(availableManualsMap.entries()).map(([id, name]) => ({ id, name })),
    availableRoles: Array.from(availableRolesSet),
    availableActors: Array.from(availableActorsSet),
    availableActions: Array.from(availableActionsSet),
  };

  res.json({
    status: 1,
    data: historyLogs,
    total: historyLogs.length,
    meta,
    info: 'ok',
  });
});

app.post('/api/flow/changeArch', (req, res) => {
  const { targetType, targetId, newParentId } = req.body;
  if (!targetId || !newParentId) {
    return res.status(400).json({ status: 0, info: '缺少必要参数' });
  }

  const targetParent = archTypes.find((a) => a.id === newParentId);
  if (!targetParent && newParentId !== 'arch_root') {
    return res.status(404).json({ status: 0, info: '目标上级架构不存在' });
  }

  if (targetType === 'arch') {
    const arch = archTypes.find((a) => a.id === targetId);
    if (!arch) {
      return res.status(404).json({ status: 0, info: '未找到目标流程架构' });
    }
    if (newParentId === targetId) {
      return res.status(400).json({ status: 0, info: '无法将自身设置为上级架构' });
    }

    // 检查循环引用：判断 newParentId 是否为 targetId 的子孙架构
    let cur = targetParent;
    while (cur && cur.parentId) {
      if (cur.parentId === targetId) {
        return res.status(400).json({ status: 0, info: '无法将架构归属至其自身的子架构下，避免循环引用' });
      }
      cur = archTypes.find((a) => a.id === cur.parentId);
    }

    arch.parentId = newParentId;
    let d = 0;
    let pCur = targetParent;
    while (pCur && pCur.parentId && pCur.id !== 'arch_root') {
      d++;
      pCur = archTypes.find((a) => a.id === pCur.parentId);
    }
    arch.level = `L${Math.min(6, Math.max(1, d + 1))}`;
    return res.json({ status: 1, data: arch, info: '流程架构归属变更成功' });
  } else {
    const flow = flows.find((f) => f.id === targetId);
    if (!flow) {
      return res.status(404).json({ status: 0, info: '未找到该业务流程' });
    }
    flow.parentId = newParentId;
    flow.archName = targetParent ? targetParent.label : '企业流程架构全景';
    return res.json({ status: 1, data: flow, info: '业务流程归属变更成功' });
  }
});

// Free Drag & Drop node movement (position reorder & cross-level movement)
app.post('/api/flow/moveNode', (req, res) => {
  const { dragId, dragType, targetId, targetType, position } = req.body;
  if(!['before','after','inside'].includes(position)||!['arch','flow'].includes(dragType)||!['arch','flow'].includes(targetType)||dragId===targetId)throw new BadRequestException('移动参数无效');
  if (!dragId || !targetId || !position) {
    return res.status(400).json({ status: 0, info: '缺少移动参数' });
  }

  // 1. Locate dragged item
  let dragItem: any = dragType === 'arch' ? archTypes.find((a) => a.id === dragId) : flows.find((f) => f.id === dragId);
  if (!dragItem) {
    return res.status(404).json({ status: 0, info: '未找到被拖拽节点' });
  }

  // Root arch cannot be moved
  if (dragType === 'arch' && (!dragItem.parentId || dragItem.id === 'arch_root')) {
    return res.status(400).json({ status: 0, info: '根架构不允许移动' });
  }

  // 2. Locate target item
  let targetItem: any = targetType === 'arch' ? archTypes.find((a) => a.id === targetId) : flows.find((f) => f.id === targetId);
  if (!targetItem) {
    return res.status(404).json({ status: 0, info: '未找到目标节点' });
  }

  // 3. Determine newParentId
  let newParentId = '';
  if (position === 'inside') {
    if (targetType !== 'arch') {
      return res.status(400).json({ status: 0, info: '流程节点无法作为父级包含子节点' });
    }
    newParentId = targetId;
  } else {
    newParentId = targetItem.parentId || 'arch_root';
  }

  // 4. Circular dependency check for arch
  if (dragType === 'arch') {
    if (newParentId === dragId) {
      return res.status(400).json({ status: 0, info: '无法移动到自身内部' });
    }
    let cur = archTypes.find((a) => a.id === newParentId);
    while (cur && cur.parentId) {
      if (cur.parentId === dragId || cur.id === dragId) {
        return res.status(400).json({ status: 0, info: '无法移动到自身的子孙架构下' });
      }
      cur = archTypes.find((a) => a.id === cur.parentId);
    }
  }

  // 5. Update parentId and levels
  const oldParentId = dragItem.parentId;
  dragItem.parentId = newParentId;

  if (dragType === 'arch') {
    let d = 0;
    let pCur = archTypes.find((a) => a.id === newParentId);
    while (pCur && pCur.parentId && pCur.id !== 'arch_root') {
      d++;
      pCur = archTypes.find((a) => a.id === pCur.parentId);
    }
    dragItem.level = `L${Math.min(6, Math.max(1, d + 1))}`;
  } else {
    const pArch = archTypes.find((a) => a.id === newParentId);
    dragItem.archName = pArch ? pArch.label : '企业流程架构全景';
  }

  // 6. Reorder siblings under newParentId
  const sibArchs = archTypes.filter((a) => a.parentId === newParentId && a.id !== dragId);
  const sibFlows = flows.filter((f) => f.parentId === newParentId && f.id !== dragId);

  const siblings: Array<{ id: string; type: 'arch' | 'flow'; item: any; sortOrder: number }> = [
    ...sibFlows.map((f, i) => ({ id: f.id, type: 'flow' as const, item: f, sortOrder: f.sortOrder ?? i })),
    ...sibArchs.map((a, i) => ({ id: a.id, type: 'arch' as const, item: a, sortOrder: a.sortOrder ?? sibFlows.length + i })),
  ].sort((a, b) => a.sortOrder - b.sortOrder);

  if (position === 'inside') {
    siblings.push({ id: dragItem.id, type: dragType, item: dragItem, sortOrder: 9999 });
  } else {
    const targetIdx = siblings.findIndex((s) => s.id === targetId);
    const insertIdx = position === 'before' ? (targetIdx === -1 ? 0 : targetIdx) : (targetIdx === -1 ? siblings.length : targetIdx + 1);
    siblings.splice(insertIdx, 0, { id: dragItem.id, type: dragType, item: dragItem, sortOrder: 0 });
  }

  siblings.forEach((s, idx) => {
    s.item.sortOrder = idx;
  });

  return res.json({
    status: 1,
    info: '节点移动与层级变更成功',
    data: {
      dragId,
      dragType,
      newParentId,
      oldParentId,
      position,
    },
  });
});


app.post('/api/org/roles', (req, res) => {
  const { roleName, roleKey, roleType = '自定义角色', dataScope = '本部门数据', roleSort, status = '0', menuPermissions = ['collab', 'property'], remark = '' } = req.body || {};
  if (!roleName || !roleName.trim()) {
    return res.status(400).json({ status: 0, info: '角色名称不能为空' });
  }
  const newR = {
    id: 'orole_' + randomUUID(),
    roleNo: orgRoles.length + 1,
    roleName: roleName.trim(),
    roleKey: roleKey ? roleKey.trim() : 'role_' + randomUUID(),
    roleType,
    roleSort: Number(roleSort) || (orgRoles.length + 1),
    dataScope,
    boundPositions: ['业务人员'],
    menuPermissions: Array.isArray(menuPermissions) && menuPermissions.length > 0 ? menuPermissions : ['collab', 'property'],
    userCount: 0,
    status: status || '0',
    remark: remark || '自定义业务角色',
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  orgRoles.push(newR);
  res.json({ status: 1, data: newR, list: orgRoles, info: '新增角色成功' });
});

app.put('/api/org/roles/:id', (req, res) => {
  const target = orgRoles.find((r) => r.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到指定角色' });
  Object.assign(target, req.body);
  res.json({ status: 1, data: target, list: orgRoles, info: '角色信息已更新' });
});

app.delete('/api/org/roles/:id', (req, res) => {
  if (req.params.id === 'orole_1') {
    return res.status(400).json({ status: 0, info: '超级管理员角色不允许删除' });
  }
  orgRoles.splice(0,orgRoles.length,...orgRoles.filter((r:any) => r.id !== req.params.id));
  res.json({ status: 1, list: orgRoles, info: '角色已成功删除' });
});

app.post('/api/org/roles/:id/permissions', (req, res) => {
  const target = orgRoles.find((r) => r.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到指定角色' });
  const { menuPermissions = [], featurePermissions, fieldPermissions } = req.body || {};
  target.menuPermissions = menuPermissions;
  if (featurePermissions) target.featurePermissions = featurePermissions;
  if (fieldPermissions) target.fieldPermissions = fieldPermissions;
  res.json({ status: 1, data: target, list: orgRoles, info: '角色权限配置已保存并即时生效' });
});


  for(const method of ['get','post'] as const) app[method]('/api/flow/arch/:id/integration-xml',(req,res)=>{
    const row=s.archTypes.find((a:any)=>a.id===req.params.id);
    if(!row)throw new NotFoundException('架构不存在');
    if(method==='post') {
      if(typeof req.body.xml!=='string')throw new BadRequestException('xml 必须为字符串');
      row.integrationXml=req.body.xml;
      if(req.body.title!==undefined)row.integrationTitle=String(req.body.title);
    }
    const escape=(v:any)=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
    const children=s.archTypes.filter((a:any)=>a.parentId===row.id);
    const xml=row.integrationXml||`<mxfile><diagram name="业务集成视图"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${children.map((a:any,i:number)=>`<mxCell id="${escape(a.id)}" value="${escape(a.label)}" vertex="1" parent="1"><mxGeometry x="${40+i*180}" y="80" width="150" height="60" as="geometry"/></mxCell>`).join('')}</root></mxGraphModel></diagram></mxfile>`;
    res.json({status:1,data:{id:row.id,xml,title:row.integrationTitle||`【业务集成视图】${row.label}`,archNo:row.archNo},info:'ok'});
  });
  app.put('/api/system/apis/:id',(req,res)=>{
    const row=s.systemApis.find((r:any)=>String(r.id)===req.params.id);
    if(!row)throw new NotFoundException('API 不存在');
    if(req.body.apiPath!==undefined&&!String(req.body.apiPath).startsWith('/api/'))throw new BadRequestException('仅支持本地 API');
    Object.assign(row,req.body,{id:row.id});res.json({status:1,data:row,list:s.systemApis,info:'ok'});
  });
  app.post('/api/system/apis/reset',()=>{throw new ConflictException('生产接口不允许重置为演示数据');});

  const apply=(flow:any,body:any)=>{
    if(s.flowAuditRecords.some((a:any)=>a.modelId===flow.id&&a.auditStatus==='待审核'))throw new ConflictException('该流程已经送审');
    const chain=levels(body.approvalLevels||[]);
    const versionNo=`V${(parseInt(String(flow.versionNo||'V1').replace(/\D/g,''))||1)+1}`;
    const row={id:`audit_${randomUUID()}`,modelId:flow.id,flowId:flow.id,flowCode:flow.flowNo,flowName:flow.label,versionNo,archPath:flow.archName,
      urgency:body.urgency||'普通',changeType:body.changeType||'版本升级',changeSummary:body.changeSummary||'',effectiveDate:body.effectiveDate||'',
      publishPolicy:body.publishPolicy||'immediate',scheduledTime:body.scheduledTime||'',approvalLevels:chain,currentLevel:1,
      submitTime:new Date().toISOString(),submitUser:actor.userName,submitUserDept:actor.deptName||'',auditStatus:'待审核',auditResult:'待审核',auditUser:chain[0]?.approverName||'',auditOpinion:''};
    flow.status='verified';s.flowAuditRecords.unshift(row);return row;
  };
  const schedule=(body:any)=>{
    if(body.publishPolicy!==undefined&&!['immediate','scheduled'].includes(body.publishPolicy))throw new BadRequestException('发布策略无效');
    if(body.publishPolicy==='scheduled'&&(!Number.isFinite(Date.parse(body.scheduledTime))||Date.parse(body.scheduledTime)<=Date.now()))throw new BadRequestException('定时发布时间必须是未来时间');
  };
  app.post('/api/flow/model/publish',(req,res)=>{
    const flow=s.flows.find((f:any)=>f.id===req.body.id);if(!flow)throw new NotFoundException('流程不存在');
    schedule(req.body);
    if(req.body.audit) {const audit=apply(flow,req.body);return res.json({status:1,data:{...audit,versionNo:audit.versionNo},list:s.flowAuditRecords,info:'已送审'});}
    if(s.flowAuditRecords.some((a:any)=>a.modelId===flow.id&&a.auditStatus==='待审核'))throw new ConflictException('流程正在审核中');
    const next=`V${(parseInt(String(flow.versionNo||'V1').replace(/\D/g,''))||1)+1}`;
    Object.assign(flow,{publishPolicy:req.body.publishPolicy||'immediate',scheduledTime:req.body.scheduledTime||'',targetVersion:next,status:req.body.publishPolicy==='scheduled'?'scheduled':'published'});
    if(flow.status==='published')flow.versionNo=next;
    res.json({status:1,data:{versionNo:next},info:'ok'});
  });
  app.post('/api/flow/audits/apply',(req,res)=>{
    const flow=s.flows.find((f:any)=>f.id===req.body.modelId);if(!flow)throw new NotFoundException('流程不存在');
    schedule(req.body);const row=apply(flow,req.body);res.json({status:1,data:row,list:s.flowAuditRecords,info:'ok'});
  });
  const auditAction=(id:string,body:any)=>{
    const row=s.flowAuditRecords.find((a:any)=>a.id===id);if(!row)throw new NotFoundException('审批不存在');
    if(row.auditStatus!=='待审核')throw new ConflictException('审批已经处理');
    const flow=s.flows.find((f:any)=>f.id===row.modelId), now=new Date().toISOString();
    const chain=row.approvalLevels||[],index=(row.currentLevel||1)-1,step=chain[index];
    if(body.action==='withdraw') {
      if(!actor.roles.includes('admin')&&row.submitUser!==actor.userName)throw new ForbiddenException('仅送审人可撤回');
      row.auditStatus='已撤回';row.auditResult='已撤回';flow.status='draft';
    } else {
      if(!['approve','reject'].includes(body.action))throw new BadRequestException('审核动作无效');
      if(!actor.roles.some(r=>['admin','auditor'].includes(r)))throw new ForbiddenException('需要审批权限');
      if(step&&!actor.roles.includes('admin')&&![actor.userName,actor.userId].includes(step.approverName))throw new ForbiddenException('仅当前审批人可操作');
      if(step)Object.assign(step,{status:body.action==='approve'?'approved':'rejected',auditTime:now,opinion:body.opinion||'',operator:actor.userName});
      if(body.action==='reject') {row.auditStatus='已驳回';row.auditResult='驳回修改';flow.status='draft';}
      else if(index+1<chain.length) {chain[index+1].status='pending';row.currentLevel=index+2;row.auditUser=chain[index+1].approverName;row.auditResult=`第${index+2}级审批中`;}
      else {
        row.auditStatus='已审核';row.auditResult='同意发布';
        Object.assign(flow,{publishPolicy:row.publishPolicy,scheduledTime:row.scheduledTime,targetVersion:row.versionNo});
        flow.status=row.publishPolicy==='scheduled'&&Date.parse(row.scheduledTime)>Date.now()?'scheduled':'published';
        if(flow.status==='published')flow.versionNo=row.versionNo;
      }
    }
    if(row.auditStatus!=='待审核'){row.auditTime=now;row.auditUser=actor.userName;}
    row.auditOpinion=body.opinion||'';return row;
  };
  app.post('/api/flow/audits/action',(req,res)=>res.json({status:1,data:auditAction(req.body.id,req.body),list:s.flowAuditRecords,info:'ok'}));
  app.post('/api/flow/audits/batch-action',(req,res)=>{
    if(!Array.isArray(req.body.ids)||new Set(req.body.ids).size!==req.body.ids.length)throw new BadRequestException('审批ID无效或重复');
    const data=req.body.ids.map((id:string)=>auditAction(id,req.body));res.json({status:1,data,list:s.flowAuditRecords,info:'ok'});
  });
}
