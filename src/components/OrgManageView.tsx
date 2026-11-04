import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Layers,
  Eye,
  EyeOff,
  RefreshCw,
  SlidersHorizontal,
  Folder,
  FolderOpen,
  UserCheck,
  UserX,
  FileText,
  MoveHorizontal,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import {
  useTableDnDAndResize,
  TableHeaderCell,
  TableColumnConfig,
  TableResizeGuideLine,
  TableColGroup,
} from '../hooks/useTableDnDAndResize';

export const USER_TABLE_COLUMNS: TableColumnConfig[] = [
  { key: 'selection', title: '', defaultWidth: 48, minWidth: 48, fixed: 'left', canDrag: false, canResize: false, align: 'center' },
  { key: 'userNo', title: '用户编号', defaultWidth: 95, minWidth: 70, align: 'center' },
  { key: 'userName', title: '用户名称', defaultWidth: 120, minWidth: 80, align: 'center' },
  { key: 'nickName', title: '用户昵称', defaultWidth: 120, minWidth: 80, align: 'center' },
  { key: 'deptName', title: '部门', defaultWidth: 130, minWidth: 90, align: 'center' },
  { key: 'phonenumber', title: '手机号码', defaultWidth: 130, minWidth: 100, align: 'center' },
  { key: 'status', title: '状态', defaultWidth: 95, minWidth: 75, align: 'center' },
  { key: 'createTime', title: '创建时间', defaultWidth: 160, minWidth: 110, align: 'center' },
  { key: 'actions', title: '操作', defaultWidth: 240, minWidth: 200, fixed: 'right', canDrag: false, align: 'center' },
];

interface OrgManageViewProps {
  subPath: string;
  onNavigate: (path: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onRefreshDict?: () => void;
}

export const OrgManageView: React.FC<OrgManageViewProps> = ({
  subPath,
  onNavigate,
  showToast,
}) => {
  // Main module: dept (部门组织), user (用户管理), role (权限管理)
  const activeModule: 'dept' | 'user' | 'role' = useMemo(() => {
    if (subPath.includes('/org/user')) return 'user';
    if (subPath.includes('/org/role') || subPath.includes('/org/permission')) return 'role';
    return 'dept';
  }, [subPath]);

  // Sub-tabs for 部门组织: 'org' (组织架构), 'post' (岗位管理), 'job' (职位管理)
  const [activeSubTab, setActiveSubTab] = useState<'org' | 'post' | 'job'>('org');

  // Shared Org Data
  const [companyName, setCompanyName] = useState<string>('苏州全源数字科技有限公司');
  const [depts, setDepts] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // =========================================================================
  // 1. 部门组织 State & Handlers
  // =========================================================================
  const [deptSearchText, setDeptSearchText] = useState('');
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [editDeptModal, setEditDeptModal] = useState<{
    visible: boolean;
    isCreate: boolean;
    data: any;
  }>({
    visible: false,
    isCreate: false,
    data: null,
  });
  const [deleteDeptConfirm, setDeleteDeptConfirm] = useState<{
    visible: boolean;
    dept: any | null;
  }>({
    visible: false,
    dept: null,
  });
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);
  const [importDeptModalVisible, setImportDeptModalVisible] = useState(false);
  const [importDeptPreviewList, setImportDeptPreviewList] = useState<any[]>([]);

  // =========================================================================
  // 2. 用户管理 State & Handlers
  // =========================================================================
  const [userSearchText, setUserSearchText] = useState('');
  const [userSearchPhone, setUserSearchPhone] = useState('');
  const [userSearchStatus, setUserSearchStatus] = useState<string>('');
  const [userSearchBeginTime, setUserSearchBeginTime] = useState('');
  const [userSearchEndTime, setUserSearchEndTime] = useState('');
  const [showUserSearchCard, setShowUserSearchCard] = useState(true);

  // Department Tree in User View
  const [treeSearchText, setTreeSearchText] = useState('');
  const [selectedTreeDeptId, setSelectedTreeDeptId] = useState<string>('');
  const [expandedTreeKeys, setExpandedTreeKeys] = useState<Set<string>>(
    new Set(['root', 'dept_05', 'dept_10'])
  );

  // User Table Selection & Pagination
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userPageNum, setUserPageNum] = useState<number>(1);
  const [userPageSize, setUserPageSize] = useState<number>(10);
  const [userJumpPage, setUserJumpPage] = useState<string>('1');

  // User Table DnD & Resize state matching 变更记录 (EnterpriseDataGrid)
  const userTableGrid = useTableDnDAndResize({
    storageKey: 'dflow_org_user_table',
    columns: USER_TABLE_COLUMNS,
  });

  // User Modals
  const [editUserModal, setEditUserModal] = useState<{
    visible: boolean;
    isCreate: boolean;
    data: any;
  }>({
    visible: false,
    isCreate: false,
    data: null,
  });

  const [resetPwdModal, setResetPwdModal] = useState<{
    visible: boolean;
    user: any | null;
    newPassword: string;
    showPasswordText: boolean;
  }>({
    visible: false,
    user: null,
    newPassword: '',
    showPasswordText: false,
  });

  const [assignRoleModal, setAssignRoleModal] = useState<{
    visible: boolean;
    user: any | null;
    selectedRoles: string[];
  }>({
    visible: false,
    user: null,
    selectedRoles: [],
  });

  const [userDeleteConfirm, setUserDeleteConfirm] = useState<{
    visible: boolean;
    isBatch: boolean;
    user: any | null;
  }>({
    visible: false,
    isBatch: false,
    user: null,
  });

  const [importUserModal, setImportUserModal] = useState<{
    visible: boolean;
    updateExisting: boolean;
    previewList: any[];
  }>({
    visible: false,
    updateExisting: false,
    previewList: [],
  });

  // =========================================================================
  // 3. 权限管理 State
  // =========================================================================
  const [selectedRoleId, setSelectedRoleId] = useState<string>('orole_1');
  const [activePermissionTab, setActivePermissionTab] = useState<'menu' | 'field'>('menu');
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({
    orole_1: ['all', 'collab', 'property', 'design', 'execute', 'mining', 'duty', 'risk', 'system'],
    orole_2: ['collab', 'property', 'design', 'execute', 'mining', 'duty', 'risk'],
    orole_3: ['collab', 'property', 'design', 'execute', 'mining'],
    orole_4: ['collab', 'property', 'risk', 'duty'],
    orole_5: ['collab', 'property', 'duty', 'risk', 'system'],
    orole_6: ['collab', 'property', 'design', 'execute', 'duty'],
    orole_7: ['sysdoc_query', 'risk_query', '/sysdoc/indexview', '/risk/riskview', '制度查阅', '风险查阅'],
    orole_8: ['collab', 'property', 'execute', 'mining', 'duty', 'risk'],
  });

  const [roleFeaturePermissions, setRoleFeaturePermissions] = useState<Record<string, {
    sysDoc: { readOnly: boolean; canDownload: boolean; previewOnly: boolean };
    risk: { readOnly: boolean; canDownload: boolean; previewOnly: boolean };
  }>>({
    orole_1: {
      sysDoc: { readOnly: false, canDownload: true, previewOnly: false },
      risk: { readOnly: false, canDownload: true, previewOnly: false },
    },
    orole_7: {
      sysDoc: { readOnly: true, canDownload: false, previewOnly: true },
      risk: { readOnly: true, canDownload: false, previewOnly: true },
    },
  });

  const [roleFieldPermissions, setRoleFieldPermissions] = useState<Record<string, Record<string, Record<string, string>>>>({
    orole_7: {
      form_sysdoc: {
        docNo: 'masked',
        secretLevel: 'masked',
        approver: 'masked',
      },
      form_flowdoc: {
        riskNo: 'masked',
      },
    },
  });

  // Load Org Bundle
  const fetchOrgBundle = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/org/bundle');
      const json = await res.json();
      if (json.status === 1 && json.data) {
        if (json.data.companyName) {
          setCompanyName(json.data.companyName);
        }
        setDepts(json.data.depts || []);
        setPositions(json.data.positions || []);
        setJobTitles(json.data.jobTitles || []);
        setUsers(json.data.users || []);
        setRoles(json.data.roles || []);
        if (json.data.roles) {
          const pMap: Record<string, string[]> = {};
          const fMap: Record<string, any> = {};
          const fieldMap: Record<string, any> = {};
          json.data.roles.forEach((r: any) => {
            if (r.menuPermissions) pMap[r.id] = r.menuPermissions;
            if (r.featurePermissions) fMap[r.id] = r.featurePermissions;
            if (r.fieldPermissions) fieldMap[r.id] = r.fieldPermissions;
          });
          setRolePermissions((prev) => ({ ...prev, ...pMap }));
          setRoleFeaturePermissions((prev) => ({ ...prev, ...fMap }));
          setRoleFieldPermissions((prev) => ({ ...prev, ...fieldMap }));
        }
      }

      // Also ensure latest company name from company authorization API
      try {
        const compRes = await fetch('/api/system/company');
        const compJson = await compRes.json();
        if (compJson.status === 1 && compJson.data?.companyName) {
          setCompanyName(compJson.data.companyName);
        }
      } catch (err) {
        // ignore
      }
    } catch (e) {
      console.error('Failed to fetch org bundle', e);
      showToast('获取组织架构数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgBundle();
  }, []);

  // =========================================================================
  // Department Filter & Actions
  // =========================================================================
  const filteredDepts = useMemo(() => {
    if (!deptSearchText.trim()) return depts;
    const q = deptSearchText.trim().toLowerCase();
    return depts.filter(
      (d) =>
        (d.deptName && d.deptName.toLowerCase().includes(q)) ||
        (d.deptCode && d.deptCode.toLowerCase().includes(q)) ||
        (d.parentDeptName && d.parentDeptName.toLowerCase().includes(q)) ||
        (d.parentDeptCode && d.parentDeptCode.toLowerCase().includes(q))
    );
  }, [depts, deptSearchText]);

  const isAllDeptSelected =
    filteredDepts.length > 0 &&
    filteredDepts.every((d) => selectedDeptIds.includes(d.id));

  const handleSelectAllDept = (checked: boolean) => {
    if (checked) {
      const allIds = Array.from(new Set([...selectedDeptIds, ...filteredDepts.map((d) => d.id)]));
      setSelectedDeptIds(allIds);
    } else {
      const filteredIdSet = new Set(filteredDepts.map((d) => d.id));
      setSelectedDeptIds(selectedDeptIds.filter((id) => !filteredIdSet.has(id)));
    }
  };

  const handleSelectDeptRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedDeptIds((prev) => [...prev, id]);
    } else {
      setSelectedDeptIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleSaveDept = async () => {
    const { isCreate, data } = editDeptModal;
    if (!data.deptName || !data.deptName.trim()) {
      showToast('请输入部门名称', 'warning');
      return;
    }
    if (!data.deptCode || !data.deptCode.trim()) {
      showToast('请输入部门编号', 'warning');
      return;
    }

    try {
      if (isCreate) {
        const res = await fetch('/api/org/depts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.status === 1) {
          showToast(`新增子部门【${data.deptName}】成功`, 'success');
          setDepts(json.list);
          const parentObj = depts.find(
            (d) => d.deptName === data.parentDeptName || d.deptCode === data.parentDeptCode
          );
          if (parentObj) {
            setExpandedTreeKeys((prev) => new Set([...prev, parentObj.id, 'root']));
          } else {
            setExpandedTreeKeys((prev) => new Set([...prev, 'root']));
          }
          if (json.data && json.data.id) {
            setSelectedTreeDeptId(json.data.id);
          }
          setEditDeptModal({ visible: false, isCreate: false, data: null });
        } else {
          showToast(json.info || '新增失败', 'error');
        }
      } else {
        const res = await fetch(`/api/org/depts/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.status === 1) {
          showToast('修改部门成功', 'success');
          setDepts(json.list);
          setEditDeptModal({ visible: false, isCreate: false, data: null });
        } else {
          showToast(json.info || '修改失败', 'error');
        }
      }
    } catch (e) {
      console.error(e);
      showToast('保存部门失败', 'error');
    }
  };

  const handleConfirmDeleteSingleDept = async () => {
    if (!deleteDeptConfirm.dept) return;
    try {
      const res = await fetch(`/api/org/depts/${deleteDeptConfirm.dept.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast('已成功删除部门', 'success');
        setDepts(json.list);
        setSelectedDeptIds((prev) => prev.filter((id) => id !== deleteDeptConfirm.dept.id));
        setDeleteDeptConfirm({ visible: false, dept: null });
      } else {
        showToast(json.info || '删除失败', 'error');
      }
    } catch (e) {
      showToast('删除失败', 'error');
    }
  };

  const handleConfirmBatchDeleteDept = async () => {
    try {
      const res = await fetch('/api/org/depts/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedDeptIds }),
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast(json.info || '批量删除成功', 'success');
        setDepts(json.list);
        setSelectedDeptIds([]);
        setBatchDeleteConfirm(false);
      } else {
        showToast(json.info || '批量删除失败', 'error');
      }
    } catch (e) {
      showToast('批量删除失败', 'error');
    }
  };

  const handleConfirmImportDept = async () => {
    if (importDeptPreviewList.length === 0) {
      showToast('无可导入的数据', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/org/depts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: importDeptPreviewList }),
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast(json.info || '成功导入部门数据', 'success');
        setDepts(json.list);
        setImportDeptModalVisible(false);
      } else {
        showToast(json.info || '导入失败', 'error');
      }
    } catch (e) {
      showToast('导入部门失败', 'error');
    }
  };

  const handleResetDeptToDefault = async () => {
    try {
      const res = await fetch('/api/org/depts/reset', { method: 'POST' });
      const json = await res.json();
      if (json.status === 1) {
        setDepts(json.list);
        setSelectedDeptIds([]);
        showToast('已恢复设计稿 11 个预置组织部门', 'success');
      }
    } catch (e) {
      showToast('重置部门失败', 'error');
    }
  };

  // =========================================================================
  // User Management Filter & Logic
  // =========================================================================
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Tree Department Filter
    if (selectedTreeDeptId) {
      const selectedDept = depts.find((d) => d.id === selectedTreeDeptId);
      if (selectedDept) {
        const targetDeptCodes = [selectedDept.deptCode];
        depts.forEach((d) => {
          if (d.parentDeptCode === selectedDept.deptCode) {
            targetDeptCodes.push(d.deptCode);
          }
        });
        result = result.filter(
          (u) => u.deptId === selectedTreeDeptId || targetDeptCodes.includes(u.deptCode)
        );
      } else {
        result = result.filter((u) => u.deptId === selectedTreeDeptId);
      }
    }

    // Top Filter Inputs
    if (userSearchText.trim()) {
      const q = userSearchText.trim().toLowerCase();
      result = result.filter(
        (u) =>
          (u.userName && u.userName.toLowerCase().includes(q)) ||
          (u.nickName && u.nickName.toLowerCase().includes(q)) ||
          (u.empNo && u.empNo.toLowerCase().includes(q))
      );
    }

    if (userSearchPhone.trim()) {
      const p = userSearchPhone.trim();
      result = result.filter((u) => u.phonenumber && u.phonenumber.includes(p));
    }

    if (userSearchStatus !== '') {
      result = result.filter((u) => String(u.status) === String(userSearchStatus));
    }

    if (userSearchBeginTime) {
      result = result.filter((u) => u.createTime >= userSearchBeginTime);
    }
    if (userSearchEndTime) {
      result = result.filter((u) => u.createTime <= userSearchEndTime + ' 23:59:59');
    }

    return result;
  }, [
    users,
    selectedTreeDeptId,
    userSearchText,
    userSearchPhone,
    userSearchStatus,
    userSearchBeginTime,
    userSearchEndTime,
    depts,
  ]);

  // Paginated Users
  const totalUserCount = filteredUsers.length;
  const totalUserPages = Math.max(1, Math.ceil(totalUserCount / userPageSize));
  const currentPageSafe = Math.min(Math.max(1, userPageNum), totalUserPages);
  const pagedUsers = useMemo(() => {
    const start = (currentPageSafe - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, currentPageSafe, userPageSize]);

  // User Selection
  const isAllUserSelected =
    pagedUsers.length > 0 && pagedUsers.every((u) => selectedUserIds.includes(u.id));

  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      const pagedIds = pagedUsers.map((u) => u.id);
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...pagedIds])));
    } else {
      const pagedIdSet = new Set(pagedUsers.map((u) => u.id));
      setSelectedUserIds((prev) => prev.filter((id) => !pagedIdSet.has(id)));
    }
  };

  const handleSelectUserRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds((prev) => [...prev, id]);
    } else {
      setSelectedUserIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Toggle User Status (正常 / 停用)
  const handleToggleUserStatus = async (user: any) => {
    const nextStatus = user.status === '0' ? '1' : '0';
    try {
      const res = await fetch(`/api/org/users/${user.id}/change-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.status === 1) {
        setUsers(json.list);
        showToast(
          `用户【${user.nickName || user.userName}】已${nextStatus === '0' ? '启用' : '停用'}`,
          'success'
        );
      } else {
        showToast(json.info || '状态切换失败', 'error');
      }
    } catch (e) {
      showToast('切换用户状态失败', 'error');
    }
  };

  // Save User (Add / Edit)
  const handleSaveUser = async () => {
    const { isCreate, data } = editUserModal;
    if (!data.userName || !data.userName.trim()) {
      showToast('请输入用户登录名称', 'warning');
      return;
    }
    if (!data.nickName || !data.nickName.trim()) {
      showToast('请输入用户昵称/真实姓名', 'warning');
      return;
    }
    if (isCreate && (!data.password || data.password.length < 6)) {
      showToast('初始密码长度至少需6位', 'warning');
      return;
    }

    try {
      if (isCreate) {
        const res = await fetch('/api/org/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.status === 1) {
          showToast('新增用户成功', 'success');
          setUsers(json.list);
          setEditUserModal({ visible: false, isCreate: false, data: null });
        } else {
          showToast(json.info || '新增用户失败', 'error');
        }
      } else {
        const res = await fetch(`/api/org/users/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.status === 1) {
          showToast('修改用户信息成功', 'success');
          setUsers(json.list);
          setEditUserModal({ visible: false, isCreate: false, data: null });
        } else {
          showToast(json.info || '修改用户失败', 'error');
        }
      }
    } catch (e) {
      showToast('保存用户失败', 'error');
    }
  };

  // Reset Password Save
  const handleConfirmResetPwd = async () => {
    const { user, newPassword } = resetPwdModal;
    if (!user) return;
    if (!newPassword || newPassword.trim().length < 6) {
      showToast('重置密码长度不能少于6位', 'warning');
      return;
    }

    try {
      const res = await fetch(`/api/org/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPassword.trim() }),
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast(json.info || '密码重置成功', 'success');
        setResetPwdModal({ visible: false, user: null, newPassword: '', showPasswordText: false });
      } else {
        showToast(json.info || '重置失败', 'error');
      }
    } catch (e) {
      showToast('重置密码异常', 'error');
    }
  };

  // Assign Roles Save
  const handleConfirmAssignRoles = async () => {
    const { user, selectedRoles } = assignRoleModal;
    if (!user) return;
    if (selectedRoles.length === 0) {
      showToast('请至少为该用户分配一个角色', 'warning');
      return;
    }

    try {
      const res = await fetch(`/api/org/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleNames: selectedRoles }),
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast(`已成功为【${user.nickName || user.userName}】分配角色`, 'success');
        setUsers(json.list);
        setAssignRoleModal({ visible: false, user: null, selectedRoles: [] });
      } else {
        showToast(json.info || '角色分配失败', 'error');
      }
    } catch (e) {
      showToast('保存角色失败', 'error');
    }
  };

  // Delete User Confirm (Single or Batch)
  const handleConfirmDeleteUser = async () => {
    const { isBatch, user } = userDeleteConfirm;
    try {
      if (isBatch) {
        const res = await fetch('/api/org/users/batch-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedUserIds }),
        });
        const json = await res.json();
        if (json.status === 1) {
          showToast(json.info || '批量删除用户成功', 'success');
          setUsers(json.list);
          setSelectedUserIds([]);
          setUserDeleteConfirm({ visible: false, isBatch: false, user: null });
        } else {
          showToast(json.info || '批量删除失败', 'error');
        }
      } else if (user) {
        const res = await fetch(`/api/org/users/${user.id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.status === 1) {
          showToast(json.info || '删除用户成功', 'success');
          setUsers(json.list);
          setSelectedUserIds((prev) => prev.filter((id) => id !== user.id));
          setUserDeleteConfirm({ visible: false, isBatch: false, user: null });
        } else {
          showToast(json.info || '删除失败', 'error');
        }
      }
    } catch (e) {
      showToast('删除操作失败', 'error');
    }
  };

  // Export Users to CSV
  const handleExportUsers = () => {
    if (filteredUsers.length === 0) {
      showToast('暂无匹配用户可导出', 'warning');
      return;
    }
    const headers = ['用户编号', '登录账号', '真实姓名', '所属部门', '岗位/职务', '角色权限', '手机号码', '邮箱', '状态', '创建时间'];
    const rows = filteredUsers.map((u) => [
      u.userNo || u.empNo || '',
      `"${(u.userName || '').replace(/"/g, '""')}"`,
      `"${(u.nickName || '').replace(/"/g, '""')}"`,
      `"${(u.deptName || '').replace(/"/g, '""')}"`,
      `"${(u.positionName || '普通员工').replace(/"/g, '""')}"`,
      `"${(u.roleNames || []).join(';')}"`,
      `\t${u.phonenumber || ''}`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      u.status === '0' ? '正常' : '停用',
      u.createTime || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `企业用户花名册_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`成功导出 ${filteredUsers.length} 位用户数据`, 'success');
  };

  // Open Import Modal with Default Samples
  const handleOpenUserImport = () => {
    setImportUserModal({
      visible: true,
      updateExisting: false,
      previewList: [
        {
          userName: 'zhangsan',
          nickName: '张三',
          deptName: '软件开发部',
          phonenumber: '13911112222',
          email: 'zhangsan@dflow.com',
          positionName: '后端架构师',
          roleNames: ['普通员工'],
          status: '0',
        },
        {
          userName: 'lisi',
          nickName: '李四',
          deptName: '流程管理部',
          phonenumber: '13933334444',
          email: 'lisi@dflow.com',
          positionName: '流程推进专员',
          roleNames: ['流程管理员'],
          status: '0',
        },
        {
          userName: 'wangwu',
          nickName: '王五',
          deptName: '权责管理部',
          phonenumber: '13955556666',
          email: 'wangwu@dflow.com',
          positionName: '合规审计员',
          roleNames: ['合规风控官'],
          status: '0',
        },
      ],
    });
  };

  // Confirm User Import
  const handleConfirmUserImport = async () => {
    const { previewList, updateExisting } = importUserModal;
    if (previewList.length === 0) {
      showToast('无可导入的数据', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/org/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: previewList, updateExisting }),
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast(json.info || '用户数据导入成功', 'success');
        setUsers(json.list);
        setImportUserModal({ visible: false, updateExisting: false, previewList: [] });
      } else {
        showToast(json.info || '导入用户失败', 'error');
      }
    } catch (e) {
      showToast('导入请求异常', 'error');
    }
  };

  // Reset Users to Default
  const handleResetUsersToDefault = async () => {
    try {
      const res = await fetch('/api/org/users/reset', { method: 'POST' });
      const json = await res.json();
      if (json.status === 1) {
        setUsers(json.list);
        setSelectedUserIds([]);
        setUserPageNum(1);
        showToast('已重置为系统出厂预设用户数据', 'success');
      }
    } catch (e) {
      showToast('重置用户数据失败', 'error');
    }
  };

  // Generate Random Safe Password
  const generateRandomPassword = () => {
    const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Filtered Tree Departments
  const treeDepts = useMemo(() => {
    if (!treeSearchText.trim()) return depts;
    const q = treeSearchText.trim().toLowerCase();
    return depts.filter(
      (d) =>
        d.deptName.toLowerCase().includes(q) ||
        (d.deptCode && d.deptCode.toLowerCase().includes(q))
    );
  }, [depts, treeSearchText]);

  // Hierarchical Department Tree Nodes
  const rootChildren = useMemo(() => {
    return treeDepts.filter((d) => !d.parentDeptCode || d.parentDeptCode === '');
  }, [treeDepts]);

  const getSubDepts = (parentCode: string) => {
    return treeDepts.filter((d) => d.parentDeptCode === parentCode);
  };

  const toggleTreeNode = (key: string) => {
    setExpandedTreeKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Helper to open Create Sub-Department modal with designated parent
  const handleCreateSubDept = (parentDept?: any) => {
    const parent =
      parentDept ||
      depts.find((d) => d.id === selectedTreeDeptId) || {
        deptName: companyName,
        deptCode: '',
      };

    const randomSuffix = Math.floor(Math.random() * 89 + 10);
    const suggestedCode = parent.deptCode ? `${parent.deptCode}${randomSuffix}` : `00${randomSuffix}`;

    setEditDeptModal({
      visible: true,
      isCreate: true,
      data: {
        deptName: '',
        deptCode: suggestedCode,
        parentDeptName: parent.deptName,
        parentDeptCode: parent.deptCode || '',
        leader: '',
        phone: '',
      },
    });
  };

  // Helper to open Add User modal under selected or specified department
  const handleAddUserInDept = (targetDept?: any) => {
    const d =
      targetDept ||
      depts.find((item) => item.id === selectedTreeDeptId) ||
      depts[0] || {
        id: 'dept_01',
        deptName: '系统管理部',
        deptCode: '0010',
      };

    setEditUserModal({
      visible: true,
      isCreate: true,
      data: {
        userName: '',
        nickName: '',
        deptId: d.id,
        deptName: d.deptName,
        deptCode: d.deptCode,
        positionName: '知识运营专家',
        roleNames: ['普通员工'],
        phonenumber: '',
        email: '',
        sex: '0',
        status: '0',
        password: generateRandomPassword(),
        remark: `归属于【${d.deptName}】部门`,
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F0F2F5] p-3 overflow-hidden select-none">
      {/* ============================================================== */}
      {/* 1. 部门组织 模块 */}
      {/* ============================================================== */}
      {activeModule === 'dept' && (
        <>
          {/* Top Sub-tabs (组织架构 / 岗位管理 / 职位管理) */}
          <div className="flex items-center gap-1 mb-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('org')}
              className={`px-4 py-1.5 text-xs font-medium rounded-t border-t border-x transition-colors cursor-pointer ${
                activeSubTab === 'org'
                  ? 'bg-white border-[#E4E7ED] text-[#2F7BFE] border-b-white relative -mb-[1px] z-10'
                  : 'bg-[#E5E9F2] border-transparent text-[#606266] hover:bg-[#DCDFE6]'
              }`}
            >
              组织架构
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('post')}
              className={`px-4 py-1.5 text-xs font-medium rounded-t border-t border-x transition-colors cursor-pointer ${
                activeSubTab === 'post'
                  ? 'bg-white border-[#E4E7ED] text-[#2F7BFE] border-b-white relative -mb-[1px] z-10'
                  : 'bg-[#E5E9F2] border-transparent text-[#606266] hover:bg-[#DCDFE6]'
              }`}
            >
              岗位管理
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('job')}
              className={`px-4 py-1.5 text-xs font-medium rounded-t border-t border-x transition-colors cursor-pointer ${
                activeSubTab === 'job'
                  ? 'bg-white border-[#E4E7ED] text-[#2F7BFE] border-b-white relative -mb-[1px] z-10'
                  : 'bg-[#E5E9F2] border-transparent text-[#606266] hover:bg-[#DCDFE6]'
              }`}
            >
              职位管理
            </button>
          </div>

          {/* Sub Tab: 组织架构 */}
          {activeSubTab === 'org' && (
            <>
              {/* Search and Action Bar */}
              <div className="bg-white rounded border border-[#E4E7ED] p-3 mb-3 flex items-center justify-between gap-3 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={deptSearchText}
                      onChange={(e) => setDeptSearchText(e.target.value)}
                      placeholder="搜索部门名称/编号/父部门..."
                      className="w-full h-8 pl-3 pr-8 rounded border border-[#DCDFE6] text-xs focus:border-[#2F7BFE] focus:outline-none transition-colors"
                    />
                    {deptSearchText && (
                      <button
                        type="button"
                        onClick={() => setDeptSearchText('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#C0C4CC] hover:text-[#909399] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      showToast(`已筛选出 ${filteredDepts.length} 个部门`, 'info');
                    }}
                    className="h-8 px-3 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>查询</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeptSearchText('');
                      setSelectedDeptIds([]);
                    }}
                    className="h-8 px-3 rounded border border-[#DCDFE6] hover:bg-[#F5F7FA] text-[#606266] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重置</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImportDeptPreviewList([
                        {
                          deptName: '质量保证部',
                          deptCode: '0060',
                          parentDeptName: companyName,
                          parentDeptCode: '',
                          leader: '质量总监',
                          phone: '010-880060',
                        },
                        {
                          deptName: '云原生运维组',
                          deptCode: '0045',
                          parentDeptName: '研发管理中心',
                          parentDeptCode: '0050',
                          leader: '运维主管',
                          phone: '010-880045',
                        },
                      ]);
                      setImportDeptModalVisible(true);
                    }}
                    className="h-8 px-3 rounded border border-[#DCDFE6] hover:border-[#2F7BFE] hover:text-[#2F7BFE] text-[#606266] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer bg-white"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#2F7BFE]" />
                    <span>导入</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDeptIds.length === 0) {
                        showToast('请先在表格左侧勾选需要删除的部门', 'warning');
                        return;
                      }
                      setBatchDeleteConfirm(true);
                    }}
                    disabled={selectedDeptIds.length === 0}
                    className={`h-8 px-3 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                      selectedDeptIds.length > 0
                        ? 'border border-[#FDE2E2] bg-[#FEF0F0] text-[#F56C6C] hover:bg-[#F56C6C] hover:text-white'
                        : 'border border-[#E4E7ED] bg-[#F5F7FA] text-[#C0C4CC] cursor-not-allowed'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>删除 {selectedDeptIds.length > 0 ? `(${selectedDeptIds.length})` : ''}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDeptToDefault}
                    className="h-8 px-3 rounded border border-[#DCDFE6] hover:border-[#E6A23C] hover:text-[#E6A23C] text-[#909399] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer bg-white"
                    title="恢复为设计稿默认的11个部门"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重置预设</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditDeptModal({
                        visible: true,
                        isCreate: true,
                        data: {
                          deptName: '',
                          deptCode: '',
                          parentDeptName: companyName,
                          parentDeptCode: '',
                          leader: '',
                          phone: '',
                        },
                      })
                    }
                    className="h-8 px-3.5 rounded bg-[#ECF5FF] hover:bg-[#2F7BFE] text-[#2F7BFE] hover:text-white border border-[#B3D8FF] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新增部门</span>
                  </button>
                </div>
              </div>

              {/* Department Data Table */}
              <div className="flex-1 bg-white rounded border border-[#E4E7ED] flex flex-col min-h-0 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead className="bg-[#FAFAFA] text-[#606266] border-b border-[#E4E7ED] sticky top-0 z-10 font-normal">
                      <tr className="h-11">
                        <th className="w-12 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isAllDeptSelected}
                            onChange={(e) => handleSelectAllDept(e.target.checked)}
                            className="w-4 h-4 rounded border-[#DCDFE6] text-[#2F7BFE] focus:ring-0 cursor-pointer align-middle"
                          />
                        </th>
                        <th className="py-2.5 px-4 font-normal text-[#606266]">部门名称</th>
                        <th className="py-2.5 px-4 font-normal text-[#606266]">部门编号</th>
                        <th className="py-2.5 px-4 font-normal text-[#606266]">父部门名称</th>
                        <th className="py-2.5 px-4 font-normal text-[#606266]">父部门编号</th>
                        <th className="w-32 py-2.5 px-4 font-normal text-[#606266]">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E7ED] text-[#303133]">
                      {filteredDepts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-[#909399]">
                            暂无匹配的组织部门记录
                          </td>
                        </tr>
                      ) : (
                        filteredDepts.map((d) => {
                          const isSelected = selectedDeptIds.includes(d.id);
                          return (
                            <tr
                              key={d.id}
                              className={`h-12 transition-colors ${
                                isSelected ? 'bg-[#F2F7FF]' : 'hover:bg-[#F9FAFB]'
                              }`}
                            >
                              <td className="w-12 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => handleSelectDeptRow(d.id, e.target.checked)}
                                  className="w-4 h-4 rounded border-[#DCDFE6] text-[#2F7BFE] focus:ring-0 cursor-pointer align-middle"
                                />
                              </td>
                              <td className="py-2 px-4 text-[#303133] font-medium">{d.deptName}</td>
                              <td className="py-2 px-4 text-[#303133] font-mono">{d.deptCode}</td>
                              <td className="py-2 px-4 text-[#303133]">{d.parentDeptName || ''}</td>
                              <td className="py-2 px-4 text-[#303133] font-mono">
                                {d.parentDeptCode || ''}
                              </td>
                              <td className="py-2 px-4 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditDeptModal({
                                        visible: true,
                                        isCreate: false,
                                        data: { ...d },
                                      })
                                    }
                                    className="text-[#2F7BFE] hover:underline cursor-pointer"
                                  >
                                    修改
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteDeptConfirm({
                                        visible: true,
                                        dept: d,
                                      })
                                    }
                                    className="text-[#F56C6C] hover:underline cursor-pointer"
                                  >
                                    删除
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="h-10 bg-white border-t border-[#E4E7ED] px-4 flex items-center justify-between text-xs text-[#909399] shrink-0">
                  <div>
                    共 <span className="text-[#303133] font-medium">{filteredDepts.length}</span>{' '}
                    个部门组织
                    {selectedDeptIds.length > 0 && (
                      <span className="ml-2 text-[#2F7BFE]">
                        已勾选 {selectedDeptIds.length} 项
                      </span>
                    )}
                  </div>
                  <div>系统标准组织模型 · 树状层级关系已同步</div>
                </div>
              </div>
            </>
          )}

          {/* Sub Tab: 岗位管理 */}
          {activeSubTab === 'post' && (
            <div className="flex-1 bg-white rounded border border-[#E4E7ED] p-4 flex flex-col min-h-0 overflow-hidden shadow-xs">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#606266] font-medium">企业岗位库</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#ECF5FF] text-[#2F7BFE] text-[11px]">
                    {positions.length} 个岗位
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-auto border border-[#E4E7ED] rounded">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#FAFAFA] text-[#606266] border-b border-[#E4E7ED]">
                    <tr className="h-10">
                      <th className="py-2 px-3">岗位编号</th>
                      <th className="py-2 px-3">岗位名称</th>
                      <th className="py-2 px-3">归属部门</th>
                      <th className="py-2 px-3">排序号</th>
                      <th className="py-2 px-3 text-center">状态</th>
                      <th className="py-2 px-3">创建时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7ED] text-[#303133]">
                    {positions.map((p) => (
                      <tr key={p.id} className="h-11 hover:bg-[#F9FAFB]">
                        <td className="py-2 px-3 font-mono text-[#606266]">{p.postCode}</td>
                        <td className="py-2 px-3 font-medium">{p.postName}</td>
                        <td className="py-2 px-3 text-[#2F7BFE]">{p.deptName}</td>
                        <td className="py-2 px-3 font-mono">{p.sort}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-[#F0F9EB] text-[#67C23A] text-[11px]">
                            正常
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[#909399] font-mono">{p.createTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub Tab: 职位管理 */}
          {activeSubTab === 'job' && (
            <div className="flex-1 bg-white rounded border border-[#E4E7ED] p-4 flex flex-col min-h-0 overflow-hidden shadow-xs">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#606266] font-medium">企业职级与职系库</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#ECF5FF] text-[#2F7BFE] text-[11px]">
                    {jobTitles.length} 个职级
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-auto border border-[#E4E7ED] rounded">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#FAFAFA] text-[#606266] border-b border-[#E4E7ED]">
                    <tr className="h-10">
                      <th className="py-2 px-3">职级编码</th>
                      <th className="py-2 px-3">职级名称</th>
                      <th className="py-2 px-3">职级等阶</th>
                      <th className="py-2 px-3">所属职系</th>
                      <th className="py-2 px-3">职责概述</th>
                      <th className="py-2 px-3 text-center">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7ED] text-[#303133]">
                    {jobTitles.map((j) => (
                      <tr key={j.id} className="h-11 hover:bg-[#F9FAFB]">
                        <td className="py-2 px-3 font-mono text-[#606266]">{j.jobCode}</td>
                        <td className="py-2 px-3 font-medium">{j.jobName}</td>
                        <td className="py-2 px-3 font-mono text-[#2F7BFE] font-semibold">
                          {j.rankLevel}
                        </td>
                        <td className="py-2 px-3 text-[#606266]">{j.jobSeries}</td>
                        <td className="py-2 px-3 text-[#909399] truncate max-w-xs">{j.remark}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-[#F0F9EB] text-[#67C23A] text-[11px]">
                            正常
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* 2. 用户管理 模块 (如设计稿所示，高保真还原左侧部门树+右侧用户表+完整功能) */}
      {/* ============================================================== */}
      {activeModule === 'user' && (
        <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
          {/* 左侧：部门组织树 (支持输入部门过滤、折叠展开、手动创建子部门、选定部门新增用户) */}
          <div className="w-[280px] bg-white rounded border border-[#E4E7ED] p-3 flex flex-col shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            {/* Search Input */}
            <div className="mb-2 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={treeSearchText}
                  onChange={(e) => setTreeSearchText(e.target.value)}
                  placeholder="输入部门名称"
                  className="w-full h-8 pl-8 pr-7 rounded border border-[#DCDFE6] text-xs focus:border-[#2F7BFE] focus:outline-none transition-colors"
                />
                <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                {treeSearchText && (
                  <button
                    type="button"
                    onClick={() => setTreeSearchText('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#C0C4CC] hover:text-[#909399] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions Bar for Selected / Default Dept */}
            <div className="flex items-center gap-1.5 mb-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleCreateSubDept()}
                className="flex-1 h-7 rounded border border-[#B3D8FF] bg-[#ECF5FF] hover:bg-[#2F7BFE] text-[#2F7BFE] hover:text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                title={
                  selectedTreeDeptId
                    ? `在已选部门【${depts.find((d) => d.id === selectedTreeDeptId)?.deptName}】下创建子部门`
                    : '在根机构下创建部门'
                }
              >
                <Plus className="w-3 h-3" />
                <span>创建子部门</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddUserInDept()}
                className="flex-1 h-7 rounded border border-[#C2E7B0] bg-[#F0F9EB] hover:bg-[#67C23A] text-[#67C23A] hover:text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                title={
                  selectedTreeDeptId
                    ? `在已选部门【${depts.find((d) => d.id === selectedTreeDeptId)?.deptName}】下新增用户`
                    : '在当前选定部门下新增用户'
                }
              >
                <Plus className="w-3 h-3" />
                <span>部门下加人</span>
              </button>
            </div>

            {/* Tree Container */}
            <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 text-xs text-[#606266]">
              {/* Root Node: {companyName} */}
              <div>
                <div
                  onClick={() => setSelectedTreeDeptId('')}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                    selectedTreeDeptId === ''
                      ? 'bg-[#ECF5FF] text-[#2F7BFE] font-medium'
                      : 'hover:bg-[#F5F7FA] text-[#303133]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTreeNode('root');
                      }}
                      className="text-[#909399] hover:text-[#303133] cursor-pointer"
                    >
                      {expandedTreeKeys.has('root') ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <Building2 className="w-3.5 h-3.5 text-[#2F7BFE] shrink-0" />
                    <span className="truncate" title={companyName}>{companyName}</span>
                  </div>

                  {/* Actions & Count */}
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateSubDept({ deptName: companyName, deptCode: '' });
                        }}
                        className="px-1.5 py-0.5 rounded bg-white border border-[#B3D8FF] text-[10px] text-[#2F7BFE] hover:bg-[#2F7BFE] hover:text-white cursor-pointer"
                        title={`在${companyName}下创建一级部门`}
                      >
                        +部门
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddUserInDept({ id: 'dept_01', deptName: '系统管理部', deptCode: '0010' });
                        }}
                        className="px-1.5 py-0.5 rounded bg-white border border-[#C2E7B0] text-[10px] text-[#67C23A] hover:bg-[#67C23A] hover:text-white cursor-pointer"
                        title="新增用户"
                      >
                        +用户
                      </button>
                    </div>
                    <span className="text-[11px] font-mono text-[#909399] ml-1">
                      {users.length}
                    </span>
                  </div>
                </div>

                {/* Root Children Nodes */}
                {expandedTreeKeys.has('root') && (
                  <div className="pl-3.5 border-l border-[#EBEEF5] ml-3.5 mt-0.5 space-y-0.5">
                    {rootChildren.map((dept) => {
                      const subChildren = getSubDepts(dept.deptCode);
                      const hasSub = subChildren.length > 0;
                      const isExpanded = expandedTreeKeys.has(dept.id);
                      const isSelected = selectedTreeDeptId === dept.id;

                      const deptUserCount = users.filter((u) => {
                        if (u.deptId === dept.id) return true;
                        if (hasSub && subChildren.some((s) => s.id === u.deptId)) return true;
                        return false;
                      }).length;

                      return (
                        <div key={dept.id}>
                          <div
                            onClick={() => setSelectedTreeDeptId(dept.id)}
                            className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#ECF5FF] text-[#2F7BFE] font-medium'
                                : 'hover:bg-[#F5F7FA] text-[#606266]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {hasSub ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTreeNode(dept.id);
                                  }}
                                  className="text-[#909399] hover:text-[#303133] cursor-pointer"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              ) : (
                                <span className="w-3.5 inline-block" />
                              )}
                              <Folder className="w-3.5 h-3.5 text-[#E6A23C] shrink-0" />
                              <span className="truncate">{dept.deptName}</span>
                            </div>

                            {/* Node Actions on hover/select */}
                            <div className="flex items-center gap-1 shrink-0">
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateSubDept(dept);
                                  }}
                                  className="px-1 py-0.5 rounded bg-white border border-[#B3D8FF] text-[10px] text-[#2F7BFE] hover:bg-[#2F7BFE] hover:text-white cursor-pointer"
                                  title={`在【${dept.deptName}】下创建子部门`}
                                >
                                  +部门
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddUserInDept(dept);
                                  }}
                                  className="px-1 py-0.5 rounded bg-white border border-[#C2E7B0] text-[10px] text-[#67C23A] hover:bg-[#67C23A] hover:text-white cursor-pointer"
                                  title={`在【${dept.deptName}】下新增用户`}
                                >
                                  +用户
                                </button>
                              </div>
                              <span className="text-[10px] font-mono text-[#909399] ml-1">
                                {deptUserCount}
                              </span>
                            </div>
                          </div>

                          {/* Sub Children (e.g. 研发管理中心下的 结构开发部, 软件开发部等) */}
                          {hasSub && isExpanded && (
                            <div className="pl-3.5 border-l border-[#EBEEF5] ml-3.5 mt-0.5 space-y-0.5">
                              {subChildren.map((sub) => {
                                const isSubSelected = selectedTreeDeptId === sub.id;
                                const subCount = users.filter((u) => u.deptId === sub.id).length;
                                return (
                                  <div
                                    key={sub.id}
                                    onClick={() => setSelectedTreeDeptId(sub.id)}
                                    className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                                      isSubSelected
                                        ? 'bg-[#ECF5FF] text-[#2F7BFE] font-medium'
                                        : 'hover:bg-[#F5F7FA] text-[#606266]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="w-2.5 inline-block" />
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#C0C4CC] shrink-0" />
                                      <span className="truncate">{sub.deptName}</span>
                                    </div>

                                    {/* Sub node action buttons */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCreateSubDept(sub);
                                          }}
                                          className="px-1 py-0.5 rounded bg-white border border-[#B3D8FF] text-[10px] text-[#2F7BFE] hover:bg-[#2F7BFE] hover:text-white cursor-pointer"
                                          title={`在【${sub.deptName}】下创建子部门`}
                                        >
                                          +部门
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddUserInDept(sub);
                                          }}
                                          className="px-1 py-0.5 rounded bg-white border border-[#C2E7B0] text-[10px] text-[#67C23A] hover:bg-[#67C23A] hover:text-white cursor-pointer"
                                          title={`在【${sub.deptName}】下新增用户`}
                                        >
                                          +用户
                                        </button>
                                      </div>
                                      <span className="text-[10px] font-mono text-[#909399] ml-1">
                                        {subCount}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Tree Footer / Quick Reset */}
            <div className="pt-2 border-t border-[#EBEEF5] mt-2 flex flex-col gap-1.5 text-[11px] text-[#909399] shrink-0">
              <div className="flex items-center justify-between">
                <span className="truncate max-w-[170px]">
                  已选:{' '}
                  <strong className="text-[#303133]">
                    {selectedTreeDeptId
                      ? depts.find((d) => d.id === selectedTreeDeptId)?.deptName
                      : '全集团人员'}
                  </strong>
                </span>
                {selectedTreeDeptId && (
                  <button
                    type="button"
                    onClick={() => setSelectedTreeDeptId('')}
                    className="text-[#2F7BFE] hover:underline cursor-pointer shrink-0"
                  >
                    全部
                  </button>
                )}
              </div>

              {selectedTreeDeptId && (
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCreateSubDept()}
                    className="flex-1 py-1 rounded bg-[#F2F7FF] hover:bg-[#2F7BFE] text-[#2F7BFE] hover:text-white text-[10px] text-center transition-colors cursor-pointer"
                  >
                    + 建子部门
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddUserInDept()}
                    className="flex-1 py-1 rounded bg-[#F0F9EB] hover:bg-[#67C23A] text-[#67C23A] hover:text-white text-[10px] text-center transition-colors cursor-pointer"
                  >
                    + 选定加人
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：用户查询表单 + 顶部操作条 + 数据表格 + 分页栏 */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden gap-2.5">
            {/* 1. 顶部查询表单卡片 (可切换显隐) */}
            {showUserSearchCard && (
              <div className="bg-white rounded border border-[#E4E7ED] p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] shrink-0 animate-in fade-in duration-100">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 text-xs text-[#606266]">
                  {/* 用户名称 */}
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap font-medium text-[#303133]">用户名称</span>
                    <input
                      type="text"
                      value={userSearchText}
                      onChange={(e) => {
                        setUserSearchText(e.target.value);
                        setUserPageNum(1);
                      }}
                      placeholder="请输入用户名称"
                      className="h-8 w-44 px-2.5 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* 手机号码 */}
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap font-medium text-[#303133]">手机号码</span>
                    <input
                      type="text"
                      value={userSearchPhone}
                      onChange={(e) => {
                        setUserSearchPhone(e.target.value);
                        setUserPageNum(1);
                      }}
                      placeholder="请输入手机号码"
                      className="h-8 w-44 px-2.5 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] focus:outline-none transition-colors font-mono"
                    />
                  </div>

                  {/* 状态 */}
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap font-medium text-[#303133]">状态</span>
                    <select
                      value={userSearchStatus}
                      onChange={(e) => {
                        setUserSearchStatus(e.target.value);
                        setUserPageNum(1);
                      }}
                      className="h-8 w-32 px-2.5 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] focus:outline-none bg-white transition-colors"
                    >
                      <option value="">所有状态</option>
                      <option value="0">正常</option>
                      <option value="1">停用</option>
                    </select>
                  </div>

                  {/* 创建时间 */}
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap font-medium text-[#303133]">创建时间</span>
                    <input
                      type="date"
                      value={userSearchBeginTime}
                      onChange={(e) => {
                        setUserSearchBeginTime(e.target.value);
                        setUserPageNum(1);
                      }}
                      className="h-8 px-2 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] focus:outline-none text-xs"
                    />
                    <span>-</span>
                    <input
                      type="date"
                      value={userSearchEndTime}
                      onChange={(e) => {
                        setUserSearchEndTime(e.target.value);
                        setUserPageNum(1);
                      }}
                      className="h-8 px-2 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] focus:outline-none text-xs"
                    />
                  </div>

                  {/* 按钮组 */}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setUserPageNum(1);
                        showToast(`已搜索出 ${filteredUsers.length} 位符合条件的用户`, 'info');
                      }}
                      className="h-8 px-3.5 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>搜索</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserSearchText('');
                        setUserSearchPhone('');
                        setUserSearchStatus('');
                        setUserSearchBeginTime('');
                        setUserSearchEndTime('');
                        setSelectedTreeDeptId('');
                        setSelectedUserIds([]);
                        setUserPageNum(1);
                      }}
                      className="h-8 px-3 rounded border border-[#DCDFE6] hover:bg-[#F5F7FA] text-[#606266] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>重置</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. 操作功能条 + 右侧小工具 */}
            <div className="bg-white rounded border border-[#E4E7ED] px-3 py-2 flex items-center justify-between gap-3 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              {/* 左侧主要操作：新增、修改、删除、导入、导出 */}
              <div className="flex items-center gap-2">
                {/* 新增按钮 */}
                <button
                  type="button"
                  onClick={() => handleAddUserInDept()}
                  className="h-8 px-3 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title={
                    selectedTreeDeptId
                      ? `在已选部门【${depts.find((d) => d.id === selectedTreeDeptId)?.deptName}】下新增用户`
                      : '新增系统用户'
                  }
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增</span>
                </button>

                {/* 修改按钮 (单选可用) */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedUserIds.length !== 1) {
                      showToast('请勾选且仅勾选 1 位需要修改的用户', 'warning');
                      return;
                    }
                    const target = users.find((u) => u.id === selectedUserIds[0]);
                    if (target) {
                      setEditUserModal({
                        visible: true,
                        isCreate: false,
                        data: { ...target },
                      });
                    }
                  }}
                  disabled={selectedUserIds.length !== 1}
                  className={`h-8 px-3 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    selectedUserIds.length === 1
                      ? 'border border-[#67C23A] bg-[#F0F9EB] text-[#67C23A] hover:bg-[#67C23A] hover:text-white'
                      : 'border border-[#E4E7ED] bg-[#F5F7FA] text-[#C0C4CC] cursor-not-allowed'
                  }`}
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>修改</span>
                </button>

                {/* 删除按钮 (多选可用) */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedUserIds.length === 0) {
                      showToast('请先勾选需要删除的用户', 'warning');
                      return;
                    }
                    setUserDeleteConfirm({
                      visible: true,
                      isBatch: true,
                      user: null,
                    });
                  }}
                  disabled={selectedUserIds.length === 0}
                  className={`h-8 px-3 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    selectedUserIds.length > 0
                      ? 'border border-[#FDE2E2] bg-[#FEF0F0] text-[#F56C6C] hover:bg-[#F56C6C] hover:text-white'
                      : 'border border-[#E4E7ED] bg-[#F5F7FA] text-[#C0C4CC] cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除 {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''}</span>
                </button>

                {/* 导入按钮 */}
                <button
                  type="button"
                  onClick={handleOpenUserImport}
                  className="h-8 px-3 rounded border border-[#E6A23C] bg-[#FDF6EC] hover:bg-[#E6A23C] text-[#E6A23C] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>导入</span>
                </button>

                {/* 导出按钮 */}
                <button
                  type="button"
                  onClick={handleExportUsers}
                  className="h-8 px-3 rounded border border-[#E6A23C] bg-[#FDF6EC] hover:bg-[#E6A23C] text-[#E6A23C] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>导出</span>
                </button>

                {/* 重置为出厂预设 */}
                <button
                  type="button"
                  onClick={handleResetUsersToDefault}
                  className="h-8 px-3 rounded border border-[#DCDFE6] hover:border-[#2F7BFE] text-[#909399] hover:text-[#2F7BFE] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
                  title="恢复初始预置用户列表"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>恢复初始数据</span>
                </button>
              </div>

              {/* 右侧操作小工具 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUserSearchCard(!showUserSearchCard)}
                  className={`w-7 h-7 rounded border flex items-center justify-center text-xs transition-colors cursor-pointer ${
                    showUserSearchCard
                      ? 'border-[#B3D8FF] bg-[#ECF5FF] text-[#2F7BFE]'
                      : 'border-[#DCDFE6] bg-white text-[#909399] hover:text-[#303133]'
                  }`}
                  title={showUserSearchCard ? '隐藏搜索栏' : '显示搜索栏'}
                >
                  <Search className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    fetchOrgBundle();
                    showToast('已刷新用户列表', 'info');
                  }}
                  className="w-7 h-7 rounded border border-[#DCDFE6] bg-white hover:bg-[#F5F7FA] text-[#909399] hover:text-[#303133] flex items-center justify-center text-xs cursor-pointer"
                  title="刷新数据"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Active Department Notification & Actions Banner */}
            {selectedTreeDeptId && (
              <div className="bg-[#ECF5FF] border border-[#B3D8FF] rounded px-3 py-2 flex items-center justify-between text-xs text-[#2F7BFE] shrink-0">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#2F7BFE] shrink-0" />
                  <span>
                    当前选定部门：
                    <strong className="text-[#303133] ml-1">
                      {depts.find((d) => d.id === selectedTreeDeptId)?.deptName}
                    </strong>{' '}
                    <span className="font-mono text-[11px] text-[#606266]">
                      (编号: {depts.find((d) => d.id === selectedTreeDeptId)?.deptCode})
                    </span>
                    <span className="ml-2 text-[11px] bg-white text-[#2F7BFE] px-2 py-0.5 rounded border border-[#B3D8FF]">
                      在该部门及下属部门共有 {filteredUsers.length} 位人员
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCreateSubDept()}
                    className="h-6 px-2.5 rounded bg-white hover:bg-[#2F7BFE] text-[#2F7BFE] hover:text-white border border-[#B3D8FF] text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>在此创建子部门</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddUserInDept()}
                    className="h-6 px-2.5 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>在此新增用户</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTreeDeptId('')}
                    className="text-[11px] text-[#909399] hover:text-[#303133] ml-1 cursor-pointer"
                  >
                    查看全部
                  </button>
                </div>
              </div>
            )}

            {/* 3. 用户表格数据卡片 */}
            <div className="flex-1 bg-white rounded border border-[#E4E7ED] flex flex-col min-h-0 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              {/* Table Header Control / Hint Bar */}
              <div className="px-3 py-1.5 bg-[#fafafa] border-b border-[#E4E7ED] flex items-center justify-between text-[11px] text-[#8c8c8c] shrink-0">
                <div className="flex items-center gap-1.5">
                  <MoveHorizontal className="w-3.5 h-3.5 text-[#2F7BFE]" />
                  <span>
                    表格支持 <strong className="text-[#2F7BFE] font-medium">按住拖拽表头重排</strong> 列顺序，及{' '}
                    <strong className="text-[#2F7BFE] font-medium">拖拽右边框调整列宽</strong>（双击边框自适应展开/恢复）
                  </span>
                </div>
                <button
                  type="button"
                  onClick={userTableGrid.resetColumns}
                  className="text-[#8c8c8c] hover:text-[#2F7BFE] flex items-center gap-1 cursor-pointer transition-colors"
                  title="重置为默认列宽与列顺序"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置表头</span>
                </button>
              </div>

              <div ref={userTableGrid.tableContainerRef} className="flex-1 overflow-auto relative">
                <TableResizeGuideLine resizingInfo={userTableGrid.resizingInfo} />
                <table
                  style={{ width: `${userTableGrid.totalTableWidth}px`, minWidth: '100%' }}
                  className="w-full text-center border-collapse text-xs table-fixed"
                >
                  <TableColGroup columns={userTableGrid.columns} colWidths={userTableGrid.colWidths} />
                  <thead className="bg-[#FAFAFA] text-[#606266] border-b border-[#E4E7ED] sticky top-0 z-10 font-normal">
                    <tr className="h-11">
                      {userTableGrid.columns.map((col) => (
                        <TableHeaderCell
                          key={col.key}
                          col={col}
                          width={userTableGrid.colWidths[col.key] ?? col.defaultWidth}
                          isDragging={userTableGrid.draggingKey === col.key}
                          isDragOver={userTableGrid.dragOverKey === col.key}
                          dropPosition={userTableGrid.dropPosition}
                          isResizing={userTableGrid.resizingKey === col.key}
                          onDragStart={(e) => userTableGrid.handleDragStart(e, col.key, col)}
                          onDragOver={(e) => userTableGrid.handleDragOver(e, col.key, col)}
                          onDragLeave={userTableGrid.handleDragLeave}
                          onDrop={(e) => userTableGrid.handleDrop(e, col.key, col)}
                          onDragEnd={userTableGrid.handleDragEnd}
                          onResizeStart={(e) => userTableGrid.handleResizeStart(e, col)}
                          onDoubleClickResize={(e) => userTableGrid.handleDoubleClickResize(e, col)}
                        >
                          {col.key === 'selection' ? (
                            <input
                              type="checkbox"
                              checked={isAllUserSelected}
                              onChange={(e) => handleSelectAllUsers(e.target.checked)}
                              className="w-4 h-4 rounded border-[#DCDFE6] text-[#2F7BFE] focus:ring-0 cursor-pointer align-middle"
                            />
                          ) : undefined}
                        </TableHeaderCell>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7ED] text-[#303133]">
                    {pagedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={userTableGrid.columns.length} className="py-16 text-center text-[#909399]">
                          暂无符合条件的用户信息
                        </td>
                      </tr>
                    ) : (
                      pagedUsers.map((u) => {
                        const isSelected = selectedUserIds.includes(u.id);
                        const isNormal = u.status === '0';
                        return (
                          <tr
                            key={u.id}
                            className={`h-12 transition-colors ${
                              isSelected ? 'bg-[#F2F7FF]' : 'hover:bg-[#F9FAFB]'
                            }`}
                          >
                            {userTableGrid.columns.map((col) => {
                              const w = userTableGrid.colWidths[col.key] ?? col.defaultWidth;
                              const cellStyle = { width: `${w}px`, minWidth: `${col.minWidth ?? w}px` };

                              switch (col.key) {
                                case 'selection':
                                  return (
                                    <td key={col.key} style={cellStyle} className="px-3 text-center border-r border-[#ebeef5]">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => handleSelectUserRow(u.id, e.target.checked)}
                                        className="w-4 h-4 rounded border-[#DCDFE6] text-[#2F7BFE] focus:ring-0 cursor-pointer align-middle"
                                      />
                                    </td>
                                  );

                                case 'userNo':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-2 px-3 font-mono text-[#606266] text-center border-r border-[#ebeef5]">
                                      <span className="truncate block">{u.userNo || u.empNo}</span>
                                    </td>
                                  );

                                case 'userName':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-2 px-3 font-medium text-[#303133] text-center border-r border-[#ebeef5]">
                                      <span className="truncate block">{u.userName}</span>
                                    </td>
                                  );

                                case 'nickName':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-2 px-3 text-[#2F7BFE] text-center border-r border-[#ebeef5]">
                                      <span className="truncate block">{u.nickName}</span>
                                    </td>
                                  );

                                case 'deptName':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-2 px-3 text-[#606266] text-center border-r border-[#ebeef5]">
                                      <span className="truncate block" title={u.deptName}>{u.deptName}</span>
                                    </td>
                                  );

                                case 'phonenumber':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-2 px-3 font-mono text-[#606266] text-center border-r border-[#ebeef5]">
                                      <span className="truncate block">{u.phonenumber || '-'}</span>
                                    </td>
                                  );

                                case 'status':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-2 px-3 text-center border-r border-[#ebeef5]">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleUserStatus(u)}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                                          isNormal
                                            ? 'bg-[#E1F3D8] text-[#67C23A] hover:bg-[#67C23A] hover:text-white'
                                            : 'bg-[#F4F4F5] text-[#909399] hover:bg-[#909399] hover:text-white'
                                        }`}
                                        title="点击切换状态"
                                      >
                                        <span
                                          className={`w-2 h-2 rounded-full ${
                                            isNormal ? 'bg-[#67C23A]' : 'bg-[#909399]'
                                          }`}
                                        />
                                        <span>{isNormal ? '正常' : '停用'}</span>
                                      </button>
                                    </td>
                                  );

                                case 'createTime':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-2 px-3 font-mono text-[#909399] text-[11px] text-center border-r border-[#ebeef5]">
                                      <span className="truncate block">{u.createTime}</span>
                                    </td>
                                  );

                                case 'actions':
                                  return (
                                    <td key={col.key} style={cellStyle} className="py-2 px-3 whitespace-nowrap text-center">
                                      <div className="flex items-center justify-center gap-2.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setEditUserModal({
                                              visible: true,
                                              isCreate: false,
                                              data: { ...u },
                                            })
                                          }
                                          className="text-[#2F7BFE] hover:underline cursor-pointer flex items-center gap-0.5"
                                        >
                                          <PenLine className="w-3 h-3" />
                                          <span>修改</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setUserDeleteConfirm({
                                              visible: true,
                                              isBatch: false,
                                              user: u,
                                            })
                                          }
                                          className="text-[#F56C6C] hover:underline cursor-pointer flex items-center gap-0.5"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          <span>删除</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setResetPwdModal({
                                              visible: true,
                                              user: u,
                                              newPassword: generateRandomPassword(),
                                              showPasswordText: true,
                                            })
                                          }
                                          className="text-[#2F7BFE] hover:underline cursor-pointer flex items-center gap-0.5"
                                        >
                                          <KeyRound className="w-3 h-3" />
                                          <span>重置密码</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setAssignRoleModal({
                                              visible: true,
                                              user: u,
                                              selectedRoles: u.roleNames || ['普通员工'],
                                            })
                                          }
                                          className="text-[#2F7BFE] hover:underline cursor-pointer flex items-center gap-0.5"
                                        >
                                          <ShieldCheck className="w-3 h-3" />
                                          <span>分配角色</span>
                                        </button>
                                      </div>
                                    </td>
                                  );

                                default:
                                  return <td key={col.key} style={cellStyle} className="py-2 px-3 text-center border-r border-[#ebeef5]">-</td>;
                              }
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* 4. 底部分页卡片 */}
              <div className="h-11 bg-white border-t border-[#E4E7ED] px-4 flex items-center justify-between text-xs text-[#606266] shrink-0">
                <div className="flex items-center gap-2">
                  <span>共 <strong className="text-[#303133]">{totalUserCount}</strong> 条</span>
                  {selectedUserIds.length > 0 && (
                    <span className="text-[#2F7BFE] font-medium ml-2">
                      已选中 {selectedUserIds.length} 项
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Page Size Select */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={userPageSize}
                      onChange={(e) => {
                        setUserPageSize(Number(e.target.value));
                        setUserPageNum(1);
                      }}
                      className="h-7 px-2 rounded border border-[#DCDFE6] bg-white text-xs cursor-pointer focus:outline-none"
                    >
                      <option value={10}>10条/页</option>
                      <option value={20}>20条/页</option>
                      <option value={30}>30条/页</option>
                      <option value={50}>50条/页</option>
                    </select>
                  </div>

                  {/* Page Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPageSafe <= 1}
                      onClick={() => setUserPageNum((prev) => Math.max(1, prev - 1))}
                      className={`h-7 px-2 rounded border text-xs cursor-pointer ${
                        currentPageSafe <= 1
                          ? 'border-[#EBEEF5] text-[#C0C4CC] cursor-not-allowed'
                          : 'border-[#DCDFE6] text-[#606266] hover:bg-[#F5F7FA]'
                      }`}
                    >
                      上一页
                    </button>

                    {Array.from({ length: totalUserPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setUserPageNum(page)}
                        className={`w-7 h-7 rounded text-xs cursor-pointer font-mono ${
                          currentPageSafe === page
                            ? 'bg-[#2F7BFE] text-white font-medium'
                            : 'border border-[#DCDFE6] text-[#606266] hover:bg-[#F5F7FA]'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={currentPageSafe >= totalUserPages}
                      onClick={() => setUserPageNum((prev) => Math.min(totalUserPages, prev + 1))}
                      className={`h-7 px-2 rounded border text-xs cursor-pointer ${
                        currentPageSafe >= totalUserPages
                          ? 'border-[#EBEEF5] text-[#C0C4CC] cursor-not-allowed'
                          : 'border-[#DCDFE6] text-[#606266] hover:bg-[#F5F7FA]'
                      }`}
                    >
                      下一页
                    </button>
                  </div>

                  {/* Jump Page */}
                  <div className="flex items-center gap-1.5 ml-2">
                    <span>前往</span>
                    <input
                      type="text"
                      value={userJumpPage}
                      onChange={(e) => setUserJumpPage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const p = parseInt(userJumpPage, 10);
                          if (!isNaN(p) && p >= 1 && p <= totalUserPages) {
                            setUserPageNum(p);
                          }
                        }
                      }}
                      className="w-10 h-7 text-center rounded border border-[#DCDFE6] text-xs font-mono focus:border-[#2F7BFE] focus:outline-none"
                    />
                    <span>页</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. 权限管理 模块 */}
      {/* ============================================================== */}
      {activeModule === 'role' && (
        <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
          {/* Left Role List */}
          <div className="w-[280px] bg-white rounded border border-[#E4E7ED] p-3.5 flex flex-col shrink-0 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E7ED] mb-2">
              <span className="font-semibold text-xs text-[#303133] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2F7BFE]" />
                <span>角色定义列表</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  const rName = window.prompt('请输入新角色名称：');
                  if (!rName) return;
                  const newR = {
                    id: 'orole_' + Math.random().toString(36).substring(2, 8),
                    roleNo: roles.length + 1,
                    roleName: rName,
                    roleKey: 'role_' + Math.random().toString(36).substring(2, 6),
                    roleType: '自定义角色',
                    roleSort: roles.length + 1,
                    dataScope: '本部门数据',
                    boundPositions: ['业务人员'],
                    menuPermissions: ['流程资产', '任务中心'],
                    userCount: 0,
                    status: '0',
                    remark: '自定义业务角色',
                    createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
                  };
                  setRoles((prev) => [...prev, newR]);
                  setSelectedRoleId(newR.id);
                  setRolePermissions((prev) => ({ ...prev, [newR.id]: ['flow', 'task'] }));
                  showToast('新增角色成功', 'success');
                }}
                className="h-6 px-2 rounded bg-[#2F7BFE] text-white text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>新增角色</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5">
              {roles.map((r) => {
                const isActive = selectedRoleId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`p-2.5 rounded border transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#2F7BFE] bg-[#ECF5FF] shadow-xs'
                        : 'border-[#E4E7ED] hover:border-[#C0C4CC] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-[#303133]">{r.roleName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#2F7BFE] border border-[#B3D8FF]">
                        {r.roleType}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#909399] truncate mb-1">
                      标识: <span className="font-mono text-[#606266]">{r.roleKey}</span>
                    </div>
                    <div className="text-[11px] text-[#909399] flex items-center justify-between">
                      <span>数据范围: {r.dataScope}</span>
                      <span className="text-[#2F7BFE] font-medium">{r.userCount || 0} 人</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Role Permission Matrix */}
          <div className="flex-1 bg-white rounded border border-[#E4E7ED] p-4 flex flex-col min-h-0 overflow-hidden shadow-xs">
            {/* Top Sub-tabs & Action Bar */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#E4E7ED] mb-3 gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActivePermissionTab('menu')}
                  className={`px-3.5 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                    activePermissionTab === 'menu'
                      ? 'bg-[#2F7BFE] text-white shadow-xs'
                      : 'bg-[#F4F4F5] text-[#606266] hover:bg-[#E4E7ED]'
                  }`}
                >
                  菜单与功能操作权限配置
                </button>
                <button
                  type="button"
                  onClick={() => setActivePermissionTab('field')}
                  className={`px-3.5 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                    activePermissionTab === 'field'
                      ? 'bg-[#2F7BFE] text-white shadow-xs'
                      : 'bg-[#F4F4F5] text-[#606266] hover:bg-[#E4E7ED]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>字段级权限与敏感数据脱敏</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // Apply restricted preset for 制度查阅 + 风险查阅
                    setRolePermissions((prev) => ({
                      ...prev,
                      [selectedRoleId]: [
                        'sysdoc_query',
                        'risk_query',
                        '/sysdoc/indexview',
                        '/risk/riskview',
                        '制度查阅',
                        '风险查阅',
                      ],
                    }));
                    setRoleFeaturePermissions((prev) => ({
                      ...prev,
                      [selectedRoleId]: {
                        sysDoc: { readOnly: true, canDownload: false, previewOnly: true },
                        risk: { readOnly: true, canDownload: false, previewOnly: true },
                      },
                    }));
                    setRoleFieldPermissions((prev) => ({
                      ...prev,
                      [selectedRoleId]: {
                        form_sysdoc: { docNo: 'masked', secretLevel: 'masked', approver: 'masked' },
                        form_flowdoc: { riskNo: 'masked' },
                      },
                    }));
                    showToast(
                      '已加载【仅制度与风险只读查阅 (受限仅预览+脱敏)】预设，请点击保存权限矩阵生效',
                      'success'
                    );
                  }}
                  className="h-8 px-3 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border border-amber-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  title="一键将该角色设置为：仅可查阅制度与风险2个菜单，强制只读且仅限在线预览不可下载，敏感字段脱敏"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>一键配置: 制度与风险受限查阅 (普通员工模式)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allKeys = [
                      'collab',
                      'property',
                      'design',
                      'execute',
                      'mining',
                      'duty',
                      'risk',
                      'system',
                      'all',
                      '全部菜单',
                    ];
                    setRolePermissions((prev) => ({ ...prev, [selectedRoleId]: allKeys }));
                    setRoleFeaturePermissions((prev) => ({
                      ...prev,
                      [selectedRoleId]: {
                        sysDoc: { readOnly: false, canDownload: true, previewOnly: false },
                        risk: { readOnly: false, canDownload: true, previewOnly: false },
                      },
                    }));
                    showToast('已全选所有业务模块与高级操作权限', 'info');
                  }}
                  className="h-8 px-3 rounded border border-[#DCDFE6] text-[#606266] hover:bg-[#F5F7FA] text-xs cursor-pointer"
                >
                  全选模块
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRolePermissions((prev) => ({ ...prev, [selectedRoleId]: [] }));
                    showToast('已清空当前角色模块权限', 'info');
                  }}
                  className="h-8 px-3 rounded border border-[#DCDFE6] text-[#606266] hover:bg-[#F5F7FA] text-xs cursor-pointer"
                >
                  清空权限
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const currentPerms = rolePermissions[selectedRoleId] || [];
                    const currentFeatures = roleFeaturePermissions[selectedRoleId] || {
                      sysDoc: { readOnly: true, canDownload: false, previewOnly: true },
                      risk: { readOnly: true, canDownload: false, previewOnly: true },
                    };
                    const currentFields = roleFieldPermissions[selectedRoleId] || {};

                    try {
                      await fetch(`/api/org/roles/${selectedRoleId}/permissions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          menuPermissions: currentPerms,
                          featurePermissions: currentFeatures,
                          fieldPermissions: currentFields,
                        }),
                      });
                      setRoles((prev) =>
                        prev.map((r) =>
                          r.id === selectedRoleId
                            ? {
                                ...r,
                                menuPermissions: currentPerms,
                                featurePermissions: currentFeatures,
                                fieldPermissions: currentFields,
                              }
                            : r
                        )
                      );
                      showToast('角色菜单、功能及字段级权限配置已保存并即时生效', 'success');
                    } catch {
                      showToast('保存权限配置失败', 'error');
                    }
                  }}
                  className="h-8 px-4 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>保存权限矩阵</span>
                </button>
              </div>
            </div>

            {/* Tab 1: 菜单与功能权限配置 */}
            {activePermissionTab === 'menu' && (
              <div className="flex-1 overflow-y-auto space-y-2.5">
                {[
                  {
                    id: 'collab',
                    title: '协同工作 (综合首页、待办任务、已办任务、流程培训)',
                    desc: '员工工作台、待办流转、催办预警与业务流程必修/选修培训课件学习',
                    actions: ['查阅待办', '流转审批', '发起培训', '考核评定', '学习进度追踪'],
                  },
                  {
                    id: 'property',
                    title: '流程资产 (我的主责、流程概览、流程集成、我的参与、流程目录)',
                    desc: '企业主干流程架构全景(L0-L4)、资产健康度统计、版本双屏对比与跨系统集成图谱',
                    actions: ['资产盘点', '全景穿透', '版本基线对比', '健康度评估', '导出资产报表'],
                  },
                  {
                    id: 'design',
                    title: '流程设计 (流程设计、流程审核、流程废止、流程角色、专业术语)',
                    desc: 'Drawio在线流程画板建模、节点扩展属性、废止下线归档审批与流程标准角色库',
                    actions: ['在线建模', '模型提交送审', '废止归档', '流程角色维护', '术语管理'],
                  },
                  {
                    id: 'execute',
                    title: '流程运行 (流程执行、工单驱动与流转监控)',
                    desc: '业务流程实例在线发起、任务节点调度、审批轨迹记录与异常干预督办',
                    actions: ['发起流程工单', '审批决议', '委托加签', '催办督办', '日志追溯'],
                  },
                  {
                    id: 'mining',
                    title: '流程挖掘 (挖掘引擎、时序回放与瓶颈洞察)',
                    desc: 'IT系统业务日志时序重放、真实流程变体发现、吞吐瓶颈分析与合规偏离度诊断',
                    actions: ['日志抽取接入', '时序轨迹回放', '变体路径发现', '瓶颈下钻分析', '挖掘报告'],
                  },
                  {
                    id: 'duty',
                    title: '权责管控 (权责清单、权责审核与DOA授权矩阵)',
                    desc: '业务事项权责清单、决策审批层级、金额阈值区间、RACI责任矩阵与权责手册发布',
                    actions: ['权责事项编制', 'DOA矩阵设定', '权责行权审核', '导出手册', '交叉校验'],
                  },
                  {
                    id: 'risk',
                    title: '风控合规 (制度文件库、制度查阅、风险合规库、风险查阅、流程废止归档)',
                    desc: '规章制度发文归档、制度查阅、风险控制矩阵、风险查阅与只读受限下载',
                    actions: ['制度查阅', '在线预览', '源文件下载', '条款编制', '风险识别', '合规看板'],
                    isRiskModule: true,
                  },
                  {
                    id: 'system',
                    title: '组织系统 (部门组织、用户管理、权限管理、表单引擎、公司信息、接口管理)',
                    desc: '组织架构与岗位编制、用户账号与角色权限矩阵、低代码表单引擎、商业授权与OpenAPI网关',
                    actions: ['部门用户维护', '角色授权分派', '表单字段设计', '商业授权更新', 'API接口调试'],
                  },
                ].map((module) => {
                  const currentPerms = rolePermissions[selectedRoleId] || [];
                  const isChecked = currentPerms.includes('all') || currentPerms.includes('全部菜单') || currentPerms.includes(module.id);
                  const isSysDocQueryPermitted = currentPerms.includes('sysdoc_query') || currentPerms.includes('/sysdoc/indexview') || currentPerms.includes('制度查阅') || isChecked;
                  const isRiskQueryPermitted = currentPerms.includes('risk_query') || currentPerms.includes('/risk/riskview') || currentPerms.includes('风险查阅') || isChecked;
                  const isSysDocLibPermitted = currentPerms.includes('sysdoc_lib') || currentPerms.includes('/sysdoc/index2') || currentPerms.includes('制度文件库') || isChecked;
                  const isRiskLibPermitted = currentPerms.includes('risk_lib') || currentPerms.includes('/risk/index') || currentPerms.includes('风险合规库') || isChecked;

                  const featureConfig = roleFeaturePermissions[selectedRoleId] || {
                    sysDoc: { readOnly: true, canDownload: false, previewOnly: true },
                    risk: { readOnly: true, canDownload: false, previewOnly: true },
                  };

                  return (
                    <div
                      key={module.id}
                      className={`p-3.5 rounded border transition-all ${
                        module.isRiskModule
                          ? 'border-[#B3D8FF] bg-[#F8FAFF]'
                          : 'border-[#E4E7ED] bg-[#FAFAFA]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked || (module.isRiskModule && (isSysDocQueryPermitted || isRiskQueryPermitted))}
                            onChange={(e) => {
                              const nextPerms = e.target.checked
                                ? [...currentPerms.filter((p) => p !== 'all'), module.id]
                                : currentPerms.filter((p) => p !== module.id && p !== 'all' && !['sysdoc_query', 'risk_query', 'sysdoc_lib', 'risk_lib', '/sysdoc/indexview', '/risk/riskview', '制度查阅', '风险查阅'].includes(p));
                              setRolePermissions((prev) => ({
                                ...prev,
                                [selectedRoleId]: nextPerms,
                              }));
                            }}
                            className="w-4 h-4 mt-0.5 rounded border-[#DCDFE6] text-[#2F7BFE] cursor-pointer"
                          />
                          <div>
                            <div className="font-semibold text-xs text-[#303133] mb-0.5 flex items-center gap-2">
                              <span>{module.title}</span>
                              {module.isRiskModule && (
                                <span className="px-2 py-0.2 rounded bg-[#EBF5FF] text-[#2F7BFE] text-[10px] font-bold border border-[#B3D8FF]">
                                  支持子菜单只读/下载/预览精细化控制
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#909399]">{module.desc}</div>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${
                            isChecked || (module.isRiskModule && (isSysDocQueryPermitted || isRiskQueryPermitted))
                              ? 'bg-[#E8F3FF] text-[#2F7BFE]'
                              : 'bg-[#F2F3F5] text-[#86909C]'
                          }`}
                        >
                          {isChecked || (module.isRiskModule && (isSysDocQueryPermitted || isRiskQueryPermitted)) ? '已授权' : '未授权'}
                        </span>
                      </div>

                      {/* Specialized Granular Submenu Controls for 风控合规 */}
                      {module.isRiskModule && (
                        <div className="mt-3 pt-3 border-t border-[#D9ECFF] grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* 1. 制度查阅 子菜单项 */}
                          <div className="p-2.5 rounded bg-white border border-[#D9ECFF] shadow-2xs">
                            <div className="flex items-center justify-between mb-2">
                              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#1F2733]">
                                <input
                                  type="checkbox"
                                  checked={isSysDocQueryPermitted}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? Array.from(new Set([...currentPerms, 'sysdoc_query', '/sysdoc/indexview', '制度查阅']))
                                      : currentPerms.filter((p) => !['sysdoc_query', '/sysdoc/indexview', '制度查阅'].includes(p));
                                    setRolePermissions((prev) => ({ ...prev, [selectedRoleId]: next }));
                                  }}
                                  className="w-3.5 h-3.5 rounded text-[#2F7BFE]"
                                />
                                <span>菜单: 制度查阅 (/sysdoc/indexview)</span>
                              </label>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium border border-blue-200">
                                红框菜单 1
                              </span>
                            </div>

                            <div className="bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0] space-y-1.5 text-[11px]">
                              <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-[#475569] font-medium">是否只读 (强制禁止新增/修改/删除)</span>
                                <input
                                  type="checkbox"
                                  checked={featureConfig.sysDoc?.readOnly ?? true}
                                  onChange={(e) => {
                                    setRoleFeaturePermissions((prev) => ({
                                      ...prev,
                                      [selectedRoleId]: {
                                        ...featureConfig,
                                        sysDoc: {
                                          ...featureConfig.sysDoc,
                                          readOnly: e.target.checked,
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-3.5 h-3.5 rounded text-[#2F7BFE]"
                                />
                              </label>

                              <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-[#475569] font-medium">是否有下载权限 (可导出/下载源文件)</span>
                                <input
                                  type="checkbox"
                                  checked={featureConfig.sysDoc?.canDownload ?? false}
                                  onChange={(e) => {
                                    const val = e.target.checked;
                                    setRoleFeaturePermissions((prev) => ({
                                      ...prev,
                                      [selectedRoleId]: {
                                        ...featureConfig,
                                        sysDoc: {
                                          ...featureConfig.sysDoc,
                                          canDownload: val,
                                          previewOnly: val ? false : featureConfig.sysDoc?.previewOnly,
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-3.5 h-3.5 rounded text-[#2F7BFE]"
                                />
                              </label>

                              <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-[#475569] font-medium">是否只能显示预览 (禁止下载打印)</span>
                                <input
                                  type="checkbox"
                                  checked={featureConfig.sysDoc?.previewOnly ?? true}
                                  onChange={(e) => {
                                    const val = e.target.checked;
                                    setRoleFeaturePermissions((prev) => ({
                                      ...prev,
                                      [selectedRoleId]: {
                                        ...featureConfig,
                                        sysDoc: {
                                          ...featureConfig.sysDoc,
                                          previewOnly: val,
                                          canDownload: val ? false : featureConfig.sysDoc?.canDownload,
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-3.5 h-3.5 rounded text-[#2F7BFE]"
                                />
                              </label>
                            </div>
                          </div>

                          {/* 2. 风险查阅 子菜单项 */}
                          <div className="p-2.5 rounded bg-white border border-[#D9ECFF] shadow-2xs">
                            <div className="flex items-center justify-between mb-2">
                              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#1F2733]">
                                <input
                                  type="checkbox"
                                  checked={isRiskQueryPermitted}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? Array.from(new Set([...currentPerms, 'risk_query', '/risk/riskview', '风险查阅']))
                                      : currentPerms.filter((p) => !['risk_query', '/risk/riskview', '风险查阅'].includes(p));
                                    setRolePermissions((prev) => ({ ...prev, [selectedRoleId]: next }));
                                  }}
                                  className="w-3.5 h-3.5 rounded text-[#2F7BFE]"
                                />
                                <span>菜单: 风险查阅 (/risk/riskview)</span>
                              </label>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium border border-blue-200">
                                红框菜单 2
                              </span>
                            </div>

                            <div className="bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0] space-y-1.5 text-[11px]">
                              <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-[#475569] font-medium">是否只读 (强制禁止新增/修改/删除)</span>
                                <input
                                  type="checkbox"
                                  checked={featureConfig.risk?.readOnly ?? true}
                                  onChange={(e) => {
                                    setRoleFeaturePermissions((prev) => ({
                                      ...prev,
                                      [selectedRoleId]: {
                                        ...featureConfig,
                                        risk: {
                                          ...featureConfig.risk,
                                          readOnly: e.target.checked,
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-3.5 h-3.5 rounded text-[#2F7BFE]"
                                />
                              </label>

                              <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-[#475569] font-medium">是否有导出下载权限</span>
                                <input
                                  type="checkbox"
                                  checked={featureConfig.risk?.canDownload ?? false}
                                  onChange={(e) => {
                                    const val = e.target.checked;
                                    setRoleFeaturePermissions((prev) => ({
                                      ...prev,
                                      [selectedRoleId]: {
                                        ...featureConfig,
                                        risk: {
                                          ...featureConfig.risk,
                                          canDownload: val,
                                          previewOnly: val ? false : featureConfig.risk?.previewOnly,
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-3.5 h-3.5 rounded text-[#2F7BFE]"
                                />
                              </label>

                              <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-[#475569] font-medium">是否只能显示预览 (禁止导出台账)</span>
                                <input
                                  type="checkbox"
                                  checked={featureConfig.risk?.previewOnly ?? true}
                                  onChange={(e) => {
                                    const val = e.target.checked;
                                    setRoleFeaturePermissions((prev) => ({
                                      ...prev,
                                      [selectedRoleId]: {
                                        ...featureConfig,
                                        risk: {
                                          ...featureConfig.risk,
                                          previewOnly: val,
                                          canDownload: val ? false : featureConfig.risk?.canDownload,
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-3.5 h-3.5 rounded text-[#2F7BFE]"
                                />
                              </label>
                            </div>
                          </div>

                          {/* 3. 其它管理级子菜单 (制度文件库 / 风险合规库 / 废止归档) */}
                          <div className="col-span-full bg-white p-2.5 rounded border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs">
                            <span className="text-[#64748B] font-medium text-[11px]">
                              管理维护级子菜单 (普通员工受限模式下建议取消勾选)：
                            </span>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-1.5 cursor-pointer text-[#475569]">
                                <input
                                  type="checkbox"
                                  checked={isSysDocLibPermitted}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? Array.from(new Set([...currentPerms, 'sysdoc_lib', '/sysdoc/index2']))
                                      : currentPerms.filter((p) => !['sysdoc_lib', '/sysdoc/index2', '制度文件库'].includes(p));
                                    setRolePermissions((prev) => ({ ...prev, [selectedRoleId]: next }));
                                  }}
                                  className="w-3.5 h-3.5 rounded text-[#2F7BFE]"
                                />
                                <span>制度文件库</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer text-[#475569]">
                                <input
                                  type="checkbox"
                                  checked={isRiskLibPermitted}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? Array.from(new Set([...currentPerms, 'risk_lib', '/risk/index']))
                                      : currentPerms.filter((p) => !['risk_lib', '/risk/index', '风险合规库'].includes(p));
                                    setRolePermissions((prev) => ({ ...prev, [selectedRoleId]: next }));
                                  }}
                                  className="w-3.5 h-3.5 rounded text-[#2F7BFE]"
                                />
                                <span>风险合规库</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: 字段级权限与敏感数据脱敏 */}
            {activePermissionTab === 'field' && (
              <div className="flex-1 overflow-y-auto space-y-3.5 text-xs">
                <div className="bg-[#F0F7FF] p-3 rounded border border-[#B3D8FF] text-[#1E3A8A]">
                  <div className="font-semibold text-xs mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#2F7BFE]" />
                    <span>字段级安全策略说明 (Field-Level Permissions)</span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">
                    系统现已支持控制到【菜单级】与【字段级】。针对当前所选角色，您可以设定在制度查阅和风险查阅中，各个业务字段的公开性与脱敏规则。当设为【脱敏掩码】时，系统将在表格和预览中自动将内部核心编号、密级及决策人打码保护。
                  </p>
                </div>

                {/* 1. 制度表单 (form_sysdoc) 字段规则 */}
                <div className="bg-white rounded border border-[#E4E7ED] p-3 shadow-2xs">
                  <div className="font-bold text-xs text-[#303133] mb-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#2F7BFE]" />
                      <span>制度文件表单 (form_sysdoc) · 字段访问与脱敏控制</span>
                    </span>
                    <span className="text-[10px] text-[#909399]">对应制度查阅页面字段</span>
                  </div>

                  <div className="border border-[#E4E7ED] rounded overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#F8F9FA] text-[#606266] border-b border-[#E4E7ED]">
                        <tr>
                          <th className="py-2 px-3">字段标识</th>
                          <th className="py-2 px-3">业务名称</th>
                          <th className="py-2 px-3 text-center">完全公开</th>
                          <th className="py-2 px-3 text-center text-amber-600">脱敏掩码 (如 ***)</th>
                          <th className="py-2 px-3 text-center text-red-600">隐藏不显示</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4E7ED]">
                        {[
                          { key: 'docNo', label: '制度编码', sample: 'ZD-MKT-2026-01', masked: 'ZD-***-01' },
                          { key: 'secretLevel', label: '涉密等级', sample: '内部受限(工作秘密)', masked: '***(受限)' },
                          { key: 'docOfficialNo', label: '发文红头文号', sample: '全源发〔2026〕088号', masked: '全源发〔2026〕***号' },
                          { key: 'approver', label: '合规审核人', sample: '李合规 (审计专员)', masked: '合规部 (脱敏)' },
                          { key: 'signer', label: '签发决策人', sample: '王副总 (分管副总裁)', masked: '高管办 (脱敏)' },
                        ].map((f) => {
                          const currentSetting =
                            roleFieldPermissions[selectedRoleId]?.form_sysdoc?.[f.key] || 'normal';
                          return (
                            <tr key={f.key} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-mono text-[11px] text-[#909399]">{f.key}</td>
                              <td className="py-2 px-3 font-medium text-[#303133]">
                                <div>{f.label}</div>
                                <div className="text-[10px] text-[#909399]">
                                  脱敏示例: <span className="font-mono text-[#D97706]">{f.masked}</span>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="radio"
                                  name={`f_doc_${f.key}`}
                                  checked={currentSetting === 'normal'}
                                  onChange={() => {
                                    setRoleFieldPermissions((prev) => ({
                                      ...prev,
                                      [selectedRoleId]: {
                                        ...prev[selectedRoleId],
                                        form_sysdoc: {
                                          ...(prev[selectedRoleId]?.form_sysdoc || {}),
                                          [f.key]: 'normal',
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-3.5 h-3.5 text-[#2F7BFE] cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="radio"
                                  name={`f_doc_${f.key}`}
                                  checked={currentSetting === 'masked'}
                                  onChange={() => {
                                    setRoleFieldPermissions((prev) => ({
                                      ...prev,
                                      [selectedRoleId]: {
                                        ...prev[selectedRoleId],
                                        form_sysdoc: {
                                          ...(prev[selectedRoleId]?.form_sysdoc || {}),
                                          [f.key]: 'masked',
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-3.5 h-3.5 text-amber-600 cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="radio"
                                  name={`f_doc_${f.key}`}
                                  checked={currentSetting === 'hidden'}
                                  onChange={() => {
                                    setRoleFieldPermissions((prev) => ({
                                      ...prev,
                                      [selectedRoleId]: {
                                        ...prev[selectedRoleId],
                                        form_sysdoc: {
                                          ...(prev[selectedRoleId]?.form_sysdoc || {}),
                                          [f.key]: 'hidden',
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-3.5 h-3.5 text-red-600 cursor-pointer"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. 风险表单 (form_flowdoc) 字段规则 */}
                <div className="bg-white rounded border border-[#E4E7ED] p-3 shadow-2xs">
                  <div className="font-bold text-xs text-[#303133] mb-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      <span>风险合规表单 (form_flowdoc) · 字段访问与脱敏控制</span>
                    </span>
                    <span className="text-[10px] text-[#909399]">对应风险查阅页面字段</span>
                  </div>

                  <div className="border border-[#E4E7ED] rounded overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#F8F9FA] text-[#606266] border-b border-[#E4E7ED]">
                        <tr>
                          <th className="py-2 px-3">字段标识</th>
                          <th className="py-2 px-3">业务名称</th>
                          <th className="py-2 px-3 text-center">完全公开</th>
                          <th className="py-2 px-3 text-center text-amber-600">脱敏掩码 (如 ***)</th>
                          <th className="py-2 px-3 text-center text-red-600">隐藏不显示</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4E7ED]">
                        {[
                          { key: 'riskNo', label: '风险编号', sample: 'RSK-2026-001', masked: 'RSK-***-001' },
                          { key: 'target', label: '控制目标', sample: '全流程受控避免财务坏账', masked: '***(内部管控)' },
                          { key: 'lossEstimate', label: '预估损失金额', sample: '500万元', masked: '***(商业机密)' },
                        ].map((f) => {
                          const currentSetting =
                            roleFieldPermissions[selectedRoleId]?.form_flowdoc?.[f.key] || 'normal';
                          return (
                            <tr key={f.key} className="hover:bg-[#F8FAFC]">
                              <td className="py-2 px-3 font-mono text-[11px] text-[#909399]">{f.key}</td>
                              <td className="py-2 px-3 font-medium text-[#303133]">
                                <div>{f.label}</div>
                                <div className="text-[10px] text-[#909399]">
                                  脱敏示例: <span className="font-mono text-[#D97706]">{f.masked}</span>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="radio"
                                  name={`f_risk_${f.key}`}
                                  checked={currentSetting === 'normal'}
                                  onChange={() => {
                                    setRoleFieldPermissions((prev) => ({
                                      ...prev,
                                      [selectedRoleId]: {
                                        ...prev[selectedRoleId],
                                        form_flowdoc: {
                                          ...(prev[selectedRoleId]?.form_flowdoc || {}),
                                          [f.key]: 'normal',
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-3.5 h-3.5 text-[#2F7BFE] cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="radio"
                                  name={`f_risk_${f.key}`}
                                  checked={currentSetting === 'masked'}
                                  onChange={() => {
                                    setRoleFieldPermissions((prev) => ({
                                      ...prev,
                                      [selectedRoleId]: {
                                        ...prev[selectedRoleId],
                                        form_flowdoc: {
                                          ...(prev[selectedRoleId]?.form_flowdoc || {}),
                                          [f.key]: 'masked',
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-3.5 h-3.5 text-amber-600 cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="radio"
                                  name={`f_risk_${f.key}`}
                                  checked={currentSetting === 'hidden'}
                                  onChange={() => {
                                    setRoleFieldPermissions((prev) => ({
                                      ...prev,
                                      [selectedRoleId]: {
                                        ...prev[selectedRoleId],
                                        form_flowdoc: {
                                          ...(prev[selectedRoleId]?.form_flowdoc || {}),
                                          [f.key]: 'hidden',
                                        },
                                      },
                                    }));
                                  }}
                                  className="w-3.5 h-3.5 text-red-600 cursor-pointer"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 弹窗 A: 用户管理 - 新增 / 修改用户 */}
      {/* ============================================================== */}
      {editUserModal.visible && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-[660px] bg-white rounded-lg shadow-2xl border border-[#E4E7ED] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
            <div className="h-12 bg-[#F8F9FA] px-5 border-b border-[#E4E7ED] flex items-center justify-between shrink-0">
              <span className="font-semibold text-sm text-[#303133]">
                {editUserModal.isCreate ? '添加用户' : '修改用户'}
              </span>
              <button
                type="button"
                onClick={() => setEditUserModal({ visible: false, isCreate: false, data: null })}
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Highlight banner showing the target department */}
              {editUserModal.data?.deptName && (
                <div className="p-2.5 rounded bg-[#ECF5FF] border border-[#B3D8FF] text-[#2F7BFE] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {editUserModal.isCreate ? '正在为选定部门创建新用户：' : '当前用户归属部门：'}
                      <strong className="text-[#303133] ml-1">
                        {editUserModal.data?.deptName}
                      </strong>{' '}
                      <span className="font-mono text-[11px] opacity-80">
                        ({editUserModal.data?.deptCode})
                      </span>
                    </span>
                  </div>
                  <span className="text-[11px] opacity-80">如需调整可在下方归属部门中修改</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* 用户昵称 */}
                <div>
                  <label className="block font-medium text-[#303133] mb-1">
                    用户昵称 <span className="text-[#F56C6C]">*</span>
                  </label>
                  <input
                    type="text"
                    value={editUserModal.data?.nickName || ''}
                    onChange={(e) =>
                      setEditUserModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, nickName: e.target.value },
                      }))
                    }
                    placeholder="请输入用户真实姓名/昵称"
                    className="w-full h-8 px-3 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] focus:outline-none"
                  />
                </div>

                {/* 归属部门 */}
                <div>
                  <label className="block font-medium text-[#303133] mb-1">
                    归属部门 <span className="text-[#F56C6C]">*</span>
                  </label>
                  <select
                    value={editUserModal.data?.deptId || ''}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const d = depts.find((item) => item.id === selId);
                      setEditUserModal((prev) => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          deptId: selId,
                          deptName: d ? d.deptName : '',
                          deptCode: d ? d.deptCode : '',
                        },
                      }));
                    }}
                    className="w-full h-8 px-2.5 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] focus:outline-none bg-white cursor-pointer"
                  >
                    {depts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.deptName} ({d.deptCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 手机号码 */}
                <div>
                  <label className="block font-medium text-[#303133] mb-1">手机号码</label>
                  <input
                    type="text"
                    value={editUserModal.data?.phonenumber || ''}
                    onChange={(e) =>
                      setEditUserModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, phonenumber: e.target.value },
                      }))
                    }
                    placeholder="请输入11位手机号码"
                    className="w-full h-8 px-3 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] focus:outline-none font-mono"
                  />
                </div>

                {/* 邮箱 */}
                <div>
                  <label className="block font-medium text-[#303133] mb-1">邮箱</label>
                  <input
                    type="email"
                    value={editUserModal.data?.email || ''}
                    onChange={(e) =>
                      setEditUserModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, email: e.target.value },
                      }))
                    }
                    placeholder="例如：user@dflow.com"
                    className="w-full h-8 px-3 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] focus:outline-none font-mono"
                  />
                </div>

                {/* 用户名称 */}
                <div>
                  <label className="block font-medium text-[#303133] mb-1">
                    用户名称 (账号) <span className="text-[#F56C6C]">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!editUserModal.isCreate}
                    value={editUserModal.data?.userName || ''}
                    onChange={(e) =>
                      setEditUserModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, userName: e.target.value },
                      }))
                    }
                    placeholder="请输入用户英文登录账号"
                    className={`w-full h-8 px-3 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] focus:outline-none font-medium ${
                      !editUserModal.isCreate ? 'bg-[#F5F7FA] text-[#909399]' : ''
                    }`}
                  />
                </div>

                {/* 用户密码 (仅新增或修改时可选) */}
                {editUserModal.isCreate && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-medium text-[#303133]">
                        用户密码 <span className="text-[#F56C6C]">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditUserModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, password: generateRandomPassword() },
                          }))
                        }
                        className="text-[11px] text-[#2F7BFE] hover:underline cursor-pointer"
                      >
                        生成随机密码
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editUserModal.data?.password || ''}
                      onChange={(e) =>
                        setEditUserModal((prev) => ({
                          ...prev,
                          data: { ...prev.data, password: e.target.value },
                        }))
                      }
                      placeholder="初始登录密码"
                      className="w-full h-8 px-3 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] focus:outline-none font-mono"
                    />
                  </div>
                )}

                {/* 用户性别 */}
                <div>
                  <label className="block font-medium text-[#303133] mb-1">用户性别</label>
                  <div className="flex items-center gap-4 h-8">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="user_sex"
                        value="0"
                        checked={editUserModal.data?.sex === '0' || !editUserModal.data?.sex}
                        onChange={() =>
                          setEditUserModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, sex: '0' },
                          }))
                        }
                        className="text-[#2F7BFE]"
                      />
                      <span>男</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="user_sex"
                        value="1"
                        checked={editUserModal.data?.sex === '1'}
                        onChange={() =>
                          setEditUserModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, sex: '1' },
                          }))
                        }
                        className="text-[#2F7BFE]"
                      />
                      <span>女</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="user_sex"
                        value="2"
                        checked={editUserModal.data?.sex === '2'}
                        onChange={() =>
                          setEditUserModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, sex: '2' },
                          }))
                        }
                        className="text-[#2F7BFE]"
                      />
                      <span>未知</span>
                    </label>
                  </div>
                </div>

                {/* 状态 */}
                <div>
                  <label className="block font-medium text-[#303133] mb-1">账号状态</label>
                  <div className="flex items-center gap-4 h-8">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="user_status"
                        value="0"
                        checked={String(editUserModal.data?.status) === '0' || !editUserModal.data?.status}
                        onChange={() =>
                          setEditUserModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, status: '0' },
                          }))
                        }
                        className="text-[#67C23A]"
                      />
                      <span className="text-[#67C23A] font-medium">正常</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="user_status"
                        value="1"
                        checked={String(editUserModal.data?.status) === '1'}
                        onChange={() =>
                          setEditUserModal((prev) => ({
                            ...prev,
                            data: { ...prev.data, status: '1' },
                          }))
                        }
                        className="text-[#909399]"
                      />
                      <span className="text-[#909399]">停用</span>
                    </label>
                  </div>
                </div>

                {/* 岗位选择 */}
                <div>
                  <label className="block font-medium text-[#303133] mb-1">岗位</label>
                  <select
                    value={editUserModal.data?.positionName || '普通员工'}
                    onChange={(e) =>
                      setEditUserModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, positionName: e.target.value },
                      }))
                    }
                    className="w-full h-8 px-2.5 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="知识运营专家">知识运营专家</option>
                    <option value="系统架构师">系统架构师</option>
                    <option value="流程推进专员">流程推进专员</option>
                    <option value="权责核准主管">权责核准主管</option>
                    <option value="中心总经理">中心总经理</option>
                    <option value="软件研发组长">软件研发组长</option>
                    <option value="结构设计工程师">结构设计工程师</option>
                    <option value="电气开发工程师">电气开发工程师</option>
                    <option value="测试工程师">测试工程师</option>
                    <option value="普通员工">普通员工</option>
                  </select>
                </div>

                {/* 角色分配 */}
                <div className="col-span-2">
                  <label className="block font-medium text-[#303133] mb-1.5">
                    分配角色权限 (可多选)
                  </label>
                  <div className="flex flex-wrap gap-2 p-2.5 rounded border border-[#E4E7ED] bg-[#FAFAFA]">
                    {roles.map((r) => {
                      const curRoles = editUserModal.data?.roleNames || [];
                      const isChecked = curRoles.includes(r.roleName);
                      return (
                        <label
                          key={r.id}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-[#ECF5FF] border-[#B3D8FF] text-[#2F7BFE] font-medium'
                              : 'bg-white border-[#DCDFE6] text-[#606266] hover:border-[#C0C4CC]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...curRoles, r.roleName]
                                : curRoles.filter((name: string) => name !== r.roleName);
                              setEditUserModal((prev) => ({
                                ...prev,
                                data: { ...prev.data, roleNames: next },
                              }));
                            }}
                            className="rounded text-[#2F7BFE] focus:ring-0"
                          />
                          <span>{r.roleName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 备注 */}
                <div className="col-span-2">
                  <label className="block font-medium text-[#303133] mb-1">备注说明</label>
                  <textarea
                    rows={2}
                    value={editUserModal.data?.remark || ''}
                    onChange={(e) =>
                      setEditUserModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, remark: e.target.value },
                      }))
                    }
                    placeholder="请输入用户权限或业务范围备注"
                    className="w-full p-2.5 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] focus:outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="h-12 bg-[#F8F9FA] px-5 border-t border-[#E4E7ED] flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setEditUserModal({ visible: false, isCreate: false, data: null })}
                className="h-8 px-4 rounded border border-[#DCDFE6] text-xs text-[#606266] hover:bg-white cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveUser}
                className="h-8 px-4 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 弹窗 B: 用户管理 - 重置密码 */}
      {/* ============================================================== */}
      {resetPwdModal.visible && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-[440px] bg-white rounded-lg shadow-2xl border border-[#E4E7ED] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="h-12 bg-[#F8F9FA] px-5 border-b border-[#E4E7ED] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#2F7BFE]" />
                <span className="font-semibold text-sm text-[#303133]">重置用户密码</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setResetPwdModal({
                    visible: false,
                    user: null,
                    newPassword: '',
                    showPasswordText: false,
                  })
                }
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded bg-[#F8F9FA] border border-[#E4E7ED] space-y-1">
                <div className="text-[#606266]">
                  用户账号：<span className="font-semibold text-[#303133]">{resetPwdModal.user?.userName}</span>
                </div>
                <div className="text-[#606266]">
                  真实姓名：<span className="text-[#2F7BFE] font-medium">{resetPwdModal.user?.nickName}</span>
                </div>
                <div className="text-[#606266]">
                  归属部门：<span className="text-[#303133]">{resetPwdModal.user?.deptName}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-[#303133]">
                    新密码 <span className="text-[#F56C6C]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setResetPwdModal((prev) => ({
                        ...prev,
                        newPassword: generateRandomPassword(),
                        showPasswordText: true,
                      }))
                    }
                    className="text-[11px] text-[#2F7BFE] hover:underline cursor-pointer"
                  >
                    生成随机强密码
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={resetPwdModal.showPasswordText ? 'text' : 'password'}
                    value={resetPwdModal.newPassword}
                    onChange={(e) =>
                      setResetPwdModal((prev) => ({ ...prev, newPassword: e.target.value }))
                    }
                    placeholder="请输入新密码（至少6位）"
                    className="w-full h-8 pl-3 pr-8 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setResetPwdModal((prev) => ({
                        ...prev,
                        showPasswordText: !prev.showPasswordText,
                      }))
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#909399] hover:text-[#303133] cursor-pointer"
                  >
                    {resetPwdModal.showPasswordText ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#909399] mt-1">
                  重置后该用户下次登录需使用此新密码。
                </p>
              </div>
            </div>

            <div className="h-12 bg-[#F8F9FA] px-5 border-t border-[#E4E7ED] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setResetPwdModal({
                    visible: false,
                    user: null,
                    newPassword: '',
                    showPasswordText: false,
                  })
                }
                className="h-8 px-4 rounded border border-[#DCDFE6] text-xs text-[#606266] hover:bg-white cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPwd}
                className="h-8 px-4 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                确定重置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 弹窗 C: 用户管理 - 分配角色 */}
      {/* ============================================================== */}
      {assignRoleModal.visible && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-[520px] bg-white rounded-lg shadow-2xl border border-[#E4E7ED] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="h-12 bg-[#F8F9FA] px-5 border-b border-[#E4E7ED] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2F7BFE]" />
                <span className="font-semibold text-sm text-[#303133]">
                  分配角色 · {assignRoleModal.user?.nickName} ({assignRoleModal.user?.userName})
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setAssignRoleModal({ visible: false, user: null, selectedRoles: [] })
                }
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="text-[#606266] flex items-center justify-between mb-1">
                <span>请为员工选择要赋予的业务与管控角色：</span>
                <span className="text-[#2F7BFE] font-medium">
                  已选 {assignRoleModal.selectedRoles.length} 个角色
                </span>
              </div>

              <div className="border border-[#E4E7ED] rounded divide-y divide-[#E4E7ED] max-h-64 overflow-y-auto">
                {roles.map((r) => {
                  const isChecked = assignRoleModal.selectedRoles.includes(r.roleName);
                  return (
                    <label
                      key={r.id}
                      className={`flex items-start gap-3 p-3 transition-colors cursor-pointer ${
                        isChecked ? 'bg-[#F2F7FF]' : 'hover:bg-[#FAFAFA]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...assignRoleModal.selectedRoles, r.roleName]
                            : assignRoleModal.selectedRoles.filter((n) => n !== r.roleName);
                          setAssignRoleModal((prev) => ({ ...prev, selectedRoles: next }));
                        }}
                        className="w-4 h-4 mt-0.5 rounded text-[#2F7BFE] focus:ring-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#303133]">{r.roleName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#2F7BFE] border border-[#B3D8FF]">
                            {r.roleType}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#909399] mt-0.5">{r.remark}</div>
                        <div className="text-[11px] text-[#606266] mt-1">
                          权限范围：<span className="text-[#2F7BFE]">{r.dataScope}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="h-12 bg-[#F8F9FA] px-5 border-t border-[#E4E7ED] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setAssignRoleModal({ visible: false, user: null, selectedRoles: [] })
                }
                className="h-8 px-4 rounded border border-[#DCDFE6] text-xs text-[#606266] hover:bg-white cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignRoles}
                className="h-8 px-4 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                确定分配
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 弹窗 D: 用户管理 - 导入用户 */}
      {/* ============================================================== */}
      {importUserModal.visible && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-[660px] bg-white rounded-lg shadow-2xl border border-[#E4E7ED] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="h-12 bg-[#F8F9FA] px-5 border-b border-[#E4E7ED] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#2F7BFE]" />
                <span className="font-semibold text-sm text-[#303133]">导入用户数据</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setImportUserModal({ visible: false, updateExisting: false, previewList: [] })
                }
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-4 rounded border border-dashed border-[#2F7BFE] bg-[#F2F7FF] flex flex-col items-center justify-center text-center">
                <FileSpreadsheet className="w-8 h-8 text-[#2F7BFE] mb-2" />
                <p className="font-semibold text-[#303133] mb-1">
                  拖拽 Excel (.xlsx) / CSV 文件至此处，或点击浏览上传
                </p>
                <p className="text-[11px] text-[#909399]">
                  支持标准列格式：登录账号、真实姓名、所属部门、手机号码、邮箱、岗位
                </p>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-[#303133]">
                  <input
                    type="checkbox"
                    checked={importUserModal.updateExisting}
                    onChange={(e) =>
                      setImportUserModal((prev) => ({
                        ...prev,
                        updateExisting: e.target.checked,
                      }))
                    }
                    className="rounded text-[#2F7BFE] focus:ring-0"
                  />
                  <span>是否更新已经存在的用户数据</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    const csvContent =
                      '\uFEFF登录账号,真实姓名,所属部门,手机号码,邮箱,岗位\r\nzhangsan,张三,软件开发部,13800000001,zhangsan@dflow.com,后端架构师\r\nlisi,李四,流程管理部,13800000002,lisi@dflow.com,流程推进专员\r\n';
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', '用户导入模板.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast('已下载用户导入模板', 'info');
                  }}
                  className="text-[11px] text-[#2F7BFE] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载导入模板</span>
                </button>
              </div>

              <div>
                <div className="font-medium text-[#303133] mb-1.5">
                  待导入用户预览 ({importUserModal.previewList.length} 条)
                </div>
                <div className="border border-[#E4E7ED] rounded overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-center border-collapse text-[11px]">
                    <thead className="bg-[#FAFAFA] text-[#606266] border-b border-[#E4E7ED]">
                      <tr>
                        <th className="py-2 px-2.5">账号</th>
                        <th className="py-2 px-2.5">姓名</th>
                        <th className="py-2 px-2.5">所属部门</th>
                        <th className="py-2 px-2.5">手机号码</th>
                        <th className="py-2 px-2.5">邮箱</th>
                        <th className="py-2 px-2.5">岗位</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E7ED]">
                      {importUserModal.previewList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#F9FAFB]">
                          <td className="py-1.5 px-2.5 font-medium text-[#303133]">
                            {item.userName}
                          </td>
                          <td className="py-1.5 px-2.5 text-[#2F7BFE]">{item.nickName}</td>
                          <td className="py-1.5 px-2.5">{item.deptName}</td>
                          <td className="py-1.5 px-2.5 font-mono">{item.phonenumber}</td>
                          <td className="py-1.5 px-2.5 font-mono">{item.email}</td>
                          <td className="py-1.5 px-2.5">{item.positionName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="h-12 bg-[#F8F9FA] px-5 border-t border-[#E4E7ED] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setImportUserModal({ visible: false, updateExisting: false, previewList: [] })
                }
                className="h-8 px-4 rounded border border-[#DCDFE6] text-xs text-[#606266] hover:bg-white cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmUserImport}
                className="h-8 px-4 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                开始导入 ({importUserModal.previewList.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 弹窗 E: 用户管理 - 删除确认 (单个 / 批量) */}
      {/* ============================================================== */}
      {userDeleteConfirm.visible && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-[400px] bg-white rounded-lg shadow-xl border border-[#E4E7ED] p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#FEF0F0] text-[#F56C6C] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#303133] mb-1">
                  {userDeleteConfirm.isBatch ? '确认批量删除用户？' : '确认删除该用户？'}
                </h4>
                <p className="text-xs text-[#606266] leading-relaxed">
                  {userDeleteConfirm.isBatch
                    ? `即将永久删除勾选的 ${selectedUserIds.length} 位系统用户，删除后对应的账号权限与工作流关联将解除。`
                    : `即将删除用户【${userDeleteConfirm.user?.nickName} (${userDeleteConfirm.user?.userName})】，删除后该账号将无法继续登录。`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setUserDeleteConfirm({ visible: false, isBatch: false, user: null })
                }
                className="h-7 px-3 rounded border border-[#DCDFE6] text-xs text-[#606266] hover:bg-[#F5F7FA] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="h-7 px-3 rounded bg-[#F56C6C] hover:bg-[#E64242] text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 部门组织原有弹窗: 新增/修改部门组织 */}
      {/* ============================================================== */}
      {editDeptModal.visible && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-[500px] bg-white rounded-lg shadow-2xl border border-[#E4E7ED] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="h-12 bg-[#F8F9FA] px-5 border-b border-[#E4E7ED] flex items-center justify-between">
              <span className="font-semibold text-sm text-[#303133]">
                {editDeptModal.isCreate
                  ? editDeptModal.data?.parentDeptName
                    ? `创建子部门 (隶属于：${editDeptModal.data.parentDeptName})`
                    : '新增部门组织'
                  : '修改部门信息'}
              </span>
              <button
                type="button"
                onClick={() => setEditDeptModal({ visible: false, isCreate: false, data: null })}
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Parent department info banner */}
              {editDeptModal.data?.parentDeptName && (
                <div className="p-2.5 rounded bg-[#F2F7FF] border border-[#B3D8FF] text-[#2F7BFE] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      父级所属部门：
                      <strong className="text-[#303133] ml-1">
                        {editDeptModal.data.parentDeptName}
                      </strong>{' '}
                      {editDeptModal.data.parentDeptCode ? `(${editDeptModal.data.parentDeptCode})` : '(顶级机构)'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#909399]">可在下方调整层级</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-[#303133] mb-1">
                  部门名称 <span className="text-[#F56C6C]">*</span>
                </label>
                <input
                  type="text"
                  value={editDeptModal.data?.deptName || ''}
                  onChange={(e) =>
                    setEditDeptModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, deptName: e.target.value },
                    }))
                  }
                  placeholder="例如：系统管理部、研发管理中心"
                  className="w-full h-8 px-3 rounded border border-[#DCDFE6] text-xs focus:border-[#2F7BFE] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#303133] mb-1">
                  部门编号 <span className="text-[#F56C6C]">*</span>
                </label>
                <input
                  type="text"
                  value={editDeptModal.data?.deptCode || ''}
                  onChange={(e) =>
                    setEditDeptModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, deptCode: e.target.value },
                    }))
                  }
                  placeholder="例如：0010、0050、TZ1"
                  className="w-full h-8 px-3 rounded border border-[#DCDFE6] text-xs font-mono focus:border-[#2F7BFE] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#303133] mb-1">
                  父部门名称
                </label>
                <select
                  value={editDeptModal.data?.parentDeptName || ''}
                  onChange={(e) => {
                    const selName = e.target.value;
                    const foundDept = depts.find((d) => d.deptName === selName);
                    setEditDeptModal((prev) => ({
                      ...prev,
                      data: {
                        ...prev.data,
                        parentDeptName: selName,
                        parentDeptCode: foundDept ? foundDept.deptCode : '',
                      },
                    }));
                  }}
                  className="w-full h-8 px-3 rounded border border-[#DCDFE6] text-xs focus:border-[#2F7BFE] focus:outline-none bg-white"
                >
                  <option value={companyName}>{companyName} (顶级机构)</option>
                  {depts
                    .filter((d) => d.id !== editDeptModal.data?.id)
                    .map((d) => (
                      <option key={d.id} value={d.deptName}>
                        {d.deptName} ({d.deptCode})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#303133] mb-1">
                  父部门编号
                </label>
                <input
                  type="text"
                  value={editDeptModal.data?.parentDeptCode || ''}
                  onChange={(e) =>
                    setEditDeptModal((prev) => ({
                      ...prev,
                      data: { ...prev.data, parentDeptCode: e.target.value },
                    }))
                  }
                  placeholder="顶级机构可留空，或填 0050 等"
                  className="w-full h-8 px-3 rounded border border-[#DCDFE6] text-xs font-mono focus:border-[#2F7BFE] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#303133] mb-1">
                    部门负责人
                  </label>
                  <input
                    type="text"
                    value={editDeptModal.data?.leader || ''}
                    onChange={(e) =>
                      setEditDeptModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, leader: e.target.value },
                      }))
                    }
                    placeholder="部门主管/经理姓名"
                    className="w-full h-8 px-3 rounded border border-[#DCDFE6] text-xs focus:border-[#2F7BFE] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#303133] mb-1">
                    联系电话
                  </label>
                  <input
                    type="text"
                    value={editDeptModal.data?.phone || ''}
                    onChange={(e) =>
                      setEditDeptModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, phone: e.target.value },
                      }))
                    }
                    placeholder="010-880010"
                    className="w-full h-8 px-3 rounded border border-[#DCDFE6] text-xs font-mono focus:border-[#2F7BFE] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="h-12 bg-[#F8F9FA] px-5 border-t border-[#E4E7ED] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditDeptModal({ visible: false, isCreate: false, data: null })}
                className="h-8 px-4 rounded border border-[#DCDFE6] text-xs text-[#606266] hover:bg-white cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveDept}
                className="h-8 px-4 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                保存部门
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 部门单个删除确认 */}
      {deleteDeptConfirm.visible && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-[380px] bg-white rounded-lg shadow-xl border border-[#E4E7ED] p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#FEF0F0] text-[#F56C6C] flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#303133] mb-1">确认删除部门？</h4>
                <p className="text-xs text-[#606266] leading-relaxed">
                  即将删除部门【{deleteDeptConfirm.dept?.deptName}】（编号:{' '}
                  {deleteDeptConfirm.dept?.deptCode}
                  ），删除后不可恢复。
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteDeptConfirm({ visible: false, dept: null })}
                className="h-7 px-3 rounded border border-[#DCDFE6] text-xs text-[#606266] hover:bg-[#F5F7FA] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingleDept}
                className="h-7 px-3 rounded bg-[#F56C6C] hover:bg-[#E64242] text-white text-xs font-medium cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 部门批量删除确认 */}
      {batchDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-[400px] bg-white rounded-lg shadow-xl border border-[#E4E7ED] p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#FEF0F0] text-[#F56C6C] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#303133] mb-1">确认批量删除所选部门？</h4>
                <p className="text-xs text-[#606266] leading-relaxed">
                  您当前已勾选了{' '}
                  <span className="text-[#F56C6C] font-semibold">
                    {selectedDeptIds.length}
                  </span>{' '}
                  个部门组织。
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBatchDeleteConfirm(false)}
                className="h-7 px-3 rounded border border-[#DCDFE6] text-xs text-[#606266] hover:bg-[#F5F7FA] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDeleteDept}
                className="h-7 px-3 rounded bg-[#F56C6C] hover:bg-[#E64242] text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                确定批量删除 ({selectedDeptIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入部门组织 */}
      {importDeptModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-[640px] bg-white rounded-lg shadow-2xl border border-[#E4E7ED] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="h-12 bg-[#F8F9FA] px-5 border-b border-[#E4E7ED] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#2F7BFE]" />
                <span className="font-semibold text-sm text-[#303133]">导入组织架构</span>
              </div>
              <button
                type="button"
                onClick={() => setImportDeptModalVisible(false)}
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 rounded border border-dashed border-[#2F7BFE] bg-[#F2F7FF] flex flex-col items-center justify-center text-center">
                <FileSpreadsheet className="w-8 h-8 text-[#2F7BFE] mb-2" />
                <p className="text-xs font-semibold text-[#303133] mb-1">
                  拖拽 Excel (.xlsx) / CSV 文件至此处，或点击浏览上传
                </p>
                <p className="text-[11px] text-[#909399]">
                  支持标准列格式：部门名称、部门编号、父部门名称、父部门编号、负责人
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#303133]">
                    待导入组织数据预览 ({importDeptPreviewList.length} 条)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      showToast('标准组织架构导入模板已准备就绪', 'info');
                    }}
                    className="text-[11px] text-[#2F7BFE] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>下载导入模板</span>
                  </button>
                </div>

                <div className="border border-[#E4E7ED] rounded overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-center border-collapse text-[11px]">
                    <thead className="bg-[#FAFAFA] text-[#606266] border-b border-[#E4E7ED]">
                      <tr>
                        <th className="py-2 px-3">部门名称</th>
                        <th className="py-2 px-3">部门编号</th>
                        <th className="py-2 px-3">父部门名称</th>
                        <th className="py-2 px-3">父部门编号</th>
                        <th className="py-2 px-3">负责人</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E7ED]">
                      {importDeptPreviewList.map((item, i) => (
                        <tr key={i} className="hover:bg-[#F9FAFB]">
                          <td className="py-1.5 px-3 font-medium text-[#303133]">
                            {item.deptName}
                          </td>
                          <td className="py-1.5 px-3 font-mono">{item.deptCode}</td>
                          <td className="py-1.5 px-3">{item.parentDeptName}</td>
                          <td className="py-1.5 px-3 font-mono">{item.parentDeptCode || '-'}</td>
                          <td className="py-1.5 px-3">{item.leader}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="h-12 bg-[#F8F9FA] px-5 border-t border-[#E4E7ED] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setImportDeptModalVisible(false)}
                className="h-8 px-4 rounded border border-[#DCDFE6] text-xs text-[#606266] hover:bg-white cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmImportDept}
                className="h-8 px-4 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                确认导入组织架构 ({importDeptPreviewList.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
