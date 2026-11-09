import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  RotateCcw,
  Plus,
  Eye,
  Edit3,
  Trash2,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  X,
  UserCheck,
  ShieldCheck,
  PlayCircle,
  Check,
  AlertCircle,
  ChevronDown,
  Layers,
  Calendar,
  User,
  ListTodo,
  ExternalLink,
  Save,
  Share2,
} from 'lucide-react';
import { EnterpriseDataGrid, DataGridColumn } from './EnterpriseDataGrid';
import { PersonSelectField } from './PersonSelectField';
import { safeFetchJson } from '../utils/safeFetch';

export interface RelatedFileItem {
  id: string;
  name: string;
  type?: string;
}

export interface ProcessTaskStep {
  id: string;
  seq: number;
  stepName: string;
  roleName?: string;
  nodeType?: 'serial' | 'judge';
  desc?: string;
  outDeliverable?: string;
  status: '待办' | '进行中' | '已办';
  completionNote: string;
  relatedFiles: RelatedFileItem[];
  startTime: string;
  endTime: string;
}

export interface ProcessTaskRecord {
  id: string;
  taskName: string;
  status: '待处理' | '进行中' | '已办结';
  assignee: string;
  assigneeDept?: string;
  flowId: number | string;
  modelId: string;
  flowCode: string;
  flowName: string;
  flowFullTitle?: string;
  archPath: string;
  versionNo: string;
  flowPurpose: string;
  taskDesc: string;
  creator: string;
  createTime: string;
  submitTime: string;
  steps: ProcessTaskStep[];
  execSystem?: string;
  periodStart?: string;
  periodEnd?: string;
  progressStatus?: string;
  reportFile?: { name: string; size: string; type?: string; url?: string } | null;
  processRemark?: string;
}

export interface SystemUserItem {
  id: string;
  name: string;
  empNo: string;
  deptName: string;
  roleName: string;
}

interface FlowProcessViewProps {
  subPath?: string;
  onNavigate: (path: string, flowId?: string) => void;
  onEnterDesigner?: (flowId: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const FlowProcessView: React.FC<FlowProcessViewProps> = ({
  subPath = '/execute/process',
  onNavigate,
  onEnterDesigner,
  showToast,
}) => {
  const [tasks, setTasks] = useState<ProcessTaskRecord[]>([]);
  const [users, setUsers] = useState<SystemUserItem[]>([]);
  const [archTypes, setArchTypes] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [dictBundle, setDictBundle] = useState<any>({});
  const [, setDuties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCreator, setFilterCreator] = useState<string>('');
  const [filterFlowCode, setFilterFlowCode] = useState<string>('');
  const [filterFlowName, setFilterFlowName] = useState<string>('');
  const [filterTaskName, setFilterTaskName] = useState<string>('');

  const [appliedFilters, setAppliedFilters] = useState({
    status: '',
    creator: '',
    flowCode: '',
    flowName: '',
    taskName: '',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpPageInput, setJumpPageInput] = useState('1');

  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<'list' | 'update' | 'detail'>('list');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Step item selection inside execution view
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // Task selection in table
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Assign modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignMode, setAssignMode] = useState<'create' | 'reassign' | 'batch'>('create');
  const [reassignTargetTaskId, setReassignTargetTaskId] = useState<string | null>(null);
  const [assignFlowId, setAssignFlowId] = useState<string>('');
  const [assignTaskName, setAssignTaskName] = useState<string>('');
  const [assignTaskDesc, setAssignTaskDesc] = useState<string>('');
  const [assignUser, setAssignUser] = useState<string>('');
  const [flowDropdownOpen, setFlowDropdownOpen] = useState(false);
  const [flowSearchTerm, setFlowSearchTerm] = useState('');
  const [expandedArchIds, setExpandedArchIds] = useState<string[]>([
    'arch_root',
    'arch_ipd',
    'arch_ltc',
    'arch_req',
  ]);
  const flowSelectorRef = useRef<HTMLDivElement>(null);

  // Step editor state in execution mode
  const [editingStep, setEditingStep] = useState<ProcessTaskStep | null>(null);
  const [stepStatusDraft, setStepStatusDraft] = useState<'待办' | '进行中' | '已办'>('进行中');
  const [stepNoteDraft, setStepNoteDraft] = useState<string>('');
  const [stepFilesDraft, setStepFilesDraft] = useState<RelatedFileItem[]>([]);
  const [stepStartDraft, setStepStartDraft] = useState<string>('');
  const [stepEndDraft, setStepEndDraft] = useState<string>('');
  const [customFileNameInput, setCustomFileNameInput] = useState<string>('');

  // Delete modals
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<ProcessTaskRecord | null>(null);
  const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false);

  // Sorting state (controls column sorting across all tasks)
  const [sortField, setSortField] = useState<string | null>('createTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>('desc');

  // Immediate Process Modal state (matches design mockup image_1f9f6afa.png)
  const [immediateModalOpen, setImmediateModalOpen] = useState(false);
  const [handlingTask, setHandlingTask] = useState<ProcessTaskRecord | null>(null);
  const [execSystem, setExecSystem] = useState<string>('');
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [processProgress, setProcessProgress] = useState<string>('处理完成');
  const [reportFile, setReportFile] = useState<{ name: string; size: string; type?: string } | null>(null);
  const [processRemark, setProcessRemark] = useState<string>('');
  const [isSubmittingProcess, setIsSubmittingProcess] = useState(false);
  const reportFileInputRef = useRef<HTMLInputElement>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [tasksRes, archRes, flowsRes, dictRes, dutiesRes] = await Promise.all([
        safeFetchJson('/api/execute/tasks', undefined, { data: [], users: [] }),
        safeFetchJson('/api/flow/fulltypes', undefined, { data: [] }),
        safeFetchJson('/api/flow/fullSimpleModels', undefined, { data: [] }),
        safeFetchJson('/api/dict/bundle', undefined, { data: {} }),
        safeFetchJson('/api/flowdoc/duties', undefined, { data: [] }),
      ]);
      if (tasksRes?.data) setTasks(tasksRes.data);
      if (tasksRes?.users) setUsers(tasksRes.users);
      if (archRes?.data) setArchTypes(archRes.data);
      if (flowsRes?.data) setFlows(flowsRes.data);
      if (dictRes?.data) setDictBundle(dictRes.data);
      if (dutiesRes && Array.isArray(dutiesRes.data)) setDuties(dutiesRes.data);
    } catch {
      showToast('加载流程运行数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [subPath]);

  useEffect(() => {
    setViewMode('list');
    if (subPath === '/task/todolist') {
      setFilterStatus('待处理');
      setAppliedFilters((prev) => ({ ...prev, status: '待处理' }));
    } else if (subPath === '/task/finishlist') {
      setFilterStatus('已办结');
      setAppliedFilters((prev) => ({ ...prev, status: '已办结' }));
    } else {
      setFilterStatus('');
      setAppliedFilters({ status: '', creator: '', flowCode: '', flowName: '', taskName: '' });
    }
  }, [subPath]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (flowSelectorRef.current && !flowSelectorRef.current.contains(e.target as Node)) {
        setFlowDropdownOpen(false);
      }
    };
    if (flowDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [flowDropdownOpen]);

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId) || null,
    [tasks, activeTaskId]
  );

  // Sync selectedStepId when activeTask changes
  useEffect(() => {
    if (activeTask && activeTask.steps && activeTask.steps.length > 0) {
      const activeStep = activeTask.steps.find((s) => s.status === '进行中') || activeTask.steps[0];
      setSelectedStepId(activeStep.id);
      handleOpenStepEditor(activeStep);
    } else {
      setSelectedStepId(null);
      setEditingStep(null);
    }
  }, [activeTaskId]);

  const selectedAssignFlow = useMemo(
    () => flows.find((f) => f.id === assignFlowId) || null,
    [flows, assignFlowId]
  );

  const resolveArchBreadcrumb = (parentId: string): string => {
    const parts: string[] = [];
    let cur = archTypes.find((a) => a.id === parentId);
    let guard = 0;
    while (cur && guard < 10) {
      parts.unshift(cur.label);
      if (!cur.parentId) break;
      cur = archTypes.find((a) => a.id === cur.parentId);
      guard++;
    }
    return parts.join(' > ') || '顶级架构';
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (appliedFilters.status && t.status !== appliedFilters.status) return false;
      if (appliedFilters.creator && t.creator !== appliedFilters.creator) return false;
      if (
        appliedFilters.flowCode.trim() &&
        !String(t.flowCode || '')
          .toLowerCase()
          .includes(appliedFilters.flowCode.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilters.flowName.trim() &&
        !String(t.flowName || '')
          .toLowerCase()
          .includes(appliedFilters.flowName.trim().toLowerCase()) &&
        !String(t.flowFullTitle || '')
          .toLowerCase()
          .includes(appliedFilters.flowName.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilters.taskName.trim() &&
        !String(t.taskName || '')
          .toLowerCase()
          .includes(appliedFilters.taskName.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [tasks, appliedFilters]);

  const sortedFilteredTasks = useMemo(() => {
    const list = [...filteredTasks];
    if (!sortField || !sortOrder) return list;
    return list.sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === 'progress') {
        const doneA = (a.steps || []).filter((s: any) => s.status === '已办').length;
        const doneB = (b.steps || []).filter((s: any) => s.status === '已办').length;
        valA = doneA;
        valB = doneB;
      }
      if (valA === valB) return 0;
      if (valA === null || valA === undefined || valA === '') return 1;
      if (valB === null || valB === undefined || valB === '') return -1;
      let comp = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comp = valA - valB;
      } else {
        comp = String(valA).localeCompare(String(valB), 'zh-CN');
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredTasks, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedFilteredTasks.length / pageSize));
  const pagedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedFilteredTasks.slice(start, start + pageSize);
  }, [sortedFilteredTasks, currentPage, pageSize]);

  // Handle task selection toggling
  const handleToggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isAllCurrentSelected =
    pagedTasks.length > 0 && pagedTasks.every((t) => selectedTaskIds.includes(t.id));
  const isSomeCurrentSelected =
    pagedTasks.some((t) => selectedTaskIds.includes(t.id)) && !isAllCurrentSelected;

  const handleToggleSelectAll = () => {
    const pageIds = pagedTasks.map((t) => t.id);
    if (isAllCurrentSelected) {
      setSelectedTaskIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const selectedTasks = useMemo(
    () => tasks.filter((t) => selectedTaskIds.includes(t.id)),
    [tasks, selectedTaskIds]
  );

  const handleSearch = () => {
    setAppliedFilters({
      status: filterStatus,
      creator: filterCreator,
      flowCode: filterFlowCode,
      flowName: filterFlowName,
      taskName: filterTaskName,
    });
    setCurrentPage(1);
    setJumpPageInput('1');
  };

  const handleReset = () => {
    setFilterStatus('');
    setFilterCreator('');
    setFilterFlowCode('');
    setFilterFlowName('');
    setFilterTaskName('');
    setAppliedFilters({
      status: '',
      creator: '',
      flowCode: '',
      flowName: '',
      taskName: '',
    });
    setCurrentPage(1);
    setJumpPageInput('1');
  };

  const handleOpenCreateAssign = () => {
    setAssignMode('create');
    setReassignTargetTaskId(null);
    setAssignFlowId(flows[0]?.id || '');
    setAssignTaskName(flows[0] ? `${flows[0].label}-工单任务` : '');
    setAssignTaskDesc('');
    setAssignUser('张三');
    setFlowSearchTerm('');
    setFlowDropdownOpen(false);
    setAssignModalOpen(true);
  };

  const handleOpenReassign = (task: ProcessTaskRecord) => {
    setAssignMode('reassign');
    setReassignTargetTaskId(task.id);
    setAssignFlowId(task.modelId || flows[0]?.id || '');
    setAssignTaskName(task.taskName);
    setAssignTaskDesc(task.taskDesc || '');
    setAssignUser(task.assignee || '张三');
    setFlowSearchTerm('');
    setFlowDropdownOpen(false);
    setAssignModalOpen(true);
  };

  const handleOpenAssignWorkflow = (explicitTask?: ProcessTaskRecord) => {
    if (explicitTask) {
      handleOpenReassign(explicitTask);
      return;
    }
    if (selectedTaskIds.length === 1) {
      const target = tasks.find((t) => t.id === selectedTaskIds[0]);
      if (target) {
        handleOpenReassign(target);
        return;
      }
    } else if (selectedTaskIds.length > 1) {
      setAssignMode('batch');
      setReassignTargetTaskId(null);
      setAssignFlowId('');
      setAssignTaskName(`批量指派 (${selectedTaskIds.length} 项任务)`);
      setAssignTaskDesc('');
      setAssignUser(selectedTasks[0]?.assignee || '张三');
      setFlowSearchTerm('');
      setFlowDropdownOpen(false);
      setAssignModalOpen(true);
      return;
    }
    handleOpenCreateAssign();
  };

  const handleSubmitAssign = async () => {
    if (assignMode === 'batch') {
      if (!assignUser.trim()) {
        showToast('请选择指派经办人', 'warning');
        return;
      }
      try {
        const res = await fetch('/api/execute/tasks/batch-assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskIds: selectedTaskIds,
            assignee: assignUser.trim(),
            taskDesc: assignTaskDesc.trim(),
          }),
        }).then((r) => r.json());
        if (res.status === 1 && res.list) {
          setTasks(res.list);
          setAssignModalOpen(false);
          setSelectedTaskIds([]);
          showToast(`已成功将 ${selectedTaskIds.length} 项任务批量指派给 ${assignUser}`, 'success');
        } else {
          showToast(res.info || '操作失败', 'error');
        }
      } catch {
        showToast('网络请求异常', 'error');
      }
      return;
    }

    if (assignMode === 'reassign' && reassignTargetTaskId) {
      if (!assignUser.trim()) {
        showToast('请选择指派人', 'warning');
        return;
      }
      try {
        const res = await fetch(`/api/execute/tasks/${reassignTargetTaskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskName: assignTaskName.trim(),
            taskDesc: assignTaskDesc.trim(),
            assignee: assignUser.trim(),
          }),
        }).then((r) => r.json());
        if (res.status === 1 && res.list) {
          setTasks(res.list);
          setAssignModalOpen(false);
          showToast(`任务【${assignTaskName.trim()}】已转派给 ${assignUser}`, 'success');
        } else {
          showToast(res.info || '转派失败', 'error');
        }
      } catch {
        showToast('网络请求异常', 'error');
      }
      return;
    }

    if (!assignFlowId) {
      showToast('请选择流程', 'warning');
      return;
    }
    if (!assignTaskName.trim()) {
      showToast('请输入任务名称', 'warning');
      return;
    }
    if (!assignUser.trim()) {
      showToast('请选择经办人', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/execute/tasks/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: assignFlowId,
          taskName: assignTaskName.trim(),
          taskDesc: assignTaskDesc.trim(),
          assignee: assignUser.trim(),
          creator: '系统管理员',
        }),
      }).then((r) => r.json());
      if (res.status === 1 && res.list) {
        setTasks(res.list);
        setAssignModalOpen(false);
        showToast(`已成功将流程任务指派给 ${assignUser}`, 'success');
      } else {
        showToast(res.info || '指派失败', 'error');
      }
    } catch {
      showToast('网络请求异常', 'error');
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!deleteConfirmTask) return;
    try {
      const res = await fetch(`/api/execute/tasks/${deleteConfirmTask.id}`, {
        method: 'DELETE',
      }).then((r) => r.json());
      if (res.status === 1 && res.list) {
        setTasks(res.list);
        setSelectedTaskIds((prev) => prev.filter((id) => id !== deleteConfirmTask.id));
        showToast(`已删除任务【${deleteConfirmTask.taskName}】`, 'success');
      }
    } finally {
      setDeleteConfirmTask(null);
    }
  };

  const handleConfirmBatchDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    try {
      const res = await fetch('/api/execute/tasks/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds: selectedTaskIds }),
      }).then((r) => r.json());
      if (res.status === 1 && res.list) {
        setTasks(res.list);
        showToast(`已批量删除 ${selectedTaskIds.length} 项任务`, 'success');
        setSelectedTaskIds([]);
      }
    } finally {
      setBatchDeleteConfirmOpen(false);
    }
  };

  const handleOpenStepEditor = (step: ProcessTaskStep) => {
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    setEditingStep(step);
    setSelectedStepId(step.id);
    setStepStatusDraft(step.status === '待办' ? '进行中' : step.status);
    setStepNoteDraft(step.completionNote || '');
    setStepFilesDraft(Array.isArray(step.relatedFiles) ? [...step.relatedFiles] : []);
    setStepStartDraft(step.startTime || nowStr);
    setStepEndDraft(step.endTime || nowStr);
    setCustomFileNameInput('');
  };

  const handleQuickStepStatus = async (
    step: ProcessTaskStep,
    nextStatus: '待办' | '进行中' | '已办'
  ) => {
    if (!activeTask) return;
    const res = await fetch(`/api/execute/tasks/${activeTask.id}/step`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepId: step.id,
        status: nextStatus,
      }),
    }).then((r) => r.json());
    if (res.status === 1 && res.list) {
      setTasks(res.list);
      showToast(`任务项【${step.stepName}】已标记为: ${nextStatus}`, 'success');
    }
  };

  const handleSaveStepUpdate = async () => {
    if (!activeTask || !editingStep) return;
    const res = await fetch(`/api/execute/tasks/${activeTask.id}/step`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepId: editingStep.id,
        status: stepStatusDraft,
        completionNote: stepNoteDraft.trim(),
        relatedFiles: stepFilesDraft,
        startTime: stepStartDraft,
        endTime: stepStatusDraft === '已办' ? stepEndDraft : '',
      }),
    }).then((r) => r.json());
    if (res.status === 1 && res.list) {
      setTasks(res.list);
      showToast(`任务项【${editingStep.stepName}】执行记录已保存`, 'success');
    }
  };

  const handleSubmitWholeTask = async () => {
    if (!activeTask) return;
    const res = await fetch(`/api/execute/tasks/${activeTask.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then((r) => r.json());
    if (res.status === 1 && res.list) {
      setTasks(res.list);
      showToast(`任务【${activeTask.taskName}】已正式提交流转并办结`, 'success');
      setViewMode('list');
    }
  };

  const handleOpenImmediateProcess = (task: ProcessTaskRecord) => {
    setHandlingTask(task);
    setExecSystem(task.execSystem || 'ERP系统');
    const today = new Date().toISOString().slice(0, 10);
    const twoWeeksLater = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    setPeriodStart(task.periodStart || today);
    setPeriodEnd(task.periodEnd || twoWeeksLater);
    setProcessProgress(task.progressStatus || '处理完成');
    setReportFile(
      task.reportFile || {
        name: `${task.flowCode || 'FLOW'}_阶段验收与测试报告.pdf`,
        size: '2.4 MB',
      }
    );
    setProcessRemark(task.processRemark || '');
    setImmediateModalOpen(true);
  };

  const handleReportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;
    setReportFile({
      name: file.name,
      size: sizeStr,
      type: file.type || 'application/octet-stream',
    });
    showToast(`附件【${file.name}】已载入`, 'success');
  };

  const handleConfirmImmediateProcess = async () => {
    if (!handlingTask) return;
    if (!execSystem) {
      showToast('请选择执行系统', 'warning');
      return;
    }
    if (!periodStart || !periodEnd) {
      showToast('请完整选择实施周期起止日期', 'warning');
      return;
    }
    if (periodStart > periodEnd) {
      showToast('实施周期开始日期不能晚于结束日期', 'warning');
      return;
    }
    if (!processProgress) {
      showToast('请选择处理进度', 'warning');
      return;
    }
    if (!reportFile) {
      showToast('请上传验收报告附件', 'warning');
      return;
    }

    setIsSubmittingProcess(true);
    try {
      const isCompleted = processProgress === '处理完成';
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const updatedSteps = (handlingTask.steps || []).map((s) =>
        isCompleted
          ? {
              ...s,
              status: '已办' as const,
              endTime: s.endTime || nowStr,
              completionNote: s.completionNote || `经【${execSystem}】实施处理完成`,
            }
          : s
      );

      const newStatus: '已办结' | '进行中' = isCompleted ? '已办结' : '进行中';
      const updatePayload = {
        status: newStatus,
        submitTime: isCompleted ? nowStr : handlingTask.submitTime || '',
        execSystem,
        periodStart,
        periodEnd,
        progressStatus: processProgress,
        reportFile,
        processRemark: processRemark.trim(),
        steps: updatedSteps,
      };

      const res = await fetch(`/api/execute/tasks/${handlingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      }).then((r) => r.json());

      if (res.status === 1) {
        if (res.list) {
          setTasks(res.list);
        } else {
          setTasks((prev) =>
            prev.map((t) => (t.id === handlingTask.id ? { ...t, ...updatePayload } : t))
          );
        }
        showToast(
          `流程任务【${handlingTask.flowName || handlingTask.taskName}】处理已提交并保存！`,
          'success'
        );
        setImmediateModalOpen(false);
        setHandlingTask(null);
      } else {
        showToast(res.info || '提交失败', 'error');
      }
    } catch {
      showToast('网络请求异常，请稍后重试', 'error');
    } finally {
      setIsSubmittingProcess(false);
    }
  };

  const availableSystemFiles = useMemo(() => {
    const docs = (dictBundle.sysDoc || [])
      .filter((d: any) => d.status === 'approved')
      .map((d: any) => ({ id: d.id, name: d.label, type: '制度文件' }));
    const atts = (dictBundle.attachments || []).map((a: any) => ({
      id: a.id,
      name: a.label,
      type: '流程附件',
    }));
    return [...docs, ...atts];
  }, [dictBundle]);

  const renderStatusBadge = (status: string) => {
    if (status === '已办结' || status === '已办') {
      return (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded text-xs font-medium bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8]">
          已办结
        </span>
      );
    }
    if (status === '进行中') {
      return (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded text-xs font-medium bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff]">
          进行中
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded text-xs font-medium bg-[#fdf6ec] text-[#e6a23c] border border-[#faecd8]">
        {status || '待处理'}
      </span>
    );
  };

  // Task columns in Table
  const taskColumns: DataGridColumn<ProcessTaskRecord>[] = useMemo(
    () => [
      {
        key: 'selection',
        label: (
          <div
            className="flex items-center justify-center py-1 px-0.5 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSelectAll();
            }}
            title={isAllCurrentSelected ? '取消全选' : '全选当前页'}
          >
            <input
              type="checkbox"
              checked={isAllCurrentSelected}
              ref={(el) => {
                if (el) el.indeterminate = isSomeCurrentSelected;
              }}
              onClick={(e) => e.stopPropagation()}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded border-[#dcdfe6] text-[#409eff] focus:ring-[#409eff] cursor-pointer"
            />
          </div>
        ),
        title: '选择',
        defaultWidth: 46,
        minWidth: 46,
        maxWidth: 52,
        align: 'center',
        fixed: 'left',
        render: (row) => {
          const isChecked = selectedTaskIds.includes(row.id);
          return (
            <div
              className="flex items-center justify-center py-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSelectTask(row.id);
              }}
              title={isChecked ? '取消选择' : '选中此任务项'}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onClick={(e) => e.stopPropagation()}
                onChange={() => handleToggleSelectTask(row.id)}
                className="w-4 h-4 rounded border-[#dcdfe6] text-[#409eff] focus:ring-[#409eff] cursor-pointer"
              />
            </div>
          );
        },
      },
      {
        key: 'seq',
        label: '序号',
        title: '序号',
        defaultWidth: 68,
        minWidth: 56,
        align: 'center',
        fixed: 'left',
        render: (_row, idx) => (
          <span className="text-[#606266] font-mono-tabular">
            {(currentPage - 1) * pageSize + idx + 1}
          </span>
        ),
      },
      {
        key: 'taskName',
        label: '任务名称',
        title: '任务名称',
        sortable: true,
        defaultWidth: 220,
        minWidth: 160,
        fixed: 'left',
        render: (row) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveTaskId(row.id);
              setViewMode('update');
            }}
            className="text-left font-medium text-[#303133] hover:text-[#409eff] hover:underline cursor-pointer truncate block w-full"
            title={`${row.taskName} (点击进入任务执行处理)`}
          >
            {row.taskName}
          </button>
        ),
      },
      {
        key: 'status',
        label: '任务状态',
        title: '任务状态',
        sortable: true,
        defaultWidth: 100,
        minWidth: 86,
        align: 'center',
        render: (row) => renderStatusBadge(row.status),
      },
      {
        key: 'progress',
        label: '节点进度',
        title: '节点进度',
        sortable: true,
        defaultWidth: 96,
        minWidth: 80,
        align: 'center',
        render: (row) => {
          const steps = row.steps || [];
          const done = steps.filter((s) => s.status === '已办').length;
          const total = steps.length;
          return (
            <span className="font-mono-tabular text-[#606266]">
              {done}/{total}
            </span>
          );
        },
      },
      {
        key: 'assignee',
        label: '经办责任人',
        title: '经办责任人',
        sortable: true,
        defaultWidth: 145,
        minWidth: 115,
        align: 'center',
        render: (row) => (
          <div className="flex items-center justify-center gap-1.5 group">
            <span className="text-[#303133]">{row.assignee || '未指派'}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenReassign(row);
              }}
              className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded bg-[#ecf5ff] text-[#409eff] border border-[#b3d8ff] text-[11px] hover:bg-[#409eff] hover:text-white transition-all cursor-pointer shrink-0"
              title="转派经办人"
            >
              转派
            </button>
          </div>
        ),
      },
      {
        key: 'flowCode',
        label: '流程编号',
        title: '流程编号',
        sortable: true,
        defaultWidth: 130,
        minWidth: 100,
        align: 'center',
        render: (row) => (
          <span className="font-mono-tabular text-[#606266]">{row.flowCode || '-'}</span>
        ),
      },
      {
        key: 'flowName',
        label: '所属流程',
        title: '所属流程',
        sortable: true,
        defaultWidth: 170,
        minWidth: 120,
        align: 'center',
        render: (row) => (
          <span className="text-[#303133]" title={row.flowFullTitle || row.flowName}>
            {row.flowName}
          </span>
        ),
      },
      {
        key: 'archPath',
        label: '业务架构归属',
        title: '业务架构归属',
        sortable: true,
        defaultWidth: 260,
        minWidth: 170,
        render: (row) => (
          <span className="text-[#606266] line-clamp-2 leading-relaxed" title={row.archPath}>
            {row.archPath}
          </span>
        ),
      },
      {
        key: 'versionNo',
        label: '版本号',
        title: '版本号',
        sortable: true,
        defaultWidth: 78,
        minWidth: 66,
        align: 'center',
        render: (row) => (
          <span className="font-mono-tabular text-[#606266]">{row.versionNo || 'V1'}</span>
        ),
      },
      {
        key: 'creator',
        label: '发起人',
        title: '发起人',
        sortable: true,
        defaultWidth: 110,
        minWidth: 90,
        align: 'center',
        render: (row) => <span className="text-[#606266]">{row.creator}</span>,
      },
      {
        key: 'createTime',
        label: '创建时间',
        title: '创建时间',
        sortable: true,
        defaultWidth: 162,
        minWidth: 140,
        align: 'center',
        render: (row) => (
          <span className="font-mono-tabular text-[#606266]">{row.createTime}</span>
        ),
      },
      {
        key: 'submitTime',
        label: '办结时间',
        title: '办结时间',
        sortable: true,
        defaultWidth: 162,
        minWidth: 140,
        align: 'center',
        render: (row) => (
          <span className="font-mono-tabular text-[#606266]">{row.submitTime || '-'}</span>
        ),
      },
      {
        key: 'actions',
        label: '操作',
        title: '操作',
        defaultWidth: 210,
        minWidth: 190,
        align: 'center',
        fixed: 'right',
        render: (row) => (
          <div className="flex items-center justify-center gap-3 text-xs whitespace-nowrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTaskId(row.id);
                setViewMode('detail');
              }}
              className="text-[#409eff] hover:text-[#3390ff] inline-flex items-center gap-1 cursor-pointer font-medium"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>查看</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenImmediateProcess(row);
              }}
              className="text-[#409eff] hover:text-[#3390ff] inline-flex items-center gap-1 cursor-pointer font-medium"
              title="立即处理此流程"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>处理</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmTask(row);
              }}
              className="text-[#f56c6c] hover:text-[#dd6161] inline-flex items-center gap-1 cursor-pointer font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>删除</span>
            </button>
          </div>
        ),
      },
    ],
    [currentPage, pageSize, flows, selectedTaskIds, isAllCurrentSelected, isSomeCurrentSelected]
  );

  // If in execution processing or detail view
  if (viewMode === 'update' || viewMode === 'detail') {
    if (!activeTask) {
      return (
        <div className="bg-white rounded border border-[#ebeef5] p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-[#e6a23c] mx-auto" />
          <p className="text-sm text-[#606266]">未找到指定的流程运行任务</p>
          <button
            onClick={() => setViewMode('list')}
            className="px-4 py-2 bg-[#409eff] text-white rounded text-xs font-medium cursor-pointer"
          >
            返回任务列表
          </button>
        </div>
      );
    }

    const steps = activeTask.steps || [];
    const completedStepsCount = steps.filter((s) => s.status === '已办').length;

    return (
      <div className="space-y-4">
        {/* Navigation & Action Header */}
        <div className="bg-white rounded border border-[#ebeef5] p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('list')}
              className="h-8 px-3 rounded border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-[#606266] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回任务列表</span>
            </button>
            <div className="h-4 w-[1px] bg-[#dcdfe6]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1f2733]">
                  {activeTask.taskName}
                </span>
                {renderStatusBadge(activeTask.status)}
                <span className="px-2 py-0.5 rounded text-[11px] bg-[#f4f4f5] text-[#909399]">
                  {viewMode === 'update' ? '处理模式' : '查阅模式'}
                </span>
              </div>
              <p className="text-xs text-[#909399] mt-0.5">
                所属流程：{activeTask.flowCode} {activeTask.flowName} · 架构归属：{activeTask.archPath}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenReassign(activeTask)}
              className="h-8 px-3.5 rounded border border-[#dcdfe6] bg-white hover:bg-[#ecf5ff] hover:text-[#409eff] hover:border-[#b3d8ff] text-[#606266] text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>转派经办人</span>
            </button>
            {onEnterDesigner && (
              <button
                onClick={() => onEnterDesigner(String(activeTask.modelId))}
                className="h-8 px-3.5 rounded border border-[#b3d8ff] bg-[#ecf5ff] text-[#409eff] hover:bg-[#409eff] hover:text-white text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>流程画板</span>
              </button>
            )}
            {viewMode === 'update' && activeTask.status !== '已办结' && (
              <>
                <button
                  onClick={() => handleOpenImmediateProcess(activeTask)}
                  className="h-8 px-4 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  title="打开立即处理并提交验收记录"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>立即处理</span>
                </button>
                <button
                  onClick={handleSubmitWholeTask}
                  className="h-8 px-4 rounded bg-[#67c23a] hover:bg-[#5daf34] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>标记整单办结</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Task Overview Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-white rounded border border-[#ebeef5] p-3.5 space-y-1">
            <span className="text-[#909399] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#409eff]" />
              <span>流程模型</span>
            </span>
            <div className="font-medium text-[#303133] truncate" title={activeTask.flowName}>
              {activeTask.flowCode} {activeTask.flowName}
            </div>
            <div className="text-[11px] text-[#909399]">版本：{activeTask.versionNo || 'V1'}</div>
          </div>
          <div className="bg-white rounded border border-[#ebeef5] p-3.5 space-y-1">
            <span className="text-[#909399] flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#67c23a]" />
              <span>当前经办责任人</span>
            </span>
            <div className="font-medium text-[#303133]">
              {activeTask.assignee || '张三'} · {activeTask.assigneeDept || '集成电路设计院'}
            </div>
            <div className="text-[11px] text-[#909399]">发起人：{activeTask.creator}</div>
          </div>
          <div className="bg-white rounded border border-[#ebeef5] p-3.5 space-y-1">
            <span className="text-[#909399] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#e6a23c]" />
              <span>任务执行进度</span>
            </span>
            <div className="font-medium text-[#303133] flex items-center gap-2">
              <span>{completedStepsCount} / {steps.length} 任务项已办结</span>
              <span className="text-[#409eff]">
                ({Math.round((completedStepsCount / Math.max(1, steps.length)) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-[#ebeef5] h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-[#409eff] h-full transition-all duration-300"
                style={{ width: `${(completedStepsCount / Math.max(1, steps.length)) * 100}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded border border-[#ebeef5] p-3.5 space-y-1">
            <span className="text-[#909399] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#909399]" />
              <span>流转时间</span>
            </span>
            <div className="font-medium text-[#303133] font-mono-tabular">
              创建：{activeTask.createTime}
            </div>
            <div className="text-[11px] text-[#909399] font-mono-tabular">
              办结：{activeTask.submitTime || '处理中'}
            </div>
          </div>
        </div>

        {/* Visual Pipeline Stepper Diagram */}
        <div className="bg-white rounded border border-[#ebeef5] p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1f2733] flex items-center gap-1.5">
              <PlayCircle className="w-4 h-4 text-[#409eff]" />
              <span>流程执行链路图（点击节点可直接选中对应的任务项）</span>
            </span>
            <span className="text-[#909399] text-[11px]">
              支持鼠标点击直接聚焦切换
            </span>
          </div>
          <div className="p-3 bg-[#f8faff] rounded border border-[#ebeef5] overflow-x-auto">
            <div className="flex items-center min-w-max gap-3 py-2">
              {steps.map((step, sIdx) => {
                const isSelected = selectedStepId === step.id;
                const isDone = step.status === '已办';
                const isOngoing = step.status === '进行中';
                return (
                  <React.Fragment key={step.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenStepEditor(step)}
                      className={`relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-left cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'border-[#409eff] bg-white ring-4 ring-[#409eff]/20 shadow-md scale-102 font-medium'
                          : isDone
                          ? 'border-[#c2e7b0] bg-[#f0f9eb] hover:border-[#67c23a]'
                          : isOngoing
                          ? 'border-[#b3d8ff] bg-[#ecf5ff] hover:border-[#409eff]'
                          : 'border-[#dcdfe6] bg-white hover:border-[#b3d8ff]'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isDone
                            ? 'bg-[#67c23a] text-white'
                            : isOngoing
                            ? 'bg-[#409eff] text-white animate-pulse'
                            : 'bg-[#e4e7ed] text-[#909399]'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : sIdx + 1}
                      </div>
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`${
                              isSelected
                                ? 'text-[#409eff] font-bold'
                                : 'text-[#303133]'
                            }`}
                          >
                            {step.stepName}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#409eff] text-white font-normal">
                              选中
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#909399] flex items-center gap-2 mt-0.5">
                          <span>{step.roleName || '经办人'}</span>
                          <span>·</span>
                          <span
                            className={
                              isDone
                                ? 'text-[#67c23a]'
                                : isOngoing
                                ? 'text-[#409eff]'
                                : 'text-[#909399]'
                            }
                          >
                            {step.status}
                          </span>
                        </div>
                      </div>
                    </button>
                    {sIdx < steps.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-[#c0c4cc] shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dual Panel: Left Task Items List vs Right Execution Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: 流程执行任务项列表 (Task Items) */}
          <div className="lg:col-span-5 bg-white rounded border border-[#ebeef5] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-[#409eff]" />
                <h3 className="text-sm font-bold text-[#1f2733]">流程执行任务项</h3>
                <span className="text-xs text-[#909399]">({steps.length} 项)</span>
              </div>
              <span className="text-xs text-[#409eff] bg-[#ecf5ff] px-2 py-0.5 rounded">
                鼠标点击任务项可查看与处理
              </span>
            </div>

            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {steps.map((step, idx) => {
                const isSelected = selectedStepId === step.id;
                const isDone = step.status === '已办';
                const isOngoing = step.status === '进行中';

                return (
                  <div
                    key={step.id}
                    onClick={() => handleOpenStepEditor(step)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all relative ${
                      isSelected
                        ? 'border-2 border-[#409eff] bg-[#ecf5ff]/70 shadow-md ring-2 ring-[#409eff]/30'
                        : 'border-[#ebeef5] bg-white hover:border-[#b3d8ff] hover:bg-[#f8faff]'
                    }`}
                  >
                    {/* Selected Indicator Badge */}
                    {isSelected && (
                      <div className="absolute top-2.5 right-3 flex items-center gap-1 bg-[#409eff] text-white text-[11px] px-2 py-0.5 rounded-full font-medium shadow-xs">
                        <Check className="w-3 h-3" />
                        <span>当前选中任务项</span>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isDone
                            ? 'bg-[#67c23a] text-white'
                            : isOngoing
                            ? 'bg-[#409eff] text-white'
                            : 'bg-[#f4f4f5] text-[#909399] border border-[#dcdfe6]'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : `0${idx + 1}`}
                      </div>

                      <div className="flex-1 min-w-0 pr-24">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-[#409eff]' : 'text-[#303133]'
                            }`}
                          >
                            {step.stepName}
                          </h4>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] ${
                              step.nodeType === 'judge'
                                ? 'bg-[#fdf6ec] text-[#e6a23c] border border-[#faecd8]'
                                : 'bg-[#f4f4f5] text-[#909399]'
                            }`}
                          >
                            {step.nodeType === 'judge' ? '决策控制点' : '串行执行'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#909399] mt-1.5">
                          <span>
                            责任角色：<strong className="text-[#606266]">{step.roleName || '经办人'}</strong>
                          </span>
                          <span>
                            状态：
                            <span
                              className={`font-medium ${
                                isDone
                                  ? 'text-[#67c23a]'
                                  : isOngoing
                                  ? 'text-[#409eff]'
                                  : 'text-[#e6a23c]'
                              }`}
                            >
                              {step.status}
                            </span>
                          </span>
                        </div>

                        {step.outDeliverable && (
                          <div className="text-[11px] text-[#606266] mt-1 bg-white/80 p-1.5 rounded border border-[#ebeef5]">
                            <span className="text-[#909399]">交付物：</span>
                            {step.outDeliverable}
                          </div>
                        )}

                        {step.completionNote && (
                          <div className="text-[11px] text-[#909399] mt-1 truncate">
                            记录：{step.completionNote}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: 选中的任务项流转处理 (Selected Task Item Inspector) */}
          <div className="lg:col-span-7 bg-white rounded border border-[#ebeef5] p-5 space-y-4">
            {editingStep ? (
              <>
                <div className="border-b border-[#ebeef5] pb-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#409eff] bg-[#ecf5ff] px-2 py-0.5 rounded">
                        任务项 #{editingStep.seq || 1}
                      </span>
                      <h3 className="text-sm font-bold text-[#1f2733]">
                        {editingStep.stepName}
                      </h3>
                    </div>
                    <p className="text-xs text-[#909399]">
                      责任角色：{editingStep.roleName || '经办人'} · 类型：
                      {editingStep.nodeType === 'judge' ? '决策控制点' : '串行执行'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickStepStatus(editingStep, '待办')}
                      className={`px-2.5 py-1 rounded text-xs cursor-pointer border ${
                        editingStep.status === '待办'
                          ? 'bg-[#fdf6ec] text-[#e6a23c] border-[#faecd8] font-bold'
                          : 'bg-white text-[#909399] border-[#dcdfe6] hover:bg-[#f5f7fa]'
                      }`}
                    >
                      待办
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStepStatus(editingStep, '进行中')}
                      className={`px-2.5 py-1 rounded text-xs cursor-pointer border ${
                        editingStep.status === '进行中'
                          ? 'bg-[#ecf5ff] text-[#409eff] border-[#d9ecff] font-bold'
                          : 'bg-white text-[#909399] border-[#dcdfe6] hover:bg-[#f5f7fa]'
                      }`}
                    >
                      进行中
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStepStatus(editingStep, '已办')}
                      className={`px-2.5 py-1 rounded text-xs cursor-pointer border ${
                        editingStep.status === '已办'
                          ? 'bg-[#f0f9eb] text-[#67c23a] border-[#e1f3d8] font-bold'
                          : 'bg-white text-[#909399] border-[#dcdfe6] hover:bg-[#f5f7fa]'
                      }`}
                    >
                      已办结
                    </button>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Status Selection Draft */}
                  <div className="flex items-center gap-3">
                    <label className="w-24 text-right text-[#606266] font-medium shrink-0">
                      节点状态
                    </label>
                    <div className="flex items-center gap-3">
                      {(['待办', '进行中', '已办'] as const).map((st) => (
                        <label
                          key={st}
                          className="flex items-center gap-1.5 cursor-pointer text-xs"
                        >
                          <input
                            type="radio"
                            name="stepStatusRadio"
                            value={st}
                            checked={stepStatusDraft === st}
                            onChange={() => setStepStatusDraft(st)}
                            className="text-[#409eff] focus:ring-[#409eff]"
                          />
                          <span
                            className={
                              st === '已办'
                                ? 'text-[#67c23a]'
                                : st === '进行中'
                                ? 'text-[#409eff]'
                                : 'text-[#e6a23c]'
                            }
                          >
                            {st}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Note input */}
                  <div className="flex items-start gap-3">
                    <label className="w-24 pt-2 text-right text-[#606266] font-medium shrink-0">
                      办理处理说明
                    </label>
                    <div className="flex-1 space-y-1">
                      <textarea
                        rows={3}
                        value={stepNoteDraft}
                        onChange={(e) => setStepNoteDraft(e.target.value)}
                        placeholder="请输入此任务项的执行记录、审批意见或决策结论..."
                        className="w-full p-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-xs text-[#303133]"
                      />
                    </div>
                  </div>

                  {/* Deliverables / Output Requirement */}
                  {editingStep.outDeliverable && (
                    <div className="flex items-start gap-3">
                      <label className="w-24 pt-1 text-right text-[#606266] font-medium shrink-0">
                        输出交付物
                      </label>
                      <div className="flex-1 p-2 bg-[#f8faff] rounded border border-[#ebeef5] text-[#303133]">
                        {editingStep.outDeliverable}
                      </div>
                    </div>
                  )}

                  {/* Associated Files */}
                  <div className="flex items-start gap-3">
                    <label className="w-24 pt-2 text-right text-[#606266] font-medium shrink-0">
                      关联附件与文件
                    </label>
                    <div className="flex-1 space-y-2">
                      {stepFilesDraft.length > 0 ? (
                        <div className="space-y-1.5">
                          {stepFilesDraft.map((f, fIdx) => (
                            <div
                              key={f.id || fIdx}
                              className="flex items-center justify-between p-2 rounded bg-[#f5f7fa] border border-[#ebeef5]"
                            >
                              <div className="flex items-center gap-1.5 text-xs text-[#303133]">
                                <FileText className="w-3.5 h-3.5 text-[#409eff]" />
                                <span>{f.name}</span>
                                {f.type && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-white border border-[#dcdfe6] text-[#909399]">
                                    {f.type}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setStepFilesDraft((prev) =>
                                    prev.filter((_, i) => i !== fIdx)
                                  )
                                }
                                className="text-[#f56c6c] hover:text-[#dd6161] cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[#909399] py-1 text-xs">
                          暂无关联附件，可从制度库选用或直接添加
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <select
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const found = availableSystemFiles.find(
                              (x) => x.id === e.target.value
                            );
                            if (found && !stepFilesDraft.some((sf) => sf.id === found.id)) {
                              setStepFilesDraft((prev) => [...prev, found]);
                            }
                            e.target.value = '';
                          }}
                          className="h-8 px-2.5 rounded border border-[#dcdfe6] bg-white text-xs outline-none"
                        >
                          <option value="">+ 从制度/流程附件库添加...</option>
                          {availableSystemFiles.map((f) => (
                            <option key={f.id} value={f.id}>
                              [{f.type}] {f.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="自定义附件名称..."
                            value={customFileNameInput}
                            onChange={(e) => setCustomFileNameInput(e.target.value)}
                            className="h-8 px-2 rounded border border-[#dcdfe6] text-xs outline-none w-36"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (customFileNameInput.trim()) {
                                setStepFilesDraft((prev) => [
                                  ...prev,
                                  {
                                    id: 'file_' + Date.now(),
                                    name: customFileNameInput.trim(),
                                    type: '任务上传',
                                  },
                                ]);
                                setCustomFileNameInput('');
                              }
                            }}
                            className="h-8 px-2.5 bg-[#f4f4f5] hover:bg-[#e4e7ed] rounded border border-[#dcdfe6] text-xs cursor-pointer"
                          >
                            添加
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Time Range */}
                  <div className="flex items-center gap-3">
                    <label className="w-24 text-right text-[#606266] font-medium shrink-0">
                      处理时间
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="开始时间"
                        value={stepStartDraft}
                        onChange={(e) => setStepStartDraft(e.target.value)}
                        className="h-8 px-2 rounded border border-[#dcdfe6] text-xs w-40 font-mono-tabular"
                      />
                      <span className="text-[#909399]">至</span>
                      <input
                        type="text"
                        placeholder="完成时间"
                        value={stepEndDraft}
                        onChange={(e) => setStepEndDraft(e.target.value)}
                        className="h-8 px-2 rounded border border-[#dcdfe6] text-xs w-40 font-mono-tabular"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-[#ebeef5] pt-4 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSaveStepUpdate()}
                      className="h-8 px-5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>保存此任务项处理记录</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-[#909399] space-y-2">
                <ListTodo className="w-8 h-8 text-[#c0c4cc] mx-auto" />
                <p>请点击左侧任务项列表或上方执行链路图选中具体步骤</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List View Mode
  return (
    <div className="space-y-3">
      {/* Top Search Card */}
      <div className="bg-white rounded border border-[#ebeef5] p-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#606266] font-medium whitespace-nowrap">任务状态</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`h-8 w-44 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none bg-white ${
                filterStatus ? 'text-[#303133]' : 'text-[#c0c4cc]'
              }`}
            >
              <option value="">全部状态</option>
              <option value="待处理" className="text-[#303133]">
                待处理
              </option>
              <option value="进行中" className="text-[#303133]">
                进行中
              </option>
              <option value="已办结" className="text-[#303133]">
                已办结
              </option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#606266] font-medium whitespace-nowrap">流程编号</span>
            <input
              type="text"
              value={filterFlowCode}
              onChange={(e) => setFilterFlowCode(e.target.value)}
              placeholder="请输入流程编号"
              className="h-8 w-44 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-[#303133] placeholder:text-[#c0c4cc]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#606266] font-medium whitespace-nowrap">任务名称</span>
            <input
              type="text"
              value={filterTaskName}
              onChange={(e) => setFilterTaskName(e.target.value)}
              placeholder="请输入任务名称"
              className="h-8 w-44 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-[#303133] placeholder:text-[#c0c4cc]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSearch}
              className="h-8 px-3.5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>查询</span>
            </button>
            <button
              onClick={handleReset}
              className="h-8 px-3.5 rounded border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-[#606266] text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded border border-[#ebeef5] p-4 space-y-3">
        {/* Action Header & Selected Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenAssignWorkflow()}
              className="h-8 px-3.5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建指派任务</span>
            </button>

            {/* When tasks are selected, display interactive batch actions */}
            {selectedTaskIds.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-[#ecf5ff] border border-[#b3d8ff] rounded text-xs text-[#409eff]">
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#409eff]" />
                  <span>已选中 {selectedTaskIds.length} 项流程任务</span>
                </span>
                <div className="h-3.5 w-[1px] bg-[#b3d8ff]" />
                <button
                  type="button"
                  onClick={() => handleOpenAssignWorkflow()}
                  className="hover:underline font-medium cursor-pointer"
                >
                  批量转派责任人
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setBatchDeleteConfirmOpen(true)}
                  className="text-[#f56c6c] hover:underline font-medium cursor-pointer"
                >
                  批量删除
                </button>
                {selectedTaskIds.length === 1 && (
                  <>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTaskId(selectedTaskIds[0]);
                        setViewMode('update');
                      }}
                      className="font-bold hover:underline cursor-pointer"
                    >
                      处理此任务
                    </button>
                  </>
                )}
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setSelectedTaskIds([])}
                  className="text-[#909399] hover:text-[#606266] cursor-pointer"
                >
                  清空选中
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#909399]">
            <span>共 {sortedFilteredTasks.length} 项任务</span>
          </div>
        </div>

        {/* Enterprise Data Grid */}
        <EnterpriseDataGrid<ProcessTaskRecord>
          storageKey="dflow_execute_process_grid_v2"
          columns={taskColumns}
          data={pagedTasks}
          selectedKeys={selectedTaskIds}
          rowKey={(r) => r.id}
          onRowClick={(row) => handleToggleSelectTask(row.id)}
          sortKey={sortField}
          sortOrder={sortOrder}
          onSortChange={(field, order) => {
            setSortField(field);
            setSortOrder(order);
            setCurrentPage(1);
          }}
          emptyText="暂无流程运行任务"
          maxHeight="calc(100vh - 350px)"
        />

        {/* Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[#606266] border-t border-[#ebeef5]">
          <div className="flex items-center gap-3">
            <span>
              显示第 {(currentPage - 1) * pageSize + 1} 到{' '}
              {Math.min(currentPage * pageSize, sortedFilteredTasks.length)} 条，共{' '}
              {sortedFilteredTasks.length} 条
            </span>
            {selectedTaskIds.length > 0 && (
              <span className="text-[#409eff] font-medium">
                (已选中 {selectedTaskIds.length} 条)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-7 px-2 rounded border border-[#dcdfe6] bg-white text-xs outline-none"
            >
              <option value={10}>10 条/页</option>
              <option value={20}>20 条/页</option>
              <option value={50}>50 条/页</option>
            </select>

            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2.5 rounded border border-[#dcdfe6] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f5f7fa] cursor-pointer"
            >
              上一页
            </button>
            <span className="font-mono-tabular">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2.5 rounded border border-[#dcdfe6] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f5f7fa] cursor-pointer"
            >
              下一页
            </button>

            <div className="flex items-center gap-1 ml-2">
              <span>跳至</span>
              <input
                type="text"
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const p = parseInt(jumpPageInput, 10);
                    if (!isNaN(p) && p >= 1 && p <= totalPages) {
                      setCurrentPage(p);
                    }
                  }
                }}
                className="w-10 h-7 text-center rounded border border-[#dcdfe6] text-xs outline-none"
              />
              <span>页</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#ebeef5] shadow-xl w-full max-w-[620px] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] bg-[#fafbfc] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#409eff]" />
                <h3 className="text-sm font-bold text-[#1f2733]">
                  {assignMode === 'batch'
                    ? `批量指派流程任务 (${selectedTaskIds.length} 项)`
                    : assignMode === 'reassign'
                    ? '转派经办人'
                    : '新建指派任务'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {assignMode !== 'batch' && (
                <div className="flex items-center gap-3">
                  <label className="w-20 text-right text-[#606266] font-medium shrink-0">
                    <span className="text-[#f56c6c] mr-1">*</span>所属流程
                  </label>
                  <div className="flex-1 relative" ref={flowSelectorRef}>
                    <div
                      onClick={() => setFlowDropdownOpen(!flowDropdownOpen)}
                      className="w-full h-9 px-3 rounded border border-[#dcdfe6] bg-white flex items-center justify-between cursor-pointer"
                    >
                      <span className={selectedAssignFlow ? 'text-[#303133]' : 'text-[#c0c4cc]'}>
                        {selectedAssignFlow
                          ? `${selectedAssignFlow.flowNo} ${selectedAssignFlow.label}`
                          : '请选择流程模型'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-[#909399]" />
                    </div>
                    {flowDropdownOpen && (
                      <div className="absolute top-10 left-0 right-0 z-50 bg-white border border-[#ebeef5] rounded shadow-lg p-2 max-h-60 overflow-y-auto space-y-1">
                        <input
                          type="text"
                          placeholder="搜索流程名称或编号..."
                          value={flowSearchTerm}
                          onChange={(e) => setFlowSearchTerm(e.target.value)}
                          className="w-full h-8 px-2 rounded border border-[#dcdfe6] text-xs mb-1"
                        />
                        {flows
                          .filter(
                            (f) =>
                              !flowSearchTerm ||
                              f.label.includes(flowSearchTerm) ||
                              f.flowNo.includes(flowSearchTerm)
                          )
                          .map((f) => (
                            <div
                              key={f.id}
                              onClick={() => {
                                setAssignFlowId(f.id);
                                if (!assignTaskName || assignMode === 'create') {
                                  setAssignTaskName(`${f.label}-工单任务`);
                                }
                                setFlowDropdownOpen(false);
                              }}
                              className="px-2.5 py-1.5 rounded hover:bg-[#ecf5ff] text-[#303133] hover:text-[#409eff] cursor-pointer"
                            >
                              {f.flowNo} {f.label}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="w-20 text-right text-[#606266] font-medium shrink-0">
                  <span className="text-[#f56c6c] mr-1">*</span>任务名称
                </label>
                <input
                  type="text"
                  value={assignTaskName}
                  onChange={(e) => setAssignTaskName(e.target.value)}
                  placeholder="请输入任务名称"
                  className="flex-1 h-9 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-xs text-[#303133]"
                />
              </div>

              <div className="flex items-start gap-3">
                <label className="w-20 pt-2 text-right text-[#606266] font-medium shrink-0">
                  <span className="text-[#f56c6c] mr-1">*</span>经办人
                </label>
                <div className="flex-1">
                  <PersonSelectField
                    value={assignUser}
                    onChange={(name) => setAssignUser(name)}
                    placeholder="点击选择经办人 (支持手工输入与组织架构部门选择)"
                    title="选择流程经办人"
                    showToast={showToast}
                  />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <label className="w-20 pt-2 text-right text-[#606266] font-medium shrink-0">
                  说明备注
                </label>
                <textarea
                  rows={3}
                  value={assignTaskDesc}
                  onChange={(e) => setAssignTaskDesc(e.target.value)}
                  placeholder="请输入指派说明或执行要求..."
                  className="flex-1 p-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-xs text-[#303133]"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#ebeef5] bg-[#fafbfc] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-xs text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmitAssign}
                className="h-8 px-4 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium cursor-pointer shadow-2xs"
              >
                确认指派
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Task Modal */}
      {deleteConfirmTask && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#ebeef5] shadow-xl w-full max-w-[420px] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#fef0f0] text-[#f56c6c] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1f2733]">删除流程任务确认</h4>
                <p className="text-xs text-[#909399] mt-0.5">
                  确定要删除任务【{deleteConfirmTask.taskName}】吗？删除后不可恢复。
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ebeef5]">
              <button
                type="button"
                onClick={() => setDeleteConfirmTask(null)}
                className="h-8 px-3.5 rounded border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-xs text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTask}
                className="h-8 px-4 rounded bg-[#f56c6c] hover:bg-[#dd6161] text-white text-xs font-medium cursor-pointer shadow-2xs"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Modal */}
      {batchDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#ebeef5] shadow-xl w-full max-w-[420px] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#fef0f0] text-[#f56c6c] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1f2733]">批量删除任务确认</h4>
                <p className="text-xs text-[#909399] mt-0.5">
                  确定要批量删除已选中的{' '}
                  <strong className="text-[#f56c6c]">{selectedTaskIds.length}</strong>{' '}
                  项流程任务吗？
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ebeef5]">
              <button
                type="button"
                onClick={() => setBatchDeleteConfirmOpen(false)}
                className="h-8 px-3.5 rounded border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-xs text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="h-8 px-4 rounded bg-[#f56c6c] hover:bg-[#dd6161] text-white text-xs font-medium cursor-pointer shadow-2xs"
              >
                确认批量删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Immediate Process Modal (立即处理) - Strictly matching design mockup image_1f9f6afa.png */}
      {immediateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[620px] overflow-hidden border border-[#ebeef5]">
            {/* Modal Header: Blue vertical bar | 立即处理 and close button */}
            <div className="flex items-center justify-between px-7 py-4 border-b border-[#f0f2f5]">
              <div className="flex items-center gap-2.5">
                <div className="w-[4px] h-[18px] bg-[#2F7BFE] rounded-full" />
                <h3 className="text-[17px] font-semibold text-[#1f2937]">立即处理</h3>
              </div>
              <button
                type="button"
                onClick={() => setImmediateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100 cursor-pointer"
                title="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="px-9 py-7 space-y-5 text-sm">
              {/* Row 1: 流程名称 */}
              <div className="flex items-center">
                <label className="w-20 text-right pr-4 text-[#606266] shrink-0 font-normal text-sm">
                  流程名称
                </label>
                <div className="flex-1">
                  <span className="text-[#2F7BFE] font-medium text-[15px] select-all">
                    {handlingTask?.flowName || handlingTask?.taskName || '12345'}
                  </span>
                </div>
              </div>

              {/* Row 2: 执行系统 */}
              <div className="flex items-center">
                <label className="w-20 text-right pr-4 text-[#606266] shrink-0 font-normal text-sm">
                  <span className="text-[#f56c6c] mr-1">*</span>执行系统
                </label>
                <div className="relative flex-1">
                  <select
                    value={execSystem}
                    onChange={(e) => setExecSystem(e.target.value)}
                    className="w-full h-9 px-3 pr-8 rounded border border-[#dcdfe6] bg-white text-xs text-[#303133] appearance-none outline-none focus:border-[#2F7BFE] focus:ring-1 focus:ring-[#2F7BFE]/20 transition-all cursor-pointer"
                  >
                    <option value="" disabled className="text-[#909399]">
                      请选择
                    </option>
                    <option value="ERP系统">ERP系统</option>
                    <option value="PLM系统">PLM系统</option>
                    <option value="OA系统">OA系统</option>
                    <option value="MES系统">MES系统</option>
                    <option value="CRM系统">CRM系统</option>
                    <option value="金蝶云星空">金蝶云星空</option>
                    <option value="用友BIP平台">用友BIP平台</option>
                    <option value="供应链协同平台">供应链协同平台</option>
                    <option value="自建微服务平台">自建微服务平台</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#909399] absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Row 3: 实施周期 */}
              <div className="flex items-center">
                <label className="w-20 text-right pr-4 text-[#606266] shrink-0 font-normal text-sm">
                  <span className="text-[#f56c6c] mr-1">*</span>实施周期
                </label>
                <div className="flex-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="w-full h-9 px-3 rounded border border-[#dcdfe6] bg-white text-xs text-[#303133] outline-none focus:border-[#2F7BFE] focus:ring-1 focus:ring-[#2F7BFE]/20 transition-all cursor-pointer"
                      placeholder="选择日期"
                    />
                  </div>
                  <span className="text-[#909399] px-0.5">-</span>
                  <div className="relative flex-1">
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="w-full h-9 px-3 rounded border border-[#dcdfe6] bg-white text-xs text-[#303133] outline-none focus:border-[#2F7BFE] focus:ring-1 focus:ring-[#2F7BFE]/20 transition-all cursor-pointer"
                      placeholder="选择日期"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: 处理进度 */}
              <div className="flex items-center">
                <label className="w-20 text-right pr-4 text-[#606266] shrink-0 font-normal text-sm">
                  <span className="text-[#f56c6c] mr-1">*</span>处理进度
                </label>
                <div className="relative flex-1">
                  <select
                    value={processProgress}
                    onChange={(e) => setProcessProgress(e.target.value)}
                    className="w-full h-9 px-3 pr-8 rounded border border-[#dcdfe6] bg-white text-xs text-[#303133] appearance-none outline-none focus:border-[#2F7BFE] focus:ring-1 focus:ring-[#2F7BFE]/20 transition-all cursor-pointer"
                  >
                    <option value="处理完成">处理完成</option>
                    <option value="处理中">处理中</option>
                    <option value="阶段交付">阶段交付</option>
                    <option value="待复核">待复核</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#909399] absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Row 5: 验收报告 */}
              <div className="flex items-start">
                <label className="w-20 text-right pr-4 pt-1.5 text-[#606266] shrink-0 font-normal text-sm">
                  <span className="text-[#f56c6c] mr-1">*</span>验收报告
                </label>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center justify-center px-4 py-1.5 bg-[#2F7BFE] hover:bg-[#2563EB] active:bg-[#1d4ed8] text-white text-xs font-medium rounded shadow-sm cursor-pointer transition-colors">
                      <span>上传附件</span>
                      <input
                        type="file"
                        ref={reportFileInputRef}
                        onChange={handleReportFileUpload}
                        className="hidden"
                      />
                    </label>
                    {reportFile && (
                      <div className="flex items-center gap-2 px-2.5 py-1 bg-[#f5f7fa] border border-[#e4e7ed] rounded text-xs text-[#303133]">
                        <FileText className="w-3.5 h-3.5 text-[#2F7BFE] shrink-0" />
                        <span className="font-medium max-w-[220px] truncate" title={reportFile.name}>
                          {reportFile.name}
                        </span>
                        <span className="text-[#909399] text-[11px] shrink-0">
                          ({reportFile.size})
                        </span>
                        <button
                          type="button"
                          onClick={() => setReportFile(null)}
                          className="text-[#909399] hover:text-[#f56c6c] ml-1 p-0.5 rounded cursor-pointer transition-colors"
                          title="移除附件"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 6: 备注描述 */}
              <div className="flex items-start">
                <label className="w-20 text-right pr-4 pt-2 text-[#606266] shrink-0 font-normal text-sm">
                  备注描述
                </label>
                <div className="flex-1 relative">
                  <textarea
                    value={processRemark}
                    maxLength={200}
                    onChange={(e) => setProcessRemark(e.target.value)}
                    rows={3}
                    placeholder=""
                    className="w-full p-2.5 pb-6 rounded border border-[#dcdfe6] text-xs text-[#303133] outline-none focus:border-[#2F7BFE] focus:ring-1 focus:ring-[#2F7BFE]/20 transition-all resize-none leading-relaxed"
                  />
                  <div className="absolute right-2.5 bottom-2 text-[11px] text-[#909399] pointer-events-none font-mono">
                    {processRemark.length}/200
                  </div>
                </div>
              </div>

              {/* Action buttons (aligned with inputs, pl-20) */}
              <div className="flex items-center gap-3 pl-20 pt-1 pb-1">
                <button
                  type="button"
                  disabled={isSubmittingProcess}
                  onClick={handleConfirmImmediateProcess}
                  className="px-6 py-1.5 bg-[#2F7BFE] hover:bg-[#2563EB] active:bg-[#1d4ed8] text-white text-xs font-medium rounded shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingProcess ? '提交中...' : '提交'}
                </button>
                <button
                  type="button"
                  onClick={() => setImmediateModalOpen(false)}
                  className="px-6 py-1.5 bg-white border border-[#dcdfe6] hover:bg-[#f5f7fa] text-[#606266] text-xs font-medium rounded transition-all cursor-pointer"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
