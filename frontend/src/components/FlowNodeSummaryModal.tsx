import React, { useState } from 'react';
import { X, Download, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { OnlineDocumentPreviewModal, DocumentItem } from './OnlineDocumentPreviewModal';

export interface FileAttachmentItem {
  id: string;
  name: string;
  size?: string;
  type?: string;
  isSysDoc?: boolean;
  docNo?: string;
  url?: string;
  uploadTime?: string;
}

export interface FlowNodeSummaryModalProps {
  open: boolean;
  onClose: () => void;
  cell: any | null;
  flowTitle?: string;
  showToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const FlowNodeSummaryModal: React.FC<FlowNodeSummaryModalProps> = ({
  open,
  onClose,
  cell,
  flowTitle = '',
  showToast,
}) => {
  const [rightsModalOpen, setRightsModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  if (!open || !cell) return null;

  const a = cell.attrs || {};
  const nodeLabel = cell.value || a.name || a.label || '';

  // 1. 负责角色
  const roleName =
    a.roleName ||
    a.role ||
    a.roles ||
    (Array.isArray(a.raciR) && a.raciR.length > 0 ? a.raciR.join('、') : '');

  // 2. 节点说明
  const nodeDesc = a.desc || a.name || nodeLabel || '执行采购申请';

  // 3. 输入说明
  const inputDesc =
    a.in ||
    a.inputDesc ||
    (nodeDesc.includes('采购') ? '采购申请单' : nodeDesc.includes('评审') ? '技术方案规格书与评审申请' : '业务前置输入材料');

  // 输入附件
  let inFileList: FileAttachmentItem[] = [];
  if (Array.isArray(a.inFileList) && a.inFileList.length > 0) {
    inFileList = a.inFileList;
  } else {
    // 默认展示真实交付物模版，符合业务设计
    inFileList = [
      {
        id: 'in_doc_1',
        name: nodeDesc.includes('采购') ? '研发项目评审表.docx' : `${nodeLabel || '业务'}前置评审表.docx`,
        size: '280 KB',
        type: 'word',
        isSysDoc: true,
      },
    ];
  }

  // 4. 输出说明
  const outputDesc =
    a.out ||
    a.outputDesc ||
    (nodeDesc.includes('采购') ? 'ddddd' : nodeDesc.includes('评审') ? '技术评审决议书与KCP检查表' : '业务完成单据与成果交付');

  // 输出附件
  let outFileList: FileAttachmentItem[] = [];
  if (Array.isArray(a.outFileList) && a.outFileList.length > 0) {
    outFileList = a.outFileList;
  } else {
    outFileList = [
      {
        id: 'out_doc_1',
        name: nodeDesc.includes('采购') ? '物料分类及属性.xlsx' : `${nodeLabel || '业务'}交付成果及属性.xlsx`,
        size: '190 KB',
        type: 'excel',
        isSysDoc: true,
      },
    ];
  }

  // 5. 执行系统
  const executionSystem =
    a.system ||
    a.execute ||
    (nodeDesc.includes('采购') ? 'MES , APS' : 'PLM 研发生命周期管理系统');

  // 6. KCP
  const isKcp =
    a.kcp === true ||
    a.kcp === 'true' ||
    String(a.kcp).includes('关键') ||
    nodeLabel.includes('评审') ||
    nodeLabel.includes('裁决');
  const kcpText = isKcp ? '是' : '否';

  // 7. KCP描述
  const kcpDesc = a.kcpDesc || a.kpidesc || (isKcp ? (a.kcpRule || '关键质量与合规把关点，未经评审决议禁止流转') : '');

  // 8. KPI
  const hasKpi = !!(a.kpi || a.kpiTarget) || a.hasKpi !== false;
  const kpiText = hasKpi ? '有' : '无';

  // 9. KPI描述
  const kpiDesc = a.kpiDesc || a.kpiTarget || (hasKpi ? '部门KPI' : '');

  // 10. 权责 & RACI
  const rightsList: string[] = Array.isArray(a.rights)
    ? a.rights
    : typeof a.rights === 'string' && a.rights
    ? [a.rights]
    : ['分级业务审批与技术把关权', '方案决议与流转签署权'];
  const raciR = Array.isArray(a.raciR) && a.raciR.length > 0 ? a.raciR : [roleName || '研发工程师'];
  const raciA = a.raciA || '评审委员会 / 部门主管';
  const raciC = Array.isArray(a.raciC) && a.raciC.length > 0 ? a.raciC : ['技术专家', '质量合规主管'];
  const raciI = Array.isArray(a.raciI) && a.raciI.length > 0 ? a.raciI : ['项目经理', '运营负责人'];

  // 11. 处理时限
  const targetNum = a.target !== undefined && a.target !== null ? a.target : (a.duration || '2');
  const timeUnit = a.timeType || '天';
  const durationText = `${targetNum} ${timeUnit}`;

  // 12. 节点备注
  const remarkText = a.remark || a.note || a.mark || '备注要求';

  // 处理附件点击（在线查阅与下载）
  const handleFileClick = (file: FileAttachmentItem) => {
    setPreviewDoc({
      label: file.name,
      docNo: file.docNo || 'DOC-ATT-' + file.id.slice(-4),
      category: '流程过程交付物',
      versionNo: 'V1.0',
      fileSize: file.size || '320 KB',
      ownerName: roleName || '流程责任人',
      status: '生效中',
      publishTime: file.uploadTime || new Date().toISOString().slice(0, 10),
    });
    showToast?.(`正在查阅附件：${file.name}`, 'info');
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl shadow-2xl border border-[#dcdfe6] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 relative text-[#303133]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header matching image_09cc046b.png */}
          <div className="px-8 pt-6 pb-4 flex items-center justify-between border-b border-[#f0f2f5]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4.5 bg-[#1677ff] rounded-xs inline-block" />
              <h3 className="font-bold text-[17px] text-[#1f2733] tracking-tight">活动</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[#f2f4f7] flex items-center justify-center text-[#909399] hover:text-[#303133] cursor-pointer transition-colors"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content matching image_09cc046b.png */}
          <div className="px-8 py-6 max-h-[78vh] overflow-y-auto space-y-4 text-[13.5px]">
            {/* 负责角色 */}
            <div className="flex items-baseline">
              <div className="w-24 text-right pr-6 font-medium text-[#606266] shrink-0 select-none">
                负责角色
              </div>
              <div className="flex-1 text-[#1f2733] font-normal min-h-[20px]">
                {roleName || ''}
              </div>
            </div>

            {/* 节点说明 */}
            <div className="flex items-baseline">
              <div className="w-24 text-right pr-6 font-medium text-[#606266] shrink-0 select-none">
                节点说明
              </div>
              <div className="flex-1 text-[#1f2733] leading-relaxed">
                {nodeDesc}
              </div>
            </div>

            {/* 输入说明 */}
            <div className="flex items-start">
              <div className="w-24 text-right pr-6 font-medium text-[#606266] shrink-0 select-none pt-0.5">
                输入说明
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="text-[#1f2733]">{inputDesc}</div>
                {inFileList.length > 0 && (
                  <div className="space-y-1 pt-0.5">
                    {inFileList.map((file, idx) => (
                      <button
                        key={file.id || idx}
                        type="button"
                        onClick={() => handleFileClick(file)}
                        className="group text-[#1677ff] hover:text-[#409eff] hover:underline flex items-center gap-1 cursor-pointer text-[13px] font-normal text-left"
                      >
                        <span className="truncate max-w-md">{file.name}</span>
                        <Download className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-y-0.5 text-[#1677ff]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 输出说明 */}
            <div className="flex items-start">
              <div className="w-24 text-right pr-6 font-medium text-[#606266] shrink-0 select-none pt-0.5">
                输出说明
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="text-[#1f2733]">{outputDesc}</div>
                {outFileList.length > 0 && (
                  <div className="space-y-1 pt-0.5">
                    {outFileList.map((file, idx) => (
                      <button
                        key={file.id || idx}
                        type="button"
                        onClick={() => handleFileClick(file)}
                        className="group text-[#1677ff] hover:text-[#409eff] hover:underline flex items-center gap-1 cursor-pointer text-[13px] font-normal text-left"
                      >
                        <span className="truncate max-w-md">{file.name}</span>
                        <Download className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-y-0.5 text-[#1677ff]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 执行系统 */}
            <div className="flex items-baseline">
              <div className="w-24 text-right pr-6 font-medium text-[#606266] shrink-0 select-none">
                执行系统
              </div>
              <div className="flex-1 text-[#1f2733] font-normal">
                {executionSystem}
              </div>
            </div>

            {/* KCP */}
            <div className="flex items-baseline">
              <div className="w-24 text-right pr-6 font-medium text-[#606266] shrink-0 select-none">
                KCP
              </div>
              <div className="flex-1 text-[#1f2733] font-normal">
                {kcpText}
              </div>
            </div>

            {/* KCP描述 */}
            <div className="flex items-baseline">
              <div className="w-24 text-right pr-6 font-medium text-[#606266] shrink-0 select-none">
                KCP描述
              </div>
              <div className="flex-1 text-[#1f2733] min-h-[20px]">
                {kcpDesc || ''}
              </div>
            </div>

            {/* KPI */}
            <div className="flex items-baseline">
              <div className="w-24 text-right pr-6 font-medium text-[#606266] shrink-0 select-none">
                KPI
              </div>
              <div className="flex-1 text-[#1f2733] font-normal">
                {kpiText}
              </div>
            </div>

            {/* KPI描述 */}
            <div className="flex items-baseline">
              <div className="w-24 text-right pr-6 font-medium text-[#606266] shrink-0 select-none">
                KPI描述
              </div>
              <div className="flex-1 text-[#1f2733]">
                {kpiDesc || ''}
              </div>
            </div>

            {/* 权责 */}
            <div className="flex items-baseline">
              <div className="w-24 text-right pr-6 font-medium text-[#606266] shrink-0 select-none">
                权责
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => setRightsModalOpen(true)}
                  className="text-[#1677ff] hover:text-[#409eff] hover:underline cursor-pointer font-medium inline-flex items-center gap-1"
                >
                  <span>查看详情</span>
                </button>
              </div>
            </div>

            {/* 处理时限 */}
            <div className="flex items-baseline">
              <div className="w-24 text-right pr-6 font-medium text-[#606266] shrink-0 select-none">
                处理时限
              </div>
              <div className="flex-1 text-[#1f2733] font-normal">
                {durationText}
              </div>
            </div>

            {/* 节点备注 */}
            <div className="flex items-baseline">
              <div className="w-24 text-right pr-6 font-medium text-[#606266] shrink-0 select-none">
                节点备注
              </div>
              <div className="flex-1 text-[#1f2733]">
                {remarkText}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 权责与 RACI 详情子弹窗 */}
      {rightsModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in duration-150"
          onClick={() => setRightsModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-[#dcdfe6] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafafa]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1677ff]" />
                <span className="font-bold text-sm text-[#1f2733]">
                  节点权责与 RACI 矩阵详情 · {nodeLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRightsModalOpen(false)}
                className="w-7 h-7 rounded hover:bg-[#f0f2f5] flex items-center justify-center text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* RACI Matrix */}
              <div className="space-y-2">
                <div className="font-semibold text-xs text-[#303133]">
                  RACI 责任分配矩阵
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#f0f9eb] border border-[#e1f3d8] p-2.5 rounded-lg">
                    <span className="font-bold text-[#67c23a] block mb-0.5">R (主责/负责执行)</span>
                    <span className="text-[#303133]">{raciR.join('、') || '研发工程师'}</span>
                  </div>
                  <div className="bg-[#ecf5ff] border border-[#d9ecff] p-2.5 rounded-lg">
                    <span className="font-bold text-[#409eff] block mb-0.5">A (审批/终责裁决)</span>
                    <span className="text-[#303133]">{raciA || '评审委员会'}</span>
                  </div>
                  <div className="bg-[#fdf6ec] border border-[#faecd8] p-2.5 rounded-lg">
                    <span className="font-bold text-[#e6a23c] block mb-0.5">C (咨询/专家会签)</span>
                    <span className="text-[#303133]">{raciC.join('、') || '技术专家'}</span>
                  </div>
                  <div className="bg-[#f4f4f5] border border-[#e9e9eb] p-2.5 rounded-lg">
                    <span className="font-bold text-[#909399] block mb-0.5">I (知会/抄送跟进)</span>
                    <span className="text-[#303133]">{raciI.join('、') || '项目经理'}</span>
                  </div>
                </div>
              </div>

              {/* DoA / 业务权限清单 */}
              <div className="space-y-2 pt-2 border-t border-[#f0f2f5]">
                <div className="font-semibold text-xs text-[#303133]">
                  授权审批与门禁控制 (DoA)
                </div>
                <div className="space-y-1.5">
                  {rightsList.map((r, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 rounded bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#67c23a]" />
                        <span className="font-medium text-[#1f2733]">{r}</span>
                      </div>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-[#1677ff] font-medium">
                        门禁校验
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex justify-end">
              <button
                type="button"
                onClick={() => setRightsModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#1677ff] text-white text-xs font-medium hover:bg-[#409eff] cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 在线文件预览弹窗 */}
      {previewDoc && (
        <OnlineDocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
          showToast={showToast || (() => {})}
          allowDownload={true}
        />
      )}
    </>
  );
};
