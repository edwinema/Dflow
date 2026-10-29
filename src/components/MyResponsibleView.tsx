import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  SlidersHorizontal,
  MoveHorizontal,
  GripVertical,
  ArrowUp,
  ArrowDown,
  RotateCcw as ResetIcon,
  Eye,
  Download,
  FileSpreadsheet,
  FileCode,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Pin,
  PinOff,
  Maximize2,
  Minimize2,
  Check,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

export interface FlowItem {
  id: string;
  parentId?: string;
  archName: string;
  label: string;
  flowNo: string;
  ownerName: string;
  flowLevel?: string;
  purpose?: string;
  drivingRules?: string;
  versionNo: string;
  publishUserName: string;
  publishTime: string;
  status?: string;
  category?: 'responsible' | 'partake' | string;
  roleName?: string;
  xml?: string;
}

export interface ColumnConfig {
  key: string;
  title: string;
  width: number;
  minWidth: number;
  maxWidth: number;
  visible: boolean;
  fixed?: 'left' | 'right' | undefined;
  align?: 'left' | 'center' | 'right';
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'flowNo', title: '流程编码', width: 140, minWidth: 100, maxWidth: 300, visible: true, fixed: 'left', align: 'left' },
  { key: 'label', title: '流程名称', width: 280, minWidth: 160, maxWidth: 600, visible: true, align: 'left' },
  { key: 'archName', title: '所属流程架构', width: 260, minWidth: 160, maxWidth: 500, visible: true, align: 'left' },
  { key: 'versionNo', title: '当前版本', width: 110, minWidth: 80, maxWidth: 180, visible: true, align: 'center' },
  { key: 'ownerName', title: '负责人', width: 160, minWidth: 120, maxWidth: 260, visible: true, align: 'left' },
  { key: 'publishTime', title: '发布时间', width: 180, minWidth: 150, maxWidth: 260, visible: true, align: 'left' },
  { key: 'publishUserName', title: '发布人', width: 160, minWidth: 120, maxWidth: 260, visible: true, align: 'left' },
  { key: 'actions', title: '操作', width: 130, minWidth: 110, maxWidth: 200, visible: true, fixed: 'right', align: 'center' },
];

const STORAGE_KEY_PREFIX = 'dflow_my_responsible_table_config_v2';

/**
 * 核心取数判定：基于当前登录账号，比对在「流程设计 -> 流程资料」中定义的责任人
 * 只要流程资料中的责任人被定义为张三，当张三登录系统后，便被精确识别并纳入统计
 */
export function matchFlowResponsibleUser(flowOwnerName: string | undefined, user: any): boolean {
  if (!flowOwnerName || !user) return false;
  const owner = flowOwnerName.trim().toLowerCase();

  const candidates: string[] = [];
  if (user.userName) candidates.push(user.userName.trim().toLowerCase());
  if (user.nickName) candidates.push(user.nickName.trim().toLowerCase());
  if (user.userId) candidates.push(user.userId.trim().toLowerCase());
  if (user.empNo) candidates.push(user.empNo.trim().toLowerCase());

  for (const cand of candidates) {
    if (!cand) continue;
    // 完全一致：例如 "张三" === "张三"
    if (owner === cand) return true;
    // 包含关系：例如流程资料中写了 "张三(Emp001)" 或 "张三主管"，用户为 "张三"
    if (owner.includes(cand)) return true;
    // 反向包含：例如用户显示为 "张三(经理)"，流程资料中写了 "张三"
    if (cand.includes(owner)) return true;
  }
  return false;
}

interface MyResponsibleViewProps {
  subPath?: string;
  currentUser?: any;
  onNavigate?: (path: string, flowId?: string) => void;
  onEnterDesigner?: (flowId: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export function MyResponsibleView({
  subPath = '/property/verify',
  currentUser,
  onNavigate,
  onEnterDesigner,
  showToast,
}: MyResponsibleViewProps) {
  const isPartake = subPath.includes('partake');
  const pageTitle = isPartake ? '我的参与' : '我的负责';
  const currentUserName = currentUser?.userName || currentUser?.nickName || '流程管理员';

  // Search filter states
  const [archNameQuery, setArchNameQuery] = useState('');
  const [labelQuery, setLabelQuery] = useState('');
  const [flowNoQuery, setFlowNoQuery] = useState('');
  const [startDateQuery, setStartDateQuery] = useState('');
  const [endDateQuery, setEndDateQuery] = useState('');
  const [ownerQuery, setOwnerQuery] = useState('');
  const [roleQuery, setRoleQuery] = useState('');

  // Flows data
  const [rawFlows, setRawFlows] = useState<FlowItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 取数模式：'my_only' (默认：严格基于当前账号在流程资料中被定义的责任人取数并统计) vs 'all' (查看全量)
  const [viewScope, setViewScope] = useState<'my_only' | 'all'>('my_only');

  // Column customization state
  const storageKey = `${STORAGE_KEY_PREFIX}_${isPartake ? 'partake' : 'verify'}`;
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = DEFAULT_COLUMNS.map((def) => {
            const found = parsed.find((p: any) => p.key === def.key);
            return found ? { ...def, ...found } : def;
          });
          const ordered: ColumnConfig[] = [];
          parsed.forEach((p: any) => {
            const found = merged.find((m) => m.key === p.key);
            if (found && !ordered.some((o) => o.key === found.key)) {
              ordered.push(found);
            }
          });
          merged.forEach((m) => {
            if (!ordered.some((o) => o.key === m.key)) ordered.push(m);
          });
          return ordered;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_COLUMNS;
  });

  // Persist column changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(columns));
    } catch {
      // ignore
    }
  }, [columns, storageKey]);

  // Modal for Column Customization & Dimension Definition
  const [columnConfigModalOpen, setColumnConfigModalOpen] = useState(false);

  // Resizing state
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [resizingColKey, setResizingColKey] = useState<string | null>(null);
  const [resizingGuideX, setResizingGuideX] = useState<number | null>(null);

  // Column drag and drop reordering state
  const [draggingColKey, setDraggingColKey] = useState<string | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);

  // Detail / Preview Modal
  const [previewFlow, setPreviewFlow] = useState<FlowItem | null>(null);
  const [previewTab, setPreviewTab] = useState<'info' | 'diagram' | 'nodes'>('info');

  // Export Modal
  const [exportFlow, setExportFlow] = useState<FlowItem | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpPageInput, setJumpPageInput] = useState('1');

  // Fetch flows from API
  const fetchFlows = () => {
    setLoading(true);
    fetch('/api/flow/fullSimpleModels')
      .then((r) => r.json())
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setRawFlows(res.data);
        }
      })
      .catch(() => {
        // Fallback default enterprise dataset
        setRawFlows([
          {
            id: 'flow_zs_001',
            parentId: 'arch_req_1',
            archName: '测试集团有限公司/研发中心/产品工程',
            label: '6.2.1.3 产品架构规格评审流程',
            flowNo: 'RD-REQ-008',
            ownerName: '张三',
            flowLevel: 'L3',
            purpose: '明确产品软硬件架构边界，管控技术规格变更风险',
            drivingRules: '企业技术研发与规格定义管理规范',
            versionNo: 'V2',
            publishUserName: '流程管理员(Emp001)',
            publishTime: '2026-02-18 10:15:30',
            status: 'published',
            category: 'responsible',
            roleName: '架构规划师',
          },
          {
            id: 'flow_cr_009',
            parentId: 'arch_req_1',
            archName: '测试集团有限公司/研发中心/需求管理',
            label: '6.3.5.1 需求变更申请',
            flowNo: 'CR-009',
            ownerName: '流程管理员(Emp001)',
            versionNo: 'V3',
            publishUserName: '知识管理员(Emp002)',
            publishTime: '2025-09-28 14:13:34',
            status: 'published',
            category: 'responsible',
            roleName: '需求分析师',
          },
          {
            id: 'flow_leads_002',
            parentId: 'arch_ltc_1',
            archName: '测试集团有限公司/市场营销部/线索管理',
            label: '3.1.1.1 线索管理流程',
            flowNo: 'leads-crm-002',
            ownerName: '流程管理员(Emp001)',
            versionNo: 'V3',
            publishUserName: '知识管理员(Emp002)',
            publishTime: '2026-03-17 15:17:22',
            status: 'published',
            category: 'responsible',
            roleName: '线索专员',
          },
        ]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  // 统计当前登录账号在流程资料中被定义为责任人的流程数
  const myResponsibleFlowsCount = useMemo(() => {
    return rawFlows.filter((f) => matchFlowResponsibleUser(f.ownerName, currentUser)).length;
  }, [rawFlows, currentUser]);

  // Filter flows
  const filteredFlows = useMemo(() => {
    return rawFlows.filter((flow) => {
      // 1. 取数逻辑分支
      if (!isPartake) {
        // 我的负责：基于所登录的账号，被定义在流程设计菜单下的流程资料下的责任人
        if (viewScope === 'my_only') {
          const isMine = matchFlowResponsibleUser(flow.ownerName, currentUser);
          if (!isMine) return false;
        }
      } else {
        // 我的参与：取数逻辑和我的负责不同，遵循用户指示保持独立
        if (flow.category && flow.category !== 'partake') {
          // 保留参与分类
        }
      }

      // 2. 搜索条件过滤
      if (archNameQuery.trim()) {
        const q = archNameQuery.trim().toLowerCase();
        if (!flow.archName?.toLowerCase().includes(q)) return false;
      }
      if (labelQuery.trim()) {
        const q = labelQuery.trim().toLowerCase();
        if (!flow.label?.toLowerCase().includes(q)) return false;
      }
      if (flowNoQuery.trim()) {
        const q = flowNoQuery.trim().toLowerCase();
        if (!flow.flowNo?.toLowerCase().includes(q)) return false;
      }
      if (ownerQuery.trim()) {
        const q = ownerQuery.trim().toLowerCase();
        if (!flow.ownerName?.toLowerCase().includes(q)) return false;
      }
      if (roleQuery.trim()) {
        const q = roleQuery.trim().toLowerCase();
        if (!flow.roleName?.toLowerCase().includes(q)) return false;
      }
      if (startDateQuery) {
        if (flow.publishTime && flow.publishTime < startDateQuery) return false;
      }
      if (endDateQuery) {
        const endWithTime = endDateQuery.includes(' ') ? endDateQuery : `${endDateQuery} 23:59:59`;
        if (flow.publishTime && flow.publishTime > endWithTime) return false;
      }

      return true;
    });
  }, [
    rawFlows,
    isPartake,
    viewScope,
    currentUser,
    archNameQuery,
    labelQuery,
    flowNoQuery,
    ownerQuery,
    roleQuery,
    startDateQuery,
    endDateQuery,
  ]);

  // Pagination calculation
  const totalItems = filteredFlows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFlows.slice(start, start + pageSize);
  }, [filteredFlows, currentPage, pageSize]);

  // Handle Search & Reset
  const handleSearch = () => {
    setCurrentPage(1);
    setJumpPageInput('1');
    showToast(`搜索完成，匹配到 ${filteredFlows.length} 条记录`, 'info');
  };

  const handleReset = () => {
    setArchNameQuery('');
    setLabelQuery('');
    setFlowNoQuery('');
    setStartDateQuery('');
    setEndDateQuery('');
    setOwnerQuery('');
    setRoleQuery('');
    setCurrentPage(1);
    setJumpPageInput('1');
    showToast('已重置搜索筛选条件', 'info');
  };

  // Visible columns ordered
  const visibleColumns = useMemo(() => {
    const active = columns.filter((c) => c.visible);
    const leftCols = active.filter((c) => c.fixed === 'left');
    const centerCols = active.filter((c) => !c.fixed);
    const rightCols = active.filter((c) => c.fixed === 'right');
    return [...leftCols, ...centerCols, ...rightCols];
  }, [columns]);

  // Column sticky offsets
  const { leftOffsets, rightOffsets } = useMemo(() => {
    const lefts: Record<string, number> = {};
    const rights: Record<string, number> = {};
    let leftAcc = 0;
    for (const col of visibleColumns) {
      if (col.fixed === 'left') {
        lefts[col.key] = leftAcc;
        leftAcc += col.width;
      }
    }
    let rightAcc = 0;
    for (let i = visibleColumns.length - 1; i >= 0; i--) {
      const col = visibleColumns[i];
      if (col.fixed === 'right') {
        rights[col.key] = rightAcc;
        rightAcc += col.width;
      }
    }
    return { leftOffsets: lefts, rightOffsets: rights };
  }, [visibleColumns]);

  const totalTableWidth = useMemo(() => {
    return visibleColumns.reduce((sum, col) => sum + col.width, 0);
  }, [visibleColumns]);

  // Column resizing handler (定义尺寸)
  const handleStartResize = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const targetCol = columns.find((c) => c.key === colKey);
    if (!targetCol) return;
    const startWidth = targetCol.width;
    const minW = targetCol.minWidth || 70;
    const maxW = targetCol.maxWidth || 800;

    const containerRect = tableRef.current?.getBoundingClientRect();
    setResizingColKey(colKey);
    setResizingGuideX(containerRect ? e.clientX - containerRect.left : 0);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const nextWidth = Math.min(maxW, Math.max(minW, startWidth + deltaX));

      setColumns((prev) =>
        prev.map((c) => (c.key === colKey ? { ...c, width: nextWidth } : c))
      );

      if (containerRect) {
        setResizingGuideX(
          Math.max(0, Math.min(containerRect.width, moveEvent.clientX - containerRect.left))
        );
      }
    };

    const onMouseUp = () => {
      setResizingColKey(null);
      setResizingGuideX(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      showToast(`已调整栏位【${targetCol.title}】尺寸`, 'info');
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Double click auto-expand or reset width
  const handleDoubleClickResize = (colKey: string) => {
    const defaultDef = DEFAULT_COLUMNS.find((d) => d.key === colKey);
    if (!defaultDef) return;
    setColumns((prev) =>
      prev.map((c) => {
        if (c.key !== colKey) return c;
        const current = c.width;
        const target = Math.abs(current - defaultDef.width) < 15 ? defaultDef.width + 120 : defaultDef.width;
        return { ...c, width: target };
      })
    );
    showToast(`栏位宽度已自适应`, 'info');
  };

  // Column drag and drop handler (栏位移动)
  const handleDragStart = (e: React.DragEvent, colKey: string) => {
    setDraggingColKey(colKey);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', colKey);
  };

  const handleDragOver = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggingColKey || draggingColKey === targetKey) return;
    setDragOverColKey(targetKey);
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    const sourceKey = draggingColKey || e.dataTransfer.getData('text/plain');
    setDraggingColKey(null);
    setDragOverColKey(null);
    if (!sourceKey || sourceKey === targetKey) return;

    setColumns((prev) => {
      const next = [...prev];
      const fromIndex = next.findIndex((c) => c.key === sourceKey);
      const toIndex = next.findIndex((c) => c.key === targetKey);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    showToast('栏位移动成功，布局已保存', 'success');
  };

  // Move column in modal
  const handleMoveColumnIndex = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;
    setColumns((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Reset columns to defaults
  const handleResetColumns = () => {
    setColumns(DEFAULT_COLUMNS);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    showToast('已恢复默认栏位排序与尺寸定义', 'success');
  };

  // Perform Export
  const handleDoExport = (format: 'json' | 'csv' | 'xml') => {
    if (!exportFlow) return;
    try {
      let content = '';
      let mimeType = 'text/plain';
      let extension = format;

      if (format === 'json') {
        content = JSON.stringify(exportFlow, null, 2);
        mimeType = 'application/json';
      } else if (format === 'csv') {
        const headers = ['流程编码', '流程名称', '所属流程架构', '当前版本', '负责人', '发布时间', '发布人'];
        const values = [
          exportFlow.flowNo,
          exportFlow.label,
          exportFlow.archName,
          exportFlow.versionNo,
          exportFlow.ownerName,
          exportFlow.publishTime,
          exportFlow.publishUserName,
        ];
        content = '\uFEFF' + headers.join(',') + '\n' + values.map((v) => `"${v}"`).join(',');
        mimeType = 'text/csv;charset=utf-8';
      } else if (format === 'xml') {
        content = exportFlow.xml || `<flow id="${exportFlow.id}" name="${exportFlow.label}"></flow>`;
        mimeType = 'application/xml';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportFlow.flowNo}_${exportFlow.label}_导出.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`已成功导出【${exportFlow.label}】(${format.toUpperCase()})`, 'success');
      setExportFlow(null);
    } catch (err) {
      showToast('导出过程中出现异常', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f5f7fa] space-y-3">
      {/* 1. Filter Area matching image_0382220f.png */}
      <div className="bg-white rounded border border-[#e4e7ed] p-4 shadow-xs">
        {/* Row 1: 架构名称, 流程名称, 流程编码, 发布时间 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#606266] shrink-0 w-16 text-right">架构名称</span>
            <input
              type="text"
              value={archNameQuery}
              onChange={(e) => setArchNameQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="请输入"
              className="flex-1 h-8 px-2.5 rounded border border-[#dcdfe6] text-xs text-[#303133] focus:border-[#409eff] focus:outline-none placeholder-[#c0c4cc] transition-colors bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#606266] shrink-0 w-16 text-right">流程名称</span>
            <input
              type="text"
              value={labelQuery}
              onChange={(e) => setLabelQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="请输入"
              className="flex-1 h-8 px-2.5 rounded border border-[#dcdfe6] text-xs text-[#303133] focus:border-[#409eff] focus:outline-none placeholder-[#c0c4cc] transition-colors bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#606266] shrink-0 w-16 text-right">流程编码</span>
            <input
              type="text"
              value={flowNoQuery}
              onChange={(e) => setFlowNoQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="请输入"
              className="flex-1 h-8 px-2.5 rounded border border-[#dcdfe6] text-xs text-[#303133] focus:border-[#409eff] focus:outline-none placeholder-[#c0c4cc] transition-colors bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#606266] shrink-0 w-16 text-right">发布时间</span>
            <div className="flex-1 flex items-center h-8 px-2 rounded border border-[#dcdfe6] text-xs text-[#606266] bg-white gap-1.5 focus-within:border-[#409eff]">
              <Clock className="w-3.5 h-3.5 text-[#909399] shrink-0" />
              <input
                type="date"
                value={startDateQuery}
                onChange={(e) => setStartDateQuery(e.target.value)}
                placeholder="开始日期"
                className="w-1/2 bg-transparent text-[11px] text-[#303133] focus:outline-none"
              />
              <span className="text-[#909399] text-xs">至</span>
              <input
                type="date"
                value={endDateQuery}
                onChange={(e) => setEndDateQuery(e.target.value)}
                placeholder="结束日期"
                className="w-1/2 bg-transparent text-[11px] text-[#303133] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Row 2: 流程负责人, 执行角色, 搜索, 重置 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center mt-3.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#606266] shrink-0 w-16 text-right">流程负责人</span>
            <div className="flex-1 relative">
              <input
                type="text"
                value={ownerQuery}
                onChange={(e) => setOwnerQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={!isPartake && viewScope === 'my_only' ? `默认仅统计：${currentUserName}` : '请输入处理人'}
                className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] text-xs text-[#303133] focus:border-[#409eff] focus:outline-none placeholder-[#c0c4cc] transition-colors bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#606266] shrink-0 w-16 text-right">执行角色</span>
            <input
              type="text"
              value={roleQuery}
              onChange={(e) => setRoleQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="请输入"
              className="flex-1 h-8 px-2.5 rounded border border-[#dcdfe6] text-xs text-[#303133] focus:border-[#409eff] focus:outline-none placeholder-[#c0c4cc] transition-colors bg-white"
            />
          </div>

          <div className="flex items-center gap-2.5 lg:col-span-2">
            <button
              onClick={handleSearch}
              className="h-8 px-4 rounded bg-[#409eff] hover:bg-[#66b1ff] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>搜索</span>
            </button>
            <button
              onClick={handleReset}
              className="h-8 px-4 rounded border border-[#b3d8ff] bg-[#ecf5ff] hover:bg-[#d9ecff] text-[#409eff] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Table Area with Column Sizing, Movement & Account Binding Identification */}
      <div className="bg-white rounded border border-[#e4e7ed] shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="px-4 py-2.5 border-b border-[#ebeef5] flex items-center justify-between gap-3 shrink-0 bg-[#fafafa]">
          <div className="flex items-center gap-2.5 text-xs text-[#606266] flex-wrap">
            <span className="font-semibold text-[#303133]">{pageTitle}清单</span>

            {!isPartake && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#f0f9eb] border border-[#e1f3d8] text-[#67c23a] text-xs font-medium">
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span>
                  当前账号：<strong className="text-[#303133]">{currentUserName}</strong>
                </span>
                <span className="text-[#c0c4cc]">|</span>
                <span>
                  识别并统计流程资料责任人：<strong className="text-[#67c23a]">{myResponsibleFlowsCount}</strong> 条
                </span>
              </div>
            )}

            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-[#409eff] bg-[#ecf5ff] px-2 py-0.5 rounded border border-[#d9ecff]">
              <MoveHorizontal className="w-3 h-3" />
              <span>拖拽表头可移动栏位，拖动右侧边框可定义尺寸</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 我的负责：范围切换开关 */}
            {!isPartake && (
              <div className="flex items-center rounded border border-[#dcdfe6] bg-white overflow-hidden text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setViewScope('my_only');
                    setCurrentPage(1);
                  }}
                  className={`h-7 px-2.5 cursor-pointer transition-colors flex items-center gap-1.5 ${
                    viewScope === 'my_only'
                      ? 'bg-[#409eff] text-white font-medium'
                      : 'text-[#606266] hover:bg-[#f5f7fa]'
                  }`}
                  title="基于所登录账号，自动识别并在流程资料中责任人匹配该账号的流程"
                >
                  <span>仅我负责</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      viewScope === 'my_only'
                        ? 'bg-white/20 text-white font-bold'
                        : 'bg-[#f0f2f5] text-[#909399]'
                    }`}
                  >
                    {myResponsibleFlowsCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewScope('all');
                    setCurrentPage(1);
                  }}
                  className={`h-7 px-2.5 cursor-pointer transition-colors flex items-center gap-1.5 ${
                    viewScope === 'all'
                      ? 'bg-[#409eff] text-white font-medium'
                      : 'text-[#606266] hover:bg-[#f5f7fa]'
                  }`}
                  title="查看全部流程"
                >
                  <span>全部流程</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      viewScope === 'all'
                        ? 'bg-white/20 text-white font-bold'
                        : 'bg-[#f0f2f5] text-[#909399]'
                    }`}
                  >
                    {rawFlows.length}
                  </span>
                </button>
              </div>
            )}

            <button
              onClick={() => {
                fetchFlows();
                showToast('已同步最新流程资料与责任人数据', 'info');
              }}
              className="h-7 px-2.5 rounded border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-[#606266] text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="重新获取最新流程与责任人数据"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-[#409eff]' : ''}`} />
              <span className="hidden sm:inline">刷新数据</span>
            </button>

            <button
              onClick={() => setColumnConfigModalOpen(true)}
              className="h-7 px-2.5 rounded border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-[#606266] text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="支持栏位排序、显隐、冻结与精确尺寸定义"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#409eff]" />
              <span>定义尺寸 & 栏位配置</span>
            </button>

            <button
              onClick={handleResetColumns}
              className="h-7 px-2 rounded border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-[#606266] text-xs flex items-center gap-1 cursor-pointer transition-colors"
              title="重置栏位到初始尺寸和顺序"
            >
              <ResetIcon className="w-3 h-3" />
              <span className="hidden sm:inline">重置栏位</span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div
          ref={tableRef}
          className="flex-1 min-h-0 overflow-auto relative select-none"
        >
          {/* Vertical Resize Guide Line */}
          {resizingGuideX !== null && (
            <div
              style={{ left: `${resizingGuideX}px` }}
              className="absolute top-0 bottom-0 w-[2px] bg-[#409eff] z-50 pointer-events-none shadow-[0_0_6px_rgba(64,158,255,0.6)]"
            />
          )}

          <table
            style={{ width: `${Math.max(totalTableWidth, 900)}px` }}
            className="w-full text-xs text-left border-collapse table-fixed"
          >
            {/* Column Widths Definition */}
            <colgroup>
              {visibleColumns.map((col) => (
                <col key={col.key} style={{ width: `${col.width}px` }} />
              ))}
            </colgroup>

            {/* Table Header matching design */}
            <thead>
              <tr className="bg-[#f8f9fb] border-b border-[#ebeef5] text-[#303133] font-medium select-none">
                {visibleColumns.map((col) => {
                  const isLeftFixed = col.fixed === 'left';
                  const isRightFixed = col.fixed === 'right';
                  const isDraggingThis = draggingColKey === col.key;
                  const isDragOverThis = dragOverColKey === col.key;

                  let stickyStyle: React.CSSProperties = {};
                  if (isLeftFixed) {
                    stickyStyle = {
                      position: 'sticky',
                      left: `${leftOffsets[col.key] || 0}px`,
                      zIndex: 20,
                    };
                  } else if (isRightFixed) {
                    stickyStyle = {
                      position: 'sticky',
                      right: `${rightOffsets[col.key] || 0}px`,
                      zIndex: 20,
                    };
                  }

                  return (
                    <th
                      key={col.key}
                      style={{
                        width: `${col.width}px`,
                        ...stickyStyle,
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, col.key)}
                      onDragOver={(e) => handleDragOver(e, col.key)}
                      onDrop={(e) => handleDrop(e, col.key)}
                      className={`relative px-3 py-3 text-xs bg-[#f8f9fb] border-r border-[#ebeef5] transition-colors group cursor-move ${
                        isDraggingThis ? 'opacity-40 bg-[#ecf5ff]' : ''
                      } ${isDragOverThis ? 'border-l-2 border-l-[#409eff] bg-[#ecf5ff]' : ''}`}
                    >
                      <div
                        className={`flex items-center gap-1.5 ${
                          col.align === 'center'
                            ? 'justify-center'
                            : col.align === 'right'
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <GripVertical className="w-3 h-3 text-[#c0c4cc] group-hover:text-[#409eff] shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span className="font-medium text-[#303133] truncate">{col.title}</span>
                        {col.fixed && (
                          <Pin className="w-2.5 h-2.5 text-[#409eff] shrink-0" />
                        )}
                        <span className="text-[10px] text-[#909399] opacity-0 group-hover:opacity-100 transition-opacity">
                          ({col.width}px)
                        </span>
                      </div>

                      {/* Right Resize Handle (定义尺寸) */}
                      <div
                        data-resize-handle="true"
                        onMouseDown={(e) => handleStartResize(e, col.key)}
                        onDoubleClick={() => handleDoubleClickResize(col.key)}
                        title="按住拖拽调整列宽，双击自适应"
                        className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-[#409eff]/30 z-30 flex items-center justify-center transition-colors"
                      >
                        <div className="w-[1.5px] h-3.5 bg-[#dcdfe6] group-hover:bg-[#409eff]" />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="text-center py-12 text-[#909399]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#409eff] border-t-transparent rounded-full animate-spin" />
                      <span>正在加载流程数据...</span>
                    </div>
                  </td>
                </tr>
              ) : currentPageData.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="text-center py-16 text-[#909399]">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <AlertCircle className="w-8 h-8 text-[#dcdfe6]" />
                      <span className="text-xs text-[#606266]">
                        {!isPartake && viewScope === 'my_only'
                          ? `当前账号【${currentUserName}】暂无负责的流程。`
                          : '暂无符合条件的流程数据'}
                      </span>
                      {!isPartake && viewScope === 'my_only' && (
                        <div className="text-[11px] text-[#909399]">
                          可在「流程建设 -&gt; 流程设计 -&gt; 流程资料」中将某流程的责任人设置为【{currentUserName}】并保存。
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                currentPageData.map((flow, rowIndex) => {
                  const isMine = matchFlowResponsibleUser(flow.ownerName, currentUser);

                  return (
                    <tr
                      key={flow.id || rowIndex}
                      className="border-b border-[#ebeef5] hover:bg-[#f5f7fa] transition-colors"
                    >
                      {visibleColumns.map((col) => {
                        const isLeftFixed = col.fixed === 'left';
                        const isRightFixed = col.fixed === 'right';

                        let stickyStyle: React.CSSProperties = {};
                        if (isLeftFixed) {
                          stickyStyle = {
                            position: 'sticky',
                            left: `${leftOffsets[col.key] || 0}px`,
                            zIndex: 10,
                          };
                        } else if (isRightFixed) {
                          stickyStyle = {
                            position: 'sticky',
                            right: `${rightOffsets[col.key] || 0}px`,
                            zIndex: 10,
                          };
                        }

                        const cellClass = `px-3 py-2.5 text-xs text-[#606266] border-r border-[#ebeef5] bg-white group-hover:bg-[#f5f7fa] ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`;

                        if (col.key === 'flowNo') {
                          return (
                            <td key={col.key} style={stickyStyle} className={cellClass}>
                              <span className="font-mono text-[#303133] font-medium">
                                {flow.flowNo}
                              </span>
                            </td>
                          );
                        }

                        if (col.key === 'label') {
                          return (
                            <td key={col.key} style={stickyStyle} className={cellClass}>
                              <div
                                onClick={() => setPreviewFlow(flow)}
                                className="font-medium text-[#303133] hover:text-[#409eff] cursor-pointer truncate"
                                title={flow.label}
                              >
                                {flow.label}
                              </div>
                            </td>
                          );
                        }

                        if (col.key === 'archName') {
                          return (
                            <td key={col.key} style={stickyStyle} className={cellClass}>
                              <div className="truncate text-[#606266]" title={flow.archName}>
                                {flow.archName || '-'}
                              </div>
                            </td>
                          );
                        }

                        if (col.key === 'versionNo') {
                          return (
                            <td key={col.key} style={stickyStyle} className={cellClass}>
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff]">
                                {flow.versionNo || 'V1'}
                              </span>
                            </td>
                          );
                        }

                        if (col.key === 'ownerName') {
                          return (
                            <td key={col.key} style={stickyStyle} className={cellClass}>
                              <div className="flex items-center gap-1.5 truncate" title={flow.ownerName}>
                                <span className={isMine ? 'font-medium text-[#303133]' : 'text-[#606266]'}>
                                  {flow.ownerName || '-'}
                                </span>
                                {isMine && (
                                  <span className="shrink-0 px-1.5 py-0.2 rounded text-[10px] bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff] font-medium">
                                    我负责
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        }

                        if (col.key === 'publishTime') {
                          return (
                            <td key={col.key} style={stickyStyle} className={cellClass}>
                              <span className="font-mono text-[11px] text-[#606266]">
                                {flow.publishTime || '-'}
                              </span>
                            </td>
                          );
                        }

                        if (col.key === 'publishUserName') {
                          return (
                            <td key={col.key} style={stickyStyle} className={cellClass}>
                              <div className="truncate" title={flow.publishUserName}>
                                {flow.publishUserName || '-'}
                              </div>
                            </td>
                          );
                        }

                        if (col.key === 'actions') {
                          return (
                            <td key={col.key} style={stickyStyle} className={cellClass}>
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setPreviewFlow(flow)}
                                  className="text-[#409eff] hover:text-[#66b1ff] cursor-pointer font-medium text-xs hover:underline"
                                >
                                  查阅
                                </button>
                                <span className="text-[#dcdfe6]">|</span>
                                <button
                                  onClick={() => setExportFlow(flow)}
                                  className="text-[#409eff] hover:text-[#66b1ff] cursor-pointer font-medium text-xs hover:underline"
                                >
                                  导出
                                </button>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={col.key} style={stickyStyle} className={cellClass}>
                            {(flow as any)[col.key] ?? '-'}
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

        {/* 3. Pagination matching image_0382220f.png exactly */}
        <div className="px-4 py-3 border-t border-[#ebeef5] flex items-center justify-end gap-3 text-xs text-[#606266] shrink-0 bg-white select-none">
          {/* Total items: 共 X 条 */}
          <span>共 {totalItems} 条</span>

          {/* Page size dropdown: 10条/页 */}
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
                setJumpPageInput('1');
              }}
              className="h-7 px-2.5 rounded border border-[#dcdfe6] text-xs text-[#606266] bg-white cursor-pointer focus:border-[#409eff] focus:outline-none"
            >
              <option value={10}>10条/页</option>
              <option value={20}>20条/页</option>
              <option value={50}>50条/页</option>
              <option value={100}>100条/页</option>
            </select>
          </div>

          {/* Prev button < */}
          <button
            onClick={() => {
              if (currentPage > 1) {
                setCurrentPage(currentPage - 1);
                setJumpPageInput(String(currentPage - 1));
              }
            }}
            disabled={currentPage <= 1}
            className={`h-7 w-7 rounded flex items-center justify-center border border-[#dcdfe6] transition-colors ${
              currentPage <= 1
                ? 'text-[#c0c4cc] bg-[#f5f7fa] cursor-not-allowed'
                : 'text-[#606266] hover:border-[#409eff] hover:text-[#409eff] bg-white cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1;
            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                onClick={() => {
                  setCurrentPage(pageNum);
                  setJumpPageInput(String(pageNum));
                }}
                className={`h-7 w-7 rounded text-xs font-medium flex items-center justify-center transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#409eff] text-white'
                    : 'border border-[#dcdfe6] text-[#606266] hover:border-[#409eff] hover:text-[#409eff] bg-white'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next button > */}
          <button
            onClick={() => {
              if (currentPage < totalPages) {
                setCurrentPage(currentPage + 1);
                setJumpPageInput(String(currentPage + 1));
              }
            }}
            disabled={currentPage >= totalPages}
            className={`h-7 w-7 rounded flex items-center justify-center border border-[#dcdfe6] transition-colors ${
              currentPage >= totalPages
                ? 'text-[#c0c4cc] bg-[#f5f7fa] cursor-not-allowed'
                : 'text-[#606266] hover:border-[#409eff] hover:text-[#409eff] bg-white cursor-pointer'
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Go to page: 前往 [ 1 ] 页 */}
          <div className="flex items-center gap-1.5">
            <span>前往</span>
            <input
              type="text"
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const p = Math.max(1, Math.min(totalPages, Number(jumpPageInput) || 1));
                  setCurrentPage(p);
                  setJumpPageInput(String(p));
                }
              }}
              onBlur={() => {
                const p = Math.max(1, Math.min(totalPages, Number(jumpPageInput) || 1));
                setCurrentPage(p);
                setJumpPageInput(String(p));
              }}
              className="w-10 h-7 text-center rounded border border-[#dcdfe6] text-xs text-[#303133] focus:border-[#409eff] focus:outline-none"
            />
            <span>页</span>
          </div>
        </div>
      </div>

      {/* 4. Column Configuration & Dimension Definition Modal (定义尺寸与栏位移动) */}
      {columnConfigModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-[#ebeef5] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#409eff]" />
                <h3 className="font-semibold text-sm text-[#303133]">
                  栏位移动与尺寸定义配置
                </h3>
              </div>
              <button
                onClick={() => setColumnConfigModalOpen(false)}
                className="text-[#909399] hover:text-[#606266] p-1 rounded hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 min-h-0 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-[#ecf5ff] rounded border border-[#d9ecff] text-[#409eff] flex items-center justify-between">
                <span>
                  💡 提示：可调整栏位顺序（上移/下移）、设置精确列宽像素尺寸（定义尺寸）、冻结固定列以及显隐开关。
                </span>
                <button
                  onClick={handleResetColumns}
                  className="px-2.5 py-1 rounded bg-white text-[#409eff] border border-[#b3d8ff] hover:bg-[#d9ecff] shrink-0 cursor-pointer font-medium text-[11px]"
                >
                  恢复初始配置
                </button>
              </div>

              <div className="border border-[#ebeef5] rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f8f9fb] text-[#606266] border-b border-[#ebeef5]">
                      <th className="py-2 px-3 w-12 text-center">显示</th>
                      <th className="py-2 px-3 w-28">栏位名称</th>
                      <th className="py-2 px-3 w-40">自定义宽度尺寸 (px)</th>
                      <th className="py-2 px-3 w-28">固定列</th>
                      <th className="py-2 px-3 text-center w-24">栏位移动</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((col, index) => (
                      <tr key={col.key} className="border-b border-[#ebeef5] hover:bg-[#fafafa]">
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={col.visible}
                            disabled={col.key === 'flowNo' || col.key === 'label'}
                            onChange={(e) => {
                              setColumns((prev) =>
                                prev.map((c) =>
                                  c.key === col.key ? { ...c, visible: e.target.checked } : c
                                )
                              );
                            }}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3 font-medium text-[#303133]">
                          {col.title}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={col.minWidth || 70}
                              max={col.maxWidth || 800}
                              step={10}
                              value={col.width}
                              onChange={(e) => {
                                const val = Number(e.target.value) || col.minWidth;
                                setColumns((prev) =>
                                  prev.map((c) =>
                                    c.key === col.key ? { ...c, width: val } : c
                                  )
                                );
                              }}
                              className="w-20 h-7 px-2 rounded border border-[#dcdfe6] text-xs focus:border-[#409eff] outline-none"
                            />
                            <span className="text-[#909399]">px</span>
                            <input
                              type="range"
                              min={col.minWidth || 70}
                              max={col.maxWidth || 800}
                              value={col.width}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setColumns((prev) =>
                                  prev.map((c) =>
                                    c.key === col.key ? { ...c, width: val } : c
                                  )
                                );
                              }}
                              className="flex-1 accent-[#409eff] cursor-pointer"
                            />
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={col.fixed || 'none'}
                            onChange={(e) => {
                              const val = e.target.value === 'none' ? undefined : (e.target.value as any);
                              setColumns((prev) =>
                                prev.map((c) =>
                                  c.key === col.key ? { ...c, fixed: val } : c
                                )
                              );
                            }}
                            className="h-7 px-1.5 rounded border border-[#dcdfe6] text-xs bg-white focus:border-[#409eff] outline-none"
                          >
                            <option value="none">不固定</option>
                            <option value="left">固定在左侧</option>
                            <option value="right">固定在右侧</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveColumnIndex(index, 'up')}
                              disabled={index === 0}
                              title="向上移动栏位"
                              className={`p-1 rounded border ${
                                index === 0
                                  ? 'border-[#ebeef5] text-[#c0c4cc] cursor-not-allowed'
                                  : 'border-[#dcdfe6] text-[#606266] hover:text-[#409eff] hover:border-[#409eff] cursor-pointer'
                              }`}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveColumnIndex(index, 'down')}
                              disabled={index === columns.length - 1}
                              title="向下移动栏位"
                              className={`p-1 rounded border ${
                                index === columns.length - 1
                                  ? 'border-[#ebeef5] text-[#c0c4cc] cursor-not-allowed'
                                  : 'border-[#dcdfe6] text-[#606266] hover:text-[#409eff] hover:border-[#409eff] cursor-pointer'
                              }`}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setColumnConfigModalOpen(false)}
                className="px-4 py-1.5 rounded border border-[#dcdfe6] bg-white text-[#606266] hover:bg-[#f5f7fa] text-xs cursor-pointer"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Flow Details / Preview Modal (查阅功能) */}
      {previewFlow && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-[#ebeef5] w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] font-semibold">
                  {previewFlow.flowNo}
                </span>
                <h3 className="font-semibold text-sm text-[#303133]">
                  {previewFlow.label}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]">
                  {previewFlow.versionNo || 'V3'} 已发布
                </span>
              </div>
              <div className="flex items-center gap-2">
                {onEnterDesigner && (
                  <button
                    onClick={() => {
                      onEnterDesigner(previewFlow.id);
                      setPreviewFlow(null);
                    }}
                    className="h-7 px-2.5 rounded bg-[#ecf5ff] hover:bg-[#409eff] text-[#409eff] hover:text-white border border-[#b3d8ff] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>打开流程设计画板</span>
                  </button>
                )}
                <button
                  onClick={() => setPreviewFlow(null)}
                  className="text-[#909399] hover:text-[#606266] p-1 rounded hover:bg-black/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="px-5 border-b border-[#ebeef5] bg-white flex items-center gap-6 text-xs shrink-0">
              <button
                onClick={() => setPreviewTab('info')}
                className={`py-2.5 font-medium border-b-2 cursor-pointer transition-colors ${
                  previewTab === 'info'
                    ? 'border-[#409eff] text-[#409eff]'
                    : 'border-transparent text-[#606266] hover:text-[#303133]'
                }`}
              >
                基本属性与制度规则
              </button>
              <button
                onClick={() => setPreviewTab('diagram')}
                className={`py-2.5 font-medium border-b-2 cursor-pointer transition-colors ${
                  previewTab === 'diagram'
                    ? 'border-[#409eff] text-[#409eff]'
                    : 'border-transparent text-[#606266] hover:text-[#303133]'
                }`}
              >
                流程活动与节点流转
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 min-h-0 overflow-y-auto space-y-4 text-xs">
              {previewTab === 'info' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-4 bg-[#f8f9fb] rounded border border-[#ebeef5]">
                    <div>
                      <span className="text-[#909399] block mb-1">流程编码</span>
                      <span className="font-mono font-medium text-[#303133]">{previewFlow.flowNo}</span>
                    </div>
                    <div>
                      <span className="text-[#909399] block mb-1">流程名称</span>
                      <span className="font-medium text-[#303133]">{previewFlow.label}</span>
                    </div>
                    <div>
                      <span className="text-[#909399] block mb-1">所属流程架构</span>
                      <span className="text-[#303133]">{previewFlow.archName}</span>
                    </div>
                    <div>
                      <span className="text-[#909399] block mb-1">流程负责人</span>
                      <span className="text-[#303133] font-medium">{previewFlow.ownerName}</span>
                    </div>
                    <div>
                      <span className="text-[#909399] block mb-1">发布人</span>
                      <span className="text-[#303133]">{previewFlow.publishUserName}</span>
                    </div>
                    <div>
                      <span className="text-[#909399] block mb-1">发布时间</span>
                      <span className="font-mono text-[#303133]">{previewFlow.publishTime}</span>
                    </div>
                    <div>
                      <span className="text-[#909399] block mb-1">当前版本</span>
                      <span className="font-medium text-[#409eff]">{previewFlow.versionNo}</span>
                    </div>
                    <div>
                      <span className="text-[#909399] block mb-1">驱动制度规范</span>
                      <span className="text-[#303133]">{previewFlow.drivingRules || '全源企业流程管理规范V3'}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#303133] mb-2">流程目的与适用范围</h4>
                    <div className="p-3 bg-white border border-[#ebeef5] rounded text-[#606266] leading-relaxed">
                      {previewFlow.purpose ||
                        '规范业务流转与职责分工，强化关键控制点（KCP）审查与合规留痕，提升业务全流程运转效率与风险防范能力。'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-[#f0f9eb] border border-[#e1f3d8] rounded text-[#67c23a] text-xs">
                    流程活动节点图示（已发布基线 V{previewFlow.versionNo || '3'}）
                  </div>
                  <div className="border border-[#ebeef5] rounded p-4 bg-white space-y-3">
                    <div className="flex items-center gap-2 font-medium text-[#303133]">
                      <Layers className="w-4 h-4 text-[#409eff]" />
                      <span>关键阶段节点流转</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded border border-[#ebeef5] bg-[#f8fafc]">
                        <div className="text-[11px] text-[#409eff] font-bold mb-1">阶段一</div>
                        <div className="font-medium text-[#303133] mb-1">诉求发起与受理</div>
                        <div className="text-[11px] text-[#909399]">执行角色：{previewFlow.roleName || '经办人'}</div>
                      </div>
                      <div className="p-3 rounded border border-[#ebeef5] bg-[#f8fafc]">
                        <div className="text-[11px] text-[#409eff] font-bold mb-1">阶段二 (KCP)</div>
                        <div className="font-medium text-[#303133] mb-1">合规审查与技术评估</div>
                        <div className="text-[11px] text-[#909399]">执行角色：专家评审委员会</div>
                      </div>
                      <div className="p-3 rounded border border-[#ebeef5] bg-[#f8fafc]">
                        <div className="text-[11px] text-[#409eff] font-bold mb-1">阶段三</div>
                        <div className="font-medium text-[#303133] mb-1">业务决策会签</div>
                        <div className="text-[11px] text-[#909399]">执行角色：业务总监</div>
                      </div>
                      <div className="p-3 rounded border border-[#ebeef5] bg-[#f8fafc]">
                        <div className="text-[11px] text-[#409eff] font-bold mb-1">阶段四</div>
                        <div className="font-medium text-[#303133] mb-1">执行归档与闭环</div>
                        <div className="text-[11px] text-[#909399]">执行角色：流程管理员</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex justify-between items-center shrink-0">
              <button
                onClick={() => {
                  setExportFlow(previewFlow);
                  setPreviewFlow(null);
                }}
                className="h-8 px-3.5 rounded border border-[#409eff] text-[#409eff] hover:bg-[#ecf5ff] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出该流程</span>
              </button>

              <button
                onClick={() => setPreviewFlow(null)}
                className="h-8 px-4 rounded bg-[#409eff] text-white hover:bg-[#66b1ff] text-xs font-medium cursor-pointer transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Export Modal (导出功能) */}
      {exportFlow && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-[#ebeef5] w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-[#409eff]" />
                <h3 className="font-semibold text-sm text-[#303133]">
                  导出流程数据
                </h3>
              </div>
              <button
                onClick={() => setExportFlow(null)}
                className="text-[#909399] hover:text-[#606266] p-1 rounded hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 min-h-0 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-[#f8f9fb] rounded border border-[#ebeef5]">
                <div className="font-medium text-[#303133] mb-1">{exportFlow.label}</div>
                <div className="text-[11px] text-[#909399]">编码: {exportFlow.flowNo} | 版本: {exportFlow.versionNo}</div>
              </div>

              <div>
                <span className="text-[#606266] font-medium block mb-2">选择导出格式：</span>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handleDoExport('csv')}
                    className="p-3 rounded border border-[#ebeef5] hover:border-[#409eff] hover:bg-[#ecf5ff] flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors group"
                  >
                    <FileSpreadsheet className="w-6 h-6 text-[#67c23a] group-hover:scale-105 transition-transform" />
                    <span className="font-medium text-[#303133]">Excel / CSV</span>
                  </button>
                  <button
                    onClick={() => handleDoExport('json')}
                    className="p-3 rounded border border-[#ebeef5] hover:border-[#409eff] hover:bg-[#ecf5ff] flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors group"
                  >
                    <FileCode className="w-6 h-6 text-[#e6a23c] group-hover:scale-105 transition-transform" />
                    <span className="font-medium text-[#303133]">JSON 数据</span>
                  </button>
                  <button
                    onClick={() => handleDoExport('xml')}
                    className="p-3 rounded border border-[#ebeef5] hover:border-[#409eff] hover:bg-[#ecf5ff] flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors group"
                  >
                    <FileText className="w-6 h-6 text-[#409eff] group-hover:scale-105 transition-transform" />
                    <span className="font-medium text-[#303133]">BPMN XML</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setExportFlow(null)}
                className="px-4 py-1.5 rounded border border-[#dcdfe6] bg-white text-[#606266] hover:bg-[#f5f7fa] text-xs cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
