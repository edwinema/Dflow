import React, { useState, useMemo } from 'react';
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
  };

  // 2. 学习目标 (3-5条能力要求)
  learningObjectives: string[];

  // 3. 章节大纲
  sections: { title: string; time: string; completed: boolean; type?: string }[];

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

  // 可选部门与岗位库
  const availableDepts = ['研发管理中心', '质量控制部', '系统管理部', '市场营销部', '供应链管理部', '需求工程部', '集成电路设计院', '法律合规与内控部'];
  const availablePositions = ['首席系统架构师', '系统工程师', '质量管理工程师', '研发总监', '测试验证专家', '敏捷需求工程师', '商务销售经理', '合规审计专员'];
  const availableRoles = ['流程发起人 (申请人)', '同行交叉评审人 (审查人)', 'TRB决议审批人 (批准人)', 'KCP风险控制监督人'];

  // 初始化核心课程数据，深度落地“流程原文＋岗位讲解＋案例练习＋考核验证”
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
      targetAudience: '研发管理中心、质量控制部、系统工程师、质量工程师 (必修)',
      targetDepts: ['研发管理中心', '质量控制部'],
      targetPositions: ['系统工程师', '质量管理工程师', '首席系统架构师'],
      targetRoles: ['流程发起人 (申请人)', '同行交叉评审人 (审查人)', 'TRB决议审批人 (批准人)'],
      deadlineDays: 30,
      summary: '面向研发、质控与TRB委员会，系统讲解技术评审发起门槛、KCP-01同行审查及TRB决议裁决规范。',
      lastStudyTime: '2026-03-22 14:30',

      approvedVersion: {
        versionNo: 'V2.0 (已批准正式生效)',
        approvedAt: '2026-03-20 16:30',
        approver: '李四 (质量管理总监)',
        changeSummary: '新增TRB决议质量红线裁决节点，完善KCP风险合规检查项与交付物自查清单。',
        docRef: '《IPD技术评审与质量门禁管理条例 (2026修订版)》第3.2条',
      },

      learningObjectives: [
        '1. 掌握技术评审发起准入门槛与自查清单，能够独立完成提请材料齐套性校验（自查达标率 100%）。',
        '2. 掌握同行交叉审查中 KCP-01 缺陷判定标准（A/B/C 类缺陷界定），并出具规范性审查意见表。',
        '3. 明确 TRB 裁决会签红线与 DOA 权责，严格执行“关键验证报告不齐备绝不放行”的质量铁律。',
        '4. 掌握缺陷收敛闭环跟踪机制，确保从问题提出到上线验收的全生命周期归口清零。',
      ],

      sections: [
        { title: '一、流程背景与适用边界', time: '10分钟', completed: true, type: '流程原文' },
        { title: '二、系统工程师提请材料规范与自查清单', time: '12分钟', completed: true, type: '岗位指引' },
        { title: '三、同行交叉审查与KCP-01把关标准', time: '13分钟', completed: true, type: '关键控制' },
        { title: '四、TRB决议裁决会签与缺陷闭环终审', time: '10分钟', completed: false, type: '案例考核' },
      ],

      rolePlaybooks: [
        {
          roleName: '系统工程师',
          roleBadge: '流程发起人 / 申请人',
          roleDesc: '负责技术评审发起申报、架构与验证材料准备、会前自查及缺陷收敛闭环。',
          nodes: ['01 发起技术评审', '03 问题收敛整改'],
          inputs: ['《系统架构规格书》', '《接口定义字典》', '《验证测试报告》', '《前置自查清单》'],
          actions: [
            '1. 对照《技术评审前置核查表》逐项自检，确认无逻辑硬伤与缺项；',
            '2. 在系统中准确关联需求编号与基线版本，上传齐套材料发起评审流转；',
            '3. 会后 48 小时内完成评审意见逐条响应，组织开发团队完成缺陷整改并提交回归证据。',
          ],
          outputs: ['《技术评审申报包》', '《问题缺陷整改闭环跟踪表》'],
          handoverTo: '同行专家评审组 (审查人)',
          goodSample: {
            title: '合格样例：TRB-01 评审材料齐备规范',
            desc: '包含完整的软硬件接口拓扑、高低温压力实测曲线、关键时序容限分析，自查签署完备，无任何缺项。',
            preview: '【符合规范】各模块责任人均签字确认，架构图具备可追溯性，符合进门标准。',
          },
          badSample: {
            title: '不合格典型样例：材料缺失且存在逻辑断层',
            desc: '未提供极端工况压力测试数据，仅以“待上线后测试补齐”为由强行提请，自查表存在空项。',
            warning: '【红线警告】触发 KCP-01 门禁拦截，一律直接驳回退单，不予安排评审会议！',
          },
          kcpCheckpoints: [
            '材料齐套率必须达到 100%，自查清单必须有主架构师手签确认。',
            '所有遗留缺陷必须具备明确责任人与闭环承诺时间（不超过5个工作日）。',
          ],
        },
        {
          roleName: '同行专家 / 质量工程师',
          roleBadge: '同行审查人 / KCP把关',
          roleDesc: '负责对技术设计进行客观交叉评审，识别潜在风险并界定缺陷严重级别。',
          nodes: ['02 同行交叉审查 (KCP-01)'],
          inputs: ['系统工程师申报材料包', '历史故障知识库', '质量度量指标要求'],
          actions: [
            '1. 独立研读提请材料，比对行业基线与质量红线，出具书面预审意见；',
            '2. 重点审查故障树分析（FTA）与容灾降级策略，界定缺陷等级（A/B/C）；',
            '3. 签署同行交叉审查决议，明确指出是否满足进入 TRB 终审的准入条件。',
          ],
          outputs: ['《同行交叉审查评审意见表》', '《A/B类缺陷清单》'],
          handoverTo: 'TRB决议委员会 (批准人)',
          goodSample: {
            title: '合格样例：穿透式缺陷定位与整改建议',
            desc: '明确指出接口超时重试机制在极端网络抖动下的死锁风险，并附带改进伪代码与验证标准。',
            preview: '【优秀示范】缺陷定级准确（A类），整改验收标准清晰量化。',
          },
          badSample: {
            title: '不合格典型样例：泛泛而谈“原则同意”',
            desc: '未深入核实测试用例覆盖率，仅简述“方案基本可行”，未识别出已知的内存泄漏隐患。',
            warning: '【违规警示】审查不实造成漏测逃逸的，审查人承担连带质量考核责任。',
          },
          kcpCheckpoints: [
            '存在 1 项未整改完成的 A 类致命缺陷时，必须一票否决，不得出具“同意”决议。',
            '审查意见必须在 3 个工作日内正式反馈。',
          ],
        },
        {
          roleName: 'TRB 评审委员会',
          roleBadge: '终审裁决人 / 决策批准',
          roleDesc: '负责根据评审报告与质量风险评估，做出通过、附条件通过或否决驳回的最高裁决。',
          nodes: ['04 TRB 决议裁决 (KCP-02)'],
          inputs: ['同行审查汇总报告', '整改闭环证据', '交付工期与质量风险评估'],
          actions: [
            '1. 听取研发团队整改汇报，质询关键遗留问题与技术负债；',
            '2. 综合评估商业交付要求与产品质量风险，严禁因进度压力放行红线缺陷；',
            '3. 签署正式《TRB技术决议书》，发布至流程资产中心。',
          ],
          outputs: ['《TRB决议裁决书 (正式版)》', '《技术基线固化批准单》'],
          handoverTo: '项目经理与全员流程资产看板',
          goodSample: {
            title: '合格样例：严谨裁决与附条件闭环督办',
            desc: '裁决书不仅明确结论，且对附带条件限定在次日18:00前由质量总监单签验收，责任清晰。',
            preview: '【规范决策】满足 DOA 授权矩阵要求，签章齐备，法律合规。',
          },
          badSample: {
            title: '不合格典型样例：因赶工期而对严重缺项妥协放行',
            desc: '在未见芯片抗干扰测试报告的情况下，仅凭口头承诺即签署“完全通过”。',
            warning: '【严重事故】直接违反公司一级质量红线，触发合规内控通报与降级问责！',
          },
          kcpCheckpoints: [
            '严格执行 DOA 最高裁决权限，委员会参会法定人数须达到 80% 以上。',
            '严禁非委员会正式授权人员越权代签。',
          ],
        },
      ],

      passingScore: 80,
      questions: [
        {
          id: 'q_101_1',
          type: 'scenario',
          question: '【情景判断】项目当前临近交付节点，时间极其紧迫。系统工程师提交的评审材料中，关键高低温可靠性验证报告尚在进行中未能出具。请问：同行评审专家与 TRB 委员会能否基于“交付紧急”给予评审通过？',
          scenarioContext: '某新能源电控系统研发项目已进入 TR4 节点，客户要求下周必须样件交货，但第三方环境可靠性实验室的测试报告预计还需 3 天出具。',
          options: [
            'A. 可以通过，但需系统工程师在上线交付后 1 个月内补齐报告并归档',
            'B. 绝不能通过。属于 KCP-01 核心质量门禁红线，关键验证报告缺失必须判定为不通过或延期评审',
            'C. 由业务线项目总监出具口头担保承诺，即可默认直接放行通过',
            'D. 降低评审等级为常规内部交流，免去正式 TRB 裁决并直接投产',
          ],
          correctIndex: 1,
          explanation: '技术评审的核心价值在于防止技术缺陷与质量隐患逃逸至客户现场。根据《IPD技术评审主流程规范》第4.2条，关键可靠性验证报告属于不可裁剪的 KCP-01 红线输入，任何因工期压力的放行均属严重流程违规。正确做法为立即亮黄灯预警，待验证闭环后发起快速复评。',
          relatedNode: '02 同行交叉审查 (KCP-01)',
          relatedDocClause: '《IPD技术质量红线管理规范》第4.2款',
        },
        {
          id: 'q_101_2',
          type: 'choice',
          question: '【岗位执行】作为系统工程师，在执行节点 01“发起技术评审”时，首要必做的核心前置动作是什么？',
          options: [
            'A. 直接在企业微信联系评审专家要求立即会签',
            'B. 对照《技术评审前置核查表》逐项核对材料齐套性，确保自查无硬伤后在系统规范提请',
            'C. 仅在即时通讯群发送代码库链接，由评审专家自行下载提取文档',
            'D. 跳过内部自查，直接邀请项目总监召集裁决会',
          ],
          correctIndex: 1,
          explanation: '根据流程岗位操作指引，发起人的核心准则是“不向下游流转不合格半成品”，必须完成前置自查清单签署，保障输入材料齐备规范。',
          relatedNode: '01 发起技术评审',
          relatedDocClause: '《技术评审发起前置门禁准则》第2.1条',
        },
        {
          id: 'q_101_3',
          type: 'choice',
          question: '【控制点把关】同行交叉审查中发现 1 项 A 类致命技术缺陷（可能导致系统崩溃）。系统工程师提出方案已在本地验证但未提交回归测试用例。TRB 委员会的合规决策是？',
          options: [
            'A. 判定为“驳回”，要求必须具备完整的自动化回归用例并通过测试后重新提报',
            'B. 判定为“完全通过”，相信工程师的个人技术经验与口头承诺',
            'C. 忽略该缺陷，先发布上线再根据后续客户报障处理',
            'D. 将 A 类缺陷降级为 C 类建议项后直接签署通过',
          ],
          correctIndex: 0,
          explanation: 'A类致命缺陷在未通过正式回归验证前绝不允许降级或豁免。TRB委员会必须严守 KCP-02 决议底线，给出驳回或要求限期出具用例验证。',
          relatedNode: '04 TRB 决议裁决 (KCP-02)',
          relatedDocClause: '《缺陷分类分级与会签终审守则》第5.1条',
        },
        {
          id: 'q_101_4',
          type: 'choice',
          question: '【流程流转】技术评审结束后，生成的《TRB决议裁决书》应当交接给哪一方并作为后续哪个流程的前置输入？',
          options: [
            'A. 仅存档在个人电脑，无需对外分发',
            'B. 交接给项目经理及研发团队，作为后续“受控基线发布”与“投产立项”的前置必备输入',
            'C. 移交给行政部报销评审餐费',
            'D. 直接发送给外部客户作为使用手册',
          ],
          correctIndex: 1,
          explanation: '技术评审是产品研发各阶段（TR1-TR6）的阶段门禁（Stage-Gate），TRB决议书是进入下一工程阶段的法定通行证。',
          relatedNode: '04 TRB 决议裁决',
          relatedDocClause: '《集成产品开发IPD阶段门禁治理条例》第3.4款',
        },
      ],

      practicalTask: {
        taskName: '《技术评审缺陷整改与闭环自查表》填报实操',
        requirement: '结合当前在研项目实际，对照自查清单填写1份完整的缺陷收敛跟踪表，明确缺陷定级、整改方案、验证人与回归结果。',
        reviewer: '张三 (首席架构师) / 李四 (质量总监)',
      },

      records: [
        {
          id: 'rec_01',
          name: '王强',
          empNo: 'E0102',
          deptName: '研发管理中心',
          positionName: '系统工程师',
          readStatus: 'read',
          examStatus: 'passed',
          score: 95,
          practiceConfirmed: true,
          confirmedBy: '李四 (质量总监)',
          weakPoints: ['无明显薄弱点'],
          lastStudyTime: '2026-03-22 10:15',
        },
        {
          id: 'rec_02',
          name: '李明',
          empNo: 'E0145',
          deptName: '研发管理中心',
          positionName: '高级研发工程师',
          readStatus: 'read',
          examStatus: 'passed',
          score: 85,
          practiceConfirmed: false,
          confirmedBy: '待主管复核',
          weakPoints: ['缺陷等级划分标准'],
          lastStudyTime: '2026-03-21 16:30',
        },
        {
          id: 'rec_03',
          name: '张婷',
          empNo: 'E0211',
          deptName: '质量控制部',
          positionName: '质量管理工程师',
          readStatus: 'read',
          examStatus: 'failed',
          score: 65,
          practiceConfirmed: false,
          confirmedBy: '-',
          weakPoints: ['KCP-01门禁红线判定', 'A类缺陷闭环规则'],
          lastStudyTime: '2026-03-20 11:20',
        },
        {
          id: 'rec_04',
          name: '陈建国',
          empNo: 'E0088',
          deptName: '研发管理中心',
          positionName: '研发总监',
          readStatus: 'read',
          examStatus: 'passed',
          score: 100,
          practiceConfirmed: true,
          confirmedBy: '李四 (质量总监)',
          weakPoints: ['无明显薄弱点'],
          lastStudyTime: '2026-03-19 09:40',
        },
        {
          id: 'rec_05',
          name: '赵子豪',
          empNo: 'E0301',
          deptName: '研发管理中心',
          positionName: '初级系统工程师',
          readStatus: 'unread',
          examStatus: 'untested',
          score: 0,
          practiceConfirmed: false,
          confirmedBy: '-',
          weakPoints: ['尚未开始学习'],
          lastStudyTime: '未打卡',
        },
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
      targetDepts: ['市场营销部'],
      targetPositions: ['商务销售经理'],
      targetRoles: ['流程发起人 (申请人)', '同行交叉评审人 (审查人)'],
      deadlineDays: 15,
      summary: '面向营销专员与销售主管，讲解全渠道线索录入、清洗验真以及商机立项评估的BANT实操模型。',
      lastStudyTime: '2026-03-18 09:15',
      approvedVersion: {
        versionNo: 'V1.3 (已批准生效)',
        approvedAt: '2026-02-15 14:00',
        approver: '张华 (市场营销VP)',
        changeSummary: '优化BANT验真关键控制点，规范跨部门商机撞单仲裁细则。',
        docRef: '《营销线索全生命周期流转管理办法》第2.4条',
      },
      learningObjectives: [
        '1. 掌握全渠道线索统一录入与查重规则，避免客户信息冲突。',
        '2. 熟练运用 BANT 模型进行线索验真（预算/决策人/需求/时间）。',
        '3. 明确商机流转交接节点与 CRM 自动化流转时限要求。',
      ],
      sections: [
        { title: '一、全渠道线索收集与建档规范', time: '8分钟', completed: true },
        { title: '二、线索清洗防刷与真实性复核 (KCP)', time: '12分钟', completed: true },
        { title: '三、商机分派与CRM系统衔接流转', time: '15分钟', completed: true },
      ],
      rolePlaybooks: [
        {
          roleName: '市场营销专员',
          roleBadge: '线索采集团队',
          roleDesc: '负责多渠道线索导入、首轮验真并核准关键信息。',
          nodes: ['01 线索采集录入', '02 BANT初筛'],
          inputs: ['展会/线上表单原始数据'],
          actions: ['对照 CRM 查重规则进行清洗，剔除无效垃圾信息，48小时内完成电话初筛。'],
          outputs: ['合格意向线索包'],
          handoverTo: '销售主管 / 客户经理',
          goodSample: {
            title: '合格样例：信息要素全且通过初筛',
            desc: '企业名称、统一社会信用代码、核心联系人职位与明确采购诉求完备。',
            preview: '【合规】已通过 CRM 自动查重认证。',
          },
          badSample: {
            title: '不合格典型样例：虚假/空号线索未清洗',
            desc: '联系人姓名含糊，电话无效，无具体业务场景。',
            warning: '【违规】直接扣减渠道有效线索系数。',
          },
          kcpCheckpoints: ['录入前强制查重，查重率 100%。'],
        },
      ],
      passingScore: 80,
      questions: [
        {
          id: 'q_102_1',
          type: 'choice',
          question: '在 BANT 模型中，决定该线索能否正式转为销售机会 (Opportunity) 的核心必要条件是？',
          options: [
            'A. 必须同时具备预算 (Budget)、决策权 (Authority)、明确需求 (Need) 和时间表 (Timeline)',
            'B. 只要客户留下了电话即可直接转立项',
            'C. 只要公司名称高大上就可以直接签合同',
            'D. 仅凭销售人员主观直觉即可免除审批',
          ],
          correctIndex: 0,
          explanation: '根据《营销线索全生命周期流转管理办法》，转商机的 KCP 门禁必须满足 BANT 真实性验证。',
          relatedNode: '02 BANT初筛与验真 (KCP)',
          relatedDocClause: '《营销线索流转办法》第2.4条',
        },
      ],
      records: [
        {
          id: 'rec_201',
          name: '刘芳',
          empNo: 'E0412',
          deptName: '市场营销部',
          positionName: '商务销售经理',
          readStatus: 'read',
          examStatus: 'passed',
          score: 100,
          practiceConfirmed: true,
          confirmedBy: '张华 (市场营销VP)',
          weakPoints: ['无'],
          lastStudyTime: '2026-03-18 09:15',
        },
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
      targetAudience: '需求工程部、研发管理中心全员 (全员必修)',
      targetDepts: ['需求工程部', '研发管理中心'],
      targetPositions: ['敏捷需求工程师', '系统工程师'],
      targetRoles: ['流程发起人 (申请人)', 'TRB决议审批人 (批准人)'],
      deadlineDays: 45,
      summary: '掌握研发过程中工程变更与商业诉求变更的评估准则，避免技术债务与无序返工。',
      approvedVersion: {
        versionNo: 'V2.1',
        approvedAt: '2026-01-20',
        approver: '王总 (工程总监)',
        changeSummary: '明确CCB重大变更一票否决红线。',
        docRef: '《需求工程基线变更管控条例》',
      },
      learningObjectives: [
        '1. 掌握变更分级标准（I级重大变更、II级重要变更、III级微调）。',
        '2. 能够对变更导致的架构影响面与交付延期进行定量测算。',
        '3. 严格遵循 CCB 决策流转，严禁未批先改。',
      ],
      sections: [
        { title: '一、需求变更的分级分类与发起门槛', time: '10分钟', completed: false },
        { title: '二、影响面架构评估与交付工期预算核算', time: '20分钟', completed: false },
        { title: '三、变更控制委员会 (CCB) 终审批件签署', time: '20分钟', completed: false },
      ],
      rolePlaybooks: [],
      passingScore: 80,
      questions: [],
      records: [],
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
      targetDepts: ['研发管理中心'],
      targetPositions: ['系统工程师'],
      targetRoles: ['流程发起人 (申请人)'],
      deadlineDays: 60,
      summary: '明确软硬件架构边界，建立跨模块接口依赖与可测试性核查标准。',
      approvedVersion: {
        versionNo: 'V1.0',
        approvedAt: '2025-11-10',
        approver: '架构委员会',
        changeSummary: '首版发布',
        docRef: '《产品架构评审细则》',
      },
      learningObjectives: [
        '1. 掌握微服务模块划分边界。',
        '2. 掌握接口防抖与幂等性设计标准。',
      ],
      sections: [
        { title: '一、架构基线说明书编制要点', time: '12分钟', completed: true },
        { title: '二、同行专家评审与争议项裁决', time: '18分钟', completed: true },
      ],
      rolePlaybooks: [],
      passingScore: 80,
      questions: [],
      records: [],
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
      targetDepts: ['集成电路设计院'],
      targetPositions: ['首席系统架构师'],
      targetRoles: ['TRB决议审批人 (批准人)'],
      deadlineDays: 60,
      summary: '学习流片一次成功率控制要点，深入掌握DRC/LVS/STA验证与Sign-off签署流程。',
      approvedVersion: {
        versionNo: 'V3.0',
        approvedAt: '2026-03-01',
        approver: '流片总监',
        changeSummary: '更新7nm工艺库DRC合规标准',
        docRef: '《流片投产红线规范》',
      },
      learningObjectives: [
        '1. 掌握 DRC/LVS 零错误门禁规则。',
        '2. 掌握 STA 时序 Sign-off 签署流程。',
      ],
      sections: [
        { title: '一、布局布线与门级网表核查', time: '15分钟', completed: true },
        { title: '二、物理规则检查 (DRC/LVS) 零违规合规', time: '25分钟', completed: false },
        { title: '三、流片投产包 Tape-out 签署下发', time: '20分钟', completed: false },
      ],
      rolePlaybooks: [],
      passingScore: 80,
      questions: [],
      records: [],
    },
  ]);

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
    flowCode: 'IPD-ST-001',
    category: '战略与立项规范',
    importance: '必修',
    targetDepts: ['研发管理中心'],
    targetPositions: ['系统工程师'],
    targetRoles: ['流程发起人 (申请人)'],
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

  // 快捷切换课程重要性
  const handleChangeImportance = (courseId: string, newType: '必修' | '选修' | '进阶') => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, importance: newType } : c))
    );
    if (selectedCourse?.id === courseId) {
      setSelectedCourse((prev) => (prev ? { ...prev, importance: newType } : null));
    }
    showToast(`已成功将课程调整为【${newType}】属性`, 'success');
  };

  // 快捷修改适用受众
  const handleChangeAudience = (courseId: string, newAudience: string) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, targetAudience: newAudience } : c))
    );
    if (selectedCourse?.id === courseId) {
      setSelectedCourse((prev) => (prev ? { ...prev, targetAudience: newAudience } : null));
    }
    showToast('已更新适用受众与部门范围', 'success');
  };

  // 小节打卡
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

  // 打开深度课程配置弹窗
  const handleOpenConfigModal = (course: CourseItem) => {
    setEditingCourse(JSON.parse(JSON.stringify(course)));
    setConfigModalTab('basic');
    setActivePlaybookTabIdx(0);
  };

  // 保存深度课程配置
  const handleSaveCourseConfig = () => {
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

    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedCourse?.id === updated.id) {
      setSelectedCourse(updated);
    }
    setEditingCourse(null);
    showToast(`课程【${updated.title}】的4大模块配置已保存生效！`, 'success');
  };

  // 提交并新增课程
  const handleConfirmAddNewCourse = () => {
    if (!newCourseForm.title.trim()) {
      showToast('请输入课程名称', 'warning');
      return;
    }
    const audienceText = [
      newCourseForm.targetDepts.length > 0 ? newCourseForm.targetDepts.join('/') : '',
      newCourseForm.targetPositions.length > 0 ? newCourseForm.targetPositions.join('/') : '',
    ]
      .filter(Boolean)
      .join(' · ') || (newCourseForm.importance === '必修' ? '全员必修' : '自主选修');

    const newCourse: CourseItem = {
      id: 'course_' + Date.now().toString(36),
      flowId: 'flow_new_' + Date.now().toString(36),
      flowCode: newCourseForm.flowCode || 'FLOW-STD',
      title: newCourseForm.title.trim(),
      category: newCourseForm.category || '企业标准规范',
      deptName: '流程管理部',
      duration: '40 分钟',
      progress: 0,
      status: 'not_started',
      kcpPoints: 2,
      importance: newCourseForm.importance,
      targetAudience: audienceText,
      targetDepts: newCourseForm.targetDepts,
      targetPositions: newCourseForm.targetPositions,
      targetRoles: newCourseForm.targetRoles,
      deadlineDays: newCourseForm.deadlineDays || 30,
      summary: newCourseForm.summary.trim() || '本课程针对最新发布的业务流程进行操作宣导与实操答疑。',
      approvedVersion: {
        versionNo: 'V1.0 (最新发布)',
        approvedAt: new Date().toISOString().slice(0, 10),
        approver: currentUser?.userName || '流程管理员',
        changeSummary: '首版正式发布上线',
        docRef: '《业务流程操作规范手册》',
      },
      learningObjectives: [
        '1. 熟练掌握该业务流程适用边界与发起准入门槛。',
        '2. 明确本岗位在流程各环节的动作清单、输入材料与交付物标准。',
        '3. 严格落实关键控制点（KCP）合规核验，规避违规逃逸。',
      ],
      sections: [
        { title: '一、流程标准与节点职责解读', time: '10分钟', completed: false, type: '流程原文' },
        { title: '二、岗位操作动作与合格样例对比', time: '15分钟', completed: false, type: '岗位指引' },
        { title: '三、关键控制点 (KCP) 把关与案例练习', time: '15分钟', completed: false, type: '案例考核' },
      ],
      rolePlaybooks: [
        {
          roleName: '业务经办人',
          roleBadge: '经办/申请人',
          roleDesc: '负责具体业务动作的执行与交付物归档。',
          nodes: ['01 发起业务申请'],
          inputs: ['业务基础材料'],
          actions: ['按规范核验前置材料，完成申报录入。'],
          outputs: ['合格申请表单'],
          handoverTo: '业务审核人',
          goodSample: { title: '合格样例', desc: '材料齐备无逻辑缺失', preview: '要素齐全' },
          badSample: { title: '反面教材', desc: '缺少必备附件', warning: '驳回退回' },
          kcpCheckpoints: ['核实附件完整性。'],
        },
      ],
      passingScore: 80,
      questions: [
        {
          id: 'q_new_1',
          type: 'choice',
          question: '在发起本业务流程时，遇到前置必备附件暂时缺失的紧急情况，合规的做法是？',
          options: [
            'A. 补齐齐备附件后再行发起流转',
            'B. 随意上传空白文件骗过系统校验',
            'C. 私下口头通知领导放行',
            'D. 伪造测试数据',
          ],
          correctIndex: 0,
          explanation: '任何关键控制点附件均属红线，必须满足齐套性门禁要求。',
          relatedNode: '01 发起业务申请',
          relatedDocClause: '《业务流程规范条例》',
        },
      ],
      records: [],
    };

    setCourses((prev) => [newCourse, ...prev]);
    setShowAddForm(false);
    setNewCourseForm({
      title: '',
      flowCode: 'IPD-ST-001',
      category: '战略与立项规范',
      importance: '必修',
      targetDepts: ['研发管理中心'],
      targetPositions: ['系统工程师'],
      targetRoles: ['流程发起人 (申请人)'],
      deadlineDays: 30,
      summary: '',
    });
    showToast(`已成功录入课程【${newCourse.title}】！`, 'success');
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
    setExamScore(null);
  };

  // 提交情景练习答案
  const handleSelectPracticeAnswer = (qId: string, optionIdx: number) => {
    setPracticeAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  // 提交考核考卷
  const handleSubmitExam = (currentCourse: CourseItem) => {
    const questions = currentCourse.questions || [];
    if (questions.length === 0) {
      showToast('本门课程暂未配置考题', 'warning');
      return;
    }
    let correctCount = 0;
    questions.forEach((q) => {
      if (examAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });
    const calculatedScore = Math.round((correctCount / questions.length) * 100);
    setExamScore(calculatedScore);
    setExamSubmitted(true);

    const isPassed = calculatedScore >= (currentCourse.passingScore || 80);

    // 更新课程状态和学员记录
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== currentCourse.id) return c;
        const newProgress = isPassed ? 100 : Math.max(c.progress, 75);
        const newStatus = isPassed ? 'completed' : 'in_progress';
        const updatedRecords = [...c.records];
        const existingMyRecIdx = updatedRecords.findIndex((r) => r.name === (currentUser?.userName || '系统员工'));
        if (existingMyRecIdx >= 0) {
          updatedRecords[existingMyRecIdx] = {
            ...updatedRecords[existingMyRecIdx],
            examStatus: isPassed ? 'passed' : 'failed',
            score: calculatedScore,
            lastStudyTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
          };
        } else {
          updatedRecords.unshift({
            id: 'rec_my_' + Date.now().toString(36),
            name: currentUser?.userName || '系统员工',
            empNo: currentUser?.empNo || 'E0001',
            deptName: currentUser?.deptName || '研发中心',
            positionName: currentUser?.positionName || '系统工程师',
            readStatus: 'read',
            examStatus: isPassed ? 'passed' : 'failed',
            score: calculatedScore,
            practiceConfirmed: false,
            confirmedBy: '-',
            weakPoints: isPassed ? ['无明显薄弱点'] : ['部分关键控制点待加强'],
            lastStudyTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
          });
        }
        return {
          ...c,
          progress: newProgress,
          status: newStatus,
          records: updatedRecords,
        };
      })
    );

    if (isPassed) {
      showToast(`恭喜！您的考核得分为 ${calculatedScore} 分，达到合格线已通过认证！`, 'success');
    } else {
      showToast(`您的考核得分为 ${calculatedScore} 分，未达合格线 (${currentCourse.passingScore || 80}分)，请查看错题解析后重考`, 'warning');
    }
  };

  // 签署实操确认
  const handleConfirmPractical = (courseId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        const updatedRecords = c.records.map((r) =>
          r.name === (currentUser?.userName || '系统员工')
            ? { ...r, practiceConfirmed: true, confirmedBy: `${currentUser?.userName || '系统主管'} (确认签署)` }
            : r
        );
        return {
          ...c,
          records: updatedRecords,
        };
      })
    );
    showToast('实操演练确认签署成功！已记录至企业流程培训档案。', 'success');
  };

  const currentStudioCourse = courses.find((c) => c.id === learningStudioCourseId) || courses[0];

  return (
    <div className="h-full flex flex-col bg-[#f8fafc] text-xs">
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
                  <span>版本: {currentStudioCourse.approvedVersion?.versionNo || 'V2.0正式版'}</span>
                  <span>·</span>
                  <span>批准人: {currentStudioCourse.approvedVersion?.approver || '质量总监'}</span>
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
                          <span>法律制度依据：{currentStudioCourse.approvedVersion?.docRef}</span>
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
                              <span className="text-[#52c41a] font-bold text-xs flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> 已完成
                              </span>
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
                      <div className="font-bold text-sm text-[#1f2733]">配套标准指引与模板</div>
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-lg border border-[#e4e7ed] bg-[#fafafa] flex items-center justify-between">
                          <div className="truncate pr-2">
                            <div className="font-medium text-xs text-[#1f2733] truncate">《技术评审自查清单.docx》</div>
                            <div className="text-[10px] text-[#909399]">官方标准模板 · 245KB</div>
                          </div>
                          <Download
                            className="w-4 h-4 text-[#2f54eb] cursor-pointer hover:scale-110 transition-transform shrink-0"
                            onClick={() => showToast('已成功下载技术评审自查清单模板', 'success')}
                          />
                        </div>
                        <div className="p-2.5 rounded-lg border border-[#e4e7ed] bg-[#fafafa] flex items-center justify-between">
                          <div className="truncate pr-2">
                            <div className="font-medium text-xs text-[#1f2733] truncate">《缺陷收敛与闭环跟踪表.xlsx》</div>
                            <div className="text-[10px] text-[#909399]">问题清零工装 · 180KB</div>
                          </div>
                          <Download
                            className="w-4 h-4 text-[#2f54eb] cursor-pointer hover:scale-110 transition-transform shrink-0"
                            onClick={() => showToast('已成功下载缺陷跟踪表格', 'success')}
                          />
                        </div>
                        <div className="p-2.5 rounded-lg border border-[#e4e7ed] bg-[#fafafa] flex items-center justify-between">
                          <div className="truncate pr-2">
                            <div className="font-medium text-xs text-[#1f2733] truncate">《TRB裁决红线守则 (SOP).pdf》</div>
                            <div className="text-[10px] text-[#909399]">门禁红线指南 · 520KB</div>
                          </div>
                          <Download
                            className="w-4 h-4 text-[#2f54eb] cursor-pointer hover:scale-110 transition-transform shrink-0"
                            onClick={() => showToast('已下载SOP红线守则文件', 'success')}
                          />
                        </div>
                      </div>
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
                          <p className="text-xs text-[#606266] leading-relaxed">
                            {currentStudioCourse.practicalTask.requirement}
                          </p>
                          <div className="text-[11px] text-[#909399]">
                            指定复核人：{currentStudioCourse.practicalTask.reviewer}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleConfirmPractical(currentStudioCourse.id)}
                          className="h-8 px-4 rounded-lg bg-[#52c41a] hover:bg-[#389e0d] text-white font-semibold text-xs cursor-pointer shadow-2xs shrink-0 flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>签署实操掌握确认</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Completion Card */}
                  {currentStudioCourse.status === 'completed' && (
                    <div className="p-5 rounded-xl border border-[#b7eb8f] bg-[#f6ffed] text-center space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-[#52c41a] mx-auto" />
                      <div className="font-bold text-base text-[#135200]">恭喜！您已全面达成【{currentStudioCourse.title}】掌握要求！</div>
                      <p className="text-xs text-[#237804]">
                        已完成流程原文研读、掌握岗位操作指引、情景案例练习及考核达标验证，已纳入个人岗位胜任力履历。
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
                    当前学员：{currentUser?.userName || '系统员工'} · 归属：{currentUser?.deptName || '研发管理中心'} · 三态掌握标准：已阅读 ＋ 考核通过 ＋ 实操确认
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
                  onClick={() => setManageModalOpen(true)}
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
                              onClick={(e) => {
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
                      onClick={() => handleOpenConfigModal(selectedCourse)}
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
                      <input
                        type="text"
                        value={newCourseForm.flowCode}
                        onChange={(e) => setNewCourseForm({ ...newCourseForm, flowCode: e.target.value })}
                        placeholder="例如：IPD-ST-001"
                        className="w-full h-8 px-2.5 border border-[#dcdfe6] rounded-lg bg-white text-xs focus:border-[#2f54eb] focus:outline-hidden"
                      />
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
                            onChange={(e) => handleChangeAudience(c.id, e.target.value)}
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
                                setCourses((prev) => prev.filter((item) => item.id !== c.id));
                                showToast(`已移除课程【${c.title}】`, 'info');
                              }}
                              className="text-[#f56c6c] hover:text-[#cf1322] cursor-pointer"
                              title="删除该课程"
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
              ].map((tab) => (
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
                      <span className="text-[11px] text-[#2f54eb]">流程更新后可一键同步通知受众补学</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-[#606266] block mb-1">批准版本号</label>
                        <input
                          type="text"
                          value={editingCourse.approvedVersion?.versionNo || ''}
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
                          value={editingCourse.approvedVersion?.approver || ''}
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

                  {/* 多维度结构化受众选择器 (按部门、按岗位、按流程角色选择) */}
                  <div className="p-4 rounded-xl border border-[#adc6ff] bg-[#f0f5ff]/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-[#1d39c4] flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#2f54eb]" />
                        <span>必修范围与受众匹配规则（结构化选择，非自由文本）</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCourse({
                            ...editingCourse,
                            targetDepts: ['研发管理中心', '质量控制部'],
                            targetPositions: ['系统工程师', '质量管理工程师'],
                            targetRoles: ['流程发起人 (申请人)', '同行交叉评审人 (审查人)'],
                          });
                          showToast('已一键加载典型研发技术流程受众矩阵', 'info');
                        }}
                        className="text-[11px] text-[#2f54eb] hover:underline cursor-pointer"
                      >
                        一键载入标准受众矩阵
                      </button>
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
                            { title: `第 ${editingCourse.sections.length + 1} 节 新增操作实战`, time: '10分钟', completed: false, type: '实操演练' },
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
                        <div key={i} className="grid grid-cols-12 gap-2 items-center">
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
                <div className="space-y-5">
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
                        onClick={() => showToast('已成功向待补考学员发送催学通知短信与站内信', 'success')}
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

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[#ebeef5] bg-[#fafafa] flex items-center justify-between shrink-0">
              <div className="text-xs text-[#909399]">
                提示：完成配置后点击保存，所有设置（含岗位指引与考核题库）将即时同步至学员端。
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
                  onClick={handleSaveCourseConfig}
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
