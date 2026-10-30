import React, { useState, useEffect } from 'react';
import { FileEdit, Check, X, ShieldAlert, Sparkles, Building2, Users } from 'lucide-react';
import { FlowPageStandardHeader, getArchHierarchyPath } from './FlowPageStandardHeader';

export interface UnifiedCardDetailViewProps {
  type: 'arch' | 'flow';
  data: any;
  archList: any[];
  flowList: any[];
  currentUser?: any;
  onSave?: (updatedData: any) => Promise<void> | void;
  showToast?: (msg: string, type?: any) => void;
  readOnly?: boolean;
}

/**
 * 校验当前用户是否具有本页面的编辑与管理权限
 */
export const checkUserManagePermission = (currentUser: any, nodeData: any): boolean => {
  if (!currentUser) return true; // 默认环境允许
  const userName = currentUser.userName || currentUser.nickName || currentUser.name || '';
  const role = currentUser.jobTitle || currentUser.role || '';

  // 1. 系统超级管理或流程管理员具备全局权限
  if (
    userName.includes('管理员') ||
    userName === 'admin' ||
    role.includes('经理') ||
    role.includes('架构师') ||
    role.includes('管理')
  ) {
    return true;
  }

  // 2. 本架构或流程的指定责任人
  if (
    nodeData?.ownerName &&
    (nodeData.ownerName.includes(userName) || userName.includes(nodeData.ownerName))
  ) {
    return true;
  }

  // 3. 协作者列表中有本人
  if (Array.isArray(nodeData?.collaborators)) {
    const isCollab = nodeData.collaborators.some((c: any) => {
      const cName = typeof c === 'string' ? c : c.userName || c.name;
      return cName && (cName.includes(userName) || userName.includes(cName));
    });
    if (isCollab) return true;
  }

  return false;
};

/**
 * 统一架构卡片与流程基本资料视图组件
 * 严格遵照设计稿 image_75b205eb.png 样式和布局标准：
 * 1. 顶部固定米色表头卡片（包含完整的所属架构祖先层级链路、架构/流程名称、负责部门、负责人、协作者）
 * 2. 表头下方两列/通栏统一排版：架构/流程层级、架构/流程编号、上一层架构、下一层架构、流程定义、流程目的、流程输入、流程输出
 * 3. 醒目蓝框高亮区域：流程起始 与 流程终止
 * 4. 流程KPI 及 底部 [编写架构/流程资料] 权限化编辑按钮
 */
export const UnifiedCardDetailView: React.FC<UnifiedCardDetailViewProps> = ({
  type,
  data,
  archList,
  flowList,
  currentUser,
  onSave,
  showToast,
  readOnly = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // 自动从当前节点与树关系中推导上级与下级架构
  const parentArch = archList.find((a: any) => a.id === data?.parentId);
  const childArchs = archList.filter((a: any) => a.parentId === data?.id);

  // 初始化表单数据
  useEffect(() => {
    if (!data) return;
    setFormData({
      deptName: data.deptName || '研发管理中心',
      applicableScope: data.applicableScope || data.adaptScope || '结构开发部',
      ownerName: data.ownerName || '流程管理员(E0002)',
      collaborators: data.collaborators || [],
      level: data.level || data.flowLevel || 'L3',
      code: data.archNo || data.flowNo || (type === 'arch' ? '9.1-FG-001' : 'IPD-TR-001'),
      prevArch: data.prevArch || (parentArch ? parentArch.label : '9.1 第一产业集团'),
      nextArch: data.nextArch || (childArchs[0] ? childArchs[0].label : data.label || '9.1.0 第一集团职能总部'),
      flowDefine: data.flowDefine || (type === 'arch' ? '第一集团 测试定义' : '跨业务协同端到端作业规范与活动指引'),
      flowPurpose: data.flowPurpose || data.purpose || (type === 'arch' ? '第一集团 测试目的' : '确保端到端交付高品质成果与管控关键控制点'),
      flowInput: data.flowInput || 'for input test',
      flowOutput: data.flowOutput || 'for output test',
      flowStart: data.flowStart || '业务启动 / 前序流程交付输入',
      flowEnd: data.flowEnd || '交付验收 / 成果归档入库',
      flowKpi: data.flowKpi || 'kpi data',
    });
    setIsEditing(false);
  }, [data, type, archList]);

  if (!data) {
    return <div className="p-8 text-center text-xs text-[#909399]">未选择有效的数据节点</div>;
  }

  // 计算树层级所属架构全链路 (仅显示直接上一层架构名称)
  const fullArchPath = getArchHierarchyPath(data.id, type === 'flow', archList, flowList);

  // 权限检查
  const canManage = !readOnly && checkUserManagePermission(currentUser, data);

  const handleSave = async () => {
    const updated = {
      ...data,
      deptName: formData.deptName,
      applicableScope: formData.applicableScope,
      adaptScope: formData.applicableScope,
      ownerName: formData.ownerName,
      collaborators: formData.collaborators,
      level: formData.level,
      flowLevel: formData.level,
      archNo: type === 'arch' ? formData.code : data.archNo,
      flowNo: type === 'flow' ? formData.code : data.flowNo,
      prevArch: formData.prevArch,
      nextArch: formData.nextArch,
      flowDefine: formData.flowDefine,
      flowPurpose: formData.flowPurpose,
      purpose: formData.flowPurpose,
      flowInput: formData.flowInput,
      flowOutput: formData.flowOutput,
      flowStart: formData.flowStart,
      flowEnd: formData.flowEnd,
      flowKpi: formData.flowKpi,
    };

    if (onSave) {
      await onSave(updated);
    }
    setIsEditing(false);
    showToast?.(`${type === 'arch' ? '架构资料' : '流程资料'}已成功保存生效`, 'success');
  };

  const handleCancel = () => {
    // 恢复数据
    setFormData({
      deptName: data.deptName || '研发管理中心',
      applicableScope: data.applicableScope || data.adaptScope || '结构开发部',
      ownerName: data.ownerName || '流程管理员(E0002)',
      collaborators: data.collaborators || [],
      level: data.level || data.flowLevel || 'L3',
      code: data.archNo || data.flowNo || (type === 'arch' ? '9.1-FG-001' : 'IPD-TR-001'),
      prevArch: data.prevArch || (parentArch ? parentArch.label : '9.1 第一产业集团'),
      nextArch: data.nextArch || (childArchs[0] ? childArchs[0].label : data.label || '9.1.0 第一集团职能总部'),
      flowDefine: data.flowDefine || (type === 'arch' ? '第一集团 测试定义' : '跨业务协同端到端作业规范与活动指引'),
      flowPurpose: data.flowPurpose || data.purpose || (type === 'arch' ? '第一集团 测试目的' : '确保端到端交付高品质成果与管控关键控制点'),
      flowInput: data.flowInput || 'for input test',
      flowOutput: data.flowOutput || 'for output test',
      flowStart: data.flowStart || '业务启动 / 前序流程交付输入',
      flowEnd: data.flowEnd || '交付验收 / 成果归档入库',
      flowKpi: data.flowKpi || 'kpi data',
    });
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col min-h-0 w-full text-xs">
      {/* 1. 顶部标准卡片表头 (编辑模式下负责部门、负责人、协作者、适用范围均支持从组织架构中选择) */}
      <FlowPageStandardHeader
        archName={fullArchPath}
        name={data.label || data.name}
        nameLabel={type === 'arch' ? '架构名称' : '流程名称'}
        deptName={formData.deptName}
        ownerName={formData.ownerName}
        collaborators={formData.collaborators}
        applicableScope={formData.applicableScope}
        isEditing={isEditing}
        onDeptChange={(newDept) => setFormData((prev: any) => ({ ...prev, deptName: newDept }))}
        onOwnerChange={(newOwner) => setFormData((prev: any) => ({ ...prev, ownerName: newOwner }))}
        onCollaboratorsChange={(newCollabs) =>
          setFormData((prev: any) => ({ ...prev, collaborators: newCollabs }))
        }
        onApplicableScopeChange={(newScope) =>
          setFormData((prev: any) => ({ ...prev, applicableScope: newScope }))
        }
        showToast={showToast}
      />

      {/* 2. 表头下方统一格式排版区 (严格按照设计稿布局) */}
      <div className="px-5 pb-8 space-y-4 max-w-4xl">
        {/* Row 1: 架构层级 / 架构编号 (2列) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="flex items-center min-w-0">
            <span className="text-[#606266] shrink-0 w-24">
              {type === 'arch' ? '架构层级' : '流程层级'}
            </span>
            {isEditing ? (
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="h-8 px-2.5 rounded border border-[#dcdfe6] bg-white text-xs outline-none focus:border-[#409eff] cursor-pointer"
              >
                <option value="L0">L0 战略主干</option>
                <option value="L1">L1 业务域</option>
                <option value="L2">L2 业务阶段</option>
                <option value="L3">L3 作业活动</option>
                <option value="L4">L4 执行细则</option>
              </select>
            ) : (
              <span className="text-[#1f2733] font-medium font-mono-tabular">
                {formData.level || 'L3'}
              </span>
            )}
          </div>

          <div className="flex items-center min-w-0">
            <span className="text-[#606266] shrink-0 w-24">
              {type === 'arch' ? '架构编号' : '流程编号'}
            </span>
            {isEditing ? (
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="请输入编号"
                className="h-8 px-2.5 rounded border border-[#dcdfe6] bg-white text-xs font-mono-tabular outline-none focus:border-[#409eff] flex-1 max-w-xs"
              />
            ) : (
              <span className="text-[#1f2733] font-medium font-mono-tabular">
                {formData.code || '-'}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: 上一层架构 / 下一层架构 (2列) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="flex items-center min-w-0">
            <span className="text-[#606266] shrink-0 w-24">上一层架构</span>
            {isEditing ? (
              <input
                type="text"
                value={formData.prevArch}
                onChange={(e) => setFormData({ ...formData, prevArch: e.target.value })}
                placeholder="上一层架构名称"
                className="h-8 px-2.5 rounded border border-[#dcdfe6] bg-white text-xs outline-none focus:border-[#409eff] flex-1 max-w-xs"
              />
            ) : (
              <span className="text-[#1f2733] font-medium truncate">
                {formData.prevArch || '-'}
              </span>
            )}
          </div>

          <div className="flex items-center min-w-0">
            <span className="text-[#606266] shrink-0 w-24">下一层架构</span>
            {isEditing ? (
              <input
                type="text"
                value={formData.nextArch}
                onChange={(e) => setFormData({ ...formData, nextArch: e.target.value })}
                placeholder="下一层架构名称"
                className="h-8 px-2.5 rounded border border-[#dcdfe6] bg-white text-xs outline-none focus:border-[#409eff] flex-1 max-w-xs"
              />
            ) : (
              <span className="text-[#1f2733] font-medium truncate">
                {formData.nextArch || '-'}
              </span>
            )}
          </div>
        </div>

        {/* Row 3: 流程定义 (通栏) */}
        <div className="flex items-start min-w-0 pt-1">
          <span className="text-[#606266] shrink-0 w-24 pt-1">流程定义</span>
          {isEditing ? (
            <textarea
              rows={2}
              value={formData.flowDefine}
              onChange={(e) => setFormData({ ...formData, flowDefine: e.target.value })}
              placeholder="请输入定义..."
              className="w-full p-2.5 rounded border border-[#dcdfe6] bg-white text-xs outline-none focus:border-[#409eff] resize-none leading-relaxed"
            />
          ) : (
            <span className="text-[#1f2733] leading-relaxed whitespace-pre-wrap flex-1">
              {formData.flowDefine || '-'}
            </span>
          )}
        </div>

        {/* Row 4: 流程目的 (通栏) */}
        <div className="flex items-start min-w-0 pt-1">
          <span className="text-[#606266] shrink-0 w-24 pt-1">流程目的</span>
          {isEditing ? (
            <textarea
              rows={2}
              value={formData.flowPurpose}
              onChange={(e) => setFormData({ ...formData, flowPurpose: e.target.value })}
              placeholder="请输入业务目的..."
              className="w-full p-2.5 rounded border border-[#dcdfe6] bg-white text-xs outline-none focus:border-[#409eff] resize-none leading-relaxed"
            />
          ) : (
            <span className="text-[#1f2733] leading-relaxed whitespace-pre-wrap flex-1">
              {formData.flowPurpose || '-'}
            </span>
          )}
        </div>

        {/* Row 5: 流程输入 / 流程输出 (2列) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-1">
          <div className="flex items-center min-w-0">
            <span className="text-[#606266] shrink-0 w-24">流程输入</span>
            {isEditing ? (
              <input
                type="text"
                value={formData.flowInput}
                onChange={(e) => setFormData({ ...formData, flowInput: e.target.value })}
                placeholder="流程前置输入交付物"
                className="h-8 px-2.5 rounded border border-[#dcdfe6] bg-white text-xs outline-none focus:border-[#409eff] flex-1 max-w-xs"
              />
            ) : (
              <span className="text-[#1f2733] font-medium truncate">
                {formData.flowInput || '-'}
              </span>
            )}
          </div>

          <div className="flex items-center min-w-0">
            <span className="text-[#606266] shrink-0 w-24">流程输出</span>
            {isEditing ? (
              <input
                type="text"
                value={formData.flowOutput}
                onChange={(e) => setFormData({ ...formData, flowOutput: e.target.value })}
                placeholder="流程后置输出成果"
                className="h-8 px-2.5 rounded border border-[#dcdfe6] bg-white text-xs outline-none focus:border-[#409eff] flex-1 max-w-xs"
              />
            ) : (
              <span className="text-[#1f2733] font-medium truncate">
                {formData.flowOutput || '-'}
              </span>
            )}
          </div>
        </div>

        {/* Row 6: 流程起始 与 流程终止 (醒目蓝框高亮区域) */}
        <div className="border-2 border-[#409eff] rounded-md p-3.5 bg-white shadow-2xs my-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex items-center min-w-0">
              <span className="text-[#606266] shrink-0 w-24 font-medium">流程起始</span>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.flowStart}
                  onChange={(e) => setFormData({ ...formData, flowStart: e.target.value })}
                  placeholder="起始节点或触发条件"
                  className="h-8 px-2.5 rounded border border-[#b3d8ff] bg-white text-xs outline-none focus:border-[#409eff] flex-1"
                />
              ) : (
                <span className="text-[#1f2733] font-medium truncate">
                  {formData.flowStart || '起始节点 / 业务触发'}
                </span>
              )}
            </div>

            <div className="flex items-center min-w-0">
              <span className="text-[#606266] shrink-0 w-24 font-medium">流程终止</span>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.flowEnd}
                  onChange={(e) => setFormData({ ...formData, flowEnd: e.target.value })}
                  placeholder="终止节点或交付归档"
                  className="h-8 px-2.5 rounded border border-[#b3d8ff] bg-white text-xs outline-none focus:border-[#409eff] flex-1"
                />
              ) : (
                <span className="text-[#1f2733] font-medium truncate">
                  {formData.flowEnd || '终止节点 / 成果归档'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Row 7: 流程KPI (通栏) */}
        <div className="flex items-center min-w-0 pt-1">
          <span className="text-[#606266] shrink-0 w-24">流程KPI</span>
          {isEditing ? (
            <input
              type="text"
              value={formData.flowKpi}
              onChange={(e) => setFormData({ ...formData, flowKpi: e.target.value })}
              placeholder="核心KPI衡量指标与目标值"
              className="h-8 px-2.5 rounded border border-[#dcdfe6] bg-white text-xs outline-none focus:border-[#409eff] flex-1 max-w-xl"
            />
          ) : (
            <span className="text-[#1f2733] font-medium truncate flex-1">
              {formData.flowKpi || '-'}
            </span>
          )}
        </div>

        {/* Row 8: 底部编辑/操作按钮 (严格根据管理权限控制) */}
        <div className="pt-4 flex items-center gap-3">
          {!isEditing ? (
            canManage ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="h-8 px-4 rounded border border-[#b3d8ff] bg-[#ecf5ff] hover:bg-[#409eff] text-[#409eff] hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>{type === 'arch' ? '编写架构资料' : '编写流程资料'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#909399] py-1">
                <ShieldAlert className="w-4 h-4 text-[#c0c4cc]" />
                <span>
                  当前账号（{currentUser?.userName || '访客'}）无管理编辑权限，仅支持只读浏览
                </span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="h-8 px-5 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>保存{type === 'arch' ? '架构资料' : '流程资料'}</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="h-8 px-4 rounded border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-[#606266] text-xs font-medium cursor-pointer transition-colors"
              >
                取消
              </button>
              <span className="text-[11px] text-[#909399]">
                修改完成后点击保存将实时同步至企业流程管理中心
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
