import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PersonSelectField } from './PersonSelectField';
import { PersonSelectModal } from './PersonSelectModal';
import { DeptSelectField } from './DeptSelectField';
import { DeptSelectModal } from './DeptSelectModal';
import {
  Search,
  RotateCcw,
  Plus,
  FileText,
  Paperclip,
  Edit3,
  Sliders,
  Copy,
  Archive,
  Trash2,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  History,
  Upload,
  Download,
  Eye,
  Info,
  Building2,
  Users,
  ArrowLeft,
  MoreHorizontal,
  Folder,
  FolderOpen,
  Network,
  Clock,
  ArrowUpDown,
  FileSpreadsheet,
  Send,
  MoveHorizontal,
} from 'lucide-react';
import {
  useTableDnDAndResize,
  TableHeaderCell,
  TableColumnConfig,
  TableResizeGuideLine,
  TableColGroup,
} from '../hooks/useTableDnDAndResize';

export interface CategoryTreeNode {
  id: string;
  name: string;
  parentId?: string | null;
  orderNum?: number;
  children?: CategoryTreeNode[];
}

// Recursive helper to find any node in category tree
export function findCategoryNodeInTree(nodes: CategoryTreeNode[], id: string): CategoryTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findCategoryNodeInTree(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Helper to get full breadcrumb path of CategoryTreeNodes from root to target
export function getCategoryPathList(
  nodes: CategoryTreeNode[],
  targetId: string,
  currentPath: CategoryTreeNode[] = []
): CategoryTreeNode[] | null {
  for (const node of nodes) {
    const nextPath = [...currentPath, node];
    if (node.id === targetId) return nextPath;
    if (node.children && node.children.length > 0) {
      const found = getCategoryPathList(node.children, targetId, nextPath);
      if (found) return found;
    }
  }
  return null;
}

// Check if testNodeId is a descendant of ancestorNode
export function isCategoryDescendant(ancestorNode: CategoryTreeNode, testNodeId: string): boolean {
  if (!ancestorNode.children || ancestorNode.children.length === 0) return false;
  for (const child of ancestorNode.children) {
    if (child.id === testNodeId) return true;
    if (isCategoryDescendant(child, testNodeId)) return true;
  }
  return false;
}

// Flatten category tree into directory catalog options for selection
export interface FlatCategoryOption {
  id: string | null;
  name: string;
  level: number;
  pathText: string;
  disabled?: boolean;
}

export function flattenCategoryCatalog(
  nodes: CategoryTreeNode[],
  currentEditingId?: string | null,
  currentLevel = 1,
  prefixPath = '',
  parentDisabled = false
): FlatCategoryOption[] {
  const result: FlatCategoryOption[] = [];

  for (const node of nodes) {
    const currentPath = prefixPath ? `${prefixPath} / ${node.name}` : node.name;
    const isEditingSelf = currentEditingId ? node.id === currentEditingId : false;
    const isDisabled = parentDisabled || isEditingSelf;

    result.push({
      id: node.id,
      name: node.name,
      level: currentLevel,
      pathText: currentPath,
      disabled: isDisabled,
    });

    if (node.children && node.children.length > 0) {
      const childOptions = flattenCategoryCatalog(
        node.children,
        currentEditingId,
        currentLevel + 1,
        currentPath,
        isDisabled
      );
      result.push(...childOptions);
    }
  }

  return result;
}

// Get all descendant IDs of a category node
export function getAllDescendantIds(node: CategoryTreeNode): string[] {
  const ids = [node.id];
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      ids.push(...getAllDescendantIds(child));
    }
  }
  return ids;
}

export type ApprovalRoleType = '通用' | '职位' | '人员';

export interface ApprovalRoleItem {
  value: string;
  type: ApprovalRoleType;
}

export interface ScenarioConfigBlock {
  id: string;
  condition: string;
  propose: ApprovalRoleItem;
  jointReview: ApprovalRoleItem;
  jointReviewAllowReject: boolean;
  approve1: ApprovalRoleItem;
  approve2: ApprovalRoleItem;
  record: ApprovalRoleItem;
  other: ApprovalRoleItem;
  audit: ApprovalRoleItem;
}

export interface ScenarioRule {
  id: string;
  conditionName: string;
  approverName: string;
}

export interface DutyItemRecord {
  id: string;
  manualId: string;
  manualName: string;
  categoryId: string;
  categoryName: string;
  dutyNo: string;
  dutyName: string;
  scenarioText?: string;
  scenarios?: ScenarioRule[];
  scenarioBlocks?: ScenarioConfigBlock[];
  primaryRole?: string;
  scope?: string;
  effectiveApproval?: string;
  submitTime?: string;
  status: '草稿' | '待审核' | '审核中' | '已生效' | '已发布' | '已驳回';
  version?: string;
  updateTime: string;
}

export const createDefaultScenarioBlock = (condition = '应付, >100, '): ScenarioConfigBlock => ({
  id: 'block_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
  condition,
  propose: { value: '项目组', type: '通用' },
  jointReview: { value: '', type: '通用' },
  jointReviewAllowReject: false,
  approve1: { value: '', type: '通用' },
  approve2: { value: '', type: '通用' },
  record: { value: '', type: '通用' },
  other: { value: '', type: '通用' },
  audit: { value: '', type: '通用' },
});

export const initScenarioBlocks = (item: DutyItemRecord): ScenarioConfigBlock[] => {
  if (Array.isArray(item.scenarioBlocks) && item.scenarioBlocks.length > 0) {
    return JSON.parse(JSON.stringify(item.scenarioBlocks));
  }
  if (item.scenarioText) {
    const lines = item.scenarioText.split('\n').filter(Boolean);
    if (lines.length > 0) {
      return lines.map((line, idx) => {
        const parts = line.split(':');
        const cond = parts[0]?.replace(/[【】]/g, '').trim() || '';
        const app = parts[1]?.trim() || '';
        const isDefault = !app || app === '未配置批准1内容';
        return {
          id: 'block_' + idx + '_' + Date.now().toString(36),
          condition: cond,
          propose: { value: idx === 0 ? '项目组' : '', type: '通用' },
          jointReview: { value: '', type: '通用' },
          jointReviewAllowReject: false,
          approve1: { value: isDefault ? '' : app, type: '通用' },
          approve2: { value: '', type: '通用' },
          record: { value: '', type: '通用' },
          other: { value: '', type: '通用' },
          audit: { value: '', type: '通用' },
        };
      });
    }
  }
  return [createDefaultScenarioBlock(item.dutyNo === 'PR-AP-0012' ? '应付, >100, ' : '')];
};

export interface DutyManualRecord {
  id: string;
  manualNo: string;
  manualName: string;
  attachment: string;
  categoryCount: number;
  publishedCount: number;
  totalCount: number;
  viewPermissions: string[];
  status: '草稿' | '已发布' | '已归档';
  archived?: boolean;
  description?: string;
  creator: string;
  createTime: string;
  updater: string;
  updateTime: string;
  categoryTree?: CategoryTreeNode[];
  items?: DutyItemRecord[];
}

interface DutyBuildViewProps {
  subPath: string;
  flows?: any[];
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onNavigate?: (path: string) => void;
}

const ALL_DEPTS = [
  '系统管理部',
  '流程管理部',
  '权责管理部',
  '知识管理部',
  '研发管理中心',
  '结构开发部',
  '软件开发部',
  '电气开发部',
  '项目管理部',
  '质量合规部',
  '市场营销部',
  '财务部',
  '人力行政部',
  '总裁办',
  '决策委员会',
  'TZ测试部门',
  'TZ测试1部',
];

export const AUDIT_APPROVER_CANDIDATES = [
  { name: '张明', role: '权责推进专员', dept: '权责管理部' },
  { name: '陈静', role: '合规法务总监', dept: '质量合规部' },
  { name: '刘建国', role: '决策委员会主任', dept: '决策委员会' },
  { name: '王强', role: '内控审计主管', dept: '审计监察部' },
  { name: '李芳', role: '财务风控经理', dept: '财务管理中心' },
  { name: '张三', role: '财务主管', dept: '财务部' },
  { name: '流程管理员', role: '流程推进官', dept: '流程管理部' },
];

export const DUTY_ITEM_COLUMNS: TableColumnConfig[] = [
  { key: 'selection', title: '', defaultWidth: 44, minWidth: 44, fixed: 'left', canDrag: false, canResize: false, align: 'center' },
  { key: 'manualName', title: '权责手册', defaultWidth: 150, minWidth: 100 },
  { key: 'categoryName', title: '权责分类', defaultWidth: 120, minWidth: 80 },
  { key: 'dutyNo', title: '权责编号', defaultWidth: 110, minWidth: 80 },
  { key: 'dutyName', title: '权责名称', defaultWidth: 140, minWidth: 90 },
  { key: 'scenario', title: '分支场景/最终批准人', defaultWidth: 260, minWidth: 140 },
  { key: 'scope', title: '授权使用范围', defaultWidth: 160, minWidth: 100 },
  { key: 'effectiveApproval', title: '生效审批', defaultWidth: 160, minWidth: 100 },
  { key: 'submitTime', title: '提交时间', defaultWidth: 150, minWidth: 100 },
  { key: 'status', title: '状态', defaultWidth: 95, minWidth: 70, align: 'center' },
  { key: 'actions', title: '操作', defaultWidth: 230, minWidth: 180, fixed: 'right', canDrag: false, align: 'center' },
];

export const MANUAL_COLUMNS: TableColumnConfig[] = [
  { key: 'manualNo', title: '权责手册编号', defaultWidth: 160, minWidth: 110 },
  { key: 'manualName', title: '权责手册名称', defaultWidth: 220, minWidth: 140 },
  { key: 'attachment', title: '手册附件', defaultWidth: 130, minWidth: 90, align: 'center' },
  { key: 'categoryCount', title: '权责类别数量', defaultWidth: 110, minWidth: 80, align: 'center' },
  { key: 'publishedCount', title: '已发布权责条数', defaultWidth: 120, minWidth: 80, align: 'center' },
  { key: 'totalCount', title: '权责总条数', defaultWidth: 110, minWidth: 80, align: 'center' },
  { key: 'viewPermissions', title: '查阅权限', defaultWidth: 260, minWidth: 140 },
  { key: 'actions', title: '操作', defaultWidth: 230, minWidth: 180, fixed: 'right', canDrag: false, align: 'center' },
];

const ROLE_TYPES: ApprovalRoleType[] = ['通用', '职位', '人员'];

interface RoleInputGroupProps {
  label: string;
  item: ApprovalRoleItem;
  onChange: (val: ApprovalRoleItem) => void;
}

const RoleInputGroup: React.FC<RoleInputGroupProps> = ({ label, item, onChange }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="flex items-center">
      <span className="text-xs text-[#262626] w-14 shrink-0 text-right pr-3 font-normal">
        {label}
      </span>
      <div
        ref={containerRef}
        className="flex-1 flex items-center h-8 rounded border border-[#d9d9d9] bg-white relative focus-within:border-[#1890ff] transition-colors"
      >
        <input
          type="text"
          value={item.value || ''}
          onChange={(e) => onChange({ ...item, value: e.target.value })}
          placeholder={item.type === '人员' ? '输入姓名或点击右侧选人' : '请输入'}
          className="flex-1 h-full px-3 text-xs text-[#262626] placeholder-[#bfbfbf] bg-transparent focus:outline-none"
        />
        {item.type === '人员' && (
          <button
            type="button"
            title="从组织架构或模糊搜索中选择人员"
            onClick={() => setPersonModalOpen(true)}
            className="px-2 h-full flex items-center text-[#1890ff] hover:bg-[#f0f7ff] transition-colors cursor-pointer text-[11px]"
          >
            <Users className="w-3.5 h-3.5 mr-1" />
            <span>选人</span>
          </button>
        )}
        <div className="h-4 w-px bg-[#d9d9d9] shrink-0" />
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`h-full px-3 flex items-center gap-1.5 text-xs cursor-pointer select-none transition-colors ${
            dropdownOpen ? 'text-[#1890ff]' : 'text-[#595959] hover:text-[#1890ff]'
          }`}
        >
          <span>{item.type || '通用'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform text-[#8c8c8c] ${
              dropdownOpen ? 'rotate-180 text-[#1890ff]' : ''
            }`}
          />
        </button>

        {personModalOpen && (
          <PersonSelectModal
            open={personModalOpen}
            title={`选择${label}`}
            description="支持手工输入中英文姓名或从组织架构部门人员树中挑选人员"
            multiSelect={false}
            initialSelected={item.value ? [item.value] : []}
            onClose={() => setPersonModalOpen(false)}
            onConfirm={(items, names) => {
              onChange({ ...item, value: names[0] || '' });
              setPersonModalOpen(false);
            }}
          />
        )}

        {/* Dropdown Menu (通用 / 职位 / 人员) - matching design draft image_6e96ed0a.png */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-24 bg-white border border-[#e8e8e8] rounded shadow-lg py-1 z-30">
            {ROLE_TYPES.map((t) => (
              <div
                key={t}
                onClick={() => {
                  onChange({ ...item, type: t });
                  setDropdownOpen(false);
                }}
                className={`px-3 py-1.5 text-xs text-center cursor-pointer transition-colors ${
                  item.type === t
                    ? 'text-[#1890ff] font-medium bg-[#f0f5ff]'
                    : 'text-[#262626] hover:text-[#1890ff] hover:bg-[#f5f7fa]'
                }`}
              >
                {t}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const DutyBuildView: React.FC<DutyBuildViewProps> = ({
  subPath,
  flows = [],
  showToast,
  onNavigate,
}) => {
  // Page mode: 'manualList' (权责建设手册列表) or 'contentConfig' (点击内容配置后的页面)
  const [viewMode, setViewMode] = useState<'manualList' | 'contentConfig'>('manualList');
  const [selectedManual, setSelectedManual] = useState<DutyManualRecord | null>(null);

  // Manual list state
  const [manuals, setManuals] = useState<DutyManualRecord[]>([]);
  const [loadingManuals, setLoadingManuals] = useState(false);

  // Table DnD & Resize state for Content Config items (权责事项列表)
  const dutyItemGrid = useTableDnDAndResize({
    storageKey: 'dflow_duty_build_items_grid',
    columns: DUTY_ITEM_COLUMNS,
  });

  // Table DnD & Resize state for Manuals list (权责手册/归档手册列表)
  const manualGrid = useTableDnDAndResize({
    storageKey: subPath === '/flowdoc/file' ? 'dflow_manuals_archived_grid' : 'dflow_manuals_active_grid',
    columns: MANUAL_COLUMNS,
  });

  // Manual Filters
  const [nameFilter, setNameFilter] = useState('');
  const [noFilter, setNoFilter] = useState('');
  const [activeNameQuery, setActiveNameQuery] = useState('');
  const [activeNoQuery, setActiveNoQuery] = useState('');

  // Manual Pagination
  const [manualPage, setManualPage] = useState(1);
  const [manualPageSize, setManualPageSize] = useState(10);
  const [manualPageJump, setManualPageJump] = useState('1');

  // Manual Modals
  const [manualEditModal, setManualEditModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data: Partial<DutyManualRecord>;
  }>({
    open: false,
    mode: 'create',
    data: {},
  });

  const [manualDeleteConfirm, setManualDeleteConfirm] = useState<{
    open: boolean;
    manual: DutyManualRecord | null;
  }>({
    open: false,
    manual: null,
  });

  const [manualArchiveConfirm, setManualArchiveConfirm] = useState<{
    open: boolean;
    manual: DutyManualRecord | null;
  }>({
    open: false,
    manual: null,
  });

  const [permissionModal, setPermissionModal] = useState<{
    open: boolean;
    manual: DutyManualRecord | null;
  }>({
    open: false,
    manual: null,
  });

  const [previewAttachment, setPreviewAttachment] = useState<{
    open: boolean;
    fileName: string;
  }>({
    open: false,
    fileName: '',
  });

  // =================== CONTENT CONFIG STATE (内容配置页面状态) ===================
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>({
    cat_group: true,
    cat_comp_a: true,
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat_a_fin'); // Selected category node
  const [categoryMenuState, setCategoryMenuState] = useState<{
    nodeId: string | null;
    node: CategoryTreeNode | null;
    x: number;
    y: number;
  }>({
    nodeId: null,
    node: null,
    x: 0,
    y: 0,
  });

  // Duty items list in content config
  const [dutyItems, setDutyItems] = useState<DutyItemRecord[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Content Config Filters
  const [statusFilter, setStatusFilter] = useState<string>('全部类型');
  const [dutyNameFilter, setDutyNameFilter] = useState<string>('');
  const [dutyNoFilter, setDutyNoFilter] = useState<string>('');
  const [activeDutyNameQuery, setActiveDutyNameQuery] = useState<string>('');
  const [activeDutyNoQuery, setActiveDutyNoQuery] = useState<string>('');

  // Content Config Pagination
  const [dutyPage, setDutyPage] = useState(1);
  const [dutyPageSize, setDutyPageSize] = useState(10);
  const [dutyPageJump, setDutyPageJump] = useState('1');

  // Category Tree Modals (支持从目录中选择挂载目录并实时呈现层级关系)
  const [categoryActionModal, setCategoryActionModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    targetNode: CategoryTreeNode | null;
    selectedParentId: string | null;
    name: string;
  }>({
    open: false,
    mode: 'create',
    targetNode: null,
    selectedParentId: null,
    name: '',
  });

  // Duty Item Edit/Create Modal
  const [dutyItemModal, setDutyItemModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data: Partial<DutyItemRecord>;
  }>({
    open: false,
    mode: 'create',
    data: {},
  });

  // Scenario Configuration Modal (场景配置: 分支场景/最终批准人/审批配置 - matching image_6e96ed0a.png)
  const [scenarioModal, setScenarioModal] = useState<{
    open: boolean;
    item: DutyItemRecord | null;
    blocks: ScenarioConfigBlock[];
    rules?: ScenarioRule[];
  }>({
    open: false,
    item: null,
    blocks: [],
    rules: [],
  });

  // Audit Progress Modal (审核进度)
  const [auditProgressModal, setAuditProgressModal] = useState<{
    open: boolean;
    item: DutyItemRecord | null;
  }>({
    open: false,
    item: null,
  });

  // Multi-Level Audit Submission Modal (提交多层级审批配置)
  const [multiLevelAuditModal, setMultiLevelAuditModal] = useState<{
    open: boolean;
    itemIds: string[];
    levels: {
      level: number;
      levelName: string;
      roleName: string;
      approverName: string;
      deptName: string;
    }[];
    urgency: '普通' | '紧急' | '特急';
    remark: string;
  }>({
    open: false,
    itemIds: [],
    levels: [
      {
        level: 1,
        levelName: '第1级: 权责初审',
        roleName: '权责推进专员',
        approverName: '张明',
        deptName: '权责管理部',
      },
      {
        level: 2,
        levelName: '第2级: 合规复核',
        roleName: '合规法务总监',
        approverName: '陈静',
        deptName: '质量合规部',
      },
      {
        level: 3,
        levelName: '第3级: 终审批准',
        roleName: '决策委员会主任',
        approverName: '刘建国',
        deptName: '决策委员会',
      },
    ],
    urgency: '普通',
    remark: '',
  });

  // Batch Import Modal
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Close context menu on outside click
  useEffect(() => {
    const handleCloseMenu = () => {
      if (categoryMenuState.nodeId) {
        setCategoryMenuState({ nodeId: null, node: null, x: 0, y: 0 });
      }
    };
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, [categoryMenuState.nodeId]);

  // Fetch Manuals List
  const fetchManuals = async () => {
    setLoadingManuals(true);
    try {
      const isArchivedPath = subPath === '/flowdoc/file';
      const url = `/api/flowdoc/manuals?archived=${isArchivedPath ? 'true' : 'false'}`;
      const res = await fetch(url).then((r) => r.json());
      if (res.status === 1 && Array.isArray(res.data)) {
        setManuals(res.data);
        // If currently in contentConfig, refresh selected manual data
        if (selectedManual) {
          const updated = res.data.find((m: any) => m.id === selectedManual.id);
          if (updated) setSelectedManual(updated);
        }
      }
    } catch {
      showToast('获取权责手册列表失败', 'error');
    } finally {
      setLoadingManuals(false);
    }
  };

  useEffect(() => {
    fetchManuals();
  }, [subPath]);

  // Fetch Content Configuration details for selected manual
  const loadManualDetail = async (manualId: string) => {
    try {
      const res = await fetch(`/api/flowdoc/manuals/${manualId}/detail`).then((r) => r.json());
      if (res.status === 1 && res.data) {
        const tree = Array.isArray(res.data.categoryTree) ? res.data.categoryTree : [];
        setCategoryTree(tree);
        setDutyItems(Array.isArray(res.data.items) ? res.data.items : []);
        // Automatically expand roots
        const expMap: Record<string, boolean> = {};
        tree.forEach((r: any) => {
          expMap[r.id] = true;
        });
        setExpandedNodeIds(expMap);
        // Default select first child or first node
        if (tree.length > 0) {
          if (tree[1] && tree[1].children && tree[1].children[0]) {
            setSelectedCategoryId(tree[1].children[0].id);
          } else if (tree[0] && tree[0].children && tree[0].children[0]) {
            setSelectedCategoryId(tree[0].children[0].id);
          } else {
            setSelectedCategoryId(tree[0].id);
          }
        }
      }
    } catch {
      showToast('获取手册内容配置详情失败', 'error');
    }
  };

  // Open Content Configuration
  const handleOpenContentConfig = (manual: DutyManualRecord) => {
    setSelectedManual(manual);
    setViewMode('contentConfig');
    setSelectedItemIds([]);
    setStatusFilter('全部类型');
    setDutyNameFilter('');
    setDutyNoFilter('');
    setActiveDutyNameQuery('');
    setActiveDutyNoQuery('');
    setDutyPage(1);
    setDutyPageJump('1');
    loadManualDetail(manual.id);
  };

  // Back to Manual List
  const handleBackToManualList = () => {
    setViewMode('manualList');
    setSelectedManual(null);
    fetchManuals();
  };

  // =================== MANUALS LIST LOGIC ===================
  const handleManualSearch = () => {
    setActiveNameQuery(nameFilter.trim());
    setActiveNoQuery(noFilter.trim());
    setManualPage(1);
    setManualPageJump('1');
  };

  const handleManualReset = () => {
    setNameFilter('');
    setNoFilter('');
    setActiveNameQuery('');
    setActiveNoQuery('');
    setManualPage(1);
    setManualPageJump('1');
  };

  const filteredManuals = useMemo(() => {
    return manuals.filter((m) => {
      if (activeNameQuery) {
        if (!m.manualName.toLowerCase().includes(activeNameQuery.toLowerCase())) {
          return false;
        }
      }
      if (activeNoQuery) {
        if (!m.manualNo.toLowerCase().includes(activeNoQuery.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [manuals, activeNameQuery, activeNoQuery]);

  const totalManuals = filteredManuals.length;
  const totalManualPages = Math.max(1, Math.ceil(totalManuals / manualPageSize));

  const paginatedManuals = useMemo(() => {
    const start = (manualPage - 1) * manualPageSize;
    return filteredManuals.slice(start, start + manualPageSize);
  }, [filteredManuals, manualPage, manualPageSize]);

  const handleSaveManualEdit = async () => {
    const { manualNo, manualName, viewPermissions, attachment, description } = manualEditModal.data;
    if (!manualNo?.trim()) {
      showToast('请输入权责手册编号', 'warning');
      return;
    }
    if (!manualName?.trim()) {
      showToast('请输入权责手册名称', 'warning');
      return;
    }

    try {
      if (manualEditModal.mode === 'create') {
        const res = await fetch('/api/flowdoc/manuals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            manualNo: manualNo.trim(),
            manualName: manualName.trim(),
            viewPermissions: viewPermissions || [],
            attachment: attachment || '',
            description: description || '',
          }),
        }).then((r) => r.json());
        if (res.status === 1) {
          showToast('新建权责手册成功', 'success');
          setManualEditModal({ ...manualEditModal, open: false });
          fetchManuals();
        } else {
          showToast(res.info || '新建失败', 'error');
        }
      } else {
        const res = await fetch(`/api/flowdoc/manuals/${manualEditModal.data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            manualNo: manualNo.trim(),
            manualName: manualName.trim(),
            viewPermissions: viewPermissions || [],
            attachment: attachment || '',
            description: description || '',
          }),
        }).then((r) => r.json());
        if (res.status === 1) {
          showToast('修改权责手册成功', 'success');
          setManualEditModal({ ...manualEditModal, open: false });
          fetchManuals();
        } else {
          showToast(res.info || '修改失败', 'error');
        }
      }
    } catch {
      showToast('保存权责手册异常', 'error');
    }
  };

  const handleCopyManual = async (manual: DutyManualRecord) => {
    try {
      const res = await fetch(`/api/flowdoc/manuals/${manual.id}/copy`, {
        method: 'POST',
      }).then((r) => r.json());
      if (res.status === 1) {
        showToast(`已成功复制权责手册【${manual.manualName}】`, 'success');
        fetchManuals();
      } else {
        showToast(res.info || '复制失败', 'error');
      }
    } catch {
      showToast('复制操作异常', 'error');
    }
  };

  const handleArchiveManual = async () => {
    if (!manualArchiveConfirm.manual) return;
    try {
      const res = await fetch(`/api/flowdoc/manuals/${manualArchiveConfirm.manual.id}/archive`, {
        method: 'POST',
      }).then((r) => r.json());
      if (res.status === 1) {
        showToast(res.info || '操作成功', 'success');
        setManualArchiveConfirm({ open: false, manual: null });
        fetchManuals();
      } else {
        showToast(res.info || '归档操作失败', 'error');
      }
    } catch {
      showToast('归档操作异常', 'error');
    }
  };

  const handleDeleteManual = async () => {
    if (!manualDeleteConfirm.manual) return;
    try {
      const res = await fetch(`/api/flowdoc/manuals/${manualDeleteConfirm.manual.id}`, {
        method: 'DELETE',
      }).then((r) => r.json());
      if (res.status === 1) {
        showToast('已删除权责手册', 'success');
        setManualDeleteConfirm({ open: false, manual: null });
        fetchManuals();
      } else {
        showToast(res.info || '删除失败', 'error');
      }
    } catch {
      showToast('删除操作异常', 'error');
    }
  };

  // =================== CONTENT CONFIG LOGIC (内容配置业务逻辑) ===================

  // Find selected category node recursively
  const selectedCategoryNode = useMemo(() => {
    if (!selectedCategoryId) return null;
    return findCategoryNodeInTree(categoryTree, selectedCategoryId);
  }, [categoryTree, selectedCategoryId]);

  // Selected category full breadcrumb path list
  const selectedCategoryPath = useMemo(() => {
    if (!selectedCategoryId) return [];
    return getCategoryPathList(categoryTree, selectedCategoryId) || [];
  }, [categoryTree, selectedCategoryId]);

  // Flattened directory catalog options for category create/edit (从目录中选择某一个目录)
  const categoryCatalogOptions = useMemo(() => {
    const flat = flattenCategoryCatalog(
      categoryTree,
      categoryActionModal.mode === 'edit' ? categoryActionModal.targetNode?.id : null
    );
    return [
      {
        id: null,
        name: '根目录（作为顶级主分类，无上级目录）',
        level: 0,
        pathText: '根目录 (Top Level)',
        disabled: false,
      },
      ...flat,
    ];
  }, [categoryTree, categoryActionModal.mode, categoryActionModal.targetNode]);

  // Full breadcrumb path of the selected parent directory in modal
  const modalSelectedParentPath = useMemo(() => {
    if (!categoryActionModal.selectedParentId) return [];
    return getCategoryPathList(categoryTree, categoryActionModal.selectedParentId) || [];
  }, [categoryTree, categoryActionModal.selectedParentId]);

  // Target hierarchy level of the category being created or edited
  const modalTargetLevel = (modalSelectedParentPath.length || 0) + 1;

  // Filter duty items based on category (matches node or its descendants), status, name, no
  const filteredDutyItems = useMemo(() => {
    const descendantCategoryIds = selectedCategoryNode
      ? getAllDescendantIds(selectedCategoryNode)
      : [];

    return dutyItems.filter((item) => {
      // Category filter: match item's categoryId or categoryName
      if (selectedCategoryId && selectedCategoryNode) {
        const matchesId = item.categoryId && descendantCategoryIds.includes(item.categoryId);
        const matchesName = item.categoryName && (
          item.categoryName === selectedCategoryNode.name ||
          (selectedCategoryNode.children && selectedCategoryNode.children.some((c) => c.name === item.categoryName))
        );
        if (!matchesId && !matchesName) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== '全部类型' && item.status !== statusFilter) {
        return false;
      }
      // Name filter
      if (activeDutyNameQuery && !item.dutyName.toLowerCase().includes(activeDutyNameQuery.toLowerCase())) {
        return false;
      }
      // No filter
      if (activeDutyNoQuery && !item.dutyNo.toLowerCase().includes(activeDutyNoQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [dutyItems, selectedCategoryId, selectedCategoryNode, statusFilter, activeDutyNameQuery, activeDutyNoQuery]);

  const totalDutyItems = filteredDutyItems.length;
  const totalDutyPages = Math.max(1, Math.ceil(totalDutyItems / dutyPageSize));

  const paginatedDutyItems = useMemo(() => {
    const start = (dutyPage - 1) * dutyPageSize;
    return filteredDutyItems.slice(start, start + dutyPageSize);
  }, [filteredDutyItems, dutyPage, dutyPageSize]);

  // Content Config Search & Reset
  const handleDutySearch = () => {
    setActiveDutyNameQuery(dutyNameFilter.trim());
    setActiveDutyNoQuery(dutyNoFilter.trim());
    setDutyPage(1);
    setDutyPageJump('1');
  };

  const handleDutyReset = () => {
    setStatusFilter('全部类型');
    setDutyNameFilter('');
    setDutyNoFilter('');
    setActiveDutyNameQuery('');
    setActiveDutyNoQuery('');
    setDutyPage(1);
    setDutyPageJump('1');
  };

  // Select all or individual
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItemIds(paginatedDutyItems.map((i) => i.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Category Tree Context Menu Actions
  const handleOpenCategoryMenu = (
    e: React.MouseEvent,
    node: CategoryTreeNode
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCategoryMenuState({
      nodeId: node.id,
      node,
      x: rect.right + 4,
      y: rect.top,
    });
  };

  const handleSaveCategoryModal = async () => {
    if (!selectedManual) return;
    const { mode, targetNode, selectedParentId, name } = categoryActionModal;
    if (!name.trim()) {
      showToast('请输入分类名称', 'warning');
      return;
    }

    try {
      if (mode === 'create') {
        const res = await fetch(`/api/flowdoc/manuals/${selectedManual.id}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            parentId: selectedParentId || null,
          }),
        }).then((r) => r.json());

        if (res.status === 1) {
          const parentName = selectedParentId
            ? findCategoryNodeInTree(res.data, selectedParentId)?.name || '指定目录'
            : '根目录';
          showToast(`已在【${parentName}】下成功创建分类【${name.trim()}】`, 'success');
          setCategoryTree(res.data);
          if (selectedParentId) {
            setExpandedNodeIds((prev) => ({ ...prev, [selectedParentId]: true }));
          }
          setCategoryActionModal((prev) => ({ ...prev, open: false }));
        } else {
          showToast(res.info || '创建分类失败', 'error');
        }
      } else if (mode === 'edit' && targetNode) {
        const res = await fetch(`/api/flowdoc/manuals/${selectedManual.id}/categories/${targetNode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            parentId: selectedParentId || null,
          }),
        }).then((r) => r.json());

        if (res.status === 1) {
          showToast(`已成功更新分类【${name.trim()}】及其层级架构关系`, 'success');
          setCategoryTree(res.data);
          if (selectedParentId) {
            setExpandedNodeIds((prev) => ({ ...prev, [selectedParentId]: true }));
          }
          setCategoryActionModal((prev) => ({ ...prev, open: false }));
        } else {
          showToast(res.info || '更新分类失败', 'error');
        }
      }
    } catch {
      showToast('分类操作异常', 'error');
    }
  };

  const handleDeleteCategory = async (node: CategoryTreeNode) => {
    if (!selectedManual) return;
    if (!window.confirm(`确定要删除分类【${node.name}】吗？`)) return;
    try {
      const res = await fetch(`/api/flowdoc/manuals/${selectedManual.id}/categories/${node.id}`, {
        method: 'DELETE',
      }).then((r) => r.json());
      if (res.status === 1) {
        showToast('已删除分类', 'success');
        setCategoryTree(res.data);
      }
    } catch {
      showToast('删除分类异常', 'error');
    }
  };

  // Save Duty Item (Create / Edit)
  const handleSaveDutyItem = async () => {
    if (!selectedManual) return;
    const { mode, data } = dutyItemModal;
    if (!data.dutyName?.trim()) {
      showToast('请输入权责名称', 'warning');
      return;
    }
    if (!data.dutyNo?.trim()) {
      showToast('请输入权责编号', 'warning');
      return;
    }

    try {
      if (mode === 'create') {
        const res = await fetch(`/api/flowdoc/manuals/${selectedManual.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dutyNo: data.dutyNo.trim(),
            dutyName: data.dutyName.trim(),
            categoryName: data.categoryName || selectedCategoryNode?.name || '财务管理中心',
            categoryId: data.categoryId || selectedCategoryId || 'cat_fin',
            primaryRole: data.primaryRole || '经办人',
            scope: data.scope || '全集团各单位及下属子公司',
            effectiveApproval: data.effectiveApproval || (data.status === '已发布' ? '已审批通过 (OA-2026-0391)' : '待发起审批'),
            submitTime: data.submitTime || new Date().toISOString().slice(0, 19).replace('T', ' '),
            status: data.status || '草稿',
            scenarioText: data.scenarioText || '',
          }),
        }).then((r) => r.json());
        if (res.status === 1) {
          showToast('新增权责事项成功', 'success');
          setDutyItems(res.list);
          setDutyItemModal({ ...dutyItemModal, open: false });
        }
      } else {
        const res = await fetch(`/api/flowdoc/manuals/${selectedManual.id}/items/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).then((r) => r.json());
        if (res.status === 1) {
          showToast('更新权责事项成功', 'success');
          setDutyItems(res.list);
          setDutyItemModal({ ...dutyItemModal, open: false });
        }
      }
    } catch {
      showToast('保存权责事项失败', 'error');
    }
  };

  // Copy Item
  const handleCopyDutyItem = async (item: DutyItemRecord) => {
    if (!selectedManual) return;
    try {
      const res = await fetch(`/api/flowdoc/manuals/${selectedManual.id}/items/${item.id}/copy`, {
        method: 'POST',
      }).then((r) => r.json());
      if (res.status === 1) {
        showToast(`已复制权责事项【${item.dutyName}】`, 'success');
        setDutyItems(res.list);
      }
    } catch {
      showToast('复制权责操作异常', 'error');
    }
  };

  // Delete Item
  const handleDeleteDutyItem = async (item: DutyItemRecord) => {
    if (!selectedManual) return;
    if (!window.confirm(`确定要删除权责事项【${item.dutyName}】吗？`)) return;
    try {
      const res = await fetch(`/api/flowdoc/manuals/${selectedManual.id}/items/${item.id}`, {
        method: 'DELETE',
      }).then((r) => r.json());
      if (res.status === 1) {
        showToast('已删除权责事项', 'success');
        setDutyItems(res.list);
      }
    } catch {
      showToast('删除权责操作异常', 'error');
    }
  };

  // Batch Publish
  const handleBatchPublish = async () => {
    if (!selectedManual) return;
    try {
      const res = await fetch(`/api/flowdoc/manuals/${selectedManual.id}/items/batch-publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: selectedItemIds }),
      }).then((r) => r.json());
      if (res.status === 1) {
        showToast(
          selectedItemIds.length > 0
            ? `已成功发布选中的 ${selectedItemIds.length} 项权责`
            : '已批量发布全部权责事项',
          'success'
        );
        setDutyItems(res.list);
        setSelectedItemIds([]);
      }
    } catch {
      showToast('批量发布操作异常', 'error');
    }
  };

  // Open Multi-Level Audit Setup Modal (匹配设计稿 image_22d2343e.png: 支持选择多层级审批者)
  const handleOpenAuditModal = (specificItemId?: string) => {
    if (!selectedManual) return;
    let targetIds: string[] = [];
    if (specificItemId) {
      targetIds = [specificItemId];
    } else if (selectedItemIds.length > 0) {
      targetIds = selectedItemIds;
    } else {
      // Default to all filtered or visible items in the current manual/category
      targetIds = filteredDutyItems.map((i) => i.id);
    }

    if (targetIds.length === 0) {
      showToast('当前暂无可送审的权责事项', 'warning');
      return;
    }

    setMultiLevelAuditModal({
      open: true,
      itemIds: targetIds,
      levels: [
        {
          level: 1,
          levelName: '第1级: 权责初审',
          roleName: '权责推进专员',
          approverName: '张明',
          deptName: '权责管理部',
        },
        {
          level: 2,
          levelName: '第2级: 合规复核',
          roleName: '合规法务总监',
          approverName: '陈静',
          deptName: '质量合规部',
        },
        {
          level: 3,
          levelName: '第3级: 终审批准',
          roleName: '决策委员会主任',
          approverName: '刘建国',
          deptName: '决策委员会',
        },
      ],
      urgency: '普通',
      remark: '已完成权责清单与分支场景梳理，提请多层级审批人依职权审查核定。',
    });
  };

  // Submit Multi-Level Audit Tasks to backend & push to approver's pending tasks
  const handleConfirmSubmitAudit = async () => {
    if (!selectedManual) return;
    if (multiLevelAuditModal.levels.length === 0) {
      showToast('请至少配置一个审批层级', 'warning');
      return;
    }

    for (let i = 0; i < multiLevelAuditModal.levels.length; i++) {
      const lvl = multiLevelAuditModal.levels[i];
      if (!lvl.approverName?.trim()) {
        showToast(`第 ${i + 1} 级审批人姓名不能为空`, 'warning');
        return;
      }
    }

    try {
      const res = await fetch('/api/flowdoc/audit/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manualId: selectedManual.id,
          itemIds: multiLevelAuditModal.itemIds,
          levels: multiLevelAuditModal.levels,
          urgency: multiLevelAuditModal.urgency,
          remark: multiLevelAuditModal.remark,
          submitter: '流程管理员',
        }),
      }).then((r) => r.json());

      if (res.status === 1) {
        showToast(
          `已成功提交 ${multiLevelAuditModal.itemIds.length} 项权责至多层级审核！任务已推送至第1级审批人【${multiLevelAuditModal.levels[0].approverName}】待办事项`,
          'success'
        );
        loadManualDetail(selectedManual.id);
        setSelectedItemIds([]);
        setMultiLevelAuditModal((prev) => ({ ...prev, open: false }));
      } else {
        showToast(res.info || '提交审核异常', 'error');
      }
    } catch {
      showToast('提交审核操作失败', 'error');
    }
  };

  // Save Scenario Rules & Blocks (提交)
  const handleSaveScenarios = async () => {
    if (!selectedManual || !scenarioModal.item) return;
    const blocks = scenarioModal.blocks;

    // Generate scenarioText for display in the table
    const textLines = blocks
      .map((b) => {
        const cond = b.condition.trim() || '通用场景';
        const approver =
          b.approve1.value.trim() || b.audit.value.trim() || '未配置批准1内容';
        return `【${cond}】: ${approver}`;
      })
      .filter(Boolean);
    const scenarioText = textLines.join('\n');

    const rules: ScenarioRule[] = blocks.map((b, idx) => ({
      id: b.id || 'sc_' + idx,
      conditionName: b.condition.trim() || '通用场景',
      approverName:
        b.approve1.value.trim() || b.audit.value.trim() || '未配置批准1内容',
    }));

    try {
      const res = await fetch(
        `/api/flowdoc/manuals/${selectedManual.id}/items/${scenarioModal.item.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioBlocks: blocks,
            scenarios: rules,
            scenarioText,
          }),
        }
      ).then((r) => r.json());
      if (res.status === 1) {
        showToast('场景配置已保存生效', 'success');
        setDutyItems(res.list);
        setScenarioModal({ ...scenarioModal, open: false });
      } else {
        showToast(res.info || '保存场景配置失败', 'warning');
      }
    } catch {
      showToast('保存场景配置异常', 'error');
    }
  };

  // Recursive category tree renderer supporting arbitrary levels (L1, L2, L3, L4...)
  const renderCategoryNodeList = (nodes: CategoryTreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = !!expandedNodeIds[node.id];
      const isSelected = selectedCategoryId === node.id;
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      const indentPx = 6 + depth * 14;

      return (
        <div key={node.id} className="space-y-0.5">
          <div
            onClick={() => setSelectedCategoryId(node.id)}
            style={{ paddingLeft: `${indentPx}px` }}
            className={`flex items-center justify-between pr-2 py-1.5 rounded cursor-pointer transition-colors group relative ${
              isSelected
                ? 'bg-[#e6f7ff] text-[#1890ff] font-medium'
                : 'text-[#262626] hover:bg-[#f5f5f5]'
            }`}
            title={`层级: 第 ${depth + 1} 级 · ${node.name}`}
          >
            <div className="flex items-center gap-1.5 truncate min-w-0">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedNodeIds((prev) => ({
                      ...prev,
                      [node.id]: !prev[node.id],
                    }));
                  }}
                  className="p-0.5 text-[#8c8c8c] hover:text-[#262626] shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 text-[#1890ff] shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-[#faad14] shrink-0" />
                )
              ) : (
                <Network className="w-3 h-3 text-[#8c8c8c] shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-[#bfbfbf] bg-[#fafafa] px-1 rounded font-mono border border-[#f0f0f0] group-hover:hidden">
                L{depth + 1}
              </span>
              <button
                type="button"
                onClick={(e) => handleOpenCategoryMenu(e, node)}
                className={`p-1 rounded cursor-pointer transition-opacity ${
                  isSelected
                    ? 'opacity-100 text-[#1890ff]'
                    : 'opacity-0 group-hover:opacity-100 text-[#8c8c8c] hover:text-[#1890ff]'
                }`}
                title="分类操作（创建子分类 / 编辑分类 / 删除）"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Recursive children rendering */}
          {hasChildren && isExpanded && (
            <div className="space-y-0.5">
              {renderCategoryNodeList(node.children!, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // =================== RENDER: VIEW 2 - CONTENT CONFIG (设计稿 image_27c1af07.png) ===================
  if (viewMode === 'contentConfig' && selectedManual) {
    const isAllSelected =
      paginatedDutyItems.length > 0 &&
      paginatedDutyItems.every((item) => selectedItemIds.includes(item.id));

    return (
      <div className="flex flex-col gap-3 min-h-full select-none text-[#303133]">
        {/* Top Header: ← 返回 [手册名称] */}
        <div className="bg-white rounded border border-[#ebeef5] px-4 py-3 shrink-0 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackToManualList}
              className="flex items-center gap-2 text-sm font-semibold text-[#262626] hover:text-[#1890ff] cursor-pointer transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 text-[#8c8c8c] group-hover:text-[#1890ff] transition-colors" />
              <span>返回 {selectedManual.manualName}</span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8c8c8c]">
            <span className="font-mono bg-[#f5f5f5] px-2 py-0.5 rounded border border-[#e8e8e8]">
              {selectedManual.manualNo}
            </span>
            <span>· 权责内容与场景配置中心</span>
          </div>
        </div>

        {/* Main Content: Split Layout (Left: 权责分类 Tree, Right: Filter + Table) */}
        <div className="flex-1 flex gap-3 min-h-[580px] overflow-hidden">
          {/* Left Panel: 权责分类 Tree (Design Draft Left Column) */}
          <div className="w-[240px] bg-white rounded border border-[#ebeef5] flex flex-col shrink-0 shadow-xs overflow-hidden">
            <div className="p-3 border-b border-[#f0f0f0] flex items-center justify-between bg-[#fafafa]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#262626]">权责分类</span>
                {selectedCategoryId && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId('')}
                    className="text-[11px] text-[#1890ff] hover:underline cursor-pointer"
                    title="清除筛选，显示全部权责"
                  >
                    [全部]
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() =>
                  setCategoryActionModal({
                    open: true,
                    mode: 'create',
                    targetNode: null,
                    selectedParentId: selectedCategoryId || null,
                    name: '',
                  })
                }
                title="新建分类（可选择挂载目录）"
                className="flex items-center gap-1 text-[11px] text-[#1890ff] hover:text-[#40a9ff] px-1.5 py-0.5 rounded hover:bg-[#e6f7ff] cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新建</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 text-xs space-y-0.5 relative">
              {categoryTree.length === 0 ? (
                <div className="text-center py-8 text-[#bfbfbf] space-y-2">
                  <Network className="w-8 h-8 mx-auto text-[#d9d9d9]" />
                  <p>暂无权责分类</p>
                  <button
                    type="button"
                    onClick={() =>
                      setCategoryActionModal({
                        open: true,
                        mode: 'create',
                        targetNode: null,
                        selectedParentId: null,
                        name: '',
                      })
                    }
                    className="text-[#1890ff] hover:underline text-[11px]"
                  >
                    + 新建根分类
                  </button>
                </div>
              ) : (
                renderCategoryNodeList(categoryTree, 0)
              )}
            </div>
          </div>

          {/* Right Main Working Area */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {/* Filter & Action Card (Design Draft Red Box 1) */}
            <div className="bg-white rounded border border-[#ebeef5] p-3.5 shrink-0 shadow-xs space-y-3">
              {/* Row 1: Filters */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                {/* 状态 */}
                <div className="flex items-center gap-2">
                  <span className="text-[#606266] whitespace-nowrap">状态</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8 w-32 px-2.5 rounded border border-[#dcdfe6] text-xs text-[#303133] focus:outline-none focus:border-[#409eff] bg-white cursor-pointer"
                  >
                    <option value="全部类型">全部类型</option>
                    <option value="草稿">草稿</option>
                    <option value="待审核">待审核</option>
                    <option value="已发布">已发布</option>
                    <option value="已驳回">已驳回</option>
                  </select>
                </div>

                {/* 权责名称 */}
                <div className="flex items-center gap-2">
                  <span className="text-[#606266] whitespace-nowrap">权责名称</span>
                  <input
                    type="text"
                    value={dutyNameFilter}
                    onChange={(e) => setDutyNameFilter(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDutySearch()}
                    placeholder="请输入"
                    className="h-8 w-44 px-3 rounded border border-[#dcdfe6] text-xs text-[#303133] placeholder-[#c0c4cc] focus:outline-none focus:border-[#409eff] bg-white"
                  />
                </div>

                {/* 权责编号 */}
                <div className="flex items-center gap-2">
                  <span className="text-[#606266] whitespace-nowrap">权责编号</span>
                  <input
                    type="text"
                    value={dutyNoFilter}
                    onChange={(e) => setDutyNoFilter(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDutySearch()}
                    placeholder="请输入"
                    className="h-8 w-44 px-3 rounded border border-[#dcdfe6] text-xs text-[#303133] placeholder-[#c0c4cc] focus:outline-none focus:border-[#409eff] bg-white"
                  />
                </div>

                {/* 搜索 & 重置 */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDutySearch}
                    className="h-8 px-4 rounded bg-[#1890ff] hover:bg-[#40a9ff] active:bg-[#096dd9] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>搜索</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDutyReset}
                    className="h-8 px-3.5 rounded bg-white hover:bg-[#f5f7fa] text-[#606266] hover:text-[#1890ff] border border-[#d9d9d9] hover:border-[#1890ff] text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重置</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Action Buttons (新增权责, 提交审核, 批量发布, 批量导入) */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#f5f5f5]">
                <button
                  type="button"
                  onClick={() =>
                    setDutyItemModal({
                      open: true,
                      mode: 'create',
                      data: {
                        dutyNo: `PR-AP-00${dutyItems.length + 10}`,
                        dutyName: '',
                        categoryName: selectedCategoryNode?.name || '财务管理中心',
                        categoryId: selectedCategoryId,
                        primaryRole: '财务主管',
                        scope: '全集团各单位及下属子公司',
                        effectiveApproval: '待发起审批',
                        submitTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
                        status: '草稿',
                        scenarioText: '',
                      },
                    })
                  }
                  className="h-8 px-3.5 rounded bg-[#1890ff] hover:bg-[#40a9ff] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增权责</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAuditModal()}
                  className="h-8 px-3.5 rounded bg-[#e6f7ff] hover:bg-[#bae7ff] text-[#1890ff] border border-[#91d5ff] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  title="提交审核（支持配置多层级审批人并推送待办事项）"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>提交审核{selectedItemIds.length > 0 ? ` (${selectedItemIds.length})` : ''}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBatchPublish}
                  className="h-8 px-3.5 rounded bg-[#1890ff] hover:bg-[#40a9ff] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>批量发布</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImportModalOpen(true)}
                  className="h-8 px-3.5 rounded bg-[#1890ff] hover:bg-[#40a9ff] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>批量导入</span>
                </button>

                {selectedCategoryNode && (
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-[#595959] bg-[#f0f5ff] px-2.5 py-1 rounded border border-[#d6e4ff]">
                    <Network className="w-3.5 h-3.5 text-[#1890ff] shrink-0" />
                    <span>分类筛选：</span>
                    <span className="font-semibold text-[#1890ff]">
                      {selectedCategoryPath.map((p) => p.name).join(' > ')}
                    </span>
                    <span className="text-[#8c8c8c] text-[11px]">({filteredDutyItems.length}项)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId('')}
                      className="ml-1 text-[#8c8c8c] hover:text-[#ff4d4f] cursor-pointer"
                      title="清除筛选查看全部"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Data Table Card (Design Draft Red Box 2) */}
            <div className="bg-white rounded border border-[#ebeef5] flex-1 flex flex-col min-h-0 shadow-xs overflow-hidden">
              {/* Table Header Control / Hint Bar */}
              <div className="px-3.5 py-1.5 bg-[#fafafa] border-b border-[#f0f0f0] flex items-center justify-between text-[11px] text-[#8c8c8c] shrink-0">
                <div className="flex items-center gap-1.5">
                  <MoveHorizontal className="w-3.5 h-3.5 text-[#1890ff]" />
                  <span>
                    表格支持 <strong className="text-[#1890ff] font-medium">按住拖拽表头重排</strong> 列顺序，及{' '}
                    <strong className="text-[#1890ff] font-medium">拖拽右边框调整列宽</strong>（双击边框恢复默认）
                  </span>
                </div>
                <button
                  type="button"
                  onClick={dutyItemGrid.resetColumns}
                  className="text-[#8c8c8c] hover:text-[#1890ff] flex items-center gap-1 cursor-pointer transition-colors"
                  title="重置为默认列宽与列顺序"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置表头</span>
                </button>
              </div>

              <div ref={dutyItemGrid.tableContainerRef} className="flex-1 overflow-auto relative">
                <TableResizeGuideLine resizingInfo={dutyItemGrid.resizingInfo} />
                <table
                  style={{ width: `${dutyItemGrid.totalTableWidth}px`, minWidth: '100%' }}
                  className="text-left border-collapse text-xs table-fixed"
                >
                  <TableColGroup columns={dutyItemGrid.columns} colWidths={dutyItemGrid.colWidths} />
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#f0f0f0] text-[#595959] font-medium h-11">
                      {dutyItemGrid.columns.map((col) => (
                        <TableHeaderCell
                          key={col.key}
                          col={col}
                          width={dutyItemGrid.colWidths[col.key] ?? col.defaultWidth}
                          isDragging={dutyItemGrid.draggingKey === col.key}
                          isDragOver={dutyItemGrid.dragOverKey === col.key}
                          dropPosition={dutyItemGrid.dropPosition}
                          isResizing={dutyItemGrid.resizingKey === col.key}
                          onDragStart={(e) => dutyItemGrid.handleDragStart(e, col.key, col)}
                          onDragOver={(e) => dutyItemGrid.handleDragOver(e, col.key, col)}
                          onDragLeave={dutyItemGrid.handleDragLeave}
                          onDrop={(e) => dutyItemGrid.handleDrop(e, col.key, col)}
                          onDragEnd={dutyItemGrid.handleDragEnd}
                          onResizeStart={(e) => dutyItemGrid.handleResizeStart(e, col)}
                          onDoubleClickResize={(e) => dutyItemGrid.handleDoubleClickResize(e, col)}
                        >
                          {col.key === 'selection' ? (
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={handleSelectAll}
                              className="rounded border-[#d9d9d9] text-[#1890ff] focus:ring-0 cursor-pointer"
                            />
                          ) : undefined}
                        </TableHeaderCell>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {paginatedDutyItems.length === 0 ? (
                      <tr>
                        <td colSpan={dutyItemGrid.columns.length} className="py-16 text-center text-[#909399]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <FileCheck2 className="w-8 h-8 text-[#dcdfe6]" />
                            <span>该分类下暂无权责记录</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedDutyItems.map((item) => {
                        const isChecked = selectedItemIds.includes(item.id);
                        const scenarioLines = item.scenarioText
                          ? item.scenarioText.split('\n').filter(Boolean)
                          : [];

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-[#f5f7fa] transition-colors border-b border-[#f0f0f0] ${
                              isChecked ? 'bg-[#fafafa]' : ''
                            }`}
                          >
                            {dutyItemGrid.columns.map((col) => {
                              const w = dutyItemGrid.colWidths[col.key] ?? col.defaultWidth;
                              const cellStyle = { width: `${w}px`, minWidth: `${col.minWidth ?? w}px` };

                              switch (col.key) {
                                case 'selection':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-3 px-3 text-center border-r border-[#f0f0f0]">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleSelectItem(item.id)}
                                        className="rounded border-[#d9d9d9] text-[#1890ff] focus:ring-0 cursor-pointer"
                                      />
                                    </td>
                                  );

                                case 'manualName':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-3 px-4 text-[#303133] border-r border-[#f0f0f0]">
                                      <span className="truncate block" title={item.manualName || selectedManual?.manualName}>
                                        {item.manualName || selectedManual?.manualName}
                                      </span>
                                    </td>
                                  );

                                case 'categoryName':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-3 px-4 text-[#303133] border-r border-[#f0f0f0]">
                                      <span className="truncate block" title={item.categoryName}>
                                        {item.categoryName}
                                      </span>
                                    </td>
                                  );

                                case 'dutyNo':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-3 px-4 font-mono text-[#303133] border-r border-[#f0f0f0]">
                                      <span className="truncate block">{item.dutyNo}</span>
                                    </td>
                                  );

                                case 'dutyName':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-3 px-4 text-[#262626] font-medium border-r border-[#f0f0f0]">
                                      <span className="truncate block" title={item.dutyName}>
                                        {item.dutyName}
                                      </span>
                                    </td>
                                  );

                                case 'scenario':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-3 px-4 border-r border-[#f0f0f0] overflow-hidden">
                                      {scenarioLines.length > 0 ? (
                                        <div
                                          onClick={() =>
                                            setScenarioModal({
                                              open: true,
                                              item,
                                              blocks: initScenarioBlocks(item),
                                            })
                                          }
                                          className="space-y-1 cursor-pointer group"
                                          title="点击编辑分支场景与最终批准人"
                                        >
                                          {scenarioLines.map((line, lIdx) => (
                                            <div
                                              key={lIdx}
                                              className="text-[#1890ff] group-hover:underline text-[11.5px] leading-relaxed truncate"
                                            >
                                              {line}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <span
                                          onClick={() =>
                                            setScenarioModal({
                                              open: true,
                                              item,
                                              blocks: initScenarioBlocks(item),
                                            })
                                          }
                                          className="text-[#bfbfbf] hover:text-[#1890ff] cursor-pointer text-xs"
                                          title="点击配置分支场景"
                                        >
                                          -
                                        </span>
                                      )}
                                    </td>
                                  );

                                case 'scope':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-3 px-4 border-r border-[#f0f0f0] text-[#303133]">
                                      <div className="flex items-center gap-1.5 text-xs text-[#262626] truncate">
                                        <Building2 className="w-3.5 h-3.5 text-[#1890ff] shrink-0" />
                                        <span className="truncate" title={item.scope || '全集团各单位及下属子公司'}>
                                          {item.scope || '全集团各单位及下属子公司'}
                                        </span>
                                      </div>
                                    </td>
                                  );

                                case 'effectiveApproval':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-3 px-4 border-r border-[#f0f0f0]">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAuditProgressModal({
                                            open: true,
                                            item,
                                          });
                                        }}
                                        className="flex items-center gap-1.5 text-xs text-[#1890ff] hover:underline cursor-pointer group text-left max-w-full"
                                        title="点击查看生效审批进度"
                                      >
                                        <ShieldCheck className="w-3.5 h-3.5 text-[#52c41a] shrink-0" />
                                        <span className="truncate">
                                          {item.effectiveApproval ||
                                            (item.status === '已发布' || item.status === '已生效'
                                              ? '已审批通过'
                                              : item.status === '待审核' || item.status === '审核中'
                                              ? '审批中 (权责委员会)'
                                              : '待发起审批')}
                                        </span>
                                      </button>
                                    </td>
                                  );

                                case 'submitTime':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-3 px-4 border-r border-[#f0f0f0] font-mono text-[11.5px] text-[#595959]">
                                      <div className="flex items-center gap-1 truncate">
                                        <Clock className="w-3.5 h-3.5 text-[#bfbfbf] shrink-0" />
                                        <span className="truncate">{item.submitTime || item.updateTime || '2026-03-31 10:20:00'}</span>
                                      </div>
                                    </td>
                                  );

                                case 'status':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-3 px-4 text-center border-r border-[#f0f0f0]">
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                                          item.status === '已发布' || item.status === '已生效'
                                            ? 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]'
                                            : item.status === '待审核' || item.status === '审核中'
                                            ? 'bg-[#e6f7ff] text-[#1890ff] border-[#91d5ff]'
                                            : item.status === '已驳回'
                                            ? 'bg-[#fff1f0] text-[#ff4d4f] border-[#ffa39e]'
                                            : 'bg-[#fafafa] text-[#8c8c8c] border-[#d9d9d9]'
                                        }`}
                                      >
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                            item.status === '已发布' || item.status === '已生效'
                                              ? 'bg-[#52c41a]'
                                              : item.status === '待审核' || item.status === '审核中'
                                              ? 'bg-[#1890ff]'
                                              : item.status === '已驳回'
                                              ? 'bg-[#ff4d4f]'
                                              : 'bg-[#bfbfbf]'
                                          }`}
                                        />
                                        {item.status || '草稿'}
                                      </span>
                                    </td>
                                  );

                                case 'actions':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-3 px-4 text-center">
                                      <div className="flex items-center justify-center gap-2.5 text-xs whitespace-nowrap">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setDutyItemModal({
                                              open: true,
                                              mode: 'edit',
                                              data: { ...item },
                                            })
                                          }
                                          className="text-[#1890ff] hover:underline cursor-pointer"
                                        >
                                          编辑
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setScenarioModal({
                                              open: true,
                                              item,
                                              blocks: initScenarioBlocks(item),
                                            })
                                          }
                                          className="text-[#1890ff] hover:underline cursor-pointer"
                                        >
                                          场景配置
                                        </button>
                                        {(item.status === '草稿' || item.status === '已驳回') && (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenAuditModal(item.id)}
                                            className="text-[#1890ff] font-medium hover:underline cursor-pointer"
                                            title="配置多层级审批人并送审"
                                          >
                                            送审
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setAuditProgressModal({
                                              open: true,
                                              item,
                                            })
                                          }
                                          className="text-[#1890ff] hover:underline cursor-pointer"
                                        >
                                          审核进度
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyDutyItem(item)}
                                          className="text-[#1890ff] hover:underline cursor-pointer"
                                        >
                                          复制
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteDutyItem(item)}
                                          className="text-[#ff4d4f] hover:underline cursor-pointer"
                                        >
                                          删除
                                        </button>
                                      </div>
                                    </td>
                                  );

                                default:
                                  return <td key={col.key} style={cellStyle} className="py-3 px-4 border-r border-[#f0f0f0]">-</td>;
                              }
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Pagination */}
              <div className="h-11 border-t border-[#f0f0f0] px-4 flex items-center justify-end gap-3 text-xs text-[#606266] bg-white shrink-0">
                <span>共 {totalDutyItems} 条</span>
                <select
                  value={dutyPageSize}
                  onChange={(e) => {
                    setDutyPageSize(Number(e.target.value));
                    setDutyPage(1);
                  }}
                  className="h-7 px-2 border border-[#d9d9d9] rounded text-xs text-[#606266] bg-white cursor-pointer"
                >
                  <option value={10}>10条/页</option>
                  <option value={20}>20条/页</option>
                  <option value={50}>50条/页</option>
                </select>

                <button
                  type="button"
                  disabled={dutyPage <= 1}
                  onClick={() => setDutyPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 flex items-center justify-center border border-[#d9d9d9] rounded disabled:opacity-40"
                >
                  &lt;
                </button>

                {Array.from({ length: totalDutyPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDutyPage(p)}
                    className={`w-7 h-7 rounded text-xs font-medium ${
                      dutyPage === p
                        ? 'bg-[#1890ff] text-white'
                        : 'border border-[#d9d9d9] text-[#606266]'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={dutyPage >= totalDutyPages}
                  onClick={() => setDutyPage((p) => Math.min(totalDutyPages, p + 1))}
                  className="w-7 h-7 flex items-center justify-center border border-[#d9d9d9] rounded disabled:opacity-40"
                >
                  &gt;
                </button>

                <div className="flex items-center gap-1.5 ml-1">
                  <span>前往</span>
                  <input
                    type="text"
                    value={dutyPageJump}
                    onChange={(e) => setDutyPageJump(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const p = parseInt(dutyPageJump, 10);
                        if (!isNaN(p) && p >= 1 && p <= totalDutyPages) setDutyPage(p);
                      }
                    }}
                    className="w-10 h-7 text-center border border-[#d9d9d9] rounded text-xs text-[#606266]"
                  />
                  <span>页</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Context Popover Menu (Design Draft Context Menu outlined in red) */}
        {categoryMenuState.nodeId && categoryMenuState.node && (
          <div
            style={{
              position: 'fixed',
              left: `${categoryMenuState.x}px`,
              top: `${categoryMenuState.y}px`,
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-32 bg-white rounded-md shadow-lg border border-[#e8e8e8] py-1 text-xs text-[#262626] animate-in fade-in duration-100"
          >
            <button
              type="button"
              onClick={() => {
                const node = categoryMenuState.node!;
                setCategoryMenuState({ nodeId: null, node: null, x: 0, y: 0 });
                setCategoryActionModal({
                  open: true,
                  mode: 'create',
                  targetNode: node,
                  selectedParentId: node.id,
                  name: '',
                });
              }}
              className="w-full text-left px-3.5 py-1.5 hover:bg-[#e6f7ff] hover:text-[#1890ff] cursor-pointer transition-colors"
            >
              创建子分类
            </button>
            <button
              type="button"
              onClick={() => {
                const node = categoryMenuState.node!;
                setCategoryMenuState({ nodeId: null, node: null, x: 0, y: 0 });
                setCategoryActionModal({
                  open: true,
                  mode: 'edit',
                  targetNode: node,
                  selectedParentId: node.parentId || null,
                  name: node.name,
                });
              }}
              className="w-full text-left px-3.5 py-1.5 hover:bg-[#e6f7ff] hover:text-[#1890ff] cursor-pointer transition-colors"
            >
              编辑分类
            </button>
            <button
              type="button"
              onClick={() => {
                setCategoryMenuState({ nodeId: null, node: null, x: 0, y: 0 });
                showToast('已更新分类排序', 'info');
              }}
              className="w-full text-left px-3.5 py-1.5 hover:bg-[#e6f7ff] hover:text-[#1890ff] cursor-pointer transition-colors"
            >
              分类排序
            </button>
            <button
              type="button"
              onClick={() => {
                const node = categoryMenuState.node!;
                setCategoryMenuState({ nodeId: null, node: null, x: 0, y: 0 });
                handleDeleteCategory(node);
              }}
              className="w-full text-left px-3.5 py-1.5 hover:bg-[#fff1f0] text-[#ff4d4f] cursor-pointer transition-colors"
            >
              删除分类
            </button>
          </div>
        )}

        {/* Modal: Category Action (创建分类 / 编辑分类 - 支持从目录中选择某一个目录，填入新分类名称，明确显示层级关系) */}
        {categoryActionModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-[#ebeef5] w-full max-w-lg p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[#e6f7ff] text-[#1890ff] flex items-center justify-center">
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#262626]">
                      {categoryActionModal.mode === 'create' ? '创建权责分类' : '编辑权责分类'}
                    </h4>
                    <p className="text-[11px] text-[#8c8c8c]">
                      支持从目录列表中自由选择挂载目录，清晰定义并明确呈现层级关系
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCategoryActionModal({ ...categoryActionModal, open: false })}
                  className="p-1 text-[#8c8c8c] hover:text-[#262626] rounded hover:bg-[#f5f5f5]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Field 1: 挂载所属目录 (从目录中选择某一个目录) */}
              <div className="space-y-1.5">
                <label className="block text-[#262626] font-medium flex items-center justify-between">
                  <span>
                    <span className="text-[#ff4d4f]">*</span> 挂载所属目录 (选择上级父级分类)
                  </span>
                  <span className="text-[11px] text-[#8c8c8c] font-normal">
                    {categoryActionModal.selectedParentId ? '当前为多级子分类' : '当前为一级顶级主分类'}
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={categoryActionModal.selectedParentId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCategoryActionModal({
                        ...categoryActionModal,
                        selectedParentId: val ? val : null,
                      });
                    }}
                    className="w-full h-9 px-3 pr-8 border border-[#d9d9d9] rounded bg-white text-xs text-[#262626] focus:outline-none focus:border-[#1890ff] cursor-pointer"
                  >
                    {categoryCatalogOptions.map((opt) => {
                      const indent = '　'.repeat(opt.level);
                      const prefix = opt.level === 0 ? '📁 ' : `${indent}└─ 📁 `;
                      const label = opt.level === 0 ? opt.name : `${prefix}${opt.name} (${opt.level}级目录)`;
                      return (
                        <option
                          key={opt.id || '__root__'}
                          value={opt.id || ''}
                          disabled={opt.disabled}
                        >
                          {label} {opt.disabled ? '(当前分类或其子分类，不可选)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="text-[11px] text-[#8c8c8c] flex items-center gap-1.5 pt-0.5">
                  <Info className="w-3.5 h-3.5 text-[#1890ff] shrink-0" />
                  <span>
                    {categoryActionModal.selectedParentId
                      ? `将挂载于【${findCategoryNodeInTree(categoryTree, categoryActionModal.selectedParentId)?.name || '所选目录'}】之下`
                      : '未选择上级目录，将作为与集团手册并列的【一级顶级主分类】'}
                  </span>
                </div>
              </div>

              {/* Form Field 2: 分类名称 */}
              <div className="space-y-1.5">
                <label className="block text-[#262626] font-medium">
                  <span className="text-[#ff4d4f]">*</span> 分类名称
                </label>
                <input
                  type="text"
                  value={categoryActionModal.name}
                  onChange={(e) =>
                    setCategoryActionModal({ ...categoryActionModal, name: e.target.value })
                  }
                  placeholder="请输入分类名称，如：综合管理中心 / 供应链运营部 / 采购分部"
                  className="w-full h-8 px-2.5 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#1890ff]"
                  autoFocus
                />
              </div>

              {/* Form Field 3: 明确显示层级关系与架构结构预览 (层级关系明确和显示出层级关系) */}
              <div className="bg-[#f8faff] rounded-lg border border-[#d6e4ff] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1d39c4]">
                    <Network className="w-3.5 h-3.5 text-[#2f54eb]" />
                    <span>分类层级关系明确与结构预览</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f7ff] text-[#1890ff] border border-[#91d5ff]">
                    规划层级: L{modalTargetLevel} ({modalTargetLevel === 1 ? '1级顶级主分类' : modalTargetLevel === 2 ? '2级分类' : `${modalTargetLevel}级子分类`})
                  </span>
                </div>

                {/* 完整层级路径面包屑 */}
                <div className="bg-white p-2.5 rounded border border-[#adc6ff] text-xs space-y-1">
                  <div className="text-[11px] text-[#8c8c8c] flex items-center justify-between">
                    <span>完整挂载路径 (完整层级链)：</span>
                    <span className="text-[#595959]">深度: {modalTargetLevel} 层</span>
                  </div>
                  <div className="flex items-center flex-wrap gap-1 font-medium text-[#262626] pt-0.5">
                    <span className="text-[#8c8c8c] bg-[#f5f5f5] px-1.5 py-0.5 rounded border border-[#e8e8e8]">根目录</span>
                    {modalSelectedParentPath.map((p) => (
                      <React.Fragment key={p.id}>
                        <ChevronRight className="w-3 h-3 text-[#bfbfbf]" />
                        <span className="text-[#595959] bg-[#f0f5ff] px-1.5 py-0.5 rounded border border-[#d6e4ff]">{p.name}</span>
                      </React.Fragment>
                    ))}
                    <ChevronRight className="w-3 h-3 text-[#1890ff]" />
                    <span className="text-[#1890ff] bg-[#e6f7ff] px-2 py-0.5 rounded font-bold border border-[#91d5ff] flex items-center gap-1">
                      <span>🏷️</span>
                      <span>{categoryActionModal.name.trim() || '未输入分类名称'}</span>
                    </span>
                  </div>
                </div>

                {/* 拓扑结构示意图 */}
                <div className="bg-white/90 p-2.5 rounded border border-[#d6e4ff] text-xs font-mono space-y-1">
                  <div className="text-[11px] text-[#8c8c8c] font-sans pb-1 border-b border-[#f0f0f0] flex items-center justify-between">
                    <span>拓扑结构示意图：</span>
                    <span className="text-[#1890ff]">层级树结构即时联动</span>
                  </div>
                  <div className="pt-1 space-y-1">
                    {modalSelectedParentPath.length === 0 ? (
                      <div className="space-y-1 pl-1 font-sans">
                        <div className="text-[#8c8c8c] flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-[#8c8c8c]" />
                          <span>[手册根目录]</span>
                        </div>
                        <div className="pl-4 text-[#1890ff] font-bold flex items-center gap-1 bg-[#e6f7ff]/50 p-1 rounded">
                          <span>└── 🏷️</span>
                          <span>{categoryActionModal.name.trim() || '新分类名称'} (L1 顶级分类)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 pl-1 font-sans">
                        {modalSelectedParentPath.map((p, i) => (
                          <div
                            key={p.id}
                            style={{ paddingLeft: `${i * 16}px` }}
                            className="text-[#595959] flex items-center gap-1.5 text-xs"
                          >
                            <span>{i === 0 ? '📁' : '└── 📁'}</span>
                            <span className="font-medium">{p.name}</span>
                            <span className="text-[10px] text-[#8c8c8c] font-mono bg-[#f5f5f5] px-1 rounded">L{i + 1}</span>
                          </div>
                        ))}
                        <div
                          style={{ paddingLeft: `${modalSelectedParentPath.length * 16}px` }}
                          className="text-[#1890ff] font-bold flex items-center gap-1.5 text-xs bg-[#e6f7ff]/70 p-1 rounded border border-[#91d5ff]"
                        >
                          <span>└── 🏷️</span>
                          <span>{categoryActionModal.name.trim() || '新分类名称'}</span>
                          <span className="text-[10px] text-[#1890ff] font-mono bg-[#bae7ff] px-1.5 py-0.2 rounded">
                            L{modalTargetLevel} · {categoryActionModal.mode === 'create' ? '新建位置' : '调整后位置'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {categoryActionModal.mode === 'edit' && categoryActionModal.targetNode && (
                  <div className="text-[11px] text-[#595959] pt-1.5 border-t border-[#d6e4ff] flex items-center justify-between">
                    <span>
                      原上级目录：
                      <span className="font-semibold text-[#262626]">
                        {categoryActionModal.targetNode.parentId
                          ? findCategoryNodeInTree(categoryTree, categoryActionModal.targetNode.parentId)?.name || '已设置上级'
                          : '根目录 (顶级分类)'}
                      </span>
                    </span>
                    {categoryActionModal.selectedParentId !== (categoryActionModal.targetNode.parentId || null) && (
                      <span className="text-[#fa8c16] font-medium bg-[#fffbe6] px-2 py-0.5 rounded border border-[#ffe58f] flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        <span>已调整所属目录跨层级移动</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Dialog Actions */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-[#f0f0f0]">
                <button
                  type="button"
                  onClick={() => setCategoryActionModal({ ...categoryActionModal, open: false })}
                  className="h-8 px-4 rounded border border-[#d9d9d9] text-[#595959] hover:text-[#262626] hover:border-[#bfbfbf] transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategoryModal}
                  className="h-8 px-5 rounded bg-[#1890ff] text-white font-medium hover:bg-[#40a9ff] transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>确定保存</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Duty Item (新增 / 编辑权责) */}
        {dutyItemModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="bg-white rounded-lg shadow-xl border border-[#ebeef5] w-full max-w-lg p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-2">
                <h4 className="text-sm font-semibold text-[#262626]">
                  {dutyItemModal.mode === 'create' ? '新增权责事项' : '编辑权责事项'}
                </h4>
                <button
                  type="button"
                  onClick={() => setDutyItemModal({ ...dutyItemModal, open: false })}
                  className="p-1 text-[#8c8c8c] hover:text-[#262626]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#595959] mb-1">
                    <span className="text-[#ff4d4f]">*</span> 权责编号
                  </label>
                  <input
                    type="text"
                    value={dutyItemModal.data.dutyNo || ''}
                    onChange={(e) =>
                      setDutyItemModal({
                        ...dutyItemModal,
                        data: { ...dutyItemModal.data, dutyNo: e.target.value },
                      })
                    }
                    placeholder="如：PR-AP-0013"
                    className="w-full h-8 px-2.5 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#1890ff]"
                  />
                </div>
                <div>
                  <label className="block text-[#595959] mb-1">所属分类</label>
                  <input
                    type="text"
                    value={dutyItemModal.data.categoryName || selectedCategoryNode?.name || ''}
                    onChange={(e) =>
                      setDutyItemModal({
                        ...dutyItemModal,
                        data: { ...dutyItemModal.data, categoryName: e.target.value },
                      })
                    }
                    className="w-full h-8 px-2.5 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#1890ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#595959] mb-1">
                  <span className="text-[#ff4d4f]">*</span> 权责名称
                </label>
                <input
                  type="text"
                  value={dutyItemModal.data.dutyName || ''}
                  onChange={(e) =>
                    setDutyItemModal({
                      ...dutyItemModal,
                      data: { ...dutyItemModal.data, dutyName: e.target.value },
                    })
                  }
                  placeholder="如：采购合同签署与付款审批"
                  className="w-full h-8 px-2.5 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#1890ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#595959] mb-1">主责角色</label>
                  <input
                    type="text"
                    value={dutyItemModal.data.primaryRole || ''}
                    onChange={(e) =>
                      setDutyItemModal({
                        ...dutyItemModal,
                        data: { ...dutyItemModal.data, primaryRole: e.target.value },
                      })
                    }
                    placeholder="如：财务主管、研发经理"
                    className="w-full h-8 px-2.5 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#1890ff]"
                  />
                </div>
                <div>
                  <label className="block text-[#595959] mb-1">状态</label>
                  <select
                    value={dutyItemModal.data.status || '草稿'}
                    onChange={(e) =>
                      setDutyItemModal({
                        ...dutyItemModal,
                        data: { ...dutyItemModal.data, status: e.target.value as any },
                      })
                    }
                    className="w-full h-8 px-2.5 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#1890ff] bg-white"
                  >
                    <option value="草稿">草稿</option>
                    <option value="待审核">待审核</option>
                    <option value="审核中">审核中</option>
                    <option value="已发布">已发布</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#595959] mb-1">
                  授权使用范围 <span className="text-[11px] text-[#8c8c8c] font-normal">(支持从公司组织架构树选择部门/事业部或手工输入)</span>
                </label>
                <DeptSelectField
                  value={dutyItemModal.data.scope || ''}
                  onChange={(val) =>
                    setDutyItemModal({
                      ...dutyItemModal,
                      data: { ...dutyItemModal.data, scope: val },
                    })
                  }
                  modalTitle="选择授权使用范围 (部门 / 事业部)"
                  modalDescription="支持从公司组织架构树中挑选部门或事业部，也可快速选用全局模板或手工输入范围"
                  placeholder="点击从组织架构中选择部门/事业部，或手工输入范围..."
                  className="w-full text-xs"
                  showToast={showToast}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#595959] mb-1">生效审批</label>
                  <input
                    type="text"
                    value={dutyItemModal.data.effectiveApproval || ''}
                    onChange={(e) =>
                      setDutyItemModal({
                        ...dutyItemModal,
                        data: { ...dutyItemModal.data, effectiveApproval: e.target.value },
                      })
                    }
                    placeholder="如：已审批通过 (OA流程) / 待发起审批"
                    className="w-full h-8 px-2.5 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#1890ff]"
                  />
                </div>
                <div>
                  <label className="block text-[#595959] mb-1">提交时间</label>
                  <input
                    type="text"
                    value={dutyItemModal.data.submitTime || ''}
                    onChange={(e) =>
                      setDutyItemModal({
                        ...dutyItemModal,
                        data: { ...dutyItemModal.data, submitTime: e.target.value },
                      })
                    }
                    placeholder="如：2026-03-31 10:20:00"
                    className="w-full h-8 px-2.5 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#1890ff]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#f0f0f0]">
                <button
                  type="button"
                  onClick={() => setDutyItemModal({ ...dutyItemModal, open: false })}
                  className="h-8 px-4 rounded border border-[#d9d9d9] text-[#595959]"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveDutyItem}
                  className="h-8 px-4 rounded bg-[#1890ff] text-white font-medium cursor-pointer"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Scenario Configuration (场景配置 - 设计稿 image_6e96ed0a.png) */}
        {scenarioModal.open && scenarioModal.item && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-lg shadow-2xl border border-[#ebeef5] w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden text-xs">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#1890ff] rounded-xs" />
                  <h3 className="text-sm font-semibold text-[#262626]">场景配置</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setScenarioModal({ ...scenarioModal, open: false })}
                  className="text-[#8c8c8c] hover:text-[#262626] cursor-pointer p-1 rounded hover:bg-[#f5f5f5] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto px-8 py-5 space-y-5">
                {/* 权责名称 */}
                <div className="flex items-center">
                  <span className="text-sm text-[#262626] font-normal w-24 shrink-0">
                    权责名称：
                  </span>
                  <span className="text-sm text-[#262626] font-normal">
                    {scenarioModal.item.dutyName}
                  </span>
                </div>

                {/* 权责场景 */}
                <div className="flex items-start pt-1">
                  <span className="text-sm text-[#262626] font-normal w-24 shrink-0 pt-3">
                    权责场景：
                  </span>

                  {/* Scenarios List */}
                  <div className="flex-1 space-y-6 min-w-0">
                    {scenarioModal.blocks.map((block, bIdx) => (
                      <div key={block.id || bIdx} className="flex items-start gap-4">
                        {/* Gray Box (左侧灰色背景框) */}
                        <div className="flex-1 bg-[#f8f9fc] border border-[#eaedf3] rounded-md p-6 space-y-4 shadow-xs">
                          {/* 分支场景 */}
                          <div className="flex items-center">
                            <span className="text-xs text-[#262626] w-18 shrink-0 text-right pr-3 font-normal">
                              分支场景：
                            </span>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={block.condition}
                                onChange={(e) => {
                                  const updated = [...scenarioModal.blocks];
                                  updated[bIdx] = { ...updated[bIdx], condition: e.target.value };
                                  setScenarioModal({ ...scenarioModal, blocks: updated });
                                }}
                                placeholder="请输入分支场景条件，如：应付, >100, "
                                className="w-full h-8 px-3 rounded border border-[#d9d9d9] bg-white text-xs text-[#262626] placeholder-[#bfbfbf] focus:border-[#1890ff] focus:outline-none transition-colors"
                              />
                            </div>
                          </div>

                          {/* 审批配置 */}
                          <div className="flex items-start">
                            <span className="text-xs text-[#262626] w-18 shrink-0 text-right pr-3 pt-2 font-normal">
                              审批配置：
                            </span>

                            <div className="flex-1 space-y-2.5">
                              {/* 提案 */}
                              <RoleInputGroup
                                label="提案"
                                item={block.propose}
                                onChange={(val) => {
                                  const updated = [...scenarioModal.blocks];
                                  updated[bIdx] = { ...updated[bIdx], propose: val };
                                  setScenarioModal({ ...scenarioModal, blocks: updated });
                                }}
                              />

                              {/* 会审 */}
                              <RoleInputGroup
                                label="会审"
                                item={block.jointReview}
                                onChange={(val) => {
                                  const updated = [...scenarioModal.blocks];
                                  updated[bIdx] = { ...updated[bIdx], jointReview: val };
                                  setScenarioModal({ ...scenarioModal, blocks: updated });
                                }}
                              />

                              {/* 会审是否支持驳回 */}
                              <div className="flex items-center gap-3 pl-14 py-0.5">
                                <span className="text-xs text-[#595959]">会审是否支持驳回</span>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={block.jointReviewAllowReject}
                                  onClick={() => {
                                    const updated = [...scenarioModal.blocks];
                                    updated[bIdx] = {
                                      ...updated[bIdx],
                                      jointReviewAllowReject: !block.jointReviewAllowReject,
                                    };
                                    setScenarioModal({ ...scenarioModal, blocks: updated });
                                  }}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    block.jointReviewAllowReject ? 'bg-[#1890ff]' : 'bg-[#d9d9d9]'
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                      block.jointReviewAllowReject ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </div>

                              {/* 批准1 */}
                              <RoleInputGroup
                                label="批准1"
                                item={block.approve1}
                                onChange={(val) => {
                                  const updated = [...scenarioModal.blocks];
                                  updated[bIdx] = { ...updated[bIdx], approve1: val };
                                  setScenarioModal({ ...scenarioModal, blocks: updated });
                                }}
                              />

                              {/* 批准2 */}
                              <RoleInputGroup
                                label="批准2"
                                item={block.approve2}
                                onChange={(val) => {
                                  const updated = [...scenarioModal.blocks];
                                  updated[bIdx] = { ...updated[bIdx], approve2: val };
                                  setScenarioModal({ ...scenarioModal, blocks: updated });
                                }}
                              />

                              {/* 备案 */}
                              <RoleInputGroup
                                label="备案"
                                item={block.record}
                                onChange={(val) => {
                                  const updated = [...scenarioModal.blocks];
                                  updated[bIdx] = { ...updated[bIdx], record: val };
                                  setScenarioModal({ ...scenarioModal, blocks: updated });
                                }}
                              />

                              {/* 其他 */}
                              <RoleInputGroup
                                label="其他"
                                item={block.other}
                                onChange={(val) => {
                                  const updated = [...scenarioModal.blocks];
                                  updated[bIdx] = { ...updated[bIdx], other: val };
                                  setScenarioModal({ ...scenarioModal, blocks: updated });
                                }}
                              />

                              {/* 审批 */}
                              <RoleInputGroup
                                label="审批"
                                item={block.audit}
                                onChange={(val) => {
                                  const updated = [...scenarioModal.blocks];
                                  updated[bIdx] = { ...updated[bIdx], audit: val };
                                  setScenarioModal({ ...scenarioModal, blocks: updated });
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: 绿色加号 & 红色删除 (设计稿 image_6e96ed0a.png 红框标注) */}
                        <div className="flex items-center gap-2 shrink-0 pt-2">
                          {/* 绿色加号按钮: 支持在下方再增加一个和左侧灰色背景框内的所有内容一样的布局和内容 */}
                          <button
                            type="button"
                            onClick={() => {
                              const newBlock: ScenarioConfigBlock = JSON.parse(
                                JSON.stringify(block)
                              );
                              newBlock.id =
                                'block_' +
                                Date.now().toString(36) +
                                '_' +
                                Math.random().toString(36).slice(2, 6);
                              const updated = [...scenarioModal.blocks];
                              updated.splice(bIdx + 1, 0, newBlock);
                              setScenarioModal({ ...scenarioModal, blocks: updated });
                              showToast('已在下方增加一个相同的场景配置', 'success');
                            }}
                            className="w-8 h-8 rounded-full bg-[#52c41a] hover:bg-[#73d13d] active:scale-95 text-white flex items-center justify-center cursor-pointer shadow-sm transition-all"
                            title="在下方增加一个和左侧灰色背景框内的所有内容一样的布局和内容"
                          >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                          </button>

                          {/* 红色删除按钮 */}
                          <button
                            type="button"
                            onClick={() => {
                              if (scenarioModal.blocks.length <= 1) {
                                const resetBlock = createDefaultScenarioBlock('');
                                setScenarioModal({ ...scenarioModal, blocks: [resetBlock] });
                                showToast('已清空当前场景配置', 'info');
                                return;
                              }
                              const updated = [...scenarioModal.blocks];
                              updated.splice(bIdx, 1);
                              setScenarioModal({ ...scenarioModal, blocks: updated });
                              showToast('已删除该场景配置', 'info');
                            }}
                            className="w-8 h-8 rounded-full bg-[#ff4d4f] hover:bg-[#ff7875] active:scale-95 text-white flex items-center justify-center cursor-pointer shadow-sm transition-all"
                            title="删除该场景配置"
                          >
                            <Trash2 className="w-4 h-4 stroke-[2]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer: 提交 & 取消 (设计稿 image_6e96ed0a.png 红框标注) */}
              <div className="flex items-center justify-end gap-3 px-8 py-3.5 border-t border-[#f0f0f0] bg-white shrink-0">
                <button
                  type="button"
                  onClick={handleSaveScenarios}
                  className="h-8 px-6 rounded bg-[#1890ff] hover:bg-[#40a9ff] active:bg-[#096dd9] text-white text-xs font-medium cursor-pointer shadow-xs transition-colors"
                >
                  提交
                </button>
                <button
                  type="button"
                  onClick={() => setScenarioModal({ ...scenarioModal, open: false })}
                  className="h-8 px-6 rounded bg-white hover:bg-[#f5f5f5] text-[#595959] border border-[#d9d9d9] text-xs font-medium cursor-pointer transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Audit Progress (审核进度) */}
        {auditProgressModal.open && auditProgressModal.item && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="bg-white rounded-lg shadow-xl border border-[#ebeef5] w-full max-w-lg p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-2.5">
                <div>
                  <h4 className="text-sm font-semibold text-[#262626] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#1890ff]" />
                    <span>审核流转进度 - 【{auditProgressModal.item.dutyName}】</span>
                  </h4>
                  <span className="font-mono text-xs text-[#8c8c8c]">
                    权责编号: {auditProgressModal.item.dutyNo} | 状态: {auditProgressModal.item.status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAuditProgressModal({ open: false, item: null })}
                  className="p-1 text-[#8c8c8c] hover:text-[#262626] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 py-1">
                {[
                  {
                    step: 1,
                    title: '第1级: 权责初审',
                    operator: '张明 (权责推进专员 · 权责管理部)',
                    time: auditProgressModal.item.submitTime || auditProgressModal.item.updateTime,
                    status:
                      auditProgressModal.item.status === '已发布' ||
                      auditProgressModal.item.status === '已生效'
                        ? 'completed'
                        : auditProgressModal.item.status === '待审核' ||
                          auditProgressModal.item.status === '审核中'
                        ? 'current'
                        : 'pending',
                    note: '审核权责边界与场景规则完整性',
                  },
                  {
                    step: 2,
                    title: '第2级: 合规复核',
                    operator: '陈静 (合规法务总监 · 质量合规部)',
                    time:
                      auditProgressModal.item.status === '已发布' ? '2026-03-25 10:15:00' : '',
                    status:
                      auditProgressModal.item.status === '已发布' ||
                      auditProgressModal.item.status === '已生效'
                        ? 'completed'
                        : auditProgressModal.item.status === '审核中'
                        ? 'current'
                        : 'pending',
                    note: '符合企业内部控制与合规授权标准',
                  },
                  {
                    step: 3,
                    title: '第3级: 终审批准',
                    operator: '刘建国 (决策委员会主任 · 决策委员会)',
                    time:
                      auditProgressModal.item.status === '已发布' ? '2026-03-25 15:20:00' : '',
                    status:
                      auditProgressModal.item.status === '已发布' ||
                      auditProgressModal.item.status === '已生效'
                        ? 'completed'
                        : 'pending',
                    note: '决议准予全集团发布并生效实施',
                  },
                ].map((node) => (
                  <div key={node.step} className="flex gap-3 items-start bg-[#fafafa] p-2.5 rounded border border-[#f0f0f0]">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        node.status === 'completed'
                          ? 'bg-[#52c41a] text-white'
                          : node.status === 'current'
                          ? 'bg-[#1890ff] text-white animate-pulse'
                          : 'bg-[#d9d9d9] text-[#595959]'
                      }`}
                    >
                      {node.status === 'completed' ? '✓' : node.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#262626]">{node.title}</span>
                        {node.time && <span className="text-[11px] font-mono text-[#8c8c8c]">{node.time}</span>}
                      </div>
                      <div className="text-[11px] text-[#595959] mt-0.5">
                        审批人: {node.operator}
                      </div>
                      {node.note && (
                        <div className="text-[11px] text-[#8c8c8c] mt-1">
                          审批意见: {node.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-[#f0f0f0]">
                <button
                  type="button"
                  onClick={() => {
                    setAuditProgressModal({ open: false, item: null });
                    if (onNavigate) onNavigate('/flowdoc/verify');
                  }}
                  className="text-xs text-[#1890ff] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <span>前往【权责审核】页面进行审核操作</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setAuditProgressModal({ open: false, item: null })}
                  className="h-8 px-4 rounded bg-white hover:bg-[#f5f7fa] border border-[#d9d9d9] text-[#595959] text-xs font-medium cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Multi-Level Approver Setup (匹配设计稿 image_22d2343e.png: 提交后支持选择多层级审批者) */}
        {multiLevelAuditModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl border border-[#ebeef5] w-full max-w-2xl my-6 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#f0f0f0] flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#e6f7ff] text-[#1890ff] flex items-center justify-center">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#262626]">
                      提交审核 · 配置多层级审批流程
                    </h3>
                    <p className="text-[11px] text-[#8c8c8c]">
                      按照层级推送审批任务到指定审批人的待办事项，并在“权责审核”页面支持审批操作
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMultiLevelAuditModal({ ...multiLevelAuditModal, open: false })}
                  className="text-[#8c8c8c] hover:text-[#262626] p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                {/* Selected Items summary */}
                <div className="p-3 bg-[#e6f7ff]/50 rounded-lg border border-[#91d5ff]/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1890ff] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>待送审权责事项（共 {multiLevelAuditModal.itemIds.length} 项）</span>
                    </span>
                    <span className="text-[11px] text-[#595959]">
                      所属手册: {selectedManual?.manualName}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {dutyItems
                      .filter((i) => multiLevelAuditModal.itemIds.includes(i.id))
                      .map((item) => (
                        <span
                          key={item.id}
                          className="px-2 py-0.5 rounded bg-white text-[#262626] border border-[#d9d9d9] text-[11px] font-mono shadow-2xs"
                        >
                          <strong className="text-[#1890ff]">{item.dutyNo}</strong>: {item.dutyName}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Urgency & Remarks */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-[#262626] mb-1.5">
                      紧急程度
                    </label>
                    <div className="flex items-center gap-2">
                      {(['普通', '紧急', '特急'] as const).map((urg) => (
                        <label
                          key={urg}
                          onClick={() => setMultiLevelAuditModal({ ...multiLevelAuditModal, urgency: urg })}
                          className={`flex-1 flex items-center justify-center h-8 rounded border text-xs cursor-pointer transition-all ${
                            multiLevelAuditModal.urgency === urg
                              ? urg === '特急'
                                ? 'bg-[#fff1f0] text-[#cf1322] border-[#ffa39e] font-semibold ring-1 ring-[#ffa39e]'
                                : urg === '紧急'
                                ? 'bg-[#fff7e6] text-[#d46b08] border-[#ffd591] font-semibold ring-1 ring-[#ffd591]'
                                : 'bg-[#e6f7ff] text-[#1890ff] border-[#91d5ff] font-semibold ring-1 ring-[#91d5ff]'
                              : 'bg-white text-[#595959] border-[#d9d9d9] hover:bg-[#fafafa]'
                          }`}
                        >
                          {urg}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-[#262626] mb-1.5">
                      送审说明 / 审批备注
                    </label>
                    <input
                      type="text"
                      value={multiLevelAuditModal.remark}
                      onChange={(e) =>
                        setMultiLevelAuditModal({ ...multiLevelAuditModal, remark: e.target.value })
                      }
                      placeholder="如：请依集团权责矩阵规程核定..."
                      className="w-full h-8 px-3 rounded border border-[#d9d9d9] text-xs text-[#262626] focus:outline-none focus:border-[#1890ff] bg-white"
                    />
                  </div>
                </div>

                {/* Multi-Level Approvers List */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-xs text-[#262626] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#1890ff]" />
                      <span>配置审批层级与指定审批人（支持选择多层级审批者）</span>
                    </label>
                    <span className="text-[11px] text-[#8c8c8c]">
                      任务将按层级顺序逐级推送待办
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {multiLevelAuditModal.levels.map((lvl, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-[#d9d9d9] bg-[#fafafa] space-y-2.5 hover:border-[#1890ff] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#1890ff] text-white flex items-center justify-center text-[11px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-xs text-[#262626]">
                              第 {idx + 1} 级审批节点
                            </span>
                          </div>

                          {multiLevelAuditModal.levels.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextLevels = multiLevelAuditModal.levels
                                  .filter((_, i) => i !== idx)
                                  .map((l, i) => ({
                                    ...l,
                                    level: i + 1,
                                    levelName: l.levelName.replace(/第\d+级/, `第${i + 1}级`),
                                  }));
                                setMultiLevelAuditModal({
                                  ...multiLevelAuditModal,
                                  levels: nextLevels,
                                });
                              }}
                              className="text-[#ff4d4f] hover:underline text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>移除此级</span>
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2.5 text-xs">
                          {/* 节点名称 */}
                          <div>
                            <span className="text-[11px] text-[#8c8c8c] block mb-1">
                              节点名称:
                            </span>
                            <input
                              type="text"
                              value={lvl.levelName}
                              onChange={(e) => {
                                const nextLevels = [...multiLevelAuditModal.levels];
                                nextLevels[idx].levelName = e.target.value;
                                setMultiLevelAuditModal({
                                  ...multiLevelAuditModal,
                                  levels: nextLevels,
                                });
                              }}
                              placeholder="如: 第1级: 权责初审"
                              className="w-full h-7 px-2 text-xs rounded border border-[#d9d9d9] bg-white text-[#262626] focus:outline-none focus:border-[#1890ff]"
                            />
                          </div>

                          {/* 指定审批人 */}
                          <div>
                            <span className="text-[11px] text-[#8c8c8c] block mb-1">
                              指定审批人:
                            </span>
                            <PersonSelectField
                              value={lvl.approverName}
                              onChange={(val, person) => {
                                const nextLevels = [...multiLevelAuditModal.levels];
                                nextLevels[idx].approverName = val;
                                if (person) {
                                  nextLevels[idx].roleName = person.roleName || '审批人';
                                  nextLevels[idx].deptName = person.deptName || '管理部';
                                }
                                setMultiLevelAuditModal({
                                  ...multiLevelAuditModal,
                                  levels: nextLevels,
                                });
                              }}
                              modalTitle="指定审批人"
                              modalDescription="支持手工输入中英文姓名或从组织架构部门人员树中挑选审批人"
                              placeholder="选择或手工输入审批人..."
                              className="w-full text-xs"
                            />
                          </div>

                          {/* 角色与归口部门 */}
                          <div>
                            <span className="text-[11px] text-[#8c8c8c] block mb-1">
                              审批角色 / 部门:
                            </span>
                            <input
                              type="text"
                              value={`${lvl.roleName} · ${lvl.deptName}`}
                              onChange={(e) => {
                                const parts = e.target.value.split('·');
                                const nextLevels = [...multiLevelAuditModal.levels];
                                nextLevels[idx].roleName = parts[0]?.trim() || nextLevels[idx].roleName;
                                if (parts[1]) nextLevels[idx].deptName = parts[1].trim();
                                setMultiLevelAuditModal({
                                  ...multiLevelAuditModal,
                                  levels: nextLevels,
                                });
                              }}
                              placeholder="角色 · 部门"
                              className="w-full h-7 px-2 text-xs rounded border border-[#d9d9d9] bg-white text-[#595959] focus:outline-none focus:border-[#1890ff]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Level button */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = multiLevelAuditModal.levels.length + 1;
                      const cand = AUDIT_APPROVER_CANDIDATES[Math.min(nextIdx - 1, AUDIT_APPROVER_CANDIDATES.length - 1)];
                      setMultiLevelAuditModal({
                        ...multiLevelAuditModal,
                        levels: [
                          ...multiLevelAuditModal.levels,
                          {
                            level: nextIdx,
                            levelName: `第${nextIdx}级: 终审批准`,
                            roleName: cand.role,
                            approverName: cand.name,
                            deptName: cand.dept,
                          },
                        ],
                      });
                    }}
                    className="w-full py-2 border-2 border-dashed border-[#91d5ff] hover:border-[#1890ff] text-[#1890ff] hover:bg-[#e6f7ff] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>添加更高层级审批人 (如第 {multiLevelAuditModal.levels.length + 1} 级)</span>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3.5 border-t border-[#f0f0f0] bg-[#fafafa] flex items-center justify-between shrink-0">
                <span className="text-[11px] text-[#8c8c8c]">
                  提交后，审批任务将即刻推送至待办事项并在【权责审核】列表展示
                </span>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMultiLevelAuditModal({ ...multiLevelAuditModal, open: false })}
                    className="h-8 px-4 rounded border border-[#d9d9d9] bg-white text-[#595959] text-xs hover:bg-[#f5f7fa] cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSubmitAudit}
                    className="h-8 px-5 rounded bg-[#1890ff] hover:bg-[#40a9ff] active:bg-[#096dd9] text-white text-xs font-medium cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>确认提交并推送待办</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Batch Import (批量导入) */}
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="bg-white rounded-lg shadow-xl border border-[#ebeef5] w-full max-w-md p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#1890ff]" />
                  <h4 className="text-sm font-semibold text-[#262626]">批量导入权责事项</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="p-1 text-[#8c8c8c] hover:text-[#262626]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="border-2 border-dashed border-[#d9d9d9] hover:border-[#1890ff] rounded-lg p-6 flex flex-col items-center justify-center gap-2 bg-[#fafafa] cursor-pointer transition-colors">
                <Upload className="w-8 h-8 text-[#1890ff]" />
                <span className="font-medium text-[#262626]">点击上传 Excel / CSV 模版文件</span>
                <span className="text-[11px] text-[#8c8c8c]">支持 .xlsx, .xls, .csv 格式</span>
              </div>

              <div className="flex items-center justify-between text-xs text-[#8c8c8c]">
                <span>首次导入请下载标准模版</span>
                <button
                  type="button"
                  onClick={() => showToast('已下载【权责事项批量导入模版.xlsx】', 'success')}
                  className="text-[#1890ff] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载导入模版</span>
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#f0f0f0]">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="h-8 px-4 rounded border border-[#d9d9d9] text-[#595959]"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportModalOpen(false);
                    showToast('已成功模拟导入 3 条权责事项', 'success');
                  }}
                  className="h-8 px-4 rounded bg-[#1890ff] text-white font-medium cursor-pointer"
                >
                  开始解析导入
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =================== RENDER: VIEW 1 - MANUALS LIST (设计稿 image_39921227.png) ===================
  return (
    <div className="flex flex-col gap-3 min-h-full select-none text-[#303133]">
      {/* Search & Filter Bar (Design Draft exact container) */}
      <div className="bg-white rounded border border-[#ebeef5] p-4 shrink-0 shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          {/* 权责手册名称 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#606266] whitespace-nowrap">权责手册名称</span>
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              placeholder="请输入"
              className="h-8 w-48 px-3 rounded border border-[#dcdfe6] text-xs text-[#303133] placeholder-[#c0c4cc] focus:outline-none focus:border-[#409eff] bg-white"
            />
          </div>

          {/* 权责手册编号 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#606266] whitespace-nowrap">权责手册编号</span>
            <input
              type="text"
              value={noFilter}
              onChange={(e) => setNoFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              placeholder="请输入"
              className="h-8 w-48 px-3 rounded border border-[#dcdfe6] text-xs text-[#303133] placeholder-[#c0c4cc] focus:outline-none focus:border-[#409eff] bg-white"
            />
          </div>

          {/* Buttons: 搜索, 重置, 新建权责手册 */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleManualSearch}
              className="h-8 px-4 rounded bg-[#1890ff] hover:bg-[#40a9ff] active:bg-[#096dd9] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>搜索</span>
            </button>

            <button
              type="button"
              onClick={handleManualReset}
              className="h-8 px-3.5 rounded bg-white hover:bg-[#f5f7fa] text-[#606266] hover:text-[#1890ff] border border-[#d9d9d9] hover:border-[#1890ff] text-xs font-normal flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置</span>
            </button>

            {subPath !== '/flowdoc/file' && (
              <button
                type="button"
                onClick={() =>
                  setManualEditModal({
                    open: true,
                    mode: 'create',
                    data: {
                      manualNo: '',
                      manualName: '',
                      attachment: '',
                      viewPermissions: ['系统管理部', '流程管理部', '权责管理部', '知识管理部'],
                      description: '',
                    },
                  })
                }
                className="h-8 px-4 rounded bg-[#1890ff] hover:bg-[#40a9ff] active:bg-[#096dd9] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ml-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新建权责手册</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded border border-[#ebeef5] flex-1 flex flex-col min-h-[480px] shadow-xs overflow-hidden">
        {/* Table Header Control / Hint Bar */}
        <div className="px-3.5 py-1.5 bg-[#fafafa] border-b border-[#f0f0f0] flex items-center justify-between text-[11px] text-[#8c8c8c] shrink-0">
          <div className="flex items-center gap-1.5">
            <MoveHorizontal className="w-3.5 h-3.5 text-[#1890ff]" />
            <span>
              表格支持 <strong className="text-[#1890ff] font-medium">按住拖拽表头重排</strong> 列顺序，及{' '}
              <strong className="text-[#1890ff] font-medium">拖拽右边框调整列宽</strong>（双击边框恢复默认）
            </span>
          </div>
          <button
            type="button"
            onClick={manualGrid.resetColumns}
            className="text-[#8c8c8c] hover:text-[#1890ff] flex items-center gap-1 cursor-pointer transition-colors"
            title="重置为默认列宽与列顺序"
          >
            <RotateCcw className="w-3 h-3" />
            <span>重置表头</span>
          </button>
        </div>

        <div ref={manualGrid.tableContainerRef} className="flex-1 overflow-x-auto overflow-y-auto relative">
          <TableResizeGuideLine resizingInfo={manualGrid.resizingInfo} />
          <table
            style={{ width: `${manualGrid.totalTableWidth}px`, minWidth: '100%' }}
            className="text-left border-collapse text-xs table-fixed"
          >
            <TableColGroup columns={manualGrid.columns} colWidths={manualGrid.colWidths} />
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#f0f0f0] text-[#595959] font-medium h-12">
                {manualGrid.columns.map((col) => (
                  <TableHeaderCell
                    key={col.key}
                    col={col}
                    width={manualGrid.colWidths[col.key] ?? col.defaultWidth}
                    isDragging={manualGrid.draggingKey === col.key}
                    isDragOver={manualGrid.dragOverKey === col.key}
                    dropPosition={manualGrid.dropPosition}
                    isResizing={manualGrid.resizingKey === col.key}
                    onDragStart={(e) => manualGrid.handleDragStart(e, col.key, col)}
                    onDragOver={(e) => manualGrid.handleDragOver(e, col.key, col)}
                    onDragLeave={manualGrid.handleDragLeave}
                    onDrop={(e) => manualGrid.handleDrop(e, col.key, col)}
                    onDragEnd={manualGrid.handleDragEnd}
                    onResizeStart={(e) => manualGrid.handleResizeStart(e, col)}
                    onDoubleClickResize={(e) => manualGrid.handleDoubleClickResize(e, col)}
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {loadingManuals ? (
                <tr>
                  <td colSpan={manualGrid.columns.length} className="py-16 text-center text-[#909399]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#1890ff] border-t-transparent rounded-full animate-spin" />
                      <span>数据加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedManuals.length === 0 ? (
                <tr>
                  <td colSpan={manualGrid.columns.length} className="py-20 text-center text-[#909399]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileCheck2 className="w-10 h-10 text-[#dcdfe6]" />
                      <span className="text-sm">暂无权责手册数据</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedManuals.map((row) => {
                  const permList = Array.isArray(row.viewPermissions) ? row.viewPermissions : [];
                  const permString = permList.join(',');

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-[#f5f7fa] transition-colors h-16 border-b border-[#f0f0f0]"
                    >
                      {manualGrid.columns.map((col) => {
                        const w = manualGrid.colWidths[col.key] ?? col.defaultWidth;
                        const cellStyle = { width: `${w}px`, minWidth: `${col.minWidth ?? w}px` };

                        switch (col.key) {
                          case 'manualNo':
                            return (
                              <td key={col.key} style={cellStyle} className="py-3 px-4 text-[#303133] font-normal border-r border-[#f0f0f0]">
                                <span className="font-mono truncate block">{row.manualNo}</span>
                              </td>
                            );

                          case 'manualName':
                            return (
                              <td key={col.key} style={cellStyle} className="py-3 px-4 text-[#303133] font-normal border-r border-[#f0f0f0]">
                                <span
                                  className="font-medium text-[#262626] hover:text-[#1890ff] transition-colors cursor-pointer truncate block"
                                  onClick={() => handleOpenContentConfig(row)}
                                  title="点击进入内容配置"
                                >
                                  {row.manualName}
                                </span>
                              </td>
                            );

                          case 'attachment':
                            return (
                              <td key={col.key} style={cellStyle} className="py-3 px-4 text-center border-r border-[#f0f0f0]">
                                {row.attachment ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewAttachment({ open: true, fileName: row.attachment })}
                                    className="inline-flex items-center gap-1 text-[#1890ff] hover:underline cursor-pointer max-w-full truncate text-xs"
                                    title={row.attachment}
                                  >
                                    <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{row.attachment}</span>
                                  </button>
                                ) : (
                                  <span className="text-[#bfbfbf]">-</span>
                                )}
                              </td>
                            );

                          case 'categoryCount':
                            return (
                              <td key={col.key} style={cellStyle} className="py-3 px-4 text-center text-[#595959] border-r border-[#f0f0f0]">
                                {row.categoryCount || 0}
                              </td>
                            );

                          case 'publishedCount':
                            return (
                              <td key={col.key} style={cellStyle} className="py-3 px-4 text-center text-[#595959] border-r border-[#f0f0f0]">
                                {row.publishedCount || 0}
                              </td>
                            );

                          case 'totalCount':
                            return (
                              <td key={col.key} style={cellStyle} className="py-3 px-4 text-center text-[#595959] border-r border-[#f0f0f0]">
                                {row.totalCount || 0}
                              </td>
                            );

                          case 'viewPermissions':
                            return (
                              <td key={col.key} style={cellStyle} className="py-3 px-4 border-r border-[#f0f0f0] overflow-hidden">
                                <div
                                  onClick={() => setPermissionModal({ open: true, manual: row })}
                                  className="text-[#595959] line-clamp-3 leading-relaxed hover:text-[#1890ff] cursor-pointer transition-colors"
                                  title="点击查看/配置完整查阅权限部门"
                                >
                                  {permString || '全员可见'}
                                </div>
                              </td>
                            );

                          case 'actions':
                            return (
                              <td key={col.key} style={cellStyle} className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-3 text-xs whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setManualEditModal({
                                        open: true,
                                        mode: 'edit',
                                        data: { ...row },
                                      })
                                    }
                                    className="text-[#1890ff] hover:text-[#40a9ff] hover:underline cursor-pointer"
                                  >
                                    修改
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenContentConfig(row)}
                                    className="text-[#1890ff] hover:text-[#40a9ff] hover:underline cursor-pointer font-medium"
                                  >
                                    内容配置
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyManual(row)}
                                    className="text-[#1890ff] hover:text-[#40a9ff] hover:underline cursor-pointer"
                                  >
                                    复制
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setManualArchiveConfirm({ open: true, manual: row })}
                                    className="text-[#1890ff] hover:text-[#40a9ff] hover:underline cursor-pointer"
                                  >
                                    {row.archived ? '恢复' : '归档'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setManualDeleteConfirm({ open: true, manual: row })}
                                    className="text-[#ff4d4f] hover:text-[#ff7875] hover:underline cursor-pointer"
                                  >
                                    删除
                                  </button>
                                </div>
                              </td>
                            );

                          default:
                            return <td key={col.key} style={cellStyle} className="py-3 px-4 border-r border-[#f0f0f0]">-</td>;
                        }
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="h-12 border-t border-[#f0f0f0] px-4 flex items-center justify-end gap-3 text-xs text-[#606266] bg-white shrink-0">
          <span>共 {totalManuals} 条</span>

          <select
            value={manualPageSize}
            onChange={(e) => {
              setManualPageSize(Number(e.target.value));
              setManualPage(1);
            }}
            className="h-7 px-2 border border-[#d9d9d9] rounded text-xs text-[#606266] focus:outline-none focus:border-[#1890ff] bg-white cursor-pointer"
          >
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
          </select>

          <button
            type="button"
            disabled={manualPage <= 1}
            onClick={() => {
              const p = Math.max(1, manualPage - 1);
              setManualPage(p);
              setManualPageJump(String(p));
            }}
            className="w-7 h-7 flex items-center justify-center border border-[#d9d9d9] rounded hover:border-[#1890ff] hover:text-[#1890ff] disabled:opacity-40 cursor-pointer"
          >
            &lt;
          </button>

          {Array.from({ length: totalManualPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setManualPage(p);
                setManualPageJump(String(p));
              }}
              className={`w-7 h-7 rounded text-xs font-medium cursor-pointer ${
                manualPage === p
                  ? 'bg-[#1890ff] text-white'
                  : 'border border-[#d9d9d9] text-[#606266] hover:border-[#1890ff]'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            disabled={manualPage >= totalManualPages}
            onClick={() => {
              const p = Math.min(totalManualPages, manualPage + 1);
              setManualPage(p);
              setManualPageJump(String(p));
            }}
            className="w-7 h-7 flex items-center justify-center border border-[#d9d9d9] rounded hover:border-[#1890ff] hover:text-[#1890ff] disabled:opacity-40 cursor-pointer"
          >
            &gt;
          </button>

          <div className="flex items-center gap-1.5 ml-1">
            <span>前往</span>
            <input
              type="text"
              value={manualPageJump}
              onChange={(e) => setManualPageJump(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const p = parseInt(manualPageJump, 10);
                  if (!isNaN(p) && p >= 1 && p <= totalManualPages) setManualPage(p);
                }
              }}
              className="w-10 h-7 text-center border border-[#d9d9d9] rounded text-xs text-[#606266]"
            />
            <span>页</span>
          </div>
        </div>
      </div>

      {/* Manual Edit / Create Modal */}
      {manualEditModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-[#ebeef5] w-full max-w-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-[#f0f0f0] flex items-center justify-between bg-[#fafafa]">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#1890ff]" />
                <h4 className="text-sm font-semibold text-[#262626]">
                  {manualEditModal.mode === 'create' ? '新建权责手册' : '修改权责手册'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setManualEditModal({ ...manualEditModal, open: false })}
                className="text-[#8c8c8c] hover:text-[#262626] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="block text-xs font-medium text-[#262626] mb-1.5">
                  <span className="text-[#ff4d4f] mr-1">*</span>权责手册编号
                </label>
                <input
                  type="text"
                  value={manualEditModal.data.manualNo || ''}
                  onChange={(e) =>
                    setManualEditModal({
                      ...manualEditModal,
                      data: { ...manualEditModal.data, manualNo: e.target.value },
                    })
                  }
                  placeholder="如：2026 或 RD-DOA-2026"
                  className="w-full h-8 px-3 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#1890ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#262626] mb-1.5">
                  <span className="text-[#ff4d4f] mr-1">*</span>权责手册名称
                </label>
                <input
                  type="text"
                  value={manualEditModal.data.manualName || ''}
                  onChange={(e) =>
                    setManualEditModal({
                      ...manualEditModal,
                      data: { ...manualEditModal.data, manualName: e.target.value },
                    })
                  }
                  placeholder="如：2026年企业权责与授权管理手册"
                  className="w-full h-8 px-3 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#1890ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#262626] mb-1.5">
                  手册附件 (可上传或填写附件文件名)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualEditModal.data.attachment || ''}
                    onChange={(e) =>
                      setManualEditModal({
                        ...manualEditModal,
                        data: { ...manualEditModal.data, attachment: e.target.value },
                      })
                    }
                    placeholder="如：企业授权分权管理规定V1.0.pdf"
                    className="flex-1 h-8 px-3 border border-[#d9d9d9] rounded focus:outline-none focus:border-[#1890ff]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const dummy = `企业权责授权制度_${new Date().getFullYear()}.pdf`;
                      setManualEditModal({
                        ...manualEditModal,
                        data: { ...manualEditModal.data, attachment: dummy },
                      });
                      showToast('已选取示例附件文件', 'info');
                    }}
                    className="h-8 px-3 rounded border border-[#d9d9d9] hover:border-[#1890ff] text-xs text-[#606266] bg-white flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>选择附件</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#262626]">
                    查阅权限部门配置 <span className="text-[11px] text-[#8c8c8c] font-normal">(从公司组织架构树中选择)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setManualEditModal({
                          ...manualEditModal,
                          data: { ...manualEditModal.data, viewPermissions: [...ALL_DEPTS] },
                        })
                      }
                      className="text-[#1890ff] hover:underline text-[11px] cursor-pointer"
                    >
                      全选全部
                    </button>
                    <span className="text-[#d9d9d9]">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setManualEditModal({
                          ...manualEditModal,
                          data: { ...manualEditModal.data, viewPermissions: [] },
                        })
                      }
                      className="text-[#8c8c8c] hover:underline text-[11px] cursor-pointer"
                    >
                      清空
                    </button>
                  </div>
                </div>

                <DeptSelectField
                  value={manualEditModal.data.viewPermissions || []}
                  onChange={(val, _first, _all, names) => {
                    const deptsList =
                      names && names.length > 0
                        ? names
                        : val
                        ? val.split(/[、,;，；]/).map((s) => s.trim()).filter(Boolean)
                        : [];
                    setManualEditModal({
                      ...manualEditModal,
                      data: { ...manualEditModal.data, viewPermissions: deptsList },
                    });
                  }}
                  modalTitle="配置查阅权限部门 / 事业部"
                  modalDescription="从公司组织架构树中挑选有权查阅本手册的部门或事业部，也可输入特定机构名称"
                  placeholder="点击从组织架构中选择查阅权限部门/事业部..."
                  className="w-full text-xs"
                  showToast={showToast}
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#f0f0f0] bg-[#fafafa] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setManualEditModal({ ...manualEditModal, open: false })}
                className="h-8 px-4 rounded border border-[#d9d9d9] text-[#595959] text-xs cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveManualEdit}
                className="h-8 px-4 rounded bg-[#1890ff] text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Delete Confirm */}
      {manualDeleteConfirm.open && manualDeleteConfirm.manual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-[#ebeef5] w-full max-w-sm p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-[#ff4d4f]">
              <AlertCircle className="w-5 h-5" />
              <h4 className="text-sm font-semibold text-[#262626]">确认删除权责手册</h4>
            </div>
            <p className="text-[#595959] leading-relaxed">
              确定要删除权责手册【
              <strong className="text-[#ff4d4f]">{manualDeleteConfirm.manual.manualName}</strong>
              】吗？删除后此手册的所有内容配置均将移除。
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setManualDeleteConfirm({ open: false, manual: null })}
                className="h-8 px-4 rounded border border-[#d9d9d9] text-[#595959]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDeleteManual}
                className="h-8 px-4 rounded bg-[#ff4d4f] hover:bg-[#ff7875] text-white font-medium cursor-pointer"
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Archive Confirm */}
      {manualArchiveConfirm.open && manualArchiveConfirm.manual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-[#ebeef5] w-full max-w-sm p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-[#faad14]">
              <Archive className="w-5 h-5" />
              <h4 className="text-sm font-semibold text-[#262626]">
                {manualArchiveConfirm.manual.archived ? '确认恢复权责手册' : '确认归档权责手册'}
              </h4>
            </div>
            <p className="text-[#595959] leading-relaxed">
              {manualArchiveConfirm.manual.archived
                ? `确认将手册【${manualArchiveConfirm.manual.manualName}】恢复至权责建设主列表吗？`
                : `归档后，手册【${manualArchiveConfirm.manual.manualName}】将移入“归档手册”页面。确定归档吗？`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setManualArchiveConfirm({ open: false, manual: null })}
                className="h-8 px-4 rounded border border-[#d9d9d9] text-[#595959]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleArchiveManual}
                className="h-8 px-4 rounded bg-[#1890ff] text-white font-medium cursor-pointer"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Scope Modal */}
      {permissionModal.open && permissionModal.manual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-[#ebeef5] w-full max-w-lg p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-2.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#1890ff]" />
                <h4 className="text-sm font-semibold text-[#262626]">
                  查阅权限部门明细 - {permissionModal.manual.manualName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPermissionModal({ open: false, manual: null })}
                className="text-[#8c8c8c] hover:text-[#262626] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-[#8c8c8c] mb-2">
                该权责手册授权以下部门人员在线查阅与执行调用（共 {permissionModal.manual.viewPermissions?.length || 0} 个部门）：
              </p>
              <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-2 border border-[#f0f0f0] rounded bg-[#fafafa]">
                {(permissionModal.manual.viewPermissions || []).map((d) => (
                  <span
                    key={d}
                    className="px-2.5 py-1 rounded bg-white text-[#1890ff] border border-[#91d5ff] font-medium text-xs shadow-2xs"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPermissionModal({ open: false, manual: null })}
                className="h-7 px-4 rounded bg-[#1890ff] text-white"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {previewAttachment.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-[#ebeef5] w-full max-w-md p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-2.5">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-[#1890ff]" />
                <h4 className="text-sm font-semibold text-[#262626]">手册附件预览</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAttachment({ open: false, fileName: '' })}
                className="text-[#8c8c8c] hover:text-[#262626] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 flex flex-col items-center justify-center gap-2 bg-[#fafafa] rounded border border-[#f0f0f0]">
              <FileText className="w-12 h-12 text-[#1890ff]" />
              <span className="font-medium text-[#262626] text-sm">
                {previewAttachment.fileName}
              </span>
              <span className="text-[11px] text-[#8c8c8c]">PDF 制度文件 (1.4 MB) · 校验通过</span>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => showToast(`已模拟下载附件【${previewAttachment.fileName}】`, 'success')}
                className="h-8 px-4 rounded bg-[#1890ff] text-white flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载附件</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewAttachment({ open: false, fileName: '' })}
                className="h-8 px-4 rounded border border-[#d9d9d9] text-[#595959]"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
