import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Building2,
  CheckCircle2,
  ChevronDown,
  Trash2,
  Paperclip,
  Eye,
  Table2,
  Shield,
  Search,
  Users,
} from 'lucide-react';
import { PersonSelectModal } from './PersonSelectModal';
import { RoleLibrarySelectModal, ProcessRoleItem } from './RoleLibrarySelectModal';
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

export interface NodePropertiesDrawerProps {
  open: boolean;
  cell: any | null;
  flowTitle: string;
  onClose: () => void;
  onSave: (cellId: string, attrs: Record<string, any>) => void;
  onOpenRaciModal?: () => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

// 预设高频业务流程负责角色
const PRESET_ROLES = [
  '研发工程师',
  '流程架构师',
  '高级流程经理',
  '系统架构师',
  '产品经理',
  '测试工程师',
  '质量合规主管',
  '权责主管',
  '电气工程师',
  '结构设计工程师',
  '项目推进主管',
  '评审委员会',
  '运营负责人',
  '供应链经理',
];

// 预设常见企业执行系统
const EXECUTION_SYSTEMS = [
  'PLM 研发生命周期管理系统',
  'ERP 企业资源计划系统',
  'CRM 客户关系管理系统',
  'OA 协同办公系统',
  'MES 制造执行系统',
  'SRM 供应商关系管理系统',
  'Jira 研发任务协同系统',
  'HRMS 人力资源管理系统',
  'WMS 智能仓储管理系统',
  '手工线下流转 (无系统)',
];

// 内置企业标准制度文件库
const PRESET_SYS_DOCS: FileAttachmentItem[] = [
  {
    id: 'doc_01',
    docNo: 'QING-SYS-2024-001',
    name: 'IPD概念阶段立项与决策评审管理制度.pdf',
    size: '1.8 MB',
    type: 'pdf',
    isSysDoc: true,
    uploadTime: '2024-03-12',
  },
  {
    id: 'doc_02',
    docNo: 'QING-SYS-2024-003',
    name: '研发技术评审(TR)与系统架构决策规程.pdf',
    size: '2.4 MB',
    type: 'pdf',
    isSysDoc: true,
    uploadTime: '2024-04-18',
  },
  {
    id: 'doc_03',
    docNo: 'QING-SYS-2024-007',
    name: '企业权责分配(DOA)与销售合同分级审批制度.docx',
    size: '860 KB',
    type: 'word',
    isSysDoc: true,
    uploadTime: '2024-05-06',
  },
  {
    id: 'doc_04',
    docNo: 'QING-SYS-2024-012',
    name: '关键控制点(KCP)质量内控与交付物合规验收标准.pdf',
    size: '3.1 MB',
    type: 'pdf',
    isSysDoc: true,
    uploadTime: '2024-06-20',
  },
  {
    id: 'doc_05',
    docNo: 'QING-SYS-2024-016',
    name: '供应链供应商准入与采购寻源全流程制度.xlsx',
    size: '640 KB',
    type: 'excel',
    isSysDoc: true,
    uploadTime: '2024-07-02',
  },
  {
    id: 'doc_06',
    docNo: 'QING-SYS-2024-021',
    name: '流程资产发布与版本迭代管理操作指引.pdf',
    size: '1.2 MB',
    type: 'pdf',
    isSysDoc: true,
    uploadTime: '2024-08-15',
  },
];

export const NodePropertiesDrawer: React.FC<NodePropertiesDrawerProps> = ({
  open,
  cell,
  flowTitle,
  onClose,
  onSave,
  onOpenRaciModal,
  showToast,
}) => {
  // Form States corresponding exactly to image_28312ca2.png
  const [roleName, setRoleName] = useState('');
  const [nodeDesc, setNodeDesc] = useState('');
  const [inputDesc, setInputDesc] = useState('');
  const [inFileList, setInFileList] = useState<FileAttachmentItem[]>([]);
  const [outputDesc, setOutputDesc] = useState('');
  const [outFileList, setOutFileList] = useState<FileAttachmentItem[]>([]);
  const [system, setSystem] = useState('');
  const [isKcp, setIsKcp] = useState(false);
  const [kpiTarget, setKpiTarget] = useState('');
  const [kpiDesc, setKpiDesc] = useState('');
  const [rights, setRights] = useState<string[]>([]);
  const [raciR, setRaciR] = useState<string[]>([]);
  const [raciA, setRaciA] = useState<string>('');
  const [raciC, setRaciC] = useState<string[]>([]);
  const [raciI, setRaciI] = useState<string[]>([]);
  const [timeTarget, setTimeTarget] = useState('');
  const [timeUnit, setTimeUnit] = useState('天');
  const [nodeRemark, setNodeRemark] = useState('');

  // UI Interactive States
  const [roleSelectOpen, setRoleSelectOpen] = useState(false);
  const [roleLibraryModalOpen, setRoleLibraryModalOpen] = useState(false);
  const [libraryRoles, setLibraryRoles] = useState<ProcessRoleItem[]>([]);
  const [systemSelectOpen, setSystemSelectOpen] = useState(false);
  const [orgPersonModalOpen, setOrgPersonModalOpen] = useState(false);
  const [sysDocModalMode, setSysDocModalMode] = useState<'in' | 'out' | null>(null);
  const [sysDocSearch, setSysDocSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [raciPopoverOpen, setRaciPopoverOpen] = useState(false);

  // Hidden file input refs
  const inFileInputRef = useRef<HTMLInputElement | null>(null);
  const outFileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch role library roles on mount
  useEffect(() => {
    fetch('/api/build/roles?pageSize=100')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && Array.isArray(json.rows) && json.rows.length > 0) {
          setLibraryRoles(json.rows);
        }
      })
      .catch(() => {});
  }, []);

  // Sync state whenever cell changes
  useEffect(() => {
    if (!cell) return;
    const a = cell.attrs || {};
    setRoleName(a.roleName || a.role || '');
    setNodeDesc(a.desc || a.name || cell.value || '');
    setInputDesc(a.in || a.inputDesc || '');
    setInFileList(Array.isArray(a.inFileList) ? a.inFileList : []);
    setOutputDesc(a.out || a.outputDesc || '');
    setOutFileList(Array.isArray(a.outFileList) ? a.outFileList : []);
    setSystem(a.system || '');
    setIsKcp(a.kcp === true || a.kcp === 'true');
    setKpiTarget(a.kpiTarget || a.kpi || '');
    setKpiDesc(a.kpiDesc || '');
    setRights(Array.isArray(a.rights) ? a.rights : []);
    setRaciR(Array.isArray(a.raciR) ? a.raciR : []);
    setRaciA(typeof a.raciA === 'string' ? a.raciA : Array.isArray(a.raciA) ? a.raciA[0] || '' : '');
    setRaciC(Array.isArray(a.raciC) ? a.raciC : []);
    setRaciI(Array.isArray(a.raciI) ? a.raciI : []);
    setTimeTarget(a.target !== undefined && a.target !== null ? String(a.target) : '');
    setTimeUnit(a.timeType || '天');
    setNodeRemark(a.remark || a.note || '');
  }, [cell]);

  if (!open || !cell) return null;

  // Handle Local File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, mode: 'in' | 'out') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newItems: FileAttachmentItem[] = Array.from(files).map((f) => ({
      id: 'att_' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: f.name,
      size: `${Math.round(f.size / 1024)} KB`,
      type: f.name.endsWith('.pdf') ? 'pdf' : f.name.endsWith('.xlsx') ? 'excel' : 'word',
      isSysDoc: false,
      uploadTime: new Date().toISOString().slice(0, 10),
    }));

    if (mode === 'in') {
      setInFileList([...inFileList, ...newItems]);
      showToast(`已成功添加 ${newItems.length} 个输入附件`, 'success');
    } else {
      setOutFileList([...outFileList, ...newItems]);
      showToast(`已成功添加 ${newItems.length} 个输出附件`, 'success');
    }
    e.target.value = '';
  };

  // Handle Save
  const handleSave = () => {
    if (!cell) return;
    const updatedAttrs: Record<string, any> = {
      ...cell.attrs,
      roleName: roleName.trim(),
      name: nodeDesc.trim() || cell.value,
      desc: nodeDesc.trim(),
      in: inputDesc.trim(),
      inFileList,
      out: outputDesc.trim(),
      outFileList,
      system: system.trim(),
      kcp: isKcp,
      kpiTarget: kpiTarget.trim(),
      kpiDesc: kpiDesc.trim(),
      rights,
      raciR,
      raciA,
      raciC,
      raciI,
      target: timeTarget.trim() ? Number(timeTarget.trim()) : 0,
      timeType: timeUnit,
      remark: nodeRemark.trim(),
    };

    onSave(cell.id, updatedAttrs);
    showToast('流程活动节点属性已保存并同步至画布', 'success');
    onClose();
  };

  return (
    <>
      {/* Right Drawer Slide-over: Compact & Professional 2-Column Form matching image_28312ca2.png */}
      <aside className="w-[440px] bg-white border-l border-[#e4e7ed] flex flex-col h-full shrink-0 z-30 shadow-2xl text-xs relative select-none animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-5 py-3.5 border-b border-[#e4e7ed] flex items-center justify-between shrink-0 bg-white">
          <h3 className="font-bold text-[15px] text-[#1f2733] tracking-tight">
            编辑流程活动节点
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-[#f0f2f5] flex items-center justify-center text-[#909399] hover:text-[#303133] cursor-pointer transition-colors"
            title="关闭属性面板"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body - 2-Column Compact Grid */}
        <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3.5">
          {/* Row 1: 负责角色 */}
          <div className="flex items-center gap-3">
            <div className="w-[76px] shrink-0 text-right text-xs text-[#303133] font-medium select-none">
              负责角色
            </div>
            <div className="flex-1 min-w-0 relative">
              <div
                onClick={() => setRoleSelectOpen(!roleSelectOpen)}
                className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] hover:border-[#409eff] bg-white flex items-center justify-between cursor-pointer text-xs transition-colors"
              >
                <span className={roleName ? 'text-[#303133] font-medium truncate' : 'text-[#c0c4cc]'}>
                  {roleName || '请选择负责角色'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#909399] shrink-0 ml-1" />
              </div>

              {/* Role Dropdown */}
              {roleSelectOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e4e7ed] rounded-lg shadow-xl py-1 z-50 text-xs max-h-64 overflow-y-auto">
                  <div className="p-1 border-b border-[#f0f2f5] space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRoleSelectOpen(false);
                        setRoleLibraryModalOpen(true);
                      }}
                      className="w-full px-2 py-1.5 rounded bg-[#ecf5ff] text-[#1677ff] hover:bg-[#d9ecff] flex items-center justify-center gap-1.5 font-medium cursor-pointer transition-colors shadow-2xs"
                    >
                      <Users className="w-3.5 h-3.5 text-[#1677ff]" />
                      <span>从流程建设-角色库中选择...</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRoleSelectOpen(false);
                        setOrgPersonModalOpen(true);
                      }}
                      className="w-full px-2 py-1 text-[11px] text-[#909399] hover:text-[#1677ff] hover:bg-[#f5f7fa] rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Building2 className="w-3 h-3 text-[#909399]" />
                      <span>从公司组织架构人员选择...</span>
                    </button>
                  </div>
                  <div className="text-[10px] text-[#909399] px-3 py-1 font-medium bg-[#fafafa] flex items-center justify-between">
                    <span>角色库标准流程角色</span>
                    <span className="text-[10px] text-[#1677ff] font-mono">共 {libraryRoles.length || PRESET_ROLES.length} 个</span>
                  </div>
                  {(libraryRoles.length > 0
                    ? libraryRoles
                    : PRESET_ROLES.map((r) => ({ id: r, roleName: r, roleCode: '', roleType: '' }))
                  ).map((r: any) => {
                    const rName = r.roleName || r;
                    const isSelected = roleName === rName;
                    return (
                      <button
                        key={r.id || rName}
                        type="button"
                        onClick={() => {
                          setRoleName(rName);
                          if (r.isKcpApprover && !isKcp) {
                            setIsKcp(true);
                          }
                          setRoleSelectOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'text-[#1677ff] font-semibold bg-[#e6f4ff]/40' : 'text-[#303133]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          <span className="truncate">{rName}</span>
                          {r.roleCode && (
                            <span className="text-[10px] font-mono text-[#909399]">{r.roleCode}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {r.roleType && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-gray-100 text-gray-600">
                              {r.roleType.includes('R')
                                ? '主责'
                                : r.roleType.includes('A')
                                ? '审批'
                                : r.roleType.includes('C')
                                ? '会签'
                                : '角色'}
                            </span>
                          )}
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#1677ff]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: * 节点说明 */}
          <div className="flex items-start gap-3">
            <div className="w-[76px] shrink-0 text-right text-xs text-[#303133] font-medium select-none pt-1.5">
              <span className="text-[#f56c6c] font-bold mr-0.5">*</span>节点说明
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                rows={2}
                value={nodeDesc}
                onChange={(e) => setNodeDesc(e.target.value)}
                placeholder="请输入节点活动说明..."
                className="w-full p-2 rounded border border-[#dcdfe6] focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff]/20 outline-none text-xs text-[#303133] resize-none leading-relaxed transition-colors min-h-[54px]"
              />
            </div>
          </div>

          {/* Separator Line */}
          <div className="h-[1px] bg-[#ebeef5] my-2" />

          {/* Row 3: 输入说明 */}
          <div className="flex items-start gap-3">
            <div className="w-[76px] shrink-0 text-right text-xs text-[#303133] font-medium select-none pt-1.5">
              输入说明
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <textarea
                rows={2}
                value={inputDesc}
                onChange={(e) => setInputDesc(e.target.value)}
                placeholder="节点输入说明"
                className="w-full p-2 rounded border border-[#dcdfe6] focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff]/20 outline-none text-xs text-[#303133] resize-none leading-relaxed transition-colors min-h-[54px]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inFileInputRef.current?.click()}
                  className="h-7 px-2.5 rounded bg-[#1677ff] hover:bg-[#409eff] text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>上传附件</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSysDocSearch('');
                    setSysDocModalMode('in');
                  }}
                  className="h-7 px-2.5 rounded bg-[#ecf5ff] hover:bg-[#d9ecff] text-[#1677ff] border border-[#b3d8ff] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-[#1677ff]" />
                  <span>选择制度文件</span>
                </button>
                <input
                  ref={inFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'in')}
                />
              </div>

              {/* List of Input Attachments */}
              {inFileList.length > 0 && (
                <div className="space-y-1 pt-0.5">
                  {inFileList.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-1 px-2 bg-[#f8f9fb] border border-[#e4e7ed] rounded flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Paperclip className="w-3 h-3 text-[#909399] shrink-0" />
                        <span className="truncate text-[#303133]" title={item.name}>
                          {item.name}
                        </span>
                        {item.isSysDoc && (
                          <span className="px-1 py-0.2 rounded bg-blue-50 text-blue-600 border border-blue-200 text-[10px] shrink-0">
                            制度
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              label: item.name,
                              docNo: item.docNo || 'SYS-DOC',
                              category: '流程输入制度文件',
                              fileSize: item.size || '1.2 MB',
                              fileType: (item.type as any) || 'pdf',
                            })
                          }
                          className="p-0.5 text-[#909399] hover:text-[#1677ff] rounded cursor-pointer"
                          title="在线预览"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setInFileList(inFileList.filter((_, i) => i !== idx))}
                          className="p-0.5 text-[#909399] hover:text-[#f56c6c] rounded cursor-pointer"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Separator Line */}
          <div className="h-[1px] bg-[#ebeef5] my-2" />

          {/* Row 4: * 输出说明 */}
          <div className="flex items-start gap-3">
            <div className="w-[76px] shrink-0 text-right text-xs text-[#303133] font-medium select-none pt-1.5">
              <span className="text-[#f56c6c] font-bold mr-0.5">*</span>输出说明
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <textarea
                rows={2}
                value={outputDesc}
                onChange={(e) => setOutputDesc(e.target.value)}
                placeholder="请输入交付物与输出说明..."
                className="w-full p-2 rounded border border-[#dcdfe6] focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff]/20 outline-none text-xs text-[#303133] resize-none leading-relaxed transition-colors min-h-[54px]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => outFileInputRef.current?.click()}
                  className="h-7 px-2.5 rounded bg-[#1677ff] hover:bg-[#409eff] text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>上传附件</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSysDocSearch('');
                    setSysDocModalMode('out');
                  }}
                  className="h-7 px-2.5 rounded bg-[#ecf5ff] hover:bg-[#d9ecff] text-[#1677ff] border border-[#b3d8ff] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-[#1677ff]" />
                  <span>选择制度文件</span>
                </button>
                <input
                  ref={outFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'out')}
                />
              </div>

              {/* List of Output Attachments */}
              {outFileList.length > 0 && (
                <div className="space-y-1 pt-0.5">
                  {outFileList.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-1 px-2 bg-[#f8f9fb] border border-[#e4e7ed] rounded flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Paperclip className="w-3 h-3 text-[#909399] shrink-0" />
                        <span className="truncate text-[#303133]" title={item.name}>
                          {item.name}
                        </span>
                        {item.isSysDoc && (
                          <span className="px-1 py-0.2 rounded bg-green-50 text-green-700 border border-green-200 text-[10px] shrink-0">
                            制度交付物
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              label: item.name,
                              docNo: item.docNo || 'SYS-DOC',
                              category: '流程交付物标准',
                              fileSize: item.size || '2.0 MB',
                              fileType: (item.type as any) || 'pdf',
                            })
                          }
                          className="p-0.5 text-[#909399] hover:text-[#1677ff] rounded cursor-pointer"
                          title="在线预览"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setOutFileList(outFileList.filter((_, i) => i !== idx))}
                          className="p-0.5 text-[#909399] hover:text-[#f56c6c] rounded cursor-pointer"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Separator Line */}
          <div className="h-[1px] bg-[#ebeef5] my-2" />

          {/* Row 5: 执行系统 */}
          <div className="flex items-center gap-3">
            <div className="w-[76px] shrink-0 text-right text-xs text-[#303133] font-medium select-none">
              执行系统
            </div>
            <div className="flex-1 min-w-0 relative">
              <div
                onClick={() => setSystemSelectOpen(!systemSelectOpen)}
                className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] hover:border-[#409eff] bg-white flex items-center justify-between cursor-pointer text-xs transition-colors"
              >
                <span className={system ? 'text-[#303133] font-medium truncate' : 'text-[#c0c4cc]'}>
                  {system || '请选择执行系统'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#909399] shrink-0 ml-1" />
              </div>
              {systemSelectOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e4e7ed] rounded-lg shadow-xl py-1 z-50 text-xs max-h-48 overflow-y-auto">
                  {EXECUTION_SYSTEMS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSystem(s);
                        setSystemSelectOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left hover:bg-[#f5f7fa] flex items-center justify-between cursor-pointer ${
                        system === s ? 'text-[#1677ff] font-semibold bg-[#e6f4ff]/40' : 'text-[#303133]'
                      }`}
                    >
                      <span>{s}</span>
                      {system === s && <CheckCircle2 className="w-3.5 h-3.5 text-[#1677ff]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 6: KCP */}
          <div className="flex items-center gap-3">
            <div className="w-[76px] shrink-0 text-right text-xs text-[#303133] font-medium select-none">
              KCP
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isKcp}
                  onChange={(e) => setIsKcp(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1677ff] accent-[#1677ff] cursor-pointer"
                />
                <span className="text-xs text-[#303133]">是</span>
              </label>
              {isKcp && (
                <span className="px-1.5 py-0.2 rounded bg-red-50 text-red-600 border border-red-200 text-[10px] font-medium">
                  关键控制点 (画布显示红色KCP徽标)
                </span>
              )}
            </div>
          </div>

          {/* Separator Line */}
          <div className="h-[1px] bg-[#ebeef5] my-2" />

          {/* Row 7: KPI */}
          <div className="flex items-start gap-3">
            <div className="w-[76px] shrink-0 text-right text-xs text-[#303133] font-medium select-none pt-1.5">
              KPI
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <input
                type="text"
                value={kpiTarget}
                onChange={(e) => setKpiTarget(e.target.value)}
                placeholder="如制定完整方案"
                className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff]/20 outline-none text-xs text-[#303133] transition-colors"
              />
              <input
                type="text"
                value={kpiDesc}
                onChange={(e) => setKpiDesc(e.target.value)}
                placeholder="KPI描述"
                className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff]/20 outline-none text-xs text-[#303133] transition-colors"
              />
            </div>
          </div>

          {/* Separator Line */}
          <div className="h-[1px] bg-[#ebeef5] my-2" />

          {/* Row 8: 权责 */}
          <div className="flex items-center gap-3">
            <div className="w-[76px] shrink-0 text-right text-xs text-[#303133] font-medium select-none">
              权责
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setRaciPopoverOpen(!raciPopoverOpen)}
                className="h-7 px-3 rounded bg-[#1677ff] hover:bg-[#409eff] text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>关联权责</span>
              </button>
              {(raciR.length > 0 || raciA) && (
                <span
                  className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-medium truncate max-w-[220px]"
                  title={`负责(R): ${raciR.join(', ') || '无'} | 审批(A): ${raciA || '无'}`}
                >
                  {raciR.length > 0 ? `R:${raciR[0]}` : ''} {raciA ? `A:${raciA}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* RACI Popover Box */}
          {raciPopoverOpen && (
            <div className="ml-[88px] p-2.5 bg-[#fafbfc] border border-[#e4e7ed] rounded-lg shadow-xs space-y-2 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-[#ebeef5] pb-1">
                <span className="font-semibold text-xs text-[#1f2733] flex items-center gap-1">
                  <Table2 className="w-3 h-3 text-[#7c3aed]" />
                  <span>设置节点权责 RACI</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRaciPopoverOpen(false);
                    onOpenRaciModal?.();
                  }}
                  className="text-[#1677ff] hover:underline text-[10px] cursor-pointer"
                >
                  打开完整矩阵
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] font-medium text-[#606266] mb-0.5">
                    <strong className="text-blue-600">R</strong> 负责角色:
                  </div>
                  <input
                    type="text"
                    value={raciR.join(', ')}
                    onChange={(e) => setRaciR(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                    placeholder="如: 研发工程师"
                    className="w-full h-6 px-1.5 border border-[#dcdfe6] rounded text-[11px] bg-white"
                  />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-[#606266] mb-0.5">
                    <strong className="text-amber-600">A</strong> 审批角色:
                  </div>
                  <input
                    type="text"
                    value={raciA}
                    onChange={(e) => setRaciA(e.target.value)}
                    placeholder="如: 技术总监"
                    className="w-full h-6 px-1.5 border border-[#dcdfe6] rounded text-[11px] bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Separator Line */}
          <div className="h-[1px] bg-[#ebeef5] my-2" />

          {/* Row 9: 处理时限 */}
          <div className="flex items-center gap-3">
            <div className="w-[76px] shrink-0 text-right text-xs text-[#303133] font-medium select-none">
              处理时限
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <input
                type="text"
                value={timeTarget}
                onChange={(e) => setTimeTarget(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder="目标值"
                className="w-24 h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff]/20 outline-none text-xs text-[#303133] transition-colors"
              />
              <div className="relative w-28">
                <select
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value)}
                  className="w-full h-8 px-2.5 pr-7 rounded border border-[#dcdfe6] focus:border-[#1677ff] bg-white outline-none text-xs text-[#303133] cursor-pointer appearance-none"
                >
                  <option value="天">天</option>
                  <option value="工作日">工作日</option>
                  <option value="小时">小时</option>
                  <option value="分钟">分钟</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#909399] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {timeTarget && (
                <span className="text-[10px] text-gray-700 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded font-mono shrink-0">
                  {timeTarget}{timeUnit}
                </span>
              )}
            </div>
          </div>

          {/* Separator Line */}
          <div className="h-[1px] bg-[#ebeef5] my-2" />

          {/* Row 10: 节点备注 */}
          <div className="flex items-start gap-3">
            <div className="w-[76px] shrink-0 text-right text-xs text-[#303133] font-medium select-none pt-1.5">
              节点备注
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                rows={2}
                value={nodeRemark}
                onChange={(e) => setNodeRemark(e.target.value)}
                placeholder="节点备注"
                className="w-full p-2 rounded border border-[#dcdfe6] focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff]/20 outline-none text-xs text-[#303133] resize-none leading-relaxed transition-colors min-h-[50px]"
              />
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions - Fixed Bottom */}
        <div className="px-5 py-3 border-t border-[#e4e7ed] bg-[#fafafa] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#909399]">
            保存后即刻同步更新画布
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-7.5 px-3 rounded border border-[#dcdfe6] hover:bg-[#f0f2f5] text-[#606266] text-xs font-medium cursor-pointer transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-7.5 px-4 rounded bg-[#1677ff] hover:bg-[#409eff] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>保存属性</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Process Role Library Selection Modal (流程建设-角色库) */}
      <RoleLibrarySelectModal
        open={roleLibraryModalOpen}
        initialSelectedRoleName={roleName}
        onClose={() => setRoleLibraryModalOpen(false)}
        onConfirm={(selectedRole) => {
          setRoleName(selectedRole.roleName);
          if (selectedRole.isKcpApprover && !isKcp) {
            setIsKcp(true);
          }
          showToast(`已从流程角色库中选定负责角色：【${selectedRole.roleName}】`, 'success');
          setRoleLibraryModalOpen(false);
        }}
        showToast={showToast}
      />

      {/* Person & Organization Selection Modal */}
      <PersonSelectModal
        open={orgPersonModalOpen}
        title="选择负责角色与岗位"
        description="支持从公司组织架构各职能中心与部门中直接挑选对应岗位的责任人"
        initialSelected={roleName}
        onClose={() => setOrgPersonModalOpen(false)}
        onConfirm={(persons) => {
          if (persons.length > 0) {
            const p = persons[0];
            setRoleName(p.roleName ? `${p.roleName} (${p.userName})` : p.userName);
            showToast(`已从组织架构中选定角色：${p.roleName || p.userName}`, 'success');
          }
          setOrgPersonModalOpen(false);
        }}
        showToast={showToast}
      />

      {/* Institutional Document Selector Modal (选择制度文件) */}
      {sysDocModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-[#dcdfe6] w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] text-xs animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-[#ebeef5] flex items-center justify-between bg-[#fafafa]">
              <span className="font-bold text-sm text-[#1f2733] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1677ff]" />
                <span>选择企业制度文件 ({sysDocModalMode === 'in' ? '输入关联' : '输出交付物'})</span>
              </span>
              <button
                type="button"
                onClick={() => setSysDocModalMode(null)}
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-2.5 border-b border-[#ebeef5] bg-[#ffffff]">
              <div className="flex items-center px-2.5 py-1.5 border border-[#dcdfe6] rounded-md focus-within:border-[#1677ff]">
                <Search className="w-3.5 h-3.5 text-[#909399] mr-2 shrink-0" />
                <input
                  type="text"
                  value={sysDocSearch}
                  onChange={(e) => setSysDocSearch(e.target.value)}
                  placeholder="搜索制度文件名称、编号..."
                  className="w-full text-xs outline-none text-[#303133]"
                />
              </div>
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {PRESET_SYS_DOCS.filter(
                (d) =>
                  !sysDocSearch.trim() ||
                  d.name.toLowerCase().includes(sysDocSearch.toLowerCase()) ||
                  (d.docNo && d.docNo.toLowerCase().includes(sysDocSearch.toLowerCase()))
              ).map((doc) => {
                const isSelected =
                  sysDocModalMode === 'in'
                    ? inFileList.some((x) => x.id === doc.id)
                    : outFileList.some((x) => x.id === doc.id);

                return (
                  <div
                    key={doc.id}
                    className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'border-[#1677ff] bg-[#ecf5ff]/40'
                        : 'border-[#e4e7ed] hover:border-[#b3d8ff] bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0 pr-2">
                      <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        {doc.type?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-[#303133] truncate text-xs" title={doc.name}>
                          {doc.name}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[#909399] mt-0.5">
                          <span>{doc.docNo}</span>
                          <span>{doc.size}</span>
                          <span>发布: {doc.uploadTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDoc({
                            label: doc.name,
                            docNo: doc.docNo,
                            category: '企业标准制度文件',
                            fileSize: doc.size,
                            fileType: (doc.type as any) || 'pdf',
                          })
                        }
                        className="px-2 py-1 rounded border border-[#dcdfe6] hover:bg-[#f0f2f5] text-[#606266] text-xs cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>预览</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (sysDocModalMode === 'in') {
                            if (isSelected) {
                              setInFileList(inFileList.filter((x) => x.id !== doc.id));
                            } else {
                              setInFileList([...inFileList, doc]);
                            }
                          } else {
                            if (isSelected) {
                              setOutFileList(outFileList.filter((x) => x.id !== doc.id));
                            } else {
                              setOutFileList([...outFileList, doc]);
                            }
                          }
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#1677ff] text-white hover:bg-[#409eff]'
                        }`}
                      >
                        {isSelected ? '已选' : '选择'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-2.5 border-t border-[#ebeef5] bg-[#fafafa] flex justify-end">
              <button
                type="button"
                onClick={() => setSysDocModalMode(null)}
                className="h-7 px-3.5 rounded bg-[#1677ff] text-white text-xs font-medium cursor-pointer"
              >
                完成选择
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Online Document Preview Modal */}
      {previewDoc && (
        <OnlineDocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
          showToast={showToast}
        />
      )}
    </>
  );
};
