import React, { useState } from 'react';
import { X, Download, Shield, FileText, CheckCircle2 } from 'lucide-react';
import { OnlineDocumentPreviewModal, downloadDocumentFile } from './OnlineDocumentPreviewModal';

export interface FileAttachment {
  id: string;
  name: string;
  size?: string;
  type?: string;
  url?: string;
  isSysDoc?: boolean;
}

export interface NodeSummaryDrawerProps {
  open: boolean;
  cell: any | null;
  onClose: () => void;
  showToast?: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

function parseArrayField(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((v) => (typeof v === 'object' ? v.name || v.label || v.id || String(v) : String(v)));
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((v) => (typeof v === 'object' ? v.name || v.label || v.id || String(v) : String(v)));
        }
      } catch {}
    }
    return trimmed ? [trimmed] : [];
  }
  return [];
}

function parseFileList(raw: any, defaultNames: string[] = []): FileAttachment[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((item, idx) => {
      if (typeof item === 'string') {
        return {
          id: `file_${idx}`,
          name: item,
          size: '1.2 MB',
          type: item.endsWith('.xlsx') ? 'excel' : item.endsWith('.pdf') ? 'pdf' : 'word',
        };
      }
      return {
        id: item.id || `file_${idx}`,
        name: item.name || `附件_${idx + 1}`,
        size: item.size || '1.2 MB',
        type: item.type || (item.name?.endsWith('.xlsx') ? 'excel' : item.name?.endsWith('.pdf') ? 'pdf' : 'word'),
        url: item.url,
        isSysDoc: !!item.isSysDoc,
      };
    });
  }

  // Fallback to parsed string if JSON
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parseFileList(parsed, defaultNames);
      }
    } catch {}
  }

  if (defaultNames.length > 0) {
    return defaultNames.map((name, idx) => ({
      id: `default_${idx}`,
      name,
      size: name.endsWith('.xlsx') ? '640 KB' : '1.8 MB',
      type: name.endsWith('.xlsx') ? 'excel' : name.endsWith('.pdf') ? 'pdf' : 'word',
    }));
  }

  return [];
}

export const NodeSummaryDrawer: React.FC<NodeSummaryDrawerProps> = ({
  open,
  cell,
  onClose,
  showToast,
}) => {
  const [rightsModalOpen, setRightsModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  if (!open || !cell) return null;

  const a = cell.attrs || {};
  const nodeName = a.desc || a.name || cell.value || '未命名活动';

  // 1. 负责角色
  const roles = parseArrayField(a.roleName || a.roles || a.role);
  const roleDisplay = roles.length > 0 ? roles.join(' , ') : (a.roleName || a.role || '-');

  // 2. 节点说明
  const descDisplay = a.desc || a.name || cell.value || '-';

  // 3. 输入说明 & 附件
  const inputDesc = a.in || a.inputDesc || '采购申请单';
  // If no file list configured, provide default matching enterprise sample
  const defaultInFiles = inputDesc.includes('采购') || nodeName.includes('评审') || nodeName.includes('采购')
    ? ['研发项目评审表.docx']
    : ['业务输入规范说明.docx'];
  const inFiles = parseFileList(a.inFileList, a.inFileList ? [] : defaultInFiles);

  // 4. 输出说明 & 附件
  const outputDesc = a.out || a.outputDesc || 'ddddd';
  const defaultOutFiles = outputDesc.includes('物料') || nodeName.includes('评审') || nodeName.includes('采购')
    ? ['物料分类及属性.xlsx']
    : ['交付物交付记录表.xlsx'];
  const outFiles = parseFileList(a.outFileList, a.outFileList ? [] : defaultOutFiles);

  // 5. 执行系统
  const systems = parseArrayField(a.system || a.execute);
  const systemDisplay = systems.length > 0 ? systems.join(' , ') : (a.system || 'MES , APS');

  // 6. KCP & 描述
  const isKcp = a.kcp === true || a.kcp === 'true';
  const kcpDesc = a.kcpdesc || a.kcpDesc || a.kcpRule || (isKcp ? '必须严格完成质量/合规门禁检查，未通过禁止流转' : '-');

  // 7. KPI & 描述
  const hasKpi = !!(a.kpi || a.kpiTarget) || a.kpiTarget !== '-';
  const kpiDesc = a.kpidesc || a.kpiDesc || a.kpi || (hasKpi ? '部门KPI' : '-');

  // 8. 权责 & RACI
  const rightsList = parseArrayField(a.rights);
  const raciR = parseArrayField(a.raciR);
  const raciA = a.raciA ? (typeof a.raciA === 'string' ? a.raciA : String(a.raciA)) : '';
  const raciC = parseArrayField(a.raciC);
  const raciI = parseArrayField(a.raciI);

  // 9. 处理时限
  const target = a.target !== undefined && a.target !== null && String(a.target) !== '0' ? String(a.target) : '2';
  const timeUnit = a.timeType || '天';
  const timeLimitDisplay = `${target} ${timeUnit}`;

  // 10. 节点备注
  const remarkDisplay = a.remark || a.note || '备注要求';

  const handleDownload = (file: FileAttachment, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadDocumentFile(file as any);
    showToast?.(`已触发下载附件【${file.name}】`, 'success');
  };

  const handlePreview = (file: FileAttachment, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewDoc(file);
  };

  return (
    <>
      {/* Slide-over Drawer corresponding exactly to image_26800346.png */}
      <div className="fixed inset-y-0 right-0 z-50 flex max-w-full pl-10 pointer-events-none">
        <div className="w-[360px] max-w-md bg-white shadow-2xl border-l border-[#e4e7ed] pointer-events-auto flex flex-col h-full animate-in slide-in-from-right duration-200 select-none">
          {/* Header matching image_26800346.png: Blue bar + "活动" + Close button */}
          <div className="px-5 py-4 border-b border-[#f0f2f5] flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 bg-[#1677ff] rounded-xs inline-block" />
              <h3 className="font-medium text-[15px] text-[#1f2733] tracking-tight">活动</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded hover:bg-[#f0f2f5] flex items-center justify-center text-[#909399] hover:text-[#303133] cursor-pointer transition-colors"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content - Vertical 2-Column Key-Value List */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 text-[13px] bg-white">
            {/* 1. 负责角色 */}
            <div className="flex items-start gap-3">
              <div className="w-[76px] shrink-0 text-right text-[#303133] font-medium pt-0.5">
                负责角色
              </div>
              <div className="flex-1 min-w-0 text-[#303133] pt-0.5 font-normal">
                {roleDisplay || '-'}
              </div>
            </div>

            {/* 2. 节点说明 */}
            <div className="flex items-start gap-3">
              <div className="w-[76px] shrink-0 text-right text-[#303133] font-medium pt-0.5">
                节点说明
              </div>
              <div className="flex-1 min-w-0 text-[#303133] pt-0.5 leading-relaxed font-normal">
                {descDisplay}
              </div>
            </div>

            {/* 3. 输入说明 */}
            <div className="flex items-start gap-3">
              <div className="w-[76px] shrink-0 text-right text-[#303133] font-medium pt-0.5">
                输入说明
              </div>
              <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                <div className="text-[#303133] leading-relaxed">{inputDesc}</div>
                {inFiles.length > 0 && (
                  <div className="space-y-1 pt-0.5">
                    {inFiles.map((f) => (
                      <div key={f.id} className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handlePreview(f, e)}
                          className="text-[#1677ff] hover:underline flex items-center gap-1 text-[13px] cursor-pointer text-left truncate"
                          title="点击在线预览"
                        >
                          <span className="truncate">{f.name}</span>
                          <span className="text-[12px] font-sans shrink-0">↓</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDownload(f, e)}
                          className="text-[#909399] hover:text-[#1677ff] p-0.5 cursor-pointer"
                          title="下载文件"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4. 输出说明 */}
            <div className="flex items-start gap-3">
              <div className="w-[76px] shrink-0 text-right text-[#303133] font-medium pt-0.5">
                输出说明
              </div>
              <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                <div className="text-[#303133] leading-relaxed">{outputDesc}</div>
                {outFiles.length > 0 && (
                  <div className="space-y-1 pt-0.5">
                    {outFiles.map((f) => (
                      <div key={f.id} className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handlePreview(f, e)}
                          className="text-[#1677ff] hover:underline flex items-center gap-1 text-[13px] cursor-pointer text-left truncate"
                          title="点击在线预览"
                        >
                          <span className="truncate">{f.name}</span>
                          <span className="text-[12px] font-sans shrink-0">↓</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDownload(f, e)}
                          className="text-[#909399] hover:text-[#1677ff] p-0.5 cursor-pointer"
                          title="下载文件"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 5. 执行系统 */}
            <div className="flex items-start gap-3">
              <div className="w-[76px] shrink-0 text-right text-[#303133] font-medium pt-0.5">
                执行系统
              </div>
              <div className="flex-1 min-w-0 text-[#303133] pt-0.5">
                {systemDisplay}
              </div>
            </div>

            {/* 6. KCP */}
            <div className="flex items-start gap-3">
              <div className="w-[76px] shrink-0 text-right text-[#303133] font-medium pt-0.5">
                KCP
              </div>
              <div className="flex-1 min-w-0 text-[#303133] pt-0.5">
                {isKcp ? '是' : '否'}
              </div>
            </div>

            {/* 7. KCP描述 */}
            <div className="flex items-start gap-3">
              <div className="w-[76px] shrink-0 text-right text-[#303133] font-medium pt-0.5">
                KCP描述
              </div>
              <div className="flex-1 min-w-0 text-[#303133] pt-0.5 leading-relaxed">
                {kcpDesc}
              </div>
            </div>

            {/* 8. KPI */}
            <div className="flex items-start gap-3">
              <div className="w-[76px] shrink-0 text-right text-[#303133] font-medium pt-0.5">
                KPI
              </div>
              <div className="flex-1 min-w-0 text-[#303133] pt-0.5">
                {hasKpi ? '有' : '无'}
              </div>
            </div>

            {/* 9. KPI描述 */}
            <div className="flex items-start gap-3">
              <div className="w-[76px] shrink-0 text-right text-[#303133] font-medium pt-0.5">
                KPI描述
              </div>
              <div className="flex-1 min-w-0 text-[#303133] pt-0.5 leading-relaxed">
                {kpiDesc}
              </div>
            </div>

            {/* 10. 权责 */}
            <div className="flex items-start gap-3">
              <div className="w-[76px] shrink-0 text-right text-[#303133] font-medium pt-0.5">
                权责
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <button
                  type="button"
                  onClick={() => setRightsModalOpen(true)}
                  className="text-[#1677ff] hover:underline cursor-pointer"
                >
                  查看详情
                </button>
              </div>
            </div>

            {/* 11. 处理时限 */}
            <div className="flex items-start gap-3">
              <div className="w-[76px] shrink-0 text-right text-[#303133] font-medium pt-0.5">
                处理时限
              </div>
              <div className="flex-1 min-w-0 text-[#303133] pt-0.5">
                {timeLimitDisplay}
              </div>
            </div>

            {/* 12. 节点备注 */}
            <div className="flex items-start gap-3">
              <div className="w-[76px] shrink-0 text-right text-[#303133] font-medium pt-0.5">
                节点备注
              </div>
              <div className="flex-1 min-w-0 text-[#303133] pt-0.5 leading-relaxed">
                {remarkDisplay}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 权责详情弹窗 */}
      {rightsModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#dcdfe6] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafafa]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#1677ff]" />
                <span className="font-bold text-sm text-[#1f2733]">
                  节点权责与 RACI 详情 · {nodeName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRightsModalOpen(false)}
                className="w-6 h-6 rounded hover:bg-[#ebeef5] flex items-center justify-center text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* 权责列表 */}
              <div>
                <h5 className="font-bold text-xs text-[#303133] mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-[#e6a23c] rounded-xs inline-block" />
                  <span>授权事项与权限清单 (DoA)</span>
                </h5>
                {rightsList.length > 0 ? (
                  <div className="space-y-1.5">
                    {rightsList.map((rt, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 bg-[#fdf6ec]/60 border border-[#faecd8] rounded-lg text-xs text-[#b88230] flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#e6a23c] shrink-0" />
                        <span>{rt}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-[#f8fafc] rounded-lg text-[#909399] text-xs">
                    该节点暂未配置独立审批授权项，执行通用标准权责
                  </div>
                )}
              </div>

              {/* RACI 矩阵 */}
              <div>
                <h5 className="font-bold text-xs text-[#303133] mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-[#7c3aed] rounded-xs inline-block" />
                  <span>RACI 岗位责任矩阵</span>
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                    <span className="font-bold text-[#7c3aed]">R (Responsible · 主责):</span>
                    <p className="mt-1 text-[#303133]">{raciR.join(' , ') || roleDisplay || '负责执行人'}</p>
                  </div>
                  <div className="p-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                    <span className="font-bold text-[#1677ff]">A (Accountable · 审批):</span>
                    <p className="mt-1 text-[#303133]">{raciA || '部门负责人 / 终审人'}</p>
                  </div>
                  <div className="p-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                    <span className="font-bold text-[#e6a23c]">C (Consulted · 会签):</span>
                    <p className="mt-1 text-[#303133]">{raciC.join(' , ') || '相关业务专家'}</p>
                  </div>
                  <div className="p-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                    <span className="font-bold text-[#67c23a]">I (Informed · 知会):</span>
                    <p className="mt-1 text-[#303133]">{raciI.join(' , ') || '下游协同岗位'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#ebeef5] bg-[#fafafa] flex justify-end">
              <button
                type="button"
                onClick={() => setRightsModalOpen(false)}
                className="h-7 px-4 rounded bg-[#1677ff] text-white text-xs font-medium cursor-pointer hover:bg-[#409eff] transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 在线文档预览弹窗 */}
      {previewDoc && (
        <OnlineDocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
          showToast={showToast || (() => {})}
        />
      )}
    </>
  );
};
