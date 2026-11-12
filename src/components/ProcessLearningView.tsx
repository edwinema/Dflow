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
  Upload,
  FileSpreadsheet,
  Copy,
  Save,
  CheckCircle,
  SlidersHorizontal,
  Bookmark,
  Info,
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
  type: 'scenario' | 'choice' | 'multi' | 'judge';
  score: number; // 题目分值
  isKcpMandatory?: boolean; // 是否为KCP红线必须答对题
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

  // 5. 练习与考核设置 (含通过标准)
  passingScore: number; // 及格分数线 (如 80)
  timeLimitMinutes: number; // 考核时限 (如 30分钟)
  maxAttempts: number; // 允许补考次数 (如 3次)
  kcpAllMustCorrect: boolean; // 是否要求核心KCP红线题必须全部答对
  requirePracticalConfirmation: boolean; // 是否必须实操确认
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
  // 视图模式：'catalog' (课程总览列表) | 'detail' (课程详情页4个页签)
  const [viewMode, setViewMode] = useState<'catalog' | 'detail'>('catalog');
  // 课程详情页内选中的4个页签：'basic' | 'content' | 'assessment' | 'records'
  const [detailActiveTab, setDetailActiveTab] = useState<'basic' | 'content' | 'assessment' | 'records'>('assessment');

  const [activeTab, setActiveTab] = useState<'all' | 'required' | 'elective' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

  // “练习与考核”页签中：管理配置模式 vs 学员做题体验模式 ('manage' | 'test')
  const [assessmentMode, setAssessmentMode] = useState<'manage' | 'test'>('test');
  // 题目类型筛选 ('all' | 'scenario' | 'choice' | 'multi' | 'judge')
  const [questionFilterType, setQuestionFilterType] = useState<string>('all');

  // 学员答题状态: questionId -> selectedIndex
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, number>>({});
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [examScore, setExamScore] = useState<number | null>(null);

  // 上传案例练习题弹窗状态
  const [importQuestionModalOpen, setImportQuestionModalOpen] = useState(false);
  const [importQuestionPreviewList, setImportQuestionPreviewList] = useState<PracticeQuestion[]>([]);
  const [importFileName, setImportFileName] = useState('');

  // 手动新增/编辑题目弹窗
  const [questionEditModal, setQuestionEditModal] = useState<{
    open: boolean;
    isCreate: boolean;
    data: PracticeQuestion;
  }>({
    open: false,
    isCreate: true,
    data: {
      id: '',
      type: 'scenario',
      score: 20,
      isKcpMandatory: true,
      question: '',
      scenarioContext: '',
      options: ['选项 A', '选项 B', '选项 C', '选项 D'],
      correctIndex: 1,
      explanation: '',
      relatedNode: '02 同行交叉审查 (KCP-01)',
      relatedDocClause: '《IPD技术质量红线管理规范》第4.2款',
    },
  });

  // 全局课程管理快捷弹窗 (入口来自顶部按钮)
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // 岗位视角切换
  const [selectedRoleIdx, setSelectedRoleIdx] = useState<number>(0);

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
    try {const data=await trainingRequest('/api/training/courses');setCourses(data.courses.map(normalizeCourse));setCanManage(data.canManage);setOptions(data.options);setLoadError('');}
    catch(e:any){setLoadError(e.message);showToast(e.message,'error');}finally{setLoading(false);}
  }
  useEffect(()=>{void loadCourses();},[currentUser?.id]);
  function acceptCourse(raw:CourseItem) {const course=normalizeCourse(raw);setCourses(prev=>prev.map(c=>c.id===course.id?course:c));setSelectedCourse(prev=>prev?.id===course.id?course:prev);}
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
    try {const saved=await trainingRequest(`/api/training/courses/${course.id}/records/${userId}/confirm`,'POST',{revision:course.revision});acceptCourse(saved);showToast('实操复核已记录','success');}catch(e:any){showToast(e.message,'error');}
  }
  async function completeSection(course:CourseItem,sectionId:string) {
    try {acceptCourse(await trainingRequest(`/api/training/courses/${course.id}/sections/${sectionId}/complete`,'POST',{revision:course.revision}));setReading(null);showToast('章节学习记录已保存','success');}catch(e:any){showToast(e.message,'error');}
  }

  function normalizeCourse(c:CourseItem):CourseItem {return {...c,timeLimitMinutes:c.timeLimitMinutes??30,maxAttempts:c.maxAttempts??3,kcpAllMustCorrect:c.kcpAllMustCorrect??false,requirePracticalConfirmation:!!c.practicalTask,questions:(c.questions||[]).map(q=>({...q,score:q.score??10}))};}
  const [newTitle,setNewTitle]=useState('');
  const [newFlow,setNewFlow]=useState('');
  async function createCourse(){
    if(!newTitle.trim()||!newFlow){showToast('请输入课程名称并选择已发布流程','warning');return;}
    try {const saved=normalizeCourse(await trainingRequest('/api/training/courses','POST',{title:newTitle,flowId:newFlow,importance:'必修',deadlineDays:30,passingScore:80,sections:[{id:crypto.randomUUID(),title:'学习内容',content:'',time:''}],questions:[]}));setCourses(prev=>[saved,...prev]);setSelectedCourse(saved);setViewMode('detail');setDetailActiveTab('content');setManageModalOpen(false);setNewTitle('');}
    catch(e:any){showToast(e.message,'error');}
  }
  // 当前正在查看或配置的课程
  const currentCourse = selectedCourse || courses[0];

  // 快捷统计指标
  const stats = {
    total: courses.length,
    completed: courses.filter((c) => c.status === 'completed').length,
    inProgress: courses.filter((c) => c.status === 'in_progress').length,
    requiredCount: courses.filter((c) => c.importance === '必修').length,
    requiredPending: courses.filter((c) => c.importance === '必修' && c.status !== 'completed').length,
    electiveCount: courses.filter((c) => c.importance !== '必修').length,
  };

  // 筛选课程列表
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

  // 更新当前课程字段
  const handleUpdateCurrentCourse = (updater: (prev: CourseItem) => CourseItem) => {
    if (!currentCourse) return;
    const updated = updater(currentCourse);
    setSelectedCourse(updated);
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  // 快速切换重要性
  const handleChangeImportance = (courseId:string,importance:'必修'|'选修'|'进阶') => {
    const c=courses.find(c=>c.id===courseId);if(c)void saveCourse({...c,importance});
  };
  const handleStudySection = (courseId:string,sectionIdx:number) => {
    const c=courses.find(c=>c.id===courseId);if(c)setReading({courseId,sectionId:c.sections[sectionIdx].id});
  };

  // 保存通过标准
  const handleSavePassingCriteria = (
    newPassingScore: number,
    newTimeLimit: number,
    newMaxAttempts: number,
    newKcpMustCorrect: boolean,
    newRequirePractical: boolean
  ) => {
    handleUpdateCurrentCourse((prev) => ({
      ...prev,
      passingScore: newPassingScore,
      timeLimitMinutes: newTimeLimit,
      maxAttempts: newMaxAttempts,
      kcpAllMustCorrect: newKcpMustCorrect,
      requirePracticalConfirmation: newRequirePractical,
    }));
    showToast('规则已修改，请点击顶部保存课程配置', 'info');
  };

  // 题目操作：删除试题
  const handleDeleteQuestion = (qId: string) => {
    handleUpdateCurrentCourse((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== qId),
    }));
    showToast('已删除该测试题目', 'info');
  };

  // 题目操作：保存/新增单条试题
  const handleSaveSingleQuestion = () => {
    const qData = questionEditModal.data;
    if (!qData.question.trim()) {
      showToast('请输入题目题干内容', 'warning');
      return;
    }
    if (qData.options.some((o) => !o.trim())) {
      showToast('所有选项内容均不能为空', 'warning');
      return;
    }

    if (questionEditModal.isCreate) {
      const newQuestion: PracticeQuestion = {
        ...qData,
        id: 'q_' + Date.now().toString(36),
      };
      handleUpdateCurrentCourse((prev) => ({
        ...prev,
        questions: [...prev.questions, newQuestion],
      }));
      showToast('已成功添加新测试题目', 'success');
    } else {
      handleUpdateCurrentCourse((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => (q.id === qData.id ? qData : q)),
      }));
      showToast('题目已修改，请点击顶部保存课程配置', 'info');
    }
    setQuestionEditModal({ ...questionEditModal, open: false });
  };

  // 题目导入：下载标准模板 (CSV)
  const handleDownloadQuestionTemplate = () => {
    const headers = [
      '题型(情景案例/单选/多选/判断)',
      '分值',
      '是否KCP必过(是/否)',
      '业务情景描述',
      '题目题干',
      '选项A',
      '选项B',
      '选项C',
      '选项D',
      '正确答案(A/B/C/D)',
      '深度答案解析',
      '关联流程节点',
      '制度条款依归',
    ];
    const sampleRows = [
      [
        '情景案例',
        '25',
        '是',
        '项目交付紧急，第三方环境可靠性实验室的测试报告预计还需3天出具。',
        '系统工程师提交评审，关键可靠性报告尚未出具，专家能否给予通过？',
        '可以通过，1个月内补齐报告并归档',
        '绝不能通过，属于KCP-01核心质量红线必须中止或延期',
        '由项目总监出具口头担保承诺放行',
        '降低评审等级免去裁决直接投产',
        'B',
        '关键验证报告属于不可裁剪KCP-01红线输入，任何因工期压力的放行均属严重流程违规。',
        '02 同行交叉审查 (KCP-01)',
        '《IPD技术质量红线管理规范》第4.2款',
      ],
      [
        '单选题',
        '15',
        '否',
        '研发技术评审发起阶段',
        '系统工程师执行节点 01“发起技术评审”时的首要前置动作？',
        '在企业微信直接要求专家会签',
        '对照前置核查表逐项自检材料齐备性并自查签署',
        '仅提供代码库链接由专家自行提取',
        '跳过自查直接邀请领导召集会议',
        'B',
        '发起人的核心准则是不可向下游流转不合格半成品，必须完成自查清单确认。',
        '01 发起技术评审',
        '《技术评审发起前置门禁准则》第2.1条',
      ],
      [
        '判断题',
        '15',
        '否',
        '流程流转门禁控制',
        '《TRB决议裁决书》是后续受控基线发布与投产立项的法定前置输入，未经裁决批准不得擅自投产。',
        '正确',
        '错误',
        '',
        '',
        'A',
        '技术评审是产品研发各阶段门禁，决议书是进入下一工程阶段的通行证。',
        '04 TRB决议裁决',
        '《IPD阶段门禁治理条例》第3.4款',
      ],
    ];

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...sampleRows.map((r) => r.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `流程培训案例练习题导入标准模板_${currentCourse.flowCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('已下载案例练习题标准导入模板 (CSV)', 'success');
  };

  // 题目导入：选择文件解析
  const handleFileSelectQuestionImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = (event.target?.result as string) || '';
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          showToast('导入文件无有效数据行', 'warning');
          return;
        }

        const parsed: PracticeQuestion[] = [];
        // 跳过表头
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
          if (parts[4]) {
            // parts[4] 是题干
            const typeText = parts[0] || '情景案例';
            const mappedType: PracticeQuestion['type'] =
              typeText.includes('单选')
                ? 'choice'
                : typeText.includes('多选')
                ? 'multi'
                : typeText.includes('判断')
                ? 'judge'
                : 'scenario';

            const opts = [parts[5] || '选项A', parts[6] || '选项B'];
            if (parts[7]) opts.push(parts[7]);
            if (parts[8]) opts.push(parts[8]);

            let correctIdx = 0;
            const ansLetter = (parts[9] || 'A').toUpperCase();
            if (ansLetter === 'B') correctIdx = 1;
            if (ansLetter === 'C') correctIdx = 2;
            if (ansLetter === 'D') correctIdx = 3;

            parsed.push({
              id: 'imp_q_' + Date.now().toString(36) + '_' + i,
              type: mappedType,
              score: Number(parts[1]) || (mappedType === 'scenario' ? 25 : 15),
              isKcpMandatory: parts[2] === '是' || parts[2] === 'true' || parts[2] === '1',
              scenarioContext: parts[3] || '',
              question: parts[4],
              options: opts,
              correctIndex: correctIdx,
              explanation: parts[10] || '无详细解析',
              relatedNode: parts[11] || '02 同行交叉审查 (KCP-01)',
              relatedDocClause: parts[12] || '《流程标准管理条例》',
            });
          }
        }

        if (parsed.length > 0) {
          setImportQuestionPreviewList(parsed);
          showToast(`已成功识别并解析出 ${parsed.length} 道案例题目！`, 'success');
        } else {
          showToast('未能从文件中解析出符合格式的题目', 'warning');
        }
      } catch {
        showToast('读取导入文件失败，请核对文件格式', 'error');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // 题目导入：一键载入样例数据
  const handleLoadSampleQuestionPackage = () => {
    const samples: PracticeQuestion[] = [
      {
        id: 'sample_q_1',
        type: 'scenario',
        score: 25,
        isKcpMandatory: true,
        question: '【情景案例】在技术评审会签时，项目经理提出因芯片供应链备货周期长，建议将流片投产与TR4评审并行推进，请问同行专家应如何决议？',
        scenarioContext: '客户指定的新型电源芯片交期需16周，项目经理为了赶四季度发布，要求TR4未闭环前预投产。',
        options: [
          'A. 予以批准，并在备注中声明自负盈亏',
          'B. 坚决不予批准。TR4是流片投产的强制前置门禁，违背流片投产红线将导致批次报废风险',
          'C. 由部门助理代签通过',
          'D. 允许投产但扣罚工程师绩效',
        ],
        correctIndex: 1,
        explanation: '《集成电路流片投产管理办法》明确规定，任何芯片投产必须具备合格有效的TR4决议签署件，严禁未批先投。',
        relatedNode: '04 TRB 决议裁决 (KCP-02)',
        relatedDocClause: '《流片投产质量门禁管理红线条例》第1.3条',
      },
      {
        id: 'sample_q_2',
        type: 'choice',
        score: 15,
        isKcpMandatory: false,
        question: '当同行评审专家对某个模块接口的时序存在不同技术意见时，应当如何流转处理？',
        options: [
          'A. 各执一词，私下电话争吵',
          'B. 记录在《同行评审争议项清单》中，交由首席架构师在 TRB 决议会上统筹裁定',
          'C. 谁资历老听谁的',
          'D. 直接删除该模块代码',
        ],
        correctIndex: 1,
        explanation: '流程设计有明确的争议仲裁机制，必须如实记录分歧并提报至裁决层。',
        relatedNode: '03 问题收敛整改',
        relatedDocClause: '《技术争议项仲裁流转准则》第3.2条',
      },
      {
        id: 'sample_q_3',
        type: 'judge',
        score: 10,
        isKcpMandatory: false,
        question: '所有 B 类缺陷（非致命但影响性能）必须在会后由系统工程师在 5 个工作日内完成闭环并由质量工程师复核验收。',
        options: ['A. 正确', 'B. 错误'],
        correctIndex: 0,
        explanation: 'B类缺陷限期闭环是质量收敛的基本指标。',
        relatedNode: '03 问题收敛整改',
        relatedDocClause: '《缺陷收敛时限管理细则》',
      },
    ];
    setImportQuestionPreviewList(samples);
    setImportFileName('企业标准技术评审案例精选题库包.csv');
    showToast('已载入 3 道行业标准案例题，可直接预览并确认导入！', 'info');
  };

  // 题目导入：确认导入到题库
  const handleConfirmImportQuestions = () => {
    if (importQuestionPreviewList.length === 0) {
      showToast('暂无可导入的试题数据', 'warning');
      return;
    }
    handleUpdateCurrentCourse((prev) => ({
      ...prev,
      questions: [...prev.questions, ...importQuestionPreviewList],
    }));
    showToast(`成功导入 ${importQuestionPreviewList.length} 道案例练习题目！`, 'success');
    setImportQuestionModalOpen(false);
    setImportQuestionPreviewList([]);
    setImportFileName('');
  };

  // 学员做题：选择练习答案
  const handleSelectPracticeAnswer = (qId: string, optionIdx: number) => {
    setPracticeAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  // 考试测验交卷
  const handleSubmitExamTest = async () => {
    if(!currentCourse)return;
    try {const data=await trainingRequest(`/api/training/courses/${currentCourse.id}/exam`,'POST',{revision:currentCourse.revision,answers:examAnswers});acceptCourse(data.course);setExamScore(data.score);setExamSubmitted(true);showToast(data.passed?'考核通过，成绩已保存':'未通过，请查看错题并重新学习',data.passed?'success':'warning');}
    catch(e:any){showToast(e.message,'error');}
  };

  // 过滤当前题库试题
  const filteredQuestions = useMemo(() => {
    if (!currentCourse?.questions) return [];
    if (questionFilterType === 'all') return currentCourse.questions;
    if (questionFilterType === 'kcp') return currentCourse.questions.filter((q) => q.isKcpMandatory);
    return currentCourse.questions.filter((q) => q.type === questionFilterType);
  }, [currentCourse?.questions, questionFilterType]);

  return (
    <div className="h-full flex flex-col bg-[#f8fafc] text-xs">{loading&&<p className="p-4">正在加载课程…</p>}{loadError&&<div className="p-4 text-red-600">{loadError}<button onClick={()=>void loadCourses()}>重新加载</button></div>}{reading&&(()=>{const c=courses.find(c=>c.id===reading.courseId),sec=c?.sections.find(s=>s.id===reading.sectionId);return c&&sec?<div role="dialog" aria-label="章节阅读" className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-8"><div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto space-y-4"><h2 className="text-lg font-bold">{sec.title}</h2><div className="whitespace-pre-wrap text-sm leading-8">{sec.content||'本章节尚未编写内容，请联系课程负责人。'}</div><div className="flex gap-3 justify-end"><button onClick={()=>setReading(null)}>关闭</button><button disabled={!sec.content?.trim()} onClick={()=>void completeSection(c,sec.id)} className="bg-blue-600 disabled:opacity-40 text-white px-4 py-2 rounded">已阅读，记录学习完成</button></div></div></div>:null;})()}
      {/* ========================================================================= */}
      {/* 模式 A：课程详情页 (4个页签：基本设置、课程内容、练习与考核、学习记录) */}
      {/* ========================================================================= */}
      {viewMode === 'detail' && currentCourse ? (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {/* Top Bar for Course Detail */}
          <div className="h-14 border-b border-[#e4e7ed] bg-[#fafafa] px-6 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('catalog')}
                className="h-8 px-2.5 rounded-lg border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-[#606266] text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="返回课程中心目录"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>返回课程列表</span>
              </button>
              <div className="h-4 w-px bg-[#dcdfe6]" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#2f54eb]">{currentCourse.flowCode}</span>
                  <h1 className="text-sm font-bold text-[#1f2733] truncate max-w-md">{currentCourse.title}</h1>
                  <span
                    className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                      currentCourse.importance === '必修'
                        ? 'bg-[#fff1f0] text-[#f5222d] border border-[#ffa39e]'
                        : currentCourse.importance === '进阶'
                        ? 'bg-[#f9f0ff] text-[#722ed1] border border-[#d3adf7]'
                        : 'bg-[#f4f4f5] text-[#595959] border border-[#dcdfe6]'
                    }`}
                  >
                    {currentCourse.importance}
                  </span>
                </div>
                <div className="text-[11px] text-[#909399] flex items-center gap-3 mt-0.5">
                  <span>版本: {currentCourse.approvedVersion?.versionNo || 'V2.0正式版'}</span>
                  <span>·</span>
                  <span>归口: {currentCourse.deptName}</span>
                  <span>·</span>
                  <span>通过合格线: {currentCourse.passingScore} 分</span>
                </div>
              </div>
            </div>

            {canManage&&<button disabled={saving} onClick={()=>void saveCourse(currentCourse).then(saved=>{if(saved)showToast('课程配置已保存','success');})} className="bg-[#2f54eb] text-white rounded-lg px-4 h-8 disabled:opacity-40">{saving?'保存中…':'保存课程配置'}</button>}
            {/* 4 Tabs on Course Details */}
            <div className="flex items-center gap-1 bg-[#f4f4f5] p-1 rounded-xl border border-[#e4e7ed]">
              {[
                { key: 'basic', label: '基本设置', icon: Sliders },
                { key: 'content', label: '课程内容', icon: BookOpen },
                { key: 'assessment', label: '练习与考核', icon: Award },
                { key: 'records', label: '学习记录', icon: BarChart3 },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = detailActiveTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {if(tab.key!=="basic"||canManage)setDetailActiveTab(tab.key as any);}}
                    className={`h-8 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#2f54eb] shadow-xs'
                        : 'text-[#606266] hover:text-[#1f2733]'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.key === 'assessment' && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[#2f54eb]/10 text-[#2f54eb] font-mono">
                        {currentCourse.questions?.length || 0}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Body Viewports */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* ========================================================================= */}
              {/* TAB 1: 基本设置 (Basic Settings) */}
              {/* ========================================================================= */}
              {canManage&&detailActiveTab === 'basic' && (
                <div className="p-6 rounded-xl border border-[#ebeef5] bg-white shadow-2xs space-y-6">
                  <div>
                    <div className="font-bold text-sm text-[#1f2733] flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#2f54eb]" />
                      <span>课程核心属性与业务基线</span>
                    </div>
                    <p className="text-[11px] text-[#909399] mt-0.5">
                      配置流程培训课程的基本元数据、挂接的经批准流程版本及适用受众矩阵
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#606266] block mb-1">课程标题</label>
                      <input
                        type="text"
                        value={currentCourse.title}
                        onChange={(e) => handleUpdateCurrentCourse((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs focus:border-[#2f54eb] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#606266] block mb-1">关联业务流程编码</label>
                      <select aria-label="关联已发布流程" value={currentCourse.flowId} onChange={e=>handleUpdateCurrentCourse(prev=>({...prev,flowId:e.target.value}))} className="w-full h-8 border rounded-lg px-2"><option value="">选择已发布流程</option>{options.flows.map(f=><option key={f.id} value={f.id}>{f.label}（{f.versionNo}）</option>)}</select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#606266] block mb-1">修读属性</label>
                      <select
                        value={currentCourse.importance}
                        onChange={(e) => handleChangeImportance(currentCourse.id, e.target.value as any)}
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs cursor-pointer focus:border-[#2f54eb] focus:outline-hidden"
                      >
                        <option value="必修">必修 (全员或受众岗位必达标)</option>
                        <option value="选修">选修 (自主学习选修)</option>
                        <option value="进阶">进阶 (专业高阶深造)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#606266] block mb-1">规定学时要求</label>
                      <input
                        type="text"
                        value={currentCourse.duration}
                        onChange={(e) => handleUpdateCurrentCourse((prev) => ({ ...prev, duration: e.target.value }))}
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs focus:border-[#2f54eb] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#606266] block mb-1">完成时限 (天)</label>
                      <input
                        type="number"
                        value={currentCourse.deadlineDays}
                        onChange={(e) =>
                          handleUpdateCurrentCourse((prev) => ({ ...prev, deadlineDays: Number(e.target.value) || 30 }))
                        }
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs focus:border-[#2f54eb] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* 挂接已批准流程版本 */}
                  <div className="p-4 rounded-xl border border-[#adc6ff] bg-[#f0f5ff]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-[#1d39c4] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#52c41a]" />
                        <span>挂接已批准的流程基线版本</span>
                      </div>
                      <span className="text-[11px] text-[#2f54eb] font-mono">
                        {currentCourse.approvedVersion?.versionNo}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-[#606266] block mb-1">批准签发人</label>
                        <input
                          type="text"
                          value={currentCourse.approvedVersion?.approver || ''}
                          onChange={(e) =>
                            handleUpdateCurrentCourse((prev) => ({
                              ...prev,
                              approvedVersion: { ...prev.approvedVersion, approver: e.target.value },
                            }))
                          }
                          className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg bg-white text-xs focus:border-[#2f54eb] focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#606266] block mb-1">生效批准时间</label>
                        <input
                          type="text"
                          value={currentCourse.approvedVersion?.approvedAt || ''}
                          onChange={(e) =>
                            handleUpdateCurrentCourse((prev) => ({
                              ...prev,
                              approvedVersion: { ...prev.approvedVersion, approvedAt: e.target.value },
                            }))
                          }
                          className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg bg-white text-xs focus:border-[#2f54eb] focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#606266] block mb-1">制度法规依归</label>
                        <input
                          type="text"
                          value={currentCourse.approvedVersion?.docRef || ''}
                          onChange={(e) =>
                            handleUpdateCurrentCourse((prev) => ({
                              ...prev,
                              approvedVersion: { ...prev.approvedVersion, docRef: e.target.value },
                            }))
                          }
                          className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg bg-white text-xs focus:border-[#2f54eb] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 多维度结构化受众 */}
                  <div className="p-4 rounded-xl border border-[#ebeef5] bg-[#fafafa] space-y-3">
                    <div className="font-bold text-xs text-[#1f2733] flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#2f54eb]" />
                      <span>必修受众与人员范围匹配矩阵</span>
                    </div>

                    <div>
                      <div className="text-[11px] text-[#606266] font-medium mb-1.5">按部门勾选受众：</div>
                      <div className="flex flex-wrap gap-1.5">
                        {availableDepts.map((d) => {
                          const checked = currentCourse.targetDepts?.includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => {
                                const current = currentCourse.targetDepts || [];
                                const next = checked ? current.filter((item) => item !== d) : [...current, d];
                                handleUpdateCurrentCourse((prev) => ({ ...prev, targetDepts: next }));
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

                    <div>
                      <div className="text-[11px] text-[#606266] font-medium mb-1.5">按关键岗位勾选：</div>
                      <div className="flex flex-wrap gap-1.5">
                        {availablePositions.map((p) => {
                          const checked = currentCourse.targetPositions?.includes(p);
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                const current = currentCourse.targetPositions || [];
                                const next = checked ? current.filter((item) => item !== p) : [...current, p];
                                handleUpdateCurrentCourse((prev) => ({ ...prev, targetPositions: next }));
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
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => showToast('课程基本设置已成功保存！', 'success')}
                      className="h-8 px-5 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white font-semibold text-xs cursor-pointer shadow-xs"
                    >
                      保存基本设置
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: 课程内容 (Course Content & Role Playbooks) */}
              {/* ========================================================================= */}
              {detailActiveTab === 'content' && (
                <div className="space-y-6">
                  {currentCourse.practicalTask&&<div className="p-5 bg-white border rounded-xl space-y-2"><h3>实操任务：{currentCourse.practicalTask.taskName}</h3><p>{currentCourse.practicalTask.requirement}</p><textarea aria-label="实操完成说明" value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="填写完成情况和成果位置，提交给复核人" className="border rounded p-2 w-full"/><button onClick={async()=>{try{acceptCourse(await trainingRequest(`/api/training/courses/${currentCourse.id}/practical`,'POST',{revision:currentCourse.revision,evidence}));showToast('实操已提交，等待复核','success');}catch(e:any){showToast(e.message,'error');}}} className="text-blue-600">提交实操成果</button></div>}
                  <div className="p-5 rounded-xl border border-[#ebeef5] bg-white space-y-3">
                    <div className="flex justify-between"><h3 className="font-bold text-sm">学习章节与正文</h3>{canManage&&<button onClick={()=>handleUpdateCurrentCourse(c=>({...c,sections:[...c.sections,{id:crypto.randomUUID(),title:'新章节',content:'',time:'',completed:false}]}))} className="text-blue-600">＋添加章节</button>}</div>
                    {currentCourse.sections.map((sec,i)=><div key={sec.id} className="border rounded-lg p-3 space-y-2">
                      {canManage?<><input aria-label={`章节${i+1}标题`} value={sec.title} onChange={e=>handleUpdateCurrentCourse(c=>({...c,sections:c.sections.map(x=>x.id===sec.id?{...x,title:e.target.value}:x)}))} className="w-full border rounded p-2"/><textarea aria-label={`章节${i+1}正文`} value={sec.content||''} onChange={e=>handleUpdateCurrentCourse(c=>({...c,sections:c.sections.map(x=>x.id===sec.id?{...x,content:e.target.value}:x)}))} className="w-full border rounded p-2 min-h-32"/><button onClick={()=>handleUpdateCurrentCourse(c=>({...c,sections:c.sections.filter(x=>x.id!==sec.id)}))}>删除章节</button></>:<h4>{sec.title}</h4>}
                      <button onClick={()=>handleStudySection(currentCourse.id,i)} className="text-blue-600">{sec.completed?'已完成，重新阅读':'阅读章节'}</button>
                    </div>)}
                    {currentCourse.approvedVersion?.xml&&<FrozenTrainingFlow xml={currentCourse.approvedVersion.xml}/>}
                  </div>
                  {canManage&&<div className="p-5 bg-white border rounded-xl space-y-2"><label className="flex gap-2"><input type="checkbox" checked={!!currentCourse.practicalTask} onChange={e=>handleUpdateCurrentCourse(c=>({...c,requirePracticalConfirmation:e.target.checked,practicalTask:e.target.checked?{taskName:'实操验证',requirement:'',reviewer:''}:undefined}))}/>要求实操复核</label>{currentCourse.practicalTask&&<><input aria-label="实操任务名称" value={currentCourse.practicalTask.taskName} onChange={e=>handleUpdateCurrentCourse(c=>({...c,practicalTask:{...c.practicalTask!,taskName:e.target.value}}))} className="border p-2 rounded w-full"/><textarea aria-label="实操要求" value={currentCourse.practicalTask.requirement} onChange={e=>handleUpdateCurrentCourse(c=>({...c,practicalTask:{...c.practicalTask!,requirement:e.target.value}}))} className="border p-2 rounded w-full"/><select aria-label="实操复核人" value={currentCourse.practicalTask.reviewer} onChange={e=>handleUpdateCurrentCourse(c=>({...c,practicalTask:{...c.practicalTask!,reviewer:e.target.value}}))} className="border p-2 rounded"><option value="">选择复核人</option>{options.users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></>}</div>}
                  {/* 核心学习目标 */}
                  <div className="p-5 rounded-xl border border-[#ebeef5] bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-[#1f2733] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#2f54eb]" />
                        <span>核心能力学习目标 (3—5条明确能力要求)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...(currentCourse.learningObjectives || []), '新技能目标要求描述...'];
                          handleUpdateCurrentCourse((prev) => ({ ...prev, learningObjectives: next }));
                        }}
                        className="text-xs text-[#2f54eb] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" /> 增加目标条目
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentCourse.learningObjectives?.map((obj, i) => (
                        <div key={i} className="p-3 rounded-lg border border-[#e4e7ed] bg-[#fafafa] flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#52c41a] shrink-0 mt-0.5" />
                          <input
                            type="text"
                            value={obj}
                            onChange={(e) => {
                              const next = [...currentCourse.learningObjectives];
                              next[i] = e.target.value;
                              handleUpdateCurrentCourse((prev) => ({ ...prev, learningObjectives: next }));
                            }}
                            className="flex-1 bg-transparent border-0 text-xs text-[#303133] focus:outline-hidden font-medium"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* “我的岗位怎么做” (申请人、审查人、批准人各角色操作指南) */}
                  <div className="p-5 rounded-xl border border-[#adc6ff] bg-gradient-to-b from-[#f0f5ff]/30 to-white shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-[#1d39c4] flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-[#2f54eb]" />
                          <span>“我的岗位怎么做” 角色指引与规范样例 (核心建设)</span>
                        </div>
                        <p className="text-[11px] text-[#909399] mt-0.5">
                          支持按申请人、审查人、批准人等岗位切换，展现输入、动作、输出与合格/缺陷样例对比
                        </p>
                      </div>
                    </div>

                    {/* Role tabs */}
                    <div className="flex items-center gap-2">
                      {currentCourse.rolePlaybooks?.map((rp, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedRoleIdx(i)}
                          className={`px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
                            selectedRoleIdx === i
                              ? 'border-[#2f54eb] bg-[#2f54eb] text-white shadow-xs'
                              : 'border-[#dcdfe6] bg-white text-[#606266] hover:bg-[#f0f5ff]'
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>{rp.roleName}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                            selectedRoleIdx === i ? 'bg-white/20 text-white' : 'bg-[#e4e7ed] text-[#606266]'
                          }`}>
                            {rp.roleBadge}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Active Role Content */}
                    {currentCourse.rolePlaybooks?.[selectedRoleIdx] && (
                      <div className="p-4 rounded-xl border border-[#dcdfe6] bg-white space-y-4">
                        {(() => {
                          const activeRp = currentCourse.rolePlaybooks[selectedRoleIdx];
                          return (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="p-3 rounded-lg bg-[#fafafa] border border-[#e4e7ed]">
                                  <div className="text-[10.5px] text-[#909399]">负责节点</div>
                                  <div className="font-bold text-xs text-[#2f54eb] mt-0.5">{activeRp.nodes.join('、')}</div>
                                </div>
                                <div className="p-3 rounded-lg bg-[#fafafa] border border-[#e4e7ed]">
                                  <div className="text-[10.5px] text-[#909399]">前置输入材料</div>
                                  <div className="font-bold text-xs text-[#1f2733] mt-0.5 truncate" title={activeRp.inputs.join('、')}>
                                    {activeRp.inputs.join('、')}
                                  </div>
                                </div>
                                <div className="p-3 rounded-lg bg-[#fafafa] border border-[#e4e7ed]">
                                  <div className="text-[10.5px] text-[#909399]">输出交付物</div>
                                  <div className="font-bold text-xs text-[#52c41a] mt-0.5 truncate" title={activeRp.outputs.join('、')}>
                                    {activeRp.outputs.join('、')}
                                  </div>
                                </div>
                                <div className="p-3 rounded-lg bg-[#fafafa] border border-[#e4e7ed]">
                                  <div className="text-[10.5px] text-[#909399]">交接对象</div>
                                  <div className="font-bold text-xs text-[#722ed1] mt-0.5">{activeRp.handoverTo}</div>
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-bold text-[#1f2733] mb-2">标准操作动作清单：</div>
                                <div className="space-y-1.5">
                                  {activeRp.actions.map((act, ai) => (
                                    <div key={ai} className="p-2.5 rounded-lg border border-[#e4e7ed] bg-[#fafafa] text-xs text-[#303133] flex items-start gap-2">
                                      <span className="w-4 h-4 rounded-full bg-[#f0f5ff] text-[#2f54eb] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                                        {ai + 1}
                                      </span>
                                      <span className="leading-relaxed">{act}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Good vs Bad Sample */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-[#b7eb8f] bg-[#f6ffed]/40 space-y-2">
                                  <div className="flex items-center gap-1.5 text-[#389e0d] font-bold text-xs">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{activeRp.goodSample.title}</span>
                                  </div>
                                  <p className="text-xs text-[#303133] leading-relaxed">{activeRp.goodSample.desc}</p>
                                  <div className="p-2.5 rounded-lg bg-white border border-[#b7eb8f] text-xs text-[#237804] font-mono leading-relaxed">
                                    {activeRp.goodSample.preview}
                                  </div>
                                </div>

                                <div className="p-4 rounded-xl border border-[#ffa39e] bg-[#fff1f0]/40 space-y-2">
                                  <div className="flex items-center gap-1.5 text-[#cf1322] font-bold text-xs">
                                    <ShieldAlert className="w-4 h-4" />
                                    <span>{activeRp.badSample.title}</span>
                                  </div>
                                  <p className="text-xs text-[#303133] leading-relaxed">{activeRp.badSample.desc}</p>
                                  <div className="p-2.5 rounded-lg bg-white border border-[#ffa39e] text-xs text-[#cf1322] font-mono leading-relaxed">
                                    {activeRp.badSample.warning}
                                  </div>
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

              {/* ========================================================================= */}
              {/* TAB 3: 练习与考核 (Practice & Assessment: 题目配置与通过标准) */}
              {/* ========================================================================= */}
              {detailActiveTab === 'assessment' && (
                <div className="space-y-6">
                  {/* 1. 设置通过标准与考核达标规则卡片 (Core Feature) */}
                  <div className="p-5 rounded-xl border border-[#adc6ff] bg-gradient-to-r from-[#f0f5ff]/60 to-white shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#2f54eb] text-white flex items-center justify-center">
                          <SlidersHorizontal className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-[#1f2733]">设置考核通过标准与达标规则</h2>
                          <p className="text-[11px] text-[#909399]">
                            定义课程及格分数线、时限、补考上限、以及核心 KCP 红线题必须全对等严控标准
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSavePassingCriteria(
                              currentCourse.passingScore,
                              currentCourse.timeLimitMinutes,
                              currentCourse.maxAttempts,
                              currentCourse.kcpAllMustCorrect,
                              currentCourse.requirePracticalConfirmation
                            )
                          }
                          className="h-8 px-4 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>保存通过标准设置</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                      {/* 及格分数线 */}
                      <div className="p-3.5 rounded-xl border border-[#dcdfe6] bg-white space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-[#606266]">
                          <span className="font-medium">及格分数线 (满分100)</span>
                          <span className="font-mono font-bold text-[#2f54eb]">{currentCourse.passingScore} 分</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="60"
                            max="100"
                            step="5"
                            value={currentCourse.passingScore}
                            onChange={(e) =>
                              handleUpdateCurrentCourse((prev) => ({ ...prev, passingScore: Number(e.target.value) }))
                            }
                            className="flex-1 accent-[#2f54eb] cursor-pointer"
                          />
                          <input
                            type="number"
                            min="60"
                            max="100"
                            value={currentCourse.passingScore}
                            onChange={(e) =>
                              handleUpdateCurrentCourse((prev) => ({
                                ...prev,
                                passingScore: Number(e.target.value) || 80,
                              }))
                            }
                            className="w-14 h-7 text-center font-bold font-mono text-xs border border-[#dcdfe6] rounded bg-[#fafafa]"
                          />
                        </div>
                        <div className="text-[10px] text-[#909399]">建议关键质量流程设定不低于 80 分</div>
                      </div>

                      {/* 考试时限 */}
                      <div className="p-3.5 rounded-xl border border-[#dcdfe6] bg-white space-y-1.5">
                        <div className="text-xs text-[#606266] font-medium">考核作答时限</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="10"
                            max="120"
                            value={currentCourse.timeLimitMinutes || 30}
                            onChange={(e) =>
                              handleUpdateCurrentCourse((prev) => ({
                                ...prev,
                                timeLimitMinutes: Number(e.target.value) || 30,
                              }))
                            }
                            className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs font-mono font-semibold"
                          />
                          <span className="text-xs text-[#606266] shrink-0">分钟</span>
                        </div>
                        <div className="text-[10px] text-[#909399]">超时将自动交卷判分</div>
                      </div>

                      {/* 允许补考次数 */}
                      <div className="p-3.5 rounded-xl border border-[#dcdfe6] bg-white space-y-1.5">
                        <div className="text-xs text-[#606266] font-medium">允许补考次数</div>
                        <select
                          value={currentCourse.maxAttempts || 3}
                          onChange={(e) =>
                            handleUpdateCurrentCourse((prev) => ({
                              ...prev,
                              maxAttempts: Number(e.target.value),
                            }))
                          }
                          className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs bg-white cursor-pointer"
                        >
                          <option value={1}>1次 (单次考核，不设补考)</option>
                          <option value={3}>3次 (允许 2 次补考重做)</option>
                          <option value={5}>5次 (专业进阶多次巩固)</option>
                          <option value={0}>无限次 (自主练习模式)</option>
                        </select>
                        <div className="text-[10px] text-[#909399]">达上限后需向管理员申请补训</div>
                      </div>

                      {/* KCP红线题一票否决与实操要求 */}
                      <div className="p-3.5 rounded-xl border border-[#dcdfe6] bg-white space-y-2">
                        <div className="text-xs text-[#606266] font-medium">达标严控条件</div>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-[#303133]">
                          <input
                            type="checkbox"
                            checked={currentCourse.kcpAllMustCorrect ?? true}
                            onChange={(e) =>
                              handleUpdateCurrentCourse((prev) => ({
                                ...prev,
                                kcpAllMustCorrect: e.target.checked,
                              }))
                            }
                            className="rounded text-[#2f54eb]"
                          />
                          <span className="font-medium text-[#cf1322]">KCP 必过题必须全对</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-[#303133]">
                          <input
                            type="checkbox"
                            checked={currentCourse.requirePracticalConfirmation ?? true}
                            onChange={(e) =>
                              handleUpdateCurrentCourse((prev) => ({
                                ...prev,
                                requirePracticalConfirmation: e.target.checked,
                              }))
                            }
                            className="rounded text-[#2f54eb]"
                          />
                          <span>要求主管实操复核签章</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 2. 题目配置与管理操作栏 (Core Feature) */}
                  <div className="p-4 rounded-xl border border-[#ebeef5] bg-white shadow-2xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-sm text-[#1f2733] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#2f54eb]" />
                        <span>试题库配置与管理</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#f0f5ff] text-[#2f54eb]">
                          {currentCourse.questions?.length || 0} 题
                        </span>
                      </div>

                      <div className="h-4 w-px bg-[#ebeef5] mx-1" />

                      {/* 题型过滤 */}
                      <div className="flex items-center gap-1 bg-[#f4f4f5] p-1 rounded-lg">
                        {[
                          { key: 'all', label: '全部' },
                          { key: 'scenario', label: '情景案例题' },
                          { key: 'choice', label: '单选' },
                          { key: 'judge', label: '判断' },
                          { key: 'kcp', label: 'KCP红线题' },
                        ].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setQuestionFilterType(item.key)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                              questionFilterType === item.key
                                ? 'bg-white text-[#2f54eb] shadow-xs'
                                : 'text-[#606266] hover:text-[#1f2733]'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Actions: 上传案例练习题 + 手动添加 + 模式切换 */}
                    <div className="flex items-center gap-2">
                      {/* 上传案例练习题按钮 */}
                      <button
                        type="button"
                        onClick={() => {
                          setImportQuestionPreviewList([]);
                          setImportFileName('');
                          setImportQuestionModalOpen(true);
                        }}
                        className="h-8 px-3 rounded-lg border border-[#adc6ff] bg-[#f0f5ff] hover:bg-[#2f54eb] text-[#2f54eb] hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                        title="支持通过 Excel/CSV 批量上传情景案例试题包"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>上传案例练习题</span>
                      </button>

                      {/* 手动新增试题 */}
                      <button
                        type="button"
                        onClick={() => {
                          setQuestionEditModal({
                            open: true,
                            isCreate: true,
                            data: {
                              id: '',
                              type: 'scenario',
                              score: 20,
                              isKcpMandatory: true,
                              question: '',
                              scenarioContext: '',
                              options: ['选项 A', '选项 B', '选项 C', '选项 D'],
                              correctIndex: 1,
                              explanation: '',
                              relatedNode: '02 同行交叉审查 (KCP-01)',
                              relatedDocClause: '《IPD技术评审规范》',
                            },
                          });
                        }}
                        className="h-8 px-3 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>手动添加题目</span>
                      </button>

                      <div className="h-4 w-px bg-[#ebeef5]" />

                      {/* 管理模式 vs 学员做题体验模式切换 */}
                      <div className="flex items-center gap-1 bg-[#f0f0f0] p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setAssessmentMode('manage')}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                            canManage && assessmentMode === 'manage' ? 'bg-white text-[#1f2733] shadow-xs' : 'text-[#606266]'
                          }`}
                        >
                          题目配置模式
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAssessmentMode('test');
                            setPracticeAnswers({});
                            setExamSubmitted(false);
                            setExamAnswers({});
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                            assessmentMode === 'test' ? 'bg-[#52c41a] text-white shadow-xs' : 'text-[#606266]'
                          }`}
                        >
                          模拟答题自测
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. 试题列表展示 (题目配置模式 vs 答题测试模式) */}
                  {canManage && assessmentMode === 'manage' ? (
                    <div className="space-y-4">
                      {filteredQuestions.length === 0 ? (
                        <div className="p-12 text-center text-[#909399] bg-white rounded-xl border border-[#ebeef5]">
                          <FileText className="w-10 h-10 text-[#dcdfe6] mx-auto mb-2" />
                          <div className="font-semibold text-xs text-[#606266]">暂无符合筛选条件的试题</div>
                          <p className="text-[11px] mt-1">点击右上角“上传案例练习题”或“手动添加题目”快速构建题库</p>
                        </div>
                      ) : (
                        filteredQuestions.map((q, idx) => (
                          <div
                            key={q.id}
                            className={`p-5 rounded-xl border bg-white shadow-2xs space-y-3 relative transition-all ${
                              q.isKcpMandatory ? 'border-l-4 border-l-[#cf1322]' : 'border-[#ebeef5]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-xs font-mono text-[#2f54eb] bg-[#f0f5ff] px-2 py-0.5 rounded">
                                    第 {idx + 1} 题
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f4f4f5] text-[#595959]">
                                    {q.type === 'scenario'
                                      ? '情景案例题'
                                      : q.type === 'choice'
                                      ? '单选题'
                                      : q.type === 'multi'
                                      ? '多选题'
                                      : '判断题'}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-[#f0f5ff] text-[#2f54eb]">
                                    {q.score || 20} 分
                                  </span>
                                  {q.isKcpMandatory && (
                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#fff1f0] text-[#cf1322] border border-[#ffa39e]">
                                      ★ KCP 核心红线必过题
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-bold text-sm text-[#1f2733] leading-snug">{q.question}</h3>
                                {q.scenarioContext && (
                                  <div className="p-2.5 rounded-lg bg-[#f8fafc] border border-[#e4e7ed] text-xs text-[#606266] leading-relaxed">
                                    <span className="font-semibold text-[#1f2733]">【情景背景】：</span>
                                    {q.scenarioContext}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuestionEditModal({
                                      open: true,
                                      isCreate: false,
                                      data: JSON.parse(JSON.stringify(q)),
                                    });
                                  }}
                                  className="h-7 px-2.5 rounded border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-[#606266] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>编辑</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="h-7 px-2 rounded border border-[#ffa39e] bg-[#fff1f0] hover:bg-[#cf1322] text-[#cf1322] hover:text-white text-xs font-medium cursor-pointer transition-colors"
                                  title="删除此题"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = optIdx === q.correctIndex;
                                return (
                                  <div
                                    key={optIdx}
                                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                      isCorrect
                                        ? 'border-[#b7eb8f] bg-[#f6ffed] text-[#135200] font-semibold'
                                        : 'border-[#e4e7ed] bg-[#fafafa] text-[#606266]'
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    {isCorrect && (
                                      <span className="text-[11px] text-[#52c41a] font-bold flex items-center gap-1">
                                        <CheckCircle className="w-3.5 h-3.5" /> 正确答案
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Deep Explanation & Linkages */}
                            <div className="p-3 rounded-lg bg-[#fafafa] border border-[#e4e7ed] space-y-1.5 text-xs">
                              <div className="font-semibold text-xs text-[#2f54eb]">深度答案解析：</div>
                              <p className="text-[#595959] leading-relaxed">{q.explanation}</p>
                              <div className="pt-1.5 border-t border-[#ebeef5] flex items-center gap-4 text-[11px] text-[#909399] flex-wrap">
                                <span>关联流程节点：<strong className="text-[#1f2733] font-medium">{q.relatedNode}</strong></span>
                                <span>制度条款依归：<strong className="text-[#1f2733] font-medium">{q.relatedDocClause}</strong></span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    /* 模拟答题测试模式 */
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-[#b7eb8f] bg-[#f6ffed] flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-bold text-xs text-[#135200]">当前处于【模拟学员测验模式】</div>
                          <p className="text-[11px] text-[#237804]">
                            即做即判：可在线模拟作答并检验及格分计算与 KCP 红线题拦截机制
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {examSubmitted && examScore !== null && (
                            <span className="font-mono font-bold text-base text-[#135200]">
                              模拟得分：{examScore} 分
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={handleSubmitExamTest}
                            className="h-8 px-4 rounded-lg bg-[#52c41a] hover:bg-[#389e0d] text-white font-bold text-xs cursor-pointer shadow-xs"
                          >
                            {examSubmitted ? '重新测试交卷' : '交卷模拟判分'}
                          </button>
                        </div>
                      </div>

                      {filteredQuestions.map((q, idx) => {
                        const selectedOpt = examAnswers[q.id];
                        const isAnswered = selectedOpt !== undefined;
                        const isCorrect = selectedOpt === q.correctIndex;

                        return (
                          <div
                            key={q.id}
                            className={`p-5 rounded-xl border bg-white shadow-2xs space-y-3 ${
                              examSubmitted
                                ? isCorrect
                                  ? 'border-[#b7eb8f]'
                                  : 'border-[#ffa39e]'
                                : 'border-[#ebeef5]'
                            }`}
                          >
                            <div className="font-bold text-sm text-[#1f2733]">
                              {idx + 1}. {q.question}
                            </div>
                            {q.scenarioContext && (
                              <div className="p-2.5 rounded-lg bg-[#f8fafc] text-xs text-[#606266]">
                                【情景】：{q.scenarioContext}
                              </div>
                            )}

                            <div className="space-y-2">
                              {q.options.map((opt, optIdx) => {
                                const isChecked = selectedOpt === optIdx;
                                return (
                                  <label
                                    key={optIdx}
                                    className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                                      isChecked
                                        ? 'border-[#2f54eb] bg-[#f0f5ff] text-[#2f54eb] font-semibold'
                                        : 'border-[#dcdfe6] bg-white text-[#303133] hover:bg-[#fafafa]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <input
                                        type="radio"
                                        name={`exam_radio_${q.id}`}
                                        checked={isChecked}
                                        onChange={() => setExamAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                        className="text-[#2f54eb]"
                                      />
                                      <span>{opt}</span>
                                    </div>
                                    {examSubmitted && optIdx === q.correctIndex && (
                                      <span className="text-[#52c41a] font-bold text-xs flex items-center gap-1">
                                        <CheckCircle className="w-3.5 h-3.5" /> 正确答案
                                      </span>
                                    )}
                                  </label>
                                );
                              })}
                            </div>

                            {examSubmitted && (
                              <div className="p-3 rounded-lg bg-[#fafafa] border border-[#e4e7ed] text-xs space-y-1">
                                <div className={isCorrect ? 'text-[#389e0d] font-bold' : 'text-[#cf1322] font-bold'}>
                                  {isCorrect ? '解析：' : '错题依据剖析：'}
                                </div>
                                <p className="text-[#595959]">{q.explanation}</p>
                                <div className="text-[11px] text-[#909399] pt-1 border-t border-[#ebeef5]">
                                  依据节点：{q.relatedNode} · 制度条款：{q.relatedDocClause}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 4: 学习记录 (Learning Records & Analytics) */}
              {/* ========================================================================= */}
              {detailActiveTab === 'records' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg border border-[#ebeef5] bg-[#fafafa] text-center">
                      <div className="text-[11px] text-[#909399]">必修总学员</div>
                      <div className="font-bold text-base text-[#1f2733] font-mono mt-0.5">
                        {currentCourse.records?.length || 0} 人
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-[#b7eb8f] bg-[#f6ffed] text-center">
                      <div className="text-[11px] text-[#389e0d]">考核已通过</div>
                      <div className="font-bold text-base text-[#389e0d] font-mono mt-0.5">
                        {currentCourse.records?.filter((r) => r.examStatus === 'passed').length || 0} 人
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-[#adc6ff] bg-[#f0f5ff] text-center">
                      <div className="text-[11px] text-[#2f54eb]">实操已确认</div>
                      <div className="font-bold text-base text-[#2f54eb] font-mono mt-0.5">
                        {currentCourse.records?.filter((r) => r.practiceConfirmed).length || 0} 人
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-[#ffa39e] bg-[#fff1f0] text-center">
                      <div className="text-[11px] text-[#cf1322]">待补考/未达标</div>
                      <div className="font-bold text-base text-[#cf1322] font-mono mt-0.5">
                        {currentCourse.records?.filter((r) => r.examStatus !== 'passed').length || 0} 人
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-[#1f2733]">学员掌握进度与学情明细表</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => showToast('已成功向待补考学员发送催学通知短信与站内信', 'success')}
                        className="h-7 px-3 rounded-lg border border-[#adc6ff] bg-[#f0f5ff] text-[#2f54eb] text-xs font-semibold cursor-pointer hover:bg-[#2f54eb] hover:text-white transition-colors"
                      >
                        一键通知补学补考
                      </button>
                    </div>
                  </div>

                  <div className="border border-[#ebeef5] rounded-lg overflow-hidden bg-white">
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
                        {currentCourse.records?.map((rec) => (
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
                                <span className="text-[#909399] text-[11px]">待复核{currentCourse.canReview&&rec.evidence&&rec.userId&&rec.userId!==currentUser?.id&&<button onClick={()=>void confirmRecord(currentCourse,rec.userId!)} className="ml-2 text-blue-600">确认实操</button>}</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-[#595959] text-[11px]">
                              {rec.weakPoints?.join('、') || '暂无'}
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
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 模式 B：课程总览目录 (Course Catalog View) */
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
                      “流程原文＋岗位讲解＋案例练习＋考核验证” 体系
                    </span>
                  </div>
                  <p className="text-[#909399] text-xs mt-0.5">
                    当前学员：{currentUser?.userName || '系统员工'} · 归属：{currentUser?.deptName || '研发管理中心'} · 点击任意课程进入 4 个页签详情与配置
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

                <button
                  type="button"
                  disabled={!canManage} hidden={!canManage} onClick={() => setManageModalOpen(true)}
                  className="h-8 px-3.5 rounded-lg border border-[#adc6ff] bg-[#f0f5ff] hover:bg-[#2f54eb] text-[#2f54eb] hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  title="管理课程大纲、编辑必修/选修属性与时限"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>管理全部课程</span>
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
                      onClick={() => {
                        setSelectedCourse(c);setExamSubmitted(false);setExamScore(null);setExamAnswers({});
                        setViewMode('detail');
                        setDetailActiveTab('assessment');
                      }}
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
                            <span>试题：{c.questions?.length || 0} 题</span>
                            <span>合格线：{c.passingScore} 分</span>
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
                              setSelectedCourse(c);setExamSubmitted(false);setExamScore(null);setExamAnswers({});
                              setViewMode('detail');
                              setDetailActiveTab('assessment');
                            }}
                            className="h-7 px-3 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>课程详情与配置 (4页签)</span>
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

            {/* Right: Quick Course Preview */}
            <div className="w-96 flex flex-col bg-white rounded-xl border border-[#ebeef5] shadow-2xs overflow-hidden shrink-0">
              {currentCourse ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-4 border-b border-[#ebeef5] bg-[#fafafa]">
                    <div className="flex items-center justify-between text-xs text-[#909399] mb-1">
                      <span>快速选定课程</span>
                      <span className="font-mono">{currentCourse.flowCode}</span>
                    </div>
                    <h2 className="font-bold text-sm text-[#1f2733] leading-snug">{currentCourse.title}</h2>

                    <div className="mt-3 p-2.5 rounded-lg bg-white border border-[#dcdfe6] space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#606266]">修读属性：</span>
                        <span className="font-bold text-[#f5222d]">{currentCourse.importance}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#606266]">考核及格线：</span>
                        <span className="font-mono font-bold text-[#2f54eb]">{currentCourse.passingScore} 分</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#606266]">题库数量：</span>
                        <span className="font-mono font-bold">{currentCourse.questions?.length || 0} 题</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('detail');
                        setDetailActiveTab('assessment');
                      }}
                      className="w-full h-8 mt-3 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Sliders className="w-4 h-4" />
                      <span>进入课程详情页 (4页签)</span>
                    </button>
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto space-y-3">
                    <div className="text-xs font-bold text-[#1f2733] flex items-center justify-between">
                      <span>大纲章节 ({currentCourse.sections.length} 节)</span>
                      <span className="text-[11px] text-[#52c41a] font-mono">
                        完成 {currentCourse.sections.filter((s) => s.completed).length} / {currentCourse.sections.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {currentCourse.sections.map((sec, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                            sec.completed
                              ? 'border-[#b7eb8f] bg-[#f6ffed]/40 text-[#135200]'
                              : 'border-[#dcdfe6] bg-white text-[#303133]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {sec.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#52c41a]" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-[#dcdfe6] inline-block" />
                            )}
                            <span className="font-medium truncate max-w-[180px]">{sec.title}</span>
                          </div>
                          {!sec.completed && (
                            <button
                              type="button"
                              onClick={() => handleStudySection(currentCourse.id, idx)}
                              className="h-6 px-2 rounded bg-[#2f54eb] text-white text-[10.5px] font-semibold cursor-pointer"
                            >
                              阅读打卡
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#909399]">
                  <BookOpen className="w-10 h-10 text-[#dcdfe6] mb-2" />
                  <div className="font-semibold text-xs text-[#606266]">请选择一门课程查看详情</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 弹窗 1：上传案例练习题 (Upload / Batch Import Questions Modal) */}
      {/* ========================================================================= */}
      {importQuestionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-[#ebeef5] overflow-hidden animate-in fade-in duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#2f54eb] text-white flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1f2733]">批量上传与导入案例练习题</h2>
                  <p className="text-[11px] text-[#909399]">
                    支持上传 Excel (.xlsx) / CSV 格式题库包，智能解析题干、选项、答案、深度解析与关联流程节点
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportQuestionModalOpen(false)}
                className="w-7 h-7 rounded hover:bg-[#ebeef5] flex items-center justify-center text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Dropzone */}
              <label className="p-6 rounded-xl border-2 border-dashed border-[#adc6ff] bg-[#f0f5ff]/30 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#f0f5ff]/60 transition-colors block">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={handleFileSelectQuestionImport}
                  className="hidden"
                />
                <FileSpreadsheet className="w-10 h-10 text-[#2f54eb] mb-2" />
                <p className="text-xs font-bold text-[#1f2733] mb-1">
                  点击浏览或拖拽 Excel (.xlsx) / CSV 题库文件至此处上传
                </p>
                <p className="text-[11px] text-[#909399]">
                  包含列：题型、分值、是否KCP必过、情景描述、题干、选项A~D、正确答案、深度解析、关联节点、制度条款
                </p>
                {importFileName && (
                  <div className="mt-2 text-xs font-semibold text-[#2f54eb] bg-white px-3 py-1 rounded-full border border-[#adc6ff] shadow-2xs">
                    当前选定文件：{importFileName}
                  </div>
                )}
              </label>

              {/* Actions & Template Download */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQuestionTemplate}
                    className="h-7 px-3 rounded-lg border border-[#adc6ff] bg-[#f0f5ff] text-[#2f54eb] text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-[#2f54eb] hover:text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下载案例练习题标准导入模板.csv</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSampleQuestionPackage}
                    className="h-7 px-3 rounded-lg border border-[#dcdfe6] bg-white text-[#606266] text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-[#fafafa] transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#e6a23c]" />
                    <span>一键载入标准案例精选题包</span>
                  </button>
                </div>

                <div className="text-xs text-[#606266]">
                  待导入题目预览：<strong className="text-[#2f54eb] font-mono">{importQuestionPreviewList.length}</strong> 题
                </div>
              </div>

              {/* Parsed Preview Table */}
              {importQuestionPreviewList.length > 0 && (
                <div className="border border-[#ebeef5] rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#fafafa] text-[#606266] border-b border-[#ebeef5]">
                      <tr>
                        <th className="py-2.5 px-3 w-16">题型</th>
                        <th className="py-2.5 px-3 w-16">分值</th>
                        <th className="py-2.5 px-3 w-20">KCP红线</th>
                        <th className="py-2.5 px-3">题目题干与情景</th>
                        <th className="py-2.5 px-3 w-28">正确答案</th>
                        <th className="py-2.5 px-3 w-40">关联流程节点</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebeef5]">
                      {importQuestionPreviewList.map((q, i) => (
                        <tr key={i} className="hover:bg-[#f9fafc]">
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#f0f5ff] text-[#2f54eb] font-medium">
                              {q.type === 'scenario' ? '情景题' : q.type === 'choice' ? '单选' : '判断'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#2f54eb]">{q.score}分</td>
                          <td className="py-2.5 px-3">
                            {q.isKcpMandatory ? (
                              <span className="text-[#cf1322] font-bold text-[10.5px]">必过★</span>
                            ) : (
                              <span className="text-[#909399] text-[10.5px]">常规</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-[#1f2733] truncate max-w-sm" title={q.question}>
                              {q.question}
                            </div>
                            {q.scenarioContext && (
                              <div className="text-[10.5px] text-[#909399] truncate max-w-sm">{q.scenarioContext}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-[#52c41a]">
                            选项 {String.fromCharCode(65 + q.correctIndex)}
                          </td>
                          <td className="py-2.5 px-3 text-[#2f54eb] truncate max-w-[150px]" title={q.relatedNode}>
                            {q.relatedNode}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="text-xs text-[#909399]">
                导入后题目将立即追加至课程《{currentCourse.title}》中
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImportQuestionModalOpen(false)}
                  className="h-8 px-4 rounded-lg border border-[#dcdfe6] text-xs font-semibold text-[#606266] hover:bg-white cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImportQuestions}
                  disabled={importQuestionPreviewList.length === 0}
                  className={`h-8 px-5 rounded-lg text-white text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                    importQuestionPreviewList.length > 0 ? 'bg-[#2f54eb] hover:bg-[#1d39c4]' : 'bg-[#dcdfe6] cursor-not-allowed'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>确认批量导入 ({importQuestionPreviewList.length} 题)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 弹窗 2：手动添加 / 编辑试题弹窗 (Manual Question Modal) */}
      {/* ========================================================================= */}
      {questionEditModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-[#ebeef5] overflow-hidden animate-in fade-in duration-150">
            {/* Header */}
            <div className="px-6 py-3.5 border-b border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#2f54eb]" />
                <h3 className="text-sm font-bold text-[#1f2733]">
                  {questionEditModal.isCreate ? '录入新案例/考核题目' : '编辑测试题目'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuestionEditModal({ ...questionEditModal, open: false })}
                className="w-7 h-7 rounded hover:bg-[#ebeef5] flex items-center justify-center text-[#909399] hover:text-[#1f2733] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-[#606266] block mb-1">题目类型 *</label>
                  <select
                    value={questionEditModal.data.type}
                    onChange={(e) =>
                      setQuestionEditModal({
                        ...questionEditModal,
                        data: { ...questionEditModal.data, type: e.target.value as any },
                      })
                    }
                    className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs bg-white cursor-pointer"
                  >
                    <option value="scenario">情景案例分析题</option>
                    <option value="choice">单项选择题</option>
                    <option value="multi">多项选择题</option>
                    <option value="judge">判断题</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-[#606266] block mb-1">题目分值 *</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={questionEditModal.data.score || 20}
                    onChange={(e) =>
                      setQuestionEditModal({
                        ...questionEditModal,
                        data: { ...questionEditModal.data, score: Number(e.target.value) || 20 },
                      })
                    }
                    className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs font-mono font-bold text-[#2f54eb]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#606266] block mb-1">控制点红线属性</label>
                  <label className="flex items-center gap-2 h-8 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={questionEditModal.data.isKcpMandatory ?? false}
                      onChange={(e) =>
                        setQuestionEditModal({
                          ...questionEditModal,
                          data: { ...questionEditModal.data, isKcpMandatory: e.target.checked },
                        })
                      }
                      className="rounded text-[#2f54eb]"
                    />
                    <span className="text-xs font-bold text-[#cf1322]">KCP 必过题 (一票否决)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#606266] block mb-1">情景背景说明 (可选)</label>
                <textarea
                  rows={2}
                  value={questionEditModal.data.scenarioContext || ''}
                  onChange={(e) =>
                    setQuestionEditModal({
                      ...questionEditModal,
                      data: { ...questionEditModal.data, scenarioContext: e.target.value },
                    })
                  }
                  placeholder="例如：在 TR4 阶段遇到客户催单，但环境可靠性测试报告尚在第三方实验室..."
                  className="w-full p-2.5 rounded-lg border border-[#dcdfe6] text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#606266] block mb-1">题目题干 *</label>
                <input
                  type="text"
                  value={questionEditModal.data.question}
                  onChange={(e) =>
                    setQuestionEditModal({
                      ...questionEditModal,
                      data: { ...questionEditModal.data, question: e.target.value },
                    })
                  }
                  placeholder="例如：系统工程师能否在关键测试报告未出具的情况下，通过评审放行？"
                  className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg text-xs"
                />
              </div>

              {/* 选项与正确答案标记 */}
              <div className="space-y-2">
                <label className="text-[11px] text-[#606266] block font-medium">
                  选项配置 (单选按钮标记哪一个为正确答案)
                </label>
                {questionEditModal.data.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct_radio"
                      checked={questionEditModal.data.correctIndex === i}
                      onChange={() =>
                        setQuestionEditModal({
                          ...questionEditModal,
                          data: { ...questionEditModal.data, correctIndex: i },
                        })
                      }
                      className="text-[#2f54eb]"
                    />
                    <span className="font-mono font-bold text-xs text-[#909399] w-4">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const nextOpts = [...questionEditModal.data.options];
                        nextOpts[i] = e.target.value;
                        setQuestionEditModal({
                          ...questionEditModal,
                          data: { ...questionEditModal.data, options: nextOpts },
                        });
                      }}
                      className="flex-1 h-7 px-2.5 border border-[#dcdfe6] rounded text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-[#606266] block mb-1">关联流程节点</label>
                  <input
                    type="text"
                    value={questionEditModal.data.relatedNode}
                    onChange={(e) =>
                      setQuestionEditModal({
                        ...questionEditModal,
                        data: { ...questionEditModal.data, relatedNode: e.target.value },
                      })
                    }
                    placeholder="例如：02 同行交叉审查 (KCP-01)"
                    className="w-full h-7 px-2.5 border border-[#dcdfe6] rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#606266] block mb-1">制度条款依归</label>
                  <input
                    type="text"
                    value={questionEditModal.data.relatedDocClause}
                    onChange={(e) =>
                      setQuestionEditModal({
                        ...questionEditModal,
                        data: { ...questionEditModal.data, relatedDocClause: e.target.value },
                      })
                    }
                    placeholder="例如：《IPD质量红线管理规范》第4.2款"
                    className="w-full h-7 px-2.5 border border-[#dcdfe6] rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#606266] block mb-1">
                  深度答案解析 (解释为什么正确、为什么错误、依据何在)
                </label>
                <textarea
                  rows={3}
                  value={questionEditModal.data.explanation}
                  onChange={(e) =>
                    setQuestionEditModal({
                      ...questionEditModal,
                      data: { ...questionEditModal.data, explanation: e.target.value },
                    })
                  }
                  placeholder="详细阐述该选项判定的业务依据、质量控制红线逻辑与防范违规的操作要领..."
                  className="w-full p-2.5 rounded-lg border border-[#dcdfe6] text-xs resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setQuestionEditModal({ ...questionEditModal, open: false })}
                className="h-8 px-4 rounded border border-[#dcdfe6] text-xs text-[#606266] hover:bg-white cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveSingleQuestion}
                className="h-8 px-5 rounded bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                保存题目
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 全局课程快捷管理弹窗 */}
      {/* ========================================================================= */}
      {manageModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl border border-[#ebeef5] overflow-hidden animate-in fade-in duration-150">
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

            <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
              {canManage&&<div className="flex flex-wrap gap-2 border rounded-lg p-3"><input aria-label="新课程名称" placeholder="新课程名称" value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="border rounded p-2"/><select aria-label="新课程关联流程" value={newFlow} onChange={e=>setNewFlow(e.target.value)} className="border rounded p-2"><option value="">选择已发布流程</option>{options.flows.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select><button onClick={()=>void createCourse()} className="bg-blue-600 text-white rounded px-3">新增课程</button>{!options.flows.length&&<p>暂无已批准发布的流程，请先完成流程模型发布。</p>}</div>}
              <div className="border border-[#ebeef5] rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#fafafa] text-[#606266] border-b border-[#ebeef5]">
                    <tr>
                      <th className="py-2.5 px-3 w-14">序号</th>
                      <th className="py-2.5 px-3">流程编号与课程名称</th>
                      <th className="py-2.5 px-3 w-28">业务归口</th>
                      <th className="py-2.5 px-3 w-36">修读属性 (直接切换)</th>
                      <th className="py-2.5 px-3 w-48">适用对象与受众范围</th>
                      <th className="py-2.5 px-3 w-32 text-center">操作</th>
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
                        <td className="py-2.5 px-3 text-[#606266] truncate max-w-[180px]">
                          {c.targetAudience}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCourse(c);setExamSubmitted(false);setExamScore(null);setExamAnswers({});
                              setViewMode('detail');
                              setDetailActiveTab('assessment');
                              setManageModalOpen(false);
                            }}
                            className="h-6 px-2.5 rounded bg-[#f0f5ff] hover:bg-[#2f54eb] text-[#2f54eb] hover:text-white text-[11px] font-semibold cursor-pointer transition-colors"
                          >
                            配置4页签
                          </button>{canManage&&<button onClick={()=>void removeCourse(c)} className="text-red-600 ml-2">归档</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setManageModalOpen(false)}
                className="h-8 px-5 rounded-lg bg-[#2f54eb] hover:bg-[#1d39c4] text-white text-xs font-semibold cursor-pointer shadow-2xs"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
