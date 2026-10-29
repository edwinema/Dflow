import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  MoreHorizontal,
  X,
  Send,
  Mic,
  Box,
  Plus,
  Check,
  AlertTriangle,
  LayoutGrid,
  Table2,
  Languages,
  Wand2,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  PlusCircle,
  Loader2,
  CheckCircle2,
  Maximize2,
  ArrowLeftRight,
  Palette,
  FileCheck,
} from 'lucide-react';

export interface AiAssistantChatModalProps {
  open: boolean;
  onClose: () => void;
  flowTitle: string;
  canvasCells: any[];
  dockSide?: 'left' | 'right';
  onToggleDockSide?: () => void;
  onLoadXml: (xml: string, title?: string) => void;
  onAutoLayout: () => void;
  onFitCanvas: () => void;
  onOpenRaciModal: () => void;
  onUpdateStyle: (patch: Record<string, any>) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export type AiMode = 'generate' | 'optimize' | 'audit' | 'raci' | 'translate' | 'grammar' | 'style';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  mode?: AiMode;
  action?: 'loadXml' | 'autoLayout' | 'audit' | 'raci' | 'style';
  steps?: any[];
  xml?: string;
  auditResult?: any;
  raciRows?: any[];
}

const DEFAULT_SUGGESTIONS = [
  { icon: '✦', text: '跨部门请假审批泳道图', mode: 'generate' as AiMode },
  { icon: '✦', text: 'IPD 概念阶段立项评审流程 (含Charter与DCP决策)', mode: 'generate' as AiMode },
  { icon: '✦', text: '芯片流片 Tape-out 物理验证与工程投产全流程', mode: 'generate' as AiMode },
  { icon: '✦', text: 'LTC 销售线索分级与商机转化端到端流程', mode: 'generate' as AiMode },
  { icon: '✦', text: '供应链物料紧急采购与合规内控审批', mode: 'generate' as AiMode },
  { icon: '✦', text: '企业员工入职与多系统IT权限开通闭环', mode: 'generate' as AiMode },
  { icon: '✦', text: '展示 AI 问答系统架构与调度时序图', mode: 'generate' as AiMode },
  { icon: '✦', text: '单点登录认证及令牌校验时序图', mode: 'generate' as AiMode },
];

export const AiAssistantChatModal: React.FC<AiAssistantChatModalProps> = ({
  open,
  onClose,
  flowTitle,
  canvasCells,
  dockSide = 'right',
  onToggleDockSide,
  onLoadXml,
  onAutoLayout,
  onFitCanvas,
  onOpenRaciModal,
  onUpdateStyle,
  showToast,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<AiMode>('generate');
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // In-Page Panel Width (Adjustable left and right)
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('qingprocess_ai_panel_width');
      return saved ? parseInt(saved, 10) : 480;
    } catch {
      return 480;
    }
  });

  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ mouseX: number; startW: number }>({ mouseX: 0, startW: 480 });

  const handleStartResize = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = { mouseX: e.clientX, startW: panelWidth };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStartRef.current.mouseX;
      let nextW = resizeStartRef.current.startW;
      if (dockSide === 'left') {
        nextW = resizeStartRef.current.startW + dx;
      } else {
        nextW = resizeStartRef.current.startW - dx;
      }
      const clamped = Math.max(340, Math.min(window.innerWidth - 420, nextW));
      setPanelWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem('qingprocess_ai_panel_width', String(panelWidth));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, dockSide, panelWidth]);

  // Image 2 Architecture Generation Options
  const [genOptions, setGenOptions] = useState({
    swimlanes: true,
    kcp: true,
    ioArtifacts: true,
  });

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  if (!open) return null;

  const handleResetChat = () => {
    setMessages([]);
    setInputVal('');
    setActiveMode('generate');
    showToast('已开启全新 AI 会话', 'info');
  };

  const sendMessage = async (customPrompt?: string, forcedMode?: AiMode) => {
    const textToSend = (customPrompt !== undefined ? customPrompt : inputVal).trim();
    const modeToSend = forcedMode || activeMode;

    if (!textToSend && modeToSend === 'generate') {
      showToast('请输入您的业务流程需求或选择建议场景', 'warning');
      return;
    }

    const displayText = textToSend || (
      modeToSend === 'optimize' ? '执行几何拓扑排版与连线去重' :
      modeToSend === 'audit' ? '对当前画布流程图执行规范性体检' :
      modeToSend === 'raci' ? '推导当前流程各活动的 RACI 责任矩阵' :
      '执行 AI 流程优化'
    );

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: displayText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: modeToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);
    setContextMenuOpen(false);
    setModeMenuOpen(false);

    try {
      const res = await fetch('/api/ai/flow-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: displayText,
          mode: modeToSend,
          options: genOptions,
          cells: canvasCells,
          flowTitle,
        }),
      }).then((r) => r.json());

      if (res.status === 1 && res.data) {
        const d = res.data;
        const aiMsg: ChatMessage = {
          id: 'ai_' + Date.now(),
          sender: 'ai',
          text: d.reply || '已完成处理',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: d.mode || modeToSend,
          action: d.action,
          steps: d.steps,
          xml: d.xml,
          auditResult: d.auditResult,
          raciRows: d.raciRows,
        };

        setMessages((prev) => [...prev, aiMsg]);

        // Auto execute actions if requested
        if (d.action === 'loadXml' && d.xml) {
          onLoadXml(d.xml, d.title || flowTitle);
          showToast(`已成功载入 ${d.steps?.length || ''} 个业务节点到画布！`, 'success');
        } else if (d.action === 'autoLayout') {
          onAutoLayout();
          showToast('已完成画布拓扑排版与对齐', 'success');
        } else if (d.action === 'audit') {
          showToast(`体检完成，当前健康分：${d.auditResult?.score}分`, 'success');
        }
      } else {
        const errorMsg: ChatMessage = {
          id: 'err_' + Date.now(),
          sender: 'ai',
          text: res.message || 'AI 响应超时，请重试。',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'ai',
          text: `请求异常: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSimulate = () => {
    if (isRecording) {
      setIsRecording(false);
      setInputVal('设计一个跨部门物料采购与合规内控审批泳道流程');
      showToast('语音识别完成', 'success');
    } else {
      setIsRecording(true);
      showToast('正在聆听您的流程设计需求...', 'info');
      setTimeout(() => {
        setIsRecording(false);
        setInputVal('设计一个跨部门物料采购与合规内控审批泳道流程');
        showToast('已自动转换语音为文本', 'success');
      }, 2000);
    }
  };

  const getModeLabel = (m: AiMode) => {
    switch (m) {
      case 'generate':
        return '✨ 一键生成流程';
      case 'optimize':
        return '📐 拓扑排版去重';
      case 'audit':
        return '🩺 流程规范体检';
      case 'raci':
        return '👥 智能推导 RACI';
      case 'translate':
        return '🌐 全文标准翻译';
      case 'grammar':
        return '⚠️ 语法动词修复';
      case 'style':
        return '🪄 高保真美化';
      default:
        return '✨ AI 智能设计';
    }
  };

  return (
    <>
      {/* Invisible global capture layer during drag-resizing so canvas iframe doesn't swallow mouse events */}
      {isResizing && <div className="fixed inset-0 z-50 cursor-col-resize select-none" />}

      {/* In-Page QingProcess AI Assistant Panel (Directly integrated on canvas page side-by-side) */}
      <aside
        style={{ width: `${panelWidth}px` }}
        className={`h-full flex flex-col bg-white ${
          dockSide === 'left' ? 'border-r' : 'border-l'
        } border-[#e4e7ed] shrink-0 relative z-20 text-[#303133] select-none`}
        onClick={() => {
          setModeMenuOpen(false);
          setContextMenuOpen(false);
        }}
      >
        {/* Drag Splitter Handle between Canvas and AI Panel */}
        <div
          onMouseDown={handleStartResize}
          onDoubleClick={() => setPanelWidth(480)}
          title={`按住左右拖拽调整 QingProcess AI 窗口宽度，双击恢复默认 (480px)`}
          className={`absolute top-0 ${
            dockSide === 'right' ? 'left-0 -ml-1.5' : 'right-0 -mr-1.5'
          } w-3 h-full z-30 cursor-col-resize flex items-center justify-center group select-none`}
        >
          <div
            className={`w-[2px] h-full transition-colors ${
              isResizing ? 'bg-[#7c3aed] shadow-[0_0_8px_rgba(124,58,237,0.7)]' : 'bg-transparent group-hover:bg-[#7c3aed]'
            }`}
          />
        </div>

        {/* Top Header */}
        <div className="h-[50px] px-3.5 border-b border-[#f0f2f5] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleResetChat();
              }}
              title="新建对话"
              className="w-7 h-7 rounded-full hover:bg-[#f2f4f7] text-[#606266] flex items-center justify-center cursor-pointer transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-[#606266]" />
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border border-purple-100/80 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-semibold text-purple-900 tracking-tight">QingProcess AI</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black tracking-tight">
                AI 3.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[#606266]">
            {/* Dock Switch: Left / Right */}
            {onToggleDockSide && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDockSide();
                }}
                title={dockSide === 'right' ? '移动停靠至画板左侧' : '移动停靠至画板右侧'}
                className="h-7 px-2 rounded-md hover:bg-purple-50 text-[#606266] hover:text-purple-700 flex items-center gap-1 cursor-pointer transition-colors text-[11px] border border-transparent hover:border-purple-200"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" />
                <span className="font-medium">{dockSide === 'right' ? '移至左侧' : '移至右侧'}</span>
              </button>
            )}

            {/* Architecture Generation Configuration */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOptionsExpanded(!optionsExpanded);
              }}
              title="AI 架构配置"
              className={`w-7 h-7 rounded-full hover:bg-[#f2f4f7] flex items-center justify-center cursor-pointer transition-colors ${
                optionsExpanded ? 'text-[#7c3aed] bg-purple-50' : ''
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>

            {/* History */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showToast('已加载当前流程历史会话快照', 'info');
              }}
              title="历史会话"
              className="w-7 h-7 rounded-full hover:bg-[#f2f4f7] flex items-center justify-center cursor-pointer transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>

            {/* More Menu */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setContextMenuOpen(!contextMenuOpen);
              }}
              title="更多操作"
              className="w-7 h-7 rounded-full hover:bg-[#f2f4f7] flex items-center justify-center cursor-pointer transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              title="收起 QingProcess AI 面板"
              className="w-7 h-7 rounded-full hover:bg-[#f2f4f7] text-[#909399] hover:text-[#303133] flex items-center justify-center cursor-pointer transition-colors ml-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature Mode Switcher Pills (Image 2 modes fully incorporated) */}
        <div className="px-4 py-2 border-b border-[#f2f4f7] bg-[#fafafa]/80 flex items-center justify-between gap-1 overflow-x-auto shrink-0 text-xs">
          {[
            { id: 'generate', label: '✨ 一键生成' },
            { id: 'optimize', label: '📐 拓扑排版' },
            { id: 'audit', label: '🩺 规范体检' },
            { id: 'raci', label: '👥 智能推导 RACI' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMode(tab.id as AiMode);
              }}
              className={`px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all font-medium text-[11px] ${
                activeMode === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-[#e4e7ed] text-[#606266] hover:bg-[#f5f7fa] hover:text-[#1f2733]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Expandable Architecture Settings (From Image 2) */}
        {optionsExpanded && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-purple-50/60 to-indigo-50/60 border-b border-purple-100 shrink-0 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-purple-950 text-[11px]">AI 架构生成高级选项：</span>
              <button
                type="button"
                onClick={() => setOptionsExpanded(false)}
                className="text-[10px] text-purple-600 hover:underline cursor-pointer"
              >
                收起配置
              </button>
            </div>
            <div className="space-y-1.5 text-[#475569] text-[11px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={genOptions.swimlanes}
                  onChange={(e) => setGenOptions({ ...genOptions, swimlanes: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-0"
                />
                <span>自动规划端到端多角色跨职能泳道 (Swimlanes)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={genOptions.kcp}
                  onChange={(e) => setGenOptions({ ...genOptions, kcp: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-0"
                />
                <span>自动识别并标注业务关键控制点 (KCP) 与质量门径</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={genOptions.ioArtifacts}
                  onChange={(e) => setGenOptions({ ...genOptions, ioArtifacts: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-0"
                />
                <span>生成对应活动的输入物 (Input) 与交付文档 (Output)</span>
              </label>
            </div>
          </div>
        )}

        {/* Chat / Welcome Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            /* Welcome / Empty Screen: Image 1 Style */
            <div className="flex flex-col items-center justify-center min-h-[420px] pt-4 text-center">
              {/* Hero Title */}
              <div className="flex items-center justify-center gap-2.5 mb-2">
                <h1 className="text-2xl font-serif font-medium text-[#1f2733] tracking-wider">
                  你说，我来画
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-xs">
                  AI 3.0
                </span>
              </div>

              {/* Subtitle */}
              <p className="text-xs text-[#8c9098] font-serif leading-relaxed max-w-[340px] mb-8">
                QingProcess AI 自动理解内容，生成专业图形，
                <br />
                让复杂的信息一目了然
              </p>

              {/* Suggestions List (Image 1 Style with Sparkle icons) */}
              <div className="w-full space-y-2.5 text-left px-2 max-w-[420px]">
                {DEFAULT_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sendMessage(item.text, item.mode);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-[#f5f7fa] border border-transparent hover:border-[#ebeef5] flex items-center gap-2.5 text-xs text-[#4b5563] hover:text-[#111827] cursor-pointer transition-all group shadow-2xs hover:shadow-xs bg-white/70"
                  >
                    <span className="text-[#9ca3af] group-hover:text-purple-600 text-sm">
                      {item.icon}
                    </span>
                    <span className="truncate">{item.text}</span>
                  </button>
                ))}
              </div>

              {/* Quick Action Badges */}
              <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-[420px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sendMessage('对当前流程图进行几何拓扑与走线去重优化', 'optimize');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1d4ed8] text-[11px] font-medium flex items-center gap-1.5 cursor-pointer border border-blue-200"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>一键拓扑排版</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sendMessage('全面体检流程规范性与起止闭环', 'audit');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#047857] text-[11px] font-medium flex items-center gap-1.5 cursor-pointer border border-emerald-200"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>流程规范体检</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sendMessage('推导画布活动的 RACI 责任矩阵', 'raci');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#faf5ff] hover:bg-[#f3e8ff] text-[#7e22ce] text-[11px] font-medium flex items-center gap-1.5 cursor-pointer border border-purple-200"
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>智能推导 RACI</span>
                </button>
              </div>
            </div>
          ) : (
            /* Message Thread */
            <div className="space-y-4 pt-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block p-3 rounded-2xl text-xs leading-relaxed text-left ${
                        msg.sender === 'user'
                          ? 'bg-[#1677ff] text-white rounded-tr-xs shadow-xs'
                          : 'bg-[#f4f6f8] text-[#1f2733] rounded-tl-xs border border-[#ebeef5]'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {/* Interactive Generated Flow Card */}
                      {msg.action === 'loadXml' && msg.steps && msg.steps.length > 0 && (
                        <div className="mt-3 p-3 bg-white rounded-xl border border-[#e4e7ed] shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-2">
                            <span className="font-bold text-[#1f2733] text-xs">
                              规划交付步骤 ({msg.steps.length} 节点)
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                              ✓ 已绘制至画布
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {msg.steps.map((st: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 p-1.5 rounded-lg bg-[#fafafa] border border-[#f0f2f5] text-[11px]"
                              >
                                <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-[#1f2733] flex items-center gap-1.5">
                                    <span className="truncate">{st.title}</span>
                                    {st.kcp && (
                                      <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-semibold">
                                        KCP
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#909399] flex items-center gap-2 mt-0.5">
                                    <span>角色: {st.role}</span>
                                    {st.out && <span>交付: {st.out}</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="pt-1 flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (msg.xml) onLoadXml(msg.xml);
                                onFitCanvas();
                                showToast('已将生成的流程图覆盖重载至画板', 'success');
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#409eff] text-white font-medium text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>重载至画板</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onAutoLayout();
                                showToast('已优化排版', 'success');
                              }}
                              className="px-3 py-1.5 rounded-lg border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa] text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <LayoutGrid className="w-3.5 h-3.5 text-[#1677ff]" />
                              <span>拓扑优化</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Interactive Audit Result Card */}
                      {msg.action === 'audit' && msg.auditResult && (
                        <div className="mt-3 p-3 bg-white rounded-xl border border-[#e4e7ed] shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#1f2733]">流程规范性体检诊断</span>
                            <span className="font-black text-sm text-emerald-600">
                              {msg.auditResult.score} / 100 分
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {(msg.auditResult.issues || []).map((iss: any, idx: number) => (
                              <div
                                key={idx}
                                className={`p-2 rounded-lg text-[11px] border flex items-start gap-1.5 ${
                                  iss.level === 'high'
                                    ? 'bg-red-50/70 border-red-200 text-red-900'
                                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                                }`}
                              >
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-current" />
                                <div>
                                  <div className="font-semibold">{iss.title}</div>
                                  <p className="text-[10px] opacity-80 mt-0.5">{iss.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onAutoLayout();
                              showToast('已根据体检建议智能优化连线与闭环', 'success');
                            }}
                            className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1 cursor-pointer mt-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>一键自动修复规避风险</span>
                          </button>
                        </div>
                      )}

                      {/* Interactive RACI Matrix Card */}
                      {msg.action === 'raci' && msg.raciRows && (
                        <div className="mt-3 p-3 bg-white rounded-xl border border-[#e4e7ed] shadow-2xs space-y-2">
                          <span className="font-bold text-[#1f2733] block">推导的 RACI 权责明细</span>
                          <div className="border border-[#ebeef5] rounded-lg overflow-hidden text-[11px]">
                            <div className="grid grid-cols-4 bg-[#f8f9fb] p-1.5 font-bold text-[#606266] border-b border-[#ebeef5]">
                              <span className="col-span-2">活动名称</span>
                              <span>R (负责)</span>
                              <span>A (问责)</span>
                            </div>
                            {msg.raciRows.slice(0, 4).map((row: any, rIdx: number) => (
                              <div
                                key={rIdx}
                                className="grid grid-cols-4 p-1.5 border-b border-[#f5f7fa] last:border-0"
                              >
                                <span className="col-span-2 truncate font-medium">{row.activity}</span>
                                <span className="text-purple-700 truncate">{row.r}</span>
                                <span className="text-[#606266] truncate">{row.a}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onOpenRaciModal();
                              onClose();
                            }}
                            className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Table2 className="w-3.5 h-3.5" />
                            <span>在完整 RACI 矩阵中查看与编辑</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-[#c0c4cc] block px-1">{msg.timestamp}</span>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      Q
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-spin" />
                  </div>
                  <div className="bg-[#f4f6f8] text-[#606266] p-3 rounded-2xl rounded-tl-xs border border-[#ebeef5] text-xs flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    <span>AI 正在深度思考并构建专业图元结构...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Area: Image 1 Style */}
        <div className="p-3 border-t border-[#f0f2f5] bg-white relative shrink-0">
          {/* Red Box Context Menu (From Image 1: 全文翻译, 语法修复, 风格美化) */}
          {contextMenuOpen && (
            <div
              className="absolute left-4 bottom-[84px] bg-white border border-[#e4e7ed] rounded-xl shadow-xl py-1.5 w-36 z-50 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  sendMessage('将当前流程活动术语翻译为标准英文 BPMN 规范', 'translate');
                  setContextMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-[#f5f7fa] flex items-center justify-between text-[#303133] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-purple-600" />
                  <span>全文翻译</span>
                </div>
                <ChevronRight className="w-3 h-3 text-[#909399]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  sendMessage('对当前流程节点执行动宾规范化语法修复', 'grammar');
                  setContextMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-[#f5f7fa] flex items-center gap-2 text-[#303133] cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>语法修复</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sendMessage('应用企业标准商务科技蓝风格美化', 'style');
                  setContextMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-[#f5f7fa] flex items-center gap-2 text-[#303133] cursor-pointer"
              >
                <Wand2 className="w-4 h-4 text-indigo-500" />
                <span>风格美化</span>
              </button>
            </div>
          )}

          {/* Mode Selector Dropdown (From Image 1 📦 Box icon) */}
          {modeMenuOpen && (
            <div
              className="absolute left-10 bottom-[84px] bg-white border border-[#e4e7ed] rounded-xl shadow-xl py-1.5 w-44 z-50 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-1 text-[10px] text-[#909399] font-semibold border-b border-[#f0f2f5] mb-1">
                选择功能模式
              </div>
              {[
                { id: 'generate', label: '✨ 一键生成流程', desc: '根据诉求自动绘制' },
                { id: 'optimize', label: '📐 拓扑排版去重', desc: '理顺交叉，几何对齐' },
                { id: 'audit', label: '🩺 流程规范体检', desc: '健康度与闭环诊断' },
                { id: 'raci', label: '👥 智能推导 RACI', desc: '权责矩阵分析' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setActiveMode(m.id as AiMode);
                    setModeMenuOpen(false);
                    showToast(`已切换至: ${m.label}`, 'info');
                  }}
                  className={`w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] cursor-pointer ${
                    activeMode === m.id ? 'text-purple-700 bg-purple-50/60 font-semibold' : 'text-[#303133]'
                  }`}
                >
                  <div>{m.label}</div>
                  <div className="text-[10px] text-[#909399]">{m.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* Rounded Input Container: Matching Image 1 */}
          <div className="bg-[#f8f9fa] border border-[#e4e7ed] rounded-2xl p-2.5 focus-within:border-purple-500 focus-within:bg-white focus-within:shadow-md transition-all">
            {/* Active Mode Pill Indicator */}
            <div className="flex items-center justify-between mb-1 px-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setModeMenuOpen(!modeMenuOpen);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100/70 hover:bg-purple-200/80 text-purple-700 text-[10px] font-semibold cursor-pointer transition-colors"
                title="点击切换功能模式"
              >
                <span>{getModeLabel(activeMode)}</span>
                <ChevronDown className="w-2.5 h-2.5 text-purple-600" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOptionsExpanded(!optionsExpanded);
                }}
                className="text-[10px] text-[#909399] hover:text-purple-600 flex items-center gap-1 cursor-pointer"
              >
                <span>架构配置</span>
                <ChevronDown className={`w-2.5 h-2.5 transition-transform ${optionsExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Auto-growing Textarea */}
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                activeMode === 'generate'
                  ? '你可以试着输入：设计一个跨部门请假审批泳道流程...'
                  : activeMode === 'optimize'
                  ? '输入排版要求，或直接点击发送立即优化...'
                  : activeMode === 'audit'
                  ? '输入重点关注的合规审查项，或直接点击发送...'
                  : '输入岗位权责约束，或直接点击发送推导 RACI...'
              }
              className="w-full bg-transparent outline-none text-xs text-[#1f2733] placeholder-[#9ca3af] resize-none px-1 py-0.5"
            />

            {/* Bottom Toolbar of the Input Area: Image 1 Style */}
            <div className="flex items-center justify-between pt-1 mt-1 border-t border-[#f0f2f5]/80">
              <div className="flex items-center gap-1">
                {/* Plus (+) button: Toggles text helper context menu */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenuOpen(!contextMenuOpen);
                  }}
                  className={`w-7 h-7 rounded-lg hover:bg-white text-[#606266] flex items-center justify-center cursor-pointer transition-colors ${
                    contextMenuOpen ? 'bg-purple-50 text-purple-700' : ''
                  }`}
                  title="常用文本与美化工具 (全文翻译 / 语法修复 / 风格美化)"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Box (📦) button: Functional Mode Selector */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModeMenuOpen(!modeMenuOpen);
                  }}
                  className={`w-7 h-7 rounded-lg hover:bg-white text-[#606266] flex items-center justify-center cursor-pointer transition-colors ${
                    modeMenuOpen ? 'bg-purple-50 text-purple-700' : ''
                  }`}
                  title="功能模式选择 (生成流程 / 拓扑排版 / 规范体检 / RACI推导)"
                >
                  <Box className="w-4 h-4" />
                </button>

                {/* Mic (🎙️) button */}
                <button
                  type="button"
                  onClick={handleVoiceSimulate}
                  className={`w-7 h-7 rounded-lg hover:bg-white text-[#606266] flex items-center justify-center cursor-pointer transition-colors ${
                    isRecording ? 'text-red-600 animate-pulse bg-red-50' : ''
                  }`}
                  title={isRecording ? '正在录音...' : '语音输入'}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              {/* Send Button: Paper Airplane Icon */}
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={loading}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center cursor-pointer transition-all shadow-md disabled:opacity-50 active:scale-95"
                title="发送"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
