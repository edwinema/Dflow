import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PersonSelectField } from './PersonSelectField';
import {
  Folder,
  FolderOpen,
  FileText,
  ShieldAlert,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  PenLine,
  Trash2,
  X,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Eye,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  Sliders,
  Sparkles,
  Calendar,
  Download,
  FileSpreadsheet,
  Presentation,
  ExternalLink,
  Maximize2,
  Minimize2,
  Lock,
  ShieldCheck,
  AlertCircle,
  CheckSquare,
  GitFork,
  ArrowRight,
  History,
  UserCheck,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import { EnterpriseDataGrid, DataGridColumn } from './EnterpriseDataGrid';
import {
  OnlineDocumentPreviewModal,
  downloadDocumentFile,
  getDocumentFormat,
} from './OnlineDocumentPreviewModal';

export interface ApprovalLevelConfig {
  level: number;
  levelName: string;
  approverName: string;
  roleName: string;
  deptName: string;
  status?: 'pending' | 'approved' | 'rejected' | 'waiting';
  auditor?: string;
  auditRemark?: string;
  auditTime?: string;
}

export interface TreeFolderNode {
  id: string;
  parentId: string;
  label: string;
  code?: string;
}

export const getDescendantFolderIds = (tree: TreeFolderNode[], folderId: string): Set<string> => {
  const result = new Set<string>([folderId]);
  let added = true;
  while (added) {
    added = false;
    for (const node of tree) {
      if (node.parentId && result.has(node.parentId) && !result.has(node.id)) {
        result.add(node.id);
        added = true;
      }
    }
  }
  return result;
};

export const buildFolderPath = (tree: TreeFolderNode[], folderId: string): string => {
  const parts: string[] = [];
  let curr = tree.find((n) => n.id === folderId);
  while (curr && curr.parentId !== '') {
    parts.unshift(curr.label);
    curr = tree.find((n) => n.id === curr!.parentId);
  }
  return parts.join('/') || '根目录';
};

interface ApprovedTreePickerModalProps {
  open: boolean;
  mode: 'zdwj' | 'fxhg' | 'xgfj';
  title?: string;
  dictBundle: any;
  initialSelectedIds: string[];
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  onNavigateToModule?: (path: string) => void;
}

export const ApprovedTreePickerModal: React.FC<ApprovedTreePickerModalProps> = ({
  open,
  mode,
  title,
  dictBundle,
  initialSelectedIds,
  onClose,
  onConfirm,
  onNavigateToModule,
}) => {
  const isRisk = mode === 'fxhg';
  const tree: TreeFolderNode[] = isRisk
    ? dictBundle?.riskTree || []
    : dictBundle?.sysDocTree || [];
  const rootFolder = tree.find((n) => !n.parentId) || tree[0];
  const [selectedFolderId, setSelectedFolderId] = useState<string>(rootFolder?.id || '');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds || []);
  const [keyword, setKeyword] = useState('');
  const [sourceTab, setSourceTab] = useState<'sysDoc' | 'attachments'>(
    mode === 'xgfj' ? 'attachments' : 'sysDoc'
  );

  useEffect(() => {
    if (open) {
      setSelectedIds(initialSelectedIds || []);
      setKeyword('');
      const root = (isRisk ? dictBundle?.riskTree : dictBundle?.sysDocTree)?.find(
        (n: any) => !n.parentId
      );
      if (root) setSelectedFolderId(root.id);
      setSourceTab(mode === 'xgfj' ? 'attachments' : 'sysDoc');
    }
  }, [open, initialSelectedIds, isRisk, mode, dictBundle]);

  const allApprovedSysDocs: any[] = (dictBundle?.sysDoc || []).filter(
    (d: any) => (d.status || 'approved') === 'approved'
  );
  const allApprovedRisks: any[] = (dictBundle?.risk || []).filter(
    (r: any) => (r.status || 'approved') === 'approved'
  );
  const allAttachments: any[] = dictBundle?.attachments || [];

  const activeFolderSet = selectedFolderId
    ? getDescendantFolderIds(tree, selectedFolderId)
    : new Set<string>();

  const filteredItems = useMemo(() => {
    if (isRisk) {
      return allApprovedRisks.filter((r) => {
        const inFolder =
          !selectedFolderId ||
          selectedFolderId === rootFolder?.id ||
          activeFolderSet.has(r.folderId);
        const matchKw =
          !keyword.trim() ||
          r.label?.toLowerCase().includes(keyword.toLowerCase()) ||
          r.riskNo?.toLowerCase().includes(keyword.toLowerCase()) ||
          r.target?.toLowerCase().includes(keyword.toLowerCase());
        return inFolder && matchKw;
      });
    }
    if (mode === 'xgfj' && sourceTab === 'attachments') {
      return allAttachments.filter((att) => {
        return (
          !keyword.trim() ||
          att.label?.toLowerCase().includes(keyword.toLowerCase()) ||
          att.attNo?.toLowerCase().includes(keyword.toLowerCase())
        );
      });
    }
    return allApprovedSysDocs.filter((d) => {
      const inFolder =
        !selectedFolderId ||
        selectedFolderId === rootFolder?.id ||
        activeFolderSet.has(d.folderId);
      const matchKw =
        !keyword.trim() ||
        d.label?.toLowerCase().includes(keyword.toLowerCase()) ||
        d.docNo?.toLowerCase().includes(keyword.toLowerCase()) ||
        d.category?.toLowerCase().includes(keyword.toLowerCase());
      return inFolder && matchKw;
    });
  }, [
    isRisk,
    mode,
    sourceTab,
    allApprovedRisks,
    allApprovedSysDocs,
    allAttachments,
    selectedFolderId,
    rootFolder,
    activeFolderSet,
    keyword,
  ]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const renderFolderNode = (node: TreeFolderNode, depth = 0) => {
    const children = tree.filter((n) => n.parentId === node.id);
    const descSet = getDescendantFolderIds(tree, node.id);
    const count = isRisk
      ? allApprovedRisks.filter((r) => node.parentId === '' || descSet.has(r.folderId)).length
      : allApprovedSysDocs.filter((d) => node.parentId === '' || descSet.has(d.folderId)).length;
    const isSel = selectedFolderId === node.id;
    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => setSelectedFolderId(node.id)}
          style={{ paddingLeft: `${10 + depth * 14}px` }}
          className={`flex items-center justify-between pr-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors ${
            isSel
              ? 'bg-[#ecf5ff] text-[#409eff] font-medium'
              : 'text-[#303133] hover:bg-[#f5f7fa]'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {isSel ? (
              <FolderOpen className="w-3.5 h-3.5 text-[#409eff] shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-[#409eff] shrink-0" />
            )}
            <span className="truncate">{node.label}</span>
          </div>
          <span className="text-[11px] text-[#909399] font-mono-tabular shrink-0">({count})</span>
        </div>
        {children.map((ch) => renderFolderNode(ch, depth + 1))}
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl h-[85vh] max-h-[680px] shadow-2xl border border-[#ebeef5] flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between shrink-0 bg-[#fafafa]">
          <div className="flex items-center gap-2">
            {isRisk ? (
              <ShieldAlert className="w-4 h-4 text-[#e6a23c]" />
            ) : (
              <FileText className="w-4 h-4 text-[#409eff]" />
            )}
            <span className="text-sm font-semibold text-[#1f2733]">
              {title ||
                (mode === 'zdwj'
                  ? '选择制度文件'
                  : mode === 'fxhg'
                  ? '选择风险合规条款'
                  : '选择关联附件')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-2.5 border-b border-[#ebeef5] bg-[#f0f9eb]/60 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 text-[#67c23a]">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>
              已自动过滤仅显示 <strong>已审核生效</strong> 的{isRisk ? '风险合规条款' : '制度规范与附件'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'xgfj' && (
              <div className="flex items-center rounded border border-[#dcdfe6] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setSourceTab('attachments')}
                  className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                    sourceTab === 'attachments'
                      ? 'bg-[#409eff] text-white font-medium'
                      : 'text-[#606266]'
                  }`}
                >
                  流程附件库 ({allAttachments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSourceTab('sysDoc')}
                  className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                    sourceTab === 'sysDoc'
                      ? 'bg-[#409eff] text-white font-medium'
                      : 'text-[#606266]'
                  }`}
                >
                  制度文件库 ({allApprovedSysDocs.length})
                </button>
              </div>
            )}
            {onNavigateToModule && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToModule(isRisk ? '/risk/index' : '/sysdoc/index2');
                }}
                className="text-[#409eff] hover:underline font-medium cursor-pointer"
              >
                前往{isRisk ? '风险合规库' : '制度文件库'}维护 &rarr;
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {(mode !== 'xgfj' || sourceTab === 'sysDoc') && (
            <div className="w-64 border-r border-[#ebeef5] flex flex-col h-full bg-[#fcfcfd] shrink-0">
              <div className="px-3.5 py-2.5 border-b border-[#ebeef5] text-xs font-semibold text-[#1f2733] flex items-center justify-between">
                <span>{isRisk ? '风险分类树' : '制度目录树'}</span>
                <span className="text-[11px] text-[#909399] font-normal">点击切换</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {rootFolder ? renderFolderNode(rootFolder, 0) : null}
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col h-full min-w-0">
            <div className="p-3 border-b border-[#ebeef5] flex items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索名称或编号..."
                  className="w-full h-8 pl-8 pr-3 rounded border border-[#dcdfe6] focus:border-[#409eff] text-xs outline-none"
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const currentIds = filteredItems.map((x) => x.id);
                    const allChecked = currentIds.every((id) => selectedIds.includes(id));
                    if (allChecked) {
                      setSelectedIds((prev) => prev.filter((id) => !currentIds.includes(id)));
                    } else {
                      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
                    }
                  }}
                  className="h-7 px-2.5 rounded border border-[#dcdfe6] hover:border-[#409eff] hover:text-[#409eff] text-[#606266] cursor-pointer"
                >
                  全选当前
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-[680px] text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[#f5f7fa] border-b border-[#ebeef5] text-[#606266] z-10">
                  <tr className="divide-x divide-[#ebeef5]">
                    <th className="py-2.5 px-3 w-12 text-center whitespace-nowrap">选择</th>
                    <th className="py-2.5 px-3 w-36 whitespace-nowrap">编码</th>
                    <th className="py-2.5 px-3 min-w-[200px] whitespace-nowrap">名称</th>
                    <th className="py-2.5 px-3 min-w-[200px] whitespace-nowrap">
                      {isRisk ? '控制目标 / 分类' : '所属业务目录'}
                    </th>
                    <th className="py-2.5 px-3 w-28 text-center whitespace-nowrap">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebeef5]">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#909399]">
                        当前分类下暂无已审核项目
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const checked = selectedIds.includes(item.id);
                      const code = item.riskNo || item.docNo || item.attNo || item.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => toggleSelect(item.id)}
                          className={`cursor-pointer transition-colors divide-x divide-[#ebeef5] ${
                            checked ? 'bg-[#ecf5ff]/70' : 'hover:bg-[#f5f7fa]'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              className="cursor-pointer accent-[#409eff]"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-mono-tabular text-[#409eff] font-medium whitespace-nowrap">
                            {code}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-[#1f2733]">
                            <div className="truncate max-w-[240px]" title={item.label}>
                              {item.label}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-[#606266]">
                            {isRisk ? (
                              <div className="truncate max-w-[260px]" title={`${item.target || ''} (${item.category || ''})`}>
                                <span className="text-[#303133]">{item.target}</span>
                                {item.category && (
                                  <span className="text-[11px] text-[#909399] ml-1.5">[{item.category}]</span>
                                )}
                              </div>
                            ) : (
                              <div className="truncate max-w-[240px]" title={item.category}>
                                {item.category}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8] text-[11px] whitespace-nowrap">
                              <Check className="w-3 h-3 shrink-0" />
                              已生效
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between text-xs shrink-0">
          <span className="text-[#606266]">
            已勾选 <strong className="text-[#409eff] font-mono-tabular">{selectedIds.length}</strong> 项
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-[#606266] hover:border-[#409eff] cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => onConfirm(selectedIds)}
              className="h-8 px-4 rounded bg-[#409eff] hover:bg-[#3390ff] text-white font-medium cursor-pointer"
            >
              确定关联
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SysDocRiskModuleViewProps {
  moduleType: 'sysdoc' | 'risk';
  subPath: string;
  currentUser?: any;
  dictBundle: any;
  onRefreshDict: () => void;
  onNavigate?: (path: string, formKey?: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const SysDocRiskModuleView: React.FC<SysDocRiskModuleViewProps> = ({
  moduleType,
  subPath,
  currentUser,
  dictBundle,
  onRefreshDict,
  onNavigate,
  showToast,
}) => {
  const isRisk = moduleType === 'risk';
  const isPublishedViewOnly = subPath.includes('view');

  const isReadOnly = useMemo(() => {
    if (isPublishedViewOnly) return true;
    if (currentUser?.featurePermissions?.readOnly) return true;
    if (isRisk && currentUser?.featurePermissions?.risk?.readOnly) return true;
    if (!isRisk && currentUser?.featurePermissions?.sysDoc?.readOnly) return true;
    return false;
  }, [isPublishedViewOnly, isRisk, currentUser]);

  const canDownload = useMemo(() => {
    if (currentUser?.featurePermissions?.previewOnly) return false;
    if (isRisk && currentUser?.featurePermissions?.risk?.previewOnly) return false;
    if (!isRisk && currentUser?.featurePermissions?.sysDoc?.previewOnly) return false;

    if (isRisk) {
      if (currentUser?.featurePermissions?.risk?.canDownload !== undefined) {
        return Boolean(currentUser.featurePermissions.risk.canDownload);
      }
    } else {
      if (currentUser?.featurePermissions?.sysDoc?.canDownload !== undefined) {
        return Boolean(currentUser.featurePermissions.sysDoc.canDownload);
      }
    }
    if (currentUser?.featurePermissions?.canDownload !== undefined) {
      return Boolean(currentUser.featurePermissions.canDownload);
    }
    if (currentUser?.roleNames && currentUser.roleNames.includes('普通员工')) {
      return false;
    }
    return true;
  }, [isRisk, currentUser]);

  const previewOnly = useMemo(() => {
    return !canDownload || Boolean(
      currentUser?.featurePermissions?.previewOnly ||
      (isRisk ? currentUser?.featurePermissions?.risk?.previewOnly : currentUser?.featurePermissions?.sysDoc?.previewOnly)
    );
  }, [canDownload, isRisk, currentUser]);

  const fieldPerms = useMemo(() => {
    const fKey = isRisk ? 'form_flowdoc' : 'form_sysdoc';
    return currentUser?.fieldPermissions?.[fKey] || {};
  }, [isRisk, currentUser]);

  const [formSchema, setFormSchema] = useState<any>(null);
  useEffect(() => {
    fetch('/api/system/forms/form_sysdoc')
      .then((r) => r.json())
      .then((res) => {
        if (res.status === 1 && res.data) {
          setFormSchema(res.data);
        }
      })
      .catch((e) => console.error('Failed to load form_sysdoc schema', e));
  }, []);

  const customFields = useMemo(() => {
    if (!formSchema?.fields) return [];
    return formSchema.fields.filter((f: any) => !f.isSystem);
  }, [formSchema]);

  const tree: TreeFolderNode[] = isRisk
    ? dictBundle?.riskTree || []
    : dictBundle?.sysDocTree || [];
  const allItems: any[] = isRisk ? dictBundle?.risk || [] : dictBundle?.sysDoc || [];
  // 制度查阅与风险查阅（isPublishedViewOnly）：强约束只有通过审批（status === 'approved'）的文件才能在对应目录中显示
  const items: any[] = useMemo(() => {
    if (isPublishedViewOnly) {
      return allItems.filter((it: any) => (it.status || 'approved') === 'approved');
    }
    return allItems;
  }, [allItems, isPublishedViewOnly]);

  const rootFolder = tree.find((n) => !n.parentId) || tree[0];
  const [selectedFolderId, setSelectedFolderId] = useState<string>(rootFolder?.id || '');
  const [treeCollapsed, setTreeCollapsed] = useState(false);
  const [treeWidth, setTreeWidth] = useState<number>(268);
  const [treeSearch, setTreeSearch] = useState('');
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>(
    isPublishedViewOnly ? 'approved' : 'all'
  );
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const [codeSearch, setCodeSearch] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    setStatusFilter(isPublishedViewOnly ? 'approved' : 'all');
  }, [isPublishedViewOnly, moduleType]);

  const [folderModal, setFolderModal] = useState<{
    open: boolean;
    mode: 'create' | 'rename';
    targetId: string;
    label: string;
  }>({ open: false, mode: 'create', targetId: '', label: '' });

  const [itemModal, setItemModal] = useState<{
    open: boolean;
    isEdit: boolean;
    form: any;
  }>({ open: false, isEdit: false, form: {} });

  // 审批与复核弹窗状态
  const [auditModal, setAuditModal] = useState<{
    open: boolean;
    item: any | null;
    decision: 'approved' | 'rejected';
    remark: string;
  }>({
    open: false,
    item: null,
    decision: 'approved',
    remark: '',
  });

  // 全局多层级审批路径与审批人配置
  const [approvalPaths, setApprovalPaths] = useState<{
    sysDoc: ApprovalLevelConfig[];
    risk: ApprovalLevelConfig[];
  }>({
    sysDoc: [
      {
        level: 1,
        levelName: '第1级: 归口部门初审',
        approverName: '张明',
        roleName: '部门经理',
        deptName: '流程管理部',
      },
      {
        level: 2,
        levelName: '第2级: 质量合规复核',
        approverName: '陈静',
        roleName: '合规总监',
        deptName: '质量合规部',
      },
      {
        level: 3,
        levelName: '第3级: 决策层终审签发',
        approverName: '刘建国',
        roleName: '副总裁',
        deptName: '决策委员会',
      },
    ],
    risk: [
      {
        level: 1,
        levelName: '第1级: 业务线风控员初核',
        approverName: '李合规',
        roleName: '风控专员',
        deptName: '研发管理中心',
      },
      {
        level: 2,
        levelName: '第2级: 质量合规部终审',
        approverName: '陈静',
        roleName: '合规总监',
        deptName: '质量合规部',
      },
    ],
  });

  const [pathConfigModalOpen, setPathConfigModalOpen] = useState(false);
  const [pathConfigTab, setPathConfigTab] = useState<'sysDoc' | 'risk'>('sysDoc');
  const [editingPaths, setEditingPaths] = useState<{
    sysDoc: ApprovalLevelConfig[];
    risk: ApprovalLevelConfig[];
  }>({ sysDoc: [], risk: [] });

  // 审批流转轨迹与详情弹窗
  const [auditTraceModal, setAuditTraceModal] = useState<{
    open: boolean;
    item: any | null;
  }>({ open: false, item: null });

  // 加载系统审批路径配置
  const fetchApprovalPaths = async () => {
    try {
      const res = await fetch('/api/dict/approval-path');
      const json = await res.json();
      if (json.status === 1 && json.data) {
        setApprovalPaths(json.data);
      }
    } catch (e) {
      console.error('Failed to load approval paths', e);
    }
  };

  useEffect(() => {
    fetchApprovalPaths();
  }, []);

  // 保存全局审批路径配置
  const handleSaveApprovalPaths = async () => {
    try {
      const res = await fetch('/api/dict/approval-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPaths),
      });
      const json = await res.json();
      if (json.status === 1) {
        setApprovalPaths(json.data);
        showToast('多层级审批路径与责任人设置已保存并生效！', 'success');
        setPathConfigModalOpen(false);
      }
    } catch (e) {
      showToast('保存审批路径配置失败', 'error');
    }
  };

  const handleOpenAudit = (item: any) => {
    const flow = Array.isArray(item.approvalFlow) && item.approvalFlow.length > 0
      ? item.approvalFlow
      : (isRisk ? approvalPaths.risk : approvalPaths.sysDoc).map((n, i) => ({
          ...n,
          level: i + 1,
          status: i === 0 ? 'pending' : 'waiting',
        }));

    const curIdx = flow.findIndex((n: any) => n.status === 'pending');
    const isFinal = curIdx === flow.length - 1 || curIdx === -1;
    const curLevel = curIdx >= 0 ? flow[curIdx] : flow[0];

    setAuditModal({
      open: true,
      item: {
        ...item,
        approvalFlow: flow,
      },
      decision: 'approved',
      remark: isFinal
        ? '经合规终审，制度规范条款完整有效，权责与内控要求明确，准予在查阅目录正式发布展示。'
        : `经${curLevel?.levelName || '初审'}，条款规范符合合规标准，准予移交下一层级审批。`,
    });
  };

  const handleSubmitAudit = async (decisionOverride?: 'approved' | 'rejected') => {
    if (!auditModal.item) return;
    const decision = decisionOverride || auditModal.decision;
    const auditorName = currentUser?.nickName || currentUser?.userName || '流程合规审核员';

    const flow = Array.isArray(auditModal.item.approvalFlow) ? auditModal.item.approvalFlow : [];
    const curIdx = flow.findIndex((n: any) => n.status === 'pending');
    const pendingLevel = curIdx >= 0 ? flow[curIdx] : flow[0];
    const isFinal = curIdx === flow.length - 1 || curIdx === -1;

    const defaultRemark = decision === 'approved'
      ? (isFinal ? '终审通过，准予在查阅目录正式发布生效' : `${pendingLevel?.levelName || '审批'}通过，已自动移交下一层级复核`)
      : `${pendingLevel?.levelName || '审批'}驳回，请按合规意见补充完善后重新提交`;

    const remark = auditModal.remark?.trim() || defaultRemark;

    await fetch('/api/dict/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemType: isRisk ? 'risk' : 'sysDoc',
        action: decision === 'approved' ? 'approve' : 'reject',
        id: auditModal.item.id,
        auditor: auditorName,
        auditRemark: remark,
      }),
    });

    const label = auditModal.item.label || auditModal.item.docNo || auditModal.item.riskNo;
    if (decision === 'approved') {
      if (isFinal) {
        showToast(`【${label}】多层级审批全部通过并正式生效，现已在查阅目录中公开展示`, 'success');
      } else {
        const nextLevel = flow[curIdx + 1];
        showToast(`【${label}】${pendingLevel?.levelName || '当前级'}已通过，任务已流转至下一级审批人【${nextLevel?.approverName || '下一级'}】`, 'success');
      }
    } else {
      showToast(`【${label}】已驳回，需修改完善后重新送审`, 'warning');
    }
    setAuditModal({ open: false, item: null, decision: 'approved', remark: '' });
    onRefreshDict();
  };

  const handleResubmitItem = async (item: any) => {
    await fetch('/api/dict/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemType: isRisk ? 'risk' : 'sysDoc',
        action: 'resubmit',
        id: item.id,
      }),
    });
    const label = item.label || item.docNo || item.riskNo;
    showToast(`【${label}】已重新发起送审，任务已推送至第1级审批人待办`, 'success');
    onRefreshDict();
  };

  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [previewDetailMaximized, setPreviewDetailMaximized] = useState(false);
  const [onlinePreviewDoc, setOnlinePreviewDoc] = useState<any | null>(null);

  // Check if a field represents start date or end date
  const isStartDateField = (field: any) => {
    const label = field?.label || '';
    const key = (field?.fieldKey || '').toLowerCase();
    return label.includes('开始') || label.includes('起') || key.includes('start') || key === 'effectivedate';
  };

  const isEndDateField = (field: any) => {
    const label = field?.label || '';
    const key = (field?.fieldKey || '').toLowerCase();
    return label.includes('截止') || label.includes('结束') || label.includes('止') || key.includes('end') || key.includes('expire');
  };

  // Derive validity period string from start date and end date
  const deriveValidityPeriod = (form: any, fields: any[] = customFields) => {
    if (!form) return '';
    let start = '';
    let end = '';

    // First scan custom fields
    if (Array.isArray(fields)) {
      for (const f of fields) {
        const val = form[f.fieldKey];
        if (val) {
          if (isStartDateField(f) && !start) start = String(val).trim();
          if (isEndDateField(f) && !end) end = String(val).trim();
        }
      }
    }

    // Direct property fallbacks
    if (!start) {
      start = form.effectiveStartDate || form.startDate || form.validityStartDate || form.effectiveDate || '';
    }
    if (!end) {
      end = form.effectiveEndDate || form.endDate || form.validityEndDate || form.expireDate || '';
    }

    if (start && end) {
      return `${start} 至 ${end}`;
    }
    if (start && !end) {
      return `${start} 起生效 (长期有效)`;
    }
    if (!start && end) {
      return `截至 ${end}`;
    }
    return '';
  };

  const handleOpenEditItem = (row: any) => {
    const form = { ...row };
    if (!isRisk) {
      const autoPeriod = deriveValidityPeriod(form, customFields);
      if (autoPeriod) {
        form.validityPeriod = autoPeriod;
      }
    }
    if (!Array.isArray(form.approvalFlow) || form.approvalFlow.length === 0) {
      const defaultFlowTemplate = (isRisk ? approvalPaths.risk : approvalPaths.sysDoc) || [];
      form.approvalFlow = defaultFlowTemplate.map((n, i) => ({
        ...n,
        level: i + 1,
        status: i === 0 ? 'pending' : 'waiting',
        auditor: '',
        auditRemark: '',
        auditTime: '',
      }));
    }
    setItemModal({
      open: true,
      isEdit: true,
      form,
    });
  };

  useEffect(() => {
    const root = (isRisk ? dictBundle?.riskTree : dictBundle?.sysDocTree)?.find(
      (n: any) => !n.parentId
    );
    if (root) setSelectedFolderId(root.id);
  }, [isRisk, dictBundle?.riskTree?.length, dictBundle?.sysDocTree?.length]);

  const isResizingTreeRef = useRef(false);
  const handleStartTreeResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingTreeRef.current = true;
    const startX = e.clientX;
    const startW = treeWidth;
    const onMove = (ev: MouseEvent) => {
      if (!isResizingTreeRef.current) return;
      const next = Math.max(210, Math.min(420, startW + (ev.clientX - startX)));
      setTreeWidth(next);
    };
    const onUp = () => {
      isResizingTreeRef.current = false;
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

  const currentFolder = tree.find((n) => n.id === selectedFolderId) || rootFolder;
  const descendantIds = useMemo(
    () => (currentFolder ? getDescendantFolderIds(tree, currentFolder.id) : new Set<string>()),
    [tree, currentFolder]
  );

  const folderScopedItems = useMemo(() => {
    return items.filter(
      (it) =>
        !currentFolder ||
        currentFolder.parentId === '' ||
        descendantIds.has(it.folderId)
    );
  }, [items, currentFolder, descendantIds]);

  const approvedCount = useMemo(
    () => folderScopedItems.filter((it) => (it.status || 'approved') === 'approved').length,
    [folderScopedItems]
  );
  const pendingCount = useMemo(
    () => folderScopedItems.filter((it) => (it.status || 'approved') === 'pending').length,
    [folderScopedItems]
  );
  const rejectedCount = useMemo(
    () => folderScopedItems.filter((it) => it.status === 'rejected').length,
    [folderScopedItems]
  );

  const filteredRows = useMemo(() => {
    return folderScopedItems.filter((it) => {
      const st = it.status || 'approved';
      const matchStatus = statusFilter === 'all' || st === statusFilter;
      const matchRiskLevel =
        !isRisk || riskLevelFilter === 'all' || (it.riskLevel || '高') === riskLevelFilter;
      const codeVal = (it.docNo || it.riskNo || '').toLowerCase();
      const matchCode = !codeSearch.trim() || codeVal.includes(codeSearch.trim().toLowerCase());
      const kw = keyword.trim().toLowerCase();
      const matchKw =
        !kw ||
        it.label?.toLowerCase().includes(kw) ||
        codeVal.includes(kw) ||
        (it.category || '').toLowerCase().includes(kw) ||
        (it.target || '').toLowerCase().includes(kw) ||
        (it.ownerName || '').toLowerCase().includes(kw);
      return matchStatus && matchRiskLevel && matchCode && matchKw;
    });
  }, [folderScopedItems, statusFilter, isRisk, riskLevelFilter, codeSearch, keyword]);

  const handleResetFilters = () => {
    setStatusFilter(isPublishedViewOnly ? 'approved' : 'all');
    setRiskLevelFilter('all');
    setCodeSearch('');
    setKeyword('');
  };

  const handleSaveFolder = async () => {
    if (!folderModal.label.trim()) {
      showToast('请输入目录名称', 'warning');
      return;
    }
    await fetch('/api/dict/tree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        treeType: isRisk ? 'risk' : 'sysDoc',
        action: folderModal.mode,
        id: folderModal.targetId,
        parentId: folderModal.targetId,
        label: folderModal.label.trim(),
      }),
    });
    setFolderModal({ ...folderModal, open: false });
    showToast(folderModal.mode === 'create' ? '已新建目录' : '已重命名目录', 'success');
    onRefreshDict();
  };

  const handleDeleteFolder = async (id: string, label: string) => {
    await fetch('/api/dict/tree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        treeType: isRisk ? 'risk' : 'sysDoc',
        action: 'delete',
        id,
      }),
    });
    showToast(`已删除目录 ${label}`, 'success');
    if (selectedFolderId === id && rootFolder) setSelectedFolderId(rootFolder.id);
    onRefreshDict();
  };

  const handleOpenAddItem = () => {
    const defaultFolderId =
      selectedFolderId && selectedFolderId !== rootFolder?.id
        ? selectedFolderId
        : tree.find((n) => n.parentId === rootFolder?.id)?.id || rootFolder?.id;
    const categoryPath = buildFolderPath(tree, defaultFolderId || '');

    const defaultFlowTemplate = (isRisk ? approvalPaths.risk : approvalPaths.sysDoc) || [];
    const initApprovalFlow = defaultFlowTemplate.map((n, i) => ({
      ...n,
      level: i + 1,
      status: i === 0 ? 'pending' : 'waiting',
      auditor: '',
      auditRemark: '',
      auditTime: '',
    }));

    if (isRisk) {
      setItemModal({
        open: true,
        isEdit: false,
        form: {
          folderId: defaultFolderId,
          riskNo: 'RSK-2026-' + Math.floor(100 + Math.random() * 900),
          label: '',
          target: '',
          category: categoryPath,
          riskLevel: '高',
          ownerName: currentUser?.nickName || currentUser?.userName || '风控合规专员',
          status: 'pending', // 默认进入待审核审批流
          approvalFlow: initApprovalFlow,
        },
      });
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      const initForm: any = {
        folderId: defaultFolderId,
        docNo: 'ZD-2026-' + Math.floor(100 + Math.random() * 900),
        label: '',
        category: categoryPath,
        versionNo: 'V1.0',
        fileSize: '1.5 MB',
        ownerName: currentUser?.nickName || currentUser?.userName || '制度规范组',
        status: 'pending', // 默认进入待审核审批流
        effectiveStartDate: todayStr,
        effectiveEndDate: '2029-12-31',
        validityPeriod: `${todayStr} 至 2029-12-31 (长期有效)`,
        approvalFlow: initApprovalFlow,
      };
      setItemModal({
        open: true,
        isEdit: false,
        form: initForm,
      });
    }
  };

  const handleSaveItem = async () => {
    const f = { ...itemModal.form };
    if (!f.label?.trim()) {
      showToast(isRisk ? '请输入风险合规名称' : '请输入制度文件名称', 'warning');
      return;
    }
    if (!isRisk) {
      const autoPeriod = deriveValidityPeriod(f, customFields);
      if (autoPeriod) {
        f.validityPeriod = autoPeriod;
      }
    }
    const categoryPath = buildFolderPath(tree, f.folderId || '');
    await fetch('/api/dict/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemType: isRisk ? 'risk' : 'sysDoc',
        action: itemModal.isEdit ? 'update' : 'create',
        item: {
          ...f,
          category: categoryPath,
        },
      }),
    });
    setItemModal({ open: false, isEdit: false, form: {} });
    showToast(
      itemModal.isEdit
        ? '已保存更新'
        : (f.status === 'pending'
            ? '已提交合规审批，审批通过后将在查阅目录中正式展示'
            : '已新增记录并正式生效'),
      'success'
    );
    onRefreshDict();
  };

  const handleApproveItem = async (id: string, label: string) => {
    const target = allItems.find((x: any) => x.id === id);
    if (target) {
      handleOpenAudit(target);
      return;
    }
    await fetch('/api/dict/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemType: isRisk ? 'risk' : 'sysDoc',
        action: 'approve',
        id,
        auditor: currentUser?.nickName || currentUser?.userName || '流程合规审核员',
        auditRemark: '经合规审查，准予发布生效并在查阅目录展示',
      }),
    });
    showToast(`【${label}】已审核通过，已在查阅目录中公开展示`, 'success');
    onRefreshDict();
  };

  const handleDeleteItem = async (id: string, label: string) => {
    await fetch('/api/dict/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemType: isRisk ? 'risk' : 'sysDoc',
        action: 'delete',
        id,
      }),
    });
    showToast(`已删除 ${label}`, 'success');
    onRefreshDict();
  };

  const toggleNodeCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const renderFolderTree = (node: TreeFolderNode, depth = 0) => {
    const children = tree.filter((n) => n.parentId === node.id);
    const descSet = getDescendantFolderIds(tree, node.id);
    const count = items.filter((it) => node.parentId === '' || descSet.has(it.folderId)).length;
    const isSel = selectedFolderId === node.id;
    const isCollapsed = collapsedNodeIds.includes(node.id);

    if (treeSearch.trim()) {
      const matchSelf = node.label.toLowerCase().includes(treeSearch.trim().toLowerCase());
      const matchAnyDescendant = tree
        .filter((n) => descSet.has(n.id))
        .some((n) => n.label.toLowerCase().includes(treeSearch.trim().toLowerCase()));
      if (!matchSelf && !matchAnyDescendant) return null;
    }

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => setSelectedFolderId(node.id)}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
          className={`group flex items-center justify-between pr-2 py-1.5 rounded text-xs cursor-pointer transition-colors relative ${
            isSel
              ? 'bg-[#ecf5ff] text-[#409eff] font-semibold'
              : 'text-[#303133] hover:bg-[#f5f7fa]'
          }`}
        >
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {children.length > 0 ? (
              <button
                type="button"
                onClick={(e) => toggleNodeCollapse(node.id, e)}
                className="p-0.5 rounded hover:bg-[#dcdfe6]/50 text-[#909399] shrink-0 cursor-pointer"
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
            {isSel ? (
              <FolderOpen className="w-3.5 h-3.5 text-[#409eff] shrink-0" />
            ) : (
              <Folder
                className={`w-3.5 h-3.5 shrink-0 ${
                  isRisk ? 'text-[#e6a23c]' : 'text-[#409eff]'
                }`}
              />
            )}
            <span className="truncate ml-0.5" title={node.label}>
              {node.label}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            <span
              className={`text-[11px] font-mono-tabular px-1.5 py-0.2 rounded ${
                isSel ? 'bg-[#d9ecff] text-[#409eff]' : 'text-[#909399]'
              }`}
            >
              {count}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === node.id ? null : node.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white text-[#909399] hover:text-[#409eff] cursor-pointer transition-opacity"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {openMenuId === node.id && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-2 top-8 w-36 bg-white rounded border border-[#ebeef5] shadow-lg py-1 z-30 text-xs text-[#606266]"
            >
              <button
                onClick={() => {
                  setOpenMenuId(null);
                  setFolderModal({
                    open: true,
                    mode: 'create',
                    targetId: node.id,
                    label: '',
                  });
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] flex items-center gap-1.5 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>新建子目录</span>
              </button>
              <button
                onClick={() => {
                  setOpenMenuId(null);
                  setFolderModal({
                    open: true,
                    mode: 'rename',
                    targetId: node.id,
                    label: node.label,
                  });
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-[#ecf5ff] hover:text-[#409eff] flex items-center gap-1.5 cursor-pointer"
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>重命名</span>
              </button>
              {node.parentId !== '' && (
                <>
                  <div className="my-1 border-t border-[#ebeef5]" />
                  <button
                    onClick={() => {
                      setOpenMenuId(null);
                      handleDeleteFolder(node.id, node.label);
                    }}
                    className="w-full px-3 py-1.5 text-left text-[#f56c6c] hover:bg-[#fef0f0] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>删除目录</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {!isCollapsed && children.map((ch) => renderFolderTree(ch, depth + 1))}
      </div>
    );
  };

  const gridColumns = useMemo<DataGridColumn<any>[]>(() => {
    if (isRisk) {
      return [
        {
          key: 'riskNo',
          label: '风险编号',
          defaultWidth: 150,
          minWidth: 125,
          fixed: 'left',
          tooltipText: (row) => row.riskNo,
          render: (row) => (
            <span className="font-mono-tabular font-medium text-[#1f2733] whitespace-nowrap">
              {row.riskNo}
            </span>
          ),
        },
        {
          key: 'label',
          label: '风险名称',
          defaultWidth: 270,
          minWidth: 190,
          fixed: 'left',
          tooltipText: (row) => row.label,
          render: (row) => (
            <button
              type="button"
              onClick={() => setPreviewItem(row)}
              className="text-left font-medium text-[#1f2733] hover:text-[#409eff] transition-colors truncate block w-full cursor-pointer"
            >
              {row.label}
            </button>
          ),
        },
        {
          key: 'target',
          label: '控制目标',
          defaultWidth: 310,
          minWidth: 200,
          tooltipText: (row) => row.target,
          render: (row) => (
            <span className="text-[#303133] truncate block">{row.target || '全流程受控'}</span>
          ),
        },
        {
          key: 'category',
          label: '所属分类',
          defaultWidth: 220,
          minWidth: 160,
          tooltipText: (row) => row.category,
          render: (row) => (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4f4f5] text-[#606266] text-[11px] max-w-full truncate">
              <Folder className="w-3 h-3 text-[#909399] shrink-0" />
              <span className="truncate">{row.category || '根目录'}</span>
            </span>
          ),
        },
        {
          key: 'riskLevel',
          label: '风险等级',
          defaultWidth: 100,
          minWidth: 85,
          align: 'center',
          render: (row) => {
            const lvl = row.riskLevel || '中';
            const cls =
              lvl === '高'
                ? 'bg-[#fef0f0] text-[#f56c6c] border-[#fde2e2]'
                : lvl === '中'
                ? 'bg-[#fdf6ec] text-[#e6a23c] border-[#faecd8]'
                : 'bg-[#ecf5ff] text-[#409eff] border-[#d9ecff]';
            return (
              <span
                className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded border text-[11px] font-semibold whitespace-nowrap ${cls}`}
              >
                {lvl}
              </span>
            );
          },
        },
        {
          key: 'ownerName',
          label: '责任人',
          defaultWidth: 145,
          minWidth: 115,
          tooltipText: (row) => row.ownerName,
          render: (row) => (
            <span className="text-[#606266] whitespace-nowrap">
              {row.ownerName || '流程合规岗'}
            </span>
          ),
        },
        {
          key: 'status',
          label: '生效状态',
          defaultWidth: 155,
          minWidth: 130,
          align: 'center',
          render: (row) => {
            const st = row.status || 'approved';
            if (st === 'approved') {
              return (
                <button
                  type="button"
                  onClick={() => setAuditTraceModal({ open: true, item: row })}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8] text-[11px] font-medium whitespace-nowrap hover:bg-[#e1f3d8] cursor-pointer transition-colors"
                  title="点击查看多级审批流转完整轨迹"
                >
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>已生效 (全部通过)</span>
                </button>
              );
            }
            if (st === 'rejected') {
              return (
                <button
                  type="button"
                  onClick={() => setAuditTraceModal({ open: true, item: row })}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#fef0f0] text-[#f56c6c] border border-[#fde2e2] text-[11px] font-medium whitespace-nowrap hover:bg-[#fde2e2] cursor-pointer transition-colors"
                  title={row.auditRemark ? `驳回批注: ${row.auditRemark} (点击查看轨迹)` : '已驳回修改 (点击查看轨迹)'}
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>已驳回</span>
                </button>
              );
            }
            const flow = Array.isArray(row.approvalFlow) ? row.approvalFlow : [];
            const curLvl = flow.find((l: any) => l.status === 'pending') || flow[0];
            const lvlNum = curLvl?.level || row.currentLevel || 1;
            const approver = curLvl?.approverName || '待审';
            return (
              <button
                type="button"
                onClick={() => setAuditTraceModal({ open: true, item: row })}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#fdf6ec] text-[#e6a23c] border border-[#faecd8] text-[11px] font-medium whitespace-nowrap hover:bg-[#faecd8] cursor-pointer transition-colors max-w-[150px]"
                title={`点击查看流转轨迹：当前待第${lvlNum}级【${approver}】审批`}
              >
                <Clock className="w-3 h-3 shrink-0" />
                <span className="truncate">待第{lvlNum}级 ({approver})</span>
              </button>
            );
          },
        },
        {
          key: 'publishTime',
          label: '更新时间',
          defaultWidth: 165,
          minWidth: 145,
          align: 'center',
          render: (row) => (
            <span className="font-mono-tabular text-[#606266] whitespace-nowrap">
              {row.publishTime || '-'}
            </span>
          ),
        },
        {
          key: 'actions',
          label: '操作',
          defaultWidth: isReadOnly ? 110 : 250,
          minWidth: isReadOnly ? 95 : 225,
          align: 'center',
          fixed: 'right',
          render: (row) => {
            const isApproved = (row.status || 'approved') === 'approved';
            if (isReadOnly) {
              return (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewItem(row)}
                    className="text-[#409eff] hover:underline font-medium cursor-pointer"
                  >
                    预览详情
                  </button>
                </div>
              );
            }
            const flow = Array.isArray(row.approvalFlow) ? row.approvalFlow : [];
            const curLvl = flow.find((l: any) => l.status === 'pending') || flow[0];
            const lvlNum = curLvl?.level || row.currentLevel || 1;
            return (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <button
                  type="button"
                  onClick={() => setPreviewItem(row)}
                  className="text-[#606266] hover:text-[#409eff] font-medium cursor-pointer"
                >
                  预览
                </button>
                <button
                  type="button"
                  onClick={() => setAuditTraceModal({ open: true, item: row })}
                  className="text-[#606266] hover:text-[#2F7BFE] font-medium cursor-pointer flex items-center gap-0.5"
                  title="查看审批节点与流转进度"
                >
                  <History className="w-3 h-3" />
                  <span>轨迹</span>
                </button>
                {!isApproved && (
                  row.status === 'rejected' ? (
                    <button
                      type="button"
                      onClick={() => handleResubmitItem(row)}
                      className="text-[#e6a23c] hover:underline font-medium cursor-pointer"
                      title="重置流转状态并重新提交至第1级审批"
                    >
                      重新送审
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenAudit(row)}
                      className="px-2 py-0.5 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-[11px] font-medium transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                      title={`点击对第${lvlNum}级进行合规审批`}
                    >
                      <CheckSquare className="w-3 h-3" />
                      <span>审批(L{lvlNum})</span>
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => handleOpenEditItem(row)}
                  className="text-[#409eff] hover:underline font-medium cursor-pointer"
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(row.id, row.label)}
                  className="text-[#f56c6c] hover:underline font-medium cursor-pointer"
                >
                  删除
                </button>
              </div>
            );
          },
        },
      ];
    }

    const sysDocCols: DataGridColumn<any>[] = [
      {
        key: 'docNo',
        label: '制度编码',
        defaultWidth: 150,
        minWidth: 125,
        fixed: 'left',
        tooltipText: (row) => fieldPerms.docNo === 'masked' ? (row.docNo || '').replace(/-[A-Z0-9]+-/, '-***-') : row.docNo,
        render: (row) => {
          const displayNo = fieldPerms.docNo === 'masked'
            ? (row.docNo || '').replace(/-[A-Z0-9]+-/, '-***-')
            : row.docNo;
          return (
            <span className="font-mono-tabular font-medium text-[#1f2733] whitespace-nowrap">
              {displayNo}
            </span>
          );
        },
      },
      {
        key: 'label',
        label: '制度文件名称',
        defaultWidth: 290,
        minWidth: 210,
        fixed: 'left',
        tooltipText: (row) => row.label,
        render: (row) => {
          const fmt = getDocumentFormat(row.label);
          const badge =
            fmt === 'pdf'
              ? { label: 'PDF', bg: 'bg-[#fee2e2]', text: 'text-[#dc2626]', icon: FileText }
              : fmt === 'word'
              ? { label: 'Word', bg: 'bg-[#dbeafe]', text: 'text-[#2563eb]', icon: FileText }
              : fmt === 'excel'
              ? { label: 'Excel', bg: 'bg-[#d1fae5]', text: 'text-[#059669]', icon: FileSpreadsheet }
              : { label: 'PPT', bg: 'bg-[#ffedd5]', text: 'text-[#d97706]', icon: Presentation };
          const IconComp = badge.icon;
          return (
            <button
              type="button"
              onClick={() => setPreviewItem(row)}
              className="flex items-center gap-1.5 text-left font-medium text-[#1f2733] hover:text-[#409eff] transition-colors truncate w-full cursor-pointer group"
              title="点击查看详细信息与正文"
            >
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${badge.bg} ${badge.text} border border-current/20 flex items-center gap-0.5`}
              >
                <IconComp className="w-3 h-3" />
                <span>{badge.label}</span>
              </span>
              <span className="truncate group-hover:underline">{row.label}</span>
            </button>
          );
        },
      },
      {
        key: 'category',
        label: '所属目录',
        defaultWidth: 240,
        minWidth: 170,
        tooltipText: (row) => row.category,
        render: (row) => (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4f4f5] text-[#606266] text-[11px] max-w-full truncate">
            <Folder className="w-3 h-3 text-[#409eff] shrink-0" />
            <span className="truncate">{row.category || '根目录'}</span>
          </span>
        ),
      },
      {
        key: 'versionNo',
        label: '版本',
        defaultWidth: 95,
        minWidth: 80,
        align: 'center',
        render: (row) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff] font-mono-tabular font-semibold text-[11px] whitespace-nowrap">
            {row.versionNo || 'V1.0'}
          </span>
        ),
      },
      {
        key: 'fileSize',
        label: '文件大小',
        defaultWidth: 105,
        minWidth: 85,
        align: 'center',
        render: (row) => (
          <span className="font-mono-tabular text-[#606266] whitespace-nowrap">
            {row.fileSize || '1.8 MB'}
          </span>
        ),
      },
      {
        key: 'ownerName',
        label: '归口部门/责任人',
        defaultWidth: 135,
        minWidth: 105,
        tooltipText: (row) => row.ownerName,
        render: (row) => (
          <span className="text-[#606266] whitespace-nowrap">
            {row.ownerName || '运营部'}
          </span>
        ),
      },
      {
        key: 'status',
        label: '状态',
        defaultWidth: 155,
        minWidth: 130,
        align: 'center',
        render: (row) => {
          const st = row.status || 'approved';
          if (st === 'approved') {
            return (
              <button
                type="button"
                onClick={() => setAuditTraceModal({ open: true, item: row })}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8] text-[11px] font-medium whitespace-nowrap hover:bg-[#e1f3d8] cursor-pointer transition-colors"
                title="点击查看多级审批流转完整轨迹"
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>已生效 (全部通过)</span>
              </button>
            );
          }
          if (st === 'rejected') {
            return (
              <button
                type="button"
                onClick={() => setAuditTraceModal({ open: true, item: row })}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#fef0f0] text-[#f56c6c] border border-[#fde2e2] text-[11px] font-medium whitespace-nowrap hover:bg-[#fde2e2] cursor-pointer transition-colors"
                title={row.auditRemark ? `驳回批注: ${row.auditRemark} (点击查看轨迹)` : '已驳回修改 (点击查看轨迹)'}
              >
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>已驳回</span>
              </button>
            );
          }
          const flow = Array.isArray(row.approvalFlow) ? row.approvalFlow : [];
          const curLvl = flow.find((l: any) => l.status === 'pending') || flow[0];
          const lvlNum = curLvl?.level || row.currentLevel || 1;
          const approver = curLvl?.approverName || '待审';
          return (
            <button
              type="button"
              onClick={() => setAuditTraceModal({ open: true, item: row })}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#fdf6ec] text-[#e6a23c] border border-[#faecd8] text-[11px] font-medium whitespace-nowrap hover:bg-[#faecd8] cursor-pointer transition-colors max-w-[150px]"
              title={`点击查看流转轨迹：当前待第${lvlNum}级【${approver}】审批`}
            >
              <Clock className="w-3 h-3 shrink-0" />
              <span className="truncate">待第${lvlNum}级 (${approver})</span>
            </button>
          );
        },
      },
      {
        key: 'validityPeriod',
        label: '制度有效期',
        defaultWidth: 195,
        minWidth: 150,
        tooltipText: (row) => row.validityPeriod || '长期有效',
        render: (row) => (
          <span className="font-mono-tabular text-[#606266] flex items-center gap-1.5 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-[#409eff] shrink-0" />
            <span className="truncate max-w-[155px]">{row.validityPeriod || '2026-03-17 至 2029-03-16 (长期有效)'}</span>
          </span>
        ),
      },
      {
        key: 'publishTime',
        label: '生效日期',
        defaultWidth: 165,
        minWidth: 145,
        align: 'center',
        render: (row) => (
          <span className="font-mono-tabular text-[#606266] whitespace-nowrap">
            {row.publishTime || '-'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: '操作',
        defaultWidth: isReadOnly ? 190 : 270,
        minWidth: isReadOnly ? 170 : 250,
        align: 'center',
        fixed: 'right',
        render: (row) => {
          const isApproved = (row.status || 'approved') === 'approved';
          if (isReadOnly) {
            return (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <button
                  type="button"
                  onClick={() => setPreviewItem(row)}
                  className="text-[#606266] hover:text-[#409eff] font-medium cursor-pointer"
                  title="查看详情信息"
                >
                  详情
                </button>
                <button
                  type="button"
                  onClick={() => setOnlinePreviewDoc(row)}
                  className="text-[#409eff] hover:underline font-medium cursor-pointer flex items-center gap-0.5"
                  title="在线预览正文内容"
                >
                  <Eye className="w-3 h-3" />
                  <span>预览</span>
                </button>
                {canDownload && !previewOnly ? (
                  <button
                    type="button"
                    onClick={() => downloadDocumentFile(row, showToast)}
                    className="text-[#67c23a] hover:underline font-medium cursor-pointer flex items-center gap-0.5"
                    title="自动下载该文件"
                  >
                    <Download className="w-3 h-3" />
                    <span>下载</span>
                  </button>
                ) : (
                  <span
                    className="text-[#909399] bg-[#f4f4f5] px-1.5 py-0.5 rounded text-[11px] flex items-center gap-0.5 cursor-not-allowed select-none"
                    title="当前权限仅允许在线预览，无下载权限"
                  >
                    <Lock className="w-3 h-3 text-[#c0c4cc]" />
                    <span>禁下载</span>
                  </span>
                )}
              </div>
            );
          }
          const flow = Array.isArray(row.approvalFlow) ? row.approvalFlow : [];
          const curLvl = flow.find((l: any) => l.status === 'pending') || flow[0];
          const lvlNum = curLvl?.level || row.currentLevel || 1;
          return (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <button
                type="button"
                onClick={() => setPreviewItem(row)}
                className="text-[#606266] hover:text-[#409eff] font-medium cursor-pointer"
                title="查看详情信息"
              >
                详情
              </button>
              <button
                type="button"
                onClick={() => setOnlinePreviewDoc(row)}
                className="text-[#409eff] hover:underline font-medium cursor-pointer flex items-center gap-0.5"
                title="在线预览正文内容"
              >
                <Eye className="w-3 h-3" />
                <span>预览</span>
              </button>
              <button
                type="button"
                onClick={() => downloadDocumentFile(row, showToast)}
                className="text-[#67c23a] hover:underline font-medium cursor-pointer flex items-center gap-0.5"
                title="自动下载该文件"
              >
                <Download className="w-3 h-3" />
                <span>下载</span>
              </button>
              <button
                type="button"
                onClick={() => setAuditTraceModal({ open: true, item: row })}
                className="text-[#606266] hover:text-[#2F7BFE] font-medium cursor-pointer flex items-center gap-0.5"
                title="查看多层级审批流转记录"
              >
                <History className="w-3 h-3" />
                <span>轨迹</span>
              </button>
              {!isApproved && (
                row.status === 'rejected' ? (
                  <button
                    type="button"
                    onClick={() => handleResubmitItem(row)}
                    className="text-[#e6a23c] hover:underline font-medium cursor-pointer"
                    title="重新将文件提交至第1级审批人"
                  >
                    重新送审
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenAudit(row)}
                    className="px-2 py-0.5 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-[11px] font-medium transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                    title={`点击对第${lvlNum}级进行合规审批`}
                  >
                    <CheckSquare className="w-3 h-3" />
                    <span>审批(L{lvlNum})</span>
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => handleOpenEditItem(row)}
                className="text-[#409eff] hover:underline font-medium cursor-pointer"
              >
                编辑
              </button>
              <button
                type="button"
                onClick={() => handleDeleteItem(row.id, row.label)}
                className="text-[#f56c6c] hover:underline font-medium cursor-pointer"
              >
                删除
              </button>
            </div>
          );
        },
      },
    ];

    if (!isRisk && customFields.length > 0) {
      const extraCols = customFields
        .filter((f: any) => f.showInList)
        .map((f: any) => ({
          key: f.fieldKey,
          label: f.label,
          defaultWidth: 140,
          minWidth: 120,
          align: 'center' as const,
          render: (row: any) => {
            const val = row[f.fieldKey];
            if (val === undefined || val === null || val === '') {
              return <span className="text-[#c0c4cc]">-</span>;
            }
            if (typeof val === 'boolean') {
              return val ? (
                <span className="px-2 py-0.5 rounded bg-[#f0f9eb] text-[#67c23a] text-[11px] font-medium">是</span>
              ) : (
                <span className="text-[#909399] text-[11px]">否</span>
              );
            }
            if (Array.isArray(val)) {
              return (
                <span className="truncate max-w-[130px] block text-[#606266] text-xs">
                  {val.join(', ')}
                </span>
              );
            }
            return (
              <span className="truncate max-w-[130px] block text-[#606266] text-xs" title={String(val)}>
                {String(val)}
              </span>
            );
          },
        }));
      sysDocCols.splice(sysDocCols.length - 2, 0, ...extraCols);
    }
    return sysDocCols;
  }, [isRisk, dictBundle, customFields]);

  return (
    <div
      onClick={() => setOpenMenuId(null)}
      className="h-[calc(100vh-88px)] flex min-h-0 overflow-hidden select-none"
    >
      <div
        style={{ width: treeCollapsed ? 48 : treeWidth }}
        className="bg-white rounded-l border border-[#ebeef5] flex flex-col h-full min-h-0 shrink-0 relative"
      >
        <div className="px-3.5 py-3 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
          {!treeCollapsed && (
            <div className="flex items-center gap-1.5 min-w-0">
              {isRisk ? (
                <ShieldAlert className="w-4 h-4 text-[#e6a23c] shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-[#409eff] shrink-0" />
              )}
              <span className="text-xs font-semibold text-[#1f2733] truncate">
                {isRisk ? '风险合规目录' : '制度文件目录'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            {!treeCollapsed && rootFolder && (
              <button
                onClick={() =>
                  setFolderModal({
                    open: true,
                    mode: 'create',
                    targetId: selectedFolderId || rootFolder.id,
                    label: '',
                  })
                }
                title="新建子目录"
                className="p-1 rounded hover:bg-[#ecf5ff] text-[#409eff] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setTreeCollapsed(!treeCollapsed)}
              title={treeCollapsed ? '展开目录树' : '折叠目录树'}
              className="p-1 rounded hover:bg-[#f5f7fa] text-[#606266] cursor-pointer"
            >
              {treeCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {!treeCollapsed && (
          <div className="p-2.5 border-b border-[#ebeef5] shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={treeSearch}
                onChange={(e) => setTreeSearch(e.target.value)}
                placeholder="过滤目录..."
                className="w-full h-7 pl-7 pr-6 rounded border border-[#dcdfe6] focus:border-[#409eff] text-xs outline-none bg-[#fcfcfd]"
              />
              {treeSearch && (
                <button
                  type="button"
                  onClick={() => setTreeSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#909399] hover:text-[#606266] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {!treeCollapsed && (
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {rootFolder ? renderFolderTree(rootFolder, 0) : null}
          </div>
        )}

        {!treeCollapsed && (
          <div className="px-3 py-2 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between text-[11px] text-[#909399] shrink-0">
            <span>共 {tree.length} 个目录</span>
            <span>共 {items.length} 条记录</span>
          </div>
        )}
      </div>

      {!treeCollapsed && (
        <div
          onMouseDown={handleStartTreeResize}
          title="按住拖拽调整目录宽度"
          className="w-2 cursor-col-resize flex items-center justify-center group hover:bg-[#409eff]/10 transition-colors shrink-0"
        >
          <div className="w-0.5 h-8 rounded bg-[#dcdfe6] group-hover:bg-[#409eff] transition-colors" />
        </div>
      )}

      <div
        className={`flex-1 bg-white rounded border border-[#ebeef5] flex flex-col h-full min-h-0 min-w-0 overflow-hidden ${
          treeCollapsed ? 'ml-3' : ''
        }`}
      >
        <div className="px-5 py-3.5 border-b border-[#ebeef5] bg-[#fcfcfd] flex flex-col gap-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                  isRisk ? 'bg-[#fdf6ec] text-[#e6a23c]' : 'bg-[#ecf5ff] text-[#409eff]'
                }`}
              >
                {isRisk ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#1f2733] truncate">
                    {currentFolder?.label || (isRisk ? '风险合规' : '制度规范')}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#f0f2f5] text-[#606266] text-[11px] font-mono-tabular whitespace-nowrap">
                    当前范围 {filteredRows.length} 条
                  </span>
                </div>
              </div>

              {isPublishedViewOnly ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#f0f9eb] border border-[#b3e19d] text-xs text-[#67c23a] font-medium ml-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>已通过审批正式生效 ({approvedCount})</span>
                </div>
              ) : (
                <div className="hidden sm:flex items-center rounded border border-[#dcdfe6] bg-white p-0.5 text-xs ml-2">
                  {[
                    { key: 'all', label: `全部 (${folderScopedItems.length})` },
                    { key: 'approved', label: `已生效 (${approvedCount})` },
                    { key: 'pending', label: `待审核 (${pendingCount})` },
                    ...(rejectedCount > 0 ? [{ key: 'rejected', label: `已驳回 (${rejectedCount})` }] : []),
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setStatusFilter(st.key as any)}
                      className={`px-2.5 py-1 rounded cursor-pointer transition-colors whitespace-nowrap ${
                        statusFilter === st.key
                          ? 'bg-[#409eff] text-white font-medium'
                          : 'text-[#606266] hover:text-[#409eff]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isReadOnly ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#f4f4f5] border border-[#dcdfe6] text-xs">
                  <span className="flex items-center gap-1 font-medium text-[#606266]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#67c23a]" />
                    <span>{isPublishedViewOnly ? '查阅目录 (仅展示已审批文件)' : '只读模式'}</span>
                  </span>
                  <span className="text-[#dcdfe6]">|</span>
                  {previewOnly ? (
                    <span className="text-[11px] font-semibold text-[#e6a23c] flex items-center gap-1 bg-[#fdf6ec] px-1.5 py-0.5 rounded border border-[#faecd8]">
                      <Lock className="w-3 h-3 text-[#e6a23c]" />
                      <span>仅限在线预览 · 限制下载</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#67c23a] font-medium flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      <span>允许查阅与下载</span>
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate?.('/system/column', isRisk ? 'form_flowdoc' : 'form_sysdoc')}
                    title="通过表单引擎自定义业务字段"
                    className="h-8 px-3 rounded border border-[#b3d8ff] bg-[#ecf5ff] text-[#409eff] hover:bg-[#409eff] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>自定义字段 ({customFields.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPaths(JSON.parse(JSON.stringify(approvalPaths)));
                      setPathConfigTab(isRisk ? 'risk' : 'sysDoc');
                      setPathConfigModalOpen(true);
                    }}
                    title="设置制度文件与风险合规的多层级审批路径及责任人"
                    className="h-8 px-3 rounded border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-[#303133] hover:text-[#409eff] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <GitFork className="w-3.5 h-3.5 text-[#409eff]" />
                    <span>审批路径设置</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddItem}
                    className="h-8 px-3.5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isRisk ? '新增风险条款' : '新增制度文件'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#606266] whitespace-nowrap">
                {isRisk ? '风险编号' : '制度编码'}
              </span>
              <input
                type="text"
                value={codeSearch}
                onChange={(e) => setCodeSearch(e.target.value)}
                placeholder={`输入${isRisk ? '风险' : '制度'}编码`}
                className="h-8 w-40 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] bg-white text-xs outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#606266] whitespace-nowrap">
                {isRisk ? '名称/责任人' : '关键字'}
              </span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={`输入${isRisk ? '风险目标、名称' : '制度名称'}...`}
                  className="h-8 w-60 pl-8 pr-3 rounded border border-[#dcdfe6] focus:border-[#409eff] bg-white text-xs outline-none"
                />
              </div>
            </div>
            {isRisk && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#606266] whitespace-nowrap">风险等级</span>
                <select
                  value={riskLevelFilter}
                  onChange={(e) => setRiskLevelFilter(e.target.value)}
                  className="h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] bg-white text-xs text-[#303133] outline-none cursor-pointer"
                >
                  <option value="all">全部等级</option>
                  <option value="高">高风险</option>
                  <option value="中">中风险</option>
                  <option value="低">低风险</option>
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-8 px-3 rounded border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-[#606266] text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置</span>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 p-3 bg-[#f5f7fa]/50 flex flex-col overflow-hidden">
          <EnterpriseDataGrid
            storageKey={isRisk ? 'grid_risk_compliance_v2' : 'grid_sysdoc_files_v2'}
            columns={gridColumns}
            data={filteredRows}
            rowKey={(row) => row.id}
            maxHeight="calc(100vh - 260px)"
            minHeight="320px"
            emptyText={
              isRisk
                ? '暂无符合条件的风险合规条款'
                : '暂无符合条件的制度文件记录'
            }
            toolbarTitle={
              <div className="flex items-center gap-2 text-xs text-[#606266]">
                <span>
                  当前目录：<strong className="text-[#1f2733]">{currentFolder?.label || '全部'}</strong>
                </span>
                <span className="text-[#dcdfe6]">|</span>
                <span className="text-[#67c23a]">
                  已生效 {approvedCount} 条
                </span>
                {pendingCount > 0 && (
                  <>
                    <span className="text-[#dcdfe6]">|</span>
                    <span className="text-[#e6a23c]">待审核 {pendingCount} 条</span>
                  </>
                )}
              </div>
            }
          />
        </div>
      </div>

      {previewItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4">
          <div
            className={`bg-white rounded-lg shadow-2xl border border-[#ebeef5] flex flex-col overflow-hidden transition-all duration-150 ${
              previewDetailMaximized
                ? 'w-full h-full max-h-screen rounded-none'
                : 'w-full max-w-3xl lg:max-w-4xl max-h-[82vh]'
            }`}
          >
            {/* Header: shrink-0 */}
            <div className="px-5 py-3 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-md bg-[#ecf5ff] text-[#409eff] flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1f2733] truncate">
                    {isRisk ? '风险合规详情' : '制度文件详细信息'}
                  </span>
                  <span className="font-mono-tabular text-xs font-semibold px-2 py-0.5 rounded bg-white border border-[#dcdfe6] text-[#606266] shrink-0">
                    {previewItem.riskNo || previewItem.docNo}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-3">
                <button
                  type="button"
                  onClick={() => setPreviewDetailMaximized(!previewDetailMaximized)}
                  className="p-1.5 text-[#909399] hover:text-[#409eff] hover:bg-[#ecf5ff] rounded transition-colors cursor-pointer"
                  title={previewDetailMaximized ? '还原窗口默认尺寸' : '最大化窗口'}
                >
                  {previewDetailMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewItem(null);
                    setPreviewDetailMaximized(false);
                  }}
                  className="p-1.5 text-[#909399] hover:text-[#f56c6c] hover:bg-[#fef0f0] rounded transition-colors cursor-pointer"
                  title="关闭窗口"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Adaptive scroll area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs bg-[#f8fafc]/50">
              {/* File Title Card & Quick Actions */}
              <div className="bg-white rounded-lg p-3.5 border border-[#ebeef5] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-[#909399] font-medium">
                      {isRisk ? '风险条款名称' : '制度文件全称'}
                    </span>
                    {!isRisk && (
                      <span className="text-[11px] text-[#409eff] flex items-center gap-1 font-medium">
                        <ExternalLink className="w-3 h-3" />
                        <span>点击文件名可直接在线预览</span>
                      </span>
                    )}
                  </div>
                  {isRisk ? (
                    <h3 className="font-bold text-sm text-[#1f2733] break-all">
                      {previewItem.label}
                    </h3>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOnlinePreviewDoc(previewItem)}
                      className="flex items-center gap-2.5 text-left group cursor-pointer w-full"
                      title="点击直接在线打开并预览该文件"
                    >
                      {(() => {
                        const fmt = getDocumentFormat(previewItem.label);
                        const badge =
                          fmt === 'pdf'
                            ? { label: 'PDF', bg: 'bg-[#fee2e2]', text: 'text-[#dc2626]', icon: FileText }
                            : fmt === 'word'
                            ? { label: 'Word', bg: 'bg-[#dbeafe]', text: 'text-[#2563eb]', icon: FileText }
                            : fmt === 'excel'
                            ? { label: 'Excel', bg: 'bg-[#d1fae5]', text: 'text-[#059669]', icon: FileSpreadsheet }
                            : { label: 'PPT', bg: 'bg-[#ffedd5]', text: 'text-[#d97706]', icon: Presentation };
                        const IconComp = badge.icon;
                        return (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badge.bg} ${badge.text} border-current/25 flex items-center gap-1 shrink-0`}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                            <span>{badge.label}</span>
                          </span>
                        );
                      })()}
                      <span className="font-bold text-sm text-[#1f2733] group-hover:text-[#409eff] group-hover:underline truncate">
                        {previewItem.label}
                      </span>
                    </button>
                  )}
                </div>

                {!isRisk && (
                  <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-dashed border-[#ebeef5]">
                    <button
                      type="button"
                      onClick={() => setOnlinePreviewDoc(previewItem)}
                      className="h-7 px-3 rounded bg-[#ecf5ff] hover:bg-[#409eff] text-[#409eff] hover:text-white border border-[#b3d8ff] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="支持 PDF、Word、PPT、Excel 在线预览"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>在线预览</span>
                    </button>
                    {canDownload && !previewOnly ? (
                      <button
                        type="button"
                        onClick={() => downloadDocumentFile(previewItem, showToast)}
                        className="h-7 px-3 rounded bg-[#f4f4f5] hover:bg-[#67c23a] text-[#606266] hover:text-white border border-[#dcdfe6] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        title="点击自动下载该文件"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>下载文件</span>
                      </button>
                    ) : (
                      <span className="h-7 px-2.5 rounded bg-amber-50 border border-amber-200 text-amber-600 text-xs flex items-center gap-1 select-none" title="当前角色仅具备预览权限，已被限制下载">
                        <Lock className="w-3 h-3 text-amber-500" />
                        <span>仅预览·禁下载</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Validity & Approval Banner for SysDoc / Risk */}
              {!isRisk && (
                previewItem.status === 'pending' ? (
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[11px] text-amber-700 block font-semibold">审批状态：待审核 (尚未生效)</span>
                        <span className="text-xs text-amber-800">
                          该制度文件正处于合规审批流程中。只有审批通过后，才会自动同步至【制度查阅】对应层级目录中公开展示。
                        </span>
                      </div>
                    </div>
                    <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold border border-amber-300 whitespace-nowrap">
                      ⏳ 待审核发布
                    </span>
                  </div>
                ) : previewItem.status === 'rejected' ? (
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[11px] text-red-700 block font-semibold">审批状态：已驳回修改</span>
                        <span className="text-xs text-red-800">
                          驳回批注：{previewItem.auditRemark || '条款不符合合规标准，需修改完善后重新提交'}
                        </span>
                      </div>
                    </div>
                    <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-semibold border border-red-300 whitespace-nowrap">
                      ❌ 审批未通过
                    </span>
                  </div>
                ) : (
                  <div className="bg-[#f0f9eb]/60 rounded-lg p-3 border border-[#e1f3d8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#67c23a]/15 text-[#67c23a] flex items-center justify-center shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[11px] text-[#909399] block font-medium">制度文件有效期</span>
                        <span className="font-mono-tabular font-bold text-[#1f2733] text-xs">
                          {previewItem.validityPeriod || '2026-03-17 至 2029-03-16 (长期有效)'}
                        </span>
                      </div>
                    </div>
                    <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full bg-[#67c23a]/15 text-[#67c23a] text-[11px] font-semibold border border-[#67c23a]/30 whitespace-nowrap">
                      ● 正常生效中
                    </span>
                  </div>
                )
              )}

              {/* Core Attributes Card (3 columns on desktop for space efficiency) */}
              <div className="bg-white rounded-lg p-3.5 border border-[#ebeef5] shadow-2xs">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[#909399] block mb-0.5">
                      {isRisk ? '风险编码' : '制度编码'}
                    </span>
                    <span className="font-mono-tabular font-semibold text-[#1f2733]">
                      {previewItem.riskNo || previewItem.docNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#909399] block mb-0.5">审核状态</span>
                    {(previewItem.status || 'approved') === 'approved' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8] text-[11px] font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        已生效
                      </span>
                    ) : previewItem.status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#fef0f0] text-[#f56c6c] border border-[#fde2e2] text-[11px] font-medium">
                        <AlertCircle className="w-3 h-3" />
                        已驳回
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#fdf6ec] text-[#e6a23c] border border-[#faecd8] text-[11px] font-medium">
                        <Clock className="w-3 h-3" />
                        待审核
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[#909399] block mb-0.5">所属业务目录</span>
                    <span className="text-[#303133] font-medium truncate block" title={previewItem.category || '根目录'}>
                      {previewItem.category || '根目录'}
                    </span>
                  </div>
                  {isRisk ? (
                    <div>
                      <span className="text-[#909399] block mb-0.5">风险级别</span>
                      <span className="font-semibold text-[#f56c6c]">
                        {previewItem.riskLevel || '高风险'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-[#909399] block mb-0.5">制度版本</span>
                        <span className="font-mono-tabular font-semibold text-[#409eff]">
                          {previewItem.versionNo || 'V1.0'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#909399] block mb-0.5">文件大小</span>
                        <span className="font-mono-tabular text-[#303133]">
                          {previewItem.fileSize || '1.8 MB'}
                        </span>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-[#909399] block mb-0.5">责任归口</span>
                    <span className="text-[#303133] font-medium truncate block">
                      {previewItem.ownerName || '未指定'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#909399] block mb-0.5">发布时间</span>
                    <span className="font-mono-tabular text-[#606266]">
                      {previewItem.publishTime || '-'}
                    </span>
                  </div>
                </div>

                {/* Risk Control Objectives */}
                {isRisk && (
                  <div className="mt-3 pt-3 border-t border-[#ebeef5]">
                    <span className="text-[#909399] block mb-1 font-medium">控制目标与合规要求</span>
                    <div className="p-2.5 rounded bg-[#fafafa] border border-[#ebeef5] text-[#303133] leading-relaxed">
                      {previewItem.target || '暂无控制目标'}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Form Attributes if any */}
              {!isRisk && customFields.length > 0 && (
                <div className="bg-white rounded-lg p-3.5 border border-[#ebeef5] shadow-2xs">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#409eff]" />
                    <span className="text-xs font-semibold text-[#1f2733]">
                      扩展表单业务属性
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-[#fafbfc] p-3 rounded border border-[#ebeef5]">
                    {customFields.map((f: any) => {
                      const val = previewItem[f.fieldKey];
                      return (
                        <div key={f.id} className={f.span === 24 ? 'col-span-2 md:col-span-3' : ''}>
                          <span className="text-[#909399] block text-[11px] mb-0.5">{f.label}</span>
                          <span className="text-[#303133] font-medium break-all">
                            {val !== undefined && val !== null && val !== ''
                              ? typeof val === 'boolean'
                              ? val ? '是' : '否'
                              : Array.isArray(val)
                              ? val.join(', ')
                              : String(val)
                              : '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 多层级审批流转轨迹与责任人记录 */}
              <div className="bg-white rounded-lg p-3.5 border border-[#ebeef5] shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1f2733] flex items-center gap-1.5">
                    <GitFork className="w-3.5 h-3.5 text-[#2F7BFE]" />
                    <span>多层级审批流转进度与轨迹</span>
                  </span>
                  <span className="text-[11px] text-[#909399]">
                    共 {previewItem.approvalFlow?.length || 0} 级审核节点
                  </span>
                </div>

                <div className="space-y-2 bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
                  {(previewItem.approvalFlow || []).map((lvl: any, idx: number) => {
                    const isApproved = lvl.status === 'approved';
                    const isPending = lvl.status === 'pending';
                    const isRejected = lvl.status === 'rejected';

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded border text-xs transition-all ${
                          isApproved
                            ? 'bg-[#f0f9eb]/60 border-[#e1f3d8]'
                            : isPending
                            ? 'bg-[#fdf6ec]/80 border-[#faecd8] ring-1 ring-amber-300'
                            : isRejected
                            ? 'bg-[#fef0f0]/60 border-[#fde2e2]'
                            : 'bg-white border-[#ebeef5]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                isApproved
                                  ? 'bg-[#67c23a] text-white'
                                  : isPending
                                  ? 'bg-[#e6a23c] text-white'
                                  : isRejected
                                  ? 'bg-[#f56c6c] text-white'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-[#1f2733]">{lvl.levelName}</span>
                          </div>
                          <div>
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#67c23a]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>已通过</span>
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#e6a23c]">
                                <Clock className="w-3.5 h-3.5 animate-pulse" />
                                <span>待审核</span>
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#f56c6c]">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>已驳回</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#909399]">等待流转</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#606266] mt-1.5 pl-7">
                          <span>
                            指定审批人: <strong className="text-[#303133]">{lvl.approverName}</strong>
                          </span>
                          <span>
                            归属: <span>{lvl.roleName} · {lvl.deptName}</span>
                          </span>
                          {lvl.auditTime && (
                            <span className="font-mono text-[#909399]">
                              审核时间: {lvl.auditTime}
                            </span>
                          )}
                        </div>

                        {lvl.auditRemark && (
                          <div className="mt-1.5 ml-7 p-2 rounded bg-white/80 border border-gray-200 text-[11px] text-[#4b5563] leading-relaxed">
                            <span className="font-medium text-[#1f2733]">审批意见：</span>
                            {lvl.auditRemark}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer: strictly pinned at bottom with shrink-0 */}
            <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between text-xs shrink-0">
              {!isRisk ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOnlinePreviewDoc(previewItem)}
                    className="h-8 px-3 rounded bg-[#ecf5ff] text-[#409eff] hover:bg-[#409eff] hover:text-white border border-[#b3d8ff] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>在线预览正文</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadDocumentFile(previewItem, showToast)}
                    className="h-8 px-3 rounded bg-white text-[#606266] hover:text-[#67c23a] hover:border-[#67c23a] border border-[#dcdfe6] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>自动下载文件</span>
                  </button>
                </div>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2 ml-auto">
                {!isReadOnly && (previewItem.status || 'approved') !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = previewItem;
                      setPreviewItem(null);
                      setPreviewDetailMaximized(false);
                      handleOpenAudit(target);
                    }}
                    className="h-8 px-3.5 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white font-medium cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>合规审批</span>
                  </button>
                )}
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = previewItem;
                      setPreviewItem(null);
                      setPreviewDetailMaximized(false);
                      handleOpenEditItem(target);
                    }}
                    className="h-8 px-4 rounded bg-[#409eff] hover:bg-[#3390ff] text-white font-medium cursor-pointer shadow-2xs"
                  >
                    编辑
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPreviewItem(null);
                    setPreviewDetailMaximized(false);
                  }}
                  className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-[#606266] hover:border-[#409eff] hover:text-[#409eff] cursor-pointer shadow-2xs"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {folderModal.open && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl border border-[#ebeef5] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <span className="text-sm font-semibold text-[#1f2733]">
                {folderModal.mode === 'create' ? '新建业务目录' : '重命名目录'}
              </span>
              <button
                onClick={() => setFolderModal({ ...folderModal, open: false })}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex-1 min-h-0 overflow-y-auto">
              <label className="block text-xs text-[#606266] mb-1.5 font-medium">
                目录名称
              </label>
              <input
                type="text"
                autoFocus
                value={folderModal.label}
                onChange={(e) => setFolderModal({ ...folderModal, label: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveFolder()}
                placeholder="请输入目录名称"
                className="w-full h-9 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] text-xs outline-none"
              />
            </div>
            <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setFolderModal({ ...folderModal, open: false })}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveFolder}
                className="h-8 px-4 rounded bg-[#409eff] text-white text-xs font-medium cursor-pointer"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {itemModal.open && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl sm:max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border border-[#ebeef5] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <span className="text-sm font-semibold text-[#1f2733]">
                {itemModal.isEdit
                  ? isRisk
                    ? '编辑风险合规条款'
                    : '编辑制度文件'
                  : isRisk
                  ? '新建风险合规条款'
                  : '新建制度文件'}
              </span>
              <button
                onClick={() => setItemModal({ open: false, isEdit: false, form: {} })}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#606266] mb-1 font-medium">所属目录</label>
                  <select
                    value={itemModal.form.folderId || ''}
                    onChange={(e) =>
                      setItemModal({
                        ...itemModal,
                        form: { ...itemModal.form, folderId: e.target.value },
                      })
                    }
                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] bg-white outline-none"
                  >
                    {tree
                      .filter((n) => n.parentId !== '')
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#606266] mb-1 font-medium">
                    {isRisk ? '风险编号' : '制度编码'}
                  </label>
                  <input
                    type="text"
                    value={isRisk ? itemModal.form.riskNo || '' : itemModal.form.docNo || ''}
                    onChange={(e) =>
                      setItemModal({
                        ...itemModal,
                        form: {
                          ...itemModal.form,
                          [isRisk ? 'riskNo' : 'docNo']: e.target.value,
                        },
                      })
                    }
                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] font-mono-tabular outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#606266] mb-1 font-medium">
                  {isRisk ? '风险条款名称' : '制度文件全称'}
                </label>
                <input
                  type="text"
                  value={itemModal.form.label || ''}
                  onChange={(e) =>
                    setItemModal({
                      ...itemModal,
                      form: { ...itemModal.form, label: e.target.value },
                    })
                  }
                  placeholder={
                    isRisk ? '例如：立项决策TR1评审合规风险' : '例如：全元集成产品开发管理规范.pdf'
                  }
                  className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] outline-none"
                />
              </div>
              {isRisk ? (
                <div>
                  <label className="block text-[#606266] mb-1 font-medium">
                    控制目标与合规要求
                  </label>
                  <textarea
                    rows={2}
                    value={itemModal.form.target || ''}
                    onChange={(e) =>
                      setItemModal({
                        ...itemModal,
                        form: { ...itemModal.form, target: e.target.value },
                      })
                    }
                    placeholder="请输入合规要求或控制目标说明"
                    className="w-full p-2.5 rounded border border-[#dcdfe6] outline-none resize-none"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#606266] mb-1 font-medium">版本号</label>
                    <input
                      type="text"
                      value={itemModal.form.versionNo || 'V1.0'}
                      onChange={(e) =>
                        setItemModal({
                          ...itemModal,
                          form: { ...itemModal.form, versionNo: e.target.value },
                        })
                      }
                      className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#606266] mb-1 font-medium">归口责任人</label>
                    <PersonSelectField
                      value={itemModal.form.ownerName || ''}
                      onChange={(val) => {
                        const selName = typeof val === 'string' ? val : (val[0] || '');
                        setItemModal({
                          ...itemModal,
                          form: { ...itemModal.form, ownerName: selName },
                        });
                      }}
                      modalTitle="选择归口责任人"
                      modalDescription="支持手工输入中英文姓名或从组织架构部门挑选制度/标准归口责任人"
                      placeholder="选择或手工输入归口责任人..."
                      className="w-full text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[#606266] font-medium flex items-center gap-1.5">
                        <span>制度文件有效期</span>
                        <span className="text-[10px] text-[#409eff] bg-[#ecf5ff] px-1.5 py-0.5 rounded border border-[#d9ecff] font-normal">
                          自动同步自生效开始与截止日期
                        </span>
                      </label>
                      {(() => {
                        const autoP = deriveValidityPeriod(itemModal.form, customFields);
                        if (autoP && autoP !== itemModal.form.validityPeriod) {
                          return (
                            <button
                              type="button"
                              onClick={() =>
                                setItemModal({
                                  ...itemModal,
                                  form: { ...itemModal.form, validityPeriod: autoP },
                                })
                              }
                              className="text-[11px] text-[#409eff] hover:underline cursor-pointer"
                              title="点击同步为下方生效起止日期"
                            >
                              一键同步为: {autoP}
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <input
                      type="text"
                      value={itemModal.form.validityPeriod || ''}
                      onChange={(e) =>
                        setItemModal({
                          ...itemModal,
                          form: { ...itemModal.form, validityPeriod: e.target.value },
                        })
                      }
                      placeholder="自动取自下方生效开始与截止日期，如：2026-04-02 至 2026-12-30"
                      className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-xs bg-white font-mono-tabular"
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {isRisk && (
                  <div>
                    <label className="block text-[#606266] mb-1 font-medium">风险等级</label>
                    <select
                      value={itemModal.form.riskLevel || '高'}
                      onChange={(e) =>
                        setItemModal({
                          ...itemModal,
                          form: { ...itemModal.form, riskLevel: e.target.value },
                        })
                      }
                      className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] bg-white outline-none"
                    >
                      <option value="高">高风险</option>
                      <option value="中">中风险</option>
                      <option value="低">低风险</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-[#606266] mb-1 font-medium">发布生效模式</label>
                  <select
                    value={itemModal.form.status || 'pending'}
                    onChange={(e) =>
                      setItemModal({
                        ...itemModal,
                        form: { ...itemModal.form, status: e.target.value },
                      })
                    }
                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] bg-white outline-none"
                  >
                    <option value="pending">待审核 (需审批通过后才在查阅目录展示)</option>
                    <option value="approved">直接生效 (管理员特批发布)</option>
                  </select>
                </div>
              </div>
              {!isRisk && customFields.length > 0 && (
                <div className="pt-3 border-t border-[#ebeef5] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1f2733] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#409eff]" />
                      扩展表单业务属性
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setItemModal({ open: false, isEdit: false, form: {} });
                        onNavigate?.('/system/column', 'form_sysdoc');
                      }}
                      className="text-[11px] text-[#409eff] hover:underline cursor-pointer"
                    >
                      设计表单字段 &rarr;
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 bg-[#fafbfc] p-3 rounded border border-[#ebeef5]">
                    {customFields.map((f: any) => {
                      const val =
                        itemModal.form[f.fieldKey] !== undefined
                          ? itemModal.form[f.fieldKey]
                          : f.defaultValue ?? '';
                      const updateField = (newVal: any) => {
                        const nextForm = { ...itemModal.form, [f.fieldKey]: newVal };
                        if (isStartDateField(f) || isEndDateField(f)) {
                          const autoP = deriveValidityPeriod(nextForm, customFields);
                          if (autoP) {
                            nextForm.validityPeriod = autoP;
                          }
                        }
                        setItemModal({
                          ...itemModal,
                          form: nextForm,
                        });
                      };
                      return (
                        <div key={f.id} className={f.span === 24 ? 'col-span-2' : ''}>
                          <label className="block text-[#606266] mb-1 font-medium flex items-center gap-1">
                            <span>{f.label}</span>
                            {f.required && <span className="text-[#f56c6c]">*</span>}
                            {f.tooltip && (
                              <span className="text-[#909399] font-normal text-[10px]" title={f.tooltip}>
                                ({f.tooltip})
                              </span>
                            )}
                          </label>
                          {f.type === 'textarea' ? (
                            <textarea
                              rows={2}
                              value={val}
                              onChange={(e) => updateField(e.target.value)}
                              placeholder={f.placeholder || `请输入${f.label}`}
                              className="w-full p-2 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-xs bg-white"
                            />
                          ) : f.type === 'number' ? (
                            <input
                              type="number"
                              value={val}
                              onChange={(e) => updateField(Number(e.target.value))}
                              placeholder={f.placeholder || '0'}
                              className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-xs bg-white font-mono-tabular"
                            />
                          ) : f.type === 'select' ? (
                            <select
                              value={val}
                              onChange={(e) => updateField(e.target.value)}
                              className="w-full h-8 px-2 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-xs bg-white"
                            >
                              {(f.options || []).map((opt: string) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : f.type === 'switch' ? (
                            <div className="flex items-center gap-2 h-8">
                              <button
                                type="button"
                                onClick={() => updateField(!val)}
                                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                                  val ? 'bg-[#409eff]' : 'bg-[#dcdfe6]'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                                    val ? 'left-5' : 'left-0.5'
                                  }`}
                                />
                              </button>
                              <span className="text-xs text-[#606266]">{val ? '已开启' : '已关闭'}</span>
                            </div>
                          ) : f.type === 'userPicker' || (f.label && (f.label.includes('人') || f.label.includes('起草') || f.label.includes('审核') || f.label.includes('决策') || f.label.includes('签发'))) || (f.fieldKey && f.fieldKey.toLowerCase().includes('user')) ? (
                            <PersonSelectField
                              value={val || ''}
                              onChange={(newVal) => updateField(newVal)}
                              placeholder={f.placeholder || `点击选择或手工输入${f.label}...`}
                              modalTitle={`选择${f.label}`}
                              modalDescription={`支持手工输入中英文姓名或从组织架构部门挑选【${f.label}】`}
                              className="w-full text-xs"
                              showToast={showToast}
                            />
                          ) : f.type === 'date' || (f.label && f.label.includes('日期')) ? (
                            <input
                              type="date"
                              value={val}
                              onChange={(e) => updateField(e.target.value)}
                              placeholder={f.placeholder || 'YYYY-MM-DD'}
                              className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-xs bg-white font-mono-tabular cursor-pointer"
                            />
                          ) : (
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => updateField(e.target.value)}
                              placeholder={f.placeholder || `请输入${f.label}`}
                              className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-xs bg-white"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 多层级审批流与指定审批人配置卡片 */}
              <div className="pt-3 border-t border-[#ebeef5] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1f2733] flex items-center gap-1.5">
                    <GitFork className="w-3.5 h-3.5 text-[#2F7BFE]" />
                    <span>多层级审批路径与审批人</span>
                    <span className="text-[10px] text-[#2F7BFE] bg-[#ecf5ff] px-2 py-0.5 rounded border border-[#b3d8ff] font-normal">
                      共 {itemModal.form.approvalFlow?.length || 0} 级递进审核
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = itemModal.form.approvalFlow || [];
                      const nextLvl = cur.length + 1;
                      setItemModal({
                        ...itemModal,
                        form: {
                          ...itemModal.form,
                          approvalFlow: [
                            ...cur,
                            {
                              level: nextLvl,
                              levelName: `第${nextLvl}级: 补充审核`,
                              approverName: '陈静',
                              roleName: '合规复核员',
                              deptName: '质量合规部',
                              status: 'waiting',
                            },
                          ],
                        },
                      });
                    }}
                    className="text-[11px] text-[#2F7BFE] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>添加审批层级</span>
                  </button>
                </div>

                <div className="space-y-2 bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
                  {(itemModal.form.approvalFlow || []).map((lvl: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white p-2.5 rounded border border-[#ebeef5] shadow-2xs flex flex-col sm:flex-row sm:items-center gap-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2 shrink-0 sm:w-36">
                        <span className="w-5 h-5 rounded-full bg-[#ecf5ff] text-[#2F7BFE] font-bold text-[10px] flex items-center justify-center shrink-0 border border-[#b3d8ff]">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={lvl.levelName}
                          onChange={(e) => {
                            const next = [...(itemModal.form.approvalFlow || [])];
                            next[idx].levelName = e.target.value;
                            setItemModal({ ...itemModal, form: { ...itemModal.form, approvalFlow: next } });
                          }}
                          className="h-7 px-2 rounded border border-[#dcdfe6] text-xs font-semibold text-[#1f2733] focus:border-[#2F7BFE] outline-none w-full"
                          placeholder="节点名称"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <PersonSelectField
                          value={lvl.approverName}
                          onChange={(val, person) => {
                            const next = [...(itemModal.form.approvalFlow || [])];
                            next[idx].approverName = val;
                            if (person) {
                              next[idx].roleName = person.roleName || '审批人';
                              next[idx].deptName = person.deptName || '综合管理部';
                            }
                            setItemModal({ ...itemModal, form: { ...itemModal.form, approvalFlow: next } });
                          }}
                          placeholder="选择或手工输入审批人..."
                          modalTitle="指定审批人"
                          modalDescription="支持手工输入中英文姓名或从组织架构部门人员树中挑选审批人"
                          className="w-full text-xs"
                          showToast={showToast}
                        />
                      </div>

                      <div className="shrink-0 sm:w-44">
                        <input
                          type="text"
                          value={`${lvl.roleName || '审批人'} · ${lvl.deptName || '部门'}`}
                          onChange={(e) => {
                            const parts = e.target.value.split('·');
                            const next = [...(itemModal.form.approvalFlow || [])];
                            next[idx].roleName = parts[0]?.trim() || '';
                            next[idx].deptName = parts[1]?.trim() || '';
                            setItemModal({ ...itemModal, form: { ...itemModal.form, approvalFlow: next } });
                          }}
                          placeholder="角色 · 部门"
                          className="h-7 px-2 rounded border border-[#dcdfe6] text-[11px] text-[#606266] focus:border-[#2F7BFE] outline-none w-full"
                          title="审批人角色与部门，格式：角色 · 部门"
                        />
                      </div>

                      {(itemModal.form.approvalFlow?.length || 0) > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = (itemModal.form.approvalFlow || [])
                              .filter((_: any, i: number) => i !== idx)
                              .map((item: any, i: number) => ({
                                ...item,
                                level: i + 1,
                                levelName: item.levelName.replace(/第\d+级/, `第${i + 1}级`),
                              }));
                            setItemModal({ ...itemModal, form: { ...itemModal.form, approvalFlow: next } });
                          }}
                          className="text-[#f56c6c] hover:bg-[#fef0f0] p-1.5 rounded cursor-pointer shrink-0"
                          title="移除此审批层级"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setItemModal({ open: false, isEdit: false, form: {} })}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveItem}
                className="h-8 px-4 rounded bg-[#409eff] text-white text-xs font-medium cursor-pointer"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {onlinePreviewDoc && (
        <OnlineDocumentPreviewModal
          document={onlinePreviewDoc}
          onClose={() => setOnlinePreviewDoc(null)}
          showToast={showToast}
          allowDownload={canDownload}
          previewOnly={previewOnly}
        />
      )}

      {/* ============================================================ */}
      {/* 弹窗 1: 多层级审批决议弹窗 (auditModal) */}
      {/* ============================================================ */}
      {auditModal.open && auditModal.item && (() => {
        const flow: ApprovalLevelConfig[] = Array.isArray(auditModal.item.approvalFlow) ? auditModal.item.approvalFlow : [];
        const curIdx = flow.findIndex((l: any) => l.status === 'pending');
        const curLevel = curIdx >= 0 ? flow[curIdx] : flow[0] || {
          level: 1,
          levelName: '第1级审核',
          approverName: '审批人',
          roleName: '审核员',
          deptName: '管理部',
        };
        const isFinalLevel = curIdx === flow.length - 1 || curIdx === -1;
        const nextLevel = curIdx >= 0 && curIdx + 1 < flow.length ? flow[curIdx + 1] : null;

        return (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-xl flex flex-col shadow-2xl border border-[#ebeef5] overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
              <div className="px-5 py-3.5 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[#ecf5ff] text-[#2F7BFE] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#1f2733] block">
                      {isRisk ? '风险合规条款 · 多层级审批' : '制度文件规范 · 多层级审批'}
                    </span>
                    <span className="text-[11px] text-[#909399]">
                      当前流转：第 {curLevel.level} 级 / 共 {flow.length} 级审批节点
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAuditModal({ open: false, item: null, decision: 'approved', remark: '' })}
                  className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1 min-h-0">
                {/* 待审条目卡片 */}
                <div className="bg-[#f8f9fa] rounded-lg p-3 border border-[#ebeef5] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#909399] font-medium">{auditModal.item.docNo || auditModal.item.riskNo}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                      <span>待第 {curLevel.level} 级审批</span>
                    </span>
                  </div>
                  <div className="font-bold text-sm text-[#303133]">
                    {auditModal.item.label}
                  </div>
                  <div className="flex items-center gap-4 text-[#606266] text-[11px] pt-1.5 border-t border-[#ebeef5]">
                    <span>所属目录: <strong className="text-[#303133]">{auditModal.item.category || '根目录'}</strong></span>
                    <span>责任人: <strong className="text-[#303133]">{auditModal.item.ownerName || '系统管理员'}</strong></span>
                  </div>
                </div>

                {/* 多层级审批流转进度条 */}
                <div className="bg-white p-3 rounded-lg border border-[#e2e8f0] shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#606266]">
                    <span className="font-medium text-[#1f2733] flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5 text-[#2F7BFE]" />
                      <span>审批路径进度 (依次流转)</span>
                    </span>
                    <span className="text-[#909399]">各级通过后自动推送</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {flow.map((lvl, i) => {
                      const isPast = lvl.status === 'approved';
                      const isCur = lvl.status === 'pending';
                      const isRej = lvl.status === 'rejected';

                      return (
                        <div
                          key={i}
                          className={`p-2 rounded border text-[11px] relative flex flex-col justify-between ${
                            isPast
                              ? 'bg-[#f0f9eb] border-[#c2e7b0] text-[#67c23a]'
                              : isCur
                              ? 'bg-[#ecf5ff] border-[#b3d8ff] text-[#2F7BFE] ring-1 ring-[#2F7BFE]/40'
                              : isRej
                              ? 'bg-[#fef0f0] border-[#fde2e2] text-[#f56c6c]'
                              : 'bg-gray-50 border-gray-200 text-gray-500'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold mb-1">
                            <span>第{i + 1}级</span>
                            {isPast ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#67c23a]" />
                            ) : isCur ? (
                              <span className="text-[10px] bg-[#2F7BFE] text-white px-1.5 py-0.2 rounded font-normal">当前待审</span>
                            ) : isRej ? (
                              <AlertCircle className="w-3.5 h-3.5 text-[#f56c6c]" />
                            ) : (
                              <span className="text-[10px] text-gray-400">待流转</span>
                            )}
                          </div>
                          <div className="truncate font-medium text-[#1f2733]">{lvl.levelName}</div>
                          <div className="text-[10px] text-[#606266] truncate mt-0.5">
                            {lvl.approverName} ({lvl.deptName})
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 前置层级审批意见（如果存在） */}
                {curIdx > 0 && (
                  <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] space-y-2">
                    <span className="font-semibold text-[11px] text-[#606266] block">
                      前置层级审批记录:
                    </span>
                    {flow.slice(0, curIdx).map((past, pi) => (
                      <div key={pi} className="text-[11px] pl-2 border-l-2 border-[#67c23a] space-y-0.5">
                        <div className="flex items-center gap-2 text-[#303133]">
                          <strong className="text-[#67c23a]">{past.levelName}</strong>
                          <span>· 审批人: {past.auditor || past.approverName}</span>
                          <span className="text-[10px] text-[#909399] font-mono">{past.auditTime}</span>
                        </div>
                        <div className="text-[#606266] italic">
                          "{past.auditRemark || '审批通过'}"
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 审批结论单选 */}
                <div>
                  <label className="block font-semibold text-[#303133] mb-1.5">
                    第 {curLevel.level} 级审批结论 (责任人: {curLevel.approverName})
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => {
                        setAuditModal((prev) => ({
                          ...prev,
                          decision: 'approved',
                          remark: isFinalLevel
                            ? '经合规终审，制度规范条款完整有效，权责与内控要求明确，准予在查阅目录正式发布展示。'
                            : `经${curLevel.levelName}审查，条款规范符合合规标准，准予移交下一层级复核。`,
                        }));
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        auditModal.decision === 'approved'
                          ? 'border-[#67c23a] bg-[#f0f9eb] text-[#67c23a] font-semibold shadow-2xs'
                          : 'border-[#dcdfe6] hover:bg-gray-50 text-[#606266]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="auditDecision"
                        checked={auditModal.decision === 'approved'}
                        onChange={() => {}}
                        className="text-[#67c23a]"
                      />
                      <CheckCircle2 className="w-4 h-4 text-[#67c23a]" />
                      <div className="text-left">
                        <div>{isFinalLevel ? '终审通过并正式对外发布' : `审核通过 (流转至下一级)`}</div>
                        <span className="text-[10px] font-normal text-gray-500 block">
                          {isFinalLevel ? '全流程完结，查阅目录立即公开' : `下一级: ${nextLevel?.approverName || '下一位审批人'}`}
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={() => {
                        setAuditModal((prev) => ({
                          ...prev,
                          decision: 'rejected',
                          remark: `在${curLevel.levelName}环节发现条款存在合规漏洞或缺少必要附件，请退回修改完善后重新送审。`,
                        }));
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        auditModal.decision === 'rejected'
                          ? 'border-[#f56c6c] bg-[#fef0f0] text-[#f56c6c] font-semibold shadow-2xs'
                          : 'border-[#dcdfe6] hover:bg-gray-50 text-[#606266]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="auditDecision"
                        checked={auditModal.decision === 'rejected'}
                        onChange={() => {}}
                        className="text-[#f56c6c]"
                      />
                      <AlertCircle className="w-4 h-4 text-[#f56c6c]" />
                      <div className="text-left">
                        <div>驳回修改 (退回重改)</div>
                        <span className="text-[10px] font-normal text-gray-500 block">
                          阻断当前流转，发起人完善后重审
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 审批意见 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-[#303133]">审批合规批注 / 意见</label>
                    <span className="text-[10px] text-[#909399]">将记录在文件多层级审批台账中</span>
                  </div>
                  <textarea
                    rows={3}
                    value={auditModal.remark}
                    onChange={(e) => setAuditModal((prev) => ({ ...prev, remark: e.target.value }))}
                    placeholder="请输入审批审核意见..."
                    className="w-full p-2.5 rounded border border-[#dcdfe6] focus:border-[#2F7BFE] focus:outline-none text-xs resize-none"
                  />
                  {/* 快捷评语 */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {[
                      '准予流转至下一级复核',
                      '经审核符合内控规范，准予通过',
                      '终审批准，准予在查阅目录公开',
                      '缺少必要附件材料，请补齐',
                      '合规条款与现行规章冲突，退回修改',
                    ].map((phrase) => (
                      <button
                        key={phrase}
                        type="button"
                        onClick={() => setAuditModal((prev) => ({ ...prev, remark: phrase }))}
                        className="text-[10px] px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
                      >
                        {phrase}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setAuditModal({ open: false, item: null, decision: 'approved', remark: '' })}
                  className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] hover:bg-gray-50 cursor-pointer"
                >
                  取消
                </button>
                {auditModal.decision === 'approved' ? (
                  <button
                    type="button"
                    onClick={() => handleSubmitAudit('approved')}
                    className="h-8 px-5 rounded bg-[#67c23a] hover:bg-[#5daf34] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {isFinalLevel ? '终审通过并发布生效' : `通过并流转至下一级`}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubmitAudit('rejected')}
                    className="h-8 px-5 rounded bg-[#f56c6c] hover:bg-[#e64242] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>确认驳回修改</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================ */}
      {/* 弹窗 2: 全局多层级审批路径与审批人设置 (pathConfigModal) */}
      {/* ============================================================ */}
      {pathConfigModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl flex flex-col shadow-2xl border border-[#ebeef5] overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[88vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#ebeef5] bg-[#fafbfc] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ecf5ff] text-[#2F7BFE] flex items-center justify-center border border-[#b3d8ff]">
                  <GitFork className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1f2733]">多层级审批路径与责任人设置</h3>
                  <p className="text-[11px] text-[#909399]">
                    支持从组织架构部门挑选人员或手工输入用户名，新增内容将严格按照设定的路径逐级送审
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPathConfigModalOpen(false)}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switch */}
            <div className="px-6 pt-3 border-b border-[#ebeef5] bg-white flex items-center gap-4 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setPathConfigTab('sysDoc')}
                className={`pb-2.5 font-semibold cursor-pointer border-b-2 flex items-center gap-1.5 transition-colors ${
                  pathConfigTab === 'sysDoc'
                    ? 'border-[#2F7BFE] text-[#2F7BFE]'
                    : 'border-transparent text-[#606266] hover:text-[#1f2733]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>制度文件审批路径</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-50 text-[#2F7BFE] border border-blue-100">
                  {editingPaths.sysDoc?.length || 0} 级
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPathConfigTab('risk')}
                className={`pb-2.5 font-semibold cursor-pointer border-b-2 flex items-center gap-1.5 transition-colors ${
                  pathConfigTab === 'risk'
                    ? 'border-[#2F7BFE] text-[#2F7BFE]'
                    : 'border-transparent text-[#606266] hover:text-[#1f2733]'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>风险合规审批路径</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-50 text-[#2F7BFE] border border-blue-100">
                  {editingPaths.risk?.length || 0} 级
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1 min-h-0 bg-[#fafbfc]/40">
              <div className="p-3 bg-[#f0f7ff] rounded-lg border border-[#b3d8ff] text-[#1e3a8a] flex items-start gap-2.5">
                <CheckSquare className="w-4 h-4 text-[#2F7BFE] shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>流转规则说明：</strong>
                  在【{pathConfigTab === 'sysDoc' ? '制度文件库' : '风险合规库'}】中新建或提交送审的内容，默认自动套用以下多层级审批模板。只有当所有层级全部审核通过后，该文件才会发布并正式呈现在【{pathConfigTab === 'sysDoc' ? '制度查阅' : '风险查阅'}】相应层级目录中。
                </div>
              </div>

              {/* Levels list */}
              <div className="space-y-3">
                {(editingPaths[pathConfigTab] || []).map((node, idx) => {
                  const total = editingPaths[pathConfigTab]?.length || 0;

                  return (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-xl border border-[#ebeef5] shadow-xs space-y-3 relative group hover:border-[#b3d8ff] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#2F7BFE] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-sm text-[#1f2733]">
                            第 {idx + 1} 级审批节点
                          </span>
                          {idx === 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#2F7BFE] text-[10px] font-medium border border-blue-100">
                              第一责任人 / 起始节点
                            </span>
                          )}
                          {idx === total - 1 && total > 1 && (
                            <span className="px-1.5 py-0.5 rounded bg-green-50 text-[#67c23a] text-[10px] font-medium border border-green-100">
                              终审决策 / 准予生效
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const list = [...editingPaths[pathConfigTab]];
                              const temp = list[idx - 1];
                              list[idx - 1] = list[idx];
                              list[idx] = temp;
                              setEditingPaths({
                                ...editingPaths,
                                [pathConfigTab]: list.map((l, i) => ({
                                  ...l,
                                  level: i + 1,
                                  levelName: l.levelName.replace(/第\d+级/, `第${i + 1}级`),
                                })),
                              });
                            }}
                            className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 cursor-pointer"
                            title="上移此层级"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === total - 1}
                            onClick={() => {
                              const list = [...editingPaths[pathConfigTab]];
                              const temp = list[idx + 1];
                              list[idx + 1] = list[idx];
                              list[idx] = temp;
                              setEditingPaths({
                                ...editingPaths,
                                [pathConfigTab]: list.map((l, i) => ({
                                  ...l,
                                  level: i + 1,
                                  levelName: l.levelName.replace(/第\d+级/, `第${i + 1}级`),
                                })),
                              });
                            }}
                            className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 cursor-pointer"
                            title="下移此层级"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          {total > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const list = editingPaths[pathConfigTab].filter((_, i) => i !== idx);
                                setEditingPaths({
                                  ...editingPaths,
                                  [pathConfigTab]: list.map((l, i) => ({
                                    ...l,
                                    level: i + 1,
                                    levelName: l.levelName.replace(/第\d+级/, `第${i + 1}级`),
                                  })),
                                });
                              }}
                              className="text-[#f56c6c] hover:bg-[#fef0f0] p-1 rounded cursor-pointer ml-1"
                              title="移除此级"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* 节点名称 */}
                        <div>
                          <label className="block text-[11px] text-[#606266] font-medium mb-1">
                            节点名称:
                          </label>
                          <input
                            type="text"
                            value={node.levelName}
                            onChange={(e) => {
                              const list = [...editingPaths[pathConfigTab]];
                              list[idx].levelName = e.target.value;
                              setEditingPaths({ ...editingPaths, [pathConfigTab]: list });
                            }}
                            placeholder="如: 第1级: 归口部门初审"
                            className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#2F7BFE] outline-none text-xs bg-white font-medium"
                          />
                        </div>

                        {/* 指定审批人 */}
                        <div>
                          <label className="block text-[11px] text-[#606266] font-medium mb-1">
                            指定审批人 (选人/手工输入):
                          </label>
                          <PersonSelectField
                            value={node.approverName}
                            onChange={(val, person) => {
                              const list = [...editingPaths[pathConfigTab]];
                              list[idx].approverName = val;
                              if (person) {
                                list[idx].roleName = person.roleName || '审批人';
                                list[idx].deptName = person.deptName || '综合管理部';
                              }
                              setEditingPaths({ ...editingPaths, [pathConfigTab]: list });
                            }}
                            placeholder="选择或输入审批人姓名..."
                            modalTitle="指定审批人"
                            modalDescription="支持手工输入中英文姓名或从组织架构部门挑选审批人"
                            className="w-full text-xs"
                            showToast={showToast}
                          />
                        </div>

                        {/* 角色与部门 */}
                        <div>
                          <label className="block text-[11px] text-[#606266] font-medium mb-1">
                            审批角色 · 所属部门:
                          </label>
                          <input
                            type="text"
                            value={`${node.roleName || '审批人'} · ${node.deptName || '部门'}`}
                            onChange={(e) => {
                              const parts = e.target.value.split('·');
                              const list = [...editingPaths[pathConfigTab]];
                              list[idx].roleName = parts[0]?.trim() || '';
                              list[idx].deptName = parts[1]?.trim() || '';
                              setEditingPaths({ ...editingPaths, [pathConfigTab]: list });
                            }}
                            placeholder="角色 · 部门"
                            className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#2F7BFE] outline-none text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Level Button */}
              <button
                type="button"
                onClick={() => {
                  const list = editingPaths[pathConfigTab] || [];
                  const nextLvl = list.length + 1;
                  const newNode: ApprovalLevelConfig = {
                    level: nextLvl,
                    levelName: `第${nextLvl}级: 补充合规复审`,
                    approverName: '陈静',
                    roleName: '合规总监',
                    deptName: '质量合规部',
                  };
                  setEditingPaths({
                    ...editingPaths,
                    [pathConfigTab]: [...list, newNode],
                  });
                }}
                className="w-full py-2.5 rounded-xl border border-dashed border-[#b3d8ff] bg-[#ecf5ff]/40 hover:bg-[#ecf5ff] text-[#2F7BFE] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>添加下一级审批节点</span>
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  const defaults = {
                    sysDoc: [
                      { level: 1, levelName: '第1级: 归口部门初审', approverName: '张明', roleName: '部门经理', deptName: '流程管理部' },
                      { level: 2, levelName: '第2级: 质量合规复核', approverName: '陈静', roleName: '合规总监', deptName: '质量合规部' },
                      { level: 3, levelName: '第3级: 决策层终审签发', approverName: '刘建国', roleName: '副总裁', deptName: '决策委员会' },
                    ],
                    risk: [
                      { level: 1, levelName: '第1级: 业务线风控员初核', approverName: '李合规', roleName: '风控专员', deptName: '研发管理中心' },
                      { level: 2, levelName: '第2级: 质量合规部终审', approverName: '陈静', roleName: '合规总监', deptName: '质量合规部' },
                    ],
                  };
                  setEditingPaths(defaults);
                  showToast('已重置为系统出厂标准审批路径', 'success');
                }}
                className="text-xs text-[#909399] hover:text-[#409eff] cursor-pointer"
              >
                恢复标准预设
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPathConfigModalOpen(false)}
                  className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] hover:bg-gray-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveApprovalPaths}
                  className="h-8 px-5 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>保存审批路径配置</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 弹窗 3: 审批流转轨迹与详情弹窗 (auditTraceModal) */}
      {/* ============================================================ */}
      {auditTraceModal.open && auditTraceModal.item && (() => {
        const item = auditTraceModal.item;
        const flow: ApprovalLevelConfig[] = Array.isArray(item.approvalFlow) ? item.approvalFlow : [];
        const isApproved = (item.status || 'approved') === 'approved';
        const isRejected = item.status === 'rejected';

        return (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg flex flex-col shadow-2xl border border-[#ebeef5] overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[85vh]">
              <div className="px-5 py-3.5 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[#ecf5ff] text-[#2F7BFE] flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-[#1f2733]">多层级审批流转轨迹</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAuditTraceModal({ open: false, item: null })}
                  className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1 min-h-0">
                {/* File Header */}
                <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#909399] font-medium">{item.docNo || item.riskNo}</span>
                    {isApproved ? (
                      <span className="px-2 py-0.5 rounded bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8] text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>已全部审核通过</span>
                      </span>
                    ) : isRejected ? (
                      <span className="px-2 py-0.5 rounded bg-[#fef0f0] text-[#f56c6c] border border-[#fde2e2] text-[10px] font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>已驳回</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-pulse" />
                        <span>多级审核中</span>
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-[#1f2733] text-sm">{item.label}</h4>
                  <div className="text-[11px] text-[#606266] flex items-center gap-3 pt-1 border-t border-[#ebeef5]">
                    <span>归属目录: <strong>{item.category || '根目录'}</strong></span>
                    <span>发起责任人: <strong>{item.ownerName || '系统管理员'}</strong></span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3 relative pl-3 before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#e2e8f0]">
                  {flow.map((node, i) => {
                    const isNodeApproved = node.status === 'approved';
                    const isNodePending = node.status === 'pending';
                    const isNodeRejected = node.status === 'rejected';

                    return (
                      <div key={i} className="relative flex items-start gap-3">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 z-10 ${
                            isNodeApproved
                              ? 'bg-[#67c23a] text-white shadow-xs'
                              : isNodePending
                              ? 'bg-[#2F7BFE] text-white ring-4 ring-blue-100'
                              : isNodeRejected
                              ? 'bg-[#f56c6c] text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {i + 1}
                        </span>

                        <div
                          className={`flex-1 p-3 rounded-lg border text-xs space-y-1.5 ${
                            isNodeApproved
                              ? 'bg-[#f0f9eb]/60 border-[#e1f3d8]'
                              : isNodePending
                              ? 'bg-[#ecf5ff] border-[#b3d8ff] ring-1 ring-[#2F7BFE]/30'
                              : isNodeRejected
                              ? 'bg-[#fef0f0]/60 border-[#fde2e2]'
                              : 'bg-white border-[#ebeef5]'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-[#1f2733]">{node.levelName}</span>
                            {isNodeApproved ? (
                              <span className="text-[10px] text-[#67c23a] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>审核通过</span>
                              </span>
                            ) : isNodePending ? (
                              <span className="text-[10px] text-[#2F7BFE] flex items-center gap-1 font-bold">
                                <Clock className="w-3 h-3 animate-pulse" />
                                <span>当前待审</span>
                              </span>
                            ) : isNodeRejected ? (
                              <span className="text-[10px] text-[#f56c6c] flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>已驳回</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400">等待流转</span>
                            )}
                          </div>

                          <div className="text-[11px] text-[#606266] flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            <span>指定审批人: <strong className="text-[#1f2733]">{node.approverName}</strong></span>
                            <span>角色部门: {node.roleName} · {node.deptName}</span>
                            {node.auditTime && (
                              <span className="text-[#909399] font-mono">{node.auditTime}</span>
                            )}
                          </div>

                          {node.auditRemark && (
                            <div className="p-2 rounded bg-white/90 border border-gray-200 text-[11px] text-[#374151] leading-relaxed">
                              <span className="font-medium text-[#1f2733]">审批意见：</span>
                              {node.auditRemark}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
                <span className="text-[11px] text-[#909399]">
                  全部通过后方可在查阅目录公开
                </span>
                <div className="flex items-center gap-2">
                  {!isApproved && !isReadOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = auditTraceModal.item;
                        setAuditTraceModal({ open: false, item: null });
                        handleOpenAudit(target);
                      }}
                      className="h-8 px-4 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>执行审批</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAuditTraceModal({ open: false, item: null })}
                    className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] hover:bg-gray-50 cursor-pointer"
                  >
                    关闭
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
