import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ChevronDown,
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
  CheckSquare,
  Square,
  Edit3,
  Eye,
  RefreshCw,
  FileCheck,
  AlertTriangle,
  Briefcase,
  Layers,
  Send,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';

import { DrawioBridge } from '../utils/drawioBridge';

function FrozenTrainingFlow({xml}:{xml:string}) {
  const frame=useRef<HTMLIFrameElement>(null);
  useEffect(()=>{const bridge=new DrawioBridge({onReady:()=>bridge.loadXml(xml,'课程绑定流程版本')});bridge.attachIframe(frame.current);return ()=>bridge.destroy();},[xml]);
  return <iframe ref={frame} title="课程绑定版本流程图" src="/drawio/index.html?embed=1&proto=json&ui=min&lang=zh&dflowReadOnly=1&modified=0" className="w-full h-[440px] border rounded"/>;
}

interface ProcessLearningViewProps {
  currentUser?: any;
  onNavigate?: (path: string, flowId?: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

// 岗位专项操作指引
export interface RolePlaybook {
  roleName: string; // 岗位/角色名称，如 '系统工程师'
  roleBadge?: string; // 角色类别：申请人 / 审查人 / 批准人
  roleDesc: string; // 职责定位
  nodes: string[]; // 负责节点名称/编号
  inputs: string[]; // 输入材料要求
  actions: string[]; // 具体操作动作清单
  outputs: string[]; // 输出交付物
  handoverTo: string; // 交接对象
  goodSample: { title: string; desc: string; preview: string }; // 合格样例
  badSample: { title: string; desc: string; warning: string }; // 缺陷/不合格样例
  kcpCheckpoints: string[]; // 必过控制点
}

// 练习与考核题目
export interface PracticeQuestion {
  id: string;
  type: 'scenario' | 'choice' | 'judge';
  question: string;
  scenarioContext?: string; // 情景背景
  options: string[];
  correctIndex: number;
  explanation: string; // 深度答案解析
  relatedNode: string; // 关联流程节点
  relatedDocClause: string; // 关联制度条款
}

// 学员学情与掌握记录
export interface StudentRecord {
  id: string;
  userId?: string;
  evidence?: string;
  name: string;
  empNo: string;
  deptName: string;
  positionName: string;
  readStatus: 'read' | 'unread'; // 已阅读
  examStatus: 'passed' | 'failed' | 'untested'; // 考核状态
  score?: number;
  practiceConfirmed: boolean; // 实操确认
  confirmedBy?: string; // 确认人
  weakPoints: string[]; // 薄弱知识点
  lastStudyTime: string;
}

export interface CourseItem {
  id: string;
  revision?: number;
  canReview?: boolean;
  myRecord?: any;
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
  targetAudience: string; // 展示文本
  targetDepts: string[]; // 结构化部门
  targetPositions: string[]; // 结构化岗位
  targetRoles: string[]; // 结构化流程角色
  deadlineDays: number; // 规定完成时限
  summary: string;
  lastStudyTime?: string;

  // 1. 绑定的已批准流程版本
  approvedVersion: {
    versionNo: string;
    approvedAt: string;
    approver: string;
    changeSummary: string;
    docRef: string;
    xml?: string;
  };

  // 2. 学习目标 (3-5条能力要求)
  learningObjectives: string[];

  // 3. 章节大纲
  sections: { id: string; title: string; time: string; completed: boolean; type?: string; content?: string }[];

  // 4. “我的岗位怎么做”岗位操作指引矩阵
  rolePlaybooks: RolePlaybook[];

  // 5. 练习与考核设置
  passingScore: number;
  questions: PracticeQuestion[];
  practicalTask?: {
    taskName: string;
    requirement: string;
    reviewer: string;
  };

  // 6. 学员学习与达标记录
  records: StudentRecord[];
}

export const ProcessLearningView: React.FC<ProcessLearningViewProps> = ({
  currentUser,
  onNavigate,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'required' | 'elective' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

  // 学习工作台模式：null 表示主列表视图，'courseId' 表示全屏沉浸式学员工作台
  const [learningStudioCourseId, setLearningStudioCourseId] = useState<string | null>(null);
  // 学习工作台内的4步流程：1: 流程原文与目标, 2: 我的岗位怎么做, 3: 案例情景练习, 4: 考核验证与实操确认
  const [learnerStep, setLearnerStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedLearnerRoleIdx, setSelectedLearnerRoleIdx] = useState<number>(0);

  // 练习题学员答题状态: questionId -> selectedIndex
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, number>>({});
  // 考核答卷状态
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [examScore, setExamScore] = useState<number | null>(null);

  // 管理弹窗状态
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // 课程深度配置弹窗（4个页签）
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [configModalTab, setConfigModalTab] = useState<'basic' | 'content' | 'assessment' | 'records'>('basic');
  const [activePlaybookTabIdx, setActivePlaybookTabIdx] = useState(0);

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [options, setOptions] = useState<{depts:string[];positions:string[];roles:string[];users:{id:string;name:string}[];flows:{id:string;label:string;versionNo:string}[]}>({depts:[],positions:[],roles:[],users:[],flows:[]});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reading, setReading] = useState<{courseId:string;sectionId:string}|null>(null);
  const [evidence, setEvidence] = useState('');
  const availableDepts=options.depts, availablePositions=options.positions, availableRoles=options.roles;
  async function trainingRequest(path:string, method='GET', body?:any) {
    const response=await fetch(path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
    const result=await response.json();
    if(!response.ok||result.status!==1)throw new Error(result.info||'操作失败');
    return result.data;
  }
  async function loadCourses() {
    try {const data=await trainingRequest('/api/training/courses');setCourses(data.courses);setCanManage(data.canManage);setOptions(data.options);setLoadError('');}
    catch(e:any){setLoadError(e.message);showToast(e.message,'error');}finally{setLoading(false);}
  }
  useEffect(()=>{void loadCourses();},[currentUser?.id]);
  function acceptCourse(course:CourseItem) {setCourses(prev=>prev.map(c=>c.id===course.id?course:c));setSelectedCourse(prev=>prev?.id===course.id?course:prev);}
  async function saveCourse(course:CourseItem) {
    if(saving)return;
    setSaving(true);
    try {const saved=await trainingRequest(`/api/training/courses/${course.id}`,'PUT',course);acceptCourse(saved);return saved;}
    catch(e:any){showToast(e.message,'error');}finally{setSaving(false);}
  }
  async function removeCourse(course:CourseItem) {
    try {await trainingRequest(`/api/training/courses/${course.id}`,'DELETE');setCourses(prev=>prev.filter(c=>c.id!==course.id));if(selectedCourse?.id===course.id)setSelectedCourse(null);showToast('课程已归档，学习记录保留','success');}catch(e:any){showToast(e.message,'error');}
  }
  async function confirmRecord(course:CourseItem,userId:string) {
    try {const saved=await trainingRequest(`/api/training/courses/${course.id}/records/${userId}/confirm`,'POST',{revision:course.revision});acceptCourse(saved);setEditingCourse(saved);showToast('实操复核已记录','success');}catch(e:any){showToast(e.message,'error');}
  }
  async function completeSection(course:CourseItem,sectionId:string) {
    try {acceptCourse(await trainingRequest(`/api/training/courses/${course.id}/sections/${sectionId}/complete`,'POST',{revision:course.revision}));setReading(null);showToast('章节学习记录已保存','success');}catch(e:any){showToast(e.message,'error');}
  }

  // 新增课程暂存状态
  const [newCourseForm, setNewCourseForm] = useState<{
    title: string;
    flowCode: string;
    category: string;
    importance: '必修' | '选修' | '进阶';
    targetDepts: string[];
    targetPositions: string[];
    targetRoles: string[];
    deadlineDays: number;
    summary: string;
  }>({
    title: '',
    flowCode: '',
    category: '战略与立项规范',
    importance: '必修',
    targetDepts: [],
    targetPositions: [],
    targetRoles: [],
    deadlineDays: 30,
    summary: '',
  });

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

  const handleChangeImportance = async (courseId:string, importance:'必修'|'选修'|'进阶') => {
    const course=courses.find(c=>c.id===courseId);if(course&&await saveCourse({...course,importance}))showToast('课程属性已保存','success');
  };
  const handleChangeAudience = (courseId:string,targetAudience:string) => {
    setCourses(prev=>prev.map(c=>c.id===courseId?{...c,targetAudience}:c));
  };
  const handleStudySection=(courseId:string,index:number)=>{
    const course=courses.find(c=>c.id===courseId);if(course)setReading({courseId,sectionId:course.sections[index].id});
  };

  // 打开深度课程配置弹窗
  const handleOpenConfigModal = (course: CourseItem) => {
    setEditingCourse(JSON.parse(JSON.stringify(course)));
    setConfigModalTab(canManage?'basic':'records');
    setActivePlaybookTabIdx(0);
  };

  // 保存深度课程配置
  const handleSaveCourseConfig = async () => {
    if (!editingCourse) return;
    if (!editingCourse.title.trim()) {
      showToast('请输入课程名称', 'warning');
      return;
    }
    // 自动重组 targetAudience 文本
    const combinedAudience = [
      editingCourse.targetDepts.length > 0 ? `部门: ${editingCourse.targetDepts.join('/')}` : '',
      editingCourse.targetPositions.length > 0 ? `岗位: ${editingCourse.targetPositions.join('/')}` : '',
      editingCourse.targetRoles.length > 0 ? `角色: ${editingCourse.targetRoles.join('/')}` : '',
    ]
      .filter(Boolean)
      .join(' · ') || (editingCourse.importance === '必修' ? '全员必修' : '全员选修');

    const updated = {
      ...editingCourse,
      targetAudience: combinedAudience,
    };

    if(!await saveCourse(updated))return;
    setEditingCourse(null);
    showToast(`课程【${updated.title}】的4大模块配置已保存生效！`, 'success');
  };

  const handleConfirmAddNewCourse = async () => {
    if(!newCourseForm.title.trim()||!newCourseForm.flowCode){showToast('请输入课程名称并选择已发布流程','warning');return;}
    if(saving)return;setSaving(true);
    try {
      const saved=await trainingRequest('/api/training/courses','POST',{
        ...newCourseForm,flowId:newCourseForm.flowCode,deptName:currentUser?.deptName||'',duration:'',targetAudience:'',
        learningObjectives:[],sections:[{id:crypto.randomUUID(),title:'课程内容',time:'',type:'流程原文',content:''}],rolePlaybooks:[],questions:[],passingScore:80
      });
      setCourses(prev=>[saved,...prev]);setShowAddForm(false);setEditingCourse(saved);setConfigModalTab('content');setNewCourseForm(prev=>({...prev,title:'',summary:''}));
      showToast('课程已创建，请编写章节正文和考核内容','success');
    }catch(e:any){showToast(e.message,'error');}finally{setSaving(false);}
  };

  // 进入沉浸式“4步学习工作台”
  const handleEnterLearningStudio = (course: CourseItem) => {
    setSelectedCourse(course);
    setLearningStudioCourseId(course.id);
    setLearnerStep(1);
    setSelectedLearnerRoleIdx(0);
    setPracticeAnswers({});
    setExamSubmitted(false);
    setExamAnswers({});
    setExamScore(course.myRecord?.score??null);
    setEvidence(course.myRecord?.evidence||'');
  };

  // 提交情景练习答案
  const handleSelectPracticeAnswer = (qId: string, optionIdx: number) => {
    setPracticeAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmitExam = async (course:CourseItem) => {
    if(saving)return;setSaving(true);
    try {const result=await trainingRequest(`/api/training/courses/${course.id}/exam`,'POST',{answers:examAnswers,revision:course.revision});acceptCourse(result.course);setExamScore(result.score);setExamSubmitted(true);showToast(result.passed?'考核已通过，实操课程仍需提交并复核':'考核未通过，请复习薄弱知识点后重试',result.passed?'success':'warning');}
    catch(e:any){showToast(e.message,'error');}finally{setSaving(false);}
  };
  const handleConfirmPractical = async (courseId:string) => {
    try {acceptCourse(await trainingRequest(`/api/training/courses/${courseId}/practical`,'POST',{evidence,revision:courses.find(c=>c.id===courseId)?.revision}));showToast('实操说明已提交，请等待指定复核人确认','success');}catch(e:any){showToast(e.message,'error');}
  };

  const currentStudioCourse = courses.find((c) => c.id === learningStudioCourseId) || courses[0];

  return (
    <div className="h-full flex flex-col bg-[#f8fafc] text-xs">{loading&&<p className="p-4">正在加载课程…</p>}{loadError&&<div className="p-4 text-red-600">{loadError}<button onClick={()=>void loadCourses()}>重新加载</button></div>}{reading&&(()=>{const c=courses.find(c=>c.id===reading.courseId),sec=c?.sections.find(s=>s.id===reading.sectionId);return c&&sec?<div role="dialog" aria-label="章节阅读" className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-8"><div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto space-y-4"><h2 className="text-lg font-bold">{sec.title}</h2><div className="whitespace-pre-wrap text-sm leading-8">{sec.content||'本章节尚未编写内容，请联系课程负责人。'}</div><div className="flex gap-3 justify-end"><button onClick={()=>setReading(null)}>关闭</button><button disabled={!sec.content?.trim()} onClick={()=>void completeSection(c,sec.id)} className="bg-blue-600 disabled:opacity-40 text-white px-4 py-2 rounded">已阅读，记录学习完成</button></div></div></div>:null;})()}
      {/* ========================================================================= */}
      {/* 沉浸式 4 步学员工作台模式 (Active when learningStudioCourseId != null) */}
      {/* ========================================================================= */}
      {learningStudioCourseId && currentStudioCourse ? (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {/* Top Bar for Learning Studio */}
          <div className="h-14 border-b border-[#e4e7ed] bg-[#fafafa] px-6 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLearningStudioCourseId(null)}
                className="h-8 px-2.5 rounded-lg border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-[#606266] text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>返回课程中心</span>
              </button>
              <div className="h-4 w-px bg-[#dcdfe6]" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#2f54eb]">{currentStudioCourse.flowCode}</span>
                  <h1 className="text-sm font-bold text-[#1f2733] truncate max-w-md">{currentStudioCourse.title}</h1>
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#fff1f0] text-[#f5222d] border border-[#ffa39e]">
                    {currentStudioCourse.importance}
                  </span>
                </div>
                <div className="text-[11px] text-[#909399] flex items-center gap-3 mt-0.5">
                  <span>版本: {currentStudioCourse.approvedVersion?.versionNo || '未绑定'}</span>
                  <span>·</span>
                  <span>批准人: {currentStudioCourse.approvedVersion?.approver || '未记录'}</span>
                  <span>·</span>
                  <span>学时要求: {currentStudioCourse.duration}</span>
                </div>
              </div>
            </div>

            {/* 4-Step Progress Stepper */}
            <div className="flex items-center gap-2">
              {[
                { step: 1, title: '① 流程原文与目标', desc: '懂全局' },
                { step: 2, title: '② 我的岗位怎么做', desc: '知职责' },
                { step: 3, title: '③ 案例练习与判断', desc: '练情景' },
                { step: 4, title: '④ 考核验证与实操', desc: '过达标' },
              ].map((item) => {
                const isActive = learnerStep === item.step;
                const isPassed = learnerStep > item.step || (item.step === 4 && currentStudioCourse.status === 'completed');
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setLearnerStep(item.step as any)}
                    className={`h-9 px-3 rounded-lg border flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#2f54eb] bg-[#f0f5ff] text-[#2f54eb] font-bold shadow-xs'
                        : isPassed
                        ? 'border-[#b7eb8f] bg-[#f6ffed] text-[#389e0d]'
                        : 'border-[#ebeef5] bg-white text-[#909399] hover:border-[#dcdfe6]'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#52c41a]" />
                    ) : (
                      <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                        isActive ? 'bg-[#2f54eb] text-white' : 'bg-[#f0f0f0] text-[#909399]'
                      }`}>
                        {item.step}
                      </span>
                    )}
                    <div className="text-left">
                      <div className="text-xs leading-none">{item.title}</div>
                      <div className="text-[9.5px] text-[#909399] leading-none mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step Contents */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* ============================================================== */}
              {/* STEP 1: 流程原文与目标 (Process Text & Objectives) */}
              {/* ============================================================== */}
              {learnerStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Version & Approval Card */}
                  <div className="p-5 rounded-xl border border-[#adc6ff] bg-gradient-to-r from-[#f0f5ff] to-white shadow-2xs">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#52c41a] text-white">
                            官方已批准生效标准
                          </span>
                          <span className="font-bold text-sm text-[#1f2733] font-mono">
                            {currentStudioCourse.approvedVersion?.versionNo}
                          </span>
                        </div>
                        <p className="text-xs text-[#606266] leading-relaxed">
                          <strong>升级变更说明：</strong>{currentStudioCourse.approvedVersion?.changeSummary}
                        </p>
                        <div className="text-[11px] text-[#909399] flex items-center gap-4 pt-1">
                          <span>批准签署人：{currentStudioCourse.approvedVersion?.approver}</span>
                          <span>批准生效时间：{currentStudioCourse.approvedVersion?.approvedAt}</span>
                          <span>关联流程：{currentStudioCourse.approvedVersion?.docRef}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigate) {
                            onNavigate('/property/overview', currentStudioCourse.flowId);
                            showToast(`穿透进入【${currentStudioCourse.title}】流程全景拓扑图`, 'info');
                          }
                        }}
                        className="h-8 px-3 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>穿透查看流程图与节点要素</span>
                      </button>
                    </div>
                  </div>

                  {currentStudioCourse.approvedVersion?.xml&&<FrozenTrainingFlow xml={currentStudioCourse.approvedVersion.xml}/>}
                  {/* 3-5 条具体能力目标 */}
                  <div className="p-5 rounded-xl border border-[#ebeef5] bg-white shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-sm text-[#1f2733] mb-3">
                      <Sparkles className="w-4 h-4 text-[#2f54eb]" />
                      <span>本课程核心学习目标 (学完后能做到什么)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentStudioCourse.learningObjectives?.map((obj, i) => (
                        <div key={i} className="p-3 rounded-lg border border-[#e4e7ed] bg-[#fafafa] flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#52c41a] shrink-0 mt-0.5" />
                          <span className="text-xs text-[#303133] leading-relaxed font-medium">{obj}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 流程大纲章节与交付物 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2 p-5 rounded-xl border border-[#ebeef5] bg-white shadow-2xs space-y-3">
                      <div className="font-bold text-sm text-[#1f2733] flex items-center justify-between">
                        <span>流程核心阶段与重点章节</span>
                        <span className="text-xs text-[#909399]">共 {currentStudioCourse.sections?.length} 节</span>
                      </div>
                      <div className="space-y-2.5">
                        {currentStudioCourse.sections?.map((sec, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                              sec.completed ? 'border-[#b7eb8f] bg-[#f6ffed]/40' : 'border-[#dcdfe6] bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-[#909399]">{String(i + 1).padStart(2, '0')}</span>
                              <div>
                                <div className="font-semibold text-[#1f2733]">{sec.title}</div>
                                <div className="text-[10px] text-[#909399]">时长：{sec.time} · 属性：{sec.type || '核心标准'}</div>
                              </div>
                            </div>
                            {sec.completed ? (
                              <button onClick={()=>handleStudySection(currentStudioCourse.id,i)} className="text-[#52c41a] font-bold text-xs flex items-center gap-1"><Check className="w-3.5 h-3.5" /> 已完成 · 再次阅读</button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStudySection(currentStudioCourse.id, i)}
                                className="h-6 px-2.5 rounded bg-[#2f54eb] text-white font-semibold text-[11px] hover:bg-[#1d39c4] cursor-pointer"
                              >
                                打卡阅读
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 rounded-xl border border-[#ebeef5] bg-white shadow-2xs space-y-3">
                      <div className="font-bold text-sm text-[#1f2733]">课程绑定的已发布流程</div>
                      <p className="text-xs text-[#606266]">版本：{currentStudioCourse.approvedVersion.versionNo}。课程保存该版本原文；流程后续更新不会替换本次学习依据。</p>
                      <button className="text-[#2f54eb]" onClick={()=>{const blob=new Blob([currentStudioCourse.approvedVersion.xml||''],{type:'application/xml'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`${currentStudioCourse.flowCode}.drawio`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>下载课程流程原文（drawio）</button>
                    </div>
                  </div>

                  {/* Next Step CTA */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setLearnerStep(2)}
                      className="h-9 px-5 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>已理解流程全局，下一步：学习我的岗位怎么做</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 2: 我的岗位怎么做 (Role Playbooks & Case Samples) */}
              {/* ============================================================== */}
              {learnerStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Role Selector Header */}
                  <div className="p-4 rounded-xl border border-[#ebeef5] bg-white shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-bold text-sm text-[#1f2733]">切换学习岗位视角（同一个流程，各岗位学习重点不同）</div>
                        <p className="text-[11px] text-[#909399] mt-0.5">
                          不必所有人背完整份说明，优先吃透自己负责的输入、动作、输出与交接对象
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {currentStudioCourse.rolePlaybooks?.map((rp, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedLearnerRoleIdx(idx)}
                          className={`px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
                            selectedLearnerRoleIdx === idx
                              ? 'border-[#2f54eb] bg-[#2f54eb] text-white shadow-xs'
                              : 'border-[#dcdfe6] bg-[#fafafa] text-[#606266] hover:bg-[#f0f5ff] hover:text-[#2f54eb]'
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>{rp.roleName}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                            selectedLearnerRoleIdx === idx ? 'bg-white/20 text-white' : 'bg-[#e4e7ed] text-[#606266]'
                          }`}>
                            {rp.roleBadge}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Playbook Detailed Cards */}
                  {currentStudioCourse.rolePlaybooks?.[selectedLearnerRoleIdx] && (
                    <div className="space-y-5">
                      {/* Playbook Overview */}
                      {(() => {
                        const activeRp = currentStudioCourse.rolePlaybooks[selectedLearnerRoleIdx];
                        return (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="p-4 rounded-xl border border-[#ebeef5] bg-white shadow-2xs space-y-1">
                                <div className="text-[11px] text-[#909399] font-medium">负责节点</div>
                                <div className="font-bold text-xs text-[#2f54eb]">{activeRp.nodes.join('、')}</div>
                              </div>
                              <div className="p-4 rounded-xl border border-[#ebeef5] bg-white shadow-2xs space-y-1">
                                <div className="text-[11px] text-[#909399] font-medium">前置必备输入</div>
                                <div className="font-bold text-xs text-[#1f2733] truncate" title={activeRp.inputs.join('、')}>
                                  {activeRp.inputs.join('、')}
                                </div>
                              </div>
                              <div className="p-4 rounded-xl border border-[#ebeef5] bg-white shadow-2xs space-y-1">
                                <div className="text-[11px] text-[#909399] font-medium">关键输出交付物</div>
                                <div className="font-bold text-xs text-[#52c41a] truncate" title={activeRp.outputs.join('、')}>
                                  {activeRp.outputs.join('、')}
                                </div>
                              </div>
                              <div className="p-4 rounded-xl border border-[#ebeef5] bg-white shadow-2xs space-y-1">
                                <div className="text-[11px] text-[#909399] font-medium">下游交接对象</div>
                                <div className="font-bold text-xs text-[#722ed1]">{activeRp.handoverTo}</div>
                              </div>
                            </div>

                            {/* Standard Action Checklist */}
                            <div className="p-5 rounded-xl border border-[#ebeef5] bg-white shadow-2xs space-y-3">
                              <div className="font-bold text-sm text-[#1f2733] flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-[#2f54eb]" />
                                <span>【{activeRp.roleName}】标准操作动作清单（轮到自己时如何执行）</span>
                              </div>
                              <div className="space-y-2">
                                {activeRp.actions.map((act, i) => (
                                  <div key={i} className="p-3 rounded-lg border border-[#e4e7ed] bg-[#fafafa] text-xs text-[#303133] flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-[#f0f5ff] text-[#2f54eb] font-bold font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                      {i + 1}
                                    </span>
                                    <span className="leading-relaxed">{act}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Good vs Bad Case Samples */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {/* Good Sample */}
                              <div className="p-5 rounded-xl border border-[#b7eb8f] bg-[#f6ffed]/40 shadow-2xs space-y-3">
                                <div className="flex items-center gap-2 text-[#389e0d] font-bold text-sm">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>{activeRp.goodSample.title}</span>
                                </div>
                                <p className="text-xs text-[#303133] leading-relaxed">
                                  {activeRp.goodSample.desc}
                                </p>
                                <div className="p-3 rounded-lg bg-white border border-[#b7eb8f] text-xs text-[#237804] font-mono leading-relaxed">
                                  {activeRp.goodSample.preview}
                                </div>
                              </div>

                              {/* Bad Sample */}
                              <div className="p-5 rounded-xl border border-[#ffa39e] bg-[#fff1f0]/40 shadow-2xs space-y-3">
                                <div className="flex items-center gap-2 text-[#cf1322] font-bold text-sm">
                                  <ShieldAlert className="w-4 h-4" />
                                  <span>{activeRp.badSample.title}</span>
                                </div>
                                <p className="text-xs text-[#303133] leading-relaxed">
                                  {activeRp.badSample.desc}
                                </p>
                                <div className="p-3 rounded-lg bg-white border border-[#ffa39e] text-xs text-[#cf1322] font-mono leading-relaxed">
                                  {activeRp.badSample.warning}
                                </div>
                              </div>
                            </div>

                            {/* KCP Checkpoints */}
                            <div className="p-4 rounded-xl border border-[#adc6ff] bg-[#f0f5ff]/40 space-y-2">
                              <div className="font-bold text-xs text-[#1d39c4] flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" />
                                <span>本岗位不可违背的质量控制点 (KCP)</span>
                              </div>
                              <ul className="list-disc pl-5 text-xs text-[#303133] space-y-1">
                                {activeRp.kcpCheckpoints.map((k, ki) => (
                                  <li key={ki}>{k}</li>
                                ))}
                              </ul>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Next Step CTA */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setLearnerStep(1)}
                      className="h-9 px-4 rounded-lg border border-[#dcdfe6] bg-white text-xs font-semibold text-[#606266] hover:bg-[#fafafa] cursor-pointer"
                    >
                      返回流程原文
                    </button>
                    <button
                      type="button"
                      onClick={() => setLearnerStep(3)}
                      className="h-9 px-5 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>岗位动作已掌握，下一步：进入案例情景练习</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 3: 案例情景练习 (Case Practice & Feedback) */}
              {/* ============================================================== */}
              {learnerStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-4 rounded-xl border border-[#ebeef5] bg-white shadow-2xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-[#1f2733]">典型情景判断与纠错练习</div>
                      <p className="text-[11px] text-[#909399] mt-0.5">
                        即做即判：点击选项后立即展示解析与对应的流程节点依据，加深掌握深度
                      </p>
                    </div>
                    <div className="text-xs text-[#2f54eb] font-semibold">
                      共 {currentStudioCourse.questions?.length} 道情景案例题
                    </div>
                  </div>

                  <div className="space-y-5">
                    {currentStudioCourse.questions?.map((q, idx) => {
                      const selectedOpt = practiceAnswers[q.id];
                      const isAnswered = selectedOpt !== undefined;
                      const isCorrect = selectedOpt === q.correctIndex;

                      return (
                        <div
                          key={q.id}
                          className={`p-5 rounded-xl border bg-white shadow-2xs space-y-4 transition-all ${
                            isAnswered
                              ? isCorrect
                                ? 'border-[#b7eb8f]'
                                : 'border-[#ffa39e]'
                              : 'border-[#ebeef5]'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs font-mono text-[#2f54eb] bg-[#f0f5ff] px-2 py-0.5 rounded">
                                案例 {idx + 1}
                              </span>
                              <h3 className="font-bold text-sm text-[#1f2733]">{q.question}</h3>
                            </div>
                            {q.scenarioContext && (
                              <div className="p-3 rounded-lg bg-[#f8fafc] border border-[#e4e7ed] text-xs text-[#606266] leading-relaxed">
                                <span className="font-semibold text-[#1f2733]">【业务情景】：</span>{q.scenarioContext}
                              </div>
                            )}
                          </div>

                          {/* Options */}
                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => {
                              const isThisSelected = selectedOpt === optIdx;
                              const isThisCorrect = optIdx === q.correctIndex;
                              let btnClass = 'border-[#dcdfe6] bg-white text-[#303133] hover:border-[#adc6ff] hover:bg-[#fafafa]';
                              if (isAnswered) {
                                if (isThisCorrect) {
                                  btnClass = 'border-[#b7eb8f] bg-[#f6ffed] text-[#135200] font-semibold';
                                } else if (isThisSelected) {
                                  btnClass = 'border-[#ffa39e] bg-[#fff1f0] text-[#cf1322] font-semibold';
                                } else {
                                  btnClass = 'border-[#ebeef5] bg-[#fafafa] text-[#909399] opacity-60';
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => handleSelectPracticeAnswer(q.id, optIdx)}
                                  className={`w-full text-left p-3 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-between ${btnClass}`}
                                >
                                  <span>{opt}</span>
                                  {isAnswered && isThisCorrect && (
                                    <span className="text-[#52c41a] font-bold text-xs flex items-center gap-1 shrink-0 ml-2">
                                      <CheckCircle2 className="w-4 h-4" /> 正确
                                    </span>
                                  )}
                                  {isAnswered && isThisSelected && !isThisCorrect && (
                                    <span className="text-[#cf1322] font-bold text-xs flex items-center gap-1 shrink-0 ml-2">
                                      <X className="w-4 h-4" /> 错误
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation and Node Link */}
                          {isAnswered && (
                            <div className="p-4 rounded-xl border border-[#e4e7ed] bg-[#fafafa] space-y-2 text-xs">
                              <div className="font-bold text-xs flex items-center gap-2">
                                <span className={isCorrect ? 'text-[#389e0d]' : 'text-[#cf1322]'}>
                                  {isCorrect ? '🎉 回答正确！深度解析：' : '❌ 回答有误，重点知识剖析：'}
                                </span>
                              </div>
                              <p className="text-[#595959] leading-relaxed">{q.explanation}</p>
                              <div className="pt-2 border-t border-[#ebeef5] flex items-center gap-4 text-[11px] text-[#909399] flex-wrap">
                                <span className="font-semibold text-[#2f54eb]">
                                  关联流程节点：{q.relatedNode}
                                </span>
                                <span>制度条款依归：{q.relatedDocClause}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Navigation CTA */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setLearnerStep(2)}
                      className="h-9 px-4 rounded-lg border border-[#dcdfe6] bg-white text-xs font-semibold text-[#606266] hover:bg-[#fafafa] cursor-pointer"
                    >
                      返回岗位要点
                    </button>
                    <button
                      type="button"
                      onClick={() => setLearnerStep(4)}
                      className="h-9 px-5 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>练习已完成，进入正式考核与实操确认</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 4: 考核验证与实操确认 (Assessment & Confirmation) */}
              {/* ============================================================== */}
              {learnerStep === 4 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Status Banner */}
                  <div className="p-5 rounded-xl border border-[#ebeef5] bg-white shadow-2xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#2f54eb]" />
                        <h2 className="text-base font-bold text-[#1f2733]">课程掌握与达标认证考核</h2>
                      </div>
                      <p className="text-xs text-[#909399] mt-1">
                        达标合格线：<span className="font-bold text-[#2f54eb] font-mono">{currentStudioCourse.passingScore || 80} 分</span>
                        （三态标准：已阅读 ＋ 考核通过 ＋ 关键岗位实操确认）
                      </p>
                    </div>

                    {examSubmitted && examScore !== null && (
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[11px] text-[#909399]">本次测验成绩</div>
                          <div className={`text-2xl font-bold font-mono ${
                            examScore >= (currentStudioCourse.passingScore || 80) ? 'text-[#52c41a]' : 'text-[#cf1322]'
                          }`}>
                            {examScore} 分
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          examScore >= (currentStudioCourse.passingScore || 80)
                            ? 'bg-[#f6ffed] text-[#389e0d] border-[#b7eb8f]'
                            : 'bg-[#fff1f0] text-[#cf1322] border-[#ffa39e]'
                        }`}>
                          {examScore >= (currentStudioCourse.passingScore || 80) ? '考核通过' : '未达及格线'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Exam Questions */}
                  <div className="space-y-4">
                    {currentStudioCourse.questions?.map((q, idx) => (
                      <div key={q.id} className="p-5 rounded-xl border border-[#ebeef5] bg-white shadow-2xs space-y-3">
                        <div className="font-bold text-sm text-[#1f2733]">
                          {idx + 1}. {q.question}
                        </div>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const isChosen = examAnswers[q.id] === optIdx;
                            return (
                              <label
                                key={optIdx}
                                className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                                  isChosen
                                    ? 'border-[#2f54eb] bg-[#f0f5ff] text-[#2f54eb] font-semibold'
                                    : 'border-[#dcdfe6] bg-white text-[#303133] hover:bg-[#fafafa]'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`exam_${q.id}`}
                                  checked={isChosen}
                                  onChange={() => setExamAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                  className="text-[#2f54eb]"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Submit Exam Button */}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => handleSubmitExam(currentStudioCourse)}
                      className="h-10 px-6 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>{examSubmitted ? '重新交卷判分' : '完成作答，立即交卷判分'}</span>
                    </button>
                  </div>

                  {/* Practical Confirmation Task */}
                  {currentStudioCourse.practicalTask && (
                    <div className="p-5 rounded-xl border border-[#adc6ff] bg-[#f0f5ff]/30 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="font-bold text-sm text-[#1d39c4] flex items-center gap-1.5">
                            <FileCheck className="w-4 h-4 text-[#2f54eb]" />
                            <span>实操演练确认：{currentStudioCourse.practicalTask.taskName}</span>
                          </div>
                          <p className="text-xs text-[#606266] leading-relaxed">{currentStudioCourse.practicalTask.requirement}</p>
                          <textarea aria-label="实操完成说明" value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="填写实操结果、交付物编号或内部证据位置，提交指定复核人核验" className="w-full p-3 border rounded" rows={3}/>
                          <p>{currentStudioCourse.myRecord?.practiceConfirmed?'实操已复核':currentStudioCourse.myRecord?.practiceSubmittedAt?'实操已提交，待复核':''}</p>
                          <div className="text-[11px] text-[#909399]">
                            指定复核人：{options.users.find(u=>u.id===currentStudioCourse.practicalTask?.reviewer)?.name||currentStudioCourse.practicalTask.reviewer}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmPractical(currentStudioCourse.id)}
                          className="h-8 px-4 rounded-lg bg-[#52c41a] hover:bg-[#389e0d] text-white font-semibold text-xs cursor-pointer shadow-2xs shrink-0 flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>提交实操说明，等待复核</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStudioCourse.canReview&&<button className="text-blue-600" onClick={()=>handleOpenConfigModal(currentStudioCourse)}>查看学员实操并复核</button>}
                  {/* Completion Card */}
                  {currentStudioCourse.status === 'completed' && (
                    <div className="p-5 rounded-xl border border-[#b7eb8f] bg-[#f6ffed] text-center space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-[#52c41a] mx-auto" />
                      <div className="font-bold text-base text-[#135200]">恭喜！您已全面达成【{currentStudioCourse.title}】掌握要求！</div>
                      <p className="text-xs text-[#237804]">
                        已完成本课程配置的阅读、考核及实操要求，学习记录已保存。
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 经典概览模式 (Course Catalog View) */
        /* ========================================================================= */
        <>
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
                      “流程原文＋岗位讲解＋案例练习＋考核验证” 闭环体系
                    </span>
                  </div>
                  <p className="text-[#909399] text-xs mt-0.5">
                    当前学员：{currentUser?.userName || '系统员工'} · 归属：{currentUser?.deptName || '未设置部门'} · 三态掌握标准：已阅读 ＋ 考核通过 ＋ 实操确认
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[11px] text-[#909399]">个人课程完成率</div>
                  <div className="text-lg font-bold font-mono text-[#2f54eb]">
                    {Math.round((stats.completed / (stats.total || 1)) * 100)}%
                  </div>
                </div>
                <div className="h-8 w-px bg-[#ebeef5]" />
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-[#f6ffed] border border-[#b7eb8f] text-center">
                    <div className="text-[10px] text-[#389e0d]">已完成考核</div>
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
                  disabled={!canManage} hidden={!canManage} onClick={() => setManageModalOpen(true)}
                  className="h-8 px-3.5 rounded-lg border border-[#adc6ff] bg-[#f0f5ff] hover:bg-[#2f54eb] text-[#2f54eb] hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  title="管理课程大纲、编辑必修/选修属性与4大页签深度设置"
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
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索流程课程/编号/归口部门..."
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
                            <span className="font-mono font-bold text-xs text-[#595959]">{c.flowCode}</span>
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
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              hidden={!canManage} onClick={(e) => {
                                e.stopPropagation();
                                handleOpenConfigModal(c);
                              }}
                              className="h-7 px-2.5 rounded-lg border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-[#606266] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="管理员深度配置：基本设置、课程内容、练习考核、学习记录4页签"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>内容设置</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEnterLearningStudio(c);
                              }}
                              className="h-7 px-3 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>{c.progress === 100 ? '复习回顾' : '进入学习工作台'}</span>
                            </button>
                          </div>
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

            {/* Right: Course Preview & Quick Action */}
            <div className="w-96 flex flex-col bg-white rounded-xl border border-[#ebeef5] shadow-2xs overflow-hidden shrink-0">
              {selectedCourse ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-4 border-b border-[#ebeef5] bg-[#fafafa]">
                    <div className="flex items-center justify-between text-xs text-[#909399] mb-1">
                      <span>课程详情与考学进度</span>
                      <span className="font-mono">{selectedCourse.flowCode}</span>
                    </div>
                    <h2 className="font-bold text-sm text-[#1f2733] leading-snug">{selectedCourse.title}</h2>

                    {/* Quick Config Bar */}
                    <div className="mt-3 p-2.5 rounded-lg bg-white border border-[#dcdfe6] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#1f2733] flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-[#2f54eb]" />
                          <span>修读属性：</span>
                        </span>
                        <div className="flex items-center gap-1">
                          {(['必修', '选修', '进阶'] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              disabled={!canManage} onClick={() => handleChangeImportance(selectedCourse.id, type)}
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
                        onClick={() => handleEnterLearningStudio(selectedCourse)}
                        className="h-8 px-3 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors w-full justify-center shadow-xs"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>开始 4 步完整学习闭环</span>
                      </button>
                    </div>
                  </div>

                  {/* Sections List */}
                  <div className="p-4 flex-1 overflow-y-auto space-y-3">
                    <div className="text-xs font-bold text-[#1f2733] flex items-center justify-between">
                      <span>培训大纲章节 ({selectedCourse.sections.length} 节)</span>
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

                    {/* Role Playbooks Preview */}
                    {selectedCourse.rolePlaybooks?.length > 0 && (
                      <div className="pt-3 border-t border-[#ebeef5] space-y-2">
                        <div className="text-xs font-bold text-[#1f2733] flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#2f54eb]" />
                          <span>已编排的岗位操作指引</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCourse.rolePlaybooks.map((rp, i) => (
                            <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-[#f0f5ff] text-[#2f54eb] border border-[#adc6ff]">
                              {rp.roleName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="p-3 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between">
                    <button
                      type="button"
                      hidden={!canManage} onClick={() => handleOpenConfigModal(selectedCourse)}
                      className="text-xs text-[#2f54eb] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>配置本课程大纲与题库</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEnterLearningStudio(selectedCourse)}
                      className="h-7 px-3 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                      进入工作台
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
        </>
      )}

      {/* ========================================================================= */}
      {/* 课程管理与快速设置模态框 (Entrance Modal from image_4752461d.png) */}
      {/* ========================================================================= */}
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
                  <span>{showAddForm ? '收起新增表单' : '录入新流程培训课程'}</span>
                </button>
              </div>

              {/* Collapsible Add New Course Form */}
              {showAddForm && (
                <div className="p-4 rounded-xl border border-[#adc6ff] bg-[#f0f5ff]/30 space-y-3">
                  <div className="font-bold text-xs text-[#1d39c4] flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span>录入新流程培训课程（支持多维受众与达标设定）</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-[#606266] block mb-1">课程标题 *</label>
                      <input
                        type="text"
                        value={newCourseForm.title}
                        onChange={(e) => setNewCourseForm({ ...newCourseForm, title: e.target.value })}
                        placeholder="例如：1.1.1.1 IPMT立项决策规范实操培训"
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg bg-white text-xs focus:border-[#2f54eb] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#606266] block mb-1">关联流程编号</label>
                      <select aria-label="关联已发布流程" value={newCourseForm.flowCode} onChange={e=>setNewCourseForm({...newCourseForm,flowCode:e.target.value})} className="w-full h-9 border rounded px-2"><option value="">选择已发布流程</option>{options.flows.map(f=><option key={f.id} value={f.id}>{f.label}（{f.versionNo}）</option>)}</select>
                    </div>
                    <div>
                      <label className="text-[11px] text-[#606266] block mb-1">修读属性 (必修 / 选修) *</label>
                      <select
                        value={newCourseForm.importance}
                        onChange={(e) => setNewCourseForm({ ...newCourseForm, importance: e.target.value as any })}
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg bg-white text-xs focus:border-[#2f54eb] focus:outline-hidden cursor-pointer"
                      >
                        <option value="必修">必修 (全员或指定部门必达标)</option>
                        <option value="选修">选修 (员工自主选修)</option>
                        <option value="进阶">进阶 (专业岗位进阶深化)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-[#606266] block mb-1">完成期限 (天)</label>
                      <input
                        type="number"
                        value={newCourseForm.deadlineDays}
                        onChange={(e) => setNewCourseForm({ ...newCourseForm, deadlineDays: Number(e.target.value) || 30 })}
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg bg-white text-xs focus:border-[#2f54eb] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Structured Audience Selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#606266] block">
                      适用受众与部门范围 (点击复选结构化配置)
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border border-[#dcdfe6]">
                      {availableDepts.slice(0, 6).map((d) => {
                        const checked = newCourseForm.targetDepts.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              const next = checked
                                ? newCourseForm.targetDepts.filter((item) => item !== d)
                                : [...newCourseForm.targetDepts, d];
                              setNewCourseForm({ ...newCourseForm, targetDepts: next });
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer ${
                              checked
                                ? 'bg-[#f0f5ff] text-[#2f54eb] border-[#adc6ff] font-semibold'
                                : 'bg-[#fafafa] text-[#606266] border-[#dcdfe6]'
                            }`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#606266] block mb-1">课程要点与培训简介</label>
                    <textarea
                      value={newCourseForm.summary}
                      onChange={(e) => setNewCourseForm({ ...newCourseForm, summary: e.target.value })}
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
                      onClick={handleConfirmAddNewCourse}
                      className="h-7 px-4 rounded bg-[#2f54eb] text-white text-xs font-semibold hover:bg-[#1d39c4] cursor-pointer"
                    >
                      确认添加
                    </button>
                  </div>
                </div>
              )}

              {/* Table of all courses */}
              <div className="border border-[#ebeef5] rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#fafafa] text-[#606266] border-b border-[#ebeef5]">
                    <tr>
                      <th className="py-2.5 px-3 w-14">序号</th>
                      <th className="py-2.5 px-3">流程编号与课程名称</th>
                      <th className="py-2.5 px-3 w-28">业务归口</th>
                      <th className="py-2.5 px-3 w-36">
                        <span className="text-[#2f54eb] font-bold">修读属性 (直接切换)</span>
                      </th>
                      <th className="py-2.5 px-3 w-48">适用对象与受众范围</th>
                      <th className="py-2.5 px-3 w-32 text-center">操作与深度配置</th>
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
                            onChange={(e) => handleChangeAudience(c.id, e.target.value)} onBlur={()=>void saveCourse(c)}
                            className="w-full h-7 px-2 text-xs border border-transparent hover:border-[#dcdfe6] focus:border-[#2f54eb] rounded bg-transparent focus:bg-white focus:outline-hidden"
                            title="点击可直接编辑修改适用受众"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenConfigModal(c)}
                              className="h-6 px-2 rounded bg-[#f0f5ff] hover:bg-[#2f54eb] text-[#2f54eb] hover:text-white text-[11px] font-semibold cursor-pointer transition-colors"
                              title="打开4页签配置器：基本设置、课程内容、练习考核、学习记录"
                            >
                              配置内容
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void removeCourse(c);
                              }}
                              className="text-[#f56c6c] hover:text-[#cf1322] cursor-pointer"
                              title="归档该课程"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
                <span>提示：课程修改通过后台保存后生效；请进入“配置内容”编写章节正文。</span>
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

      {/* ========================================================================= */}
      {/* 课程深度设置 4 页签模态框 (Course 4-Tab Deep Config Modal) */}
      {/* ========================================================================= */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-[#ebeef5] overflow-hidden animate-in fade-in duration-150">
            {/* Header */}
            <div className="px-6 py-3.5 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#2f54eb] text-white flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-[#1f2733]">课程深度内容与规则设置</h2>
                    <span className="font-mono text-xs text-[#2f54eb] font-semibold">{editingCourse.flowCode}</span>
                  </div>
                  <p className="text-[11px] text-[#909399]">
                    支持“流程原文＋岗位讲解＋案例练习＋考核验证”四大模块系统化配置与学情追踪
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="w-7 h-7 rounded hover:bg-[#ebeef5] flex items-center justify-center text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Tabs Navigation */}
            <div className="px-6 border-b border-[#ebeef5] bg-white flex items-center gap-6 shrink-0">
              {[
                { key: 'basic', label: '1. 基本设置', desc: '版本/必修/多维受众/时限' },
                { key: 'content', label: '2. 课程内容', desc: '目标/大纲/岗位操作指引' },
                { key: 'assessment', label: '3. 练习与考核', desc: '题库/深度解析/关联节点' },
                { key: 'records', label: '4. 学习记录', desc: '学情/掌握度/错题复训' },
              ].filter(tab=>canManage||tab.key==='records').map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setConfigModalTab(tab.key as any)}
                  className={`py-3 text-xs font-semibold cursor-pointer border-b-2 transition-colors text-left ${
                    configModalTab === tab.key
                      ? 'border-[#2f54eb] text-[#2f54eb]'
                      : 'border-transparent text-[#606266] hover:text-[#1f2733]'
                  }`}
                >
                  <div>{tab.label}</div>
                  <div className="text-[10px] text-[#909399] font-normal">{tab.desc}</div>
                </button>
              ))}
            </div>

            {/* Modal Body: Tab Contents */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* ------------------------------------------------------------- */}
              {/* TAB 1: 基本设置 (Basic Settings) */}
              {/* ------------------------------------------------------------- */}
              {configModalTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#606266] block mb-1">课程标题 *</label>
                      <input
                        type="text"
                        value={editingCourse.title}
                        onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs focus:border-[#2f54eb] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#606266] block mb-1">关联业务流程编码</label>
                      <input
                        type="text"
                        value={editingCourse.flowCode}
                        onChange={(e) => setEditingCourse({ ...editingCourse, flowCode: e.target.value })}
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs font-mono focus:border-[#2f54eb] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#606266] block mb-1">修读属性 (必修/选修/进阶) *</label>
                      <select
                        value={editingCourse.importance}
                        onChange={(e) => setEditingCourse({ ...editingCourse, importance: e.target.value as any })}
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs cursor-pointer focus:border-[#2f54eb] focus:outline-hidden"
                      >
                        <option value="必修">必修 (全员或受众岗位必达标)</option>
                        <option value="选修">选修 (自主学习选修)</option>
                        <option value="进阶">进阶 (专业高阶深造)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#606266] block mb-1">完成时限要求 (天)</label>
                      <input
                        type="number"
                        value={editingCourse.deadlineDays}
                        onChange={(e) => setEditingCourse({ ...editingCourse, deadlineDays: Number(e.target.value) || 30 })}
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs focus:border-[#2f54eb] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#606266] block mb-1">学时要求</label>
                      <input
                        type="text"
                        value={editingCourse.duration}
                        onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs focus:border-[#2f54eb] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* 绑定已批准的流程版本 */}
                  <div className="p-4 rounded-xl border border-[#ebeef5] bg-[#fafafa] space-y-3">
                    <div className="font-bold text-xs text-[#1f2733] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#52c41a]" />
                        <span>挂接正式批准的流程基线版本</span>
                      </span>
                      <span className="text-[11px] text-[#2f54eb]">课程保存绑定时的发布版本，更新内容后需重新学习</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-[#606266] block mb-1">批准版本号</label>
                        <input
                          type="text"
                          readOnly value={editingCourse.approvedVersion?.versionNo || ''}
                          onChange={(e) =>
                            setEditingCourse({
                              ...editingCourse,
                              approvedVersion: { ...editingCourse.approvedVersion, versionNo: e.target.value },
                            })
                          }
                          className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs bg-white focus:border-[#2f54eb] focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#606266] block mb-1">批准签发人</label>
                        <input
                          type="text"
                          readOnly value={editingCourse.approvedVersion?.approver || ''}
                          onChange={(e) =>
                            setEditingCourse({
                              ...editingCourse,
                              approvedVersion: { ...editingCourse.approvedVersion, approver: e.target.value },
                            })
                          }
                          className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs bg-white focus:border-[#2f54eb] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded space-y-2"><label>绑定已发布流程（审批信息由后台读取）</label><select aria-label="课程绑定流程" value={editingCourse.flowId} onChange={e=>setEditingCourse({...editingCourse,flowId:e.target.value})} className="w-full h-9 border rounded"><option value="">请选择</option>{options.flows.map(f=><option key={f.id} value={f.id}>{f.label}（{f.versionNo}）</option>)}</select><p>保存课程内容会生成新课程版本，学员需按新内容重新学习；旧记录保留。</p></div>
                  {/* 多维度结构化受众选择器 (按部门、按岗位、按流程角色选择) */}
                  <div className="p-4 rounded-xl border border-[#adc6ff] bg-[#f0f5ff]/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-[#1d39c4] flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#2f54eb]" />
                        <span>必修范围与受众匹配规则（结构化选择，非自由文本）</span>
                      </div>

                    </div>

                    {/* 1. 按部门选择 */}
                    <div>
                      <div className="text-[11px] text-[#606266] font-medium mb-1.5">① 指定必修部门：</div>
                      <div className="flex flex-wrap gap-1.5">
                        {availableDepts.map((d) => {
                          const checked = editingCourse.targetDepts?.includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                const current = editingCourse.targetDepts || [];
                                const next = checked ? current.filter((item) => item !== d) : [...current, d];
                                setEditingCourse({ ...editingCourse, targetDepts: next });
                              }}
                              className={`px-2.5 py-1 rounded text-xs border cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-[#2f54eb] text-white border-[#2f54eb] font-semibold'
                                  : 'bg-white text-[#606266] border-[#dcdfe6] hover:bg-[#f0f5ff]'
                              }`}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. 按岗位选择 */}
                    <div>
                      <div className="text-[11px] text-[#606266] font-medium mb-1.5">② 指定必修岗位：</div>
                      <div className="flex flex-wrap gap-1.5">
                        {availablePositions.map((p) => {
                          const checked = editingCourse.targetPositions?.includes(p);
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                const current = editingCourse.targetPositions || [];
                                const next = checked ? current.filter((item) => item !== p) : [...current, p];
                                setEditingCourse({ ...editingCourse, targetPositions: next });
                              }}
                              className={`px-2.5 py-1 rounded text-xs border cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-[#2f54eb] text-white border-[#2f54eb] font-semibold'
                                  : 'bg-white text-[#606266] border-[#dcdfe6] hover:bg-[#f0f5ff]'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. 按流程角色选择 */}
                    <div>
                      <div className="text-[11px] text-[#606266] font-medium mb-1.5">③ 指定流程角色：</div>
                      <div className="flex flex-wrap gap-1.5">
                        {availableRoles.map((r) => {
                          const checked = editingCourse.targetRoles?.includes(r);
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                const current = editingCourse.targetRoles || [];
                                const next = checked ? current.filter((item) => item !== r) : [...current, r];
                                setEditingCourse({ ...editingCourse, targetRoles: next });
                              }}
                              className={`px-2.5 py-1 rounded text-xs border cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-[#52c41a] text-white border-[#52c41a] font-semibold'
                                  : 'bg-white text-[#606266] border-[#dcdfe6] hover:bg-[#f6ffed]'
                              }`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#606266] block mb-1">课程要点与培训简介</label>
                    <textarea
                      rows={2}
                      value={editingCourse.summary}
                      onChange={(e) => setEditingCourse({ ...editingCourse, summary: e.target.value })}
                      className="w-full p-2.5 border border-[#dcdfe6] rounded-lg text-xs focus:border-[#2f54eb] focus:outline-hidden resize-none"
                    />
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: 课程内容 (Course Content & Role Playbooks) */}
              {/* ------------------------------------------------------------- */}
              {configModalTab === 'content' && (
                <div className="space-y-5">
                  {/* 学习目标编辑 (3-5条) */}
                  <div className="p-4 rounded-xl border border-[#ebeef5] bg-[#fafafa] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-[#1f2733] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#2f54eb]" />
                        <span>核心学习目标设置 (建议 3—5 条具体能力要求)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...(editingCourse.learningObjectives || []), '新技能目标要求描述...'];
                          setEditingCourse({ ...editingCourse, learningObjectives: next });
                        }}
                        className="text-xs text-[#2f54eb] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" /> 增加目标条目
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editingCourse.learningObjectives?.map((obj, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={obj}
                            onChange={(e) => {
                              const next = [...editingCourse.learningObjectives];
                              next[i] = e.target.value;
                              setEditingCourse({ ...editingCourse, learningObjectives: next });
                            }}
                            className="flex-1 h-8 px-2.5 rounded border border-[#dcdfe6] bg-white text-xs focus:border-[#2f54eb] focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = editingCourse.learningObjectives.filter((_, idx) => idx !== i);
                              setEditingCourse({ ...editingCourse, learningObjectives: next });
                            }}
                            className="text-[#f56c6c] hover:text-[#cf1322] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 章节大纲编排 */}
                  <div className="p-4 rounded-xl border border-[#ebeef5] bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-[#1f2733]">章节编排与预计学时</div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = [
                            ...(editingCourse.sections || []),
                            { id:crypto.randomUUID(),content:'',title: `第 ${editingCourse.sections.length + 1} 节 新增操作实战`, time: '10分钟', completed: false, type: '实操演练' },
                          ];
                          setEditingCourse({ ...editingCourse, sections: next });
                        }}
                        className="text-xs text-[#2f54eb] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" /> 添加新小节
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editingCourse.sections?.map((sec, i) => (
                        <div key={sec.id} className="grid grid-cols-12 gap-2 items-center"><div className="col-span-12"><label>章节正文（学员实际阅读内容）</label><textarea aria-label={`章节${i+1}正文`} rows={6} value={sec.content||''} onChange={e=>{const next=[...editingCourse.sections];next[i]={...sec,content:e.target.value};setEditingCourse({...editingCourse,sections:next});}} className="w-full border rounded p-3"/></div>
                          <div className="col-span-7">
                            <input
                              type="text"
                              value={sec.title}
                              onChange={(e) => {
                                const next = [...editingCourse.sections];
                                next[i] = { ...next[i], title: e.target.value };
                                setEditingCourse({ ...editingCourse, sections: next });
                              }}
                              className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] text-xs focus:border-[#2f54eb] focus:outline-hidden"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              value={sec.time}
                              onChange={(e) => {
                                const next = [...editingCourse.sections];
                                next[i] = { ...next[i], time: e.target.value };
                                setEditingCourse({ ...editingCourse, sections: next });
                              }}
                              placeholder="10分钟"
                              className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] text-xs focus:border-[#2f54eb] focus:outline-hidden"
                            />
                          </div>
                          <div className="col-span-2 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                const next = editingCourse.sections.filter((_, idx) => idx !== i);
                                setEditingCourse({ ...editingCourse, sections: next });
                              }}
                              className="text-[#f56c6c] hover:text-[#cf1322] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* “我的岗位怎么做”编排器 (重点功能) */}
                  <div className="p-4 rounded-xl border border-[#adc6ff] bg-[#f0f5ff]/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-[#1d39c4] flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-[#2f54eb]" />
                          <span>“我的岗位怎么做” 岗位指引与合格样例编排 (重点建设)</span>
                        </div>
                        <p className="text-[11px] text-[#909399]">
                          针对申请人、审查人、批准人配置不同的输入、操作、输出与合格/缺陷样例
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newRp: RolePlaybook = {
                            roleName: '新角色岗位',
                            roleBadge: '执行岗',
                            roleDesc: '岗位定位职责...',
                            nodes: ['节点 01'],
                            inputs: ['输入材料'],
                            actions: ['操作动作 1', '操作动作 2'],
                            outputs: ['交付物'],
                            handoverTo: '下游角色',
                            goodSample: { title: '合格样例', desc: '标准规范样例', preview: '要素齐全' },
                            badSample: { title: '反面教材', desc: '常见典型缺项', warning: '驳回' },
                            kcpCheckpoints: ['不可跳过的控制点'],
                          };
                          const next = [...(editingCourse.rolePlaybooks || []), newRp];
                          setEditingCourse({ ...editingCourse, rolePlaybooks: next });
                          setActivePlaybookTabIdx(next.length - 1);
                        }}
                        className="text-xs text-[#2f54eb] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" /> 增加岗位指引
                      </button>
                    </div>

                    {/* Role tabs */}
                    <div className="flex items-center gap-2 border-b border-[#adc6ff]/50 pb-2">
                      {editingCourse.rolePlaybooks?.map((rp, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActivePlaybookTabIdx(i)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            activePlaybookTabIdx === i
                              ? 'bg-[#2f54eb] text-white shadow-xs'
                              : 'bg-white text-[#606266] border border-[#dcdfe6] hover:bg-[#f0f5ff]'
                          }`}
                        >
                          {rp.roleName}
                        </button>
                      ))}
                    </div>

                    {/* Active Role Playbook Editor */}
                    {editingCourse.rolePlaybooks?.[activePlaybookTabIdx] && (
                      <div className="p-3 bg-white rounded-lg border border-[#dcdfe6] space-y-3">
                        {(() => {
                          const rp = editingCourse.rolePlaybooks[activePlaybookTabIdx];
                          return (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[11px] text-[#606266] block mb-1">岗位名称</label>
                                  <input
                                    type="text"
                                    value={rp.roleName}
                                    onChange={(e) => {
                                      const next = [...editingCourse.rolePlaybooks];
                                      next[activePlaybookTabIdx] = { ...rp, roleName: e.target.value };
                                      setEditingCourse({ ...editingCourse, rolePlaybooks: next });
                                    }}
                                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] text-xs focus:border-[#2f54eb] focus:outline-hidden"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-[#606266] block mb-1">角色定位属性</label>
                                  <input
                                    type="text"
                                    value={rp.roleBadge || ''}
                                    onChange={(e) => {
                                      const next = [...editingCourse.rolePlaybooks];
                                      next[activePlaybookTabIdx] = { ...rp, roleBadge: e.target.value };
                                      setEditingCourse({ ...editingCourse, rolePlaybooks: next });
                                    }}
                                    placeholder="申请人 / 审查人 / 批准人"
                                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] text-xs focus:border-[#2f54eb] focus:outline-hidden"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-[#606266] block mb-1">负责节点</label>
                                  <input
                                    type="text"
                                    value={rp.nodes.join('、')}
                                    onChange={(e) => {
                                      const next = [...editingCourse.rolePlaybooks];
                                      next[activePlaybookTabIdx] = { ...rp, nodes: e.target.value.split('、') };
                                      setEditingCourse({ ...editingCourse, rolePlaybooks: next });
                                    }}
                                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] text-xs focus:border-[#2f54eb] focus:outline-hidden"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">{(['roleDesc','inputs','actions','outputs','handoverTo','kcpCheckpoints','goodSamplePreview','badSampleWarning'] as const).map(key=>{const labels={roleDesc:'岗位职责说明',inputs:'输入材料（每行一项）',actions:'操作步骤（每行一项）',outputs:'交付物（每行一项）',handoverTo:'交接对象',kcpCheckpoints:'关键控制点（每行一项）',goodSamplePreview:'合格样例正文',badSampleWarning:'错误样例风险说明'};const value=key==='goodSamplePreview'?rp.goodSample.preview:key==='badSampleWarning'?rp.badSample.warning:rp[key];return <label key={key}>{labels[key]}<textarea rows={3} className="w-full border rounded p-2" value={Array.isArray(value)?value.join('\n'):value} onChange={e=>{const next=[...editingCourse.rolePlaybooks];next[activePlaybookTabIdx]=key==='goodSamplePreview'?{...rp,goodSample:{...rp.goodSample,preview:e.target.value}}:key==='badSampleWarning'?{...rp,badSample:{...rp.badSample,warning:e.target.value}}:{...rp,[key]:Array.isArray(value)?e.target.value.split('\n'):e.target.value};setEditingCourse({...editingCourse,rolePlaybooks:next});}}/></label>;})}</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[11px] text-[#606266] block mb-1">合格样例示范标题与说明</label>
                                  <input
                                    type="text"
                                    value={rp.goodSample?.title || ''}
                                    onChange={(e) => {
                                      const next = [...editingCourse.rolePlaybooks];
                                      next[activePlaybookTabIdx] = {
                                        ...rp,
                                        goodSample: { ...rp.goodSample, title: e.target.value },
                                      };
                                      setEditingCourse({ ...editingCourse, rolePlaybooks: next });
                                    }}
                                    className="w-full h-8 px-2.5 rounded border border-[#b7eb8f] text-xs mb-1.5 focus:border-[#2f54eb] focus:outline-hidden"
                                  />
                                  <textarea
                                    rows={2}
                                    value={rp.goodSample?.desc || ''}
                                    onChange={(e) => {
                                      const next = [...editingCourse.rolePlaybooks];
                                      next[activePlaybookTabIdx] = {
                                        ...rp,
                                        goodSample: { ...rp.goodSample, desc: e.target.value },
                                      };
                                      setEditingCourse({ ...editingCourse, rolePlaybooks: next });
                                    }}
                                    placeholder="合格的具体要点与表现..."
                                    className="w-full p-2 rounded border border-[#b7eb8f] text-xs resize-none"
                                  />
                                </div>

                                <div>
                                  <label className="text-[11px] text-[#606266] block mb-1">典型缺陷与反面教材警示</label>
                                  <input
                                    type="text"
                                    value={rp.badSample?.title || ''}
                                    onChange={(e) => {
                                      const next = [...editingCourse.rolePlaybooks];
                                      next[activePlaybookTabIdx] = {
                                        ...rp,
                                        badSample: { ...rp.badSample, title: e.target.value },
                                      };
                                      setEditingCourse({ ...editingCourse, rolePlaybooks: next });
                                    }}
                                    className="w-full h-8 px-2.5 rounded border border-[#ffa39e] text-xs mb-1.5 focus:border-[#2f54eb] focus:outline-hidden"
                                  />
                                  <textarea
                                    rows={2}
                                    value={rp.badSample?.desc || ''}
                                    onChange={(e) => {
                                      const next = [...editingCourse.rolePlaybooks];
                                      next[activePlaybookTabIdx] = {
                                        ...rp,
                                        badSample: { ...rp.badSample, desc: e.target.value },
                                      };
                                      setEditingCourse({ ...editingCourse, rolePlaybooks: next });
                                    }}
                                    placeholder="常见错误表现与惩罚警示..."
                                    className="w-full p-2 rounded border border-[#ffa39e] text-xs resize-none"
                                  />
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 3: 练习与考核 (Practice & Assessment) */}
              {/* ------------------------------------------------------------- */}
              {configModalTab === 'assessment' && (
                <div className="space-y-5"><div className="p-4 border rounded space-y-3"><label><input type="checkbox" checked={!!editingCourse.practicalTask} onChange={e=>setEditingCourse({...editingCourse,practicalTask:e.target.checked?{taskName:'实操任务',requirement:'',reviewer:''}:undefined})}/> 需要实操复核</label>{editingCourse.practicalTask&&<><input aria-label="实操任务名称" value={editingCourse.practicalTask.taskName} onChange={e=>setEditingCourse({...editingCourse,practicalTask:{...editingCourse.practicalTask!,taskName:e.target.value}})} className="w-full border p-2"/><textarea aria-label="实操任务要求" value={editingCourse.practicalTask.requirement} onChange={e=>setEditingCourse({...editingCourse,practicalTask:{...editingCourse.practicalTask!,requirement:e.target.value}})} className="w-full border p-2"/><select aria-label="实操复核人" value={editingCourse.practicalTask.reviewer} onChange={e=>setEditingCourse({...editingCourse,practicalTask:{...editingCourse.practicalTask!,reviewer:e.target.value}})} className="w-full border p-2"><option value="">选择复核人</option>{options.users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></>}</div>
                  <div className="p-4 rounded-xl border border-[#ebeef5] bg-[#fafafa] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#1f2733]">考核规则与合格标准</div>
                      <p className="text-[11px] text-[#909399]">
                        学员达到设定分数线方可判定“考核通过”，题目的解析会直接链接到对应流程节点
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#606266]">及格分数线：</span>
                      <input
                        type="number"
                        min="60"
                        max="100"
                        value={editingCourse.passingScore || 80}
                        onChange={(e) =>
                          setEditingCourse({ ...editingCourse, passingScore: Number(e.target.value) || 80 })
                        }
                        className="w-20 h-8 px-2.5 rounded border border-[#dcdfe6] bg-white text-xs font-mono font-bold text-[#2f54eb] text-center"
                      />
                      <span className="text-xs text-[#606266]">分</span>
                    </div>
                  </div>

                  {/* 试题题库列表 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-[#1f2733] flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-[#2f54eb]" />
                        <span>试题库配置（共 {editingCourse.questions?.length} 题，含深度解析与关联节点）</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newQ: PracticeQuestion = {
                            id: 'q_new_' + Date.now().toString(36),
                            type: 'choice',
                            question: '【情景判断】新案例题目描述...',
                            options: ['选项 A', '选项 B (正确)', '选项 C', '选项 D'],
                            correctIndex: 1,
                            explanation: '题目深度解析与正确/错误依据说明...',
                            relatedNode: '02 同行审查节点',
                            relatedDocClause: '《管理细则》第3条',
                          };
                          setEditingCourse({
                            ...editingCourse,
                            questions: [...(editingCourse.questions || []), newQ],
                          });
                        }}
                        className="text-xs text-[#2f54eb] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" /> 增加考核试题
                      </button>
                    </div>

                    <div className="space-y-4">
                      {editingCourse.questions?.map((q, idx) => (
                        <div key={q.id} className="p-4 rounded-xl border border-[#ebeef5] bg-white space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#2f54eb] font-mono">第 {idx + 1} 题</span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = editingCourse.questions.filter((item) => item.id !== q.id);
                                setEditingCourse({ ...editingCourse, questions: next });
                              }}
                              className="text-[#f56c6c] hover:text-[#cf1322] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div>
                            <label className="text-[11px] text-[#606266] block mb-1">题干内容</label>
                            <input
                              type="text"
                              value={q.question}
                              onChange={(e) => {
                                const next = [...editingCourse.questions];
                                next[idx] = { ...q, question: e.target.value };
                                setEditingCourse({ ...editingCourse, questions: next });
                              }}
                              className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] text-xs focus:border-[#2f54eb] focus:outline-hidden"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] text-[#606266] block">
                              选项配置（请单选标记哪一个是正确答案）
                            </label>
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct_${q.id}`}
                                  checked={q.correctIndex === optIdx}
                                  onChange={() => {
                                    const next = [...editingCourse.questions];
                                    next[idx] = { ...q, correctIndex: optIdx };
                                    setEditingCourse({ ...editingCourse, questions: next });
                                  }}
                                  className="text-[#2f54eb]"
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const next = [...editingCourse.questions];
                                    const nextOpts = [...q.options];
                                    nextOpts[optIdx] = e.target.value;
                                    next[idx] = { ...q, options: nextOpts };
                                    setEditingCourse({ ...editingCourse, questions: next });
                                  }}
                                  className="flex-1 h-7 px-2.5 rounded border border-[#dcdfe6] text-xs focus:border-[#2f54eb] focus:outline-hidden"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="text-[11px] text-[#606266] block mb-1">关联流程节点</label>
                              <input
                                type="text"
                                value={q.relatedNode}
                                onChange={(e) => {
                                  const next = [...editingCourse.questions];
                                  next[idx] = { ...q, relatedNode: e.target.value };
                                  setEditingCourse({ ...editingCourse, questions: next });
                                }}
                                placeholder="例如：02 同行交叉审查 (KCP-01)"
                                className="w-full h-7 px-2.5 rounded border border-[#dcdfe6] text-xs focus:border-[#2f54eb] focus:outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] text-[#606266] block mb-1">制度条款依归</label>
                              <input
                                type="text"
                                value={q.relatedDocClause}
                                onChange={(e) => {
                                  const next = [...editingCourse.questions];
                                  next[idx] = { ...q, relatedDocClause: e.target.value };
                                  setEditingCourse({ ...editingCourse, questions: next });
                                }}
                                placeholder="例如：《质量红线管理规范》第4.2款"
                                className="w-full h-7 px-2.5 rounded border border-[#dcdfe6] text-xs focus:border-[#2f54eb] focus:outline-hidden"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] text-[#606266] block mb-1">
                              深度答案解析 (解释为什么正确、为什么错误)
                            </label>
                            <textarea
                              rows={2}
                              value={q.explanation}
                              onChange={(e) => {
                                const next = [...editingCourse.questions];
                                next[idx] = { ...q, explanation: e.target.value };
                                setEditingCourse({ ...editingCourse, questions: next });
                              }}
                              className="w-full p-2 rounded border border-[#dcdfe6] text-xs resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 4: 学习记录 (Learning Records & Analytics) */}
              {/* ------------------------------------------------------------- */}
              {configModalTab === 'records' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg border border-[#ebeef5] bg-[#fafafa] text-center">
                      <div className="text-[11px] text-[#909399]">必修总学员</div>
                      <div className="font-bold text-base text-[#1f2733] font-mono mt-0.5">
                        {editingCourse.records?.length || 0} 人
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-[#b7eb8f] bg-[#f6ffed] text-center">
                      <div className="text-[11px] text-[#389e0d]">考核已通过</div>
                      <div className="font-bold text-base text-[#389e0d] font-mono mt-0.5">
                        {editingCourse.records?.filter((r) => r.examStatus === 'passed').length || 0} 人
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-[#adc6ff] bg-[#f0f5ff] text-center">
                      <div className="text-[11px] text-[#2f54eb]">实操已确认</div>
                      <div className="font-bold text-base text-[#2f54eb] font-mono mt-0.5">
                        {editingCourse.records?.filter((r) => r.practiceConfirmed).length || 0} 人
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-[#ffa39e] bg-[#fff1f0] text-center">
                      <div className="text-[11px] text-[#cf1322]">待补考/待补训</div>
                      <div className="font-bold text-base text-[#cf1322] font-mono mt-0.5">
                        {editingCourse.records?.filter((r) => r.examStatus !== 'passed').length || 0} 人
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-[#1f2733]">学员掌握进度与学情明细表</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => showToast('请根据学情记录安排补学；当前未接通短信服务','info')}
                        className="h-7 px-3 rounded-lg border border-[#adc6ff] bg-[#f0f5ff] text-[#2f54eb] text-xs font-semibold cursor-pointer hover:bg-[#2f54eb] hover:text-white transition-colors"
                      >
                        一键通知补学补考
                      </button>
                    </div>
                  </div>

                  <div className="border border-[#ebeef5] rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#fafafa] text-[#606266] border-b border-[#ebeef5]">
                        <tr>
                          <th className="py-2.5 px-3">姓名 / 工号</th>
                          <th className="py-2.5 px-3">所属部门 / 岗位</th>
                          <th className="py-2.5 px-3 text-center">已阅读</th>
                          <th className="py-2.5 px-3 text-center">考核成绩</th>
                          <th className="py-2.5 px-3 text-center">实操确认</th>
                          <th className="py-2.5 px-3">薄弱知识点分析</th>
                          <th className="py-2.5 px-3">最后学习时间</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebeef5]">
                        {editingCourse.records?.map((rec) => (
                          <tr key={rec.id} className="hover:bg-[#f9fafc]">
                            <td className="py-2 px-3">
                              <div className="font-semibold text-[#1f2733]">{rec.name}</div>
                              <div className="text-[11px] text-[#909399] font-mono">{rec.empNo}</div>
                            </td>
                            <td className="py-2 px-3 text-[#606266]">
                              <div>{rec.deptName}</div>
                              <div className="text-[10.5px] text-[#909399]">{rec.positionName}</div>
                            </td>
                            <td className="py-2 px-3 text-center">
                              {rec.readStatus === 'read' ? (
                                <span className="inline-flex items-center gap-1 text-[#52c41a] font-semibold text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> 已读
                                </span>
                              ) : (
                                <span className="text-[#909399] text-[11px]">未读</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-mono">
                              {rec.examStatus === 'passed' ? (
                                <span className="text-[#52c41a] font-bold bg-[#f6ffed] px-2 py-0.5 rounded border border-[#b7eb8f]">
                                  {rec.score} 分 (合格)
                                </span>
                              ) : rec.examStatus === 'failed' ? (
                                <span className="text-[#cf1322] font-bold bg-[#fff1f0] px-2 py-0.5 rounded border border-[#ffa39e]">
                                  {rec.score} 分 (不合格)
                                </span>
                              ) : (
                                <span className="text-[#909399] text-[11px]">未考试</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {rec.practiceConfirmed ? (
                                <span className="text-[#2f54eb] font-semibold text-[11px] bg-[#f0f5ff] px-2 py-0.5 rounded border border-[#adc6ff]">
                                  已由 {rec.confirmedBy?.split(' ')?.[0] || '主管'} 确认
                                </span>
                              ) : (
                                <span className="text-[#909399] text-[11px]">待复核</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-[#595959] text-[11px]">
                              {rec.weakPoints?.join('、') || '暂无'}{rec.evidence&&<div className="whitespace-pre-wrap">实操说明：{rec.evidence}{!rec.practiceConfirmed&&editingCourse.canReview&&rec.userId!==currentUser?.id&&<button onClick={()=>void confirmRecord(editingCourse,rec.userId!)} className="text-blue-600 block">复核通过</button>}</div>}
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-[#909399]">
                              {rec.lastStudyTime}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="text-xs text-[#909399]">
                提示：保存后生成新的课程版本，保留旧学习记录，新版本需重新学习。
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="h-8 px-4 rounded-lg border border-[#dcdfe6] text-xs font-semibold text-[#606266] hover:bg-white cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  hidden={!canManage} disabled={saving} onClick={handleSaveCourseConfig}
                  className="h-8 px-5 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>保存课程全部配置</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
