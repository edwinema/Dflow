import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Users,
  CheckCircle2,
  X,
  Shield,
  Briefcase,
  Filter,
  FolderTree,
  Building2,
  Sparkles,
  Layers,
  Info,
  Check,
  AlertCircle,
} from 'lucide-react';

export interface ProcessRoleItem {
  id: string;
  roleNo?: number;
  roleCode: string;
  roleName: string;
  roleType: string; // e.g. "主责角色 (R)", "审批决策 (A)", "咨询会签 (C)", "知会抄送 (I)"
  category: string; // e.g. "02 研发与技术创新"
  boundPositions?: string[];
  assignedUsers?: { id: string; name: string; empNo?: string; deptName?: string }[];
  boundFlows?: { flowId: string; flowNo: string; flowName: string; stepName: string; raci: string; kcp?: boolean }[];
  rankRequirement?: string;
  isKcpApprover?: boolean;
  sort?: number;
  status?: '0' | '1'; // 0: 正常, 1: 停用
  remark?: string;
  createTime?: string;
}

export interface RoleCategoryItem {
  id: string;
  name: string;
  code?: string;
  count?: number;
}

export interface RoleLibrarySelectModalProps {
  open: boolean;
  initialSelectedRoleName?: string;
  onClose: () => void;
  onConfirm: (selectedRole: ProcessRoleItem) => void;
  showToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

// 默认内置的流程角色库备用数据 (与系统 流程建设-角色库 完全同步)
const FALLBACK_ROLES: ProcessRoleItem[] = [
  {
    id: 'prole_1',
    roleNo: 1,
    roleCode: 'PR-ARCH-01',
    roleName: '系统架构师',
    roleType: '主责角色 (R)',
    category: '02 研发与技术创新',
    boundPositions: ['系统架构师', '高级架构师'],
    assignedUsers: [
      { id: 'u_2', name: '系统管理员', empNo: 'E0010', deptName: '系统管理部' },
      { id: 'u_zhang', name: '张三', empNo: 'E0102', deptName: '集成电路设计院' },
    ],
    isKcpApprover: true,
    status: '0',
    remark: '负责端到端系统架构设计、微架构技术评审与核心交付物 Sign-off',
  },
  {
    id: 'prole_2',
    roleNo: 2,
    roleCode: 'PR-PMT-01',
    roleName: '产品经理 (PMT)',
    roleType: '主责角色 (R)',
    category: '03 产品与项目运营',
    boundPositions: ['产品经理', '高级产品专家'],
    assignedUsers: [
      { id: 'u_3', name: '李四', empNo: 'E0025', deptName: '产品规划部' },
    ],
    isKcpApprover: true,
    status: '0',
    remark: '统筹产品生命周期Charter立项、需求规格基线冻结及上市交付',
  },
  {
    id: 'prole_3',
    roleNo: 3,
    roleCode: 'PR-DEV-01',
    roleName: '研发工程师',
    roleType: '主责角色 (R)',
    category: '02 研发与技术创新',
    boundPositions: ['高级软件工程师', '中级工程师 / 资深专员'],
    assignedUsers: [
      { id: 'u_5', name: '王五', empNo: 'E0033', deptName: '软件开发部' },
    ],
    isKcpApprover: false,
    status: '0',
    remark: '负责产品模块设计、核心功能代码编写与单元测试交付',
  },
  {
    id: 'prole_4',
    roleNo: 4,
    roleCode: 'PR-REV-01',
    roleName: '流程架构师',
    roleType: '主责角色 (R)',
    category: '01 战略与治理',
    boundPositions: ['流程架构师', '高级流程经理'],
    assignedUsers: [
      { id: 'u_6', name: '赵六', empNo: 'E0008', deptName: '流程管理部' },
    ],
    isKcpApprover: true,
    status: '0',
    remark: '主导企业L1-L6级流程架构设计与治理，负责流程资产发布与合规审查',
  },
  {
    id: 'prole_5',
    roleNo: 5,
    roleCode: 'PR-TR-01',
    roleName: '技术评审专家',
    roleType: '审批决策 (A)',
    category: '02 研发与技术创新',
    boundPositions: ['技术专家 / 资深顾问'],
    assignedUsers: [
      { id: 'u_7', name: '钱七', empNo: 'E0018', deptName: '研发管理中心' },
    ],
    isKcpApprover: true,
    status: '0',
    remark: '主导TR同行技术评审、技术难点攻关及KCP控制点把关',
  },
  {
    id: 'prole_6',
    roleNo: 6,
    roleCode: 'PR-QA-01',
    roleName: '质量合规主管',
    roleType: '主责角色 (R)',
    category: '08 质量、安全与合规',
    boundPositions: ['质量总监', '内控合规审查官'],
    assignedUsers: [
      { id: 'u_8', name: '孙八', empNo: 'E0045', deptName: '质量管理部' },
    ],
    isKcpApprover: true,
    status: '0',
    remark: '负责流程合规审查、质量红线审计与体系认证',
  },
  {
    id: 'prole_7',
    roleNo: 7,
    roleCode: 'PR-TEST-01',
    roleName: '测试工程师',
    roleType: '主责角色 (R)',
    category: '02 研发与技术创新',
    boundPositions: ['质量测试员', '测试专员'],
    assignedUsers: [
      { id: 'u_9', name: '周九', empNo: 'E0052', deptName: '测试开发部' },
    ],
    isKcpApprover: false,
    status: '0',
    remark: '负责测试用例编写、集成联调测试与缺陷跟踪验证',
  },
  {
    id: 'prole_8',
    roleNo: 8,
    roleCode: 'PR-IPMT-01',
    roleName: '评审委员会',
    roleType: '审批决策 (A)',
    category: '01 战略与治理',
    boundPositions: ['中心总经理 / 副总裁', '首席执行官 / CEO'],
    assignedUsers: [
      { id: 'u_10', name: '吴十', empNo: 'E0002', deptName: '公司高管层' },
    ],
    isKcpApprover: true,
    status: '0',
    remark: '公司重大业务决策与投资决策评审团队，对DCP立项与结项终审表决',
  },
  {
    id: 'prole_9',
    roleNo: 9,
    roleCode: 'PR-SCM-01',
    roleName: '供应链经理',
    roleType: '主责角色 (R)',
    category: '05 供应链与交付',
    boundPositions: ['部门经理 / 执行总监'],
    assignedUsers: [
      { id: 'u_11', name: '郑十一', empNo: 'E0066', deptName: '供应链管理中心' },
    ],
    isKcpApprover: false,
    status: '0',
    remark: '负责物料选型打样、供应商导入协同及关键原器件保供',
  },
  {
    id: 'prole_10',
    roleNo: 10,
    roleCode: 'PR-SALES-01',
    roleName: '大客户销售经理',
    roleType: '主责角色 (R)',
    category: '04 营销与商务拓展',
    boundPositions: ['中级工程师 / 资深专员', '基层团队主管'],
    assignedUsers: [
      { id: 'u_12', name: '陈十二', empNo: 'E0071', deptName: '市场营销部' },
    ],
    isKcpApprover: false,
    status: '0',
    remark: '对接政企大客户高层，主导BANT商机资格认证与商务合同条款谈判',
  },
];

export const RoleLibrarySelectModal: React.FC<RoleLibrarySelectModalProps> = ({
  open,
  initialSelectedRoleName = '',
  onClose,
  onConfirm,
  showToast,
}) => {
  const [roles, setRoles] = useState<ProcessRoleItem[]>(FALLBACK_ROLES);
  const [categories, setCategories] = useState<RoleCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRoleType, setSelectedRoleType] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<ProcessRoleItem | null>(null);

  // 加载流程角色库数据 (与 流程建设-角色库 完全联动)
  useEffect(() => {
    if (!open) return;
    setLoading(true);

    Promise.all([
      fetch('/api/build/roles?pageSize=200')
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
      fetch('/api/build/role-categories')
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ])
      .then(([rolesRes, catsRes]) => {
        let loadedRoles: ProcessRoleItem[] = FALLBACK_ROLES;
        if (rolesRes && Array.isArray(rolesRes.rows) && rolesRes.rows.length > 0) {
          loadedRoles = rolesRes.rows;
          setRoles(loadedRoles);
        } else {
          setRoles(FALLBACK_ROLES);
        }

        if (catsRes && Array.isArray(catsRes.data) && catsRes.data.length > 0) {
          setCategories(catsRes.data);
        } else {
          // 从已有 roles 中自动聚类 categories
          const catMap = new Map<string, number>();
          loadedRoles.forEach((r) => {
            if (r.category) {
              catMap.set(r.category, (catMap.get(r.category) || 0) + 1);
            }
          });
          const autoCats: RoleCategoryItem[] = Array.from(catMap.entries()).map(([name, count], idx) => ({
            id: `cat_${idx}`,
            name,
            count,
          }));
          setCategories(autoCats);
        }

        // 初始化选中项
        if (initialSelectedRoleName) {
          const matched = loadedRoles.find(
            (r) =>
              r.roleName === initialSelectedRoleName ||
              initialSelectedRoleName.includes(r.roleName) ||
              r.roleName.includes(initialSelectedRoleName)
          );
          if (matched) {
            setSelectedRole(matched);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [open, initialSelectedRoleName]);

  // 根据搜索、业务域和角色类型进行前端过滤
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      // 业务域筛选
      if (selectedCategory !== 'all') {
        if (!role.category || !role.category.includes(selectedCategory)) {
          return false;
        }
      }

      // 角色类型筛选
      if (selectedRoleType !== 'all') {
        if (!role.roleType || !role.roleType.includes(selectedRoleType)) {
          return false;
        }
      }

      // 关键词检索 (角色名称、角色编码、岗位、职责)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = role.roleName?.toLowerCase().includes(q);
        const matchCode = role.roleCode?.toLowerCase().includes(q);
        const matchRemark = role.remark?.toLowerCase().includes(q);
        const matchPositions = Array.isArray(role.boundPositions) && role.boundPositions.some((p) => p.toLowerCase().includes(q));
        const matchUsers = Array.isArray(role.assignedUsers) && role.assignedUsers.some((u) => u.name?.toLowerCase().includes(q));
        if (!matchName && !matchCode && !matchRemark && !matchPositions && !matchUsers) {
          return false;
        }
      }

      return true;
    });
  }, [roles, selectedCategory, selectedRoleType, searchQuery]);

  if (!open) return null;

  const handleConfirm = () => {
    if (!selectedRole) {
      if (showToast) showToast('请先选择一个流程负责角色', 'warning');
      return;
    }
    onConfirm(selectedRole);
    onClose();
  };

  const getRoleTypeBadge = (roleType: string) => {
    if (roleType.includes('R') || roleType.includes('主责')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (roleType.includes('A') || roleType.includes('审批') || roleType.includes('决策')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (roleType.includes('C') || roleType.includes('咨询') || roleType.includes('会签')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (roleType.includes('I') || roleType.includes('知会') || roleType.includes('抄送')) {
      return 'bg-gray-50 text-gray-700 border-gray-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#dcdfe6] w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden text-xs animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ecf5ff] text-[#1677ff] flex items-center justify-center font-bold shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#1f2733]">选择流程负责角色</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#ecf5ff] text-[#1677ff] border border-[#d9ecff]">
                  流程建设 · 角色库
                </span>
              </div>
              <p className="text-[11px] text-[#909399] mt-0.5">
                从企业流程角色库中选定标准责任主体，已关联业务域、岗位要求及审批控制点
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#909399] hover:text-[#303133] p-1.5 rounded-lg hover:bg-[#f0f2f5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3.5 border-b border-[#ebeef5] bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-3.5 h-3.5 text-[#909399] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索角色名称、角色编码、对应组织岗位、职责说明..."
              className="w-full h-8 pl-8 pr-7 rounded-md border border-[#dcdfe6] focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff]/20 outline-none text-xs text-[#303133] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#c0c4cc] hover:text-[#909399]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Type Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[#909399] text-xs font-medium">角色类型：</span>
            {[
              { key: 'all', label: '全部类型' },
              { key: '主责', label: '主责角色 (R)' },
              { key: '审批', label: '审批决策 (A)' },
              { key: '咨询', label: '咨询会签 (C)' },
              { key: '知会', label: '知会抄送 (I)' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelectedRoleType(t.key)}
                className={`h-7 px-2.5 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                  selectedRoleType === t.key
                    ? 'bg-[#1677ff] text-white border-[#1677ff]'
                    : 'bg-white text-[#606266] border-[#dcdfe6] hover:bg-[#f5f7fa]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Left Categories + Right Role Table */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Category Sidebar */}
          <div className="w-48 border-r border-[#ebeef5] bg-[#fafafa] flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-[#f0f2f5] text-[11px] font-bold text-[#606266] flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-[#1677ff]" />
              <span>业务域分类</span>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`w-full px-2.5 py-2 rounded text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#ecf5ff] text-[#1677ff] font-bold'
                    : 'text-[#606266] hover:bg-[#f0f2f5]'
                }`}
              >
                <span>全业务域总览</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 text-[#909399]">
                  {roles.length}
                </span>
              </button>

              {categories.map((c) => {
                const count = roles.filter((r) => r.category && r.category.includes(c.name)).length;
                const isSelected = selectedCategory === c.name;
                return (
                  <button
                    key={c.id || c.name}
                    type="button"
                    onClick={() => setSelectedCategory(c.name)}
                    className={`w-full px-2.5 py-2 rounded text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#ecf5ff] text-[#1677ff] font-bold'
                        : 'text-[#606266] hover:bg-[#f0f2f5]'
                    }`}
                  >
                    <span className="truncate pr-1" title={c.name}>
                      {c.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 text-[#909399] shrink-0">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Role Table */}
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-[#909399] gap-2">
                  <div className="w-6 h-6 border-2 border-[#1677ff] border-t-transparent rounded-full animate-spin" />
                  <span>正在从角色库中读取流程角色...</span>
                </div>
              ) : filteredRoles.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-[#909399] gap-2">
                  <AlertCircle className="w-8 h-8 text-[#c0c4cc]" />
                  <p>没有找到符合条件的流程角色</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedRoleType('all');
                    }}
                    className="text-xs text-[#1677ff] hover:underline cursor-pointer"
                  >
                    清除筛选条件
                  </button>
                </div>
              ) : (
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 bg-[#f8f9fb] border-b border-[#ebeef5] text-[11px] font-semibold text-[#606266] select-none z-10">
                    <tr>
                      <th className="w-10 px-3 py-2 text-center">选择</th>
                      <th className="px-3 py-2">角色名称</th>
                      <th className="px-3 py-2">角色编码</th>
                      <th className="px-3 py-2">角色类型</th>
                      <th className="px-3 py-2">归属业务域</th>
                      <th className="px-3 py-2">对应组织岗位</th>
                      <th className="px-3 py-2">职责定位说明</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f2f5]">
                    {filteredRoles.map((role) => {
                      const isSelected = selectedRole?.id === role.id;
                      return (
                        <tr
                          key={role.id}
                          onClick={() => setSelectedRole(role)}
                          onDoubleClick={() => {
                            setSelectedRole(role);
                            onConfirm(role);
                            onClose();
                          }}
                          className={`hover:bg-[#f5f8ff] cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#ecf5ff]/60' : ''
                          }`}
                        >
                          <td className="px-3 py-2 text-center">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors mx-auto ${
                                isSelected
                                  ? 'border-[#1677ff] bg-[#1677ff] text-white'
                                  : 'border-[#dcdfe6] bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-bold text-[#303133] flex items-center gap-1.5">
                              <span>{role.roleName}</span>
                              {role.isKcpApprover && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                  KCP
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] text-[#606266]">
                            {role.roleCode}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getRoleTypeBadge(
                                role.roleType || ''
                              )}`}
                            >
                              {role.roleType || '业务角色'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[#606266] text-[11px] whitespace-nowrap">
                            {role.category}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {Array.isArray(role.boundPositions) && role.boundPositions.length > 0 ? (
                                role.boundPositions.map((pos) => (
                                  <span
                                    key={pos}
                                    className="px-1.5 py-0.5 rounded bg-gray-100 text-[#606266] text-[10px]"
                                  >
                                    {pos}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[#c0c4cc] text-[11px]">未绑定岗位</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[#606266] text-[11px] max-w-[220px]">
                            <p className="line-clamp-2" title={role.remark || '无'}>
                              {role.remark || '企业标准业务角色，承担端到端流程对应节点职责'}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {selectedRole ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#909399]">当前已选：</span>
                <span className="font-bold text-[#1677ff] bg-[#ecf5ff] px-2 py-0.5 rounded border border-[#d9ecff] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1677ff]" />
                  <span>{selectedRole.roleName}</span>
                  <span className="font-mono text-[11px] text-[#606266]">({selectedRole.roleCode})</span>
                </span>
                <span className="text-[11px] text-[#909399]">
                  {selectedRole.category} · {selectedRole.roleType}
                </span>
              </div>
            ) : (
              <span className="text-[#909399] text-xs">双击行或选中后点击“确定选定角色”即可应用</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 rounded border border-[#dcdfe6] hover:bg-[#f0f2f5] text-[#606266] text-xs font-medium cursor-pointer transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              disabled={!selectedRole}
              onClick={handleConfirm}
              className={`h-8 px-5 rounded text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs ${
                selectedRole
                  ? 'bg-[#1677ff] hover:bg-[#409eff] cursor-pointer'
                  : 'bg-[#a0cfff] cursor-not-allowed opacity-60'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>确定选定角色</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
