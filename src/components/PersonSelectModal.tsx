import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Building2,
  FolderTree,
  Folder,
  CheckCircle2,
  Check,
  X,
  Info,
  User,
  Users,
  Plus,
  Sparkles,
  ArrowRight,
  Shield,
  Briefcase,
} from 'lucide-react';

export interface PersonItem {
  id: string;
  userName: string; // 中文显示名，如 "流程经理", "张三", "系统管理员"
  englishName?: string; // 英文名/账号，如 "flow_lead", "zhangsan", "sys_admin"
  empNo?: string; // 工号，如 "E0020"
  deptId?: string;
  deptName?: string; // 部门，如 "流程管理部"
  roleName?: string; // 岗位角色，如 "流程推进专员"
  avatarColor?: string;
}

export interface PersonSelectModalProps {
  open: boolean;
  title?: string;
  description?: string;
  multiSelect?: boolean;
  initialSelected?: string | string[] | PersonItem[];
  onClose: () => void;
  onConfirm: (selected: PersonItem[], selectedNames: string[]) => void;
  showToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

// 统一内置标准组织架构人员全量库 (对应 14 位企业真实人员及各业务部门)
const DEFAULT_PERSONS: PersonItem[] = [
  { id: 'u_3', empNo: 'E0020', userName: '流程经理', englishName: 'flow_lead', deptId: 'dept_02', deptName: '流程管理部', roleName: '流程推进专员', avatarColor: '#1677ff' },
  { id: 'u_zs', empNo: 'E0099', userName: '张三', englishName: 'zhangsan', deptId: 'dept_02', deptName: '流程管理部', roleName: '高级流程经理', avatarColor: '#36cfc9' },
  { id: 'u_ww', empNo: 'E0077', userName: '王五', englishName: 'wangwu', deptId: 'dept_02', deptName: '流程管理部', roleName: '流程合规主管', avatarColor: '#9254de' },
  { id: 'u_2', empNo: 'E0010', userName: '系统管理员', englishName: 'sys_admin', deptId: 'dept_01', deptName: '系统管理部', roleName: '系统架构师', avatarColor: '#597ef7' },
  { id: 'u_4', empNo: 'E0030', userName: '权责主管', englishName: 'duty_lead', deptId: 'dept_03', deptName: '权责管理部', roleName: '权责核准主管', avatarColor: '#fa8c16' },
  { id: 'u_1', empNo: 'E0001', userName: '知识管理员', englishName: 'admin', deptId: 'dept_04', deptName: '知识管理部', roleName: '知识运营专家', avatarColor: '#faad14' },
  { id: 'u_5', empNo: 'E0050', userName: '研发总监', englishName: 'rd_director', deptId: 'dept_05', deptName: '研发管理中心', roleName: '中心总经理', avatarColor: '#52c41a' },
  { id: 'u_ls', empNo: 'E0088', userName: '李四', englishName: 'lisi', deptId: 'dept_05', deptName: '研发管理中心', roleName: '高级业务专家', avatarColor: '#13c2c2' },
  { id: 'u_6', empNo: 'E0041', userName: '结构设计主管', englishName: 'struct_lead', deptId: 'dept_06', deptName: '结构开发部', roleName: '结构设计工程师', avatarColor: '#f759ab' },
  { id: 'u_7', empNo: 'E0042', userName: '软件架构师', englishName: 'dev_lead', deptId: 'dept_07', deptName: '软件开发部', roleName: '软件研发组长', avatarColor: '#722ed1' },
  { id: 'u_8', empNo: 'E0043', userName: '电气工程师', englishName: 'elec_eng', deptId: 'dept_08', deptName: '电气开发部', roleName: '电气开发工程师', avatarColor: '#2f54eb' },
  { id: 'u_9', empNo: 'E0044', userName: '项目管理主管', englishName: 'pm_lead', deptId: 'dept_09', deptName: '项目管理部', roleName: '项目推进主管', avatarColor: '#fa541c' },
  { id: 'u_10', empNo: 'E0091', userName: '质量测试员', englishName: 'tz_tester', deptId: 'dept_10', deptName: 'TZ测试部门', roleName: '测试工程师', avatarColor: '#eb2f96' },
  { id: 'u_11', empNo: 'E0092', userName: '测试专员A', englishName: 'tz_spec', deptId: 'dept_11', deptName: 'TZ测试1部', roleName: '测试助理工程师', avatarColor: '#8c8c8c' },
];

const DEFAULT_DEPTS = [
  { id: 'all', name: '全部部门 (全员总览)', count: 14 },
  { id: 'dept_01', name: '系统管理部', count: 1 },
  { id: 'dept_02', name: '流程管理部', count: 3 },
  { id: 'dept_03', name: '权责管理部', count: 1 },
  { id: 'dept_04', name: '知识管理部', count: 1 },
  { id: 'dept_05', name: '研发管理中心', count: 2 },
  { id: 'dept_06', name: '结构开发部', count: 1 },
  { id: 'dept_07', name: '软件开发部', count: 1 },
  { id: 'dept_08', name: '电气开发部', count: 1 },
  { id: 'dept_09', name: '项目管理部', count: 1 },
  { id: 'dept_10', name: 'TZ测试部门', count: 1 },
];

export const PersonSelectModal: React.FC<PersonSelectModalProps> = ({
  open,
  title,
  description,
  multiSelect = false,
  initialSelected,
  onClose,
  onConfirm,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'orgTree' | 'manual'>('orgTree');
  const [allPersons, setAllPersons] = useState<PersonItem[]>(DEFAULT_PERSONS);
  const [selectedPersons, setSelectedPersons] = useState<PersonItem[]>([]);
  const [manualInputText, setManualInputText] = useState('');
  const [deptFilterText, setDeptFilterText] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept_02'); // 默认展示流程管理部 (与设计图完全一致)

  // 尝试从后端同步最新的全量组织架构数据
  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    fetch('/api/org/bundle')
      .then((res) => (res.ok ? res.json() : null))
      .then((bundle) => {
        if (!isMounted || !bundle || !bundle.data?.users) return;
        const users = bundle.data.users;
        if (Array.isArray(users) && users.length > 0) {
          const mapped: PersonItem[] = users.map((u: any) => ({
            id: u.id || `u_${u.userName || Math.random()}`,
            userName: u.nickName || u.userName || '未知人员',
            englishName: u.userName || '',
            empNo: u.empNo || 'E0000',
            deptId: u.deptId || '',
            deptName: u.deptName || '未分配部门',
            roleName: u.positionName || (u.roleNames && u.roleNames[0]) || '业务人员',
            avatarColor:
              u.deptName?.includes('流程') ? '#1677ff' :
              u.deptName?.includes('研发') ? '#52c41a' :
              u.deptName?.includes('系统') ? '#597ef7' :
              u.deptName?.includes('权责') ? '#fa8c16' : '#9254de',
          }));
          setAllPersons(mapped);
        }
      })
      .catch(() => {
        // 使用内置数据兜底
      });

    return () => {
      isMounted = false;
    };
  }, [open]);

  // 初始化选中的人员列表
  useEffect(() => {
    if (!open) return;
    setManualInputText('');
    setDeptFilterText('');

    let initialNames: string[] = [];
    if (typeof initialSelected === 'string') {
      initialNames = initialSelected.trim() ? [initialSelected.trim()] : [];
    } else if (Array.isArray(initialSelected)) {
      initialNames = initialSelected.map((item) => {
        if (typeof item === 'string') return item.trim();
        return item.userName || '';
      }).filter(Boolean);
    }

    if (initialNames.length === 0) {
      setSelectedPersons([]);
      return;
    }

    const matched = initialNames.map((name) => {
      const cleanName = name.replace(/\(.*?\)|（.*?）/g, '').trim();
      const found = allPersons.find(
        (p) =>
          p.userName.toLowerCase() === name.toLowerCase() ||
          (cleanName && p.userName.toLowerCase() === cleanName.toLowerCase()) ||
          (p.englishName && p.englishName.toLowerCase() === name.toLowerCase())
      );
      if (found) return found;
      return {
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userName: name,
        englishName: '',
        empNo: '自定义',
        deptName: '手工输入人员',
        roleName: '责任人',
        avatarColor: '#1677ff',
      };
    });

    setSelectedPersons(matched);
  }, [open, initialSelected, allPersons]);

  // 部门人员列表过滤
  const deptList = useMemo(() => {
    return DEFAULT_DEPTS.filter((d) =>
      !deptFilterText || d.name.toLowerCase().includes(deptFilterText.toLowerCase())
    );
  }, [deptFilterText]);

  // 当前选中部门对应的人员
  const currentDeptPersons = useMemo(() => {
    if (selectedDeptId === 'all') return allPersons;
    return allPersons.filter((p) => p.deptId === selectedDeptId);
  }, [selectedDeptId, allPersons]);

  // 手工输入搜索匹配列表
  const manualMatches = useMemo(() => {
    const q = manualInputText.trim().toLowerCase();
    if (!q) return allPersons.slice(0, 8);
    return allPersons.filter(
      (p) =>
        p.userName.toLowerCase().includes(q) ||
        (p.englishName && p.englishName.toLowerCase().includes(q)) ||
        (p.empNo && p.empNo.toLowerCase().includes(q)) ||
        (p.deptName && p.deptName.toLowerCase().includes(q))
    );
  }, [manualInputText, allPersons]);

  const isPersonSelected = (person: PersonItem) => {
    return selectedPersons.some((p) => {
      if (p.id === person.id) return true;
      const u1 = p.userName.toLowerCase();
      const u2 = person.userName.toLowerCase();
      if (u1 === u2) return true;
      const clean1 = u1.replace(/\(.*?\)|（.*?）/g, '').trim();
      const clean2 = u2.replace(/\(.*?\)|（.*?）/g, '').trim();
      if (clean1 && clean2 && clean1 === clean2) return true;
      if (p.englishName && person.englishName && p.englishName.toLowerCase() === person.englishName.toLowerCase()) return true;
      return false;
    });
  };

  const handleToggleSelectPerson = (person: PersonItem) => {
    if (multiSelect) {
      if (isPersonSelected(person)) {
        setSelectedPersons((prev) =>
          prev.filter((p) => p.id !== person.id && p.userName !== person.userName)
        );
      } else {
        setSelectedPersons((prev) => [...prev, person]);
      }
    } else {
      // 单选模式：直接替换并高亮
      setSelectedPersons([person]);
    }
  };

  const handleAddCustomManualPerson = (nameToUse?: string) => {
    const name = (nameToUse || manualInputText).trim();
    if (!name) return;

    // 检查是否已有完全同名的人
    const existing = allPersons.find(
      (p) =>
        p.userName.toLowerCase() === name.toLowerCase() ||
        (p.englishName && p.englishName.toLowerCase() === name.toLowerCase())
    );

    const personToAdd: PersonItem = existing || {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userName: name,
      englishName: '',
      empNo: '自定义',
      deptName: '外部/自定义人员',
      roleName: '责任人',
      avatarColor: '#1677ff',
    };

    if (multiSelect) {
      if (!isPersonSelected(personToAdd)) {
        setSelectedPersons((prev) => [...prev, personToAdd]);
      }
    } else {
      setSelectedPersons([personToAdd]);
    }
    setManualInputText('');
    showToast?.(`已添加人员「${name}」`, 'info');
  };

  const handleConfirm = () => {
    if (selectedPersons.length === 0) {
      showToast?.('请先选择或手工输入至少一位人员', 'warning');
      return;
    }
    const names = selectedPersons.map((p) => p.userName);
    onConfirm(selectedPersons, names);
    onClose();
  };

  const currentDeptObj = DEFAULT_DEPTS.find((d) => d.id === selectedDeptId);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ebeef5] w-full max-w-[800px] h-[640px] max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#303133]">
        {/* Top Header Mode Tabs: Exactly Matching image_3cd41a5b.png */}
        <div className="p-3.5 border-b border-[#f0f2f5] bg-[#fafbfc] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 bg-[#ebeef5]/90 p-1 rounded-xl text-xs w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`px-3.5 py-1.5 rounded-lg transition-all font-medium cursor-pointer flex items-center gap-2 ${
                activeTab === 'manual'
                  ? 'bg-white text-[#1677ff] shadow-xs'
                  : 'text-[#606266] hover:text-[#303133]'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-current" />
              <span>手工输入人名 / 联想搜索 (中文/英文)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orgTree')}
              className={`px-3.5 py-1.5 rounded-lg transition-all font-medium cursor-pointer flex items-center gap-2 ${
                activeTab === 'orgTree'
                  ? 'bg-white text-[#1677ff] shadow-xs'
                  : 'text-[#606266] hover:text-[#303133]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-current" />
              <span>从组织架构部门中选择某个人</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#ebeef5] text-[#909399] hover:text-[#303133] flex items-center justify-center cursor-pointer transition-colors"
            title="关闭窗口"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subheader Banner: Matching image_3cd41a5b.png */}
        <div className="px-5 py-2.5 bg-[#fcfdfe] border-b border-[#f0f2f5] flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2 text-[#606266]">
            <Building2 className="w-4 h-4 text-[#1677ff]" />
            <span className="font-semibold text-[#1f2733]">组织架构部门人员树</span>
            <span className="text-[#909399]">
              {activeTab === 'orgTree'
                ? '请点击左侧部门，在右侧选择该部门下的某位人员'
                : '支持键入中英文名称或工号进行快速模糊匹配与自由录入'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'orgTree' ? 'manual' : 'orgTree')}
            className="text-[#1677ff] hover:underline cursor-pointer font-medium"
          >
            {activeTab === 'orgTree' ? '切换为手工输入' : '切换为组织架构选择'}
          </button>
        </div>

        {/* Currently Selected Preview Badges (especially in multiSelect or when a person is chosen) */}
        {selectedPersons.length > 0 && (
          <div className="px-5 py-2 bg-[#f4f8ff] border-b border-[#e1effe] flex items-center gap-2 text-xs overflow-x-auto shrink-0">
            <span className="text-[#606266] shrink-0 font-medium">已选择人员 ({selectedPersons.length}):</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedPersons.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#b3d8ff] text-[#1677ff] text-[11px] font-medium shadow-2xs"
                >
                  <span>{p.userName}</span>
                  {p.empNo && p.empNo !== '自定义' && (
                    <span className="text-[10px] text-[#8c8c8c] font-mono">({p.empNo})</span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPersons((prev) => prev.filter((item) => item.id !== p.id && item.userName !== p.userName))
                    }
                    className="hover:text-red-500 rounded-full cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedPersons.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedPersons([])}
                  className="text-[11px] text-[#909399] hover:text-red-500 hover:underline cursor-pointer ml-1"
                >
                  清空全部
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Area: Org Tree Mode vs Manual Input Mode */}
        {activeTab === 'orgTree' ? (
          /* TAB 2: Org Tree View - Matching image_3cd41a5b.png */
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Left Column: Department List */}
            <div className="w-[260px] border-r border-[#ebeef5] flex flex-col h-full shrink-0 bg-white">
              {/* Search Department */}
              <div className="p-3 border-b border-[#f0f2f5]">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={deptFilterText}
                    onChange={(e) => setDeptFilterText(e.target.value)}
                    placeholder="筛选部门..."
                    className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-[#dcdfe6] text-xs text-[#303133] outline-none focus:border-[#409eff] bg-[#fafbfc]"
                  />
                  {deptFilterText && (
                    <button
                      type="button"
                      onClick={() => setDeptFilterText('')}
                      className="absolute right-2 text-[#909399] hover:text-[#303133]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Department Items */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {deptList.map((dept) => {
                  const isSelected = selectedDeptId === dept.id;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => setSelectedDeptId(dept.id)}
                      className={`w-full px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors text-left ${
                        isSelected
                          ? 'bg-[#ecf5ff] text-[#1677ff] font-semibold'
                          : 'text-[#4b5563] hover:bg-[#f5f7fa]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {dept.id === 'all' ? (
                          <FolderTree className="w-4 h-4 text-current shrink-0" />
                        ) : (
                          <Folder className="w-4 h-4 text-current shrink-0" />
                        )}
                        <span className="truncate">{dept.name}</span>
                      </div>
                      <span className="text-[11px] text-[#909399] font-mono shrink-0 ml-1">
                        {dept.count} 人
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Person Cards */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-[#fafbfc]">
              {/* Dept Header */}
              <div className="px-5 py-3 border-b border-[#ebeef5] bg-white flex items-center justify-between shrink-0">
                <span className="font-bold text-xs text-[#1f2733]">
                  {currentDeptObj?.name || '部门人员'}
                </span>
                <span className="text-xs text-[#909399]">
                  共 {currentDeptPersons.length} 位人员 (点击直接选择)
                </span>
              </div>

              {/* Member Cards List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {currentDeptPersons.length === 0 ? (
                  <div className="text-center py-16 text-xs text-[#909399]">
                    该部门暂未录入人员数据
                  </div>
                ) : (
                  currentDeptPersons.map((person) => {
                    const isSelected = isPersonSelected(person);
                    return (
                      <div
                        key={person.id}
                        onClick={() => handleToggleSelectPerson(person)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#eef6ff] border-[#91caff] shadow-2xs'
                            : 'bg-white border-[#ebeef5] hover:border-[#b3d8ff] hover:bg-white shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar with initial */}
                          <div
                            className="w-10 h-10 rounded-full text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs select-none"
                            style={{ backgroundColor: person.avatarColor || '#1677ff' }}
                          >
                            {person.userName.slice(0, 1)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#1f2733] truncate">
                                {person.userName}
                              </span>
                              {person.englishName && (
                                <span className="text-[11px] font-mono text-[#1677ff] font-medium">
                                  @{person.englishName}
                                </span>
                              )}
                              {person.empNo && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#f5f7fa] text-[#8c8c8c] font-mono border border-[#ebeef5]">
                                  {person.empNo}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#8c8c8c] mt-0.5 truncate">
                              {person.deptName} · {person.roleName || '业务人员'}
                            </div>
                          </div>
                        </div>

                        {/* Action Select Button */}
                        <div className="shrink-0 ml-3">
                          {isSelected ? (
                            <button
                              type="button"
                              className="h-7 px-3.5 rounded-lg bg-[#1677ff] text-white text-xs font-medium flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              <span>已选定</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="h-7 px-3.5 rounded-lg border border-[#d9ecff] bg-[#f4f8ff] text-[#1677ff] hover:bg-[#e6f4ff] text-xs font-medium cursor-pointer transition-colors"
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
        ) : (
          /* TAB 1: Manual Input & Fuzzy Matching View */
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-5 bg-[#fafbfc]">
            {/* Input Card */}
            <div className="bg-white p-5 rounded-xl border border-[#ebeef5] shadow-xs space-y-3">
              <label className="block text-xs font-semibold text-[#1f2733]">
                手工录入人员姓名或检索账号 (支持中文、英文、工号)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <Search className="w-4 h-4 text-[#909399] absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={manualInputText}
                    onChange={(e) => setManualInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (manualInputText.trim()) {
                          handleAddCustomManualPerson();
                        }
                      }
                    }}
                    placeholder="输入中英文姓名或工号 (如 张三 / zhangsan / E0099)，支持按回车键直接添加任意姓名..."
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#dcdfe6] focus:border-[#1677ff] text-xs text-[#303133] outline-none transition-colors"
                  />
                  {manualInputText && (
                    <button
                      type="button"
                      onClick={() => setManualInputText('')}
                      className="absolute right-3 text-[#909399] hover:text-[#303133]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddCustomManualPerson()}
                  disabled={!manualInputText.trim()}
                  className="h-10 px-4 rounded-lg bg-[#1677ff] hover:bg-[#409eff] disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加该人员</span>
                </button>
              </div>

              {manualInputText.trim() && (
                <div className="p-2.5 rounded-lg bg-[#f0f9eb] border border-[#e1f3d8] text-xs text-[#67c23a] flex items-center justify-between">
                  <span>
                    💡 点击上方「添加该人员」或直接按回车，可将自定义名称 <strong>「{manualInputText.trim()}」</strong> 直接设为责任人。
                  </span>
                </div>
              )}
            </div>

            {/* Quick Suggest Candidate Cards */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-[#606266] block">
                {manualInputText.trim() ? `搜索匹配人员 (${manualMatches.length})` : '常用推荐人员候选'}
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                {manualMatches.map((person) => {
                  const isSelected = isPersonSelected(person);
                  return (
                    <div
                      key={person.id}
                      onClick={() => handleToggleSelectPerson(person)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#eef6ff] border-[#91caff] shadow-2xs'
                          : 'bg-white border-[#ebeef5] hover:border-[#b3d8ff] hover:bg-white shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0"
                          style={{ backgroundColor: person.avatarColor || '#1677ff' }}
                        >
                          {person.userName.slice(0, 1)}
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="font-semibold text-xs text-[#1f2733] truncate">
                            {person.userName}
                            {person.englishName && (
                              <span className="text-[10px] text-[#1677ff] font-mono ml-1.5">
                                @{person.englishName}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#909399] truncate">
                            {person.deptName} · {person.empNo}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-[#1677ff] text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#1677ff] font-medium">选择</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer: Matching image_3cd41a5b.png */}
        <div className="px-5 py-3.5 border-t border-[#ebeef5] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#606266]">
            <Info className="w-4 h-4 text-[#1677ff] shrink-0" />
            <span>支持手工输入中英文姓名或从组织架构部门选人，保存后协作者信息将实时持久化生效</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 rounded-lg border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-xs text-[#606266] cursor-pointer transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="h-8 px-5 rounded-lg bg-[#1677ff] hover:bg-[#409eff] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>保存指派并生效</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
