import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Calendar,
  X,
  Folder,
  FolderOpen,
  Link2,
  AlertCircle,
  CheckCircle2,
  Download,
  Upload,
  PenLine,
  Building2,
  Layers,
  Scale,
  Calculator,
  GitMerge,
  ArrowRight,
  ShieldCheck,
  Table2,
  SlidersHorizontal,
  Send,
  Rocket,
  Sparkles,
  FileSpreadsheet,
  BookOpen,
  FileText,
  Printer,
  History,
  Eye,
  FileCheck2,
  TrendingUp,
  Check,
  LayoutGrid,
  Columns,
  ChevronUp,
  Filter,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { EnterpriseDataGrid, DataGridColumn } from './EnterpriseDataGrid';
import {
  FlowActivityNode,
  NodeConstraintRule,
  ConstraintSimulationParams,
  ConstraintSimulationResult,
  getFlowActivityNodes,
  evaluateNodeConstraint,
  PRESET_FLOW_ACTIVITIES,
} from '../utils/flowDutyBinding';

export interface DutyTierMatrix {
  tier_10?: string;
  tier_50?: string;
  tier_200?: string;
  tier_500?: string;
  tier_2000?: string;
}

export interface DutyConfigItem {
  id: string;
  flowCategory: string;
  orgScope?: string;
  businessScenario?: string;
  roleName: string;
  businessItem: string;
  flowId?: string;
  flowName: string;
  operationAuthType?: string;
  amountTier?: string;
  budgetType?: string;
  approverLevel?: string;
  raciMap: Record<string, string>;
  tierMatrix?: DutyTierMatrix;
  remark: string;
  sysDocNo: string;
  outputDeliverable: string;
  boundFlowId?: string;
  boundFlowCode?: string;
  boundFlowName?: string;
  boundActivityNodeId?: string;
  boundActivityNodeName?: string;
  boundActivityNodeType?: string;
  nodeConstraint?: NodeConstraintRule;
}

export interface DutyCategoryNode {
  id: string;
  code: string;
  name: string;
  orgScope?: string;
  roleCount?: number;
  creator?: string;
  updater?: string;
  updateTime?: string;
  desc?: string;
}

export interface DutyTableRecord {
  id: string;
  parentId?: string;
  categoryCode?: string;
  categoryName?: string;
  code: string;
  roleName: string;
  dutyName: string;
  orgScope?: string;
  orgUnit?: string;
  businessScenario?: string;
  maxAuthAmount?: string;
  creator: string;
  approvalStatus: '草稿' | '待审核' | '已审核' | '已驳回';
  updater: string;
  version: string;
  publishDate: string;
  updateTime: string;
  repealed?: boolean;
  repealReason?: string;
  collabDepts: string[];
  items: DutyConfigItem[];
  approverLevel?: string;
  amountTier?: string;
  budgetType?: string;
  raciMap?: Record<string, string>;
  sysDocNo?: string;
  outputDeliverable?: string;
  boundFlowId?: string;
  boundFlowCode?: string;
  boundFlowName?: string;
  boundActivityNodeId?: string;
  boundActivityNodeName?: string;
  nodeConstraint?: NodeConstraintRule;
}

export interface TreeTableRow {
  rowKey: string;
  nodeType: 'category' | 'scenario';
  code: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  scenarioName: string;
  roleName: string;
  orgScope: string;
  orgUnit: string;
  maxAuthAmount: string;
  creator: string;
  approvalStatus: string;
  updater: string;
  version: string;
  publishDate: string;
  updateTime: string;
  childCount?: number;
  categoryRaw?: DutyCategoryNode;
  scenarioRaw?: DutyTableRecord;
}

interface DutyManageViewProps {
  subPath: string;
  flows: any[];
  archTypes: { id: string; label: string }[];
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onNavigate?: (path: string, formKey?: string) => void;
}

const DEFAULT_COLLAB_DEPTS = [
  '决策委员会',
  '总裁办',
  '研发部',
  '产品部',
  '市场部',
  '财务部',
  '人力行政部',
  '质量合规部',
];

const ORG_SCOPES = [
  { key: '集团总部', label: '集团总部', desc: '全集团最高战略与审批', badgeClass: 'bg-[#ecf5ff] text-[#409eff] border-[#b3d8ff]' },
  { key: '一级子公司', label: '一级子公司', desc: '独立法人主体', badgeClass: 'bg-[#f0f9eb] text-[#67c23a] border-[#c2e7b0]' },
  { key: '事业部', label: '事业部', desc: '业务单元(BU)', badgeClass: 'bg-[#fdf6ec] text-[#e6a23c] border-[#f5dab1]' },
  { key: '职能部门', label: '职能部门', desc: '专业职能线', badgeClass: 'bg-[#f4f4f5] text-[#606266] border-[#d3d4d6]' },
];

const OPERATION_AUTH_TYPES = [
  '组织编制',
  '专业复核',
  '合规审查',
  '终审批准',
  '签署发布',
];

export function evaluateItemRaci(item: DutyConfigItem): {
  valid: boolean;
  aRoles: string[];
  rRoles: string[];
  cRoles: string[];
  iRoles: string[];
  sRoles: string[];
  issues: string[];
} {
  const map = item.raciMap || {};
  const aRoles: string[] = [];
  const rRoles: string[] = [];
  const cRoles: string[] = [];
  const iRoles: string[] = [];
  const sRoles: string[] = [];

  Object.entries(map).forEach(([dept, val]) => {
    const base = String(val || '').trim().slice(0, 1).toUpperCase();
    if (base === 'A') aRoles.push(dept);
    else if (base === 'R') rRoles.push(dept);
    else if (base === 'C') cRoles.push(dept);
    else if (base === 'I') iRoles.push(dept);
    else if (base === 'S') sRoles.push(dept);
  });

  const issues: string[] = [];
  if (aRoles.length === 0) {
    issues.push('缺少唯一终裁责任人 A (Accountable)');
  } else if (aRoles.length > 1) {
    issues.push(`存在 ${aRoles.length} 个终审人 A (${aRoles.join('/')})，违反唯一终裁原则`);
  }
  if (rRoles.length === 0) {
    issues.push('缺少具体承办执行人 R (Responsible)');
  }

  return {
    valid: aRoles.length === 1 && rRoles.length >= 1,
    aRoles,
    rRoles,
    cRoles,
    iRoles,
    sRoles,
    issues,
  };
}

export const DutyManageView: React.FC<DutyManageViewProps> = ({
  subPath,
  flows,
  archTypes,
  showToast,
  onNavigate,
}) => {
  const [duties, setDuties] = useState<DutyTableRecord[]>([]);
  const [collabDepts, setCollabDepts] = useState<string[]>(DEFAULT_COLLAB_DEPTS);
  const [categories, setCategories] = useState<DutyCategoryNode[]>([]);
  const [loading, setLoading] = useState(false);

  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterScenario, setFilterScenario] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const fetchDuties = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/flowdoc/duties').then((r) => r.json());
      if (res.status === 1 && Array.isArray(res.data)) {
        setDuties(res.data);
      }
      if (Array.isArray(res.collabDepts) && res.collabDepts.length > 0) {
        setCollabDepts(res.collabDepts);
      }
      if (Array.isArray(res.categories)) {
        setCategories(res.categories);
      }
    } catch {
      showToast('获取权责数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuties();
  }, []);

  const filteredDuties = useMemo(() => {
    return duties.filter((d) => {
      if (subPath === '/flowdoc/repeal') {
        if (!d.repealed) return false;
      } else {
        if (d.repealed) return false;
      }
      if (filterCategory && d.categoryName !== filterCategory) return false;
      if (filterScenario.trim() && !d.dutyName.toLowerCase().includes(filterScenario.trim().toLowerCase())) return false;
      if (filterStatus && d.approvalStatus !== filterStatus) return false;
      return true;
    });
  }, [duties, subPath, filterCategory, filterScenario, filterStatus]);

  const treeColumns: DataGridColumn<DutyTableRecord>[] = [
    {
      key: 'code',
      label: '权责编码',
      defaultWidth: 120,
      minWidth: 90,
      fixed: 'left',
      render: (row) => <span className="font-mono font-medium">{row.code}</span>,
    },
    {
      key: 'dutyName',
      label: '权责事项名称',
      defaultWidth: 260,
      minWidth: 180,
      fixed: 'left',
      render: (row) => <span className="font-semibold text-[#1f2733]">{row.dutyName}</span>,
    },
    {
      key: 'roleName',
      label: '主责角色 (R)',
      defaultWidth: 150,
      minWidth: 110,
      render: (row) => <span className="text-[#409eff] font-medium">{row.roleName}</span>,
    },
    {
      key: 'maxAuthAmount',
      label: '授权额度上限',
      defaultWidth: 140,
      minWidth: 100,
      render: (row) => <span className="font-mono text-[#e6a23c] font-semibold">{row.maxAuthAmount || '按级审批'}</span>,
    },
    {
      key: 'approvalStatus',
      label: '审批状态',
      defaultWidth: 100,
      minWidth: 80,
      align: 'center',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
            row.approvalStatus === '已审核'
              ? 'bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8]'
              : 'bg-[#fdf6ec] text-[#e6a23c] border border-[#faecd8]'
          }`}
        >
          {row.approvalStatus}
        </span>
      ),
    },
    {
      key: 'version',
      label: '版本号',
      defaultWidth: 85,
      minWidth: 70,
      align: 'center',
      render: (row) => <span className="font-mono text-[#606266]">{row.version}</span>,
    },
    {
      key: 'updateTime',
      label: '更新时间',
      defaultWidth: 165,
      minWidth: 135,
      align: 'center',
      render: (row) => <span className="font-mono text-[#606266]">{row.updateTime}</span>,
    },
  ];

  return (
    <div className="h-full flex flex-col gap-3 min-h-0 select-none">
      <div className="bg-white rounded border border-[#ebeef5] p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#409eff]/10 text-[#409eff] flex items-center justify-center font-bold">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1f2733]">
              {subPath === '/flowdoc/dutyList'
                ? '权责手册'
                : subPath === '/flowdoc/repeal'
                ? '废止清单'
                : '企业分权授权与权责清单 (DOA)'}
            </h3>
            <p className="text-xs text-[#909399]">权责明细与 RACI 矩阵治理中心</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => showToast('已成功刷新权责列表', 'success')}
            className="h-8 px-3.5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium cursor-pointer"
          >
            刷新
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded border border-[#ebeef5] p-4 flex flex-col min-h-0">
        <EnterpriseDataGrid
          storageKey="dflow_duty_master_grid_v2"
          columns={treeColumns}
          data={filteredDuties}
          rowKey={(r) => r.id}
          emptyText="暂无权责清单记录"
          maxHeight="calc(100vh - 280px)"
        />
      </div>
    </div>
  );
};
