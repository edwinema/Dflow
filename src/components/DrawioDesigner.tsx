import React, { useState, useRef, useEffect } from 'react';
import {
  Save,
  Download,
  Sparkles,
  Eye,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle2,
  Undo2,
  Redo2,
  Paintbrush,
  StickyNote,
  Table2,
  Link2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  PaintBucket,
  PenTool,
  Layers,
  LayoutGrid,
  Plus,
  Search,
  Send,
  History,
  X,
  Trash2,
  Upload,
  Maximize2,
  Loader2,
  LayoutTemplate,
  Shapes,
  Wand2,
  MousePointer,
  Hand,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  SlidersHorizontal,
  Eraser,
  Image,
  Type,
  Phone,
  Share2,
  AlertTriangle,
  Check,
  RotateCcw,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  MoreHorizontal,
  FileText,
  Copy,
  Scissors,
  CheckCircle,
  Settings,
} from 'lucide-react';
import { DrawioBridge, CanvasStats } from '../utils/drawioBridge';
import {
  FLOW_SHAPES,
  BASIC_SHAPES,
  EVC_SHAPES,
  SWIMLANE_SHAPES,
  buildArchTreeXml,
  ShapeItem,
} from '../utils/flowSchema';
import { RaciMatrixModal, normalizeNodeRaci } from './RaciMatrixModal';
import { AiAssistantChatModal } from './AiAssistantChatModal';
import { NodePropertiesDrawer } from './NodePropertiesDrawer';

interface DrawioDesignerProps {
  flowId: string;
  onBack: () => void;
  onOpenViewer: (flowId: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onNavigate?: (path: string) => void;
}

const AI_QUICK_PROMPTS = [
  'IPD 概念阶段立项评审流程 (含Charter与DCP决策)',
  '芯片流片 Tape-out 物理验证与工程投产全流程 (含DRC/LVS与Sign-off)',
  'LTC 销售线索分级与商机转化端到端流程 (含BANT验证与特批会签)',
];

const COLOR_SWATCHES = [
  '#ffffff',
  '#f8f9fb',
  '#ecf5ff',
  '#f0f9eb',
  '#fdf6ec',
  '#fef0f0',
  '#FACD91',
  '#409eff',
  '#67c23a',
  '#e6a23c',
  '#f56c6c',
  '#333333',
];

const STENCIL_GROUPS = [
  { id: 'flow', title: '标准流程节点', desc: '业务活动、判断分支、文档与角色', items: FLOW_SHAPES },
  { id: 'swimlane', title: '泳道与容器', desc: '跨职能横/纵泳道池与阶段划分线', items: SWIMLANE_SHAPES },
  { id: 'evc', title: '企业价值链 (EVC)', desc: '企业端到端架构主线阶段箭头', items: EVC_SHAPES },
  { id: 'basic', title: '基础图形库', desc: '文本、便签、几何图元与连接符号', items: BASIC_SHAPES },
];

const ShapeSvgIcon: React.FC<{ type: string; colorMode: 'mono' | 'color' }> = ({ type, colorMode }) => {
  const isColor = colorMode === 'color';
  const stroke = isColor ? '#2c3e50' : '#4b5563';
  const fillFlow = isColor ? '#ecf5ff' : '#ffffff';
  const fillRole = isColor ? '#FACD91' : '#f3f4f6';
  const fillJudge = isColor ? '#e1f3d8' : '#ffffff';
  const fillEvc = isColor ? '#ecf5ff' : '#ffffff';
  const fillSwimHeader = isColor ? '#e8eef5' : '#f3f4f6';

  switch (type) {
    // === EVC 价值链图元 ===
    case 'evcChevronRight':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon
            points="3,5 19,5 24,12 19,19 3,19 8,12"
            fill={fillEvc}
            stroke={isColor ? '#409eff' : stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'evcChevronLeft':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon
            points="8,5 24,5 19,12 24,19 8,19 3,12"
            fill={fillEvc}
            stroke={isColor ? '#409eff' : stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'evcPentagonRight':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon
            points="3,5 19,5 24,12 19,19 3,19"
            fill={isColor ? '#f0f9eb' : '#ffffff'}
            stroke={isColor ? '#67c23a' : stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'evcPentagonLeft':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon
            points="8,5 24,5 24,19 8,19 3,12"
            fill={isColor ? '#f0f9eb' : '#ffffff'}
            stroke={isColor ? '#67c23a' : stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'evcPentagonUp':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon
            points="3,19 3,9 14,4 25,9 25,19"
            fill={isColor ? '#fdf6ec' : '#ffffff'}
            stroke={isColor ? '#e6a23c' : stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'evcPentagonDown':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon
            points="3,5 25,5 25,15 14,20 3,15"
            fill={isColor ? '#fdf6ec' : '#ffffff'}
            stroke={isColor ? '#e6a23c' : stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    // === 泳道与容器 ===
    case 'swimlanePoolV':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="3" y="3" width="22" height="18" rx="1" fill="#ffffff" stroke={stroke} strokeWidth="1.4" />
          <rect x="3" y="3" width="22" height="4.5" fill={fillSwimHeader} stroke={stroke} strokeWidth="1.2" />
          <line x1="14" y1="7.5" x2="14" y2="21" stroke={stroke} strokeWidth="1.2" strokeDasharray="3,2" />
        </svg>
      );
    case 'swimlaneV':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="6" y="3" width="16" height="18" rx="1" fill="#ffffff" stroke={stroke} strokeWidth="1.4" />
          <rect x="6" y="3" width="16" height="4.5" fill={fillSwimHeader} stroke={stroke} strokeWidth="1.2" />
        </svg>
      );
    case 'swimlanePoolH':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="3" y="3" width="22" height="18" rx="1" fill="#ffffff" stroke={stroke} strokeWidth="1.4" />
          <rect x="3" y="3" width="5.5" height="18" fill={fillSwimHeader} stroke={stroke} strokeWidth="1.2" />
          <line x1="8.5" y1="12" x2="25" y2="12" stroke={stroke} strokeWidth="1.2" strokeDasharray="3,2" />
        </svg>
      );
    case 'swimlaneH':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="3" y="6" width="22" height="12" rx="1" fill="#ffffff" stroke={stroke} strokeWidth="1.4" />
          <rect x="3" y="6" width="5.5" height="12" fill={fillSwimHeader} stroke={stroke} strokeWidth="1.2" />
        </svg>
      );
    case 'swimlaneSepH':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <line x1="3" y1="12" x2="25" y2="12" stroke={isColor ? '#409eff' : stroke} strokeWidth="1.8" strokeDasharray="4,2" />
        </svg>
      );
    case 'swimlaneSepV':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <line x1="14" y1="3" x2="14" y2="21" stroke={isColor ? '#409eff' : stroke} strokeWidth="1.8" strokeDasharray="4,2" />
        </svg>
      );

    // === 标准流程节点 ===
    case 'nodeActiveSerialRect':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="3" y="4" width="22" height="16" rx="2" fill={fillFlow} stroke={stroke} strokeWidth="1.5" />
          <rect x="3" y="4" width="22" height="4" fill={isColor ? '#409eff' : stroke} />
          <line x1="7" y1="12" x2="17" y2="12" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
          <line x1="7" y1="15" x2="13" y2="15" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'nodeActiveFlow':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="3" y="4" width="22" height="16" rx="2.5" fill={fillFlow} stroke={isColor ? '#409eff' : stroke} strokeWidth="1.5" />
          <line x1="8" y1="12" x2="20" y2="12" stroke={isColor ? '#409eff' : stroke} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'defaultDiamond':
    case 'nodeActiveJudge':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon points="14,3 25,12 14,21 3,12" fill={fillJudge} stroke={isColor ? '#409eff' : stroke} strokeWidth="1.5" strokeLinejoin="round" />
          <text x="14" y="15" textAnchor="middle" fontSize="9" fontWeight="bold" fill={isColor ? '#409eff' : stroke}>?</text>
        </svg>
      );
    case 'nodeRoleName':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="3" y="5" width="22" height="14" rx="2" fill={fillRole} stroke={isColor ? '#d97706' : stroke} strokeWidth="1.5" />
          <circle cx="9" cy="12" r="2.2" fill="none" stroke={isColor ? '#92400e' : stroke} strokeWidth="1.2" />
          <line x1="14" y1="12" x2="21" y2="12" stroke={isColor ? '#92400e' : stroke} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'nodeVirtualRoleName':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="3" y="5" width="22" height="14" rx="2" fill={isColor ? '#fef3c7' : 'none'} stroke={isColor ? '#d97706' : stroke} strokeWidth="1.5" strokeDasharray="3,2" />
          <circle cx="9" cy="12" r="2.2" fill="none" stroke={isColor ? '#92400e' : stroke} strokeWidth="1.2" />
          <line x1="14" y1="12" x2="21" y2="12" stroke={isColor ? '#92400e' : stroke} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'nodeFile':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <path d="M5 4h12l5 5v11H5z" fill={fillFlow} stroke={stroke} strokeWidth="1.5" />
          <path d="M17 4v5h5" fill="none" stroke={stroke} strokeWidth="1.2" />
          <line x1="8" y1="13" x2="16" y2="13" stroke={isColor ? '#409eff' : stroke} strokeWidth="1.3" strokeLinecap="round" />
          <line x1="8" y1="16" x2="19" y2="16" stroke={isColor ? '#409eff' : stroke} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'defaultCapsule':
    case 'startEnd':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="3" y="6" width="22" height="12" rx="6" fill={isColor ? '#f0f9eb' : 'none'} stroke={isColor ? '#67c23a' : stroke} strokeWidth="1.6" />
          <circle cx="9" cy="12" r="1.8" fill={isColor ? '#67c23a' : stroke} />
          <line x1="13" y1="12" x2="20" y2="12" stroke={isColor ? '#67c23a' : stroke} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'nodeActiveOutData':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon points="3,5 19,5 24,12 19,19 3,19 7,12" fill={fillFlow} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'nodeActiveSubFlow':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="3" y="4" width="22" height="16" rx="2" fill={fillFlow} stroke={stroke} strokeWidth="1.5" />
          <line x1="7" y1="4" x2="7" y2="20" stroke={stroke} strokeWidth="1.4" />
          <line x1="21" y1="4" x2="21" y2="20" stroke={stroke} strokeWidth="1.4" />
          <path d="M12 9l2 3-2 3M16 12h-4" fill="none" stroke={isColor ? '#409eff' : stroke} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'nodeActiveReady':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon points="6,4 22,4 26,12 22,20 6,20 2,12" fill={fillFlow} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'nodeActivePersonInput':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon points="3,8 25,4 25,20 3,20" fill={fillFlow} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'nodeActiveNotes':
    case 'defaultNote':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <path d="M5 4h12l5 5v11H5z" fill={isColor ? '#fff9db' : 'none'} stroke={isColor ? '#e6a23c' : stroke} strokeWidth="1.5" />
          <path d="M17 4v5h5" fill="none" stroke={isColor ? '#e6a23c' : stroke} strokeWidth="1.2" />
        </svg>
      );
    case 'nodeActivePersonOpe':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon points="3,4 25,4 21,20 7,20" fill={fillFlow} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'nodeActiveDataBase':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <path d="M5 7c0-2 4-3 9-3s9 1 9 3v10c0 2-4 3-9 3s-9-1-9-3z" fill={isColor ? '#f5f3ff' : 'none'} stroke={isColor ? '#7c3aed' : stroke} strokeWidth="1.5" />
          <ellipse cx="14" cy="7" rx="9" ry="3" fill={isColor ? '#ede9fe' : 'none'} stroke={isColor ? '#7c3aed' : stroke} strokeWidth="1.3" />
          <path d="M5 12c0 2 4 3 9 3s9-1 9-3" fill="none" stroke={isColor ? '#7c3aed' : stroke} strokeWidth="1.3" />
        </svg>
      );
    case 'nodeActiveQuote':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="4" y="4" width="20" height="16" rx="2" fill={fillFlow} stroke={stroke} strokeWidth="1.5" />
          <text x="14" y="15" textAnchor="middle" fontSize="12" fontWeight="bold" fill={isColor ? '#409eff' : stroke}>“</text>
        </svg>
      );
    case 'nodeActiveDisplay':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon points="4,9 9,4 24,4 24,20 4,20" fill={fillFlow} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'nodeActiveInsideData':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="4" y="4" width="20" height="16" rx="1.5" fill={fillFlow} stroke={stroke} strokeWidth="1.5" />
          <line x1="9" y1="4" x2="9" y2="20" stroke={stroke} strokeWidth="1.3" />
          <line x1="4" y1="9" x2="24" y2="9" stroke={stroke} strokeWidth="1.3" />
        </svg>
      );
    case 'nodeActiveData':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon points="7,4 25,4 21,20 3,20" fill={fillFlow} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'nodeActiveCard':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="4" y="4" width="20" height="16" rx="2" fill={fillFlow} stroke={stroke} strokeWidth="1.5" />
          <rect x="7" y="7" width="6" height="4" rx="1" fill={isColor ? '#409eff' : stroke} />
          <line x1="15" y1="8" x2="21" y2="8" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
          <line x1="7" y1="14" x2="21" y2="14" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'nodeActiveQueueData':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="4" y="5" width="20" height="14" rx="2" fill={fillFlow} stroke={stroke} strokeWidth="1.5" />
          <line x1="9" y1="5" x2="9" y2="19" stroke={stroke} strokeWidth="1.2" />
          <line x1="14" y1="5" x2="14" y2="19" stroke={stroke} strokeWidth="1.2" />
          <line x1="19" y1="5" x2="19" y2="19" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );

    // === 基础图形 ===
    case 'defaultText':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="3" y="4" width="22" height="16" rx="2" fill={fillFlow} stroke={stroke} strokeWidth="1.4" strokeDasharray="3,2" />
          <text x="14" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill={isColor ? '#409eff' : stroke}>T</text>
        </svg>
      );
    case 'defaultOval':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <ellipse cx="14" cy="12" rx="10" ry="7" fill={fillFlow} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'defaultRect':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="4" y="5" width="20" height="14" fill={fillFlow} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'defaultCirSquare':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="5" y="4" width="18" height="16" rx="4" fill={fillFlow} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    case 'defaultTriangle':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon points="14,4 25,19 3,19" fill={fillFlow} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'defaultPentagon':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon points="14,3 24,9 20,20 8,20 4,9" fill={fillFlow} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'defaultHexagon':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon points="8,4 20,4 25,12 20,20 8,20 3,12" fill={fillFlow} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'defaultOctagon':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon points="8,4 20,4 24,8 24,16 20,20 8,20 4,16 4,8" fill={fillFlow} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'defaultFivePointedStar':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon points="14,3 16.8,9 23,9.5 18.5,13.8 19.8,20 14,16.8 8.2,20 9.5,13.8 5,9.5 11.2,9" fill={isColor ? '#fef08a' : 'none'} stroke={isColor ? '#ca8a04' : stroke} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case 'defaultCloud':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <path d="M7 17a4 4 0 0 1-1-7.8 5 5 0 0 1 9.5-2.2 4 4 0 0 1 6.5 4A3.5 3.5 0 0 1 20 17H7z" fill={fillFlow} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'defaultCross':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <polygon points="10,4 18,4 18,9 23,9 23,15 18,15 18,20 10,20 10,15 5,15 5,9 10,9" fill={fillFlow} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'defaultDialogue':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <path d="M4 5h20v11H12l-5 4v-4H4z" fill={fillFlow} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'defaultBrace':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <text x="14" y="17" textAnchor="middle" fontSize="15" fontWeight="bold" fill={isColor ? '#409eff' : stroke}>{'{ }'}</text>
        </svg>
      );
    case 'defaultBrackets':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <text x="14" y="17" textAnchor="middle" fontSize="15" fontWeight="bold" fill={isColor ? '#409eff' : stroke}>[ ]</text>
        </svg>
      );
    case 'defaultArrowDouble':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <path d="M8 8l-4 4 4 4M20 8l4 4-4 4M4 12h20" fill="none" stroke={isColor ? '#409eff' : stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'lineArrowRight':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <path d="M5 12h18M18 7l5 5-5 5" fill="none" stroke={isColor ? '#409eff' : stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'defaultPortal':
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <path d="M6 20V11a8 8 0 0 1 16 0v9" fill={fillFlow} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 28 24" className="w-6 h-5 pointer-events-none shrink-0">
          <rect x="4" y="5" width="20" height="14" rx="2" fill={fillFlow} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );
  }
};

function parseStyleMap(styleStr?: string): Record<string, string> {
  const map: Record<string, string> = {};
  if (!styleStr) return map;
  styleStr.split(';').forEach((seg) => {
    if (!seg) return;
    const idx = seg.indexOf('=');
    if (idx === -1) {
      map[seg.trim()] = '1';
    } else {
      map[seg.slice(0, idx).trim()] = seg.slice(idx + 1).trim();
    }
  });
  return map;
}

export const DrawioDesigner: React.FC<DrawioDesignerProps> = ({
  flowId,
  onBack,
  onOpenViewer,
  showToast,
  onNavigate,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const bridgeRef = useRef<DrawioBridge | null>(null);
  const [flowTitle, setFlowTitle] = useState('流程设计器');
  const [isStarred, setIsStarred] = useState(false);
  const [latestXml, setLatestXml] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSavedText, setLastSavedText] = useState('已自动保存');

  const [selectedCells, setSelectedCells] = useState<any[]>([]);
  const selectedCell = selectedCells[0] || null;
  const [panelCell, setPanelCell] = useState<any | null>(null);
  const [rightDrawerMode, setRightDrawerMode] = useState<'none' | 'ai' | 'props'>('props');

  const [paletteColorMode, setPaletteColorMode] = useState<'mono' | 'color'>('color');
  const [shapeSearch, setShapeSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'flow' | 'swimlane' | 'evc' | 'basic'>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [paletteWidth, setPaletteWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('dflow_designer_palette_width');
      return saved ? Number(saved) : 260;
    } catch {
      return 260;
    }
  });
  const [isResizingPalette, setIsResizingPalette] = useState(false);

  const [canvasStats, setCanvasStats] = useState<CanvasStats>({
    zoom: 100,
    vertexCount: 6,
    edgeCount: 5,
    totalCount: 11,
    selectedCount: 0,
    canUndo: false,
    canRedo: false,
    connectMode: false,
    pointerTool: 'select',
    hasFormatBrush: false,
    gridVisible: true,
  });

  const [nodeForm, setNodeForm] = useState<Record<string, any>>({});
  const [raciMatrixOpen, setRaciMatrixOpen] = useState(false);
  const [canvasCellsSnapshot, setCanvasCellsSnapshot] = useState<any[]>([]);

  // Top Menubar & Dropdowns
  const [activeMenu, setActiveMenu] = useState<'file' | 'edit' | 'select' | 'view' | 'insert' | 'canvas' | 'arrange' | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [canvasSearchOpen, setCanvasSearchOpen] = useState(false);
  const [canvasSearchText, setCanvasSearchText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // AI Assistant Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiDockSide, setAiDockSide] = useState<'left' | 'right'>(() => {
    try {
      return (localStorage.getItem('qingprocess_ai_dock_side') as 'left' | 'right') || 'right';
    } catch {
      return 'right';
    }
  });
  const [aiTab, setAiTab] = useState<'generate' | 'optimize' | 'audit' | 'raci'>('generate');
  const [aiPrompt, setAiPrompt] = useState('IPD 概念阶段立项评审流程 (含Charter与DCP决策)');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState<any | null>(null);
  const [aiGeneratedSteps, setAiGeneratedSteps] = useState<any[] | null>(null);

  // Formatting Style States
  const [currentFont, setCurrentFont] = useState('微软雅黑');
  const [currentFontSize, setCurrentFontSize] = useState(13);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [fontColor, setFontColor] = useState('#303133');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#303133');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeStyle, setStrokeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [edgeStyle, setEdgeStyle] = useState<'orthogonal' | 'straight' | 'curved'>('orthogonal');
  const [startArrow, setStartArrow] = useState<'none' | 'classic' | 'oval' | 'diamond'>('none');
  const [endArrow, setEndArrow] = useState<'classic' | 'block' | 'open' | 'none'>('classic');
  const [isFlowAnimated, setIsFlowAnimated] = useState(false);

  // Collaboration and Dialog States
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [insertImageModalOpen, setInsertImageModalOpen] = useState(false);
  const [insertLinkModalOpen, setInsertLinkModalOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.toolbar-dropdown-root') && !target.closest('.menubar-root')) {
        setActiveDropdown(null);
        setActiveMenu(null);
        setMoreMenuOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    let initialXmlToLoad = '';
    let initialTitleToLoad = '主流程图';

    const bridge = new DrawioBridge({
      onReady: () => {
        if (initialXmlToLoad) {
          bridge.loadXml(initialXmlToLoad, initialTitleToLoad);
        }
      },
      onSelection: (cells) => {
        setSelectedCells(cells || []);
        if (cells && cells.length > 0) {
          const first = cells[0];
          const style = first.style || '';
          const s = parseStyleMap(style);
          const fontStyleNum = parseInt(s.fontStyle || '0', 10);
          setIsBold((fontStyleNum & 1) === 1 || s.bold === '1');
          setIsItalic((fontStyleNum & 2) === 2 || s.italic === '1');
          setIsUnderline((fontStyleNum & 4) === 4 || s.underline === '1');
          if (s.fontFamily) setCurrentFont(s.fontFamily);
          if (s.fontSize) {
            const fs = parseInt(s.fontSize, 10);
            if (!isNaN(fs) && fs > 0) setCurrentFontSize(fs);
          }
          if (s.fontColor) setFontColor(s.fontColor);
          if (s.fillColor) setFillColor(s.fillColor);
          if (s.strokeColor) setStrokeColor(s.strokeColor);
          if (s.strokeWidth) {
            const sw = parseInt(s.strokeWidth, 10);
            if (!isNaN(sw) && sw > 0) setStrokeWidth(sw);
          }
          if (s.dashed === '1') {
            setStrokeStyle(s.dashPattern && s.dashPattern.includes('2') ? 'dotted' : 'dashed');
          } else {
            setStrokeStyle('solid');
          }
          if (s.edgeStyle) {
            setEdgeStyle(s.edgeStyle === 'curved' ? 'curved' : s.edgeStyle === 'straight' ? 'straight' : 'orthogonal');
          }
          if (s.endArrow) {
            setEndArrow(s.endArrow as any);
          }
          setIsFlowAnimated(s.flowAnimation === '1');
        }
      },
      onOpenProps: (cell) => {
        if (!cell) {
          setPanelCell(null);
          return;
        }
        setPanelCell(cell);
        setRightDrawerMode('props');
        setNodeForm({ ...cell.attrs, name: cell.value || cell.attrs?.name || '' });
      },
      onBadgeClick: ({ cell }) => {
        if (cell) {
          setPanelCell(cell);
          setRightDrawerMode('props');
          setNodeForm({ ...cell.attrs, name: cell.value || cell.attrs?.name || '' });
        }
      },
      onAutosave: (xml) => {
        setLatestXml(xml);
        setLastSavedText('所有更改已保存');
      },
      onStats: (stats) => {
        setCanvasStats(stats);
      },
      onCells: (cells) => {
        setCanvasCellsSnapshot(cells || []);
      },
      onExport: (payload) => {
        const fmt = payload.format || 'xml';
        const filename = `${flowTitle || '流程图'}.${fmt}`;
        if (fmt === 'png' && payload.data) {
          const a = document.createElement('a');
          a.href = payload.data;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showToast('已成功导出 PNG 高清图表', 'success');
        } else {
          const blob = new Blob([payload.xml || payload.data || ''], {
            type: fmt === 'svg' ? 'image/svg+xml' : 'application/xml',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast(`已成功导出 ${fmt.toUpperCase()} 文件`, 'success');
        }
      },
    });

    bridgeRef.current = bridge;
    if (iframeRef.current) {
      bridge.attachIframe(iframeRef.current);
    }

    fetch(`/api/flow/${flowId}/xml`)
      .then((r) => r.json())
      .then((xmlRes) => {
        if (xmlRes?.data) {
          initialXmlToLoad = xmlRes.data.xml || '';
          initialTitleToLoad = xmlRes.data.title || '主流程图';
          setFlowTitle(initialTitleToLoad);
          setLatestXml(initialXmlToLoad);
          bridge.loadXml(initialXmlToLoad, initialTitleToLoad);
        }
      });

    return () => {
      bridge.destroy();
    };
  }, [flowId]);

  const handleToolbarSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/flow/${flowId}/xml`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml: latestXml, title: flowTitle }),
      }).then((r) => r.json());
      if (res.status === 1) {
        showToast('流程图已保存', 'success');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInsertShape = (shape: ShapeItem) => {
    bridgeRef.current?.insertNode(shape);
  };

  const handleDragStartShape = (e: React.DragEvent, shape: ShapeItem) => {
    e.dataTransfer.setData('application/dflow-shape', JSON.stringify(shape));
    e.dataTransfer.setData('text/plain', JSON.stringify(shape));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleStartResizePalette = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = paletteWidth;
    setIsResizingPalette(true);

    const onMove = (moveEv: MouseEvent) => {
      const nextW = Math.min(420, Math.max(220, startW + (moveEv.clientX - startX)));
      setPaletteWidth(nextW);
    };

    const onUp = (upEv: MouseEvent) => {
      setIsResizingPalette(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const finalW = Math.min(420, Math.max(220, startW + (upEv.clientX - startX)));
      try {
        localStorage.setItem('dflow_designer_palette_width', String(finalW));
      } catch {}
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const filteredGroups = STENCIL_GROUPS.map((group) => {
    if (activeCategory !== 'all' && group.id !== activeCategory) {
      return null;
    }
    const q = shapeSearch.trim().toLowerCase();
    const filteredItems = group.items.filter((item) => {
      if (!q) return true;
      return item.label.toLowerCase().includes(q) || item.type.toLowerCase().includes(q);
    });
    return {
      ...group,
      items: filteredItems,
    };
  }).filter(Boolean) as typeof STENCIL_GROUPS;

  const totalFilteredCount = filteredGroups.reduce((acc, g) => acc + g.items.length, 0);

  // Formatting and Action Handlers
  const applyFontFamily = (family: string) => {
    setCurrentFont(family);
    bridgeRef.current?.updateStyle({ fontFamily: family });
    setActiveDropdown(null);
    showToast(`字体已设置为：${family}`, 'info');
  };

  const applyFontSize = (size: number) => {
    const validSize = Math.max(9, Math.min(72, size));
    setCurrentFontSize(validSize);
    bridgeRef.current?.updateStyle({ fontSize: validSize });
  };

  const toggleBold = () => {
    const next = !isBold;
    setIsBold(next);
    const styleNum = (next ? 1 : 0) | (isItalic ? 2 : 0) | (isUnderline ? 4 : 0);
    bridgeRef.current?.updateStyle({ fontStyle: String(styleNum) });
    showToast(next ? '已加粗文字' : '已取消加粗', 'info');
  };

  const toggleItalic = () => {
    const next = !isItalic;
    setIsItalic(next);
    const styleNum = (isBold ? 1 : 0) | (next ? 2 : 0) | (isUnderline ? 4 : 0);
    bridgeRef.current?.updateStyle({ fontStyle: String(styleNum) });
    showToast(next ? '已设置斜体' : '已取消斜体', 'info');
  };

  const toggleUnderline = () => {
    const next = !isUnderline;
    setIsUnderline(next);
    const styleNum = (isBold ? 1 : 0) | (isItalic ? 2 : 0) | (next ? 4 : 0);
    bridgeRef.current?.updateStyle({ fontStyle: String(styleNum) });
    showToast(next ? '已添加文字下划线' : '已取消下划线', 'info');
  };

  const applyFontColor = (color: string) => {
    setFontColor(color);
    bridgeRef.current?.updateStyle({ fontColor: color });
    setActiveDropdown(null);
    showToast('已更新文字颜色', 'info');
  };

  const applyFillColor = (color: string) => {
    setFillColor(color);
    bridgeRef.current?.updateStyle({ fillColor: color });
    setActiveDropdown(null);
    showToast('已更新填充背景色', 'info');
  };

  const applyStrokeColor = (color: string) => {
    setStrokeColor(color);
    bridgeRef.current?.updateStyle({ strokeColor: color });
    setActiveDropdown(null);
    showToast('已更新线条与边框颜色', 'info');
  };

  const applyStrokeWidth = (width: number) => {
    setStrokeWidth(width);
    bridgeRef.current?.updateStyle({ strokeWidth: width });
    setActiveDropdown(null);
    showToast(`线条粗细已设为 ${width}px`, 'info');
  };

  const applyStrokeStyle = (style: 'solid' | 'dashed' | 'dotted') => {
    setStrokeStyle(style);
    bridgeRef.current?.updateStyle({
      dashed: style === 'solid' ? '0' : '1',
      dashPattern: style === 'dotted' ? '2 4' : '8 6',
    });
    setActiveDropdown(null);
    const map = { solid: '实线', dashed: '虚线', dotted: '点线' };
    showToast(`线型已设为：${map[style]}`, 'info');
  };

  const applyEdgeStyle = (style: 'orthogonal' | 'straight' | 'curved') => {
    setEdgeStyle(style);
    bridgeRef.current?.updateStyle({
      edgeStyle: style === 'orthogonal' ? 'orthogonalEdgeStyle' : style === 'curved' ? 'curved' : 'straight',
    });
    setActiveDropdown(null);
    const map = { orthogonal: '正交折线', straight: '直连线', curved: '平滑曲线' };
    showToast(`连线路由已设为：${map[style]}`, 'info');
  };

  const applyStartArrow = (arrow: 'none' | 'classic' | 'oval' | 'diamond') => {
    setStartArrow(arrow);
    bridgeRef.current?.updateStyle({ startArrow: arrow === 'none' ? 'none' : arrow });
    setActiveDropdown(null);
  };

  const applyEndArrow = (arrow: 'classic' | 'block' | 'open' | 'diamond' | 'none') => {
    setEndArrow(arrow as any);
    bridgeRef.current?.updateStyle({ endArrow: arrow === 'none' ? 'none' : arrow });
    setActiveDropdown(null);
    const map: Record<string, string> = { classic: '标准箭头', block: '实心三角', open: '开放线头', diamond: '菱形端点', none: '无终点箭头' };
    showToast(`终点端头已设为：${map[arrow] || arrow}`, 'info');
  };

  const toggleFlowAnimation = () => {
    const next = !isFlowAnimated;
    setIsFlowAnimated(next);
    bridgeRef.current?.updateStyle({ flowAnimation: next ? '1' : '0' });
    showToast(next ? '已开启连线动态流动效果' : '已关闭流动效果', 'info');
  };

  const applyAlign = (mode: string) => {
    bridgeRef.current?.invokeAction('align', { alignMode: mode });
    setActiveDropdown(null);
    setActiveMenu(null);
    const map: Record<string, string> = {
      left: '左对齐',
      centerH: '水平居中',
      right: '右对齐',
      top: '顶部对齐',
      centerV: '垂直居中',
      bottom: '底端对齐',
    };
    showToast(`已执行：${map[mode] || mode}`, 'info');
  };

  const applyLayer = (layer: 'bringToFront' | 'bringForward' | 'sendBackward' | 'sendToBack') => {
    bridgeRef.current?.invokeAction(layer);
    setActiveDropdown(null);
    setActiveMenu(null);
    const map = {
      bringToFront: '置于顶层',
      bringForward: '上移一层',
      sendBackward: '下移一层',
      sendToBack: '置于底层',
    };
    showToast(`已${map[layer]}`, 'info');
  };

  const handleInsertNote = () => {
    bridgeRef.current?.insertNode({
      type: 'note',
      label: '便签备忘：此处填写流程业务细则与要点说明',
      style: 'shape=note;whiteSpace=wrap;html=1;size=14;verticalAlign=top;align=left;spacingTop=6;spacingLeft=8;spacingRight=8;fillColor=#fff9c4;strokeColor=#fbc02d;fontColor=#303133;fontSize=12;',
      w: 160,
      h: 110,
    });
    showToast('已插入便签注释', 'success');
  };

  const handleInsertImageConfirm = () => {
    if (!imageUrlInput.trim()) {
      showToast('请输入有效的图片链接', 'warning');
      return;
    }
    bridgeRef.current?.insertNode({
      type: 'image',
      label: '',
      style: `shape=image;image=${encodeURI(imageUrlInput.trim())};imageAspect=0;aspect=fixed;`,
      w: 120,
      h: 90,
    });
    setInsertImageModalOpen(false);
    setImageUrlInput('');
    showToast('已插入图片', 'success');
  };

  const handleInsertLinkConfirm = () => {
    if (!linkUrlInput.trim()) {
      showToast('请输入链接地址', 'warning');
      return;
    }
    bridgeRef.current?.updateStyle({ link: linkUrlInput.trim() });
    setInsertLinkModalOpen(false);
    setLinkUrlInput('');
    showToast('已为当前选中的节点设置超链接', 'success');
  };

  const handleFormatBrush = () => {
    bridgeRef.current?.invokeAction('copyStyle');
    showToast('已复制样式，选中其他图元即可应用', 'info');
  };

  const handleClearFormat = () => {
    bridgeRef.current?.invokeAction('clearFormat');
    showToast('已清除选中图元的自定义格式', 'info');
  };

  // AI Handlers
  const handleGenerateAiFlow = async () => {
    if (!aiPrompt.trim()) {
      showToast('请输入流程场景描述', 'warning');
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/drawio-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, existingTitle: flowTitle }),
      }).then((r) => r.json());
      if (res.status === 1 && res.data?.xml) {
        bridgeRef.current?.loadXml(res.data.xml, res.data.title || flowTitle);
        if (res.data.title) setFlowTitle(res.data.title);
        setLatestXml(res.data.xml);
        setAiGeneratedSteps(res.data.steps || null);
        showToast('AI 业务流程图已成功生成并载入画布！', 'success');
        setAiModalOpen(false);
      } else {
        showToast(res.message || 'AI 生成失败', 'error');
      }
    } catch (err: any) {
      showToast(`AI 生成异常: ${err.message}`, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunFlowAudit = async () => {
    setAiLoading(true);
    try {
      const cells = canvasCellsSnapshot;
      const res = await fetch('/api/ai/flow-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cells, flowTitle }),
      }).then((r) => r.json());
      if (res.status === 1 && res.data) {
        setAiAuditResult(res.data);
        showToast(`体检完成，流程成熟度评分: ${res.data.healthScore}分`, 'success');
      } else {
        showToast(res.message || '体检失败', 'error');
      }
    } catch (err: any) {
      showToast(`体检失败: ${err.message}`, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAutoLayout = () => {
    bridgeRef.current?.invokeAction('autoLayout');
    showToast('已完成 AI 拓扑智能排版与对齐', 'success');
  };

  const handleExport = (fmt: 'png' | 'svg' | 'xml') => {
    bridgeRef.current?.exportDiagram(fmt);
    setActiveDropdown(null);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f5f7fa] select-none overflow-hidden text-[#303133]">
      {/* Top Header: ProcessOn Style (Red Box 1) */}
      <header className="h-[46px] bg-white border-b border-[#e4e7ed] px-3 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={async () => {
              if (latestXml) {
                try {
                  await fetch(`/api/flow/${flowId}/xml`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ xml: latestXml, title: flowTitle }),
                  });
                } catch {}
              }
              onBack();
            }}
            className="h-7 px-2.5 rounded hover:bg-[#f0f2f5] border border-[#dcdfe6] flex items-center gap-1 text-xs text-[#606266] hover:text-[#409eff] cursor-pointer transition-colors"
            title="返回视图列表 (自动保存)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>返回</span>
          </button>
          <div className="w-6 h-6 rounded bg-[#1677ff] text-white font-black text-[12px] flex items-center justify-center shadow-xs select-none">
            Q
          </div>

          {/* Editable Flow Title */}
          <div className="flex items-center gap-1.5 ml-1">
            {isEditingTitle ? (
              <input
                type="text"
                value={flowTitle}
                autoFocus
                onChange={(e) => setFlowTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false);
                }}
                className="h-6 px-1.5 text-xs font-semibold text-[#1f2733] border border-[#1677ff] rounded outline-none bg-white"
              />
            ) : (
              <span
                onDoubleClick={() => setIsEditingTitle(true)}
                title="双击修改流程名称"
                className="font-semibold text-xs text-[#1f2733] hover:bg-[#f0f2f5] px-1.5 py-0.5 rounded cursor-pointer truncate max-w-[220px]"
              >
                {flowTitle}
              </span>
            )}

            {/* Star Icon */}
            <button
              onClick={() => {
                setIsStarred(!isStarred);
                showToast(!isStarred ? '已添加星标收藏' : '已取消星标', 'info');
              }}
              className="text-[#909399] hover:text-[#e6a23c] p-0.5 rounded cursor-pointer transition-colors"
              title={isStarred ? '已收藏' : '添加收藏'}
            >
              {isStarred ? (
                <Star className="w-3.5 h-3.5 fill-[#e6a23c] text-[#e6a23c]" />
              ) : (
                <Star className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Autosave Status */}
            <div className="flex items-center gap-1 text-[11px] text-[#52c41a] font-normal ml-1 whitespace-nowrap">
              {saving ? (
                <Loader2 className="w-3 h-3 animate-spin text-[#1677ff]" />
              ) : (
                <Check className="w-3 h-3 text-[#52c41a]" />
              )}
              <span className="text-[#909399]">{saving ? '正在保存...' : lastSavedText}</span>
            </div>
          </div>

          {/* Menubar */}
          <div className="flex items-center gap-0.5 ml-3 menubar-root relative">
            {[
              { id: 'file', label: '文件' },
              { id: 'edit', label: '编辑' },
              { id: 'select', label: '选择' },
              { id: 'view', label: '视图' },
              { id: 'insert', label: '插入' },
              { id: 'canvas', label: '画布' },
              { id: 'arrange', label: '排列' },
            ].map((menu) => (
              <div key={menu.id} className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === menu.id ? null : (menu.id as any))}
                  className={`h-7 px-2 rounded text-xs cursor-pointer transition-colors ${
                    activeMenu === menu.id ? 'bg-[#e6f4ff] text-[#1677ff] font-medium' : 'text-[#606266] hover:bg-[#f0f2f5]'
                  }`}
                >
                  {menu.label}
                </button>

                {/* Submenu Dropdown */}
                {activeMenu === menu.id && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#e4e7ed] rounded-lg shadow-lg py-1.5 z-50 text-xs">
                    {menu.id === 'file' && (
                      <>
                        <button
                          onClick={() => {
                            handleToolbarSave();
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center justify-between text-[#303133]"
                        >
                          <span>保存</span>
                          <span className="text-[10px] text-[#909399]">Ctrl+S</span>
                        </button>
                        <button
                          onClick={() => {
                            handleExport('png');
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center justify-between text-[#303133]"
                        >
                          <span>导出为 PNG 高清图</span>
                        </button>
                        <button
                          onClick={() => {
                            handleExport('svg');
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center justify-between text-[#303133]"
                        >
                          <span>导出为 SVG 矢量图</span>
                        </button>
                        <button
                          onClick={() => {
                            handleExport('xml');
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center justify-between text-[#303133]"
                        >
                          <span>导出为 XML 源文件</span>
                        </button>
                        <div className="h-[1px] bg-[#ebeef5] my-1" />
                        <button
                          onClick={() => {
                            showToast('已存为企业通用业务流程模板', 'success');
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          另存为业务模板
                        </button>
                        <button
                          onClick={() => {
                            window.print();
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          打印流程图
                        </button>
                      </>
                    )}

                    {menu.id === 'edit' && (
                      <>
                        <button
                          onClick={() => {
                            bridgeRef.current?.invokeAction('undo');
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center justify-between text-[#303133]"
                        >
                          <span>撤销</span>
                          <span className="text-[10px] text-[#909399]">Ctrl+Z</span>
                        </button>
                        <button
                          onClick={() => {
                            bridgeRef.current?.invokeAction('redo');
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center justify-between text-[#303133]"
                        >
                          <span>重做</span>
                          <span className="text-[10px] text-[#909399]">Ctrl+Y</span>
                        </button>
                        <div className="h-[1px] bg-[#ebeef5] my-1" />
                        <button
                          onClick={() => {
                            handleFormatBrush();
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          格式刷
                        </button>
                        <button
                          onClick={() => {
                            handleClearFormat();
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          清除样式格式
                        </button>
                        <div className="h-[1px] bg-[#ebeef5] my-1" />
                        <button
                          onClick={() => {
                            bridgeRef.current?.invokeAction('delete');
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center justify-between text-[#f56c6c]"
                        >
                          <span>删除</span>
                          <span className="text-[10px] text-[#f56c6c]">Delete</span>
                        </button>
                        <button
                          onClick={() => {
                            bridgeRef.current?.invokeAction('selectAll');
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center justify-between text-[#303133]"
                        >
                          <span>全选</span>
                          <span className="text-[10px] text-[#909399]">Ctrl+A</span>
                        </button>
                      </>
                    )}

                    {menu.id === 'select' && (
                      <>
                        <button
                          onClick={() => {
                            bridgeRef.current?.invokeAction('selectAll');
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          全选所有图元
                        </button>
                        <button
                          onClick={() => {
                            bridgeRef.current?.invokeAction('clearSelection');
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          清空选择
                        </button>
                      </>
                    )}

                    {menu.id === 'view' && (
                      <>
                        <button
                          onClick={() => {
                            bridgeRef.current?.zoomIn();
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center justify-between text-[#303133]"
                        >
                          <span>放大</span>
                          <span className="text-[10px] text-[#909399]">+</span>
                        </button>
                        <button
                          onClick={() => {
                            bridgeRef.current?.zoomOut();
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center justify-between text-[#303133]"
                        >
                          <span>缩小</span>
                          <span className="text-[10px] text-[#909399]">-</span>
                        </button>
                        <button
                          onClick={() => {
                            bridgeRef.current?.setZoom(100);
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          原始大小 (100%)
                        </button>
                        <button
                          onClick={() => {
                            bridgeRef.current?.fit();
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          自适应画布 (Fit)
                        </button>
                        <div className="h-[1px] bg-[#ebeef5] my-1" />
                        <button
                          onClick={() => {
                            bridgeRef.current?.invokeAction('toggleGrid');
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          显示 / 隐藏对齐网格
                        </button>
                        <button
                          onClick={() => {
                            onOpenViewer(flowId);
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          进入流程全屏演示
                        </button>
                      </>
                    )}

                    {menu.id === 'insert' && (
                      <>
                        <button
                          onClick={() => {
                            handleInsertNote();
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          便签备忘
                        </button>
                        <button
                          onClick={() => {
                            setInsertImageModalOpen(true);
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          插入外部图片
                        </button>
                        <button
                          onClick={() => {
                            setInsertLinkModalOpen(true);
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          插入节点超链接
                        </button>
                        <div className="h-[1px] bg-[#ebeef5] my-1" />
                        <button
                          onClick={() => {
                            bridgeRef.current?.requestCells();
                            setRaciMatrixOpen(true);
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#7c3aed] font-medium"
                        >
                          RACI 职责矩阵
                        </button>
                      </>
                    )}

                    {menu.id === 'canvas' && (
                      <>
                        <button
                          onClick={() => {
                            bridgeRef.current?.invokeAction('toggleConnectMode');
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          切换连线绘制模式
                        </button>
                        <button
                          onClick={() => {
                            bridgeRef.current?.invokeAction('toggleGrid');
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          切换对齐背景网格
                        </button>
                        <button
                          onClick={() => {
                            handleAutoLayout();
                            setActiveMenu(null);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          AI 智能排版重置
                        </button>
                      </>
                    )}

                    {menu.id === 'arrange' && (
                      <>
                        <button
                          onClick={() => applyAlign('centerH')}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          水平居中对齐
                        </button>
                        <button
                          onClick={() => applyAlign('centerV')}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          垂直居中对齐
                        </button>
                        <button
                          onClick={() => applyAlign('left')}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          左对齐
                        </button>
                        <button
                          onClick={() => applyAlign('right')}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          右对齐
                        </button>
                        <div className="h-[1px] bg-[#ebeef5] my-1" />
                        <button
                          onClick={() => applyLayer('bringToFront')}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          置于顶层
                        </button>
                        <button
                          onClick={() => applyLayer('sendToBack')}
                          className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                        >
                          置于底层
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Action Icons: ProcessOn Style */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Explicit Save Button */}
          <button
            onClick={handleToolbarSave}
            disabled={saving}
            className="h-7 px-3 rounded-md bg-[#67c23a] hover:bg-[#5daf34] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            title="保存当前设计内容 (Ctrl+S)"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? '保存中...' : '保存'}</span>
          </button>

          {/* Save and Return Button */}
          <button
            onClick={async () => {
              await handleToolbarSave();
              onBack();
            }}
            disabled={saving}
            className="h-7 px-3 rounded-md bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            title="保存当前图表并返回预览视图"
          >
            <Check className="w-3.5 h-3.5" />
            <span>保存并返回</span>
          </button>

          {/* Share Collaboration Button */}
          <button
            onClick={() => setShareModalOpen(true)}
            className="h-7 px-2.5 rounded-md bg-white hover:bg-[#f0f2f5] border border-[#dcdfe6] text-[#606266] hover:text-[#409eff] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>分享协作</span>
          </button>

          {/* Download / Export */}
          <div className="relative toolbar-dropdown-root">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === 'export' ? null : 'export');
              }}
              className={`w-7 h-7 rounded-full border border-[#e4e7ed] flex items-center justify-center cursor-pointer transition-colors ${
                activeDropdown === 'export' ? 'bg-[#e6f4ff] text-[#1677ff] border-[#1677ff]' : 'hover:bg-[#f0f2f5] text-[#606266]'
              }`}
              title="导出下载"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            {activeDropdown === 'export' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-[#e4e7ed] rounded-lg shadow-xl py-1 z-[100] text-xs animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  onClick={() => handleExport('png')}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                >
                  PNG 高清图片
                </button>
                <button
                  onClick={() => handleExport('svg')}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                >
                  SVG 矢量图
                </button>
                <button
                  onClick={() => handleExport('xml')}
                  className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                >
                  XML 流程图源文件
                </button>
              </div>
            )}
          </div>

          {/* Phone / Voice Call Collaboration */}
          <button
            onClick={() => setCallModalOpen(true)}
            className="w-7 h-7 rounded-full hover:bg-[#f0f2f5] border border-[#e4e7ed] flex items-center justify-center text-[#606266] cursor-pointer transition-colors"
            title="实时协同研讨"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>

          {/* Send / Publish Review */}
          <button
            onClick={() => setPublishModalOpen(true)}
            className="w-7 h-7 rounded-full hover:bg-[#f0f2f5] border border-[#e4e7ed] flex items-center justify-center text-[#606266] cursor-pointer transition-colors"
            title="发布审核"
          >
            <Send className="w-3.5 h-3.5" />
          </button>

          {/* User Avatar Circle */}
          <div
            className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer select-none"
            title="当前用户：流程架构师"
          >
            Q
          </div>
        </div>
      </header>

      {/* Main Formatting Toolbar: Matching image_91eef1a2.png (Red Box 2 & 3) */}
      {/* Main Formatting Toolbar: Matching image_91eef1a2.png (Red Box 2 & 3) */}
      {!toolbarCollapsed && (
        <div className="h-10 bg-white border-b border-[#e4e7ed] px-3 flex items-center justify-between shrink-0 text-xs z-30 relative overflow-visible toolbar-dropdown-root">
          <div className="flex items-center gap-1 shrink-0">
            {/* Undo / Redo */}
            <button
              onClick={() => bridgeRef.current?.invokeAction('undo')}
              disabled={!canvasStats.canUndo}
              title="撤销 (Ctrl+Z)"
              className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                canvasStats.canUndo ? 'text-[#303133] hover:bg-[#f0f2f5]' : 'text-[#c0c4cc] cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => bridgeRef.current?.invokeAction('redo')}
              disabled={!canvasStats.canRedo}
              title="重做 (Ctrl+Y)"
              className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                canvasStats.canRedo ? 'text-[#303133] hover:bg-[#f0f2f5]' : 'text-[#c0c4cc] cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            {/* Format Painter */}
            <button
              onClick={handleFormatBrush}
              title="格式刷"
              className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                canvasStats.hasFormatBrush ? 'bg-[#e6f4ff] text-[#1677ff]' : 'text-[#606266] hover:bg-[#f0f2f5]'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
            </button>

            {/* Clear Formatting / Eraser */}
            <button
              onClick={handleClearFormat}
              title="清除格式"
              className="w-7 h-7 rounded hover:bg-[#f0f2f5] flex items-center justify-center text-[#606266] cursor-pointer transition-colors"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>

            {/* Separator */}
            <div className="w-[1px] h-4 bg-[#e4e7ed] mx-1" />

            {/* Sticky Note */}
            <button
              onClick={handleInsertNote}
              title="便签"
              className="w-7 h-7 rounded hover:bg-[#f0f2f5] flex items-center justify-center text-[#606266] cursor-pointer transition-colors"
            >
              <StickyNote className="w-3.5 h-3.5 text-[#e6a23c]" />
            </button>

            {/* Image */}
            <button
              onClick={() => setInsertImageModalOpen(true)}
              title="图片插入"
              className="w-7 h-7 rounded hover:bg-[#f0f2f5] flex items-center justify-center text-[#606266] cursor-pointer transition-colors"
            >
              <Image className="w-3.5 h-3.5 text-[#409eff]" />
            </button>

            {/* Hyperlink */}
            <button
              onClick={() => setInsertLinkModalOpen(true)}
              title="插入超链接"
              className="w-7 h-7 rounded hover:bg-[#f0f2f5] flex items-center justify-center text-[#606266] cursor-pointer transition-colors"
            >
              <Link2 className="w-3.5 h-3.5 text-[#67c23a]" />
            </button>

            {/* Separator */}
            <div className="w-[1px] h-4 bg-[#e4e7ed] mx-1" />

            {/* Font Family Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'fontFamily' ? null : 'fontFamily');
                }}
                className={`h-7 px-2 rounded border text-[#303133] flex items-center gap-1 text-xs cursor-pointer min-w-[76px] justify-between transition-colors ${
                  activeDropdown === 'fontFamily'
                    ? 'bg-[#e6f4ff] border-[#1677ff] text-[#1677ff]'
                    : 'border-[#dcdfe6] hover:bg-[#f0f2f5]'
                }`}
              >
                <span className="truncate">{currentFont}</span>
                <ChevronDown className="w-3 h-3 text-[#909399]" />
              </button>
              {activeDropdown === 'fontFamily' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-32 bg-white border border-[#e4e7ed] rounded-lg shadow-xl py-1 z-[100] text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  {['微软雅黑', 'PingFang SC', '黑体', '宋体', 'Arial', 'Inter'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => applyFontFamily(f)}
                      className={`w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] ${
                        currentFont === f ? 'text-[#1677ff] font-semibold bg-[#e6f4ff]/40' : 'text-[#303133]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font Size Stepper */}
            <div className="flex items-center border border-[#dcdfe6] rounded h-7 px-1.5 bg-white">
              <input
                type="text"
                value={currentFontSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/\D/g, ''), 10);
                  if (!isNaN(val)) applyFontSize(val);
                }}
                className="text-xs text-[#303133] w-6 text-center font-mono-tabular outline-none bg-transparent"
              />
              <div className="flex flex-col ml-0.5">
                <button
                  type="button"
                  onClick={() => applyFontSize(currentFontSize + 1)}
                  className="h-2.5 w-3 text-[#909399] hover:text-[#1677ff] flex items-center justify-center cursor-pointer"
                  title="放大字号"
                >
                  <ChevronUp className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFontSize(currentFontSize - 1)}
                  className="h-2.5 w-3 text-[#909399] hover:text-[#1677ff] flex items-center justify-center cursor-pointer"
                  title="缩小字号"
                >
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* Bold / Italic / Underline */}
            <button
              onClick={toggleBold}
              title="加粗"
              className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs cursor-pointer transition-colors ${
                isBold ? 'bg-[#e6f4ff] text-[#1677ff]' : 'text-[#303133] hover:bg-[#f0f2f5]'
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleItalic}
              title="斜体"
              className={`w-7 h-7 rounded flex items-center justify-center italic text-xs cursor-pointer transition-colors ${
                isItalic ? 'bg-[#e6f4ff] text-[#1677ff]' : 'text-[#303133] hover:bg-[#f0f2f5]'
              }`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleUnderline}
              title="下划线"
              className={`w-7 h-7 rounded flex items-center justify-center underline text-xs cursor-pointer transition-colors ${
                isUnderline ? 'bg-[#e6f4ff] text-[#1677ff]' : 'text-[#303133] hover:bg-[#f0f2f5]'
              }`}
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            {/* === Red Box Feature 1: Font Color (文字颜色) === */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'fontColor' ? null : 'fontColor');
                }}
                className={`w-7 h-7 rounded flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  activeDropdown === 'fontColor' ? 'bg-[#e6f4ff] ring-1 ring-[#1677ff]' : 'hover:bg-[#f0f2f5]'
                }`}
                title="文字颜色"
              >
                <Type className="w-3.5 h-3.5 text-[#303133]" />
                <div className="w-4 h-[2.5px] rounded-full mt-0.5 shadow-xs" style={{ backgroundColor: fontColor }} />
              </button>
              {activeDropdown === 'fontColor' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-[#e4e7ed] rounded-lg shadow-xl p-2.5 z-[100] animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="flex items-center justify-between text-[11px] text-[#909399] mb-1.5 font-medium">
                    <span>文字颜色</span>
                    <span className="font-mono text-[10px] text-[#606266] uppercase">{fontColor}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {COLOR_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => applyFontColor(c)}
                        className={`w-5 h-5 rounded border cursor-pointer hover:scale-110 transition-transform ${
                          fontColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-[#1677ff] border-white' : 'border-[#dcdfe6]'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* === Red Box Feature 2: Alignment Dropdown (对齐方式) === */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'align' ? null : 'align');
                }}
                className={`w-7 h-7 rounded flex items-center justify-center text-[#606266] cursor-pointer transition-colors ${
                  activeDropdown === 'align' ? 'bg-[#e6f4ff] text-[#1677ff] ring-1 ring-[#1677ff]' : 'hover:bg-[#f0f2f5]'
                }`}
                title="对齐方式"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              {activeDropdown === 'align' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-36 bg-white border border-[#e4e7ed] rounded-lg shadow-xl py-1 z-[100] text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    type="button"
                    onClick={() => applyAlign('left')}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center gap-2 text-[#303133]"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>左对齐</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAlign('centerH')}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center gap-2 text-[#303133]"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                    <span>水平居中</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAlign('right')}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center gap-2 text-[#303133]"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                    <span>右对齐</span>
                  </button>
                  <div className="h-[1px] bg-[#ebeef5] my-1" />
                  <button
                    type="button"
                    onClick={() => applyAlign('top')}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center gap-2 text-[#303133]"
                  >
                    <AlignStartVertical className="w-3.5 h-3.5" />
                    <span>顶部对齐</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAlign('centerV')}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center gap-2 text-[#303133]"
                  >
                    <AlignCenterVertical className="w-3.5 h-3.5" />
                    <span>垂直居中</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAlign('bottom')}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center gap-2 text-[#303133]"
                  >
                    <AlignEndVertical className="w-3.5 h-3.5" />
                    <span>底端对齐</span>
                  </button>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="w-[1px] h-4 bg-[#e4e7ed] mx-1" />

            {/* === Red Box Feature 3: Fill Color (倾倒油漆桶 - 填充颜色) === */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'fillColor' ? null : 'fillColor');
                }}
                className={`w-7 h-7 rounded flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  activeDropdown === 'fillColor' ? 'bg-[#e6f4ff] ring-1 ring-[#1677ff]' : 'hover:bg-[#f0f2f5]'
                }`}
                title="填充颜色"
              >
                <PaintBucket className="w-3.5 h-3.5 text-[#303133]" />
                <div className="w-4 h-[2.5px] rounded-full mt-0.5 border border-[#dcdfe6] shadow-xs" style={{ backgroundColor: fillColor }} />
              </button>
              {activeDropdown === 'fillColor' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-[#e4e7ed] rounded-lg shadow-xl p-2.5 z-[100] animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="flex items-center justify-between text-[11px] text-[#909399] mb-1.5 font-medium">
                    <span>填充背景色</span>
                    <span className="font-mono text-[10px] text-[#606266] uppercase">{fillColor}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {COLOR_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => applyFillColor(c)}
                        className={`w-5 h-5 rounded border cursor-pointer hover:scale-110 transition-transform ${
                          fillColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-[#1677ff] border-white' : 'border-[#dcdfe6]'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* === Red Box Feature 4: Stroke / Border Color (笔刷/描边颜色) === */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'strokeColor' ? null : 'strokeColor');
                }}
                className={`w-7 h-7 rounded flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  activeDropdown === 'strokeColor' ? 'bg-[#e6f4ff] ring-1 ring-[#1677ff]' : 'hover:bg-[#f0f2f5]'
                }`}
                title="边框与连线颜色"
              >
                <PenTool className="w-3.5 h-3.5 text-[#303133]" />
                <div className="w-4 h-[2.5px] rounded-full mt-0.5 shadow-xs" style={{ backgroundColor: strokeColor }} />
              </button>
              {activeDropdown === 'strokeColor' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-[#e4e7ed] rounded-lg shadow-xl p-2.5 z-[100] animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="flex items-center justify-between text-[11px] text-[#909399] mb-1.5 font-medium">
                    <span>线条描边颜色</span>
                    <span className="font-mono text-[10px] text-[#606266] uppercase">{strokeColor}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {COLOR_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => applyStrokeColor(c)}
                        className={`w-5 h-5 rounded border cursor-pointer hover:scale-110 transition-transform ${
                          strokeColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-[#1677ff] border-white' : 'border-[#dcdfe6]'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* === Red Box Feature 5: Stroke Width Dropdown (2px v 线条粗细) === */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'strokeWidth' ? null : 'strokeWidth');
                }}
                className={`h-7 px-1.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                  activeDropdown === 'strokeWidth' ? 'bg-[#e6f4ff] text-[#1677ff] ring-1 ring-[#1677ff]' : 'text-[#303133] hover:bg-[#f0f2f5]'
                }`}
                title="线条粗细"
              >
                <span className="font-mono-tabular text-xs font-medium">{strokeWidth}px</span>
                <ChevronDown className="w-2.5 h-2.5 text-[#909399]" />
              </button>
              {activeDropdown === 'strokeWidth' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-28 bg-white border border-[#e4e7ed] rounded-lg shadow-xl py-1 z-[100] text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  {[1, 2, 3, 4, 6].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => applyStrokeWidth(w)}
                      className={`w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center justify-between ${
                        strokeWidth === w ? 'text-[#1677ff] font-semibold bg-[#e6f4ff]/50' : 'text-[#303133]'
                      }`}
                    >
                      <span>{w}px</span>
                      <div className="w-8 bg-[#303133] rounded-full" style={{ height: `${w}px` }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* === Red Box Feature 6: Line Style Dropdown (—— v 实线/虚线/点线) === */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'strokeStyle' ? null : 'strokeStyle');
                }}
                className={`h-7 px-2 rounded flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeDropdown === 'strokeStyle' ? 'bg-[#e6f4ff] text-[#1677ff] ring-1 ring-[#1677ff]' : 'text-[#303133] hover:bg-[#f0f2f5]'
                }`}
                title="线型样式 (实线/虚线/点线)"
              >
                <div className="w-4 h-0 border-b-2 border-[#303133]" style={{ borderStyle: strokeStyle }} />
                <ChevronDown className="w-2.5 h-2.5 text-[#909399]" />
              </button>
              {activeDropdown === 'strokeStyle' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-32 bg-white border border-[#e4e7ed] rounded-lg shadow-xl py-1 z-[100] text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  {[
                    { id: 'solid', label: '实线' },
                    { id: 'dashed', label: '虚线' },
                    { id: 'dotted', label: '点线' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => applyStrokeStyle(s.id as any)}
                      className={`w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center justify-between ${
                        strokeStyle === s.id ? 'text-[#1677ff] font-semibold bg-[#e6f4ff]/50' : 'text-[#303133]'
                      }`}
                    >
                      <span>{s.label}</span>
                      <div className="w-10 h-0 border-b-2 border-[#303133]" style={{ borderStyle: s.id as any }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* === Red Box Feature 7: Edge Routing Style Dropdown (折线 v 连线路由走向) === */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'edgeStyle' ? null : 'edgeStyle');
                }}
                className={`h-7 px-2 rounded flex items-center gap-1 cursor-pointer text-xs transition-colors ${
                  activeDropdown === 'edgeStyle' ? 'bg-[#e6f4ff] text-[#1677ff] ring-1 ring-[#1677ff]' : 'text-[#303133] hover:bg-[#f0f2f5]'
                }`}
                title="连线路由走向 (折线/直线/曲线)"
              >
                <span>{edgeStyle === 'orthogonal' ? '折线' : edgeStyle === 'curved' ? '曲线' : '直线'}</span>
                <ChevronDown className="w-2.5 h-2.5 text-[#909399]" />
              </button>
              {activeDropdown === 'edgeStyle' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-32 bg-white border border-[#e4e7ed] rounded-lg shadow-xl py-1 z-[100] text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  {[
                    { id: 'orthogonal', label: '正交折线' },
                    { id: 'straight', label: '直连线' },
                    { id: 'curved', label: '平滑曲线' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => applyEdgeStyle(r.id as any)}
                      className={`w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] ${
                        edgeStyle === r.id ? 'text-[#1677ff] font-semibold bg-[#e6f4ff]/50' : 'text-[#303133]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* === Red Box Feature 8: End Arrow Dropdown (箭头 v 终点箭头样式) === */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'endArrow' ? null : 'endArrow');
                }}
                className={`h-7 px-2 rounded flex items-center gap-1 cursor-pointer text-xs transition-colors ${
                  activeDropdown === 'endArrow' ? 'bg-[#e6f4ff] text-[#1677ff] ring-1 ring-[#1677ff]' : 'text-[#303133] hover:bg-[#f0f2f5]'
                }`}
                title="终点箭头样式"
              >
                <span>{endArrow === 'classic' ? '标准箭头' : endArrow === 'block' ? '实心三角' : endArrow === 'open' ? '开放线头' : '无箭头'}</span>
                <ChevronDown className="w-2.5 h-2.5 text-[#909399]" />
              </button>
              {activeDropdown === 'endArrow' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-36 bg-white border border-[#e4e7ed] rounded-lg shadow-xl py-1 z-[100] text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  {[
                    { id: 'classic', label: '标准箭头' },
                    { id: 'block', label: '实心三角' },
                    { id: 'open', label: '开放线头' },
                    { id: 'none', label: '无终点箭头' },
                  ].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => applyEndArrow(a.id as any)}
                      className={`w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] ${
                        endArrow === a.id ? 'text-[#1677ff] font-semibold bg-[#e6f4ff]/50' : 'text-[#303133]'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Flow Animation */}
            <button
              onClick={toggleFlowAnimation}
              title="连线动态流动效果"
              className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                isFlowAnimated ? 'bg-[#e6f4ff] text-[#1677ff]' : 'text-[#606266] hover:bg-[#f0f2f5]'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
            </button>

            {/* Separator */}
            <div className="w-[1px] h-4 bg-[#e4e7ed] mx-1" />

            {/* Layers & Layout */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'layers' ? null : 'layers');
                }}
                className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                  activeDropdown === 'layers' ? 'bg-[#e6f4ff] text-[#1677ff] ring-1 ring-[#1677ff]' : 'text-[#606266] hover:bg-[#f0f2f5]'
                }`}
                title="图层顺序"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              {activeDropdown === 'layers' && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-28 bg-white border border-[#e4e7ed] rounded-lg shadow-xl py-1 z-[100] text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    type="button"
                    onClick={() => applyLayer('bringToFront')}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                  >
                    置于顶层
                  </button>
                  <button
                    type="button"
                    onClick={() => applyLayer('bringForward')}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                  >
                    上移一层
                  </button>
                  <button
                    type="button"
                    onClick={() => applyLayer('sendBackward')}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                  >
                    下移一层
                  </button>
                  <button
                    type="button"
                    onClick={() => applyLayer('sendToBack')}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133]"
                  >
                    置于底层
                  </button>
                </div>
              )}
            </div>

            {/* Auto Layout */}
            <button
              onClick={handleAutoLayout}
              className="h-7 px-2 rounded hover:bg-[#f0f2f5] flex items-center gap-1 text-[#606266] cursor-pointer transition-colors"
              title="AI 拓扑自动排版"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#1677ff]" />
              <span>自动排版</span>
            </button>

            {/* More Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMoreMenuOpen(!moreMenuOpen);
                }}
                className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                  moreMenuOpen ? 'bg-[#e6f4ff] text-[#1677ff] ring-1 ring-[#1677ff]' : 'text-[#606266] hover:bg-[#f0f2f5]'
                }`}
                title="更多操作"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {moreMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-36 bg-white border border-[#e4e7ed] rounded-lg shadow-xl py-1 z-[100] text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    onClick={() => {
                      bridgeRef.current?.requestCells();
                      setRaciMatrixOpen(true);
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#7c3aed] flex items-center gap-1.5 font-medium"
                  >
                    <Table2 className="w-3.5 h-3.5" />
                    <span>RACI 职责矩阵</span>
                  </button>
                  <button
                    onClick={() => {
                      bridgeRef.current?.fit();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133] flex items-center gap-1.5"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>适应画布 (Fit)</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenViewer(flowId);
                      setMoreMenuOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] text-[#303133] flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>流程全屏预览</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right AI & View Controls (Red Box 3) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* QingProcess AI Assistant Button */}
            <button
              onClick={() => {
                const nextState = !aiModalOpen;
                setAiModalOpen(nextState);
                if (nextState) {
                  bridgeRef.current?.requestCells();
                }
              }}
              className={`h-7 px-3 rounded ${
                aiModalOpen
                  ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 ring-2 ring-purple-300 text-white font-semibold'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium'
              } text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95`}
              title="打开 / 收起 QingProcess AI 流程设计面板"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-200" />
              <span>QingProcess AI</span>
            </button>

            {/* Canvas Search */}
            <button
              onClick={() => setCanvasSearchOpen(!canvasSearchOpen)}
              className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                canvasSearchOpen ? 'bg-[#e6f4ff] text-[#1677ff]' : 'text-[#606266] hover:bg-[#f0f2f5]'
              }`}
              title="搜索图元"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Properties Panel Toggle */}
            <button
              onClick={() => {
                if (rightDrawerMode === 'props') {
                  setRightDrawerMode('none');
                } else {
                  const target =
                    panelCell ||
                    selectedCells[0] ||
                    canvasCellsSnapshot.find((c) => c.vertex && !c.attrs?.isSwimlane);
                  if (target) {
                    setPanelCell(target);
                  }
                  setRightDrawerMode('props');
                }
              }}
              className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                rightDrawerMode === 'props' ? 'bg-[#e6f4ff] text-[#1677ff]' : 'text-[#606266] hover:bg-[#f0f2f5]'
              }`}
              title="编辑流程活动节点属性"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Collapse Toolbar Toggle */}
            <button
              onClick={() => setToolbarCollapsed(true)}
              className="w-7 h-7 rounded hover:bg-[#f0f2f5] flex items-center justify-center text-[#909399] hover:text-[#303133] cursor-pointer"
              title="折叠工具栏"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* When toolbar is collapsed: Minimal bar */}
      {toolbarCollapsed && (
        <div className="h-6 bg-[#f8f9fb] border-b border-[#e4e7ed] px-3 flex items-center justify-between shrink-0 text-[11px] text-[#909399]">
          <span>工具栏已折叠</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAiModalOpen(true);
                bridgeRef.current?.requestCells();
              }}
              className="text-[#7c3aed] font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#7c3aed]" />
              <span>QingProcess AI</span>
            </button>
            <button
              onClick={() => setToolbarCollapsed(false)}
              className="hover:text-[#1677ff] flex items-center gap-0.5 cursor-pointer"
            >
              <span>展开</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Canvas Search Bar Popover */}
      {canvasSearchOpen && (
        <div className="absolute top-[92px] right-8 z-40 bg-white border border-[#dcdfe6] rounded-lg shadow-xl p-2 flex items-center gap-2 w-72">
          <Search className="w-4 h-4 text-[#909399] shrink-0" />
          <input
            type="text"
            value={canvasSearchText}
            autoFocus
            onChange={(e) => setCanvasSearchText(e.target.value)}
            placeholder="在当前画布中查找节点或角色..."
            className="w-full text-xs outline-none text-[#303133]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canvasSearchText) {
                const found = canvasCellsSnapshot.find(
                  (c) =>
                    (c.value && c.value.toLowerCase().includes(canvasSearchText.toLowerCase())) ||
                    (c.attrs?.roleName && c.attrs.roleName.toLowerCase().includes(canvasSearchText.toLowerCase()))
                );
                if (found) {
                  bridgeRef.current?.highlightCell(found.id);
                  showToast(`已定位到节点: ${found.value || found.id}`, 'info');
                } else {
                  showToast('未找到匹配的图元节点', 'warning');
                }
              }
              if (e.key === 'Escape') setCanvasSearchOpen(false);
            }}
          />
          <button
            onClick={() => setCanvasSearchOpen(false)}
            className="text-[#909399] hover:text-[#303133] p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* 拖拽调宽期间的防穿透遮罩 */}
        {isResizingPalette && (
          <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
        )}

        {/* Left Palette */}
        <aside
          style={{ width: `${paletteWidth}px` }}
          className={`bg-white border-r border-[#e4e7ed] flex flex-col h-full shrink-0 z-20 relative select-none ${
            isResizingPalette ? 'transition-none select-none' : 'transition-[width] duration-150'
          }`}
        >
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-[#ebeef5] flex items-center justify-between shrink-0 bg-[#fafafa]">
            <div className="flex items-center gap-1.5 min-w-0">
              <Shapes className="w-4 h-4 text-[#1677ff] shrink-0" />
              <span className="text-xs font-bold text-[#1f2733] truncate">流程图元库</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#ecf5ff] text-[#1677ff] font-mono-tabular font-medium border border-[#d9ecff] shrink-0">
                {totalFilteredCount}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setPaletteColorMode(paletteColorMode === 'color' ? 'mono' : 'color')}
                className="px-2 py-0.5 rounded text-[11px] border border-[#dcdfe6] text-[#606266] hover:text-[#1677ff] hover:border-[#1677ff] hover:bg-white cursor-pointer transition-colors"
                title={paletteColorMode === 'color' ? '切换为简约单色模式' : '切换为彩色模式'}
              >
                {paletteColorMode === 'color' ? '彩色' : '单色'}
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="p-2 border-b border-[#ebeef5] shrink-0 bg-white">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2 pointer-events-none" />
              <input
                type="text"
                value={shapeSearch}
                onChange={(e) => setShapeSearch(e.target.value)}
                placeholder="搜索图元 (如活动、泳道、判断)..."
                className="w-full h-7 pl-7 pr-6 rounded border border-[#dcdfe6] focus:border-[#1677ff] text-xs text-[#303133] placeholder-[#c0c4cc] outline-none transition-colors"
              />
              {shapeSearch && (
                <button
                  type="button"
                  onClick={() => setShapeSearch('')}
                  className="absolute right-1.5 p-0.5 rounded text-[#909399] hover:text-[#303133] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-2 py-1.5 border-b border-[#ebeef5] flex gap-1 overflow-x-auto shrink-0 bg-[#f8f9fb]">
            {[
              { id: 'all', label: '全部' },
              { id: 'flow', label: '标准流程' },
              { id: 'swimlane', label: '泳道容器' },
              { id: 'evc', label: '价值链' },
              { id: 'basic', label: '基础图形' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-2 py-0.8 rounded text-[11px] whitespace-nowrap cursor-pointer transition-colors ${
                  activeCategory === tab.id
                    ? 'bg-[#1677ff] text-white font-medium shadow-2xs'
                    : 'text-[#606266] hover:bg-[#ebeef5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Stencil List / Accordion */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-3.5">
            {filteredGroups.length === 0 || totalFilteredCount === 0 ? (
              <div className="py-8 text-center text-xs text-[#909399]">
                未找到与 “{shapeSearch}” 匹配的图元
              </div>
            ) : (
              filteredGroups.map((group) => {
                if (group.items.length === 0) return null;
                const isCollapsed = !!collapsedGroups[group.id];
                const isWideGroup = group.id === 'swimlane';

                return (
                  <div key={group.id} className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setCollapsedGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                      className="w-full flex items-center justify-between text-xs font-semibold text-[#1f2733] py-1 px-1 rounded hover:bg-[#f5f7fa] cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{group.title}</span>
                        <span className="text-[10px] text-[#909399] font-normal font-mono-tabular">({group.items.length})</span>
                      </div>
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-[#909399]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-[#909399]" />
                      )}
                    </button>

                    {!isCollapsed && (
                      <div className={`grid ${isWideGroup ? 'grid-cols-1' : 'grid-cols-2'} gap-1.5`}>
                        {group.items.map((shape) => (
                          <button
                            key={shape.type}
                            type="button"
                            draggable
                            onDragStart={(e) => handleDragStartShape(e, shape)}
                            onClick={() => handleInsertShape(shape)}
                            title={`${shape.label}\n点击直接插入画布中心，或按住拖拽至画布释放`}
                            className={`p-1.5 rounded border border-[#ebeef5] bg-white hover:border-[#1677ff] hover:bg-[#ecf5ff]/60 hover:shadow-xs active:scale-[0.98] text-left text-xs flex items-center gap-1.5 cursor-grab active:cursor-grabbing transition-all ${
                              isWideGroup ? 'py-2 px-2.5' : ''
                            }`}
                          >
                            <ShapeSvgIcon type={shape.type} colorMode={paletteColorMode} />
                            <span className="truncate text-[#303133] text-[11px] font-normal">{shape.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Tip */}
          <div className="p-2 border-t border-[#ebeef5] bg-[#fafafa] shrink-0 text-[10px] text-[#909399] flex items-center justify-between">
            <span>💡 点击或长按拖拽放入画布</span>
          </div>

          {/* Right Resizer Handle */}
          <div
            onMouseDown={handleStartResizePalette}
            onDoubleClick={() => {
              setPaletteWidth(260);
              try { localStorage.setItem('dflow_designer_palette_width', '260'); } catch {}
            }}
            title="按住左右拖拽调整图元库宽度，双击恢复默认 (260px)"
            className="absolute top-0 right-0 w-2.5 h-full -mr-1 z-30 cursor-col-resize flex items-center justify-center group select-none"
          >
            <div
              className={`w-[2px] h-full transition-colors ${
                isResizingPalette ? 'bg-[#1677ff] shadow-[0_0_8px_rgba(22,119,255,0.7)]' : 'bg-transparent group-hover:bg-[#1677ff]'
              }`}
            />
          </div>
        </aside>

        {/* QingProcess AI Panel Docked on Left */}
        {aiModalOpen && aiDockSide === 'left' && (
          <AiAssistantChatModal
            open={aiModalOpen}
            onClose={() => setAiModalOpen(false)}
            flowTitle={flowTitle}
            canvasCells={canvasCellsSnapshot}
            dockSide="left"
            onToggleDockSide={() => {
              setAiDockSide('right');
              try { localStorage.setItem('qingprocess_ai_dock_side', 'right'); } catch {}
              showToast('已将 QingProcess AI 面板切换停靠至画板右侧', 'info');
            }}
            onLoadXml={(xml, title) => {
              bridgeRef.current?.loadXml(xml, title || flowTitle);
              if (title) setFlowTitle(title);
              setLatestXml(xml);
            }}
            onAutoLayout={() => {
              bridgeRef.current?.invokeAction('autoLayout');
            }}
            onFitCanvas={() => {
              bridgeRef.current?.fit();
            }}
            onOpenRaciModal={() => {
              bridgeRef.current?.requestCells();
              setRaciMatrixOpen(true);
            }}
            onUpdateStyle={(patch) => {
              bridgeRef.current?.updateStyle(patch);
            }}
            showToast={showToast}
            onNavigateToModelConfig={() => onNavigate?.('/system/models')}
          />
        )}

        {/* Center Canvas */}
        <main className="flex-1 h-full relative bg-[#f8f9fb] overflow-hidden">
          <iframe
            ref={iframeRef}
            title="流程画布"
            src="/drawio/index.html?embed=1&proto=json&ui=min&lang=zh&noSaveBtn=1&noExitBtn=1&configure=1&offline=1"
            className="w-full h-full border-0 block"
          />
        </main>

        {/* QingProcess AI Panel Docked on Right */}
        {aiModalOpen && aiDockSide === 'right' && (
          <AiAssistantChatModal
            open={aiModalOpen}
            onClose={() => setAiModalOpen(false)}
            flowTitle={flowTitle}
            canvasCells={canvasCellsSnapshot}
            dockSide="right"
            onToggleDockSide={() => {
              setAiDockSide('left');
              try { localStorage.setItem('qingprocess_ai_dock_side', 'left'); } catch {}
              showToast('已将 QingProcess AI 面板切换停靠至画板左侧', 'info');
            }}
            onLoadXml={(xml, title) => {
              bridgeRef.current?.loadXml(xml, title || flowTitle);
              if (title) setFlowTitle(title);
              setLatestXml(xml);
            }}
            onAutoLayout={() => {
              bridgeRef.current?.invokeAction('autoLayout');
            }}
            onFitCanvas={() => {
              bridgeRef.current?.fit();
            }}
            onOpenRaciModal={() => {
              bridgeRef.current?.requestCells();
              setRaciMatrixOpen(true);
            }}
            onUpdateStyle={(patch) => {
              bridgeRef.current?.updateStyle(patch);
            }}
            showToast={showToast}
            onNavigateToModelConfig={() => onNavigate?.('/system/models')}
          />
        )}

        {/* Right Property Drawer: Full Process Node Editor matching image_28312ca2.png */}
        {rightDrawerMode === 'props' && panelCell && (
          <NodePropertiesDrawer
            open={rightDrawerMode === 'props' && !!panelCell}
            cell={panelCell}
            flowTitle={flowTitle}
            onClose={() => setRightDrawerMode('none')}
            onSave={(cellId, attrs) => {
              bridgeRef.current?.setCellAttrs(cellId, attrs);
              setPanelCell({ ...panelCell, attrs: { ...(panelCell.attrs || {}), ...attrs } });
            }}
            onOpenRaciModal={() => {
              bridgeRef.current?.requestCells();
              setRaciMatrixOpen(true);
            }}
            showToast={showToast}
          />
        )}
      </div>

      {/* RACI Matrix Modal */}
      <RaciMatrixModal
        open={raciMatrixOpen}
        onClose={() => setRaciMatrixOpen(false)}
        flowTitle={flowTitle}
        cells={canvasCellsSnapshot}
        flowRoles={[]}
        onUpdateNodeRaci={(cellId, raciPatch) => {
          bridgeRef.current?.setCellAttrs(cellId, raciPatch);
        }}
        onAddCustomRole={() => {}}
        onHighlightNode={(cellId) => {
          bridgeRef.current?.highlightCell(cellId);
        }}
        showToast={showToast}
      />

      {/* Share Collaboration Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#dcdfe6] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafafa]">
              <span className="font-bold text-sm text-[#1f2733] flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#1677ff]" />
                <span>分享与协作</span>
              </span>
              <button onClick={() => setShareModalOpen(false)} className="text-[#909399] hover:text-[#303133]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[#606266] font-medium mb-1">协同编辑链接</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={window.location.href}
                    className="flex-1 h-8 px-2.5 rounded border border-[#dcdfe6] bg-[#f5f7fa] text-[#606266] text-xs outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      showToast('协同链接已复制到剪贴板', 'success');
                    }}
                    className="h-8 px-3 rounded bg-[#1677ff] hover:bg-[#409eff] text-white font-medium cursor-pointer"
                  >
                    复制
                  </button>
                </div>
              </div>
              <div className="border-t border-[#ebeef5] pt-3">
                <span className="text-[#303133] font-semibold block mb-2">协作者权限：</span>
                <div className="space-y-2 text-[#606266]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="perm" defaultChecked className="text-[#1677ff]" />
                    <span>允许受邀成员共同编辑 (实时多人协作)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="perm" className="text-[#1677ff]" />
                    <span>仅允许查阅与发表评审批注 (只读模式)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Realtime Call Collaboration Modal */}
      {callModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#dcdfe6] w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafafa]">
              <span className="font-bold text-sm text-[#1f2733] flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>实时协同研讨室</span>
              </span>
              <button onClick={() => setCallModalOpen(false)} className="text-[#909399] hover:text-[#303133]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Phone className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#1f2733]">发起流程评审语音研讨</h4>
                <p className="text-xs text-[#909399] mt-1">
                  邀请当前流程的相关责任人（研发、产品、质量）加入实时音视频与同屏光标研讨。
                </p>
              </div>
              <button
                onClick={() => {
                  setCallModalOpen(false);
                  showToast('已接入实时语音协同通道，同屏成员已就绪', 'success');
                }}
                className="w-full h-8 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer"
              >
                立即进入研讨室
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Review Modal */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#dcdfe6] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafafa]">
              <span className="font-bold text-sm text-[#1f2733] flex items-center gap-2">
                <Send className="w-4 h-4 text-[#1677ff]" />
                <span>发布与审批流转</span>
              </span>
              <button onClick={() => setPublishModalOpen(false)} className="text-[#909399] hover:text-[#303133]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[#606266] font-medium mb-1">发布版本号</label>
                <input
                  type="text"
                  defaultValue="V1.0.0 (基线发布)"
                  className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#606266] font-medium mb-1">变更履历与发布说明</label>
                <textarea
                  rows={3}
                  placeholder="填写本次流程图的新增节点、职责变更或优化事项..."
                  className="w-full p-2 rounded border border-[#dcdfe6] outline-none resize-none"
                />
              </div>
              <button
                onClick={() => {
                  setPublishModalOpen(false);
                  showToast('流程图已成功提交发布审批流，待流程管委会签批！', 'success');
                }}
                className="w-full h-8 rounded bg-[#1677ff] hover:bg-[#409eff] text-white font-medium cursor-pointer mt-2"
              >
                提交发布
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insert Image Modal */}
      {insertImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#dcdfe6] w-full max-w-md overflow-hidden text-xs">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafafa]">
              <span className="font-bold text-sm text-[#1f2733] flex items-center gap-2">
                <Image className="w-4 h-4 text-[#409eff]" />
                <span>插入外部图片</span>
              </span>
              <button onClick={() => setInsertImageModalOpen(false)} className="text-[#909399] hover:text-[#303133]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[#606266] font-medium mb-1">图片网络 URL 地址</label>
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/diagram-asset.png"
                  className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setInsertImageModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-[#dcdfe6] text-[#606266]"
                >
                  取消
                </button>
                <button
                  onClick={handleInsertImageConfirm}
                  className="px-4 py-1.5 rounded bg-[#1677ff] text-white font-medium"
                >
                  确认插入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insert Link Modal */}
      {insertLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#dcdfe6] w-full max-w-md overflow-hidden text-xs">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafafa]">
              <span className="font-bold text-sm text-[#1f2733] flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#67c23a]" />
                <span>插入节点超链接</span>
              </span>
              <button onClick={() => setInsertLinkModalOpen(false)} className="text-[#909399] hover:text-[#303133]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[#606266] font-medium mb-1">超链接目标 URL</label>
                <input
                  type="text"
                  value={linkUrlInput}
                  onChange={(e) => setLinkUrlInput(e.target.value)}
                  placeholder="https://wiki.company.internal/sop/doc-01"
                  className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setInsertLinkModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-[#dcdfe6] text-[#606266]"
                >
                  取消
                </button>
                <button
                  onClick={handleInsertLinkConfirm}
                  className="px-4 py-1.5 rounded bg-[#1677ff] text-white font-medium"
                >
                  应用链接
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
