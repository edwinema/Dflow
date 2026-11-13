import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Camera,
  Upload,
  Pencil,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { matchFlowResponsibleUser } from './MyResponsibleView';

interface DashboardViewProps {
  currentUser?: any;
  onNavigate: (path: string, flowId?: string) => void;
}

const PRESET_AVATARS = [
  { id: 'av_1', label: '商务总监', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80' },
  { id: 'av_2', label: '流程架构师', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
  { id: 'av_3', label: '质量专员', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
  { id: 'av_4', label: '研发经理', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
  { id: 'av_5', label: '敏捷专家', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80' },
  { id: 'av_6', label: '数字化先锋', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' },
];

const PRESET_GREETINGS = [
  '新的一天又是全新的自己，加油吧，少年~',
  '规范驱动质量，流程创造价值',
  '立足客户需求，推进流程数字化变革',
  '深耕业务肌理，赋能全员高效协同',
  '保持专注与热爱，今天也是高效的一天！',
  '以严谨立基石，以创新筑未来',
  '细节决定成败，合规保障安全',
  '业务顺畅流转，责任清晰高效',
];

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
    verify: 0,  // 流程审核待办：来自 /api/flow/audits 中 auditStatus === '待审核'
    design: 0,  // 流程设计待办：待完善草稿/驳回重设计项
    execute: 3, // 流程执行待办：来自 /api/execute/tasks 中状态为进行中/待处理的任务
    duty: 0,    // 权责审核待办：来自 /api/flowdoc/duties 中待审核权责项
    sysDoc: 0,  // 制度文件多级待审数
    risk: 0,    // 风险合规多级待审数
  });

  // 头像与问候语个性化自定义状态
  const defaultGreeting = '新的一天又是全新的自己，加油吧，少年~';
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    return localStorage.getItem(`dflow_avatar_${currentUser.userName}`) || localStorage.getItem('dflow_user_avatar') || '';
  });
  const [customGreeting, setCustomGreeting] = useState<string>(() => {
    return localStorage.getItem(`dflow_greeting_${currentUser.userName}`) || localStorage.getItem('dflow_user_greeting') || defaultGreeting;
  });

  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [tempAvatar, setTempAvatar] = useState<string>('');
  const [avatarInputUrl, setAvatarInputUrl] = useState('');
  const [avatarTab, setAvatarTab] = useState<'upload' | 'preset' | 'url'>('upload');

  const [isEditingGreeting, setIsEditingGreeting] = useState(false);
  const [greetingInput, setGreetingInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Sync avatar and greeting when user switches
  useEffect(() => {
    const savedAvatar = localStorage.getItem(`dflow_avatar_${currentUser.userName}`) || localStorage.getItem('dflow_user_avatar') || '';
    const savedGreeting = localStorage.getItem(`dflow_greeting_${currentUser.userName}`) || localStorage.getItem('dflow_user_greeting') || defaultGreeting;
    setUserAvatar(savedAvatar);
    setCustomGreeting(savedGreeting);
  }, [currentUser.userName]);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('图片文件大小不能超过 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setTempAvatar(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveAvatar = (newAvatar: string) => {
    setUserAvatar(newAvatar);
    localStorage.setItem(`dflow_avatar_${currentUser.userName}`, newAvatar);
    localStorage.setItem('dflow_user_avatar', newAvatar);
    window.dispatchEvent(
      new CustomEvent('dflow_avatar_changed', {
        detail: { avatar: newAvatar, userName: currentUser.userName },
      })
    );
    setAvatarModalOpen(false);
    showToast(newAvatar ? '头像照片已更新！' : '已恢复默认头像');
  };

  const handleSaveGreeting = (text: string) => {
    const trimmed = text.trim() || defaultGreeting;
    setCustomGreeting(trimmed);
    localStorage.setItem(`dflow_greeting_${currentUser.userName}`, trimmed);
    localStorage.setItem('dflow_user_greeting', trimmed);
    setIsEditingGreeting(false);
    showToast('问候标语已成功保存！');
  };

  const handleResetGreeting = () => {
    setCustomGreeting(defaultGreeting);
    setGreetingInput(defaultGreeting);
    localStorage.removeItem(`dflow_greeting_${currentUser.userName}`);
    localStorage.removeItem('dflow_user_greeting');
    setIsEditingGreeting(false);
    showToast('已恢复默认问候标语');
  };

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

    // Approval counts are scoped to the current actor, using the same source as the center.
    fetch('/api/approvals?view=pending').then(async r=>{if(!r.ok)throw new Error('审批计数读取失败');return r.json();}).then(res=>{
      if(res.status===1){const counts=res.data.typeCounts;setTodoCounts(prev=>({...prev,verify:counts.flow||0,duty:counts.duty||0,sysDoc:counts.sysDoc||0,risk:counts.risk||0}));}
    }).catch(()=>{});

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
            {/* 头像区域：支持自定义、换照片 */}
            <div className="relative group/avatar shrink-0">
              <div
                onClick={() => {
                  setTempAvatar(userAvatar);
                  setAvatarInputUrl(userAvatar.startsWith('http') ? userAvatar : '');
                  setAvatarModalOpen(true);
                }}
                className="w-14 h-14 rounded-full bg-[#B3D8FF] flex items-center justify-center overflow-hidden shadow-2xs cursor-pointer border-2 border-transparent hover:border-[#2F7BFE] transition-all relative"
                title="点击更换个人头像照片"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={currentUser.userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-9 h-9 fill-current text-white" />
                )}

                {/* Hover 浮层提示：换照片 */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] scale-90 mt-0.5 font-medium">换照片</span>
                </div>
              </div>

              {/* 右下角相机修改徽章 */}
              <button
                type="button"
                onClick={() => {
                  setTempAvatar(userAvatar);
                  setAvatarInputUrl(userAvatar.startsWith('http') ? userAvatar : '');
                  setAvatarModalOpen(true);
                }}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#2F7BFE] hover:bg-[#165DFF] text-white flex items-center justify-center shadow-xs ring-2 ring-white cursor-pointer transition-transform hover:scale-110"
                title="更换头像照片"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            {/* 用户问候与自定义问候语句 */}
            <div className="flex-1 min-w-0">
              {!isEditingGreeting ? (
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                  <h2 className="text-base font-bold text-[#1F2733] tracking-tight flex items-center flex-wrap gap-1.5 group/motto">
                    <span>你好，{currentUser.userName || '流程管理员'}，</span>
                    <span
                      onClick={() => {
                        setGreetingInput(customGreeting);
                        setIsEditingGreeting(true);
                      }}
                      className="text-[#1F2733] hover:text-[#2F7BFE] cursor-pointer transition-colors relative border-b border-dashed border-[#C0C4CC] hover:border-[#2F7BFE] pb-0.5"
                      title="点击直接修改自定义问候语句"
                    >
                      {customGreeting}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setGreetingInput(customGreeting);
                        setIsEditingGreeting(true);
                      }}
                      className="p-1 text-[#909399] hover:text-[#2F7BFE] hover:bg-[#F2F6FC] rounded transition-all cursor-pointer inline-flex items-center gap-1 text-xs font-normal"
                      title="自定义问候语句"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#909399] hover:text-[#2F7BFE]" />
                      <span className="text-[11px] text-[#2F7BFE] hidden group-hover/motto:inline font-medium">
                        自定义语句
                      </span>
                    </button>
                  </h2>
                </div>
              ) : (
                /* 行内编辑问候语 */
                <div className="bg-[#F8FAFC] border border-[#2F7BFE] rounded-lg p-2.5 shadow-xs max-w-xl animate-in fade-in duration-150">
                  <div className="text-[11px] font-semibold text-[#1F2733] mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#2F7BFE]" />
                      自定义个人问候标语
                    </span>
                    <span className="text-[10px] text-[#909399]">支持输入任意鼓励或工作箴言</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={greetingInput}
                      onChange={(e) => setGreetingInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveGreeting(greetingInput);
                        if (e.key === 'Escape') setIsEditingGreeting(false);
                      }}
                      placeholder="输入您的自定义问候语，如：规范驱动质量，流程创造价值"
                      maxLength={50}
                      autoFocus
                      className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-[#DCDFE6] focus:border-[#2F7BFE] focus:ring-1 focus:ring-[#2F7BFE] rounded outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveGreeting(greetingInput)}
                      className="px-2.5 py-1.5 bg-[#2F7BFE] hover:bg-[#165DFF] text-white text-xs font-medium rounded flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>保存</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingGreeting(false)}
                      className="px-2 py-1.5 bg-white hover:bg-[#F2F6FC] border border-[#DCDFE6] text-[#606266] text-xs rounded flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>取消</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetGreeting}
                      className="px-2 py-1.5 text-xs text-[#909399] hover:text-[#F56C6C] cursor-pointer transition-colors shrink-0"
                      title="重置为默认语句"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* 预设推荐标语 */}
                  <div className="mt-2 pt-2 border-t border-[#EBEEF5] flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10.5px] text-[#909399] shrink-0">快捷语句：</span>
                    {PRESET_GREETINGS.slice(0, 5).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setGreetingInput(preset);
                          handleSaveGreeting(preset);
                        }}
                        className="text-[10.5px] px-2 py-0.5 rounded bg-white hover:bg-[#ECF5FF] border border-[#E4E7ED] hover:border-[#2F7BFE] text-[#606266] hover:text-[#2F7BFE] transition-colors cursor-pointer truncate max-w-[200px]"
                        title={preset}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
              onClick={() => onNavigate('/approval/pending?type=sysDoc')}
              className="px-2.5 py-1 rounded border border-[#E4E7ED] bg-[#F8FAFC] hover:border-[#2F7BFE] hover:bg-[#ECF5FF] text-xs text-[#2F7BFE] transition-colors cursor-pointer"
            >
              制度审核（{todoCounts.sysDoc || 0}）
            </button>
            <button
              onClick={() => onNavigate('/approval/pending?type=risk')}
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

      {/* 换照片（更换个人头像照片）模态框 */}
      {avatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E4E7ED] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#F0F2F5] flex items-center justify-between bg-gradient-to-r from-[#F8FAFC] to-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ECF5FF] text-[#2F7BFE] flex items-center justify-center font-bold">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1F2733]">自定义个人头像照片</h3>
                  <p className="text-[11px] text-[#909399]">支持上传本地照片、精选预设头像或输入图片链接</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAvatarModalOpen(false)}
                className="text-[#909399] hover:text-[#606266] p-1.5 rounded-md hover:bg-[#F2F6FC] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Avatar Preview */}
              <div className="flex items-center gap-5 p-3.5 bg-[#F8FAFC] rounded-lg border border-[#EBEEF5]">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full bg-[#B3D8FF] flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                    {tempAvatar ? (
                      <img src={tempAvatar} alt="预览" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 fill-current text-white" />
                    )}
                  </div>
                  {tempAvatar && (
                    <button
                      type="button"
                      onClick={() => setTempAvatar('')}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-[#F56C6C] hover:bg-[#E64242] text-white rounded-full flex items-center justify-center shadow-xs cursor-pointer"
                      title="清除照片，恢复默认"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-[#1F2733]">头像预览效果</div>
                  <div className="text-[11px] text-[#909399]">
                    支持 JPG、PNG、WebP、SVG 格式图片，建议使用清晰正方形照片。
                  </div>
                  {tempAvatar ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#67C23A] font-medium">
                      <Check className="w-3 h-3" /> 已选用新照片
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#909399]">当前为系统默认初始剪影</span>
                  )}
                </div>
              </div>

              {/* Tabs: Upload / Presets / URL */}
              <div className="flex border-b border-[#EBEEF5] text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setAvatarTab('upload')}
                  className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    avatarTab === 'upload'
                      ? 'border-[#2F7BFE] text-[#2F7BFE] font-bold'
                      : 'border-transparent text-[#606266] hover:text-[#2F7BFE]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>上传本地照片</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('preset')}
                  className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    avatarTab === 'preset'
                      ? 'border-[#2F7BFE] text-[#2F7BFE] font-bold'
                      : 'border-transparent text-[#606266] hover:text-[#2F7BFE]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>精选推荐头像</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('url')}
                  className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    avatarTab === 'url'
                      ? 'border-[#2F7BFE] text-[#2F7BFE] font-bold'
                      : 'border-transparent text-[#606266] hover:text-[#2F7BFE]'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>网络图片链接</span>
                </button>
              </div>

              {/* Tab 1: Upload */}
              {avatarTab === 'upload' && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#DCDFE6] hover:border-[#2F7BFE] rounded-lg p-6 flex flex-col items-center justify-center gap-2.5 bg-[#FAFAFA] hover:bg-[#F2F6FC] transition-colors cursor-pointer group text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#909399] group-hover:text-[#2F7BFE] group-hover:scale-105 transition-all">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#1F2733] group-hover:text-[#2F7BFE]">
                        点击选择或将照片拖拽至此处
                      </div>
                      <div className="text-[11px] text-[#909399] mt-0.5">
                        支持 JPG、PNG、WebP，文件小于 5MB
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Presets */}
              {avatarTab === 'preset' && (
                <div className="space-y-2.5">
                  <div className="text-xs text-[#606266]">点击任意头像直接选用：</div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {PRESET_AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setTempAvatar(av.url)}
                        className={`p-1.5 rounded-lg border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          tempAvatar === av.url
                            ? 'border-[#2F7BFE] bg-[#ECF5FF] ring-2 ring-[#2F7BFE]/30'
                            : 'border-[#E4E7ED] hover:border-[#2F7BFE] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <img
                          src={av.url}
                          alt={av.label}
                          className="w-12 h-12 rounded-full object-cover shadow-2xs"
                        />
                        <span className="text-[10.5px] text-[#606266] truncate w-full text-center">
                          {av.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: URL */}
              {avatarTab === 'url' && (
                <div className="space-y-3">
                  <div className="text-xs text-[#606266]">输入公网可访问的图片 URL 链接：</div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={avatarInputUrl}
                      onChange={(e) => setAvatarInputUrl(e.target.value)}
                      placeholder="https://example.com/my-avatar.jpg"
                      className="flex-1 text-xs px-3 py-2 bg-white border border-[#DCDFE6] focus:border-[#2F7BFE] focus:ring-1 focus:ring-[#2F7BFE] rounded outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (avatarInputUrl.trim()) {
                          setTempAvatar(avatarInputUrl.trim());
                        }
                      }}
                      className="px-3 py-2 bg-[#F2F6FC] hover:bg-[#ECF5FF] text-[#2F7BFE] text-xs font-medium rounded border border-[#DCDFE6] hover:border-[#2F7BFE] transition-colors cursor-pointer"
                    >
                      加载预览
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-[#F8FAFC] border-t border-[#EBEEF5] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setTempAvatar('');
                  handleSaveAvatar('');
                }}
                className="text-xs text-[#909399] hover:text-[#F56C6C] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>恢复默认头像</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-[#DCDFE6] text-xs text-[#606266] hover:bg-white bg-[#FAFAFA] transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAvatar(tempAvatar)}
                  className="px-4 py-1.5 rounded bg-[#2F7BFE] hover:bg-[#165DFF] text-xs text-white font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>保存并应用</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast 反馈提示 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#303133] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#67C23A]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
