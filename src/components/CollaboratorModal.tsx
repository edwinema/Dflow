import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  UserPlus,
  X,
  Check,
  AlertCircle,
  Calendar,
  Clock,
  Briefcase,
  Building,
  Building2,
  Shield,
  Trash2,
  Edit3,
  UserCheck,
  Plus,
  Sparkles,
  Info,
  Search,
  FolderTree,
  Folder,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

export interface CollaboratorItem {
  id: string;
  userId: string;
  userName: string; // 中文名称或主要显示名称
  englishName?: string; // 英文账号或英文名称 (如 zhangsan, lisi)
  empNo: string;
  deptName: string;
  roleName?: string;
  taskDesc: string;
  priority: '普通' | '重要' | '紧急';
  taskStatus: '待推进' | '进行中' | '已完成';
  dueDate?: string;
  assignTime: string;
  assignBy: string;
}

interface CollaboratorModalProps {
  open: boolean;
  targetType: 'arch' | 'flow';
  targetId: string;
  targetLabel: string;
  targetNo?: string;
  ownerName?: string;
  deptName?: string;
  archPath?: string;
  initialCollaborators?: CollaboratorItem[];
  currentUserName?: string;
  onClose: () => void;
  onSaved: (collaborators: CollaboratorItem[]) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

// Fallback users for robustness
const FALLBACK_USERS = [
  { id: 'u_zs', empNo: 'E0099', nickName: '张三', userName: 'zhangsan', deptId: 'dept_02', deptCode: '0020', deptName: '流程管理部', positionName: '高级流程经理' },
  { id: 'u_ls', empNo: 'E0088', nickName: '李四', userName: 'lisi', deptId: 'dept_05', deptCode: '0050', deptName: '研发管理中心', positionName: '高级业务专家' },
  { id: 'u_ww', empNo: 'E0077', nickName: '王五', userName: 'wangwu', deptId: 'dept_02', deptCode: '0020', deptName: '流程管理部', positionName: '流程合规主管' },
  { id: 'u_3', empNo: 'E0020', nickName: '流程经理', userName: 'flow_lead', deptId: 'dept_02', deptCode: '0020', deptName: '流程管理部', positionName: '流程推进专员' },
  { id: 'u_7', empNo: 'E0042', nickName: '软件架构师', userName: 'dev_lead', deptId: 'dept_07', deptCode: '0042', deptName: '软件开发部', positionName: '软件研发组长' },
  { id: 'u_9', empNo: 'E0044', nickName: '项目管理主管', userName: 'pm_lead', deptId: 'dept_09', deptCode: '0044', deptName: '项目管理部', positionName: '项目推进主管' },
  { id: 'u_2', empNo: 'E0010', nickName: '系统管理员', userName: 'sys_admin', deptId: 'dept_01', deptCode: '0010', deptName: '系统管理部', positionName: '系统架构师' },
  { id: 'u_4', empNo: 'E0030', nickName: '权责主管', userName: 'duty_lead', deptId: 'dept_03', deptCode: '0030', deptName: '权责管理部', positionName: '权责核准主管' },
  { id: 'u_5', empNo: 'E0050', nickName: '研发总监', userName: 'rd_director', deptId: 'dept_05', deptCode: '0050', deptName: '研发管理中心', positionName: '中心总经理' },
  { id: 'u_10', empNo: 'E0091', nickName: '质量测试员', userName: 'tz_tester', deptId: 'dept_10', deptCode: 'TZ1', deptName: 'TZ测试部门', positionName: '测试工程师' },
];

const FALLBACK_DEPTS = [
  { id: 'dept_02', deptName: '流程管理部', deptCode: '0020', leader: '流程推进官' },
  { id: 'dept_05', deptName: '研发管理中心', deptCode: '0050', leader: '研发总监' },
  { id: 'dept_07', deptName: '软件开发部', deptCode: '0042', leader: '技术主管' },
  { id: 'dept_09', deptName: '项目管理部', deptCode: '0044', leader: 'PMO经理' },
  { id: 'dept_01', deptName: '系统管理部', deptCode: '0010', leader: '系统管理员' },
  { id: 'dept_03', deptName: '权责管理部', deptCode: '0030', leader: '权责合规官' },
  { id: 'dept_04', deptName: '知识管理部', deptCode: '0040', leader: '知识管理员' },
  { id: 'dept_10', deptName: 'TZ测试部门', deptCode: 'TZ1', leader: '测试经理' },
];

export const CollaboratorModal: React.FC<CollaboratorModalProps> = ({
  open,
  targetType,
  targetId,
  targetLabel,
  targetNo,
  ownerName,
  deptName,
  archPath,
  initialCollaborators = [],
  currentUserName = '流程管理员',
  onClose,
  onSaved,
  showToast,
}) => {
  const [collaborators, setCollaborators] = useState<CollaboratorItem[]>([]);
  const [, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Available users & departments from org system
  const [availableUsers, setAvailableUsers] = useState<any[]>(FALLBACK_USERS);
  const [availableDepts, setAvailableDepts] = useState<any[]>(FALLBACK_DEPTS);

  // Add / Assign form state
  const [showAssignForm, setShowAssignForm] = useState(false);

  // Selection method: 'manual' (手工输入/联想搜索) vs 'orgTree' (从组织架构部门选择)
  const [selectionTab, setSelectionTab] = useState<'manual' | 'orgTree'>('manual');

  // Manual / Suggestion input state
  const [nameInput, setNameInput] = useState('');
  const [showSuggestDropdown, setShowSuggestDropdown] = useState(false);
  const inputContainerRef = useRef<HTMLDivElement | null>(null);

  // Selected User Object (whether picked from tree or selected from input/suggestions)
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [customDeptInput, setCustomDeptInput] = useState('');
  const [customPosInput, setCustomPosInput] = useState('');

  // Org Tree Picker State
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [deptSearchQuery, setDeptSearchQuery] = useState('');

  // Task details
  const [taskDesc, setTaskDesc] = useState('');
  const [priority, setPriority] = useState<'普通' | '重要' | '紧急'>('重要');
  const [dueDate, setDueDate] = useState('');

  // Editing state for existing collaborators
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editStatus, setEditStatus] = useState<'待推进' | '进行中' | '已完成'>('进行中');

  // Quick preset task templates
  const taskTemplates = [
    '协助梳理业务活动与泳道流转图绘制',
    '梳理关键控制点(KCP)与审查标准细则',
    '整理前置输入与后置输出交付物模板',
    '制度文件与权责清单(DoA)对齐校对',
    '组织各业务相关方进行端到端推演评审',
  ];

  // Fetch collaborators and org bundle when opening
  useEffect(() => {
    if (!open) return;
    const safeInit = Array.isArray(initialCollaborators) ? initialCollaborators : [];
    setCollaborators(safeInit);
    setLoading(true);

    if (targetId) {
      // Fetch collaborators from API
      fetch(`/api/flow/collaborators?targetType=${targetType || 'arch'}&targetId=${encodeURIComponent(targetId)}`)
        .then((r) => r.json())
        .then((res) => {
          if (res && res.status === 1 && Array.isArray(res.data) && res.data.length > 0) {
            setCollaborators(res.data);
          } else if (safeInit.length > 0) {
            setCollaborators(safeInit);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Fetch org bundle (both departments and users)
    fetch('/api/org/bundle')
      .then((r) => r.json())
      .then((res) => {
        if (res && res.data) {
          if (Array.isArray(res.data.users) && res.data.users.length > 0) {
            setAvailableUsers(res.data.users);
          }
          if (Array.isArray(res.data.depts) && res.data.depts.length > 0) {
            setAvailableDepts(res.data.depts);
          }
        }
      })
      .catch(() => {
        // Keeps FALLBACK_USERS and FALLBACK_DEPTS
      });

    // Reset form states
    setShowAssignForm(false);
    setSelectionTab('manual');
    setNameInput('');
    setSelectedUser(null);
    setTaskDesc('');
    setPriority('重要');
    setDueDate(new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10));
    setEditingId(null);
  }, [open, targetType, targetId]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputContainerRef.current && !inputContainerRef.current.contains(e.target as Node)) {
        setShowSuggestDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered suggestions based on manual input (supports Chinese name, English username, employee number)
  const matchedUsers = useMemo(() => {
    const userList = Array.isArray(availableUsers) ? availableUsers : FALLBACK_USERS;
    if (!nameInput.trim()) return userList.slice(0, 8);
    const q = nameInput.trim().toLowerCase();
    return userList.filter((u) => {
      if (!u) return false;
      const matchNick = u.nickName && typeof u.nickName === 'string' ? u.nickName.toLowerCase().includes(q) : false;
      const matchUser = u.userName && typeof u.userName === 'string' ? u.userName.toLowerCase().includes(q) : false;
      const matchEmp = u.empNo && typeof u.empNo === 'string' ? u.empNo.toLowerCase().includes(q) : false;
      const matchDept = u.deptName && typeof u.deptName === 'string' ? u.deptName.toLowerCase().includes(q) : false;
      return matchNick || matchUser || matchEmp || matchDept;
    });
  }, [nameInput, availableUsers]);

  // Department list with employee count
  const deptsWithCount = useMemo(() => {
    const deptList = Array.isArray(availableDepts) ? availableDepts : FALLBACK_DEPTS;
    const userList = Array.isArray(availableUsers) ? availableUsers : FALLBACK_USERS;
    return deptList.map((d) => {
      if (!d) return { id: '', deptName: '未知部门', userCount: 0 };
      const count = userList.filter((u) => u && (u.deptId === d.id || (d.deptName && u.deptName === d.deptName))).length;
      return { ...d, userCount: count };
    });
  }, [availableDepts, availableUsers]);

  // Filtered users for the selected department in Org Tree view
  const deptUsers = useMemo(() => {
    const userList = Array.isArray(availableUsers) ? availableUsers : FALLBACK_USERS;
    if (selectedDeptId === 'all') {
      return userList;
    }
    const deptList = Array.isArray(availableDepts) ? availableDepts : FALLBACK_DEPTS;
    const targetDept = deptList.find((d) => d && d.id === selectedDeptId);
    return userList.filter(
      (u) => u && (u.deptId === selectedDeptId || (targetDept && targetDept.deptName && u.deptName === targetDept.deptName))
    );
  }, [selectedDeptId, availableUsers, availableDepts]);

  // Safe avatar character
  const getAvatarChar = (text?: string): string => {
    if (!text || typeof text !== 'string') return '员';
    const trimmed = text.trim();
    return trimmed ? trimmed.slice(0, 1) : '员';
  };

  // Pick user handler
  const handleSelectUser = (user: any) => {
    if (!user) return;
    setSelectedUser({
      ...user,
      isManual: false,
    });
    const displayName = user.nickName || user.userName || '未知人员';
    const displayEng = user.userName && user.userName !== displayName ? ` (${user.userName})` : '';
    setNameInput(`${displayName}${displayEng}`);
    setShowSuggestDropdown(false);
  };

  // Select custom typed name
  const handleSelectCustomTypedName = (customName: string) => {
    const trimmed = (customName || '').trim();
    if (!trimmed) return;
    const isEnglish = /^[A-Za-z0-9_.\-\s]+$/.test(trimmed);
    const customUserObj = {
      id: 'custom_' + Date.now().toString(36),
      userName: isEnglish ? trimmed : trimmed.toLowerCase(),
      nickName: trimmed,
      empNo: 'EXT-' + Math.floor(1000 + Math.random() * 9000),
      deptName: customDeptInput.trim() || '业务协同部门',
      positionName: customPosInput.trim() || '业务协作者',
      isManual: true,
    };
    setSelectedUser(customUserObj);
    setNameInput(trimmed);
    setShowSuggestDropdown(false);
  };

  // Add collaborator handler
  const handleAddCollaborator = () => {
    if (!selectedUser && !nameInput.trim()) {
      showToast('请输入人名（中文或英文）或从组织架构部门中选择协作者', 'warning');
      return;
    }

    let userToAdd = selectedUser;
    const userList = Array.isArray(availableUsers) ? availableUsers : FALLBACK_USERS;

    if (!userToAdd && nameInput.trim()) {
      const q = nameInput.trim().toLowerCase();
      // Auto resolve typed name
      const found = userList.find(
        (u) =>
          u &&
          ((u.nickName && u.nickName.toLowerCase() === q) ||
            (u.userName && u.userName.toLowerCase() === q))
      );
      if (found) {
        userToAdd = found;
      } else {
        const isEnglish = /^[A-Za-z0-9_.\-\s]+$/.test(nameInput.trim());
        userToAdd = {
          id: 'custom_' + Date.now().toString(36),
          userName: isEnglish ? nameInput.trim() : nameInput.trim().toLowerCase(),
          nickName: nameInput.trim(),
          empNo: 'EXT-' + Math.floor(1000 + Math.random() * 9000),
          deptName: customDeptInput.trim() || '业务协同部门',
          positionName: customPosInput.trim() || '业务协作者',
          isManual: true,
        };
      }
    }

    if (!userToAdd) {
      showToast('未找到对应人员，请输入有效姓名', 'warning');
      return;
    }

    const finalDisplayName = userToAdd.nickName || userToAdd.userName || nameInput.trim() || '业务协作者';
    const finalEnglishName = userToAdd.userName || userToAdd.nickName || '';

    // Check if already assigned
    const safeCollabs = Array.isArray(collaborators) ? collaborators : [];
    if (
      safeCollabs.some(
        (c) =>
          (c.userId && userToAdd.id && c.userId === userToAdd.id) ||
          (c.userName && c.userName === finalDisplayName) ||
          (c.englishName && finalEnglishName && c.englishName === finalEnglishName)
      )
    ) {
      showToast(`人员【${finalDisplayName}】已被指派为本流程/架构的协作者`, 'warning');
      return;
    }

    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const newCollab: CollaboratorItem = {
      id: 'collab_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      userId: userToAdd.id || userToAdd.userName || ('u_' + Date.now().toString(36)),
      userName: finalDisplayName,
      englishName: finalEnglishName,
      empNo: userToAdd.empNo || 'E' + Math.floor(1000 + Math.random() * 9000),
      deptName: userToAdd.deptName || customDeptInput.trim() || '业务协同部门',
      roleName: userToAdd.positionName || customPosInput.trim() || '业务协作者',
      taskDesc: taskDesc.trim() || '辅助流程责任人完成该流程架构/流程的梳理、流转图绘制及相关交付工作',
      priority,
      taskStatus: '进行中',
      dueDate: dueDate || undefined,
      assignTime: nowStr,
      assignBy: currentUserName || '流程管理员',
    };

    const updated = [...safeCollabs, newCollab];
    setCollaborators(updated);
    setShowAssignForm(false);
    setSelectedUser(null);
    setNameInput('');
    setCustomDeptInput('');
    setCustomPosInput('');
    setTaskDesc('');
    showToast(`已成功为「${targetLabel || '目标项'}」添加协作者【${newCollab.userName}】`, 'success');
  };

  // Remove collaborator handler
  const handleRemoveCollaborator = (id: string, name: string) => {
    const updated = (Array.isArray(collaborators) ? collaborators : []).filter((c) => c.id !== id);
    setCollaborators(updated);
    showToast(`已移除协作者【${name || '该人员'}】`, 'warning');
  };

  // Update status handler
  const handleStatusChange = (id: string, nextStatus: '待推进' | '进行中' | '已完成') => {
    const updated = (Array.isArray(collaborators) ? collaborators : []).map((c) =>
      c.id === id ? { ...c, taskStatus: nextStatus } : c
    );
    setCollaborators(updated);
  };

  // Save edit handler
  const handleSaveEdit = (id: string) => {
    const updated = (Array.isArray(collaborators) ? collaborators : []).map((c) =>
      c.id === id ? { ...c, taskDesc: editTaskDesc, taskStatus: editStatus } : c
    );
    setCollaborators(updated);
    setEditingId(null);
    showToast('已更新协同任务说明', 'success');
  };

  // Save all to server
  const handleSaveAll = async () => {
    setSaving(true);
    const safeCollabs = Array.isArray(collaborators) ? collaborators : [];
    try {
      const res = await fetch('/api/flow/collaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          collaborators: safeCollabs,
        }),
      });
      const data = await res.json();
      if (data && data.status === 1) {
        showToast(`已成功保存【${targetLabel || '目标'}】的协作者指派配置`, 'success');
        onSaved(safeCollabs);
        onClose();
      } else {
        showToast('保存协作者配置失败，请重试', 'error');
      }
    } catch {
      showToast('网络请求异常，已在本地暂存配置', 'warning');
      onSaved(safeCollabs);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const safeCollabsList = Array.isArray(collaborators) ? collaborators : [];

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
      <ErrorBoundary fallbackTitle="协作者弹窗发生异常" onReset={onClose}>
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[92vh] shadow-2xl border border-[#ebeef5] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#ebeef5] flex items-center justify-between bg-gradient-to-r from-[#f8faff] via-white to-[#fcfdfe]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#409eff]/10 flex items-center justify-center text-[#409eff] shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-[#1f2733]">协作者管理</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      targetType === 'arch'
                        ? 'bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff]'
                        : 'bg-[#fdf6ec] text-[#e6a23c] border border-[#faecd8]'
                    }`}
                  >
                    {targetType === 'arch' ? '流程架构' : '流程类型'}
                  </span>
                  {targetNo && (
                    <span className="text-xs font-mono text-[#909399] bg-[#f4f4f5] px-2 py-0.5 rounded">
                      {targetNo}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#606266] mt-0.5 flex items-center gap-2">
                  <span className="font-medium text-[#303133]">{targetLabel || '未命名'}</span>
                  {archPath && (
                    <>
                      <span className="text-[#c0c4cc]">/</span>
                      <span className="text-[#909399] truncate max-w-md">{archPath}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded hover:bg-[#f2f3f5] flex items-center justify-center text-[#909399] hover:text-[#303133] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Process Owner Card & Purpose Note */}
            <div className="bg-[#f0f9eb]/60 border border-[#e1f3d8] rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#67c23a] text-white text-[11px] font-medium">
                      <Shield className="w-3 h-3" />
                      流程责任人 (主责)
                    </span>
                    <span className="text-xs font-semibold text-[#303133]">
                      {ownerName || '系统管理员'}
                    </span>
                    {deptName && (
                      <span className="text-xs text-[#909399]">（{deptName}）</span>
                    )}
                  </div>
                  <p className="text-xs text-[#529b2e] leading-relaxed">
                    <strong>主责说明：</strong>责任人对本流程架构/流程规划、业务标准、全生命周期有效性负全责。
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-[#909399]">当前已指派协作者</span>
                  <div className="text-xl font-bold text-[#409eff]">{safeCollabsList.length} 人</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#e1f3d8]/80 text-xs text-[#606266] flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-[#409eff] shrink-0" />
                <span>
                  <strong>协作者定位：</strong>作为该流程架构或者流程的工作任务协同人，可手工输入人名（中文名称或者英文名称）或直接从组织架构对应部门下选择指派，辅助责任人共同完成推进工作。
                </span>
              </div>
            </div>

            {/* Collaborator Action Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#1f2733]">协作者与工作任务清单</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#f4f4f5] text-[#909399] font-mono-tabular">
                  共 {safeCollabsList.length} 项协作任务
                </span>
              </div>
              {!showAssignForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignForm(true);
                    setSelectedUser(null);
                    setNameInput('');
                  }}
                  className="h-8 px-3.5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>指派新协作者</span>
                </button>
              )}
            </div>

            {/* Assign Form Card */}
            {showAssignForm && (
              <div className="bg-[#f8faff] border border-[#d9ecff] rounded-lg p-5 space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#e1effe]">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#409eff]" />
                    <span className="text-xs font-semibold text-[#303133]">指派新协作者并分配工作任务</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAssignForm(false)}
                    className="text-xs text-[#909399] hover:text-[#606266] cursor-pointer"
                  >
                    收起
                  </button>
                </div>

                {/* Selection Mode Switcher: Manual Input vs Org Department Tree */}
                <div className="flex items-center gap-1 bg-[#ebeef5] p-1 rounded-md w-fit text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectionTab('manual')}
                    className={`px-3 py-1.5 rounded transition-all font-medium cursor-pointer flex items-center gap-1.5 ${
                      selectionTab === 'manual'
                        ? 'bg-white text-[#409eff] shadow-xs'
                        : 'text-[#606266] hover:text-[#303133]'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>手工输入人名 / 联想搜索 (中文/英文)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectionTab('orgTree')}
                    className={`px-3 py-1.5 rounded transition-all font-medium cursor-pointer flex items-center gap-1.5 ${
                      selectionTab === 'orgTree'
                        ? 'bg-white text-[#409eff] shadow-xs'
                        : 'text-[#606266] hover:text-[#303133]'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>从组织架构部门中选择某个人</span>
                  </button>
                </div>

                {/* MODE 1: Manual Input / Auto-Suggest (Chinese / English) */}
                {selectionTab === 'manual' && (
                  <div className="space-y-3 bg-white p-3.5 rounded border border-[#dcdfe6]">
                    <div className="relative" ref={inputContainerRef}>
                      <label className="block text-xs font-medium text-[#606266] mb-1.5">
                        手工输入协作者姓名 (中文名称如「张三/李四」或英文名称如「zhangsan/lisi」) <span className="text-[#f56c6c]">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Search className="w-4 h-4 text-[#909399] absolute left-3 pointer-events-none" />
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => {
                            setNameInput(e.target.value);
                            setShowSuggestDropdown(true);
                            if (selectedUser && selectedUser.userName !== e.target.value && selectedUser.nickName !== e.target.value) {
                              setSelectedUser(null);
                            }
                          }}
                          onFocus={() => setShowSuggestDropdown(true)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (matchedUsers.length > 0) {
                                handleSelectUser(matchedUsers[0]);
                              } else if (nameInput.trim()) {
                                handleSelectCustomTypedName(nameInput.trim());
                              }
                            }
                          }}
                          placeholder="请输入中文姓名(如 张三、李四) 或 英文名称/账号(如 zhangsan、lisi、flow_lead)..."
                          className="w-full h-9 pl-9 pr-24 rounded border border-[#dcdfe6] focus:border-[#409eff] text-xs outline-none bg-white transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectionTab('orgTree')}
                          className="absolute right-2 px-2.5 py-1 rounded bg-[#ecf5ff] hover:bg-[#d9ecff] text-[#409eff] text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Building2 className="w-3 h-3" />
                          <span>组织架构树</span>
                        </button>
                      </div>

                      {/* Auto-suggest dropdown */}
                      {showSuggestDropdown && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-md border border-[#ebeef5] shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-[#f2f4f8]">
                          <div className="px-3 py-1.5 bg-[#f8f9fb] text-[11px] text-[#909399] flex items-center justify-between">
                            <span>
                              {nameInput.trim()
                                ? `匹配结果 (${matchedUsers.length} 人)`
                                : '企业组织人员快捷推荐 (点击即选)'}
                            </span>
                            <span className="text-[10px]">支持中英文姓名/工号/部门匹配</span>
                          </div>

                          {matchedUsers.map((u, idx) => {
                            const isAlready = safeCollabsList.some(
                              (c) =>
                                (c.userId && u.id && c.userId === u.id) ||
                                (u.nickName && c.userName === u.nickName) ||
                                (u.userName && c.englishName === u.userName)
                            );

                            return (
                              <div
                                key={u.id || `user_${idx}`}
                                onClick={() => {
                                  if (!isAlready) handleSelectUser(u);
                                }}
                                className={`px-3 py-2 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                  isAlready
                                    ? 'bg-[#fafafa] opacity-60 cursor-not-allowed'
                                    : 'hover:bg-[#ecf5ff]'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-[#409eff]/15 text-[#409eff] font-medium text-xs flex items-center justify-center shrink-0">
                                    {getAvatarChar(u.nickName || u.userName)}
                                  </div>
                                  <div className="truncate">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-[#1f2733]">{u.nickName || u.userName}</span>
                                      {u.userName && (
                                        <span className="text-[#409eff] font-mono text-[11px]">@{u.userName}</span>
                                      )}
                                      {u.empNo && (
                                        <span className="text-[#909399] text-[10px] bg-[#f4f4f5] px-1.5 py-0.2 rounded font-mono">
                                          {u.empNo}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-[#909399] mt-0.5">
                                      {u.deptName || '业务部门'} · {u.positionName || '业务专家'}
                                    </div>
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  {isAlready ? (
                                    <span className="text-[11px] text-[#909399]">已指派</span>
                                  ) : (
                                    <span className="text-[11px] text-[#409eff] hover:underline font-medium">
                                      选择此人
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Custom Input Option if typed text doesn't strictly match */}
                          {nameInput.trim() && (
                            <div
                              onClick={() => handleSelectCustomTypedName(nameInput.trim())}
                              className="px-3 py-2.5 bg-[#fdf6ec]/60 hover:bg-[#fdf6ec] text-xs cursor-pointer flex items-center justify-between text-[#e6a23c]"
                            >
                              <div className="flex items-center gap-2">
                                <Plus className="w-3.5 h-3.5 shrink-0" />
                                <span>使用手动输入的协作者名称: <strong>「{nameInput.trim()}」</strong></span>
                              </div>
                              <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-[#faecd8] text-[#e6a23c] font-medium">
                                直接采用
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MODE 2: Pick from Organization Department Tree */}
                {selectionTab === 'orgTree' && (
                  <div className="bg-white rounded border border-[#dcdfe6] p-3 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#ebeef5]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#409eff]" />
                        <span className="text-xs font-semibold text-[#1f2733]">组织架构部门人员树</span>
                        <span className="text-[11px] text-[#909399]">请点击左侧部门，在右侧选择该部门下的某位人员</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectionTab('manual')}
                        className="text-xs text-[#409eff] hover:underline cursor-pointer"
                      >
                        切换为手工输入
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[220px]">
                      {/* Left: Department List */}
                      <div className="md:col-span-5 border border-[#ebeef5] rounded-md overflow-hidden flex flex-col bg-[#fafbfc]">
                        <div className="p-2 border-b border-[#ebeef5] bg-white">
                          <div className="relative flex items-center">
                            <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2 pointer-events-none" />
                            <input
                              type="text"
                              value={deptSearchQuery}
                              onChange={(e) => setDeptSearchQuery(e.target.value)}
                              placeholder="筛选部门..."
                              className="w-full h-7 pl-7 pr-2 rounded text-xs border border-[#dcdfe6] outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[220px] p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => setSelectedDeptId('all')}
                            className={`w-full px-2.5 py-1.5 rounded text-left text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              selectedDeptId === 'all'
                                ? 'bg-[#ecf5ff] text-[#409eff] font-medium'
                                : 'text-[#606266] hover:bg-[#f2f3f5]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <FolderTree className="w-3.5 h-3.5 shrink-0" />
                              <span>全部部门 (全员总览)</span>
                            </div>
                            <span className="text-[10px] bg-white/80 px-1.5 rounded text-[#909399]">
                              {(Array.isArray(availableUsers) ? availableUsers : []).length} 人
                            </span>
                          </button>

                          {deptsWithCount
                            .filter(
                              (d) =>
                                !deptSearchQuery.trim() ||
                                (d.deptName && d.deptName.toLowerCase().includes(deptSearchQuery.trim().toLowerCase()))
                            )
                            .map((d, dIdx) => (
                              <button
                                key={d.id || `dept_${dIdx}`}
                                type="button"
                                onClick={() => setSelectedDeptId(d.id)}
                                className={`w-full px-2.5 py-1.5 rounded text-left text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                  selectedDeptId === d.id
                                    ? 'bg-[#ecf5ff] text-[#409eff] font-medium'
                                    : 'text-[#606266] hover:bg-[#f2f3f5]'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <Folder className="w-3.5 h-3.5 shrink-0 text-[#909399]" />
                                  <span className="truncate">{d.deptName || '未命名部门'}</span>
                                </div>
                                <span className="text-[10px] bg-white/80 px-1.5 rounded text-[#909399] shrink-0 ml-1">
                                  {d.userCount || 0} 人
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Right: Department Personnel List */}
                      <div className="md:col-span-7 border border-[#ebeef5] rounded-md overflow-hidden flex flex-col bg-white">
                        <div className="px-3 py-2 bg-[#f8f9fb] border-b border-[#ebeef5] flex items-center justify-between text-xs">
                          <span className="font-medium text-[#303133]">
                            {selectedDeptId === 'all'
                              ? '全部部门人员'
                              : (Array.isArray(availableDepts) ? availableDepts : []).find((d) => d && d.id === selectedDeptId)?.deptName || '部门人员'}
                          </span>
                          <span className="text-[11px] text-[#909399]">
                            共 {deptUsers.length} 位人员 (点击直接选择)
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[220px] p-2 divide-y divide-[#f2f4f8]">
                          {deptUsers.length === 0 ? (
                            <div className="p-8 text-center text-xs text-[#909399]">该部门下暂无人员数据</div>
                          ) : (
                            deptUsers.map((u, uIdx) => {
                              if (!u) return null;
                              const isAlready = safeCollabsList.some(
                                (c) =>
                                  (c.userId && u.id && c.userId === u.id) ||
                                  (u.nickName && c.userName === u.nickName) ||
                                  (u.userName && c.englishName === u.userName)
                              );
                              const isCurrentSelected =
                                selectedUser &&
                                ((selectedUser.id && u.id && selectedUser.id === u.id) ||
                                  (selectedUser.userName && u.userName && selectedUser.userName === u.userName));

                              return (
                                <div
                                  key={u.id || `dept_user_${uIdx}`}
                                  onClick={() => {
                                    if (!isAlready) handleSelectUser(u);
                                  }}
                                  className={`py-2 px-2.5 flex items-center justify-between text-xs rounded transition-colors ${
                                    isCurrentSelected
                                      ? 'bg-[#ecf5ff] text-[#409eff] font-medium border border-[#b3d8ff]'
                                      : isAlready
                                      ? 'bg-[#fafafa] opacity-50 cursor-not-allowed'
                                      : 'hover:bg-[#f5f7fa] cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 ${
                                        isCurrentSelected
                                          ? 'bg-[#409eff] text-white'
                                          : 'bg-[#409eff]/10 text-[#409eff]'
                                      }`}
                                    >
                                      {getAvatarChar(u.nickName || u.userName)}
                                    </div>
                                    <div className="truncate">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#1f2733]">{u.nickName || u.userName}</span>
                                        {u.userName && (
                                          <span className="text-xs text-[#409eff] font-mono">@{u.userName}</span>
                                        )}
                                        {u.empNo && (
                                          <span className="text-[10px] text-[#909399] font-mono bg-[#f4f4f5] px-1.5 py-0.2 rounded">
                                            {u.empNo}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-[#909399] mt-0.5">
                                        {u.deptName || '业务部门'} · {u.positionName || '业务专员'}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="shrink-0">
                                    {isAlready ? (
                                      <span className="text-[11px] text-[#909399]">已指派</span>
                                    ) : isCurrentSelected ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#409eff]">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> 已选定
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        className="px-2 py-0.5 rounded text-[11px] bg-[#ecf5ff] hover:bg-[#409eff] text-[#409eff] hover:text-white transition-colors"
                                      >
                                        选择
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected User Banner / Confirmation Card */}
                {selectedUser ? (
                  <div className="bg-[#ecf5ff]/70 border border-[#b3d8ff] rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#409eff] text-white font-semibold text-xs flex items-center justify-center shadow-xs shrink-0">
                        {getAvatarChar(selectedUser.nickName || selectedUser.userName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#1f2733]">
                            {selectedUser.nickName || selectedUser.userName}
                          </span>
                          {selectedUser.userName && (
                            <span className="text-xs font-mono text-[#409eff]">
                              @{selectedUser.userName}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-[#909399] bg-white px-1.5 py-0.2 rounded border border-[#d9ecff]">
                            {selectedUser.empNo || '无工号'}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#67c23a] text-white font-medium">
                            {selectedUser.isManual ? '手工录入人员' : '组织架构已选定'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#606266] mt-0.5 flex items-center gap-3">
                          <span>归属部门: <strong>{selectedUser.deptName || '业务部门'}</strong></span>
                          <span>岗位/职务: <strong>{selectedUser.positionName || '业务协作者'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setNameInput('');
                      }}
                      className="text-xs text-[#409eff] hover:text-[#f56c6c] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>更换人员</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#fffbe6] border border-[#ffe58f] rounded p-2.5 text-xs text-[#d48806] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      提示：请在上方的「手工输入」或「从组织架构部门选择」中确定协作者人员后，再填写协同工作任务说明。
                    </span>
                  </div>
                )}

                {/* Priority & Due Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#606266] mb-1.5">任务优先级</label>
                    <div className="flex items-center gap-2">
                      {(['普通', '重要', '紧急'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`flex-1 h-8 rounded text-xs font-medium cursor-pointer transition-colors ${
                            priority === p
                              ? p === '紧急'
                                ? 'bg-[#fef0f0] text-[#f56c6c] border border-[#fde2e2]'
                                : p === '重要'
                                ? 'bg-[#fdf6ec] text-[#e6a23c] border border-[#faecd8]'
                                : 'bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff]'
                              : 'bg-white border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa]'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#606266] mb-1.5">期望交付日期</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] bg-white text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Task Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-[#606266]">
                      协同工作任务说明 <span className="text-[#f56c6c]">*</span>
                    </label>
                    <span className="text-[11px] text-[#909399]">点击下方快捷短语快速填入职责</span>
                  </div>
                  <textarea
                    rows={2}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="请输入指派给该协作者的具体工作任务（例如：协助责任人完成该流程架构/流程各业务节点输入输出及KCP关键控制点梳理，完成流转泳道绘制）"
                    className="w-full p-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] bg-white text-xs outline-none resize-none leading-relaxed"
                  />

                  {/* Quick Templates */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[11px] text-[#909399] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#e6a23c]" /> 快捷模板:
                    </span>
                    {taskTemplates.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTaskDesc(tpl)}
                        className="px-2 py-0.5 rounded bg-white hover:bg-[#ecf5ff] hover:text-[#409eff] border border-[#dcdfe6] text-[11px] text-[#606266] cursor-pointer transition-colors"
                      >
                        {tpl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e1effe]">
                  <button
                    type="button"
                    onClick={() => setShowAssignForm(false)}
                    className="h-8 px-3.5 rounded border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-xs text-[#606266] cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCollaborator}
                    className="h-8 px-4 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>确认添加协作者</span>
                  </button>
                </div>
              </div>
            )}

            {/* Collaborators List View */}
            {safeCollabsList.length === 0 ? (
              <div className="border border-dashed border-[#dcdfe6] rounded-lg p-10 text-center space-y-3 bg-[#fafbfc]">
                <div className="w-12 h-12 rounded-full bg-[#f4f4f5] flex items-center justify-center mx-auto text-[#909399]">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#606266]">暂未指派协作者</p>
                  <p className="text-[11px] text-[#909399] max-w-md mx-auto">
                    作为本流程架构或流程的工作任务，可以手工输入人名（中文或英文）或从组织架构对应部门下选择指派协作者，辅助责任人完成工作任务。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignForm(true);
                    setSelectedUser(null);
                    setNameInput('');
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-4 rounded bg-[#409eff] text-white text-xs font-medium hover:bg-[#3390ff] cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>立即指派协作者</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {safeCollabsList.map((c, cIdx) => {
                  const isEditing = editingId === c.id;

                  return (
                    <div
                      key={c.id || `collab_${cIdx}`}
                      className="border border-[#ebeef5] hover:border-[#c6e2ff] rounded-lg p-4 bg-white transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: User Info */}
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#409eff] to-[#3a8ee6] text-white font-medium text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {getAvatarChar(c.userName)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#1f2733]">{c.userName || '未命名'}</span>
                              {c.englishName && c.englishName !== c.userName && (
                                <span className="text-xs font-mono text-[#409eff]">@{c.englishName}</span>
                              )}
                              {c.empNo && (
                                <span className="text-[11px] font-mono text-[#909399] bg-[#f4f4f5] px-1.5 py-0.2 rounded">
                                  {c.empNo}
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                  c.priority === '紧急'
                                    ? 'bg-[#fef0f0] text-[#f56c6c] border border-[#fde2e2]'
                                    : c.priority === '重要'
                                    ? 'bg-[#fdf6ec] text-[#e6a23c] border border-[#faecd8]'
                                    : 'bg-[#f4f4f5] text-[#909399] border border-[#e4e7ed]'
                                }`}
                              >
                                {c.priority || '重要'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-[#909399] mt-0.5">
                              <span className="flex items-center gap-1">
                                <Building className="w-3 h-3 text-[#c0c4cc]" />
                                {c.deptName || '业务部门'}
                              </span>
                              {c.roleName && (
                                <span className="flex items-center gap-1">
                                  <Briefcase className="w-3 h-3 text-[#c0c4cc]" />
                                  {c.roleName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Status & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Status selector */}
                          <select
                            value={c.taskStatus || '进行中'}
                            onChange={(e) =>
                              handleStatusChange(c.id, e.target.value as '待推进' | '进行中' | '已完成')
                            }
                            className={`h-7 px-2 rounded text-xs font-medium border outline-none cursor-pointer ${
                              c.taskStatus === '已完成'
                                ? 'bg-[#f0f9eb] text-[#67c23a] border-[#e1f3d8]'
                                : c.taskStatus === '进行中'
                                ? 'bg-[#ecf5ff] text-[#409eff] border-[#d9ecff]'
                                : 'bg-[#fdf6ec] text-[#e6a23c] border-[#faecd8]'
                            }`}
                          >
                            <option value="待推进">待推进</option>
                            <option value="进行中">进行中</option>
                            <option value="已完成">已完成</option>
                          </select>

                          {/* Edit task button */}
                          {!isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(c.id);
                                setEditTaskDesc(c.taskDesc || '');
                                setEditStatus(c.taskStatus || '进行中');
                              }}
                              className="p-1.5 rounded hover:bg-[#f5f7fa] text-[#909399] hover:text-[#409eff] cursor-pointer transition-colors"
                              title="编辑任务说明"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveCollaborator(c.id, c.userName)}
                            className="p-1.5 rounded hover:bg-[#fef0f0] text-[#909399] hover:text-[#f56c6c] cursor-pointer transition-colors"
                            title="移除协作者"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Task Content */}
                      {isEditing ? (
                        <div className="space-y-2 pt-1 border-t border-[#f0f2f5]">
                          <textarea
                            rows={2}
                            value={editTaskDesc}
                            onChange={(e) => setEditTaskDesc(e.target.value)}
                            className="w-full p-2 text-xs rounded border border-[#409eff] outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 text-[11px] rounded border border-[#dcdfe6] text-[#606266] cursor-pointer"
                            >
                              取消
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(c.id)}
                              className="px-3 py-1 text-[11px] rounded bg-[#409eff] text-white font-medium cursor-pointer"
                            >
                              保存修改
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#f8f9fb] rounded p-2.5 text-xs text-[#303133] leading-relaxed border border-[#f0f2f5]">
                          <span className="text-[#909399] font-medium mr-1.5">协同工作任务:</span>
                          <span>{c.taskDesc || '辅助责任人完成该项业务工作'}</span>
                        </div>
                      )}

                      {/* Footer Meta */}
                      <div className="flex items-center justify-between text-[11px] text-[#909399] pt-1 border-t border-[#f2f4f8]">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-[#c0c4cc]" />
                            指派人: {c.assignBy || '流程管理员'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#c0c4cc]" />
                            指派时间: {c.assignTime || '2026-10-20'}
                          </span>
                        </div>
                        {c.dueDate && (
                          <span className="flex items-center gap-1 text-[#e6a23c]">
                            <Calendar className="w-3 h-3" />
                            期望交付: {c.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between">
            <span className="text-xs text-[#909399] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#409eff]" />
              支持手工输入中英文姓名或从组织架构部门选人，保存后协作者信息将实时持久化生效
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] hover:bg-[#f5f7fa] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAll}
                className="h-8 px-5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium cursor-pointer shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <span>保存中...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>保存指派并生效</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};
