import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FileText,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  ZoomOut,
  ZoomIn,
  PenLine,
  Download,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  ChevronDown,
  GripVertical,
  ArrowUpDown,
  GitBranch,
  Network,
  FolderInput,
  FileUp,
  Sparkles,
  Upload,
  X,
  Users,
  Table,
  LayoutGrid,
  Search,
  Tag,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Layers,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DrawioBridge } from '../utils/drawioBridge';
import { parseFlowNodes } from '../utils/flowSchema';
import { ApprovedTreePickerModal } from './SysDocRiskModuleView';
import { CollaboratorModal, CollaboratorItem } from './CollaboratorModal';
import { PersonSelectField } from './PersonSelectField';
import { DeptSelectField } from './DeptSelectField';
import { ErrorBoundary } from './ErrorBoundary';
import { FlowPageStandardHeader, getArchHierarchyPath } from './FlowPageStandardHeader';
import { UnifiedCardDetailView } from './UnifiedCardDetailView';
import { FlowPublishAuditModal } from './FlowPublishAuditModal';

interface FlowDesignViewProps {
  initialSelectedFlowId?: string | null;
  currentUser?: any;
  onEnterDesigner: (flowId: string) => void;
  onNavigate?: (path: string) => void;
  onSelectNodeId?: (id: string) => void;
  showToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

// 架构键盘图色彩卡片主题配置，支持 L1-L6 级架构与流程高对比度区分
const ARCH_PALETTES = [
  {
    themeName: 'blue',
    badgeBg: 'bg-[#eff6ff]',
    badgeText: 'text-[#1d4ed8]',
    badgeBorder: 'border-[#bfdbfe]',
    cardBg: 'bg-[#f8fafc]',
    cardBorder: 'border-[#bfdbfe]',
    cardHoverBorder: 'hover:border-[#2563eb]',
    headerBg: 'bg-gradient-to-r from-[#1e40af] to-[#3b82f6]',
    accentColor: '#2563eb',
    lightBg: 'bg-[#eff6ff]/60',
    btnBg: 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white',
    ringColor: 'hover:ring-2 hover:ring-[#2563eb]/20',
    pillBg: 'bg-[#eff6ff]',
    pillText: 'text-[#1d4ed8]',
    pillBorder: 'border-[#bfdbfe]',
  },
  {
    themeName: 'purple',
    badgeBg: 'bg-[#faf5ff]',
    badgeText: 'text-[#6d28d9]',
    badgeBorder: 'border-[#e9d5ff]',
    cardBg: 'bg-[#fdfcff]',
    cardBorder: 'border-[#e9d5ff]',
    cardHoverBorder: 'hover:border-[#7c3aed]',
    headerBg: 'bg-gradient-to-r from-[#5b21b6] to-[#8b5cf6]',
    accentColor: '#7c3aed',
    lightBg: 'bg-[#faf5ff]/60',
    btnBg: 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white',
    ringColor: 'hover:ring-2 hover:ring-[#7c3aed]/20',
    pillBg: 'bg-[#faf5ff]',
    pillText: 'text-[#6d28d9]',
    pillBorder: 'border-[#e9d5ff]',
  },
  {
    themeName: 'emerald',
    badgeBg: 'bg-[#f0fdf4]',
    badgeText: 'text-[#15803d]',
    badgeBorder: 'border-[#bbf7d0]',
    cardBg: 'bg-[#fbfdfb]',
    cardBorder: 'border-[#bbf7d0]',
    cardHoverBorder: 'hover:border-[#16a34a]',
    headerBg: 'bg-gradient-to-r from-[#166534] to-[#22c55e]',
    accentColor: '#16a34a',
    lightBg: 'bg-[#f0fdf4]/60',
    btnBg: 'bg-[#16a34a] hover:bg-[#15803d] text-white',
    ringColor: 'hover:ring-2 hover:ring-[#16a34a]/20',
    pillBg: 'bg-[#f0fdf4]',
    pillText: 'text-[#15803d]',
    pillBorder: 'border-[#bbf7d0]',
  },
  {
    themeName: 'amber',
    badgeBg: 'bg-[#fffbeb]',
    badgeText: 'text-[#b45309]',
    badgeBorder: 'border-[#fde68a]',
    cardBg: 'bg-[#fffdf7]',
    cardBorder: 'border-[#fde68a]',
    cardHoverBorder: 'hover:border-[#d97706]',
    headerBg: 'bg-gradient-to-r from-[#92400e] to-[#f59e0b]',
    accentColor: '#d97706',
    lightBg: 'bg-[#fffbeb]/60',
    btnBg: 'bg-[#d97706] hover:bg-[#b45309] text-white',
    ringColor: 'hover:ring-2 hover:ring-[#d97706]/20',
    pillBg: 'bg-[#fffbeb]',
    pillText: 'text-[#b45309]',
    pillBorder: 'border-[#fde68a]',
  },
  {
    themeName: 'teal',
    badgeBg: 'bg-[#f0fdfa]',
    badgeText: 'text-[#0f766e]',
    badgeBorder: 'border-[#99f6e4]',
    cardBg: 'bg-[#f8fdfc]',
    cardBorder: 'border-[#99f6e4]',
    cardHoverBorder: 'hover:border-[#0d9488]',
    headerBg: 'bg-gradient-to-r from-[#115e59] to-[#14b8a6]',
    accentColor: '#0d9488',
    lightBg: 'bg-[#f0fdfa]/60',
    btnBg: 'bg-[#0d9488] hover:bg-[#0f766e] text-white',
    ringColor: 'hover:ring-2 hover:ring-[#0d9488]/20',
    pillBg: 'bg-[#f0fdfa]',
    pillText: 'text-[#0f766e]',
    pillBorder: 'border-[#99f6e4]',
  },
  {
    themeName: 'rose',
    badgeBg: 'bg-[#fff1f2]',
    badgeText: 'text-[#be123c]',
    badgeBorder: 'border-[#fecdd3]',
    cardBg: 'bg-[#fffafa]',
    cardBorder: 'border-[#fecdd3]',
    cardHoverBorder: 'hover:border-[#e11d48]',
    headerBg: 'bg-gradient-to-r from-[#9f1239] to-[#f43f5e]',
    accentColor: '#e11d48',
    lightBg: 'bg-[#fff1f2]/60',
    btnBg: 'bg-[#e11d48] hover:bg-[#be123c] text-white',
    ringColor: 'hover:ring-2 hover:ring-[#e11d48]/20',
    pillBg: 'bg-[#fff1f2]',
    pillText: 'text-[#be123c]',
    pillBorder: 'border-[#ffe4e6]',
  },
  {
    themeName: 'cyan',
    badgeBg: 'bg-[#ecfeff]',
    badgeText: 'text-[#0e7490]',
    badgeBorder: 'border-[#a5f3fc]',
    cardBg: 'bg-[#f7fdfe]',
    cardBorder: 'border-[#a5f3fc]',
    cardHoverBorder: 'hover:border-[#06b6d4]',
    headerBg: 'bg-gradient-to-r from-[#155e75] to-[#06b6d4]',
    accentColor: '#06b6d4',
    lightBg: 'bg-[#ecfeff]/60',
    btnBg: 'bg-[#0891b2] hover:bg-[#0e7490] text-white',
    ringColor: 'hover:ring-2 hover:ring-[#06b6d4]/20',
    pillBg: 'bg-[#ecfeff]',
    pillText: 'text-[#0e7490]',
    pillBorder: 'border-[#cffafe]',
  },
];

// 计算任意架构节点真实的层级（支持 L1-L6 级）
const resolveArchLevel = (arch: any, allArchs: any[]): string => {
  if (!arch) return 'L1';
  if (!arch.parentId || arch.id === 'arch_root') return 'L0';
  let depth = 0;
  let cur: any = arch;
  while (cur && cur.parentId && cur.id !== 'arch_root') {
    depth++;
    cur = allArchs.find((a) => a.id === cur.parentId);
  }
  return `L${Math.min(6, Math.max(1, depth))}`;
};

export interface FlowImportTemplate {
  id: string;
  title: string;
  flowNo: string;
  category: string;
  flowLevel: string;
  desc: string;
  steps: { title: string; role: string; desc: string; out: string; kcp?: boolean; judge?: boolean }[];
}

export const PRESET_FLOW_TEMPLATES: FlowImportTemplate[] = [
  {
    id: 'tpl_ltc_lead',
    title: '销售线索识别转化与商机核准流程',
    flowNo: 'FLOW-LTC-301',
    category: '线索到回款 (LTC)',
    flowLevel: 'L3',
    desc: '覆盖从市场营销线索接入、销售线索初步甄别、客户资质核验到商机建档立项的全过程控制。',
    steps: [
      { title: '线索接入清洗', role: '营销专员', desc: '全渠道线索收集与去重过滤', out: '合规线索清单' },
      { title: '销售意向核验', role: '售前经理', desc: '客户拜访与采购预算摸排', out: '线索初评报告' },
      { title: '方案报价评估', role: '方案架构师', desc: '客户技术需求对接与方案编制', out: '定制化技术方案' },
      { title: '商机立项决策', role: '营销总监', desc: '利润率测算与商机立项审核', out: '立项批复单', judge: true, kcp: true },
      { title: '商机系统建档', role: 'CRM管理员', desc: '商机录入与客户主数据绑定', out: '系统商机编号' },
    ],
  },
  {
    id: 'tpl_ipd_review',
    title: '产品技术规格评审与阶段转段流程',
    flowNo: 'FLOW-IPD-102',
    category: '集成产品开发 (IPD)',
    flowLevel: 'L3',
    desc: '端到端研发转段核心流程，规范TR1-TR6各技术评审点输入、跨部门会签与IPMT投资决策委员会批准。',
    steps: [
      { title: '评审材料提报', role: '项目经理', desc: '系统架构设计及DFMEA文档提交', out: '技术规格全书' },
      { title: '跨部门同行评审', role: '技术专家', desc: '软件/硬件/测试团队协同会审', out: '交叉评审备忘录' },
      { title: '问题收敛整改', role: '研发工程师', desc: '高危致命缺陷整改及闭环确认', out: '缺陷清零报告' },
      { title: 'TR评审决策', role: '系统架构师', desc: '规格达成度评估与转段结论', out: 'TR评审决议', judge: true, kcp: true },
      { title: '基线版本发布', role: '配置管理员', desc: '代码基线固化与制品封板', out: '发布归档包' },
    ],
  },
  {
    id: 'tpl_dste_bp',
    title: '年度业务计划(BP)制定与目标解码流程',
    flowNo: 'FLOW-DSTE-003',
    category: '战略到执行 (DSTE)',
    flowLevel: 'L2',
    desc: '承接集团中长期SP战略，开展市场洞察、战略规划解码、重点工作分解与部门年度PBC责任书签署。',
    steps: [
      { title: '宏观战略洞察', role: '战略规划部', desc: '宏观环境及标杆竞品动态分析', out: '战略洞察报告' },
      { title: '业务策略制定', role: '业务群总裁', desc: '核心增长驱动因素与战略打法明确', out: '业务策略大纲' },
      { title: '关键任务解码', role: '运营总监', desc: '财务/客户/内部流程/学习成长解码', out: '平衡计分卡BSC' },
      { title: '资源预算平衡', role: '财务总监', desc: '预算资源分配与投资回报率测算', out: '财务预算决议', judge: true, kcp: true },
      { title: '组织绩效签约', role: '人事总监', desc: '高管年度PBC业绩责任书签约', out: '签约PBC档案' },
    ],
  },
  {
    id: 'tpl_scm_proc',
    title: '战略采购寻比价与框架合同会签流程',
    flowNo: 'FLOW-SCM-401',
    category: '供应链运营 (SCM)',
    flowLevel: 'L3',
    desc: '大额采购与核心物料供应商准入、多轮寻源比价、法务合规会签与采购委员会决策核准。',
    steps: [
      { title: '采购需求申请', role: '需求部门', desc: '提报采购清单、技术规格与交付周期', out: '采购立项单' },
      { title: '供应商寻比价', role: '采购工程师', desc: '邀请3家以上合规供应商竞标比价', out: '比价决策表' },
      { title: '成本合规审查', role: '审计合规部', desc: '价格公允性与商务条款审计', out: '审计核验单' },
      { title: '采购委员会终审', role: '供应链总裁', desc: '大额采购联合审议批准', out: '采购批准函', judge: true, kcp: true },
      { title: '框架协议签署', role: '法务主管', desc: '防篡改电子签章与合同归档', out: '生效采购合同' },
    ],
  },
  {
    id: 'tpl_fin_pay',
    title: '资金支出申请与大额款项支付审批流程',
    flowNo: 'FLOW-FIN-202',
    category: '财务管控 (FIN)',
    flowLevel: 'L3',
    desc: '企业各类经营费用报销、合同进度款与对外投资付款审批流程，强化内控与三单匹配验证。',
    steps: [
      { title: '付款申请提报', role: '经办人', desc: '提报发票、验收单与对账凭证', out: '付款申请单' },
      { title: '业务主管初审', role: '部门主管', desc: '审核款项发生真实性与业务必要性', out: '主管签字' },
      { title: '三单匹配稽核', role: '财务会计', desc: '发票真伪查验与预算台账扣减', out: '审核记账凭证' },
      { title: '大额支付审批', role: '财务总监', desc: '资金头寸调度与支付指令终审', out: '支付授权书', judge: true, kcp: true },
      { title: '网银直联划扣', role: '资金出纳', desc: '银企直联系统复核并划转款项', out: '银行电子回单' },
    ],
  },
];

export function buildFlowXmlTemplate(
  flowTitle: string,
  steps: { title: string; role: string; desc: string; out: string; kcp?: boolean; judge?: boolean }[]
): string {
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
  steps.forEach((st, i) => {
    const id = `node_step_${i + 1}`;
    const roleNodeId = `node_role_${i + 1}`;
    const x = 220 + i * 190;
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
      `        <UserObject id="${id}" label="${label}" dflowType="${dflowType}" name="${st.title}" roles="[&quot;${st.role}&quot;]" raciR="[&quot;${st.role}&quot;]" raciA="决策委员会" desc="${st.desc}" in="输入前置材料" out="${st.out}" execute="[&quot;ERP/PLM系统&quot;]" ${kcpAttr} kpi="按时达成率 98%" target="${i + 1}" timeType="天">`,
      `          <mxCell style="${style}" vertex="1" parent="1">`,
      `            <mxGeometry x="${x}" y="${y}" width="110" height="${st.judge ? 56 : 64}" as="geometry"/>`,
      `          </mxCell>`,
      `        </UserObject>`
    );

    lines.push(
      `        <mxCell id="edge_${prevId}_to_${id}" edge="1" parent="1" source="${prevId}" target="${id}">`,
      `          <mxGeometry relative="1" as="geometry"/>`,
      `        </mxCell>`
    );

    lines.push(
      `        <mxCell id="edge_role_${i + 1}" edge="1" parent="1" source="${roleNodeId}" target="${id}" style="dashed=1;strokeColor=#999999;">`,
      `          <mxGeometry relative="1" as="geometry"/>`,
      `        </mxCell>`
    );

    prevId = id;
  });

  const endId = 'node_end';
  const endX = 220 + steps.length * 190;
  lines.push(
    `        <UserObject id="${endId}" label="结束" dflowType="startEnd" name="结束">`,
    `          <mxCell style="rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#fef0f0;strokeColor=#f56c6c;" vertex="1" parent="1">`,
    `            <mxGeometry x="${endX}" y="180" width="90" height="44" as="geometry"/>`,
    `          </mxCell>`,
    `        </UserObject>`,
    `        <mxCell id="edge_${prevId}_to_${endId}" edge="1" parent="1" source="${prevId}" target="${endId}">`,
    `          <mxGeometry relative="1" as="geometry"/>`,
    `        </mxCell>`,
    '      </root>',
    '    </mxGraphModel>',
    '  </diagram>',
    '</mxfile>'
  );

  return lines.join('\n');
}

export const DEFAULT_ROOT_ARCH = {
  id: 'arch_root',
  parentId: '',
  label: '企业流程架构全景',
  level: 'L0',
  archNo: 'ARCH-CORP-000',
  businessScope: '全公司各业务领域及全职能中心主干流程全景',
  applicableScope: '集团总部、苏州全元数字科技有限公司、各中心事业部',
  adaptScope: '集团总部、苏州全元数字科技有限公司、各中心事业部',
  ownerName: '系统管理员 (E0004)',
  deptName: '运营管理部',
  flowDefine: '全元科技集团端到端主干流程架构',
  flowPurpose: '统领企业研发、营销、供应链全价值链',
  versionNo: 'V2',
  publishUserName: '系统管理员',
  publishTime: '2026-03-20 14:00:00',
  status: 'published',
};

export const FlowDesignView: React.FC<FlowDesignViewProps> = ({
  initialSelectedFlowId,
  currentUser,
  onEnterDesigner,
  onNavigate,
  onSelectNodeId,
  showToast = () => {},
}) => {
  const [archList, setArchList] = useState<any[]>([DEFAULT_ROOT_ARCH]);
  const [flowList, setFlowList] = useState<any[]>([]);
  const [treeCollapsed, setTreeCollapsed] = useState(false);
  const [treeWidth, setTreeWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('dflow_flow_design_tree_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 180 && val <= 700) return val;
      }
    } catch {}
    return 300;
  });
  const [isResizingTree, setIsResizingTree] = useState(false);

  const [selectedNode, setSelectedNode] = useState<{ type: 'arch' | 'flow'; id: string }>({
    type: 'arch',
    id: 'arch_root',
  });

  const [archTab, setArchTab] = useState<'arch' | 'ywjcst' | 'typecard' | 'zdwj' | 'fxhg' | 'xgfj'>('arch');
  const [flowTab, setFlowTab] = useState<
    'flow' | 'jbzl' | 'jxzb' | 'zdwj' | 'fxhg' | 'lcsy' | 'xgfj' | 'lcjdmx' | 'lcxzh'
  >('flow');

  const [currentFlow, setCurrentFlow] = useState<any | null>(null);
  const [currentArch, setCurrentArch] = useState<any | null>(DEFAULT_ROOT_ARCH);
  const [isEditingArchCard, setIsEditingArchCard] = useState(false);
  const [archCardDraft, setArchCardDraft] = useState<any | null>(null);
  const [archCardViewMode, setArchCardViewMode] = useState<'form' | 'table'>('form');
  const [isEditingYwjcst, setIsEditingYwjcst] = useState(false);
  const [ywjcstDraft, setYwjcstDraft] = useState<any | null>(null);
  const [dictBundle, setDictBundle] = useState<any>({});
  const [archRefs, setArchRefs] = useState<string[]>([]);
  const [flowRefs, setFlowRefs] = useState<string[]>([]);
  const [isEditingRefs, setIsEditingRefs] = useState(false);

  const [pickerModal, setPickerModal] = useState<{
    open: boolean;
    targetScope: 'arch' | 'flow';
    tab: 'zdwj' | 'fxhg' | 'xgfj';
  }>({ open: false, targetScope: 'arch', tab: 'zdwj' });

  const [uploadAttModal, setUploadAttModal] = useState<{
    open: boolean;
    targetScope: 'arch' | 'flow';
    attNo: string;
    label: string;
    category: string;
    fileSize: string;
    ownerName: string;
  }>({
    open: false,
    targetScope: 'flow',
    attNo: '',
    label: '',
    category: '流程操作指引',
    fileSize: '1.2 MB',
    ownerName: '系统管理员',
  });

  const uploadFileInputRef = useRef<HTMLInputElement>(null);

  const [termPickerModal, setTermPickerModal] = useState<{
    open: boolean;
    selectedIds: string[];
    search: string;
    category: string;
    loading: boolean;
    termsList: any[];
    categories: string[];
  }>({
    open: false,
    selectedIds: [],
    search: '',
    category: 'all',
    loading: false,
    termsList: [],
    categories: [],
  });

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [collapsedArchIds, setCollapsedArchIds] = useState<Record<string, boolean>>({});

  const [nameModal, setNameModal] = useState<{
    open: boolean;
    mode: 'createArch' | 'createFlow' | 'renameArch' | 'renameFlow';
    targetId: string;
    value: string;
  }>({ open: false, mode: 'createArch', targetId: '', value: '' });

  const [changeArchModal, setChangeArchModal] = useState<{
    open: boolean;
    targetType: 'arch' | 'flow';
    targetId: string;
    targetLabel: string;
    selectedParentId: string;
    submitting?: boolean;
    searchQuery?: string;
  }>({
    open: false,
    targetType: 'flow',
    targetId: '',
    targetLabel: '',
    selectedParentId: 'arch_root',
    submitting: false,
    searchQuery: '',
  });

  const [changeArchTreeCollapsed, setChangeArchTreeCollapsed] = useState<Record<string, boolean>>({});

  const [sortModal, setSortModal] = useState<{
    open: boolean;
    archId: string;
    archLabel: string;
    parentId: string;
    scope: 'children' | 'siblings';
    items: { id: string; label: string; type: 'arch' | 'flow'; code?: string }[];
  }>({
    open: false,
    archId: '',
    archLabel: '',
    parentId: '',
    scope: 'children',
    items: [],
  });

  const [draggingSortIdx, setDraggingSortIdx] = useState<number | null>(null);
  const [treeDragItem, setTreeDragItem] = useState<{
    id: string;
    type: 'arch' | 'flow';
    parentId: string;
  } | null>(null);
  const [treeDragOver, setTreeDragOver] = useState<{
    id: string;
    position: 'before' | 'inside' | 'after';
  } | null>(null);

  const [importFlowModal, setImportFlowModal] = useState<{
    open: boolean;
    parentId: string;
    parentLabel: string;
    label: string;
    flowNo: string;
    flowLevel: string;
    ownerName: string;
    versionNo: string;
    description: string;
    fileName: string;
    fileSize: string;
    xmlContent: string;
    importType: 'file' | 'template' | 'xml';
    selectedTemplateId: string;
    submitting: boolean;
  }>({
    open: false,
    parentId: 'arch_root',
    parentLabel: '',
    label: '',
    flowNo: '',
    flowLevel: 'L3',
    ownerName: '系统管理员',
    versionNo: 'V1.0',
    description: '',
    fileName: '',
    fileSize: '',
    xmlContent: '',
    importType: 'file',
    selectedTemplateId: '',
    submitting: false,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [historyModal, setHistoryModal] = useState<{
    open: boolean;
    title: string;
    rows: any[];
  }>({ open: false, title: '', rows: [] });

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    content: string;
    onConfirm: () => void;
  }>({ open: false, title: '', content: '', onConfirm: () => {} });

  const [publishAuditModal, setPublishAuditModal] = useState<{
    open: boolean;
    mode: 'audit' | 'direct';
    targetFlow: any;
  }>({
    open: false,
    mode: 'audit',
    targetFlow: null,
  });

  const [collaboratorModal, setCollaboratorModal] = useState<{
    open: boolean;
    targetType: 'arch' | 'flow';
    targetId: string;
    targetLabel: string;
    targetNo?: string;
    ownerName?: string;
    deptName?: string;
    archPath?: string;
    collaborators: CollaboratorItem[];
  }>({
    open: false,
    targetType: 'arch',
    targetId: '',
    targetLabel: '',
    collaborators: [],
  });

  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const previewBridgeRef = useRef<DrawioBridge | null>(null);

  const archPreviewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const archPreviewBridgeRef = useRef<DrawioBridge | null>(null);
  const [archIntegrationXml, setArchIntegrationXml] = useState<string>('');
  const [archIntegrationLoading, setArchIntegrationLoading] = useState(false);

  const handleStartResizeTree = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = treeWidth;
    setIsResizingTree(true);

    const onMove = (moveEvent: MouseEvent) => {
      const nextW = Math.min(650, Math.max(180, startW + (moveEvent.clientX - startX)));
      setTreeWidth(nextW);
    };

    const onUp = (upEvent: MouseEvent) => {
      setIsResizingTree(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const finalW = Math.min(650, Math.max(180, startW + (upEvent.clientX - startX)));
      try {
        localStorage.setItem('dflow_flow_design_tree_width', String(finalW));
      } catch {}
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleResetTreeWidth = () => {
    setTreeWidth(300);
    try {
      localStorage.setItem('dflow_flow_design_tree_width', '300');
    } catch {}
  };

  const prevReportedIdRef = useRef<string | null>(null);
  const externalPropFlowIdRef = useRef<string | null | undefined>(initialSelectedFlowId);

  const loadAllTreeData = async (targetId?: string | null) => {
    try {
      const [archRes, flowRes, dictRes] = await Promise.all([
        fetch('/api/flow/fulltypes').then((r) => r.json()),
        fetch('/api/flow/fullSimpleModels').then((r) => r.json()),
        fetch('/api/dict/bundle').then((r) => r.json()),
      ]);
      let archs = archRes?.data || [];
      const flows = flowRes?.data || [];

      // 确保新服务器全新部署时，默认显示根架构「企业流程架构全景」
      const hasRoot = archs.some((a: any) => !a.parentId || a.id === 'arch_root');
      if (!hasRoot) {
        archs = [DEFAULT_ROOT_ARCH, ...archs];
      } else {
        archs = archs.map((a: any) =>
          (!a.parentId || a.id === 'arch_root') && (!a.label || a.label === '企业流程架构' || a.label === '根架构' || a.label === 'ROOT')
            ? { ...a, label: '企业流程架构全景' }
            : a
        );
      }
      setArchList(archs);
      setFlowList(flows);
      if (dictRes?.data) setDictBundle(dictRes.data);

      const toSelect = targetId || initialSelectedFlowId || 'arch_root';
      if (toSelect) {
        if (toSelect === 'arch_root' || toSelect.startsWith('arch_')) {
          const foundArch = archs.find((a: any) => a.id === toSelect) || archs[0];
          if (foundArch) {
            setSelectedNode({ type: 'arch', id: foundArch.id });
            setCurrentArch(foundArch);
            setArchTab('arch');
            return;
          }
        }
        const foundFlow = flows.find((f: any) => f.id === toSelect);
        if (foundFlow) {
          setSelectedNode({ type: 'flow', id: foundFlow.id });
          setCurrentFlow(foundFlow);
          return;
        }
        const foundArch = archs.find((a: any) => a.id === toSelect);
        if (foundArch) {
          setSelectedNode({ type: 'arch', id: foundArch.id });
          setCurrentArch(foundArch);
          setArchTab('arch');
          return;
        }
      }
      if (archs.length > 0) {
        const rootArch = archs.find((a: any) => a.id === 'arch_root') || archs[0];
        setSelectedNode({ type: 'arch', id: rootArch.id });
        setCurrentArch(rootArch);
        setArchTab('arch');
      }
    } catch (err) {
      console.error('Failed to load tree data', err);
    }
  };

  // Only load all tree data ONCE on mount
  useEffect(() => {
    loadAllTreeData();
  }, []);

  // Handle external initialSelectedFlowId changes (e.g. navigation or returning from designer)
  useEffect(() => {
    if (initialSelectedFlowId && initialSelectedFlowId !== externalPropFlowIdRef.current) {
      externalPropFlowIdRef.current = initialSelectedFlowId;
      if (initialSelectedFlowId !== selectedNode.id) {
        if (initialSelectedFlowId === 'arch_root' || initialSelectedFlowId.startsWith('arch_')) {
          const foundArch = archList.find((a: any) => a.id === initialSelectedFlowId) || archList[0];
          if (foundArch) {
            setSelectedNode({ type: 'arch', id: foundArch.id });
            setCurrentArch(foundArch);
            setArchTab('arch');
            return;
          }
        }
        const foundFlow = flowList.find((f: any) => f.id === initialSelectedFlowId);
        if (foundFlow) {
          setSelectedNode({ type: 'flow', id: foundFlow.id });
          setCurrentFlow(foundFlow);
          return;
        }
        const foundArch = archList.find((a: any) => a.id === initialSelectedFlowId);
        if (foundArch) {
          setSelectedNode({ type: 'arch', id: foundArch.id });
          setCurrentArch(foundArch);
          setArchTab('arch');
          return;
        }
      }
    }
  }, [initialSelectedFlowId, flowList, archList, selectedNode.id]);

  // Report selected node ID upstream ONLY when it actually changes
  useEffect(() => {
    if (selectedNode.id && selectedNode.id !== prevReportedIdRef.current) {
      prevReportedIdRef.current = selectedNode.id;
      externalPropFlowIdRef.current = selectedNode.id;
      onSelectNodeId?.(selectedNode.id);
    }
  }, [selectedNode.id, onSelectNodeId]);

  // Load details of the active node without re-fetching trees
  useEffect(() => {
    setIsEditingArchCard(false);
    setArchCardDraft(null);
    setIsEditingYwjcst(false);
    setYwjcstDraft(null);
    setIsEditingRefs(false);

    if (selectedNode.type === 'flow') {
      fetch(`/api/flow/model/full?id=${selectedNode.id}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.data) setCurrentFlow(res.data);
        })
        .catch(() => {});
    } else {
      const found = archList.find((a) => a.id === selectedNode.id) || (selectedNode.id === 'arch_root' ? DEFAULT_ROOT_ARCH : null);
      if (found) setCurrentArch(found);
    }
  }, [selectedNode.type, selectedNode.id, archList]);

  useEffect(() => {
    setIsEditingRefs(false);
    if (selectedNode.type === 'arch' && ['zdwj', 'fxhg', 'xgfj'].includes(archTab)) {
      fetch(`/api/flow/type/refs?id=${selectedNode.id}&tab=${archTab}`)
        .then((r) => r.json())
        .then((res) => {
          setArchRefs(res.data || []);
        });
    }
  }, [selectedNode.type, selectedNode.id, archTab]);

  useEffect(() => {
    setIsEditingRefs(false);
    if (selectedNode.type === 'flow' && ['zdwj', 'fxhg', 'lcsy', 'xgfj'].includes(flowTab)) {
      fetch(`/api/flow/model/refs?id=${selectedNode.id}&tab=${flowTab}`)
        .then((r) => r.json())
        .then((res) => {
          setFlowRefs(res.data || []);
        });
    }
  }, [selectedNode.type, selectedNode.id, flowTab]);

  const resolveBoundItems = (tab: 'zdwj' | 'fxhg' | 'xgfj' | 'lcsy', refIds: string[]) => {
    const allPool =
      tab === 'fxhg'
        ? dictBundle.risk || []
        : tab === 'lcsy'
        ? dictBundle.terms || []
        : tab === 'xgfj'
        ? [...(dictBundle.attachments || []), ...(dictBundle.sysDoc || [])]
        : dictBundle.sysDoc || [];
    return refIds
      .map((id) => allPool.find((x: any) => String(x.id) === String(id) || String(x.termId) === String(id)))
      .filter(Boolean);
  };

  const handleOpenTermPicker = async () => {
    setTermPickerModal((prev) => ({
      ...prev,
      open: true,
      selectedIds: flowRefs.map((id) => String(id)),
      loading: true,
      search: '',
      category: 'all',
    }));
    try {
      const res = await fetch('/api/flow/terms?pageSize=200').then((r) => r.json());
      if (res.status === 1) {
        setTermPickerModal((prev) => ({
          ...prev,
          termsList: res.rows || [],
          categories: res.categories || [],
          loading: false,
        }));
      }
    } catch {
      setTermPickerModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleConfirmUploadAttachment = async () => {
    if (!uploadAttModal.label.trim()) {
      showToast('请输入附件文件名称', 'warning');
      return;
    }
    const flowId = selectedNode.type === 'flow' ? currentFlow?.id || selectedNode.id : undefined;
    try {
      const res = await fetch('/api/flow/model/upload-attachment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowId,
          attNo: uploadAttModal.attNo || `FJ-FLOW-${Math.floor(1000 + Math.random() * 9000)}`,
          label: uploadAttModal.label.trim(),
          category: uploadAttModal.category,
          fileSize: uploadAttModal.fileSize || '1.5 MB',
          ownerName: uploadAttModal.ownerName || currentFlow?.ownerName || '系统管理员',
        }),
      }).then((r) => r.json());

      if (res.status === 1) {
        if (res.attachments) {
          setDictBundle((prev: any) => ({ ...prev, attachments: res.attachments }));
        }
        if (flowId && res.refIds) {
          setFlowRefs(res.refIds);
        }
        setUploadAttModal((prev) => ({ ...prev, open: false }));
        showToast('附件已成功上传并关联至当前流程！', 'success');
      } else {
        showToast(res.info || '上传附件失败', 'error');
      }
    } catch {
      showToast('上传附件失败，请重试', 'error');
    }
  };

  const handleNativeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const randomNo = `FJ-FLOW-${Math.floor(1000 + Math.random() * 9000)}`;
    setUploadAttModal({
      open: true,
      targetScope: selectedNode.type === 'flow' ? 'flow' : 'arch',
      attNo: randomNo,
      label: file.name,
      category: '流程操作指引',
      fileSize: sizeStr,
      ownerName: currentFlow?.ownerName || '系统管理员',
    });
    e.target.value = '';
  };

  const handleSaveRefs = async (
    scope: 'arch' | 'flow',
    tab: 'zdwj' | 'fxhg' | 'xgfj' | 'lcsy',
    nextRefIds: string[]
  ) => {
    const url = scope === 'arch' ? '/api/flow/type/refs' : '/api/flow/model/refs';
    const targetId = scope === 'arch' ? currentArch?.id || selectedNode.id : currentFlow?.id || selectedNode.id;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: targetId, tab, refIds: nextRefIds }),
    });
    if (scope === 'arch') {
      setArchRefs(nextRefIds);
    } else {
      setFlowRefs(nextRefIds);
    }
  };

  useEffect(() => {
    if (selectedNode.type !== 'flow' || flowTab !== 'flow' || !currentFlow?.xml) return;
    const bridge = new DrawioBridge({
      onReady: () => {
        bridge.loadXml(currentFlow.xml, currentFlow.label);
      },
      onExport: ({ format, data }) => {
        if (format === 'png' && data) {
          const a = document.createElement('a');
          a.href = data;
          a.download = `${currentFlow.label || '流程图'}.png`;
          a.click();
          showToast('已导出 PNG 图表', 'success');
        }
      },
    });
    previewBridgeRef.current = bridge;
    if (previewIframeRef.current) {
      bridge.attachIframe(previewIframeRef.current);
      setTimeout(() => {
        bridge.loadXml(currentFlow.xml, currentFlow.label);
      }, 160);
    }
    return () => {
      bridge.destroy();
    };
  }, [selectedNode.type, selectedNode.id, flowTab, currentFlow?.xml]);

  const lastLoadedArchXmlIdRef = useRef<string | null>(null);

  const fetchAndLoadArchIntegrationDiagram = async (archId: string, archLabel: string, force = false) => {
    if (!force && lastLoadedArchXmlIdRef.current === archId && archIntegrationXml) {
      if (archPreviewBridgeRef.current) {
        archPreviewBridgeRef.current.loadXml(archIntegrationXml, `${archLabel} - 业务集成视图`);
      }
      return;
    }
    setArchIntegrationLoading(true);
    try {
      const res = await fetch(`/api/flow/${archId}/xml`).then((r) => r.json());
      const xml = res.data?.xml || '';
      setArchIntegrationXml(xml);
      lastLoadedArchXmlIdRef.current = archId;

      if (!archPreviewBridgeRef.current) {
        const bridge = new DrawioBridge({
          onReady: () => {
            bridge.loadXml(xml, `${archLabel} - 业务集成视图`);
          },
          onExport: ({ format, data }) => {
            if (format === 'png' && data) {
              const a = document.createElement('a');
              a.href = data;
              a.download = `${archLabel || '流程架构'}-业务集成视图.png`;
              a.click();
              showToast('已导出 PNG 图表', 'success');
            }
          },
        });
        archPreviewBridgeRef.current = bridge;
        if (archPreviewIframeRef.current) {
          bridge.attachIframe(archPreviewIframeRef.current);
          setTimeout(() => {
            bridge.loadXml(xml, `${archLabel} - 业务集成视图`);
          }, 180);
        }
      } else {
        archPreviewBridgeRef.current.loadXml(xml, `${archLabel} - 业务集成视图`);
      }
    } catch {
      //
    } finally {
      setArchIntegrationLoading(false);
    }
  };

  useEffect(() => {
    if (selectedNode.type !== 'arch' || archTab !== 'ywjcst' || !currentArch?.id) return;
    fetchAndLoadArchIntegrationDiagram(currentArch.id, currentArch.label);
  }, [selectedNode.type, selectedNode.id, archTab, currentArch?.id]);

  useEffect(() => {
    return () => {
      archPreviewBridgeRef.current?.destroy();
      archPreviewBridgeRef.current = null;
      lastLoadedArchXmlIdRef.current = null;
    };
  }, []);

  const handleSaveNameModal = async () => {
    const val = nameModal.value.trim();
    if (!val) {
      showToast('请输入名称', 'warning');
      return;
    }
    if (nameModal.mode === 'createArch') {
      await fetch('/api/flow/type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: nameModal.targetId, label: val }),
      });
      showToast('已新建架构节点', 'success');
    } else if (nameModal.mode === 'createFlow') {
      const res = await fetch('/api/flow/model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: nameModal.targetId, label: val }),
      }).then((r) => r.json());
      showToast('已新建流程', 'success');
      if (res.data?.id) {
        await loadAllTreeData();
        setSelectedNode({ type: 'flow', id: res.data.id });
        setNameModal({ ...nameModal, open: false });
        return;
      }
    } else if (nameModal.mode === 'renameArch') {
      await fetch('/api/flow/type', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nameModal.targetId, label: val }),
      });
      showToast('已重命名架构', 'success');
    } else if (nameModal.mode === 'renameFlow') {
      await fetch('/api/flow/model', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nameModal.targetId, label: val }),
      });
      showToast('已重命名流程', 'success');
    }
    setNameModal({ ...nameModal, open: false });
    loadAllTreeData();
  };

  const getArchFullPath = (archId: string): string => {
    const crumbs: string[] = [];
    let curId: string | null = archId;
    while (curId) {
      const found = archList.find((a) => a.id === curId);
      if (found) {
        crumbs.unshift(found.label);
        curId = found.parentId || null;
      } else {
        break;
      }
    }
    return crumbs.length > 0 ? crumbs.join(' > ') : '企业流程架构全景';
  };

  const handleSelectImportTemplate = (templateId: string) => {
    const tpl = PRESET_FLOW_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const xml = buildFlowXmlTemplate(tpl.title, tpl.steps);
    setImportFlowModal((prev) => ({
      ...prev,
      selectedTemplateId: templateId,
      label: tpl.title,
      flowNo: tpl.flowNo,
      flowLevel: tpl.flowLevel,
      description: tpl.desc,
      xmlContent: xml,
      fileName: `${tpl.title}.drawio`,
      fileSize: '标准业务模板',
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const sizeStr = (file.size / 1024).toFixed(1) + ' KB';

      setImportFlowModal((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: sizeStr,
        xmlContent: content,
        label: prev.label && prev.label !== '新建流程' ? prev.label : cleanName,
      }));
      showToast(`已成功读取流程文件【${file.name}】（${sizeStr}）`, 'success');
    };
    reader.onerror = () => {
      showToast('读取流程文件失败，请重试', 'error');
    };
    reader.readAsText(file);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const sizeStr = (file.size / 1024).toFixed(1) + ' KB';

      setImportFlowModal((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: sizeStr,
        xmlContent: content,
        label: prev.label && prev.label !== '新建流程' ? prev.label : cleanName,
      }));
      showToast(`已拖拽载入流程文件【${file.name}】（${sizeStr}）`, 'success');
    };
    reader.readAsText(file);
  };

  const handleExecuteImportFlow = async () => {
    const { parentId, label, flowNo, xmlContent, flowLevel, ownerName, versionNo, description, selectedTemplateId } = importFlowModal;
    if (!label.trim()) {
      showToast('请输入流程名称', 'warning');
      return;
    }
    if (!flowNo.trim()) {
      showToast('请输入流程编号', 'warning');
      return;
    }

    setImportFlowModal((prev) => ({ ...prev, submitting: true }));
    try {
      let finalXml = xmlContent;
      if (!finalXml && selectedTemplateId) {
        const tpl = PRESET_FLOW_TEMPLATES.find((t) => t.id === selectedTemplateId);
        if (tpl) finalXml = buildFlowXmlTemplate(label.trim(), tpl.steps);
      }
      if (!finalXml) {
        finalXml = buildFlowXmlTemplate(label.trim(), [
          { title: '阶段启动', role: '业务员', desc: '发起流程', out: '申请表' },
          { title: '业务审查', role: '专业工程师', desc: '完成技术评审', out: '评审记录' },
          { title: '终审决策', role: '负责人', desc: '完成审批', out: '批准书', judge: true, kcp: true },
        ]);
      }

      const res = await fetch('/api/flow/model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId,
          label: label.trim(),
          flowNo: flowNo.trim(),
          flowLevel: flowLevel || 'L3',
          ownerName: ownerName || '系统管理员',
          versionNo: versionNo || 'V1',
          description: description || '',
          xml: finalXml,
        }),
      }).then((r) => r.json());

      if (res.status === 1 && res.data) {
        showToast(`已成功导入流程【${label.trim()}】`, 'success');
        setImportFlowModal((prev) => ({ ...prev, open: false, submitting: false }));
        await loadAllTreeData();
        setSelectedNode({ type: 'flow', id: res.data.id });
      } else {
        showToast(res.info || '导入流程失败', 'error');
        setImportFlowModal((prev) => ({ ...prev, submitting: false }));
      }
    } catch {
      showToast('导入流程请求异常', 'error');
      setImportFlowModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const getDisabledArchIdsForChange = (targetType: 'arch' | 'flow', targetId: string): Set<string> => {
    const disabled = new Set<string>();
    if (targetType !== 'arch' || !targetId) return disabled;
    disabled.add(targetId);
    const queue = [targetId];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      const children = archList.filter((a) => a.parentId === cur);
      for (const child of children) {
        if (!disabled.has(child.id)) {
          disabled.add(child.id);
          queue.push(child.id);
        }
      }
    }
    return disabled;
  };

  const handleSaveChangeArch = async () => {
    if (!changeArchModal.selectedParentId) {
      showToast('请选择目标上级架构', 'warning');
      return;
    }
    setChangeArchModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await fetch('/api/flow/changeArch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: changeArchModal.targetType,
          targetId: changeArchModal.targetId,
          newParentId: changeArchModal.selectedParentId,
        }),
      }).then((r) => r.json());

      if (res.status === 1) {
        const targetParent = archList.find((a) => a.id === changeArchModal.selectedParentId);
        const parentName = targetParent ? targetParent.label : '企业流程架构全景';
        showToast(
          `已成功将${changeArchModal.targetType === 'arch' ? '流程架构' : '业务流程'}【${changeArchModal.targetLabel}】归属变更至【${parentName}】`,
          'success'
        );
        const movedId = changeArchModal.targetId;
        const movedType = changeArchModal.targetType;
        const targetParentId = changeArchModal.selectedParentId;
        setChangeArchModal({
          open: false,
          targetType: 'flow',
          targetId: '',
          targetLabel: '',
          selectedParentId: 'arch_root',
          submitting: false,
          searchQuery: '',
        });
        if (targetParentId) {
          setCollapsedArchIds((prev) => ({
            ...prev,
            [targetParentId]: false,
          }));
        }
        await loadAllTreeData(movedId);
        setSelectedNode({ type: movedType, id: movedId });
      } else {
        showToast(res.info || '变更架构失败', 'error');
        setChangeArchModal((prev) => ({ ...prev, submitting: false }));
      }
    } catch (err) {
      console.error('Error changing architecture', err);
      showToast('变更架构操作异常', 'error');
      setChangeArchModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handlePublishArch = (targetArch?: any) => {
    const isEvent = targetArch && (targetArch.nativeEvent !== undefined || typeof targetArch.preventDefault === 'function');
    const archObj = (!isEvent && targetArch) ? targetArch : currentArch;
    if (!archObj) return;

    const matchedArch = archList.find((a: any) => String(a.id) === String(archObj.id));
    const archName = archObj.label || archObj.name || archObj.archName || matchedArch?.label || matchedArch?.name || '当前架构';
    const archId = archObj.id || matchedArch?.id;
    if (!archId) return;

    setConfirmModal({
      open: true,
      title: '确认发布架构',
      content: `确定要发布【${archName}】吗？将生成全新架构版本。`,
      onConfirm: async () => {
        const res = await fetch('/api/flow/type/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: archId }),
        }).then((r) => r.json());
        setConfirmModal((prev) => ({ ...prev, open: false }));
        showToast(`发布成功，当前版本: ${res.data?.versionNo || 'V2'}`, 'success');
        loadAllTreeData();
      },
    });
  };

  const handlePublishFlow = (audit: boolean, targetFlow?: any) => {
    const isEvent = targetFlow && (targetFlow.nativeEvent !== undefined || typeof targetFlow.preventDefault === 'function');
    const flowObj = (!isEvent && targetFlow) ? targetFlow : currentFlow;
    if (!flowObj) return;

    const matchedFlow = flowList.find((f: any) => String(f.id) === String(flowObj.id));
    const targetObj = matchedFlow || flowObj;

    setPublishAuditModal({
      open: true,
      mode: audit ? 'audit' : 'direct',
      targetFlow: targetObj,
    });
  };

  const handleOpenHistory = async (isArch: boolean, targetId?: string) => {
    const id = targetId || (isArch ? currentArch?.id : currentFlow?.id);
    const url = isArch
      ? `/api/flow/type/publishVersionHistories?id=${id}`
      : `/api/flow/model/publishVersionHistories?id=${id}`;
    const res = await fetch(url).then((r) => r.json());
    setHistoryModal({
      open: true,
      title: isArch ? '架构版本发布历史' : '流程版本发布历史',
      rows: res.data || [],
    });
  };

  const handleCopyFlow = async (flow: any) => {
    const res = await fetch('/api/flow/model/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: flow.id }),
    }).then((r) => r.json());
    if (res.status === 1 && res.data) {
      await loadAllTreeData();
      setSelectedNode({ type: 'flow', id: res.data.id });
      showToast(`已成功复制流程【${res.data.label}】`, 'success');
    } else {
      showToast(res.info || '复制失败', 'error');
    }
  };

  const buildSortItems = (parentId: string, scope: 'children' | 'siblings', selfArchId: string) => {
    if (scope === 'siblings') {
      const selfArch = archList.find((a) => a.id === selfArchId);
      const pid = selfArch?.parentId || 'arch_root';
      const siblingFlows = flowList.filter((f) => f.parentId === pid);
      const siblingArchs = archList.filter((a) => a.parentId === pid);
      return [
        ...siblingFlows.map((f) => ({
          id: f.id,
          label: f.label,
          type: 'flow' as const,
          code: f.flowNo,
          sortOrder: f.sortOrder,
        })),
        ...siblingArchs.map((a) => ({
          id: a.id,
          label: a.label,
          type: 'arch' as const,
          code: a.archNo || a.level,
          sortOrder: a.sortOrder,
        })),
      ].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
    } else {
      const childFlows = flowList.filter((f) => f.parentId === parentId);
      const childArchs = archList.filter((a) => a.parentId === parentId);
      return [
        ...childFlows.map((f) => ({
          id: f.id,
          label: f.label,
          type: 'flow' as const,
          code: f.flowNo,
          sortOrder: f.sortOrder,
        })),
        ...childArchs.map((a) => ({
          id: a.id,
          label: a.label,
          type: 'arch' as const,
          code: a.archNo || a.level,
          sortOrder: a.sortOrder,
        })),
      ].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
    }
  };

  const handleOpenSortModal = (arch: any) => {
    const childItems = buildSortItems(arch.id, 'children', arch.id);
    const siblingItems = buildSortItems(arch.id, 'siblings', arch.id);
    const defaultScope: 'children' | 'siblings' =
      childItems.length > 1 || !arch.parentId ? 'children' : siblingItems.length > 1 ? 'siblings' : 'children';
    const initialItems = defaultScope === 'children' ? childItems : siblingItems;
    setSortModal({
      open: true,
      archId: arch.id,
      archLabel: arch.label,
      parentId: arch.parentId || 'arch_root',
      scope: defaultScope,
      items: initialItems,
    });
    setDraggingSortIdx(null);
  };

  useEffect(() => {
    if (draggingSortIdx === null) return;
    const handleGlobalMouseUp = () => {
      setDraggingSortIdx(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [draggingSortIdx]);

  const handleSortSwap = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
    setSortModal((prev) => {
      if (fromIdx >= prev.items.length || toIdx >= prev.items.length) return prev;
      const next = [...prev.items];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return { ...prev, items: next };
    });
    setDraggingSortIdx(toIdx);
  };

  const handleSaveSortModal = async () => {
    await fetch('/api/flow/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderedItems: sortModal.items.map((item) => ({ id: item.id, type: item.type })),
      }),
    });
    setSortModal((prev) => ({ ...prev, open: false }));
    showToast('已保存排序更新', 'success');
    await loadAllTreeData();
  };

  const handleTreeNodeDrop = async (
    targetId: string,
    targetParentId: string,
    position: 'before' | 'inside' | 'after',
    targetType: 'arch' | 'flow'
  ) => {
    if (!treeDragItem || treeDragItem.id === targetId) {
      setTreeDragItem(null);
      setTreeDragOver(null);
      return;
    }

    const currentDrag = treeDragItem;
    setTreeDragItem(null);
    setTreeDragOver(null);

    // 循环引用检测：架构不能移入其自身或其下级子架构
    if (currentDrag.type === 'arch') {
      if (position === 'inside' && isDescendantArch(currentDrag.id, targetId)) {
        showToast('无法将架构移动到其自身或下级子孙架构内', 'warning');
        return;
      }
      if (position !== 'inside' && isDescendantArch(currentDrag.id, targetParentId)) {
        showToast('无法将架构移动到其自身或下级子孙架构内', 'warning');
        return;
      }
    }

    try {
      const res = await fetch('/api/flow/moveNode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dragId: currentDrag.id,
          dragType: currentDrag.type,
          targetId,
          targetType,
          position,
        }),
      }).then((r) => r.json());

      if (res.status === 1) {
        const destParentId = position === 'inside' ? targetId : targetParentId;
        if (destParentId && destParentId !== 'arch_root') {
          // 自动展开目标父架构，方便查看新位置
          setCollapsedArchIds((prev) => ({ ...prev, [destParentId]: false }));
        }
        showToast(
          position === 'inside'
            ? '已跨层级移入目标架构内'
            : currentDrag.parentId !== targetParentId
            ? '已成功跨层级移动节点'
            : '已调整节点上下位置',
          'success'
        );
        await loadAllTreeData(currentDrag.id);
      } else {
        showToast(res.info || '移动节点失败', 'error');
      }
    } catch (err) {
      console.error('Failed to move tree node', err);
      showToast('移动节点操作异常', 'error');
    }
  };

  const handleDeleteNode = (isArch: boolean, id: string, label: string) => {
    setConfirmModal({
      open: true,
      title: '确认删除',
      content: `确定要删除${isArch ? '架构节点' : '流程'}【${label}】吗？删除后不可恢复。`,
      onConfirm: async () => {
        await fetch(`/api/flow/${isArch ? 'type' : 'model'}?id=${id}`, { method: 'DELETE' });
        setConfirmModal((prev) => ({ ...prev, open: false }));
        showToast('删除成功', 'success');
        setSelectedNode({ type: 'arch', id: 'arch_root' });
        loadAllTreeData();
      },
    });
  };

  const handleSaveFlowMeta = async (updatedData?: any) => {
    const toSave = updatedData || currentFlow;
    if (!toSave) return;
    try {
      await fetch('/api/flow/model/full', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      });
      setCurrentFlow(toSave);
      setFlowList((prev) =>
        prev.map((f) => (f.id === toSave.id ? { ...f, ...toSave } : f))
      );
      showToast('流程基本资料保存成功', 'success');
      loadAllTreeData(toSave.id);
    } catch {
      setCurrentFlow(toSave);
      showToast('流程基本资料保存成功', 'success');
    }
  };

  const handleSaveArchCard = async (updatedData?: any) => {
    const toSave = updatedData || currentArch;
    if (!toSave) return;
    try {
      const res = await fetch('/api/flow/type/full', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      }).then((r) => r.json());
      if (res.data) {
        setCurrentArch(res.data);
        setArchList((prev) =>
          prev.map((a) => (a.id === res.data.id ? { ...a, ...res.data } : a))
        );
      } else {
        setCurrentArch(toSave);
        setArchList((prev) =>
          prev.map((a) => (a.id === toSave.id ? { ...a, ...toSave } : a))
        );
      }
      showToast('架构卡片保存成功', 'success');
      loadAllTreeData(toSave.id);
    } catch {
      setCurrentArch(toSave);
      showToast('架构卡片保存成功', 'success');
    }
  };

  const handleOpenCollaboratorModal = (targetType: 'arch' | 'flow', node: any) => {
    if (!node) return;
    const parentArch = node.parentId && Array.isArray(archList) ? archList.find((a) => a.id === node.parentId) : null;
    const pathText = node.archName || (parentArch?.label ? `${parentArch.label} / ${node.label || ''}` : node.label || '');
    setCollaboratorModal({
      open: true,
      targetType,
      targetId: node.id || '',
      targetLabel: node.label || '未命名',
      targetNo: node.flowNo || node.archNo || (targetType === 'arch' ? 'ARCH-' + (node.id || 'N') : 'FLOW-' + (node.id || 'N')),
      ownerName: node.ownerName || (targetType === 'arch' ? '系统管理员' : '流程管理员'),
      deptName: node.deptName || (targetType === 'arch' ? '战略规划部' : '流程管理部'),
      archPath: pathText,
      collaborators: Array.isArray(node.collaborators) ? node.collaborators : [],
    });
  };

  const handleSaveCollaborators = (newCollaborators: CollaboratorItem[]) => {
    if (collaboratorModal.targetType === 'arch') {
      setArchList((prev) =>
        prev.map((a) => (a.id === collaboratorModal.targetId ? { ...a, collaborators: newCollaborators } : a))
      );
      if (currentArch?.id === collaboratorModal.targetId) {
        setCurrentArch((prev: any) => (prev ? { ...prev, collaborators: newCollaborators } : prev));
      }
    } else {
      setFlowList((prev) =>
        prev.map((f) => (f.id === collaboratorModal.targetId ? { ...f, collaborators: newCollaborators } : f))
      );
      if (currentFlow?.id === collaboratorModal.targetId) {
        setCurrentFlow((prev: any) => (prev ? { ...prev, collaborators: newCollaborators } : prev));
      }
    }
  };

  const parsedNodeRows = currentFlow?.xml ? parseFlowNodes(currentFlow.xml) : [];

  const isDescendantArch = (archId: string, candidateParentId: string): boolean => {
    if (!archId || !candidateParentId) return false;
    if (archId === candidateParentId) return true;
    let cur = archList.find((a) => a.id === candidateParentId);
    const visited = new Set<string>();
    while (cur && cur.parentId && cur.id !== 'arch_root') {
      if (visited.has(cur.id)) break;
      visited.add(cur.id);
      if (cur.parentId === archId || cur.id === archId) return true;
      cur = archList.find((a) => a.id === cur.parentId);
    }
    return false;
  };

  // 获取架构面包屑路径，支持 L1-L6 级递归追溯
  const getArchBreadcrumbs = (archId: string): any[] => {
    const crumbs: any[] = [];
    let curId: string | null = archId;
    const visited = new Set<string>();
    while (curId) {
      if (visited.has(curId)) break;
      visited.add(curId);
      const found = archList.find((a) => a.id === curId);
      if (found) {
        crumbs.unshift(found);
        curId = found.parentId || null;
      } else {
        break;
      }
    }
    return crumbs;
  };

  const renderArchNode = (arch: any, depth = 0) => {
    const childArchs = archList.filter((a) => a.parentId === arch.id);
    const childFlows = flowList.filter((f) => f.parentId === arch.id);
    const unifiedChildren = [
      ...childFlows.map((f) => ({ ...f, _nodeType: 'flow' as const })),
      ...childArchs.map((a) => ({ ...a, _nodeType: 'arch' as const })),
    ].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));

    const count = unifiedChildren.length;
    const isSel = selectedNode.type === 'arch' && selectedNode.id === arch.id;
    const isCollapsed = !!collapsedArchIds[arch.id];
    const isDragSelf = treeDragItem?.id === arch.id;
    const isDragOverBefore = treeDragOver?.id === arch.id && treeDragOver?.position === 'before';
    const isDragOverAfter = treeDragOver?.id === arch.id && treeDragOver?.position === 'after';
    const isDragOverInside = treeDragOver?.id === arch.id && treeDragOver?.position === 'inside';

    return (
      <div key={arch.id} className="select-none">
        <div
          draggable={!!arch.parentId}
          onDragStart={(e) => {
            if (!arch.parentId) return;
            e.stopPropagation();
            setTreeDragItem({ id: arch.id, type: 'arch', parentId: arch.parentId });
            e.dataTransfer.setData('text/plain', JSON.stringify({ id: arch.id, type: 'arch', parentId: arch.parentId }));
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => {
            if (!treeDragItem) return;
            if (treeDragItem.id === arch.id) return;
            if (treeDragItem.type === 'arch' && isDescendantArch(treeDragItem.id, arch.id)) {
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';

            const rect = e.currentTarget.getBoundingClientRect();
            const offsetY = e.clientY - rect.top;
            const height = rect.height;

            let pos: 'before' | 'inside' | 'after';
            if (!arch.parentId) {
              pos = 'inside';
            } else if (offsetY < height * 0.25) {
              pos = 'before';
            } else if (offsetY > height * 0.75) {
              pos = 'after';
            } else {
              pos = 'inside';
            }
            setTreeDragOver({ id: arch.id, position: pos });
          }}
          onDragLeave={(e) => {
            e.stopPropagation();
            if (treeDragOver?.id === arch.id) setTreeDragOver(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (treeDragOver && treeDragItem) {
              handleTreeNodeDrop(arch.id, arch.parentId || 'arch_root', treeDragOver.position, 'arch');
            }
          }}
          onDragEnd={() => {
            setTreeDragItem(null);
            setTreeDragOver(null);
          }}
          onClick={() => {
            setSelectedNode({ type: 'arch', id: arch.id });
            setArchTab('arch');
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpenMenuId(arch.id);
          }}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
          className={`group flex items-center justify-between pr-2 py-1.5 rounded text-xs cursor-pointer transition-all relative ${
            isDragSelf ? 'opacity-40 bg-[#f0f2f5]' : ''
          } ${
            isDragOverInside
              ? 'bg-[#ecf5ff] ring-2 ring-[#409eff] ring-inset font-medium text-[#409eff]'
              : isSel
              ? 'bg-[#ecf5ff] text-[#409eff] font-medium'
              : 'text-[#303133] hover:bg-[#f5f7fa]'
          }`}
        >
          {isDragOverBefore && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#409eff] z-20 flex items-center pointer-events-none">
              <div className="w-1.5 h-1.5 rounded-full bg-[#409eff] -ml-0.5 shadow-xs" />
            </div>
          )}
          {isDragOverAfter && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#409eff] z-20 flex items-center pointer-events-none">
              <div className="w-1.5 h-1.5 rounded-full bg-[#409eff] -ml-0.5 shadow-xs" />
            </div>
          )}
          <div className="flex items-center gap-1 min-w-0">
            {count > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCollapsedArchIds((prev) => ({ ...prev, [arch.id]: !prev[arch.id] }));
                }}
                className="w-4 h-4 flex items-center justify-center text-[#909399] hover:text-[#409eff] shrink-0 cursor-pointer"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <Network className="w-3.5 h-3.5 text-[#409eff] shrink-0" />
            <span className="truncate">{arch.label}</span>
            <span className="text-[#409eff] font-mono-tabular shrink-0 ml-0.5">({count})</span>
            {isDragOverInside && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#409eff] text-white font-medium shrink-0 ml-1 shadow-2xs animate-pulse">
                移入此架构
              </span>
            )}
            {arch.collaborators && arch.collaborators.length > 0 && (
              <span
                title={`已有 ${arch.collaborators.length} 位协作者协助工作`}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff] shrink-0 ml-1"
              >
                <Users className="w-2.5 h-2.5" />
                <span>{arch.collaborators.length}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 ml-1 ${
                isSel ? 'bg-[#409eff] text-white font-bold' : 'bg-[#f0f2f5] text-[#909399]'
              }`}
            >
              {resolveArchLevel(arch, archList)}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === arch.id ? null : arch.id);
              }}
              className={`${
                openMenuId === arch.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              } p-1 rounded hover:bg-white text-[#909399] hover:text-[#409eff] cursor-pointer shrink-0`}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {openMenuId === arch.id && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-2 top-7 w-32 bg-white rounded border border-[#ebeef5] shadow-lg py-1.5 z-40 text-xs text-[#303133]"
            >
              <button
                onClick={() => {
                  setOpenMenuId(null);
                  setNameModal({ open: true, mode: 'createArch', targetId: arch.id, value: '' });
                }}
                className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer"
              >
                新建子架构
              </button>
              <button
                onClick={() => {
                  setOpenMenuId(null);
                  setNameModal({ open: true, mode: 'renameArch', targetId: arch.id, value: arch.label });
                }}
                className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer"
              >
                重命名
              </button>
              <button
                onClick={() => {
                  setOpenMenuId(null);
                  setChangeArchModal({
                    open: true,
                    targetType: 'arch',
                    targetId: arch.id,
                    targetLabel: arch.label,
                    selectedParentId: arch.parentId || 'arch_root',
                  });
                }}
                className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer"
              >
                变更架构
              </button>
              <button
                onClick={() => {
                  setOpenMenuId(null);
                  handleOpenSortModal(arch);
                }}
                className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer"
              >
                排序
              </button>
              <button
                onClick={() => {
                  setOpenMenuId(null);
                  setNameModal({ open: true, mode: 'createFlow', targetId: arch.id, value: '' });
                }}
                className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer"
              >
                新建流程
              </button>
              <button
                onClick={() => {
                  setOpenMenuId(null);
                  setImportFlowModal({
                    open: true,
                    parentId: arch.id,
                    parentLabel: arch.label,
                    label: '',
                    flowNo: 'FLOW-' + Math.floor(1000 + Math.random() * 9000),
                    flowLevel: arch.level && arch.level.startsWith('L') ? `L${Math.min(6, parseInt(arch.level.slice(1), 10) + 1)}` : 'L3',
                    ownerName: '系统管理员',
                    versionNo: 'V1.0',
                    description: '',
                    fileName: '',
                    fileSize: '',
                    xmlContent: '',
                    importType: 'file',
                    selectedTemplateId: '',
                    submitting: false,
                  });
                }}
                className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-[#409eff]" />
                <span>导入流程</span>
              </button>
              <button
                onClick={() => {
                  setOpenMenuId(null);
                  handleOpenCollaboratorModal('arch', arch);
                }}
                className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer flex items-center justify-between"
              >
                <span>协作者</span>
                {arch.collaborators && arch.collaborators.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#ecf5ff] text-[#409eff]">
                    {arch.collaborators.length}
                  </span>
                )}
              </button>
              {Boolean(arch.parentId) && (
                <button
                  onClick={() => {
                    setOpenMenuId(null);
                    setChangeArchModal({
                      open: true,
                      targetType: 'arch',
                      targetId: arch.id,
                      targetLabel: arch.label,
                      selectedParentId: arch.parentId || 'arch_root',
                      submitting: false,
                      searchQuery: '',
                    });
                  }}
                  className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer"
                >
                  变更架构
                </button>
              )}
              <button
                onClick={() => {
                  setOpenMenuId(null);
                  handlePublishArch(arch);
                }}
                className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer"
              >
                发布架构
              </button>
              <button
                onClick={() => {
                  setOpenMenuId(null);
                  handleOpenHistory(true, arch.id);
                }}
                className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer"
              >
                发布历史
              </button>
              <button
                onClick={() => {
                  setOpenMenuId(null);
                  if (!arch.parentId) {
                    showToast('根架构不允许删除', 'warning');
                    return;
                  }
                  handleDeleteNode(true, arch.id, arch.label);
                }}
                className="w-full px-3.5 py-1.5 text-left text-[#f56c6c] hover:bg-[#fef0f0] cursor-pointer"
              >
                删除
              </button>
            </div>
          )}
        </div>

        {!isCollapsed &&
          unifiedChildren.map((child) => {
            if (child._nodeType === 'arch') {
              return renderArchNode(child, depth + 1);
            }
            const fl = child;
            const isFlowSel = selectedNode.type === 'flow' && selectedNode.id === fl.id;
            const isFlDragSelf = treeDragItem?.id === fl.id;
            const isFlDragBefore = treeDragOver?.id === fl.id && treeDragOver?.position === 'before';
            const isFlDragAfter = treeDragOver?.id === fl.id && treeDragOver?.position === 'after';

            return (
              <div
                key={fl.id}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  setTreeDragItem({ id: fl.id, type: 'flow', parentId: fl.parentId });
                  e.dataTransfer.setData('text/plain', JSON.stringify({ id: fl.id, type: 'flow', parentId: fl.parentId }));
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  if (!treeDragItem || treeDragItem.id === fl.id) return;
                  if (treeDragItem.type === 'arch' && isDescendantArch(treeDragItem.id, fl.parentId)) return;
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'move';
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = e.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
                  setTreeDragOver({ id: fl.id, position: pos });
                }}
                onDragLeave={(e) => {
                  e.stopPropagation();
                  if (treeDragOver?.id === fl.id) setTreeDragOver(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (treeDragOver && treeDragItem) {
                    handleTreeNodeDrop(fl.id, fl.parentId, treeDragOver.position, 'flow');
                  }
                }}
                onDragEnd={() => {
                  setTreeDragItem(null);
                  setTreeDragOver(null);
                }}
                onClick={() => setSelectedNode({ type: 'flow', id: fl.id })}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenMenuId(fl.id);
                }}
                style={{ paddingLeft: `${26 + depth * 14}px` }}
                className={`group flex items-center justify-between pr-2 py-1.5 rounded text-xs cursor-pointer transition-all relative ${
                  isFlDragSelf ? 'opacity-40 bg-[#f0f2f5]' : ''
                } ${
                  isFlowSel ? 'bg-[#ecf5ff] text-[#409eff] font-medium' : 'text-[#606266] hover:bg-[#f5f7fa]'
                }`}
              >
                {isFlDragBefore && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#409eff] z-20 flex items-center pointer-events-none">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#409eff] -ml-0.5 shadow-xs" />
                  </div>
                )}
                {isFlDragAfter && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#409eff] z-20 flex items-center pointer-events-none">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#409eff] -ml-0.5 shadow-xs" />
                  </div>
                )}
                <div className="flex items-center gap-1.5 min-w-0">
                  <GitBranch className="w-3.5 h-3.5 text-[#409eff] shrink-0" />
                  <span className="truncate">{fl.label}</span>
                  {fl.collaborators && fl.collaborators.length > 0 && (
                    <span
                      title={`已有 ${fl.collaborators.length} 位协作者协助工作`}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff] shrink-0 ml-1"
                    >
                      <Users className="w-2.5 h-2.5" />
                      <span>{fl.collaborators.length}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 ml-1 ${
                      isFlowSel ? 'bg-[#409eff] text-white font-bold' : 'bg-[#f0f2f5] text-[#909399]'
                    }`}
                  >
                    {fl.flowLevel || 'L4'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === fl.id ? null : fl.id);
                    }}
                    className={`${
                      openMenuId === fl.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    } p-1 rounded hover:bg-white text-[#909399] hover:text-[#409eff] cursor-pointer shrink-0`}
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>

                {openMenuId === fl.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-2 top-7 w-32 bg-white rounded border border-[#ebeef5] shadow-lg py-1.5 z-40 text-xs text-[#303133]"
                  >
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        handleCopyFlow(fl);
                      }}
                      className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer"
                    >
                      复制流程
                    </button>
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        setNameModal({
                          open: true,
                          mode: 'renameFlow',
                          targetId: fl.id,
                          value: fl.label,
                        });
                      }}
                      className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer"
                    >
                      重命名
                    </button>
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        setChangeArchModal({
                          open: true,
                          targetType: 'flow',
                          targetId: fl.id,
                          targetLabel: fl.label,
                          selectedParentId: fl.parentId || 'arch_root',
                          submitting: false,
                          searchQuery: '',
                        });
                      }}
                      className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer"
                    >
                      变更架构
                    </button>
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        handleOpenCollaboratorModal('flow', fl);
                      }}
                      className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer flex items-center justify-between"
                    >
                      <span>协作者</span>
                      {fl.collaborators && fl.collaborators.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#ecf5ff] text-[#409eff]">
                          {fl.collaborators.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        handlePublishFlow(false, fl);
                      }}
                      className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#409eff]" />
                      <span>直接发布流程</span>
                    </button>
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        handlePublishFlow(true, fl);
                      }}
                      className="w-full px-3.5 py-1.5 text-left hover:bg-[#f0f9eb] hover:text-[#67c23a] cursor-pointer flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#67c23a]" />
                      <span>提交发布审核</span>
                    </button>
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        handleOpenHistory(false, fl.id);
                      }}
                      className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer"
                    >
                      发布历史
                    </button>
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        handleDeleteNode(false, fl.id, fl.label);
                      }}
                      className="w-full px-3.5 py-1.5 text-left text-[#f56c6c] hover:bg-[#fef0f0] cursor-pointer"
                    >
                      删除流程
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    );
  };

  const rootArch = archList.find((a) => !a.parentId) || archList.find((a) => a.id === 'arch_root') || DEFAULT_ROOT_ARCH;

  return (
    <div
      onClick={() => setOpenMenuId(null)}
      className="h-[calc(100vh-88px)] flex gap-2 min-h-0 overflow-hidden relative"
    >
      {/* 拖拽中的全局防穿透与光标锁定遮罩 */}
      {isResizingTree && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
      )}

      {/* 左侧架构树面板 */}
      <div
        style={{ width: treeCollapsed ? '56px' : `${treeWidth}px` }}
        className={`bg-white rounded border border-[#ebeef5] flex flex-col h-full min-h-0 shrink-0 ${
          isResizingTree ? 'transition-none select-none' : 'transition-[width] duration-150'
        }`}
      >
        <div className="px-3.5 py-3 border-b border-[#ebeef5] flex items-center justify-between shrink-0">
          {!treeCollapsed && (
            <div
              className="flex items-center gap-1.5 min-w-0"
              title="支持鼠标左键按住拖拽架构或流程，上下自由移动排序或移入其他架构跨层级移动"
            >
              <Network className="w-4 h-4 text-[#409eff] shrink-0" />
              <span className="text-sm font-semibold text-[#1f2733] truncate">流程资产架构树</span>
            </div>
          )}
          <button
            onClick={() => setTreeCollapsed(!treeCollapsed)}
            className="p-1 rounded hover:bg-[#f5f7fa] text-[#606266] cursor-pointer"
            title={treeCollapsed ? '展开架构树' : '收起架构树'}
          >
            {treeCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
        {!treeCollapsed && (
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {rootArch ? renderArchNode(rootArch, 0) : null}
          </div>
        )}
      </div>

      {/* 左右拖动调整宽度把手 (完全对齐设计图 image_b4e2bb95.png) */}
      {!treeCollapsed ? (
        <div
          onMouseDown={handleStartResizeTree}
          onDoubleClick={handleResetTreeWidth}
          title="按住鼠标左右拖拽调整架构树宽度，双击恢复默认宽度 (300px)"
          className="w-2.5 -mx-1 shrink-0 cursor-col-resize flex items-center justify-center group select-none z-10"
        >
          <div
            className={`w-[2px] h-full rounded-full transition-colors duration-150 ${
              isResizingTree
                ? 'bg-[#409eff] shadow-[0_0_8px_rgba(64,158,255,0.7)]'
                : 'bg-transparent group-hover:bg-[#409eff]'
            }`}
          />
        </div>
      ) : (
        <div className="w-1 shrink-0" />
      )}

      <div className="flex-1 bg-white rounded border border-[#ebeef5] flex flex-col h-full min-h-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-[#ebeef5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {selectedNode.type === 'arch' ? (
              <Folder className="w-4 h-4 text-[#409eff] shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-[#f0a13a] shrink-0" />
            )}
            <span className="text-sm font-semibold text-[#1f2733] truncate">
              {selectedNode.type === 'arch' ? currentArch?.label : currentFlow?.label}
            </span>
          </div>
          {selectedNode.type === 'arch' ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenCollaboratorModal('arch', currentArch)}
                className="h-8 px-3 rounded border border-[#dcdfe6] hover:border-[#409eff] hover:text-[#409eff] text-xs text-[#606266] flex items-center gap-1.5 cursor-pointer bg-white transition-colors"
                title="分配与管理本架构协作者"
              >
                <Users className="w-3.5 h-3.5 text-[#409eff]" />
                <span>协作者</span>
                {currentArch?.collaborators && currentArch.collaborators.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#ecf5ff] text-[#409eff] font-mono-tabular">
                    {currentArch.collaborators.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => handlePublishArch()}
                className="h-8 px-3.5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium cursor-pointer"
              >
                发布架构
              </button>
              <button
                onClick={() => handleOpenHistory(true)}
                className="h-8 px-3.5 rounded border border-[#dcdfe6] hover:border-[#409eff] hover:text-[#409eff] text-xs text-[#606266] cursor-pointer"
              >
                发布历史
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenCollaboratorModal('flow', currentFlow)}
                className="h-8 px-3 rounded border border-[#dcdfe6] hover:border-[#409eff] hover:text-[#409eff] text-xs text-[#606266] flex items-center gap-1.5 cursor-pointer bg-white transition-colors"
                title="分配与管理本流程协作者"
              >
                <Users className="w-3.5 h-3.5 text-[#409eff]" />
                <span>协作者</span>
                {currentFlow?.collaborators && currentFlow.collaborators.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#ecf5ff] text-[#409eff] font-mono-tabular">
                    {currentFlow.collaborators.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => handlePublishFlow(false)}
                className="h-8 px-3 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium cursor-pointer"
              >
                直接发布
              </button>
              <button
                onClick={() => handlePublishFlow(true)}
                className="h-8 px-3 rounded bg-[#67c23a] hover:bg-[#5daf34] text-white text-xs font-medium cursor-pointer"
              >
                发布审核
              </button>
              <button
                onClick={() => handleOpenHistory(false)}
                className="h-8 px-3 rounded border border-[#dcdfe6] hover:border-[#409eff] hover:text-[#409eff] text-xs text-[#606266] cursor-pointer"
              >
                版本历史
              </button>
              <button
                onClick={() => onEnterDesigner(selectedNode.id)}
                className="h-8 px-3.5 rounded bg-[#e6a23c] hover:bg-[#cf9236] text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>进入流程画板</span>
              </button>
            </div>
          )}
        </div>

        {selectedNode.type === 'arch' ? (
          <>
            <div className="px-5 border-b border-[#ebeef5] flex items-center gap-6 text-xs font-medium shrink-0">
              {[
                { key: 'arch', label: '架构键盘图' },
                { key: 'ywjcst', label: '业务集成视图' },
                { key: 'typecard', label: '架构卡片' },
                { key: 'zdwj', label: '制度文件' },
                { key: 'fxhg', label: '风险合规' },
                { key: 'xgfj', label: '相关附件' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setArchTab(t.key as any)}
                  className={`py-2.5 border-b-2 transition-colors cursor-pointer ${
                    archTab === t.key
                      ? 'border-[#409eff] text-[#409eff]'
                      : 'border-transparent text-[#606266] hover:text-[#409eff]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className={`flex-1 min-h-0 ${archTab === 'ywjcst' ? 'flex flex-col' : 'overflow-y-auto'}`}>
              {['zdwj', 'fxhg', 'xgfj'].includes(archTab) && currentArch && (
                <FlowPageStandardHeader
                  archName={getArchHierarchyPath(currentArch.id, false, archList, flowList)}
                  name={currentArch.label}
                  nameLabel="架构名称"
                  deptName={currentArch.deptName || '研发管理中心'}
                  ownerName={currentArch.ownerName || '流程管理员(E0002)'}
                  collaborators={currentArch.collaborators}
                  applicableScope={
                    currentArch.applicableScope ||
                    currentArch.adaptScope ||
                    '结构开发部'
                  }
                />
              )}
              {archTab === 'ywjcst' && currentArch && (
                <div className="flex-1 flex flex-col min-h-0 bg-[#f8f9fb]">
                  {/* Top Toolbar matching Flow tab preview */}
                  <div className="h-10 px-4 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
                    {/* Left: View & Diagram controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-[#dcdfe6] shadow-2xs">
                        <button
                          type="button"
                          onClick={() => archPreviewBridgeRef.current?.fit()}
                          className="h-6.5 px-2 rounded hover:bg-[#f2f6fc] text-xs text-[#606266] hover:text-[#409eff] flex items-center gap-1 cursor-pointer transition-colors"
                          title="自适应画布大小"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>自适应</span>
                        </button>
                        <div className="h-3.5 w-[1px] bg-[#ebeef5]" />
                        <button
                          type="button"
                          onClick={() => archPreviewBridgeRef.current?.zoomOut()}
                          className="w-6.5 h-6.5 rounded hover:bg-[#f2f6fc] text-xs text-[#606266] hover:text-[#409eff] flex items-center justify-center cursor-pointer transition-colors"
                          title="缩小视图"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => archPreviewBridgeRef.current?.zoomIn()}
                          className="w-6.5 h-6.5 rounded hover:bg-[#f2f6fc] text-xs text-[#606266] hover:text-[#409eff] flex items-center justify-center cursor-pointer transition-colors"
                          title="放大视图"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="h-4 w-[1px] bg-[#dcdfe6] mx-0.5" />

                      <button
                        type="button"
                        onClick={() => {
                          fetchAndLoadArchIntegrationDiagram(currentArch.id, currentArch.label, true);
                          showToast('已刷新业务集成视图最新内容', 'info');
                        }}
                        className="h-7 px-2.5 rounded border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-xs text-[#606266] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                        title="重新加载最新已保存设计"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>刷新</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => archPreviewBridgeRef.current?.exportDiagram('png')}
                        className="h-7 px-2.5 rounded border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-xs text-[#606266] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                        title="导出为PNG图片"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>导出</span>
                      </button>
                    </div>

                    {/* Right: Primary action button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEnterDesigner(currentArch.id)}
                        className="h-7.5 px-3.5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                        title="进入流程设计画板进行可视化设计"
                      >
                        <PenLine className="w-3.5 h-3.5" />
                        <span>编辑图表</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Preview Container with Draw.io iframe */}
                  <div className="flex-1 min-h-[460px] relative bg-[#f8f9fb]">
                    {archIntegrationLoading && (
                      <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-xs text-[#409eff] bg-white px-3 py-2 rounded shadow-md border border-[#ebeef5]">
                          <div className="w-3.5 h-3.5 border-2 border-[#409eff] border-t-transparent rounded-full animate-spin" />
                          <span>正在加载业务集成视图...</span>
                        </div>
                      </div>
                    )}
                    <iframe
                      ref={archPreviewIframeRef}
                      title="业务集成视图只读预览"
                      src="/drawio/index.html?embed=1&proto=json&ui=min&lang=zh&dflowReadOnly=1&modified=0"
                      className="w-full h-full border-0 block"
                    />
                  </div>
                </div>
              )}

              {archTab === 'arch' && currentArch && (() => {
                const isRootArch =
                  !currentArch ||
                  currentArch.id === 'arch_root' ||
                  currentArch.id === rootArch?.id ||
                  !currentArch.parentId;

                const directChildArchs = isRootArch
                  ? archList.filter((a) => a.parentId === 'arch_root' || (!a.parentId && a.id !== rootArch?.id))
                  : archList.filter((a) => a.parentId === currentArch.id);

                const directChildFlows = isRootArch
                  ? flowList.filter((f) => f.parentId === 'arch_root' || f.parentId === rootArch?.id)
                  : flowList.filter((f) => f.parentId === currentArch.id);

                const breadcrumbs = getArchBreadcrumbs(currentArch.id);
                const curArchLevel = resolveArchLevel(currentArch, archList);

                return (
                  <div className="p-5 space-y-4">
                    {/* 面包屑导航与快速层级穿透控制 */}
                    <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="text-[#909399] font-medium flex items-center gap-1">
                          <Network className="w-3.5 h-3.5 text-[#409eff]" />
                          架构定位：
                        </span>
                        {breadcrumbs.map((crumb, idx) => {
                          const isLast = idx === breadcrumbs.length - 1;
                          const crumbLevel = resolveArchLevel(crumb, archList);
                          return (
                            <React.Fragment key={crumb.id}>
                              {idx > 0 && <span className="text-[#cbd5e1] font-bold">&gt;</span>}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedNode({ type: 'arch', id: crumb.id });
                                  setArchTab('arch');
                                }}
                                className={`px-2 py-0.5 rounded transition-colors cursor-pointer font-medium ${
                                  isLast
                                    ? 'bg-[#409eff] text-white font-bold'
                                    : 'text-[#409eff] hover:bg-[#ecf5ff]'
                                }`}
                                title={`点击穿透至【${crumb.label}】`}
                              >
                                {crumb.label} ({crumbLevel})
                              </button>
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {breadcrumbs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const parentCrumb = breadcrumbs[breadcrumbs.length - 2];
                            if (parentCrumb) {
                              setSelectedNode({ type: 'arch', id: parentCrumb.id });
                              setArchTab('arch');
                            }
                          }}
                          className="h-7 px-3 rounded border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] hover:border-[#409eff] text-[#606266] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>返回上级架构</span>
                        </button>
                      )}
                    </div>

                    {/* 架构键盘图概览 Banner */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white shadow-xs space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-white/20 text-white font-mono text-xs font-bold border border-white/30">
                            {curArchLevel} · 架构键盘图
                          </span>
                          <h2 className="text-base font-bold tracking-tight">{currentArch.label}</h2>
                        </div>
                        <div className="text-xs bg-white/15 px-3 py-1 rounded-full border border-white/20 font-medium">
                          下属包含 <strong>{directChildArchs.length}</strong> 个子架构 · <strong>{directChildFlows.length}</strong> 个业务流程
                        </div>
                      </div>
                      <p className="text-xs text-white/90 leading-relaxed max-w-3xl">
                        {currentArch.flowDefine || currentArch.flowPurpose || '企业数字化主干业务流程架构全景，统筹战略规划、研发创新、市场营销与运营治理。'}
                      </p>
                    </div>

                    {/* ============================================================== */}
                    {/* 键盘图矩阵 A：下级子业务架构键盘卡片 (点击任意颜色卡片支持向下穿透) */}
                    {/* ============================================================== */}
                    {directChildArchs.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#1f2733] flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-[#409eff]" />
                            下级子业务架构键盘图（点击任意卡片向下穿透至对应层级）
                          </span>
                          <span className="text-[#909399]">共 {directChildArchs.length} 个子架构区块</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {directChildArchs.map((childArch, idx) => {
                            const palette = ARCH_PALETTES[idx % ARCH_PALETTES.length];
                            const childLevel = resolveArchLevel(childArch, archList);
                            const subFlows = flowList.filter((f) => f.parentId === childArch.id);
                            const subChildArchs = archList.filter((a) => a.parentId === childArch.id);

                            return (
                              <div
                                key={childArch.id}
                                onClick={() => {
                                  setSelectedNode({ type: 'arch', id: childArch.id });
                                  setArchTab('arch');
                                  if (showToast) showToast(`已向下穿透至【${childArch.label}】`, 'success');
                                }}
                                className={`rounded-xl border ${palette.cardBorder} ${palette.cardBg} ${palette.cardHoverBorder} ${palette.ringColor} p-4 flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 group shadow-2xs hover:shadow-md relative overflow-hidden`}
                              >
                                <div className="space-y-2.5">
                                  {/* Card Header */}
                                  <div className="flex items-center justify-between gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] font-bold border font-mono ${palette.badgeBg} ${palette.badgeText} ${palette.badgeBorder}`}
                                    >
                                      {childLevel}
                                    </span>
                                    <span className="font-mono-tabular text-[11px] text-[#909399]">
                                      {childArch.archNo || 'ARCH-SUB'}
                                    </span>
                                  </div>

                                  <div>
                                    <h3 className="font-bold text-sm text-[#1f2733] group-hover:text-[#409eff] transition-colors leading-snug">
                                      {childArch.label}
                                    </h3>
                                    <p className="text-[11px] text-[#64748b] mt-1 line-clamp-2 leading-relaxed">
                                      {childArch.flowDefine || childArch.flowPurpose || '暂无业务定义'}
                                    </p>
                                  </div>

                                  {/* Sub-item Pills Preview */}
                                  <div className="space-y-1.5 pt-2 border-t border-[#e2e8f0]/80">
                                    <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                                      <span>架构包含</span>
                                      <span className="font-semibold text-[#1f2733]">
                                        {subChildArchs.length > 0 && `${subChildArchs.length} 个子架构 · `}
                                        {subFlows.length} 个流程
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 max-h-16 overflow-hidden">
                                      {subFlows.slice(0, 3).map((sf) => (
                                        <span
                                          key={sf.id}
                                          className={`px-2 py-0.5 rounded text-[10.5px] truncate max-w-[190px] border ${palette.pillBg} ${palette.pillText} ${palette.pillBorder}`}
                                        >
                                          {sf.label}
                                        </span>
                                      ))}
                                      {subFlows.length > 3 && (
                                        <span className="text-[10px] text-[#909399] self-center">
                                          +{subFlows.length - 3} 项
                                        </span>
                                      )}
                                      {subFlows.length === 0 && subChildArchs.length === 0 && (
                                        <span className="text-[10px] text-[#c0c4cc]">暂无流程或子架构</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Penetration Button */}
                                <div className="pt-2 flex items-center justify-between border-t border-[#e2e8f0]/80 text-xs">
                                  <span className="text-[11px] text-[#909399]">
                                    归口：{childArch.deptName || '业务部门'}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 font-semibold text-xs transition-transform group-hover:translate-x-1 ${palette.badgeText}`}>
                                    <span>向下穿透</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ============================================================== */}
                    {/* 键盘图矩阵 B：直属业务流程文件清单 (彩色卡片，支持向下穿透) */}
                    {/* ============================================================== */}
                    {directChildFlows.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#1f2733] flex items-center gap-1.5">
                            <GitBranch className="w-4 h-4 text-[#409eff]" />
                            直属业务流程（点击文件卡片向下穿透打开流程视图）
                          </span>
                          <span className="text-[#909399]">共 {directChildFlows.length} 个业务流程</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {directChildFlows.map((fl) => {
                            return (
                              <div
                                key={fl.id}
                                onClick={() => {
                                  setSelectedNode({ type: 'flow', id: fl.id });
                                  setFlowTab('flow');
                                  if (showToast) showToast(`已向下穿透进入流程【${fl.label}】`, 'success');
                                }}
                                className="rounded-lg border border-[#e2e8f0] bg-white hover:border-[#409eff] p-3.5 flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 group shadow-2xs hover:shadow-md hover:ring-2 hover:ring-[#409eff]/15"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-1.5 py-0.2 rounded text-[10.5px] font-mono font-bold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
                                        {fl.flowLevel || 'L4'}
                                      </span>
                                      <span className="font-mono-tabular text-[11px] text-[#64748b]">
                                        {fl.flowNo}
                                      </span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded font-mono-tabular font-bold text-[11px] bg-[#ecf5ff] text-[#409eff]">
                                      {fl.versionNo || 'V1'}
                                    </span>
                                  </div>

                                  <h4 className="font-bold text-xs text-[#1f2733] group-hover:text-[#409eff] transition-colors leading-snug line-clamp-2">
                                    {fl.label}
                                  </h4>

                                  <div className="text-[11px] text-[#909399] mt-2 flex items-center gap-2">
                                    <span>责任人：{fl.ownerName || '系统管理员'}</span>
                                    <span>•</span>
                                    <span>状态：{fl.status === 'published' ? '已发布' : fl.status === 'approving' ? '审核中' : '草稿'}</span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                    fl.status === 'published' ? 'text-[#67c23a]' : fl.status === 'approving' ? 'text-[#e6a23c]' : 'text-[#909399]'
                                  }`}>
                                    <CheckCircle2 className="w-3 h-3" />
                                    {fl.status === 'published' ? '已发布' : fl.status === 'approving' ? '审核中' : '草稿设计'}
                                  </span>
                                  <span className="text-[#409eff] font-medium flex items-center gap-1 text-[11px] group-hover:underline">
                                    <span>向下穿透查阅流程</span>
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 若无子架构且无直属流程：支持在键盘图上直接快速新建 */}
                    {directChildArchs.length === 0 && directChildFlows.length === 0 && (
                      <div className="p-12 text-center text-xs text-[#909399] bg-[#fafbfc] rounded-xl border border-dashed border-[#dcdfe6] space-y-3">
                        <Folder className="w-8 h-8 text-[#c0c4cc] mx-auto" />
                        <div className="font-medium text-[#606266]">当前架构节点下暂无子架构或流程</div>
                        <p className="text-[11px] text-[#909399]">您可以在左侧菜单或通过下方按钮快速为此架构新建子架构或业务流程</p>
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setNameModal({ open: true, mode: 'createArch', targetId: currentArch.id, value: '' })}
                            className="px-3 py-1.5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium cursor-pointer shadow-xs flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>新建下级子架构</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setNameModal({ open: true, mode: 'createFlow', targetId: currentArch.id, value: '' })}
                            className="px-3 py-1.5 rounded border border-[#dcdfe6] hover:border-[#409eff] hover:text-[#409eff] bg-white text-xs font-medium cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>新建直属流程</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setImportFlowModal({
                                open: true,
                                parentId: currentArch.id,
                                parentLabel: currentArch.label,
                                label: '',
                                flowNo: 'FLOW-' + Math.floor(1000 + Math.random() * 9000),
                                flowLevel: currentArch.level && currentArch.level.startsWith('L') ? `L${Math.min(6, parseInt(currentArch.level.slice(1), 10) + 1)}` : 'L3',
                                ownerName: '系统管理员',
                                versionNo: 'V1.0',
                                description: '',
                                fileName: '',
                                fileSize: '',
                                xmlContent: '',
                                importType: 'file',
                                selectedTemplateId: '',
                                submitting: false,
                              })
                            }
                            className="px-3 py-1.5 rounded border border-[#dcdfe6] hover:border-[#409eff] hover:text-[#409eff] bg-white text-xs font-medium cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>导入直属流程</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {archTab === 'typecard' && currentArch && (
                <UnifiedCardDetailView
                  type="arch"
                  data={currentArch}
                  archList={archList}
                  flowList={flowList}
                  currentUser={currentUser}
                  onSave={handleSaveArchCard}
                  showToast={showToast}
                />
              )}

              {['zdwj', 'fxhg', 'xgfj'].includes(archTab) && (() => {
                const currentTab = archTab as 'zdwj' | 'fxhg' | 'xgfj';
                const boundItems = resolveBoundItems(currentTab, archRefs);
                const tabTitle =
                  currentTab === 'zdwj'
                    ? '制度文件'
                    : currentTab === 'fxhg'
                    ? '风险合规'
                    : '相关附件';
                return (
                  <div className="px-5 pb-5 space-y-3 text-xs text-[#606266]">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#ebeef5]">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingRefs(!isEditingRefs)}
                          className={`h-8 px-3.5 rounded font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                            isEditingRefs
                              ? 'bg-[#67c23a] text-white'
                              : 'bg-[#409eff] hover:bg-[#3390ff] text-white'
                          }`}
                        >
                          <PenLine className="w-3.5 h-3.5" />
                          {isEditingRefs ? '完成配置' : '关联配置'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPickerModal({
                              open: true,
                              targetScope: 'arch',
                              tab: currentTab,
                            })
                          }
                          className="h-8 px-3.5 rounded border border-[#b3d8ff] bg-[#ecf5ff] hover:bg-[#409eff] text-[#409eff] hover:text-white font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>从库中挑选</span>
                        </button>
                      </div>
                      <span className="text-[#909399]">共关联 {boundItems.length} 项</span>
                    </div>

                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#ebeef5] bg-[#fafafa] text-[#909399]">
                          <th className="py-2.5 px-3 w-40">编码</th>
                          <th className="py-2.5 px-3">名称</th>
                          <th className="py-2.5 px-3">说明</th>
                          <th className="py-2.5 px-3 w-24 text-center">状态</th>
                          {isEditingRefs && <th className="py-2.5 px-3 w-28 text-center">操作</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebeef5]">
                        {boundItems.length === 0 ? (
                          <tr>
                            <td colSpan={isEditingRefs ? 5 : 4} className="py-10 text-center text-[#909399]">
                              暂无关联的{tabTitle}
                            </td>
                          </tr>
                        ) : (
                          boundItems.map((item: any) => (
                            <tr key={item.id} className="hover:bg-[#f5f7fa]">
                              <td className="py-2.5 px-3 font-mono-tabular">
                                {item.riskNo || item.docNo || item.attNo || item.id}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-[#1f2733]">
                                {item.label}
                              </td>
                              <td className="py-2.5 px-3 text-[#606266]">{item.category || item.target}</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8] text-[11px]">
                                  <Check className="w-3 h-3" />
                                  已生效
                                </span>
                              </td>
                              {isEditingRefs && (
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const next = archRefs.filter((id) => id !== item.id);
                                      await handleSaveRefs('arch', currentTab, next);
                                      showToast(`已解除与 ${item.label} 的关联`, 'success');
                                    }}
                                    className="text-[#f56c6c] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>移除</span>
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </>
        ) : (
          <>
            <div className="px-5 border-b border-[#ebeef5] flex items-center gap-6 text-xs font-medium shrink-0 overflow-x-auto">
              {[
                { key: 'flow', label: '流程图' },
                { key: 'jbzl', label: '流程基本资料' },
                { key: 'jxzb', label: '流程绩效指标' },
                { key: 'zdwj', label: '制度文件' },
                { key: 'fxhg', label: '风险合规' },
                { key: 'lcsy', label: '流程术语' },
                { key: 'xgfj', label: '相关附件' },
                { key: 'lcjdmx', label: '流程节点明细' },
                { key: 'lcxzh', label: '流程执行情况' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFlowTab(t.key as any)}
                  className={`py-2.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                    flowTab === t.key
                      ? 'border-[#409eff] text-[#409eff]'
                      : 'border-transparent text-[#606266] hover:text-[#409eff]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              {!['flow', 'jbzl'].includes(flowTab) && currentFlow && (
                <FlowPageStandardHeader
                  archName={getArchHierarchyPath(currentFlow.id, true, archList, flowList)}
                  name={currentFlow.label}
                  nameLabel="流程名称"
                  deptName={currentFlow.deptName || '研发管理中心'}
                  ownerName={currentFlow.ownerName || '流程管理员(E0002)'}
                  collaborators={currentFlow.collaborators}
                  applicableScope={
                    currentFlow.applicableScope ||
                    currentFlow.adaptScope ||
                    '结构开发部'
                  }
                />
              )}

              {flowTab === 'flow' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="h-10 px-4 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => previewBridgeRef.current?.fit()}
                        className="h-7 px-2.5 rounded border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-xs text-[#606266] flex items-center gap-1 cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>自适应</span>
                      </button>
                      <button
                        onClick={() => previewBridgeRef.current?.zoomOut()}
                        className="h-7 px-2 rounded border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-xs text-[#606266] cursor-pointer"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => previewBridgeRef.current?.zoomIn()}
                        className="h-7 px-2 rounded border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-xs text-[#606266] cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEnterDesigner(selectedNode.id)}
                        className="h-7 px-3 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <PenLine className="w-3.5 h-3.5" />
                        <span>编辑图表</span>
                      </button>
                    </div>
                    <div className="text-xs text-[#606266] flex items-center gap-1.5">
                      <span>发布状态：</span>
                      {currentFlow?.status === 'scheduled' ? (
                        <span
                          className="inline-flex items-center gap-1 font-semibold text-[#e6a23c] bg-[#fffaf3] px-2.5 py-0.5 rounded-full border border-[#faecd8]"
                          title={`已预约自动发布时间: ${currentFlow.scheduledTime}`}
                        >
                          <Clock className="w-3.5 h-3.5 text-[#e6a23c]" />
                          <span>待预约发布 (定于 {currentFlow.scheduledTime} 自动生效)</span>
                        </span>
                      ) : currentFlow?.status === 'verified' ? (
                        <span
                          className="inline-flex items-center gap-1 font-semibold text-[#409eff] bg-[#ecf5ff] px-2.5 py-0.5 rounded-full border border-[#d9ecff]"
                          title={
                            currentFlow?.publishPolicy === 'scheduled'
                              ? `审批通过后，将于 ${currentFlow.scheduledTime} 预约自动发布`
                              : '审批全部通过后立即发布上线'
                          }
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#409eff]" />
                          <span>
                            审核中
                            {currentFlow?.publishPolicy === 'scheduled'
                              ? ` (预约于 ${currentFlow.scheduledTime} 自动发布)`
                              : ' (通过后立即发布)'}
                          </span>
                        </span>
                      ) : currentFlow?.status === 'draft' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] text-[#909399] bg-[#f4f4f5] border border-[#e4e7ed]">
                          草稿未发布
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#67c23a] bg-[#f0f9eb] px-2.5 py-0.5 rounded-full border border-[#e1f3d8]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#67c23a]" />
                          <span>已发布 ({currentFlow?.versionNo || 'V2'})</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-h-[380px] relative bg-[#f8f9fb]">
                    <iframe
                      ref={previewIframeRef}
                      title="只读流程预览"
                      src="/drawio/index.html?embed=1&proto=json&ui=min&lang=zh&dflowReadOnly=1&modified=0"
                      className="w-full h-full border-0 block"
                    />
                  </div>
                </div>
              )}

              {flowTab === 'jbzl' && currentFlow && (
                <UnifiedCardDetailView
                  type="flow"
                  data={currentFlow}
                  archList={archList}
                  flowList={flowList}
                  currentUser={currentUser}
                  onSave={handleSaveFlowMeta}
                  showToast={showToast}
                />
              )}

              {['zdwj', 'fxhg'].includes(flowTab) && (() => {
                const currentTab = flowTab as 'zdwj' | 'fxhg';
                const boundItems = resolveBoundItems(currentTab, flowRefs);
                const tabTitle = currentTab === 'zdwj' ? '制度文件' : '风险合规';
                return (
                  <div className="p-5 space-y-4 text-xs text-[#606266]">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#ebeef5]">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingRefs(!isEditingRefs)}
                          className={`h-8 px-3.5 rounded font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                            isEditingRefs
                              ? 'bg-[#67c23a] text-white'
                              : 'bg-[#409eff] hover:bg-[#3390ff] text-white'
                          }`}
                        >
                          <PenLine className="w-3.5 h-3.5" />
                          {isEditingRefs ? '完成配置' : '关联配置'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPickerModal({
                              open: true,
                              targetScope: 'flow',
                              tab: currentTab,
                            })
                          }
                          className="h-8 px-3.5 rounded border border-[#b3d8ff] bg-[#ecf5ff] hover:bg-[#409eff] text-[#409eff] hover:text-white font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>从库中挑选</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await handleSaveRefs('flow', currentTab, flowRefs);
                            showToast(`已保存${tabTitle}关联配置`, 'success');
                          }}
                          className="h-8 px-3.5 rounded border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-[#606266] font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-[#67c23a]" />
                          <span>保存配置</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[#909399]">
                        <span className="px-2 py-0.5 rounded bg-[#f4f4f5] text-[#909399]">
                          共关联 {boundItems.length} 项
                        </span>
                      </div>
                    </div>

                    <div className="rounded border border-[#ebeef5] overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#ebeef5] bg-[#fafafa] text-[#909399]">
                            <th className="py-2.5 px-3 w-44">编码</th>
                            <th className="py-2.5 px-3">名称</th>
                            <th className="py-2.5 px-3">{currentTab === 'zdwj' ? '业务分类' : '管控目标 / 风险等级'}</th>
                            <th className="py-2.5 px-3 w-28 text-center">状态</th>
                            <th className="py-2.5 px-3 w-36 text-center">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ebeef5]">
                          {boundItems.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-[#909399]">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <FileText className="w-8 h-8 text-[#dcdfe6]" />
                                  <span>暂无关联的{tabTitle}，点击上方「从库中挑选」进行关联</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            boundItems.map((item: any) => (
                              <tr key={item.id} className="hover:bg-[#f5f7fa]">
                                <td className="py-2.5 px-3 font-mono-tabular text-[#1f2733] font-medium">
                                  {item.docNo || item.riskNo || item.id}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-[#1f2733]">
                                  {item.label}
                                </td>
                                <td className="py-2.5 px-3 text-[#606266]">
                                  {currentTab === 'zdwj'
                                    ? item.category || '综合管理制度'
                                    : `${item.riskLevel ? `[${item.riskLevel}风险] ` : ''}${item.target || item.category || '业务合规'}`}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8] text-[11px]">
                                    <Check className="w-3 h-3" />
                                    已生效
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex items-center justify-center gap-3">
                                    {currentTab === 'zdwj' && (
                                      <a
                                        href={`/api/dict/doc/download?id=${item.id}&name=${encodeURIComponent(item.label)}`}
                                        className="text-[#409eff] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>下载</span>
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const next = flowRefs.filter((id) => String(id) !== String(item.id));
                                        await handleSaveRefs('flow', currentTab, next);
                                        showToast(`已解除与 ${item.label} 的关联`, 'success');
                                      }}
                                      className="text-[#f56c6c] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>移除</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {flowTab === 'xgfj' && (() => {
                const boundItems = resolveBoundItems('xgfj', flowRefs);
                return (
                  <div className="p-5 space-y-4 text-xs text-[#606266]">
                    <input
                      type="file"
                      ref={uploadFileInputRef}
                      onChange={handleNativeFileSelect}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#ebeef5]">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const randomNo = `FJ-FLOW-${Math.floor(1000 + Math.random() * 9000)}`;
                            setUploadAttModal({
                              open: true,
                              targetScope: 'flow',
                              attNo: randomNo,
                              label: '',
                              category: '流程操作指引',
                              fileSize: '1.2 MB',
                              ownerName: currentFlow?.ownerName || '系统管理员',
                            });
                          }}
                          className="h-8 px-3.5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>上传附件</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => uploadFileInputRef.current?.click()}
                          className="h-8 px-3 rounded border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-[#606266] flex items-center gap-1.5 cursor-pointer"
                          title="从本地选择文件直接上传"
                        >
                          <FileUp className="w-3.5 h-3.5" />
                          <span>选择本地文件</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setPickerModal({
                              open: true,
                              targetScope: 'flow',
                              tab: 'xgfj',
                            })
                          }
                          className="h-8 px-3.5 rounded border border-[#b3d8ff] bg-[#ecf5ff] hover:bg-[#409eff] text-[#409eff] hover:text-white font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>从库中挑选</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            await handleSaveRefs('flow', 'xgfj', flowRefs);
                            showToast('附件关联配置保存成功', 'success');
                          }}
                          className="h-8 px-3.5 rounded border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-[#606266] font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-[#67c23a]" />
                          <span>保存配置</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded bg-[#f4f4f5] text-[#909399]">
                          共关联 {boundItems.length} 个附件
                        </span>
                      </div>
                    </div>

                    <div className="rounded border border-[#ebeef5] overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#ebeef5] bg-[#fafafa] text-[#909399]">
                            <th className="py-2.5 px-3 w-40">附件编号</th>
                            <th className="py-2.5 px-3">附件名称</th>
                            <th className="py-2.5 px-3 w-32">业务分类</th>
                            <th className="py-2.5 px-3 w-24">文件大小</th>
                            <th className="py-2.5 px-3 w-28">上传人</th>
                            <th className="py-2.5 px-3 w-36">上传时间</th>
                            <th className="py-2.5 px-3 w-24 text-center">状态</th>
                            <th className="py-2.5 px-3 w-32 text-center">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ebeef5]">
                          {boundItems.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-[#909399]">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <Upload className="w-8 h-8 text-[#dcdfe6]" />
                                  <span>暂无关联的附件，点击上方「上传附件」或「从库中挑选」进行添加</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            boundItems.map((item: any) => (
                              <tr key={item.id} className="hover:bg-[#f5f7fa]">
                                <td className="py-2.5 px-3 font-mono-tabular text-[#1f2733] font-medium">
                                  {item.attNo || item.docNo || item.id}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-[#1f2733]">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#409eff] shrink-0" />
                                    <span className="truncate max-w-[280px]" title={item.label}>
                                      {item.label}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-[#606266]">{item.category || '流程相关附件'}</td>
                                <td className="py-2.5 px-3 font-mono-tabular text-[#909399]">{item.fileSize || '1.2 MB'}</td>
                                <td className="py-2.5 px-3 text-[#606266]">{item.ownerName || '系统管理员'}</td>
                                <td className="py-2.5 px-3 font-mono-tabular text-[#909399]">{item.publishTime || '2026-03-20'}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8] text-[11px]">
                                    <Check className="w-3 h-3" />
                                    已生效
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex items-center justify-center gap-3">
                                    <a
                                      href={`/api/flow/attachment/download?id=${item.id}&name=${encodeURIComponent(item.label)}`}
                                      className="text-[#409eff] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>下载</span>
                                    </a>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const next = flowRefs.filter((id) => String(id) !== String(item.id));
                                        await handleSaveRefs('flow', 'xgfj', next);
                                        showToast(`已移除附件【${item.label}】`, 'success');
                                      }}
                                      className="text-[#f56c6c] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>移除</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {flowTab === 'lcsy' && (() => {
                const boundItems = resolveBoundItems('lcsy', flowRefs);
                return (
                  <div className="p-5 space-y-4 text-xs text-[#606266]">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#ebeef5]">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleOpenTermPicker}
                          className="h-8 px-3.5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>从流程术语库挑选 (支持多选)</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            await handleSaveRefs('flow', 'lcsy', flowRefs);
                            showToast('流程术语关联配置保存成功', 'success');
                          }}
                          className="h-8 px-3.5 rounded border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-[#606266] font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-[#67c23a]" />
                          <span>保存术语配置</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[#909399]">
                        <span className="px-2.5 py-1 rounded bg-[#f4f4f5] text-[#909399]">
                          共关联 {boundItems.length} 项术语
                        </span>
                      </div>
                    </div>

                    <div className="rounded border border-[#ebeef5] overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#ebeef5] bg-[#fafafa] text-[#909399]">
                            <th className="py-2.5 px-3 w-28">术语编码</th>
                            <th className="py-2.5 px-3 w-48">术语名称</th>
                            <th className="py-2.5 px-3 w-36">业务分类</th>
                            <th className="py-2.5 px-3">术语定义与详细说明</th>
                            <th className="py-2.5 px-3 w-24 text-center">状态</th>
                            <th className="py-2.5 px-3 w-24 text-center">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ebeef5]">
                          {boundItems.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-[#909399]">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <FileText className="w-8 h-8 text-[#dcdfe6]" />
                                  <span>暂无关联的流程术语，点击上方「从流程术语库挑选」进行多选关联</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            boundItems.map((item: any, idx: number) => (
                              <tr key={item.id || idx} className="hover:bg-[#f5f7fa]">
                                <td className="py-2.5 px-3 font-mono-tabular text-[#909399]">
                                  {item.termId || item.id || `TERM-${idx + 1}`}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-[#1f2733]">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff] text-xs">
                                    {item.name || item.label}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-[#606266]">
                                  <span className="px-2 py-0.5 rounded bg-[#f4f4f5] text-[#606266] text-[11px]">
                                    {item.category || '通用术语'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-[#606266] leading-relaxed">
                                  {item.content || item.desc || '—'}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8] text-[11px]">
                                    <Check className="w-3 h-3" />
                                    已生效
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const next = flowRefs.filter(
                                        (id) => String(id) !== String(item.id) && String(id) !== String(item.termId)
                                      );
                                      await handleSaveRefs('flow', 'lcsy', next);
                                      showToast(`已解除术语【${item.name || item.label}】的关联`, 'success');
                                    }}
                                    className="text-[#f56c6c] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>移除</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {flowTab === 'jxzb' && (
                <div className="p-5 space-y-5 text-xs text-[#606266]">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                      <div className="text-[#94a3b8] text-[11px] mb-1">流程时效达成率</div>
                      <div className="text-2xl font-bold text-[#0f172a] font-mono-tabular">96.5%</div>
                      <div className="text-[11px] text-[#10b981] mt-1">基准目标 ≥ 95.0% (正常达标)</div>
                    </div>
                    <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                      <div className="text-[#94a3b8] text-[11px] mb-1">一次性通过率 (FTT)</div>
                      <div className="text-2xl font-bold text-[#0f172a] font-mono-tabular">91.2%</div>
                      <div className="text-[11px] text-[#10b981] mt-1">基准目标 ≥ 90.0% (环比 +1.8%)</div>
                    </div>
                    <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                      <div className="text-[#94a3b8] text-[11px] mb-1">KCP审计符合率</div>
                      <div className="text-2xl font-bold text-[#10b981] font-mono-tabular">100%</div>
                      <div className="text-[11px] text-[#10b981] mt-1">零合规缺陷与卡点漏报</div>
                    </div>
                    <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                      <div className="text-[#94a3b8] text-[11px] mb-1">平均端到端周转周期</div>
                      <div className="text-2xl font-bold text-[#0f172a] font-mono-tabular">2.4 天</div>
                      <div className="text-[11px] text-[#10b981] mt-1">行业基准 3.5 天 (优于平均值)</div>
                    </div>
                  </div>

                  <div className="rounded border border-[#ebeef5] overflow-hidden">
                    <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#ebeef5] font-medium text-[#1f2733]">
                      流程考核关键绩效指标 (KPI) 明细
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#ebeef5] bg-[#fafafa] text-[#909399]">
                          <th className="py-2.5 px-3">指标编码</th>
                          <th className="py-2.5 px-3">指标名称</th>
                          <th className="py-2.5 px-3">指标分类</th>
                          <th className="py-2.5 px-3">考核频次</th>
                          <th className="py-2.5 px-3">目标值</th>
                          <th className="py-2.5 px-3">现状值</th>
                          <th className="py-2.5 px-3">责任岗位</th>
                          <th className="py-2.5 px-3 text-center">状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebeef5]">
                        <tr className="hover:bg-[#f5f7fa]">
                          <td className="py-2.5 px-3 font-mono-tabular">KPI-TR-01</td>
                          <td className="py-2.5 px-3 font-medium text-[#1f2733]">TR技术评审完成及时率</td>
                          <td className="py-2.5 px-3">时效指标</td>
                          <td className="py-2.5 px-3">月度</td>
                          <td className="py-2.5 px-3 font-mono-tabular">≥ 95%</td>
                          <td className="py-2.5 px-3 font-mono-tabular text-[#67c23a] font-semibold">97.2%</td>
                          <td className="py-2.5 px-3">系统架构师 / 项目经理</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8] text-[11px]">达标</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[#f5f7fa]">
                          <td className="py-2.5 px-3 font-mono-tabular">KPI-TR-02</td>
                          <td className="py-2.5 px-3 font-medium text-[#1f2733]">TRB决议质量红线漏检率</td>
                          <td className="py-2.5 px-3">质量指标</td>
                          <td className="py-2.5 px-3">季度</td>
                          <td className="py-2.5 px-3 font-mono-tabular">0%</td>
                          <td className="py-2.5 px-3 font-mono-tabular text-[#67c23a] font-semibold">0%</td>
                          <td className="py-2.5 px-3">质量合规审计员</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8] text-[11px]">达标</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[#f5f7fa]">
                          <td className="py-2.5 px-3 font-mono-tabular">KPI-TR-03</td>
                          <td className="py-2.5 px-3 font-medium text-[#1f2733]">评审问题跟踪闭环率</td>
                          <td className="py-2.5 px-3">控制指标</td>
                          <td className="py-2.5 px-3">月度</td>
                          <td className="py-2.5 px-3 font-mono-tabular">100%</td>
                          <td className="py-2.5 px-3 font-mono-tabular text-[#409eff] font-semibold">98.5%</td>
                          <td className="py-2.5 px-3">开发工程师</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff] text-[11px]">受控中</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {flowTab === 'lcxzh' && currentFlow && (
                <div className="px-5 pb-5 space-y-4 text-xs text-[#606266]">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                      <div className="text-[#94a3b8] text-[11px] mb-1">流程运行状态</div>
                      <div className="text-xl font-bold text-[#10b981]">正常运行中</div>
                      <div className="text-[11px] text-[#909399] mt-1">引擎监听正常 · 7x24h 自动流转</div>
                    </div>
                    <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                      <div className="text-[#94a3b8] text-[11px] mb-1">累计流转实例</div>
                      <div className="text-2xl font-bold text-[#0f172a] font-mono-tabular">158 笔</div>
                      <div className="text-[11px] text-[#409eff] mt-1">本月新增 32 笔 (环比 +12%)</div>
                    </div>
                    <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                      <div className="text-[#94a3b8] text-[11px] mb-1">平均执行周期</div>
                      <div className="text-2xl font-bold text-[#0f172a] font-mono-tabular">1.8 天</div>
                      <div className="text-[11px] text-[#10b981] mt-1">低于考核目标值 2.5 天</div>
                    </div>
                    <div className="p-4 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                      <div className="text-[#94a3b8] text-[11px] mb-1">异常中断与卡点</div>
                      <div className="text-2xl font-bold text-[#10b981] font-mono-tabular">0 笔</div>
                      <div className="text-[11px] text-[#10b981] mt-1">端到端节点顺畅无死锁</div>
                    </div>
                  </div>

                  <div className="rounded border border-[#ebeef5] overflow-hidden">
                    <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#ebeef5] font-medium text-[#1f2733] flex items-center justify-between">
                      <span>近期流程执行工单实例列表</span>
                      <span className="text-[#909399] text-[11px]">实时同步执行引擎</span>
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#ebeef5] bg-[#fafafa] text-[#909399]">
                          <th className="py-2.5 px-3">工单实例号</th>
                          <th className="py-2.5 px-3">业务标题</th>
                          <th className="py-2.5 px-3">发起人</th>
                          <th className="py-2.5 px-3">发起部门</th>
                          <th className="py-2.5 px-3">当前节点</th>
                          <th className="py-2.5 px-3">当前处理人</th>
                          <th className="py-2.5 px-3">发起时间</th>
                          <th className="py-2.5 px-3 text-center">状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebeef5]">
                        {[
                          { no: 'FLOW-RUN-20261028-01', title: `${currentFlow.label} 审批工单 #1`, user: '张三', dept: '研发中心', node: '活动评审', approver: '李四', time: '2026-10-28 09:30:15', status: '流转中' },
                          { no: 'FLOW-RUN-20261027-04', title: `${currentFlow.label} 审批工单 #2`, user: '王五', dept: '市场营销部', node: '决策会签归档', approver: '系统管理员', time: '2026-10-27 14:12:00', status: '已办结' },
                          { no: 'FLOW-RUN-20261026-02', title: `${currentFlow.label} 阶段交付物审查`, user: '赵六', dept: '质量合规部', node: 'KCP控制点核验', approver: '孙七', time: '2026-10-26 11:05:40', status: '已办结' },
                        ].map((inst) => (
                          <tr key={inst.no} className="hover:bg-[#f5f7fa]">
                            <td className="py-2.5 px-3 font-mono-tabular text-[#409eff] font-medium">{inst.no}</td>
                            <td className="py-2.5 px-3 text-[#1f2733] font-medium">{inst.title}</td>
                            <td className="py-2.5 px-3 text-[#606266]">{inst.user}</td>
                            <td className="py-2.5 px-3 text-[#606266]">{inst.dept}</td>
                            <td className="py-2.5 px-3 text-[#606266]">{inst.node}</td>
                            <td className="py-2.5 px-3 text-[#606266]">{inst.approver}</td>
                            <td className="py-2.5 px-3 font-mono-tabular text-[#909399]">{inst.time}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                                inst.status === '已办结' ? 'bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8]' : 'bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff]'
                              }`}>
                                {inst.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="h-9 px-5 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between text-xs text-[#909399] shrink-0">
          <div className="flex items-center gap-6">
            <span>
              发布人：
              <strong className="text-[#606266] font-normal">
                {(selectedNode.type === 'arch' ? currentArch?.publishUserName : currentFlow?.publishUserName) ||
                  '系统管理员'}
              </strong>
            </span>
            <span>
              发布时间：
              <strong className="text-[#606266] font-normal font-mono-tabular">
                {(selectedNode.type === 'arch' ? currentArch?.publishTime : currentFlow?.publishTime) ||
                  '2026-03-20 14:00:00'}
              </strong>
            </span>
            <span>
              当前版本：
              <strong className="text-[#409eff] font-semibold font-mono-tabular">
                {(selectedNode.type === 'arch' ? currentArch?.versionNo : currentFlow?.versionNo) || 'V1'}
              </strong>
            </span>
          </div>
          <span>全元流程资产运营平台 · dflow</span>
        </div>
      </div>

      {/* 变更所属架构弹窗 */}
      {changeArchModal.open && (() => {
        const disabledIds = getDisabledArchIdsForChange(changeArchModal.targetType, changeArchModal.targetId);
        const searchQuery = (changeArchModal.searchQuery || '').trim().toLowerCase();

        // 查找当前原归属架构
        let currentParentLabel = '未归属';
        if (changeArchModal.targetType === 'arch') {
          const targetArchObj = archList.find((a) => a.id === changeArchModal.targetId);
          const pArch = targetArchObj?.parentId ? archList.find((a) => a.id === targetArchObj.parentId) : null;
          currentParentLabel = pArch ? pArch.label : '企业流程架构全景 (根)';
        } else {
          const targetFlowObj = flowList.find((f) => f.id === changeArchModal.targetId);
          const pArch = targetFlowObj?.parentId ? archList.find((a) => a.id === targetFlowObj.parentId) : null;
          currentParentLabel = pArch ? pArch.label : targetFlowObj?.archName || '企业流程架构全景';
        }

        const selectedParentArch = archList.find((a) => a.id === changeArchModal.selectedParentId);

        // 递归渲染架构树节点选择器
        const renderPickerNode = (node: any, depth = 0): React.ReactNode => {
          const childArchs = archList.filter((a) => a.parentId === node.id);
          const isSelected = changeArchModal.selectedParentId === node.id;
          const isDisabled = disabledIds.has(node.id);
          const isCollapsed = Boolean(changeArchTreeCollapsed[node.id]);

          // 搜索匹配过滤
          const nodeMatchesSearch = (item: any): boolean => {
            if (!searchQuery) return true;
            if (item.label?.toLowerCase().includes(searchQuery) || item.archNo?.toLowerCase().includes(searchQuery)) {
              return true;
            }
            const sub = archList.filter((a) => a.parentId === item.id);
            return sub.some(nodeMatchesSearch);
          };

          if (!nodeMatchesSearch(node)) return null;

          return (
            <div key={node.id} className="select-none">
              <div
                onClick={() => {
                  if (!isDisabled) {
                    setChangeArchModal((prev) => ({ ...prev, selectedParentId: node.id }));
                  }
                }}
                style={{ paddingLeft: `${10 + depth * 18}px` }}
                className={`group flex items-center justify-between pr-3 py-2 rounded text-xs transition-all my-0.5 border ${
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed bg-[#f5f7fa] border-transparent text-[#909399]'
                    : isSelected
                    ? 'bg-[#ecf5ff] text-[#409eff] font-medium border-[#b3d8ff] shadow-2xs'
                    : 'hover:bg-[#f5f7fa] text-[#303133] border-transparent cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {childArchs.length > 0 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChangeArchTreeCollapsed((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
                      }}
                      className="w-4 h-4 flex items-center justify-center text-[#909399] hover:text-[#409eff] cursor-pointer shrink-0"
                    >
                      {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}

                  <input
                    type="radio"
                    name="modalTargetArchParent"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => {
                      if (!isDisabled) {
                        setChangeArchModal((prev) => ({ ...prev, selectedParentId: node.id }));
                      }
                    }}
                    className="rounded-full text-[#409eff] focus:ring-[#409eff] cursor-pointer shrink-0"
                  />

                  <Network
                    className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#409eff]' : 'text-[#606266]'}`}
                  />

                  <span className="truncate">{node.label}</span>

                  {node.archNo && (
                    <span className="font-mono-tabular text-[10px] text-[#909399] shrink-0">
                      {node.archNo}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {isDisabled ? (
                    <span className="text-[10px] text-[#f56c6c] bg-[#fef0f0] px-1.5 py-0.2 rounded border border-[#fde2e2]">
                      不可选(自身或下级)
                    </span>
                  ) : (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-white text-[#409eff] border border-[#b3d8ff]' : 'bg-[#f4f4f5] text-[#909399]'
                    }`}>
                      {node.level || (depth === 0 ? 'L0' : 'L1')}
                    </span>
                  )}
                </div>
              </div>

              {!isCollapsed && childArchs.map((child) => renderPickerNode(child, depth + 1))}
            </div>
          );
        };

        const rootNode = archList.find((a) => !a.parentId) || archList[0];

        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-[560px] shadow-2xl border border-[#ebeef5] flex flex-col max-h-[85vh] overflow-hidden">
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafafa] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#ecf5ff] text-[#409eff] flex items-center justify-center shrink-0">
                    <Network className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#1f2733]">变更所属架构</span>
                    <span className="text-xs text-[#909399] ml-2">选择目标上级流程架构</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setChangeArchModal((prev) => ({ ...prev, open: false }))}
                  className="text-[#909399] hover:text-[#1f2733] cursor-pointer p-1 rounded hover:bg-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current Object Info */}
              <div className="px-5 py-3 border-b border-[#ebeef5] bg-[#f8fafc] text-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[#909399]">当前变更对象：</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                    changeArchModal.targetType === 'arch'
                      ? 'bg-[#ecf5ff] text-[#409eff] border-[#d9ecff]'
                      : 'bg-[#fdf6ec] text-[#e6a23c] border-[#faecd8]'
                  }`}>
                    {changeArchModal.targetType === 'arch' ? '流程架构' : '业务流程'}
                  </span>
                  <strong className="text-[#1f2733] font-semibold">{changeArchModal.targetLabel}</strong>
                </div>
                <div className="flex items-center gap-1.5 text-[#606266]">
                  <span className="text-[#909399]">当前归属：</span>
                  <span className="font-medium text-[#303133]">{currentParentLabel}</span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="px-5 py-2.5 border-b border-[#ebeef5] bg-white shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#909399] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={changeArchModal.searchQuery || ''}
                    onChange={(e) => setChangeArchModal((prev) => ({ ...prev, searchQuery: e.target.value }))}
                    placeholder="在架构树中快速搜索架构名称或编号..."
                    className="w-full h-8 pl-8 pr-8 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-xs"
                  />
                  {changeArchModal.searchQuery && (
                    <button
                      type="button"
                      onClick={() => setChangeArchModal((prev) => ({ ...prev, searchQuery: '' }))}
                      className="absolute right-2.5 top-2 text-[#909399] hover:text-[#1f2733] cursor-pointer text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tree Selector Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-[240px] max-h-[380px] bg-white">
                <div className="text-[11px] font-semibold text-[#909399] mb-1.5 px-2">
                  请选择目标上级架构（点击单选按钮或整行）：
                </div>
                {rootNode ? renderPickerNode(rootNode, 0) : (
                  <div className="py-12 text-center text-xs text-[#909399]">暂无可用的流程架构</div>
                )}
              </div>

              {/* Selected Target Path Summary */}
              <div className="px-5 py-2.5 bg-[#f8fafc] border-t border-[#ebeef5] text-xs flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[#909399] shrink-0 font-medium">变更后目标上级：</span>
                  <span className="text-[#409eff] font-semibold truncate">
                    {selectedParentArch ? selectedParentArch.label : '未选择'}
                  </span>
                  {selectedParentArch && (
                    <span className="text-[11px] text-[#909399] truncate font-mono">
                      ({getArchFullPath(selectedParentArch.id)})
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-[#ebeef5] flex items-center justify-end gap-2.5 bg-[#fafafa] shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => setChangeArchModal((prev) => ({ ...prev, open: false }))}
                  className="h-8 px-4 rounded border border-[#dcdfe6] bg-white hover:border-[#c0c4cc] text-[#606266] cursor-pointer transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={changeArchModal.submitting || !changeArchModal.selectedParentId}
                  onClick={handleSaveChangeArch}
                  className={`h-8 px-5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs ${
                    changeArchModal.submitting || !changeArchModal.selectedParentId ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {changeArchModal.submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>正在变更...</span>
                    </>
                  ) : (
                    <span>确认变更归属</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Import Flow Modal (导入流程模型) */}
      {importFlowModal.open && (() => {
        const archFullPath = getArchFullPath(importFlowModal.parentId);

        return (
          <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-lg w-full max-w-2xl shadow-2xl border border-[#ebeef5] overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#f0f0f0] flex items-center justify-between bg-gradient-to-r from-[#fafbfc] to-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#ecf5ff] text-[#409eff] flex items-center justify-center border border-[#d9ecff]">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1f2733] flex items-center gap-2">
                      <span>导入流程模型</span>
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-[#f4f4f5] text-[#909399]">
                        支持 draw.io / XML / 业务模板
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#909399]">
                      快速载入外部流程图或行业标准业务模板，自动解析图元并挂载至流程架构
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setImportFlowModal((prev) => ({ ...prev, open: false }))}
                  className="p-1 rounded-md text-[#909399] hover:text-[#1f2733] hover:bg-[#f5f7fa] cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Selector */}
              <div className="px-6 pt-3 border-b border-[#f0f0f0] bg-[#fafafa] flex gap-6 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setImportFlowModal((prev) => ({ ...prev, importType: 'file' }))}
                  className={`pb-2.5 font-medium flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                    importFlowModal.importType === 'file'
                      ? 'border-[#409eff] text-[#409eff]'
                      : 'border-transparent text-[#606266] hover:text-[#409eff]'
                  }`}
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>本地文件上传 (.drawio / .xml)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const firstTpl = PRESET_FLOW_TEMPLATES[0];
                    setImportFlowModal((prev) => ({
                      ...prev,
                      importType: 'template',
                      selectedTemplateId: prev.selectedTemplateId || firstTpl.id,
                      label: prev.label || firstTpl.title,
                      flowNo: prev.flowNo || firstTpl.flowNo,
                      flowLevel: prev.flowLevel || firstTpl.flowLevel,
                      description: prev.description || firstTpl.desc,
                      fileName: `${firstTpl.title}.drawio`,
                    }));
                  }}
                  className={`pb-2.5 font-medium flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                    importFlowModal.importType === 'template'
                      ? 'border-[#409eff] text-[#409eff]'
                      : 'border-transparent text-[#606266] hover:text-[#409eff]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>预置标准业务模板 (LTC/IPD/DSTE)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportFlowModal((prev) => ({ ...prev, importType: 'xml' }))}
                  className={`pb-2.5 font-medium flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                    importFlowModal.importType === 'xml'
                      ? 'border-[#409eff] text-[#409eff]'
                      : 'border-transparent text-[#606266] hover:text-[#409eff]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>粘贴流程代码 / XML</span>
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                {/* 1. File Upload Tab */}
                {importFlowModal.importType === 'file' && (
                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".drawio,.xml,.bpmn,.json,.txt"
                      className="hidden"
                    />

                    {!importFlowModal.fileName ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={handleDropFile}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-[#dcdfe6] hover:border-[#409eff] rounded-lg p-7 text-center cursor-pointer transition-colors bg-[#fafbfc] hover:bg-[#f5f9ff] group"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#ecf5ff] text-[#409eff] flex items-center justify-center mx-auto mb-2.5 group-hover:scale-105 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-semibold text-[#1f2733] mb-1">
                          点击上传或将流程文件拖拽至此处
                        </p>
                        <p className="text-[11px] text-[#909399]">
                          支持 <span className="font-mono text-[#409eff]">.drawio</span>,{' '}
                          <span className="font-mono text-[#409eff]">.xml</span>,{' '}
                          <span className="font-mono text-[#409eff]">.bpmn</span> 流程图文件（大小 ≤ 20MB）
                        </p>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-lg border border-[#b3e19d] bg-[#f0f9eb] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-white text-[#67c23a] flex items-center justify-center border border-[#b3e19d] shadow-2xs">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#1f2733]">{importFlowModal.fileName}</span>
                              <span className="px-1.5 py-0.2 rounded bg-white text-[10px] text-[#67c23a] border border-[#b3e19d] font-mono">
                                {importFlowModal.fileSize || '解析完毕'}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#67c23a] pt-0.5">
                              ✓ 流程图元与图层配置已成功就绪，保存后可直接在 draw.io 设计器中二次编辑
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded bg-white border border-[#dcdfe6] text-[#606266] hover:text-[#409eff] hover:border-[#409eff] text-xs cursor-pointer shadow-2xs transition-colors"
                        >
                          重新选择文件
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Preset Templates Tab */}
                {importFlowModal.importType === 'template' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-[#909399]">
                      <span>选择标准行业企业流程模板，快速导入并开箱即用：</span>
                      <span>共 {PRESET_FLOW_TEMPLATES.length} 个行业模板</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {PRESET_FLOW_TEMPLATES.map((tpl) => {
                        const isSelected = importFlowModal.selectedTemplateId === tpl.id;
                        return (
                          <div
                            key={tpl.id}
                            onClick={() => handleSelectImportTemplate(tpl.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#409eff] bg-[#f5f9ff] ring-1 ring-[#409eff]/30 shadow-xs'
                                : 'border-[#ebeef5] bg-white hover:border-[#c0c4cc] hover:bg-[#fafafa]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#409eff] bg-[#409eff]' : 'border-[#dcdfe6]'}`}>
                                  {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </span>
                                <span className="font-bold text-[#1f2733]">{tpl.title}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white border border-[#e4e7ed] text-[#909399]">
                                  {tpl.flowNo}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ecf5ff] text-[#409eff]">
                                  {tpl.category}
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] text-[#606266] pl-5 leading-relaxed line-clamp-1">
                              {tpl.desc}
                            </p>
                            <div className="mt-1.5 pl-5 flex items-center gap-1 text-[10px] text-[#909399] flex-wrap">
                              <span className="text-[#409eff] font-medium">流程环节：</span>
                              {tpl.steps.map((s, idx) => (
                                <React.Fragment key={idx}>
                                  <span className="bg-white px-1.5 py-0.2 rounded border border-[#ebeef5] text-[#606266]">
                                    {s.title}
                                    {s.kcp && <strong className="text-[#f56c6c] ml-0.5">·KCP</strong>}
                                  </span>
                                  {idx < tpl.steps.length - 1 && <span className="text-[#c0c4cc]">→</span>}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Paste XML Tab */}
                {importFlowModal.importType === 'xml' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#909399]">
                      <label className="font-medium text-[#606266]">粘贴 draw.io XML / BPMN 代码：</label>
                      <span>字符数: {(importFlowModal.xmlContent || '').length}</span>
                    </div>
                    <textarea
                      rows={6}
                      value={importFlowModal.xmlContent}
                      onChange={(e) =>
                        setImportFlowModal((prev) => ({ ...prev, xmlContent: e.target.value }))
                      }
                      placeholder="粘贴 <mxfile> 或标准 XML 流程图代码..."
                      className="w-full p-2.5 font-mono text-[11px] border border-[#dcdfe6] rounded focus:border-[#409eff] outline-none bg-[#fafbfc] leading-relaxed"
                    />
                  </div>
                )}

                {/* Common Form: 流程属性及目标挂载架构 */}
                <div className="pt-2 border-t border-[#f0f0f0] space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[#1f2733] font-medium flex items-center justify-between">
                      <span>
                        <span className="text-[#f56c6c]">*</span> 目标挂载架构 (上级所属架构)
                      </span>
                      <span className="text-[11px] text-[#909399] font-normal truncate max-w-xs">
                        当前：{archFullPath}
                      </span>
                    </label>
                    <select
                      value={importFlowModal.parentId}
                      onChange={(e) =>
                        setImportFlowModal((prev) => ({
                          ...prev,
                          parentId: e.target.value,
                          parentLabel: archList.find((a) => a.id === e.target.value)?.label || '',
                        }))
                      }
                      className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded text-xs bg-white text-[#303133] focus:border-[#409eff] outline-none cursor-pointer"
                    >
                      {archList.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.level ? `[${a.level}] ` : ''}
                          {getArchFullPath(a.id)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[#1f2733] font-medium">
                        <span className="text-[#f56c6c]">*</span> 流程名称
                      </label>
                      <input
                        type="text"
                        value={importFlowModal.label}
                        onChange={(e) =>
                          setImportFlowModal((prev) => ({ ...prev, label: e.target.value }))
                        }
                        placeholder="请输入流程名称，如：销售线索转化流程"
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded text-xs focus:border-[#409eff] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[#1f2733] font-medium">
                        <span className="text-[#f56c6c]">*</span> 流程编号
                      </label>
                      <input
                        type="text"
                        value={importFlowModal.flowNo}
                        onChange={(e) =>
                          setImportFlowModal((prev) => ({ ...prev, flowNo: e.target.value }))
                        }
                        placeholder="如：FLOW-LTC-301"
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded text-xs focus:border-[#409eff] outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[#606266]">流程层级</label>
                      <select
                        value={importFlowModal.flowLevel}
                        onChange={(e) =>
                          setImportFlowModal((prev) => ({ ...prev, flowLevel: e.target.value }))
                        }
                        className="w-full h-8 px-2 border border-[#dcdfe6] rounded text-xs bg-white focus:border-[#409eff] outline-none cursor-pointer"
                      >
                        <option value="L3">L3 · 业务流程</option>
                        <option value="L4">L4 · 业务子流程</option>
                        <option value="L5">L5 · 作业活动流程</option>
                        <option value="L6">L6 · 操作规范细则</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[#606266]">责任责任人</label>
                      <input
                        type="text"
                        value={importFlowModal.ownerName}
                        onChange={(e) =>
                          setImportFlowModal((prev) => ({ ...prev, ownerName: e.target.value }))
                        }
                        placeholder="如：系统管理员"
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded text-xs focus:border-[#409eff] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[#606266]">初始版本</label>
                      <input
                        type="text"
                        value={importFlowModal.versionNo}
                        onChange={(e) =>
                          setImportFlowModal((prev) => ({ ...prev, versionNo: e.target.value }))
                        }
                        placeholder="V1.0"
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded text-xs focus:border-[#409eff] outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[#606266]">流程业务说明 / 范围</label>
                    <input
                      type="text"
                      value={importFlowModal.description}
                      onChange={(e) =>
                        setImportFlowModal((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="选填：简要描述该流程的主要输入、输出与适用业务范围"
                      className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded text-xs focus:border-[#409eff] outline-none"
                    />
                  </div>
                </div>

                {/* Import Location Preview */}
                <div className="p-2.5 rounded-md bg-[#f8faff] border border-[#d6e4ff] text-[11px] text-[#595959] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1d39c4] flex items-center gap-1">
                      <Network className="w-3.5 h-3.5" />
                      <span>导入后挂载位置明确：</span>
                    </span>
                    <span className="text-[#409eff] font-mono">
                      {importFlowModal.flowLevel} · {importFlowModal.flowNo || '未填编号'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap text-[#262626]">
                    <span className="text-[#8c8c8c]">{archFullPath}</span>
                    <ChevronRight className="w-3 h-3 text-[#bfbfbf]" />
                    <span className="text-[#409eff] font-bold bg-white px-1.5 py-0.2 rounded border border-[#91d5ff]">
                      {importFlowModal.label.trim() || '新流程名称'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-[#f0f0f0] flex items-center justify-between bg-[#fafbfc] shrink-0">
                <span className="text-[11px] text-[#909399]">
                  {importFlowModal.fileName ? `已选文件: ${importFlowModal.fileName}` : '未选择外部文件，将自动生成合规泳道流程'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImportFlowModal((prev) => ({ ...prev, open: false }))}
                    className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] hover:text-[#1f2733] hover:border-[#c0c4cc] cursor-pointer transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    disabled={importFlowModal.submitting}
                    onClick={handleExecuteImportFlow}
                    className={`h-8 px-5 rounded bg-[#409eff] text-white text-xs font-medium hover:bg-[#3390ff] cursor-pointer transition-colors shadow-xs flex items-center gap-1.5 ${
                      importFlowModal.submitting ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{importFlowModal.submitting ? '正在导入...' : '确认导入并进入设计'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Name Modal */}
      {nameModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md w-[420px] shadow-xl border border-[#ebeef5] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1f2733]">
                {nameModal.mode === 'createArch' && '新建子架构'}
                {nameModal.mode === 'createFlow' && '新建流程模型'}
                {nameModal.mode === 'renameArch' && '重命名架构'}
                {nameModal.mode === 'renameFlow' && '重命名流程'}
              </span>
              <button
                onClick={() => setNameModal({ ...nameModal, open: false })}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <input
                type="text"
                autoFocus
                value={nameModal.value}
                onChange={(e) => setNameModal({ ...nameModal, value: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNameModal()}
                placeholder="请输入名称"
                className="w-full h-9 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] text-xs outline-none"
              />
            </div>
            <div className="px-5 py-3 border-t border-[#ebeef5] flex justify-end gap-2 bg-[#fafafa]">
              <button
                onClick={() => setNameModal({ ...nameModal, open: false })}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveNameModal}
                className="h-8 px-4 rounded bg-[#409eff] text-white text-xs font-medium hover:bg-[#3390ff] cursor-pointer"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Confirm Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md w-[420px] shadow-xl border border-[#ebeef5] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1f2733]">{confirmModal.title}</span>
              <button
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 text-xs text-[#606266] leading-relaxed">{confirmModal.content}</div>
            <div className="px-5 py-3 border-t border-[#ebeef5] flex justify-end gap-2 bg-[#fafafa]">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="h-8 px-4 rounded bg-[#409eff] text-white text-xs font-medium hover:bg-[#3390ff] cursor-pointer"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md w-[520px] shadow-xl border border-[#ebeef5] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1f2733]">{historyModal.title}</span>
              <button
                onClick={() => setHistoryModal({ ...historyModal, open: false })}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#ebeef5] bg-[#fafafa] text-[#909399]">
                    <th className="py-2 px-3">版本号</th>
                    <th className="py-2 px-3">发布人</th>
                    <th className="py-2 px-3">发布时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebeef5]">
                  {historyModal.rows.map((r, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#409eff]">
                        {r.versionNo}
                      </td>
                      <td className="py-2.5 px-3">{r.publishUserName}</td>
                      <td className="py-2.5 px-3 font-mono-tabular text-[#606266]">
                        {r.publishTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-[#ebeef5] flex justify-end bg-[#fafafa]">
              <button
                type="button"
                onClick={() => setHistoryModal({ ...historyModal, open: false })}
                className="h-8 px-4 rounded bg-[#409eff] text-white text-xs cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      <ErrorBoundary
        fallbackTitle="库挑选弹窗异常"
        onReset={() => setPickerModal((prev) => ({ ...prev, open: false }))}
      >
        <ApprovedTreePickerModal
          open={pickerModal.open}
          mode={pickerModal.tab}
          dictBundle={dictBundle}
          initialSelectedIds={pickerModal.targetScope === 'arch' ? archRefs : flowRefs}
          onClose={() => setPickerModal({ ...pickerModal, open: false })}
          onConfirm={async (nextIds) => {
            await handleSaveRefs(pickerModal.targetScope, pickerModal.tab, nextIds);
            setPickerModal({ ...pickerModal, open: false });
            showToast('已更新关联项', 'success');
          }}
          onNavigateToModule={onNavigate}
        />
      </ErrorBoundary>

      <ErrorBoundary
        fallbackTitle="协作者弹窗异常"
        onReset={() => setCollaboratorModal((prev) => ({ ...prev, open: false }))}
      >
        <CollaboratorModal
          open={collaboratorModal.open}
          targetType={collaboratorModal.targetType}
          targetId={collaboratorModal.targetId}
          targetLabel={collaboratorModal.targetLabel}
          targetNo={collaboratorModal.targetNo}
          ownerName={collaboratorModal.ownerName}
          deptName={collaboratorModal.deptName}
          archPath={collaboratorModal.archPath}
          initialCollaborators={collaboratorModal.collaborators}
          onClose={() => setCollaboratorModal({ ...collaboratorModal, open: false })}
          onSaved={handleSaveCollaborators}
          showToast={(msg, type) => showToast(msg, type)}
        />
      </ErrorBoundary>
      {/* Upload Attachment Modal */}
      {uploadAttModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md w-[520px] shadow-xl border border-[#ebeef5] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafafa]">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#409eff]" />
                <span className="text-sm font-semibold text-[#1f2733]">上传流程相关附件</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadAttModal({ ...uploadAttModal, open: false })}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[#606266] mb-1 font-medium">附件编号</label>
                <input
                  type="text"
                  value={uploadAttModal.attNo}
                  onChange={(e) => setUploadAttModal({ ...uploadAttModal, attNo: e.target.value })}
                  placeholder="如 FJ-FLOW-2026-001"
                  className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] font-mono-tabular outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#606266] font-medium">
                    附件名称 <span className="text-[#f56c6c]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => uploadFileInputRef.current?.click()}
                    className="text-[#409eff] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>选择本地文件</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={uploadAttModal.label}
                  onChange={(e) => setUploadAttModal({ ...uploadAttModal, label: e.target.value })}
                  placeholder="请输入或选择附件文件名称 (如 技术评审控制程序.docx)"
                  className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#606266] mb-1 font-medium">业务分类</label>
                  <select
                    value={uploadAttModal.category}
                    onChange={(e) => setUploadAttModal({ ...uploadAttModal, category: e.target.value })}
                    className="w-full h-8 px-2 rounded border border-[#dcdfe6] bg-white outline-none focus:border-[#409eff] cursor-pointer"
                  >
                    <option value="流程操作指引">流程操作指引</option>
                    <option value="业务交付模板">业务交付模板</option>
                    <option value="控制点检查表">控制点检查表</option>
                    <option value="合规审查表单">合规审查表单</option>
                    <option value="培训材料与课件">培训材料与课件</option>
                    <option value="验收评估标准">验收评估标准</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#606266] mb-1 font-medium">文件大小</label>
                  <input
                    type="text"
                    value={uploadAttModal.fileSize}
                    onChange={(e) => setUploadAttModal({ ...uploadAttModal, fileSize: e.target.value })}
                    placeholder="如 1.5 MB"
                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] font-mono-tabular outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#606266] mb-1 font-medium">上传人</label>
                <input
                  type="text"
                  value={uploadAttModal.ownerName}
                  onChange={(e) => setUploadAttModal({ ...uploadAttModal, ownerName: e.target.value })}
                  placeholder="系统管理员"
                  className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none"
                />
              </div>

              <div className="p-3 rounded bg-[#f4f4f5] text-[#909399] text-[11px] leading-relaxed">
                提示：上传的附件将自动加入当前流程（{currentFlow?.label || '当前流程'}）的附件清单中，并在流程资产台账与执行工单中对相关责任人开放查阅与下载。
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#ebeef5] flex justify-end gap-2 bg-[#fafafa]">
              <button
                type="button"
                onClick={() => setUploadAttModal({ ...uploadAttModal, open: false })}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] hover:border-[#c0c4cc] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmUploadAttachment}
                className="h-8 px-4 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium cursor-pointer"
              >
                确认上传并关联
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Term Picker Modal (流程建设下的流程术语库挑选，支持多选) */}
      {termPickerModal.open && (() => {
        const filteredTerms = (termPickerModal.termsList || []).filter((t: any) => {
          if (termPickerModal.category !== 'all' && t.category !== termPickerModal.category) {
            return false;
          }
          if (termPickerModal.search.trim()) {
            const q = termPickerModal.search.trim().toLowerCase();
            return (
              (t.name && t.name.toLowerCase().includes(q)) ||
              (t.content && t.content.toLowerCase().includes(q))
            );
          }
          return true;
        });

        const allFilteredIds = filteredTerms.map((t: any) => String(t.id));
        const isAllSelected =
          allFilteredIds.length > 0 &&
          allFilteredIds.every((id) => termPickerModal.selectedIds.includes(id));

        const toggleSelectAll = () => {
          if (isAllSelected) {
            setTermPickerModal((prev) => ({
              ...prev,
              selectedIds: prev.selectedIds.filter((id) => !allFilteredIds.includes(id)),
            }));
          } else {
            setTermPickerModal((prev) => ({
              ...prev,
              selectedIds: Array.from(new Set([...prev.selectedIds, ...allFilteredIds])),
            }));
          }
        };

        const toggleSelectTerm = (idStr: string) => {
          setTermPickerModal((prev) => {
            const exists = prev.selectedIds.includes(idStr);
            const next = exists
              ? prev.selectedIds.filter((id) => id !== idStr)
              : [...prev.selectedIds, idStr];
            return { ...prev, selectedIds: next };
          });
        };

        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-md w-[800px] max-w-[95vw] shadow-xl border border-[#ebeef5] flex flex-col max-h-[85vh] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafafa] shrink-0">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#409eff]" />
                  <span className="text-sm font-semibold text-[#1f2733]">
                    从流程建设术语库挑选 (支持多选)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTermPickerModal((prev) => ({ ...prev, open: false }))}
                  className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filters */}
              <div className="p-4 border-b border-[#ebeef5] flex flex-wrap items-center justify-between gap-3 bg-white shrink-0 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={termPickerModal.search}
                      onChange={(e) =>
                        setTermPickerModal((prev) => ({ ...prev, search: e.target.value }))
                      }
                      placeholder="搜索术语名称或释义..."
                      className="w-full h-8 pl-8 pr-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2.5 top-2.5" />
                  </div>

                  <select
                    value={termPickerModal.category}
                    onChange={(e) =>
                      setTermPickerModal((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="h-8 px-2.5 rounded border border-[#dcdfe6] bg-white outline-none focus:border-[#409eff] cursor-pointer"
                  >
                    <option value="all">全部分类</option>
                    {(termPickerModal.categories || []).map((c: string) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[#909399]">
                    已选中 <strong className="text-[#409eff] font-mono-tabular">{termPickerModal.selectedIds.length}</strong> 项
                  </span>
                  {termPickerModal.selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTermPickerModal((prev) => ({ ...prev, selectedIds: [] }))}
                      className="text-[#909399] hover:text-[#f56c6c] text-[11px] cursor-pointer underline"
                    >
                      清空已选
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
                {termPickerModal.loading ? (
                  <div className="py-20 text-center text-[#909399] text-xs">
                    正在加载流程术语库...
                  </div>
                ) : filteredTerms.length === 0 ? (
                  <div className="py-20 text-center text-[#909399] text-xs">
                    未检索到符合条件的流程术语，请调整筛选条件
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#ebeef5] bg-[#fafafa] text-[#909399]">
                        <th className="py-2.5 px-3 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            className="rounded border-[#dcdfe6] text-[#409eff] cursor-pointer"
                          />
                        </th>
                        <th className="py-2.5 px-3 w-20">序号</th>
                        <th className="py-2.5 px-3 w-40">术语名称</th>
                        <th className="py-2.5 px-3 w-32">业务分类</th>
                        <th className="py-2.5 px-3">术语定义与说明</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebeef5]">
                      {filteredTerms.map((t: any) => {
                        const idStr = String(t.id);
                        const isChecked = termPickerModal.selectedIds.includes(idStr);
                        return (
                          <tr
                            key={idStr}
                            onClick={() => toggleSelectTerm(idStr)}
                            className={`cursor-pointer transition-colors ${
                              isChecked ? 'bg-[#ecf5ff]/60 hover:bg-[#ecf5ff]' : 'hover:bg-[#f5f7fa]'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectTerm(idStr)}
                                className="rounded border-[#dcdfe6] text-[#409eff] cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-mono-tabular text-[#909399]">{t.id}</td>
                            <td className="py-2.5 px-3 font-semibold text-[#1f2733]">
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff] text-[11px]">
                                {t.name}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#606266]">
                              <span className="px-2 py-0.5 rounded bg-[#f4f4f5] text-[#606266] text-[11px]">
                                {t.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#606266] leading-relaxed">
                              {t.content}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-[#ebeef5] flex items-center justify-between bg-[#fafafa] shrink-0 text-xs">
                <span className="text-[#909399]">
                  从「流程建设 · 流程术语」中多选，已选 <strong className="text-[#409eff]">{termPickerModal.selectedIds.length}</strong> 项
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTermPickerModal((prev) => ({ ...prev, open: false }))}
                    className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-[#606266] hover:border-[#c0c4cc] cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const nextIds = termPickerModal.selectedIds;
                      await handleSaveRefs('flow', 'lcsy', nextIds);
                      setTermPickerModal((prev) => ({ ...prev, open: false }));
                      showToast(`已成功关联 ${nextIds.length} 项流程术语`, 'success');
                    }}
                    className="h-8 px-4 rounded bg-[#409eff] hover:bg-[#3390ff] text-white font-medium cursor-pointer"
                  >
                    确定添加 ({termPickerModal.selectedIds.length} 项)
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* Import Flow Modal (导入业务流程弹窗：文件导入 / 企业标准模板 / 源码导入) */}
      {/* ============================================================== */}
      {importFlowModal.open && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-[820px] max-w-[96vw] max-h-[92vh] shadow-2xl border border-[#ebeef5] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#ebeef5] flex items-center justify-between bg-gradient-to-r from-[#f8fafc] to-[#edf2f7] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff] flex items-center justify-center shadow-2xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1f2733] flex items-center gap-2">
                    导入业务流程
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#ecf5ff] text-[#409eff] font-medium border border-[#d9ecff]">
                      支持 .drawio / .xml / BPMN
                    </span>
                  </h3>
                  <p className="text-xs text-[#909399] mt-0.5">
                    从本地图表文件、企业标准预置模板或源码快速导入并生成可视化可编排流程
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportFlowModal((prev) => ({ ...prev, open: false }))}
                className="w-8 h-8 rounded-lg text-[#909399] hover:text-[#1f2733] hover:bg-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Import Source Tabs */}
              <div className="flex items-center gap-2 border-b border-[#e2e8f0] pb-2">
                <button
                  type="button"
                  onClick={() => setImportFlowModal((prev) => ({ ...prev, importType: 'file' }))}
                  className={`px-3.5 py-1.5 rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                    importFlowModal.importType === 'file'
                      ? 'bg-[#409eff] text-white shadow-xs'
                      : 'text-[#606266] hover:bg-[#f1f5f9]'
                  }`}
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>本地文件上传</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportFlowModal((prev) => ({ ...prev, importType: 'template' }))}
                  className={`px-3.5 py-1.5 rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                    importFlowModal.importType === 'template'
                      ? 'bg-[#409eff] text-white shadow-xs'
                      : 'text-[#606266] hover:bg-[#f1f5f9]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>选用企业标准模板</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportFlowModal((prev) => ({ ...prev, importType: 'xml' }))}
                  className={`px-3.5 py-1.5 rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                    importFlowModal.importType === 'xml'
                      ? 'bg-[#409eff] text-white shadow-xs'
                      : 'text-[#606266] hover:bg-[#f1f5f9]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>粘贴 XML / BPMN 源码</span>
                </button>
              </div>

              {/* Source 1: File Upload */}
              {importFlowModal.importType === 'file' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".drawio,.xml,.bpmn,.json,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {importFlowModal.fileName ? (
                    <div className="p-4 rounded-xl border border-[#b3d8ff] bg-[#f0f7ff] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#409eff] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-[#1f2733] text-sm flex items-center gap-2">
                            {importFlowModal.fileName}
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#67c23a] text-white">
                              已就绪
                            </span>
                          </div>
                          <div className="text-[11px] text-[#606266] mt-0.5 flex items-center gap-2">
                            <span>大小：{importFlowModal.fileSize || '未知'}</span>
                            <span>•</span>
                            <span>图表节点与泳道已完成结构化解析</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-md border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-[#606266] text-xs font-medium cursor-pointer shadow-2xs"
                        >
                          重新选择文件
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setImportFlowModal((prev) => ({
                              ...prev,
                              fileName: '',
                              fileSize: '',
                              xmlContent: '',
                            }))
                          }
                          className="px-2.5 py-1.5 rounded-md text-[#f56c6c] hover:bg-[#fef0f0] text-xs cursor-pointer"
                        >
                          移除
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={handleDropFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="p-8 rounded-xl border-2 border-dashed border-[#c0d8f8] bg-[#f8fbff] hover:bg-[#f0f7ff] hover:border-[#409eff] text-center cursor-pointer transition-all space-y-3 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#ecf5ff] text-[#409eff] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-xs">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#1f2733]">
                          点击此处浏览文件 或 将文件拖拽至此区域
                        </div>
                        <p className="text-xs text-[#909399] mt-1">
                          支持 draw.io 图表文件 (.drawio)、流程 XML 文件 (.xml)、BPMN 2.0 流程文件
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#dcdfe6] text-[#606266] text-[11px] shadow-2xs">
                        <span>支持格式: .drawio, .xml, .bpmn, .json</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Source 2: Enterprise Templates */}
              {importFlowModal.importType === 'template' && (
                <div className="space-y-2.5">
                  <div className="text-[#606266] text-[11px]">
                    从企业最佳业务实践沉淀的成熟流程模板库中挑选，导入后可直接进入编辑器根据实际业务调整泳道与节点：
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                    {PRESET_FLOW_TEMPLATES.map((tpl) => {
                      const isSelected = importFlowModal.selectedTemplateId === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => handleSelectImportTemplate(tpl.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-2xs ${
                            isSelected
                              ? 'border-[#409eff] bg-[#ecf5ff]/60 ring-2 ring-[#409eff]/20'
                              : 'border-[#e2e8f0] bg-white hover:border-[#409eff]/60 hover:bg-[#fafbfc]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <span className="font-bold text-xs text-[#1f2733] flex items-center gap-1.5">
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#409eff]" />}
                                {tpl.title}
                              </span>
                              <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
                                {tpl.flowLevel}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#909399] leading-relaxed line-clamp-2">
                              {tpl.desc}
                            </div>
                          </div>
                          <div className="pt-1.5 border-t border-[#f1f5f9] flex items-center justify-between text-[10.5px] text-[#909399]">
                            <span className="font-mono-tabular font-medium">{tpl.flowNo}</span>
                            <span className="text-[#409eff] font-medium">{tpl.steps.length} 个端到端阶段</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Source 3: Raw XML Editor */}
              {importFlowModal.importType === 'xml' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#909399]">
                    <span>直接粘贴 draw.io 或 BPMN 格式 XML 文本代码：</span>
                    <span>{importFlowModal.xmlContent.length} 字符</span>
                  </div>
                  <textarea
                    rows={7}
                    value={importFlowModal.xmlContent}
                    onChange={(e) =>
                      setImportFlowModal((prev) => ({ ...prev, xmlContent: e.target.value }))
                    }
                    placeholder="<mxfile host='app.diagrams.net'>&#10;  <diagram id='...'>&#10;    ...&#10;  </diagram>&#10;</mxfile>"
                    className="w-full p-3 font-mono text-xs rounded-xl border border-[#dcdfe6] focus:border-[#409eff] focus:ring-2 focus:ring-[#409eff]/15 outline-none bg-[#f8fafc] text-[#303133]"
                  />
                </div>
              )}

              {/* Target Hierarchy & Parameters */}
              <div className="p-4 rounded-xl border border-[#e2e8f0] bg-[#fafbfc] space-y-3.5">
                <div className="font-bold text-xs text-[#1f2733] flex items-center gap-1.5 pb-2 border-b border-[#e2e8f0]">
                  <Network className="w-3.5 h-3.5 text-[#409eff]" />
                  <span>流程归属与基本属性配置</span>
                </div>

                {/* Parent Arch Selector */}
                <div>
                  <label className="block text-[#606266] font-medium mb-1">
                    目标归属架构节点 <span className="text-[#f56c6c]">*</span>
                  </label>
                  <select
                    value={importFlowModal.parentId}
                    onChange={(e) => {
                      const newParentId = e.target.value;
                      const parentArch = archList.find((a) => a.id === newParentId);
                      setImportFlowModal((prev) => ({
                        ...prev,
                        parentId: newParentId,
                        parentLabel: parentArch?.label || '',
                        flowLevel:
                          parentArch?.level && parentArch.level.startsWith('L')
                            ? `L${Math.min(6, parseInt(parentArch.level.slice(1), 10) + 1)}`
                            : 'L3',
                      }));
                    }}
                    className="w-full h-8 px-2.5 rounded-lg border border-[#dcdfe6] bg-white text-xs outline-none focus:border-[#409eff] cursor-pointer"
                  >
                    {archList.map((a) => {
                      const level = resolveArchLevel(a, archList);
                      return (
                        <option key={a.id} value={a.id}>
                          {level} · {a.label} ({a.archNo || a.id})
                        </option>
                      );
                    })}
                  </select>
                  <div className="mt-1.5 text-[11px] text-[#909399] flex items-center gap-1">
                    <span>当前归属路径：</span>
                    <span className="text-[#409eff] font-medium">
                      {getArchBreadcrumbs(importFlowModal.parentId)
                        .map((b) => b.label)
                        .join(' > ') || '企业流程架构全景'}
                    </span>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#606266] font-medium mb-1">
                      流程名称 <span className="text-[#f56c6c]">*</span>
                    </label>
                    <input
                      type="text"
                      value={importFlowModal.label}
                      onChange={(e) =>
                        setImportFlowModal((prev) => ({ ...prev, label: e.target.value }))
                      }
                      placeholder="如：线索流转与立项审核流程"
                      className="w-full h-8 px-2.5 rounded-lg border border-[#dcdfe6] focus:border-[#409eff] outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[#606266] font-medium mb-1">
                      流程编号 <span className="text-[#f56c6c]">*</span>
                    </label>
                    <input
                      type="text"
                      value={importFlowModal.flowNo}
                      onChange={(e) =>
                        setImportFlowModal((prev) => ({ ...prev, flowNo: e.target.value }))
                      }
                      placeholder="如：LTC-ML-002"
                      className="w-full h-8 px-2.5 rounded-lg border border-[#dcdfe6] focus:border-[#409eff] outline-none font-mono-tabular bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[#606266] font-medium mb-1">流程层级</label>
                    <select
                      value={importFlowModal.flowLevel}
                      onChange={(e) =>
                        setImportFlowModal((prev) => ({ ...prev, flowLevel: e.target.value }))
                      }
                      className="w-full h-8 px-2.5 rounded-lg border border-[#dcdfe6] focus:border-[#409eff] outline-none bg-white cursor-pointer"
                    >
                      <option value="L3">L3 · 业务流程组</option>
                      <option value="L4">L4 · 业务流程</option>
                      <option value="L5">L5 · 流程子活动</option>
                      <option value="L6">L6 · 任务操作规范</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#606266] font-medium mb-1">初始版本号</label>
                    <input
                      type="text"
                      value={importFlowModal.versionNo}
                      onChange={(e) =>
                        setImportFlowModal((prev) => ({ ...prev, versionNo: e.target.value }))
                      }
                      placeholder="V1.0"
                      className="w-full h-8 px-2.5 rounded-lg border border-[#dcdfe6] focus:border-[#409eff] outline-none font-mono-tabular bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[#606266] font-medium mb-1">流程责任人</label>
                    <input
                      type="text"
                      value={importFlowModal.ownerName}
                      onChange={(e) =>
                        setImportFlowModal((prev) => ({ ...prev, ownerName: e.target.value }))
                      }
                      placeholder="系统管理员"
                      className="w-full h-8 px-2.5 rounded-lg border border-[#dcdfe6] focus:border-[#409eff] outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[#606266] font-medium mb-1">业务描述 / 目的</label>
                    <input
                      type="text"
                      value={importFlowModal.description}
                      onChange={(e) =>
                        setImportFlowModal((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="规范业务全生命周期，保障合规与高质交付"
                      className="w-full h-8 px-2.5 rounded-lg border border-[#dcdfe6] focus:border-[#409eff] outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-[#ebeef5] flex items-center justify-between bg-[#fafafa] shrink-0 text-xs">
              <span className="text-[#909399]">
                导入后流程将归入目标架构，并可随时点击打开全屏可视化编辑器进行设计
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImportFlowModal((prev) => ({ ...prev, open: false }))}
                  className="h-8 px-4 rounded-lg border border-[#dcdfe6] bg-white text-[#606266] hover:border-[#c0c4cc] cursor-pointer transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={importFlowModal.submitting}
                  onClick={handleExecuteImportFlow}
                  className="h-8 px-5 rounded-lg bg-[#409eff] hover:bg-[#3390ff] disabled:opacity-50 text-white font-medium cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {importFlowModal.submitting ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>正在导入...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>确认导入并进入设计</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 提交发布审核与直接发布弹窗 (支持选择审批人、审批部门负责人、流程委员会等，多层级审批，支持立即发布和按照时间预约发布) */}
      <FlowPublishAuditModal
        open={publishAuditModal.open}
        mode={publishAuditModal.mode}
        flow={publishAuditModal.targetFlow || currentFlow}
        archPath={
          currentFlow?.id ? getArchHierarchyPath(currentFlow.id, true, archList, flowList) : undefined
        }
        currentUser={currentUser}
        onClose={() => setPublishAuditModal((prev) => ({ ...prev, open: false }))}
        onSuccess={() => {
          loadAllTreeData();
        }}
        showToast={showToast}
      />
    </div>
  );
};

