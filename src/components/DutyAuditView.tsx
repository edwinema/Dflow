import React, { useState, useEffect, useMemo } from 'react';
import { PersonSelectField } from './PersonSelectField';
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  RotateCcw,
  Check,
  X,
  UserCheck,
  Eye,
  ArrowRight,
  ShieldCheck,
  Building2,
  Send,
  User,
  Users,
  AlertTriangle,
  History,
  ChevronRight,
  ExternalLink,
  Layers,
  ChevronDown,
  MoveHorizontal,
} from 'lucide-react';
import {
  useTableDnDAndResize,
  TableHeaderCell,
  TableColumnConfig,
  TableResizeGuideLine,
  TableColGroup,
} from '../hooks/useTableDnDAndResize';

interface AuditLevel {
  level: number;
  levelName: string;
  roleName: string;
  approverName: string;
  deptName: string;
  status: 'pending' | 'approved' | 'rejected' | 'waiting';
  opinion?: string;
  operateTime?: string;
}

interface AuditHistoryItem {
  time: string;
  operator: string;
  action: string;
  nodeName: string;
  opinion: string;
}

export interface DutyAuditTask {
  id: string;
  manualId: string;
  manualName: string;
  dutyItemId: string;
  dutyNo: string;
  dutyName: string;
  categoryName: string;
  scope: string;
  scenarioText?: string;
  submitter: string;
  submitTime: string;
  urgency: '普通' | '紧急' | '特急';
  remark?: string;
  currentLevelIndex: number;
  currentApprover: string;
  currentLevelName: string;
  status: '待审核' | '审核中' | '已通过' | '已驳回';
  levels: AuditLevel[];
  history: AuditHistoryItem[];
}

interface DutyAuditViewProps {
  onNavigate?: (path: string, param?: any) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const CANDIDATE_APPROVERS = [
  { name: '张明', role: '权责推进专员', dept: '权责管理部' },
  { name: '陈静', role: '合规法务总监', dept: '质量合规部' },
  { name: '刘建国', role: '决策委员会主任', dept: '决策委员会' },
  { name: '王强', role: '内控审计主管', dept: '审计监察部' },
  { name: '李芳', role: '财务风控经理', dept: '财务管理中心' },
  { name: '流程管理员', role: '流程推进官', dept: '流程管理部' },
];

const AUDIT_COLUMNS: TableColumnConfig[] = [
  { key: 'selection', title: '', defaultWidth: 44, minWidth: 44, fixed: 'left', canDrag: false, canResize: false, align: 'center' },
  { key: 'id', title: '审核单号', defaultWidth: 125, minWidth: 90 },
  { key: 'manualName', title: '权责手册', defaultWidth: 150, minWidth: 100 },
  { key: 'categoryName', title: '权责分类', defaultWidth: 110, minWidth: 80 },
  { key: 'dutyNo', title: '权责编号', defaultWidth: 115, minWidth: 80 },
  { key: 'dutyName', title: '权责事项名称', defaultWidth: 160, minWidth: 110 },
  { key: 'scope', title: '授权使用范围', defaultWidth: 160, minWidth: 100 },
  { key: 'currentApprover', title: '当前层级与审批人', defaultWidth: 180, minWidth: 130 },
  { key: 'urgency', title: '紧急程度', defaultWidth: 90, minWidth: 70, align: 'center' },
  { key: 'submitter', title: '送审人 / 时间', defaultWidth: 150, minWidth: 110 },
  { key: 'status', title: '状态', defaultWidth: 95, minWidth: 70, align: 'center' },
  { key: 'actions', title: '审批操作', defaultWidth: 190, minWidth: 140, fixed: 'right', canDrag: false, align: 'center' },
];

export const DutyAuditView: React.FC<DutyAuditViewProps> = ({ onNavigate, showToast }) => {
  const auditGrid = useTableDnDAndResize({
    storageKey: 'dflow_duty_audit_table',
    columns: AUDIT_COLUMNS,
  });

  const [tasks, setTasks] = useState<DutyAuditTask[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    auditing: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('全部');
  const [urgencyFilter, setUrgencyFilter] = useState('全部');
  const [keyword, setKeyword] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');

  // Selection
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [detailModal, setDetailModal] = useState<{ open: boolean; task: DutyAuditTask | null }>({
    open: false,
    task: null,
  });

  const [approveModal, setApproveModal] = useState<{
    open: boolean;
    task: DutyAuditTask | null;
    isBatch?: boolean;
    opinion: string;
  }>({
    open: false,
    task: null,
    isBatch: false,
    opinion: '同意，经核定符合集团授权管控体系规范，准予通过。',
  });

  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    task: DutyAuditTask | null;
    isBatch?: boolean;
    opinion: string;
  }>({
    open: false,
    task: null,
    isBatch: false,
    opinion: '',
  });

  const [transferModal, setTransferModal] = useState<{
    open: boolean;
    task: DutyAuditTask | null;
    targetApprover: string;
    targetDept: string;
    reason: string;
  }>({
    open: false,
    task: null,
    targetApprover: CANDIDATE_APPROVERS[0].name,
    targetDept: CANDIDATE_APPROVERS[0].dept,
    reason: '当前阶段专项事项涉及跨部门联审，转由指定专员承办。',
  });

  // Fetch Tasks
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== '全部') params.append('status', statusFilter);
      if (urgencyFilter !== '全部') params.append('urgency', urgencyFilter);
      if (activeKeyword) params.append('keyword', activeKeyword);

      const res = await fetch(`/api/flowdoc/audit/tasks?${params.toString()}`).then((r) => r.json());
      if (res.status === 1) {
        setTasks(res.data || []);
        if (res.stats) setStats(res.stats);
      }
    } catch {
      showToast('获取权责审核任务失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, urgencyFilter, activeKeyword]);

  // Search & Reset
  const handleSearch = () => {
    setActiveKeyword(keyword.trim());
    setCurrentPage(1);
  };

  const handleReset = () => {
    setStatusFilter('全部');
    setUrgencyFilter('全部');
    setKeyword('');
    setActiveKeyword('');
    setCurrentPage(1);
  };

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTaskIds(paginatedTasks.map((t) => t.id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Pagination slice
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return tasks.slice(start, start + pageSize);
  }, [tasks, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(tasks.length / pageSize));

  // Single Approve
  const handleConfirmApprove = async () => {
    if (approveModal.isBatch) {
      // Batch
      try {
        const res = await fetch('/api/flowdoc/audit/tasks/batch-approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskIds: selectedTaskIds,
            opinion: approveModal.opinion,
            operator: '当前登录人',
          }),
        }).then((r) => r.json());
        if (res.status === 1) {
          showToast(`已批量通过选中的 ${selectedTaskIds.length} 项审核任务`, 'success');
          setApproveModal({ open: false, task: null, opinion: '' });
          setSelectedTaskIds([]);
          fetchTasks();
        }
      } catch {
        showToast('批量审核操作异常', 'error');
      }
      return;
    }

    if (!approveModal.task) return;
    try {
      const res = await fetch(`/api/flowdoc/audit/tasks/${approveModal.task.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opinion: approveModal.opinion,
          operator: approveModal.task.currentApprover || '当前登录人',
        }),
      }).then((r) => r.json());

      if (res.status === 1) {
        showToast(`审核通过：【${approveModal.task.dutyName}】已推进至下一层级或已生效`, 'success');
        setApproveModal({ open: false, task: null, opinion: '' });
        fetchTasks();
        if (detailModal.open && detailModal.task?.id === approveModal.task.id) {
          setDetailModal({ open: true, task: res.data });
        }
      }
    } catch {
      showToast('审核通过操作失败', 'error');
    }
  };

  // Single Reject
  const handleConfirmReject = async () => {
    if (!rejectModal.opinion.trim()) {
      showToast('请填写驳回原因', 'warning');
      return;
    }

    if (rejectModal.isBatch) {
      try {
        const res = await fetch('/api/flowdoc/audit/tasks/batch-reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskIds: selectedTaskIds,
            opinion: rejectModal.opinion,
            operator: '当前登录人',
          }),
        }).then((r) => r.json());
        if (res.status === 1) {
          showToast(`已批量驳回选中的 ${selectedTaskIds.length} 项审核任务`, 'success');
          setRejectModal({ open: false, task: null, opinion: '' });
          setSelectedTaskIds([]);
          fetchTasks();
        }
      } catch {
        showToast('批量驳回操作异常', 'error');
      }
      return;
    }

    if (!rejectModal.task) return;
    try {
      const res = await fetch(`/api/flowdoc/audit/tasks/${rejectModal.task.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opinion: rejectModal.opinion,
          operator: rejectModal.task.currentApprover || '当前登录人',
        }),
      }).then((r) => r.json());

      if (res.status === 1) {
        showToast(`已驳回权责事项【${rejectModal.task.dutyName}】`, 'warning');
        setRejectModal({ open: false, task: null, opinion: '' });
        fetchTasks();
        if (detailModal.open && detailModal.task?.id === rejectModal.task.id) {
          setDetailModal({ open: true, task: res.data });
        }
      }
    } catch {
      showToast('驳回操作失败', 'error');
    }
  };

  // Transfer
  const handleConfirmTransfer = async () => {
    if (!transferModal.task || !transferModal.targetApprover) return;
    try {
      const res = await fetch(`/api/flowdoc/audit/tasks/${transferModal.task.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetApprover: transferModal.targetApprover,
          targetDept: transferModal.targetDept,
          reason: transferModal.reason,
          operator: transferModal.task.currentApprover || '原审批人',
        }),
      }).then((r) => r.json());

      if (res.status === 1) {
        showToast(`已成功将审批任务转办给【${transferModal.targetApprover}】`, 'success');
        setTransferModal({
          open: false,
          task: null,
          targetApprover: CANDIDATE_APPROVERS[0].name,
          targetDept: CANDIDATE_APPROVERS[0].dept,
          reason: '',
        });
        fetchTasks();
        if (detailModal.open && detailModal.task?.id === transferModal.task.id) {
          setDetailModal({ open: true, task: res.data });
        }
      }
    } catch {
      showToast('转办操作异常', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f0f2f5] min-w-0 overflow-hidden font-sans">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="bg-white border-b border-[#e8e8e8] px-6 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#8c8c8c]">权责管控</span>
          <span className="text-[#bfbfbf]">/</span>
          <span className="text-[#262626] font-medium">权责审核</span>
          <span className="ml-3 px-2 py-0.5 rounded-full bg-[#e6f7ff] text-[#1890ff] text-[11px] border border-[#91d5ff] font-medium flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            多层级审批管控中心
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/flowdoc/duty')}
            className="h-8 px-3 rounded bg-white hover:bg-[#f5f7fa] text-[#595959] hover:text-[#1890ff] border border-[#d9d9d9] text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>返回权责建设</span>
          </button>
          <button
            type="button"
            onClick={fetchTasks}
            className="h-8 px-3 rounded bg-[#1890ff] hover:bg-[#40a9ff] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>刷新待办任务</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {/* KPI Stats Cards */}
        <div className="grid grid-cols-5 gap-3 shrink-0">
          <div
            onClick={() => setStatusFilter('全部')}
            className={`p-3.5 rounded-lg border bg-white cursor-pointer transition-all hover:shadow-sm ${
              statusFilter === '全部' ? 'border-[#1890ff] ring-1 ring-[#1890ff]/20' : 'border-[#e8e8e8]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#8c8c8c]">
              <span>全部审核任务</span>
              <Layers className="w-4 h-4 text-[#8c8c8c]" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#262626]">{stats.total}</div>
            <div className="mt-1 text-[11px] text-[#bfbfbf]">涵盖所有权责手册事项</div>
          </div>

          <div
            onClick={() => setStatusFilter('待审核')}
            className={`p-3.5 rounded-lg border bg-white cursor-pointer transition-all hover:shadow-sm ${
              statusFilter === '待审核' ? 'border-[#fa8c16] ring-1 ring-[#fa8c16]/20' : 'border-[#e8e8e8]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#fa8c16]">
              <span className="font-medium">待我审批 (初审/待办)</span>
              <Clock className="w-4 h-4 text-[#fa8c16]" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#fa8c16]">{stats.pending}</div>
            <div className="mt-1 text-[11px] text-[#8c8c8c]">需审批人即时处理</div>
          </div>

          <div
            onClick={() => setStatusFilter('审核中')}
            className={`p-3.5 rounded-lg border bg-white cursor-pointer transition-all hover:shadow-sm ${
              statusFilter === '审核中' ? 'border-[#1890ff] ring-1 ring-[#1890ff]/20' : 'border-[#e8e8e8]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#1890ff]">
              <span className="font-medium">审核中 (后续层级流转)</span>
              <FileCheck2 className="w-4 h-4 text-[#1890ff]" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#1890ff]">{stats.auditing}</div>
            <div className="mt-1 text-[11px] text-[#8c8c8c]">已过初审，等待复核/终审</div>
          </div>

          <div
            onClick={() => setStatusFilter('已通过')}
            className={`p-3.5 rounded-lg border bg-white cursor-pointer transition-all hover:shadow-sm ${
              statusFilter === '已通过' ? 'border-[#52c41a] ring-1 ring-[#52c41a]/20' : 'border-[#e8e8e8]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#52c41a]">
              <span className="font-medium">已通过 / 已生效</span>
              <CheckCircle2 className="w-4 h-4 text-[#52c41a]" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#52c41a]">{stats.approved}</div>
            <div className="mt-1 text-[11px] text-[#8c8c8c]">全层级审批完成已发布</div>
          </div>

          <div
            onClick={() => setStatusFilter('已驳回')}
            className={`p-3.5 rounded-lg border bg-white cursor-pointer transition-all hover:shadow-sm ${
              statusFilter === '已驳回' ? 'border-[#ff4d4f] ring-1 ring-[#ff4d4f]/20' : 'border-[#e8e8e8]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#ff4d4f]">
              <span className="font-medium">已驳回</span>
              <XCircle className="w-4 h-4 text-[#ff4d4f]" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#ff4d4f]">{stats.rejected}</div>
            <div className="mt-1 text-[11px] text-[#8c8c8c]">需起草人修改重新提交</div>
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-white rounded-lg border border-[#e8e8e8] p-3.5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              {/* 审核状态 */}
              <div className="flex items-center gap-2">
                <span className="text-[#595959]">审核状态:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 px-2.5 rounded border border-[#d9d9d9] bg-white text-[#262626] text-xs focus:outline-none focus:border-[#1890ff] cursor-pointer"
                >
                  <option value="全部">全部状态</option>
                  <option value="待审核">待审核</option>
                  <option value="审核中">审核中</option>
                  <option value="已通过">已通过</option>
                  <option value="已驳回">已驳回</option>
                </select>
              </div>

              {/* 紧急程度 */}
              <div className="flex items-center gap-2">
                <span className="text-[#595959]">紧急程度:</span>
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="h-8 px-2.5 rounded border border-[#d9d9d9] bg-white text-[#262626] text-xs focus:outline-none focus:border-[#1890ff] cursor-pointer"
                >
                  <option value="全部">全部程度</option>
                  <option value="普通">普通</option>
                  <option value="紧急">紧急</option>
                  <option value="特急">特急</option>
                </select>
              </div>

              {/* Keyword Search */}
              <div className="flex items-center gap-2">
                <span className="text-[#595959]">搜索:</span>
                <div className="relative w-64">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="输入权责名称 / 编号 / 审核单号"
                    className="h-8 w-full pl-8 pr-3 rounded border border-[#d9d9d9] bg-white text-[#262626] text-xs focus:outline-none focus:border-[#1890ff]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#bfbfbf] absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="h-8 px-3.5 rounded bg-[#1890ff] hover:bg-[#40a9ff] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>查询</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-8 px-3 rounded bg-white hover:bg-[#f5f7fa] text-[#595959] border border-[#d9d9d9] text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重置</span>
                </button>
              </div>
            </div>

            {/* Batch actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={selectedTaskIds.length === 0}
                onClick={() =>
                  setApproveModal({
                    open: true,
                    task: null,
                    isBatch: true,
                    opinion: '批量审核通过。准予推进至下一层级或予以发布生效。',
                  })
                }
                className={`h-8 px-3 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  selectedTaskIds.length > 0
                    ? 'bg-[#52c41a] hover:bg-[#73d13d] text-white cursor-pointer shadow-xs'
                    : 'bg-[#f5f5f5] text-[#bfbfbf] border border-[#d9d9d9] cursor-not-allowed'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>批量通过 ({selectedTaskIds.length})</span>
              </button>

              <button
                type="button"
                disabled={selectedTaskIds.length === 0}
                onClick={() =>
                  setRejectModal({
                    open: true,
                    task: null,
                    isBatch: true,
                    opinion: '经核定权责内容尚需补充修订，批量驳回。',
                  })
                }
                className={`h-8 px-3 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  selectedTaskIds.length > 0
                    ? 'bg-[#fff1f0] hover:bg-[#ffccc7] text-[#ff4d4f] border border-[#ffa39e] cursor-pointer'
                    : 'bg-[#f5f5f5] text-[#bfbfbf] border border-[#d9d9d9] cursor-not-allowed'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>批量驳回 ({selectedTaskIds.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Task Table Card */}
        <div className="bg-white rounded-lg border border-[#e8e8e8] shadow-xs overflow-hidden flex flex-col">
          {/* Table Header Control / Hint Bar */}
          <div className="px-3.5 py-1.5 bg-[#fafafa] border-b border-[#f0f0f0] flex items-center justify-between text-[11px] text-[#8c8c8c]">
            <div className="flex items-center gap-1.5">
              <MoveHorizontal className="w-3.5 h-3.5 text-[#1890ff]" />
              <span>
                表格支持 <strong className="text-[#1890ff] font-medium">按住拖拽表头重排</strong> 列顺序，及{' '}
                <strong className="text-[#1890ff] font-medium">拖拽右边框调整列宽</strong>（双击边框恢复默认）
              </span>
            </div>
            <button
              type="button"
              onClick={auditGrid.resetColumns}
              className="text-[#8c8c8c] hover:text-[#1890ff] flex items-center gap-1 cursor-pointer transition-colors"
              title="重置为默认列宽与列顺序"
            >
              <RotateCcw className="w-3 h-3" />
              <span>重置表头</span>
            </button>
          </div>

          <div ref={auditGrid.tableContainerRef} className="overflow-x-auto relative">
            <TableResizeGuideLine resizingInfo={auditGrid.resizingInfo} />
            <table
              style={{ width: `${auditGrid.totalTableWidth}px`, minWidth: '100%' }}
              className="text-left border-collapse text-xs table-fixed"
            >
              <TableColGroup columns={auditGrid.columns} colWidths={auditGrid.colWidths} />
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#f0f0f0] text-[#595959] font-medium h-11">
                  {auditGrid.columns.map((col) => (
                    <TableHeaderCell
                      key={col.key}
                      col={col}
                      width={auditGrid.colWidths[col.key] ?? col.defaultWidth}
                      isDragging={auditGrid.draggingKey === col.key}
                      isDragOver={auditGrid.dragOverKey === col.key}
                      dropPosition={auditGrid.dropPosition}
                      isResizing={auditGrid.resizingKey === col.key}
                      onDragStart={(e) => auditGrid.handleDragStart(e, col.key, col)}
                      onDragOver={(e) => auditGrid.handleDragOver(e, col.key, col)}
                      onDragLeave={auditGrid.handleDragLeave}
                      onDrop={(e) => auditGrid.handleDrop(e, col.key, col)}
                      onDragEnd={auditGrid.handleDragEnd}
                      onResizeStart={(e) => auditGrid.handleResizeStart(e, col)}
                      onDoubleClickResize={(e) => auditGrid.handleDoubleClickResize(e, col)}
                    >
                      {col.key === 'selection' ? (
                        <input
                          type="checkbox"
                          checked={
                            paginatedTasks.length > 0 &&
                            paginatedTasks.every((t) => selectedTaskIds.includes(t.id))
                          }
                          onChange={handleSelectAll}
                          className="rounded border-[#d9d9d9] text-[#1890ff] focus:ring-0 cursor-pointer"
                        />
                      ) : undefined}
                    </TableHeaderCell>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {loading ? (
                  <tr>
                    <td colSpan={auditGrid.columns.length} className="py-12 text-center text-[#8c8c8c]">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#1890ff] border-t-transparent rounded-full animate-spin" />
                        <span>正在加载权责审批任务...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={auditGrid.columns.length} className="py-12 text-center text-[#8c8c8c]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileCheck2 className="w-8 h-8 text-[#d9d9d9]" />
                        <span>暂无符合条件的权责审核任务</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTasks.map((task) => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    const isCompleted = task.status === '已通过' || task.status === '已驳回';

                    return (
                      <tr
                        key={task.id}
                        className={`hover:bg-[#fcfdfe] transition-colors ${
                          isSelected ? 'bg-[#f0f7ff]' : ''
                        }`}
                      >
                        {auditGrid.columns.map((col) => {
                          const w = auditGrid.colWidths[col.key] ?? col.defaultWidth;
                          const cellStyle = { width: `${w}px`, minWidth: `${col.minWidth ?? w}px` };

                          switch (col.key) {
                            case 'selection':
                              return (
                                <td key={col.key} style={cellStyle} className="py-3 px-3 text-center border-r border-[#f0f0f0]">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelect(task.id)}
                                    className="rounded border-[#d9d9d9] text-[#1890ff] focus:ring-0 cursor-pointer"
                                  />
                                </td>
                              );

                            case 'id':
                              return (
                                <td key={col.key} style={cellStyle} className="py-3 px-3 font-mono font-medium text-[#1890ff] border-r border-[#f0f0f0]">
                                  <span
                                    onClick={() => setDetailModal({ open: true, task })}
                                    className="hover:underline cursor-pointer truncate block"
                                    title="点击查看审批详情"
                                  >
                                    {task.id}
                                  </span>
                                </td>
                              );

                            case 'manualName':
                              return (
                                <td key={col.key} style={cellStyle} className="py-3 px-3 text-[#262626] border-r border-[#f0f0f0]">
                                  <span className="truncate block" title={task.manualName}>
                                    {task.manualName}
                                  </span>
                                </td>
                              );

                            case 'categoryName':
                              return (
                                <td key={col.key} style={cellStyle} className="py-3 px-3 text-[#595959] border-r border-[#f0f0f0]">
                                  <span className="truncate block">{task.categoryName}</span>
                                </td>
                              );

                            case 'dutyNo':
                              return (
                                <td key={col.key} style={cellStyle} className="py-3 px-3 font-mono text-[#595959] border-r border-[#f0f0f0]">
                                  <span className="truncate block">{task.dutyNo}</span>
                                </td>
                              );

                            case 'dutyName':
                              return (
                                <td key={col.key} style={cellStyle} className="py-3 px-3 text-[#262626] font-medium border-r border-[#f0f0f0]">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span
                                      onClick={() => setDetailModal({ open: true, task })}
                                      className="hover:text-[#1890ff] hover:underline cursor-pointer truncate"
                                      title={task.dutyName}
                                    >
                                      {task.dutyName}
                                    </span>
                                  </div>
                                  {task.scenarioText && (
                                    <div className="text-[11px] text-[#8c8c8c] truncate mt-0.5" title={task.scenarioText}>
                                      {task.scenarioText}
                                    </div>
                                  )}
                                </td>
                              );

                            case 'scope':
                              return (
                                <td key={col.key} style={cellStyle} className="py-3 px-3 text-[#595959] border-r border-[#f0f0f0]">
                                  <div className="flex items-center gap-1 text-xs truncate">
                                    <Building2 className="w-3.5 h-3.5 text-[#1890ff] shrink-0" />
                                    <span className="truncate" title={task.scope}>
                                      {task.scope || '全集团本部及子公司'}
                                    </span>
                                  </div>
                                </td>
                              );

                            case 'currentApprover':
                              return (
                                <td key={col.key} style={cellStyle} className="py-3 px-3 border-r border-[#f0f0f0]">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="px-1.5 py-0.5 rounded bg-[#e6f7ff] text-[#1890ff] border border-[#91d5ff] text-[10.5px] font-medium shrink-0">
                                        {task.currentLevelName}
                                      </span>
                                      <span className="font-medium text-[#262626] truncate">
                                        {task.currentApprover}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-[#8c8c8c] flex items-center gap-1">
                                      <span>流转进度:</span>
                                      <span className="font-mono text-[#262626]">
                                        {task.currentLevelIndex + 1}/{task.levels?.length || 1} 级
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              );

                            case 'urgency':
                              return (
                                <td key={col.key} style={cellStyle} className="py-3 px-3 text-center border-r border-[#f0f0f0]">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                                      task.urgency === '特急'
                                        ? 'bg-[#fff1f0] text-[#cf1322] border border-[#ffa39e]'
                                        : task.urgency === '紧急'
                                        ? 'bg-[#fff7e6] text-[#d46b08] border border-[#ffd591]'
                                        : 'bg-[#f5f5f5] text-[#595959] border border-[#d9d9d9]'
                                    }`}
                                  >
                                    {task.urgency || '普通'}
                                  </span>
                                </td>
                              );

                            case 'submitter':
                              return (
                                <td key={col.key} style={cellStyle} className="py-3 px-3 border-r border-[#f0f0f0] text-[#595959]">
                                  <div className="space-y-0.5">
                                    <div className="font-medium text-[#262626] flex items-center gap-1">
                                      <User className="w-3 h-3 text-[#8c8c8c] shrink-0" />
                                      <span className="truncate">{task.submitter}</span>
                                    </div>
                                    <div className="font-mono text-[10.5px] text-[#8c8c8c] truncate">
                                      {task.submitTime}
                                    </div>
                                  </div>
                                </td>
                              );

                            case 'status':
                              return (
                                <td key={col.key} style={cellStyle} className="py-3 px-3 text-center border-r border-[#f0f0f0]">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                                      task.status === '已通过'
                                        ? 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]'
                                        : task.status === '待审核'
                                        ? 'bg-[#fff7e6] text-[#fa8c16] border-[#ffd591]'
                                        : task.status === '审核中'
                                        ? 'bg-[#e6f7ff] text-[#1890ff] border-[#91d5ff]'
                                        : 'bg-[#fff1f0] text-[#ff4d4f] border-[#ffa39e]'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                        task.status === '已通过'
                                          ? 'bg-[#52c41a]'
                                          : task.status === '待审核'
                                          ? 'bg-[#fa8c16]'
                                          : task.status === '审核中'
                                          ? 'bg-[#1890ff]'
                                          : 'bg-[#ff4d4f]'
                                      }`}
                                    />
                                    {task.status}
                                  </span>
                                </td>
                              );

                            case 'actions':
                              return (
                                <td key={col.key} style={cellStyle} className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    {!isCompleted ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setApproveModal({
                                              open: true,
                                              task,
                                              isBatch: false,
                                              opinion: '同意，符合权责矩阵规则准予通过。',
                                            })
                                          }
                                          className="text-[#52c41a] hover:text-[#389e0d] font-medium hover:underline cursor-pointer flex items-center gap-0.5"
                                          title="审核通过当前层级"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          <span>通过</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setRejectModal({
                                              open: true,
                                              task,
                                              isBatch: false,
                                              opinion: '',
                                            })
                                          }
                                          className="text-[#ff4d4f] hover:text-[#cf1322] font-medium hover:underline cursor-pointer flex items-center gap-0.5"
                                          title="驳回该审核任务"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                          <span>驳回</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setTransferModal({
                                              open: true,
                                              task,
                                              targetApprover: CANDIDATE_APPROVERS[1].name,
                                              targetDept: CANDIDATE_APPROVERS[1].dept,
                                              reason: '跨业务领域转交指定审核人研判。',
                                            })
                                          }
                                          className="text-[#1890ff] hover:underline cursor-pointer flex items-center gap-0.5"
                                          title="转办给其他审批人"
                                        >
                                          <UserCheck className="w-3.5 h-3.5" />
                                          <span>转办</span>
                                        </button>
                                      </>
                                    ) : null}

                                    <button
                                      type="button"
                                      onClick={() => setDetailModal({ open: true, task })}
                                      className="text-[#595959] hover:text-[#1890ff] hover:underline cursor-pointer flex items-center gap-0.5"
                                      title="查看流转进度与审批日志"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>详情</span>
                                    </button>
                                  </div>
                                </td>
                              );

                            default:
                              return null;
                          }
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination */}
          <div className="py-2.5 px-4 bg-[#fafafa] border-t border-[#f0f0f0] flex items-center justify-between text-xs text-[#595959]">
            <div>
              共 <span className="font-medium text-[#262626]">{tasks.length}</span> 条审批记录， 当前显示第{' '}
              <span className="font-medium text-[#262626]">{currentPage}</span> / {totalPages} 页
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`px-2.5 py-1 rounded border text-xs ${
                  currentPage <= 1
                    ? 'border-[#d9d9d9] text-[#bfbfbf] bg-[#f5f5f5] cursor-not-allowed'
                    : 'border-[#d9d9d9] text-[#262626] hover:border-[#1890ff] hover:text-[#1890ff] bg-white cursor-pointer'
                }`}
              >
                上一页
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`px-2.5 py-1 rounded border text-xs ${
                  currentPage >= totalPages
                    ? 'border-[#d9d9d9] text-[#bfbfbf] bg-[#f5f5f5] cursor-not-allowed'
                    : 'border-[#d9d9d9] text-[#262626] hover:border-[#1890ff] hover:text-[#1890ff] bg-white cursor-pointer'
                }`}
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: APPROVE DIALOG */}
      {approveModal.open && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#f6ffed] text-[#52c41a] flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#262626]">
                    {approveModal.isBatch ? '批量通过审核任务' : '审核通过确认'}
                  </h3>
                  <p className="text-xs text-[#8c8c8c]">
                    {approveModal.isBatch
                      ? `已选 ${selectedTaskIds.length} 项审核任务`
                      : `审核单号: ${approveModal.task?.id}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApproveModal({ open: false, task: null, opinion: '' })}
                className="text-[#8c8c8c] hover:text-[#262626] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {!approveModal.isBatch && approveModal.task && (
                <div className="bg-[#fafafa] p-3 rounded border border-[#f0f0f0] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#8c8c8c]">权责事项:</span>
                    <span className="font-medium text-[#262626]">{approveModal.task.dutyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8c8c8c]">当前层级:</span>
                    <span className="text-[#1890ff] font-medium">{approveModal.task.currentLevelName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8c8c8c]">审批人:</span>
                    <span className="text-[#262626]">{approveModal.task.currentApprover}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[#262626] font-medium mb-1.5">
                  审批意见 / 批注 <span className="text-[#ff4d4f]">*</span>
                </label>
                <textarea
                  value={approveModal.opinion}
                  onChange={(e) =>
                    setApproveModal({ ...approveModal, opinion: e.target.value })
                  }
                  rows={3}
                  placeholder="请输入您的审核意见..."
                  className="w-full p-2.5 text-xs rounded border border-[#d9d9d9] focus:outline-none focus:border-[#1890ff] text-[#262626]"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    '同意，符合权责矩阵规则准予通过。',
                    '原则同意，请下一级终审委员会审定。',
                    '准予通过并生效发布。',
                  ].map((phrase, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setApproveModal({ ...approveModal, opinion: phrase })}
                      className="px-2 py-0.5 rounded bg-[#f5f5f5] hover:bg-[#e6f7ff] text-[#595959] hover:text-[#1890ff] text-[11px] cursor-pointer transition-colors"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-[#fafafa] border-t border-[#f0f0f0] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setApproveModal({ open: false, task: null, opinion: '' })}
                className="h-8 px-4 rounded border border-[#d9d9d9] bg-white text-[#595959] text-xs hover:bg-[#f5f7fa] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="h-8 px-4 rounded bg-[#52c41a] hover:bg-[#73d13d] text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                确认通过
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT DIALOG */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#fff1f0] text-[#ff4d4f] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#262626]">
                    {rejectModal.isBatch ? '批量驳回审核任务' : '审核驳回确认'}
                  </h3>
                  <p className="text-xs text-[#ff4d4f]">
                    驳回后任务将退回起草人，权责状态标记为“已驳回”
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModal({ open: false, task: null, opinion: '' })}
                className="text-[#8c8c8c] hover:text-[#262626] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {!rejectModal.isBatch && rejectModal.task && (
                <div className="bg-[#fff1f0]/40 p-3 rounded border border-[#ffa39e]/40 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#8c8c8c]">权责事项:</span>
                    <span className="font-medium text-[#262626]">{rejectModal.task.dutyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8c8c8c]">权责编号:</span>
                    <span className="font-mono text-[#262626]">{rejectModal.task.dutyNo}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[#262626] font-medium mb-1.5">
                  驳回原因 / 改进建议 <span className="text-[#ff4d4f]">*</span>
                </label>
                <textarea
                  value={rejectModal.opinion}
                  onChange={(e) =>
                    setRejectModal({ ...rejectModal, opinion: e.target.value })
                  }
                  rows={3}
                  placeholder="请详细说明驳回原因，指导编制人修改..."
                  className="w-full p-2.5 text-xs rounded border border-[#d9d9d9] focus:outline-none focus:border-[#ff4d4f] text-[#262626]"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    '分支场景审批限额划分不明确，请细化。',
                    '授权使用范围与子公司章程不符，请复核。',
                    '缺少关键会签角色，请重新配置。',
                  ].map((phrase, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setRejectModal({ ...rejectModal, opinion: phrase })}
                      className="px-2 py-0.5 rounded bg-[#f5f5f5] hover:bg-[#fff1f0] text-[#595959] hover:text-[#ff4d4f] text-[11px] cursor-pointer transition-colors"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-[#fafafa] border-t border-[#f0f0f0] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectModal({ open: false, task: null, opinion: '' })}
                className="h-8 px-4 rounded border border-[#d9d9d9] bg-white text-[#595959] text-xs hover:bg-[#f5f7fa] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="h-8 px-4 rounded bg-[#ff4d4f] hover:bg-[#cf1322] text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TRANSFER DIALOG */}
      {transferModal.open && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#e6f7ff] text-[#1890ff] flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#262626]">转办审批任务</h3>
                  <p className="text-xs text-[#8c8c8c]">
                    将当前审批节点的审批权限移交给其他指定审批人
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setTransferModal({
                    open: false,
                    task: null,
                    targetApprover: CANDIDATE_APPROVERS[0].name,
                    targetDept: CANDIDATE_APPROVERS[0].dept,
                    reason: '',
                  })
                }
                className="text-[#8c8c8c] hover:text-[#262626] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {transferModal.task && (
                <div className="bg-[#fafafa] p-3 rounded border border-[#f0f0f0] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#8c8c8c]">当前事项:</span>
                    <span className="font-medium text-[#262626]">{transferModal.task.dutyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8c8c8c]">当前节点:</span>
                    <span className="text-[#1890ff]">{transferModal.task.currentLevelName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8c8c8c]">原审批人:</span>
                    <span className="text-[#595959]">{transferModal.task.currentApprover}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[#262626] font-medium mb-1.5">
                  选择接收审批人 <span className="text-[#ff4d4f]">*</span>
                </label>
                <PersonSelectField
                  value={transferModal.targetApprover}
                  onChange={(val, person) => {
                    setTransferModal({
                      ...transferModal,
                      targetApprover: val,
                      targetDept: person?.deptName || '管理部',
                    });
                  }}
                  modalTitle="选择接收转办审批人"
                  modalDescription="支持手工输入中英文姓名或从组织架构部门选择，选定后将转派该权责审批任务"
                  placeholder="选择或手工输入转办审批人..."
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-[#262626] font-medium mb-1.5">
                  转办原因说明 <span className="text-[#ff4d4f]">*</span>
                </label>
                <textarea
                  value={transferModal.reason}
                  onChange={(e) =>
                    setTransferModal({ ...transferModal, reason: e.target.value })
                  }
                  rows={2}
                  placeholder="请输入转办原因..."
                  className="w-full p-2 text-xs rounded border border-[#d9d9d9] focus:outline-none focus:border-[#1890ff] text-[#262626]"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-[#fafafa] border-t border-[#f0f0f0] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setTransferModal({
                    open: false,
                    task: null,
                    targetApprover: CANDIDATE_APPROVERS[0].name,
                    targetDept: CANDIDATE_APPROVERS[0].dept,
                    reason: '',
                  })
                }
                className="h-8 px-4 rounded border border-[#d9d9d9] bg-white text-[#595959] text-xs hover:bg-[#f5f7fa] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                className="h-8 px-4 rounded bg-[#1890ff] hover:bg-[#40a9ff] text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                确认转办
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DETAIL / MULTI-LEVEL TIMELINE DRAWER */}
      {detailModal.open && detailModal.task && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#f0f0f0] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#1890ff]" />
                <div>
                  <h3 className="text-sm font-semibold text-[#262626]">
                    权责审批详情 · {detailModal.task.dutyName}
                  </h3>
                  <p className="text-xs text-[#8c8c8c]">
                    单号: <span className="font-mono text-[#1890ff]">{detailModal.task.id}</span> |
                    手册: {detailModal.task.manualName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal({ open: false, task: null })}
                className="p-1.5 text-[#8c8c8c] hover:text-[#262626] rounded-md hover:bg-[#f5f5f5] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Basic Information */}
              <div className="bg-[#fafafa] rounded-lg border border-[#f0f0f0] p-4">
                <h4 className="text-xs font-semibold text-[#262626] mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#1890ff]" />
                  <span>权责事项基础信息</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#8c8c8c]">权责编号:</span>{' '}
                    <span className="font-mono font-medium text-[#262626]">
                      {detailModal.task.dutyNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8c8c8c]">权责分类:</span>{' '}
                    <span className="text-[#262626]">{detailModal.task.categoryName}</span>
                  </div>
                  <div>
                    <span className="text-[#8c8c8c]">授权使用范围:</span>{' '}
                    <span className="text-[#262626]">{detailModal.task.scope}</span>
                  </div>
                  <div>
                    <span className="text-[#8c8c8c]">紧急程度:</span>{' '}
                    <span className="font-medium text-[#fa8c16]">{detailModal.task.urgency}</span>
                  </div>
                  <div>
                    <span className="text-[#8c8c8c]">送审人:</span>{' '}
                    <span className="text-[#262626]">{detailModal.task.submitter}</span>
                  </div>
                  <div>
                    <span className="text-[#8c8c8c]">提交时间:</span>{' '}
                    <span className="font-mono text-[#595959]">{detailModal.task.submitTime}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#8c8c8c]">送审说明:</span>{' '}
                    <span className="text-[#595959]">
                      {detailModal.task.remark || '无特别说明'}
                    </span>
                  </div>
                  {detailModal.task.scenarioText && (
                    <div className="col-span-2 mt-1 p-2 rounded bg-white border border-[#e8e8e8]">
                      <span className="text-[#8c8c8c] block mb-1">分支场景规则:</span>
                      <pre className="text-[11px] font-mono text-[#1890ff] whitespace-pre-wrap">
                        {detailModal.task.scenarioText}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Multi-Level Approver Workflow Stepper */}
              <div>
                <h4 className="text-xs font-semibold text-[#262626] mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#52c41a]" />
                    <span>多层级审批流转节点状态</span>
                  </div>
                  <span className="text-[11px] font-normal text-[#8c8c8c]">
                    共 {detailModal.task.levels?.length || 1} 级审批
                  </span>
                </h4>

                <div className="space-y-3">
                  {detailModal.task.levels?.map((lvl, idx) => {
                    const isPassed = lvl.status === 'approved';
                    const isPending = lvl.status === 'pending';
                    const isRejected = lvl.status === 'rejected';

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-lg border transition-all ${
                          isPending
                            ? 'bg-[#f0f7ff] border-[#91d5ff] ring-1 ring-[#1890ff]/20'
                            : isPassed
                            ? 'bg-[#f6ffed] border-[#b7eb8f]'
                            : isRejected
                            ? 'bg-[#fff1f0] border-[#ffa39e]'
                            : 'bg-white border-[#e8e8e8] opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                isPassed
                                  ? 'bg-[#52c41a] text-white'
                                  : isPending
                                  ? 'bg-[#1890ff] text-white animate-pulse'
                                  : isRejected
                                  ? 'bg-[#ff4d4f] text-white'
                                  : 'bg-[#d9d9d9] text-[#595959]'
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-xs text-[#262626] flex items-center gap-1.5">
                                <span>{lvl.levelName}</span>
                                <span className="text-[#8c8c8c] font-normal">
                                  ({lvl.roleName})
                                </span>
                              </div>
                              <div className="text-[11px] text-[#595959] mt-0.5">
                                审批人: <span className="font-medium text-[#262626]">{lvl.approverName}</span> ·{' '}
                                {lvl.deptName}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                              isPassed
                                ? 'bg-white text-[#52c41a] border-[#b7eb8f]'
                                : isPending
                                ? 'bg-white text-[#1890ff] border-[#91d5ff]'
                                : isRejected
                                ? 'bg-white text-[#ff4d4f] border-[#ffa39e]'
                                : 'bg-[#fafafa] text-[#8c8c8c] border-[#d9d9d9]'
                            }`}
                          >
                            {isPassed
                              ? '已通过'
                              : isPending
                              ? '待审批 / 当前处理人'
                              : isRejected
                              ? '已驳回'
                              : '等待上一级通过'}
                          </span>
                        </div>

                        {lvl.opinion && (
                          <div className="mt-2.5 pt-2 border-t border-black/5 text-[11px] text-[#595959] flex items-start gap-1.5">
                            <span className="text-[#8c8c8c] shrink-0">审批批注:</span>
                            <span className="font-medium text-[#262626]">{lvl.opinion}</span>
                            {lvl.operateTime && (
                              <span className="ml-auto text-[#bfbfbf] font-mono text-[10px]">
                                {lvl.operateTime}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Approval History Log */}
              <div>
                <h4 className="text-xs font-semibold text-[#262626] mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#8c8c8c]" />
                  <span>审批流转日志追踪</span>
                </h4>

                <div className="border border-[#f0f0f0] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#fafafa] border-b border-[#f0f0f0] text-[#595959]">
                        <th className="py-2 px-3 w-32 font-medium">处理时间</th>
                        <th className="py-2 px-3 w-24 font-medium">操作人</th>
                        <th className="py-2 px-3 w-28 font-medium">流转节点</th>
                        <th className="py-2 px-3 w-20 font-medium">操作</th>
                        <th className="py-2 px-3 font-medium">意见与批注</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f0]">
                      {detailModal.task.history?.map((h, hIdx) => (
                        <tr key={hIdx} className="hover:bg-[#fafafa]">
                          <td className="py-2 px-3 font-mono text-[11px] text-[#8c8c8c]">
                            {h.time}
                          </td>
                          <td className="py-2 px-3 font-medium text-[#262626]">{h.operator}</td>
                          <td className="py-2 px-3 text-[#595959]">{h.nodeName}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10.5px] font-medium ${
                                h.action === '审核通过'
                                  ? 'bg-[#f6ffed] text-[#52c41a]'
                                  : h.action === '审核驳回'
                                  ? 'bg-[#fff1f0] text-[#ff4d4f]'
                                  : h.action === '转办审批'
                                  ? 'bg-[#e6f7ff] text-[#1890ff]'
                                  : 'bg-[#fafafa] text-[#8c8c8c]'
                              }`}
                            >
                              {h.action}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[#262626]">{h.opinion || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="px-6 py-3.5 bg-[#fafafa] border-t border-[#f0f0f0] flex items-center justify-between shrink-0">
              <span className="text-xs text-[#8c8c8c]">
                当前审核状态:{' '}
                <span className="font-semibold text-[#262626]">{detailModal.task.status}</span>
              </span>

              <div className="flex items-center gap-2">
                {detailModal.task.status !== '已通过' && detailModal.task.status !== '已驳回' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const t = detailModal.task;
                        setApproveModal({
                          open: true,
                          task: t,
                          isBatch: false,
                          opinion: '同意，经核定符合集团授权管控体系规范，准予通过。',
                        });
                      }}
                      className="h-8 px-3.5 rounded bg-[#52c41a] hover:bg-[#73d13d] text-white text-xs font-medium cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>审核通过</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const t = detailModal.task;
                        setRejectModal({
                          open: true,
                          task: t,
                          isBatch: false,
                          opinion: '',
                        });
                      }}
                      className="h-8 px-3.5 rounded bg-[#fff1f0] hover:bg-[#ffccc7] text-[#ff4d4f] border border-[#ffa39e] text-xs font-medium cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>驳回</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setDetailModal({ open: false, task: null })}
                  className="h-8 px-4 rounded border border-[#d9d9d9] bg-white text-[#595959] text-xs hover:bg-[#f5f7fa] cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
