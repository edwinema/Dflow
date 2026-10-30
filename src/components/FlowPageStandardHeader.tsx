import React, { useState, useMemo } from 'react';
import { Users, User, X, Plus } from 'lucide-react';
import { DeptSelectField } from './DeptSelectField';
import { PersonSelectField } from './PersonSelectField';
import { PersonSelectModal, PersonItem } from './PersonSelectModal';

export interface FlowPageStandardHeaderProps {
  archName?: string;
  name?: string;
  nameLabel?: string;
  deptName?: string;
  ownerName?: string;
  collaborators?: any[] | string;
  applicableScope?: string;
  adaptScope?: string;
  scopeLabel?: string;
  className?: string;

  // 编辑模式支持属性 (负责部门、负责人、协作者、适用范围均支持从组织架构中选择)
  isEditing?: boolean;
  onDeptChange?: (val: string) => void;
  onOwnerChange?: (val: string) => void;
  onCollaboratorsChange?: (collaborators: any[]) => void;
  onApplicableScopeChange?: (val: string) => void;
  showToast?: (msg: string, type?: any) => void;
}

/**
 * 格式化协作者展示文本
 */
export const formatCollaborators = (collabs: any): string => {
  if (!collabs) return '暂未指派协作者';
  if (typeof collabs === 'string') return collabs || '暂未指派协作者';
  if (Array.isArray(collabs)) {
    if (collabs.length === 0) return '暂未指派协作者';
    return collabs
      .map((c) => {
        if (typeof c === 'string') return c;
        const name = c.userName || c.name || c.nickName || '协作者';
        const emp = c.empNo ? `(${c.empNo})` : '';
        return `${name}${emp}`;
      })
      .join('、');
  }
  return '暂未指派协作者';
};

/**
 * 获取指定架构或流程节点在左侧架构树中的直接上一层架构名称
 * 用户明确要求：所属架构，只显示所选择的这个架构的上一层架构名称，不需要把全部架构层级显示出来
 * 示例：选中 "0.1 战略规划 (SP)"，所属架构仅显示其直接上一层架构 "dste 战略管理"
 */
export const getArchHierarchyPath = (
  nodeId: string,
  isFlow: boolean,
  archList: any[],
  flowList: any[] = []
): string => {
  if (!nodeId || !archList || archList.length === 0) {
    return '企业流程架构全景';
  }

  // 1. 如果是流程节点，其所属架构上级为其直属的 parentId
  let parentId: string | undefined;
  let selfNode: any;
  if (isFlow) {
    selfNode = flowList.find((f: any) => f.id === nodeId);
    parentId = selfNode?.parentId;
  } else {
    selfNode = archList.find((a: any) => a.id === nodeId);
    parentId = selfNode?.parentId;
  }

  if (!parentId || parentId === 'arch_root') {
    return '企业流程架构全景';
  }

  // 2. 找到上一层架构节点，直接返回其名称
  const parentNode = archList.find((a: any) => a.id === parentId);
  if (parentNode) {
    return parentNode.label || '企业流程架构全景';
  }

  if (selfNode?.prevArch) {
    return selfNode.prevArch;
  }

  return '企业流程架构全景';
};

/**
 * 统一标准页面表头 (流程类型与流程架构类型公共固定表头)
 * 严格按照设计稿 image_75b205eb.png、image_b7c3316f.png 与 image_4faf9917.png 样式与布局：
 * 浅米黄质感背景 (#FAF7F0)、网格化对齐布局：
 * [所属架构]  [架构名称 / 流程名称]
 * [负责部门]  [负责人]  <-- 编辑状态下支持从组织架构中选择
 * [协作者]    [适用范围] <-- 支持从组织架构中选择，支持多选
 */
export const FlowPageStandardHeader: React.FC<FlowPageStandardHeaderProps> = ({
  archName = '企业流程架构全景',
  name = '',
  nameLabel = '架构名称',
  deptName,
  ownerName = '流程管理员(E0002)',
  collaborators,
  applicableScope,
  adaptScope,
  scopeLabel = '适用范围',
  className = '',
  isEditing = false,
  onDeptChange,
  onOwnerChange,
  onCollaboratorsChange,
  onApplicableScopeChange,
  showToast,
}) => {
  const displayDept = deptName || '研发管理中心';
  const currentScope = applicableScope || adaptScope || '';
  const displayScope = currentScope || '结构开发部';
  const displayCollabs = formatCollaborators(collaborators);

  // 协作者弹窗状态 (用于在编辑模式下从组织架构多选协作者)
  const [collabModalOpen, setCollabModalOpen] = useState(false);

  // 规范化协作者列表
  const normalizedCollaborators = useMemo(() => {
    if (!collaborators) return [];
    if (Array.isArray(collaborators)) {
      return collaborators.map((c, i) => {
        if (typeof c === 'string') {
          return { id: `c_${i}_${c}`, userName: c, empNo: '', deptName: '' };
        }
        return {
          id: c.id || `c_${i}_${c.userName || c.name || ''}`,
          userId: c.userId || c.id,
          userName: c.userName || c.name || c.nickName || '协作者',
          empNo: c.empNo || '',
          deptName: c.deptName || '',
          roleName: c.roleName || '',
        };
      });
    }
    if (typeof collaborators === 'string' && collaborators.trim()) {
      return collaborators
        .split(/[,;，；、]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((n, i) => ({
          id: `c_${i}_${n}`,
          userName: n,
          empNo: '',
          deptName: '',
        }));
    }
    return [];
  }, [collaborators]);

  return (
    <div
      className={`mx-5 mt-4 mb-3.5 px-6 py-4 rounded-md bg-[#FAF7F0] border ${
        isEditing ? 'border-[#409eff] shadow-sm ring-1 ring-[#409eff]/20' : 'border-[#EFE8DC] shadow-2xs'
      } text-xs shrink-0 select-text transition-all ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
        {/* Row 1 Left: 所属架构 */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#606266] shrink-0 min-w-[56px] text-xs">所属架构</span>
          <span
            className="text-[#1F2733] text-xs truncate font-medium"
            title={archName}
          >
            {archName}
          </span>
        </div>

        {/* Row 1 Right: 架构名称 / 流程名称 */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#606266] shrink-0 min-w-[56px] text-xs">{nameLabel}</span>
          <span
            className="text-[#1F2733] text-xs truncate font-medium"
            title={name || '未命名'}
          >
            {name || '未命名'}
          </span>
        </div>

        {/* Row 2 Left: 负责部门 (编辑状态下支持从组织架构中选择) */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#606266] shrink-0 min-w-[56px] text-xs">负责部门</span>
          {isEditing ? (
            <div className="flex-1 min-w-0">
              <DeptSelectField
                value={deptName}
                onChange={(val) => onDeptChange?.(val)}
                multiSelect={true}
                placeholder="从组织架构选择负责部门..."
                className="bg-white border-[#dcdfe6] text-xs h-8 min-h-[32px] py-0.5"
                showToast={showToast}
              />
            </div>
          ) : (
            <span
              className="text-[#1F2733] text-xs truncate font-medium"
              title={displayDept}
            >
              {displayDept}
            </span>
          )}
        </div>

        {/* Row 2 Right: 负责人 (编辑状态下支持从组织架构中选择) */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#606266] shrink-0 min-w-[56px] text-xs">负责人</span>
          {isEditing ? (
            <div className="flex-1 min-w-0">
              <PersonSelectField
                value={ownerName}
                onChange={(val) => onOwnerChange?.(val)}
                multiSelect={false}
                placeholder="从组织架构选择负责人..."
                className="bg-white border-[#dcdfe6] text-xs h-8 min-h-[32px] py-0.5"
                showToast={showToast}
              />
            </div>
          ) : (
            <span
              className="text-[#1F2733] text-xs truncate font-medium"
              title={ownerName}
            >
              {ownerName}
            </span>
          )}
        </div>

        {/* Row 3 Left: 协作者 (编辑状态下支持从组织架构中选择) */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#606266] shrink-0 min-w-[56px] text-xs">协作者</span>
          {isEditing ? (
            <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
              {normalizedCollaborators.length > 0 ? (
                normalizedCollaborators.map((c) => (
                  <span
                    key={c.id || c.userName}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-[#dcdfe6] text-[#1F2733] text-[11px] shadow-2xs group"
                  >
                    <span className="font-medium text-[#1f2733] truncate max-w-[100px]">
                      {c.userName}
                      {c.empNo ? <span className="text-[#909399] ml-0.5 font-normal">({c.empNo})</span> : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = normalizedCollaborators.filter(
                          (item) => (item.id || item.userName) !== (c.id || c.userName)
                        );
                        onCollaboratorsChange?.(next);
                      }}
                      className="w-3.5 h-3.5 rounded-full hover:bg-[#fef0f0] text-[#909399] hover:text-[#f56c6c] flex items-center justify-center cursor-pointer transition-colors"
                      title="移除此协作者"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#909399]">暂未指派协作者</span>
              )}

              <button
                type="button"
                onClick={() => setCollabModalOpen(true)}
                className="h-7 px-2 rounded border border-dashed border-[#409eff] bg-[#ecf5ff]/60 hover:bg-[#ecf5ff] text-[#409eff] hover:text-[#3390ff] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                title="点击从企业组织架构体系中选择协作者"
              >
                <Users className="w-3 h-3" />
                <span>从组织架构选择</span>
              </button>

              {collabModalOpen && (
                <PersonSelectModal
                  open={collabModalOpen}
                  title="从组织架构选择协作者"
                  description="在企业组织架构中选择流程或架构的协作者，支持跨部门多选"
                  multiSelect={true}
                  initialSelected={normalizedCollaborators.map((c) => c.userName)}
                  onClose={() => setCollabModalOpen(false)}
                  onConfirm={(selectedPersons) => {
                    const updated = selectedPersons.map((p) => ({
                      id: p.id,
                      userId: p.id,
                      userName: p.userName,
                      empNo: p.empNo || '',
                      deptName: p.deptName || '',
                      roleName: p.roleName || '',
                      taskDesc: '协同维护流程架构与资料',
                      priority: '普通',
                      taskStatus: '进行中',
                      assignTime: new Date().toISOString().slice(0, 10),
                      assignBy: ownerName || '流程管理员',
                    }));
                    onCollaboratorsChange?.(updated);
                    setCollabModalOpen(false);
                    showToast?.(`已从组织架构选择 ${updated.length} 位协作者`, 'success');
                  }}
                  showToast={showToast}
                />
              )}
            </div>
          ) : (
            <span
              className="text-[#1F2733] text-xs truncate font-medium"
              title={displayCollabs}
            >
              {displayCollabs}
            </span>
          )}
        </div>

        {/* Row 3 Right: 适用范围 (对应需求：增加“适应范围”，支持从组织架构中选择，支持多选) */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#606266] shrink-0 min-w-[56px] text-xs">{scopeLabel}</span>
          {isEditing ? (
            <div className="flex-1 min-w-0">
              <DeptSelectField
                value={currentScope}
                onChange={(val) => onApplicableScopeChange?.(val)}
                multiSelect={true}
                placeholder="从组织架构选择适用范围(多选)..."
                className="bg-white border-[#dcdfe6] text-xs h-8 min-h-[32px] py-0.5"
                showToast={showToast}
                title="选择适用范围 (从组织架构选择，支持多选)"
              />
            </div>
          ) : (
            <span
              className="text-[#1F2733] text-xs truncate font-medium"
              title={displayScope}
            >
              {displayScope}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
