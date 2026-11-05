import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  GitCompare,
  X,
  ArrowLeftRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Clock,
  User,
  Shield,
  FileText,
  Layers,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Check,
  Filter,
  Search,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { DrawioBridge } from '../utils/drawioBridge';
import { parseFlowNodes } from '../utils/flowSchema';

export interface FlowVersionDiffModalProps {
  open: boolean;
  onClose: () => void;
  flow: any;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  initialBaseVer?: string;
  initialCompareVer?: string;
}

export const FlowVersionDiffModal: React.FC<FlowVersionDiffModalProps> = ({
  open,
  onClose,
  flow,
  showToast,
  initialBaseVer,
  initialCompareVer,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [versionList, setVersionList] = useState<any[]>([]);
  const [baseVerNo, setBaseVerNo] = useState<string>('V1');
  const [compareVerNo, setCompareVerNo] = useState<string>('V2');
  const [activeTab, setActiveTab] = useState<'diagram' | 'metadata' | 'summary'>('diagram');
  const [showOnlyDiff, setShowOnlyDiff] = useState<boolean>(false);
  const [metaSearch, setMetaSearch] = useState<string>('');
  const [nodeDrawerOpen, setNodeDrawerOpen] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Draw.io bridge refs for base and compare canvases
  const baseIframeRef = useRef<HTMLIFrameElement | null>(null);
  const compareIframeRef = useRef<HTMLIFrameElement | null>(null);
  const baseBridgeRef = useRef<DrawioBridge | null>(null);
  const compareBridgeRef = useRef<DrawioBridge | null>(null);

  // Fetch version histories
  useEffect(() => {
    if (!open || !flow) return;
    setLoading(true);

    fetch(`/api/flow/model/publishVersionHistories?id=${flow.id}`)
      .then((r) => r.json())
      .then((res) => {
        const list = res?.data || [];
        setVersionList(list);

        if (list.length >= 2) {
          // If initial versions passed, honor them; else baseline is earliest (V1), compare is latest (V2/V3)
          const availableVerNos = list.map((v: any) => v.versionNo);
          const defaultBase = initialBaseVer || list[list.length - 1]?.versionNo || 'V1';
          const defaultCompare = initialCompareVer || list[0]?.versionNo || 'V2';

          setBaseVerNo(availableVerNos.includes(defaultBase) ? defaultBase : list[list.length - 1].versionNo);
          setCompareVerNo(availableVerNos.includes(defaultCompare) ? defaultCompare : list[0].versionNo);
        } else if (list.length === 1) {
          setBaseVerNo(list[0].versionNo);
          setCompareVerNo(list[0].versionNo);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load version histories:', err);
        setLoading(false);
      });
  }, [open, flow?.id, initialBaseVer, initialCompareVer]);

  // Selected version objects
  const baseVersion = useMemo(() => {
    return versionList.find((v) => v.versionNo === baseVerNo) || versionList[versionList.length - 1] || null;
  }, [versionList, baseVerNo]);

  const compareVersion = useMemo(() => {
    return versionList.find((v) => v.versionNo === compareVerNo) || versionList[0] || null;
  }, [versionList, compareVerNo]);

  // Swap Base and Compare versions
  const handleSwapVersions = () => {
    const temp = baseVerNo;
    setBaseVerNo(compareVerNo);
    setCompareVerNo(temp);
    showToast('已交换基准版本与对比版本视角', 'info');
  };

  // Attach and load Base diagram
  useEffect(() => {
    if (!open || activeTab !== 'diagram' || !baseVersion?.xml) return;

    const bridge = new DrawioBridge({
      onReady: () => {
        bridge.loadXml(baseVersion.xml, `${baseVersion.label || flow?.label} (${baseVersion.versionNo})`);
      },
    });
    baseBridgeRef.current = bridge;

    if (baseIframeRef.current) {
      bridge.attachIframe(baseIframeRef.current);
      const timer = setTimeout(() => {
        bridge.loadXml(baseVersion.xml, `${baseVersion.label || flow?.label} (${baseVersion.versionNo})`);
      }, 180);
      return () => {
        clearTimeout(timer);
        bridge.destroy();
        baseBridgeRef.current = null;
      };
    }

    return () => {
      bridge.destroy();
      baseBridgeRef.current = null;
    };
  }, [open, activeTab, baseVersion?.versionNo, baseVersion?.xml]);

  // Attach and load Compare diagram
  useEffect(() => {
    if (!open || activeTab !== 'diagram' || !compareVersion?.xml) return;

    const bridge = new DrawioBridge({
      onReady: () => {
        bridge.loadXml(compareVersion.xml, `${compareVersion.label || flow?.label} (${compareVersion.versionNo})`);
      },
    });
    compareBridgeRef.current = bridge;

    if (compareIframeRef.current) {
      bridge.attachIframe(compareIframeRef.current);
      const timer = setTimeout(() => {
        bridge.loadXml(compareVersion.xml, `${compareVersion.label || flow?.label} (${compareVersion.versionNo})`);
      }, 180);
      return () => {
        clearTimeout(timer);
        bridge.destroy();
        compareBridgeRef.current = null;
      };
    }

    return () => {
      bridge.destroy();
      compareBridgeRef.current = null;
    };
  }, [open, activeTab, compareVersion?.versionNo, compareVersion?.xml]);

  // Parse nodes for both versions to compute node-level diffs
  const baseNodes = useMemo(() => {
    if (!baseVersion?.xml) return [];
    return parseFlowNodes(baseVersion.xml);
  }, [baseVersion?.xml]);

  const compareNodes = useMemo(() => {
    if (!compareVersion?.xml) return [];
    return parseFlowNodes(compareVersion.xml);
  }, [compareVersion?.xml]);

  // Node diff analysis
  const nodeDiffAnalysis = useMemo(() => {
    const diffs: {
      type: 'added' | 'removed' | 'modified' | 'unchanged';
      stepIndex: number;
      baseNode?: any;
      compareNode?: any;
      description: string;
    }[] = [];

    const baseMap = new Map<string, any>();
    baseNodes.forEach((n) => baseMap.set(n.name?.trim(), n));

    const compareMap = new Map<string, any>();
    compareNodes.forEach((n) => compareMap.set(n.name?.trim(), n));

    // Check compare nodes against base nodes
    let idx = 1;
    compareNodes.forEach((cn) => {
      const matchName = cn.name?.trim();
      const bn = baseMap.get(matchName);

      if (!bn) {
        // Look for similar or renamed node
        diffs.push({
          type: 'added',
          stepIndex: idx++,
          compareNode: cn,
          description: `新增环节【${cn.name}】，指定责任角色为【${cn.roles || '无'}】${cn.kcp?.includes('KCP') ? '，并设为KCP关键控制点' : ''}`,
        });
      } else {
        // Check if modified
        const roleChanged = (cn.roles || '').trim() !== (bn.roles || '').trim();
        const kcpChanged = (cn.kcp || '') !== (bn.kcp || '');
        const descChanged = (cn.desc || '').trim() !== (bn.desc || '').trim();
        const durChanged = (cn.duration || '').trim() !== (bn.duration || '').trim();

        if (roleChanged || kcpChanged || descChanged || durChanged) {
          const reasons = [];
          if (roleChanged) reasons.push(`责任角色从「${bn.roles || '-'}」变更为「${cn.roles || '-'}」`);
          if (kcpChanged) reasons.push(cn.kcp?.includes('KCP') ? '增设关键控制点 (KCP)' : '移除控制点标记');
          if (durChanged) reasons.push(`时效调整为 ${cn.duration}`);
          if (descChanged) reasons.push(`活动说明调整`);

          diffs.push({
            type: 'modified',
            stepIndex: idx++,
            baseNode: bn,
            compareNode: cn,
            description: reasons.join('；'),
          });
        } else {
          diffs.push({
            type: 'unchanged',
            stepIndex: idx++,
            baseNode: bn,
            compareNode: cn,
            description: '环节名称、责任角色、时效与控制点保持完全一致',
          });
        }
      }
    });

    // Check for removed nodes that were in base but not in compare
    baseNodes.forEach((bn) => {
      const matchName = bn.name?.trim();
      if (!compareMap.has(matchName)) {
        diffs.push({
          type: 'removed',
          stepIndex: idx++,
          baseNode: bn,
          description: `已废除/移除环节【${bn.name}】（原责任角色: ${bn.roles || '-'}）`,
        });
      }
    });

    const addedCount = diffs.filter((d) => d.type === 'added').length;
    const modifiedCount = diffs.filter((d) => d.type === 'modified').length;
    const removedCount = diffs.filter((d) => d.type === 'removed').length;
    const unchangedCount = diffs.filter((d) => d.type === 'unchanged').length;

    return {
      diffs,
      addedCount,
      modifiedCount,
      removedCount,
      unchangedCount,
    };
  }, [baseNodes, compareNodes]);

  // Metadata attributes definition & diff calculation
  const metadataDiffRows = useMemo(() => {
    if (!baseVersion || !compareVersion) return [];

    const defs: {
      category: string;
      field: string;
      label: string;
      baseVal: any;
      compareVal: any;
      isList?: boolean;
    }[] = [
      {
        category: '基本信息',
        field: 'flowNo',
        label: '流程编号',
        baseVal: baseVersion.flowNo || flow.flowNo || '-',
        compareVal: compareVersion.flowNo || flow.flowNo || '-',
      },
      {
        category: '基本信息',
        field: 'label',
        label: '流程名称',
        baseVal: baseVersion.label || flow.label || '-',
        compareVal: compareVersion.label || flow.label || '-',
      },
      {
        category: '基本信息',
        field: 'versionNo',
        label: '版本号',
        baseVal: baseVersion.versionNo,
        compareVal: compareVersion.versionNo,
      },
      {
        category: '基本信息',
        field: 'status',
        label: '生效状态',
        baseVal: baseVersion.status || '历史已归档',
        compareVal: compareVersion.status || '已发布生效',
      },
      {
        category: '基本信息',
        field: 'publishType',
        label: '发布类型',
        baseVal: baseVersion.publishType || '初始基线发布',
        compareVal: compareVersion.publishType || '生产升级发布',
      },
      {
        category: '基本信息',
        field: 'publishUserName',
        label: '发布人',
        baseVal: baseVersion.publishUserName || '张三',
        compareVal: compareVersion.publishUserName || '系统管理员',
      },
      {
        category: '基本信息',
        field: 'publishTime',
        label: '发布生效时间',
        baseVal: baseVersion.publishTime || '-',
        compareVal: compareVersion.publishTime || '-',
      },
      {
        category: '组织与责任人',
        field: 'ownerName',
        label: '流程责任人',
        baseVal: baseVersion.ownerName || '张三',
        compareVal: compareVersion.ownerName || flow.ownerName || '系统管理员',
      },
      {
        category: '组织与责任人',
        field: 'deptName',
        label: '归口部门',
        baseVal: baseVersion.deptName || '研发规划部',
        compareVal: compareVersion.deptName || flow.deptName || '研发管理部',
      },
      {
        category: '业务范围与规则',
        field: 'applicableScope',
        label: '适用范围',
        baseVal: baseVersion.applicableScope || '研发规划部',
        compareVal: compareVersion.applicableScope || flow.applicableScope || '研发规划部、质量控制部',
      },
      {
        category: '业务范围与规则',
        field: 'businessScope',
        label: '业务领域/业务范围',
        baseVal: baseVersion.businessScope || '集成产品研发',
        compareVal: compareVersion.businessScope || flow.businessScope || '集成产品研发与方案评审',
      },
      {
        category: '业务范围与规则',
        field: 'purpose',
        label: '流程目的与商业价值',
        baseVal: baseVersion.purpose || '规范研发阶段性技术评审基本操作',
        compareVal: compareVersion.purpose || flow.purpose || '保障研发阶段性技术质量达标，强化TRB决议与交叉把关',
      },
      {
        category: '业务范围与规则',
        field: 'drivingRules',
        label: '驱动规则与触发条件',
        baseVal: baseVersion.drivingRules || '研发评审规范草案V1.0',
        compareVal: compareVersion.drivingRules || flow.drivingRules || '研发评审规范与TR评审红线制度V2.1',
      },
      {
        category: '业务范围与规则',
        field: 'flowInput',
        label: '前置业务输入',
        baseVal: baseVersion.flowInput || '技术规格书初稿',
        compareVal: compareVersion.flowInput || flow.flowInput || 'TR阶段技术设计规格书、测试验证大纲',
      },
      {
        category: '业务范围与规则',
        field: 'flowOutput',
        label: '最终交付成果',
        baseVal: baseVersion.flowOutput || '初版评审纪要',
        compareVal: compareVersion.flowOutput || flow.flowOutput || 'TR技术评审决议书、整改闭环追踪表',
      },
      {
        category: '指标与风控',
        field: 'flowKpi',
        label: '关键绩效指标 (KPI)',
        baseVal: baseVersion.flowKpi || '评审按期完成率 ≥ 80%',
        compareVal: compareVersion.flowKpi || flow.flowKpi || '技术评审一次通过率 ≥ 85%，缺陷收敛闭环率 100%',
      },
      {
        category: '指标与风控',
        field: 'riskCompliance',
        label: '风险控制与合规要求',
        baseVal: baseVersion.riskCompliance || '基础合规审核',
        compareVal: compareVersion.riskCompliance || flow.riskCompliance || '技术合规性与知识产权审查，严格遵循CCB基线红线',
      },
      {
        category: '指标与风控',
        field: 'kcpCount',
        label: '关键控制点 (KCP) 数量',
        baseVal: `${(baseVersion.kcps || []).length} 个控制点`,
        compareVal: `${(compareVersion.kcps || []).length} 个控制点`,
      },
      {
        category: '制度与文件',
        field: 'sysDocs',
        label: '关联制度规范文件',
        baseVal: (baseVersion.sysDocs || []).join('、') || '暂无制度绑定',
        compareVal: (compareVersion.sysDocs || []).join('、') || '暂无制度绑定',
      },
    ];

    return defs.map((row) => {
      const bStr = String(row.baseVal || '').trim();
      const cStr = String(row.compareVal || '').trim();
      const isDiff = bStr !== cStr;
      return {
        ...row,
        isDiff,
        status: isDiff ? 'MODIFIED' : 'UNCHANGED',
      };
    });
  }, [baseVersion, compareVersion, flow]);

  // Filtered metadata rows
  const filteredMetadataRows = useMemo(() => {
    return metadataDiffRows.filter((r) => {
      if (showOnlyDiff && !r.isDiff) return false;
      if (metaSearch.trim()) {
        const q = metaSearch.trim().toLowerCase();
        const matchLabel = r.label.toLowerCase().includes(q);
        const matchCat = r.category.toLowerCase().includes(q);
        const matchBase = String(r.baseVal).toLowerCase().includes(q);
        const matchComp = String(r.compareVal).toLowerCase().includes(q);
        if (!matchLabel && !matchCat && !matchBase && !matchComp) return false;
      }
      return true;
    });
  }, [metadataDiffRows, showOnlyDiff, metaSearch]);

  // Diff summary metrics
  const diffMetrics = useMemo(() => {
    const metaDiffCount = metadataDiffRows.filter((r) => r.isDiff).length;
    const kcpDiff = (compareVersion?.kcps?.length || 0) - (baseVersion?.kcps?.length || 0);
    return {
      metaDiffCount,
      kcpDiff,
    };
  }, [metadataDiffRows, baseVersion, compareVersion]);

  // Copy diff report text to clipboard
  const handleCopyDiffReport = () => {
    const lines = [
      `【流程版本对比报告】`,
      `流程：[${flow.flowNo || '-'}] ${flow.label}`,
      `基准版本：${baseVersion?.versionNo} (${baseVersion?.publishTime || '-'} · ${baseVersion?.publishUserName || '-'})`,
      `对比版本：${compareVersion?.versionNo} (${compareVersion?.publishTime || '-'} · ${compareVersion?.publishUserName || '-'})`,
      `生成时间：${new Date().toLocaleString()}`,
      `-----------------------------------------`,
      `一、节点环节变更统计：`,
      `新增环节：${nodeDiffAnalysis.addedCount} 处`,
      `变更环节：${nodeDiffAnalysis.modifiedCount} 处`,
      `移除环节：${nodeDiffAnalysis.removedCount} 处`,
      `保持不变：${nodeDiffAnalysis.unchangedCount} 处`,
      `关键控制点(KCP)净变化：${diffMetrics.kcpDiff >= 0 ? '+' : ''}${diffMetrics.kcpDiff} 个`,
      `-----------------------------------------`,
      `二、主要要素差异明细：`,
    ];

    metadataDiffRows
      .filter((r) => r.isDiff)
      .forEach((r) => {
        lines.push(`• [${r.category}] ${r.label}: 「${r.baseVal}」 ➔ 「${r.compareVal}」`);
      });

    if (compareVersion?.changeLogs?.length) {
      lines.push(`-----------------------------------------`);
      lines.push(`三、修订日志与变更摘要：`);
      compareVersion.changeLogs.forEach((log: string, idx: number) => {
        lines.push(`${idx + 1}. ${log}`);
      });
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setIsCopied(true);
    showToast('对比报告已成功复制到剪贴板', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Export report as text file
  const handleExportReport = () => {
    const lines = [
      `全元流程资产管理平台 - 流程版本比对分析报告`,
      `流程编号: ${flow.flowNo || '-'}`,
      `流程名称: ${flow.label}`,
      `对比基准: ${baseVersion?.versionNo} (${baseVersion?.publishTime || '-'})`,
      `目标版本: ${compareVersion?.versionNo} (${compareVersion?.publishTime || '-'})`,
      `----------------------------------------------------`,
      `【节点与流程拓扑差异】`,
      `新增节点数: ${nodeDiffAnalysis.addedCount}`,
      `修改节点数: ${nodeDiffAnalysis.modifiedCount}`,
      `废除节点数: ${nodeDiffAnalysis.removedCount}`,
      `控制点KCP变动: ${diffMetrics.kcpDiff >= 0 ? '+' : ''}${diffMetrics.kcpDiff}`,
      `\n【环节详细变动清单】`,
    ];

    nodeDiffAnalysis.diffs.forEach((d) => {
      lines.push(`• 环节${d.stepIndex}: [${d.type.toUpperCase()}] ${d.description}`);
    });

    lines.push(`\n【流程元数据与管理要素变更】`);
    metadataDiffRows
      .filter((r) => r.isDiff)
      .forEach((r) => {
        lines.push(`• [${r.category}] ${r.label}: \n  旧值: ${r.baseVal}\n  新值: ${r.compareVal}\n`);
      });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `版本对比报告_${flow.flowNo || 'FLOW'}_${baseVerNo}_vs_${compareVerNo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('已导出版本对比报告文件', 'success');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl w-full max-w-[97vw] h-[95vh] flex flex-col shadow-2xl border border-[#dcdfe6] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header Bar */}
        <div className="px-5 py-3 border-b border-[#e4e7ed] bg-[#f8fafc] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#13c2c2] to-[#36cfc9] text-white flex items-center justify-center shadow-xs">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1f2733]">流程版本双屏对比</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono-tabular font-semibold bg-[#e6fffb] text-[#08979c] border border-[#87e8de]">
                  {flow.flowNo || 'FLOW-001'}
                </span>
                <span className="text-xs text-[#606266] font-medium">{flow.label}</span>
              </div>
              <div className="text-[11px] text-[#909399] flex items-center gap-2 mt-0.5">
                <span>所属架构：{flow.archName || '集成产品开发 IPD'}</span>
                <span>·</span>
                <span>当前有效版本：{flow.versionNo || 'V2'}</span>
              </div>
            </div>
          </div>

          {/* Version Selector Control Group */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#dcdfe6] shadow-2xs">
            {/* Base Version Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#606266] px-1.5 py-0.5 rounded bg-[#f2f6fc] text-[#409eff]">
                基准版本 (Base)
              </span>
              <select
                value={baseVerNo}
                onChange={(e) => setBaseVerNo(e.target.value)}
                className="h-7 text-xs font-mono-tabular font-bold border border-[#dcdfe6] rounded px-2 bg-white text-[#1f2733] focus:border-[#409eff] focus:outline-hidden cursor-pointer"
              >
                {versionList.map((v) => (
                  <option key={v.versionNo} value={v.versionNo}>
                    {v.versionNo} ({v.publishTime?.slice(0, 10) || '-'} {v.publishType || '发布'})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Swap Button */}
            <button
              type="button"
              onClick={handleSwapVersions}
              title="交换基准与对比版本"
              className="w-7 h-7 rounded border border-[#dcdfe6] hover:border-[#409eff] hover:text-[#409eff] bg-[#f8fafc] flex items-center justify-center text-[#606266] cursor-pointer transition-colors shadow-2xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>

            {/* Compare Version Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#606266] px-1.5 py-0.5 rounded bg-[#f6ffed] text-[#52c41a]">
                对比版本 (Target)
              </span>
              <select
                value={compareVerNo}
                onChange={(e) => setCompareVerNo(e.target.value)}
                className="h-7 text-xs font-mono-tabular font-bold border border-[#dcdfe6] rounded px-2 bg-white text-[#1f2733] focus:border-[#52c41a] focus:outline-hidden cursor-pointer"
              >
                {versionList.map((v) => (
                  <option key={v.versionNo} value={v.versionNo}>
                    {v.versionNo} ({v.publishTime?.slice(0, 10) || '-'} {v.publishType || '发布'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyDiffReport}
              className="h-8 px-3 rounded border border-[#dcdfe6] bg-white hover:bg-[#f4f4f5] text-[#606266] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              title="复制文本格式差异报告"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-[#67c23a]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? '已复制' : '复制摘要'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportReport}
              className="h-8 px-3 rounded border border-[#b3d8ff] bg-[#ecf5ff] hover:bg-[#409eff] text-[#409eff] hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              title="导出完整差异报告文档"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出报告</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[#ebeef5] flex items-center justify-center text-[#909399] hover:text-[#1f2733] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Diff KPI Banner */}
        <div className="px-5 py-2.5 bg-white border-b border-[#ebeef5] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#f6ffed] border border-[#b7eb8f] text-[#389e0d] font-medium text-[11px]">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>新增环节：{nodeDiffAnalysis.addedCount} 处</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#fffbe6] border border-[#ffe58f] text-[#d48806] font-medium text-[11px]">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>环节变更：{nodeDiffAnalysis.modifiedCount} 处</span>
            </div>
            {nodeDiffAnalysis.removedCount > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#fff1f0] border border-[#ffa39e] text-[#cf1322] font-medium text-[11px]">
                <MinusCircle className="w-3.5 h-3.5" />
                <span>移除环节：{nodeDiffAnalysis.removedCount} 处</span>
              </div>
            )}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#e6f7ff] border border-[#91d5ff] text-[#096dd9] font-medium text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                控制点KCP变化：{diffMetrics.kcpDiff >= 0 ? `+${diffMetrics.kcpDiff}` : diffMetrics.kcpDiff} 个
              </span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#f9f0ff] border border-[#d3adf7] text-[#531dab] font-medium text-[11px]">
              <FileText className="w-3.5 h-3.5" />
              <span>管理要素差异：{diffMetrics.metaDiffCount} 项变更</span>
            </div>
          </div>

          {/* Navigation View Tabs */}
          <div className="flex items-center gap-1 bg-[#f4f4f5] p-1 rounded-lg border border-[#e4e7ed]">
            <button
              type="button"
              onClick={() => setActiveTab('diagram')}
              className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'diagram'
                  ? 'bg-white text-[#409eff] shadow-xs'
                  : 'text-[#606266] hover:text-[#1f2733]'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>双屏流程图对比</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('metadata')}
              className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'metadata'
                  ? 'bg-white text-[#409eff] shadow-xs'
                  : 'text-[#606266] hover:text-[#1f2733]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>元数据与要素变更对比</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-white text-[#409eff] shadow-xs'
                  : 'text-[#606266] hover:text-[#1f2733]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>综合变更概览</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Dual-Screen Visual Diagram Diff */}
        {activeTab === 'diagram' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc] overflow-hidden">
            {/* Split Screen Container (50% Left / 50% Right) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#dcdfe6] min-h-0">
              {/* Left Pane: Base Version Canvas */}
              <div className="flex flex-col min-h-0 bg-white relative">
                <div className="px-4 py-2 bg-[#f0f5ff] border-b border-[#d6e4ff] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#409eff]" />
                    <span className="font-bold text-xs text-[#1d39c4]">基准版本：{baseVersion?.versionNo || 'V1'}</span>
                    <span className="text-[11px] text-[#595959]">
                      ({baseVersion?.publishTime || '-'} · {baseVersion?.publishUserName || '系统管理员'})
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-white text-[10px] text-[#409eff] border border-[#d6e4ff] font-mono-tabular">
                      {baseNodes.length} 个节点
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => baseBridgeRef.current?.fit()}
                      className="h-6 px-2 rounded border border-[#d6e4ff] bg-white hover:bg-[#409eff] text-[#409eff] hover:text-white text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="画布自适应居中"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>自适应</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => baseBridgeRef.current?.zoomOut()}
                      className="w-6 h-6 rounded border border-[#d6e4ff] bg-white hover:bg-[#409eff] text-[#409eff] hover:text-white flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                      title="缩小"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => baseBridgeRef.current?.zoomIn()}
                      className="w-6 h-6 rounded border border-[#d6e4ff] bg-white hover:bg-[#409eff] text-[#409eff] hover:text-white flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                      title="放大"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 relative min-h-0 bg-[#fdfdfd]">
                  <iframe
                    ref={baseIframeRef}
                    title="基准版本流程图"
                    src="/drawio/index.html?embed=1&proto=json&ui=min&lang=zh&dflowReadOnly=1&modified=0"
                    className="w-full h-full border-0 block"
                  />
                </div>
              </div>

              {/* Right Pane: Compare Version Canvas */}
              <div className="flex flex-col min-h-0 bg-white relative">
                <div className="px-4 py-2 bg-[#f6ffed] border-b border-[#b7eb8f] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#52c41a]" />
                    <span className="font-bold text-xs text-[#237804]">
                      对比版本：{compareVersion?.versionNo || 'V2'}
                    </span>
                    <span className="text-[11px] text-[#595959]">
                      ({compareVersion?.publishTime || '-'} · {compareVersion?.publishUserName || '系统管理员'})
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-white text-[10px] text-[#52c41a] border border-[#b7eb8f] font-mono-tabular">
                      {compareNodes.length} 个节点
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => compareBridgeRef.current?.fit()}
                      className="h-6 px-2 rounded border border-[#b7eb8f] bg-white hover:bg-[#52c41a] text-[#52c41a] hover:text-white text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="画布自适应居中"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>自适应</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => compareBridgeRef.current?.zoomOut()}
                      className="w-6 h-6 rounded border border-[#b7eb8f] bg-white hover:bg-[#52c41a] text-[#52c41a] hover:text-white flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                      title="缩小"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => compareBridgeRef.current?.zoomIn()}
                      className="w-6 h-6 rounded border border-[#b7eb8f] bg-white hover:bg-[#52c41a] text-[#52c41a] hover:text-white flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                      title="放大"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 relative min-h-0 bg-[#fdfdfd]">
                  <iframe
                    ref={compareIframeRef}
                    title="对比版本流程图"
                    src="/drawio/index.html?embed=1&proto=json&ui=min&lang=zh&dflowReadOnly=1&modified=0"
                    className="w-full h-full border-0 block"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Collapsible Step-by-Step Node Diff Tracker */}
            <div className="border-t border-[#dcdfe6] bg-white shrink-0 shadow-lg">
              <div
                onClick={() => setNodeDrawerOpen(!nodeDrawerOpen)}
                className="px-5 py-2 bg-[#fafafa] hover:bg-[#f2f4f8] border-b border-[#ebeef5] flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#1f2733]">
                    环节与节点差异明细对照 ({nodeDiffAnalysis.diffs.length} 处)
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-[#389e0d] font-semibold">● 新增 {nodeDiffAnalysis.addedCount}</span>
                    <span className="text-[#d48806] font-semibold">● 修改 {nodeDiffAnalysis.modifiedCount}</span>
                    <span className="text-[#cf1322] font-semibold">● 移除 {nodeDiffAnalysis.removedCount}</span>
                    <span className="text-[#8c8c8c]">● 一致 {nodeDiffAnalysis.unchangedCount}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#909399]">
                  <span>{nodeDrawerOpen ? '收起对照列表' : '展开对照列表'}</span>
                  {nodeDrawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>

              {nodeDrawerOpen && (
                <div className="max-h-48 overflow-y-auto p-3 text-xs">
                  <div className="border border-[#ebeef5] rounded overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#fafafa] text-[#606266] border-b border-[#ebeef5]">
                          <th className="py-2 px-3 w-16">序号</th>
                          <th className="py-2 px-3 w-24">差异状态</th>
                          <th className="py-2 px-3 w-1/4">基准版本 ({baseVerNo}) 节点</th>
                          <th className="py-2 px-3 w-1/4">对比版本 ({compareVerNo}) 节点</th>
                          <th className="py-2 px-3">变更分析与原因说明</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebeef5]">
                        {nodeDiffAnalysis.diffs.map((d, i) => (
                          <tr key={i} className="hover:bg-[#f9fafc]">
                            <td className="py-2 px-3 font-mono-tabular text-[#909399]">{d.stepIndex}</td>
                            <td className="py-2 px-3">
                              {d.type === 'added' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f6ffed] text-[#389e0d] border border-[#b7eb8f] text-[10.5px] font-semibold">
                                  + 新增环节
                                </span>
                              )}
                              {d.type === 'modified' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#fffbe6] text-[#d48806] border border-[#ffe58f] text-[10.5px] font-semibold">
                                  ● 要素变更
                                </span>
                              )}
                              {d.type === 'removed' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#fff1f0] text-[#cf1322] border border-[#ffa39e] text-[10.5px] font-semibold">
                                  - 已废除
                                </span>
                              )}
                              {d.type === 'unchanged' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f5f5f5] text-[#8c8c8c] text-[10.5px]">
                                  保持一致
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {d.baseNode ? (
                                <div>
                                  <div className="font-semibold text-[#1f2733]">{d.baseNode.name}</div>
                                  <div className="text-[11px] text-[#909399]">
                                    责任人/角色: {d.baseNode.roles || '-'}
                                    {d.baseNode.kcp?.includes('KCP') && (
                                      <span className="ml-1 px-1 py-0.2 rounded bg-[#fff1f0] text-[#f5222d] border border-[#ffa39e] text-[9.5px]">
                                        KCP
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[#c0c4cc] italic">（基准版未包含此环节）</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {d.compareNode ? (
                                <div>
                                  <div className="font-semibold text-[#1f2733]">{d.compareNode.name}</div>
                                  <div className="text-[11px] text-[#909399]">
                                    责任人/角色: {d.compareNode.roles || '-'}
                                    {d.compareNode.kcp?.includes('KCP') && (
                                      <span className="ml-1 px-1 py-0.2 rounded bg-[#fff1f0] text-[#f5222d] border border-[#ffa39e] text-[9.5px]">
                                        KCP
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[#c0c4cc] italic">（对比版已移除此环节）</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-[#595959] leading-relaxed">{d.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Metadata & Attributes Diff */}
        {activeTab === 'metadata' && (
          <div className="flex-1 flex flex-col min-h-0 bg-white p-5 overflow-hidden">
            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#ebeef5] shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={metaSearch}
                    onChange={(e) => setMetaSearch(e.target.value)}
                    placeholder="按要素名称或内容过滤..."
                    className="h-8 pl-8 pr-3 text-xs border border-[#dcdfe6] rounded-lg w-full focus:border-[#409eff] focus:outline-hidden"
                  />
                  {metaSearch && (
                    <button
                      type="button"
                      onClick={() => setMetaSearch('')}
                      className="absolute right-2 top-2 text-[#c0c4cc] hover:text-[#909399]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <label className="flex items-center gap-1.5 text-xs text-[#606266] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showOnlyDiff}
                    onChange={(e) => setShowOnlyDiff(e.target.checked)}
                    className="rounded border-[#dcdfe6] text-[#409eff] focus:ring-0 cursor-pointer"
                  />
                  <span>仅显示有差异的属性要素 (Diff Only)</span>
                </label>
              </div>

              <div className="text-xs text-[#909399]">
                共对比 {metadataDiffRows.length} 项要素 · 发现{' '}
                <span className="font-bold text-[#e6a23c]">{diffMetrics.metaDiffCount} 项存在变更</span>
              </div>
            </div>

            {/* Comparison Grid Table */}
            <div className="flex-1 min-h-0 overflow-y-auto mt-3 border border-[#ebeef5] rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[#f8fafc] z-10 shadow-2xs">
                  <tr className="border-b border-[#ebeef5] text-[#606266]">
                    <th className="py-2.5 px-4 w-44">要素类别与名称</th>
                    <th className="py-2.5 px-3 w-28">对比结论</th>
                    <th className="py-2.5 px-4 w-5/12 bg-[#f0f5ff]/70 text-[#1d39c4] font-semibold">
                      基准版本：{baseVerNo} 取值
                    </th>
                    <th className="py-2.5 px-4 w-5/12 bg-[#f6ffed]/70 text-[#237804] font-semibold">
                      对比版本：{compareVerNo} 取值
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebeef5]">
                  {filteredMetadataRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-[#909399]">
                        未找到符合条件的要素记录
                      </td>
                    </tr>
                  ) : (
                    filteredMetadataRows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          r.isDiff ? 'bg-[#fffbe6]/20 hover:bg-[#fffbe6]/40' : 'hover:bg-[#f9fafc]'
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-[#1f2733] border-r border-[#ebeef5]">
                          <div className="text-[10px] text-[#909399] uppercase tracking-wider mb-0.5">
                            {r.category}
                          </div>
                          <div className="text-xs font-semibold">{r.label}</div>
                        </td>
                        <td className="py-3 px-3 border-r border-[#ebeef5]">
                          {r.isDiff ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#fffbe6] text-[#d48806] border border-[#ffe58f] text-[10.5px] font-semibold">
                              ● 值已变更
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f5f5f5] text-[#8c8c8c] text-[10.5px]">
                              保持一致
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-3 px-4 leading-relaxed border-r border-[#ebeef5] ${
                            r.isDiff ? 'bg-[#fff1f0]/20 text-[#595959]' : 'text-[#303133]'
                          }`}
                        >
                          <div className="break-words">{r.baseVal || '-'}</div>
                        </td>
                        <td
                          className={`py-3 px-4 leading-relaxed ${
                            r.isDiff ? 'bg-[#f6ffed]/40 font-semibold text-[#135200]' : 'text-[#303133]'
                          }`}
                        >
                          <div className="break-words">{r.compareVal || '-'}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Summary & Changelog */}
        {activeTab === 'summary' && (
          <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-[#f8fafc] text-xs space-y-6">
            <div className="bg-white p-5 rounded-xl border border-[#ebeef5] shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#fa8c16]" />
                <h3 className="text-sm font-bold text-[#1f2733]">
                  版本演进与关键升级摘要 ({baseVerNo} ➔ {compareVerNo})
                </h3>
              </div>
              <p className="text-xs text-[#595959] leading-relaxed mb-4">
                {compareVersion?.changeSummary ||
                  `本次从 ${baseVerNo} 升级至 ${compareVerNo}，完成了节点权责梳理与风控升级，主要强化了关键控制点把关，拓宽了业务部门适用边界。`}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[#f0f0f0]">
                <div className="p-3 rounded-lg bg-[#f0f5ff] border border-[#d6e4ff]">
                  <div className="text-[11px] text-[#1d39c4] font-semibold mb-1">基准基线版本 ({baseVerNo})</div>
                  <div className="text-xs text-[#595959] space-y-1">
                    <div>发布时间：{baseVersion?.publishTime || '-'}</div>
                    <div>发布人：{baseVersion?.publishUserName || '-'}</div>
                    <div>责任人：{baseVersion?.ownerName || '-'}</div>
                    <div>适用范围：{baseVersion?.applicableScope || '-'}</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#f6ffed] border border-[#b7eb8f]">
                  <div className="text-[11px] text-[#237804] font-semibold mb-1">当前对比版本 ({compareVerNo})</div>
                  <div className="text-xs text-[#595959] space-y-1">
                    <div>发布时间：{compareVersion?.publishTime || '-'}</div>
                    <div>发布人：{compareVersion?.publishUserName || '-'}</div>
                    <div>责任人：{compareVersion?.ownerName || '-'}</div>
                    <div>适用范围：{compareVersion?.applicableScope || '-'}</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#fffbe6] border border-[#ffe58f]">
                  <div className="text-[11px] text-[#d48806] font-semibold mb-1">差异演进影响</div>
                  <div className="text-xs text-[#595959] space-y-1">
                    <div>拓扑结构：净增 {nodeDiffAnalysis.addedCount - nodeDiffAnalysis.removedCount} 个活动</div>
                    <div>关键控制点：新增 {diffMetrics.kcpDiff} 处控制活动</div>
                    <div>制度文件：{compareVersion?.sysDocs?.length || 0} 篇规章支撑</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Logs List */}
            <div className="bg-white p-5 rounded-xl border border-[#ebeef5] shadow-2xs">
              <h3 className="text-sm font-bold text-[#1f2733] mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#409eff]" />
                <span>详细修订日志条目 (Change Logs)</span>
              </h3>
              <div className="space-y-2.5">
                {(compareVersion?.changeLogs || [
                  '新增TRB决议裁决环节，实行委员会多方会签制',
                  '升级KCP关键控制点，防范设计指标与交付规格偏离',
                  '规范端到端时效与考核KPI指标',
                ]).map((log: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#303133]">
                    <span className="w-5 h-5 rounded-full bg-[#ecf5ff] text-[#409eff] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{log}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Control Points Comparison Matrix */}
            <div className="bg-white p-5 rounded-xl border border-[#ebeef5] shadow-2xs">
              <h3 className="text-sm font-bold text-[#1f2733] mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#52c41a]" />
                <span>关键控制点 (KCP) 双版本对比矩阵</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[#ebeef5] rounded-lg p-3">
                  <div className="font-semibold text-xs text-[#409eff] mb-2">
                    {baseVerNo} 控制点清单 (共 {(baseVersion?.kcps || []).length} 个)
                  </div>
                  {(baseVersion?.kcps || []).length === 0 ? (
                    <div className="text-xs text-[#909399]">该基线版本未设立独立的KCP控制点</div>
                  ) : (
                    <div className="space-y-2">
                      {baseVersion.kcps.map((k: any, i: number) => (
                        <div key={i} className="p-2 rounded bg-[#f4f4f5] text-xs">
                          <div className="font-semibold text-[#1f2733] flex items-center justify-between">
                            <span>
                              {k.code} - {k.name}
                            </span>
                            <span className="text-[10px] text-[#606266]">{k.role}</span>
                          </div>
                          <div className="text-[11px] text-[#909399] mt-0.5">风险描述: {k.riskDesc}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-[#ebeef5] rounded-lg p-3">
                  <div className="font-semibold text-xs text-[#52c41a] mb-2">
                    {compareVerNo} 控制点清单 (共 {(compareVersion?.kcps || []).length} 个)
                  </div>
                  <div className="space-y-2">
                    {(compareVersion?.kcps || []).map((k: any, i: number) => (
                      <div key={i} className="p-2 rounded bg-[#f6ffed] border border-[#d9f7be] text-xs">
                        <div className="font-semibold text-[#135200] flex items-center justify-between">
                          <span>
                            {k.code} - {k.name}
                          </span>
                          <span className="text-[10px] text-[#389e0d] font-semibold">{k.role}</span>
                        </div>
                        <div className="text-[11px] text-[#595959] mt-0.5">管控措施: {k.controlMeasure}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Footer Actions */}
        <div className="px-5 py-3 border-t border-[#e4e7ed] bg-[#f8fafc] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#909399]">
            <Info className="w-3.5 h-3.5" />
            <span>
              双屏模式下支持拖拽缩放与对比排版，您也可以随时切换至「元数据与要素变更对比」查看属性明细。
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportReport}
              className="h-8 px-4 rounded-lg border border-[#dcdfe6] bg-white hover:bg-[#f4f4f5] text-[#606266] text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            >
              导出对比报告
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-5 rounded-lg bg-[#409eff] hover:bg-[#66b1ff] text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            >
              关闭对比
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
