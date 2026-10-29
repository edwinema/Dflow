import React from 'react';

interface FlowPageStandardHeaderProps {
  archName?: string;
  name?: string;
  nameLabel?: string;
  ownerName?: string;
  applicableScope?: string;
  className?: string;
}

/**
 * 统一标准页面表头 (流程类型与流程架构类型公共固定表头)
 * 严格按照设计稿：
 * 浅米黄质感背景 (#FAF7F0 / #FCF9F2)、两行两列栅格化对齐布局：
 * [所属架构]  [流程名称 / 架构名称]
 * [负责人]    [适用范围]
 */
export const FlowPageStandardHeader: React.FC<FlowPageStandardHeaderProps> = ({
  archName = '测试集团有限公司流程管理体系',
  name = '',
  nameLabel = '流程名称',
  ownerName = '系统管理员(E0004)',
  applicableScope = '结构开发部',
  className = '',
}) => {
  return (
    <div
      className={`mx-5 mt-4 mb-3.5 px-6 py-4 rounded-md bg-[#FAF7F0] border border-[#EFE8DC] text-xs shadow-2xs shrink-0 select-text ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3.5">
        {/* Row 1 Left: 所属架构 */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#606266] shrink-0 min-w-[56px] text-xs">所属架构</span>
          <span
            className="text-[#1F2733] text-xs truncate font-medium"
            title={archName || '测试集团有限公司流程管理体系'}
          >
            {archName || '测试集团有限公司流程管理体系'}
          </span>
        </div>

        {/* Row 1 Right: 流程名称 / 架构名称 */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#606266] shrink-0 min-w-[56px] text-xs">{nameLabel}</span>
          <span
            className="text-[#1F2733] text-xs truncate font-medium"
            title={name || '未命名'}
          >
            {name || '未命名'}
          </span>
        </div>

        {/* Row 2 Left: 负责人 */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#606266] shrink-0 min-w-[56px] text-xs">负责人</span>
          <span
            className="text-[#1F2733] text-xs truncate font-medium"
            title={ownerName || '系统管理员(E0004)'}
          >
            {ownerName || '系统管理员(E0004)'}
          </span>
        </div>

        {/* Row 2 Right: 适用范围 */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[#606266] shrink-0 min-w-[56px] text-xs">适用范围</span>
          <span
            className="text-[#1F2733] text-xs truncate font-medium"
            title={applicableScope || '结构开发部'}
          >
            {applicableScope || '结构开发部'}
          </span>
        </div>
      </div>
    </div>
  );
};
