// Migrated business rules. No process-global mutable data and no Express server.
import { randomUUID } from 'node:crypto';
import { Registry, State, Actor } from './types';
export function registerOperations(app: Registry, state: State, currentActiveUser: Actor) {
  let { archTypes, flows, flowAuditRecords, flowRepealRecords, flowProcessTasks, dutyTables, dutyCategories, orgDepts, orgUsers, orgPositions, orgJobTitles, orgRoles, buildProcessRoles, roleCategoriesStore, flowTerms, flowTermCategories, formEngineSchemas, dutyManuals, dutyAuditTasks, systemApis, dictBundle, archRefsStore, flowRefsStore, companyAuthData } = state;
  const systemUsers = orgUsers.map((u: any) => ({ id: u.id, name: u.nickName || u.userName, userName: u.userName }));
  const DEFAULT_COLLAB_DEPTS = orgDepts.map((d: any) => d.deptName);
const buildDefaultFlowXml = (flowTitle: string, steps: { title: string; role: string; desc: string; out: string; kcp?: boolean; judge?: boolean }[]) => {
  const lines: string[] = [
    '<mxfile host="dflow.local" version="32.1.0">',
    '  <diagram id="dflow-main" name="流程图">',
    '    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200">',
    '      <root>',
    '        <mxCell id="0"/>',
    '        <mxCell id="1" parent="0"/>',
    '        <UserObject id="node_start" label="开始" dflowType="startEnd" name="开始">',
    '          <mxCell style="rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#f0f9eb;strokeColor=#67c23a;" vertex="1" parent="1">',
    '            <mxGeometry x="80" y="180" width="90" height="44" as="geometry"/>',
    '          </mxCell>',
    '        </UserObject>'
  ];

  let prevId = 'node_start';
  steps.forEach((raw, i) => {
    const escape = (v: string) => String(v).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    const st = { ...raw, title: escape(raw.title), role: escape(raw.role), desc: escape(raw.desc), out: escape(raw.out) };
    const id = `node_step_${i + 1}`;
    const roleNodeId = `node_role_${i + 1}`;
    const x = 230 + i * 190;
    const y = 175;
    const dflowType = st.judge ? 'nodeActiveJudge' : 'nodeActiveSerialRect';
    const label = st.judge ? st.title : `0${i + 1}\n${st.title}`;
    const style = st.judge
      ? 'rhombus;whiteSpace=wrap;html=1;fillColor=#eef6ff;strokeColor=#409eff;'
      : 'rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#333333;';

    lines.push(
      `        <UserObject id="${roleNodeId}" label="${st.role}" dflowType="nodeRoleName" name="${st.role}" roleId="role_${i + 1}" desc="负责 ${st.title} 环节">`,
      `          <mxCell style="rounded=0;whiteSpace=wrap;html=1;fillColor=#FACD91;strokeColor=#333333;" vertex="1" parent="1">`,
      `            <mxGeometry x="${x}" y="80" width="110" height="46" as="geometry"/>`,
      `          </mxCell>`,
      `        </UserObject>`
    );

    const kcpAttr = st.kcp ? 'kcp="true" kcpdesc="关键控制点" riskIds="[&quot;risk_01&quot;]"' : 'kcp="false"';
    lines.push(
      `        <UserObject id="${id}" label="${label}" dflowType="${dflowType}" name="${st.title}" roles="[&quot;${st.role}&quot;]" raciR="[&quot;${st.role}&quot;]" raciA="决策委员会" desc="${st.desc}" in="输入前置材料" out="${st.out}" execute="[&quot;PLM系统&quot;]" ${kcpAttr} kpi="按时达成率 98%" target="${i + 1}" timeType="天">`,
      `          <mxCell style="${style}" vertex="1" parent="1">`,
      `            <mxGeometry x="${x}" y="${y}" width="110" height="${st.judge ? 56 : 64}" as="geometry"/>`,
      `          </mxCell>`,
      `        </UserObject>`
    );

    lines.push(
      `        <mxCell id="edge_${i}" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=2;endArrow=block;" edge="1" parent="1" source="${prevId}" target="${id}">`,
      `          <mxGeometry relative="1" as="geometry"/>`,
      `        </mxCell>`
    );
    prevId = id;
  });

  const endX = 230 + steps.length * 190;
  lines.push(
    '        <UserObject id="node_end" label="结束" dflowType="startEnd" name="结束">',
    '          <mxCell style="rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#f0f9eb;strokeColor=#67c23a;" vertex="1" parent="1">',
    `            <mxGeometry x="${endX}" y="180" width="90" height="44" as="geometry"/>`,
    '          </mxCell>',
    '        </UserObject>',
    `        <mxCell id="edge_end" value="办结" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#333333;strokeWidth=2;endArrow=block;" edge="1" parent="1" source="${prevId}" target="node_end">`,
    '          <mxGeometry relative="1" as="geometry"/>',
    '        </mxCell>',
    '      </root>',
    '    </mxGraphModel>',
    '  </diagram>',
    '</mxfile>'
  );
  return lines.join('\n');
};

function recalculateManualCounts(manual: any) {
  if (Array.isArray(manual.items)) {
    manual.totalCount = manual.items.length;
    manual.publishedCount = manual.items.filter((i: any) => i.status === '已发布').length;
  } else {
    manual.totalCount = 0;
    manual.publishedCount = 0;
  }
  if (Array.isArray(manual.categoryTree)) {
    let catCount = 0;
    manual.categoryTree.forEach((root: any) => {
      catCount++;
      if (Array.isArray(root.children)) {
        catCount += root.children.length;
      }
    });
    manual.categoryCount = manual.categoryTree.length > 0 ? manual.categoryTree.length + 1 : 0;
  } else {
    manual.categoryCount = 0;
  }
}

function findDutyItem(manualId: string, itemId: string) {
  const manual = dutyManuals.find((m) => m.id === manualId);
  if (!manual || !Array.isArray(manual.items)) return null;
  return manual.items.find((i: any) => i.id === itemId);
}

function getCategoryRoleCount(cat: any): number {
  const descendantIds: string[] = [cat.id];
  const descendantNames: string[] = [cat.name];

  function collect(parentId: string) {
    const children = roleCategoriesStore.filter((c) => c.parentId === parentId);
    children.forEach((ch) => {
      descendantIds.push(ch.id);
      descendantNames.push(ch.name);
      collect(ch.id);
    });
  }
  collect(cat.id);

  return buildProcessRoles.filter((r) =>
    descendantNames.some(
      (n) => r.category === n || (r.category && r.category.startsWith(n))
    )
  ).length;
}

function syncCategoryCounts() {
  flowTermCategories.forEach((cat) => {
    cat.count = flowTerms.filter((t) => t.category === cat.name).length;
  });
}

app.get('/api/flow/fulltypes', (_req, res) => {
  if (!archTypes || archTypes.length === 0 || !archTypes.some((a: any) => !a.parentId || a.id === 'arch_root')) {
    archTypes.unshift({
      id: 'arch_root',
      parentId: '',
      label: '企业流程架构全景',
      level: 'L0',
      archNo: 'ARCH-CORP-000',
      versionNo: 'V2',
      status: 'published',
      publishUserName: '系统管理员',
      publishTime: '2026-03-20 14:00:00',
    });
  } else {
    const root = archTypes.find((a: any) => !a.parentId || a.id === 'arch_root');
    if (root && (!root.label || root.label === '企业流程架构' || root.label === '根架构' || root.label === 'ROOT')) {
      root.label = '企业流程架构全景';
    }
  }
  res.json({ status: 1, data: archTypes, info: 'ok' });
});

app.get('/api/flow/fullSimpleModels', (_req, res) => {
  res.json({ status: 1, data: flows, info: 'ok' });
});

app.get('/api/flow/type', (req, res) => {
  if (!archTypes.some((a: any) => !a.parentId || a.id === 'arch_root')) {
    archTypes.unshift({
      id: 'arch_root',
      parentId: '',
      label: '企业流程架构全景',
      level: 'L0',
      archNo: 'ARCH-CORP-000',
      versionNo: 'V2',
      status: 'published',
    });
  }
  const found = archTypes.find((a) => a.id === req.query.id) || archTypes[0];
  res.json({ status: 1, data: found, info: 'ok' });
});

app.post('/api/flow/type', (req, res) => {
  const { parentId, label } = req.body;
  const newArch = {
    id: 'arch_' + randomUUID(),
    parentId: parentId || 'arch_root',
    label: label || '新建流程架构',
    level: 'L2',
    archNo: 'ARCH-' + randomUUID(),
    ownerName: currentActiveUser.userName,
    deptName: '运营管理部',
    versionNo: 'V1',
    publishUserName: currentActiveUser.userName,
    publishTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  archTypes.push(newArch);
  res.json({ status: 1, data: newArch, info: 'ok' });
});

app.put('/api/flow/type', (req, res) => {
  const { id, label } = req.body;
  const target = archTypes.find((a) => a.id === id);
  if (target) target.label = label;
  res.json({ status: 1, data: target, info: 'ok' });
});

app.put('/api/flow/type/full', (req, res) => {
  const { id, ...rest } = req.body;
  const target = archTypes.find((a) => a.id === id);
  if (target) Object.assign(target, rest);
  res.json({ status: 1, data: target, info: 'ok' });
});

app.post('/api/flow/type/publish', (req, res) => {
  const { id } = req.body;
  const target = archTypes.find((a) => a.id === id);
  const nextVer = target ? `V${parseInt((target.versionNo || 'V1').slice(1)) + 1}` : 'V2';
  if (target) {
    target.versionNo = nextVer;
    target.publishTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  res.json({ status: 1, data: { versionNo: nextVer }, info: 'ok' });
});

app.get('/api/flow/type/refs', (req, res) => {
  const id = String(req.query.id || 'arch_root');
  const tab = String(req.query.tab || 'zdwj');
  const refIds = archRefsStore[id]?.[tab] || [];
  res.json({ status: 1, data: refIds, info: 'ok' });
});

app.post('/api/flow/type/refs', (req, res) => {
  const { id, tab, refIds } = req.body;
  if (!archRefsStore[id]) archRefsStore[id] = {};
  archRefsStore[id][tab] = Array.isArray(refIds) ? refIds : [];
  res.json({ status: 1, data: archRefsStore[id][tab], info: 'ok' });
});

app.get('/api/flow/model/full', (req, res) => {
  const found = flows.find((f) => f.id === req.query.id);
  res.json({ status: 1, data: found, info: 'ok' });
});

app.put('/api/flow/model/full', (req, res) => {
  const { id, ...rest } = req.body;
  const found = flows.find((f) => f.id === id);
  if (found) Object.assign(found, rest);
  res.json({ status: 1, data: found, info: 'ok' });
});

app.post('/api/flow/model', (req, res) => {
  const { parentId, label, flowNo, xml, flowLevel, ownerName, versionNo, description } = req.body;
  const parentArch = archTypes.find((a) => a.id === parentId) || archTypes[0];
  const newFlow = {
    id: 'flow_' + randomUUID(),
    parentId: parentArch.id,
    archName: parentArch.label,
    label: label || '新建流程',
    flowNo: flowNo || 'FLOW-' + randomUUID().substring(0, 8),
    ownerName: ownerName || currentActiveUser.userName,
    flowLevel: flowLevel || 'L3',
    versionNo: versionNo || 'V1',
    description: description || '',
    publishUserName: currentActiveUser.userName,
    publishTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    status: 'draft',
    category: 'responsible',
    xml: xml || buildDefaultFlowXml(label || '新建流程', [
      { title: '阶段启动', role: '业务员', desc: '发起流程', out: '申请表' },
      { title: '终审决策', role: '负责人', desc: '完成审批', out: '批准书', judge: true, kcp: true },
    ]),
  };
  flows.unshift(newFlow);
  res.json({ status: 1, data: newFlow, info: 'ok' });
});

app.post('/api/flow/model/copy', (req, res) => {
  const { id } = req.body;
  const src = flows.find((f) => f.id === id);
  const copy = {
    ...src,
    id: 'flow_' + randomUUID(),
    label: `${src.label} (副本)`,
    flowNo: `${src.flowNo || 'FLOW'}-COPY`,
    versionNo: 'V1',
    status: 'draft',
  };
  flows.push(copy);
  res.json({ status: 1, data: copy, info: 'ok' });
});

app.post('/api/flow/model/publish', (req, res) => {
  const { id, audit } = req.body;
  const found = flows.find((f) => f.id === id);
  const nextVer = found ? `V${parseInt((found.versionNo || 'V1').slice(1)) + 1}` : 'V2';
  if (found) {
    found.versionNo = nextVer;
    found.status = audit ? 'verified' : 'published';

    if (audit) {
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const existingIdx = flowAuditRecords.findIndex((r) => r.modelId === found.id && r.auditStatus === '待审核');
      const auditItem = {
        id: 'audit_' + randomUUID(),
        flowId: parseInt(found.id.replace(/\D/g, '')) || Math.floor(Math.random() * 900 + 100),
        modelId: found.id,
        flowCode: found.flowNo || 'FLOW-NEW',
        flowName: found.label || '新流程',
        versionNo: nextVer,
        archPath: found.archName || '企业流程架构全景 > 业务流程',
        businessDomain: (found.archName || '').split('>')[1]?.trim() || '1.0 集成产品开发 IPD',
        changeType: '版本升级',
        changeSummary: '在流程设计器中完成拓扑结构与活动节点配置，提交发布审核',
        urgency: '普通',
        submitTime: nowStr,
        submitUser: currentActiveUser.userName || '系统管理员',
        submitUserDept: currentActiveUser.deptName || '数字化运营部',
        auditStatus: '待审核',
        auditResult: '待审核',
        auditUser: '流程治理委员会',
        auditTime: '',
        auditOpinion: '',
        kcpCount: 0,
        activityCount: 0,
        boundDocsCount: 0,
        effectiveDate: nowStr.slice(0, 10),
      };
      if (existingIdx !== -1) {
        flowAuditRecords[existingIdx] = { ...flowAuditRecords[existingIdx], ...auditItem, id: flowAuditRecords[existingIdx].id };
      } else {
        flowAuditRecords.unshift(auditItem);
      }
    }
  }
  res.json({ status: 1, data: { versionNo: nextVer }, list: flowAuditRecords, info: 'ok' });
});

app.get('/api/flow/model/refs', (req, res) => {
  const id = String(req.query.id || 'flow_101');
  const tab = String(req.query.tab || 'zdwj');
  const refIds = flowRefsStore[id]?.[tab] || [];
  res.json({ status: 1, data: refIds, info: 'ok' });
});

app.post('/api/flow/model/refs', (req, res) => {
  const { id, tab, refIds } = req.body;
  if (!flowRefsStore[id]) flowRefsStore[id] = {};
  flowRefsStore[id][tab] = Array.isArray(refIds) ? refIds : [];
  res.json({ status: 1, data: flowRefsStore[id][tab], info: 'ok' });
});

// Binary attachment operations are handled by NativeService inside the SQL transaction.
app.post('/api/flow/model/upload-attachment', () => undefined);
app.get('/api/flow/attachment/download', () => undefined);

app.get('/api/flow/:id/xml', (req, res) => {
  const found = flows.find((f) => f.id === req.params.id);
  res.json({ status: 1, data: { xml: found.xml, title: found.label, id: found.id }, info: 'ok' });
});

app.post('/api/flow/:id/xml', (req, res) => {
  const found = flows.find((f) => f.id === req.params.id);
  const { xml, title } = req.body;
  if (found) {
    if (xml) found.xml = xml;
    if (title) found.label = title;
  }
  res.json({ status: 1, data: found, info: 'ok' });
});

app.get('/api/flow/collaborators', (req, res) => {
  const { targetType, targetId } = req.query as { targetType?: string; targetId?: string };
  let target: any = null;
  if (targetType === 'arch') {
    target = archTypes.find((a) => a.id === targetId);
  } else {
    target = flows.find((f) => f.id === targetId);
  }
  const collaborators = (target && target.collaborators) || [];
  res.json({
    status: 1,
    data: collaborators,
    target: target ? { id: target.id, label: target.label, ownerName: target.ownerName, flowNo: target.flowNo || target.archNo } : null,
    info: 'ok'
  });
});

app.post('/api/flow/collaborators', (req, res) => {
  const { targetType, targetId, collaborators } = req.body || {};
  let target: any = null;
  if (targetType === 'arch') {
    target = archTypes.find((a) => a.id === targetId);
  } else {
    target = flows.find((f) => f.id === targetId);
  }
  if (target) {
    target.collaborators = Array.isArray(collaborators) ? collaborators : [];
  }
  res.json({ status: 1, data: target?.collaborators || [], info: 'ok' });
});

app.get('/api/flow/audits', (_req, res) => {
  res.json({ status: 1, data: flowAuditRecords, info: 'ok' });
});

app.post('/api/flow/audits/apply', (req, res) => {
  const { modelId, versionNo, urgency, changeType, changeSummary, effectiveDate } = req.body || {};
  const found = flows.find((f) => f.id === modelId);
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const targetVer = versionNo || (found ? `V${parseInt((found.versionNo || 'V1').slice(1)) + 1}` : 'V2');

  if (found) {
    found.versionNo = targetVer;
    found.status = 'verified';
  }

  const newAudit = {
    id: 'audit_' + randomUUID(),
    flowId: parseInt((found?.id || '101').replace(/\D/g, '')) || Math.floor(Math.random() * 900 + 100),
    modelId: found?.id || 'flow_101',
    flowCode: found?.flowNo || 'FLOW-NEW',
    flowName: found?.label || '待审核业务流程',
    versionNo: targetVer,
    archPath: found?.archName || '企业流程架构全景 > 业务流程',
    businessDomain: (found?.archName || '').split('>')[1]?.trim() || '1.0 集成产品开发 IPD',
    changeType: changeType || '版本升级',
    changeSummary: changeSummary || '提交新版流程合规发布申请',
    urgency: urgency || '普通',
    submitTime: nowStr,
    submitUser: currentActiveUser.userName || '系统管理员',
    submitUserDept: currentActiveUser.deptName || '数字化运营部',
    auditStatus: '待审核',
    auditResult: '待审核',
    auditUser: '流程治理委员会',
    auditTime: '',
    auditOpinion: '',
    kcpCount: 0,
    activityCount: 0,
    boundDocsCount: 0,
    effectiveDate: effectiveDate || nowStr.slice(0, 10),
  };
  flowAuditRecords.unshift(newAudit);
  res.json({ status: 1, data: newAudit, list: flowAuditRecords, info: 'ok' });
});

app.post('/api/flow/audits/action', (req, res) => {
  const { id, action, opinion, effectiveDate } = req.body || {};
  const target = flowAuditRecords.find((r) => r.id === id);
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

  if (target) {
    if (action === 'approve') {
      target.auditStatus = '已审核';
      target.auditResult = '同意发布';
      target.auditTime = nowStr;
      target.auditUser = currentActiveUser.userName || '系统管理员';
      if (effectiveDate) target.effectiveDate = effectiveDate;

      // Update flow status to published
      const flowTarget = flows.find((f) => f.id === target.modelId);
      if (flowTarget) {
        flowTarget.status = 'published';
        flowTarget.versionNo = target.versionNo;
        flowTarget.publishTime = nowStr;
        flowTarget.publishUserName = target.auditUser;
      }
    } else if (action === 'reject') {
      target.auditStatus = '已驳回';
      target.auditResult = '驳回修改';
      target.auditTime = nowStr;
      target.auditUser = currentActiveUser.userName || '系统管理员';

      const flowTarget = flows.find((f) => f.id === target.modelId);
      if (flowTarget) {
        flowTarget.status = 'draft';
      }
    } else if (action === 'withdraw') {
      target.auditStatus = '已撤回';
      target.auditResult = '已撤回';
      target.auditTime = nowStr;
      target.auditUser = target.submitUser;

      const flowTarget = flows.find((f) => f.id === target.modelId);
      if (flowTarget) {
        flowTarget.status = 'draft';
      }
    }
    if (opinion !== undefined) {
      target.auditOpinion = opinion;
    }
  }
  res.json({ status: 1, data: target, list: flowAuditRecords, info: 'ok' });
});

app.post('/api/flow/audits/batch-action', (req, res) => {
  const { ids, action, opinion, effectiveDate } = req.body || {};
  const idList = Array.isArray(ids) ? ids : [];
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

  idList.forEach((id) => {
    const target = flowAuditRecords.find((r) => r.id === id);
    if (target) {
      if (action === 'approve') {
        target.auditStatus = '已审核';
        target.auditResult = '同意发布';
        target.auditTime = nowStr;
        target.auditUser = currentActiveUser.userName || '系统管理员';
        if (effectiveDate) target.effectiveDate = effectiveDate;
        if (opinion) target.auditOpinion = opinion;

        const flowTarget = flows.find((f) => f.id === target.modelId);
        if (flowTarget) {
          flowTarget.status = 'published';
          flowTarget.versionNo = target.versionNo;
          flowTarget.publishTime = nowStr;
          flowTarget.publishUserName = target.auditUser;
        }
      } else if (action === 'reject') {
        target.auditStatus = '已驳回';
        target.auditResult = '驳回修改';
        target.auditTime = nowStr;
        target.auditUser = currentActiveUser.userName || '系统管理员';
        if (opinion) target.auditOpinion = opinion;

        const flowTarget = flows.find((f) => f.id === target.modelId);
        if (flowTarget) {
          flowTarget.status = 'draft';
        }
      }
    }
  });

  res.json({ status: 1, list: flowAuditRecords, info: 'ok' });
});

app.delete('/api/flow/audits/:id', (req, res) => {
  const idx = flowAuditRecords.findIndex((r) => r.id === req.params.id);
  if (idx !== -1) {
    flowAuditRecords.splice(idx, 1);
  }
  res.json({ status: 1, list: flowAuditRecords, info: 'ok' });
});

app.post('/api/flow/audits/batch-delete', (req, res) => {
  const { ids } = req.body || {};
  const idSet = new Set(Array.isArray(ids) ? ids : []);
  for (let i = flowAuditRecords.length - 1; i >= 0; i--) {
    if (idSet.has(flowAuditRecords[i].id)) {
      flowAuditRecords.splice(i, 1);
    }
  }
  res.json({ status: 1, list: flowAuditRecords, info: 'ok' });
});

app.get('/api/flow/repeals', (_req, res) => {
  res.json({ status: 1, data: flowRepealRecords, info: 'ok' });
});

app.post('/api/flow/repeal/apply', (req, res) => {
  const { modelId, reasonType, reason, replaceFlowName, impactScope, applicant } = req.body || {};
  const targetFlow = flows.find((f) => f.id === modelId) || flows[0];
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const repId = 'repeal_' + randomUUID();

  targetFlow.repealApplyStatus = '待审核';
  targetFlow.repealApplyId = repId;

  const newRec = {
    id: repId,
    modelId: targetFlow.id,
    flowCode: targetFlow.flowNo,
    flowName: targetFlow.label,
    versionNo: targetFlow.versionNo || 'V1',
    flowLevel: targetFlow.flowLevel || 'L3',
    archId: targetFlow.parentId,
    archPath: targetFlow.archName || '企业流程架构全景',
    ownerName: targetFlow.ownerName || currentActiveUser?.userName,
    reasonType: reasonType || '业务模式变革调整',
    reason: reason || '业务优化升级与流程整合',
    replaceFlowName: replaceFlowName || '',
    impactScope: impactScope || '全公司相关业务部门',
    applicant: applicant || currentActiveUser?.userName || '流程管理员',
    applyTime: nowStr,
    stage: '待部门审批',
    status: '待部门审批',
    approvalLogs: [
      {
        stepName: '发起建议废止',
        role: '流程责任人 / 发起人',
        operator: applicant || currentActiveUser?.userName || '流程管理员',
        action: '已提交申请',
        time: nowStr,
        opinion: reason || '发起流程废止审批申请',
      },
      {
        stepName: '部门流程负责人审批',
        role: '业务部门总监',
        operator: '业务总监 (李维)',
        action: '待审批',
        time: '',
        opinion: '',
      },
      {
        stepName: '流程运营合规复核',
        role: '流程合规经理',
        operator: '合规专家 (王志敏)',
        action: '待审核',
        time: '',
        opinion: '',
      },
      {
        stepName: '集团流程管理员确认并归档',
        role: '集团流程管理部',
        operator: '集团流程管理员',
        action: '待归档确认',
        time: '',
        opinion: '',
      },
    ],
  };

  flowRepealRecords.unshift(newRec);
  res.json({ status: 1, data: newRec, list: flowRepealRecords, info: 'ok' });
});

app.post('/api/flow/repeal/approveStep', (req, res) => {
  const { id, action, opinion, operator } = req.body || {};
  const target = flowRepealRecords.find((r) => r.id === id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到废止申请记录' });

  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const targetFlow = flows.find((f) => f.id === target.modelId);

  if (action === 'reject') {
    target.stage = '已驳回';
    target.status = '已驳回';
    if (!target.approvalLogs) target.approvalLogs = [];
    target.approvalLogs.push({
      stepName: '审批驳回',
      role: '审批责任人',
      operator: operator || currentActiveUser?.userName || '审批人员',
      action: '已驳回',
      time: nowStr,
      opinion: opinion || '不满足废止条件，予以驳回',
    });
    if (targetFlow) {
      targetFlow.repealApplyStatus = '已驳回';
    }
    return res.json({ status: 1, data: target, list: flowRepealRecords, info: '已驳回废止申请' });
  }

  if (target.stage === '待部门审批' || target.status === '待部门审批') {
    target.stage = '待合规复核';
    target.status = '待合规复核';
    const logItem = (target.approvalLogs || []).find((l: any) => l.stepName === '部门流程负责人审批');
    if (logItem) {
      logItem.action = '审批通过';
      logItem.time = nowStr;
      logItem.operator = operator || logItem.operator;
      logItem.opinion = opinion || '同意建议废止，业务衔接方案合理。';
    }
  } else if (target.stage === '待合规复核' || target.status === '待合规复核') {
    target.stage = '待集团流程管理员确认归档';
    target.status = '待集团流程管理员确认归档';
    const logItem = (target.approvalLogs || []).find((l: any) => l.stepName === '流程运营合规复核');
    if (logItem) {
      logItem.action = '审核通过';
      logItem.time = nowStr;
      logItem.operator = operator || logItem.operator;
      logItem.opinion = opinion || '制度与合规影响评估完成，准予进入集团归档阶段。';
    }
  }

  res.json({ status: 1, data: target, list: flowRepealRecords, info: '审批已通过并流转下一节点' });
});

app.post('/api/flow/repeal/confirmArchive', (req, res) => {
  const { id, opinion, operator } = req.body || {};
  const target = flowRepealRecords.find((r) => r.id === id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到废止申请记录' });

  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const targetFlow = flows.find((f) => f.id === target.modelId);
  const archiveNo = 'ARC-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900);

  target.stage = '已废止归档';
  target.status = '已废止归档';
  target.archiveNo = archiveNo;
  target.archiveUser = operator || currentActiveUser?.userName || '集团流程管理员';
  target.archiveTime = nowStr;
  target.archiveOpinion = opinion || '经集团流程管理部最终核验，所有关联业务已顺利割接，正式废止并归档入库。';

  const logItem = (target.approvalLogs || []).find((l: any) => l.stepName === '集团流程管理员确认并归档');
  if (logItem) {
    logItem.action = '已确认并归档';
    logItem.time = nowStr;
    logItem.operator = target.archiveUser;
    logItem.opinion = target.archiveOpinion;
  }

  if (targetFlow) {
    targetFlow.status = 'repealed';
    targetFlow.repealApplyStatus = '已废止归档';
    targetFlow.repealedTime = nowStr;
    targetFlow.repealedBy = target.archiveUser;
    targetFlow.archiveNo = archiveNo;
  }

  res.json({ status: 1, data: target, list: flowRepealRecords, info: '流程已完成集团确认并归档入库' });
});

app.post('/api/flow/repeal/restore', (req, res) => {
  const { id, modelId, targetParentId, restoreStatus, restoreReason, operator } = req.body || {};
  const repealRecord = flowRepealRecords.find((r) => r.id === id || r.modelId === modelId);
  const targetFlow = flows.find((f) => f.id === (modelId || repealRecord?.modelId));

  if (!targetFlow) {
    return res.status(404).json({ status: 0, info: '未找到对应业务流程数据' });
  }

  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

  targetFlow.status = restoreStatus || 'published';
  targetFlow.repealApplyStatus = '';
  delete targetFlow.repealedTime;
  delete targetFlow.repealedBy;
  targetFlow.restoredTime = nowStr;
  targetFlow.restoredBy = operator || currentActiveUser?.userName || '集团流程管理员';
  targetFlow.restoreReason = restoreReason || '业务重启恢复启用';

  if (targetParentId) {
    targetFlow.parentId = targetParentId;
    const parentArch = archTypes.find((a) => a.id === targetParentId);
    if (parentArch) {
      targetFlow.archName = parentArch.label;
    }
  }

  if (repealRecord) {
    repealRecord.status = '已还原';
    repealRecord.stage = '已还原';
    if (!repealRecord.restoreLogs) repealRecord.restoreLogs = [];
    repealRecord.restoreLogs.unshift({
      time: nowStr,
      operator: targetFlow.restoredBy,
      targetArch: targetFlow.archName,
      restoreStatus: targetFlow.status,
      reason: restoreReason || '因业务需要重新启用并还原入库',
    });
  }

  res.json({ status: 1, data: targetFlow, repealRecord, info: '流程已成功还原' });
});

app.post('/api/flow/repeal/action', (req, res) => {
  const { id, action } = req.body || {};
  const target = flowRepealRecords.find((r) => r.id === id);
  if (target && action === 'approve') {
    target.status = '已废止归档';
    target.stage = '已废止归档';
    const flowItem = flows.find((f) => f.id === target.modelId);
    if (flowItem) {
      flowItem.status = 'repealed';
      flowItem.repealApplyStatus = '已废止归档';
    }
  }
  res.json({ status: 1, data: target, list: flowRepealRecords, info: 'ok' });
});

app.get('/api/dict/bundle', (_req, res) => {
  const terms = new Map<string, any>();
  for (const term of (dictBundle.terms || [])) terms.set(String(term.id), term);
  for (const term of (flowTerms || [])) {
    const normalized = { id: String(term.id), termId: term.id, name: term.name, label: term.name, category: term.category, desc: term.content, content: term.content };
    if (!terms.has(String(normalized.id))) terms.set(String(normalized.id), normalized);
  }
  res.json({ status: 1, data: { ...dictBundle, terms: Array.from(terms.values()) }, info: 'ok' });
});

app.post('/api/dict/item', (req, res) => {
  const { itemType, action, item, id } = req.body || {};
  const list = itemType === 'risk' ? dictBundle.risk : dictBundle.sysDoc;
  if (action === 'create' && item) {
    const newItem = {
      ...item,
      id: `${itemType || 'doc'}_${randomUUID()}`,
      validityPeriod: item.validityPeriod || '',
      publishTime: item.publishTime || new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    list.unshift(newItem);
    return res.json({ status: 1, data: newItem, bundle: dictBundle, info: 'ok' });
  }
  if (action === 'update' && item && item.id) {
    const idx = list.findIndex((x: any) => x.id === item.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
      return res.json({ status: 1, data: list[idx], bundle: dictBundle, info: 'ok' });
    }
  }
  if (action === 'delete' && id) {
    const idx = list.findIndex((x: any) => x.id === id);
    if (idx >= 0) {
      const removed = list.splice(idx, 1);
      return res.json({ status: 1, data: removed[0], bundle: dictBundle, info: 'ok' });
    }
  }
  if (action === 'approve' && id) {
    const target = list.find((x: any) => x.id === id);
    if (target) target.status = 'approved';
    return res.json({ status: 1, data: target, bundle: dictBundle, info: 'ok' });
  }
  res.json({ status: 1, bundle: dictBundle, info: 'ok' });
});

app.get('/api/execute/tasks', (_req, res) => {
  res.json({ status: 1, data: flowProcessTasks, users: systemUsers, info: 'ok' });
});

app.delete('/api/execute/tasks/:id', (req, res) => {
  const idx = flowProcessTasks.findIndex((t) => t.id === req.params.id);
  if (idx !== -1) {
    flowProcessTasks.splice(idx, 1);
  }
  res.json({ status: 1, list: flowProcessTasks, info: '删除成功' });
});

app.post('/api/execute/tasks/batch-assign', (req, res) => {
  const { taskIds = [], assignee = '', taskDesc = '' } = req.body || {};
  flowProcessTasks.forEach((t) => {
    if (taskIds.includes(t.id)) {
      if (assignee) t.assignee = assignee;
      if (taskDesc) t.taskDesc = taskDesc;
    }
  });
  res.json({ status: 1, list: flowProcessTasks, info: '批量指派成功' });
});

app.post('/api/execute/tasks/batch-delete', (req, res) => {
  const { taskIds = [] } = req.body || {};
  for (let i = flowProcessTasks.length - 1; i >= 0; i--) {
    if (taskIds.includes(flowProcessTasks[i].id)) {
      flowProcessTasks.splice(i, 1);
    }
  }
  res.json({ status: 1, list: flowProcessTasks, info: '批量删除成功' });
});

app.get('/api/flowdoc/manuals', (req, res) => {
  const { manualName, manualNo, archived } = req.query || {};
  let list = dutyManuals;
  if (archived === 'true') {
    list = list.filter((m) => m.archived);
  } else if (archived === 'false') {
    list = list.filter((m) => !m.archived);
  }
  if (manualName && typeof manualName === 'string' && manualName.trim()) {
    const q = manualName.trim().toLowerCase();
    list = list.filter((m) => (m.manualName || '').toLowerCase().includes(q));
  }
  if (manualNo && typeof manualNo === 'string' && manualNo.trim()) {
    const q = manualNo.trim().toLowerCase();
    list = list.filter((m) => (m.manualNo || '').toLowerCase().includes(q));
  }
  res.json({ status: 1, data: list, total: list.length, info: 'ok' });
});

app.post('/api/flowdoc/manuals', (req, res) => {
  const { manualNo, manualName, viewPermissions, attachment, description } = req.body || {};
  if (!manualNo?.trim() || !manualName?.trim()) {
    return res.status(400).json({ status: 0, info: '手册编号和名称不能为空' });
  }
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const newManual = {
    id: 'manual_' + randomUUID(),
    manualNo: manualNo.trim(),
    manualName: manualName.trim(),
    attachment: attachment || '',
    categoryCount: 0,
    publishedCount: 0,
    totalCount: 0,
    viewPermissions: Array.isArray(viewPermissions) && viewPermissions.length > 0
      ? viewPermissions
      : ['系统管理部', '流程管理部', '权责管理部', '知识管理部'],
    status: '草稿',
    archived: false,
    description: description || '',
    creator: '流程管理员',
    createTime: now,
    updater: '流程管理员',
    updateTime: now,
    categoryTree: [
      {
        id: 'cat_' + randomUUID() + '_root',
        name: manualName.trim(),
        orderNum: 1,
        children: [
          { id: 'cat_' + randomUUID() + '_sub', name: '常规权责分类', orderNum: 1 },
        ],
      },
    ],
    items: [],
  };
  dutyManuals.unshift(newManual);
  res.json({ status: 1, data: newManual, list: dutyManuals, info: '新建权责手册成功' });
});

app.get('/api/flowdoc/manuals/:id/detail', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '未找到该权责手册' });
  }
  res.json({
    status: 1,
    data: {
      manual: target,
      categoryTree: target.categoryTree || [],
      items: target.items || [],
    },
    info: 'ok',
  });
});

app.put('/api/flowdoc/manuals/:id', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '未找到该权责手册' });
  }
  const { manualNo, manualName, viewPermissions, attachment, description, status } = req.body || {};
  if (manualNo) target.manualNo = manualNo.trim();
  if (manualName) target.manualName = manualName.trim();
  if (viewPermissions) target.viewPermissions = viewPermissions;
  if (attachment !== undefined) target.attachment = attachment;
  if (description !== undefined) target.description = description;
  if (status) target.status = status;
  target.updater = '流程管理员';
  target.updateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  recalculateManualCounts(target);
  res.json({ status: 1, data: target, list: dutyManuals, info: '更新权责手册成功' });
});

app.delete('/api/flowdoc/manuals/:id', (req, res) => {
  const idx = dutyManuals.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ status: 0, info: '未找到该权责手册' });
  }
  dutyManuals.splice(idx, 1);
  res.json({ status: 1, info: '删除权责手册成功' });
});

app.post('/api/flowdoc/manuals/:id/copy', (req, res) => {
  const source = dutyManuals.find((m) => m.id === req.params.id);
  if (!source) {
    return res.status(404).json({ status: 0, info: '未找到该权责手册' });
  }
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const cloned = JSON.parse(JSON.stringify(source));
  cloned.id = 'manual_' + randomUUID();
  cloned.manualNo = `${source.manualNo}_COPY`;
  cloned.manualName = `${source.manualName}(复制)`;
  cloned.creator = '流程管理员';
  cloned.createTime = now;
  cloned.updater = '流程管理员';
  cloned.updateTime = now;
  cloned.status = '草稿';
  cloned.archived = false;
  recalculateManualCounts(cloned);
  dutyManuals.unshift(cloned);
  res.json({ status: 1, data: cloned, list: dutyManuals, info: '复制权责手册成功' });
});

app.post('/api/flowdoc/manuals/:id/archive', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '未找到该权责手册' });
  }
  target.archived = !target.archived;
  target.status = target.archived ? '已归档' : '已发布';
  target.updateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  res.json({
    status: 1,
    data: target,
    list: dutyManuals,
    info: target.archived ? '已成功归档至归档手册' : '已恢复至权责建设列表',
  });
});

function findCategoryInTree(tree: any[], id: string): any | null {
  if (!Array.isArray(tree)) return null;
  for (const node of tree) {
    if (node.id === id) return node;
    if (Array.isArray(node.children) && node.children.length > 0) {
      const found = findCategoryInTree(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function removeCategoryFromTree(tree: any[], id: string): any | null {
  if (!Array.isArray(tree)) return null;
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === id) {
      return tree.splice(i, 1)[0];
    }
    if (Array.isArray(tree[i].children) && tree[i].children.length > 0) {
      const removed = removeCategoryFromTree(tree[i].children, id);
      if (removed) return removed;
    }
  }
  return null;
}

function isDescendantCategory(node: any, targetId: string): boolean {
  if (!node || !Array.isArray(node.children)) return false;
  for (const child of node.children) {
    if (child.id === targetId) return true;
    if (isDescendantCategory(child, targetId)) return true;
  }
  return false;
}

app.post('/api/flowdoc/manuals/:id/categories', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });
  const { name, parentId } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ status: 0, info: '分类名称不能为空' });

  if (!Array.isArray(target.categoryTree)) target.categoryTree = [];
  const targetParentId = parentId ? String(parentId).trim() : null;
  const newCat: any = {
    id: 'cat_' + randomUUID(),
    name: name.trim(),
    parentId: targetParentId,
    orderNum: 99,
    children: [],
  };

  if (!targetParentId) {
    target.categoryTree.push(newCat);
  } else {
    const parent = findCategoryInTree(target.categoryTree, targetParentId);
    if (parent) {
      if (!Array.isArray(parent.children)) parent.children = [];
      parent.children.push(newCat);
    } else {
      newCat.parentId = null;
      target.categoryTree.push(newCat);
    }
  }
  recalculateManualCounts(target);
  res.json({ status: 1, data: target.categoryTree, info: '创建分类成功' });
});

app.put('/api/flowdoc/manuals/:id/categories/:catId', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });
  const { name, parentId } = req.body || {};
  if (name !== undefined && !name.trim()) return res.status(400).json({ status: 0, info: '分类名称不能为空' });

  if (!Array.isArray(target.categoryTree)) target.categoryTree = [];
  const existingNode = findCategoryInTree(target.categoryTree, req.params.catId);
  if (!existingNode) return res.status(404).json({ status: 0, info: '未找到该分类' });

  if (name && name.trim()) {
    existingNode.name = name.trim();
  }

  // Support changing directory / hierarchy parent
  if (parentId !== undefined) {
    const targetParentId = parentId ? String(parentId).trim() : null;
    const currentParentId = existingNode.parentId || null;

    if (targetParentId !== currentParentId) {
      if (targetParentId === req.params.catId) {
        return res.status(400).json({ status: 0, info: '不能选择自身作为上级目录' });
      }
      if (targetParentId && isDescendantCategory(existingNode, targetParentId)) {
        return res.status(400).json({ status: 0, info: '不能选择下级子分类作为上级目录' });
      }

      const detachedNode = removeCategoryFromTree(target.categoryTree, req.params.catId);
      if (detachedNode) {
        detachedNode.parentId = targetParentId;
        if (!targetParentId) {
          target.categoryTree.push(detachedNode);
        } else {
          const newParent = findCategoryInTree(target.categoryTree, targetParentId);
          if (newParent) {
            if (!Array.isArray(newParent.children)) newParent.children = [];
            newParent.children.push(detachedNode);
          } else {
            detachedNode.parentId = null;
            target.categoryTree.push(detachedNode);
          }
        }
      }
    }
  }

  recalculateManualCounts(target);
  res.json({ status: 1, data: target.categoryTree, info: '更新分类成功' });
});

app.delete('/api/flowdoc/manuals/:id/categories/:catId', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });

  removeCategoryFromTree(target.categoryTree || [], req.params.catId);
  recalculateManualCounts(target);
  res.json({ status: 1, data: target.categoryTree, info: '删除分类成功' });
});

app.post('/api/flowdoc/manuals/:id/items', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });
  if (!Array.isArray(target.items)) target.items = [];

  const { categoryId, categoryName, dutyNo, dutyName, scenarioText, scenarios, primaryRole, status } = req.body || {};
  if (!dutyName?.trim()) return res.status(400).json({ status: 0, info: '权责名称不能为空' });

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const newItem = {
    id: 'duty_' + randomUUID(),
    manualId: target.id,
    manualName: target.manualName,
    categoryId: categoryId || 'cat_fin',
    categoryName: categoryName || '财务管理中心',
    dutyNo: dutyNo?.trim() || 'DUTY-' + randomUUID(),
    dutyName: dutyName.trim(),
    scenarioText: scenarioText || '',
    scenarios: Array.isArray(scenarios) ? scenarios : [],
    primaryRole: primaryRole || '经办人',
    status: status || '草稿',
    updateTime: now,
  };
  target.items.unshift(newItem);
  recalculateManualCounts(target);
  res.json({ status: 1, data: newItem, list: target.items, info: '新增权责事项成功' });
});

app.put('/api/flowdoc/manuals/:id/items/:itemId', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });
  const item = target.items?.find((i: any) => i.id === req.params.itemId);
  if (!item) return res.status(404).json({ status: 0, info: '未找到该权责事项' });

  Object.assign(item, req.body);
  item.updateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  recalculateManualCounts(target);
  res.json({ status: 1, data: item, list: target.items, info: '更新权责事项成功' });
});

app.delete('/api/flowdoc/manuals/:id/items/:itemId', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });
  const idx = target.items?.findIndex((i: any) => i.id === req.params.itemId);
  if (idx === -1 || idx === undefined) return res.status(404).json({ status: 0, info: '未找到该权责事项' });

  target.items.splice(idx, 1);
  recalculateManualCounts(target);
  res.json({ status: 1, list: target.items, info: '删除权责事项成功' });
});

app.post('/api/flowdoc/manuals/:id/items/:itemId/copy', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });
  const item = target.items?.find((i: any) => i.id === req.params.itemId);
  if (!item) return res.status(404).json({ status: 0, info: '未找到该权责事项' });

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const cloned = JSON.parse(JSON.stringify(item));
  cloned.id = 'duty_' + randomUUID();
  cloned.dutyNo = `${item.dutyNo}_COPY`;
  cloned.dutyName = `${item.dutyName}(复制)`;
  cloned.status = '草稿';
  cloned.updateTime = now;
  target.items.unshift(cloned);
  recalculateManualCounts(target);
  res.json({ status: 1, data: cloned, list: target.items, info: '复制权责事项成功' });
});

app.post('/api/flowdoc/manuals/:id/items/batch-publish', (req, res) => {
  const target = dutyManuals.find((m) => m.id === req.params.id);
  if (!target) return res.status(404).json({ status: 0, info: '未找到该手册' });
  const { itemIds = [] } = req.body || {};
  target.items?.forEach((i: any) => {
    if (itemIds.length === 0 || itemIds.includes(i.id)) {
      i.status = '已发布';
      i.updateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
  });
  recalculateManualCounts(target);
  res.json({ status: 1, list: target.items, info: '批量发布成功' });
});

app.post('/api/flowdoc/audit/submit', (req, res) => {
  const { manualId, itemIds = [], levels = [], urgency = '普通', remark = '', submitter = '流程管理员' } = req.body || {};
  const manual = dutyManuals.find((m) => m.id === manualId);
  if (!manual) return res.status(404).json({ status: 0, info: '未找到指定权责手册' });
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ status: 0, info: '请选择需要送审的权责事项' });
  }
  if (!Array.isArray(levels) || levels.length === 0) {
    return res.status(400).json({ status: 0, info: '请至少配置一级审批人' });
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const createdTasks: any[] = [];

  // Format levels with status
  const formattedLevels = levels.map((lvl: any, idx: number) => ({
    level: idx + 1,
    levelName: lvl.levelName || `第${idx + 1}级: 审批`,
    roleName: lvl.roleName || '审批人',
    approverName: lvl.approverName || '张明',
    deptName: lvl.deptName || '权责管理部',
    status: idx === 0 ? 'pending' : 'waiting',
  }));

  itemIds.forEach((itemId: string) => {
    const item = manual.items?.find((i: any) => i.id === itemId);
    if (!item) return;

    // Update item
    item.status = '待审核';
    item.effectiveApproval = `审批中 (${formattedLevels[0].levelName} · ${formattedLevels[0].approverName})`;
    item.submitTime = now;
    item.updateTime = now;

    const taskId = `SH-${randomUUID()}`;
    const task = {
      id: taskId,
      manualId: manual.id,
      manualName: manual.manualName,
      dutyItemId: item.id,
      dutyNo: item.dutyNo,
      dutyName: item.dutyName,
      categoryName: item.categoryName,
      scope: item.scope || '全集团及下属子公司',
      scenarioText: item.scenarioText || '',
      submitter,
      submitterId:currentActiveUser.id,
      submitTime: now,
      urgency,
      remark,
      currentLevelIndex: 0,
      currentApprover: formattedLevels[0].approverName,
      currentLevelName: formattedLevels[0].levelName,
      status: '待审核',
      levels: JSON.parse(JSON.stringify(formattedLevels)),
      history: [
        {
          time: now,
          operator: submitter,
          action: '提交送审',
          nodeName: '起草送审',
          opinion: remark || '提交权责事项送审。',
        },
      ],
    };

    dutyAuditTasks.unshift(task);
    createdTasks.push(task);
  });

  recalculateManualCounts(manual);

  res.json({
    status: 1,
    info: `已成功将 ${createdTasks.length} 项权责提交至多层级审核，已推送至审批人待办事项`,
    createdTasks,
    allTasks: dutyAuditTasks,
  });
});

app.get('/api/flowdoc/audit/tasks', (req, res) => {
  const { status, keyword, manualId, urgency } = req.query as Record<string, string>;
  let list = [...dutyAuditTasks];

  if (status && status !== '全部') {
    list = list.filter((t) => t.status === status);
  }
  if (manualId) {
    list = list.filter((t) => t.manualId === manualId);
  }
  if (urgency && urgency !== '全部') {
    list = list.filter((t) => t.urgency === urgency);
  }
  if (keyword) {
    const k = keyword.trim().toLowerCase();
    list = list.filter(
      (t) =>
        t.dutyName?.toLowerCase().includes(k) ||
        t.dutyNo?.toLowerCase().includes(k) ||
        t.id?.toLowerCase().includes(k) ||
        t.manualName?.toLowerCase().includes(k) ||
        t.currentApprover?.toLowerCase().includes(k)
    );
  }

  // Summary counts
  const stats = {
    total: dutyAuditTasks.length,
    pending: dutyAuditTasks.filter((t) => t.status === '待审核').length,
    auditing: dutyAuditTasks.filter((t) => t.status === '审核中').length,
    approved: dutyAuditTasks.filter((t) => t.status === '已通过').length,
    rejected: dutyAuditTasks.filter((t) => t.status === '已驳回').length,
  };

  res.json({ status: 1, data: list, stats, info: 'ok' });
});

app.post('/api/flowdoc/audit/tasks/:id/approve', (req, res) => {
  const task = dutyAuditTasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ status: 0, info: '未找到审核任务' });
  const { opinion = '同意，符合权责矩阵规程准予通过。', operator = task.currentApprover || '审批人' } = req.body || {};
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const currentLvl = task.levels[task.currentLevelIndex];
  if (currentLvl) {
    currentLvl.status = 'approved';
    currentLvl.opinion = opinion;
    currentLvl.operateTime = now;
  }

  task.history.push({
    time: now,
    operator,
    action: '审核通过',
    nodeName: currentLvl?.levelName || `第${task.currentLevelIndex + 1}级审批`,
    opinion,
  });

  const dutyItem = findDutyItem(task.manualId, task.dutyItemId);

  // Check if there is next level
  if (task.currentLevelIndex < task.levels.length - 1) {
    task.currentLevelIndex += 1;
    const nextLvl = task.levels[task.currentLevelIndex];
    nextLvl.status = 'pending';
    task.currentApprover = nextLvl.approverName;
    task.currentLevelName = nextLvl.levelName;
    task.status = '审核中';

    if (dutyItem) {
      dutyItem.status = '待审核';
      dutyItem.effectiveApproval = `审批中 (${nextLvl.levelName} · ${nextLvl.approverName})`;
      dutyItem.updateTime = now;
    }
  } else {
    // Final level reached!
    task.status = '已通过';
    if (dutyItem) {
      dutyItem.status = '已发布';
      dutyItem.effectiveApproval = `已审批通过 (${currentLvl?.approverName || '终审批准'})`;
      dutyItem.updateTime = now;
      const manual = dutyManuals.find((m) => m.id === task.manualId);
      if (manual) recalculateManualCounts(manual);
    }
  }

  res.json({ status: 1, data: task, allTasks: dutyAuditTasks, info: '审核通过操作成功' });
});

app.post('/api/flowdoc/audit/tasks/:id/reject', (req, res) => {
  const task = dutyAuditTasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ status: 0, info: '未找到审核任务' });
  const { opinion = '权责配置需进一步核定，予以驳回。', operator = task.currentApprover || '审批人' } = req.body || {};
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const currentLvl = task.levels[task.currentLevelIndex];
  if (currentLvl) {
    currentLvl.status = 'rejected';
    currentLvl.opinion = opinion;
    currentLvl.operateTime = now;
  }

  task.status = '已驳回';
  task.history.push({
    time: now,
    operator,
    action: '审核驳回',
    nodeName: currentLvl?.levelName || `第${task.currentLevelIndex + 1}级审批`,
    opinion,
  });

  const dutyItem = findDutyItem(task.manualId, task.dutyItemId);
  if (dutyItem) {
    dutyItem.status = '已驳回';
    dutyItem.effectiveApproval = `已驳回 (${opinion})`;
    dutyItem.updateTime = now;
    const manual = dutyManuals.find((m) => m.id === task.manualId);
    if (manual) recalculateManualCounts(manual);
  }

  res.json({ status: 1, data: task, allTasks: dutyAuditTasks, info: '已驳回该审核任务' });
});

app.post('/api/flowdoc/audit/tasks/:id/transfer', (req, res) => {
  const task = dutyAuditTasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ status: 0, info: '未找到审核任务' });
  const { targetApprover, targetDept, reason = '由原审批人转办', operator = task.currentApprover } = req.body || {};
  if (!targetApprover) return res.status(400).json({ status: 0, info: '请选择转办人员' });

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const currentLvl = task.levels[task.currentLevelIndex];
  if (currentLvl) {
    const oldApprover = currentLvl.approverName;
    currentLvl.approverName = targetApprover;
    if (targetDept) currentLvl.deptName = targetDept;
    task.currentApprover = targetApprover;

    task.history.push({
      time: now,
      operator,
      action: '转办审批',
      nodeName: currentLvl.levelName,
      opinion: `将审批转办给【${targetApprover}】。原因：${reason}`,
    });

    const dutyItem = findDutyItem(task.manualId, task.dutyItemId);
    if (dutyItem) {
      dutyItem.effectiveApproval = `审批中 (${currentLvl.levelName} · 转办给${targetApprover})`;
      dutyItem.updateTime = now;
    }
  }

  res.json({ status: 1, data: task, allTasks: dutyAuditTasks, info: `已成功转办给【${targetApprover}】` });
});

app.post('/api/flowdoc/audit/tasks/batch-approve', (req, res) => {
  const { taskIds = [], opinion = '批量通过审批。', operator = '审批人' } = req.body || {};
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  taskIds.forEach((id: string) => {
    const task = dutyAuditTasks.find((t) => t.id === id);
    if (!task || task.status === '已通过' || task.status === '已驳回') return;

    const currentLvl = task.levels[task.currentLevelIndex];
    if (currentLvl) {
      currentLvl.status = 'approved';
      currentLvl.opinion = opinion;
      currentLvl.operateTime = now;
    }

    task.history.push({
      time: now,
      operator,
      action: '审核通过',
      nodeName: currentLvl?.levelName || '批量审批',
      opinion,
    });

    const dutyItem = findDutyItem(task.manualId, task.dutyItemId);
    if (task.currentLevelIndex < task.levels.length - 1) {
      task.currentLevelIndex += 1;
      const nextLvl = task.levels[task.currentLevelIndex];
      nextLvl.status = 'pending';
      task.currentApprover = nextLvl.approverName;
      task.currentLevelName = nextLvl.levelName;
      task.status = '审核中';
      if (dutyItem) {
        dutyItem.status = '待审核';
        dutyItem.effectiveApproval = `审批中 (${nextLvl.levelName} · ${nextLvl.approverName})`;
      }
    } else {
      task.status = '已通过';
      if (dutyItem) {
        dutyItem.status = '已发布';
        dutyItem.effectiveApproval = `已审批通过 (批量终审批准)`;
        const manual = dutyManuals.find((m) => m.id === task.manualId);
        if (manual) recalculateManualCounts(manual);
      }
    }
  });

  res.json({ status: 1, allTasks: dutyAuditTasks, info: `已批量通过 ${taskIds.length} 项审核任务` });
});

app.post('/api/flowdoc/audit/tasks/batch-reject', (req, res) => {
  const { taskIds = [], opinion = '批量驳回审核申请。', operator = '审批人' } = req.body || {};
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  taskIds.forEach((id: string) => {
    const task = dutyAuditTasks.find((t) => t.id === id);
    if (!task || task.status === '已通过' || task.status === '已驳回') return;

    const currentLvl = task.levels[task.currentLevelIndex];
    if (currentLvl) {
      currentLvl.status = 'rejected';
      currentLvl.opinion = opinion;
      currentLvl.operateTime = now;
    }
    task.status = '已驳回';
    task.history.push({
      time: now,
      operator,
      action: '审核驳回',
      nodeName: currentLvl?.levelName || '批量驳回',
      opinion,
    });

    const dutyItem = findDutyItem(task.manualId, task.dutyItemId);
    if (dutyItem) {
      dutyItem.status = '已驳回';
      dutyItem.effectiveApproval = `已驳回 (${opinion})`;
      const manual = dutyManuals.find((m) => m.id === task.manualId);
      if (manual) recalculateManualCounts(manual);
    }
  });

  res.json({ status: 1, allTasks: dutyAuditTasks, info: `已批量驳回 ${taskIds.length} 项审核任务` });
});

app.get('/api/flowdoc/duties', (_req, res) => {
  res.json({ status: 1, data: dutyTables, categories: dutyCategories, collabDepts: DEFAULT_COLLAB_DEPTS, info: 'ok' });
});

app.put('/api/flowdoc/duties/:id/config', (req, res) => {
  const target = dutyTables.find((d) => d.id === req.params.id);
  if (target) Object.assign(target, req.body);
  res.json({ status: 1, data: target, list: dutyTables, info: 'ok' });
});

app.get('/api/org/bundle', (_req, res) => {
  res.json({
    status: 1,
    data: {
      depts: orgDepts,
      users: orgUsers,
      roles: orgRoles,
      positions: orgPositions,
      jobTitles: orgJobTitles,
    },
    info: 'ok',
  });
});

app.post('/api/org/depts', (req, res) => {
  const { deptName, deptCode, parentDeptName, parentDeptCode, leader, phone } = req.body || {};
  if (!deptName || !deptName.trim()) {
    return res.status(400).json({ status: 0, info: '部门名称不能为空' });
  }
  const newDept = {
    id: 'dept_' + randomUUID(),
    deptName: deptName.trim(),
    deptCode: deptCode ? deptCode.trim() : randomUUID(),
    parentDeptName: parentDeptName || '',
    parentDeptCode: parentDeptCode || '',
    leader: leader || '',
    phone: phone || '',
    status: '0',
    orderNum: orgDepts.length + 1,
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };
  orgDepts.push(newDept);
  res.json({ status: 1, data: newDept, list: orgDepts, info: '新增部门成功' });
});

app.put('/api/org/depts/:id', (req, res) => {
  const target = orgDepts.find((d) => d.id === req.params.id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '部门不存在' });
  }
  Object.assign(target, req.body);
  res.json({ status: 1, data: target, list: orgDepts, info: '修改部门信息成功' });
});

app.delete('/api/org/depts/:id', (req, res) => {
  const targetIndex = orgDepts.findIndex((d) => d.id === req.params.id);
  if (targetIndex === -1) {
    return res.status(404).json({ status: 0, info: '部门不存在' });
  }
  const removed = orgDepts.splice(targetIndex, 1)[0];
  res.json({ status: 1, data: removed, list: orgDepts, info: '删除部门成功' });
});

app.post('/api/org/depts/batch-delete', (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ status: 0, info: '请选择需要删除的部门' });
  }
  orgDepts = orgDepts.filter((d) => !ids.includes(d.id));
  res.json({ status: 1, list: orgDepts, info: `成功批量删除 ${ids.length} 个部门` });
});

app.post('/api/org/depts/import', (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ status: 0, info: '未导入任何有效部门数据' });
  }
  items.forEach((item: any, idx: number) => {
    if (item.deptName) {
      orgDepts.push({
        id: 'dept_' + randomUUID(),
        deptName: item.deptName.trim(),
        deptCode: item.deptCode || `IMP_${idx + 1}`,
        parentDeptName: item.parentDeptName || '',
        parentDeptCode: item.parentDeptCode || '',
        leader: item.leader || '',
        phone: item.phone || '',
        status: '0',
        orderNum: orgDepts.length + 1,
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
  });
  res.json({ status: 1, list: orgDepts, info: `成功导入 ${items.length} 个部门组织` });
});

app.get('/api/org/users', (req, res) => {
  const { userName, phonenumber, status, deptId, beginTime, endTime, pageNum = 1, pageSize = 10 } = req.query as any;
  let result = [...orgUsers];

  if (userName && String(userName).trim()) {
    const q = String(userName).trim().toLowerCase();
    result = result.filter((u) =>
      (u.userName && u.userName.toLowerCase().includes(q)) ||
      (u.nickName && u.nickName.toLowerCase().includes(q)) ||
      (u.empNo && u.empNo.toLowerCase().includes(q))
    );
  }

  if (phonenumber && String(phonenumber).trim()) {
    const p = String(phonenumber).trim();
    result = result.filter((u) => u.phonenumber && u.phonenumber.includes(p));
  }

  if (status !== undefined && status !== '') {
    result = result.filter((u) => String(u.status) === String(status));
  }

  if (deptId && String(deptId).trim()) {
    const dId = String(deptId).trim();
    // Also include child departments if matches
    const selectedDept = orgDepts.find((d) => d.id === dId);
    if (selectedDept) {
      const targetDeptCodes = [selectedDept.deptCode];
      orgDepts.forEach((d) => {
        if (d.parentDeptCode === selectedDept.deptCode) {
          targetDeptCodes.push(d.deptCode);
        }
      });
      result = result.filter((u) => u.deptId === dId || targetDeptCodes.includes(u.deptCode));
    } else {
      result = result.filter((u) => u.deptId === dId);
    }
  }

  if (beginTime) {
    result = result.filter((u) => u.createTime >= String(beginTime));
  }
  if (endTime) {
    result = result.filter((u) => u.createTime <= String(endTime));
  }

  const total = result.length;
  const pNum = Math.max(1, parseInt(pageNum, 10) || 1);
  const pSize = Math.max(1, parseInt(pageSize, 10) || 10);
  const startIdx = (pNum - 1) * pSize;
  const rows = result.slice(startIdx, startIdx + pSize);

  res.json({
    status: 1,
    total,
    rows,
    list: orgUsers,
    info: 'ok',
  });
});

app.post('/api/org/users', (req, res) => {
  const { userName, nickName, deptId, deptName, deptCode, positionName, roleNames, phonenumber, email, sex, status, password, remark } = req.body || {};
  if (!userName || !userName.trim()) {
    return res.status(400).json({ status: 0, info: '用户登录名称不能为空' });
  }
  if (!nickName || !nickName.trim()) {
    return res.status(400).json({ status: 0, info: '用户昵称/真实姓名不能为空' });
  }
  const exists = orgUsers.some((u) => u.userName.toLowerCase() === userName.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ status: 0, info: '该登录账号已存在，请使用其他用户名' });
  }

  // Lookup department
  let matchedDept = orgDepts.find((d) => d.id === deptId || d.deptName === deptName);
  if (!matchedDept && deptCode) {
    matchedDept = orgDepts.find((d) => d.deptCode === deptCode);
  }

  const maxNo = orgUsers.reduce((max, u) => Math.max(max, u.userNo || 0), 0);
  const newUser = {
    id: 'u_' + randomUUID(),
    userNo: maxNo + 1,
    empNo: 'E00' + (maxNo + 10),
    userName: userName.trim(),
    nickName: nickName.trim(),
    sex: sex || '0',
    deptId: matchedDept ? matchedDept.id : (deptId || ''),
    deptCode: matchedDept ? matchedDept.deptCode : (deptCode || ''),
    deptName: matchedDept ? matchedDept.deptName : (deptName || ''),
    positionName: positionName || '普通员工',
    rankLevel: 'P3',
    roleNames: Array.isArray(roleNames) && roleNames.length > 0 ? roleNames : ['普通员工'],
    phonenumber: phonenumber || '',
    email: email || `${userName.trim()}@dflow.com`,
    status: status !== undefined ? String(status) : '0',
    syncSource: '本地创建',
    ssoBound: false,
    ssoUid: '',
    doaLevel: '业务经办',
    remark: remark || '',
    password: password,
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };

  orgUsers.unshift(newUser);
  res.json({ status: 1, data: newUser, list: orgUsers, info: '新增用户成功' });
});

app.put('/api/org/users/:id', (req, res) => {
  const target = orgUsers.find((u) => u.id === req.params.id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '用户不存在' });
  }

  const { nickName, deptId, deptName, deptCode, positionName, roleNames, phonenumber, email, sex, status, remark } = req.body || {};
  if (nickName) target.nickName = nickName.trim();
  if (sex !== undefined) target.sex = sex;
  if (phonenumber !== undefined) target.phonenumber = phonenumber;
  if (email !== undefined) target.email = email;
  if (status !== undefined) target.status = String(status);
  if (positionName !== undefined) target.positionName = positionName;
  if (Array.isArray(roleNames)) target.roleNames = roleNames;
  if (remark !== undefined) target.remark = remark;

  if (deptId || deptName || deptCode) {
    let matchedDept = orgDepts.find((d) => d.id === deptId || d.deptName === deptName);
    if (!matchedDept && deptCode) {
      matchedDept = orgDepts.find((d) => d.deptCode === deptCode);
    }
    if (matchedDept) {
      target.deptId = matchedDept.id;
      target.deptCode = matchedDept.deptCode;
      target.deptName = matchedDept.deptName;
    }
  }

  res.json({ status: 1, data: target, list: orgUsers, info: '修改用户成功' });
});

app.delete('/api/org/users/:id', (req, res) => {
  const idx = orgUsers.findIndex((u) => u.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ status: 0, info: '用户不存在' });
  }
  const removed = orgUsers.splice(idx, 1)[0];
  res.json({ status: 1, data: removed, list: orgUsers, info: `成功删除用户【${removed.nickName || removed.userName}】` });
});

app.post('/api/org/users/batch-delete', (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ status: 0, info: '请选择需要删除的用户' });
  }
  orgUsers = orgUsers.filter((u) => !ids.includes(u.id));
  res.json({ status: 1, list: orgUsers, info: `成功批量删除 ${ids.length} 个用户` });
});

app.post('/api/org/users/:id/reset-password', (req, res) => {
  const target = orgUsers.find((u) => u.id === req.params.id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '用户不存在' });
  }
  const { newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ status: 0, info: '密码长度至少6位' });
  }
  target.password = newPassword;
  target.passwordResetTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
  res.json({ status: 1, info: `用户【${target.userName}】密码重置成功` });
});

app.put('/api/org/users/:id/change-status', (req, res) => {
  const target = orgUsers.find((u) => u.id === req.params.id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '用户不存在' });
  }
  const { status } = req.body || {};
  target.status = String(status) === '0' ? '0' : '1';
  res.json({ status: 1, data: target, list: orgUsers, info: `用户已${target.status === '0' ? '启用' : '停用'}` });
});

app.post('/api/org/users/import', (req, res) => {
  const { items, updateExisting } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ status: 0, info: '未导入任何有效用户数据' });
  }

  let importedCount = 0;
  let updatedCount = 0;

  items.forEach((item: any) => {
    if (!item.userName && !item.nickName) return;
    const existing = orgUsers.find((u) => u.userName === item.userName);
    if (existing && updateExisting) {
      if (item.nickName) existing.nickName = item.nickName;
      if (item.phonenumber) existing.phonenumber = item.phonenumber;
      if (item.email) existing.email = item.email;
      if (item.deptName) {
        existing.deptName = item.deptName;
        const d = orgDepts.find((dept) => dept.deptName === item.deptName);
        if (d) {
          existing.deptId = d.id;
          existing.deptCode = d.deptCode;
        }
      }
      updatedCount++;
    } else if (!existing) {
      const maxNo = orgUsers.reduce((m, u) => Math.max(m, u.userNo || 0), 0);
      const matchedDept = orgDepts.find((d) => d.deptName === item.deptName || d.deptCode === item.deptCode);
      orgUsers.push({
        id: 'u_' + randomUUID(),
        userNo: maxNo + 1,
        empNo: item.empNo || `E00${maxNo + 10}`,
        userName: item.userName || `user_${maxNo + 1}`,
        nickName: item.nickName || item.userName || `员工${maxNo + 1}`,
        sex: item.sex || '0',
        deptId: matchedDept ? matchedDept.id : '',
        deptCode: matchedDept ? matchedDept.deptCode : '',
        deptName: matchedDept ? matchedDept.deptName : (item.deptName || '系统管理部'),
        positionName: item.positionName || '普通员工',
        rankLevel: item.rankLevel || 'P3',
        roleNames: Array.isArray(item.roleNames) ? item.roleNames : [item.roleNames || '普通员工'],
        phonenumber: item.phonenumber || '',
        email: item.email || `${item.userName || 'user'}@dflow.com`,
        status: item.status || '0',
        syncSource: '批量导入',
        ssoBound: false,
        ssoUid: '',
        doaLevel: '业务经办',
        remark: item.remark || 'Excel导入账号',
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
      importedCount++;
    }
  });

  res.json({
    status: 1,
    list: orgUsers,
    info: `用户导入完成：新增 ${importedCount} 人，更新 ${updatedCount} 人`,
  });
});

app.get('/api/build/roles', (req, res) => {
  const { roleName, roleCode, roleType, category, status, boundPosition, pageNum = 1, pageSize = 10 } = req.query as any;
  let result = [...buildProcessRoles];

  if (roleName && String(roleName).trim()) {
    const q = String(roleName).trim().toLowerCase();
    result = result.filter((r) => r.roleName && r.roleName.toLowerCase().includes(q));
  }

  if (roleCode && String(roleCode).trim()) {
    const q = String(roleCode).trim().toLowerCase();
    result = result.filter((r) => r.roleCode && r.roleCode.toLowerCase().includes(q));
  }

  if (roleType && String(roleType).trim()) {
    const q = String(roleType).trim();
    result = result.filter((r) => r.roleType === q || (r.roleType && r.roleType.includes(q)));
  }

  if (category && String(category).trim()) {
    const q = String(category).trim();
    result = result.filter((r) => r.category === q || (r.category && r.category.includes(q)));
  }

  if (status !== undefined && status !== '') {
    result = result.filter((r) => String(r.status) === String(status));
  }

  if (boundPosition && String(boundPosition).trim()) {
    const q = String(boundPosition).trim();
    result = result.filter((r) => Array.isArray(r.boundPositions) && r.boundPositions.some((p: string) => p.includes(q)));
  }

  // Calculate statistics
  const total = result.length;
  const allTotal = buildProcessRoles.length;
  const rTypeCount = buildProcessRoles.filter((r) => r.roleType.includes('主责')).length;
  const aTypeCount = buildProcessRoles.filter((r) => r.roleType.includes('决策') || r.roleType.includes('委员会')).length;
  const cTypeCount = buildProcessRoles.filter((r) => r.roleType.includes('咨询') || r.roleType.includes('会签')).length;
  const iTypeCount = buildProcessRoles.filter((r) => r.roleType.includes('知会') || r.roleType.includes('抄送')).length;

  const pNum = Math.max(1, parseInt(pageNum, 10) || 1);
  const pSize = Math.max(1, parseInt(pageSize, 10) || 10);
  const start = (pNum - 1) * pSize;
  const pageRows = result.slice(start, start + pSize);

  res.json({
    status: 1,
    total,
    pageNum: pNum,
    pageSize: pSize,
    rows: pageRows,
    stats: {
      allTotal,
      rTypeCount,
      aTypeCount,
      cTypeCount,
      iTypeCount,
    },
    info: 'ok',
  });
});

app.post('/api/build/roles', (req, res) => {
  const {
    roleName,
    roleCode,
    roleType,
    category,
    boundPositions,
    rankRequirement,
    isKcpApprover,
    sort,
    status = '0',
    remark,
  } = req.body || {};

  if (!roleName || !roleName.trim()) {
    return res.status(400).json({ status: 0, info: '角色名称不能为空' });
  }

  const generatedCode =
    roleCode && roleCode.trim()
      ? roleCode.trim()
      : `PR-ROLE-${randomUUID()}`;

  // Duplicate check
  const exists = buildProcessRoles.some(
    (r) => r.roleCode.toLowerCase() === generatedCode.toLowerCase() || r.roleName === roleName.trim()
  );
  if (exists) {
    return res.status(400).json({ status: 0, info: '角色名称或角色编码已存在' });
  }

  const newRole = {
    id: `prole_${randomUUID()}`,
    roleNo: buildProcessRoles.length + 1,
    roleCode: generatedCode,
    roleName: roleName.trim(),
    roleType: roleType || '主责角色 (R)',
    category: category || '02 研发与技术创新',
    boundPositions: Array.isArray(boundPositions) ? boundPositions : [],
    assignedUsers: [],
    boundFlows: [],
    rankRequirement: rankRequirement || 'P5-P7',
    isKcpApprover: Boolean(isKcpApprover),
    sort: sort ? parseInt(sort, 10) : buildProcessRoles.length + 1,
    status: status === '1' ? '1' : '0',
    remark: remark || '自定义流程角色',
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };

  buildProcessRoles.unshift(newRole);

  // Sync to dictBundle.flowRole so Drawio and RACI can pick it up
  if (dictBundle && dictBundle.flowRole) {
    dictBundle.flowRole.push({
      id: newRole.id,
      label: newRole.roleName,
      classId: newRole.roleType.includes('决策') ? 2 : 1,
      postNames: newRole.boundPositions,
      desc: newRole.remark,
    });
  }

  res.json({
    status: 1,
    data: newRole,
    total: buildProcessRoles.length,
    info: '新增流程角色成功',
  });
});

app.put('/api/build/roles/:id', (req, res) => {
  const { id } = req.params;
  const target = buildProcessRoles.find((r) => r.id === id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '角色不存在' });
  }

  const {
    roleName,
    roleCode,
    roleType,
    category,
    boundPositions,
    rankRequirement,
    isKcpApprover,
    sort,
    status,
    remark,
  } = req.body || {};

  if (roleName) target.roleName = roleName.trim();
  if (roleCode) target.roleCode = roleCode.trim();
  if (roleType) target.roleType = roleType;
  if (category) target.category = category;
  if (boundPositions !== undefined) target.boundPositions = Array.isArray(boundPositions) ? boundPositions : [];
  if (rankRequirement !== undefined) target.rankRequirement = rankRequirement;
  if (isKcpApprover !== undefined) target.isKcpApprover = Boolean(isKcpApprover);
  if (sort !== undefined) target.sort = parseInt(sort, 10);
  if (status !== undefined) target.status = String(status);
  if (remark !== undefined) target.remark = remark;

  res.json({
    status: 1,
    data: target,
    info: '更新角色信息成功',
  });
});

app.delete('/api/build/roles/:id', (req, res) => {
  const { id } = req.params;
  const idx = buildProcessRoles.findIndex((r) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ status: 0, info: '未找到待删除的角色' });
  }

  const deleted = buildProcessRoles.splice(idx, 1)[0];
  res.json({
    status: 1,
    info: `已成功删除角色【${deleted.roleName}】`,
    total: buildProcessRoles.length,
  });
});

app.post('/api/build/roles/batch-delete', (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ status: 0, info: '请选择需要删除的角色' });
  }

  const initialLen = buildProcessRoles.length;
  buildProcessRoles = buildProcessRoles.filter((r) => !ids.includes(r.id));
  const removed = initialLen - buildProcessRoles.length;

  res.json({
    status: 1,
    info: `批量删除成功，共移除 ${removed} 个角色`,
    total: buildProcessRoles.length,
  });
});

app.put('/api/build/roles/:id/change-status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const target = buildProcessRoles.find((r) => r.id === id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '角色不存在' });
  }

  target.status = String(status) === '0' ? '0' : '1';
  res.json({
    status: 1,
    data: target,
    info: `角色【${target.roleName}】状态已变更为：${target.status === '0' ? '正常启用' : '已停用'}`,
  });
});

app.put('/api/build/roles/:id/assign-users', (req, res) => {
  const { id } = req.params;
  const { users } = req.body || {};
  const target = buildProcessRoles.find((r) => r.id === id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '角色不存在' });
  }

  target.assignedUsers = Array.isArray(users) ? users : [];
  res.json({
    status: 1,
    data: target,
    info: `已更新角色【${target.roleName}】的人员配置，当前成员 ${target.assignedUsers.length} 人`,
  });
});

app.post('/api/build/roles/import', (req, res) => {
  const { items, overwrite = false } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ status: 0, info: '无可导入的数据' });
  }

  let importedCount = 0;
  let updatedCount = 0;

  items.forEach((item: any) => {
    if (!item.roleName) return;
    const existing = buildProcessRoles.find(
      (r) =>
        (item.roleCode && r.roleCode === item.roleCode) ||
        r.roleName === item.roleName
    );

    if (existing) {
      if (overwrite) {
        if (item.roleType) existing.roleType = item.roleType;
        if (item.category) existing.category = item.category;
        if (item.boundPositions) existing.boundPositions = Array.isArray(item.boundPositions) ? item.boundPositions : [item.boundPositions];
        if (item.rankRequirement) existing.rankRequirement = item.rankRequirement;
        if (item.remark) existing.remark = item.remark;
        updatedCount++;
      }
    } else {
      buildProcessRoles.push({
        id: `prole_${randomUUID()}_${randomUUID()}`,
        roleNo: buildProcessRoles.length + 1,
        roleCode: item.roleCode || `PR-ROLE-${randomUUID()}`,
        roleName: item.roleName,
        roleType: item.roleType || '主责角色 (R)',
        category: item.category || '02 研发与技术创新',
        boundPositions: item.boundPositions ? (Array.isArray(item.boundPositions) ? item.boundPositions : [item.boundPositions]) : ['系统工程师'],
        assignedUsers: [],
        boundFlows: [],
        rankRequirement: item.rankRequirement || 'P5-P7',
        isKcpApprover: Boolean(item.isKcpApprover),
        sort: buildProcessRoles.length + 1,
        status: item.status === '1' ? '1' : '0',
        remark: item.remark || '批量导入角色',
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
      importedCount++;
    }
  });

  res.json({
    status: 1,
    total: buildProcessRoles.length,
    info: `角色导入完成：新增 ${importedCount} 个，更新 ${updatedCount} 个`,
  });
});

app.get('/api/build/role-categories', (_req, res) => {
  const listWithCounts = roleCategoriesStore.map((cat) => ({
    ...cat,
    count: getCategoryRoleCount(cat),
  }));
  res.json({ status: 1, data: listWithCounts, info: 'ok' });
});

app.post('/api/build/role-categories', (req, res) => {
  const { name, code, parentId, description } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ status: 0, info: '类型/分类名称不能为空' });
  }

  const cleanName = name.trim();
  const parent = parentId ? roleCategoriesStore.find((c) => c.id === parentId) : null;
  const level = parent ? parent.level + 1 : 1;

  const newCat = {
    id: `cat_${Date.now()}_${randomUUID()}`,
    name: cleanName,
    code: code ? code.trim() : (parent ? `${parent.code}.${Date.now().toString().slice(-2)}` : `${Date.now().toString().slice(-2)}`),
    parentId: parent ? parent.id : null,
    level,
    description: description ? description.trim() : '',
    sort: roleCategoriesStore.filter((c) => c.parentId === (parent ? parent.id : null)).length + 1,
  };

  roleCategoriesStore.push(newCat);
  const listWithCounts = roleCategoriesStore.map((cat) => ({
    ...cat,
    count: getCategoryRoleCount(cat),
  }));

  res.json({
    status: 1,
    data: newCat,
    list: listWithCounts,
    info: '新增角色库类型成功',
  });
});

app.put('/api/build/role-categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, code, parentId, description } = req.body || {};
  const target = roleCategoriesStore.find((c) => c.id === id);

  if (!target) {
    return res.status(404).json({ status: 0, info: '未找到指定类型' });
  }

  const oldName = target.name;
  if (name && name.trim()) {
    target.name = name.trim();
    // Sync any roles that used the old category name
    if (oldName !== target.name) {
      buildProcessRoles.forEach((r) => {
        if (r.category === oldName) r.category = target.name;
      });
    }
  }

  if (code !== undefined) target.code = code.trim();
  if (description !== undefined) target.description = description.trim();

  if (parentId !== undefined && parentId !== target.parentId && parentId !== target.id) {
    target.parentId = parentId || null;
    const parent = parentId ? roleCategoriesStore.find((c) => c.id === parentId) : null;
    target.level = parent ? parent.level + 1 : 1;
  }

  const listWithCounts = roleCategoriesStore.map((cat) => ({
    ...cat,
    count: getCategoryRoleCount(cat),
  }));

  res.json({
    status: 1,
    data: target,
    list: listWithCounts,
    info: '修改角色库类型成功',
  });
});

app.delete('/api/build/role-categories/:id', (req, res) => {
  const { id } = req.params;
  const idsToDelete = new Set<string>();

  function collect(nodeId: string) {
    idsToDelete.add(nodeId);
    roleCategoriesStore
      .filter((c) => c.parentId === nodeId)
      .forEach((ch) => collect(ch.id));
  }

  collect(id);

  const deletedCats = roleCategoriesStore.filter((c) => idsToDelete.has(c.id));
  roleCategoriesStore = roleCategoriesStore.filter((c) => !idsToDelete.has(c.id));

  // Fallback for roles that belonged to deleted categories
  const fallback = roleCategoriesStore[0]?.name || '未分类角色';
  buildProcessRoles.forEach((r) => {
    if (deletedCats.some((c) => c.name === r.category)) {
      r.category = fallback;
    }
  });

  const listWithCounts = roleCategoriesStore.map((cat) => ({
    ...cat,
    count: getCategoryRoleCount(cat),
  }));

  res.json({
    status: 1,
    deletedCount: idsToDelete.size,
    list: listWithCounts,
    info: `成功删除 ${idsToDelete.size} 个类型`,
  });
});

app.get('/api/flow/terms', (req, res) => {
  const { name, category, pageNum = '1', pageSize = '10' } = req.query as Record<string, string>;
  let list = [...flowTerms];

  if (name && name.trim()) {
    const q = name.trim().toLowerCase();
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.content && t.content.toLowerCase().includes(q))
    );
  }

  if (category && category !== 'all' && category.trim()) {
    list = list.filter((t) => t.category === category.trim());
  }

  // Sort by id ascending or descending
  list.sort((a, b) => a.id - b.id);

  const total = list.length;
  const pNum = Math.max(1, parseInt(pageNum, 10) || 1);
  const pSize = Math.max(1, parseInt(pageSize, 10) || 10);
  const start = (pNum - 1) * pSize;
  const rows = list.slice(start, start + pSize);

  syncCategoryCounts();

  res.json({
    status: 1,
    total,
    pageNum: pNum,
    pageSize: pSize,
    rows,
    categories: flowTermCategories.map((c) => c.name),
    info: 'ok',
  });
});

app.post('/api/flow/terms', (req, res) => {
  const { name, category, content } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ status: 0, info: '术语名称不能为空' });
  }

  const maxId = flowTerms.reduce((max, t) => Math.max(max, t.id || 0), 0);
  const nextId = maxId > 0 ? maxId + 1 : 1;
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const newTerm = {
    id: nextId,
    name: name.trim(),
    category: category ? category.trim() : '产品研发类',
    content: content ? content.trim() : '',
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  flowTerms.push(newTerm);
  syncCategoryCounts();

  res.json({
    status: 1,
    data: newTerm,
    info: '新增流程术语成功',
  });
});

app.put('/api/flow/terms/:id', (req, res) => {
  const termId = parseInt(req.params.id, 10);
  const { name, category, content } = req.body || {};
  const target = flowTerms.find((t) => t.id === termId);

  if (!target) {
    return res.status(404).json({ status: 0, info: '未找到指定术语' });
  }

  if (name !== undefined && name.trim()) target.name = name.trim();
  if (category !== undefined) target.category = category.trim();
  if (content !== undefined) target.content = content.trim();
  target.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

  syncCategoryCounts();

  res.json({
    status: 1,
    data: target,
    info: '修改流程术语成功',
  });
});

app.delete('/api/flow/terms/:id', (req, res) => {
  const termId = parseInt(req.params.id, 10);
  const idx = flowTerms.findIndex((t) => t.id === termId);
  if (idx < 0) {
    return res.status(404).json({ status: 0, info: '未找到指定术语' });
  }

  flowTerms.splice(idx, 1);
  syncCategoryCounts();

  res.json({
    status: 1,
    info: '删除流程术语成功',
  });
});

app.get('/api/flow/term-categories', (_req, res) => {
  syncCategoryCounts();
  res.json({
    status: 1,
    data: flowTermCategories,
    info: 'ok',
  });
});

app.post('/api/flow/term-categories', (req, res) => {
  const { name, description } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ status: 0, info: '分类名称不能为空' });
  }
  const cleanName = name.trim();
  if (flowTermCategories.some((c) => c.name === cleanName)) {
    return res.status(400).json({ status: 0, info: '该分类名称已存在' });
  }

  const newCat = {
    id: 'cat_' + randomUUID(),
    name: cleanName,
    description: description ? description.trim() : '',
    count: 0,
  };

  flowTermCategories.push(newCat);
  res.json({
    status: 1,
    data: newCat,
    list: flowTermCategories,
    info: '新增术语分类成功',
  });
});

app.put('/api/flow/term-categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body || {};
  const target = flowTermCategories.find((c) => c.id === id);
  if (!target) {
    return res.status(404).json({ status: 0, info: '未找到指定分类' });
  }

  const oldName = target.name;
  if (name && name.trim()) {
    const newName = name.trim();
    if (newName !== oldName) {
      target.name = newName;
      // Sync terms that used oldName
      flowTerms.forEach((t) => {
        if (t.category === oldName) t.category = newName;
      });
    }
  }
  if (description !== undefined) {
    target.description = description.trim();
  }

  syncCategoryCounts();
  res.json({
    status: 1,
    data: target,
    list: flowTermCategories,
    info: '修改分类成功',
  });
});

app.delete('/api/flow/term-categories/:id', (req, res) => {
  const { id } = req.params;
  const idx = flowTermCategories.findIndex((c) => c.id === id);
  if (idx < 0) {
    return res.status(404).json({ status: 0, info: '未找到指定分类' });
  }

  const catName = flowTermCategories[idx].name;
  flowTermCategories.splice(idx, 1);

  // Default terms in this category to first available category
  const fallbackCat = flowTermCategories[0]?.name || '默认分类';
  flowTerms.forEach((t) => {
    if (t.category === catName) t.category = fallbackCat;
  });

  syncCategoryCounts();
  res.json({
    status: 1,
    list: flowTermCategories,
    info: '删除分类成功',
  });
});

app.get('/api/system/company', (_req, res) => {
  res.json({ status: 1, data: companyAuthData, info: 'ok' });
});

app.post('/api/system/company', (req, res) => {
  Object.assign(companyAuthData, req.body);
  if (req.body.companyName) {
    if (companyAuthData.license) {
      companyAuthData.license.authorizedCompany = req.body.companyName;
    }
    if (currentActiveUser) {
      currentActiveUser.companyName = req.body.companyName;
    }
  }
  res.json({ status: 1, data: companyAuthData, info: 'ok' });
});

app.get('/api/system/license', (_req, res) => {
  res.json({
    status: 1,
    data: {
      companyName: companyAuthData.companyName,
      license: companyAuthData.license,
      serverHardware: companyAuthData.license?.serverHardware,
    },
    info: 'ok',
  });
});

app.get('/api/system/forms', (_req, res) => {
  res.json({ status: 1, data: { forms: formEngineSchemas }, info: 'ok' });
});

app.get('/api/system/forms/:formKey', (req, res) => {
  const found = formEngineSchemas.find((f) => f.formKey === req.params.formKey);
  res.json({ status: 1, data: found, info: 'ok' });
});

app.post('/api/system/forms', (req, res) => {
  const { formKey, formName, moduleDomain, description, version } = req.body;
  if (!formKey || !formName) {
    return res.status(400).json({ status: 0, info: '表单标识与表单名称不能为空' });
  }
  const existing = formEngineSchemas.find((f) => f.formKey === formKey);
  if (existing) {
    return res.status(400).json({ status: 0, info: '表单标识已存在，请使用唯一标识' });
  }
  const newForm = {
    formKey: formKey.trim(),
    formName: formName.trim(),
    moduleDomain: moduleDomain || '自定义业务域',
    description: description || '',
    version: version || 'V1.0',
    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    fields: [
      {
        id: 'f_' + randomUUID(),
        fieldKey: 'id',
        label: '单据编号',
        type: 'input',
        required: true,
        showInList: true,
        searchable: true,
        isSystem: true,
        span: 12,
      },
      {
        id: 'f_' + randomUUID(),
        fieldKey: 'title',
        label: '主题名称',
        type: 'input',
        required: true,
        showInList: true,
        searchable: true,
        isSystem: true,
        span: 12,
      },
    ],
  };
  formEngineSchemas.push(newForm);
  res.json({ status: 1, data: newForm, info: '表单模型创建成功' });
});

app.put('/api/system/forms/:formKey', (req, res) => {
  const target = formEngineSchemas.find((f) => f.formKey === req.params.formKey);
  if (!target) {
    return res.status(404).json({ status: 0, info: '未找到对应表单模型' });
  }
  const { formName, moduleDomain, description, version } = req.body;
  if (formName) target.formName = formName;
  if (moduleDomain) target.moduleDomain = moduleDomain;
  if (description !== undefined) target.description = description;
  if (version) target.version = version;
  target.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  res.json({ status: 1, data: target, info: '表单配置更新成功' });
});

app.delete('/api/system/forms/:formKey', (req, res) => {
  const isDefault = ['form_sysdoc', 'form_risk', 'form_flow', 'form_flowdoc'].includes(req.params.formKey);
  if (isDefault) {
    return res.status(400).json({ status: 0, info: '系统内置单据模型不允许删除' });
  }
  const idx = formEngineSchemas.findIndex((f) => f.formKey === req.params.formKey);
  if (idx === -1) {
    return res.status(404).json({ status: 0, info: '未找到对应表单模型' });
  }
  formEngineSchemas.splice(idx, 1);
  res.json({ status: 1, info: '表单模型已删除' });
});

app.post('/api/system/forms/:formKey/fields', (req, res) => {
  const form = formEngineSchemas.find((f) => f.formKey === req.params.formKey);
  if (!form) {
    return res.status(404).json({ status: 0, info: '未找到表单模型' });
  }
  const fieldData = req.body;
  if (!fieldData.label || !fieldData.fieldKey) {
    return res.status(400).json({ status: 0, info: '字段名称与字段Key不能为空' });
  }

  if (fieldData.id) {
    // Edit existing field
    const fieldIndex = form.fields.findIndex((f: any) => f.id === fieldData.id);
    if (fieldIndex >= 0) {
      form.fields[fieldIndex] = {
        ...form.fields[fieldIndex],
        ...fieldData,
      };
    } else {
      form.fields.push({
        ...fieldData,
        id: fieldData.id || 'f_' + randomUUID(),
      });
    }
  } else {
    // Create new field
    const newField = {
      ...fieldData,
      id: 'f_' + randomUUID(),
      isSystem: false,
    };
    form.fields.push(newField);
  }
  form.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  res.json({ status: 1, data: form, info: '字段保存成功' });
});

app.put('/api/system/forms/:formKey/fields/sort', (req, res) => {
  const form = formEngineSchemas.find((f) => f.formKey === req.params.formKey);
  if (!form) {
    return res.status(404).json({ status: 0, info: '未找到表单模型' });
  }
  const { fieldIds } = req.body;
  if (Array.isArray(fieldIds)) {
    const sortedFields: any[] = [];
    fieldIds.forEach((id: string) => {
      const f = form.fields.find((item: any) => item.id === id);
      if (f) sortedFields.push(f);
    });
    // Append any fields not present in fieldIds
    form.fields.forEach((item: any) => {
      if (!sortedFields.some((f) => f.id === item.id)) {
        sortedFields.push(item);
      }
    });
    form.fields = sortedFields;
    form.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  res.json({ status: 1, data: form, info: '字段排序更新成功' });
});

app.delete('/api/system/forms/:formKey/fields/:id', (req, res) => {
  const form = formEngineSchemas.find((f) => f.formKey === req.params.formKey);
  if (!form) {
    return res.status(404).json({ status: 0, info: '未找到表单模型' });
  }
  const field = form.fields.find((f: any) => f.id === req.params.id);
  if (field && field.isSystem) {
    return res.status(400).json({ status: 0, info: '系统内置字段不允许删除' });
  }
  form.fields = form.fields.filter((f: any) => f.id !== req.params.id);
  form.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  res.json({ status: 1, data: form, info: '字段已删除' });
});

app.post('/api/system/forms/:formKey/import', (req, res) => {
  const form = formEngineSchemas.find((f) => f.formKey === req.params.formKey);
  if (!form) {
    return res.status(404).json({ status: 0, info: '未找到表单模型' });
  }
  const { fields, mode } = req.body; // mode: 'replace' | 'append'
  if (!Array.isArray(fields)) {
    return res.status(400).json({ status: 0, info: '字段列表格式不正确' });
  }

  if (mode === 'replace') {
    const systemFields = form.fields.filter((f: any) => f.isSystem);
    form.fields = [...systemFields, ...fields.map((f: any) => ({
      ...f,
      id: f.id || 'f_' + randomUUID(),
      isSystem: false,
    }))];
  } else {
    fields.forEach((f: any) => {
      form.fields.push({
        ...f,
        id: f.id || 'f_' + randomUUID(),
        isSystem: false,
      });
    });
  }
  form.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  res.json({ status: 1, data: form, info: '字段导入成功' });
});

app.post('/api/ai/flow-audit', async (req, res) => {
  const { cells = [], title = '当前流程' } = req.body || {};
  const vertices = cells.filter((c: any) => c.vertex);
  const edges = cells.filter((c: any) => c.edge);

  const hasStart = vertices.some((v: any) => v.attrs?.dflowType === 'startEnd' && (v.value?.includes('开始') || v.attrs?.name?.includes('开始')));
  const hasEnd = vertices.some((v: any) => v.attrs?.dflowType === 'startEnd' && (v.value?.includes('结束') || v.attrs?.name?.includes('结束')));

  const connectedIds = new Set<string>();
  edges.forEach((e: any) => {
    if (e.source) connectedIds.add(e.source);
    if (e.target) connectedIds.add(e.target);
  });

  const issues: any[] = [];

  if (!hasStart) {
    issues.push({ id: 'iss_1', level: 'high', title: '缺少“开始”节点', desc: '端到端流程应具备明确的起点触发源。建议在流程左端补全开始节点。' });
  }
  if (!hasEnd) {
    issues.push({ id: 'iss_2', level: 'high', title: '缺少“结束”节点', desc: '流程缺少办结/闭环终止节点，易导致业务卡点无法归档。' });
  }

  const isolatedVertices = vertices.filter((v: any) => !connectedIds.has(v.id) && !v.attrs?.dflowType?.startsWith('swimlane'));
  if (isolatedVertices.length > 0) {
    issues.push({
      id: 'iss_3',
      level: 'medium',
      title: `检测到 ${isolatedVertices.length} 个孤立未连接节点`,
      desc: `节点【${isolatedVertices.map((v: any) => v.value || v.id).slice(0, 3).join('、')}】未与其他业务节点形成路由，建议检查流转逻辑。`,
    });
  }

  const roleNodes = vertices.filter((v: any) => v.attrs?.dflowType === 'nodeRoleName');
  const activityNodes = vertices.filter((v: any) => v.attrs?.dflowType?.startsWith('nodeActive'));
  if (activityNodes.length > 0 && roleNodes.length === 0) {
    issues.push({
      id: 'iss_4',
      level: 'medium',
      title: '缺少岗位角色定义',
      desc: '流程活动尚未配置责任主体或角色泳道，可能影响落地执行分工。',
    });
  }

  const kcpNodes = activityNodes.filter((v: any) => v.attrs?.kcp === 'true' || v.attrs?.kcp === true);
  if (kcpNodes.length === 0 && activityNodes.length >= 3) {
    issues.push({
      id: 'iss_5',
      level: 'low',
      title: '未标识关键控制点(KCP)',
      desc: '流程包含较多活动，但未设定质量与风险管控点。建议为高风险裁决环节标记KCP。',
    });
  }

  const score = Math.max(60, 100 - issues.filter((i) => i.level === 'high').length * 18 - issues.filter((i) => i.level === 'medium').length * 10 - issues.filter((i) => i.level === 'low').length * 5);

  res.json({
    status: 1,
    data: {
      score,
      passedCount: Math.max(4, 8 - issues.length),
      issues,
      nodeCount: vertices.length,
      edgeCount: edges.length,
      recommendation: score >= 90 ? '流程结构健康，符合企业级三层架构与内控建模规范！' : '流程存在若干规范性改进项，点击对应建议即可自动优化排布。',
    },
    info: 'ok',
  });
});
  return () => Object.assign(state, { archTypes, flows, flowAuditRecords, flowRepealRecords, flowProcessTasks, dutyTables, dutyCategories, orgDepts, orgUsers, orgPositions, orgJobTitles, orgRoles, buildProcessRoles, roleCategoriesStore, flowTerms, flowTermCategories, formEngineSchemas, dutyManuals, dutyAuditTasks, systemApis, dictBundle, archRefsStore, flowRefsStore, companyAuthData });
}
