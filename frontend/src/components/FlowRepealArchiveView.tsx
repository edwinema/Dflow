import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Archive,
  RotateCcw,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  FileCheck2,
  Building2,
  ArrowRight,
  ShieldCheck,
  Undo2,
  Eye,
  X,
  Check,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  ExternalLink,
  GitBranch,
  Network,
  Download,
  FileWarning,
} from 'lucide-react';
import { DrawioBridge } from '../utils/drawioBridge';

interface FlowRepealArchiveViewProps {
  currentUser?: any;
  onNavigate?: (path: string, param?: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const FlowRepealArchiveView: React.FC<FlowRepealArchiveViewProps> = ({
  currentUser,
  onNavigate,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'archived' | 'approving' | 'all'>('archived');
  const [repealList, setRepealList] = useState<any[]>([]);
  const [archList, setArchList] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReasonType, setFilterReasonType] = useState('all');

  // Restore Modal State
  const [restoreModal, setRestoreModal] = useState<{
    open: boolean;
    record: any | null;
    targetParentId: string;
    restoreStatus: 'published' | 'draft';
    restoreReason: string;
    submitting: boolean;
  }>({
    open: false,
    record: null,
    targetParentId: 'arch_root',
    restoreStatus: 'published',
    restoreReason: '业务重新启动或优化升级，恢复流程生效执行',
    submitting: false,
  });

  // Archive Confirm Modal (集团流程管理员确认并归档)
  const [archiveConfirmModal, setArchiveConfirmModal] = useState<{
    open: boolean;
    record: any | null;
    opinion: string;
    submitting: boolean;
  }>({
    open: false,
    record: null,
    opinion: '经集团流程管理部最终核验，所有关联业务已顺利割接，准予正式废止并归档入库。',
    submitting: false,
  });

  // Approve Step Modal (中间节点审批通过或驳回)
  const [approveStepModal, setApproveStepModal] = useState<{
    open: boolean;
    record: any | null;
    action: 'pass' | 'reject';
    opinion: string;
    submitting: boolean;
  }>({
    open: false,
    record: null,
    action: 'pass',
    opinion: '',
    submitting: false,
  });

  // Detail Drawer State (查阅档案与审批轨迹)
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    record: any | null;
  }>({
    open: false,
    record: null,
  });

  // Diagram Preview Modal
  const [diagramPreviewModal, setDiagramPreviewModal] = useState<{
    open: boolean;
    flowName: string;
    xml: string;
  }>({
    open: false,
    flowName: '',
    xml: '',
  });

  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const previewBridgeRef = useRef<DrawioBridge | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [repRes, archRes, flowRes] = await Promise.all([
        fetch('/api/flow/repeals').then((r) => r.json()),
        fetch('/api/flow/fulltypes').then((r) => r.json()),
        fetch('/api/flow/fullSimpleModels').then((r) => r.json()),
      ]);
      setRepealList(repRes?.data || []);
      setArchList(archRes?.data || []);
      setFlows(flowRes?.data || []);
    } catch {
      showToast('加载废止归档数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Diagram preview bridge
  useEffect(() => {
    if (!diagramPreviewModal.open || !diagramPreviewModal.xml) return;
    const bridge = new DrawioBridge({
      onReady: () => {
        bridge.loadXml(diagramPreviewModal.xml, diagramPreviewModal.flowName);
      },
    });
    previewBridgeRef.current = bridge;
    if (previewIframeRef.current) {
      bridge.attachIframe(previewIframeRef.current);
      setTimeout(() => {
        bridge.loadXml(diagramPreviewModal.xml, diagramPreviewModal.flowName);
      }, 180);
    }
    return () => {
      bridge.destroy();
      previewBridgeRef.current = null;
    };
  }, [diagramPreviewModal.open, diagramPreviewModal.xml]);

  // Tab Filtering
  const archivedRecords = useMemo(() => {
    return repealList.filter(
      (r) => r.stage === '已废止归档' || r.status === '已废止归档' || r.status === '已废止'
    );
  }, [repealList]);

  const approvingRecords = useMemo(() => {
    return repealList.filter(
      (r) =>
        r.stage === '待部门审批' ||
        r.stage === '待合规复核' ||
        r.stage === '待集团流程管理员确认归档' ||
        r.status === '待审核' ||
        r.status === '待部门审批' ||
        r.status === '待合规复核' ||
        r.status === '待集团流程管理员确认归档'
    );
  }, [repealList]);

  const displayedList = useMemo(() => {
    let base =
      activeTab === 'archived'
        ? archivedRecords
        : activeTab === 'approving'
        ? approvingRecords
        : repealList;

    if (filterReasonType !== 'all') {
      base = base.filter((r) => r.reasonType === filterReasonType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      base = base.filter(
        (r) =>
          (r.flowName && r.flowName.toLowerCase().includes(q)) ||
          (r.flowCode && r.flowCode.toLowerCase().includes(q)) ||
          (r.archiveNo && r.archiveNo.toLowerCase().includes(q)) ||
          (r.applicant && r.applicant.toLowerCase().includes(q)) ||
          (r.archPath && r.archPath.toLowerCase().includes(q))
      );
    }

    return base;
  }, [activeTab, archivedRecords, approvingRecords, repealList, filterReasonType, searchQuery]);

  // 还原流程操作
  const handleConfirmRestore = async () => {
    if (!restoreModal.record) return;
    setRestoreModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await fetch('/api/flow/repeal/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: restoreModal.record.id,
          modelId: restoreModal.record.modelId,
          targetParentId: restoreModal.targetParentId,
          restoreStatus: restoreModal.restoreStatus,
          restoreReason: restoreModal.restoreReason.trim(),
          operator: currentUser?.userName || '集团流程管理员',
        }),
      }).then((r) => r.json());

      if (res.status === 1) {
        showToast(`已成功还原业务流程【${restoreModal.record.flowName}】！`, 'success');
        setRestoreModal((prev) => ({ ...prev, open: false, submitting: false }));
        await loadData();
      } else {
        showToast(res.info || '还原失败', 'error');
        setRestoreModal((prev) => ({ ...prev, submitting: false }));
      }
    } catch {
      showToast('还原流程请求异常', 'error');
      setRestoreModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // 集团流程管理员确认并归档
  const handleConfirmArchive = async () => {
    if (!archiveConfirmModal.record) return;
    setArchiveConfirmModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await fetch('/api/flow/repeal/confirmArchive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: archiveConfirmModal.record.id,
          opinion: archiveConfirmModal.opinion.trim(),
          operator: currentUser?.userName || '集团流程管理员',
        }),
      }).then((r) => r.json());

      if (res.status === 1) {
        showToast(
          `流程【${archiveConfirmModal.record.flowName}】已由集团流程管理员批准并正式归档入库！`,
          'success'
        );
        setArchiveConfirmModal((prev) => ({ ...prev, open: false, submitting: false }));
        await loadData();
        setActiveTab('archived');
      } else {
        showToast(res.info || '确认归档操作失败', 'error');
        setArchiveConfirmModal((prev) => ({ ...prev, submitting: false }));
      }
    } catch {
      showToast('请求异常', 'error');
      setArchiveConfirmModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // 中间节点审批（部门审批 / 合规复核）
  const handleApproveStep = async () => {
    if (!approveStepModal.record) return;
    setApproveStepModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await fetch('/api/flow/repeal/approveStep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: approveStepModal.record.id,
          action: approveStepModal.action,
          opinion: approveStepModal.opinion.trim(),
          operator: currentUser?.userName || '审批人员',
        }),
      }).then((r) => r.json());

      if (res.status === 1) {
        showToast(
          approveStepModal.action === 'pass'
            ? '审批通过，已流转至下一节点！'
            : '已驳回该流程废止申请',
          'success'
        );
        setApproveStepModal((prev) => ({ ...prev, open: false, submitting: false }));
        await loadData();
      } else {
        showToast(res.info || '审批流转失败', 'error');
        setApproveStepModal((prev) => ({ ...prev, submitting: false }));
      }
    } catch {
      showToast('请求异常', 'error');
      setApproveStepModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // 打开流程图预览
  const handleOpenDiagramPreview = (record: any) => {
    const f = flows.find((item) => item.id === record.modelId || item.flowNo === record.flowCode);
    const xml = f?.xml || '';
    setDiagramPreviewModal({
      open: true,
      flowName: record.flowName,
      xml,
    });
  };

  return (
    <div className="h-[calc(100vh-88px)] flex flex-col gap-3 min-h-0 overflow-hidden select-none">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-lg border border-[#ebeef5] p-5 shrink-0 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f97316] to-[#ea580c] text-white flex items-center justify-center shadow-xs">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-bold text-[#1f2733]">废止归档</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5]">
                  流程全生命周期治理 · 终审归档与还原恢复
                </span>
              </div>
              <p className="text-xs text-[#909399] mt-0.5">
                汇集全集团所有建议废止审批流、集团流程管理员确认归档流程档案库，支持全量追溯与一键还原恢复。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={loadData}
              className="h-8 px-3 rounded-lg border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-[#606266] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>刷新档案</span>
            </button>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('/property/overview')}
                className="h-8 px-3.5 rounded-lg bg-[#409eff] hover:bg-[#3390ff] text-white font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>返回流程概览</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher & Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-[#f1f5f9]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('archived')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
                activeTab === 'archived'
                  ? 'bg-[#ea580c] text-white shadow-xs'
                  : 'bg-[#f8fafc] text-[#606266] hover:bg-[#f1f5f9]'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>已废止归档流程</span>
              <span
                className={`px-1.5 py-0.2 rounded-full font-mono text-[11px] ${
                  activeTab === 'archived'
                    ? 'bg-white/25 text-white'
                    : 'bg-[#ffedd5] text-[#ea580c]'
                }`}
              >
                {archivedRecords.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('approving')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
                activeTab === 'approving'
                  ? 'bg-[#ea580c] text-white shadow-xs'
                  : 'bg-[#f8fafc] text-[#606266] hover:bg-[#f1f5f9]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>废止审批流 (待办与进度)</span>
              <span
                className={`px-1.5 py-0.2 rounded-full font-mono text-[11px] ${
                  activeTab === 'approving'
                    ? 'bg-white/25 text-white'
                    : 'bg-[#e0f2fe] text-[#0284c7]'
                }`}
              >
                {approvingRecords.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-[#ea580c] text-white shadow-xs'
                  : 'bg-[#f8fafc] text-[#606266] hover:bg-[#f1f5f9]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>全部废止记录台账</span>
              <span
                className={`px-1.5 py-0.2 rounded-full font-mono text-[11px] ${
                  activeTab === 'all' ? 'bg-white/25 text-white' : 'bg-[#e2e8f0] text-[#64748b]'
                }`}
              >
                {repealList.length}
              </span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索流程名称 / 编号 / 凭证号..."
                className="w-56 h-8 pl-8 pr-2.5 rounded-lg border border-[#dcdfe6] focus:border-[#ea580c] text-xs outline-none bg-[#fafbfc]"
              />
              <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2.5 top-2.5" />
            </div>

            <select
              value={filterReasonType}
              onChange={(e) => setFilterReasonType(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-[#dcdfe6] bg-white text-xs outline-none focus:border-[#ea580c] cursor-pointer"
            >
              <option value="all">全部废止原因分类</option>
              <option value="业务模式变革调整">业务模式变革调整</option>
              <option value="业务流程合并升级">业务流程合并升级</option>
              <option value="组织架构优化变更">组织架构优化变更</option>
              <option value="业务关停下线">业务关停下线</option>
              <option value="合规标准迭代升级">合规标准迭代升级</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 bg-white rounded-lg border border-[#ebeef5] flex flex-col overflow-hidden min-h-0 shadow-2xs">
        <div className="flex-1 overflow-y-auto">
          {displayedList.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f8fafc] text-[#cbd5e1] flex items-center justify-center mx-auto">
                <Archive className="w-6 h-6" />
              </div>
              <div className="text-xs font-medium text-[#606266]">
                {activeTab === 'archived'
                  ? '暂无已废止归档的业务流程'
                  : activeTab === 'approving'
                  ? '暂无处于审批流中的废止任务'
                  : '未检索到符合条件的废止记录'}
              </div>
              <p className="text-[11px] text-[#909399]">
                您可在「流程概览」中点击流程卡片右上角「建议废止」发起新的废止审批申请
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#ebeef5] bg-[#fafafa] text-[#606266] font-semibold sticky top-0 z-10">
                  <th className="py-3 px-3.5 w-14 text-center">序号</th>
                  <th className="py-3 px-3.5 w-36">流程编号</th>
                  <th className="py-3 px-3.5">流程名称</th>
                  <th className="py-3 px-3.5 w-52">原所属架构全路径</th>
                  <th className="py-3 px-3.5 w-32">废止原因类型</th>
                  <th className="py-3 px-3.5 w-36">当前状态 / 审批节点</th>
                  <th className="py-3 px-3.5 w-36">
                    {activeTab === 'archived' ? '归档确认人 / 时间' : '申请人 / 时间'}
                  </th>
                  <th className="py-3 px-3.5 w-44 text-right pr-4">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebeef5]">
                {displayedList.map((rec, idx) => {
                  const isArchived =
                    rec.stage === '已废止归档' ||
                    rec.status === '已废止归档' ||
                    rec.status === '已废止';
                  const isPendingGroupAdmin =
                    rec.stage === '待集团流程管理员确认归档' ||
                    rec.status === '待集团流程管理员确认归档';
                  const isRestored = rec.stage === '已还原' || rec.status === '已还原';

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-[#f8fafc] transition-colors group cursor-default"
                    >
                      <td className="py-3 px-3.5 text-center font-mono-tabular text-[#909399]">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3.5 font-mono-tabular text-[#1f2733] font-medium">
                        <span className="px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#475569] text-[11px]">
                          {rec.flowCode || 'FLOW-N/A'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1f2733] group-hover:text-[#ea580c] transition-colors">
                            {rec.flowName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
                            {rec.flowLevel || 'L3'}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-[#f4f4f5] text-[#606266]">
                            {rec.versionNo || 'V1'}
                          </span>
                        </div>
                        {rec.archiveNo && (
                          <div className="text-[10.5px] font-mono text-[#909399] mt-0.5 flex items-center gap-1">
                            <span>归档档案号:</span>
                            <span className="text-[#ea580c] font-semibold">{rec.archiveNo}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-[#606266] text-[11.5px] leading-snug">
                        <span className="line-clamp-2" title={rec.archPath}>
                          {rec.archPath || '企业流程架构全景'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5]">
                          {rec.reasonType || '业务模式变革'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5">
                        {isArchived ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
                            <CheckCircle2 className="w-3 h-3" />
                            已废止归档
                          </span>
                        ) : isRestored ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#ecfeff] text-[#0891b2] border border-[#a5f3fc]">
                            <Undo2 className="w-3 h-3" />
                            已还原运行
                          </span>
                        ) : isPendingGroupAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5] animate-pulse">
                            <Clock className="w-3 h-3" />
                            待集团管理员确认
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
                            <Clock className="w-3 h-3" />
                            {rec.stage || rec.status || '审批流转中'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-[#606266]">
                        <div className="font-medium text-[#1f2733] text-xs">
                          {isArchived ? rec.archiveUser || '集团流程管理员' : rec.applicant || '流程管理员'}
                        </div>
                        <div className="text-[10.5px] font-mono-tabular text-[#909399]">
                          {isArchived ? rec.archiveTime : rec.applyTime}
                        </div>
                      </td>

                      {/* Operations */}
                      <td className="py-3 px-3.5 text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* 核心功能：还原已废止流程 */}
                          {isArchived && (
                            <button
                              type="button"
                              onClick={() =>
                                setRestoreModal({
                                  open: true,
                                  record: rec,
                                  targetParentId: rec.archId || 'arch_root',
                                  restoreStatus: 'published',
                                  restoreReason: '业务重新启动或优化升级，恢复流程生效执行',
                                  submitting: false,
                                })
                              }
                              className="px-2.5 py-1 rounded bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold cursor-pointer shadow-2xs transition-colors flex items-center gap-1"
                              title="将已废止流程还原回架构并恢复展示"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              <span>还原流程</span>
                            </button>
                          )}

                          {/* 待集团流程管理员确认归档 重点审核按钮 */}
                          {isPendingGroupAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                setArchiveConfirmModal({
                                  open: true,
                                  record: rec,
                                  opinion:
                                    '经集团流程管理部最终核验，所有关联业务已顺利割接，准予正式废止并归档入库。',
                                  submitting: false,
                                })
                              }
                              className="px-2.5 py-1 rounded bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                              title="集团流程管理员确认并归档"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              <span>确认并归档</span>
                            </button>
                          )}

                          {/* 中间待审批节点处理按钮 */}
                          {!isArchived && !isPendingGroupAdmin && !isRestored && (
                            <button
                              type="button"
                              onClick={() =>
                                setApproveStepModal({
                                  open: true,
                                  record: rec,
                                  action: 'pass',
                                  opinion: '同意流程废止申请，业务衔接方案合理。',
                                  submitting: false,
                                })
                              }
                              className="px-2 py-1 rounded border border-[#bfdbfe] bg-[#eff6ff] hover:bg-[#2563eb] hover:text-white text-[#2563eb] text-xs font-medium cursor-pointer transition-colors"
                            >
                              <span>推进审批</span>
                            </button>
                          )}

                          {/* 查阅档案详情与审批轨迹 */}
                          <button
                            type="button"
                            onClick={() => setDetailModal({ open: true, record: rec })}
                            className="px-2 py-1 rounded border border-[#dcdfe6] bg-white hover:border-[#ea580c] hover:text-[#ea580c] text-[#606266] text-xs cursor-pointer transition-colors"
                          >
                            <span>查阅档案</span>
                          </button>

                          {/* 预览流程图 */}
                          <button
                            type="button"
                            onClick={() => handleOpenDiagramPreview(rec)}
                            className="p-1 rounded text-[#909399] hover:text-[#409eff] hover:bg-[#f1f5f9] cursor-pointer"
                            title="预览流程图"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Statistics */}
        <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between text-xs text-[#909399]">
          <div className="flex items-center gap-4">
            <span>
              已归档入库：<strong className="text-[#ea580c]">{archivedRecords.length}</strong> 个
            </span>
            <span>•</span>
            <span>
              审批流转中：<strong className="text-[#0284c7]">{approvingRecords.length}</strong> 个
            </span>
            <span>•</span>
            <span>共计 {repealList.length} 条记录</span>
          </div>
          <span className="text-[11px] text-[#909399]">
            支持对已废止流程执行「还原流程」，还原后即刻重新在流程概览与流程设计中呈现
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 还原流程弹窗 (Restore Modal)                                    */}
      {/* ============================================================== */}
      {restoreModal.open && restoreModal.record && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-[560px] max-w-[95vw] shadow-2xl border border-[#ebeef5] overflow-hidden flex flex-col animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-[#ebeef5] flex items-center justify-between bg-gradient-to-r from-[#f0fdf4] to-[#dcfce7] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#16a34a] text-white flex items-center justify-center shadow-xs">
                  <Undo2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#166534]">还原业务流程</h3>
                  <p className="text-[11px] text-[#15803d]">
                    将已废止归档的流程重新恢复至目标流程架构中
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestoreModal((prev) => ({ ...prev, open: false }))}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg space-y-1.5">
                <div className="font-bold text-[#166534] text-xs flex items-center gap-2">
                  <span>拟还原流程：</span>
                  <span className="font-mono text-[#15803d]">
                    [{restoreModal.record.flowCode}] {restoreModal.record.flowName}
                  </span>
                </div>
                <div className="text-[11px] text-[#166534]/90 flex items-center gap-3">
                  <span>版本：{restoreModal.record.versionNo || 'V1'}</span>
                  <span>•</span>
                  <span>原归档号：{restoreModal.record.archiveNo || 'ARC-N/A'}</span>
                  <span>•</span>
                  <span>归档时间：{restoreModal.record.archiveTime}</span>
                </div>
              </div>

              <div>
                <label className="block text-[#606266] font-medium mb-1.5">
                  恢复目标流程架构 <span className="text-[#f56c6c]">*</span>
                </label>
                <select
                  value={restoreModal.targetParentId}
                  onChange={(e) =>
                    setRestoreModal((prev) => ({ ...prev, targetParentId: e.target.value }))
                  }
                  className="w-full h-8 px-2.5 rounded-lg border border-[#dcdfe6] bg-white text-xs outline-none focus:border-[#16a34a] cursor-pointer"
                >
                  {archList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.level || 'L1'} · {a.label} ({a.archNo || a.id})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#909399] mt-1">
                  默认选中原所属架构，亦可自由选择重新归纳到指定的新业务架构节点下。
                </p>
              </div>

              <div>
                <label className="block text-[#606266] font-medium mb-1.5">还原后状态</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    onClick={() =>
                      setRestoreModal((prev) => ({ ...prev, restoreStatus: 'published' }))
                    }
                    className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${
                      restoreModal.restoreStatus === 'published'
                        ? 'border-[#16a34a] bg-[#f0fdf4] text-[#166534] font-bold'
                        : 'border-[#dcdfe6] bg-white text-[#606266]'
                    }`}
                  >
                    <span>正式发布生效 (直接在流程概览可见)</span>
                    {restoreModal.restoreStatus === 'published' && (
                      <Check className="w-4 h-4 text-[#16a34a]" />
                    )}
                  </label>
                  <label
                    onClick={() => setRestoreModal((prev) => ({ ...prev, restoreStatus: 'draft' }))}
                    className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${
                      restoreModal.restoreStatus === 'draft'
                        ? 'border-[#16a34a] bg-[#f0fdf4] text-[#166534] font-bold'
                        : 'border-[#dcdfe6] bg-white text-[#606266]'
                    }`}
                  >
                    <span>设计草稿状态 (可在流程设计中继续编排)</span>
                    {restoreModal.restoreStatus === 'draft' && (
                      <Check className="w-4 h-4 text-[#16a34a]" />
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[#606266] font-medium mb-1.5">
                  还原理由说明 <span className="text-[#f56c6c]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={restoreModal.restoreReason}
                  onChange={(e) =>
                    setRestoreModal((prev) => ({ ...prev, restoreReason: e.target.value }))
                  }
                  placeholder="请输入恢复还原该业务流程的原因..."
                  className="w-full p-2.5 rounded-lg border border-[#dcdfe6] focus:border-[#16a34a] outline-none text-xs"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setRestoreModal((prev) => ({ ...prev, open: false }))}
                className="h-8 px-4 rounded-lg border border-[#dcdfe6] bg-white text-[#606266] hover:bg-[#f5f7fa] cursor-pointer text-xs"
              >
                取消
              </button>
              <button
                type="button"
                disabled={restoreModal.submitting}
                onClick={handleConfirmRestore}
                className="h-8 px-5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-white font-medium cursor-pointer shadow-xs text-xs flex items-center gap-1.5"
              >
                {restoreModal.submitting ? '正在还原...' : '确认还原流程'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 集团流程管理员确认并归档弹窗 (Archive Confirm Modal)              */}
      {/* ============================================================== */}
      {archiveConfirmModal.open && archiveConfirmModal.record && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-[580px] max-w-[95vw] shadow-2xl border border-[#ebeef5] overflow-hidden flex flex-col animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-[#ebeef5] flex items-center justify-between bg-gradient-to-r from-[#fff7ed] to-[#ffedd5] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ea580c] text-white flex items-center justify-center shadow-xs">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#9a3412]">集团流程管理员确认并归档</h3>
                  <p className="text-[11px] text-[#c2410c]">
                    该任务已由各业务部门审核批准，现由集团流程管理员进行最终确认并入库归档
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setArchiveConfirmModal((prev) => ({ ...prev, open: false }))}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-[#fff7ed] border border-[#ffedd5] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#9a3412] text-xs">
                    {archiveConfirmModal.record.flowName}
                  </span>
                  <span className="font-mono text-[#ea580c] font-semibold text-xs">
                    {archiveConfirmModal.record.flowCode}
                  </span>
                </div>
                <div className="text-[11.5px] text-[#9a3412]/90 leading-relaxed">
                  <strong>废止原因：</strong>
                  {archiveConfirmModal.record.reason}
                </div>
                {archiveConfirmModal.record.replaceFlowName && (
                  <div className="text-[11px] text-[#9a3412]/80">
                    <strong>替代业务流程：</strong>
                    {archiveConfirmModal.record.replaceFlowName}
                  </div>
                )}
              </div>

              {/* Approval Track Mini Preview */}
              <div>
                <label className="block text-[#606266] font-medium mb-2">前序多级审批记录</label>
                <div className="space-y-2 bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
                  {(archiveConfirmModal.record.approvalLogs || []).map((step: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between text-[11px] gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#e2e8f0] text-[#475569] font-mono text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-[#1f2733]">{step.stepName}</span>
                        <span className="text-[#909399]">({step.operator})</span>
                      </div>
                      <span className="text-[#16a34a] font-medium">{step.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#606266] font-medium mb-1.5">
                  集团流程管理员归档核准意见 <span className="text-[#f56c6c]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={archiveConfirmModal.opinion}
                  onChange={(e) =>
                    setArchiveConfirmModal((prev) => ({ ...prev, opinion: e.target.value }))
                  }
                  className="w-full p-2.5 rounded-lg border border-[#dcdfe6] focus:border-[#ea580c] outline-none text-xs"
                />
              </div>

              <div className="p-3 bg-[#f8fafc] rounded border border-[#e2e8f0] text-[11px] text-[#64748b] leading-relaxed">
                确认归档后，此流程将正式从运行资产列表中退出并移入「已废止归档」库，生成正式归档凭证号；后续支持按需「还原流程」。
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setArchiveConfirmModal((prev) => ({ ...prev, open: false }))}
                className="h-8 px-4 rounded-lg border border-[#dcdfe6] bg-white text-[#606266] hover:bg-[#f5f7fa] cursor-pointer text-xs"
              >
                取消
              </button>
              <button
                type="button"
                disabled={archiveConfirmModal.submitting}
                onClick={handleConfirmArchive}
                className="h-8 px-5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-50 text-white font-bold cursor-pointer shadow-xs text-xs flex items-center gap-1.5"
              >
                {archiveConfirmModal.submitting ? '归档处理中...' : '确认并正式归档入库'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 审批推进与驳回弹窗 (Approve Step Modal)                           */}
      {/* ============================================================== */}
      {approveStepModal.open && approveStepModal.record && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-[500px] max-w-[95vw] shadow-2xl border border-[#ebeef5] overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafafa]">
              <span className="text-sm font-bold text-[#1f2733]">
                {approveStepModal.action === 'pass' ? '审核批准废止申请' : '驳回废止申请'}
              </span>
              <button
                type="button"
                onClick={() => setApproveStepModal((prev) => ({ ...prev, open: false }))}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="text-xs text-[#606266]">
                针对【<strong>{approveStepModal.record.flowName}</strong>】的建议废止申请进行处理：
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setApproveStepModal((prev) => ({ ...prev, action: 'pass' }))}
                  className={`flex-1 py-2 rounded-lg border text-center font-bold cursor-pointer ${
                    approveStepModal.action === 'pass'
                      ? 'border-[#409eff] bg-[#ecf5ff] text-[#409eff]'
                      : 'border-[#dcdfe6] text-[#606266]'
                  }`}
                >
                  审核通过并流转下一节点
                </button>
                <button
                  type="button"
                  onClick={() => setApproveStepModal((prev) => ({ ...prev, action: 'reject' }))}
                  className={`flex-1 py-2 rounded-lg border text-center font-bold cursor-pointer ${
                    approveStepModal.action === 'reject'
                      ? 'border-[#f56c6c] bg-[#fef0f0] text-[#f56c6c]'
                      : 'border-[#dcdfe6] text-[#606266]'
                  }`}
                >
                  驳回此申请
                </button>
              </div>

              <div>
                <label className="block text-[#606266] font-medium mb-1">审批处理意见</label>
                <textarea
                  rows={3}
                  value={approveStepModal.opinion}
                  onChange={(e) =>
                    setApproveStepModal((prev) => ({ ...prev, opinion: e.target.value }))
                  }
                  placeholder="请输入您的审批意见..."
                  className="w-full p-2.5 rounded-lg border border-[#dcdfe6] focus:border-[#409eff] outline-none"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setApproveStepModal((prev) => ({ ...prev, open: false }))}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266]"
              >
                取消
              </button>
              <button
                type="button"
                disabled={approveStepModal.submitting}
                onClick={handleApproveStep}
                className="h-8 px-4 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium"
              >
                {approveStepModal.submitting ? '提交中...' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 档案与审批链轨迹查阅抽屉 (Detail Modal)                         */}
      {/* ============================================================== */}
      {detailModal.open && detailModal.record && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-[700px] max-w-[95vw] max-h-[90vh] shadow-2xl border border-[#ebeef5] overflow-hidden flex flex-col animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafafa] shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ea580c]" />
                <span className="text-sm font-bold text-[#1f2733]">
                  废止业务流程档案与全流程审计链
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal({ open: false, record: null })}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                <div>
                  <span className="text-[#909399]">流程名称：</span>
                  <span className="font-bold text-[#1f2733]">{detailModal.record.flowName}</span>
                </div>
                <div>
                  <span className="text-[#909399]">流程编号：</span>
                  <span className="font-mono text-[#1f2733] font-semibold">
                    {detailModal.record.flowCode}
                  </span>
                </div>
                <div>
                  <span className="text-[#909399]">归属架构：</span>
                  <span className="text-[#1f2733]">{detailModal.record.archPath}</span>
                </div>
                <div>
                  <span className="text-[#909399]">归档档案号：</span>
                  <span className="font-mono text-[#ea580c] font-bold">
                    {detailModal.record.archiveNo || '归档处理中'}
                  </span>
                </div>
                <div>
                  <span className="text-[#909399]">废止原因类型：</span>
                  <span className="font-medium text-[#1f2733]">
                    {detailModal.record.reasonType}
                  </span>
                </div>
                <div>
                  <span className="text-[#909399]">当前状态：</span>
                  <span className="font-bold text-[#ea580c]">
                    {detailModal.record.stage || detailModal.record.status}
                  </span>
                </div>
              </div>

              {/* Reason & Replacement */}
              <div className="space-y-2">
                <div className="font-bold text-[#1f2733] text-xs">废止详细理由与背景</div>
                <div className="p-3 rounded-lg bg-[#fafbfc] border border-[#e2e8f0] text-[#334155] leading-relaxed">
                  {detailModal.record.reason}
                </div>
              </div>

              {detailModal.record.replaceFlowName && (
                <div className="space-y-1">
                  <span className="text-[#909399] font-medium">替代业务衔接流程：</span>
                  <div className="font-bold text-[#0284c7]">
                    {detailModal.record.replaceFlowName}
                  </div>
                </div>
              )}

              {/* Approval Timeline */}
              <div className="space-y-3 pt-2">
                <div className="font-bold text-[#1f2733] text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
                  <span>审批与归档审计链条</span>
                </div>

                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e2e8f0]">
                  {(detailModal.record.approvalLogs || []).map((step: any, idx: number) => (
                    <div key={idx} className="relative pl-8 space-y-1">
                      <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#ea580c]" />
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1f2733]">{step.stepName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#f1f5f9] text-[#64748b]">
                            {step.role}
                          </span>
                        </div>
                        <span className="text-[#16a34a] font-semibold text-[11px]">
                          {step.action}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#909399] flex items-center gap-3">
                        <span>操作人：{step.operator}</span>
                        {step.time && <span>• 时间：{step.time}</span>}
                      </div>
                      {step.opinion && (
                        <div className="p-2 bg-[#f8fafc] rounded border border-[#e2e8f0] text-[11px] text-[#475569] mt-1">
                          意见：{step.opinion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModal({ open: false, record: null })}
                className="h-8 px-4 rounded-lg bg-[#409eff] text-white text-xs font-medium cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 流程图预览弹窗 (Diagram Preview Modal)                          */}
      {/* ============================================================== */}
      {diagramPreviewModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-[92vw] h-[85vh] shadow-2xl border border-[#ebeef5] overflow-hidden flex flex-col animate-in fade-in duration-200">
            <div className="px-6 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafafa] shrink-0">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#409eff]" />
                <span className="text-sm font-bold text-[#1f2733]">
                  流程图预览：{diagramPreviewModal.flowName}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#f4f4f5] text-[#909399]">
                  只读预览模式
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDiagramPreviewModal({ open: false, flowName: '', xml: '' })}
                className="text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 bg-[#f5f7fa] relative">
              <iframe
                ref={previewIframeRef}
                src="/drawio/index.html?embed=1&ui=min&spin=1&proto=json&configure=1&noExitBtn=1&draft=0"
                className="w-full h-full border-none"
                title="流程图只读预览"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
