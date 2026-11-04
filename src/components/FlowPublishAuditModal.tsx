import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Calendar,
  ShieldCheck,
  Building2,
  Users,
  User,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  Send,
  Zap,
  Info,
  CalendarClock,
  Landmark,
  Award,
  AlertCircle,
} from 'lucide-react';
import { PersonSelectField } from './PersonSelectField';
import { DeptSelectField } from './DeptSelectField';

export interface ApprovalLevelConfig {
  id: string;
  level: number;
  levelName: string;
  approverType: 'deptHead' | 'person' | 'committee' | 'role';
  approverName: string;
  deptName: string;
  roleName: string;
  signType: 'or' | 'and'; // 'or' = 或签, 'and' = 会签
  description?: string;
}

export interface FlowPublishAuditModalProps {
  open: boolean;
  mode: 'audit' | 'direct'; // 'audit' = 提交发布审核, 'direct' = 直接发布
  flow: any;
  archPath?: string;
  currentUser?: any;
  onClose: () => void;
  onSuccess: (data: any) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const PRESET_DEPTS_WITH_HEADS = [
  { deptName: '集成电路设计院', headName: '王建军', headRole: '院长 / 资深芯片架构总监' },
  { deptName: '研发中心', headName: '李国栋', headRole: '研发总监' },
  { deptName: '质量控制部', headName: '陈静', headRole: '质量总监' },
  { deptName: '数字化运营部', headName: '张明', headRole: '运营总监' },
  { deptName: '市场管理部', headName: '周强', headRole: '市场总监' },
  { deptName: '财务管理部', headName: '赵晓琳', headRole: '财务总监' },
  { deptName: '系统架构部', headName: '刘建国', headRole: '首席架构师' },
  { deptName: '流程管理部', headName: '流程推进官', headRole: '流程管理部负责人' },
];

export const PRESET_COMMITTEES = [
  {
    name: '流程治理委员会',
    desc: '负责全流程架构规范审定、关键KCP合规与跨体系准入决议',
    chair: '流程治理委员会主任',
  },
  {
    name: 'TRB技术评审委员会',
    desc: '负责研发技术成熟度评审、工程流片红线与交付物技术准出',
    chair: '首席技术官 (CTO)',
  },
  {
    name: '质量与安全合规委员会',
    desc: '负责ISO质量体系、信息安全合规与内控红线核验',
    chair: '质量合规总监',
  },
  {
    name: '数字化转型决策委员会',
    desc: '负责IT流程系统化、端到端数字化协同与组织架构适配',
    chair: '数字化转型执委',
  },
  {
    name: '业务架构与战略推进委员会',
    desc: '负责战略规划与业务L1-L3流程对齐落地',
    chair: '业务战略副总裁',
  },
  {
    name: '高层管理决策委员会',
    desc: '企业最高管理层重大决策仲裁与特批准入',
    chair: '执行委员会主任',
  },
];

export const PRESET_ROLES = [
  { roleName: '首席流程官 (CPO)', deptName: '流程管理部' },
  { roleName: '业务架构师 (Chief Architect)', deptName: '系统架构部' },
  { roleName: '合规与风险总监 (Compliance Director)', deptName: '风控合规部' },
  { roleName: '首席质量官 (CQO)', deptName: '质量控制部' },
  { roleName: '内控审计主管 (Audit Director)', deptName: '审计监察部' },
];

// Quick format helper for default scheduled datetime (e.g. tomorrow 09:00:00)
function getDefaultScheduledTime(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const Y = tomorrow.getFullYear();
  const M = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const D = String(tomorrow.getDate()).padStart(2, '0');
  const H = String(tomorrow.getHours()).padStart(2, '0');
  const m = String(tomorrow.getMinutes()).padStart(2, '0');
  const S = String(tomorrow.getSeconds()).padStart(2, '0');
  return `${Y}-${M}-${D} ${H}:${m}:${S}`;
}

export const FlowPublishAuditModal: React.FC<FlowPublishAuditModalProps> = ({
  open,
  mode,
  flow,
  archPath,
  currentUser,
  onClose,
  onSuccess,
  showToast,
}) => {
  if (!open || !flow) return null;

  const currentVer = flow.versionNo || 'V1';
  const nextVer = `V${parseInt(currentVer.replace(/\D/g, '') || '1') + 1}`;
  const flowName = flow.label || flow.name || flow.flowName || '流程';
  const flowCode = flow.flowNo || 'FLOW-NEW';
  const displayArch = archPath || flow.archName || '企业流程架构全景 > 业务流程';

  // 1. Publish Policy: 'immediate' | 'scheduled'
  const [publishPolicy, setPublishPolicy] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledTime, setScheduledTime] = useState<string>(getDefaultScheduledTime());

  // 2. Change Info
  const [changeType, setChangeType] = useState('版本升级');
  const [urgency, setUrgency] = useState<'普通' | '紧急' | '特急'>('普通');
  const [changeSummary, setChangeSummary] = useState(
    '根据业务运行实践与质量管理要求，优化活动流转拓扑并完善关键控制点(KCP)交付规范。'
  );

  // 3. Multi-level Approval pipeline (when mode === 'audit')
  const [levels, setLevels] = useState<ApprovalLevelConfig[]>([
    {
      id: 'lvl_1',
      level: 1,
      levelName: '第1级: 审批部门负责人初审',
      approverType: 'deptHead',
      approverName: '集成电路设计院 (部门负责人: 王建军 · 院长)',
      deptName: '集成电路设计院',
      roleName: '部门负责人',
      signType: 'or',
      description: '审查业务需求与活动职责划分是否合规合理',
    },
    {
      id: 'lvl_2',
      level: 2,
      levelName: '第2级: 质量与合规复核',
      approverType: 'person',
      approverName: '陈静',
      deptName: '质量控制部',
      roleName: '质量控制总监',
      signType: 'or',
      description: '重点核验关键控制点 (KCP) 和交付物准出标准',
    },
    {
      id: 'lvl_3',
      level: 3,
      levelName: '第3级: 流程委员会终审',
      approverType: 'committee',
      approverName: '流程治理委员会',
      deptName: '流程治理委员会',
      roleName: '流程治理委员会',
      signType: 'or',
      description: '审定流程架构一致性，批准发布生产运行环境',
    },
  ]);

  const [submitting, setSubmitting] = useState(false);

  // Quick preset helper for scheduled time
  const setQuickTime = (type: 'tomorrow9' | 'tonight18' | 'nextMonday9' | 'weekend' | 'nextMonth1') => {
    const d = new Date();
    if (type === 'tomorrow9') {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    } else if (type === 'tonight18') {
      d.setHours(18, 0, 0, 0);
      if (d.getTime() < Date.now()) {
        d.setDate(d.getDate() + 1);
      }
    } else if (type === 'nextMonday9') {
      const day = d.getDay();
      const diff = (8 - day) % 7 || 7;
      d.setDate(d.getDate() + diff);
      d.setHours(9, 0, 0, 0);
    } else if (type === 'weekend') {
      const day = d.getDay();
      const diff = day === 0 ? 0 : 7 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(23, 59, 59, 0);
    } else if (type === 'nextMonth1') {
      d.setMonth(d.getMonth() + 1, 1);
      d.setHours(0, 0, 0, 0);
    }
    const Y = d.getFullYear();
    const M = String(d.getMonth() + 1).padStart(2, '0');
    const D = String(d.getDate()).padStart(2, '0');
    const H = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const S = String(d.getSeconds()).padStart(2, '0');
    setScheduledTime(`${Y}-${M}-${D} ${H}:${m}:${S}`);
  };

  // Add Level
  const handleAddLevel = () => {
    const nextIdx = levels.length + 1;
    const newLvl: ApprovalLevelConfig = {
      id: 'lvl_' + Date.now().toString(36),
      level: nextIdx,
      levelName: `第${nextIdx}级: 审批节点`,
      approverType: 'committee',
      approverName: 'TRB技术评审委员会',
      deptName: '技术管理部',
      roleName: '评审专家',
      signType: 'or',
      description: '审查技术规范与执行标准',
    };
    setLevels([...levels, newLvl]);
  };

  // Remove Level
  const handleRemoveLevel = (idx: number) => {
    if (levels.length <= 1) {
      showToast('请至少保留一个审批层级', 'warning');
      return;
    }
    const next = levels
      .filter((_, i) => i !== idx)
      .map((lvl, i) => ({
        ...lvl,
        level: i + 1,
        levelName: lvl.levelName.replace(/第\d+级/, `第${i + 1}级`),
      }));
    setLevels(next);
  };

  // Move Level Up/Down
  const handleMoveLevel = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === levels.length - 1)) {
      return;
    }
    const next = [...levels];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    const reindexed = next.map((lvl, i) => ({
      ...lvl,
      level: i + 1,
      levelName: lvl.levelName.replace(/第\d+级/, `第${i + 1}级`),
    }));
    setLevels(reindexed);
  };

  // Update Level
  const handleUpdateLevel = (idx: number, partial: Partial<ApprovalLevelConfig>) => {
    const next = [...levels];
    next[idx] = { ...next[idx], ...partial };
    setLevels(next);
  };

  // Confirm Submit
  const handleConfirmSubmit = async () => {
    if (publishPolicy === 'scheduled') {
      if (!scheduledTime.trim()) {
        showToast('请选择或输入预约发布的具体时间', 'warning');
        return;
      }
      const parsedDate = new Date(scheduledTime.replace(/-/g, '/'));
      if (isNaN(parsedDate.getTime())) {
        showToast('预约时间格式无效，请检查', 'warning');
        return;
      }
    }

    if (mode === 'audit') {
      if (levels.length === 0) {
        showToast('请至少配置一个审批层级', 'warning');
        return;
      }
      for (let i = 0; i < levels.length; i++) {
        if (!levels[i].approverName?.trim()) {
          showToast(`第 ${i + 1} 级审批主体未指定，请选择审批人、部门负责人或委员会`, 'warning');
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        id: flow.id || flow.modelId,
        flowName: flow.label || flow.flowName || flow.name,
        label: flow.label || flow.flowName || flow.name,
        flowNo: flow.flowNo,
        archPath: displayArch,
        audit: mode === 'audit',
        publishPolicy,
        scheduledTime: publishPolicy === 'scheduled' ? scheduledTime : '',
        approvalLevels:
          mode === 'audit'
            ? levels.map((lvl) => ({
                level: lvl.level,
                levelName: lvl.levelName,
                approverType: lvl.approverType,
                approverName: lvl.approverName,
                deptName: lvl.deptName || '',
                roleName: lvl.roleName || '',
                signType: lvl.signType || 'or',
                description: lvl.description || '',
              }))
            : [],
        changeType,
        changeSummary,
        urgency,
        submitUser: currentUser?.userName || '系统管理员',
        submitUserDept: currentUser?.deptName || '数字化运营部',
      };

      const response = await fetch('/api/flow/model/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = `接口响应失败 (HTTP ${response.status})`;
        try {
          const errData = await response.json();
          if (errData && errData.info) errorMsg = errData.info;
        } catch {
          //
        }
        showToast(errorMsg, 'error');
        return;
      }

      const res = await response.json();

      if (res && res.status === 1) {
        if (mode === 'audit') {
          const firstApprover = levels[0]?.approverName || '审批部门负责人';
          const policyText =
            publishPolicy === 'scheduled'
              ? `（审批通过后将于【${scheduledTime}】自动发布生效）`
              : '（审批通过后立即发布生效）';
          showToast(
            `已成功提交多层级发布审核！任务已推送至第1级【${firstApprover}】待办事项${policyText}`,
            'success'
          );
        } else {
          if (publishPolicy === 'scheduled') {
            showToast(
              `已成功设置预约发布！将于【${scheduledTime}】由系统自动激活上线为生产版本 ${res.data?.versionNo || nextVer}`,
              'success'
            );
          } else {
            showToast(
              `流程已成功直接发布！版本正式升级为【${res.data?.versionNo || nextVer}】`,
              'success'
            );
          }
        }

        try {
          if (typeof onSuccess === 'function') {
            onSuccess(res.data);
          }
        } catch (cbErr) {
          console.error('onSuccess callback error:', cbErr);
        }

        try {
          if (typeof onClose === 'function') {
            onClose();
          }
        } catch (closeErr) {
          console.error('onClose error:', closeErr);
        }
      } else {
        showToast((res && res.info) || '发布操作失败', 'error');
      }
    } catch (err: any) {
      console.error('Publish submit exception:', err);
      showToast(err?.message ? `发布操作异常: ${err.message}` : '发布接口请求异常，请检查网络或重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#ebeef5] w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] bg-[#fafbfc] shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-2xs ${
                mode === 'audit' ? 'bg-[#f0f9eb] text-[#67c23a]' : 'bg-[#ecf5ff] text-[#409eff]'
              }`}
            >
              {mode === 'audit' ? <ShieldCheck className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1f2733]">
                  {mode === 'audit' ? '提交发布审核' : '直接发布流程'}
                </h3>
                <span
                  className={`px-2 py-0.2 rounded-full text-[11px] font-semibold border ${
                    mode === 'audit'
                      ? 'bg-[#f0f9eb] text-[#67c23a] border-[#e1f3d8]'
                      : 'bg-[#ecf5ff] text-[#409eff] border-[#d9ecff]'
                  }`}
                >
                  {mode === 'audit' ? '多层级合规审批' : '免审直接生效'}
                </span>
              </div>
              <p className="text-[11px] text-[#909399] mt-0.5">
                {mode === 'audit'
                  ? '支持选择审批人、审批部门负责人、流程委员会等多层级审批，并支持立即发布或预约发布'
                  : '直接将本流程生效为生产版本，支持立即生效或按指定时间自动预约发布'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#909399] hover:text-[#303133] cursor-pointer p-1.5 rounded-md hover:bg-[#f2f4f7] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* 1. Target Flow Summary Card */}
          <div className="bg-[#f8fafd] border border-[#dce8f8] rounded-lg p-4 space-y-2.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e9f0fa] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#409eff] bg-white px-2 py-0.5 rounded border border-[#b3d8ff]">
                  {flowCode}
                </span>
                <span className="text-sm font-bold text-[#1f2733]">{flowName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#909399]">当前版本:</span>
                <span className="font-mono font-medium text-[#606266] bg-white px-2 py-0.5 rounded border border-[#dcdfe6]">
                  {currentVer}
                </span>
                <span className="text-[#409eff] font-bold">➔</span>
                <span className="text-[#909399]">目标版本:</span>
                <span className="font-mono font-bold text-[#67c23a] bg-[#f0f9eb] px-2.5 py-0.5 rounded border border-[#e1f3d8]">
                  {nextVer}
                </span>
              </div>
            </div>
            <div className="text-[11.5px] text-[#606266] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#909399] shrink-0" />
              <span className="text-[#909399]">归属架构路径:</span>
              <span className="font-medium text-[#303133]">{displayArch}</span>
            </div>
          </div>

          {/* 2. Publish Policy: 立即发布 vs 按照时间预约发布 (用户关键诉求) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1f2733] flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-[#409eff]" />
                <span>发布生效策略</span>
                <span className="text-[11px] text-[#909399] font-normal">
                  （支持立即发布或按照具体时间预约自动发布）
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Option A: 立即发布 */}
              <div
                onClick={() => setPublishPolicy('immediate')}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                  publishPolicy === 'immediate'
                    ? 'border-[#409eff] bg-[#f0f7ff] shadow-xs'
                    : 'border-[#ebeef5] bg-[#fafafa] hover:border-[#dcdfe6]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      publishPolicy === 'immediate'
                        ? 'bg-[#409eff] text-white'
                        : 'bg-[#e4e7ed] text-[#909399]'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1f2733]">立即发布</span>
                      <input
                        type="radio"
                        checked={publishPolicy === 'immediate'}
                        onChange={() => setPublishPolicy('immediate')}
                        className="text-[#409eff] cursor-pointer"
                      />
                    </div>
                    <p className="text-[11.5px] text-[#606266] mt-1 leading-relaxed">
                      {mode === 'audit'
                        ? '多层级审批全部通过后，系统立刻将该流程更新上线为最新生产版本。'
                        : '确认后立即将该流程正式生效为生产版本并全员可见。'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Option B: 按照时间预约发布 */}
              <div
                onClick={() => setPublishPolicy('scheduled')}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                  publishPolicy === 'scheduled'
                    ? 'border-[#e6a23c] bg-[#fffaf3] shadow-xs ring-1 ring-[#f5dab1]'
                    : 'border-[#ebeef5] bg-[#fafafa] hover:border-[#dcdfe6]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      publishPolicy === 'scheduled'
                        ? 'bg-[#e6a23c] text-white'
                        : 'bg-[#e4e7ed] text-[#909399]'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1f2733] flex items-center gap-1.5">
                        <span>按照时间预约发布</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#fdf6ec] text-[#e6a23c] border border-[#faecd8] font-normal">
                          自动生效
                        </span>
                      </span>
                      <input
                        type="radio"
                        checked={publishPolicy === 'scheduled'}
                        onChange={() => setPublishPolicy('scheduled')}
                        className="text-[#e6a23c] cursor-pointer"
                      />
                    </div>
                    <p className="text-[11.5px] text-[#606266] mt-1 leading-relaxed">
                      {mode === 'audit'
                        ? '审批通过后进入预约待发布队列，到达设定的具体时刻由系统自动激活并发布。'
                        : '流程进入预约发布状态，到达预约时间后由后台自动发布生效。'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* When Scheduled: Time Picker & Quick Presets */}
            {publishPolicy === 'scheduled' && (
              <div className="bg-[#fffaf3] border border-[#faecd8] rounded-xl p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#e6a23c]" />
                    <span className="font-semibold text-xs text-[#1f2733]">预约自动发布时间：</span>
                    <input
                      type="text"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      placeholder="YYYY-MM-DD HH:mm:ss"
                      className="h-8 px-3 rounded-lg border border-[#dcdfe6] focus:border-[#e6a23c] bg-white text-xs font-mono font-semibold text-[#1f2733] outline-none shadow-2xs w-48"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-[#909399]">快捷预约:</span>
                    <button
                      type="button"
                      onClick={() => setQuickTime('tomorrow9')}
                      className="px-2 py-1 rounded bg-white hover:bg-[#faecd8] text-[11px] text-[#b88230] border border-[#faecd8] font-medium transition-colors cursor-pointer"
                    >
                      明天 09:00
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickTime('tonight18')}
                      className="px-2 py-1 rounded bg-white hover:bg-[#faecd8] text-[11px] text-[#b88230] border border-[#faecd8] font-medium transition-colors cursor-pointer"
                    >
                      今晚 18:00
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickTime('nextMonday9')}
                      className="px-2 py-1 rounded bg-white hover:bg-[#faecd8] text-[11px] text-[#b88230] border border-[#faecd8] font-medium transition-colors cursor-pointer"
                    >
                      下周一 09:00
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickTime('weekend')}
                      className="px-2 py-1 rounded bg-white hover:bg-[#faecd8] text-[11px] text-[#b88230] border border-[#faecd8] font-medium transition-colors cursor-pointer"
                    >
                      本周末 24:00
                    </button>
                  </div>
                </div>

                <div className="text-[11.5px] text-[#b88230] bg-white/70 p-2.5 rounded-lg border border-[#faecd8] flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#e6a23c] shrink-0" />
                  <span>
                    系统定时发布引擎已就绪：
                    {mode === 'audit'
                      ? '审核全流程流转通过后，在预约时间到达时，系统将全自动将版本切换为【已发布】，无需二次人工确认。'
                      : '系统将在该指定时刻全自动执行上线发布，记录实际发布时间并推送全员通知。'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Multi-level Approval Configuration (当 mode === 'audit' 时展示) */}
          {mode === 'audit' && (
            <div className="space-y-3 pt-2 border-t border-[#f0f0f0]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-[#1f2733] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#67c23a]" />
                    <span>多层级审批流程配置</span>
                    <span className="text-[11px] text-[#909399] font-normal">
                      （支持选择具体审批人、审批部门负责人、流程委员会等主体）
                    </span>
                  </label>
                  <p className="text-[11px] text-[#909399] mt-0.5">
                    审核任务将严格按照层级由第1级逐级流转，全级通过后方可执行发布策略。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddLevel}
                  className="h-7.5 px-3 rounded-lg bg-[#ecf5ff] hover:bg-[#d9ecff] text-[#409eff] border border-[#b3d8ff] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加审批层级</span>
                </button>
              </div>

              {/* Levels List */}
              <div className="space-y-3">
                {levels.map((lvl, idx) => (
                  <div
                    key={lvl.id}
                    className="p-4 rounded-xl border border-[#dcdfe6] bg-[#fafbfc] hover:border-[#409eff] transition-all space-y-3 shadow-2xs group"
                  >
                    {/* Top Row: Index, Title, Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-3">
                        <span className="w-6 h-6 rounded-full bg-[#409eff] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={lvl.levelName}
                          onChange={(e) => handleUpdateLevel(idx, { levelName: e.target.value })}
                          className="h-7 px-2.5 rounded border border-[#dcdfe6] focus:border-[#409eff] bg-white text-xs font-bold text-[#1f2733] outline-none max-w-sm"
                          placeholder={`第 ${idx + 1} 级审批节点`}
                        />
                        <span className="text-[11px] text-[#909399]">
                          {idx === 0
                            ? '(初审节点)'
                            : idx === levels.length - 1
                            ? '(终审决议节点)'
                            : '(复核节点)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveLevel(idx, 'up')}
                          disabled={idx === 0}
                          title="上移此层级"
                          className="p-1 rounded text-[#909399] hover:text-[#409eff] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveLevel(idx, 'down')}
                          disabled={idx === levels.length - 1}
                          title="下移此层级"
                          className="p-1 rounded text-[#909399] hover:text-[#409eff] disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        {levels.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLevel(idx)}
                            title="移除此层级"
                            className="p-1 rounded text-[#f56c6c] hover:bg-[#fef0f0] cursor-pointer ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Approver Type Switcher & Selector (用户重点要求) */}
                    <div className="bg-white rounded-lg p-3 border border-[#ebeef5] space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-[#606266] font-medium">审批主体类型：</span>
                          <div className="inline-flex rounded-lg border border-[#dcdfe6] p-0.5 bg-[#f5f7fa]">
                            {/* 1. 审批部门负责人 */}
                            <button
                              type="button"
                              onClick={() => {
                                const defaultDept = PRESET_DEPTS_WITH_HEADS[0];
                                handleUpdateLevel(idx, {
                                  approverType: 'deptHead',
                                  deptName: defaultDept.deptName,
                                  approverName: `${defaultDept.deptName} (部门负责人: ${defaultDept.headName} · ${defaultDept.headRole})`,
                                  roleName: defaultDept.headRole,
                                });
                              }}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-all ${
                                lvl.approverType === 'deptHead'
                                  ? 'bg-[#409eff] text-white shadow-2xs'
                                  : 'text-[#606266] hover:text-[#1f2733]'
                              }`}
                            >
                              <Building2 className="w-3 h-3" />
                              <span>审批部门负责人</span>
                            </button>

                            {/* 2. 具体审批人 */}
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateLevel(idx, {
                                  approverType: 'person',
                                  approverName: '张明',
                                  deptName: '数字化运营部',
                                  roleName: '运营总监',
                                })
                              }
                              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-all ${
                                lvl.approverType === 'person'
                                  ? 'bg-[#409eff] text-white shadow-2xs'
                                  : 'text-[#606266] hover:text-[#1f2733]'
                              }`}
                            >
                              <User className="w-3 h-3" />
                              <span>选择具体审批人</span>
                            </button>

                            {/* 3. 流程委员会 */}
                            <button
                              type="button"
                              onClick={() => {
                                const defaultComm = PRESET_COMMITTEES[0];
                                handleUpdateLevel(idx, {
                                  approverType: 'committee',
                                  approverName: defaultComm.name,
                                  deptName: defaultComm.name,
                                  roleName: defaultComm.chair,
                                });
                              }}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-all ${
                                lvl.approverType === 'committee'
                                  ? 'bg-[#409eff] text-white shadow-2xs'
                                  : 'text-[#606266] hover:text-[#1f2733]'
                              }`}
                            >
                              <Landmark className="w-3 h-3" />
                              <span>流程委员会</span>
                            </button>

                            {/* 4. 业务主管 / 角色 */}
                            <button
                              type="button"
                              onClick={() => {
                                const defaultRole = PRESET_ROLES[0];
                                handleUpdateLevel(idx, {
                                  approverType: 'role',
                                  approverName: defaultRole.roleName,
                                  deptName: defaultRole.deptName,
                                  roleName: defaultRole.roleName,
                                });
                              }}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-all ${
                                lvl.approverType === 'role'
                                  ? 'bg-[#409eff] text-white shadow-2xs'
                                  : 'text-[#606266] hover:text-[#1f2733]'
                              }`}
                            >
                              <Award className="w-3 h-3" />
                              <span>业务主管/角色</span>
                            </button>
                          </div>
                        </div>

                        {/* Sign Type */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#909399]">审批方式:</span>
                          <label className="flex items-center gap-1 text-xs text-[#606266] cursor-pointer">
                            <input
                              type="radio"
                              name={`signtype_${lvl.id}`}
                              checked={lvl.signType === 'or'}
                              onChange={() => handleUpdateLevel(idx, { signType: 'or' })}
                              className="text-[#409eff]"
                            />
                            <span>或签 (一人同意即可)</span>
                          </label>
                          <label className="flex items-center gap-1 text-xs text-[#606266] cursor-pointer">
                            <input
                              type="radio"
                              name={`signtype_${lvl.id}`}
                              checked={lvl.signType === 'and'}
                              onChange={() => handleUpdateLevel(idx, { signType: 'and' })}
                              className="text-[#409eff]"
                            />
                            <span>会签 (全员同意)</span>
                          </label>
                        </div>
                      </div>

                      {/* Approver Selection Content based on type */}
                      <div>
                        {/* 1. 审批部门负责人下拉 */}
                        {lvl.approverType === 'deptHead' && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#606266] w-20 shrink-0">选择部门:</span>
                              <select
                                value={lvl.deptName}
                                onChange={(e) => {
                                  const found = PRESET_DEPTS_WITH_HEADS.find(
                                    (d) => d.deptName === e.target.value
                                  );
                                  if (found) {
                                    handleUpdateLevel(idx, {
                                      deptName: found.deptName,
                                      approverName: `${found.deptName} (部门负责人: ${found.headName} · ${found.headRole})`,
                                      roleName: found.headRole,
                                    });
                                  }
                                }}
                                className="flex-1 h-8 px-3 rounded-lg border border-[#dcdfe6] focus:border-[#409eff] text-xs text-[#1f2733] bg-white outline-none cursor-pointer"
                              >
                                {PRESET_DEPTS_WITH_HEADS.map((d) => (
                                  <option key={d.deptName} value={d.deptName}>
                                    {d.deptName} ➔ 负责人: {d.headName} ({d.headRole})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="pl-20 text-[11px] text-[#909399]">
                              当前指定审批人: <strong className="text-[#409eff]">{lvl.approverName}</strong>
                            </div>
                          </div>
                        )}

                        {/* 2. 选择具体审批人 (利用现有的 PersonSelectField) */}
                        {lvl.approverType === 'person' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#606266] w-20 shrink-0">指定审批人:</span>
                            <div className="flex-1">
                              <PersonSelectField
                                value={lvl.approverName}
                                onChange={(val, person) => {
                                  handleUpdateLevel(idx, {
                                    approverName: val || '张明',
                                    deptName: person?.deptName || lvl.deptName,
                                    roleName: person?.roleName || lvl.roleName,
                                  });
                                }}
                                placeholder="点击从组织架构树选择具体审批人姓名..."
                              />
                            </div>
                          </div>
                        )}

                        {/* 3. 流程委员会下拉 */}
                        {lvl.approverType === 'committee' && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#606266] w-20 shrink-0">流程委员会:</span>
                              <select
                                value={lvl.approverName}
                                onChange={(e) => {
                                  const found = PRESET_COMMITTEES.find(
                                    (c) => c.name === e.target.value
                                  );
                                  if (found) {
                                    handleUpdateLevel(idx, {
                                      approverName: found.name,
                                      deptName: found.name,
                                      roleName: found.chair,
                                    });
                                  }
                                }}
                                className="flex-1 h-8 px-3 rounded-lg border border-[#dcdfe6] focus:border-[#409eff] text-xs font-semibold text-[#1f2733] bg-white outline-none cursor-pointer"
                              >
                                {PRESET_COMMITTEES.map((c) => (
                                  <option key={c.name} value={c.name}>
                                    {c.name} (主持: {c.chair})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="pl-20 text-[11px] text-[#909399]">
                              职责说明:{' '}
                              {PRESET_COMMITTEES.find((c) => c.name === lvl.approverName)?.desc ||
                                '负责合规准入与企业全景架构决策审定'}
                            </div>
                          </div>
                        )}

                        {/* 4. 业务主管/角色 */}
                        {lvl.approverType === 'role' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#606266] w-20 shrink-0">指定角色:</span>
                            <select
                              value={lvl.approverName}
                              onChange={(e) => {
                                const found = PRESET_ROLES.find((r) => r.roleName === e.target.value);
                                if (found) {
                                  handleUpdateLevel(idx, {
                                    approverName: found.roleName,
                                    roleName: found.roleName,
                                    deptName: found.deptName,
                                  });
                                }
                              }}
                              className="flex-1 h-8 px-3 rounded-lg border border-[#dcdfe6] focus:border-[#409eff] text-xs font-semibold text-[#1f2733] bg-white outline-none cursor-pointer"
                            >
                              {PRESET_ROLES.map((r) => (
                                <option key={r.roleName} value={r.roleName}>
                                  {r.roleName} ({r.deptName})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Level Remark / Description */}
                      <div className="flex items-center gap-2 pt-1 border-t border-[#f5f5f5]">
                        <span className="text-xs text-[#909399] w-20 shrink-0">审查关注点:</span>
                        <input
                          type="text"
                          value={lvl.description || ''}
                          onChange={(e) => handleUpdateLevel(idx, { description: e.target.value })}
                          placeholder="可输入本节点重点审查要求，如：核对流片规格、KCP交付物覆盖等..."
                          className="flex-1 h-7 px-2.5 rounded border border-[#e4e7ed] focus:border-[#409eff] text-xs text-[#606266] bg-transparent outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Change Details & Remarks */}
          <div className="space-y-3 pt-2 border-t border-[#f0f0f0]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1f2733] mb-1.5">
                  变更类型
                </label>
                <select
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg border border-[#dcdfe6] focus:border-[#409eff] text-xs text-[#303133] bg-white outline-none cursor-pointer"
                >
                  <option value="版本升级">版本升级 (日常优化与拓扑变更)</option>
                  <option value="重大重构">重大重构 (跨部门业务闭环重组)</option>
                  <option value="合规修订">合规修订 (内控合规与KCP标准升级)</option>
                  <option value="规范优化">规范优化 (活动步骤与交付物模板优化)</option>
                  <option value="新建发布">新建发布 (全新规划流程正式上线)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f2733] mb-1.5">
                  紧急程度
                </label>
                <div className="flex items-center gap-2">
                  {(['普通', '紧急', '特急'] as const).map((urg) => (
                    <label
                      key={urg}
                      onClick={() => setUrgency(urg)}
                      className={`flex-1 flex items-center justify-center h-8 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                        urgency === urg
                          ? urg === '特急'
                            ? 'bg-[#fef0f0] text-[#f56c6c] border-[#fbc4c4] font-bold shadow-2xs'
                            : urg === '紧急'
                            ? 'bg-[#fdf6ec] text-[#e6a23c] border-[#f5dab1] font-bold shadow-2xs'
                            : 'bg-[#ecf5ff] text-[#409eff] border-[#b3d8ff] font-bold shadow-2xs'
                          : 'bg-white text-[#606266] border-[#dcdfe6] hover:bg-[#f5f7fa]'
                      }`}
                    >
                      {urg}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#1f2733]">
                  变更说明与{mode === 'audit' ? '送审备注' : '发布说明'}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#909399]">常用模板:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setChangeSummary(
                        '优化芯片物理实现阶段流片决策与RTL仿真节点，强化同行交叉审查KCP关键控制点'
                      )
                    }
                    className="text-[11px] text-[#409eff] hover:underline cursor-pointer"
                  >
                    流片规范优化
                  </button>
                  <span className="text-[#dcdfe6]">|</span>
                  <button
                    type="button"
                    onClick={() =>
                      setChangeSummary(
                        '按ISO内控合规审计要求，梳理跨部门职责矩阵，明确副总裁终审决策签发规则'
                      )
                    }
                    className="text-[11px] text-[#409eff] hover:underline cursor-pointer"
                  >
                    合规审计修订
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="请输入详细变更内容，提请审批人注意的审查事项..."
                className="w-full px-3 py-2 rounded-lg border border-[#dcdfe6] focus:border-[#409eff] text-xs text-[#303133] placeholder-[#c0c4cc] outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#f0f0f0] bg-[#fafbfc] shrink-0">
          <div className="text-xs text-[#909399] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#409eff]" />
            <span>
              {mode === 'audit' ? (
                <>
                  共配置 <strong className="text-[#409eff]">{levels.length}</strong> 级审批流 ·{' '}
                  {publishPolicy === 'scheduled' ? (
                    <strong className="text-[#e6a23c]">预约于 {scheduledTime} 自动发布</strong>
                  ) : (
                    <strong className="text-[#67c23a]">全部通过后立即发布</strong>
                  )}
                </>
              ) : (
                <>
                  发布模式: {' '}
                  {publishPolicy === 'scheduled' ? (
                    <strong className="text-[#e6a23c]">预约于 {scheduledTime} 自动发布</strong>
                  ) : (
                    <strong className="text-[#67c23a]">立即发布为生产版本</strong>
                  )}
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-8.5 px-4 rounded-lg bg-white hover:bg-[#f5f7fa] text-[#606266] border border-[#dcdfe6] text-xs font-medium cursor-pointer transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={submitting}
              className={`h-8.5 px-6 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                mode === 'audit'
                  ? 'bg-[#67c23a] hover:bg-[#5daf34] active:bg-[#529b2e]'
                  : 'bg-[#409eff] hover:bg-[#3390ff] active:bg-[#2080f0]'
              }`}
            >
              {submitting ? (
                <span>提交中...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{mode === 'audit' ? '提交发布审核' : '确认发布'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
