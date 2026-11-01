import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  Search,
  Filter,
  PlayCircle,
  FileText,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Download,
  Check,
  User,
  Sparkles,
  BarChart3,
  Sliders,
  Settings,
  Plus,
  Trash2,
  X,
  AlertCircle,
  HelpCircle,
  Users,
} from 'lucide-react';

interface ProcessLearningViewProps {
  currentUser?: any;
  onNavigate?: (path: string, flowId?: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export interface CourseItem {
  id: string;
  flowId: string;
  flowCode: string;
  title: string;
  category: string;
  deptName: string;
  duration: string;
  progress: number;
  status: 'completed' | 'in_progress' | 'not_started';
  kcpPoints: number;
  importance: '必修' | '选修' | '进阶';
  targetAudience: string; // 适用对象：如 "全员必修"、"研发部/质控部"、"新员工"
  deadlineDays: number; // 规定完成时限
  summary: string;
  lastStudyTime?: string;
  sections: { title: string; time: string; completed: boolean }[];
}

export const ProcessLearningView: React.FC<ProcessLearningViewProps> = ({
  currentUser,
  onNavigate,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'required' | 'elective' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New course form state inside manage modal
  const [newTitle, setNewTitle] = useState('');
  const [newFlowCode, setNewFlowCode] = useState('IPD-ST-001');
  const [newCategory, setNewCategory] = useState('战略与立项规范');
  const [newImportance, setNewImportance] = useState<'必修' | '选修' | '进阶'>('必修');
  const [newTargetAudience, setNewTargetAudience] = useState('集成产品开发团队与项目总监');
  const [newSummary, setNewSummary] = useState('');

  const [courses, setCourses] = useState<CourseItem[]>([
    {
      id: 'course_101',
      flowId: 'flow_101',
      flowCode: 'IPD-TR-001',
      title: '1.1.2.1 技术评审主流程 (V2版) 业务标准实操',
      category: '研发管理与技术规范',
      deptName: '研发管理部 / 质量控制部',
      duration: '45 分钟',
      progress: 75,
      status: 'in_progress',
      kcpPoints: 2,
      importance: '必修',
      targetAudience: '研发中心全员、质量工程师、系统架构师 (必修)',
      deadlineDays: 30,
      summary: '本课程详细解读IPD技术评审主流程各环节执行要求，重点掌握TRB决议裁决与同行交叉审查KCP要点。',
      lastStudyTime: '2026-03-22 14:30',
      sections: [
        { title: '一、流程背景与适用边界', time: '10分钟', completed: true },
        { title: '二、系统工程师提请材料规范与自查清单', time: '12分钟', completed: true },
        { title: '三、同行交叉审查与KCP-01把关标准', time: '13分钟', completed: true },
        { title: '四、TRB决议裁决会签与缺陷闭环终审', time: '10分钟', completed: false },
      ],
    },
    {
      id: 'course_102',
      flowId: 'flow_leads_002',
      flowCode: 'leads-crm-002',
      title: '3.1.1.1 线索管理流程标准化培育与验真规范',
      category: '市场营销与客户成功',
      deptName: '市场营销部',
      duration: '35 分钟',
      progress: 100,
      status: 'completed',
      kcpPoints: 2,
      importance: '必修',
      targetAudience: '市场营销部、商务部、销售客户经理 (必修)',
      deadlineDays: 15,
      summary: '面向营销专员与销售主管，讲解全渠道线索录入、清洗验真以及商机立项评估的BANT实操模型。',
      lastStudyTime: '2026-03-18 09:15',
      sections: [
        { title: '一、全渠道线索收集与建档规范', time: '8分钟', completed: true },
        { title: '二、线索清洗防刷与真实性复核 (KCP)', time: '12分钟', completed: true },
        { title: '三、商机分派与CRM系统衔接流转', time: '15分钟', completed: true },
      ],
    },
    {
      id: 'course_103',
      flowId: 'flow_cr_009',
      flowCode: 'CR-009',
      title: '6.3.5.1 需求变更申请 (CCB红线审批) 规范培训',
      category: '工程变更与技术合规',
      deptName: '需求工程部',
      duration: '50 分钟',
      progress: 0,
      status: 'not_started',
      kcpPoints: 2,
      importance: '必修',
      targetAudience: '需求分析师、系统工程师、项目总监 (全员必修)',
      deadlineDays: 45,
      summary: '掌握研发过程中工程变更与商业诉求变更的评估准则，避免技术债务与无序返工。',
      sections: [
        { title: '一、需求变更的分级分类与发起门槛', time: '10分钟', completed: false },
        { title: '二、影响面架构评估与交付工期预算核算', time: '20分钟', completed: false },
        { title: '三、变更控制委员会 (CCB) 终审批件签署', time: '20分钟', completed: false },
      ],
    },
    {
      id: 'course_104',
      flowId: 'flow_zs_001',
      flowCode: 'RD-REQ-008',
      title: '6.2.1.3 产品架构规格评审流程实操指南',
      category: '系统架构与工程规范',
      deptName: '研发管理中心',
      duration: '30 分钟',
      progress: 100,
      status: 'completed',
      kcpPoints: 2,
      importance: '选修',
      targetAudience: '初中级研发工程师、实习架构师 (自主选修)',
      deadlineDays: 60,
      summary: '明确软硬件架构边界，建立跨模块接口依赖与可测试性核查标准。',
      lastStudyTime: '2026-02-28 16:40',
      sections: [
        { title: '一、架构基线说明书编制要点', time: '12分钟', completed: true },
        { title: '二、同行专家评审与争议项裁决', time: '18分钟', completed: true },
      ],
    },
    {
      id: 'course_105',
      flowId: 'flow_105',
      flowCode: 'IC-DEV-001',
      title: '6.4.1.1 芯片物理实现与流片投产红线培训',
      category: '集成电路制造合规',
      deptName: '集成电路设计院',
      duration: '60 分钟',
      progress: 20,
      status: 'in_progress',
      kcpPoints: 3,
      importance: '进阶',
      targetAudience: '芯片物理设计团队、Tape-out流片责任人 (进阶选修)',
      deadlineDays: 60,
      summary: '学习流片一次成功率控制要点，深入掌握DRC/LVS/STA验证与Sign-off签署流程。',
      lastStudyTime: '2026-03-20 11:20',
      sections: [
        { title: '一、布局布线与门级网表核查', time: '15分钟', completed: true },
        { title: '二、物理规则检查 (DRC/LVS) 零违规合规', time: '25分钟', completed: false },
        { title: '三、流片投产包 Tape-out 签署下发', time: '20分钟', completed: false },
      ],
    },
  ]);

  const filteredCourses = courses.filter((c) => {
    if (activeTab === 'required' && c.importance !== '必修') return false;
    if (activeTab === 'elective' && c.importance !== '选修' && c.importance !== '进阶') return false;
    if (activeTab === 'completed' && c.status !== 'completed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.flowCode.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: courses.length,
    completed: courses.filter((c) => c.status === 'completed').length,
    inProgress: courses.filter((c) => c.status === 'in_progress').length,
    requiredCount: courses.filter((c) => c.importance === '必修').length,
    requiredPending: courses.filter((c) => c.importance === '必修' && c.status !== 'completed').length,
    electiveCount: courses.filter((c) => c.importance !== '必修').length,
  };

  // Switch course importance (必修 vs 选修 vs 进阶)
  const handleChangeImportance = (courseId: string, newType: '必修' | '选修' | '进阶') => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, importance: newType } : c))
    );
    if (selectedCourse?.id === courseId) {
      setSelectedCourse((prev) => (prev ? { ...prev, importance: newType } : null));
    }
    showToast(`已成功将该课程设置为【${newType}】属性`, 'success');
  };

  // Update target audience
  const handleChangeAudience = (courseId: string, newAudience: string) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, targetAudience: newAudience } : c))
    );
    if (selectedCourse?.id === courseId) {
      setSelectedCourse((prev) => (prev ? { ...prev, targetAudience: newAudience } : null));
    }
    showToast('已更新适用受众与学习部门范围', 'success');
  };

  const handleStudySection = (courseId: string, sectionIdx: number) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const newSections = [...c.sections];
        newSections[sectionIdx] = { ...newSections[sectionIdx], completed: true };
        const completedCount = newSections.filter((s) => s.completed).length;
        const newProgress = Math.round((completedCount / newSections.length) * 100);
        const newStatus = newProgress === 100 ? 'completed' : 'in_progress';
        return {
          ...c,
          sections: newSections,
          progress: newProgress,
          status: newStatus,
          lastStudyTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
        };
      })
    );
    showToast('该小节学习已完成打卡，进度已更新！', 'success');
  };

  // Add course
  const handleAddNewCourse = () => {
    if (!newTitle.trim()) {
      showToast('请输入课程名称', 'warning');
      return;
    }
    const newCourse: CourseItem = {
      id: 'course_' + Date.now().toString(36),
      flowId: 'flow_new_' + Date.now().toString(36),
      flowCode: newFlowCode || 'FLOW-STD',
      title: newTitle.trim(),
      category: newCategory || '企业标准规范',
      deptName: '流程管理部',
      duration: '30 分钟',
      progress: 0,
      status: 'not_started',
      kcpPoints: 1,
      importance: newImportance,
      targetAudience: newTargetAudience || (newImportance === '必修' ? '相关业务部门必修' : '全员选修'),
      deadlineDays: 30,
      summary: newSummary.trim() || '本课程针对最新发布的业务流程进行操作宣导与实操答疑。',
      sections: [
        { title: '一、流程标准与节点职责解读', time: '10分钟', completed: false },
        { title: '二、关键控制点 (KCP) 把关标准', time: '12分钟', completed: false },
        { title: '三、实操演练与遵从考核', time: '8分钟', completed: false },
      ],
    };
    setCourses((prev) => [newCourse, ...prev]);
    setShowAddForm(false);
    setNewTitle('');
    setNewSummary('');
    showToast(`已成功添加新流程培训课程【${newCourse.title}】并设置为【${newImportance}】`, 'success');
  };

  return (
    <div className="h-full flex flex-col bg-[#f8fafc] text-xs">
      {/* Top Banner */}
      <div className="bg-white border-b border-[#ebeef5] px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2f54eb] to-[#597ef7] text-white flex items-center justify-center shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#1f2733]">业务流程在线培训中心</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f0f5ff] text-[#2f54eb] border border-[#adc6ff]">
                  企业全员学习 / 流程标准宣贯
                </span>
              </div>
              <p className="text-[#909399] text-xs mt-0.5">
                当前学员：{currentUser?.userName || '系统员工'} · 归属：{currentUser?.deptName || '研发中心'} · 确保理解各业务流程流转规则与控制点 (KCP)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[11px] text-[#909399]">全员掌握达标率</div>
              <div className="text-lg font-bold font-mono text-[#2f54eb]">
                {Math.round((stats.completed / (stats.total || 1)) * 100)}%
              </div>
            </div>
            <div className="h-8 w-px bg-[#ebeef5]" />
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-[#f6ffed] border border-[#b7eb8f] text-center">
                <div className="text-[10px] text-[#389e0d]">已完成课程</div>
                <div className="font-bold text-sm text-[#389e0d] font-mono">{stats.completed} 门</div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#fff1f0] border border-[#ffa39e] text-center">
                <div className="text-[10px] text-[#cf1322]">待学必修</div>
                <div className="font-bold text-sm text-[#cf1322] font-mono">{stats.requiredPending} 门</div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#f0f5ff] border border-[#adc6ff] text-center">
                <div className="text-[10px] text-[#2f54eb]">选修/进阶</div>
                <div className="font-bold text-sm text-[#2f54eb] font-mono">{stats.electiveCount} 门</div>
              </div>
            </div>

            {/* Config & Manage Button */}
            <button
              type="button"
              onClick={() => setManageModalOpen(true)}
              className="h-8 px-3.5 rounded-lg border border-[#adc6ff] bg-[#f0f5ff] hover:bg-[#2f54eb] text-[#2f54eb] hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              title="设置每门课程的必修/选修属性与学习对象范围"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>设置必修/选修与课程</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 p-5 gap-5 overflow-hidden">
        {/* Left: Course List */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-[#ebeef5] shadow-2xs overflow-hidden">
          {/* List Toolbar */}
          <div className="px-5 py-3 border-b border-[#ebeef5] flex items-center justify-between gap-3 shrink-0 bg-[#fafafa]">
            <div className="flex items-center gap-1 bg-[#f4f4f5] p-1 rounded-lg border border-[#e4e7ed]">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === 'all' ? 'bg-white text-[#2f54eb] shadow-xs' : 'text-[#606266] hover:text-[#1f2733]'
                }`}
              >
                全部流程课程 ({courses.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('required')}
                className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === 'required' ? 'bg-white text-[#f5222d] shadow-xs' : 'text-[#606266] hover:text-[#1f2733]'
                }`}
              >
                必修课程 ({stats.requiredCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('elective')}
                className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === 'elective' ? 'bg-white text-[#2f54eb] shadow-xs' : 'text-[#606266] hover:text-[#1f2733]'
                }`}
              >
                选修/进阶 ({stats.electiveCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === 'completed' ? 'bg-white text-[#52c41a] shadow-xs' : 'text-[#606266] hover:text-[#1f2733]'
                }`}
              >
                已掌握达标 ({stats.completed})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-60">
                <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索课程名称/编号/业务分类..."
                  className="h-8 pl-8 pr-3 text-xs border border-[#dcdfe6] rounded-lg w-full focus:border-[#2f54eb] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Cards List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredCourses.length === 0 ? (
              <div className="py-16 text-center text-[#909399]">暂无符合筛选条件的培训课程</div>
            ) : (
              filteredCourses.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCourse(c)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    selectedCourse?.id === c.id
                      ? 'border-[#597ef7] bg-[#f0f5ff]/40 shadow-sm'
                      : 'border-[#ebeef5] hover:border-[#adc6ff] bg-white hover:bg-[#fafafa]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                            c.importance === '必修'
                              ? 'bg-[#fff1f0] text-[#f5222d] border border-[#ffa39e]'
                              : c.importance === '进阶'
                              ? 'bg-[#f9f0ff] text-[#722ed1] border border-[#d3adf7]'
                              : 'bg-[#f4f4f5] text-[#595959] border border-[#dcdfe6]'
                          }`}
                        >
                          {c.importance}
                        </span>
                        <span className="font-mono-tabular font-bold text-xs text-[#595959]">{c.flowCode}</span>
                        <h3 className="font-bold text-sm text-[#1f2733] truncate">{c.title}</h3>
                      </div>
                      <p className="text-xs text-[#595959] leading-relaxed line-clamp-2">{c.summary}</p>
                      <div className="flex items-center gap-4 text-[11px] text-[#909399] pt-1 flex-wrap">
                        <span className="text-[#1f2733] font-medium flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#2f54eb]" />
                          <span>受众：{c.targetAudience}</span>
                        </span>
                        <span>时长：{c.duration}</span>
                        <span>控制点：{c.kcpPoints} 个KCP把关项</span>
                        {c.lastStudyTime && <span>上次学习：{c.lastStudyTime}</span>}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-[#2f54eb]">{c.progress}%</div>
                        <div className="text-[10px] text-[#909399]">
                          {c.status === 'completed'
                            ? '已考核通过'
                            : c.status === 'in_progress'
                            ? '学习中'
                            : '未开始'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCourse(c);
                        }}
                        className="h-7 px-3 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>{c.progress === 100 ? '复习回顾' : '继续学习'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="w-full bg-[#f0f0f0] rounded-full h-1.5 mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        c.progress === 100 ? 'bg-[#52c41a]' : 'bg-[#2f54eb]'
                      }`}
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Course Detail & Interactive Study Pane */}
        <div className="w-96 flex flex-col bg-white rounded-xl border border-[#ebeef5] shadow-2xs overflow-hidden shrink-0">
          {selectedCourse ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b border-[#ebeef5] bg-[#fafafa]">
                <div className="flex items-center justify-between text-xs text-[#909399] mb-1">
                  <span>课程详情与考学进度</span>
                  <span className="font-mono">{selectedCourse.flowCode}</span>
                </div>
                <h2 className="font-bold text-sm text-[#1f2733] leading-snug">{selectedCourse.title}</h2>

                {/* Inline Quick Config Bar: 必修/选修快速切换 */}
                <div className="mt-3 p-2.5 rounded-lg bg-white border border-[#dcdfe6] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1f2733] flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-[#2f54eb]" />
                      <span>课程属性设置：</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {(['必修', '选修', '进阶'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleChangeImportance(selectedCourse.id, type)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                            selectedCourse.importance === type
                              ? type === '必修'
                                ? 'bg-[#f5222d] text-white shadow-xs'
                                : type === '选修'
                                ? 'bg-[#595959] text-white shadow-xs'
                                : 'bg-[#722ed1] text-white shadow-xs'
                              : 'bg-[#f4f4f5] text-[#606266] hover:bg-[#e4e7ed]'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10.5px] text-[#595959] flex items-center justify-between">
                    <span>受众范围：</span>
                    <span className="text-[#2f54eb] font-medium truncate max-w-[190px]" title={selectedCourse.targetAudience}>
                      {selectedCourse.targetAudience}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate('/property/overview', selectedCourse.flowId);
                        showToast(`已直接穿透至流程资产看板查看【${selectedCourse.title}】拓扑图`, 'info');
                      }
                    }}
                    className="h-7 px-2.5 rounded border border-[#adc6ff] bg-[#f0f5ff] hover:bg-[#2f54eb] text-[#2f54eb] hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors w-full justify-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>穿透查看流程图与要素</span>
                  </button>
                </div>
              </div>

              {/* Sections Checklist */}
              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                <div className="text-xs font-bold text-[#1f2733] flex items-center justify-between">
                  <span>培训学习大纲 ({selectedCourse.sections.length} 节)</span>
                  <span className="text-[11px] text-[#52c41a] font-medium font-mono">
                    已完成 {selectedCourse.sections.filter((s) => s.completed).length} / {selectedCourse.sections.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedCourse.sections.map((sec, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                        sec.completed
                          ? 'border-[#b7eb8f] bg-[#f6ffed]/40 text-[#135200]'
                          : 'border-[#dcdfe6] bg-white text-[#303133]'
                      }`}
                    >
                      <div className="space-y-0.5 flex-1 pr-2">
                        <div className="font-semibold flex items-center gap-1.5">
                          {sec.completed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#52c41a]" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-[#dcdfe6] inline-block" />
                          )}
                          <span>{sec.title}</span>
                        </div>
                        <div className="text-[10px] text-[#909399] pl-5">预计耗时：{sec.time}</div>
                      </div>

                      {sec.completed ? (
                        <span className="text-[11px] text-[#52c41a] font-semibold shrink-0">已学完</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStudySection(selectedCourse.id, idx)}
                          className="h-6 px-2.5 rounded bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-[11px] font-semibold cursor-pointer shrink-0"
                        >
                          打卡学习
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* SOP & Attachments */}
                <div className="pt-3 border-t border-[#ebeef5]">
                  <div className="text-xs font-bold text-[#1f2733] mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#409eff]" />
                    <span>配套标准作业指引 (SOP) 与手册</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2 rounded bg-[#f4f4f5] text-xs flex items-center justify-between text-[#606266]">
                      <span className="truncate">《标准作业指导书 (SOP-2026).pdf》</span>
                      <Download
                        className="w-3.5 h-3.5 text-[#409eff] cursor-pointer"
                        onClick={() => showToast('已下载配套SOP作业指引文件', 'success')}
                      />
                    </div>
                    <div className="p-2 rounded bg-[#f4f4f5] text-xs flex items-center justify-between text-[#606266]">
                      <span className="truncate">《关键控制点(KCP)避坑指南.pdf》</span>
                      <Download
                        className="w-3.5 h-3.5 text-[#409eff] cursor-pointer"
                        onClick={() => showToast('已下载KCP避坑指南手册', 'success')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Confirmation */}
              <div className="p-3 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between">
                <span className="text-[11px] text-[#909399]">理解并执行遵从承诺</span>
                <button
                  type="button"
                  onClick={() => {
                    setCourses((prev) =>
                      prev.map((c) =>
                        c.id === selectedCourse.id
                          ? {
                              ...c,
                              progress: 100,
                              status: 'completed',
                              sections: c.sections.map((s) => ({ ...s, completed: true })),
                            }
                          : c
                      )
                    );
                    setSelectedCourse((prev: any) =>
                      prev
                        ? {
                            ...prev,
                            progress: 100,
                            status: 'completed',
                            sections: prev.sections.map((s: any) => ({ ...s, completed: true })),
                          }
                        : null
                    );
                    showToast(`恭喜！您已完成【${selectedCourse.title}】全流程培训并通过达标确认`, 'success');
                  }}
                  className="h-7 px-3 rounded-lg bg-[#52c41a] hover:bg-[#389e0d] text-white text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  签署掌握确认
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#909399] space-y-2">
              <BookOpen className="w-10 h-10 text-[#dcdfe6]" />
              <div className="font-semibold text-xs text-[#606266]">请在左侧选择一门流程课程</div>
              <p className="text-[11px] leading-relaxed">
                查看流程细则学习大纲、配套 SOP 规范指引、以及设置必修/选修属性。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Global Course Management & Requirement Setting Modal */}
      {manageModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl border border-[#ebeef5] overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#2f54eb] text-white flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1f2733]">流程培训课程管理与必修/选修设置</h2>
                  <p className="text-[11px] text-[#909399]">
                    流程管理员可在此统一调整每门课程的修读属性、指定必修部门/岗位范围及达标考核时限
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManageModalOpen(false)}
                className="w-7 h-7 rounded hover:bg-[#ebeef5] flex items-center justify-center text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Action Bar */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-[#606266]">
                  当前已收录 <span className="font-bold text-[#2f54eb] font-mono">{courses.length}</span> 门流程课程（必修 {stats.requiredCount} 门，选修 {stats.electiveCount} 门）
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="h-7 px-3 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddForm ? '收起新增表单' : '新增流程培训课程'}</span>
                </button>
              </div>

              {/* Collapsible Add New Course Form */}
              {showAddForm && (
                <div className="p-4 rounded-xl border border-[#adc6ff] bg-[#f0f5ff]/30 space-y-3">
                  <div className="font-bold text-xs text-[#1d39c4] flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span>录入新流程培训课程</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-[#606266] block mb-1">课程标题 *</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="例如：1.1.1.1 IPMT立项决策规范实操培训"
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg bg-white text-xs focus:border-[#2f54eb] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#606266] block mb-1">关联流程编号</label>
                      <input
                        type="text"
                        value={newFlowCode}
                        onChange={(e) => setNewFlowCode(e.target.value)}
                        placeholder="例如：IPD-ST-001"
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg bg-white text-xs focus:border-[#2f54eb] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#606266] block mb-1">修读属性 (必修 / 选修) *</label>
                      <select
                        value={newImportance}
                        onChange={(e) => setNewImportance(e.target.value as any)}
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg bg-white text-xs focus:border-[#2f54eb] focus:outline-hidden cursor-pointer"
                      >
                        <option value="必修">必修 (全员或指定部门必达标)</option>
                        <option value="选修">选修 (员工自主选修)</option>
                        <option value="进阶">进阶 (专业岗位进阶深化)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-[#606266] block mb-1">适用受众与部门范围</label>
                      <input
                        type="text"
                        value={newTargetAudience}
                        onChange={(e) => setNewTargetAudience(e.target.value)}
                        placeholder="例如：市场部全员 / 研发架构师 / 全员必修"
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg bg-white text-xs focus:border-[#2f54eb] focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#606266] block mb-1">课程要点与培训简介</label>
                    <textarea
                      value={newSummary}
                      onChange={(e) => setNewSummary(e.target.value)}
                      placeholder="简述该流程学习的关键环节与重点规避风险..."
                      rows={2}
                      className="w-full p-2 border border-[#dcdfe6] rounded-lg bg-white text-xs focus:border-[#2f54eb] focus:outline-hidden resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="h-7 px-3 rounded border border-[#dcdfe6] bg-white text-xs text-[#606266] hover:bg-[#f5f7fa] cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewCourse}
                      className="h-7 px-4 rounded bg-[#2f54eb] text-white text-xs font-semibold hover:bg-[#1d39c4] cursor-pointer"
                    >
                      确认添加
                    </button>
                  </div>
                </div>
              )}

              {/* Table of all courses with instant selector */}
              <div className="border border-[#ebeef5] rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#fafafa] text-[#606266] border-b border-[#ebeef5]">
                    <tr>
                      <th className="py-2.5 px-3 w-16">序号</th>
                      <th className="py-2.5 px-3">流程编号与课程名称</th>
                      <th className="py-2.5 px-3 w-32">业务归口</th>
                      <th className="py-2.5 px-3 w-36">
                        <span className="text-[#2f54eb] font-bold">修读属性 (直接切换)</span>
                      </th>
                      <th className="py-2.5 px-3 w-48">适用对象与受众范围</th>
                      <th className="py-2.5 px-3 w-20 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebeef5]">
                    {courses.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-[#f9fafc]">
                        <td className="py-2.5 px-3 font-mono text-[#909399]">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#1f2733]">{c.title}</div>
                          <div className="text-[11px] text-[#909399] font-mono mt-0.5">{c.flowCode}</div>
                        </td>
                        <td className="py-2.5 px-3 text-[#606266]">{c.deptName}</td>
                        <td className="py-2.5 px-3">
                          {/* Dropdown to instantly change importance */}
                          <select
                            value={c.importance}
                            onChange={(e) => handleChangeImportance(c.id, e.target.value as any)}
                            className={`h-7 px-2 text-xs font-bold rounded border cursor-pointer ${
                              c.importance === '必修'
                                ? 'bg-[#fff1f0] text-[#f5222d] border-[#ffa39e]'
                                : c.importance === '选修'
                                ? 'bg-[#f4f4f5] text-[#595959] border-[#dcdfe6]'
                                : 'bg-[#f9f0ff] text-[#722ed1] border-[#d3adf7]'
                            }`}
                          >
                            <option value="必修">必修 (全员/部门)</option>
                            <option value="选修">选修 (自主选修)</option>
                            <option value="进阶">进阶 (专业深造)</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={c.targetAudience}
                            onChange={(e) => handleChangeAudience(c.id, e.target.value)}
                            className="w-full h-7 px-2 text-xs border border-transparent hover:border-[#dcdfe6] focus:border-[#2f54eb] rounded bg-transparent focus:bg-white focus:outline-hidden"
                            title="点击可直接编辑修改适用受众"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setCourses((prev) => prev.filter((item) => item.id !== c.id));
                              showToast(`已移除课程【${c.title}】`, 'info');
                            }}
                            className="text-[#f56c6c] hover:text-[#cf1322] text-xs cursor-pointer inline-flex items-center gap-1"
                            title="删除该课程"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-[#909399]">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>提示：修改后即刻生效，学员在培训看板中的必修统计与待办任务将联动更新。</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setManageModalOpen(false);
                  showToast('流程培训设置已保存生效！', 'success');
                }}
                className="h-8 px-5 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-xs font-semibold cursor-pointer shadow-2xs"
              >
                保存并完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
