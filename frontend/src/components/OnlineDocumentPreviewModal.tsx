import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  FileSpreadsheet,
  Presentation,
  CheckCircle2,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  Search,
  Sliders,
  Table as TableIcon,
  ShieldCheck,
  Check,
  ExternalLink,
  Layers,
  FileCode,
  Lock,
  ShieldAlert,
} from 'lucide-react';

export interface DocumentItem {
  id?: string;
  docNo?: string;
  label: string; // e.g. "全源科技销售合同分级审批制度.pdf"
  category?: string;
  versionNo?: string;
  fileSize?: string;
  ownerName?: string;
  status?: string;
  publishTime?: string;
  validityPeriod?: string;
  fileType?: 'pdf' | 'word' | 'excel' | 'ppt';
  [key: string]: any;
}

export interface OnlineDocumentPreviewModalProps {
  document: DocumentItem;
  onClose: () => void;
  showToast?: (msg: string, type?: any) => void;
  allowDownload?: boolean;
  previewOnly?: boolean;
}

export const getFileExtension = (filename: string): string => {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
};

export const getDocumentFormat = (filename: string): 'pdf' | 'word' | 'excel' | 'ppt' => {
  const ext = getFileExtension(filename);
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
  if (['ppt', 'pptx'].includes(ext)) return 'ppt';
  return 'pdf';
};

export const downloadDocumentFile = (doc: DocumentItem, showToast?: (msg: string, type?: any) => void) => {
  const filename = doc.label || '制度文件.pdf';
  const format = getDocumentFormat(filename);

  let mimeType = 'application/pdf';
  let sampleContent = '';

  if (format === 'pdf') {
    mimeType = 'application/pdf';
    sampleContent = `%PDF-1.4\n% 全源流程资产管理平台\n1 0 obj\n<< /Title (${filename}) /Author (${doc.ownerName || '全源科技'}) >>\nendobj\n%%EOF`;
  } else if (format === 'word') {
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    sampleContent = `全源流程资产管理平台 - 制度文件\n文件名称: ${filename}\n制度编号: ${doc.docNo || 'ZD-2026-01'}\n版本: ${doc.versionNo || 'V1.0'}\n有效期: ${doc.validityPeriod || '长期有效'}\n发布时间: ${doc.publishTime || '2026-03-17'}\n\n第一章 总则\n为规范企业内部运行，特制定本管理制度。\n第二章 权责划分与流程审批\n各部门严格按照公司DOA授权手册执行。`;
  } else if (format === 'excel') {
    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    sampleContent = `序号,制度编码,制度文件名称,所属业务目录,版本,责任部门,有效期,发布时间\n1,${doc.docNo || 'ZD-MKT-2026-01'},${filename},${doc.category || '营销管理'},${doc.versionNo || 'V1.0'},${doc.ownerName || '商务部'},${doc.validityPeriod || '长期有效'},${doc.publishTime || '2026-03-17'}`;
  } else if (format === 'ppt') {
    mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    sampleContent = `PPT Presentation - ${filename}\nSlide 1: ${filename}\nSlide 2: 制度背景与目的\nSlide 3: 核心管理流程与分权控制\nSlide 4: 关键KCP监控节点\nSlide 5: 附则与生效执行`;
  }

  try {
    const blob = new Blob([sampleContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast?.(`已成功触发文件下载: ${filename}`, 'success');
  } catch (e) {
    console.error('Download failed', e);
    showToast?.('下载失败，请检查浏览器权限', 'error');
  }
};

export const OnlineDocumentPreviewModal: React.FC<OnlineDocumentPreviewModalProps> = ({
  document: doc,
  onClose,
  showToast,
  allowDownload = true,
  previewOnly = false,
}) => {
  const isRestrictedPreview = previewOnly || allowDownload === false;
  const format = useMemo(() => getDocumentFormat(doc.label), [doc.label]);
  const [zoom, setZoom] = useState<number>(100);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // PDF & Word pages state
  const [pdfPage, setPdfPage] = useState(1);
  const totalPdfPages = 3;

  // Excel state
  const [activeSheet, setActiveSheet] = useState<'sheet1' | 'sheet2' | 'sheet3'>('sheet1');
  const [excelSearch, setExcelSearch] = useState('');

  // PPT state
  const [pptSlide, setPptSlide] = useState(1);
  const totalPptSlides = 5;

  const handleDownload = () => {
    if (isRestrictedPreview) {
      showToast?.('当前账号仅具备只读预览权限，已被禁止下载文件', 'warning');
      return;
    }
    downloadDocumentFile(doc, showToast);
  };

  const handlePrint = () => {
    if (isRestrictedPreview) {
      showToast?.('当前模式禁止打印文件', 'warning');
      return;
    }
    window.print();
  };

  const formatBadgeConfig = useMemo(() => {
    switch (format) {
      case 'pdf':
        return {
          label: 'PDF 文档',
          icon: FileText,
          bg: 'bg-[#FEE2E2]',
          text: 'text-[#DC2626]',
          border: 'border-[#FCA5A5]',
        };
      case 'word':
        return {
          label: 'Word 文档 (DOCX)',
          icon: FileText,
          bg: 'bg-[#DBEAFE]',
          text: 'text-[#2563EB]',
          border: 'border-[#93C5FD]',
        };
      case 'excel':
        return {
          label: 'Excel 电子表格 (XLSX)',
          icon: FileSpreadsheet,
          bg: 'bg-[#D1FAE5]',
          text: 'text-[#059669]',
          border: 'border-[#6EE7B7]',
        };
      case 'ppt':
        return {
          label: 'PowerPoint 演示文稿 (PPTX)',
          icon: Presentation,
          bg: 'bg-[#FFEDD5]',
          text: 'text-[#D97706]',
          border: 'border-[#FDBA74]',
        };
      default:
        return {
          label: '在线文档',
          icon: FileText,
          bg: 'bg-[#F3F4F6]',
          text: 'text-[#4B5563]',
          border: 'border-[#E5E7EB]',
        };
    }
  }, [format]);

  const FormatIcon = formatBadgeConfig.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 select-none">
      <div
        className={`bg-[#F1F3F5] rounded-lg shadow-2xl border border-[#D1D5DB] flex flex-col overflow-hidden transition-all duration-200 ${
          isFullScreen ? 'w-full h-full rounded-none' : 'w-[96vw] max-w-6xl h-[92vh]'
        }`}
      >
        {/* Top Header & Toolbar */}
        <div className="bg-[#1F2937] text-white px-4 py-2.5 flex items-center justify-between shrink-0 border-b border-gray-700">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 ${formatBadgeConfig.bg} ${formatBadgeConfig.text} ${formatBadgeConfig.border}`}
            >
              <FormatIcon className="w-3.5 h-3.5" />
              <span>{formatBadgeConfig.label}</span>
            </span>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate max-w-md sm:max-w-lg" title={doc.label}>
                {doc.label}
              </h2>
              <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5 flex-wrap">
                <span>编码: {doc.docNo || 'ZD-MKT-2026-01'}</span>
                <span>•</span>
                <span>版本: {doc.versionNo || 'V2.0'}</span>
                <span>•</span>
                <span>归口: {doc.ownerName || '商务部'}</span>
                <span>•</span>
                <span className="text-[#34D399] font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  有效期: {doc.validityPeriod || '2026-03-17 至 2029-03-16 (长期有效)'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-gray-800 rounded px-1.5 py-0.5 border border-gray-700 text-xs text-gray-300">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(75, prev - 15))}
                className="p-1 hover:text-white cursor-pointer"
                title="缩小"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px]">{zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(150, prev + 15))}
                className="p-1 hover:text-white cursor-pointer"
                title="放大"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                className="p-1 hover:text-white border-l border-gray-700 ml-1 cursor-pointer"
                title="还原 100%"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Print Button */}
            {!isRestrictedPreview && (
              <button
                type="button"
                onClick={handlePrint}
                className="h-8 px-2.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="打印文件"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">打印</span>
              </button>
            )}

            {/* Download Button / Restricted Indicator */}
            {!isRestrictedPreview ? (
              <button
                type="button"
                onClick={handleDownload}
                className="h-8 px-3 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                title="自动下载该文件"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载文件</span>
              </button>
            ) : (
              <div className="h-8 px-2.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-1.5 whitespace-nowrap" title="当前角色权限为仅预览模式，已被授予限制下载/打印">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>仅在线预览 · 无下载权限</span>
              </div>
            )}

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white cursor-pointer"
              title={isFullScreen ? '退出全屏' : '全屏展示'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-red-600 text-gray-300 hover:text-white cursor-pointer transition-colors ml-1"
              title="关闭预览"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Body by Format */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center bg-[#E5E7EB]">
          {/* ===================================================================== */}
          {/* 1. PDF 真实企业红头制度文件预览 (.pdf) */}
          {/* ===================================================================== */}
          {format === 'pdf' && (
            <div className="flex flex-col items-center space-y-4 max-w-full">
              {/* Pagination toolbar */}
              <div className="bg-white rounded-md shadow-xs px-3 py-1.5 border border-[#D1D5DB] flex items-center gap-3 text-xs text-[#4B5563]">
                <button
                  type="button"
                  disabled={pdfPage <= 1}
                  onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded hover:bg-[#F3F4F6] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  第 <span className="font-bold text-[#1F2937]">{pdfPage}</span> 页 / 共 {totalPdfPages} 页
                </span>
                <button
                  type="button"
                  disabled={pdfPage >= totalPdfPages}
                  onClick={() => setPdfPage((p) => Math.min(totalPdfPages, p + 1))}
                  className="p-1 rounded hover:bg-[#F3F4F6] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-gray-300">|</span>
                <span className="text-[11px] text-gray-500">双面打印标准排版 · A4 规格</span>
              </div>

              {/* PDF Document Canvas */}
              <div
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                className="bg-white text-[#111827] shadow-xl border border-[#D1D5DB] w-[794px] min-h-[1123px] p-14 relative flex flex-col justify-between transition-transform duration-150 select-text"
              >
                {/* Official Watermark */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-5 z-0 select-none">
                  <div className="text-7xl font-black text-gray-900 rotate-[-30deg] tracking-widest uppercase">
                    全源数字科技 · 制度正本
                  </div>
                </div>

                <div className="relative z-10 space-y-6">
                  {/* Red-head Header */}
                  <div className="border-b-2 border-[#DC2626] pb-3 text-center space-y-2">
                    <div className="text-2xl font-black text-[#DC2626] tracking-widest font-serif">
                      全源数字科技（苏州）有限公司文件
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 font-mono px-2 pt-1">
                      <span>全源发〔2026〕01号</span>
                      <span className="text-[#DC2626] font-bold">签发人：流程管理委员会</span>
                      <span>密级：内部公开</span>
                    </div>
                  </div>

                  {/* Document Title */}
                  <div className="text-center pt-2 pb-1">
                    <h1 className="text-xl font-bold text-[#111827] tracking-wide">
                      {doc.label.replace(/\.[^.]+$/, '')}
                    </h1>
                    <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-3">
                      <span>制度编码：{doc.docNo || 'ZD-MKT-2026-01'}</span>
                      <span>•</span>
                      <span>版本：{doc.versionNo || 'V2.0'}</span>
                      <span>•</span>
                      <span>责任归口：{doc.ownerName || '商务部'}</span>
                    </div>
                  </div>

                  {/* Validity Period Ribbon */}
                  <div className="bg-[#FEF3C7] border border-[#FDE68A] p-2 rounded text-xs text-[#92400E] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>制度有效期：{doc.validityPeriod || '2026-03-17 至 2029-03-16 (长期有效)'}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#047857] font-semibold text-[10px]">
                      ● 当前处于法定有效期内
                    </span>
                  </div>

                  {/* Body Content based on page */}
                  {pdfPage === 1 && (
                    <div className="space-y-4 text-xs leading-relaxed text-[#374151]">
                      <div>
                        <h3 className="font-bold text-sm text-[#111827] mb-1">第一章 总则</h3>
                        <p className="indent-6 text-justify">
                          第一条【制定目的】为规范全源数字科技（苏州）有限公司日常经营中各类商务销售合同的谈判、评审、签署及履约监管，规避商业合规及财务坏账风险，提高业务流转审批效能，依据《中华人民共和国民法典》及公司《2026企业分权授权制度(DOA手册)》，特制定本管理制度。
                        </p>
                        <p className="indent-6 text-justify mt-2">
                          第二条【适用范围】本制度适用于公司各事业部、研发中心、区域营销中心及控股子公司在开展软硬件销售、系统集成、技术服务咨询等商务活动中所签署的所有具有法律约束力的框架协议、采购订单、商务合同及补充协议。
                        </p>
                      </div>

                      <div className="pt-2">
                        <h3 className="font-bold text-sm text-[#111827] mb-1">第二章 审批权限与分级管控矩阵</h3>
                        <p className="indent-6 text-justify">
                          第三条【分级原则】销售合同依据合同金额、客户信用评级及非标商务条款，分为以下四级进行权责管控：
                        </p>
                        <table className="w-full mt-2 border-collapse border border-gray-300 text-[11px]">
                          <thead>
                            <tr className="bg-gray-100 text-gray-700">
                              <th className="border border-gray-300 p-1.5 text-center">合同等级</th>
                              <th className="border border-gray-300 p-1.5 text-center">金额范围 (人民币)</th>
                              <th className="border border-gray-300 p-1.5 text-center">主责经办</th>
                              <th className="border border-gray-300 p-1.5 text-center">会签节点 (C)</th>
                              <th className="border border-gray-300 p-1.5 text-center">最终决策批准 (A)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 p-1.5 text-center font-medium">一级重大合同</td>
                              <td className="border border-gray-300 p-1.5 text-center font-mono">≥ 500 万元</td>
                              <td className="border border-gray-300 p-1.5">销售大区总监</td>
                              <td className="border border-gray-300 p-1.5">法务总监、财务总监、交付VP</td>
                              <td className="border border-gray-300 p-1.5 text-center font-bold text-red-600">总裁 / CEO 签批</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-1.5 text-center font-medium">二级重点合同</td>
                              <td className="border border-gray-300 p-1.5 text-center font-mono">100 万 ~ 500 万元</td>
                              <td className="border border-gray-300 p-1.5">区域销售主管</td>
                              <td className="border border-gray-300 p-1.5">法务合规专员、财务经理</td>
                              <td className="border border-gray-300 p-1.5 text-center font-bold text-blue-600">事业部总经理</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-1.5 text-center font-medium">三级标准合同</td>
                              <td className="border border-gray-300 p-1.5 text-center font-mono">20 万 ~ 100 万元</td>
                              <td className="border border-gray-300 p-1.5">客户经理</td>
                              <td className="border border-gray-300 p-1.5">商务审核专员</td>
                              <td className="border border-gray-300 p-1.5 text-center font-bold">销售总监</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-1.5 text-center font-medium">四级快速合同</td>
                              <td className="border border-gray-300 p-1.5 text-center font-mono">&lt; 20 万元 (标准件)</td>
                              <td className="border border-gray-300 p-1.5">客户经理</td>
                              <td className="border border-gray-300 p-1.5">商务助理自动复核</td>
                              <td className="border border-gray-300 p-1.5 text-center font-bold">部门经理</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {pdfPage === 2 && (
                    <div className="space-y-4 text-xs leading-relaxed text-[#374151]">
                      <h3 className="font-bold text-sm text-[#111827] mb-1">第三章 审批流转与电子签名执行</h3>
                      <p className="indent-6 text-justify">
                        第四条【全流程在线流转】所有销售合同必须通过本系统（dflow平台）线上发起审批申请，严禁任何未走线上流程私自签署、加盖公章的行为。任何脱离系统线下办理的合同，公司财务部不予建立项目台账及确认收入。
                      </p>
                      <p className="indent-6 text-justify">
                        第五条【关键控制点 (KCP) 审查】
                      </p>
                      <ul className="list-disc pl-8 space-y-1">
                        <li><strong>KCP-01 条款合规否决权：</strong>若合同存在无限连带担保、未设违约金上限或放弃争议管辖权条款，法务人员拥有一票否决权。</li>
                        <li><strong>KCP-02 财务资金安全门禁：</strong>预付款比例低于30%或质保期超过24个月的项目，必须经财务总监专项特批。</li>
                        <li><strong>KCP-03 交付可行性评估：</strong>包含定制开发特性的合同，必须经研发PMT团队与架构师签署可行性确认函后方可签批。</li>
                      </ul>

                      <div className="pt-3">
                        <h3 className="font-bold text-sm text-[#111827] mb-1">第四章 违规责任与惩戒</h3>
                        <p className="indent-6 text-justify">
                          第六条 对违反本制度规定、越权签署合同或因审核疏漏造成公司经济损失及商誉损害的相关责任人，公司将依据《员工合规奖惩细则》予以诫勉谈话、降级降职直至解除劳动合同；涉嫌违法犯罪的，依法移送司法机关处理。
                        </p>
                      </div>
                    </div>
                  )}

                  {pdfPage === 3 && (
                    <div className="space-y-4 text-xs leading-relaxed text-[#374151]">
                      <h3 className="font-bold text-sm text-[#111827] mb-1">第五章 附则</h3>
                      <p className="indent-6 text-justify">
                        第七条 本制度由公司商务部负责日常解释与流程维护，流程管理部负责系统配置与年度例行合规复审。
                      </p>
                      <p className="indent-6 text-justify">
                        第八条 本制度自发文之日起正式颁布施行，原《全源销售合同签署管理暂行办法》(2023版)自本制度生效之日起废止。
                      </p>

                      {/* Official Seal and Signature Section */}
                      <div className="pt-12 relative flex justify-between items-end">
                        <div className="space-y-1 text-gray-600 font-mono text-[11px]">
                          <div>抄送：各业务域、各职能中心、各分公司</div>
                          <div>全源数字科技（苏州）有限公司 流程治理委员会</div>
                          <div>印发日期：{doc.publishTime || '2026-03-17'}</div>
                        </div>

                        {/* Red Seal Stamp */}
                        <div className="relative flex flex-col items-center">
                          <div className="w-36 h-36 rounded-full border-3 border-[#DC2626] flex flex-col items-center justify-center text-[#DC2626] rotate-[-8deg] relative shadow-xs p-2">
                            <span className="text-[10px] font-bold tracking-tight text-center">
                              全源数字科技有限公司
                            </span>
                            <div className="text-xl my-0.5 text-[#DC2626]">★</div>
                            <span className="text-[11px] font-black tracking-widest">
                              制度审核专用章
                            </span>
                            <span className="text-[8px] font-mono mt-0.5">3205001928472</span>
                          </div>
                          <div className="text-right text-xs font-bold text-gray-800 mt-2 font-mono">
                            2026 年 03 月 17 日
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Page Number */}
                <div className="relative z-10 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400 font-mono">
                  — 第 {pdfPage} 页 · 共 {totalPdfPages} 页 —
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 2. Word 真实文档在线排版预览 (.docx / .doc) */}
          {/* ===================================================================== */}
          {format === 'word' && (
            <div className="flex justify-center max-w-full">
              <div
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                className="bg-white text-[#1F2937] shadow-xl border border-[#D1D5DB] w-[794px] min-h-[1050px] p-12 transition-transform duration-150 select-text font-sans"
              >
                {/* Word Document Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-300 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2563EB]" />
                    <span className="font-semibold text-gray-700">全源企业级流程制度规范文档库</span>
                  </div>
                  <span className="font-mono">{doc.docNo || 'ZD-IPD-2026-02'} · {doc.versionNo || 'V3.1'}</span>
                </div>

                {/* Word Content */}
                <div className="pt-6 space-y-5">
                  <div className="text-center space-y-1">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                      {doc.label.replace(/\.[^.]+$/, '')}
                    </h1>
                    <div className="text-xs text-gray-500 font-medium">
                      编制部门：{doc.ownerName || '研发管理部'} | 生效发布时间：{doc.publishTime || '2026-01-02'}
                    </div>
                  </div>

                  {/* Word Document Properties Box */}
                  <div className="p-3 rounded bg-blue-50/70 border border-blue-200 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">制度文件有效期：</span>
                      <span className="font-semibold text-blue-700">{doc.validityPeriod || '2026-01-02 至 2029-01-01 (3年有效)'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">归属业务目录：</span>
                      <span className="font-medium text-gray-800">{doc.category || '02 研发与技术管理制度'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">审核状态：</span>
                      <span className="text-emerald-600 font-semibold">● 审批通过已生效</span>
                    </div>
                    <div>
                      <span className="text-gray-500">文档字数：</span>
                      <span className="font-mono text-gray-800">4,820 字</span>
                    </div>
                  </div>

                  {/* Word Document Outline & Text */}
                  <div className="space-y-4 text-xs leading-relaxed text-gray-700">
                    <div>
                      <h2 className="text-base font-bold text-blue-900 pb-1 border-b border-blue-100 mb-2">
                        1. 流程控制目的与方针
                      </h2>
                      <p className="text-justify indent-6">
                        为了在集成产品开发（IPD）过程中把好技术质量关，确保关键技术评审点（TR1-TR6）的客观性、严肃性与独立性，规范评审委员会决议输出，特制定本控制程序。本制度涵盖硬件方案评审、电路系统审查、固件代码审核及可靠性试验评价全环节。
                      </p>
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-blue-900 pb-1 border-b border-blue-100 mb-2">
                        2. 评审委员会角色与职责分工
                      </h2>
                      <ul className="list-disc pl-6 space-y-1.5">
                        <li><strong>主任评审官 (Lead Reviewer)：</strong>全面把控TR评审节奏，对关键争议技术方案拥有最终决断权。</li>
                        <li><strong>系统架构师 (System Architect)：</strong>核查架构设计的模块化、解耦性及扩展能力，确保技术基线符合顶层规范。</li>
                        <li><strong>质量测试专家 (QA Lead)：</strong>核验功能覆盖率与测试用例达标情况，对未关闭严重缺陷行使否决权。</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-blue-900 pb-1 border-b border-blue-100 mb-2">
                        3. 评审流程与输入输出物料清单
                      </h2>
                      <p className="text-justify indent-6">
                        评审会议召开前5个工作日，项目经理须在 dflow 系统内上传《技术规格说明书》、《详细设计方案》、《FMEA失效模式分析表》。任何物料缺失均视为材料准入不达标，评审会自动延期。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 3. Excel 真实电子表格在线预览 (.xlsx / .xls) */}
          {/* ===================================================================== */}
          {format === 'excel' && (
            <div className="w-full max-w-5xl bg-white rounded-lg shadow-xl border border-gray-300 flex flex-col overflow-hidden">
              {/* Excel Ribbon Bar */}
              <div className="bg-[#107C41] text-white p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="font-bold">{doc.label}</span>
                  <span className="bg-white/20 px-2 py-0.2 rounded text-[11px]">Microsoft Excel 格式</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-300 absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={excelSearch}
                      onChange={(e) => setExcelSearch(e.target.value)}
                      placeholder="在工作表中搜索..."
                      className="h-6 pl-7 pr-2 rounded bg-white/20 text-white placeholder-gray-300 text-xs outline-none focus:bg-white focus:text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Excel Formula Bar */}
              <div className="bg-gray-100 border-b border-gray-300 px-3 py-1.5 flex items-center gap-2 text-xs font-mono text-gray-600">
                <span className="font-bold text-gray-800">C4</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500 italic">fx</span>
                <span className="bg-white px-2 py-0.5 rounded border border-gray-300 flex-1 text-gray-900">
                  =VLOOKUP(合同类型, DOA_Matrix!A:F, 3, FALSE)
                </span>
              </div>

              {/* Excel Spreadsheet Table */}
              <div className="flex-1 overflow-auto max-h-[560px]">
                <table className="w-full border-collapse text-xs select-text">
                  <thead>
                    <tr className="bg-gray-200 text-gray-700 text-center font-semibold">
                      <th className="w-10 border border-gray-300 bg-gray-200"></th>
                      <th className="border border-gray-300 px-3 py-1.5 w-16">A</th>
                      <th className="border border-gray-300 px-3 py-1.5 min-w-[140px]">B</th>
                      <th className="border border-gray-300 px-3 py-1.5 min-w-[160px]">C</th>
                      <th className="border border-gray-300 px-3 py-1.5 min-w-[120px]">D</th>
                      <th className="border border-gray-300 px-3 py-1.5 min-w-[130px]">E</th>
                      <th className="border border-gray-300 px-3 py-1.5 min-w-[120px]">F</th>
                      <th className="border border-gray-300 px-3 py-1.5 min-w-[110px]">G</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['1', '序号', '业务事项 / 合同类别', '审批门槛金额 (CNY)', '终审决策人', '法务会签要求', '生效有效期', '状态'],
                      ['2', '01', '软件销售标准框架合同', '≤ 500,000 元', '销售业务总监', '标准免审模板', '长期有效', '启用'],
                      ['3', '02', '定制软件集成开发合同', '500,000 ~ 2,000,000 元', '事业部总经理', '法务部专职审查', '至2029-03-16', '启用'],
                      ['4', '03', '软硬件一揽子总承包合同', '≥ 2,000,000 元', '执行总裁 / CEO', '法务总监 + 外部顾问', '长期有效', '启用'],
                      ['5', '04', '代理商年度分销合作协议', '按年保底提货额度', '营销VP', '合规风控部', '年度复核', '启用'],
                      ['6', '05', '云服务订阅SaaS采购', '≤ 200,000 元/年', '采购经理', '标准条款', '1年有效', '启用'],
                      ['7', '06', '海外出口交付合同', '≥ 100,000 USD', '进出口委员会', '涉外法务联合会签', '3年有效', '启用'],
                      ['8', '07', '战略生态联合创新协议', '不涉及资金往来', '战略投资部总经理', '法务部全量审查', '长期有效', '启用'],
                      ['9', '汇总', '合同审批分类共计 7 类', '涉及业务规模 1.2 亿元', '覆盖率 100%', '全部节点接入系统', '持续合规', '已受控'],
                    ].map((row, rIdx) => {
                      const isHeader = rIdx === 0;
                      const isTotal = rIdx === 8;
                      return (
                        <tr
                          key={rIdx}
                          className={`${
                            isHeader
                              ? 'bg-gray-100 font-bold text-gray-900'
                              : isTotal
                              ? 'bg-emerald-50 font-bold text-emerald-900'
                              : rIdx % 2 === 0
                              ? 'bg-gray-50/50 hover:bg-blue-50/40'
                              : 'bg-white hover:bg-blue-50/40'
                          }`}
                        >
                          <td className="border border-gray-300 bg-gray-100 text-center text-gray-500 font-mono text-[11px] p-1">
                            {rIdx + 1}
                          </td>
                          {row.slice(1).map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`border border-gray-300 p-2 text-justify ${
                                cIdx === 0 ? 'text-center font-mono' : ''
                              } ${cIdx === 2 ? 'font-mono' : ''} ${cIdx === 6 ? 'text-center font-medium' : ''}`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Excel Sheets Footer Tabs */}
              <div className="bg-gray-100 border-t border-gray-300 px-3 py-1 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  {[
                    { id: 'sheet1', label: '销售合同审批矩阵表' },
                    { id: 'sheet2', label: '岗位权限配额' },
                    { id: 'sheet3', label: '审批时效SLA' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSheet(s.id as any)}
                      className={`px-3 py-1 rounded-t border text-xs cursor-pointer font-medium transition-colors ${
                        activeSheet === s.id
                          ? 'bg-white text-[#107C41] border-gray-300 border-b-transparent shadow-xs'
                          : 'bg-gray-200 text-gray-600 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-gray-500">
                  共 3 个工作表 · 当前选中：{activeSheet === 'sheet1' ? '销售合同审批矩阵表' : activeSheet}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 4. PPT 演示文稿幻灯片在线预览 (.pptx / .ppt) */}
          {/* ===================================================================== */}
          {format === 'ppt' && (
            <div className="w-full max-w-5xl flex flex-col md:flex-row gap-4 items-stretch">
              {/* Left Slide Thumbnails */}
              <div className="w-full md:w-48 bg-white rounded-lg shadow-md border border-gray-300 p-2 space-y-2 shrink-0 max-h-[580px] overflow-y-auto">
                <div className="text-[11px] font-bold text-gray-500 px-1 uppercase tracking-wider">
                  幻灯片导航 ({totalPptSlides})
                </div>
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    onClick={() => setPptSlide(idx)}
                    className={`p-2 rounded border cursor-pointer transition-all ${
                      pptSlide === idx
                        ? 'border-[#D97706] bg-[#FFFBEB] ring-1 ring-[#D97706]'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                      <span>第 {idx} 页</span>
                      {pptSlide === idx && <Check className="w-3 h-3 text-[#D97706]" />}
                    </div>
                    <div className="aspect-video bg-white border border-gray-200 rounded flex flex-col items-center justify-center p-1 text-center">
                      <Presentation className="w-4 h-4 text-gray-400 mb-0.5" />
                      <span className="text-[9px] text-gray-600 font-medium truncate w-full">
                        {idx === 1
                          ? '制度封面'
                          : idx === 2
                          ? '背景与目标'
                          : idx === 3
                          ? '架构矩阵'
                          : idx === 4
                          ? '流程流转'
                          : '落地保障'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Presentation Slide Canvas */}
              <div className="flex-1 flex flex-col items-center justify-between">
                <div
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                  className="w-full aspect-video bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] text-white rounded-xl shadow-2xl p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden transition-transform duration-150"
                >
                  {/* Decorative background circle */}
                  <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#D97706]/10 blur-3xl pointer-events-none" />

                  {/* Slide Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                      <span className="text-xs uppercase tracking-widest text-gray-300 font-mono">
                        DFLOW ENTERPRISE ARCHITECTURE
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      制度编号：{doc.docNo || 'ZD-STR-2026-04'}
                    </div>
                  </div>

                  {/* Slide Content by Index */}
                  <div className="my-auto relative z-10 py-4">
                    {pptSlide === 1 && (
                      <div className="space-y-4">
                        <div className="inline-block px-3 py-1 rounded-full bg-[#D97706]/20 border border-[#D97706]/40 text-[#FBBF24] text-xs font-semibold">
                          企业流程治理体系 · 标准制度汇报
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                          {doc.label.replace(/\.[^.]+$/, '')}
                        </h1>
                        <p className="text-sm text-gray-300 max-w-xl leading-relaxed">
                          规范企业级流程架构顶层设计，明确分级管控规则与授权决策链条，加速组织数字化转型。
                        </p>
                        <div className="pt-4 flex items-center gap-4 text-xs text-gray-400">
                          <div>汇报人：{doc.ownerName || '流程管理部'}</div>
                          <div>•</div>
                          <div>有效期：{doc.validityPeriod || '长期有效'}</div>
                        </div>
                      </div>
                    )}

                    {pptSlide === 2 && (
                      <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">01. 制度建设背景与核心目标</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-[#FBBF24] font-bold text-sm mb-1">权责明晰</div>
                            <p className="text-xs text-gray-300">终结职责推诿，建立端到端RACI责任矩阵与门禁控制。</p>
                          </div>
                          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-[#38BDF8] font-bold text-sm mb-1">合规可控</div>
                            <p className="text-xs text-gray-300">将关键内控点（KCP）内嵌于流程流转之中，实现全过程留痕。</p>
                          </div>
                          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-[#34D399] font-bold text-sm mb-1">降本增效</div>
                            <p className="text-xs text-gray-300">消除非增值审批节点，压缩流转周期，提升协同效能。</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {pptSlide === 3 && (
                      <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">02. 架构设计与分层分级框架</h2>
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-16 font-mono font-bold text-[#FBBF24]">L1 业务域</span>
                            <span>战略规划、研发创新、市场营销、集成供应链、售后服务、财经支持</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-16 font-mono font-bold text-[#38BDF8]">L2 流程组</span>
                            <span>端到端业务主干流程，覆盖从线索到回款（LTC）、集成产品研发（IPD）</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-16 font-mono font-bold text-[#34D399]">L3 业务流</span>
                            <span>具体执行子流程，定义节点输入输出及标准操作规程（SOP）</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {pptSlide === 4 && (
                      <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">03. 数字化审批流转实施路径</h2>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          全面对接 OA、ERP 及 CRM 核心生产系统，所有审批工单在线发起，支持电子签名、移动端协同与异常预警。
                        </p>
                        <div className="p-3 rounded bg-white/10 border border-white/20 text-xs font-mono text-[#FBBF24]">
                          发起申请 ➔ 部门初核 ➔ 关键合规会签 (KCP) ➔ 权能终审 ➔ 电子用印归档
                        </div>
                      </div>
                    )}

                    {pptSlide === 5 && (
                      <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white">04. 制度执行保障与长效机制</h2>
                        <div className="space-y-2 text-xs text-gray-300">
                          <p>1. 设立年度例行合规复审机制，每年第一季度对本制度执行有效性进行专项评估。</p>
                          <p>2. 违规行为纳人员考核与部门KPI指标，保障制度生命力与权威性。</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Slide Footer */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-gray-400 relative z-10">
                    <div>全源数字科技有限公司 · 版权所有</div>
                    <div className="font-mono">
                      幻灯片 {pptSlide} / {totalPptSlides}
                    </div>
                  </div>
                </div>

                {/* Bottom Slide Switcher */}
                <div className="mt-4 flex items-center gap-4 bg-white rounded-md px-4 py-2 border border-gray-300 shadow-sm text-xs">
                  <button
                    type="button"
                    disabled={pptSlide <= 1}
                    onClick={() => setPptSlide((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>上一页</span>
                  </button>

                  <span className="font-semibold text-gray-800">
                    第 {pptSlide} 页 / 共 {totalPptSlides} 页
                  </span>

                  <button
                    type="button"
                    disabled={pptSlide >= totalPptSlides}
                    onClick={() => setPptSlide((p) => Math.min(totalPptSlides, p + 1))}
                    className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <span>下一页</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
