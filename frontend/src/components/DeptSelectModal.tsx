import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2,
  Building,
  Search,
  FolderTree,
  Folder,
  CheckCircle2,
  Check,
  X,
  Info,
  Plus,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Network,
  ChevronRight,
  Tag,
  Briefcase,
} from 'lucide-react';

export interface DeptItem {
  id: string;
  deptName: string;
  deptCode?: string;
  parentDeptName?: string;
  parentDeptCode?: string;
  leader?: string;
  category?: string;
  badge?: string;
}

export interface DeptSelectModalProps {
  open: boolean;
  title?: string;
  description?: string;
  multiSelect?: boolean;
  initialSelected?: string | string[] | DeptItem[];
  onClose: () => void;
  onConfirm: (selected: DeptItem[], selectedNames: string[]) => void;
  showToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

// 统一内置标准企业全量组织架构体系 (涵盖集团总部、各大事业部、职能中心及下属部门)
export const DEFAULT_ORG_DEPTS: DeptItem[] = [
  { id: 'dept_01', deptName: '系统管理部', deptCode: '0010', parentDeptName: '集团总部', leader: '系统管理员', category: '集团职能', badge: 'IT架构' },
  { id: 'dept_02', deptName: '流程管理部', deptCode: '0020', parentDeptName: '集团总部', leader: '流程推进官', category: '集团职能', badge: '端到端流程' },
  { id: 'dept_03', deptName: '权责管理部', deptCode: '0030', parentDeptName: '集团总部', leader: '权责合规官', category: '集团职能', badge: 'DOA授权' },
  { id: 'dept_04', deptName: '知识管理部', deptCode: '0040', parentDeptName: '集团总部', leader: '知识管理员', category: '集团职能', badge: '标准知识库' },
  { id: 'dept_05', deptName: '研发管理中心', deptCode: '0050', parentDeptName: '集团总部', leader: '研发总监', category: '研发体系', badge: '事业部中心' },
  { id: 'dept_06', deptName: '结构开发部', deptCode: '0041', parentDeptName: '研发管理中心', leader: '结构主管', category: '研发体系', badge: '硬件工程' },
  { id: 'dept_07', deptName: '软件开发部', deptCode: '0042', parentDeptName: '研发管理中心', leader: '技术主管', category: '研发体系', badge: '核心研发' },
  { id: 'dept_08', deptName: '电气开发部', deptCode: '0043', parentDeptName: '研发管理中心', leader: '电气专家', category: '研发体系', badge: '系统硬件' },
  { id: 'dept_09', deptName: '项目管理部', deptCode: '0044', parentDeptName: '研发管理中心', leader: 'PMO经理', category: '研发体系', badge: 'IPD项目群' },
  { id: 'dept_qa', deptName: '质量合规部', deptCode: '0060', parentDeptName: '质量与内控中心', leader: '陈合规总监', category: '质量内控', badge: '质量合规' },
  { id: 'dept_mkt', deptName: '市场营销部', deptCode: '0070', parentDeptName: '营销商务中心', leader: '营销副总裁', category: '商务营销', badge: 'LTC体系' },
  { id: 'dept_fin', deptName: '财务部', deptCode: '0080', parentDeptName: '财务与资金中心', leader: '财务总监', category: '财务资金', badge: '预算审计' },
  { id: 'dept_hr', deptName: '人力行政部', deptCode: '0090', parentDeptName: '集团总部', leader: '人力总监', category: '集团职能', badge: '综合行政' },
  { id: 'dept_ceo', deptName: '总裁办', deptCode: '0001', parentDeptName: '最高决策层', leader: '总经理', category: '决策委员会', badge: '核心决策' },
  { id: 'dept_dec', deptName: '决策委员会', deptCode: '0002', parentDeptName: '最高决策层', leader: '委员会主任', category: '决策委员会', badge: '治理终审' },
  { id: 'dept_10', deptName: 'TZ测试部门', deptCode: 'TZ1', parentDeptName: '测试验证中心', leader: '测试经理', category: '测试验证', badge: '品质保证' },
  { id: 'dept_11', deptName: 'TZ测试1部', deptCode: 'TZ11', parentDeptName: 'TZ测试部门', leader: '测试组长', category: '测试验证', badge: '业务线测试' },
];

// 企业常见使用范围与事业部预设模板 (方便快速勾选或授权)
export const SCOPE_PRESETS: { name: string; desc: string; category: string }[] = [
  { name: '全集团各单位及下属子公司', desc: '包含母公司、所有业务事业部、区域中心及控股子公司', category: '全局授权' },
  { name: '集团总部及各直属职能中心', desc: '涵盖系统、流程、权责、知识管理部及人力行政、财务部', category: '总部职能' },
  { name: '研发管理中心及所辖开发部', desc: '涵盖软件开发部、结构开发部、电气开发部及项目管理部', category: '业务体系' },
  { name: '营销商务体系与各区域办事处', desc: '涵盖市场营销部、商务招投标中心及各大区驻外分支机构', category: '业务体系' },
  { name: '财务部与审计监察体系', desc: '涵盖财务管理中心、内控审计部及各事业部财务派出组', category: '专业条线' },
  { name: '供应链采购与生产制造中心', desc: '涵盖战略采购部、精益生产部、仓储物流及品质检验部', category: '运营交付' },
];

// 组织架构分类树
export const ORG_CATEGORIES = [
  { id: 'all', name: '全部部门 / 事业部', count: 17 },
  { id: '集团职能', name: '集团总部职能部门', count: 5 },
  { id: '研发体系', name: '研发管理中心与工程部', count: 5 },
  { id: '决策委员会', name: '最高决策层 (总裁办/委员会)', count: 2 },
  { id: '商务营销', name: '营销商务与业务线', count: 1 },
  { id: '财务资金', name: '财务部与预算资金', count: 1 },
  { id: '质量内控', name: '质量合规与标准部', count: 1 },
  { id: '测试验证', name: '测试验证中心与分部', count: 2 },
];

export const DeptSelectModal: React.FC<DeptSelectModalProps> = ({
  open,
  title = '选择部门与组织架构范围',
  description = '支持从公司组织架构部门树中挑选部门或事业部，也可手工输入自定义授权范围',
  multiSelect = true,
  initialSelected,
  onClose,
  onConfirm,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'orgTree' | 'manual'>('orgTree');
  const [allDepts, setAllDepts] = useState<DeptItem[]>(DEFAULT_ORG_DEPTS);
  const [selectedDepts, setSelectedDepts] = useState<DeptItem[]>([]);
  const [manualInputText, setManualInputText] = useState('');
  const [filterText, setFilterText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 同步从后端接口加载最新部门数据
  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    fetch('/api/org/bundle')
      .then((res) => (res.ok ? res.json() : null))
      .then((bundle) => {
        if (!isMounted || !bundle || !bundle.data?.depts) return;
        const depts = bundle.data.depts;
        if (Array.isArray(depts) && depts.length > 0) {
          const mapped: DeptItem[] = depts.map((d: any) => ({
            id: d.id || `dept_${Math.random()}`,
            deptName: d.deptName || '未命名部门',
            deptCode: d.deptCode || '0000',
            parentDeptName: d.parentDeptName || '集团总部',
            parentDeptCode: d.parentDeptCode || '',
            leader: d.leader || '负责人',
            category: d.parentDeptName?.includes('研发')
              ? '研发体系'
              : d.parentDeptName?.includes('测试')
              ? '测试验证'
              : '集团职能',
            badge: d.deptCode ? `编号:${d.deptCode}` : '部门',
          }));
          // 合并保留内置的高级事业部数据
          const merged = [...mapped];
          DEFAULT_ORG_DEPTS.forEach((def) => {
            if (!merged.some((m) => m.deptName === def.deptName)) {
              merged.push(def);
            }
          });
          setAllDepts(merged);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [open]);

  // 解析并初始化选中的部门/范围列表
  useEffect(() => {
    if (!open) return;
    setManualInputText('');
    setFilterText('');

    let initialNames: string[] = [];
    if (typeof initialSelected === 'string') {
      // 支持以逗号、分号或空格分隔的字符串
      initialNames = initialSelected
        .split(/[,;，；\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (Array.isArray(initialSelected)) {
      initialNames = initialSelected
        .map((item) => {
          if (typeof item === 'string') return item.trim();
          return item.deptName || '';
        })
        .filter(Boolean);
    }

    if (initialNames.length === 0) {
      setSelectedDepts([]);
      return;
    }

    const matched = initialNames.map((name) => {
      const found = allDepts.find(
        (d) =>
          d.deptName.toLowerCase() === name.toLowerCase() ||
          (d.deptCode && d.deptCode.toLowerCase() === name.toLowerCase())
      );
      if (found) return found;

      // 检查是否为通用范围模板
      const presetFound = SCOPE_PRESETS.find((p) => p.name === name);
      if (presetFound) {
        return {
          id: `preset_${name}`,
          deptName: presetFound.name,
          category: presetFound.category,
          badge: '业务范围',
        };
      }

      return {
        id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        deptName: name,
        category: '自定义范围',
        badge: '手工输入',
      };
    });

    setSelectedDepts(matched);
  }, [open, initialSelected, allDepts]);

  // 分类与关键词过滤
  const filteredDepts = useMemo(() => {
    return allDepts.filter((d) => {
      const matchCat = selectedCategory === 'all' || d.category === selectedCategory;
      if (!matchCat) return false;
      if (!filterText.trim()) return true;
      const q = filterText.trim().toLowerCase();
      return (
        d.deptName.toLowerCase().includes(q) ||
        (d.deptCode && d.deptCode.toLowerCase().includes(q)) ||
        (d.leader && d.leader.toLowerCase().includes(q)) ||
        (d.parentDeptName && d.parentDeptName.toLowerCase().includes(q))
      );
    });
  }, [allDepts, selectedCategory, filterText]);

  // 手工输入搜索与匹配推荐
  const manualMatches = useMemo(() => {
    const q = manualInputText.trim().toLowerCase();
    if (!q) {
      return allDepts.slice(0, 8);
    }
    return allDepts.filter(
      (d) =>
        d.deptName.toLowerCase().includes(q) ||
        (d.deptCode && d.deptCode.toLowerCase().includes(q)) ||
        (d.leader && d.leader.toLowerCase().includes(q))
    );
  }, [manualInputText, allDepts]);

  const isDeptSelected = (dept: DeptItem | { deptName: string }) => {
    return selectedDepts.some(
      (d) =>
        d.deptName.toLowerCase() === dept.deptName.toLowerCase() ||
        (d.id && (dept as DeptItem).id && d.id === (dept as DeptItem).id)
    );
  };

  const handleToggleSelectDept = (dept: DeptItem) => {
    if (multiSelect) {
      if (isDeptSelected(dept)) {
        setSelectedDepts((prev) =>
          prev.filter((d) => d.deptName !== dept.deptName && d.id !== dept.id)
        );
      } else {
        setSelectedDepts((prev) => [...prev, dept]);
      }
    } else {
      setSelectedDepts([dept]);
    }
  };

  const handleAddCustomManual = (nameToUse?: string) => {
    const name = (nameToUse || manualInputText).trim();
    if (!name) return;

    if (isDeptSelected({ deptName: name })) {
      showToast?.(`「${name}」已在选定列表中`, 'info');
      setManualInputText('');
      return;
    }

    const found = allDepts.find((d) => d.deptName.toLowerCase() === name.toLowerCase());
    const itemToAdd: DeptItem = found || {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      deptName: name,
      category: '自定义输入',
      badge: '手工输入',
    };

    if (multiSelect) {
      setSelectedDepts((prev) => [...prev, itemToAdd]);
    } else {
      setSelectedDepts([itemToAdd]);
    }
    setManualInputText('');
    showToast?.(`已添加「${name}」`, 'info');
  };

  // 批量全选当前分类下的所有部门
  const handleSelectAllCurrentCategory = () => {
    const next = [...selectedDepts];
    filteredDepts.forEach((d) => {
      if (!next.some((s) => s.deptName === d.deptName)) {
        next.push(d);
      }
    });
    setSelectedDepts(next);
    showToast?.(`已勾选当前分类下的全部部门`, 'success');
  };

  // 取消当前分类下的所有部门
  const handleDeselectCurrentCategory = () => {
    const categoryNames = new Set(filteredDepts.map((d) => d.deptName));
    setSelectedDepts((prev) => prev.filter((s) => !categoryNames.has(s.deptName)));
    showToast?.(`已取消勾选当前分类的部门`, 'info');
  };

  const handleConfirm = () => {
    if (selectedDepts.length === 0) {
      showToast?.('请先选择或输入至少一个部门/使用范围', 'warning');
      return;
    }
    const names = selectedDepts.map((d) => d.deptName);
    onConfirm(selectedDepts, names);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#ebeef5] w-full max-w-[840px] h-[650px] max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#303133]">
        {/* Top Header Mode Tabs: 与 PersonSelectModal 完全一致的高清双模切换 */}
        <div className="p-3.5 border-b border-[#f0f2f5] bg-[#fafbfc] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 bg-[#ebeef5]/90 p-1 rounded-xl text-xs w-fit">
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
              <span>从组织架构树中选择部门 / 事业部</span>
            </button>
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
              <span>手工输入名称 / 范围快捷配置</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#e4e7ed] text-[#909399] hover:text-[#303133] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtitle / Tip Bar */}
        <div className="px-5 py-2.5 bg-[#f4f7fb] border-b border-[#e4e7ed] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-[#4b5563]">
            <Building className="w-4 h-4 text-[#1677ff]" />
            <span className="font-medium text-[#1f2937]">
              {activeTab === 'orgTree'
                ? '组织架构部门树 · 请在左侧选择组织分类，在右侧勾选所需部门或事业部'
                : '手工输入与范围配置 · 支持快速添加自定义部门、事业部、区域或业务范围'}
            </span>
            <span className="text-[11px] text-[#9ca3af]">
              ({multiSelect ? '多选模式' : '单选模式'})
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'orgTree' ? 'manual' : 'orgTree')}
            className="text-[#1677ff] hover:underline font-medium cursor-pointer flex items-center gap-1 text-xs"
          >
            <span>{activeTab === 'orgTree' ? '切换为手工输入 / 快捷范围' : '切换为组织架构树选择'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden bg-white">
          {activeTab === 'orgTree' ? (
            /* 1. 组织架构树与部门卡片视图 (左右两栏分栏布局) */
            <>
              {/* Left Column: 组织架构层级分类 */}
              <div className="w-[230px] border-r border-[#f0f2f5] bg-[#fafbfc] flex flex-col shrink-0 p-3">
                <div className="relative mb-3">
                  <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="筛选部门/机构..."
                    className="w-full h-8 pl-8 pr-2.5 text-xs bg-white border border-[#dcdfe6] rounded-lg focus:border-[#1677ff] outline-none transition-colors"
                  />
                  {filterText && (
                    <button
                      type="button"
                      onClick={() => setFilterText('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#909399] hover:text-[#303133]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="text-[11px] font-semibold text-[#8c8c8c] px-2 mb-1.5 flex items-center justify-between">
                  <span>组织体系分类</span>
                  <FolderTree className="w-3 h-3 text-[#1677ff]" />
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {ORG_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all text-left ${
                          isSelected
                            ? 'bg-[#e6f4ff] text-[#1677ff] font-bold shadow-2xs'
                            : 'text-[#4b5563] hover:bg-[#f3f4f6]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder className={`w-3.5 h-3.5 ${isSelected ? 'text-[#1677ff]' : 'text-[#9ca3af]'}`} />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-white text-[#1677ff]' : 'bg-[#e5e7eb] text-[#6b7280]'
                        }`}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: 部门卡片列表 */}
              <div className="flex-1 flex flex-col min-w-0 p-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#f0f2f5] mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#111827]">
                      {ORG_CATEGORIES.find((c) => c.id === selectedCategory)?.name || '部门列表'}
                    </span>
                    <span className="text-xs text-[#9ca3af]">
                      (共 {filteredDepts.length} 个部门/机构)
                    </span>
                  </div>

                  {multiSelect && (
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={handleSelectAllCurrentCategory}
                        className="text-[#1677ff] hover:underline cursor-pointer font-medium"
                      >
                        全选此分类
                      </button>
                      <span className="text-[#d1d5db]">|</span>
                      <button
                        type="button"
                        onClick={handleDeselectCurrentCategory}
                        className="text-[#6b7280] hover:underline cursor-pointer"
                      >
                        取消全选
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredDepts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-[#9ca3af] text-xs">
                      <Building2 className="w-10 h-10 text-[#d1d5db] mb-2 stroke-1" />
                      <span>未找到符合条件的部门或机构</span>
                    </div>
                  ) : (
                    filteredDepts.map((dept) => {
                      const selected = isDeptSelected(dept);
                      return (
                        <div
                          key={dept.id}
                          onClick={() => handleToggleSelectDept(dept)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            selected
                              ? 'bg-[#f0f7ff] border-[#91caff] shadow-xs'
                              : 'bg-white border-[#e5e7eb] hover:border-[#91caff] hover:bg-[#fafafa]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              selected ? 'bg-[#1677ff] text-white shadow-xs' : 'bg-[#e6f4ff] text-[#1677ff]'
                            }`}>
                              <Building2 className="w-4 h-4" />
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[#111827] truncate">
                                  {dept.deptName}
                                </span>
                                {dept.deptCode && (
                                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#f3f4f6] text-[#4b5563] border border-[#e5e7eb]">
                                    {dept.deptCode}
                                  </span>
                                )}
                                {dept.badge && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#fef3c7] text-[#92400e]">
                                    {dept.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#6b7280] flex items-center gap-2">
                                <span>上级: {dept.parentDeptName || '集团总部'}</span>
                                {dept.leader && (
                                  <>
                                    <span>·</span>
                                    <span>负责人: {dept.leader}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <button
                              type="button"
                              className={`h-7 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                                selected
                                  ? 'bg-[#1677ff] text-white shadow-xs'
                                  : 'bg-white border border-[#d1d5db] text-[#4b5563] hover:border-[#1677ff] hover:text-[#1677ff]'
                              }`}
                            >
                              {selected ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>已选定</span>
                                </>
                              ) : (
                                <span>选择</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          ) : (
            /* 2. 手工输入与范围快捷配置视图 */
            <div className="flex-1 p-5 overflow-y-auto space-y-5">
              <div className="p-4 rounded-xl bg-[#f8faff] border border-[#dbeafe] space-y-3">
                <label className="block text-xs font-bold text-[#1e3a8a] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#2563eb]" />
                  <span>手工输入部门名称或自定义授权使用范围</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manualInputText}
                    onChange={(e) => setManualInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomManual()}
                    placeholder="输入部门、事业部、子公司名称或范围说明（按回车或点添加立即生效）..."
                    className="flex-1 h-9 px-3 rounded-xl border border-[#cbd5e1] focus:border-[#2563eb] outline-none text-xs bg-white shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomManual()}
                    className="h-9 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-medium flex items-center gap-1 cursor-pointer shadow-xs transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>添加</span>
                  </button>
                </div>
                <div className="text-[11px] text-[#64748b]">
                  提示：支持输入如「全集团各单位及下属子公司」、「华南大区销售中心」、「国际工程交付部」等个性化授权范围。
                </div>
              </div>

              {/* 常用授权范围模版快捷选择 */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-[#374151] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#2563eb]" />
                    <span>常用企业授权使用范围快捷模板 (点击快速选用)</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {SCOPE_PRESETS.map((preset) => {
                    const selected = isDeptSelected({ deptName: preset.name });
                    return (
                      <div
                        key={preset.name}
                        onClick={() => {
                          const item: DeptItem = {
                            id: `preset_${preset.name}`,
                            deptName: preset.name,
                            category: preset.category,
                            badge: '常用范围',
                          };
                          handleToggleSelectDept(item);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                          selected
                            ? 'bg-[#eff6ff] border-[#93c5fd] shadow-xs'
                            : 'bg-white border-[#e5e7eb] hover:border-[#93c5fd] hover:bg-[#fafafa]'
                        }`}
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#1f2937] truncate">
                              {preset.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#f3f4f6] text-[#4b5563]">
                              {preset.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6b7280] line-clamp-1">
                            {preset.desc}
                          </p>
                        </div>
                        <div className="shrink-0 mt-0.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                            selected ? 'bg-[#2563eb] text-white' : 'bg-[#f3f4f6] text-[#4b5563]'
                          }`}>
                            {selected && <Check className="w-3 h-3" />}
                            {selected ? '已加入' : '选用'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 模糊匹配推荐 */}
              {manualMatches.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#f1f5f9]">
                  <div className="text-xs font-semibold text-[#475569]">
                    {manualInputText ? `匹配到的企业部门 (${manualMatches.length})` : '推荐组织部门列表'}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {manualMatches.map((d) => {
                      const selected = isDeptSelected(d);
                      return (
                        <div
                          key={d.id}
                          onClick={() => handleToggleSelectDept(d)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            selected
                              ? 'bg-[#eff6ff] border-[#60a5fa] text-[#1d4ed8] font-medium'
                              : 'bg-white border-[#e2e8f0] text-[#334155] hover:bg-[#f8fafc]'
                          }`}
                        >
                          <span className="truncate">{d.deptName}</span>
                          {selected ? (
                            <Check className="w-3 h-3 text-[#2563eb] shrink-0" />
                          ) : (
                            <Plus className="w-3 h-3 text-[#94a3b8] shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Pinned Footer: 已选列表与确认操作 */}
        <div className="p-3.5 border-t border-[#f0f2f5] bg-[#fafbfc] flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-[#6b7280] font-medium">当前已选定:</span>
              {selectedDepts.length === 0 ? (
                <span className="text-[#9ca3af] text-xs">暂无选定部门/范围</span>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap max-h-16 overflow-y-auto">
                  {selectedDepts.map((d, idx) => (
                    <span
                      key={d.id || idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-white border border-[#93c5fd] text-[#1d4ed8] font-medium shadow-2xs"
                    >
                      <Building2 className="w-3 h-3 text-[#2563eb]" />
                      <span>{d.deptName}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDepts((prev) => prev.filter((x) => x.deptName !== d.deptName));
                        }}
                        className="hover:text-[#ef4444] rounded-full p-0.5 transition-colors cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {selectedDepts.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedDepts([])}
                className="text-[#ef4444] hover:underline text-xs shrink-0 cursor-pointer ml-2"
              >
                清空全部 ({selectedDepts.length})
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#e5e7eb]">
            <div className="text-[11px] text-[#9ca3af] flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#3b82f6]" />
              <span>支持手工输入中英文部门名称或从组织架构树挑选，选定后实时生效</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 rounded-xl border border-[#d1d5db] hover:bg-white text-xs text-[#4b5563] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="h-8 px-5 rounded-xl bg-[#1677ff] hover:bg-[#0958d9] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                确认选择 {selectedDepts.length > 0 ? `(${selectedDepts.length} 项)` : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
