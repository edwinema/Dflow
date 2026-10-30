import React from 'react';

export interface FlowPageStandardHeaderProps {
  archName?: string;
  name?: string;
  nameLabel?: string;
  deptName?: string;
  ownerName?: string;
  collaborators?: any[] | string;
  applicableScope?: string;
  className?: string;
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
 * 严格按照设计稿 image_75b205eb.png 样式与布局：
 * 浅米黄质感背景 (#FAF7F0)、两行/三行网格化对齐布局：
 * [所属架构]  [架构名称 / 流程名称]
 * [负责部门]  [负责人]
 * [协作者]
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
}) => {
  const displayDept = deptName || applicableScope || '系统管理部,流程管理部,权责管理部';
  const displayCollabs = formatCollaborators(collaborators);

  return (
    <div
      className={`mx-5 mt-4 mb-3.5 px-6 py-4 rounded-md bg-[#FAF7F0] border border-[#EFE8DC] text-xs shadow-2xs shrink-0 select-text ${className}`}
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

        {/* Row 2 Left: 负责部门 */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#606266] shrink-0 min-w-[56px] text-xs">负责部门</span>
          <span
            className="text-[#1F2733] text-xs truncate font-medium"
            title={displayDept}
          >
            {displayDept}
          </span>
        </div>

        {/* Row 2 Right: 负责人 */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#606266] shrink-0 min-w-[56px] text-xs">负责人</span>
          <span
            className="text-[#1F2733] text-xs truncate font-medium"
            title={ownerName}
          >
            {ownerName}
          </span>
        </div>

        {/* Row 3 Left: 协作者 (新增协作者支持) */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#606266] shrink-0 min-w-[56px] text-xs">协作者</span>
          <span
            className="text-[#1F2733] text-xs truncate font-medium"
            title={displayCollabs}
          >
            {displayCollabs}
          </span>
        </div>

        {/* Row 3 Right: 对齐占位 */}
        <div className="hidden md:block" />
      </div>
    </div>
  );
};
