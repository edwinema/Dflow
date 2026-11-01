import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { PersonSelectModal } from './PersonSelectModal';
import {
  Search,
  RotateCcw,
  Upload,
  Download,
  Trash2,
  Plus,
  PenLine,
  X,
  Check,
  Building2,
  Users,
  ShieldCheck,
  Briefcase,
  KeyRound,
  FileSpreadsheet,
  Columns,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Folder,
  FolderOpen,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  GitBranch,
  UserCheck,
  UserPlus,
  ArrowRight,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  Hash,
  GripVertical,
  ArrowUp,
  ArrowDown,
  PanelLeftClose,
  PanelLeftOpen,
  Filter,
  Maximize2,
  Minimize2,
  PlusCircle,
  CornerDownRight,
} from 'lucide-react';

export interface ProcessRole {
  id: string;
  roleNo: number;
  roleCode: string;
  roleName: string;
  roleType: string;
  category: string;
  boundPositions: string[];
  assignedUsers: { id: string; name: string; empNo: string; deptName: string }[];
  boundFlows: {
    flowId: string;
    flowNo: string;
    flowName: string;
    stepName: string;
    raci: string;
    kcp?: boolean;
  }[];
  rankRequirement?: string;
  isKcpApprover: boolean;
  sort: number;
  status: '0' | '1'; // 0: 正常, 1: 停用
  remark: string;
  createTime: string;
}

export interface RoleCategoryNode {
  id: string;
  name: string;
  code?: string;
  parentId?: string | null;
  level: number;
  description?: string;
  sort?: number;
  count?: number;
}

interface ProcessRoleLibraryViewProps {
  onNavigate: (path: string) => void;
  onEnterDesigner?: (flowId: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const PRESET_POSITIONS = [
  '系统架构师',
  '高级架构师',
  '产品经理',
  '高级产品专家',
  '首席执行官 / CEO',
  '中心总经理 / 副总裁',
  '质量总监',
  '技术专家',
  '技术专家 / 资深顾问',
  '项目经理',
  '高级研发组长',
  '高级软件工程师',
  '芯片研发专员',
  '结构设计工程师',
  '初级工程师 / 专员',
  '中级工程师 / 资深专员',
  '基层团队主管',
  '部门经理 / 执行总监',
  '内控合规审查官',
  '质量测试员',
  '测试专员',
  '知识运营专家',
];

export interface ColumnConfig {
  key: string;
  label: string;
  defaultWidth: number;
  minWidth: number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  canHide?: boolean;
}

// 移除“建议职级”之后的标准字段列表
export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'roleNo', label: '序号', defaultWidth: 64, minWidth: 50, align: 'center', canHide: true },
  { key: 'roleCode', label: '角色编码', defaultWidth: 140, minWidth: 90, canHide: true },
  { key: 'roleName', label: '角色名称', defaultWidth: 160, minWidth: 100, canHide: false },
  { key: 'roleType', label: '角色类型', defaultWidth: 130, minWidth: 90, canHide: true },
  { key: 'category', label: '归属业务域', defaultWidth: 150, minWidth: 100, canHide: true },
  { key: 'boundPositions', label: '对应组织岗位', defaultWidth: 180, minWidth: 120, canHide: true },
  { key: 'assignedUsers', label: '人员配置', defaultWidth: 150, minWidth: 100, canHide: true },
  { key: 'boundFlows', label: '引用流程', defaultWidth: 120, minWidth: 90, align: 'center', canHide: true },
  { key: 'kcp', label: 'KCP否决权', defaultWidth: 100, minWidth: 80, align: 'center', canHide: true },
  { key: 'status', label: '状态', defaultWidth: 90, minWidth: 70, align: 'center', canHide: true },
  { key: 'createTime', label: '创建时间', defaultWidth: 150, minWidth: 110, canHide: true },
  { key: 'actions', label: '操作', defaultWidth: 180, minWidth: 150, align: 'center', fixed: 'right', canHide: false },
];

export const ProcessRoleLibraryView: React.FC<ProcessRoleLibraryViewProps> = ({
  onNavigate,
  onEnterDesigner,
  showToast,
}) => {
  // Data State
  const [roles, setRoles] = useState<ProcessRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    allTotal: 0,
    rTypeCount: 0,
    aTypeCount: 0,
    cTypeCount: 0,
    iTypeCount: 0,
  });

  // Filter criteria
  const [searchName, setSearchName] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchPosition, setSearchPosition] = useState('');
  const [showSearchFilter, setShowSearchFilter] = useState(true);

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
    code: '',
    type: '',
    category: 'all',
    status: '',
    position: '',
  });

  // Dynamic Hierarchical Categories State (分层级类型库)
  const [categoriesList, setCategoriesList] = useState<RoleCategoryNode[]>([]);
  const [expandedCatIds, setExpandedCatIds] = useState<Set<string>>(
    () => new Set(['cat_01', 'cat_02', 'cat_03', 'cat_04', 'cat_05', 'cat_06'])
  );

  // Category Tree Filter
  const [categoryTreeSearch, setCategoryTreeSearch] = useState('');

  // Category Modal State (新增 / 编辑角色库类型，支持分层级)
  const [categoryModal, setCategoryModal] = useState<{
    visible: boolean;
    isEdit: boolean;
    id?: string;
    parentId: string | null;
    name: string;
    code: string;
    description: string;
  }>({
    visible: false,
    isEdit: false,
    parentId: null,
    name: '',
    code: '',
    description: '',
  });

  const [deleteCatModal, setDeleteCatModal] = useState<{
    visible: boolean;
    cat: RoleCategoryNode | null;
  }>({
    visible: false,
    cat: null,
  });

  // Left Menu Sidebar Width & Collapse State (菜单栏布局优化调整)
  const [leftMenuWidth, setLeftMenuWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('process_role_left_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (val >= 180 && val <= 450) return val;
      }
    } catch {}
    return 260;
  });
  const [leftMenuCollapsed, setLeftMenuCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('process_role_left_collapsed') === 'true';
    } catch {}
    return false;
  });

  const isResizingLeft = useRef(false);

  const handleStartResizeLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingLeft.current = true;
    const startX = e.clientX;
    const startWidth = leftMenuWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingLeft.current) return;
      const deltaX = moveEvent.clientX - startX;
      const nextWidth = Math.max(180, Math.min(480, startWidth + deltaX));
      setLeftMenuWidth(nextWidth);
    };

    const onMouseUp = () => {
      isResizingLeft.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      try {
        localStorage.setItem('process_role_left_width', String(leftMenuWidth));
      } catch {}
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleToggleLeftCollapse = () => {
    setLeftMenuCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('process_role_left_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Table selection & pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpPage, setJumpPage] = useState('1');
  const [tableDensity, setTableDensity] = useState<'standard' | 'compact'>('standard');

  // Org Users & Positions list for assigning members
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allDepts, setAllDepts] = useState<any[]>([]);

  // Column Ordering (字段位置调整) & Widths (字段宽度调整)
  const defaultOrder = useMemo(() => DEFAULT_COLUMNS.map((c) => c.key), []);
  const [colOrder, setColOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('process_role_col_order');
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(
            (k) => k !== 'rankRequirement' && DEFAULT_COLUMNS.some((c) => c.key === k)
          );
          DEFAULT_COLUMNS.forEach((c) => {
            if (!valid.includes(c.key)) valid.push(c.key);
          });
          return valid;
        }
      }
    } catch {}
    return defaultOrder;
  });

  const defaultWidthsMap = useMemo(() => {
    const map: Record<string, number> = {};
    DEFAULT_COLUMNS.forEach((c) => {
      map[c.key] = c.defaultWidth;
    });
    return map;
  }, []);

  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('process_role_col_widths');
      if (saved) {
        const parsed = JSON.parse(saved);
        delete parsed.rankRequirement;
        return { ...defaultWidthsMap, ...parsed };
      }
    } catch {}
    return defaultWidthsMap;
  });

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('process_role_col_visible');
      if (saved) {
        const parsed = JSON.parse(saved);
        delete parsed.rankRequirement;
        const initial: Record<string, boolean> = {};
        DEFAULT_COLUMNS.forEach((c) => {
          initial[c.key] = parsed[c.key] !== undefined ? Boolean(parsed[c.key]) : true;
        });
        return initial;
      }
    } catch {}
    const initial: Record<string, boolean> = {};
    DEFAULT_COLUMNS.forEach((c) => {
      initial[c.key] = true;
    });
    return initial;
  });

  const [showColSettingsModal, setShowColSettingsModal] = useState(false);

  // Save Column settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('process_role_col_order', JSON.stringify(colOrder));
      localStorage.setItem('process_role_col_widths', JSON.stringify(colWidths));
      localStorage.setItem('process_role_col_visible', JSON.stringify(visibleColumns));
    } catch {}
  }, [colOrder, colWidths, visibleColumns]);

  // Resizing Column Headers directly by dragging
  const resizingColKey = useRef<string | null>(null);
  const [isResizingHeader, setIsResizingHeader] = useState(false);

  const handleStartResizeCol = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingColKey.current = key;
    setIsResizingHeader(true);
    const startX = e.clientX;
    const startWidth = colWidths[key] || 120;
    const colDef = DEFAULT_COLUMNS.find((c) => c.key === key);
    const minW = colDef?.minWidth || 60;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingColKey.current) return;
      const deltaX = moveEvent.clientX - startX;
      const nextWidth = Math.max(minW, startWidth + deltaX);
      setColWidths((prev) => ({
        ...prev,
        [key]: nextWidth,
      }));
    };

    const onMouseUp = () => {
      resizingColKey.current = null;
      setIsResizingHeader(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleResetColWidth = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const colDef = DEFAULT_COLUMNS.find((c) => c.key === key);
    if (colDef) {
      setColWidths((prev) => ({
        ...prev,
        [key]: colDef.defaultWidth,
      }));
      showToast(`已重置「${colDef.label}」列宽为 ${colDef.defaultWidth}px`, 'info');
    }
  };

  // Drag-and-drop column headers to reorder field positions
  const draggedColKey = useRef<string | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);

  const handleDragStartHeader = (key: string, e: React.DragEvent) => {
    draggedColKey.current = key;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  };

  const handleDragOverHeader = (key: string, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedColKey.current && draggedColKey.current !== key) {
      setDragOverColKey(key);
    }
  };

  const handleDragLeaveHeader = () => {
    setDragOverColKey(null);
  };

  const handleDropHeader = (targetKey: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColKey(null);
    const sourceKey = draggedColKey.current;
    if (!sourceKey || sourceKey === targetKey) return;

    if (sourceKey === 'actions' || targetKey === 'actions') return;

    setColOrder((prev) => {
      const newOrder = [...prev];
      const sourceIdx = newOrder.indexOf(sourceKey);
      const targetIdx = newOrder.indexOf(targetKey);
      if (sourceIdx >= 0 && targetIdx >= 0) {
        newOrder.splice(sourceIdx, 1);
        newOrder.splice(targetIdx, 0, sourceKey);
      }
      return newOrder;
    });

    const sourceCol = DEFAULT_COLUMNS.find((c) => c.key === sourceKey);
    const targetCol = DEFAULT_COLUMNS.find((c) => c.key === targetKey);
    showToast(`已调整字段位置：${sourceCol?.label || sourceKey} 移至 ${targetCol?.label || targetKey} 前`, 'success');
  };

  const handleMoveColumn = (key: string, direction: 'up' | 'down') => {
    setColOrder((prev) => {
      const idx = prev.indexOf(key);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const newOrder = [...prev];
      const temp = newOrder[idx];
      newOrder[idx] = newOrder[targetIdx];
      newOrder[targetIdx] = temp;
      return newOrder;
    });
  };

  const handleResetEntireLayout = () => {
    setColOrder(defaultOrder);
    setColWidths(defaultWidthsMap);
    const resetVisible: Record<string, boolean> = {};
    DEFAULT_COLUMNS.forEach((c) => {
      resetVisible[c.key] = true;
    });
    setVisibleColumns(resetVisible);
    setLeftMenuWidth(260);
    setLeftMenuCollapsed(false);
    try {
      localStorage.removeItem('process_role_col_order');
      localStorage.removeItem('process_role_col_widths');
      localStorage.removeItem('process_role_col_visible');
      localStorage.removeItem('process_role_left_width');
      localStorage.removeItem('process_role_left_collapsed');
    } catch {}
    showToast('已恢复为系统默认字段位置与宽度布局', 'success');
  };

  const activeColumns = useMemo(() => {
    return colOrder
      .map((key) => DEFAULT_COLUMNS.find((c) => c.key === key))
      .filter((c): c is ColumnConfig => Boolean(c && visibleColumns[c.key]));
  }, [colOrder, visibleColumns]);

  // Modals State
  const [editModal, setEditModal] = useState<{
    visible: boolean;
    isCreate: boolean;
    data: any;
  }>({
    visible: false,
    isCreate: false,
    data: null,
  });

  const [assignUserModal, setAssignUserModal] = useState<{
    visible: boolean;
    role: ProcessRole | null;
    selectedUserIds: string[];
    userFilterDept: string;
    userFilterText: string;
  }>({
    visible: false,
    role: null,
    selectedUserIds: [],
    userFilterDept: 'all',
    userFilterText: '',
  });

  const [boundFlowsModal, setBoundFlowsModal] = useState<{
    visible: boolean;
    role: ProcessRole | null;
  }>({
    visible: false,
    role: null,
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean;
    isBatch: boolean;
    role: ProcessRole | null;
  }>({
    visible: false,
    isBatch: false,
    role: null,
  });

  const [importModal, setImportModal] = useState<{
    visible: boolean;
    previewList: any[];
    overwrite: boolean;
  }>({
    visible: false,
    previewList: [],
    overwrite: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Categories from Backend API
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/build/role-categories');
      const json = await res.json();
      if (json.status === 1 && Array.isArray(json.data)) {
        setCategoriesList(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch role categories', e);
    }
  };

  // Load Roles
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (appliedFilters.name) params.set('roleName', appliedFilters.name);
      if (appliedFilters.code) params.set('roleCode', appliedFilters.code);
      if (appliedFilters.type) params.set('roleType', appliedFilters.type);
      if (appliedFilters.category && appliedFilters.category !== 'all') {
        params.set('category', appliedFilters.category);
      }
      if (appliedFilters.status !== '') params.set('status', appliedFilters.status);
      if (appliedFilters.position) params.set('boundPosition', appliedFilters.position);
      params.set('pageNum', String(pageNum));
      params.set('pageSize', String(pageSize));

      const res = await fetch(`/api/build/roles?${params.toString()}`);
      const json = await res.json();
      if (json.status === 1) {
        setRoles(json.rows || []);
        if (json.stats) {
          setStats(json.stats);
        }
      } else {
        showToast(json.info || '加载角色库数据失败', 'error');
      }
    } catch (e) {
      console.error('Failed to fetch roles', e);
      showToast('获取角色库数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load Org Users for assignment
  const fetchOrgBundle = async () => {
    try {
      const res = await fetch('/api/org/bundle');
      const json = await res.json();
      if (json.status === 1 && json.data) {
        setAllUsers(json.data.users || []);
        setAllDepts(json.data.depts || []);
      }
    } catch (e) {
      console.error('Failed to fetch org bundle', e);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [appliedFilters, pageNum, pageSize]);

  useEffect(() => {
    fetchCategories();
    fetchOrgBundle();
  }, []);

  // Filter Handlers
  const handleSearch = () => {
    setPageNum(1);
    setAppliedFilters({
      name: searchName,
      code: searchCode,
      type: searchType,
      category: searchCategory,
      status: searchStatus,
      position: searchPosition,
    });
  };

  const handleResetSearch = () => {
    setSearchName('');
    setSearchCode('');
    setSearchType('');
    setSearchCategory('all');
    setSearchStatus('');
    setSearchPosition('');
    setPageNum(1);
    setAppliedFilters({
      name: '',
      code: '',
      type: '',
      category: 'all',
      status: '',
      position: '',
    });
  };

  const handleSelectCategoryFromTree = (catName: string) => {
    setSearchCategory(catName);
    setPageNum(1);
    setAppliedFilters((prev) => ({
      ...prev,
      category: catName,
    }));
  };

  // Status Toggle
  const handleToggleStatus = async (role: ProcessRole) => {
    const nextStatus = role.status === '0' ? '1' : '0';
    try {
      const res = await fetch(`/api/build/roles/${role.id}/change-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast(json.info || '状态更新成功', 'success');
        setRoles((prev) =>
          prev.map((r) => (r.id === role.id ? { ...r, status: nextStatus } : r))
        );
      } else {
        showToast(json.info || '状态更新失败', 'error');
      }
    } catch (e) {
      showToast('状态更新失败', 'error');
    }
  };

  // Add / Edit Modal open
  const handleOpenCreateModal = () => {
    const randomSuffix = Math.floor(Math.random() * 899 + 100);
    const defaultCat =
      searchCategory !== 'all'
        ? searchCategory
        : categoriesList[0]?.name || '02 研发与技术创新';

    setEditModal({
      visible: true,
      isCreate: true,
      data: {
        roleName: '',
        roleCode: `PR-ROLE-${randomSuffix}`,
        roleType: '主责角色 (R)',
        category: defaultCat,
        boundPositions: ['系统架构师'],
        isKcpApprover: false,
        sort: roles.length + 1,
        status: '0',
        remark: '',
      },
    });
  };

  const handleOpenEditModal = (role?: ProcessRole) => {
    const target = role || roles.find((r) => r.id === selectedIds[0]);
    if (!target) return;
    setEditModal({
      visible: true,
      isCreate: false,
      data: {
        id: target.id,
        roleName: target.roleName,
        roleCode: target.roleCode,
        roleType: target.roleType,
        category: target.category,
        boundPositions: [...(target.boundPositions || [])],
        isKcpApprover: Boolean(target.isKcpApprover),
        sort: target.sort || 1,
        status: target.status,
        remark: target.remark || '',
      },
    });
  };

  // Save Role
  const handleSaveRole = async () => {
    const data = editModal.data;
    if (!data) return;
    if (!data.roleName.trim()) {
      showToast('请输入角色名称', 'warning');
      return;
    }
    if (!data.roleCode.trim()) {
      showToast('请输入角色编码', 'warning');
      return;
    }

    try {
      if (editModal.isCreate) {
        const res = await fetch('/api/build/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.status === 1) {
          showToast('新增流程角色成功', 'success');
          setEditModal({ visible: false, isCreate: false, data: null });
          fetchRoles();
          fetchCategories();
        } else {
          showToast(json.info || '新增失败', 'error');
        }
      } else {
        const res = await fetch(`/api/build/roles/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.status === 1) {
          showToast('修改流程角色成功', 'success');
          setEditModal({ visible: false, isCreate: false, data: null });
          fetchRoles();
          fetchCategories();
        } else {
          showToast(json.info || '修改失败', 'error');
        }
      }
    } catch (e) {
      showToast('保存流程角色失败', 'error');
    }
  };

  // Delete Roles
  const handleDeleteExecute = async () => {
    try {
      if (deleteConfirm.isBatch) {
        const res = await fetch('/api/build/roles/batch-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds }),
        });
        const json = await res.json();
        if (json.status === 1) {
          showToast(json.info || `成功删除 ${selectedIds.length} 个角色`, 'success');
          setSelectedIds([]);
          setDeleteConfirm({ visible: false, isBatch: false, role: null });
          fetchRoles();
          fetchCategories();
        } else {
          showToast(json.info || '批量删除失败', 'error');
        }
      } else if (deleteConfirm.role) {
        const res = await fetch(`/api/build/roles/${deleteConfirm.role.id}`, {
          method: 'DELETE',
        });
        const json = await res.json();
        if (json.status === 1) {
          showToast('删除角色成功', 'success');
          setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirm.role?.id));
          setDeleteConfirm({ visible: false, isBatch: false, role: null });
          fetchRoles();
          fetchCategories();
        } else {
          showToast(json.info || '删除失败', 'error');
        }
      }
    } catch (e) {
      showToast('删除操作失败', 'error');
    }
  };

  // Personnel Assignment Modal
  const handleOpenAssignUsersModal = (role: ProcessRole) => {
    setAssignUserModal({
      visible: true,
      role,
      selectedUserIds: (role.assignedUsers || []).map((u) => u.id),
      userFilterDept: 'all',
      userFilterText: '',
    });
  };

  const handleSaveAssignUsers = async () => {
    if (!assignUserModal.role) return;
    const chosenUsers = allUsers
      .filter((u) => assignUserModal.selectedUserIds.includes(u.id))
      .map((u) => ({
        id: u.id,
        name: u.nickName || u.userName,
        empNo: u.empNo || 'E0000',
        deptName: u.deptName || '业务部门',
      }));

    try {
      const res = await fetch(
        `/api/build/roles/${assignUserModal.role.id}/assign-users`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedUsers: chosenUsers }),
        }
      );
      const json = await res.json();
      if (json.status === 1) {
        showToast('人员配置更新成功', 'success');
        setRoles((prev) =>
          prev.map((r) =>
            r.id === assignUserModal.role?.id
              ? { ...r, assignedUsers: chosenUsers }
              : r
          )
        );
        setAssignUserModal({
          visible: false,
          role: null,
          selectedUserIds: [],
          userFilterDept: 'all',
          userFilterText: '',
        });
      } else {
        showToast(json.info || '配置人员失败', 'error');
      }
    } catch (e) {
      showToast('配置人员失败', 'error');
    }
  };

  // Selection Checkbox Handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === roles.length && roles.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(roles.map((r) => r.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllSelected = roles.length > 0 && selectedIds.length === roles.length;

  // Export CSV
  const handleExportCSV = () => {
    if (roles.length === 0) {
      showToast('当前暂无可导出的角色数据', 'warning');
      return;
    }

    const headers = [
      '角色编号',
      '角色编码',
      '角色名称',
      '角色类型',
      '归属业务域',
      '对应组织岗位',
      '成员数量',
      '关联成员名单',
      '引用流程数',
      'KCP一票否决权',
      '状态',
      '创建时间',
      '职责描述',
    ];

    const rows = roles.map((r) => [
      r.roleNo,
      r.roleCode,
      `"${r.roleName.replace(/"/g, '""')}"`,
      r.roleType,
      r.category,
      `"${(r.boundPositions || []).join('; ')}"`,
      (r.assignedUsers || []).length,
      `"${(r.assignedUsers || []).map((u) => u.name).join(', ')}"`,
      (r.boundFlows || []).length,
      r.isKcpApprover ? '是' : '否',
      r.status === '0' ? '正常' : '停用',
      r.createTime,
      `"${(r.remark || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `流程角色库导出_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('已成功导出角色库 CSV 文件', 'success');
  };

  // Import CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          showToast('导入文件无有效内容', 'warning');
          return;
        }

        const previewList: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 2 && cols[1]) {
            previewList.push({
              roleCode: cols[1] || `PR-ROLE-${Math.floor(Math.random() * 899 + 100)}`,
              roleName: cols[2] || cols[0],
              roleType: cols[3] || '主责角色 (R)',
              category: cols[4] || '02 研发与技术创新',
              boundPositions: cols[5] ? cols[5].split(';').map((s) => s.trim()) : ['系统工程师'],
              isKcpApprover: cols[9] === '是' || cols[10] === '是',
              status: cols[10] === '停用' || cols[11] === '停用' ? '1' : '0',
              remark: cols[12] || cols[13] || '从模板导入角色',
            });
          }
        }

        if (previewList.length === 0) {
          showToast('未解析出有效的角色行数据', 'warning');
          return;
        }

        setImportModal({
          visible: true,
          previewList,
          overwrite: true,
        });
      } catch (err) {
        showToast('解析文件失败，请确保使用标准 CSV 格式', 'error');
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (importModal.previewList.length === 0) return;
    try {
      const res = await fetch('/api/build/roles/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: importModal.previewList,
          overwrite: importModal.overwrite,
        }),
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast(json.info || `导入成功，写入 ${json.data?.created || 0} 条数据`, 'success');
        setImportModal({ visible: false, previewList: [], overwrite: true });
        fetchRoles();
        fetchCategories();
      } else {
        showToast(json.info || '批量导入失败', 'error');
      }
    } catch (e) {
      showToast('导入失败', 'error');
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      '角色编号',
      '角色编码',
      '角色名称',
      '角色类型',
      '归属业务域',
      '对应组织岗位',
      '成员数量',
      '关联成员名单',
      '引用流程数',
      'KCP一票否决权',
      '状态',
      '创建时间',
      '职责描述',
    ];
    const sampleRow = [
      '1',
      'PR-SAMPLE-01',
      '测试评审组长',
      '评审委员会',
      '05 质量与风险合规',
      '质量测试员;测试专员',
      '0',
      '',
      '0',
      '是',
      '正常',
      '2026-03-20 10:00:00',
      '负责项目各里程碑质量把关与测试用例终审',
    ];
    const csvContent = '\uFEFF' + [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '角色库导入模板.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('已下载角色导入模板', 'info');
  };

  // Category Tree Hierarchy Management (分层级管理与手动添加)
  const topCategories = useMemo(() => {
    return categoriesList.filter((c) => !c.parentId);
  }, [categoriesList]);

  const toggleExpandCategory = (catId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedCatIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  // Open Add Category Modal (支持顶级类型或指定 parentId 分层级新增)
  const handleOpenAddCategory = (parentId: string | null = null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const parentNode = categoriesList.find((c) => c.id === parentId);
    const generatedCode = parentNode
      ? `${parentNode.code || '01'}.${Date.now().toString().slice(-2)}`
      : `${Date.now().toString().slice(-2)}`;

    setCategoryModal({
      visible: true,
      isEdit: false,
      parentId,
      name: '',
      code: generatedCode,
      description: '',
    });
  };

  // Open Edit Category Modal
  const handleOpenEditCategory = (cat: RoleCategoryNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCategoryModal({
      visible: true,
      isEdit: true,
      id: cat.id,
      parentId: cat.parentId || null,
      name: cat.name,
      code: cat.code || '',
      description: cat.description || '',
    });
  };

  // Save Category (Create or Edit)
  const handleSaveCategory = async () => {
    if (!categoryModal.name.trim()) {
      showToast('请输入类型名称', 'warning');
      return;
    }

    try {
      if (categoryModal.isEdit && categoryModal.id) {
        const res = await fetch(`/api/build/role-categories/${categoryModal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: categoryModal.name.trim(),
            code: categoryModal.code.trim(),
            parentId: categoryModal.parentId,
            description: categoryModal.description.trim(),
          }),
        });
        const json = await res.json();
        if (json.status === 1) {
          showToast('修改角色库类型成功', 'success');
          setCategoryModal((prev) => ({ ...prev, visible: false }));
          fetchCategories();
          fetchRoles();
        } else {
          showToast(json.info || '修改失败', 'error');
        }
      } else {
        const res = await fetch('/api/build/role-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: categoryModal.name.trim(),
            code: categoryModal.code.trim(),
            parentId: categoryModal.parentId,
            description: categoryModal.description.trim(),
          }),
        });
        const json = await res.json();
        if (json.status === 1) {
          showToast('成功添加角色库类型', 'success');
          if (categoryModal.parentId) {
            setExpandedCatIds((prev) => new Set([...prev, categoryModal.parentId!]));
          }
          setCategoryModal((prev) => ({ ...prev, visible: false }));
          fetchCategories();
          fetchRoles();
        } else {
          showToast(json.info || '添加失败', 'error');
        }
      }
    } catch {
      showToast('操作角色库类型失败', 'error');
    }
  };

  // Delete Category
  const handleDeleteCategoryExecute = async () => {
    if (!deleteCatModal.cat) return;
    try {
      const res = await fetch(`/api/build/role-categories/${deleteCatModal.cat.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast(json.info || '删除角色库类型成功', 'success');
        setDeleteCatModal({ visible: false, cat: null });
        if (appliedFilters.category === deleteCatModal.cat.name) {
          handleSelectCategoryFromTree('all');
        }
        fetchCategories();
        fetchRoles();
      } else {
        showToast(json.info || '删除失败', 'error');
      }
    } catch {
      showToast('删除失败', 'error');
    }
  };

  // Reset Categories to Presets
  const handleResetCategories = async () => {
    if (!window.confirm('确定要恢复预置的分层级角色类型吗？当前自定义层级将被重置。')) return;
    try {
      const res = await fetch('/api/build/role-categories/reset', { method: 'POST' });
      const json = await res.json();
      if (json.status === 1) {
        showToast('已恢复预置角色类型', 'success');
        fetchCategories();
        fetchRoles();
      }
    } catch {
      showToast('重置失败', 'error');
    }
  };

  // Helper for hierarchical category rendering
  const renderCategoryNode = (cat: RoleCategoryNode) => {
    const children = categoriesList.filter((c) => c.parentId === cat.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCatIds.has(cat.id);
    const isSelected = appliedFilters.category === cat.name;

    // Filter by search query
    if (categoryTreeSearch.trim()) {
      const q = categoryTreeSearch.trim().toLowerCase();
      const matchSelf =
        cat.name.toLowerCase().includes(q) || (cat.code && cat.code.toLowerCase().includes(q));
      const matchChildren = children.some(
        (ch) =>
          ch.name.toLowerCase().includes(q) ||
          (ch.code && ch.code.toLowerCase().includes(q))
      );
      if (!matchSelf && !matchChildren) return null;
    }

    const paddingLeft = cat.level === 1 ? 'pl-2' : cat.level === 2 ? 'pl-6' : 'pl-10';

    return (
      <div key={cat.id} className="space-y-0.5">
        <div
          onClick={() => handleSelectCategoryFromTree(cat.name)}
          className={`w-full min-h-[32px] py-1 px-2 rounded text-left text-xs flex items-center justify-between transition-colors cursor-pointer group ${paddingLeft} ${
            isSelected
              ? 'bg-[#ECF5FF] text-[#2F7BFE] font-medium border-l-3 border-l-[#2F7BFE] border border-[#B3D8FF]'
              : 'text-[#606266] hover:bg-[#F5F7FA] border border-transparent'
          }`}
          title={`${cat.name} (${cat.level}级分类)`}
        >
          <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
            {hasChildren ? (
              <span
                onClick={(e) => toggleExpandCategory(cat.id, e)}
                className="p-0.5 hover:bg-[#DCDFE6]/60 rounded cursor-pointer text-[#909399] shrink-0"
              >
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isExpanded ? 'rotate-90 text-[#2F7BFE]' : ''
                  }`}
                />
              </span>
            ) : (
              <span className="w-3.5 shrink-0 text-center text-[#C0C4CC] text-[10px]">
                {cat.level > 1 ? '•' : ''}
              </span>
            )}

            {isExpanded && hasChildren ? (
              <FolderOpen
                className={`w-3.5 h-3.5 shrink-0 ${
                  isSelected ? 'text-[#2F7BFE]' : 'text-[#909399] group-hover:text-[#2F7BFE]'
                }`}
              />
            ) : (
              <Folder
                className={`w-3.5 h-3.5 shrink-0 ${
                  isSelected ? 'text-[#2F7BFE]' : 'text-[#909399] group-hover:text-[#2F7BFE]'
                }`}
              />
            )}

            <span className="truncate">{cat.name}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            {/* Quick action buttons on hover (分层级添加子类型、编辑、删除) */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
              <button
                type="button"
                onClick={(e) => handleOpenAddCategory(cat.id, e)}
                className="p-1 rounded hover:bg-[#DCDFE6] text-[#2F7BFE]"
                title="分层级添加子类型"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => handleOpenEditCategory(cat, e)}
                className="p-1 rounded hover:bg-[#DCDFE6] text-[#606266] hover:text-[#2F7BFE]"
                title="编辑类型"
              >
                <PenLine className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteCatModal({ visible: true, cat });
                }}
                className="p-1 rounded hover:bg-[#FEF0F0] text-[#909399] hover:text-[#F56C6C]"
                title="删除类型"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono shrink-0 ${
                isSelected
                  ? 'bg-[#2F7BFE] text-white'
                  : 'bg-[#F0F2F5] text-[#909399]'
              }`}
            >
              {cat.count || 0}
            </span>
          </div>
        </div>

        {/* Recursive Child Category Nodes */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {children.map((child) => renderCategoryNode(child))}
          </div>
        )}
      </div>
    );
  };

  const getRoleTypeBadge = (type: string) => {
    if (type.includes('R') || type.includes('主责')) {
      return { bg: 'bg-[#E8F4FF]', text: 'text-[#2F7BFE]', border: 'border-[#B3D8FF]', label: '主责角色 (R)' };
    }
    if (type.includes('A') || type.includes('决策')) {
      return { bg: 'bg-[#FFF7E6]', text: 'text-[#D97706]', border: 'border-[#FFD591]', label: '决策角色 (A)' };
    }
    if (type.includes('C') || type.includes('咨询')) {
      return { bg: 'bg-[#F9F0FF]', text: 'text-[#722ED1]', border: 'border-[#D3ADF7]', label: '咨询会签 (C)' };
    }
    if (type.includes('I') || type.includes('知会')) {
      return { bg: 'bg-[#F6FFED]', text: 'text-[#52C41A]', border: 'border-[#B7EB8F]', label: '知会抄送 (I)' };
    }
    return { bg: 'bg-[#FAFAFA]', text: 'text-[#595959]', border: 'border-[#D9D9D9]', label: type || '标准角色' };
  };

  const handleResetToPresetRoles = async () => {
    if (!window.confirm('确定要恢复为设计稿默认的预置流程角色库吗？当前修改将被重置。')) return;
    try {
      const res = await fetch('/api/build/roles/reset-presets', { method: 'POST' });
      const json = await res.json();
      if (json.status === 1) {
        showToast('已成功重置为设计稿预置角色库', 'success');
        fetchRoles();
        fetchCategories();
      } else {
        showToast(json.info || '重置失败', 'error');
      }
    } catch {
      showToast('重置失败', 'error');
    }
  };

  // Render individual cell content based on column key
  const renderCellContent = (colKey: string, r: ProcessRole, index: number) => {
    const isSelected = selectedIds.includes(r.id);
    const badge = getRoleTypeBadge(r.roleType);
    const userCount = (r.assignedUsers || []).length;
    const flowCount = (r.boundFlows || []).length;

    switch (colKey) {
      case 'roleNo':
        return (
          <span className="font-mono text-[#909399]">
            {r.roleNo || (pageNum - 1) * pageSize + index + 1}
          </span>
        );
      case 'roleCode':
        return (
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#F5F7FA] border border-[#E4E7ED] text-[#606266] font-semibold">
            {r.roleCode}
          </span>
        );
      case 'roleName':
        return (
          <div className="flex items-center gap-1.5">
            <span
              className="font-semibold text-[#303133] hover:text-[#2F7BFE] cursor-pointer"
              onClick={() => handleOpenEditModal(r)}
            >
              {r.roleName}
            </span>
          </div>
        );
      case 'roleType':
        return (
          <span
            className={`text-[11px] px-2 py-0.5 rounded font-medium border ${badge.bg} ${badge.border} ${badge.text}`}
          >
            {badge.label}
          </span>
        );
      case 'category':
        return (
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#FAFAFA] border border-[#E4E7ED] text-[#606266]">
            {r.category}
          </span>
        );
      case 'boundPositions':
        return (
          <div className="flex flex-wrap gap-1">
            {(r.boundPositions || []).map((pos, pIdx) => (
              <span
                key={pIdx}
                className="text-[10px] px-1.5 py-0.2 rounded bg-[#F0F2F5] text-[#606266] border border-[#E4E7ED]"
              >
                {pos}
              </span>
            ))}
          </div>
        );
      case 'assignedUsers':
        return (
          <button
            type="button"
            onClick={() => handleOpenAssignUsersModal(r)}
            className="group flex items-center gap-1.5 text-[#2F7BFE] hover:underline cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="font-medium">
              {userCount > 0
                ? `${r.assignedUsers[0].name}${userCount > 1 ? ` 等 ${userCount} 人` : ''}`
                : '未配置 (点击配置)'}
            </span>
          </button>
        );
      case 'boundFlows':
        return (
          <button
            type="button"
            onClick={() => setBoundFlowsModal({ visible: true, role: r })}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[#FAFAFA] border border-[#E4E7ED] hover:border-[#2F7BFE] hover:text-[#2F7BFE] cursor-pointer transition-colors"
          >
            <GitBranch className="w-3 h-3 text-[#2F7BFE]" />
            <span>{flowCount} 个流程</span>
          </button>
        );
      case 'kcp':
        return r.isKcpApprover ? (
          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-[#FEF0F0] text-[#F56C6C] border border-[#FFC0C0] font-semibold">
            <ShieldAlert className="w-3 h-3" />
            <span>KCP否决</span>
          </span>
        ) : (
          <span className="text-[11px] text-[#C0C4CC]">-</span>
        );
      case 'status':
        return (
          <button
            type="button"
            onClick={() => handleToggleStatus(r)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              r.status === '0' ? 'bg-[#2F7BFE]' : 'bg-[#DCDFE6]'
            }`}
            title={r.status === '0' ? '正常启用 (点击停用)' : '已停用 (点击启用)'}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                r.status === '0' ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        );
      case 'createTime':
        return (
          <span className="text-[#909399] font-mono text-[11px]">
            {r.createTime}
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => handleOpenEditModal(r)}
              className="px-2 py-0.5 text-xs text-[#2F7BFE] hover:bg-[#ECF5FF] rounded cursor-pointer transition-colors"
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() => handleOpenAssignUsersModal(r)}
              className="px-2 py-0.5 text-xs text-[#67C23A] hover:bg-[#F0F9EB] rounded cursor-pointer transition-colors"
            >
              配置成员
            </button>
            <button
              type="button"
              onClick={() =>
                setDeleteConfirm({ visible: true, isBatch: false, role: r })
              }
              className="px-2 py-0.5 text-xs text-[#F56C6C] hover:bg-[#FEF0F0] rounded cursor-pointer transition-colors"
            >
              删除
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-2 select-none">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />

      {/* Top Stats Overview Header */}
      <div className="bg-white rounded border border-[#E4E7ED] p-3 shadow-xs shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#2F7BFE]/10 flex items-center justify-center text-[#2F7BFE] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[#1F2733]">流程角色</h1>
              <span className="text-[11px] px-2 py-0.2 rounded-full bg-[#ECF5FF] text-[#2F7BFE] font-medium border border-[#B3D8FF]">
                共 {stats.allTotal || roles.length} 个角色
              </span>
            </div>
            <p className="text-xs text-[#909399] mt-0.5">
              维护端到端业务流程标准责任主体，支持分层级创建角色库类型与组织岗位映射
            </p>
          </div>
        </div>

        {/* RACI Quick Stats Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded bg-[#FAFAFA] border border-[#E4E7ED] text-center">
            <div className="text-[11px] text-[#2F7BFE]">主责角色 (R)</div>
            <div className="text-xs font-bold text-[#2F7BFE]">{stats.rTypeCount} 个</div>
          </div>
          <div className="px-3 py-1.5 rounded bg-[#FAFAFA] border border-[#E4E7ED] text-center">
            <div className="text-[11px] text-[#D97706]">决策审批 (A)</div>
            <div className="text-xs font-bold text-[#D97706]">{stats.aTypeCount} 个</div>
          </div>
          <div className="px-3 py-1.5 rounded bg-[#FAFAFA] border border-[#E4E7ED] text-center">
            <div className="text-[11px] text-[#722ED1]">咨询会签 (C)</div>
            <div className="text-xs font-bold text-[#722ED1]">{stats.cTypeCount} 个</div>
          </div>
          <button
            type="button"
            onClick={handleResetToPresetRoles}
            className="h-8 px-3 rounded border border-[#E4E7ED] hover:border-[#2F7BFE] hover:text-[#2F7BFE] bg-white text-xs text-[#606266] flex items-center gap-1.5 transition-colors cursor-pointer ml-1"
            title="恢复为设计稿默认的16个标准流程角色"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复预置角色</span>
          </button>
        </div>
      </div>

      {/* Main Content: Left Category Tree Menu + Resizer Splitter + Right Table */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Category Navigation Panel (支持分层级树状显示与手动添加类型) */}
        <div
          style={{ width: leftMenuCollapsed ? '48px' : `${leftMenuWidth}px` }}
          className={`bg-white rounded-l border border-[#E4E7ED] flex flex-col shrink-0 shadow-xs transition-[width] duration-150 relative ${
            leftMenuCollapsed ? 'overflow-hidden items-center' : 'p-3'
          }`}
        >
          {leftMenuCollapsed ? (
            /* Collapsed mini rail */
            <div className="flex flex-col items-center py-3 w-full h-full justify-between">
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleLeftCollapse}
                  className="p-1.5 rounded hover:bg-[#F5F7FA] text-[#2F7BFE] cursor-pointer"
                  title="展开业务领域分类菜单"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
                <div className="w-6 border-b border-[#E4E7ED]" />
                <button
                  type="button"
                  onClick={() => handleSelectCategoryFromTree('all')}
                  className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-colors ${
                    appliedFilters.category === 'all'
                      ? 'bg-[#2F7BFE] text-white shadow-xs'
                      : 'hover:bg-[#F5F7FA] text-[#606266]'
                  }`}
                  title="全部流程角色"
                >
                  <Layers className="w-4 h-4" />
                </button>
                {topCategories.map((cat) => {
                  const isSelected = appliedFilters.category === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategoryFromTree(cat.name)}
                      className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#2F7BFE] text-white shadow-xs'
                          : 'hover:bg-[#F5F7FA] text-[#606266]'
                      }`}
                      title={cat.name}
                    >
                      <Folder className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
              <div className="text-[10px] text-[#909399] writing-mode-vertical">
                业务领域
              </div>
            </div>
          ) : (
            /* Expanded Category Panel (支持手动添加分类、分层级树结构) */
            <>
              <div className="flex items-center justify-between pb-2 border-b border-[#E4E7ED] mb-2 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FolderTree className="w-3.5 h-3.5 text-[#2F7BFE] shrink-0" />
                  <span className="font-semibold text-xs text-[#303133] truncate">
                    业务领域分类
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* 手动添加顶级类型按钮 */}
                  <button
                    type="button"
                    onClick={() => handleOpenAddCategory(null)}
                    className="p-1 text-[#2F7BFE] hover:bg-[#ECF5FF] rounded cursor-pointer transition-colors flex items-center gap-0.5 text-[11px]"
                    title="手动添加顶级角色类型"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">新增</span>
                  </button>

                  <span className="text-[10px] text-[#909399] px-1.5 py-0.2 rounded bg-[#FAFAFA] border border-[#E4E7ED]">
                    {topCategories.length} 领域
                  </span>

                  <button
                    type="button"
                    onClick={handleToggleLeftCollapse}
                    className="p-1 text-[#909399] hover:text-[#2F7BFE] hover:bg-[#F5F7FA] rounded cursor-pointer ml-0.5"
                    title="收起分类菜单栏"
                  >
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Category Tree Search */}
              <div className="relative mb-2 shrink-0">
                <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={categoryTreeSearch}
                  onChange={(e) => setCategoryTreeSearch(e.target.value)}
                  placeholder="搜索分类名称/编码..."
                  className="w-full h-7 pl-8 pr-6 text-xs bg-[#F5F7FA] border border-[#E4E7ED] rounded focus:bg-white focus:border-[#2F7BFE] outline-none"
                />
                {categoryTreeSearch && (
                  <button
                    type="button"
                    onClick={() => setCategoryTreeSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#909399] hover:text-[#303133]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Category Tree List */}
              <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
                {/* 1. Root Node: 全部流程角色 */}
                <button
                  type="button"
                  onClick={() => handleSelectCategoryFromTree('all')}
                  className={`w-full h-8 px-2.5 rounded text-left text-xs flex items-center justify-between transition-colors cursor-pointer group ${
                    appliedFilters.category === 'all'
                      ? 'bg-[#ECF5FF] text-[#2F7BFE] font-medium border-l-3 border-l-[#2F7BFE] border border-[#B3D8FF]'
                      : 'text-[#606266] hover:bg-[#F5F7FA] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <Layers
                      className={`w-3.5 h-3.5 shrink-0 ${
                        appliedFilters.category === 'all'
                          ? 'text-[#2F7BFE]'
                          : 'text-[#909399] group-hover:text-[#2F7BFE]'
                      }`}
                    />
                    <span className="truncate">全部流程角色</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono shrink-0 ${
                      appliedFilters.category === 'all'
                        ? 'bg-[#2F7BFE] text-white'
                        : 'bg-[#F0F2F5] text-[#909399]'
                    }`}
                  >
                    {stats.allTotal || roles.length}
                  </span>
                </button>

                {/* 2. Hierarchical Category Tree Nodes */}
                {topCategories.map((topCat) => renderCategoryNode(topCat))}

                {topCategories.length === 0 && (
                  <div className="py-6 text-center text-[#909399] text-xs">
                    暂无分类，请点击右上角新增
                  </div>
                )}
              </div>

              {/* Helper Bar */}
              <div className="mt-2 pt-2 border-t border-[#E4E7ED] text-[11px] text-[#909399] bg-[#FAFAFA] p-2 rounded shrink-0">
                <div className="flex items-center justify-between text-[#303133] font-medium mb-1">
                  <div className="flex items-center gap-1">
                    <Info className="w-3 h-3 text-[#2F7BFE]" />
                    <span>分层级类型说明</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCategories}
                    className="text-[#2F7BFE] hover:underline text-[10px] cursor-pointer"
                  >
                    恢复预置
                  </button>
                </div>
                <p className="leading-relaxed text-[10.5px]">
                  鼠标悬停任意分类可点击「+」分层级增加子类型；支持多层级折叠展开与统计汇总。
                </p>
              </div>
            </>
          )}
        </div>

        {/* Resizer Splitter between Left Menu and Right Content */}
        {!leftMenuCollapsed && (
          <div
            onMouseDown={handleStartResizeLeft}
            className="w-1.5 hover:w-2 bg-transparent hover:bg-[#2F7BFE]/30 active:bg-[#2F7BFE] cursor-col-resize z-20 shrink-0 transition-colors flex items-center justify-center group"
            title="按住鼠标左键左右拖拽，调整左侧分类菜单宽度"
          >
            <div className="w-0.5 h-8 bg-[#DCDFE6] group-hover:bg-[#2F7BFE] rounded-full" />
          </div>
        )}

        {/* Right Main Table & Filter Panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-r border border-[#E4E7ED] shadow-xs overflow-hidden">
          {/* 1. Filter Query Card */}
          <div className="p-3 border-b border-[#E4E7ED] bg-[#FAFAFA] shrink-0">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E4E7ED]/70">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#2F7BFE]" />
                <span className="text-xs font-semibold text-[#303133]">角色检索与过滤</span>
                {appliedFilters.category !== 'all' && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#ECF5FF] text-[#2F7BFE] border border-[#B3D8FF]">
                    业务域: {appliedFilters.category}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowSearchFilter(!showSearchFilter)}
                className="text-xs text-[#909399] hover:text-[#2F7BFE] flex items-center gap-1 cursor-pointer"
              >
                <span>{showSearchFilter ? '收起筛选' : '展开筛选'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSearchFilter ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showSearchFilter && (
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                <div>
                  <label className="block text-[11px] text-[#606266] mb-1 font-medium">
                    角色名称
                  </label>
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="请输入角色名称"
                    className="w-full h-8 px-2.5 text-xs bg-white border border-[#DCDFE6] rounded focus:border-[#2F7BFE] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#606266] mb-1 font-medium">
                    角色编码
                  </label>
                  <input
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="请输入角色编码"
                    className="w-full h-8 px-2.5 text-xs bg-white border border-[#DCDFE6] rounded focus:border-[#2F7BFE] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#606266] mb-1 font-medium">
                    角色类型
                  </label>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white border border-[#DCDFE6] rounded focus:border-[#2F7BFE] outline-none cursor-pointer"
                  >
                    <option value="">全部类型</option>
                    <option value="主责角色 (R)">主责角色 (R)</option>
                    <option value="决策角色 (A)">决策角色 (A)</option>
                    <option value="咨询会签 (C)">咨询会签 (C)</option>
                    <option value="知会抄送 (I)">知会抄送 (I)</option>
                    <option value="评审委员会">评审委员会</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#606266] mb-1 font-medium">
                    对应岗位
                  </label>
                  <input
                    type="text"
                    value={searchPosition}
                    onChange={(e) => setSearchPosition(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="如: 系统架构师"
                    className="w-full h-8 px-2.5 text-xs bg-white border border-[#DCDFE6] rounded focus:border-[#2F7BFE] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#606266] mb-1 font-medium">
                    状态
                  </label>
                  <select
                    value={searchStatus}
                    onChange={(e) => setSearchStatus(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white border border-[#DCDFE6] rounded focus:border-[#2F7BFE] outline-none cursor-pointer"
                  >
                    <option value="">全部状态</option>
                    <option value="0">正常</option>
                    <option value="1">停用</option>
                  </select>
                </div>

                <div className="flex items-end gap-1.5">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="flex-1 h-8 px-3 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>查询</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="h-8 px-2.5 rounded border border-[#DCDFE6] hover:border-[#C0C4CC] bg-white text-xs text-[#606266] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重置</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Action Toolbar */}
          <div className="px-3 py-2 border-b border-[#E4E7ED] flex items-center justify-between shrink-0 bg-white flex-wrap gap-2">
            {/* Left Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="h-7 px-3 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增角色</span>
              </button>

              <button
                type="button"
                disabled={selectedIds.length !== 1}
                onClick={() => handleOpenEditModal()}
                className={`h-7 px-2.5 rounded border text-xs font-medium flex items-center gap-1 transition-colors ${
                  selectedIds.length === 1
                    ? 'border-[#67C23A] text-[#67C23A] hover:bg-[#F0F9EB] cursor-pointer'
                    : 'border-[#E4E7ED] text-[#C0C4CC] cursor-not-allowed bg-[#FAFAFA]'
                }`}
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>修改</span>
              </button>

              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={() =>
                  setDeleteConfirm({ visible: true, isBatch: true, role: null })
                }
                className={`h-7 px-2.5 rounded border text-xs font-medium flex items-center gap-1 transition-colors ${
                  selectedIds.length > 0
                    ? 'border-[#F56C6C] text-[#F56C6C] hover:bg-[#FEF0F0] cursor-pointer'
                    : 'border-[#E4E7ED] text-[#C0C4CC] cursor-not-allowed bg-[#FAFAFA]'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>删除{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}</span>
              </button>

              <div className="h-4 w-[1px] bg-[#E4E7ED] mx-1" />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 px-2.5 rounded border border-[#E4E7ED] hover:border-[#2F7BFE] hover:text-[#2F7BFE] text-xs text-[#606266] flex items-center gap-1 cursor-pointer transition-colors"
                title="导入 CSV 格式角色列表"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>导入</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="h-7 px-2.5 rounded border border-[#E4E7ED] hover:border-[#E6A23C] hover:text-[#E6A23C] text-xs text-[#606266] flex items-center gap-1 cursor-pointer transition-colors"
                title="导出当前筛选的角色数据"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出</span>
              </button>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#ECF5FF] text-[#2F7BFE] text-[11px] font-medium border border-[#B3D8FF]">
                  <span>已选中 {selectedIds.length} 项</span>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="hover:underline text-[#2F7BFE] cursor-pointer"
                  >
                    取消选择
                  </button>
                </div>
              )}
            </div>

            {/* Right Tools */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTableDensity((d) => (d === 'standard' ? 'compact' : 'standard'))}
                className="h-7 px-2 rounded border border-[#E4E7ED] hover:border-[#2F7BFE] text-[#606266] text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="切换表格行高密度"
              >
                <span>{tableDensity === 'standard' ? '标准行高' : '紧凑行高'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowColSettingsModal(true)}
                className="h-7 px-2.5 rounded border border-[#2F7BFE] bg-[#ECF5FF] text-[#2F7BFE] hover:bg-[#2F7BFE] hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="点击自定义表格列顺序与列宽设置"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>字段与宽度设置</span>
                <span className="w-4 h-4 rounded-full bg-[#2F7BFE] text-white text-[10px] flex items-center justify-center font-mono">
                  {activeColumns.length}
                </span>
              </button>

              <button
                type="button"
                onClick={handleResetEntireLayout}
                className="w-7 h-7 rounded border border-[#E4E7ED] hover:border-[#2F7BFE] hover:text-[#2F7BFE] text-[#606266] flex items-center justify-center cursor-pointer transition-colors"
                title="重置所有字段位置与列宽为默认"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  fetchRoles();
                  fetchCategories();
                }}
                className="w-7 h-7 rounded border border-[#E4E7ED] hover:border-[#2F7BFE] hover:text-[#2F7BFE] text-[#606266] flex items-center justify-center cursor-pointer transition-colors"
                title="刷新数据"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2F7BFE]' : ''}`} />
              </button>
            </div>
          </div>

          {/* 3. Data Table */}
          <div className="flex-1 overflow-auto relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAFAFA] text-[#606266] font-semibold border-b border-[#E4E7ED] sticky top-0 z-10 select-none">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center sticky left-0 bg-[#FAFAFA] z-20 border-r border-[#E4E7ED]/60">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded text-[#2F7BFE] cursor-pointer"
                    />
                  </th>

                  {activeColumns.map((col) => {
                    const width = colWidths[col.key] || col.defaultWidth;
                    const isDragOver = dragOverColKey === col.key;
                    const isFixedRight = col.fixed === 'right';

                    return (
                      <th
                        key={col.key}
                        draggable={!isFixedRight}
                        onDragStart={(e) => handleDragStartHeader(col.key, e)}
                        onDragOver={(e) => handleDragOverHeader(col.key, e)}
                        onDragLeave={handleDragLeaveHeader}
                        onDrop={(e) => handleDropHeader(col.key, e)}
                        style={{
                          width: `${width}px`,
                          minWidth: `${col.minWidth}px`,
                          maxWidth: `${width}px`,
                        }}
                        className={`py-2.5 px-3 relative group transition-colors ${
                          col.align === 'center' ? 'text-center' : 'text-left'
                        } ${
                          isDragOver
                            ? 'bg-[#ECF5FF] border-l-2 border-l-[#2F7BFE]'
                            : 'hover:bg-[#F0F2F5]'
                        } ${
                          isFixedRight
                            ? 'sticky right-0 bg-[#FAFAFA] shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-20'
                            : 'cursor-grab active:cursor-grabbing'
                        }`}
                        title={
                          isFixedRight
                            ? '固定列'
                            : '按住拖动可调整字段显示位置；右侧边缘拖动可调整列宽；双击边缘重置宽度'
                        }
                      >
                        <div className="flex items-center gap-1.5 justify-between">
                          <div className="flex items-center gap-1 truncate">
                            {!isFixedRight && (
                              <GripVertical className="w-3 h-3 text-[#C0C4CC] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            )}
                            <span className="truncate">{col.label}</span>
                          </div>

                          <div
                            onMouseDown={(e) => handleStartResizeCol(col.key, e)}
                            onDoubleClick={(e) => handleResetColWidth(col.key, e)}
                            className="absolute right-0 top-0 bottom-0 w-2 hover:w-2.5 cursor-col-resize z-20 flex items-center justify-center group-hover:bg-[#2F7BFE]/20 active:bg-[#2F7BFE]"
                            title="按住鼠标拖拽调整列宽，双击恢复默认"
                          >
                            <div className="w-[1px] h-3 bg-[#DCDFE6] group-hover:bg-[#2F7BFE]" />
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E4E7ED] text-[#303133]">
                {loading ? (
                  <tr>
                    <td colSpan={activeColumns.length + 1} className="py-12 text-center text-[#909399]">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#2F7BFE] border-t-transparent rounded-full animate-spin" />
                        <span>数据加载中...</span>
                      </div>
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={activeColumns.length + 1} className="py-12 text-center text-[#909399]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldAlert className="w-8 h-8 text-[#C0C4CC]" />
                        <span>未找到匹配的流程角色</span>
                        <button
                          type="button"
                          onClick={handleResetSearch}
                          className="text-[#2F7BFE] hover:underline text-xs mt-1 cursor-pointer"
                        >
                          清除过滤条件
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  roles.map((r, index) => {
                    const isSelected = selectedIds.includes(r.id);
                    const rowPaddingClass = tableDensity === 'compact' ? 'py-1.5' : 'py-2.5';

                    return (
                      <tr
                        key={r.id}
                        className={`transition-colors hover:bg-[#F5F7FA] ${
                          isSelected ? 'bg-[#ECF5FF]/60' : ''
                        }`}
                      >
                        <td className={`${rowPaddingClass} px-3 text-center sticky left-0 bg-inherit z-10 border-r border-[#E4E7ED]/50`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(r.id)}
                            className="rounded text-[#2F7BFE] cursor-pointer"
                          />
                        </td>

                        {activeColumns.map((col) => {
                          const width = colWidths[col.key] || col.defaultWidth;
                          const isFixedRight = col.fixed === 'right';

                          return (
                            <td
                              key={col.key}
                              style={{
                                width: `${width}px`,
                                minWidth: `${col.minWidth}px`,
                                maxWidth: `${width}px`,
                              }}
                              className={`${rowPaddingClass} px-3 truncate ${
                                col.align === 'center' ? 'text-center' : 'text-left'
                              } ${
                                isFixedRight
                                  ? 'sticky right-0 bg-inherit shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] z-10'
                                  : ''
                              }`}
                            >
                              {renderCellContent(col.key, r, index)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 4. Pagination Bar */}
          <div className="px-4 py-2 border-t border-[#E4E7ED] bg-[#FAFAFA] flex items-center justify-between text-xs text-[#606266] shrink-0">
            <div className="flex items-center gap-3">
              <span>共 {roles.length} 条数据</span>
              {selectedIds.length > 0 && (
                <span className="text-[#2F7BFE] font-medium">
                  已选择 {selectedIds.length} 项
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span>每页</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPageNum(1);
                  }}
                  className="h-7 px-1.5 text-xs bg-white border border-[#DCDFE6] rounded outline-none cursor-pointer"
                >
                  <option value={10}>10条/页</option>
                  <option value={20}>20条/页</option>
                  <option value={30}>30条/页</option>
                  <option value={50}>50条/页</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pageNum <= 1}
                  onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                  className={`w-7 h-7 rounded border flex items-center justify-center transition-colors ${
                    pageNum <= 1
                      ? 'border-[#E4E7ED] text-[#C0C4CC] cursor-not-allowed bg-white'
                      : 'border-[#DCDFE6] hover:border-[#2F7BFE] text-[#606266] bg-white cursor-pointer'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-2 font-mono text-[#303133]">
                  {pageNum}
                </span>

                <button
                  type="button"
                  disabled={roles.length < pageSize}
                  onClick={() => setPageNum((p) => p + 1)}
                  className={`w-7 h-7 rounded border flex items-center justify-center transition-colors ${
                    roles.length < pageSize
                      ? 'border-[#E4E7ED] text-[#C0C4CC] cursor-not-allowed bg-white'
                      : 'border-[#DCDFE6] hover:border-[#2F7BFE] text-[#606266] bg-white cursor-pointer'
                  }`}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <span>前往</span>
                <input
                  type="text"
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const p = parseInt(jumpPage, 10);
                      if (p > 0) setPageNum(p);
                    }
                  }}
                  className="w-10 h-7 text-center font-mono text-xs bg-white border border-[#DCDFE6] rounded outline-none"
                />
                <span>页</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 弹窗 A：分层级新增 / 编辑角色库类型 (Role Category Modal) */}
      {/* ================================================================= */}
      {categoryModal.visible && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl border border-[#E4E7ED] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-[#E4E7ED] flex items-center justify-between bg-[#FAFAFA] shrink-0">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-[#2F7BFE]" />
                <h3 className="font-bold text-sm text-[#303133]">
                  {categoryModal.isEdit
                    ? '编辑角色库类型'
                    : categoryModal.parentId
                    ? '分层级添加子类型'
                    : '添加顶级角色类型'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModal((prev) => ({ ...prev, visible: false }))}
                className="text-[#909399] hover:text-[#303133]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              {/* Parent Category Selector */}
              <div>
                <label className="block font-medium text-[#303133] mb-1">
                  所属上级类型
                </label>
                <select
                  value={categoryModal.parentId || ''}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({
                      ...prev,
                      parentId: e.target.value ? e.target.value : null,
                    }))
                  }
                  className="w-full h-8 px-2 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] outline-none bg-white cursor-pointer"
                >
                  <option value="">【无】作为顶级一级分类</option>
                  {categoriesList
                    .filter((c) => c.id !== categoryModal.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.level > 1 ? `${'　'.repeat(cat.level - 1)}└ ` : ''}
                        {cat.name} (第 {cat.level} 级)
                      </option>
                    ))}
                </select>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#2F7BFE]">
                  <CornerDownRight className="w-3 h-3" />
                  <span>
                    新建层级：第{' '}
                    {categoryModal.parentId
                      ? (categoriesList.find((c) => c.id === categoryModal.parentId)?.level || 1) + 1
                      : 1}{' '}
                    级分类类型
                  </span>
                </div>
              </div>

              {/* Category Name */}
              <div>
                <label className="block font-medium text-[#303133] mb-1">
                  类型名称 <span className="text-[#F56C6C]">*</span>
                </label>
                <input
                  type="text"
                  value={categoryModal.name}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="如: 1.1 战略发展与投资决策"
                  className="w-full h-8 px-2.5 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] outline-none"
                />
              </div>

              {/* Category Code */}
              <div>
                <label className="block font-medium text-[#303133] mb-1">
                  类型编码
                </label>
                <input
                  type="text"
                  value={categoryModal.code}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="如: 01.01"
                  className="w-full h-8 px-2.5 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] outline-none font-mono"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-medium text-[#303133] mb-1">
                  类型职能说明
                </label>
                <textarea
                  rows={3}
                  value={categoryModal.description}
                  onChange={(e) =>
                    setCategoryModal((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="简述该分类所辖角色群的权能边界或归属领域..."
                  className="w-full p-2 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] outline-none resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#E4E7ED] bg-[#FAFAFA] flex items-center justify-end gap-2 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setCategoryModal((prev) => ({ ...prev, visible: false }))}
                className="px-4 h-8 rounded border border-[#DCDFE6] hover:bg-white text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveCategory}
                className="px-4 h-8 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white font-medium cursor-pointer shadow-xs"
              >
                保存类型
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 弹窗 B：删除分类类型确认 */}
      {/* ================================================================= */}
      {deleteCatModal.visible && deleteCatModal.cat && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-lg shadow-xl border border-[#E4E7ED] overflow-hidden">
            <div className="p-5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FEF0F0] flex items-center justify-center text-[#F56C6C] shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 text-xs">
                <h3 className="font-bold text-sm text-[#303133]">
                  确认删除类型「{deleteCatModal.cat.name}」？
                </h3>
                <p className="text-[#909399] mt-1.5 leading-relaxed">
                  删除后，其下辖的所有子层级类型也将同步删除，原关联角色的业务域将被重置。
                </p>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#E4E7ED] bg-[#FAFAFA] flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteCatModal({ visible: false, cat: null })}
                className="px-4 h-8 rounded border border-[#DCDFE6] hover:bg-white text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDeleteCategoryExecute}
                className="px-4 h-8 rounded bg-[#F56C6C] hover:bg-[#E64242] text-white font-medium cursor-pointer shadow-xs"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 字段位置与列宽定制配置弹窗 */}
      {/* ================================================================= */}
      {showColSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-lg shadow-2xl border border-[#E4E7ED] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-[#E4E7ED] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#2F7BFE]" />
                <h3 className="font-bold text-sm text-[#303133]">
                  表格字段位置与宽度调整
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowColSettingsModal(false)}
                className="text-[#909399] hover:text-[#303133] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <div className="p-2.5 rounded bg-[#ECF5FF] border border-[#B3D8FF] text-xs text-[#2F7BFE] flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  在此可上移/下移字段位置、设置指定列宽度(px)或切换列显隐。修改会实时生效并保存在本地。
                </span>
              </div>

              <div className="border border-[#E4E7ED] rounded overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F5F7FA] text-[#606266] font-semibold border-b border-[#E4E7ED]">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center">显隐</th>
                      <th className="py-2 px-3">字段名称</th>
                      <th className="py-2 px-3 w-32">字段宽度 (px)</th>
                      <th className="py-2 px-3 w-28 text-center">显示位置调整</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7ED]">
                    {colOrder.map((key, idx) => {
                      const col = DEFAULT_COLUMNS.find((c) => c.key === key);
                      if (!col) return null;
                      const isVisible = visibleColumns[key] ?? true;
                      const width = colWidths[key] || col.defaultWidth;
                      const isFirst = idx === 0;
                      const isLast = idx === colOrder.length - 1;

                      return (
                        <tr key={key} className="hover:bg-[#F5F7FA] transition-colors">
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isVisible}
                              disabled={col.canHide === false}
                              onChange={(e) =>
                                setVisibleColumns((prev) => ({
                                  ...prev,
                                  [key]: e.target.checked,
                                }))
                              }
                              className="rounded text-[#2F7BFE] cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-3 font-medium text-[#303133]">
                            <div className="flex items-center gap-1.5">
                              <span>{col.label}</span>
                              {col.fixed === 'right' && (
                                <span className="text-[10px] px-1 py-0.2 rounded bg-[#F0F2F5] text-[#909399]">
                                  固定右侧
                                </span>
                              )}
                              {col.canHide === false && (
                                <span className="text-[10px] px-1 py-0.2 rounded bg-[#FFF7E6] text-[#D97706]">
                                  必显
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={col.minWidth}
                                max={500}
                                step={10}
                                value={width}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val) && val >= col.minWidth) {
                                    setColWidths((prev) => ({
                                      ...prev,
                                      [key]: val,
                                    }));
                                  }
                                }}
                                className="w-18 h-7 px-2 border border-[#DCDFE6] rounded text-xs outline-none focus:border-[#2F7BFE]"
                              />
                              <span className="text-[#909399]">px</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => handleMoveColumn(key, 'up')}
                                className={`p-1 rounded border transition-colors ${
                                  isFirst
                                    ? 'border-[#E4E7ED] text-[#C0C4CC] cursor-not-allowed'
                                    : 'border-[#DCDFE6] hover:border-[#2F7BFE] hover:text-[#2F7BFE] text-[#606266] cursor-pointer'
                                }`}
                                title="上移字段位置"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => handleMoveColumn(key, 'down')}
                                className={`p-1 rounded border transition-colors ${
                                  isLast
                                    ? 'border-[#E4E7ED] text-[#C0C4CC] cursor-not-allowed'
                                    : 'border-[#DCDFE6] hover:border-[#2F7BFE] hover:text-[#2F7BFE] text-[#606266] cursor-pointer'
                                }`}
                                title="下移字段位置"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#E4E7ED] bg-[#FAFAFA] flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetEntireLayout}
                className="px-3 h-8 rounded border border-[#DCDFE6] hover:border-[#F56C6C] hover:text-[#F56C6C] bg-white text-xs text-[#606266] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>恢复默认排序与宽度</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowColSettingsModal(false);
                  showToast('已保存字段布局与宽度设置', 'success');
                }}
                className="px-5 h-8 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 1. Add / Edit Role Modal */}
      {/* ================================================================= */}
      {editModal.visible && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl border border-[#E4E7ED] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-[#E4E7ED] flex items-center justify-between bg-[#FAFAFA] shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2F7BFE]" />
                <h3 className="font-bold text-sm text-[#303133]">
                  {editModal.isCreate ? '新增流程角色' : '修改流程角色信息'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditModal({ visible: false, isCreate: false, data: null })
                }
                className="text-[#909399] hover:text-[#303133]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#303133] mb-1">
                  角色名称 <span className="text-[#F56C6C]">*</span>
                </label>
                <input
                  type="text"
                  value={editModal.data?.roleName || ''}
                  onChange={(e) =>
                    setEditModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, roleName: e.target.value },
                    }))
                  }
                  placeholder="如: 系统架构师 (System Architect)"
                  className="w-full h-8 px-2.5 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#303133] mb-1">
                    角色编码 <span className="text-[#F56C6C]">*</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editModal.data?.roleCode || ''}
                      onChange={(e) =>
                        setEditModal((prev) => ({
                          ...prev,
                          data: { ...prev.data, roleCode: e.target.value },
                        }))
                      }
                      placeholder="PR-ROLE-001"
                      className="w-full h-8 px-2.5 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] outline-none font-mono"
                    />
                    {editModal.isCreate && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditModal((prev) => ({
                            ...prev,
                            data: {
                              ...prev.data,
                              roleCode: `PR-ROLE-${Math.floor(
                                Math.random() * 899 + 100
                              )}`,
                            },
                          }))
                        }
                        className="px-2 h-8 rounded border border-[#DCDFE6] hover:border-[#2F7BFE] text-[#606266] text-[11px] shrink-0"
                        title="随机生成编码"
                      >
                        生成
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[#303133] mb-1">
                    角色权能类型 (RACI) <span className="text-[#F56C6C]">*</span>
                  </label>
                  <select
                    value={editModal.data?.roleType || '主责角色 (R)'}
                    onChange={(e) =>
                      setEditModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, roleType: e.target.value },
                      }))
                    }
                    className="w-full h-8 px-2 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] outline-none cursor-pointer"
                  >
                    <option value="主责角色 (R)">主责角色 (R - Responsible)</option>
                    <option value="决策角色 (A)">决策角色 (A - Accountable)</option>
                    <option value="咨询会签 (C)">咨询会签 (C - Consulted)</option>
                    <option value="知会抄送 (I)">知会抄送 (I - Informed)</option>
                    <option value="评审委员会">评审委员会 (Review Committee)</option>
                  </select>
                </div>
              </div>

              {/* Category (分层级展现) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-[#303133]">
                    归属业务域 / 分层级类型 <span className="text-[#F56C6C]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleOpenAddCategory(null)}
                    className="text-[#2F7BFE] hover:underline text-[11px] flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>添加新类型</span>
                  </button>
                </div>
                <select
                  value={editModal.data?.category || ''}
                  onChange={(e) =>
                    setEditModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, category: e.target.value },
                    }))
                  }
                  className="w-full h-8 px-2 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] outline-none cursor-pointer"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.level > 1 ? `${'　'.repeat(cat.level - 1)}└ ` : ''}
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bound Organization Positions */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-[#303133]">
                    对应组织岗位 (可多选映射)
                  </label>
                  <span className="text-[11px] text-[#909399]">
                    已选 {(editModal.data?.boundPositions || []).length} 个岗位
                  </span>
                </div>
                <div className="p-2 border border-[#DCDFE6] rounded bg-[#FAFAFA] flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {PRESET_POSITIONS.map((pos) => {
                    const isChecked = (editModal.data?.boundPositions || []).includes(pos);
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => {
                          const cur = editModal.data?.boundPositions || [];
                          const next = isChecked
                            ? cur.filter((p: string) => p !== pos)
                            : [...cur, pos];
                          setEditModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, boundPositions: next },
                          }));
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-[#2F7BFE] text-white border-[#2F7BFE]'
                            : 'bg-white text-[#606266] border-[#DCDFE6] hover:border-[#2F7BFE]'
                        }`}
                      >
                        {pos}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort Order & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#303133] mb-1">
                    排序号
                  </label>
                  <input
                    type="number"
                    value={editModal.data?.sort || 1}
                    onChange={(e) =>
                      setEditModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, sort: Number(e.target.value) },
                      }))
                    }
                    className="w-full h-8 px-2.5 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#303133] mb-1">
                    状态
                  </label>
                  <div className="flex items-center gap-4 h-8">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="roleStatus"
                        checked={editModal.data?.status === '0'}
                        onChange={() =>
                          setEditModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, status: '0' },
                          }))
                        }
                        className="text-[#2F7BFE]"
                      />
                      <span>正常启用</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="roleStatus"
                        checked={editModal.data?.status === '1'}
                        onChange={() =>
                          setEditModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, status: '1' },
                          }))
                        }
                        className="text-[#2F7BFE]"
                      />
                      <span>停用</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* KCP Veto Checkbox */}
              <div className="p-2.5 rounded bg-[#FFF7E6] border border-[#FFD591] flex items-start gap-2">
                <input
                  type="checkbox"
                  id="kcpVeto"
                  checked={Boolean(editModal.data?.isKcpApprover)}
                  onChange={(e) =>
                    setEditModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, isKcpApprover: e.target.checked },
                    }))
                  }
                  className="rounded text-[#D97706] mt-0.5"
                />
                <label htmlFor="kcpVeto" className="text-xs text-[#303133] cursor-pointer">
                  <span className="font-semibold text-[#D97706]">
                    关键控制点 (KCP) 一票否决权
                  </span>
                  <p className="text-[11px] text-[#909399] mt-0.5">
                    勾选后该角色在关键质量把关卡点具有排他否决权限，合规未达成禁止跳过
                  </p>
                </label>
              </div>

              {/* Remark */}
              <div>
                <label className="block font-medium text-[#303133] mb-1">
                  职责描述与权能细则
                </label>
                <textarea
                  rows={3}
                  value={editModal.data?.remark || ''}
                  onChange={(e) =>
                    setEditModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, remark: e.target.value },
                    }))
                  }
                  placeholder="详细描述该流程角色的职责定位、输入输出规范及授权边界..."
                  className="w-full p-2 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] outline-none resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#E4E7ED] bg-[#FAFAFA] flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setEditModal({ visible: false, isCreate: false, data: null })
                }
                className="px-4 h-8 rounded border border-[#DCDFE6] hover:bg-white text-xs text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                className="px-4 h-8 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                保存角色
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. Assign Users Modal */}
      {/* ================================================================= */}
      {assignUserModal.visible && assignUserModal.role && (
        <PersonSelectModal
          open={assignUserModal.visible}
          title={`人员配置 · ${assignUserModal.role.roleName}`}
          description={`为【${assignUserModal.role.roleName}】配置担任人员，支持手工输入或从部门架构树中选择 (支持多选)`}
          multiSelect={true}
          initialSelected={assignUserModal.selectedUserIds}
          onClose={() =>
            setAssignUserModal({
              visible: false,
              role: null,
              selectedUserIds: [],
              userFilterDept: 'all',
              userFilterText: '',
            })
          }
          onConfirm={async (selectedPersons) => {
            if (!assignUserModal.role) return;
            const chosenUsers = selectedPersons.map((u) => ({
              id: u.id,
              name: u.userName,
              empNo: u.empNo || 'E0000',
              deptName: u.deptName || '业务部门',
            }));

            try {
              const res = await fetch(
                `/api/build/roles/${assignUserModal.role.id}/assign-users`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ assignedUsers: chosenUsers }),
                }
              );
              const json = await res.json();
              if (json.status === 1) {
                showToast('人员配置更新成功', 'success');
                setRoles((prev) =>
                  prev.map((r) =>
                    r.id === assignUserModal.role?.id
                      ? { ...r, assignedUsers: chosenUsers }
                      : r
                  )
                );
                setAssignUserModal({
                  visible: false,
                  role: null,
                  selectedUserIds: [],
                  userFilterDept: 'all',
                  userFilterText: '',
                });
              } else {
                showToast(json.info || '配置人员失败', 'error');
              }
            } catch (e) {
              showToast('配置人员失败', 'error');
            }
          }}
          showToast={showToast}
        />
      )}

      {/* ================================================================= */}
      {/* 3. Bound Flows Modal */}
      {/* ================================================================= */}
      {boundFlowsModal.visible && boundFlowsModal.role && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl border border-[#E4E7ED] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-[#E4E7ED] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#303133]">
                <GitBranch className="w-4 h-4 text-[#2F7BFE]" />
                <span>关联流程与节点 · {boundFlowsModal.role.roleName}</span>
              </div>
              <button
                type="button"
                onClick={() => setBoundFlowsModal({ visible: false, role: null })}
                className="text-[#909399] hover:text-[#303133]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              {(boundFlowsModal.role.boundFlows || []).length === 0 ? (
                <div className="py-12 text-center text-[#909399]">
                  <p>该角色当前尚未在任何流程画板中绑定任务节点</p>
                  <p className="text-[11px] mt-1 text-[#C0C4CC]">
                    可在「流程建设 &gt; 流程设计」画板中将该角色拖入泳道或节点属性中
                  </p>
                </div>
              ) : (
                <div className="border border-[#E4E7ED] rounded overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#F5F7FA] text-[#606266] font-semibold border-b border-[#E4E7ED]">
                      <tr>
                        <th className="p-2.5">流程编码</th>
                        <th className="p-2.5">流程名称</th>
                        <th className="p-2.5">对应节点</th>
                        <th className="p-2.5 text-center">RACI职责</th>
                        <th className="p-2.5 text-center">关键控制点</th>
                        <th className="p-2.5 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E7ED]">
                      {boundFlowsModal.role.boundFlows.map((bf, idx) => (
                        <tr key={idx} className="hover:bg-[#F5F7FA]">
                          <td className="p-2.5 font-mono text-[#606266]">{bf.flowNo}</td>
                          <td className="p-2.5 font-semibold text-[#303133]">{bf.flowName}</td>
                          <td className="p-2.5 text-[#606266]">{bf.stepName}</td>
                          <td className="p-2.5 text-center">
                            <span className="font-bold text-[#2F7BFE] px-2 py-0.5 rounded bg-[#ECF5FF]">
                              {bf.raci}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            {bf.kcp ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FEF0F0] text-[#F56C6C] border border-[#FFC0C0]">
                                KCP
                              </span>
                            ) : (
                              <span className="text-[#C0C4CC]">-</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setBoundFlowsModal({ visible: false, role: null });
                                onEnterDesigner?.(bf.flowId);
                              }}
                              className="text-[#2F7BFE] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>画板</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[#E4E7ED] bg-[#FAFAFA] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setBoundFlowsModal({ visible: false, role: null })}
                className="px-4 h-8 rounded bg-[#2F7BFE] text-white text-xs font-medium cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 4. Delete Role Confirm Modal */}
      {/* ================================================================= */}
      {deleteConfirm.visible && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl border border-[#E4E7ED] overflow-hidden">
            <div className="p-5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FEF0F0] flex items-center justify-center text-[#F56C6C] shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-[#303133]">
                  {deleteConfirm.isBatch
                    ? `确认批量删除选中的 ${selectedIds.length} 个角色？`
                    : `确认删除流程角色「${deleteConfirm.role?.roleName}」？`}
                </h3>
                <p className="text-xs text-[#909399] mt-1.5 leading-relaxed">
                  删除后无法撤销。若该角色已被流程图关联或分配成员，请确保后续交接合规。
                </p>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#E4E7ED] bg-[#FAFAFA] flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  setDeleteConfirm({ visible: false, isBatch: false, role: null })
                }
                className="px-4 h-8 rounded border border-[#DCDFE6] hover:bg-white text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDeleteExecute}
                className="px-4 h-8 rounded bg-[#F56C6C] hover:bg-[#E64242] text-white font-medium cursor-pointer shadow-xs"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 5. Import Modal */}
      {/* ================================================================= */}
      {importModal.visible && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl border border-[#E4E7ED] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-[#E4E7ED] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex items-center gap-2 font-bold text-sm text-[#303133]">
                <FileSpreadsheet className="w-4 h-4 text-[#2F7BFE]" />
                <span>批量导入角色预览</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setImportModal({ visible: false, previewList: [], overwrite: true })
                }
                className="text-[#909399] hover:text-[#303133]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#606266]">
                  已成功解析待导入的角色数据 ({importModal.previewList.length} 条)
                </span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-[#2F7BFE] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载标准导入模板</span>
                </button>
              </div>

              <div className="border border-[#E4E7ED] rounded overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#F5F7FA] text-[#606266] font-semibold border-b border-[#E4E7ED]">
                    <tr>
                      <th className="p-2">角色编码</th>
                      <th className="p-2">角色名称</th>
                      <th className="p-2">角色类型</th>
                      <th className="p-2">业务领域</th>
                      <th className="p-2 text-center">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7ED]">
                    {importModal.previewList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#F5F7FA]">
                        <td className="p-2 font-mono text-[#606266]">{item.roleCode}</td>
                        <td className="p-2 font-medium text-[#303133]">{item.roleName}</td>
                        <td className="p-2">{item.roleType}</td>
                        <td className="p-2">{item.category}</td>
                        <td className="p-2 text-center">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#E8F4FF] text-[#2F7BFE]">
                            {item.status === '0' ? '正常' : '停用'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-2.5 rounded bg-[#FAFAFA] border border-[#E4E7ED] flex items-center gap-2">
                <input
                  type="checkbox"
                  id="overwriteImport"
                  checked={importModal.overwrite}
                  onChange={(e) =>
                    setImportModal((prev) => ({
                      ...prev,
                      overwrite: e.target.checked,
                    }))
                  }
                  className="rounded text-[#2F7BFE]"
                />
                <label
                  htmlFor="overwriteImport"
                  className="text-xs text-[#303133] cursor-pointer"
                >
                  存在同名或同编码角色时，覆盖已有配置
                </label>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#E4E7ED] bg-[#FAFAFA] flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  setImportModal({ visible: false, previewList: [], overwrite: true })
                }
                className="px-4 h-8 rounded border border-[#DCDFE6] hover:bg-white text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-4 h-8 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white font-medium cursor-pointer shadow-xs"
              >
                确认导入 ({importModal.previewList.length} 条)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
