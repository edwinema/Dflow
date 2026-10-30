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

interface FlowDesignViewProps {
  initialSelectedFlowId?: string | null;
  currentUser?: any;
  onEnterDesigner: (flowId: string) => void;
  onNavigate?: (path: string) => void;
  onSelectNodeId?: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const FlowDesignView: React.FC<FlowDesignViewProps> = ({
  initialSelectedFlowId,
  currentUser,
  onEnterDesigner,
  onNavigate,
  onSelectNodeId,
  showToast,
}) => {
  const [archList, setArchList] = useState<any[]>([]);
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

  const [archTab, setArchTab] = useState<'arch' | 'ywjcst' | 'typecard' | 'zdwj' | 'fxhg' | 'xgfj'>('ywjcst');
  const [flowTab, setFlowTab] = useState<
    'flow' | 'jbzl' | 'jxzb' | 'zdwj' | 'fxhg' | 'lcsy' | 'xgfj' | 'lcjdmx' | 'lcxzh'
  >('flow');

  const [currentFlow, setCurrentFlow] = useState<any | null>(null);
  const [currentArch, setCurrentArch] = useState<any | null>(null);
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
  }>({
    open: false,
    targetType: 'flow',
    targetId: '',
    targetLabel: '',
    selectedParentId: 'arch_root',
  });

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
    position: 'before' | 'after';
  } | null>(null);

  const [importFlowModal, setImportFlowModal] = useState<{
    open: boolean;
    parentId: string;
    parentLabel: string;
    label: string;
    flowNo: string;
    fileName: string;
    xmlContent: string;
  }>({
    open: false,
    parentId: 'arch_root',
    parentLabel: '',
    label: '',
    flowNo: '',
    fileName: '',
    xmlContent: '',
  });

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
      const archs = archRes?.data || [];
      const flows = flowRes?.data || [];
      setArchList(archs);
      setFlowList(flows);
      if (dictRes?.data) setDictBundle(dictRes.data);

      const toSelect = targetId || initialSelectedFlowId;
      if (toSelect) {
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
          return;
        }
      }
      if (archs.length > 0) {
        setSelectedNode((prev) => {
          const currentValid = archs.find((a: any) => a.id === prev.id) || flows.find((f: any) => f.id === prev.id);
          if (currentValid) return prev;
          return { type: 'arch', id: archs[0].id };
        });
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
      const found = archList.find((a) => a.id === selectedNode.id);
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

  const handlePublishArch = (targetArch?: any) => {
    const archObj = targetArch || currentArch;
    if (!archObj) return;
    setConfirmModal({
      open: true,
      title: '确认发布架构',
      content: `确定要发布【${archObj.label}】吗？将生成全新架构版本。`,
      onConfirm: async () => {
        const res = await fetch('/api/flow/type/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: archObj.id }),
        }).then((r) => r.json());
        setConfirmModal((prev) => ({ ...prev, open: false }));
        showToast(`发布成功，当前版本: ${res.data?.versionNo || 'V2'}`, 'success');
        loadAllTreeData();
      },
    });
  };

  const handlePublishFlow = (audit: boolean, targetFlow?: any) => {
    const flowObj = targetFlow || currentFlow;
    if (!flowObj) return;
    setConfirmModal({
      open: true,
      title: audit ? '提交发布审核' : '直接发布流程',
      content: `确定要将流程【${flowObj.label}】${audit ? '提交合规审核' : '直接发布为生产版本'}吗？`,
      onConfirm: async () => {
        const res = await fetch('/api/flow/model/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: flowObj.id, audit }),
        }).then((r) => r.json());
        setConfirmModal((prev) => ({ ...prev, open: false }));
        showToast(`操作成功，版本升级为 ${res.data?.versionNo || 'V2'}`, 'success');
        loadAllTreeData();
      },
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

  const handleTreeNodeDrop = async (targetId: string, targetParentId: string, position: 'before' | 'after') => {
    if (!treeDragItem || treeDragItem.id === targetId) {
      setTreeDragItem(null);
      setTreeDragOver(null);
      return;
    }
    if (treeDragItem.parentId === targetParentId) {
      const siblings = buildSortItems(targetParentId, 'children', targetParentId);
      const fromIdx = siblings.findIndex((x) => x.id === treeDragItem.id);
      const toIdx = siblings.findIndex((x) => x.id === targetId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const next = [...siblings];
        const [moved] = next.splice(fromIdx, 1);
        const insertAt = position === 'before' ? toIdx : toIdx + (fromIdx < toIdx ? 0 : 1);
        next.splice(insertAt, 0, moved);
        await fetch('/api/flow/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderedItems: next.map((item) => ({ id: item.id, type: item.type })),
          }),
        });
        showToast('已调整节点排序', 'success');
        await loadAllTreeData();
      }
    }
    setTreeDragItem(null);
    setTreeDragOver(null);
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
    if (archId === candidateParentId) return true;
    let cur = archList.find((a) => a.id === candidateParentId);
    while (cur && cur.parentId) {
      if (cur.parentId === archId) return true;
      cur = archList.find((a) => a.id === cur.parentId);
    }
    return false;
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
    const isDragOverBefore = treeDragOver?.id === arch.id && treeDragOver?.position === 'before';
    const isDragOverAfter = treeDragOver?.id === arch.id && treeDragOver?.position === 'after';

    return (
      <div key={arch.id} className="select-none">
        <div
          draggable={!!arch.parentId}
          onDragStart={(e) => {
            if (!arch.parentId) return;
            e.stopPropagation();
            setTreeDragItem({ id: arch.id, type: 'arch', parentId: arch.parentId });
          }}
          onDragOver={(e) => {
            if (!treeDragItem || treeDragItem.id === arch.id || treeDragItem.parentId !== arch.parentId) return;
            e.preventDefault();
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = e.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
            setTreeDragOver({ id: arch.id, position: pos });
          }}
          onDragLeave={() => {
            if (treeDragOver?.id === arch.id) setTreeDragOver(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (arch.parentId && treeDragOver) {
              handleTreeNodeDrop(arch.id, arch.parentId, treeDragOver.position);
            }
          }}
          onDragEnd={() => {
            setTreeDragItem(null);
            setTreeDragOver(null);
          }}
          onClick={() => setSelectedNode({ type: 'arch', id: arch.id })}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpenMenuId(arch.id);
          }}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
          className={`group flex items-center justify-between pr-2 py-1.5 rounded text-xs cursor-pointer transition-colors relative ${
            isSel ? 'bg-[#ecf5ff] text-[#409eff] font-medium' : 'text-[#303133] hover:bg-[#f5f7fa]'
          } ${isDragOverBefore ? 'border-t-2 border-t-[#409eff]' : ''} ${
            isDragOverAfter ? 'border-b-2 border-b-[#409eff]' : ''
          }`}
        >
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
                    flowNo: 'FLOW-' + Math.floor(100 + Math.random() * 900),
                    fileName: '',
                    xmlContent: '',
                  });
                }}
                className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer"
              >
                导入流程
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
            const isFlDragBefore = treeDragOver?.id === fl.id && treeDragOver?.position === 'before';
            const isFlDragAfter = treeDragOver?.id === fl.id && treeDragOver?.position === 'after';

            return (
              <div
                key={fl.id}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  setTreeDragItem({ id: fl.id, type: 'flow', parentId: fl.parentId });
                }}
                onDragOver={(e) => {
                  if (!treeDragItem || treeDragItem.id === fl.id || treeDragItem.parentId !== fl.parentId) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = e.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
                  setTreeDragOver({ id: fl.id, position: pos });
                }}
                onDragLeave={() => {
                  if (treeDragOver?.id === fl.id) setTreeDragOver(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (treeDragOver) {
                    handleTreeNodeDrop(fl.id, fl.parentId, treeDragOver.position);
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
                className={`group flex items-center justify-between pr-2 py-1.5 rounded text-xs cursor-pointer transition-colors relative ${
                  isFlowSel ? 'bg-[#ecf5ff] text-[#409eff] font-medium' : 'text-[#606266] hover:bg-[#f5f7fa]'
                } ${isFlDragBefore ? 'border-t-2 border-t-[#409eff]' : ''} ${
                  isFlDragAfter ? 'border-b-2 border-b-[#409eff]' : ''
                }`}
              >
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
                        setChangeArchModal({
                          open: true,
                          targetType: 'flow',
                          targetId: fl.id,
                          targetLabel: fl.label,
                          selectedParentId: fl.parentId || 'arch_root',
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
                      className="w-full px-3.5 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] cursor-pointer"
                    >
                      发布流程
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

  const rootArch = archList.find((a) => !a.parentId) || archList[0];

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
            <div className="flex items-center gap-1.5 min-w-0">
              <Network className="w-4 h-4 text-[#409eff] shrink-0" />
              <span className="text-sm font-semibold text-[#1f2733] truncate">流程资产发布架构树</span>
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
                onClick={handlePublishArch}
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

              {archTab === 'arch' && (
                <div className="space-y-5 p-5">
                  <div className="p-4 rounded bg-[#ecf5ff] border border-[#b3d8ff] text-center max-w-xl mx-auto">
                    <div className="text-sm font-bold text-[#409eff]">{rootArch?.label}</div>
                    <div className="text-xs text-[#606266] mt-0.5">企业流程体系顶层全景视图</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {archList
                      .filter((a) => a.parentId === 'arch_root')
                      .map((l1) => {
                        const l2s = archList.filter((a) => a.parentId === l1.id);
                        return (
                          <div key={l1.id} className="rounded border border-[#ebeef5] p-4 bg-[#fafafa] space-y-3">
                            <div
                              onClick={() => setSelectedNode({ type: 'arch', id: l1.id })}
                              className="font-semibold text-xs text-[#1f2733] pb-2 border-b border-[#ebeef5] flex items-center justify-between cursor-pointer hover:text-[#409eff]"
                            >
                              <span>{l1.label}</span>
                              <span className="text-[#909399] font-mono-tabular">{l1.level}</span>
                            </div>
                            <div className="space-y-2">
                              {l2s.map((l2) => {
                                const fls = flowList.filter((f) => f.parentId === l2.id);
                                return (
                                  <div key={l2.id} className="bg-white p-2.5 rounded border border-[#ebeef5] space-y-1.5">
                                    <div className="text-xs font-medium text-[#409eff]">{l2.label}</div>
                                    {fls.map((fl) => (
                                      <button
                                        key={fl.id}
                                        onClick={() => setSelectedNode({ type: 'flow', id: fl.id })}
                                        className="w-full text-left px-2 py-1 rounded bg-[#fdf6ec] hover:bg-[#faecd8] text-[#e6a23c] text-xs flex items-center justify-between cursor-pointer"
                                      >
                                        <span className="truncate">{fl.label}</span>
                                        <span className="text-[11px] shrink-0">点击查阅</span>
                                      </button>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

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
                    <div className="text-xs text-[#606266]">
                      发布状态：
                      <span className="font-medium text-[#67c23a]">
                        {currentFlow?.status === 'draft'
                          ? '草稿未发布'
                          : currentFlow?.status === 'verified'
                          ? '审核中'
                          : '已发布'}
                      </span>
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
          <span>全源流程资产运营平台 · dflow</span>
        </div>
      </div>

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
          showToast={showToast}
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
    </div>
  );
};
