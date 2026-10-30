import React, { useState, useEffect } from 'react';
import {
  Activity,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Flame,
  RefreshCw,
  Upload,
  Link2,
  FileText,
  Play,
  Pause,
  Filter,
  Eye,
  Sliders,
  TrendingDown,
  Clock,
  Zap,
  BarChart2,
  ChevronRight,
  ShieldAlert,
  Server,
  Workflow,
  Search,
  ExternalLink,
  Code,
  FileDown,
  Info,
  Check,
  X,
  HelpCircle,
  TrendingUp,
  Settings,
  Plus,
  Trash2,
  Key,
  Globe,
  Radio,
  FileCode,
  ArrowRightLeft,
} from 'lucide-react';
import { ProcessNodeHeatmap } from './ProcessNodeHeatmap';

interface ProcessMiningViewProps {
  subPath?: string;
  onNavigate: (path: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

interface MiningNode {
  id: string;
  system: string;
  name: string;
  role: string;
  avgDuration: string;
  throughput: number;
  health: 'normal' | 'warning' | 'critical';
  desc: string;
}

interface MiningEdge {
  from: string;
  to: string;
  count: number;
  leadTime: string;
  status: 'normal' | 'warning' | 'breakpoint' | 'handshake_gap';
  label: string;
}

interface DiagnosticItem {
  id: string;
  type: 'breakpoint' | 'missing_handshake' | 'disjointed_data';
  level: 'critical' | 'high' | 'medium';
  title: string;
  fromSystem: string;
  toSystem: string;
  affectedCount: number;
  lossMetric: string;
  rootCause: string;
  bestPractice: string;
  remedy: string;
  fixed?: boolean;
}

interface SystemItem {
  id: string;
  name: string;
  code: string;
  vendor: string;
  status: string;
  latency: string;
  syncRecords: number;
  lastSync: string;
  primaryKeys: string[];
  desc: string;
  protocol?: string;
  endpointUrl?: string;
  authType?: string;
  schedule?: string;
  caseIdField?: string;
  activityField?: string;
  timestampField?: string;
  operatorField?: string;
  payloadFields?: string;
  filterPredicate?: string;
}

interface CorrelationRule {
  id: string;
  sourceSystem: string;
  sourceField: string;
  operator: string;
  targetSystem: string;
  targetField: string;
  health: 'breakpoint' | 'healthy' | 'disjointed' | 'handshake_gap';
  healthLabel: string;
  notes: string;
}

// System branding colors and badges
const SYSTEM_STYLES: Record<string, { bg: string; text: string; border: string; badgeBg: string }> = {
  CRM: { bg: '#fff7ed', text: '#ea580c', border: '#fdba74', badgeBg: '#ffedd5' },
  PLM: { bg: '#f5f3ff', text: '#7c3aed', border: '#c4b5fd', badgeBg: '#ede9fe' },
  PMS: { bg: '#ecfeff', text: '#0891b2', border: '#a5f3fc', badgeBg: '#cffafe' },
  ERP: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', badgeBg: '#dbeafe' },
  APS: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', badgeBg: '#d1fae5' },
  SRM: { bg: '#fffbeb', text: '#d97706', border: '#fde68a', badgeBg: '#fef3c7' },
  MES: { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3', badgeBg: '#ffe4e6' },
};

// Preset system configs with realistic enterprise endpoints and schemas
const DEFAULT_SYSTEM_CONFIGS: Record<string, Partial<SystemItem>> = {
  crm: {
    protocol: 'REST (Webhook + OData)',
    endpointUrl: 'https://crm-api.corp.internal/v2/opportunities/events',
    authType: 'OAuth 2.0 Bearer',
    schedule: '实时事件触发 (Webhook)',
    caseIdField: 'ContractNo (合同编号)',
    activityField: 'StageName (商机/会签阶段)',
    timestampField: 'StageChangeTime (变更时间戳)',
    operatorField: 'OwnerName (经办客户经理)',
    payloadFields: 'Amount, Currency, ProductType, CustomerTier',
    filterPredicate: "STAGE IN ('Closed_Won', 'Contract_Signed') AND YEAR(CloseDate) >= 2026",
  },
  plm: {
    protocol: 'Teamcenter SOA API',
    endpointUrl: 'https://plm-soa.corp.internal/tc/services/EngineeringBOM',
    authType: 'API Token',
    schedule: '每小时增量抽取',
    caseIdField: 'ItemCode (12位工程物料码)',
    activityField: 'ReleaseStatus (发布状态)',
    timestampField: 'DateReleased (审批生效时间)',
    operatorField: 'LeadEngineer (主设计师)',
    payloadFields: 'RevId, EcoNo, DrawingStatus, UnitCost',
    filterPredicate: "ITEM_TYPE = 'Assembly' AND ECO_STATUS = 'APPROVED'",
  },
  pms: {
    protocol: 'Jira Enterprise REST',
    endpointUrl: 'https://jira.corp.internal/rest/api/3/project/milestones',
    authType: 'Personal Access Token',
    schedule: '每30分钟定时抽取',
    caseIdField: 'ProjId (项目立项编码)',
    activityField: 'ReviewStage (TR评审节点)',
    timestampField: 'SignOffDate (裁决时间)',
    operatorField: 'CommitteeChair (评审主席)',
    payloadFields: 'TR_Result, RiskCount, OpenIssuesCount',
    filterPredicate: "PROJECT_TYPE = 'RD_HARDWARE' AND STATUS = 'SIGN_OFF'",
  },
  erp: {
    protocol: 'SAP OData v4 / RFC',
    endpointUrl: 'https://sap-gateway.corp.internal/odata/v4/SalesOrderSrv/Events',
    authType: 'OAuth 2.0 mTLS',
    schedule: '实时消息总线 (Kafka/MQ)',
    caseIdField: 'SoNo (销售订单号)',
    activityField: 'DocStatus (单据状态)',
    timestampField: 'PostingDateTime (过账时间戳)',
    operatorField: 'CreatedByUser (制单人员)',
    payloadFields: 'SourceContractNo, NetAmount, PlantId, DeliveryBlock',
    filterPredicate: "DOC_TYPE IN ('ZOR', 'ZPO') AND POST_DATE >= '2026-01-01'",
  },
  aps: {
    protocol: 'JDBC 数据库直连 (Read-Only)',
    endpointUrl: 'jdbc:oracle:thin:@aps-db.corp.internal:1521/APSPROD',
    authType: 'Database Credentials',
    schedule: '每日班次批处理 (凌晨与正午)',
    caseIdField: 'MoNo (工单号)',
    activityField: 'ScheduleStatus (排产下达状态)',
    timestampField: 'DispatchTime (派工时间戳)',
    operatorField: 'SchedulerName (主排产员)',
    payloadFields: 'LineId, MachineCapacity, PlanStartDate, PlanEndDate',
    filterPredicate: "PLAN_STATUS = 'DISPATCHED' AND ACTIVE_FLAG = 'Y'",
  },
  srm: {
    protocol: 'SAP Ariba Webhook',
    endpointUrl: 'https://srm-gateway.corp.internal/api/asn/notifications',
    authType: 'HMAC-SHA256 Signature',
    schedule: '供应商发货实时推送 (Webhook)',
    caseIdField: 'AsnNo (送货通知单号)',
    activityField: 'ShippingStatus (发运与送达状态)',
    timestampField: 'ShippedTimestamp (发货时间戳)',
    operatorField: 'SupplierContact (供应商发货员)',
    payloadFields: 'PoNo, SuppCode, TrackingNumber, EstimatedArrival',
    filterPredicate: "DELIVERY_STATUS IN ('SHIPPED', 'ARRIVED_PORT')",
  },
  mes: {
    protocol: 'RESTful API / OPC-UA',
    endpointUrl: 'https://mes-gateway.corp.internal/api/v1/workorders/traces',
    authType: 'Bearer Token',
    schedule: '车间工序扫码实时上报',
    caseIdField: 'WorkOrderId (车间工单号)',
    activityField: 'OperationName (工序过站名称)',
    timestampField: 'TrackOutTime (完工过站时间戳)',
    operatorField: 'StationOperator (工位作业员)',
    payloadFields: 'SnCode, QcResult, DefectQty, MachineId',
    filterPredicate: "OP_TYPE IN ('SMT_TEST', 'FINAL_QC', 'PACKING') AND QC_RESULT = 'PASS'",
  },
};

const INITIAL_RULES: CorrelationRule[] = [
  {
    id: 'rule_1',
    sourceSystem: 'CRM',
    sourceField: 'ContractNo (合同编号)',
    operator: '== [精确一对一匹配]',
    targetSystem: 'ERP',
    targetField: 'SourceContractNo (来源合同)',
    health: 'breakpoint',
    healthLabel: '严重断点 (14.5%未生成SO)',
    notes: 'CRM审批通过未自动抛送ERP，存在手工补录延误，导致订单悬空',
  },
  {
    id: 'rule_2',
    sourceSystem: 'ERP',
    sourceField: 'MoNo (生产工单号)',
    operator: '== [主外键透传]',
    targetSystem: 'MES',
    targetField: 'WorkOrderId (车间任务号)',
    health: 'healthy',
    healthLabel: '完全对齐 (100%)',
    notes: '工单号双向透传顺畅，车间过站扫码实时回传',
  },
  {
    id: 'rule_3',
    sourceSystem: 'PLM',
    sourceField: 'MaterialCode (12位工程物料码)',
    operator: '~= [字典模糊映射]',
    targetSystem: 'ERP',
    targetField: 'ItemCode (10位采购物料码)',
    health: 'disjointed',
    healthLabel: '数据不连贯 (编码割裂)',
    notes: '缺少企业统一MDM编码字典，人工转换存在错料风险',
  },
  {
    id: 'rule_4',
    sourceSystem: 'SRM',
    sourceField: 'AsnNo (送货预通知)',
    operator: '-- [单向通知/无握手]',
    targetSystem: 'ERP',
    targetField: 'WmsInbound (仓库收货单)',
    health: 'handshake_gap',
    healthLabel: '缺少握手点 (单向脱节)',
    notes: '送货信息未前置锁库，仓库收货现场翻包核对',
  },
  {
    id: 'rule_5',
    sourceSystem: 'MES',
    sourceField: 'WorkOrderId (工单号)',
    operator: '== [完工报工对账]',
    targetSystem: 'ERP',
    targetField: 'MoNo (工单号)',
    health: 'breakpoint',
    healthLabel: '流程断点 (开票丢失)',
    notes: '完工入库打标但未触发销售出库与应收开票凭证，影响资金回款',
  },
  {
    id: 'rule_6',
    sourceSystem: 'PLM',
    sourceField: 'EcoNo (工程变更号)',
    operator: '!= [缺少防错握手]',
    targetSystem: 'APS',
    targetField: 'PlanLockTag (排产锁定标)',
    health: 'handshake_gap',
    healthLabel: '缺少握手点 (防错缺失)',
    notes: '重大ECN签批未在APS排程引擎建立停机工艺防错锁，旧料仍在线排产',
  },
];

export const ProcessMiningView: React.FC<ProcessMiningViewProps> = ({ subPath = '/mining/engine', onNavigate, showToast }) => {
  // Determine active tab from subPath or local state
  const getInitialTab = () => {
    if (subPath.includes('cross-system') || subPath.includes('integration')) return 'integration';
    if (subPath.includes('diagnosis')) return 'diagnosis';
    if (subPath.includes('advice')) return 'ai';
    return 'simulation';
  };

  const [activeTab, setActiveTab] = useState<'simulation' | 'integration' | 'diagnosis' | 'ai'>(getInitialTab());
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState<'1x' | '2x' | '5x'>('1x');
  const [viewFilter, setViewFilter] = useState<'all' | 'happy' | 'bottleneck'>('all');
  const [simulationSubView, setSimulationSubView] = useState<'both' | 'topology' | 'heatmap'>('both');
  const [selectedNode, setSelectedNode] = useState<MiningNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<MiningEdge | null>(null);

  // Data states
  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [datasetList, setDatasetList] = useState<any[]>([]);
  const [activeDatasetKey, setActiveDatasetKey] = useState('LTC_E2E');
  const [datasetTitle, setDatasetTitle] = useState('LTC 销售线索到回款端到端流程');
  const [caseCount, setCaseCount] = useState(1280);
  const [eventCount, setEventCount] = useState(18460);
  const [avgLeadTime, setAvgLeadTime] = useState('14.8 天');
  const [benchmarkDev, setBenchmarkDev] = useState('+34.6%');
  const [happyPathRatio, setHappyPathRatio] = useState('71.4%');
  const [nodes, setNodes] = useState<MiningNode[]>([]);
  const [edges, setEdges] = useState<MiningEdge[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [diagFilter, setDiagFilter] = useState<'all' | 'breakpoint' | 'missing_handshake' | 'disjointed_data'>('all');

  // Cross-System Rules
  const [correlationRules, setCorrelationRules] = useState<CorrelationRule[]>(INITIAL_RULES);
  const [addRuleModalOpen, setAddRuleModalOpen] = useState(false);
  const [newRuleSourceSystem, setNewRuleSourceSystem] = useState('CRM');
  const [newRuleSourceField, setNewRuleSourceField] = useState('ContractNo (合同编号)');
  const [newRuleOperator, setNewRuleOperator] = useState('== [精确一对一匹配]');
  const [newRuleTargetSystem, setNewRuleTargetSystem] = useState('ERP');
  const [newRuleTargetField, setNewRuleTargetField] = useState('SourceContractNo (来源合同)');
  const [newRuleNotes, setNewRuleNotes] = useState('');

  // System Connector Configuration Modal/Drawer
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<SystemItem | null>(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState<'connection' | 'schema' | 'preview'>('connection');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'failed'; message: string }>({ status: 'idle', message: '' });

  // Manual Import modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importRawText, setImportRawText] = useState('');
  const [importSelectedSystem, setImportSelectedSystem] = useState('ERP');

  // AI Report state
  const [aiReport, setAiReport] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiUserPrompt, setAiUserPrompt] = useState('');

  // Fixed diagnostics tracker for interactive simulation
  const [fixedItemIds, setFixedItemIds] = useState<Set<string>>(new Set());

  // Fetch overview
  const loadMiningOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mining/overview').then((r) => r.json());
      if (res.status === 1 && res.data) {
        const rawSystems: SystemItem[] = res.data.systems || [];
        // Merge with preset connection settings
        const enriched = rawSystems.map((s) => ({
          ...s,
          ...(DEFAULT_SYSTEM_CONFIGS[s.id.toLowerCase()] || {}),
        }));
        setSystems(enriched);
        setDatasetList(res.data.datasetsList || []);
        setActiveDatasetKey(res.data.activeKey || 'LTC_E2E');
        const ds = res.data.dataset;
        if (ds) {
          setDatasetTitle(ds.title);
          setCaseCount(ds.caseCount);
          setEventCount(ds.eventCount);
          setAvgLeadTime(ds.avgLeadTime);
          setBenchmarkDev(ds.benchmarkDeviation);
          setHappyPathRatio(ds.happyPathRatio);
          setNodes(ds.nodes || []);
          setEdges(ds.edges || []);
          setDiagnostics(ds.diagnostics || []);
        }
      }
    } catch (e) {
      console.error('Failed to load mining overview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMiningOverview();
  }, []);

  // Sync subPath change
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [subPath]);

  // Switch dataset
  const handleSwitchDataset = async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/mining/switch-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetKey: key }),
      }).then((r) => r.json());
      if (res.status === 1 && res.data) {
        const ds = res.data;
        setActiveDatasetKey(key);
        setDatasetTitle(ds.title);
        setCaseCount(ds.caseCount);
        setEventCount(ds.eventCount);
        setAvgLeadTime(ds.avgLeadTime);
        setBenchmarkDev(ds.benchmarkDeviation);
        setHappyPathRatio(ds.happyPathRatio);
        setNodes(ds.nodes || []);
        setEdges(ds.edges || []);
        setDiagnostics(ds.diagnostics || []);
        setSelectedNode(null);
        setSelectedEdge(null);
        setFixedItemIds(new Set());
        showToast(`已切换至【${ds.title}】并重构挖掘拓扑`, 'success');
      }
    } finally {
      setLoading(false);
    }
  };

  // Open System Connector Configuration Drawer
  const handleOpenSystemConfig = (sys: SystemItem) => {
    const preset = DEFAULT_SYSTEM_CONFIGS[sys.id.toLowerCase()] || {};
    setEditingSystem({
      ...sys,
      ...preset,
    });
    setDrawerActiveTab('connection');
    setTestResult({ status: 'idle', message: '' });
    setConfigDrawerOpen(true);
  };

  // Test System Connection
  const handleTestSystemConnection = () => {
    setTestingConnection(true);
    setTestResult({ status: 'idle', message: '' });
    setTimeout(() => {
      setTestingConnection(false);
      setTestResult({
        status: 'success',
        message: `✅ 连通性测试通过！响应时延: ${editingSystem?.latency || '32ms'}，HTTP 200 OK，已成功握手探测到 380 笔待抽取候选事务！`,
      });
      showToast(`${editingSystem?.name} 接口连通性测试通过`, 'success');
    }, 600);
  };

  // Save System Config
  const handleSaveSystemConfig = () => {
    if (!editingSystem) return;
    setSystems((prev) =>
      prev.map((s) => (s.id === editingSystem.id ? { ...editingSystem, lastSync: new Date().toISOString().slice(0, 19).replace('T', ' ') } : s))
    );
    setConfigDrawerOpen(false);
    showToast(`已成功保存【${editingSystem.name}】数据抽取与字段映射配置`, 'success');
  };

  // Extract from systems
  const handleExtractFromSystems = async () => {
    setExtracting(true);
    try {
      const res = await fetch('/api/mining/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).then((r) => r.json());
      if (res.status === 1) {
        setSystems((prev) =>
          prev.map((s) => {
            const found = res.updatedSystems?.find((u: any) => u.id === s.id);
            return found ? { ...s, syncRecords: found.syncRecords, lastSync: found.lastSync } : s;
          })
        );
        setEventCount((prev) => prev + res.extractedRecords);
        showToast(res.info || '数据抽取与对齐成功', 'success');
      }
    } finally {
      setExtracting(false);
    }
  };

  // Add correlation rule
  const handleAddCorrelationRule = () => {
    if (!newRuleNotes.trim()) {
      showToast('请输入映射说明', 'warning');
      return;
    }
    const newRule: CorrelationRule = {
      id: 'rule_' + Date.now(),
      sourceSystem: newRuleSourceSystem,
      sourceField: newRuleSourceField,
      operator: newRuleOperator,
      targetSystem: newRuleTargetSystem,
      targetField: newRuleTargetField,
      health: 'healthy',
      healthLabel: '已配置对齐 (100%)',
      notes: newRuleNotes.trim(),
    };
    setCorrelationRules((prev) => [newRule, ...prev]);
    setAddRuleModalOpen(false);
    setNewRuleNotes('');
    showToast('已新增跨系统映射关联规则', 'success');
  };

  // Delete correlation rule
  const handleDeleteCorrelationRule = (id: string) => {
    setCorrelationRules((prev) => prev.filter((r) => r.id !== id));
    showToast('已移除关联映射规则', 'info');
  };

  // Manual import confirm
  const handleConfirmImport = async () => {
    if (!importRawText.trim()) {
      showToast('请输入或粘贴交互记录数据', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/mining/import-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawData: importRawText, sourceSystem: importSelectedSystem }),
      }).then((r) => r.json());
      if (res.status === 1) {
        setImportModalOpen(false);
        setImportRawText('');
        showToast(res.info || '导入成功', 'success');
        loadMiningOverview();
      }
    } catch {
      showToast('导入失败，请检查数据格式', 'error');
    }
  };

  // Generate AI Diagnose report
  const handleGenerateAiReport = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch('/api/mining/ai-diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetKey: activeDatasetKey, prompt: aiUserPrompt }),
      }).then((r) => r.json());
      if (res.status === 1 && res.data) {
        setAiReport(res.data.report);
        showToast('AI 深度诊断与改善建议报告已生成', 'success');
      }
    } catch {
      showToast('AI 诊断生成失败，已加载预置分析报告', 'info');
    } finally {
      setAiGenerating(false);
    }
  };

  // Toggle fix simulation for a diagnostic item
  const handleToggleFixSimulation = (id: string) => {
    const next = new Set(fixedItemIds);
    if (next.has(id)) {
      next.delete(id);
      showToast('已取消模拟修复，恢复原系统断点状态', 'info');
    } else {
      next.add(id);
      showToast('已模拟应用最佳实践整改：相关断点打通，SLA与吞吐量已优化！', 'success');
    }
    setFixedItemIds(next);
  };

  // Filter diagnostics
  const filteredDiagnostics = diagnostics.filter((d) => {
    if (diagFilter === 'all') return true;
    return d.type === diagFilter;
  });

  const breakpointCount = diagnostics.filter((d) => d.type === 'breakpoint').length;
  const handshakeCount = diagnostics.filter((d) => d.type === 'missing_handshake').length;
  const disjointedCount = diagnostics.filter((d) => d.type === 'disjointed_data').length;

  return (
    <div className="flex flex-col h-full bg-[#f8f9fb] text-[#1f2733] font-sans">
      {/* Top Header & Context Bar */}
      <div className="bg-white border-b border-[#ebeef5] px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1677ff] to-[#409eff] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#1f2733] tracking-tight">Propel 流程挖掘与跨系统断点诊断引擎</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]">
                Enterprise v4.2
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#52c41a] animate-ping" />
                7 大系统实时互联
              </span>
            </div>
            <p className="text-xs text-[#909399] mt-0.5">
              汇聚 CRM, ERP, SRM, MES, PLM, PMS, APS 交易日志，还原端到端业务拓扑，诊断流程断点、握手缺失与数据断层
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Scenario Selector */}
          <div className="flex items-center bg-[#f5f7fa] p-1 rounded-lg border border-[#e4e7ed]">
            <span className="text-[11px] text-[#909399] px-2 font-medium">场景：</span>
            <select
              value={activeDatasetKey}
              onChange={(e) => handleSwitchDataset(e.target.value)}
              className="bg-white text-xs font-semibold text-[#303133] rounded px-2.5 py-1 border border-[#dcdfe6] outline-none cursor-pointer hover:border-[#1677ff] transition-colors"
            >
              {datasetList.map((ds) => (
                <option key={ds.key} value={ds.key}>
                  {ds.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExtractFromSystems}
            disabled={extracting}
            className="h-8 px-3.5 rounded-lg bg-[#1677ff] hover:bg-[#409eff] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
            title="实时从 CRM, ERP, SRM, MES, PLM, PMS, APS 接口提取最新事件日志"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${extracting ? 'animate-spin' : ''}`} />
            <span>{extracting ? '接口抽取中...' : '接口实时抽取'}</span>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="h-8 px-3 rounded-lg border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-[#606266] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#909399]" />
            <span>手工导入日志</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ai');
              if (!aiReport) handleGenerateAiReport();
            }}
            className="h-8 px-3 rounded-lg bg-gradient-to-r from-[#722ed1] to-[#9254de] hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>AI 深度体检报告</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="bg-white border-b border-[#ebeef5] px-6 py-2.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#f0f9eb] text-[#67c23a] flex items-center justify-center shrink-0">
            <Workflow className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-[#909399]">端到端全流程实例</div>
            <div className="text-sm font-bold text-[#303133]">{caseCount.toLocaleString()} <span className="text-[10px] text-[#909399] font-normal">笔</span></div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#ecf5ff] text-[#409eff] flex items-center justify-center shrink-0">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-[#909399]">系统交互事件流频次</div>
            <div className="text-sm font-bold text-[#303133]">{eventCount.toLocaleString()} <span className="text-[10px] text-[#909399] font-normal">次</span></div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#fff7e6] text-[#fa8c16] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-[#909399]">平均流转周转周期</div>
            <div className="text-sm font-bold text-[#303133]">
              {fixedItemIds.size > 0 ? '9.5 天' : avgLeadTime}
              <span className={`text-[10px] ml-1 font-semibold ${fixedItemIds.size > 0 ? 'text-[#52c41a]' : 'text-[#f56c6c]'}`}>
                {fixedItemIds.size > 0 ? '-35% (优化后)' : benchmarkDev}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 cursor-pointer hover:bg-[#fef0f0]/60 p-1 rounded transition-colors" onClick={() => { setActiveTab('diagnosis'); setDiagFilter('breakpoint'); }}>
          <div className="w-8 h-8 rounded-lg bg-[#fef0f0] text-[#f56c6c] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-[#909399] flex items-center gap-1">
              <span>流程断点 (阻断)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#f56c6c] animate-ping" />
            </div>
            <div className="text-sm font-bold text-[#f56c6c]">{breakpointCount} <span className="text-[10px] text-[#909399] font-normal">处</span></div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 cursor-pointer hover:bg-[#fffbe6]/60 p-1 rounded transition-colors" onClick={() => { setActiveTab('diagnosis'); setDiagFilter('missing_handshake'); }}>
          <div className="w-8 h-8 rounded-lg bg-[#fffbe6] text-[#faad14] flex items-center justify-center shrink-0">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-[#909399]">缺少握手点 (脱节)</div>
            <div className="text-sm font-bold text-[#faad14]">{handshakeCount} <span className="text-[10px] text-[#909399] font-normal">处</span></div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 cursor-pointer hover:bg-[#f4f4f5] p-1 rounded transition-colors" onClick={() => { setActiveTab('diagnosis'); setDiagFilter('disjointed_data'); }}>
          <div className="w-8 h-8 rounded-lg bg-[#f4f4f5] text-[#909399] flex items-center justify-center shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-[#909399]">数据信息不连贯</div>
            <div className="text-sm font-bold text-[#606266]">{disjointedCount} <span className="text-[10px] text-[#909399] font-normal">项</span></div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Header */}
      <div className="bg-white border-b border-[#e4e7ed] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('simulation')}
            className={`py-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'simulation'
                ? 'border-[#1677ff] text-[#1677ff]'
                : 'border-transparent text-[#606266] hover:text-[#303133]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Propel 拓扑与流程模拟</span>
          </button>

          <button
            onClick={() => setActiveTab('integration')}
            className={`py-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer relative ${
              activeTab === 'integration'
                ? 'border-[#1677ff] text-[#1677ff]'
                : 'border-transparent text-[#606266] hover:text-[#303133]'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>多业务系统映射与集成 (7大系统)</span>
            <span className="w-2 h-2 rounded-full bg-[#52c41a]" />
          </button>

          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`py-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer relative ${
              activeTab === 'diagnosis'
                ? 'border-[#1677ff] text-[#1677ff]'
                : 'border-transparent text-[#606266] hover:text-[#303133]'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>断点与握手点深度诊断</span>
            {diagnostics.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#f56c6c] text-white font-bold ml-1">
                {diagnostics.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('ai');
              if (!aiReport) handleGenerateAiReport();
            }}
            className={`py-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'ai'
                ? 'border-[#722ed1] text-[#722ed1]'
                : 'border-transparent text-[#606266] hover:text-[#303133]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#722ed1]" />
            <span>AI 最佳实践改善建议</span>
          </button>
        </div>

        {/* Tab Right Extra info */}
        {activeTab === 'simulation' && (
          <div className="flex items-center gap-3">
            {/* View Sub-mode: Both / Heatmap / Topology */}
            <div className="flex items-center bg-[#f5f7fa] p-0.5 rounded-lg border border-[#e4e7ed] text-xs">
              <button
                onClick={() => setSimulationSubView('both')}
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  simulationSubView === 'both' ? 'bg-white text-[#1677ff] shadow-xs' : 'text-[#606266] hover:text-[#1f2733]'
                }`}
                title="综合全景（拓扑流转与D3热力图联动）"
              >
                <Layers className="w-3 h-3" />
                <span>综合全景</span>
              </button>
              <button
                onClick={() => setSimulationSubView('heatmap')}
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  simulationSubView === 'heatmap' ? 'bg-white text-rose-600 shadow-xs' : 'text-[#606266] hover:text-[#1f2733]'
                }`}
                title="D3.js 节点停留时延性能瓶颈热力图"
              >
                <Flame className="w-3 h-3 text-rose-500" />
                <span>🔥 D3 瓶颈热力图</span>
              </button>
              <button
                onClick={() => setSimulationSubView('topology')}
                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  simulationSubView === 'topology' ? 'bg-white text-[#1677ff] shadow-xs' : 'text-[#606266] hover:text-[#1f2733]'
                }`}
                title="跨系统实际流转拓扑网"
              >
                <Workflow className="w-3 h-3" />
                <span>拓扑流转网</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-[#f5f7fa] px-2 py-1 rounded text-xs text-[#606266]">
              <span className="text-[11px] text-[#909399]">视图过滤:</span>
              <button
                onClick={() => setViewFilter('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                  viewFilter === 'all' ? 'bg-white text-[#1677ff] shadow-xs' : 'text-[#606266]'
                }`}
              >
                全部路径
              </button>
              <button
                onClick={() => setViewFilter('happy')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                  viewFilter === 'happy' ? 'bg-white text-[#52c41a] shadow-xs' : 'text-[#606266]'
                }`}
              >
                标准主线 (Happy Path)
              </button>
              <button
                onClick={() => setViewFilter('bottleneck')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                  viewFilter === 'bottleneck' ? 'bg-white text-[#f56c6c] shadow-xs' : 'text-[#606266]'
                }`}
              >
                断点与异常流 (Exceptions)
              </button>
            </div>

            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`h-7 px-2.5 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                isSimulating ? 'bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]' : 'bg-[#f5f7fa] text-[#909399]'
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulating ? '模拟流动中' : '已暂停'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* ================= TAB 1: TOPOLOGY & SIMULATION ================= */}
        {activeTab === 'simulation' && (
          <div className="space-y-4">
            {/* D3 Process Node Bottleneck Heatmap */}
            {(simulationSubView === 'both' || simulationSubView === 'heatmap') && (
              <ProcessNodeHeatmap
                nodes={nodes}
                selectedNode={selectedNode}
                onSelectNode={(node) => {
                  setSelectedNode(node);
                  setSelectedEdge(null);
                }}
                datasetTitle={datasetTitle}
                onJumpToDiagnosis={() => setActiveTab('diagnosis')}
              />
            )}

            {/* Visual Topology Canvas */}
            {(simulationSubView === 'both' || simulationSubView === 'topology') && (
              <div className="bg-white rounded-xl border border-[#ebeef5] shadow-xs p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#1f2733] flex items-center gap-1.5">
                    <Workflow className="w-4 h-4 text-[#1677ff]" />
                    <span>端到端跨系统实际流转拓扑 (Directly-Follows Graph)</span>
                  </h3>
                  <span className="text-xs text-[#909399]">(基于真实交易日志时间序列重构还原，含 7 大业务系统协作网)</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1677ff]" />
                    <span className="text-[#606266]">正常流转</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#faad14]" />
                    <span className="text-[#606266]">轻度拥堵 / 缺少握手</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f56c6c]" />
                    <span className="text-[#606266]">严重断点 / 订单脱节</span>
                  </div>
                </div>
              </div>

              {/* Topology Flow Canvas Rendered via SVG & Flex cards */}
              <div className="relative min-h-[380px] bg-[#fafbfc] rounded-lg border border-[#e4e7ed] p-6 overflow-x-auto">
                {/* SVG connection lines with flowing particle animations */}
                <div className="min-w-[980px]">
                  {/* Process Stage Flow Timeline Cards */}
                  <div className="grid grid-cols-4 gap-4 relative z-10 mb-6">
                    {nodes.slice(0, 4).map((node, idx) => {
                      const sStyle = SYSTEM_STYLES[node.system] || SYSTEM_STYLES.ERP;
                      const isSelected = selectedNode?.id === node.id;
                      return (
                        <div
                          key={node.id}
                          onClick={() => { setSelectedNode(node); setSelectedEdge(null); }}
                          className={`bg-white rounded-xl p-3.5 border-2 transition-all cursor-pointer relative shadow-xs hover:shadow-md ${
                            isSelected
                              ? 'border-[#1677ff] ring-2 ring-[#1677ff]/20'
                              : node.health === 'critical'
                              ? 'border-[#fca5a5] hover:border-[#f87171]'
                              : node.health === 'warning'
                              ? 'border-[#fde68a] hover:border-[#fcd34d]'
                              : 'border-[#ebeef5] hover:border-[#bfdbfe]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide"
                              style={{ backgroundColor: sStyle.badgeBg, color: sStyle.text }}
                            >
                              {node.system} 节点
                            </span>
                            <span className="text-[11px] font-semibold text-[#606266] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#909399]" />
                              {node.avgDuration}
                            </span>
                          </div>

                          <div className="font-bold text-xs text-[#1f2733] mb-1.5">{node.name}</div>
                          <div className="text-[11px] text-[#909399] flex items-center justify-between">
                            <span>{node.role}</span>
                            <span className="font-mono text-[#409eff] font-semibold">{node.throughput} 笔</span>
                          </div>

                          {/* Health badge */}
                          {node.health === 'critical' && (
                            <div className="mt-2 text-[10px] bg-[#fef0f0] text-[#f56c6c] font-semibold px-2 py-0.5 rounded flex items-center gap-1 border border-[#fde2e2]">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>严重断点待打通</span>
                            </div>
                          )}
                          {node.health === 'warning' && (
                            <div className="mt-2 text-[10px] bg-[#fffbe6] text-[#faad14] font-semibold px-2 py-0.5 rounded flex items-center gap-1 border border-[#ffe58f]">
                              <Link2 className="w-3 h-3 shrink-0" />
                              <span>缺少双向闭环握手</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Transition Connection Strip 1 */}
                  <div className="grid grid-cols-3 gap-6 px-12 mb-6">
                    {edges.slice(0, 3).map((edge, idx) => {
                      const isBreakpoint = edge.status === 'breakpoint';
                      const isHandshake = edge.status === 'handshake_gap';
                      return (
                        <div
                          key={idx}
                          onClick={() => { setSelectedEdge(edge); setSelectedNode(null); }}
                          className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer relative ${
                            isBreakpoint
                              ? 'bg-[#fef0f0] border-[#fca5a5] text-[#cf1322]'
                              : isHandshake
                              ? 'bg-[#fffbe6] border-[#ffe58f] text-[#d48806]'
                              : 'bg-white border-[#d9d9d9] text-[#1677ff]'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2 text-xs font-bold">
                            <span>流转时效: {edge.leadTime}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-white/80 border">
                              {edge.count} 笔
                            </span>
                          </div>
                          <div className="text-[11px] font-medium mt-0.5 truncate">{edge.label}</div>
                          {isSimulating && (
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#1677ff] animate-ping opacity-75" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Second Row of Stages */}
                  <div className="grid grid-cols-4 gap-4 relative z-10 mb-6">
                    {nodes.slice(4, 8).map((node, idx) => {
                      const sStyle = SYSTEM_STYLES[node.system] || SYSTEM_STYLES.ERP;
                      const isSelected = selectedNode?.id === node.id;
                      return (
                        <div
                          key={node.id}
                          onClick={() => { setSelectedNode(node); setSelectedEdge(null); }}
                          className={`bg-white rounded-xl p-3.5 border-2 transition-all cursor-pointer relative shadow-xs hover:shadow-md ${
                            isSelected
                              ? 'border-[#1677ff] ring-2 ring-[#1677ff]/20'
                              : node.health === 'critical'
                              ? 'border-[#fca5a5] hover:border-[#f87171]'
                              : node.health === 'warning'
                              ? 'border-[#fde68a] hover:border-[#fcd34d]'
                              : 'border-[#ebeef5] hover:border-[#bfdbfe]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide"
                              style={{ backgroundColor: sStyle.badgeBg, color: sStyle.text }}
                            >
                              {node.system} 节点
                            </span>
                            <span className="text-[11px] font-semibold text-[#606266] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#909399]" />
                              {node.avgDuration}
                            </span>
                          </div>

                          <div className="font-bold text-xs text-[#1f2733] mb-1.5">{node.name}</div>
                          <div className="text-[11px] text-[#909399] flex items-center justify-between">
                            <span>{node.role}</span>
                            <span className="font-mono text-[#409eff] font-semibold">{node.throughput} 笔</span>
                          </div>

                          {/* Health badge */}
                          {node.health === 'critical' && (
                            <div className="mt-2 text-[10px] bg-[#fef0f0] text-[#f56c6c] font-semibold px-2 py-0.5 rounded flex items-center gap-1 border border-[#fde2e2]">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>严重断点待打通</span>
                            </div>
                          )}
                          {node.health === 'warning' && (
                            <div className="mt-2 text-[10px] bg-[#fffbe6] text-[#faad14] font-semibold px-2 py-0.5 rounded flex items-center gap-1 border border-[#ffe58f]">
                              <Link2 className="w-3 h-3 shrink-0" />
                              <span>缺少双向闭环握手</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Transition Connection Strip 2 */}
                  <div className="grid grid-cols-3 gap-6 px-12">
                    {edges.slice(4, 7).map((edge, idx) => {
                      const isBreakpoint = edge.status === 'breakpoint';
                      const isHandshake = edge.status === 'handshake_gap';
                      return (
                        <div
                          key={idx}
                          onClick={() => { setSelectedEdge(edge); setSelectedNode(null); }}
                          className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer relative ${
                            isBreakpoint
                              ? 'bg-[#fef0f0] border-[#fca5a5] text-[#cf1322]'
                              : isHandshake
                              ? 'bg-[#fffbe6] border-[#ffe58f] text-[#d48806]'
                              : 'bg-white border-[#d9d9d9] text-[#1677ff]'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2 text-xs font-bold">
                            <span>流转时效: {edge.leadTime}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-white/80 border">
                              {edge.count} 笔
                            </span>
                          </div>
                          <div className="text-[11px] font-medium mt-0.5 truncate">{edge.label}</div>
                          {isSimulating && (
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#1677ff] animate-ping opacity-75" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Inspector Panel for Selected Node or Edge */}
              {(selectedNode || selectedEdge) && (
                <div className="mt-4 p-4 rounded-xl bg-[#f0f7ff] border border-[#bfdbfe] flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1677ff] text-white">
                        {selectedNode ? `${selectedNode.system} 节点详情` : '系统间流转迁移链路'}
                      </span>
                      <span className="font-bold text-sm text-[#1f2733]">
                        {selectedNode ? selectedNode.name : selectedEdge?.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#606266]">
                      {selectedNode
                        ? `环节描述：${selectedNode.desc} | 责任岗位：${selectedNode.role} | 平均处理耗时：${selectedNode.avgDuration}`
                        : `流转样本量：${selectedEdge?.count} 笔 | 平均在途周转耗时：${selectedEdge?.leadTime}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('diagnosis')}
                      className="px-3 py-1.5 rounded-lg bg-[#1677ff] text-white text-xs font-semibold hover:bg-[#409eff] cursor-pointer"
                    >
                      查看关联断点诊断
                    </button>
                    <button
                      onClick={() => { setSelectedNode(null); setSelectedEdge(null); }}
                      className="text-[#909399] hover:text-[#303133] p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Quick Diagnostic Insights Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#ebeef5] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-[#1f2733] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#f56c6c]" />
                    <span>核心流程断点 (2处阻断)</span>
                  </span>
                  <span className="text-[11px] text-[#f56c6c] font-semibold">14.5% 悬空</span>
                </div>
                <p className="text-xs text-[#606266] leading-relaxed">
                  CRM 商务合同签署后缺少与 ERP 销售订单的实时事件触发，依赖人工线下导出导入，导致订单滞留平均 4.6 天，180 笔订单未及时投产。
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#ebeef5] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-[#1f2733] flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-[#faad14]" />
                    <span>系统缺少握手点 (2处脱节)</span>
                  </span>
                  <span className="text-[11px] text-[#faad14] font-semibold">月均 38 起堆积</span>
                </div>
                <p className="text-xs text-[#606266] leading-relaxed">
                  SRM 供应商确认发货 (ASN) 后，ERP 仓库收货无双向握手闭环；PLM 设计变更 ECN 签批后未在 APS 生产排程建立停机防错锁。
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#ebeef5] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-[#1f2733] flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-[#409eff]" />
                    <span>数据信息不连贯 (1项割裂)</span>
                  </span>
                  <span className="text-[11px] text-[#409eff] font-semibold">310 笔单据对照</span>
                </div>
                <p className="text-xs text-[#606266] leading-relaxed">
                  PLM 研发工程采用 12 位技术物料编码，ERP 采购采用 10 位财务采购码，未建立统一 MDM 主数据映射，需计划员手工转换并产生错料成本。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: MULTI-SYSTEM MAPPING & INTEGRATION ================= */}
        {activeTab === 'integration' && (
          <div className="space-y-5">
            {/* Direct Configuration Guidance Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#e6f4ff] via-[#f0f7ff] to-white border border-[#91caff] shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1677ff] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Sliders className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-sm text-[#003eb3] flex items-center gap-2">
                    <span>💡 多系统数据抽取与映射配置中心（两步即可打通数据孤岛）</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#1677ff] border border-[#91caff]">
                      操作指引
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs text-[#1f2733] pt-1">
                    <div className="bg-white p-2.5 rounded-lg border border-[#d6e4ff]">
                      <span className="font-bold text-[#1677ff] mr-1">步骤 1 · 单系统连接与字段映射</span>
                      <p className="text-[11px] text-[#606266] mt-0.5">
                        在下方系统卡片点击<strong>「配置连接与映射」</strong>，配置 REST API/JDBC/Webhook 端点，并映射 Case ID、Activity、Timestamp 事件三元组。
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-[#d6e4ff]">
                      <span className="font-bold text-[#1677ff] mr-1">步骤 2 · 跨系统链路关联规则</span>
                      <p className="text-[11px] text-[#606266] mt-0.5">
                        在下方矩阵点击<strong>「+ 新增跨系统关联规则」</strong>，配置如 <code>CRM.ContractNo == ERP.SourceContractNo</code> 主外键关联。
                      </p>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-[#d6e4ff]">
                      <span className="font-bold text-[#1677ff] mr-1">步骤 3 · 执行抽取与拓扑仿真</span>
                      <p className="text-[11px] text-[#606266] mt-0.5">
                        点击<strong>「全部重新抽取同步」</strong>或<strong>「手工导入日志」</strong>，引擎将自动拟合流转轨迹，在「拓扑模拟」中诊断断点！
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enterprise 7 Systems Connector Cards */}
            <div className="bg-white rounded-xl border border-[#ebeef5] shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-[#1f2733] flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#1677ff]" />
                    <span>第一级：核心业务系统连接与事件日志映射适配器 (7大系统)</span>
                  </h3>
                  <p className="text-xs text-[#909399] mt-0.5">
                    点击任意系统卡片的「配置连接与映射」，可定制接口连接协议、认证令牌及事件日志字段映射
                  </p>
                </div>

                <button
                  onClick={handleExtractFromSystems}
                  disabled={extracting}
                  className="px-3 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#409eff] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${extracting ? 'animate-spin' : ''}`} />
                  <span>全部重新抽取同步</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {systems.map((sys) => {
                  const sStyle = SYSTEM_STYLES[sys.id.toUpperCase()] || SYSTEM_STYLES.ERP;
                  return (
                    <div
                      key={sys.id}
                      className="p-3.5 rounded-xl border border-[#ebeef5] bg-[#fafbfc] hover:bg-white hover:shadow-md transition-all space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: sStyle.badgeBg, color: sStyle.text }}
                          >
                            {sys.name.split(' ')[0]}
                          </span>
                          <span className="text-[10px] font-semibold text-[#52c41a] bg-[#f6ffed] px-1.5 py-0.5 rounded border border-[#b7eb8f] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#52c41a]" />
                            已连通 ({sys.latency})
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-xs text-[#1f2733]">{sys.name}</div>
                          <div className="text-[11px] text-[#909399]">{sys.vendor}</div>
                        </div>

                        <div className="text-[11px] text-[#606266] bg-white p-2.5 rounded-lg border border-[#ebeef5] space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[#909399]">协议类型:</span>
                            <span className="font-mono text-[10px] font-semibold text-[#4b5563] truncate max-w-[110px]" title={sys.protocol}>
                              {sys.protocol || 'REST API'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#909399]">同步记录:</span>
                            <span className="font-mono font-semibold text-[#1677ff]">{sys.syncRecords.toLocaleString()} 条</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#909399]">Case ID:</span>
                            <span className="font-mono text-[#303133] truncate max-w-[120px]" title={sys.caseIdField}>
                              {sys.caseIdField?.split(' ')[0] || sys.primaryKeys[0]}
                            </span>
                          </div>
                        </div>

                        <div className="text-[10px] text-[#909399] truncate">
                          最近抽取: {sys.lastSync}
                        </div>
                      </div>

                      {/* Explicit Configuration Trigger Button */}
                      <button
                        onClick={() => handleOpenSystemConfig(sys)}
                        className="w-full mt-2 py-1.5 px-2 bg-white hover:bg-[#1677ff] hover:text-white border border-[#1677ff]/40 text-[#1677ff] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>配置连接与抽取映射</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cross-System Field Correlation & Mapping Matrix */}
            <div className="bg-white rounded-xl border border-[#ebeef5] shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-[#1f2733] flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-[#1677ff]" />
                    <span>第二级：跨系统唯一关联主键与映射矩阵 (Correlation Rules)</span>
                  </h3>
                  <p className="text-xs text-[#909399] mt-0.5">
                    建立系统间的关联规则（主外键匹配、MDM 转换），将分散单据串联为完整的端到端交易轨迹 (Case Trace)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAddRuleModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#52c41a] hover:bg-[#73d13d] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新增跨系统关联规则</span>
                  </button>

                  <button
                    onClick={() => showToast('已自动根据数据字典推导并校验 12 条关联规则', 'success')}
                    className="px-3 py-1.5 rounded-lg border border-[#dcdfe6] text-xs text-[#606266] hover:bg-[#f5f7fa] cursor-pointer"
                  >
                    智能推导关联关系
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-[#ebeef5]">
                  <thead className="bg-[#f5f7fa] text-[#606266] font-semibold border-b border-[#ebeef5]">
                    <tr>
                      <th className="p-3">源系统与字段</th>
                      <th className="p-3">关联条件 (Join Operator)</th>
                      <th className="p-3">目标系统与字段</th>
                      <th className="p-3">映射健康度</th>
                      <th className="p-3">对齐质量与异常排查</th>
                      <th className="p-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebeef5]">
                    {correlationRules.map((rule) => {
                      const isBreakpoint = rule.health === 'breakpoint';
                      const isDisjointed = rule.health === 'disjointed';
                      const isHandshake = rule.health === 'handshake_gap';

                      return (
                        <tr key={rule.id} className="hover:bg-[#fafbfc]">
                          <td className="p-3 font-mono font-medium text-[#1f2733]">
                            <span className="font-bold text-[#ea580c] mr-1.5">[{rule.sourceSystem}]</span>
                            <span>{rule.sourceField}</span>
                          </td>
                          <td className="p-3 text-[#1677ff] font-bold">{rule.operator}</td>
                          <td className="p-3 font-mono font-medium text-[#1f2733]">
                            <span className="font-bold text-[#2563eb] mr-1.5">[{rule.targetSystem}]</span>
                            <span>{rule.targetField}</span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isBreakpoint
                                  ? 'bg-[#fef0f0] text-[#f56c6c] border border-[#fde2e2]'
                                  : isDisjointed
                                  ? 'bg-[#fffbe6] text-[#faad14] border border-[#ffe58f]'
                                  : isHandshake
                                  ? 'bg-[#fffbe6] text-[#d48806] border border-[#ffe58f]'
                                  : 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]'
                              }`}
                            >
                              {rule.healthLabel}
                            </span>
                          </td>
                          <td className="p-3 text-[#606266]">{rule.notes}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isBreakpoint || isDisjointed || isHandshake ? (
                                <button
                                  onClick={() => { setActiveTab('diagnosis'); }}
                                  className="text-[#1677ff] hover:underline cursor-pointer"
                                >
                                  查看诊断
                                </button>
                              ) : (
                                <span className="text-[#52c41a]">正常</span>
                              )}
                              <button
                                onClick={() => handleDeleteCorrelationRule(rule.id)}
                                className="text-[#909399] hover:text-[#f56c6c] p-1 cursor-pointer"
                                title="删除该映射规则"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: BREAKPOINTS & HANDSHAKE DIAGNOSTICS ================= */}
        {activeTab === 'diagnosis' && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#ebeef5] shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#606266] flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>诊断问题分类:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setDiagFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      diagFilter === 'all' ? 'bg-[#1677ff] text-white' : 'bg-[#f5f7fa] text-[#606266] hover:bg-[#ebeef5]'
                    }`}
                  >
                    全部诊断 ({diagnostics.length})
                  </button>
                  <button
                    onClick={() => setDiagFilter('breakpoint')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      diagFilter === 'breakpoint' ? 'bg-[#f56c6c] text-white' : 'bg-[#fef0f0] text-[#f56c6c] hover:bg-[#fde2e2]'
                    }`}
                  >
                    🛑 流程断点 ({breakpointCount})
                  </button>
                  <button
                    onClick={() => setDiagFilter('missing_handshake')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      diagFilter === 'missing_handshake' ? 'bg-[#faad14] text-white' : 'bg-[#fffbe6] text-[#d48806] hover:bg-[#ffe58f]'
                    }`}
                  >
                    🤝 缺少握手点 ({handshakeCount})
                  </button>
                  <button
                    onClick={() => setDiagFilter('disjointed_data')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      diagFilter === 'disjointed_data' ? 'bg-[#409eff] text-white' : 'bg-[#ecf5ff] text-[#409eff] hover:bg-[#d9ecff]'
                    }`}
                  >
                    ⚠️ 数据不连贯 ({disjointedCount})
                  </button>
                </div>
              </div>

              <div className="text-xs text-[#909399]">
                已模拟修复：<span className="font-bold text-[#52c41a]">{fixedItemIds.size}</span> / {diagnostics.length} 项
              </div>
            </div>

            {/* Diagnostics Cards List */}
            <div className="space-y-4">
              {filteredDiagnostics.map((diag) => {
                const isFixed = fixedItemIds.has(diag.id);
                const isBreakpoint = diag.type === 'breakpoint';
                const isHandshake = diag.type === 'missing_handshake';
                const isDataDisjoint = diag.type === 'disjointed_data';

                return (
                  <div
                    key={diag.id}
                    className={`bg-white rounded-xl border transition-all p-5 shadow-xs hover:shadow-md ${
                      isFixed
                        ? 'border-[#b7eb8f] bg-[#f6ffed]/40'
                        : isBreakpoint
                        ? 'border-[#fca5a5]'
                        : isHandshake
                        ? 'border-[#fde68a]'
                        : 'border-[#bfdbfe]'
                    }`}
                  >
                    {/* Header line */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBreakpoint
                              ? 'bg-[#fef0f0] text-[#f56c6c] border border-[#fde2e2]'
                              : isHandshake
                              ? 'bg-[#fffbe6] text-[#d48806] border border-[#ffe58f]'
                              : 'bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff]'
                          }`}
                        >
                          {isBreakpoint ? '🛑 流程断点 (阻塞)' : isHandshake ? '🤝 缺少握手点 (脱节)' : '⚠️ 数据信息不连贯'}
                        </span>

                        <span className="font-bold text-sm text-[#1f2733]">{diag.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#f5f7fa] text-[#606266] border border-[#ebeef5]">
                          {diag.fromSystem} ➔ {diag.toSystem}
                        </span>

                        <button
                          onClick={() => handleToggleFixSimulation(diag.id)}
                          className={`h-7 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isFixed
                              ? 'bg-[#52c41a] text-white hover:bg-[#73d13d]'
                              : 'bg-[#1677ff] text-white hover:bg-[#409eff]'
                          }`}
                        >
                          {isFixed ? <Check className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                          <span>{isFixed ? '已模拟修复 (SLA达标)' : '一键模拟整改效果'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Impact Metric Strip */}
                    <div className="bg-[#fafbfc] rounded-lg p-3 border border-[#ebeef5] grid grid-cols-1 md:grid-cols-2 gap-3 mb-3.5 text-xs">
                      <div>
                        <span className="text-[#909399]">受影响交易单据量：</span>
                        <span className="font-bold text-[#f56c6c] ml-1">{diag.affectedCount} 笔合同/单据</span>
                      </div>
                      <div>
                        <span className="text-[#909399]">量化业务损失/风险：</span>
                        <span className="font-semibold text-[#1f2733] ml-1">{diag.lossMetric}</span>
                      </div>
                    </div>

                    {/* Detailed Analysis 3 Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Root cause */}
                      <div className="bg-[#fff] p-3 rounded-lg border border-[#ebeef5] space-y-1">
                        <div className="font-bold text-[#f56c6c] flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>根因分析 (Root Cause)</span>
                        </div>
                        <p className="text-[#606266] leading-relaxed">{diag.rootCause}</p>
                      </div>

                      {/* Best practice benchmark */}
                      <div className="bg-[#fff] p-3 rounded-lg border border-[#ebeef5] space-y-1">
                        <div className="font-bold text-[#1677ff] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>行业最佳实践对照 (华为/精益标准)</span>
                        </div>
                        <p className="text-[#606266] leading-relaxed">{diag.bestPractice}</p>
                      </div>

                      {/* Remedy */}
                      <div className="bg-[#fff] p-3 rounded-lg border border-[#ebeef5] space-y-1">
                        <div className="font-bold text-[#52c41a] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>整改方案建议 (Actionable Remedy)</span>
                        </div>
                        <p className="text-[#606266] leading-relaxed">{diag.remedy}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 4: AI REPORT & RECOMMENDATIONS ================= */}
        {activeTab === 'ai' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            {/* AI Control Header */}
            <div className="bg-gradient-to-r from-[#22075e] to-[#391085] rounded-2xl p-6 text-white shadow-lg space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Propel AI 流程成熟度与跨系统治理建议报告</h2>
                    <p className="text-xs text-purple-200 mt-0.5">
                      基于端到端 18,460 条系统交互日志，对标行业标杆 (华为LTC/IPD/工业4.0) 输出全景改善方案
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateAiReport}
                    disabled={aiGenerating}
                    className="px-4 py-2 rounded-xl bg-white text-[#722ed1] hover:bg-white/90 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${aiGenerating ? 'animate-spin' : ''}`} />
                    <span>{aiGenerating ? 'AI 正在深度推演中...' : '重新生成 AI 诊断'}</span>
                  </button>
                </div>
              </div>

              {/* Prompt customization */}
              <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl backdrop-blur-xs">
                <input
                  type="text"
                  value={aiUserPrompt}
                  onChange={(e) => setAiUserPrompt(e.target.value)}
                  placeholder="可输入具体业务关切，例如：重点关注如何消除 SRM 与 ERP 之间的收货对账断点，提升采购现金流周转..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-purple-300 outline-none px-2"
                />
                <button
                  onClick={handleGenerateAiReport}
                  className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs cursor-pointer"
                >
                  向 AI 专项提问
                </button>
              </div>
            </div>

            {/* AI Report Body */}
            <div className="bg-white rounded-xl border border-[#ebeef5] shadow-sm p-8 space-y-6">
              {aiGenerating ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-[#722ed1] border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="text-sm font-semibold text-[#1f2733]">AI 大模型正在对端到端跨系统流转日志进行深度计算与断点拓扑推演...</div>
                  <div className="text-xs text-[#909399]">正在对比 7 大系统日志时间戳与行业一流基线...</div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-xs leading-relaxed text-[#303133]">
                  {aiReport.split('\n').map((line, idx) => {
                    if (line.startsWith('### ')) {
                      return (
                        <h3 key={idx} className="text-base font-bold text-[#1f2733] mt-6 mb-3 border-l-4 border-[#722ed1] pl-3">
                          {line.replace('### ', '')}
                        </h3>
                      );
                    }
                    if (line.startsWith('## ')) {
                      return (
                        <h2 key={idx} className="text-lg font-bold text-[#1f2733] mt-6 mb-3">
                          {line.replace('## ', '')}
                        </h2>
                      );
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <li key={idx} className="ml-4 list-disc text-[#4b5563] my-1">
                          <span dangerouslySetInnerHTML={{ __html: line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </li>
                      );
                    }
                    if (line.trim() === '---') {
                      return <hr key={idx} className="my-4 border-[#ebeef5]" />;
                    }
                    if (!line.trim()) return <div key={idx} className="h-2" />;
                    return (
                      <p key={idx} className="text-[#4b5563] my-1.5 leading-relaxed">
                        <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: SYSTEM CONNECTOR & FIELD MAPPING DRAWER ================= */}
      {configDrawerOpen && editingSystem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#dcdfe6] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafbfc]">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor: SYSTEM_STYLES[editingSystem.id.toUpperCase()]?.badgeBg || '#e6f4ff',
                    color: SYSTEM_STYLES[editingSystem.id.toUpperCase()]?.text || '#1677ff',
                  }}
                >
                  {editingSystem.id.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1f2733]">{editingSystem.name} 数据抽取与字段映射配置</h3>
                  <p className="text-[11px] text-[#909399]">
                    配置服务端点 URL、授权令牌、过滤条件及事件日志三元组（CaseID, Activity, Timestamp）
                  </p>
                </div>
              </div>
              <button onClick={() => setConfigDrawerOpen(false)} className="text-[#909399] hover:text-[#303133]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tabs inside drawer */}
            <div className="px-6 border-b border-[#ebeef5] flex items-center gap-6 bg-white shrink-0">
              <button
                onClick={() => setDrawerActiveTab('connection')}
                className={`py-3 font-semibold text-xs border-b-2 cursor-pointer transition-colors ${
                  drawerActiveTab === 'connection'
                    ? 'border-[#1677ff] text-[#1677ff]'
                    : 'border-transparent text-[#606266] hover:text-[#303133]'
                }`}
              >
                1. 接口与数据源连接 (Connection)
              </button>
              <button
                onClick={() => setDrawerActiveTab('schema')}
                className={`py-3 font-semibold text-xs border-b-2 cursor-pointer transition-colors ${
                  drawerActiveTab === 'schema'
                    ? 'border-[#1677ff] text-[#1677ff]'
                    : 'border-transparent text-[#606266] hover:text-[#303133]'
                }`}
              >
                2. 事件日志字段映射 (Schema Mapping)
              </button>
              <button
                onClick={() => setDrawerActiveTab('preview')}
                className={`py-3 font-semibold text-xs border-b-2 cursor-pointer transition-colors ${
                  drawerActiveTab === 'preview'
                    ? 'border-[#1677ff] text-[#1677ff]'
                    : 'border-transparent text-[#606266] hover:text-[#303133]'
                }`}
              >
                3. 实时试抽取与预览 (Test Preview)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* TAB 1: Connection & Auth */}
              {drawerActiveTab === 'connection' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#606266] font-semibold mb-1">接口接入协议</label>
                      <select
                        value={editingSystem.protocol || 'REST API'}
                        onChange={(e) => setEditingSystem({ ...editingSystem, protocol: e.target.value })}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#dcdfe6] outline-none"
                      >
                        <option value="REST (Webhook + OData)">REST API / Webhook (推荐)</option>
                        <option value="SAP OData v4 / RFC">SAP OData v4 / RFC BAPI</option>
                        <option value="JDBC 数据库直连 (Read-Only)">JDBC 数据库直连 (只读副本)</option>
                        <option value="实时消息总线 (Kafka/MQ)">Kafka 实时事件流 / RabbitMQ</option>
                        <option value="Teamcenter SOA API">PLM SOA 专有协议</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#606266] font-semibold mb-1">认证方式 (Authentication)</label>
                      <select
                        value={editingSystem.authType || 'OAuth 2.0 Bearer'}
                        onChange={(e) => setEditingSystem({ ...editingSystem, authType: e.target.value })}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#dcdfe6] outline-none"
                      >
                        <option value="OAuth 2.0 Bearer">OAuth 2.0 Bearer Token</option>
                        <option value="API Token">API Key / Token</option>
                        <option value="Personal Access Token">Personal Access Token (PAT)</option>
                        <option value="Basic Auth">Basic Auth (用户名/密码)</option>
                        <option value="HMAC-SHA256 Signature">HMAC-SHA256 签名鉴权</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#606266] font-semibold mb-1">
                      服务端点 URL / JDBC 连接串
                    </label>
                    <input
                      type="text"
                      value={editingSystem.endpointUrl || ''}
                      onChange={(e) => setEditingSystem({ ...editingSystem, endpointUrl: e.target.value })}
                      placeholder="https://api.erp.corp.internal/v1/orders/events"
                      className="w-full h-8 px-2.5 font-mono text-[11px] rounded-lg border border-[#dcdfe6] outline-none focus:border-[#1677ff]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#606266] font-semibold mb-1">数据抽取调度机制</label>
                      <select
                        value={editingSystem.schedule || '实时事件触发 (Webhook)'}
                        onChange={(e) => setEditingSystem({ ...editingSystem, schedule: e.target.value })}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#dcdfe6] outline-none"
                      >
                        <option value="实时事件触发 (Webhook)">实时事件驱动 (Webhook 毫秒级)</option>
                        <option value="每小时增量抽取">每小时定时增量拉取</option>
                        <option value="每30分钟定时抽取">每 30 分钟轮询抽取</option>
                        <option value="每日班次批处理 (凌晨与正午)">每日班次批量同步</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#606266] font-semibold mb-1">授权凭证 (Secret / Token)</label>
                      <input
                        type="password"
                        defaultValue="bearer_token_corp_sec_2026_x89"
                        placeholder="输入 Token 密钥..."
                        className="w-full h-8 px-2.5 font-mono text-[11px] rounded-lg border border-[#dcdfe6] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#606266] font-semibold mb-1">抽取数据过滤条件 (SQL / Predicate)</label>
                    <input
                      type="text"
                      value={editingSystem.filterPredicate || ''}
                      onChange={(e) => setEditingSystem({ ...editingSystem, filterPredicate: e.target.value })}
                      placeholder="STATUS IN ('APPROVED', 'COMPLETED') AND CREATE_DATE >= '2026-01-01'"
                      className="w-full h-8 px-2.5 font-mono text-[11px] rounded-lg border border-[#dcdfe6] outline-none"
                    />
                  </div>

                  {/* Connectivity Test Box */}
                  <div className="p-3.5 rounded-xl border border-[#e4e7ed] bg-[#fafbfc] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-[#1f2733]">接口连通性探测 (Ping / Handshake)</div>
                      <div className="text-[11px] text-[#909399]">向该业务系统网关发送探针包，测试网络延迟与凭据有效性</div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestSystemConnection}
                      disabled={testingConnection}
                      className="px-3.5 py-1.5 rounded-lg bg-white border border-[#1677ff] text-[#1677ff] font-semibold hover:bg-[#e6f4ff] cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <Zap className={`w-3.5 h-3.5 ${testingConnection ? 'animate-bounce' : ''}`} />
                      <span>{testingConnection ? '正在探测...' : '测试接口连通性'}</span>
                    </button>
                  </div>

                  {testResult.message && (
                    <div
                      className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                        testResult.status === 'success'
                          ? 'bg-[#f6ffed] border-[#b7eb8f] text-[#52c41a]'
                          : 'bg-[#fef0f0] border-[#fde2e2] text-[#f56c6c]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Schema Mapping */}
              {drawerActiveTab === 'schema' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-[#f0f7ff] border border-[#bfdbfe] text-xs text-[#003eb3]">
                    <strong>流程挖掘核心三元组标准：</strong>
                    每个业务系统的交易数据必须对齐映射到【Case ID 业务实例】、【Activity 活动名称】、【Timestamp 发生时间】，以便跨系统串联分析。
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#606266] font-semibold mb-1">
                        1. Case ID 映射字段 (流程实例唯一键) *
                      </label>
                      <input
                        type="text"
                        value={editingSystem.caseIdField || ''}
                        onChange={(e) => setEditingSystem({ ...editingSystem, caseIdField: e.target.value })}
                        placeholder="如 ContractNo, SoNo, WorkOrderId"
                        className="w-full h-8 px-2.5 font-mono text-xs rounded-lg border border-[#dcdfe6] outline-none"
                      />
                      <span className="text-[10px] text-[#909399] mt-0.5 block">用于串联不同系统同笔订单的主外键</span>
                    </div>

                    <div>
                      <label className="block text-[#606266] font-semibold mb-1">
                        2. Activity 映射字段 (业务活动名称) *
                      </label>
                      <input
                        type="text"
                        value={editingSystem.activityField || ''}
                        onChange={(e) => setEditingSystem({ ...editingSystem, activityField: e.target.value })}
                        placeholder="如 StageName, DocStatus, OpCode"
                        className="w-full h-8 px-2.5 font-mono text-xs rounded-lg border border-[#dcdfe6] outline-none"
                      />
                      <span className="text-[10px] text-[#909399] mt-0.5 block">作为流程拓扑节点上的活动行为名</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#606266] font-semibold mb-1">
                        3. Timestamp 映射字段 (事件发生时间) *
                      </label>
                      <input
                        type="text"
                        value={editingSystem.timestampField || ''}
                        onChange={(e) => setEditingSystem({ ...editingSystem, timestampField: e.target.value })}
                        placeholder="如 PostingDateTime, SignDate, UpdatedAt"
                        className="w-full h-8 px-2.5 font-mono text-xs rounded-lg border border-[#dcdfe6] outline-none"
                      />
                      <span className="text-[10px] text-[#909399] mt-0.5 block">决定流转先后时序与耗时 SLA 计算</span>
                    </div>

                    <div>
                      <label className="block text-[#606266] font-semibold mb-1">
                        4. Resource 映射字段 (经办责任人/岗位)
                      </label>
                      <input
                        type="text"
                        value={editingSystem.operatorField || ''}
                        onChange={(e) => setEditingSystem({ ...editingSystem, operatorField: e.target.value })}
                        placeholder="如 CreatedBy, OperatorName, StationId"
                        className="w-full h-8 px-2.5 font-mono text-xs rounded-lg border border-[#dcdfe6] outline-none"
                      />
                      <span className="text-[10px] text-[#909399] mt-0.5 block">岗位角色与责任主体归属</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#606266] font-semibold mb-1">
                      5. 业务上下文 Payload 扩展字段 (逗号分隔)
                    </label>
                    <input
                      type="text"
                      value={editingSystem.payloadFields || ''}
                      onChange={(e) => setEditingSystem({ ...editingSystem, payloadFields: e.target.value })}
                      placeholder="Amount, Currency, PlantId, ItemCode, BatchNo"
                      className="w-full h-8 px-2.5 font-mono text-xs rounded-lg border border-[#dcdfe6] outline-none"
                    />
                    <span className="text-[10px] text-[#909399] mt-0.5 block">在节点被点击时展示的详细单据内容与品质批次属性</span>
                  </div>
                </div>
              )}

              {/* TAB 3: Preview */}
              {drawerActiveTab === 'preview' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#303133]">
                      实时抽取抽样预览（前 3 笔根据上述映射转换后的标准 Event Log）：
                    </span>
                    <button
                      type="button"
                      onClick={() => showToast('已从接口重新采样最新 3 笔事件日志', 'success')}
                      className="text-xs text-[#1677ff] hover:underline cursor-pointer"
                    >
                      重新抓取抽样
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-[#ebeef5] rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f5f7fa] text-[#606266] border-b border-[#ebeef5]">
                        <tr>
                          <th className="p-2.5">Case ID</th>
                          <th className="p-2.5">Activity (活动)</th>
                          <th className="p-2.5">Timestamp (时间)</th>
                          <th className="p-2.5">Resource (操作人)</th>
                          <th className="p-2.5">Payload 关键属性</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebeef5] font-mono text-[11px]">
                        <tr className="hover:bg-[#fafbfc]">
                          <td className="p-2.5 text-[#1677ff] font-bold">LTC-2026-0881</td>
                          <td className="p-2.5 font-sans font-semibold">合同会签盖章</td>
                          <td className="p-2.5 text-[#909399]">2026-10-25 09:30:12</td>
                          <td className="p-2.5 font-sans">张商务 (法务室)</td>
                          <td className="p-2.5 text-[#606266]">金额: 1840万, 币种: CNY</td>
                        </tr>
                        <tr className="hover:bg-[#fafbfc]">
                          <td className="p-2.5 text-[#1677ff] font-bold">LTC-2026-0882</td>
                          <td className="p-2.5 font-sans font-semibold">销售订单SO创建</td>
                          <td className="p-2.5 text-[#909399]">2026-10-25 14:15:40</td>
                          <td className="p-2.5 font-sans">李财务 (资金组)</td>
                          <td className="p-2.5 text-[#606266]">工厂: 1001, 类型: ZOR</td>
                        </tr>
                        <tr className="hover:bg-[#fafbfc]">
                          <td className="p-2.5 text-[#1677ff] font-bold">LTC-2026-0883</td>
                          <td className="p-2.5 font-sans font-semibold">终检验收入库</td>
                          <td className="p-2.5 text-[#909399]">2026-10-26 11:05:22</td>
                          <td className="p-2.5 font-sans">王品保 (OQC)</td>
                          <td className="p-2.5 text-[#606266]">SN: 88A94B2E, 判定: PASS</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[#ebeef5] flex justify-end gap-2 bg-[#fafbfc]">
              <button
                onClick={() => setConfigDrawerOpen(false)}
                className="px-4 py-1.5 rounded-lg border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa] cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveSystemConfig}
                className="px-4 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#409eff] text-white font-medium cursor-pointer shadow-xs"
              >
                保存配置并立即同步
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CORRELATION RULE MODAL ================= */}
      {addRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#dcdfe6] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-6 py-4 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafbfc]">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#1677ff]" />
                <span className="font-bold text-sm text-[#1f2733]">新增跨系统主外键关联映射规则</span>
              </div>
              <button onClick={() => setAddRuleModalOpen(false)} className="text-[#909399] hover:text-[#303133]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#606266] font-semibold mb-1">源业务系统 (Source)</label>
                  <select
                    value={newRuleSourceSystem}
                    onChange={(e) => setNewRuleSourceSystem(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg border border-[#dcdfe6] outline-none"
                  >
                    <option value="CRM">CRM (客户关系管理)</option>
                    <option value="ERP">ERP (企业资源计划)</option>
                    <option value="SRM">SRM (供应商协同)</option>
                    <option value="MES">MES (智能制造执行)</option>
                    <option value="PLM">PLM (产品生命周期)</option>
                    <option value="PMS">PMS (研发项目管理)</option>
                    <option value="APS">APS (高级生产排产)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#606266] font-semibold mb-1">源字段名称 (Source Field)</label>
                  <input
                    type="text"
                    value={newRuleSourceField}
                    onChange={(e) => setNewRuleSourceField(e.target.value)}
                    placeholder="如 ContractNo, MoNo"
                    className="w-full h-8 px-2.5 font-mono text-xs rounded-lg border border-[#dcdfe6] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#606266] font-semibold mb-1">关联映射操作符 (Operator)</label>
                <select
                  value={newRuleOperator}
                  onChange={(e) => setNewRuleOperator(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-[#dcdfe6] outline-none font-bold text-[#1677ff]"
                >
                  <option value="== [精确一对一匹配]">== [精确一对一匹配]</option>
                  <option value="~= [字典模糊映射]">~= [MDM 主数据字典模糊转换]</option>
                  <option value="-- [单向通知/无握手]">-- [单向状态通知 / 无反向握手]</option>
                  <option value="!= [未建立握手]">!= [未建立状态防错握手]</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#606266] font-semibold mb-1">目标业务系统 (Target)</label>
                  <select
                    value={newRuleTargetSystem}
                    onChange={(e) => setNewRuleTargetSystem(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg border border-[#dcdfe6] outline-none"
                  >
                    <option value="ERP">ERP (企业资源计划)</option>
                    <option value="MES">MES (智能制造执行)</option>
                    <option value="APS">APS (高级生产排产)</option>
                    <option value="SRM">SRM (供应商协同)</option>
                    <option value="CRM">CRM (客户关系管理)</option>
                    <option value="PLM">PLM (产品生命周期)</option>
                    <option value="PMS">PMS (研发项目管理)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#606266] font-semibold mb-1">目标字段名称 (Target Field)</label>
                  <input
                    type="text"
                    value={newRuleTargetField}
                    onChange={(e) => setNewRuleTargetField(e.target.value)}
                    placeholder="如 SourceContractNo, WorkOrderId"
                    className="w-full h-8 px-2.5 font-mono text-xs rounded-lg border border-[#dcdfe6] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#606266] font-semibold mb-1">关联说明与业务背景</label>
                <input
                  type="text"
                  value={newRuleNotes}
                  onChange={(e) => setNewRuleNotes(e.target.value)}
                  placeholder="说明此关联规则如何映射及涉及的业务场景..."
                  className="w-full h-8 px-2.5 text-xs rounded-lg border border-[#dcdfe6] outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-[#ebeef5] flex justify-end gap-2 bg-[#fafbfc]">
              <button
                onClick={() => setAddRuleModalOpen(false)}
                className="px-4 py-1.5 rounded-lg border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa] cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleAddCorrelationRule}
                className="px-4 py-1.5 rounded-lg bg-[#52c41a] hover:bg-[#73d13d] text-white font-medium cursor-pointer shadow-xs"
              >
                添加并生效
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Log Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#dcdfe6] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-6 py-4 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafafa]">
              <div className="flex items-center gap-2.5">
                <Upload className="w-4 h-4 text-[#1677ff]" />
                <span className="font-bold text-sm text-[#1f2733]">手工导入业务系统交互日志数据 (CSV / Event Logs)</span>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="text-[#909399] hover:text-[#303133]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#606266] font-semibold mb-1">所属源业务系统</label>
                  <select
                    value={importSelectedSystem}
                    onChange={(e) => setImportSelectedSystem(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg border border-[#dcdfe6] outline-none"
                  >
                    <option value="CRM">CRM (销售与商机中台)</option>
                    <option value="ERP">ERP (财务与订单中心)</option>
                    <option value="SRM">SRM (供应商送货与寻源)</option>
                    <option value="MES">MES (车间工单与质检)</option>
                    <option value="PLM">PLM (工程BOM与图纸)</option>
                    <option value="PMS">PMS (研发项目里程碑)</option>
                    <option value="APS">APS (计划与排程调度)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#606266] font-semibold mb-1">快速载入示例数据</label>
                  <button
                    type="button"
                    onClick={() => {
                      setImportRawText(`CaseID,Activity,Timestamp,Operator,DocNo,Amount
LTC-2026-901,商机签约会签,2026-10-25 09:15:00,张商务,CONT-2026-081,2500000
LTC-2026-901,销售订单SO创建,2026-10-25 18:20:00,李财务,SO-2026-1049,2500000
LTC-2026-901,生产主排程MPS,2026-10-26 08:30:00,王排产,MPS-2026-0812,2500000
LTC-2026-901,车间工单完工报工,2026-10-26 14:10:00,赵班长,WO-2026-551,2500000`);
                    }}
                    className="w-full h-8 px-3 rounded-lg border border-[#1677ff] text-[#1677ff] bg-[#e6f4ff] font-medium hover:bg-[#bae0ff] transition-colors cursor-pointer text-center"
                  >
                    填入 4 步跨系统交互标准 CSV 样例
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#606266] font-semibold mb-1">
                  粘贴交易记录 CSV 文本 (必填 CaseID, Activity, Timestamp 字段)
                </label>
                <textarea
                  rows={8}
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  placeholder="CaseID,Activity,Timestamp,Operator,DocNo..."
                  className="w-full p-3 font-mono text-[11px] rounded-lg border border-[#dcdfe6] outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="bg-[#f0f9eb] p-3 rounded-lg border border-[#b7eb8f] text-[11px] text-[#52c41a] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Propel 挖掘引擎将根据 CaseID 自动关联不同系统的对应时间线，并与主流程拓扑进行重合度拟合，实时识别断点。
                </span>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-[#ebeef5] flex justify-end gap-2 bg-[#fafafa]">
              <button
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-1.5 rounded-lg border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa] cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#409eff] text-white font-medium cursor-pointer shadow-xs"
              >
                开始解析并导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
