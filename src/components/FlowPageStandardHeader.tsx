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
  className?: string;

  // 编辑模式支持属性 (对应需求：负责部门和负责人，协作者都要支持从组织架构中选择)
  isEditing?: boolean;
  onDeptChange?: (val: string) => void;
  onOwnerChange?: (val: string) => void;
  onCollaboratorsChange?: (collaborators: any[]) => void;
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
 * 递归计算指定架构或流程节点在左侧架构树中的完整层级归属关系链路
 * 对应需求：点击左侧流程架构树中的某个架构，就显示选中的架构层级关系
 * 示例输出：测试集团有限公司流程管理体系 > 9.0 跨国多组织多集团管理体系 > 9.1 第一产业集团
 */
export const getArchHierarchyPath = (
  nodeId: string,
  isFlow: boolean,
  archList: any[],
  flowList: any[] = []
): string => {
  if (!nodeId || !archList || archList.length === 0) {
    return '测试集团有限公司流程管理体系';
  }

  // 1. 如果是流程节点，其所属架构上级为其直属的 parentId
  let parentId: string | undefined;
  if (isFlow) {
    const flow = flowList.find((f: any) => f.id === nodeId);
    parentId = flow?.parentId;
  } else {
    const arch = archList.find((a: any) => a.id === nodeId);
    parentId = arch?.parentId;
  }

  if (!parentId || parentId === 'arch_root') {
    return '测试集团有限公司流程管理体系';
  }

  // 2. 向上回溯父级祖先节点链
  const pathParts: string[] = [];
  const visited = new Set<string>();
  let curId: string | undefined = parentId;

  while (curId && !visited.has(curId)) {
    visited.add(curId);
    const node = archList.find((a: any) => a.id === curId);
    if (node) {
      if (node.id !== 'arch_root' && node.label !== '企业流程架构全景') {
        pathParts.unshift(node.label);
      }
      curId = node.parentId;
    } else {
      break;
    }
  }

  // 3. 根节点统称 "测试集团有限公司流程管理体系"
  pathParts.unshift('测试集团有限公司流程管理体系');

  return pathParts.join(' > ');
};

/**
 * 统一标准页面表头 (流程类型与流程架构类型公共固定表头)
 * 严格按照设计稿 image_75b205eb.png 与 image_b7c3316f.png 样式与布局：
 * 浅米黄质感背景 (#FAF7F0)、网格化对齐布局：
 * [所属架构]  [架构名称 / 流程名称]
 * [负责部门]  [负责人]  <-- 编辑状态下支持从组织架构中选择
 * [协作者]              <-- 编辑状态下支持从组织架构中选择
 */
export const FlowPageStandardHeader: React.FC<FlowPageStandardHeaderProps> = ({
  archName = '测试集团有限公司流程管理体系',
  name = '',
  nameLabel = '架构名称',
  deptName,
  ownerName = '流程管理员(E0002)',
  collaborators,
  applicableScope = '系统管理部,流程管理部,权责管理部',
  className = '',
  isEditing = false,
  onDeptChange,
  onOwnerChange,
  onCollaboratorsChange,
  showToast,
}) => {
  const displayDept = deptName || applicableScope || '系统管理部,流程管理部,权责管理部';
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
                value={deptName || applicableScope}
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
        <div
          className={`flex items-start md:items-center gap-3 min-w-0 ${
            isEditing ? 'col-span-1 md:col-span-2' : ''
          }`}
        >
          <span className="text-[#606266] shrink-0 min-w-[56px] text-xs pt-1.5 md:pt-0">协作者</span>
          {isEditing ? (
            <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
              {normalizedCollaborators.length > 0 ? (
                normalizedCollaborators.map((c) => (
                  <span
                    key={c.id || c.userName}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#dcdfe6] text-[#1F2733] text-xs shadow-2xs group"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#ecf5ff] text-[#1677ff] flex items-center justify-center text-[10px] font-medium shrink-0">
                      {c.userName.slice(0, 1)}
                    </div>
                    <span className="font-medium text-[#1f2733] text-xs">
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
                <span className="text-xs text-[#909399] py-1">暂未指派协作者</span>
              )}

              <button
                type="button"
                onClick={() => setCollabModalOpen(true)}
                className="h-7 px-2.5 rounded-md border border-dashed border-[#409eff] bg-[#ecf5ff]/60 hover:bg-[#ecf5ff] text-[#409eff] hover:text-[#3390ff] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="点击从企业组织架构体系中选择协作者"
              >
                <Users className="w-3.5 h-3.5" />
                <span>从组织架构选择协作者</span>
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

        {/* Row 3 Right: 对齐占位 (非编辑状态下保留网格对齐) */}
        {!isEditing && <div className="hidden md:block" />}
      </div>
    </div>
  );
};
