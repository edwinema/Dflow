/**
 * Flow & DOA Activity Node Association and Constraint Engine
 */
import { parseFlowNodes } from './flowSchema';

export type ConstraintType = 'HARD_BLOCK' | 'SOFT_WARNING' | 'AUTO_ESCALATE';

export interface FlowActivityNode {
  id: string;
  flowId: string;
  flowName: string;
  flowCode: string;
  seq: number;
  nodeName: string;
  roleName: string;
  nodeType: 'serial' | 'judge' | 'decision';
  defaultRaci: 'R' | 'A' | 'C' | 'I';
  suggestedAmountLimit?: number;
  suggestedAmountLimitDesc?: string;
  outDeliverable?: string;
  desc?: string;
}

export interface NodeConstraintRule {
  constraintType: ConstraintType;
  maxAuthorizedAmount: number;
  maxAuthorizedAmountDesc: string;
  raciRequired: 'A' | 'R' | 'C' | 'I';
  budgetGate: '预算内' | '超预算' | '不涉及' | '严格管控';
  mandatoryDeliverable?: string;
  autoEscalateToRole?: string;
  auditLogRequired?: boolean;
}

export interface ConstraintSimulationParams {
  flowId: string;
  flowName?: string;
  nodeId: string;
  nodeName?: string;
  documentAmount: number;
  operatorRole: string;
  approverRole: string;
  budgetType: '预算内' | '超预算' | '不涉及';
  hasDeliverable: boolean;
}

export interface GateCheckItem {
  gateKey: 'role' | 'amount' | 'budget' | 'deliverable';
  gateName: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  title: string;
  detail: string;
}

export interface ConstraintSimulationResult {
  decision: 'PASS' | 'WARN' | 'BLOCK' | 'ESCALATE';
  decisionBadge: string;
  decisionColor: string;
  score: number;
  summary: string;
  gateChecks: GateCheckItem[];
  actionSuggestion: string;
  policyReference: string;
  escalationChain?: string[];
}

export const PRESET_FLOW_ACTIVITIES: Record<string, FlowActivityNode[]> = {
  flow_101: [
    {
      id: 'step_101_1',
      flowId: 'flow_101',
      flowName: '1.1.1 概念阶段',
      flowCode: 'IPD-ST-111',
      seq: 1,
      nodeName: '拟制 Charter',
      roleName: '业务代表',
      nodeType: 'serial',
      defaultRaci: 'R',
      suggestedAmountLimit: 50,
      suggestedAmountLimitDesc: '50万以内',
      outDeliverable: '产品 Charter 建议书',
      desc: '编制初始Charter',
    },
    {
      id: 'step_101_2',
      flowId: 'flow_101',
      flowName: '1.1.1 概念阶段',
      flowCode: 'IPD-ST-111',
      seq: 2,
      nodeName: '技术评审',
      roleName: '技术专家',
      nodeType: 'serial',
      defaultRaci: 'C',
      suggestedAmountLimit: 500,
      suggestedAmountLimitDesc: '500万以内',
      outDeliverable: '技术评审报告',
      desc: 'TR评审验证',
    },
    {
      id: 'step_101_3',
      flowId: 'flow_101',
      flowName: '1.1.1 概念阶段',
      flowCode: 'IPD-ST-111',
      seq: 3,
      nodeName: 'IPMT决策立项',
      roleName: '决策委员会',
      nodeType: 'decision',
      defaultRaci: 'A',
      suggestedAmountLimit: 2000,
      suggestedAmountLimitDesc: '2000万以内',
      outDeliverable: '产品 Charter 决议',
      desc: '立项裁决',
    },
  ],
  flow_102: [
    {
      id: 'step_102_1',
      flowId: 'flow_102',
      flowName: '1.1.1.1 IPMT团队评审',
      flowCode: 'IPD-ST-112',
      seq: 1,
      nodeName: '业务计划初审',
      roleName: 'PDT经理',
      nodeType: 'serial',
      defaultRaci: 'R',
      suggestedAmountLimit: 100,
      suggestedAmountLimitDesc: '100万以内',
      outDeliverable: '业务计划书(BP)',
      desc: '业务可行性验证',
    },
    {
      id: 'step_102_2',
      flowId: 'flow_102',
      flowName: '1.1.1.1 IPMT团队评审',
      flowCode: 'IPD-ST-112',
      seq: 2,
      nodeName: '财务预审',
      roleName: '财务经理',
      nodeType: 'serial',
      defaultRaci: 'C',
      suggestedAmountLimit: 500,
      suggestedAmountLimitDesc: '500万以内',
      outDeliverable: '投资收益评估表',
      desc: '预算及投资回报审核',
    },
    {
      id: 'step_102_3',
      flowId: 'flow_102',
      flowName: '1.1.1.1 IPMT团队评审',
      flowCode: 'IPD-ST-112',
      seq: 3,
      nodeName: '投资决策裁决',
      roleName: '执行委员会',
      nodeType: 'decision',
      defaultRaci: 'A',
      suggestedAmountLimit: 2000,
      suggestedAmountLimitDesc: '2000万以内',
      outDeliverable: '签发 Charter 批件',
      desc: '重大投资裁决',
    },
  ],
  flow_105: [
    {
      id: 'step_105_1',
      flowId: 'flow_105',
      flowName: '6.4.1.1 芯片开发流程',
      flowCode: 'IC-DEV-001',
      seq: 1,
      nodeName: '架构规格评审',
      roleName: '系统架构师',
      nodeType: 'serial',
      defaultRaci: 'R',
      suggestedAmountLimit: 200,
      suggestedAmountLimitDesc: '200万以内',
      outDeliverable: '架构设计规格书',
      desc: '微架构规格验证',
    },
    {
      id: 'step_105_2',
      flowId: 'flow_105',
      flowName: '6.4.1.1 芯片开发流程',
      flowCode: 'IC-DEV-001',
      seq: 2,
      nodeName: 'RTL逻辑仿真',
      roleName: 'IC设计经理',
      nodeType: 'serial',
      defaultRaci: 'R',
      suggestedAmountLimit: 500,
      suggestedAmountLimitDesc: '500万以内',
      outDeliverable: '综合后 Netlist',
      desc: '仿真覆盖率 100%',
    },
    {
      id: 'step_105_3',
      flowId: 'flow_105',
      flowName: '6.4.1.1 芯片开发流程',
      flowCode: 'IC-DEV-001',
      seq: 3,
      nodeName: '流片前 DRC/LVS验证',
      roleName: '物理设计专家',
      nodeType: 'serial',
      defaultRaci: 'C',
      suggestedAmountLimit: 1000,
      suggestedAmountLimitDesc: '1000万以内',
      outDeliverable: '物理验证 GDSII 报告',
      desc: '版图设计规则检查',
    },
    {
      id: 'step_105_4',
      flowId: 'flow_105',
      flowName: '6.4.1.1 芯片开发流程',
      flowCode: 'IC-DEV-001',
      seq: 4,
      nodeName: 'Tape-out流片决策',
      roleName: '研发副总裁',
      nodeType: 'decision',
      defaultRaci: 'A',
      suggestedAmountLimit: 3000,
      suggestedAmountLimitDesc: '3000万以内',
      outDeliverable: '晶圆厂 Tape-out 投产单',
      desc: 'Sign-off 批准',
    },
  ],
  flow_106: [
    {
      id: 'step_106_1',
      flowId: 'flow_106',
      flowName: '3.1.1.1 线索到回款流程',
      flowCode: 'LTC-ML-001',
      seq: 1,
      nodeName: '线索评估 (MQL)',
      roleName: 'MDR团队',
      nodeType: 'serial',
      defaultRaci: 'R',
      suggestedAmountLimit: 50,
      suggestedAmountLimitDesc: '50万以内',
      outDeliverable: '意向需求清单',
      desc: 'BANT线索评级',
    },
    {
      id: 'step_106_2',
      flowId: 'flow_106',
      flowName: '3.1.1.1 线索到回款流程',
      flowCode: 'LTC-ML-001',
      seq: 2,
      nodeName: '商务方案编制',
      roleName: '售前方案专家',
      nodeType: 'serial',
      defaultRaci: 'C',
      suggestedAmountLimit: 200,
      suggestedAmountLimitDesc: '200万以内',
      outDeliverable: '投标报价方案书',
      desc: '成本核算及定价方案',
    },
    {
      id: 'step_106_3',
      flowId: 'flow_106',
      flowName: '3.1.1.1 线索到回款流程',
      flowCode: 'LTC-ML-001',
      seq: 3,
      nodeName: '合同特批签署',
      roleName: '大区总经理',
      nodeType: 'decision',
      defaultRaci: 'A',
      suggestedAmountLimit: 500,
      suggestedAmountLimitDesc: '500万以内',
      outDeliverable: '正式销售合同',
      desc: '重大合同审批',
    },
  ],
};

export function getFlowActivityNodes(flowId: string, flowsList: any[] = []): FlowActivityNode[] {
  if (PRESET_FLOW_ACTIVITIES[flowId]) {
    return PRESET_FLOW_ACTIVITIES[flowId];
  }
  const matchedFlow = flowsList.find((f) => f.id === flowId);
  if (matchedFlow?.xml) {
    const parsedRows = parseFlowNodes(matchedFlow.xml);
    if (parsedRows.length > 0) {
      return parsedRows.map((r, idx) => ({
        id: `act_${flowId}_${r.id || idx + 1}`,
        flowId,
        flowName: matchedFlow.label || '流程',
        flowCode: matchedFlow.flowNo || flowId,
        seq: idx + 1,
        nodeName: r.name,
        roleName: r.roles !== '未配置' ? r.roles : '业务负责人',
        nodeType: r.name.includes('决策') || r.name.includes('审') ? 'decision' : 'serial',
        defaultRaci: r.name.includes('决策') || r.name.includes('审') ? 'A' : 'R',
        suggestedAmountLimit: 500,
        suggestedAmountLimitDesc: '500万以内',
        outDeliverable: r.out !== '-' ? r.out : `${r.name}交付物`,
        desc: r.desc !== '-' ? r.desc : `执行${r.name}`,
      }));
    }
  }
  const flowTitle = matchedFlow?.label || '业务流程';
  const flowCode = matchedFlow?.flowNo || flowId;
  return [
    {
      id: `act_${flowId}_1`,
      flowId,
      flowName: flowTitle,
      flowCode,
      seq: 1,
      nodeName: `${flowTitle} - 拟制发起`,
      roleName: '经办人',
      nodeType: 'serial',
      defaultRaci: 'R',
      suggestedAmountLimit: 50,
      suggestedAmountLimitDesc: '50万以内',
      outDeliverable: `${flowTitle}申请单`,
      desc: '发起编制',
    },
    {
      id: `act_${flowId}_2`,
      flowId,
      flowName: flowTitle,
      flowCode,
      seq: 2,
      nodeName: `${flowTitle} - 审核把关`,
      roleName: '部门总监',
      nodeType: 'serial',
      defaultRaci: 'C',
      suggestedAmountLimit: 200,
      suggestedAmountLimitDesc: '200万以内',
      outDeliverable: '审核意见书',
      desc: '合规初审',
    },
    {
      id: `act_${flowId}_3`,
      flowId,
      flowName: flowTitle,
      flowCode,
      seq: 3,
      nodeName: `${flowTitle} - 终审决策`,
      roleName: '分管副总裁',
      nodeType: 'decision',
      defaultRaci: 'A',
      suggestedAmountLimit: 500,
      suggestedAmountLimitDesc: '500万以内',
      outDeliverable: `${flowTitle}决议书`,
      desc: '最高裁决',
    },
  ];
}

export function evaluateNodeConstraint(
  params: ConstraintSimulationParams,
  rule?: NodeConstraintRule
): ConstraintSimulationResult {
  const defaultRule: NodeConstraintRule = rule || {
    constraintType: 'HARD_BLOCK',
    maxAuthorizedAmount: 500,
    maxAuthorizedAmountDesc: '500万以内',
    raciRequired: 'A',
    budgetGate: '预算内',
    mandatoryDeliverable: '交付物报告',
    autoEscalateToRole: '分管总裁',
    auditLogRequired: true,
  };

  const gateChecks: GateCheckItem[] = [];
  let score = 100;
  let hasFail = false;
  let hasWarn = false;

  // 1. Role Gate
  const requiredRole = defaultRule.raciRequired || 'A';
  const approverRole = (params.approverRole || '').trim();
  const operatorRole = (params.operatorRole || '').trim();

  if (requiredRole === 'A') {
    const isTopApprover = ['总裁', '副总裁', '总经理', '总监', '委员会'].some((r) =>
      approverRole.includes(r)
    );
    if (!isTopApprover && approverRole.includes('专员') && !approverRole.includes('总监')) {
      gateChecks.push({
        gateKey: 'role',
        gateName: '角色权能 (RACI)',
        status: 'FAIL',
        title: '审批角色权级不足',
        detail: `当前节点要求具备 A 终审权限 (${approverRole} 不足)，请升级到具备终裁权的负责人`,
      });
      score -= 30;
      hasFail = true;
    } else {
      gateChecks.push({
        gateKey: 'role',
        gateName: '角色权能 (RACI)',
        status: 'PASS',
        title: '权能角色合规',
        detail: `经办: ${operatorRole || '业务员'} (R) | 终审: ${approverRole} (A)`,
      });
    }
  } else {
    gateChecks.push({
      gateKey: 'role',
      gateName: '角色权能 (RACI)',
      status: 'PASS',
      title: '权能检查通过',
      detail: `节点满足 [${requiredRole}] 权能定义`,
    });
  }

  // 2. Amount Cap Gate
  const docAmt = Number(params.documentAmount) || 0;
  const maxLimit = Number(defaultRule.maxAuthorizedAmount) || 0;

  if (maxLimit > 0 && docAmt > maxLimit) {
    const overAmount = (docAmt - maxLimit).toFixed(1);
    if (defaultRule.constraintType === 'HARD_BLOCK') {
      gateChecks.push({
        gateKey: 'amount',
        gateName: '授权额度上限',
        status: 'FAIL',
        title: `金额超限 (${docAmt}万 > 授权限额${maxLimit}万)`,
        detail: `超限额 ${overAmount} 万元，根据企业 DOA 规定，系统强制硬阻断`,
      });
      score -= 40;
      hasFail = true;
    } else if (defaultRule.constraintType === 'AUTO_ESCALATE') {
      gateChecks.push({
        gateKey: 'amount',
        gateName: '授权额度上限',
        status: 'WARN',
        title: `金额超限 (${docAmt}万 > 授权限额${maxLimit}万)`,
        detail: `超额自动升级触发: 将流程抄送并转呈至 ${defaultRule.autoEscalateToRole || '分管高管'} (A) 裁决`,
      });
      score -= 15;
      hasWarn = true;
    } else {
      gateChecks.push({
        gateKey: 'amount',
        gateName: '授权额度上限',
        status: 'WARN',
        title: `金额超限告警 (${docAmt}万 > ${maxLimit}万)`,
        detail: `超出预设参考限额，根据软告警策略允许继续流转，但将在 DOA 风险审计记录中记录`,
      });
      score -= 20;
      hasWarn = true;
    }
  } else {
    gateChecks.push({
      gateKey: 'amount',
      gateName: '授权额度上限',
      status: 'PASS',
      title: `金额合规 (${docAmt}万元)`,
      detail: `在节点授权范围 (${defaultRule.maxAuthorizedAmountDesc || maxLimit + '万'}) 之内`,
    });
  }

  // 3. Budget Compliance Gate
  const isExtraBudget = params.budgetType === '超预算';
  if (isExtraBudget) {
    if (!['总裁', '财务总监', 'CFO', '董事长'].some((r) => approverRole.includes(r))) {
      gateChecks.push({
        gateKey: 'budget',
        gateName: '预算门禁',
        status: 'FAIL',
        title: '超预算事项需特批',
        detail: '属于超预算开支，按制度要求必须经过 CFO/财务总监/总裁 特批',
      });
      score -= 25;
      hasFail = true;
    } else {
      gateChecks.push({
        gateKey: 'budget',
        gateName: '预算门禁',
        status: 'WARN',
        title: '超预算已获得财务高管复核',
        detail: `当前审批人 ${approverRole} 具备预算特批权限`,
      });
      score -= 10;
      hasWarn = true;
    }
  } else {
    gateChecks.push({
      gateKey: 'budget',
      gateName: '预算门禁',
      status: 'PASS',
      title: '预算属性合规',
      detail: '正常预算内列支，无超额追加风险',
    });
  }

  // 4. Deliverable Gate
  if (!params.hasDeliverable && defaultRule.mandatoryDeliverable) {
    gateChecks.push({
      gateKey: 'deliverable',
      gateName: '必须交付物检验',
      status: 'FAIL',
      title: `缺少法定交付物: ${defaultRule.mandatoryDeliverable}`,
      detail: '节点推进前必须上传或关联齐备交付物材料，否则禁止流转到下一阶段',
    });
    score -= 15;
    hasFail = true;
  } else {
    gateChecks.push({
      gateKey: 'deliverable',
      gateName: '必须交付物检验',
      status: 'PASS',
      title: '交付物检验完备',
      detail: `交付物附件齐全: ${defaultRule.mandatoryDeliverable || '不强制'}`,
    });
  }

  score = Math.max(0, score);

  if (hasFail && defaultRule.constraintType === 'HARD_BLOCK') {
    return {
      decision: 'BLOCK',
      decisionBadge: '强制阻断 (HARD BLOCK)',
      decisionColor: 'text-[#f56c6c] bg-[#fef0f0] border-[#fde2e2]',
      score,
      summary: `检测到 ${gateChecks.filter((g) => g.status === 'FAIL').length} 项重大合规冲突，节点触发企业 DOA 刚性控制，当前操作已被系统拦截并阻断。`,
      gateChecks,
      actionSuggestion: `请调整业务金额，或将单据升格至 ${defaultRule.autoEscalateToRole || '高层领导'} 重新审批。`,
      policyReference: '《全元企业分权授权制度(DOA)》第3.2条与各节点刚性控制规范',
      escalationChain: [
        `当前申请: ${params.nodeName || '活动节点'} (${approverRole}) [阻断]`,
        `升格节点: ${defaultRule.autoEscalateToRole || '分管副总裁'} (A)`,
        '归档审计: 流程风控部 (I)',
      ],
    };
  }

  if (hasFail && defaultRule.constraintType === 'AUTO_ESCALATE') {
    return {
      decision: 'ESCALATE',
      decisionBadge: '自动升格裁决 (AUTO ESCALATE)',
      decisionColor: 'text-[#409eff] bg-[#ecf5ff] border-[#b3d8ff]',
      score: Math.max(score, 65),
      summary: `当前业务触发自动升级规则，系统已将裁决权由当前层级转交至 ${defaultRule.autoEscalateToRole || '高级管理层'}。`,
      gateChecks,
      actionSuggestion: `已为您自动创建 ${defaultRule.autoEscalateToRole || '高管'} 待办任务，请等待高管终裁。`,
      policyReference: '《全元企业分权授权制度(DOA)》第2.4条关于大额特批转呈规则',
      escalationChain: [
        `当前拟制: ${params.nodeName || '活动节点'} (${approverRole}) [已审]`,
        `转交终裁: ${defaultRule.autoEscalateToRole || '分管总裁'} (A) [处理中]`,
        '终局备案: 董事会办 (S/I)',
      ],
    };
  }

  if (hasWarn) {
    return {
      decision: 'WARN',
      decisionBadge: '告警放行 (SOFT WARNING)',
      decisionColor: 'text-[#e6a23c] bg-[#fdf6ec] border-[#faecd8]',
      score,
      summary: '存在个别合规预警点，但属于软控制策略范畴，允许放行流转，已记录审计留痕。',
      gateChecks,
      actionSuggestion: '请在下阶段注意补齐相关材料，并跟进相关部门确认意见。',
      policyReference: '《全元企业分权授权制度(DOA)》日常运营例外管理指导原则',
    };
  }

  return {
    decision: 'PASS',
    decisionBadge: '全流程合规放行 (PASS)',
    decisionColor: 'text-[#67c23a] bg-[#f0f9eb] border-[#e1f3d8]',
    score,
    summary: '四项门禁全部合规通过，符合企业 DOA 与流程节点规范，可立即流转执行。',
    gateChecks,
    actionSuggestion: '无需额外审批，按既定流程推进即可。',
    policyReference: '《全元企业分权授权制度(DOA)》2026版基线规范',
  };
}
