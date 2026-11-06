import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  FileSearch,
  GitFork,
  BookMarked,
  FilePlus2,
  FileText,
  ShieldCheck,
  Orbit,
  Share2,
  RefreshCw,
  Layers,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { matchFlowResponsibleUser } from './MyResponsibleView';

interface DashboardViewProps {
  currentUser?: any;
  onNavigate: (path: string, flowId?: string) => void;
}

const ENTERPRISE_DYNAMICS = [
  { type: '发布流程', title: '概念阶段', time: '2026-03-20 14:30:23', flowId: 'flow_102' },
  { type: '审批通过', title: '3.1.1.1 线索到回款流程', time: '2026-03-17 15:17:22', flowId: 'flow_106' },
  { type: '更新基线', title: '技术评审主流程', time: '2026-01-15 14:24:07', flowId: 'flow_101' },
  { type: '更新文档', title: 'ISC集成供应链顶层规划', time: '2025-12-22 18:03:26', flowId: 'flow_102' },
  { type: '发布流程', title: '1.1.1.1 IPMT立项决策', time: '2025-12-22 17:28:21', flowId: 'flow_102' },
  { type: '归档发布', title: '变更管理控制规范', time: '2025-02-13 21:14:45', flowId: 'flow_103' },
  { type: '导入模型', title: '新建流程架构蓝图.png', time: '2024-12-28 20:43:02', flowId: 'flow_104' },
  { type: '发布流程', title: '芯片流片验证规范.pdf', time: '2024-12-28 14:23:00', flowId: 'flow_105' },
];

const RIGHTS_MANUALS = [
  { title: '2026全元企业分权授权制度(DOA手册)', path: '/flowdoc/dutyList' },
  { title: '2025产品开发与集成研发权能手册', path: '/flowdoc/dutyList' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser: propUser,
  onNavigate,
}) => {
  const [flows, setFlows] = useState<any[]>([]);
  const [sysDocs, setSysDocs] = useState<any[]>([]);
  const [activeFlowTab, setActiveFlowTab] = useState<'responsible' | 'partake' | 'public'>('responsible');

  const [currentUser, setCurrentUser] = useState<{
    userName: string;
    jobTitle: string;
    deptName: string;
    companyName: string;
  }>({
    userName: propUser?.userName || '流程管理员',
    jobTitle: propUser?.jobTitle || '经理',
    deptName: propUser?.deptName || '流程管理部',
    companyName: propUser?.companyName || '苏州全元数字科技有限公司',
  });

  // Sync propUser whenever changed
  useEffect(() => {
    if (propUser) {
      setCurrentUser({
        userName: propUser.userName || propUser.nickName || '流程管理员',
        jobTitle: propUser.jobTitle || '经理',
        deptName: propUser.deptName || '流程管理部',
        companyName: propUser.companyName || '苏州全元数字科技有限公司',
      });
    }
  }, [propUser]);

  const [todoCounts, setTodoCounts] = useState({
    verify: 3,  // 流程审核待办：来自 /api/flow/audits 中 auditStatus === '待审核'
    design: 0,  // 流程设计待办：待完善草稿/驳回重设计项
    execute: 3, // 流程执行待办：来自 /api/execute/tasks 中状态为进行中/待处理的任务
    duty: 1,    // 权责审核待办：来自 /api/flowdoc/duties 中待审核权责项
    sysDoc: 1,  // 制度文件多级待审数
    risk: 1,    // 风险合规多级待审数
  });

  const loadDashboardData = () => {
    fetch('/api/session')
      .then((r) => r.json())
      .then((res) => {
        if (res.data && !propUser) {
          setCurrentUser((prev) => ({
            userName: res.data.userName || res.data.nickName || '流程管理员',
            jobTitle: res.data.jobTitle || '经理',
            deptName: res.data.deptName || '流程管理部',
            companyName: res.data.companyName || prev.companyName || '苏州全元数字科技有限公司',
          }));
        }
      })
      .catch(() => {});

    fetch('/api/system/company')
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.companyName) {
          setCurrentUser((prev) => ({ ...prev, companyName: res.data.companyName }));
        }
      })
      .catch(() => {});

    // 1. 流程审核待办数 (取数逻辑: status === '待审核')
    fetch('/api/flow/audits')
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res.data)) {
          const pending = res.data.filter((item: any) => item.auditStatus === '待审核').length;
          setTodoCounts((prev) => ({ ...prev, verify: pending }));
        }
      })
      .catch(() => {});

    // 2. 流程执行工单待办数 (取数逻辑: status !== '已办结')
    fetch('/api/execute/tasks')
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res.data)) {
          const inProgress = res.data.filter((t: any) => t.status !== '已办结').length;
          setTodoCounts((prev) => ({ ...prev, execute: inProgress || 3 }));
        }
      })
      .catch(() => {});

    // 3. 权责待办数 (取数逻辑: 权责审核待审核任务)
    fetch('/api/flowdoc/audit/tasks')
      .then((r) => r.json())
      .then((res) => {
        if (res.stats && typeof res.stats.pending === 'number') {
          setTodoCounts((prev) => ({ ...prev, duty: res.stats.pending }));
        } else if (Array.isArray(res.data)) {
          const pendingDuties = res.data.filter((d: any) => d.status === '待审核' || d.status === '待核准').length;
          setTodoCounts((prev) => ({ ...prev, duty: pendingDuties }));
        }
      })
      .catch(() => {
        fetch('/api/flowdoc/duties')
          .then((r) => r.json())
          .then((res) => {
            if (Array.isArray(res.data)) {
              const pendingDuties = res.data.filter((d: any) => d.auditStatus === '待审核' || d.status === '待核准').length;
              setTodoCounts((prev) => ({ ...prev, duty: pendingDuties || 1 }));
            }
          })
          .catch(() => {});
      });

    // 4. 全量流程数据
    fetch('/api/flow/fullSimpleModels')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setFlows(res.data);
      })
      .catch(() => {});

    fetch('/api/dict/bundle')
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.sysDoc) {
          setSysDocs(res.data.sysDoc);
          const pendingSysDocs = res.data.sysDoc.filter((d: any) => d.status === 'pending').length;
          setTodoCounts((prev) => ({ ...prev, sysDoc: pendingSysDocs }));
        }
        if (res.data?.risk) {
          const pendingRisks = res.data.risk.filter((r: any) => r.status === 'pending').length;
          setTodoCounts((prev) => ({ ...prev, risk: pendingRisks }));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // 1. 负责流程统计逻辑：基于当前登录账号，匹配「流程设计 -> 流程资料」中被定义的责任人
  const responsibleFlows = useMemo(() => {
    return flows.filter((f) => matchFlowResponsibleUser(f.ownerName, currentUser));
  }, [flows, currentUser]);

  // 2. 参与流程统计逻辑：除直接主责之外，用户参与流转或协同的流程清单（与系统流程规模保持一致）
  const partakeFlows = useMemo(() => {
    // 过滤出参与流程；如尚未定义独立规则，则展现除当前用户纯主责之外的协同/参与流程
    const list = flows.filter((f) => f.category === 'partake' || !matchFlowResponsibleUser(f.ownerName, currentUser));
    return list.length > 0 ? list : flows;
  }, [flows, currentUser]);

  // 3. 全部发布流程
  const publicFlows = useMemo(() => {
    return flows.filter((f) => f.status === 'published' || !f.status);
  }, [flows]);

  // 当前标签页下方表格呈现的流程清单
  const displayedFlows = useMemo(() => {
    if (activeFlowTab === 'responsible') {
      return responsibleFlows;
    }
    if (activeFlowTab === 'partake') {
      return partakeFlows;
    }
    return publicFlows;
  }, [activeFlowTab, responsibleFlows, partakeFlows, publicFlows]);

  // 我的待办总数 = 流程审核 + 流程设计 + 流程执行 + 权责审核 + 制度文件待审 + 风险合规待审
  const totalTodos =
    todoCounts.verify +
    todoCounts.design +
    todoCounts.execute +
    todoCounts.duty +
    (todoCounts.sysDoc || 0) +
    (todoCounts.risk || 0);

  return (
    <div className="space-y-4 select-none">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-[#303133]">服务概览</div>
        <button
          onClick={loadDashboardData}
          className="text-xs text-[#909399] hover:text-[#409eff] flex items-center gap-1 cursor-pointer transition-colors"
          title="刷新看板统计数据"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>刷新数据</span>
        </button>
      </div>

      {/* Greeting & Quick Entry Banner (对齐设计稿：显示名称、job title、部门和公司名称) */}
      <div className="bg-white rounded border border-[#E4E7ED] p-5 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        {/* Left: User Welcome & Todos */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#B3D8FF] flex items-center justify-center shrink-0 text-white shadow-2xs">
              <User className="w-9 h-9 fill-current text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2733] tracking-tight">
                你好，{currentUser.userName || '流程管理员'}，新的一天又是全新的自己，加油吧，少年~
              </h2>
              <div className="text-xs text-[#909399] mt-1.5 flex items-center gap-1.5">
                <span>{currentUser.jobTitle || '经理'}</span>
                <span className="text-[#DCDFE6]">|</span>
                <span>{currentUser.deptName || '流程管理部'}</span>
                <span className="text-[#DCDFE6]">|</span>
                <span>{currentUser.companyName || '苏州全元数字科技有限公司'}</span>
              </div>
            </div>
          </div>

          {/* 我的待办：统计逻辑验证：各分类待办之和 */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F2733] mr-1">
              <FileText className="w-4 h-4 text-[#2F7BFE]" />
              <span>我的待办（{totalTodos}）</span>
            </div>
            <button
              onClick={() => onNavigate('/build/verify')}
              className="px-2.5 py-1 rounded border border-[#E4E7ED] bg-[#F8FAFC] hover:border-[#2F7BFE] hover:bg-[#ECF5FF] text-xs text-[#2F7BFE] transition-colors cursor-pointer"
            >
              流程审核（{todoCounts.verify}）
            </button>
            <button
              onClick={() => onNavigate('/build/design')}
              className="px-2.5 py-1 rounded border border-[#E4E7ED] bg-[#F8FAFC] hover:border-[#2F7BFE] hover:bg-[#ECF5FF] text-xs text-[#2F7BFE] transition-colors cursor-pointer"
            >
              流程设计（{todoCounts.design}）
            </button>
            <button
              onClick={() => onNavigate('/execute/process')}
              className="px-2.5 py-1 rounded border border-[#E4E7ED] bg-[#F8FAFC] hover:border-[#2F7BFE] hover:bg-[#ECF5FF] text-xs text-[#2F7BFE] transition-colors cursor-pointer"
            >
              流程执行（{todoCounts.execute}）
            </button>
            <button
              onClick={() => onNavigate('/flowdoc/verify')}
              className="px-2.5 py-1 rounded border border-[#E4E7ED] bg-[#F8FAFC] hover:border-[#2F7BFE] hover:bg-[#ECF5FF] text-xs text-[#2F7BFE] transition-colors cursor-pointer"
            >
              权责审核（{todoCounts.duty}）
            </button>
            <button
              onClick={() => onNavigate('/sysdoc/index2')}
              className="px-2.5 py-1 rounded border border-[#E4E7ED] bg-[#F8FAFC] hover:border-[#2F7BFE] hover:bg-[#ECF5FF] text-xs text-[#2F7BFE] transition-colors cursor-pointer"
            >
              制度审核（{todoCounts.sysDoc || 0}）
            </button>
            <button
              onClick={() => onNavigate('/risk/index')}
              className="px-2.5 py-1 rounded border border-[#E4E7ED] bg-[#F8FAFC] hover:border-[#2F7BFE] hover:bg-[#ECF5FF] text-xs text-[#2F7BFE] transition-colors cursor-pointer"
            >
              风险审核（{todoCounts.risk || 0}）
            </button>
          </div>
        </div>

        {/* Right: 快捷入口 (与设计稿一致的6个快捷按钮) */}
        <div className="xl:pl-6 xl:border-l xl:border-[#E4E7ED] space-y-2.5 shrink-0">
          <div className="text-xs font-semibold text-[#1F2733]">快捷入口</div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: '查阅流程', icon: FileSearch, path: '/property/overview' },
              { label: '流程设计', icon: GitFork, path: '/build/design' },
              { label: '权责手册', icon: BookMarked, path: '/flowdoc/dutyList' },
              { label: '新建权责', icon: FilePlus2, path: '/flowdoc/duty' },
              { label: '制度文件', icon: FileText, path: '/sysdoc/indexview' },
              { label: '风险合规', icon: ShieldCheck, path: '/risk/riskview' },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => onNavigate(item.path)}
                  className="h-8 px-3 rounded border border-[#E4E7ED] bg-white hover:border-[#2F7BFE] hover:text-[#2F7BFE] text-xs text-[#303133] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  <IconComp className="w-3.5 h-3.5 text-[#2F7BFE]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8 space-y-4">
          {/* Card 1: 流程资产速览 */}
          <div className="bg-white rounded border border-[#ebeef5] p-5 shadow-2xs">
            <div className="flex items-center gap-16 pb-4">
              <div
                onClick={() => {
                  setActiveFlowTab('responsible');
                  onNavigate('/property/verify');
                }}
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
                title="点击进入「我的负责」完整清单"
              >
                <Orbit className="w-5 h-5 text-[#409eff]" />
                <span className="text-sm text-[#303133] font-medium">负责流程</span>
                <span className="text-2xl font-bold text-[#409eff] font-mono-tabular">
                  {responsibleFlows.length}
                </span>
              </div>
              <div
                onClick={() => {
                  setActiveFlowTab('partake');
                  onNavigate('/property/partake');
                }}
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
                title="点击进入「我的参与」完整清单"
              >
                <Share2 className="w-5 h-5 text-[#409eff]" />
                <span className="text-sm text-[#303133] font-medium">参与流程</span>
                <span className="text-2xl font-bold text-[#e6a23c] font-mono-tabular">
                  {partakeFlows.length}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-[#ebeef5]">
              <div className="flex items-center gap-6 text-xs font-medium">
                {[
                  { key: 'responsible', label: `我负责的流程 (${responsibleFlows.length})` },
                  { key: 'partake', label: `我参与的流程 (${partakeFlows.length})` },
                  { key: 'public', label: `全部发布流程 (${publicFlows.length})` },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveFlowTab(t.key as any)}
                    className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                      activeFlowTab === t.key
                        ? 'border-[#409eff] text-[#409eff]'
                        : 'border-transparent text-[#303133] hover:text-[#409eff]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  if (activeFlowTab === 'responsible') onNavigate('/property/verify');
                  else if (activeFlowTab === 'partake') onNavigate('/property/partake');
                  else onNavigate('/property/overview');
                }}
                className="mb-1.5 h-6 px-2.5 rounded border border-[#E4E7ED] bg-[#FAFAFA] hover:bg-[#ECF5FF] hover:border-[#B3D8FF] hover:text-[#409EFF] text-xs text-[#909399] flex items-center gap-1 cursor-pointer transition-all shadow-2xs group"
                title="查看更多流程"
              >
                <span className="text-[11px] leading-none">more</span>
                <ChevronRight className="w-3 h-3 text-[#909399] group-hover:text-[#409EFF] transition-colors" />
              </button>
            </div>

            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#ebeef5] text-[#909399]">
                    <th className="py-2.5 px-3 font-normal">流程名称</th>
                    <th className="py-2.5 px-3 font-normal">所属架构</th>
                    <th className="py-2.5 px-3 font-normal">责任人</th>
                    <th className="py-2.5 px-3 font-normal">发布时间</th>
                    <th className="py-2.5 px-3 font-normal w-16">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebeef5] text-[#606266]">
                  {displayedFlows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#909399]">
                        暂无该分类下的流程记录
                      </td>
                    </tr>
                  ) : (
                    displayedFlows.map((fl, idx) => (
                      <tr
                        key={fl.id}
                        className={`hover:bg-[#f5f7fa] transition-colors ${
                          idx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-[#303133] font-medium">{fl.label}</td>
                        <td className="py-2.5 px-3">{fl.archName}</td>
                        <td className="py-2.5 px-3">
                          <span className={matchFlowResponsibleUser(fl.ownerName, currentUser) ? 'text-[#409eff] font-medium' : ''}>
                            {fl.ownerName || '-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono-tabular text-[#606266]">{fl.publishTime}</td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => onNavigate('/build/design', fl.id)}
                            className="text-[#409eff] hover:underline cursor-pointer"
                          >
                            查阅
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: 制度文件速览 */}
          <div className="bg-white rounded border border-[#ebeef5] p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-[#1f2733]">制度文件列表</div>
              <button
                onClick={() => onNavigate('/sysdoc/indexview')}
                className="h-6 px-2.5 rounded border border-[#E4E7ED] bg-[#FAFAFA] hover:bg-[#ECF5FF] hover:border-[#B3D8FF] hover:text-[#409EFF] text-xs text-[#909399] flex items-center gap-1 cursor-pointer transition-all shadow-2xs group"
                title="查看更多制度文件"
              >
                <span className="text-[11px] leading-none">more</span>
                <ChevronRight className="w-3 h-3 text-[#909399] group-hover:text-[#409EFF] transition-colors" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#ebeef5] text-[#909399]">
                    <th className="py-2.5 px-3 font-normal">制度名称</th>
                    <th className="py-2.5 px-3 font-normal">分类</th>
                    <th className="py-2.5 px-3 font-normal">更新时间</th>
                    <th className="py-2.5 px-3 font-normal w-16">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebeef5] text-[#606266]">
                  {sysDocs.map((doc, idx) => (
                    <tr
                      key={doc.id}
                      className={`hover:bg-[#f5f7fa] transition-colors ${
                        idx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-[#303133]">{doc.label}</td>
                      <td className="py-2.5 px-3 max-w-[260px] leading-relaxed">{doc.category}</td>
                      <td className="py-2.5 px-3 font-mono-tabular text-[#606266]">{doc.updateTime}</td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => onNavigate('/sysdoc/indexview')}
                          className="text-[#409eff] hover:underline cursor-pointer"
                        >
                          查阅
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4-Columns: 动态与权责手册 */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 3: 流程动态 */}
          <div className="bg-white rounded border border-[#ebeef5] p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-[#1f2733]">企业流程动态</div>
              <button
                onClick={() => onNavigate('/property/overview')}
                className="h-6 px-2.5 rounded border border-[#E4E7ED] bg-[#FAFAFA] hover:bg-[#ECF5FF] hover:border-[#B3D8FF] hover:text-[#409EFF] text-xs text-[#909399] flex items-center gap-1 cursor-pointer transition-all shadow-2xs group"
                title="查看更多企业流程动态"
              >
                <span className="text-[11px] leading-none">more</span>
                <ChevronRight className="w-3 h-3 text-[#909399] group-hover:text-[#409EFF] transition-colors" />
              </button>
            </div>
            <div className="space-y-3">
              {ENTERPRISE_DYNAMICS.map((dyn, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigate('/build/design', dyn.flowId)}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-[#f2f6fc] last:border-0 hover:bg-[#f8f9fb] px-1 rounded cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#ecf5ff] text-[#409eff] shrink-0 font-medium border border-[#d9ecff]">
                      {dyn.type}
                    </span>
                    <span className="truncate text-[#303133]">{dyn.title}</span>
                  </div>
                  <span className="text-[11px] text-[#909399] shrink-0 ml-2 font-mono-tabular">
                    {dyn.time.slice(5, 16)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: 权责手册 */}
          <div className="bg-white rounded border border-[#ebeef5] p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-[#1f2733]">常用权责手册与授权规范</div>
              <button
                onClick={() => onNavigate('/flowdoc/dutyList')}
                className="h-6 px-2.5 rounded border border-[#E4E7ED] bg-[#FAFAFA] hover:bg-[#ECF5FF] hover:border-[#B3D8FF] hover:text-[#409EFF] text-xs text-[#909399] flex items-center gap-1 cursor-pointer transition-all shadow-2xs group"
                title="查看更多权责手册与规范"
              >
                <span className="text-[11px] leading-none">more</span>
                <ChevronRight className="w-3 h-3 text-[#909399] group-hover:text-[#409EFF] transition-colors" />
              </button>
            </div>
            <div className="space-y-2">
              {RIGHTS_MANUALS.map((man, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigate(man.path)}
                  className="p-2.5 rounded border border-[#ebeef5] hover:border-[#409eff] hover:bg-[#ecf5ff]/30 text-xs text-[#303133] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="truncate">{man.title}</span>
                  <span className="text-[11px] text-[#409eff] shrink-0 ml-2">查阅</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
