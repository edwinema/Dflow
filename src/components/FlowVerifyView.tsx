import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  RotateCcw,
  Plus,
  Trash2,
  Download,
  X,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Undo2,
  GitCommitHorizontal,
  FileText,
  Layers,
  Filter,
  Eye,
  Flame,
  ShieldCheck,
  CheckSquare,
  Square,
  Sparkles,
  ChevronRight,
  UserCheck,
  Building2,
  BookOpen,
  Calendar,
  Send,
  Workflow,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { EnterpriseDataGrid } from './EnterpriseDataGrid';

export interface ApprovalLevelItem {
  level: number;
  levelName: string;
  approverType: 'deptHead' | 'person' | 'committee' | 'role';
  approverName: string;
  deptName?: string;
  roleName?: string;
  signType?: 'or' | 'and';
  status?: 'waiting' | 'pending' | 'approved' | 'rejected';
  auditTime?: string;
  opinion?: string;
  operator?: string;
  description?: string;
}

export interface AuditRecord {
  id: string;
  flowId: number;
  modelId: string;
  flowCode: string;
  flowName: string;
  versionNo: string;
  archPath: string;
  businessDomain?: string;
  changeType?: string;
  changeSummary?: string;
  urgency?: '普通' | '紧急' | '特急';
  submitTime: string;
  submitUser: string;
  submitUserDept?: string;
  auditStatus: '待审核' | '已审核' | '已驳回' | '已撤回';
  auditResult?: string;
  auditUser?: string;
  auditTime?: string;
  auditOpinion?: string;
  kcpCount?: number;
  activityCount?: number;
  boundDocsCount?: number;
  effectiveDate?: string;
  publishPolicy?: 'immediate' | 'scheduled';
  scheduledTime?: string;
  approvalLevels?: ApprovalLevelItem[];
  currentLevel?: number;
}

interface FlowVerifyViewProps {
  onNavigateToFlow: (flowId: string) => void;
  onEnterDesigner: (flowId: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const PRESET_AUDIT_OPINIONS = [
  '符合企业业务架构治理规范与内控要求，准予正式发布生产环境',
  '流程图拓扑逻辑闭环，关键控制点(KCP)完备，同意发布',
  '同意发布，请各业务部门严格按既定活动规范与RACI职责落地执行',
  '缺少关键控制点(KCP)和内控合规文件对应关系，请补充后再提',
  '跨部门协同节点权责边界模糊，请与相关部门会签后重新提交审核',
];

export const FlowVerifyView: React.FC<FlowVerifyViewProps> = ({
  onNavigateToFlow,
  onEnterDesigner,
  showToast,
}) => {
  // Data State
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [flowsList, setFlowsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Tab Filter
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'my' | 'approved' | 'rejected' | 'withdrawn'>('all');

  // Filter Form Inputs
  const [statusFilter, setStatusFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Applied Filter
  const [appliedFilters, setAppliedFilters] = useState({
    status: '',
    name: '',
    code: '',
    domain: '',
    urgency: '',
    user: '',
  });

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [decisionModal, setDecisionModal] = useState<{
    open: boolean;
    row: AuditRecord | null;
    action: 'approve' | 'reject';
    opinion: string;
    effectiveDate: string;
  }>({
    open: false,
    row: null,
    action: 'approve',
    opinion: '',
    effectiveDate: '',
  });

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    row: AuditRecord | null;
    activeTab: 'summary' | 'diagram' | 'activities' | 'docs';
  }>({
    open: false,
    row: null,
    activeTab: 'summary',
  });

  const [applyModal, setApplyModal] = useState({
    open: false,
    modelId: '',
    versionNo: '',
    urgency: '普通' as '普通' | '紧急' | '特急',
    changeType: '版本升级',
    changeSummary: '',
    effectiveDate: '',
  });

  const [batchActionModal, setBatchActionModal] = useState<{
    open: boolean;
    action: 'approve' | 'reject';
    opinion: string;
  }>({
    open: false,
    action: 'approve',
    opinion: '',
  });

  const [withdrawModal, setWithdrawModal] = useState<{
    open: boolean;
    row: AuditRecord | null;
  }>({
    open: false,
    row: null,
  });

  const [progressModal, setProgressModal] = useState<{
    open: boolean;
    row: AuditRecord | null;
  }>({
    open: false,
    row: null,
  });

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    open: boolean;
    row?: AuditRecord;
    isBatch?: boolean;
  }>({
    open: false,
  });

  // Load audit data
  const loadAudits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/flow/audits').then((r) => r.json());
      if (res.status === 1 && Array.isArray(res.data)) {
        setRecords(res.data);
      }
    } catch {
      showToast('加载流程审核列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load all flows for apply modal
  const loadFlows = async () => {
    try {
      const res = await fetch('/api/flow/models').then((r) => r.json());
      if (res.status === 1 && Array.isArray(res.data)) {
        setFlowsList(res.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAudits();
    loadFlows();
  }, []);

  // Compute statistics
  const stats = useMemo(() => {
    const total = records.length;
    const pending = records.filter((r) => r.auditStatus === '待审核').length;
    const approved = records.filter((r) => r.auditStatus === '已审核').length;
    const rejected = records.filter((r) => r.auditStatus === '已驳回').length;
    const withdrawn = records.filter((r) => r.auditStatus === '已撤回').length;
    return { total, pending, approved, rejected, withdrawn };
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Tab filter
      if (activeTab === 'pending' && r.auditStatus !== '待审核') return false;
      if (activeTab === 'approved' && r.auditStatus !== '已审核') return false;
      if (activeTab === 'rejected' && r.auditStatus !== '已驳回') return false;
      if (activeTab === 'withdrawn' && r.auditStatus !== '已撤回') return false;
      if (activeTab === 'my' && !['系统管理员', '张三'].includes(r.submitUser)) return false;

      // Header filter criteria
      if (appliedFilters.status && r.auditStatus !== appliedFilters.status) return false;
      if (
        appliedFilters.name.trim() &&
        !String(r.flowName || '')
          .toLowerCase()
          .includes(appliedFilters.name.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilters.code.trim() &&
        !String(r.flowCode || '')
          .toLowerCase()
          .includes(appliedFilters.code.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilters.domain &&
        !String(r.businessDomain || r.archPath || '')
          .toLowerCase()
          .includes(appliedFilters.domain.toLowerCase())
      ) {
        return false;
      }
      if (appliedFilters.urgency && r.urgency !== appliedFilters.urgency) return false;
      if (
        appliedFilters.user.trim() &&
        !String(r.submitUser || '')
          .toLowerCase()
          .includes(appliedFilters.user.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [records, activeTab, appliedFilters]);

  // Selected audit records
  const selectedRecords = useMemo(() => {
    const idSet = new Set(selectedIds);
    return records.filter((r) => idSet.has(r.id));
  }, [records, selectedIds]);

  const selectedPendingCount = useMemo(() => {
    return selectedRecords.filter((r) => r.auditStatus === '待审核').length;
  }, [selectedRecords]);

  // Handlers
  const handleSearch = () => {
    setAppliedFilters({
      status: statusFilter,
      name: nameFilter,
      code: codeFilter,
      domain: domainFilter,
      urgency: urgencyFilter,
      user: userFilter,
    });
  };

  const handleReset = () => {
    setStatusFilter('');
    setNameFilter('');
    setCodeFilter('');
    setDomainFilter('');
    setUrgencyFilter('');
    setUserFilter('');
    setAppliedFilters({
      status: '',
      name: '',
      code: '',
      domain: '',
      urgency: '',
      user: '',
    });
  };

  // Toggle selection
  const handleToggleSelectRow = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIds.length === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((r) => r.id));
    }
  };

  // Execute single audit action
  const handleAuditAction = async (
    row: AuditRecord,
    action: 'withdraw' | 'approve' | 'reject',
    opinion?: string,
    effectiveDate?: string
  ) => {
    try {
      const res = await fetch('/api/flow/audits/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: row.id,
          action,
          opinion: opinion || (action === 'approve' ? '同意正式发布生产环境' : '驳回修改'),
          effectiveDate: effectiveDate || new Date().toISOString().slice(0, 10),
        }),
      }).then((r) => r.json());

      if (res.status === 1) {
        if (Array.isArray(res.list)) {
          setRecords(res.list);
        } else {
          await loadAudits();
        }
        if (action === 'withdraw') {
          showToast(`已成功撤回【${row.flowName}】的发布审核申请`, 'success');
        } else if (action === 'approve') {
          showToast(`流程【${row.flowName}】审核通过并已正式生效发布`, 'success');
        } else {
          showToast(`流程【${row.flowName}】审核已驳回`, 'warning');
        }
        setWithdrawModal({ open: false, row: null });
        setDecisionModal({ open: false, row: null, action: 'approve', opinion: '', effectiveDate: '' });
        setProgressModal((prev) => (prev.open && res.data ? { ...prev, row: res.data } : prev));
        setDetailModal((prev) => (prev.open && res.data ? { ...prev, row: res.data } : prev));
      } else {
        showToast(res.info || '操作失败', 'error');
      }
    } catch {
      showToast('网络请求异常，请稍后重试', 'error');
    }
  };

  // Batch audit action
  const handleBatchAudit = async (action: 'approve' | 'reject') => {
    const pendingIds = selectedRecords.filter((r) => r.auditStatus === '待审核').map((r) => r.id);
    if (pendingIds.length === 0) {
      showToast('所选记录中没有待审核状态的流程', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/flow/audits/batch-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: pendingIds,
          action,
          opinion: batchActionModal.opinion || (action === 'approve' ? '批量合规审核通过，准予发布' : '批量驳回修改'),
        }),
      }).then((r) => r.json());

      if (res.status === 1) {
        if (Array.isArray(res.list)) {
          setRecords(res.list);
        } else {
          await loadAudits();
        }
        showToast(
          `已成功批量${action === 'approve' ? '审核通过' : '驳回'} ${pendingIds.length} 个流程申请`,
          action === 'approve' ? 'success' : 'warning'
        );
        setBatchActionModal({ open: false, action: 'approve', opinion: '' });
        setSelectedIds([]);
      }
    } catch {
      showToast('批量操作失败', 'error');
    }
  };

  // Submit new audit application
  const handleSubmitApply = async () => {
    if (!applyModal.modelId) {
      showToast('请选择需要申请审核发布的流程', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/flow/audits/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: applyModal.modelId,
          versionNo: applyModal.versionNo,
          urgency: applyModal.urgency,
          changeType: applyModal.changeType,
          changeSummary: applyModal.changeSummary || '提交新版流程合规发布申请',
          effectiveDate: applyModal.effectiveDate || new Date().toISOString().slice(0, 10),
        }),
      }).then((r) => r.json());

      if (res.status === 1) {
        if (Array.isArray(res.list)) {
          setRecords(res.list);
        } else {
          await loadAudits();
        }
        showToast('已成功发起流程发布审核申请', 'success');
        setApplyModal({
          open: false,
          modelId: '',
          versionNo: '',
          urgency: '普通',
          changeType: '版本升级',
          changeSummary: '',
          effectiveDate: '',
        });
      }
    } catch {
      showToast('提交申请失败', 'error');
    }
  };

  // Delete records
  const handleDeleteRecords = async () => {
    try {
      if (deleteConfirmModal.isBatch) {
        const res = await fetch('/api/flow/audits/batch-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds }),
        }).then((r) => r.json());
        if (res.status === 1) {
          setRecords(res.list || []);
          setSelectedIds([]);
          showToast(`已成功删除选中的 ${selectedIds.length} 条审核记录`, 'success');
        }
      } else if (deleteConfirmModal.row) {
        const res = await fetch(`/api/flow/audits/${deleteConfirmModal.row.id}`, {
          method: 'DELETE',
        }).then((r) => r.json());
        if (res.status === 1) {
          setRecords(res.list || []);
          setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirmModal.row?.id));
          showToast('已删除该审核记录', 'success');
        }
      }
      setDeleteConfirmModal({ open: false });
    } catch {
      showToast('删除操作失败', 'error');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      showToast('当前没有可导出的数据', 'warning');
      return;
    }
    const headers = [
      '流程ID',
      '流程编号',
      '流程名称',
      '申请版本',
      '业务领域',
      '所属架构路径',
      '紧急程度',
      '变更类型',
      '提交人',
      '提交时间',
      '审核状态',
      '审核结果',
      '审核人',
      '审核时间',
      '审核批语',
    ];
    const rows = filteredRecords.map((r) => [
      r.flowId,
      r.flowCode,
      `"${(r.flowName || '').replace(/"/g, '""')}"`,
      r.versionNo,
      `"${(r.businessDomain || '').replace(/"/g, '""')}"`,
      `"${(r.archPath || '').replace(/"/g, '""')}"`,
      r.urgency || '普通',
      r.changeType || '版本升级',
      r.submitUser,
      r.submitTime,
      r.auditStatus,
      r.auditResult || '',
      r.auditUser || '',
      r.auditTime || '',
      `"${(r.auditOpinion || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `流程审核清单_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('已成功导出流程审核清单 CSV 文件', 'success');
  };

  return (
    <div className="bg-[#f5f7fa] min-h-[calc(100vh-100px)] p-4 flex flex-col gap-4">
      {/* 1. Header & Overview Stats */}
      <div className="bg-white rounded border border-[#ebeef5] shadow-xs p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-[#f0f2f5]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#ecf5ff] text-[#409eff] flex items-center justify-center font-bold">
                <Workflow className="w-4 h-4" />
              </div>
              <h1 className="text-base font-bold text-[#1f2733] tracking-tight">流程审核</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff]">
                流程合规治理 & 版本发布准入
              </span>
            </div>
            <p className="text-xs text-[#909399] mt-1 pl-10.5">
              对各业务领域流程的新建、版本迭代及规范修订开展合规性裁决、KCP关键控制点审核与准入发布
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const defaultFlow = flowsList[0];
                setApplyModal({
                  open: true,
                  modelId: defaultFlow?.id || 'flow_101',
                  versionNo: defaultFlow?.versionNo ? `V${parseInt(defaultFlow.versionNo.slice(1)) + 1}` : 'V2',
                  urgency: '普通',
                  changeType: '版本升级',
                  changeSummary: '',
                  effectiveDate: new Date().toISOString().slice(0, 10),
                });
              }}
              className="h-8.5 px-4 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>发起审核申请</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-8.5 px-3.5 rounded border border-[#dcdfe6] hover:border-[#409eff] hover:text-[#409eff] bg-white text-xs text-[#606266] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出清单</span>
            </button>
            <button
              type="button"
              onClick={loadAudits}
              className="h-8.5 w-8.5 rounded border border-[#dcdfe6] hover:border-[#409eff] hover:text-[#409eff] bg-white text-[#606266] flex items-center justify-center transition-colors cursor-pointer"
              title="刷新列表"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div
            onClick={() => setActiveTab('all')}
            className={`p-3.5 rounded border transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#ecf5ff] border-[#409eff] shadow-xs'
                : 'bg-[#fafafa] border-[#ebeef5] hover:border-[#dcdfe6]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#606266] mb-1.5">
              <span>全部审核单</span>
              <Layers className="w-4 h-4 text-[#909399]" />
            </div>
            <div className="text-xl font-bold font-mono-tabular text-[#1f2733]">{stats.total}</div>
            <div className="text-[11px] text-[#909399] mt-1">包含所有已提交发布申请</div>
          </div>

          <div
            onClick={() => setActiveTab('pending')}
            className={`p-3.5 rounded border transition-all cursor-pointer relative overflow-hidden ${
              activeTab === 'pending'
                ? 'bg-[#fdf6ec] border-[#e6a23c] ring-1 ring-[#e6a23c]'
                : 'bg-[#fffaf3] border-[#faecd8] hover:border-[#e6a23c]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#e6a23c] font-semibold mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#e6a23c] animate-pulse" />
                待我审核 / 待审核
              </span>
              <Clock className="w-4 h-4 text-[#e6a23c]" />
            </div>
            <div className="text-xl font-bold font-mono-tabular text-[#d48806]">{stats.pending}</div>
            <div className="text-[11px] text-[#e6a23c] mt-1 font-medium">需要流程委员会审批准入</div>
          </div>

          <div
            onClick={() => setActiveTab('approved')}
            className={`p-3.5 rounded border transition-all cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-[#f0f9eb] border-[#67c23a] shadow-xs'
                : 'bg-[#f6ffed] border-[#e1f3d8] hover:border-[#67c23a]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#67c23a] font-semibold mb-1.5">
              <span>审核通过并发布</span>
              <CheckCircle2 className="w-4 h-4 text-[#67c23a]" />
            </div>
            <div className="text-xl font-bold font-mono-tabular text-[#52c41a]">{stats.approved}</div>
            <div className="text-[11px] text-[#67c23a] mt-1">已正式生效并在生产运行</div>
          </div>

          <div
            onClick={() => setActiveTab('rejected')}
            className={`p-3.5 rounded border transition-all cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-[#fef0f0] border-[#f56c6c] shadow-xs'
                : 'bg-[#fff1f0] border-[#fbc4c4] hover:border-[#f56c6c]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#f56c6c] font-semibold mb-1.5">
              <span>审核驳回需修改</span>
              <XCircle className="w-4 h-4 text-[#f56c6c]" />
            </div>
            <div className="text-xl font-bold font-mono-tabular text-[#f5222d]">{stats.rejected}</div>
            <div className="text-[11px] text-[#f56c6c] mt-1">需申请人补充完善材料</div>
          </div>

          <div
            onClick={() => setActiveTab('withdrawn')}
            className={`p-3.5 rounded border transition-all cursor-pointer ${
              activeTab === 'withdrawn'
                ? 'bg-[#f4f4f5] border-[#909399] shadow-xs'
                : 'bg-[#fafafa] border-[#ebeef5] hover:border-[#dcdfe6]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#909399] mb-1.5">
              <span>已撤回草稿</span>
              <Undo2 className="w-4 h-4 text-[#909399]" />
            </div>
            <div className="text-xl font-bold font-mono-tabular text-[#606266]">{stats.withdrawn}</div>
            <div className="text-[11px] text-[#909399] mt-1">申请人自主撤销发布申请</div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-4 pt-3 border-t border-[#f0f2f5] flex items-center justify-between">
          <div className="flex items-center gap-1 bg-[#f0f2f5] p-1 rounded-md text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                activeTab === 'all' ? 'bg-white text-[#409eff] shadow-xs font-semibold' : 'text-[#606266] hover:text-[#1f2733]'
              }`}
            >
              全部 ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-white text-[#e6a23c] shadow-xs font-semibold'
                  : 'text-[#606266] hover:text-[#1f2733]'
              }`}
            >
              <span>待我审核</span>
              {stats.pending > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#e6a23c] text-white text-[10px]">
                  {stats.pending}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                activeTab === 'my' ? 'bg-white text-[#409eff] shadow-xs font-semibold' : 'text-[#606266] hover:text-[#1f2733]'
              }`}
            >
              我发起的
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('approved')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                activeTab === 'approved' ? 'bg-white text-[#67c23a] shadow-xs font-semibold' : 'text-[#606266] hover:text-[#1f2733]'
              }`}
            >
              已通过 ({stats.approved})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rejected')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                activeTab === 'rejected' ? 'bg-white text-[#f56c6c] shadow-xs font-semibold' : 'text-[#606266] hover:text-[#1f2733]'
              }`}
            >
              已驳回 ({stats.rejected})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('withdrawn')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                activeTab === 'withdrawn' ? 'bg-white text-[#909399] shadow-xs font-semibold' : 'text-[#606266] hover:text-[#1f2733]'
              }`}
            >
              已撤回 ({stats.withdrawn})
            </button>
          </div>
          <div className="text-xs text-[#909399]">
            当前展示：<strong className="text-[#1f2733] font-mono-tabular">{filteredRecords.length}</strong> 条记录
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white rounded border border-[#ebeef5] shadow-xs p-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#606266] font-medium">审核状态</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setAppliedFilters((prev) => ({ ...prev, status: e.target.value }));
              }}
              className="h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] bg-white text-[#303133] outline-none transition-colors"
            >
              <option value="">全部状态</option>
              <option value="待审核">待审核</option>
              <option value="已审核">已审核通过</option>
              <option value="已驳回">已驳回修改</option>
              <option value="已撤回">已撤回草稿</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#606266] font-medium">流程名称</label>
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="请输入流程名称"
              className="h-8 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] text-[#303133] placeholder-[#c0c4cc] outline-none transition-colors"
            >
            </input>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#606266] font-medium">流程编号</label>
            <input
              type="text"
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="请输入流程编号 (如 IPD-TR)"
              className="h-8 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] text-[#303133] placeholder-[#c0c4cc] outline-none transition-colors"
            >
            </input>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#606266] font-medium">业务领域</label>
            <select
              value={domainFilter}
              onChange={(e) => {
                setDomainFilter(e.target.value);
                setAppliedFilters((prev) => ({ ...prev, domain: e.target.value }));
              }}
              className="h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] bg-white text-[#303133] outline-none transition-colors"
            >
              <option value="">全部业务领域</option>
              <option value="1.0">1.0 集成产品开发 IPD</option>
              <option value="2.0">2.0 市场管理 MTL</option>
              <option value="3.0">3.0 线索到回款 LTC</option>
              <option value="4.0">4.0 问题到解决 ITR</option>
              <option value="5.0">5.0 财务综合支撑 IFS</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#606266] font-medium">紧急程度</label>
            <select
              value={urgencyFilter}
              onChange={(e) => {
                setUrgencyFilter(e.target.value);
                setAppliedFilters((prev) => ({ ...prev, urgency: e.target.value }));
              }}
              className="h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] bg-white text-[#303133] outline-none transition-colors"
            >
              <option value="">全部紧急度</option>
              <option value="普通">普通</option>
              <option value="紧急">紧急</option>
              <option value="特急">特急 (优先处理)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#606266] font-medium">提交人员</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="提交人姓名"
                className="h-8 px-3 w-full rounded border border-[#dcdfe6] focus:border-[#409eff] text-[#303133] placeholder-[#c0c4cc] outline-none transition-colors"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="h-8 px-3 rounded bg-[#409eff] hover:bg-[#3390ff] text-white font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                title="查询"
              >
                <Search className="w-3.5 h-3.5" />
                <span>查询</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="h-8 px-3 rounded bg-[#ecf5ff] hover:bg-[#d9ecff] text-[#409eff] border border-[#b3d8ff] font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                title="重置"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Toolbar & Selected Notification */}
      <div className="bg-white rounded border border-[#ebeef5] shadow-xs flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Selection Banner */}
        {selectedIds.length > 0 && (
          <div className="bg-[#ecf5ff] border-b border-[#b3d8ff] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#409eff]" />
              <span className="text-[#303133]">
                已选中 <strong className="text-[#409eff] font-mono-tabular font-bold">{selectedIds.length}</strong> 项
                流程审核记录
                {selectedPendingCount > 0 && (
                  <span className="ml-1 text-[#e6a23c]">
                    （含 <strong className="font-mono-tabular">{selectedPendingCount}</strong> 项待审核）
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBatchActionModal({ open: true, action: 'approve', opinion: '' })}
                disabled={selectedPendingCount === 0}
                className="h-7 px-3 rounded bg-[#67c23a] hover:bg-[#5daf34] disabled:opacity-50 text-white font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>批量同意发布 ({selectedPendingCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setBatchActionModal({ open: true, action: 'reject', opinion: '' })}
                disabled={selectedPendingCount === 0}
                className="h-7 px-3 rounded bg-white border border-[#f56c6c] text-[#f56c6c] hover:bg-[#fef0f0] disabled:opacity-50 font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>批量驳回修改 ({selectedPendingCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ open: true, isBatch: true })}
                className="h-7 px-3 rounded border border-[#dcdfe6] bg-white text-[#f56c6c] hover:bg-[#fef0f0] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>批量删除</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="h-7 px-2.5 rounded border border-[#dcdfe6] bg-white text-[#606266] hover:text-[#409eff] cursor-pointer"
              >
                清空选择
              </button>
            </div>
          </div>
        )}

        {/* 4. Table */}
        <div className="p-3 flex-1 flex flex-col min-h-0">
          <EnterpriseDataGrid
            storageKey="dflow_verify_grid_v3"
            loading={loading}
            data={filteredRecords}
            rowKey={(r) => String(r.id)}
            maxHeight="calc(100vh - 355px)"
            emptyText="暂无符合筛选条件的流程审核记录"
            columns={[
              {
                key: 'selection',
                defaultWidth: 46,
                minWidth: 46,
                maxWidth: 46,
                align: 'center',
                fixed: 'left',
                label: (
                  <div
                    onClick={handleToggleSelectAll}
                    className="cursor-pointer flex items-center justify-center p-1"
                    title={
                      filteredRecords.length > 0 && selectedIds.length === filteredRecords.length
                        ? '取消全选'
                        : '全选所有项'
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        filteredRecords.length > 0 && selectedIds.length === filteredRecords.length
                      }
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-gray-300 text-[#409eff] focus:ring-[#409eff] cursor-pointer pointer-events-none"
                    />
                  </div>
                ),
                render: (row) => {
                  const isChecked = selectedIds.includes(row.id);
                  return (
                    <div
                      onClick={(e) => handleToggleSelectRow(row.id, e)}
                      className="cursor-pointer flex items-center justify-center p-1"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-gray-300 text-[#409eff] focus:ring-[#409eff] cursor-pointer pointer-events-none"
                      />
                    </div>
                  );
                },
              },
              {
                key: 'flowId',
                label: '流程ID',
                defaultWidth: 75,
                minWidth: 65,
                align: 'center',
                fixed: 'left',
                render: (row) => <span className="font-mono-tabular text-[#909399]">{row.flowId}</span>,
              },
              {
                key: 'flowCode',
                label: '流程编号',
                defaultWidth: 140,
                minWidth: 110,
                align: 'center',
                fixed: 'left',
                render: (row) => (
                  <span className="font-mono-tabular font-semibold text-[#1f2733] bg-[#f4f4f5] px-2 py-0.5 rounded text-[11px]">
                    {row.flowCode}
                  </span>
                ),
              },
              {
                key: 'flowName',
                label: '流程名称',
                defaultWidth: 240,
                minWidth: 160,
                align: 'left',
                fixed: 'left',
                render: (row) => (
                  <div
                    onClick={() => setDetailModal({ open: true, row, activeTab: 'summary' })}
                    className="cursor-pointer group flex items-center gap-1.5"
                  >
                    <span className="font-semibold text-[#1f2733] group-hover:text-[#409eff] transition-colors line-clamp-1">
                      {row.flowName}
                    </span>
                  </div>
                ),
              },
              {
                key: 'versionNo',
                label: '申请版本',
                defaultWidth: 90,
                minWidth: 80,
                align: 'center',
                render: (row) => (
                  <span className="font-mono-tabular font-bold px-2 py-0.5 rounded bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff] text-[11px]">
                    {row.versionNo}
                  </span>
                ),
              },
              {
                key: 'urgency',
                label: '紧急程度',
                defaultWidth: 95,
                minWidth: 85,
                align: 'center',
                render: (row) => {
                  const val = row.urgency || '普通';
                  if (val === '特急') {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fef0f0] text-[#f56c6c] border border-[#fbc4c4]">
                        <Flame className="w-3 h-3 text-[#f56c6c]" />
                        特急
                      </span>
                    );
                  }
                  if (val === '紧急') {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#fdf6ec] text-[#e6a23c] border border-[#f5dab1]">
                        <AlertTriangle className="w-3 h-3 text-[#e6a23c]" />
                        紧急
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] text-[#909399] bg-[#f4f4f5]">
                      普通
                    </span>
                  );
                },
              },
              {
                key: 'changeType',
                label: '变更类型',
                defaultWidth: 100,
                minWidth: 85,
                align: 'center',
                render: (row) => (
                  <span className="text-[#606266] font-medium text-xs">
                    {row.changeType || '版本升级'}
                  </span>
                ),
              },
              {
                key: 'archPath',
                label: '所属业务架构路径',
                defaultWidth: 320,
                minWidth: 180,
                align: 'left',
                tooltipText: (row) => row.archPath,
                render: (row) => (
                  <div className="flex items-center gap-1 text-[#606266] text-xs truncate">
                    <Building2 className="w-3.5 h-3.5 text-[#909399] shrink-0" />
                    <span className="truncate">{row.archPath}</span>
                  </div>
                ),
              },
              {
                key: 'kcpMetrics',
                label: '控制点 & 步骤',
                defaultWidth: 130,
                minWidth: 110,
                align: 'center',
                render: (row) => (
                  <div className="text-[11px] text-[#606266] flex items-center justify-center gap-1.5 font-mono-tabular">
                    <span
                      title="关键控制点 (KCP) 数量"
                      className="inline-flex items-center gap-0.5 text-[#e6a23c] font-semibold"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {row.kcpCount || 2} KCP
                    </span>
                    <span className="text-[#dcdfe6]">|</span>
                    <span title="活动步骤总数" className="text-[#409eff]">
                      {row.activityCount || 4} 步骤
                    </span>
                  </div>
                ),
              },
              {
                key: 'submitUser',
                label: '提交人',
                defaultWidth: 130,
                minWidth: 100,
                align: 'center',
                render: (row) => (
                  <div className="flex flex-col items-center">
                    <span className="font-medium text-[#303133]">{row.submitUser}</span>
                    <span className="text-[10px] text-[#909399]">{row.submitUserDept || '业务部门'}</span>
                  </div>
                ),
              },
              {
                key: 'submitTime',
                label: '提交时间',
                defaultWidth: 155,
                minWidth: 130,
                align: 'center',
                render: (row) => (
                  <span className="font-mono-tabular text-xs text-[#606266]">{row.submitTime}</span>
                ),
              },
              {
                key: 'auditStatus',
                label: '审核状态',
                defaultWidth: 105,
                minWidth: 90,
                align: 'center',
                render: (row) => {
                  const s = row.auditStatus;
                  if (s === '待审核') {
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fdf6ec] text-[#e6a23c] border border-[#faecd8]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e6a23c] animate-ping" />
                        待审核
                      </span>
                    );
                  }
                  if (s === '已审核') {
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8]">
                        <Check className="w-3 h-3" />
                        已审核
                      </span>
                    );
                  }
                  if (s === '已驳回') {
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef0f0] text-[#f56c6c] border border-[#fbc4c4]">
                        <X className="w-3 h-3" />
                        已驳回
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] text-[#909399] bg-[#f4f4f5] border border-[#e4e7ed]">
                      已撤回
                    </span>
                  );
                },
              },
              {
                key: 'publishPolicy',
                label: '发布策略 & 审批流进度',
                defaultWidth: 185,
                minWidth: 160,
                align: 'left',
                render: (row) => {
                  const isScheduled = row.publishPolicy === 'scheduled';
                  const levels = row.approvalLevels;
                  const curLvl = row.currentLevel || 1;
                  return (
                    <div className="flex flex-col gap-1 text-xs py-0.5">
                      <div className="flex items-center gap-1.5">
                        {isScheduled ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            预约发布
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <Zap className="w-2.5 h-2.5 text-blue-600" />
                            立即生效
                          </span>
                        )}
                        {isScheduled && row.scheduledTime && (
                          <span className="text-[10px] font-mono text-amber-800 truncate" title={row.scheduledTime}>
                            {row.scheduledTime.length > 16 ? row.scheduledTime.slice(5, 16) : row.scheduledTime}
                          </span>
                        )}
                      </div>
                      {levels && levels.length > 0 && (
                        <div className="text-[10px] text-[#909399] flex items-center gap-1">
                          <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                            第{curLvl}/{levels.length}级
                          </span>
                          <span className="truncate max-w-[110px]" title={levels[curLvl - 1]?.approverName}>
                            {levels[curLvl - 1]?.approverName}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                },
              },
              {
                key: 'auditResult',
                label: '审核结果',
                defaultWidth: 110,
                minWidth: 90,
                align: 'center',
                render: (row) => (
                  <span
                    className={
                      row.auditResult === '同意发布'
                        ? 'text-[#67c23a] font-semibold'
                        : row.auditResult === '驳回修改'
                        ? 'text-[#f56c6c] font-semibold'
                        : 'text-[#909399]'
                    }
                  >
                    {row.auditResult || '-'}
                  </span>
                ),
              },
              {
                key: 'auditInfo',
                label: '审核人 & 审核时间',
                defaultWidth: 165,
                minWidth: 140,
                align: 'center',
                render: (row) => {
                  if (!row.auditTime) return <span className="text-[#c0c4cc]">-</span>;
                  return (
                    <div className="flex flex-col items-center text-xs">
                      <span className="font-medium text-[#303133]">{row.auditUser || '管理员'}</span>
                      <span className="text-[10px] text-[#909399] font-mono-tabular">{row.auditTime}</span>
                    </div>
                  );
                },
              },
              {
                key: 'auditOpinion',
                label: '审核批语',
                defaultWidth: 200,
                minWidth: 140,
                align: 'left',
                tooltipText: (row) => row.auditOpinion,
                render: (row) => (
                  <span className="text-[#606266] text-xs truncate block max-w-full">
                    {row.auditOpinion || <span className="text-[#c0c4cc]">暂无批语</span>}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: '操作',
                defaultWidth: 220,
                minWidth: 200,
                align: 'center',
                fixed: 'right',
                render: (row) => {
                  const isPending = row.auditStatus === '待审核';
                  return (
                    <div className="inline-flex items-center justify-center gap-1 text-xs">
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDecisionModal({
                              open: true,
                              row,
                              action: 'approve',
                              opinion: '',
                              effectiveDate: new Date().toISOString().slice(0, 10),
                            })
                          }
                          className="px-2 py-0.5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white font-medium cursor-pointer shadow-2xs"
                        >
                          审核
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDetailModal({ open: true, row, activeTab: 'summary' })}
                          className="text-[#409eff] hover:text-[#66b1ff] cursor-pointer px-1 font-medium"
                        >
                          详情
                        </button>
                      )}
                      <span className="text-[#dcdfe6]">|</span>
                      <button
                        type="button"
                        onClick={() => setDetailModal({ open: true, row, activeTab: 'diagram' })}
                        className="text-[#606266] hover:text-[#409eff] cursor-pointer px-1"
                        title="查看流程图及KCP拓扑"
                      >
                        流程图
                      </button>
                      <span className="text-[#dcdfe6]">|</span>
                      <button
                        type="button"
                        onClick={() => setProgressModal({ open: true, row })}
                        className="text-[#606266] hover:text-[#409eff] cursor-pointer px-1"
                        title="查看流转进度及审批历史"
                      >
                        进度
                      </button>
                      {isPending && (
                        <>
                          <span className="text-[#dcdfe6]">|</span>
                          <button
                            type="button"
                            onClick={() => setWithdrawModal({ open: true, row })}
                            className="text-[#e6a23c] hover:text-[#d48806] cursor-pointer px-1"
                            title="撤回发布申请"
                          >
                            撤回
                          </button>
                        </>
                      )}
                      {!isPending && (
                        <>
                          <span className="text-[#dcdfe6]">|</span>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmModal({ open: true, row, isBatch: false })}
                            className="text-[#909399] hover:text-[#f56c6c] cursor-pointer px-1"
                            title="删除历史记录"
                          >
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  );
                },
              },
            ]}
          />
        </div>
      </div>

      {/* ================= MODAL 1: 审核审批决策弹窗 (Audit Decision Modal) ================= */}
      {decisionModal.open && decisionModal.row && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-2xl border border-[#ebeef5] overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#ecf5ff] text-[#409eff] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1f2733]">
                    流程合规裁决与发布审核 · {decisionModal.row.flowName}
                  </h3>
                  <div className="text-xs text-[#909399] flex items-center gap-2 mt-0.5">
                    <span>编号: {decisionModal.row.flowCode}</span>
                    <span>•</span>
                    <span className="text-[#409eff] font-bold">申请版本: {decisionModal.row.versionNo}</span>
                    <span>•</span>
                    <span>提交人: {decisionModal.row.submitUser} ({decisionModal.row.submitTime})</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDecisionModal({ open: false, row: null, action: 'approve', opinion: '', effectiveDate: '' })}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* Compliance Checklist */}
              <div className="bg-[#f8f9fb] rounded-lg border border-[#ebeef5] p-4">
                <div className="text-xs font-bold text-[#1f2733] mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#67c23a]" />
                    系统自动化合规准入检查清单 (4/4 项全部达标)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#f0f9eb] text-[#67c23a] text-[10px] font-bold border border-[#e1f3d8]">
                    合规通过
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-[#ebeef5]">
                    <Check className="w-3.5 h-3.5 text-[#67c23a] shrink-0" />
                    <span>流程拓扑连通无闭环死锁</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-[#ebeef5]">
                    <Check className="w-3.5 h-3.5 text-[#67c23a] shrink-0" />
                    <span>KCP关键控制点责任矩阵已明确</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-[#ebeef5]">
                    <Check className="w-3.5 h-3.5 text-[#67c23a] shrink-0" />
                    <span>关联制度合规文件覆盖完备</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-[#ebeef5]">
                    <Check className="w-3.5 h-3.5 text-[#67c23a] shrink-0" />
                    <span>各步骤输入输出交付物已定义</span>
                  </div>
                </div>
              </div>

              {/* Decision Action Tabs */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1f2733]">审核决议</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setDecisionModal((prev) => ({ ...prev, action: 'approve' }))}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                      decisionModal.action === 'approve'
                        ? 'bg-[#f0f9eb] border-[#67c23a] ring-1 ring-[#67c23a]'
                        : 'bg-white border-[#dcdfe6] hover:border-[#67c23a]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#67c23a] text-white flex items-center justify-center font-bold">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#1f2733]">同意并正式发布生产</div>
                      <div className="text-[11px] text-[#606266] mt-0.5">流程版本转为正式发布态，资产库更新</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setDecisionModal((prev) => ({ ...prev, action: 'reject' }))}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                      decisionModal.action === 'reject'
                        ? 'bg-[#fef0f0] border-[#f56c6c] ring-1 ring-[#f56c6c]'
                        : 'bg-white border-[#dcdfe6] hover:border-[#f56c6c]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#f56c6c] text-white flex items-center justify-center font-bold">
                      <X className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[#1f2733]">驳回修改申请</div>
                      <div className="text-[11px] text-[#606266] mt-0.5">退回草稿态，由申请人按批语补充修改</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Effective Date (if approve) */}
              {decisionModal.action === 'approve' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1f2733]">正式生效日期</label>
                  <input
                    type="date"
                    value={decisionModal.effectiveDate || new Date().toISOString().slice(0, 10)}
                    onChange={(e) =>
                      setDecisionModal((prev) => ({ ...prev, effectiveDate: e.target.value }))
                    }
                    className="h-8 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-[#303133]"
                  />
                </div>
              )}

              {/* Opinion */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1f2733]">
                    审核批语 / 审批意见 <span className="text-[#f56c6c]">*</span>
                  </label>
                  <span className="text-[#909399] text-[11px]">可点击下方快捷常用批语填入</span>
                </div>
                <textarea
                  rows={3}
                  value={decisionModal.opinion}
                  onChange={(e) => setDecisionModal((prev) => ({ ...prev, opinion: e.target.value }))}
                  placeholder={
                    decisionModal.action === 'approve'
                      ? '请输入审批意见，例如：符合内控管理规范，准予正式发布生产环境...'
                      : '请输入具体驳回原因与修改建议，指导申请人整改...'
                  }
                  className="w-full p-3 rounded-lg border border-[#dcdfe6] focus:border-[#409eff] text-[#303133] outline-none transition-colors text-xs resize-none"
                />

                {/* Quick Opinion Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_AUDIT_OPINIONS.map((txt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDecisionModal((prev) => ({ ...prev, opinion: txt }))}
                      className="px-2.5 py-1 rounded bg-[#f4f4f5] hover:bg-[#ecf5ff] hover:text-[#409eff] border border-[#ebeef5] text-[11px] text-[#606266] transition-colors cursor-pointer text-left"
                    >
                      {txt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="text-xs text-[#909399]">
                审核人：<strong className="text-[#1f2733]">系统管理员 (流程治理委员会)</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDecisionModal({ open: false, row: null, action: 'approve', opinion: '', effectiveDate: '' })}
                  className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] hover:text-[#1f2733] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAuditAction(
                      decisionModal.row!,
                      decisionModal.action,
                      decisionModal.opinion,
                      decisionModal.effectiveDate
                    )
                  }
                  className={`h-8 px-5 rounded text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer ${
                    decisionModal.action === 'approve'
                      ? 'bg-[#67c23a] hover:bg-[#5daf34]'
                      : 'bg-[#f56c6c] hover:bg-[#e65c5c]'
                  }`}
                >
                  {decisionModal.action === 'approve' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>确认发布生效</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>确认驳回修改</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: 详情与多维度流程查看弹窗 (Detail & Diagram Modal) ================= */}
      {detailModal.open && detailModal.row && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl shadow-2xl border border-[#ebeef5] overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#ebeef5] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#ecf5ff] text-[#409eff] flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1f2733]">
                      流程审核详情 · {detailModal.row.flowName}
                    </h3>
                    <span className="px-2 py-0.5 rounded font-mono-tabular font-bold text-[11px] bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff]">
                      {detailModal.row.versionNo}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        detailModal.row.auditStatus === '已审核'
                          ? 'bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8]'
                          : detailModal.row.auditStatus === '待审核'
                          ? 'bg-[#fdf6ec] text-[#e6a23c] border border-[#faecd8]'
                          : 'bg-[#fef0f0] text-[#f56c6c] border border-[#fbc4c4]'
                      }`}
                    >
                      {detailModal.row.auditStatus}
                    </span>
                  </div>
                  <div className="text-xs text-[#909399] mt-0.5">
                    {detailModal.row.archPath}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const fid = detailModal.row?.modelId || 'flow_101';
                    setDetailModal({ open: false, row: null, activeTab: 'summary' });
                    onEnterDesigner(fid);
                  }}
                  className="h-8 px-3 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>进入设计画板</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailModal({ open: false, row: null, activeTab: 'summary' })}
                  className="text-[#909399] hover:text-[#1f2733] cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub Nav Tabs */}
            <div className="px-6 bg-[#fafafa] border-b border-[#ebeef5] flex items-center gap-6 text-xs font-medium">
              <button
                type="button"
                onClick={() => setDetailModal((prev) => ({ ...prev, activeTab: 'summary' }))}
                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                  detailModal.activeTab === 'summary'
                    ? 'border-[#409eff] text-[#409eff] font-bold'
                    : 'border-transparent text-[#606266] hover:text-[#1f2733]'
                }`}
              >
                审核基本信息
              </button>
              <button
                type="button"
                onClick={() => setDetailModal((prev) => ({ ...prev, activeTab: 'diagram' }))}
                className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1 ${
                  detailModal.activeTab === 'diagram'
                    ? 'border-[#409eff] text-[#409eff] font-bold'
                    : 'border-transparent text-[#606266] hover:text-[#1f2733]'
                }`}
              >
                <span>流程图可视化拓扑</span>
                <span className="w-2 h-2 rounded-full bg-[#409eff]" />
              </button>
              <button
                type="button"
                onClick={() => setDetailModal((prev) => ({ ...prev, activeTab: 'activities' }))}
                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                  detailModal.activeTab === 'activities'
                    ? 'border-[#409eff] text-[#409eff] font-bold'
                    : 'border-transparent text-[#606266] hover:text-[#1f2733]'
                }`}
              >
                活动步骤与 RACI 矩阵 ({detailModal.row.activityCount || 4})
              </button>
              <button
                type="button"
                onClick={() => setDetailModal((prev) => ({ ...prev, activeTab: 'docs' }))}
                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                  detailModal.activeTab === 'docs'
                    ? 'border-[#409eff] text-[#409eff] font-bold'
                    : 'border-transparent text-[#606266] hover:text-[#1f2733]'
                }`}
              >
                关联制度与风险文件 ({detailModal.row.boundDocsCount || 2})
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 overflow-y-auto flex-1 text-xs">
              {detailModal.activeTab === 'summary' && (
                <div className="space-y-4">
                  <table className="w-full border-collapse border border-[#ebeef5]">
                    <tbody>
                      <tr className="border-b border-[#ebeef5]">
                        <td className="w-32 bg-[#f8f9fb] text-[#606266] font-medium px-4 py-2.5 border-r border-[#ebeef5]">
                          流程编号
                        </td>
                        <td className="px-4 py-2.5 text-[#303133] font-mono-tabular font-semibold border-r border-[#ebeef5]">
                          {detailModal.row.flowCode}
                        </td>
                        <td className="w-32 bg-[#f8f9fb] text-[#606266] font-medium px-4 py-2.5 border-r border-[#ebeef5]">
                          申请发布版本
                        </td>
                        <td className="px-4 py-2.5 text-[#409eff] font-mono-tabular font-bold">
                          {detailModal.row.versionNo}
                        </td>
                      </tr>
                      <tr className="border-b border-[#ebeef5]">
                        <td className="bg-[#f8f9fb] text-[#606266] font-medium px-4 py-2.5 border-r border-[#ebeef5]">
                          流程全称
                        </td>
                        <td className="px-4 py-2.5 text-[#1f2733] font-semibold border-r border-[#ebeef5]">
                          {detailModal.row.flowName}
                        </td>
                        <td className="bg-[#f8f9fb] text-[#606266] font-medium px-4 py-2.5 border-r border-[#ebeef5]">
                          紧急程度
                        </td>
                        <td className="px-4 py-2.5 text-[#303133]">
                          {detailModal.row.urgency || '普通'}
                        </td>
                      </tr>
                      <tr className="border-b border-[#ebeef5]">
                        <td className="bg-[#f8f9fb] text-[#606266] font-medium px-4 py-2.5 border-r border-[#ebeef5]">
                          所属架构路径
                        </td>
                        <td colSpan={3} className="px-4 py-2.5 text-[#606266]">
                          {detailModal.row.archPath}
                        </td>
                      </tr>
                      <tr className="border-b border-[#ebeef5]">
                        <td className="bg-[#f8f9fb] text-[#606266] font-medium px-4 py-2.5 border-r border-[#ebeef5]">
                          提交人员
                        </td>
                        <td className="px-4 py-2.5 text-[#303133] border-r border-[#ebeef5]">
                          {detailModal.row.submitUser} ({detailModal.row.submitUserDept || '业务部门'})
                        </td>
                        <td className="bg-[#f8f9fb] text-[#606266] font-medium px-4 py-2.5 border-r border-[#ebeef5]">
                          提交时间
                        </td>
                        <td className="px-4 py-2.5 text-[#303133] font-mono-tabular">
                          {detailModal.row.submitTime}
                        </td>
                      </tr>
                      <tr className="border-b border-[#ebeef5]">
                        <td className="bg-[#f8f9fb] text-[#606266] font-medium px-4 py-2.5 border-r border-[#ebeef5]">
                          变更类型
                        </td>
                        <td className="px-4 py-2.5 text-[#303133] border-r border-[#ebeef5]">
                          {detailModal.row.changeType || '版本升级'}
                        </td>
                        <td className="bg-[#f8f9fb] text-[#606266] font-medium px-4 py-2.5 border-r border-[#ebeef5]">
                          正式生效日期
                        </td>
                        <td className="px-4 py-2.5 text-[#303133] font-mono-tabular">
                          {detailModal.row.effectiveDate || '审核批准后即时生效'}
                        </td>
                      </tr>
                      <tr className="border-b border-[#ebeef5]">
                        <td className="bg-[#f8f9fb] text-[#606266] font-medium px-4 py-2.5 border-r border-[#ebeef5]">
                          申请说明 / 变更履历
                        </td>
                        <td colSpan={3} className="px-4 py-2.5 text-[#606266] leading-relaxed">
                          {detailModal.row.changeSummary || '按照业务治理要求提交新版本发布申请'}
                        </td>
                      </tr>
                      <tr className="border-b border-[#ebeef5]">
                        <td className="bg-[#f8f9fb] text-[#606266] font-medium px-4 py-2.5 border-r border-[#ebeef5]">
                          当前审核状态
                        </td>
                        <td className="px-4 py-2.5 border-r border-[#ebeef5]">
                          <span
                            className={`font-semibold ${
                              detailModal.row.auditStatus === '已审核'
                                ? 'text-[#67c23a]'
                                : detailModal.row.auditStatus === '待审核'
                                ? 'text-[#e6a23c]'
                                : 'text-[#f56c6c]'
                            }`}
                          >
                            {detailModal.row.auditStatus}
                          </span>
                        </td>
                        <td className="bg-[#f8f9fb] text-[#606266] font-medium px-4 py-2.5 border-r border-[#ebeef5]">
                          审核时间
                        </td>
                        <td className="px-4 py-2.5 text-[#303133] font-mono-tabular">
                          {detailModal.row.auditTime || '待完成审批'}
                        </td>
                      </tr>
                      <tr>
                        <td className="bg-[#f8f9fb] text-[#606266] font-medium px-4 py-2.5 border-r border-[#ebeef5]">
                          审核批语意见
                        </td>
                        <td colSpan={3} className="px-4 py-2.5 text-[#303133] font-medium leading-relaxed">
                          {detailModal.row.auditOpinion || '尚未记录审批批语'}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Highlights */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#f8f9fb] p-3.5 rounded border border-[#ebeef5]">
                      <div className="text-[#909399] mb-1">关键控制点 (KCP)</div>
                      <div className="text-base font-bold text-[#e6a23c]">
                        {detailModal.row.kcpCount || 2} 项强制控制点
                      </div>
                      <div className="text-[11px] text-[#909399] mt-0.5">同行专家评审、TRB决议红线</div>
                    </div>
                    <div className="bg-[#f8f9fb] p-3.5 rounded border border-[#ebeef5]">
                      <div className="text-[#909399] mb-1">活动步骤节点</div>
                      <div className="text-base font-bold text-[#409eff]">
                        {detailModal.row.activityCount || 4} 个序列化活动
                      </div>
                      <div className="text-[11px] text-[#909399] mt-0.5">跨 3 个业务角色与泳道</div>
                    </div>
                    <div className="bg-[#f8f9fb] p-3.5 rounded border border-[#ebeef5]">
                      <div className="text-[#909399] mb-1">关联制度文件</div>
                      <div className="text-base font-bold text-[#67c23a]">
                        {detailModal.row.boundDocsCount || 2} 篇支撑规程
                      </div>
                      <div className="text-[11px] text-[#909399] mt-0.5">内控手册与质量检验标准</div>
                    </div>
                  </div>
                </div>
              )}

              {detailModal.activeTab === 'diagram' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-[#ecf5ff] p-3 rounded border border-[#b3d8ff] text-xs">
                    <div className="text-[#409eff]">
                      <strong>流程图可视化拓扑架构</strong>：包含活动节点流转、网关分支判断与关键控制点 (KCP) 标记
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const fid = detailModal.row?.modelId || 'flow_101';
                        setDetailModal({ open: false, row: null, activeTab: 'summary' });
                        onEnterDesigner(fid);
                      }}
                      className="px-2.5 py-1 rounded bg-[#409eff] text-white font-medium hover:bg-[#3390ff] cursor-pointer"
                    >
                      在画布中交互编辑
                    </button>
                  </div>

                  {/* Flow Diagram SVG Canvas Mockup */}
                  <div className="bg-[#fbfcfd] border border-[#dcdfe6] rounded-lg p-6 min-h-[340px] flex items-center justify-center relative overflow-hidden">
                    <div className="w-full flex flex-col items-center">
                      {/* Swimlane header */}
                      <div className="w-full max-w-2xl bg-white border border-[#dcdfe6] rounded-lg shadow-sm p-4">
                        <div className="text-xs font-bold text-[#1f2733] mb-4 pb-2 border-b border-[#ebeef5] flex items-center justify-between">
                          <span>{detailModal.row.flowName} · 核心活动流转拓扑</span>
                          <span className="text-[10px] text-[#909399]">版本: {detailModal.row.versionNo}</span>
                        </div>

                        {/* Node sequence */}
                        <div className="flex items-center justify-between gap-2 overflow-x-auto py-4">
                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <div className="w-10 h-10 rounded-full bg-[#67c23a] text-white flex items-center justify-center font-bold shadow-xs">
                              S
                            </div>
                            <span className="text-[11px] font-medium text-[#606266]">开始节点</span>
                          </div>

                          <div className="w-8 h-0.5 bg-[#409eff]" />

                          <div className="p-3 bg-white rounded border-2 border-[#409eff] shadow-xs shrink-0 flex flex-col items-center w-28 text-center">
                            <span className="font-semibold text-xs text-[#1f2733]">发起技术评审</span>
                            <span className="text-[10px] text-[#909399] mt-0.5">系统工程师</span>
                          </div>

                          <div className="w-8 h-0.5 bg-[#409eff]" />

                          <div className="p-3 bg-[#fffaf3] rounded border-2 border-[#e6a23c] shadow-xs shrink-0 flex flex-col items-center w-32 text-center relative">
                            <span className="absolute -top-2 -right-2 px-1.5 py-0.2 rounded bg-[#e6a23c] text-white text-[9px] font-bold">
                              KCP
                            </span>
                            <span className="font-bold text-xs text-[#d48806]">同行交叉审查</span>
                            <span className="text-[10px] text-[#e6a23c] mt-0.5">技术评审专家</span>
                          </div>

                          <div className="w-8 h-0.5 bg-[#409eff]" />

                          <div className="p-3 bg-white rounded border border-[#dcdfe6] shadow-xs shrink-0 flex flex-col items-center w-28 text-center">
                            <span className="font-semibold text-xs text-[#1f2733]">问题收敛整改</span>
                            <span className="text-[10px] text-[#909399] mt-0.5">研发团队</span>
                          </div>

                          <div className="w-8 h-0.5 bg-[#409eff]" />

                          <div className="p-3 bg-[#fff1f0] rounded border-2 border-[#f56c6c] shadow-xs shrink-0 flex flex-col items-center w-32 text-center relative">
                            <span className="absolute -top-2 -right-2 px-1.5 py-0.2 rounded bg-[#f56c6c] text-white text-[9px] font-bold">
                              KCP 红线
                            </span>
                            <span className="font-bold text-xs text-[#f5222d]">TRB决议裁决</span>
                            <span className="text-[10px] text-[#f56c6c] mt-0.5">决策委员会</span>
                          </div>

                          <div className="w-8 h-0.5 bg-[#67c23a]" />

                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <div className="w-10 h-10 rounded-full bg-[#1f2733] text-white flex items-center justify-center font-bold shadow-xs">
                              E
                            </div>
                            <span className="text-[11px] font-medium text-[#606266]">发布生效</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailModal.activeTab === 'activities' && (
                <div className="space-y-3">
                  <div className="text-xs text-[#606266]">
                    该流程共包含 <strong className="text-[#1f2733] font-mono-tabular">4</strong> 个业务活动节点，均已完成 RACI 职责矩阵匹配：
                  </div>
                  <table className="w-full border-collapse border border-[#ebeef5]">
                    <thead>
                      <tr className="bg-[#f8f9fb] text-[#606266] border-b border-[#ebeef5]">
                        <th className="px-3 py-2 text-center font-medium w-12">序号</th>
                        <th className="px-3 py-2 text-left font-medium">活动步骤名称</th>
                        <th className="px-3 py-2 text-center font-medium">执行角色</th>
                        <th className="px-3 py-2 text-center font-medium">控制属性</th>
                        <th className="px-3 py-2 text-left font-medium">交付物与输出要求</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebeef5]">
                      <tr>
                        <td className="px-3 py-2 text-center font-mono-tabular">1</td>
                        <td className="px-3 py-2 font-semibold text-[#1f2733]">发起技术评审申请</td>
                        <td className="px-3 py-2 text-center text-[#409eff]">系统架构师</td>
                        <td className="px-3 py-2 text-center text-[#909399]">常规节点</td>
                        <td className="px-3 py-2 text-[#606266]">技术设计资料包、评审申请表单</td>
                      </tr>
                      <tr className="bg-[#fffdfa]">
                        <td className="px-3 py-2 text-center font-mono-tabular">2</td>
                        <td className="px-3 py-2 font-bold text-[#d48806]">同行专家交叉评议</td>
                        <td className="px-3 py-2 text-center text-[#409eff]">资深技术专家组</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-0.5 rounded bg-[#fdf6ec] text-[#e6a23c] font-bold text-[10px] border border-[#faecd8]">
                            KCP 关键控制点
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[#606266]">专家交叉评议记录单、缺陷问题清单</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-center font-mono-tabular">3</td>
                        <td className="px-3 py-2 font-semibold text-[#1f2733]">评审问题闭环整改</td>
                        <td className="px-3 py-2 text-center text-[#409eff]">研发项目组长</td>
                        <td className="px-3 py-2 text-center text-[#909399]">常规节点</td>
                        <td className="px-3 py-2 text-[#606266]">问题整改报告、回归测试验证报告</td>
                      </tr>
                      <tr className="bg-[#fff8f7]">
                        <td className="px-3 py-2 text-center font-mono-tabular">4</td>
                        <td className="px-3 py-2 font-bold text-[#f5222d]">TRB 终审决议签发</td>
                        <td className="px-3 py-2 text-center text-[#409eff]">质量与内控管理委员会</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-0.5 rounded bg-[#fef0f0] text-[#f56c6c] font-bold text-[10px] border border-[#fbc4c4]">
                            KCP 质量红线
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[#606266]">TR质量裁决书、项目准予转阶段批件</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {detailModal.activeTab === 'docs' && (
                <div className="space-y-3">
                  <div className="text-xs text-[#606266]">
                    与本流程绑定的企业规章制度与内控合规风险文件：
                  </div>
                  <table className="w-full border-collapse border border-[#ebeef5]">
                    <thead>
                      <tr className="bg-[#f8f9fb] text-[#606266] border-b border-[#ebeef5]">
                        <th className="px-3 py-2 text-center font-medium w-16">制度编号</th>
                        <th className="px-3 py-2 text-left font-medium">制度名称</th>
                        <th className="px-3 py-2 text-center font-medium">制度层级</th>
                        <th className="px-3 py-2 text-center font-medium">合规风险级别</th>
                        <th className="px-3 py-2 text-left font-medium">管控要求</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebeef5]">
                      <tr>
                        <td className="px-3 py-2 text-center font-mono-tabular font-medium text-[#409eff]">
                          DOC-RD-001
                        </td>
                        <td className="px-3 py-2 font-semibold text-[#1f2733]">
                          研发过程技术评审管理规定 (V3.2)
                        </td>
                        <td className="px-3 py-2 text-center text-[#606266]">公司级二级制度</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-0.5 rounded bg-[#fef0f0] text-[#f56c6c] font-bold text-[10px]">
                            高风险
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[#606266]">重大技术风险必须由TRB委员全票表决通过</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-center font-mono-tabular font-medium text-[#409eff]">
                          DOC-QA-003
                        </td>
                        <td className="px-3 py-2 font-semibold text-[#1f2733]">
                          软件工程质量红线管理规范
                        </td>
                        <td className="px-3 py-2 text-center text-[#606266]">业务部门规程</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-0.5 rounded bg-[#fdf6ec] text-[#e6a23c] font-bold text-[10px]">
                            中风险
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[#606266]">代码覆盖率不得低于85%，缺陷清零方可准出</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              {detailModal.row.auditStatus === '待审核' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = detailModal.row;
                      setDetailModal({ open: false, row: null, activeTab: 'summary' });
                      setDecisionModal({
                        open: true,
                        row: cur,
                        action: 'approve',
                        opinion: '',
                        effectiveDate: new Date().toISOString().slice(0, 10),
                      });
                    }}
                    className="h-8 px-4 rounded bg-[#67c23a] hover:bg-[#5daf34] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>去审核 / 裁决发布</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = detailModal.row;
                      setDetailModal({ open: false, row: null, activeTab: 'summary' });
                      setWithdrawModal({ open: true, row: cur });
                    }}
                    className="h-8 px-3.5 rounded border border-[#dcdfe6] bg-white text-xs text-[#e6a23c] hover:bg-[#fdf6ec] cursor-pointer"
                  >
                    撤回发布申请
                  </button>
                </div>
              ) : (
                <div className="text-xs text-[#909399]">
                  审核流程已完结 · 状态为 <strong className="text-[#1f2733]">{detailModal.row.auditStatus}</strong>
                </div>
              )}
              <button
                type="button"
                onClick={() => setDetailModal({ open: false, row: null, activeTab: 'summary' })}
                className="h-8 px-5 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] hover:text-[#1f2733] cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: 发起审核申请弹窗 (Apply for Audit Modal) ================= */}
      {applyModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-2xl border border-[#ebeef5] overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#ecf5ff] text-[#409eff] flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1f2733]">发起流程发布审核申请</h3>
                  <div className="text-xs text-[#909399]">将已设计完成的业务流程提交合规治理委员会进行发布准入审核</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApplyModal((prev) => ({ ...prev, open: false }))}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[#1f2733] font-bold">
                  选择待发布流程 <span className="text-[#f56c6c]">*</span>
                </label>
                <select
                  value={applyModal.modelId}
                  onChange={(e) => {
                    const sel = flowsList.find((f) => f.id === e.target.value);
                    const nextVer = sel?.versionNo ? `V${parseInt(sel.versionNo.slice(1)) + 1}` : 'V2';
                    setApplyModal((prev) => ({
                      ...prev,
                      modelId: e.target.value,
                      versionNo: nextVer,
                    }));
                  }}
                  className="w-full h-8.5 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] bg-white text-[#303133] outline-none transition-colors"
                >
                  {flowsList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.flowNo} - {f.label} ({f.versionNo || 'V1'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[#1f2733] font-bold">
                    申请版本号 <span className="text-[#f56c6c]">*</span>
                  </label>
                  <input
                    type="text"
                    value={applyModal.versionNo}
                    onChange={(e) => setApplyModal((prev) => ({ ...prev, versionNo: e.target.value }))}
                    placeholder="如 V2"
                    className="w-full h-8.5 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none font-mono-tabular"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#1f2733] font-bold">紧急程度</label>
                  <select
                    value={applyModal.urgency}
                    onChange={(e) =>
                      setApplyModal((prev) => ({ ...prev, urgency: e.target.value as any }))
                    }
                    className="w-full h-8.5 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] bg-white outline-none"
                  >
                    <option value="普通">普通</option>
                    <option value="紧急">紧急</option>
                    <option value="特急">特急 (高优先级)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[#1f2733] font-bold">变更类型</label>
                  <select
                    value={applyModal.changeType}
                    onChange={(e) => setApplyModal((prev) => ({ ...prev, changeType: e.target.value }))}
                    className="w-full h-8.5 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] bg-white outline-none"
                  >
                    <option value="版本升级">版本升级</option>
                    <option value="新建流程">全新新建流程</option>
                    <option value="规范优化">规范优化调整</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#1f2733] font-bold">期望生效日期</label>
                  <input
                    type="date"
                    value={applyModal.effectiveDate}
                    onChange={(e) => setApplyModal((prev) => ({ ...prev, effectiveDate: e.target.value }))}
                    className="w-full h-8.5 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#1f2733] font-bold">
                  变更摘要 / 申请说明 <span className="text-[#f56c6c]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={applyModal.changeSummary}
                  onChange={(e) => setApplyModal((prev) => ({ ...prev, changeSummary: e.target.value }))}
                  placeholder="请详细说明本次流程发布或升级的核心改动点、合规适配说明等..."
                  className="w-full p-3 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-xs resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setApplyModal((prev) => ({ ...prev, open: false }))}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmitApply}
                className="h-8 px-5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                提交审核申请
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: 批量审批弹窗 (Batch Action Modal) ================= */}
      {batchActionModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-[520px] shadow-2xl border border-[#ebeef5] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {batchActionModal.action === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#67c23a]" />
                ) : (
                  <XCircle className="w-5 h-5 text-[#f56c6c]" />
                )}
                <span className="text-sm font-bold text-[#1f2733]">
                  批量{batchActionModal.action === 'approve' ? '同意发布' : '驳回修改'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setBatchActionModal({ open: false, action: 'approve', opinion: '' })}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 text-xs space-y-3">
              <div className="text-[#606266] leading-relaxed">
                确定要对选中的{' '}
                <strong className="text-[#409eff] font-mono-tabular font-bold">
                  {selectedPendingCount}
                </strong>{' '}
                个待审核流程执行【
                {batchActionModal.action === 'approve' ? (
                  <span className="text-[#67c23a] font-bold">审核通过并正式发布</span>
                ) : (
                  <span className="text-[#f56c6c] font-bold">驳回修改</span>
                )}
                】操作吗？
              </div>

              <div className="space-y-1.5">
                <label className="text-[#1f2733] font-bold">统一审批意见</label>
                <textarea
                  rows={3}
                  value={batchActionModal.opinion}
                  onChange={(e) => setBatchActionModal((prev) => ({ ...prev, opinion: e.target.value }))}
                  placeholder={
                    batchActionModal.action === 'approve'
                      ? '批量合规审核通过，符合上线发布规范...'
                      : '请填写统一驳回原因说明...'
                  }
                  className="w-full p-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-xs resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBatchActionModal({ open: false, action: 'approve', opinion: '' })}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleBatchAudit(batchActionModal.action)}
                className={`h-8 px-4 rounded text-white text-xs font-semibold cursor-pointer shadow-xs ${
                  batchActionModal.action === 'approve'
                    ? 'bg-[#67c23a] hover:bg-[#5daf34]'
                    : 'bg-[#f56c6c] hover:bg-[#e65c5c]'
                }`}
              >
                确认批量执行
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: 撤回确认弹窗 (Withdraw Modal) ================= */}
      {withdrawModal.open && withdrawModal.row && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-[440px] shadow-2xl border border-[#ebeef5] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Undo2 className="w-4 h-4 text-[#e6a23c]" />
                <span className="text-sm font-bold text-[#1f2733]">确认撤回流程发布申请</span>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawModal({ open: false, row: null })}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 text-xs text-[#606266] leading-relaxed">
              确定要撤回流程 <strong className="text-[#1f2733]">【{withdrawModal.row.flowName}】</strong>{' '}
              版本 {withdrawModal.row.versionNo} 的发布审核申请吗？撤回后该流程将恢复为草稿状态，审批链条终止。
            </div>
            <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWithdrawModal({ open: false, row: null })}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleAuditAction(withdrawModal.row!, 'withdraw')}
                className="h-8 px-4 rounded bg-[#e6a23c] hover:bg-[#d48806] text-white text-xs font-semibold cursor-pointer"
              >
                确认撤回申请
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 6: 流转进度与时间轴 (Progress Timeline Modal) ================= */}
      {progressModal.open && progressModal.row && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-[620px] shadow-2xl border border-[#ebeef5] overflow-hidden flex flex-col max-h-[86vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <GitCommitHorizontal className="w-4 h-4 text-[#409eff]" />
                <span className="text-sm font-bold text-[#1f2733]">
                  流程审批流转履历 · {progressModal.row.flowName} ({progressModal.row.versionNo})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProgressModal({ open: false, row: null })}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs">
              <div className="mb-5 px-3.5 py-2.5 rounded-lg bg-[#f8f9fb] border border-[#ebeef5] flex items-center justify-between flex-wrap gap-2">
                <span>
                  流程编码：
                  <strong className="font-mono-tabular text-[#1f2733] ml-1">
                    {progressModal.row.flowCode}
                  </strong>
                </span>
                <span>
                  发布策略：
                  {progressModal.row.publishPolicy === 'scheduled' ? (
                    <strong className="text-[#e6a23c] ml-1 font-semibold">
                      预约发布 ({progressModal.row.scheduledTime})
                    </strong>
                  ) : (
                    <strong className="text-[#67c23a] ml-1 font-semibold">立即发布</strong>
                  )}
                </span>
                <span>
                  当前节点：
                  <strong
                    className={
                      progressModal.row.auditStatus === '已审核'
                        ? 'text-[#67c23a]'
                        : progressModal.row.auditStatus === '待审核'
                        ? 'text-[#e6a23c]'
                        : 'text-[#909399]'
                    }
                  >
                    {progressModal.row.auditStatus}
                    {progressModal.row.approvalLevels &&
                    progressModal.row.approvalLevels.length > 1 &&
                    progressModal.row.auditStatus === '待审核'
                      ? ` (第 ${progressModal.row.currentLevel || 1}/${progressModal.row.approvalLevels.length} 级)`
                      : ''}
                  </strong>
                </span>
              </div>

              {/* Vertical Timeline */}
              <div className="relative pl-7 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#e4e7ed]">
                {/* Node 1: 发起流程发布申请 */}
                <div className="relative">
                  <div className="absolute -left-7 top-0.5 w-5 h-5 rounded-full bg-[#67c23a] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3" />
                  </div>
                  <div className="bg-[#f8f9fb] rounded-lg border border-[#ebeef5] p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#1f2733]">1. 发起流程发布申请</span>
                      <span className="font-mono-tabular text-[#909399]">
                        {progressModal.row.submitTime}
                      </span>
                    </div>
                    <div className="text-[#606266]">
                      由 <strong>{progressModal.row.submitUser}</strong> ({progressModal.row.submitUserDept || '业务部门'}) 提交 {progressModal.row.versionNo} 版本发布申请
                    </div>
                    {progressModal.row.changeSummary && (
                      <div className="mt-1 text-[#909399] text-[11px]">
                        申请说明：{progressModal.row.changeSummary}
                      </div>
                    )}
                  </div>
                </div>

                {/* Multi-Level Approval Nodes */}
                {progressModal.row.approvalLevels && progressModal.row.approvalLevels.length > 0 ? (
                  progressModal.row.approvalLevels.map((lvl, lIdx) => {
                    const stepNum = lIdx + 2;
                    const isPassed = lvl.status === 'approved' || progressModal.row!.auditStatus === '已审核';
                    const isCurrent =
                      progressModal.row!.auditStatus === '待审核' &&
                      (progressModal.row!.currentLevel || 1) === lvl.level;
                    const isRejected = lvl.status === 'rejected' || (isCurrent && progressModal.row!.auditStatus === '已驳回');

                    return (
                      <div key={lIdx} className="relative">
                        <div
                          className={`absolute -left-7 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-xs ${
                            isPassed
                              ? 'bg-[#67c23a]'
                              : isCurrent
                              ? 'bg-[#e6a23c]'
                              : isRejected
                              ? 'bg-[#f56c6c]'
                              : 'bg-[#dcdfe6]'
                          }`}
                        >
                          {isPassed ? (
                            <Check className="w-3 h-3" />
                          ) : isCurrent ? (
                            <Clock className="w-3 h-3" />
                          ) : isRejected ? (
                            <X className="w-3 h-3" />
                          ) : (
                            <span className="text-[10px] text-white font-bold">{stepNum}</span>
                          )}
                        </div>
                        <div className="bg-[#f8f9fb] rounded-lg border border-[#ebeef5] p-3.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[#1f2733]">
                              {stepNum}. {lvl.levelName}
                            </span>
                            <span
                              className={`font-semibold ${
                                isPassed
                                  ? 'text-[#67c23a]'
                                  : isCurrent
                                  ? 'text-[#e6a23c]'
                                  : isRejected
                                  ? 'text-[#f56c6c]'
                                  : 'text-[#909399]'
                              }`}
                            >
                              {isPassed
                                ? '审核通过'
                                : isCurrent
                                ? '正在本级审批中'
                                : isRejected
                                ? '已驳回'
                                : '待流转'}
                            </span>
                          </div>
                          <div className="text-[#606266] flex flex-wrap items-center gap-2">
                            <span>
                              审批主体: <strong>{lvl.approverName}</strong>
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-white border border-[#e4e7ed] text-[10px] text-[#909399]">
                              {lvl.approverType === 'deptHead'
                                ? '部门负责人'
                                : lvl.approverType === 'committee'
                                ? '流程委员会'
                                : lvl.approverType === 'role'
                                ? '业务主管'
                                : '指定审批人'}
                            </span>
                            <span className="text-[11px] text-[#909399]">
                              ({lvl.signType === 'and' ? '会签' : '或签'})
                            </span>
                          </div>
                          {lvl.description && (
                            <div className="mt-1 text-[11px] text-[#909399]">
                              审查要求: {lvl.description}
                            </div>
                          )}
                          {lvl.opinion && (
                            <div className="mt-1.5 p-2 rounded bg-white border border-[#ebeef5] text-[#303133]">
                              审核批语: {lvl.opinion}
                              {lvl.auditTime && (
                                <span className="ml-2 font-mono text-[10px] text-[#909399]">
                                  ({lvl.auditTime})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <>
                    {/* Fallback Node 2 */}
                    <div className="relative">
                      <div className="absolute -left-7 top-0.5 w-5 h-5 rounded-full bg-[#67c23a] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="bg-[#f8f9fb] rounded-lg border border-[#ebeef5] p-3.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#1f2733]">2. 审批部门负责人与架构预审</span>
                          <span className="font-mono-tabular text-[#67c23a] font-medium">预审通过</span>
                        </div>
                        <div className="text-[#606266]">
                          所属架构路径：{progressModal.row.archPath}
                        </div>
                      </div>
                    </div>

                    {/* Fallback Node 3 */}
                    <div className="relative">
                      <div
                        className={`absolute -left-7 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-xs ${
                          progressModal.row.auditStatus === '已审核'
                            ? 'bg-[#67c23a]'
                            : progressModal.row.auditStatus === '待审核'
                            ? 'bg-[#e6a23c]'
                            : 'bg-[#f56c6c]'
                        }`}
                      >
                        {progressModal.row.auditStatus === '已审核' ? (
                          <Check className="w-3 h-3" />
                        ) : progressModal.row.auditStatus === '待审核' ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                      </div>
                      <div className="bg-[#f8f9fb] rounded-lg border border-[#ebeef5] p-3.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#1f2733]">3. 流程治理委员会终审</span>
                          <span className="font-bold text-[#e6a23c]">{progressModal.row.auditStatus}</span>
                        </div>
                        <div className="text-[#606266]">
                          经办人：<strong>{progressModal.row.auditUser || '流程治理委员会'}</strong>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Final Node: 发布生效 */}
                <div className="relative">
                  <div
                    className={`absolute -left-7 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-xs ${
                      progressModal.row.auditStatus === '已审核' ? 'bg-[#67c23a]' : 'bg-[#dcdfe6]'
                    }`}
                  >
                    {progressModal.row.auditStatus === '已审核' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3 text-[#909399]" />
                    )}
                  </div>
                  <div className="bg-[#f8f9fb] rounded-lg border border-[#ebeef5] p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#1f2733]">
                        {progressModal.row.approvalLevels ? progressModal.row.approvalLevels.length + 2 : 4}. 生产发布与生效
                      </span>
                      <span className="font-mono-tabular text-[#909399]">
                        {progressModal.row.auditStatus === '已审核'
                          ? progressModal.row.effectiveDate || progressModal.row.auditTime
                          : '待触发'}
                      </span>
                    </div>
                    <div className="text-[#606266] space-y-1">
                      <div>
                        生效版本：<strong>{progressModal.row.versionNo}</strong> (
                        {progressModal.row.auditStatus === '已审核' ? '生效运行中' : '尚未生效'})
                      </div>
                      <div className="text-[11px] text-[#909399]">
                        发布策略：
                        {progressModal.row.publishPolicy === 'scheduled' ? (
                          <strong className="text-[#e6a23c]">
                            按照时间预约自动发布 (定于【{progressModal.row.scheduledTime}】自动激活)
                          </strong>
                        ) : (
                          <strong className="text-[#67c23a]">审批通过后立即发布生效</strong>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              {progressModal.row.auditStatus === '待审核' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = progressModal.row;
                      setProgressModal({ open: false, row: null });
                      setDecisionModal({
                        open: true,
                        row: cur,
                        action: 'approve',
                        opinion: '',
                        effectiveDate: new Date().toISOString().slice(0, 10),
                      });
                    }}
                    className="h-8 px-3.5 rounded bg-[#67c23a] hover:bg-[#5daf34] text-white text-xs font-semibold cursor-pointer"
                  >
                    去审批发布
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAuditAction(progressModal.row!, 'withdraw')}
                    className="h-8 px-3.5 rounded border border-[#dcdfe6] bg-white text-xs text-[#e6a23c] cursor-pointer"
                  >
                    撤回
                  </button>
                </div>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setProgressModal({ open: false, row: null })}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 7: 删除确认弹窗 ================= */}
      {deleteConfirmModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-[420px] shadow-2xl border border-[#ebeef5] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#f56c6c]">
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-bold text-[#1f2733]">确认删除审核记录</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ open: false })}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 text-xs text-[#606266] leading-relaxed">
              {deleteConfirmModal.isBatch ? (
                <>
                  确定要删除选中的 <strong className="text-[#f56c6c]">{selectedIds.length}</strong>{' '}
                  条流程审核历史记录吗？删除后不可撤销。
                </>
              ) : (
                <>
                  确定要删除流程【
                  <strong className="text-[#1f2733]">{deleteConfirmModal.row?.flowName}</strong>
                  】的审核记录吗？
                </>
              )}
            </div>
            <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ open: false })}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDeleteRecords}
                className="h-8 px-4 rounded bg-[#f56c6c] hover:bg-[#e65c5c] text-white text-xs font-semibold cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
