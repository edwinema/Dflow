import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Download,
  FileSearch,
  FileX2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Network,
  GitBranch,
  Maximize2,
  ZoomOut,
  ZoomIn,
  X,
  Check,
  Clock,
  FileWarning,
  Layers,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Building2,
  Eye,
  ShieldCheck,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Presentation,
  FolderTree,
  CornerDownRight,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { DrawioBridge } from '../utils/drawioBridge';
import { parseFlowNodes } from '../utils/flowSchema';
import { EnterpriseDataGrid, DataGridColumn } from './EnterpriseDataGrid';
import {
  OnlineDocumentPreviewModal,
  downloadDocumentFile,
  getDocumentFormat,
} from './OnlineDocumentPreviewModal';
import { FlowPageStandardHeader, getArchHierarchyPath } from './FlowPageStandardHeader';
import { UnifiedCardDetailView } from './UnifiedCardDetailView';

interface PropertyOverviewViewProps {
  initialSelectedFlowId?: string | null;
  mode?: 'overview' | 'repealList';
  currentUser?: any;
  onNavigate?: (path: string, flowId?: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

// 颜色主题生成工具，为各层级架构与流程卡片提供丰富、高对比度的彩色视觉标识（支持向下穿透）
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

export const PropertyOverviewView: React.FC<PropertyOverviewViewProps> = ({
  initialSelectedFlowId,
  mode = 'overview',
  currentUser,
  onNavigate,
  showToast,
}) => {
  const [archList, setArchList] = useState<any[]>([]);
  const [flowList, setFlowList] = useState<any[]>([]);
  const [dictBundle, setDictBundle] = useState<any>({});
  const [repealRecords, setRepealRecords] = useState<any[]>([]);
  const [treeCollapsed, setTreeCollapsed] = useState(false);
  const [collapsedArchIds, setCollapsedArchIds] = useState<Record<string, boolean>>({});

  const [filterArchName, setFilterArchName] = useState('');
  const [filterFlowName, setFilterFlowName] = useState('');
  const [filterFlowCode, setFilterFlowCode] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterExecRole, setFilterExecRole] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    archName: '',
    flowName: '',
    flowCode: '',
    startDate: '',
    endDate: '',
    owner: '',
    execRole: '',
  });

  const [selectedNode, setSelectedNode] = useState<{ type: 'arch' | 'flow'; id: string }>({
    type: 'flow',
    id: initialSelectedFlowId || 'flow_101',
  });

  const [flowTab, setFlowTab] = useState<
    'flow' | 'jbzl' | 'jxzb' | 'zdwj' | 'fxhg' | 'lcsy' | 'xgfj' | 'lcjdmx' | 'lczxqk'
  >('flow');
  const [archTab, setArchTab] = useState<'arch' | 'typecard' | 'zdwj' | 'fxhg' | 'xgfj'>('arch');
  const [currentFlow, setCurrentFlow] = useState<any | null>(null);
  const [currentArch, setCurrentArch] = useState<any | null>(null);
  const [flowRefs, setFlowRefs] = useState<string[]>([]);
  const [archRefs, setArchRefs] = useState<string[]>([]);
  const [showDiagramForUnedited, setShowDiagramForUnedited] = useState(false);

  // Online preview document modal state
  const [onlinePreviewDoc, setOnlinePreviewDoc] = useState<any | null>(null);

  const [historyModal, setHistoryModal] = useState<{
    open: boolean;
    title: string;
    rows: any[];
  }>({ open: false, title: '', rows: [] });

  const [repealModal, setRepealModal] = useState<{
    open: boolean;
    flow: any | null;
    applyMode: 'suggest' | 'direct';
    reasonType: string;
    reason: string;
    replaceFlowName: string;
    impactScope: string;
    submitting: boolean;
  }>({
    open: false,
    flow: null,
    applyMode: 'suggest',
    reasonType: '业务模式变革调整',
    reason: '',
    replaceFlowName: '',
    impactScope: '所有关联业务部门与制度',
    submitting: false,
  });

  const [repealDrawerOpen, setRepealDrawerOpen] = useState(false);
  const [detailRepealRecord, setDetailRepealRecord] = useState<any | null>(null);
  const [auditOpinionInput, setAuditOpinionInput] = useState('');

  const [treeWidth, setTreeWidth] = useState<number>(290);
  const [isResizingTree, setIsResizingTree] = useState(false);

  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const previewBridgeRef = useRef<DrawioBridge | null>(null);

  const handleStartResizeTree = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = treeWidth;
    setIsResizingTree(true);
    const onMove = (moveEvent: MouseEvent) => {
      const nextW = Math.min(520, Math.max(200, startW + (moveEvent.clientX - startX)));
      setTreeWidth(nextW);
    };
    const onUp = () => {
      setIsResizingTree(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const loadAllData = async () => {
    try {
      const [archRes, flowRes, dictRes, repealRes] = await Promise.all([
        fetch('/api/flow/fulltypes').then((r) => r.json()),
        fetch('/api/flow/fullSimpleModels').then((r) => r.json()),
        fetch('/api/dict/bundle').then((r) => r.json()),
        fetch('/api/flow/repeals').then((r) => r.json()),
      ]);
      const archs = archRes?.data || [];
      const flows = flowRes?.data || [];
      setArchList(archs);
      setFlowList(flows);
      if (dictRes?.data) setDictBundle(dictRes.data);
      if (repealRes?.data) setRepealRecords(repealRes.data);

      // Only published & non-repealed flows
      const published = flows.filter(
        (f: any) =>
          f.status !== 'repealed' &&
          (f.status === 'published' || f.auditStatus === '已审核' || !f.status)
      );

      if (selectedNode.type === 'flow') {
        const found = published.find((f: any) => f.id === selectedNode.id);
        if (found) {
          setCurrentFlow(found);
        } else if (published.length > 0) {
          const fallback = published[0];
          setSelectedNode({ type: 'flow', id: fallback.id });
          setCurrentFlow(fallback);
        } else if (archs[0]) {
          setSelectedNode({ type: 'arch', id: archs[0].id });
          setCurrentArch(archs[0]);
        }
      } else {
        const foundArch = archs.find((a: any) => a.id === selectedNode.id) || archs[0];
        if (foundArch) setCurrentArch(foundArch);
      }
    } catch {
      showToast('加载流程资产数据失败', 'error');
    }
  };

  useEffect(() => {
    loadAllData();
  }, [initialSelectedFlowId, mode]);

  // 1. 严格过滤：只有通过直接发布或审批发布的流程才在流程概览页面显示
  const publishedFlows = useMemo(() => {
    return flowList.filter((f) => {
      if (f.status === 'repealed') return false;
      // 直接发布或审核发布生效
      const isPublished =
        f.status === 'published' || f.auditStatus === '已审核' || !f.status;
      return isPublished;
    });
  }, [flowList]);

  // 2. 严格过滤：架构也仅展示正式发布或包含已发布业务流程/子架构的层级节点
  const publishedArchs = useMemo(() => {
    const getFlowCountUnderArch = (archId: string): number => {
      const direct = publishedFlows.filter((f) => f.parentId === archId).length;
      const children = archList.filter((a) => a.parentId === archId);
      const sub = children.reduce((sum, ch) => sum + getFlowCountUnderArch(ch.id), 0);
      return direct + sub;
    };

    return archList.filter((a) => {
      if (a.status === 'draft') return false;
      // 根架构始终保留
      if (!a.parentId || a.id === 'arch_root') return true;
      const isPublished = a.status === 'published' || !!a.publishTime;
      return isPublished || getFlowCountUnderArch(a.id) > 0;
    });
  }, [archList, publishedFlows]);

  // 3. 搜索条件过滤已发布的业务流程
  const filteredActiveFlows = useMemo(() => {
    return publishedFlows.filter((f) => {
      if (
        appliedFilters.archName.trim() &&
        !(f.archName || '').toLowerCase().includes(appliedFilters.archName.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilters.flowName.trim() &&
        !(f.label || '').toLowerCase().includes(appliedFilters.flowName.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilters.flowCode.trim() &&
        !(f.flowNo || '').toLowerCase().includes(appliedFilters.flowCode.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilters.owner.trim() &&
        !(f.ownerName || '').toLowerCase().includes(appliedFilters.owner.trim().toLowerCase())
      ) {
        return false;
      }
      if (appliedFilters.startDate) {
        const pubDate = (f.publishTime || '').slice(0, 10);
        if (pubDate && pubDate < appliedFilters.startDate) return false;
      }
      if (appliedFilters.endDate) {
        const pubDate = (f.publishTime || '').slice(0, 10);
        if (pubDate && pubDate > appliedFilters.endDate) return false;
      }
      return true;
    });
  }, [publishedFlows, appliedFilters]);

  useEffect(() => {
    if (selectedNode.type === 'flow') {
      const f = publishedFlows.find((x) => x.id === selectedNode.id) || flowList.find((x) => x.id === selectedNode.id);
      if (f) {
        setCurrentFlow(f);
        setShowDiagramForUnedited(false);
      }
      if (['zdwj', 'fxhg', 'lcsy', 'xgfj'].includes(flowTab)) {
        fetch(`/api/flow/model/refs?id=${selectedNode.id}&tab=${flowTab}`)
          .then((r) => r.json())
          .then((res) => setFlowRefs(res.data || []));
      }
    } else {
      const a = publishedArchs.find((x) => x.id === selectedNode.id) || archList.find((x) => x.id === selectedNode.id);
      if (a) setCurrentArch(a);
      if (['zdwj', 'fxhg', 'xgfj'].includes(archTab)) {
        fetch(`/api/flow/type/refs?id=${selectedNode.id}&tab=${archTab}`)
          .then((r) => r.json())
          .then((res) => setArchRefs(res.data || []));
      }
    }
  }, [selectedNode, flowTab, archTab, flowList, archList, publishedFlows, publishedArchs]);

  useEffect(() => {
    if (
      selectedNode.type !== 'flow' ||
      flowTab !== 'flow' ||
      !currentFlow?.xml ||
      (currentFlow?.unedited && !showDiagramForUnedited)
    ) {
      return;
    }
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
      previewBridgeRef.current = null;
    };
  }, [selectedNode.type, selectedNode.id, flowTab, currentFlow?.xml, currentFlow?.unedited, showDiagramForUnedited]);

  const handleSearch = () => {
    setAppliedFilters({
      archName: filterArchName,
      flowName: filterFlowName,
      flowCode: filterFlowCode,
      startDate: filterStartDate,
      endDate: filterEndDate,
      owner: filterOwner,
      execRole: filterExecRole,
    });
    showToast('查询完成', 'success');
  };

  const handleReset = () => {
    setFilterArchName('');
    setFilterFlowName('');
    setFilterFlowCode('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterOwner('');
    setFilterExecRole('');
    setAppliedFilters({
      archName: '',
      flowName: '',
      flowCode: '',
      startDate: '',
      endDate: '',
      owner: '',
      execRole: '',
    });
    showToast('已重置条件', 'success');
  };

  const handleOpenHistory = async (isArch: boolean, idOverride?: string) => {
    const targetId = idOverride || selectedNode.id;
    const url = isArch
      ? `/api/flow/type/publishVersionHistories?id=${targetId}`
      : `/api/flow/model/publishVersionHistories?id=${targetId}`;
    const res = await fetch(url).then((r) => r.json());
    setHistoryModal({
      open: true,
      title: isArch ? '架构版本发布历史' : '流程版本发布历史',
      rows: res?.data || [],
    });
  };

  const openRepealModalForFlow = (flow: any, defaultMode: 'suggest' | 'direct' = 'suggest') => {
    if (!flow) return;
    setRepealModal({
      open: true,
      flow,
      applyMode: defaultMode,
      reasonType: '业务模式变革调整',
      reason:
        defaultMode === 'suggest'
          ? `建议废止【${flow.label}】，业务已与新版流程合并。`
          : '',
      replaceFlowName: '',
      impactScope: '所有关联业务部门与制度',
      submitting: false,
    });
  };

  const handleSubmitRepeal = async () => {
    if (!repealModal.flow) return;
    if (repealModal.applyMode === 'suggest' && !repealModal.reason.trim()) {
      showToast('请输入建议废止理由', 'warning');
      return;
    }
    setRepealModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await fetch('/api/flow/repeal/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: repealModal.flow.id,
          mode: repealModal.applyMode,
          reasonType: repealModal.reasonType,
          reason: repealModal.reason.trim(),
          replaceFlowName: repealModal.replaceFlowName.trim(),
          impactScope: repealModal.impactScope.trim(),
          applicant: '当前登录人',
        }),
      }).then((r) => r.json());
      if (res.status === 1) {
        const targetLabel = repealModal.flow.label;
        const isDirect = repealModal.applyMode === 'direct';
        setRepealModal((prev) => ({ ...prev, open: false, submitting: false }));
        await loadAllData();
        showToast(
          isDirect ? `流程【${targetLabel}】已正式废止` : `已提交流程【${targetLabel}】废止申请`,
          'success'
        );
      } else {
        showToast(res.info || '操作失败', 'error');
        setRepealModal((prev) => ({ ...prev, submitting: false }));
      }
    } catch {
      showToast('操作异常', 'error');
      setRepealModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const resolveBoundItems = (tab: 'zdwj' | 'fxhg' | 'lcsy' | 'xgfj', refIds: string[]) => {
    if (tab === 'zdwj') {
      return (dictBundle.sysDoc || []).filter(
        (d: any) => refIds.includes(d.id) && d.status !== 'pending'
      );
    }
    if (tab === 'fxhg') {
      return (dictBundle.risk || []).filter(
        (r: any) => refIds.includes(r.id) && r.status !== 'pending'
      );
    }
    if (tab === 'lcsy') {
      return (dictBundle.terms || []).filter((t: any) => refIds.includes(t.id));
    }
    const attPool = [...(dictBundle.attachments || []), ...(dictBundle.sysDoc || [])];
    return attPool.filter((a: any) => refIds.includes(a.id));
  };

  const countArchItems = (archId: string): number => {
    const childArchs = publishedArchs.filter((a) => a.parentId === archId);
    const childFlows = filteredActiveFlows.filter((f) => f.parentId === archId);
    return childArchs.length + childFlows.length;
  };

  // 获取面包屑层级路径
  const getArchBreadcrumbs = (archId: string): any[] => {
    const crumbs: any[] = [];
    let curId: string | null = archId;
    while (curId) {
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

  // 左侧架构树递归渲染：仅展示已发布或审批通过的架构与流程
  const renderArchNode = (arch: any, depth = 0): React.ReactNode => {
    const childArchs = publishedArchs.filter((a) => a.parentId === arch.id);
    const childFlows = filteredActiveFlows.filter((f) => f.parentId === arch.id);
    const unifiedChildren: any[] = [
      ...childArchs.map((a, i) => ({ ...a, _nodeType: 'arch', _idx: a.sortOrder ?? i })),
      ...childFlows.map((f, i) => ({
        ...f,
        _nodeType: 'flow',
        _idx: f.sortOrder ?? childArchs.length + i,
      })),
    ].sort((a, b) => a._idx - b._idx);

    const count = countArchItems(arch.id);
    const isSel = selectedNode.type === 'arch' && selectedNode.id === arch.id;
    const isCollapsed = !!collapsedArchIds[arch.id];

    return (
      <div key={arch.id} className="select-none">
        <div
          onClick={() => {
            setSelectedNode({ type: 'arch', id: arch.id });
            setArchTab('arch'); // 默认展示架构键盘图
          }}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
          className={`group flex items-center justify-between pr-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
            isSel
              ? 'bg-[#409eff] text-white font-medium shadow-xs'
              : 'text-[#303133] hover:bg-[#ecf5ff]'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {unifiedChildren.length > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCollapsedArchIds((prev) => ({ ...prev, [arch.id]: !prev[arch.id] }));
                }}
                className={`w-4 h-4 flex items-center justify-center shrink-0 cursor-pointer ${
                  isSel ? 'text-white' : 'text-[#909399] hover:text-[#409eff]'
                }`}
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
            <Network
              className={`w-3.5 h-3.5 shrink-0 ${isSel ? 'text-white' : 'text-[#409eff]'}`}
            />
            <span className="truncate">{arch.label}</span>
            <span
              className={`font-mono-tabular shrink-0 ml-0.5 text-[11px] ${
                isSel ? 'text-white/90' : 'text-[#909399]'
              }`}
            >
              ({count})
            </span>
          </div>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 ml-1 ${
              isSel ? 'bg-white/20 text-white' : 'bg-[#f0f2f5] text-[#909399]'
            }`}
          >
            {arch.level || 'L1'}
          </span>
        </div>

        {!isCollapsed &&
          unifiedChildren.map((child) => {
            if (child._nodeType === 'arch') {
              return renderArchNode(child, depth + 1);
            }
            const fl = child;
            const isFlowSel = selectedNode.type === 'flow' && selectedNode.id === fl.id;
            const hasPendingRepeal = fl.repealApplyStatus === '待审核';

            return (
              <div
                key={fl.id}
                onClick={() => {
                  setSelectedNode({ type: 'flow', id: fl.id });
                  setFlowTab('flow');
                }}
                style={{ paddingLeft: `${26 + depth * 14}px` }}
                className={`group flex items-center justify-between pr-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                  isFlowSel
                    ? 'bg-[#5b8fd9] text-white font-medium shadow-xs'
                    : 'text-[#303133] hover:bg-[#ecf5ff]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <GitBranch
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isFlowSel ? 'text-white' : 'text-[#409eff]'
                    }`}
                  />
                  <span className="truncate">{fl.label}</span>
                  {hasPendingRepeal && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] shrink-0 ${
                        isFlowSel
                          ? 'bg-white/25 text-white'
                          : 'bg-[#fdf6ec] text-[#e6a23c] border border-[#f5dab1]'
                      }`}
                    >
                      废止审核中
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    isFlowSel ? 'text-white/80' : 'text-[#909399]'
                  }`}
                >
                  {fl.flowLevel || 'L3'}
                </span>
              </div>
            );
          })}
      </div>
    );
  };

  const rootArch = publishedArchs.find((a) => !a.parentId) || publishedArchs[0] || archList[0];
  const parsedNodeRows = useMemo(() => parseFlowNodes(currentFlow?.xml || ''), [currentFlow?.xml]);

  // 当前架构层级下的直接子架构与已发布流程
  const directChildArchs = useMemo(() => {
    if (!currentArch) return [];
    return publishedArchs.filter((a) => a.parentId === currentArch.id);
  }, [currentArch, publishedArchs]);

  const directChildFlows = useMemo(() => {
    if (!currentArch) return [];
    return filteredActiveFlows.filter((f) => f.parentId === currentArch.id);
  }, [currentArch, filteredActiveFlows]);

  const breadcrumbs = useMemo(() => {
    if (!currentArch) return [];
    return getArchBreadcrumbs(currentArch.id);
  }, [currentArch, archList]);

  return (
    <div className="h-[calc(100vh-88px)] flex flex-col gap-3 min-h-0 overflow-hidden select-none">
      {/* Top Search Card */}
      <div className="bg-white rounded border border-[#ebeef5] px-5 py-3 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs">
          <div className="flex items-center gap-2">
            <label className="text-[#606266] font-medium whitespace-nowrap">架构名称</label>
            <input
              type="text"
              value={filterArchName}
              onChange={(e) => setFilterArchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="请输入架构名称"
              className="h-8 w-36 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] text-[#303133] placeholder-[#c0c4cc] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[#606266] font-medium whitespace-nowrap">流程名称</label>
            <input
              type="text"
              value={filterFlowName}
              onChange={(e) => setFilterFlowName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="请输入流程名称"
              className="h-8 w-36 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] text-[#303133] placeholder-[#c0c4cc] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[#606266] font-medium whitespace-nowrap">流程编号</label>
            <input
              type="text"
              value={filterFlowCode}
              onChange={(e) => setFilterFlowCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="请输入流程编号"
              className="h-8 w-36 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] text-[#303133] placeholder-[#c0c4cc] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[#606266] font-medium whitespace-nowrap">发布时间</label>
            <div className="h-8 px-2.5 rounded border border-[#dcdfe6] flex items-center gap-1.5 bg-white focus-within:border-[#409eff]">
              <Clock className="w-3.5 h-3.5 text-[#c0c4cc] shrink-0" />
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-28 text-xs text-[#606266] outline-none bg-transparent"
              />
              <span className="text-[#606266]">至</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-28 text-xs text-[#606266] outline-none bg-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[#606266] font-medium whitespace-nowrap">责任人</label>
            <input
              type="text"
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="请输入责任人"
              className="h-8 w-36 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] text-[#303133] placeholder-[#c0c4cc] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSearch}
              className="h-8 px-4 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>查询</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="h-8 px-4 rounded border border-[#b3d8ff] bg-[#ecf5ff] hover:bg-[#d9ecff] text-[#409eff] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Tree Column */}
        <div
          style={{ width: treeCollapsed ? '48px' : `${treeWidth}px` }}
          className="bg-white rounded border border-[#ebeef5] flex flex-col h-full min-h-0 shrink-0 relative transition-[width] duration-150"
        >
          <div className="px-3.5 py-3 border-b border-[#ebeef5] flex items-center justify-between shrink-0 bg-[#fafafa]">
            {!treeCollapsed && (
              <div className="flex items-center gap-1.5">
                <FolderTree className="w-4 h-4 text-[#409eff]" />
                <span className="text-xs font-semibold text-[#1f2733]">流程资产发布架构树</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setTreeCollapsed(!treeCollapsed)}
              className="p-1 rounded hover:bg-[#ecf5ff] text-[#606266] hover:text-[#409eff] cursor-pointer transition-colors ml-auto"
              title={treeCollapsed ? '展开架构树' : '收起架构树'}
            >
              {treeCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>
          {!treeCollapsed && (
            <div className="flex-1 overflow-y-auto overflow-x-auto p-2 space-y-0.5">
              {rootArch ? (
                renderArchNode(rootArch, 0)
              ) : (
                <div className="p-4 text-center text-xs text-[#909399]">暂无已发布架构</div>
              )}
            </div>
          )}
        </div>

        {!treeCollapsed ? (
          <div
            onMouseDown={handleStartResizeTree}
            title="按住拖拽调整架构树宽度"
            className="w-3 shrink-0 cursor-col-resize flex items-center justify-center group select-none"
          >
            <div
              className={`w-[2px] h-16 rounded-full transition-colors ${
                isResizingTree
                  ? 'bg-[#409eff] h-full'
                  : 'bg-[#dcdfe6] group-hover:bg-[#409eff] group-hover:h-32'
              }`}
            />
          </div>
        ) : (
          <div className="w-3 shrink-0" />
        )}

        {/* Right Detail Panel */}
        <div className="flex-1 bg-white rounded border border-[#ebeef5] flex flex-col h-full min-h-0 overflow-hidden shadow-2xs">
          {/* ============================================================== */}
          {/* 情况 A：当前选中的是 业务流程 (selectedNode.type === 'flow') */}
          {/* ============================================================== */}
          {selectedNode.type === 'flow' && currentFlow ? (
            <>
              {/* Process Header */}
              <div className="px-5 py-3 flex items-center justify-between shrink-0 border-b border-[#ebeef5] bg-[#fafafa]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-[#ecf5ff] text-[#409eff] flex items-center justify-center shrink-0">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#1f2733] truncate">
                        {currentFlow.label}
                      </span>
                      <span className="px-2 py-0.5 rounded font-mono-tabular font-semibold text-[11px] bg-white border border-[#dcdfe6] text-[#606266]">
                        {currentFlow.flowNo}
                      </span>
                      <span className="px-2 py-0.5 rounded font-mono-tabular font-bold text-[11px] bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff]">
                        {currentFlow.versionNo || 'V1'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        已发布生效
                      </span>
                      {currentFlow.repealApplyStatus === '待审核' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#fdf6ec] border border-[#f5dab1] text-[#e6a23c] text-xs font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          废止审核中
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#909399] mt-0.5 truncate">
                      所属架构：{currentFlow.archName || '主干流程'} · 责任人：{currentFlow.ownerName || '系统管理员'} · 发布时间：{currentFlow.publishTime || '-'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenHistory(false, currentFlow.id)}
                    className="h-8 px-3.5 rounded border border-[#b3d8ff] bg-[#ecf5ff] hover:bg-[#409eff] text-[#409eff] hover:text-white text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    <span>版本历史</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openRepealModalForFlow(currentFlow, 'suggest')}
                    className="h-8 px-3.5 rounded border border-[#f5dab1] bg-[#fdf6ec] hover:bg-[#e6a23c] text-[#e6a23c] hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <FileWarning className="w-3.5 h-3.5" />
                    <span>建议废止</span>
                  </button>
                </div>
              </div>

              {/* Process Sub-tabs */}
              <div className="px-5 border-b border-[#ebeef5] flex items-center gap-7 text-xs font-medium shrink-0 overflow-x-auto bg-white">
                {[
                  { key: 'flow', label: '流程图' },
                  { key: 'jbzl', label: '流程基本资料' },
                  { key: 'jxzb', label: '流程绩效指标' },
                  { key: 'zdwj', label: '制度文件' },
                  { key: 'fxhg', label: '风险合规' },
                  { key: 'lcsy', label: '流程术语' },
                  { key: 'xgfj', label: '相关附件' },
                  { key: 'lcjdmx', label: '流程节点明细' },
                  { key: 'lczxqk', label: '流程执行情况' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFlowTab(t.key as any)}
                    className={`py-2.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                      flowTab === t.key
                        ? 'border-[#409eff] text-[#409eff] font-semibold'
                        : 'border-transparent text-[#606266] hover:text-[#409eff]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Process Tab Contents */}
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto relative">
                {!['flow', 'jbzl'].includes(flowTab) && currentFlow && (
                  <FlowPageStandardHeader
                    archName={getArchHierarchyPath(currentFlow.id, true, archList, flowList)}
                    name={currentFlow.label}
                    nameLabel="流程名称"
                    deptName={currentFlow.deptName || currentFlow.applicableScope}
                    ownerName={currentFlow.ownerName || '流程管理员(E0002)'}
                    collaborators={currentFlow.collaborators}
                    applicableScope={
                      currentFlow.applicableScope ||
                      currentFlow.adaptScope ||
                      currentFlow.deptName ||
                      '系统管理部,流程管理部,权责管理部'
                    }
                  />
                )}
                {flowTab === 'flow' && (
                  <div className="flex-1 relative min-h-[420px] flex flex-col bg-[#fcfcfd]">
                    <div className="absolute right-4 top-3 z-20 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => previewBridgeRef.current?.fit()}
                        className="w-7 h-7 rounded border border-[#b3d8ff] bg-[#ecf5ff] hover:bg-[#409eff] text-[#409eff] hover:text-white flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                        title="自适应画布"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => previewBridgeRef.current?.zoomOut()}
                        className="w-7 h-7 rounded border border-[#b3d8ff] bg-[#ecf5ff] hover:bg-[#409eff] text-[#409eff] hover:text-white flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                        title="缩小"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => previewBridgeRef.current?.zoomIn()}
                        className="w-7 h-7 rounded border border-[#b3d8ff] bg-[#ecf5ff] hover:bg-[#409eff] text-[#409eff] hover:text-white flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                        title="放大"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <iframe
                      ref={previewIframeRef}
                      title="流程图预览"
                      src="/drawio/index.html?embed=1&proto=json&ui=min&lang=zh&dflowReadOnly=1&modified=0"
                      className="w-full flex-1 border-0 block"
                    />
                  </div>
                )}

                {flowTab === 'jbzl' && currentFlow && (
                  <UnifiedCardDetailView
                    type="flow"
                    data={currentFlow}
                    archList={archList}
                    flowList={flowList}
                    currentUser={currentUser}
                    onSave={async (updated) => {
                      setCurrentFlow(updated);
                      setFlowList((prev) =>
                        prev.map((f) => (f.id === updated.id ? { ...f, ...updated } : f))
                      );
                      await fetch('/api/flow/model/full', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updated),
                      });
                      showToast('流程基本资料保存成功', 'success');
                    }}
                    showToast={showToast}
                  />
                )}

                {flowTab === 'jxzb' && (
                  <div className="px-5 pb-5 max-w-4xl space-y-4 text-xs">
                    <div className="bg-[#f0f9eb]/50 p-4 rounded-lg border border-[#e1f3d8] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#67c23a]" />
                        <span className="font-semibold text-[#1f2733]">业务绩效考核指标已纳入企业数字化运营看板</span>
                      </div>
                      <span className="text-xs text-[#67c23a] font-mono-tabular font-bold">目标达成率 95%+</span>
                    </div>
                    <div className="border border-[#ebeef5] rounded overflow-hidden bg-white shadow-2xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#fafafa] border-b border-[#ebeef5] text-[#606266]">
                            <th className="py-2.5 px-4">指标编码</th>
                            <th className="py-2.5 px-4">指标名称</th>
                            <th className="py-2.5 px-4">目标值</th>
                            <th className="py-2.5 px-4">考核周期</th>
                            <th className="py-2.5 px-4">衡量单位</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ebeef5]">
                          <tr>
                            <td className="py-2.5 px-4 font-mono-tabular text-[#409eff]">KPI-01</td>
                            <td className="py-2.5 px-4 font-medium text-[#1f2733]">流程平均流转周期</td>
                            <td className="py-2.5 px-4 text-[#67c23a] font-semibold">&le; 24h</td>
                            <td className="py-2.5 px-4 text-[#606266]">月度</td>
                            <td className="py-2.5 px-4 text-[#606266]">小时</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-mono-tabular text-[#409eff]">KPI-02</td>
                            <td className="py-2.5 px-4 font-medium text-[#1f2733]">关键控制点(KCP)合规率</td>
                            <td className="py-2.5 px-4 text-[#67c23a] font-semibold">100%</td>
                            <td className="py-2.5 px-4 text-[#606266]">季度</td>
                            <td className="py-2.5 px-4 text-[#606266]">百分比</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {['zdwj', 'fxhg', 'lcsy', 'xgfj'].includes(flowTab) && (() => {
                  const boundItems = resolveBoundItems(flowTab as any, flowRefs);
                  return (
                    <div className="px-5 pb-5 space-y-3 text-xs">
                      <div className="flex items-center justify-between text-[#606266] pb-2 border-b border-[#ebeef5]">
                        <span className="font-semibold text-[#1f2733]">
                          已关联生效的
                          {flowTab === 'zdwj'
                            ? '制度文件规范'
                            : flowTab === 'fxhg'
                            ? '风险合规控制条款'
                            : flowTab === 'lcsy'
                            ? '流程标准化术语'
                            : '附件材料'}
                          （{boundItems.length} 项）
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {boundItems.length === 0 ? (
                          <div className="col-span-2 p-8 text-center text-xs text-[#909399] bg-[#fafafa] rounded border border-dashed border-[#dcdfe6]">
                            暂未关联相关业务条目
                          </div>
                        ) : (
                          boundItems.map((item: any) => {
                            const isDoc = flowTab === 'zdwj' || flowTab === 'xgfj';
                            return (
                              <div
                                key={item.id}
                                className="p-3 bg-white rounded-lg border border-[#ebeef5] hover:border-[#409eff] shadow-2xs flex items-center justify-between gap-3 group transition-all"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono-tabular text-[11px] font-semibold text-[#409eff]">
                                      {item.docNo || item.riskNo || item.code || item.attNo || 'ITEM'}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded bg-[#f0f9eb] text-[#67c23a] text-[10px] font-medium border border-[#e1f3d8]">
                                      已生效
                                    </span>
                                  </div>
                                  <div className="font-semibold text-xs text-[#1f2733] truncate group-hover:text-[#409eff]">
                                    {item.label || item.termName || item.name}
                                  </div>
                                  {item.validityPeriod && (
                                    <div className="text-[11px] text-[#909399] mt-0.5 truncate">
                                      有效期：{item.validityPeriod}
                                    </div>
                                  )}
                                </div>
                                {isDoc && (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setOnlinePreviewDoc(item)}
                                      className="h-7 px-2.5 rounded bg-[#ecf5ff] hover:bg-[#409eff] text-[#409eff] hover:text-white border border-[#b3d8ff] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                      title="在线预览文档"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>预览</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => downloadDocumentFile(item, showToast)}
                                      className="h-7 px-2.5 rounded bg-white hover:bg-[#67c23a] text-[#606266] hover:text-white border border-[#dcdfe6] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                      title="下载文件"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>下载</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}

                {flowTab === 'lcjdmx' && (
                  <div className="px-5 pb-5">
                    <EnterpriseDataGrid
                      storageKey="dflow_property_node_raci_grid"
                      columns={[
                        {
                          key: 'serialNo',
                          label: '序号',
                          defaultWidth: 95,
                          minWidth: 70,
                          align: 'center',
                          fixed: 'left',
                          render: (row) => (
                            <span className="font-mono-tabular font-semibold">{row.serialNo}</span>
                          ),
                        },
                        {
                          key: 'name',
                          label: '活动节点',
                          defaultWidth: 185,
                          minWidth: 120,
                          align: 'left',
                          fixed: 'left',
                          render: (row) => (
                            <span className="font-medium text-[#1f2733]">{row.name}</span>
                          ),
                        },
                        {
                          key: 'raciR',
                          label: '执行角色 (R)',
                          defaultWidth: 140,
                          minWidth: 95,
                          align: 'center',
                          render: (row) => (
                            <span className="text-[#409eff] font-medium">
                              {row.raciR || row.roles}
                            </span>
                          ),
                        },
                        {
                          key: 'raciA',
                          label: '终审人 (A)',
                          defaultWidth: 140,
                          minWidth: 95,
                          align: 'center',
                          render: (row) => (
                            <span className="text-[#f56c6c] font-medium">{row.raciA}</span>
                          ),
                        },
                        {
                          key: 'out',
                          label: '产出交付物',
                          defaultWidth: 180,
                          minWidth: 110,
                          align: 'left',
                          render: (row) => <span className="text-[#409eff]">{row.out}</span>,
                        },
                      ]}
                      data={parsedNodeRows}
                      rowKey={(r) => String(r.id)}
                      maxHeight="calc(100vh - 330px)"
                    />
                  </div>
                )}

                {flowTab === 'lczxqk' && currentFlow && (
                  <div className="px-5 pb-5 space-y-4 text-xs">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-3.5 rounded-lg border border-[#e4e7ed] bg-[#f8fafc]">
                        <div className="text-[#909399] mb-1">历史累计运行</div>
                        <div className="text-xl font-bold font-mono-tabular text-[#303133]">
                          {currentFlow.runCount || 128} <span className="text-xs font-normal text-[#909399]">次</span>
                        </div>
                      </div>
                      <div className="p-3.5 rounded-lg border border-[#d9ecff] bg-[#ecf5ff]/40">
                        <div className="text-[#409eff] mb-1">平均处理周期</div>
                        <div className="text-xl font-bold font-mono-tabular text-[#409eff]">
                          2.4 <span className="text-xs font-normal text-[#909399]">天</span>
                        </div>
                      </div>
                      <div className="p-3.5 rounded-lg border border-[#e1f3d8] bg-[#f0f9eb]/40">
                        <div className="text-[#67c23a] mb-1">按期办结率</div>
                        <div className="text-xl font-bold font-mono-tabular text-[#67c23a]">
                          98.2 <span className="text-xs font-normal text-[#909399]">%</span>
                        </div>
                      </div>
                      <div className="p-3.5 rounded-lg border border-[#faecd8] bg-[#fdf6ec]/40">
                        <div className="text-[#e6a23c] mb-1">活跃实例数</div>
                        <div className="text-xl font-bold font-mono-tabular text-[#e6a23c]">
                          3 <span className="text-xs font-normal text-[#909399]">个</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-[#ebeef5] rounded-lg overflow-hidden bg-white shadow-2xs">
                      <div className="px-4 py-2.5 bg-[#fafafa] border-b border-[#ebeef5] font-semibold text-xs text-[#303133] flex items-center justify-between">
                        <span>近期运行实例明细</span>
                        <span className="text-[11px] text-[#909399]">实时同步企业协同引擎</span>
                      </div>
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#f8fafc] border-b border-[#ebeef5] text-[#909399]">
                            <th className="py-2.5 px-3">流水号</th>
                            <th className="py-2.5 px-3">发起人</th>
                            <th className="py-2.5 px-3">发起部门</th>
                            <th className="py-2.5 px-3">当前节点</th>
                            <th className="py-2.5 px-3">启动时间</th>
                            <th className="py-2.5 px-3 text-center">执行状态</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ebeef5]">
                          {[
                            {
                              no: 'INST-20260320-001',
                              user: '李晓明',
                              dept: '结构开发部',
                              node: '技术方案终审',
                              time: '2026-03-20 09:15',
                              status: '处理中',
                              sColor: 'text-[#e6a23c] bg-[#fdf6ec] border-[#faecd8]',
                            },
                            {
                              no: 'INST-20260319-042',
                              user: '张伟',
                              dept: '研发中心',
                              node: '归档备案',
                              time: '2026-03-19 14:22',
                              status: '已完成',
                              sColor: 'text-[#67c23a] bg-[#f0f9eb] border-[#e1f3d8]',
                            },
                            {
                              no: 'INST-20260318-019',
                              user: '王晓华',
                              dept: '质量保证部',
                              node: '标准复核',
                              time: '2026-03-18 11:05',
                              status: '已完成',
                              sColor: 'text-[#67c23a] bg-[#f0f9eb] border-[#e1f3d8]',
                            },
                          ].map((inst) => (
                            <tr key={inst.no} className="hover:bg-[#f5f7fa]">
                              <td className="py-2.5 px-3 font-mono-tabular text-[#409eff] font-medium">
                                {inst.no}
                              </td>
                              <td className="py-2.5 px-3 text-[#303133]">{inst.user}</td>
                              <td className="py-2.5 px-3 text-[#606266]">{inst.dept}</td>
                              <td className="py-2.5 px-3 font-medium text-[#303133]">
                                {inst.node}
                              </td>
                              <td className="py-2.5 px-3 text-[#909399] font-mono-tabular">
                                {inst.time}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded text-[11px] border font-medium ${inst.sColor}`}
                                >
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
          ) : selectedNode.type === 'arch' && currentArch ? (
            /* ============================================================== */
            /* 情况 B：当前选中的是 架构节点 (selectedNode.type === 'arch')     */
            /* 按照设计图显示的页面布局进行展示，支持架构键盘图与向下穿透      */
            /* ============================================================== */
            <>
              {/* Architecture Header */}
              <div className="px-5 py-3 flex items-center justify-between shrink-0 border-b border-[#ebeef5] bg-[#fafafa]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#409eff] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {currentArch.level || 'L1'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#1f2733] truncate">
                        {currentArch.label}
                      </span>
                      <span className="px-2 py-0.5 rounded font-mono-tabular font-semibold text-[11px] bg-white border border-[#dcdfe6] text-[#606266]">
                        {currentArch.archNo || 'ARCH-001'}
                      </span>
                      <span className="px-2 py-0.5 rounded font-mono-tabular font-bold text-[11px] bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff]">
                        {currentArch.versionNo || 'V1'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        已发布生效
                      </span>
                    </div>
                    <div className="text-[11px] text-[#909399] mt-0.5 truncate flex items-center gap-3">
                      <span>归口部门：{currentArch.deptName || '运营管理部'}</span>
                      <span>•</span>
                      <span>负责人：{currentArch.ownerName || '系统管理员'}</span>
                      <span>•</span>
                      <span>发布时间：{currentArch.publishTime || '2026-03-20'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenHistory(true, currentArch.id)}
                    className="h-8 px-3.5 rounded border border-[#b3d8ff] bg-[#ecf5ff] hover:bg-[#409eff] text-[#409eff] hover:text-white text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs font-medium"
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    <span>版本历史</span>
                  </button>
                </div>
              </div>

              {/* Architecture Sub-tabs：更名为「架构键盘图」 */}
              <div className="px-5 border-b border-[#ebeef5] flex items-center gap-7 text-xs font-medium shrink-0 overflow-x-auto bg-white">
                {[
                  { key: 'arch', label: '架构键盘图' },
                  { key: 'typecard', label: '架构卡片' },
                  { key: 'zdwj', label: '制度文件' },
                  { key: 'fxhg', label: '风险合规' },
                  { key: 'xgfj', label: '相关附件' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setArchTab(t.key as any)}
                    className={`py-2.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                      archTab === t.key
                        ? 'border-[#409eff] text-[#409eff] font-semibold'
                        : 'border-transparent text-[#606266] hover:text-[#409eff]'
                    }`}
                  >
                    {t.key === 'arch' && <Layers className="w-3.5 h-3.5" />}
                    {t.key === 'typecard' && <FileText className="w-3.5 h-3.5" />}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Architecture Tab Contents */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {['zdwj', 'fxhg', 'xgfj'].includes(archTab) && currentArch && (
                  <FlowPageStandardHeader
                    className="mx-0 mt-0 mb-4"
                    archName={getArchHierarchyPath(currentArch.id, false, archList, flowList)}
                    name={currentArch.label}
                    nameLabel="架构名称"
                    deptName={currentArch.deptName || currentArch.applicableScope}
                    ownerName={currentArch.ownerName || '流程管理员(E0002)'}
                    collaborators={currentArch.collaborators}
                    applicableScope={
                      currentArch.applicableScope ||
                      currentArch.adaptScope ||
                      currentArch.deptName ||
                      '系统管理部,流程管理部,权责管理部'
                    }
                  />
                )}
                {/* ============================================================== */}
                {/* 1. 架构键盘图 (Architecture Keyboard Diagram & 向下穿透) */}
                {/* ============================================================== */}
                {archTab === 'arch' && (
                  <div className="space-y-4">
                    {/* 面包屑导航与快速层级穿透控制 */}
                    <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="text-[#909399] font-medium flex items-center gap-1">
                          <Network className="w-3.5 h-3.5 text-[#409eff]" />
                          架构定位：
                        </span>
                        {breadcrumbs.map((crumb, idx) => {
                          const isLast = idx === breadcrumbs.length - 1;
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
                                {crumb.label} ({crumb.level || 'L' + idx})
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
                            {currentArch.level || 'L1'} · 架构键盘图
                          </span>
                          <h2 className="text-base font-bold tracking-tight">{currentArch.label}</h2>
                        </div>
                        <div className="text-xs bg-white/15 px-3 py-1 rounded-full border border-white/20 font-medium">
                          下属包含 <strong>{directChildArchs.length}</strong> 个子架构 · <strong>{directChildFlows.length}</strong> 个已发布业务流程
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
                            // 统计子架构下的流程
                            const subFlows = filteredActiveFlows.filter((f) => f.parentId === childArch.id);
                            const subChildArchs = publishedArchs.filter((a) => a.parentId === childArch.id);

                            return (
                              <div
                                key={childArch.id}
                                onClick={() => {
                                  setSelectedNode({ type: 'arch', id: childArch.id });
                                  setArchTab('arch');
                                  showToast(`已向下穿透至【${childArch.label}】`, 'success');
                                }}
                                className={`rounded-xl border ${palette.cardBorder} ${palette.cardBg} ${palette.cardHoverBorder} ${palette.ringColor} p-4 flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 group shadow-2xs hover:shadow-md relative overflow-hidden`}
                              >
                                <div className="space-y-2.5">
                                  {/* Card Header */}
                                  <div className="flex items-center justify-between gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] font-bold border font-mono ${palette.badgeBg} ${palette.badgeText} ${palette.badgeBorder}`}
                                    >
                                      {childArch.level || 'L2'}
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
                    {/* 键盘图矩阵 B：直属已发布业务流程文件清单 (彩色卡片，支持向下穿透) */}
                    {/* ============================================================== */}
                    {directChildFlows.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#1f2733] flex items-center gap-1.5">
                            <GitBranch className="w-4 h-4 text-[#409eff]" />
                            直属已发布业务流程（点击文件卡片向下穿透打开流程视图）
                          </span>
                          <span className="text-[#909399]">共 {directChildFlows.length} 个发布流程</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {directChildFlows.map((fl, idx) => {
                            const palette = ARCH_PALETTES[(idx + 2) % ARCH_PALETTES.length];
                            return (
                              <div
                                key={fl.id}
                                onClick={() => {
                                  setSelectedNode({ type: 'flow', id: fl.id });
                                  setFlowTab('flow');
                                  showToast(`已向下穿透进入流程【${fl.label}】`, 'success');
                                }}
                                className={`rounded-lg border border-[#e2e8f0] bg-white hover:border-[#409eff] p-3.5 flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 group shadow-2xs hover:shadow-md hover:ring-2 hover:ring-[#409eff]/15`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-1.5 py-0.2 rounded text-[10.5px] font-mono font-bold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
                                        {fl.flowLevel || 'L3'}
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
                                    <span>发布：{fl.publishTime ? fl.publishTime.slice(0, 10) : '近期'}</span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
                                  <span className="inline-flex items-center gap-1 text-[11px] text-[#67c23a] font-medium">
                                    <CheckCircle2 className="w-3 h-3" />
                                    已审核发布
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

                    {/* 若无子架构且无直属流程 */}
                    {directChildArchs.length === 0 && directChildFlows.length === 0 && (
                      <div className="p-12 text-center text-xs text-[#909399] bg-[#fafbfc] rounded-xl border border-dashed border-[#dcdfe6] space-y-2">
                        <Folder className="w-8 h-8 text-[#c0c4cc] mx-auto" />
                        <div className="font-medium text-[#606266]">当前架构节点下暂未录入已发布的子架构或流程</div>
                        <p className="text-[11px] text-[#909399]">请在「流程构建」模块完成设计并直接发布或审批通过后生效展示</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ============================================================== */}
                {/* 2. 架构卡片 (Architecture Properties Specification Table)        */}
                {/* ============================================================== */}
                {archTab === 'typecard' && currentArch && (
                  <UnifiedCardDetailView
                    type="arch"
                    data={currentArch}
                    archList={archList}
                    flowList={flowList}
                    currentUser={currentUser}
                    onSave={async (updated) => {
                      setCurrentArch(updated);
                      setArchList((prev) =>
                        prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
                      );
                      await fetch('/api/flow/type/full', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updated),
                      });
                      showToast('架构卡片保存成功', 'success');
                    }}
                    showToast={showToast}
                  />
                )}

                {['zdwj', 'fxhg', 'xgfj'].includes(archTab) && (() => {
                  const currentTab = archTab as 'zdwj' | 'fxhg' | 'xgfj';
                  const boundItems = resolveBoundItems(currentTab, archRefs);
                  return (
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center justify-between text-[#606266] pb-2 border-b border-[#ebeef5]">
                        <span className="font-semibold text-[#1f2733]">
                          架构关联已生效的
                          {currentTab === 'zdwj'
                            ? '制度文件库'
                            : currentTab === 'fxhg'
                            ? '风险合规条款'
                            : '相关附件'}
                          （{boundItems.length} 项）
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {boundItems.length === 0 ? (
                          <div className="col-span-2 p-10 text-center text-xs text-[#909399] bg-[#fafafa] rounded-lg border border-dashed border-[#dcdfe6]">
                            当前架构暂未关联对应条目
                          </div>
                        ) : (
                          boundItems.map((item: any) => {
                            const isDoc = currentTab === 'zdwj' || currentTab === 'xgfj';
                            return (
                              <div
                                key={item.id}
                                className="p-3.5 bg-white rounded-lg border border-[#ebeef5] hover:border-[#409eff] shadow-2xs flex items-center justify-between gap-3 group transition-all"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono-tabular text-[11px] font-semibold text-[#409eff]">
                                      {item.docNo || item.riskNo || item.attNo || 'DOC-001'}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded bg-[#f0f9eb] text-[#67c23a] text-[10px] font-medium border border-[#e1f3d8]">
                                      已生效
                                    </span>
                                  </div>
                                  <div className="font-semibold text-xs text-[#1f2733] truncate group-hover:text-[#409eff]">
                                    {item.label || item.name}
                                  </div>
                                  {item.validityPeriod && (
                                    <div className="text-[11px] text-[#909399] mt-0.5 truncate">
                                      有效期：{item.validityPeriod}
                                    </div>
                                  )}
                                </div>
                                {isDoc && (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setOnlinePreviewDoc(item)}
                                      className="h-7 px-2.5 rounded bg-[#ecf5ff] hover:bg-[#409eff] text-[#409eff] hover:text-white border border-[#b3d8ff] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                      title="在线预览文档"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>预览</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => downloadDocumentFile(item, showToast)}
                                      className="h-7 px-2.5 rounded bg-white hover:bg-[#67c23a] text-[#606266] hover:text-white border border-[#dcdfe6] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                      title="自动下载文件"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>下载</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-xs text-[#909399] space-y-2">
              <Network className="w-10 h-10 text-[#dcdfe6]" />
              <span>请在左侧架构树选择已发布的流程或架构节点查看资产全景</span>
            </div>
          )}
        </div>
      </div>

      {/* Online Document Preview Modal */}
      {onlinePreviewDoc && (
        <OnlineDocumentPreviewModal
          document={onlinePreviewDoc}
          onClose={() => setOnlinePreviewDoc(null)}
          showToast={showToast}
        />
      )}

      {/* History Modal */}
      {historyModal.open && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl border border-[#ebeef5] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-[#409eff]" />
                <span className="text-sm font-bold text-[#1f2733]">{historyModal.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModal({ open: false, title: '', rows: [] })}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex-1 min-h-0 overflow-y-auto text-xs">
              <div className="border border-[#ebeef5] rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#ebeef5] text-[#606266]">
                      <th className="py-2.5 px-3">版本号</th>
                      <th className="py-2.5 px-3">发布时间</th>
                      <th className="py-2.5 px-3">发布人</th>
                      <th className="py-2.5 px-3">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebeef5]">
                    {historyModal.rows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-[#909399]">
                          暂无历史发布记录
                        </td>
                      </tr>
                    ) : (
                      historyModal.rows.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-[#f9fafc]">
                          <td className="py-2.5 px-3 font-mono-tabular font-bold text-[#409eff]">
                            {r.versionNo || 'V1'}
                          </td>
                          <td className="py-2.5 px-3 font-mono-tabular text-[#606266]">
                            {r.publishTime || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-[#303133]">{r.publishUserName || '系统管理员'}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8] text-[10.5px]">
                              ● 已生效
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setHistoryModal({ open: false, title: '', rows: [] })}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] hover:border-[#409eff] cursor-pointer shadow-2xs"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repeal Modal */}
      {repealModal.open && repealModal.flow && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-[490px] shadow-2xl border border-[#ebeef5] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <span className="text-sm font-bold text-[#1f2733]">
                {repealModal.applyMode === 'direct' ? '正式废止流程' : '申请建议废止流程'}
              </span>
              <button
                type="button"
                onClick={() => setRepealModal((prev) => ({ ...prev, open: false }))}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1 min-h-0">
              <div className="p-3 bg-[#fdf6ec] border border-[#faecd8] rounded text-[#e6a23c] leading-relaxed">
                确定要对已发布的流程【<strong>{repealModal.flow.label}</strong>】提交废止处理吗？
              </div>
              <div>
                <label className="block text-[#606266] mb-1 font-medium">废止原因说明</label>
                <textarea
                  rows={3}
                  value={repealModal.reason}
                  onChange={(e) =>
                    setRepealModal((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="请输入废止理由..."
                  className="w-full p-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] text-[#303133] outline-none resize-none"
                />
              </div>
            </div>
            <div className="px-5 py-3 flex items-center justify-end gap-2 bg-[#fafafa] border-t border-[#ebeef5] shrink-0">
              <button
                type="button"
                onClick={() => setRepealModal((prev) => ({ ...prev, open: false }))}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-xs text-[#606266] cursor-pointer shadow-2xs"
              >
                取消
              </button>
              <button
                type="button"
                disabled={repealModal.submitting}
                onClick={handleSubmitRepeal}
                className="h-8 px-4 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium cursor-pointer shadow-2xs"
              >
                {repealModal.submitting ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
