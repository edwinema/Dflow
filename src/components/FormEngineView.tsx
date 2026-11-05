import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PersonSelectField } from './PersonSelectField';
import {
  Sparkles,
  Code,
  RotateCcw,
  Eye,
  Plus,
  Search,
  PenLine,
  Copy,
  MoveUp,
  MoveDown,
  Trash2,
  X,
  Check,
  Building2,
  Users,
  Calendar,
  Clock,
  Upload,
  AlignLeft,
  Type,
  FileText,
  DollarSign,
  Radio,
  CheckSquare,
  ChevronDown,
  Layers,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Folder,
  Sliders,
  Hash,
  Monitor,
  Smartphone,
  Info,
  CalendarRange,
} from 'lucide-react';

export interface FormField {
  id: string;
  fieldKey: string;
  label: string;
  type: string;
  span: number; // 24 = full width, 12 = half, 8 = 1/3, 6 = 1/4
  section: '基础信息' | '业务参数' | '权责与审批' | '合规风控' | '扩展属性';
  required: boolean;
  showInList: boolean;
  searchable?: boolean;
  placeholder?: string;
  tooltip?: string;
  defaultValue?: any;
  options?: string[];
  unit?: string;
  isSystem?: boolean;
}

export interface FormSchema {
  formKey: string;
  formName: string;
  moduleDomain: string;
  description: string;
  version: string;
  tag?: string;
  updatedAt: string;
  isSystem?: boolean;
  fields: FormField[];
}

interface FormEngineViewProps {
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  initialFormKey?: string;
  onNavigate?: (path: string, param?: string) => void;
}

// 16 Component Types as per Design Screenshot
const COMPONENT_TYPES = [
  { id: 'input', label: '单行文本', icon: Type, desc: '普通文本、单号、简短标题输入' },
  { id: 'textarea', label: '多行文本', icon: AlignLeft, desc: '长篇描述、意见、摘要说明' },
  { id: 'richText', label: '富文本正文', icon: FileText, desc: '排版条款、段落与制度正文' },
  { id: 'number', label: '数值输入', icon: Hash, desc: '数字计数、量化指标、阈值' },
  { id: 'currency', label: '金额/货币', icon: DollarSign, desc: '万元/元审批预算及阈值' },
  { id: 'select', label: '下拉单选', icon: ChevronDown, desc: '固定枚举字典单项选择' },
  { id: 'multiSelect', label: '多选下拉/标签', icon: Sliders, desc: '业务标签、多项属性勾选' },
  { id: 'radio', label: '单选按钮组', icon: Radio, desc: '平铺单项切换选择' },
  { id: 'checkbox', label: '复选框组', icon: CheckSquare, desc: '多项平铺勾选' },
  { id: 'date', label: '日期选择', icon: Calendar, desc: '年月日选择' },
  { id: 'datetime', label: '日期时间', icon: Clock, desc: '精确到时分秒的时间点' },
  { id: 'dateRange', label: '日期区间', icon: CalendarRange, desc: '起止有效期间' },
  { id: 'userPicker', label: '人员选择器', icon: Users, desc: '企业员工、审批人、编制人' },
  { id: 'deptPicker', label: '部门选择器', icon: Building2, desc: '组织架构与所属部门' },
  { id: 'switch', label: '开关状态', icon: CheckSquare, desc: '启用/停用、是否布尔状态' },
  { id: 'upload', label: '附件上传', icon: Upload, desc: '红头文件、PDF及证据凭证' },
];

export const FormEngineView: React.FC<FormEngineViewProps> = ({
  showToast,
  initialFormKey = 'form_sysdoc',
  onNavigate,
}) => {
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [activeFormKey, setActiveFormKey] = useState<string>(initialFormKey);
  const [loading, setLoading] = useState(false);

  // Left panel category filter
  const [activeCategory, setActiveCategory] = useState<string>('全部表单');
  const [modelSearch, setModelSearch] = useState('');

  // Right table filters
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('全部区块');
  const [onlyRequiredFilter, setOnlyRequiredFilter] = useState(false);
  const [onlyShowInListFilter, setOnlyShowInListFilter] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  // Modals state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedFields, setAiGeneratedFields] = useState<any[]>([]);

  const [addFieldModalOpen, setAddFieldModalOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldFormData, setFieldFormData] = useState<Partial<FormField>>({
    fieldKey: '',
    label: '',
    type: 'input',
    span: 12,
    section: '基础信息',
    placeholder: '',
    tooltip: '',
    required: false,
    showInList: true,
    options: ['选项1', '选项2'],
  });
  const [rawOptionText, setRawOptionText] = useState('');

  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [schemaText, setSchemaText] = useState('');
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'pc' | 'mobile'>('pc');
  const [previewMode, setPreviewMode] = useState<'form' | 'json' | 'schema'>('form');
  const [previewFormValues, setPreviewFormValues] = useState<Record<string, any>>({});
  const [previewErrors, setPreviewErrors] = useState<Record<string, string>>({});

  const [createModelModalOpen, setCreateModelModalOpen] = useState(false);
  const [createModelData, setCreateModelData] = useState({
    formKey: '',
    formName: '',
    moduleDomain: '协同工作 (任务流转与流程培训)',
    description: '',
    template: '空白表单 (预置编码、名称、备注3个基本项)',
  });

  // Custom confirmation modals (replaces blocked window.confirm)
  const [deleteFieldConfirm, setDeleteFieldConfirm] = useState<{
    visible: boolean;
    field: FormField | null;
  }>({ visible: false, field: null });
  const [resetDefaultsConfirm, setResetDefaultsConfirm] = useState(false);
  const [isDeletingField, setIsDeletingField] = useState(false);
  const [isResettingDefaults, setIsResettingDefaults] = useState(false);

  // Fetch all forms
  const fetchForms = async (selectKey?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/forms');
      const json = await res.json();
      if (json.status === 1 && json.data?.forms) {
        setForms(json.data.forms);
        const target = selectKey || activeFormKey;
        const exists = json.data.forms.some((f: FormSchema) => f.formKey === target);
        if (exists) {
          setActiveFormKey(target);
        } else if (json.data.forms.length > 0) {
          setActiveFormKey(json.data.forms[0].formKey);
        }
      }
    } catch (e) {
      console.error('Failed to fetch forms', e);
      showToast('获取表单模型列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms(initialFormKey);
  }, []);

  useEffect(() => {
    if (initialFormKey && initialFormKey !== activeFormKey) {
      setActiveFormKey(initialFormKey);
    }
  }, [initialFormKey]);

  // Current active form
  const currentForm = useMemo(() => {
    return forms.find((f) => f.formKey === activeFormKey) || forms[0] || null;
  }, [forms, activeFormKey]);

  // Filtered forms in left sidebar
  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      if (activeCategory !== '全部表单') {
        if (!f.moduleDomain.includes(activeCategory)) return false;
      }
      if (modelSearch.trim()) {
        const q = modelSearch.trim().toLowerCase();
        return (
          f.formName.toLowerCase().includes(q) ||
          f.formKey.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [forms, activeCategory, modelSearch]);

  // Filtered fields in right table
  const filteredFields = useMemo(() => {
    if (!currentForm?.fields) return [];
    return currentForm.fields.filter((field) => {
      // Section tab
      if (activeSectionFilter !== '全部区块') {
        if (field.section !== activeSectionFilter) return false;
      }
      // Required filter
      if (onlyRequiredFilter && !field.required) return false;
      // Show in list filter
      if (onlyShowInListFilter && !field.showInList) return false;
      // Search
      if (tableSearch.trim()) {
        const q = tableSearch.trim().toLowerCase();
        const matchLabel = field.label.toLowerCase().includes(q);
        const matchKey = field.fieldKey.toLowerCase().includes(q);
        const matchType = field.type.toLowerCase().includes(q);
        if (!matchLabel && !matchKey && !matchType) return false;
      }
      return true;
    });
  }, [
    currentForm?.fields,
    activeSectionFilter,
    onlyRequiredFilter,
    onlyShowInListFilter,
    tableSearch,
  ]);

  // Section counts
  const sectionCounts = useMemo(() => {
    const fields = currentForm?.fields || [];
    return {
      all: fields.length,
      base: fields.filter((f) => f.section === '基础信息').length,
      param: fields.filter((f) => f.section === '业务参数').length,
      duty: fields.filter((f) => f.section === '权责与审批').length,
      risk: fields.filter((f) => f.section === '合规风控').length,
      ext: fields.filter((f) => f.section === '扩展属性').length,
      required: fields.filter((f) => f.required).length,
      showInList: fields.filter((f) => f.showInList).length,
    };
  }, [currentForm?.fields]);

  // Initialize preview form values
  useEffect(() => {
    if (currentForm) {
      const vals: Record<string, any> = {};
      currentForm.fields.forEach((f) => {
        if (f.defaultValue !== undefined) {
          vals[f.fieldKey] = f.defaultValue;
        } else if (f.type === 'switch') {
          vals[f.fieldKey] = false;
        } else if (f.type === 'multiSelect' || f.type === 'checkbox') {
          vals[f.fieldKey] = [];
        } else {
          vals[f.fieldKey] = '';
        }
      });
      setPreviewFormValues(vals);
      setPreviewErrors({});
    }
  }, [currentForm?.formKey]);

  // Inline toggle required / showInList
  const handleToggleField = async (field: FormField, prop: 'required' | 'showInList') => {
    if (!currentForm) return;
    const updated = { ...field, [prop]: !field[prop] };
    try {
      const res = await fetch(`/api/system/forms/${currentForm.formKey}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const json = await res.json();
      if (json.status === 1 && json.data) {
        setForms((prev) => prev.map((f) => (f.formKey === currentForm.formKey ? json.data : f)));
        showToast(`已${updated[prop] ? '开启' : '关闭'}【${field.label}】的${prop === 'required' ? '必填约束' : '列表展示'}`, 'info');
      }
    } catch (e) {
      showToast('更新失败', 'error');
    }
  };

  // Move field order
  const handleMoveField = async (index: number, direction: 'up' | 'down') => {
    if (!currentForm) return;
    const fields = [...currentForm.fields];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;

    const temp = fields[index];
    fields[index] = fields[targetIdx];
    fields[targetIdx] = temp;

    const fieldIds = fields.map((f) => f.id);
    try {
      const res = await fetch(`/api/system/forms/${currentForm.formKey}/fields/sort`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldIds }),
      });
      const json = await res.json();
      if (json.status === 1 && json.data) {
        setForms((prev) => prev.map((f) => (f.formKey === currentForm.formKey ? json.data : f)));
      }
    } catch (e) {
      showToast('排序更新异常', 'error');
    }
  };

  // Clone field
  const handleCloneField = async (field: FormField) => {
    if (!currentForm) return;
    const cloned: FormField = {
      ...field,
      id: 'f_' + Math.random().toString(36).substring(2, 8),
      fieldKey: `${field.fieldKey}_copy`,
      label: `${field.label} (副本)`,
      isSystem: false,
    };
    try {
      const res = await fetch(`/api/system/forms/${currentForm.formKey}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloned),
      });
      const json = await res.json();
      if (json.status === 1 && json.data) {
        setForms((prev) => prev.map((f) => (f.formKey === currentForm.formKey ? json.data : f)));
        showToast(`已复制字段【${cloned.label}】`, 'success');
      }
    } catch (e) {
      showToast('复制失败', 'error');
    }
  };

  // Delete field trigger
  const handleDeleteField = (field: FormField) => {
    if (!currentForm) return;
    if (field.isSystem) {
      showToast('系统内置字段受保护，不可删除', 'warning');
      return;
    }
    setDeleteFieldConfirm({ visible: true, field });
  };

  // Confirm delete field
  const handleConfirmDeleteField = async () => {
    const field = deleteFieldConfirm.field;
    if (!currentForm || !field) return;

    setIsDeletingField(true);
    try {
      const res = await fetch(`/api/system/forms/${currentForm.formKey}/fields/${field.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.status === 1) {
        if (json.data) {
          setForms((prev) => prev.map((f) => (f.formKey === currentForm.formKey ? json.data : f)));
        } else {
          setForms((prev) =>
            prev.map((f) =>
              f.formKey === currentForm.formKey
                ? { ...f, fields: f.fields.filter((item) => item.id !== field.id) }
                : f
            )
          );
        }
        showToast(`已成功删除字段【${field.label}】(${field.fieldKey})`, 'success');
        setDeleteFieldConfirm({ visible: false, field: null });
      } else {
        showToast(json.info || '删除失败', 'error');
      }
    } catch (e) {
      // Local fallback
      setForms((prev) =>
        prev.map((f) =>
          f.formKey === currentForm.formKey
            ? { ...f, fields: f.fields.filter((item) => item.id !== field.id) }
            : f
        )
      );
      showToast(`已删除字段【${field.label}】`, 'success');
      setDeleteFieldConfirm({ visible: false, field: null });
    } finally {
      setIsDeletingField(false);
    }
  };

  // Reset to default trigger
  const handleResetDefaults = () => {
    setResetDefaultsConfirm(true);
  };

  // Confirm reset defaults
  const handleConfirmResetDefaults = async () => {
    setIsResettingDefaults(true);
    try {
      const res = await fetch('/api/system/forms/reset', { method: 'POST' });
      const json = await res.json();
      if (json.status === 1 && json.data?.forms) {
        setForms(json.data.forms);
        setActiveFormKey('form_sysdoc');
        showToast('已成功恢复系统默认出厂规范！', 'success');
        setResetDefaultsConfirm(false);
      } else {
        showToast(json.info || '重置失败', 'error');
      }
    } catch (e) {
      showToast('重置失败', 'error');
    } finally {
      setIsResettingDefaults(false);
    }
  };

  // Open add field modal
  const handleOpenAddField = () => {
    setEditingFieldId(null);
    setFieldFormData({
      fieldKey: '',
      label: '',
      type: 'input',
      span: 12,
      section: '基础信息',
      placeholder: '',
      tooltip: '',
      required: false,
      showInList: true,
      options: ['选项一', '选项二', '选项三'],
    });
    setRawOptionText('选项一\n选项二\n选项三');
    setAddFieldModalOpen(true);
  };

  // Open edit field modal
  const handleOpenEditField = (field: FormField) => {
    setEditingFieldId(field.id);
    setFieldFormData({ ...field });
    setRawOptionText((field.options || []).join('\n'));
    setAddFieldModalOpen(true);
  };

  // Save field
  const handleSaveFieldForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentForm || !fieldFormData.label?.trim() || !fieldFormData.fieldKey?.trim()) {
      showToast('请完整输入字段英文标识和显示中文名称', 'warning');
      return;
    }

    let options: string[] | undefined = undefined;
    if (['select', 'multiSelect', 'radio', 'checkbox'].includes(fieldFormData.type || '')) {
      options = rawOptionText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      if (options.length === 0) options = ['选项A', '选项B'];
    }

    const payload = {
      ...fieldFormData,
      id: editingFieldId || undefined,
      label: fieldFormData.label.trim(),
      fieldKey: fieldFormData.fieldKey.trim(),
      options,
    };

    try {
      const res = await fetch(`/api/system/forms/${currentForm.formKey}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.status === 1 && json.data) {
        setForms((prev) => prev.map((f) => (f.formKey === currentForm.formKey ? json.data : f)));
        setAddFieldModalOpen(false);
        showToast(editingFieldId ? '字段修改已保存' : '已成功添加新字段', 'success');
      } else {
        showToast(json.info || '保存失败', 'error');
      }
    } catch (e) {
      showToast('保存字段异常', 'error');
    }
  };

  // Open AI modal
  const handleOpenAiModal = () => {
    setAiPrompt('如: 我想在制度文件中增加法务合规审查结论、反洗钱合规评级、外聘律师事务所意见等扩展字段...');
    setAiGeneratedFields([]);
    setAiModalOpen(true);
  };

  // Run AI Generation
  const handleRunAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      showToast('请输入业务定制诉求与场景描述', 'warning');
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/form-fields-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          formKey: currentForm?.formKey,
          formName: currentForm?.formName,
          moduleDomain: currentForm?.moduleDomain,
        }),
      });
      const json = await res.json();
      if (json.status === 1 && json.data?.recommendedFields) {
        setAiGeneratedFields(json.data.recommendedFields);
        showToast(json.data.summary || 'AI 智能推导完成！', 'success');
      } else {
        showToast(json.info || 'AI 生成异常', 'error');
      }
    } catch (e) {
      showToast('调用 AI 推荐服务失败', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Adopt AI Fields
  const handleAdoptAiFields = async () => {
    const selected = aiGeneratedFields.filter((f) => f.selected);
    if (selected.length === 0) {
      showToast('请至少勾选一个推荐字段', 'warning');
      return;
    }
    if (!currentForm) return;

    try {
      const res = await fetch(`/api/system/forms/${currentForm.formKey}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: selected, mode: 'append' }),
      });
      const json = await res.json();
      if (json.status === 1 && json.data) {
        setForms((prev) => prev.map((f) => (f.formKey === currentForm.formKey ? json.data : f)));
        setAiModalOpen(false);
        showToast(`成功将 ${selected.length} 个 AI 推荐字段追加至当前表单！`, 'success');
      }
    } catch (e) {
      showToast('追加字段失败', 'error');
    }
  };

  // Open Schema Modal
  const handleOpenSchemaModal = () => {
    if (!currentForm) return;
    setSchemaText(JSON.stringify(currentForm, null, 2));
    setSchemaError(null);
    setSchemaModalOpen(true);
  };

  // Save Schema from Modal
  const handleSaveSchemaModal = async () => {
    if (!currentForm) return;
    try {
      const parsed = JSON.parse(schemaText);
      setSchemaError(null);
      if (!parsed.formKey || !Array.isArray(parsed.fields)) {
        setSchemaError('Schema 格式不正确：必须包含 formKey 和 fields 列表');
        return;
      }
      const res = await fetch(`/api/system/forms/${currentForm.formKey}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: parsed.fields, mode: 'replace' }),
      });
      const json = await res.json();
      if (json.status === 1 && json.data) {
        setForms((prev) => prev.map((f) => (f.formKey === currentForm.formKey ? json.data : f)));
        setSchemaModalOpen(false);
        showToast('Schema 架构已成功导入并同步保存', 'success');
      }
    } catch (e: any) {
      setSchemaError(`JSON 解析失败: ${e.message}`);
    }
  };

  // Create Model
  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createModelData.formKey.trim() || !createModelData.formName.trim()) {
      showToast('请输入表单英文唯一标识和中文全称', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/system/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createModelData),
      });
      const json = await res.json();
      if (json.status === 1 && json.data) {
        setForms((prev) => [...prev, json.data]);
        setActiveFormKey(json.data.formKey);
        setCreateModelModalOpen(false);
        showToast(`已创建业务表单【${json.data.formName}】`, 'success');
      } else {
        showToast(json.info || '创建失败', 'error');
      }
    } catch (e) {
      showToast('创建异常', 'error');
    }
  };

  // Validate Runtime Preview
  const handleValidatePreview = () => {
    if (!currentForm) return;
    const errors: Record<string, string> = {};
    currentForm.fields.forEach((f) => {
      if (f.required) {
        const val = previewFormValues[f.fieldKey];
        if (val === undefined || val === null || val === '') {
          errors[f.fieldKey] = `${f.label} 为必填项`;
        }
      }
    });
    setPreviewErrors(errors);
    if (Object.keys(errors).length > 0) {
      showToast(`表单存在 ${Object.keys(errors).length} 处必填项未输入完整`, 'warning');
    } else {
      showToast('表单数据校验全部通过！', 'success');
    }
  };

  // Fill Test Data
  const handleFillTestData = () => {
    if (!currentForm) return;
    const testData: Record<string, any> = {
      docNo: 'ZD-2026-001',
      docName: '研发体系软件架构设计与发布评审标准管理办法',
      docLevel: '二级-业务管理办法',
      docCategory: '研发与技术工程',
      referenceNo: '全元发〔2026〕088号',
      publishDept: '质量合规部',
      authorUser: '张三 (制度主管)',
      reviewerUser: '李合规 (审计专员)',
      approverUser: '王副总 (分管副总裁)',
      effectiveStartDate: '2026-04-02',
      effectiveEndDate: '2026-12-30',
      effectiveDate: '2026-04-02',
      validityPeriod: '2026-04-02 至 2026-12-30',
      securityLevel: '内部受限(工作秘密)',
      versionNo: 'V1.0',
      summaryText: '规范企业全栈数字化流程资产的设计标准、DOA审批链路与合规准入规范。',
      docContent: '第一条 为保证全元科技数字化架构规范统一，特制定本管理办法...\n第二条 凡涉及主干流程变更须经委员会决议。',
      attachmentFile: '软件发布标准红头文件[2026]088号.pdf',
      autoAuditCycle: true,
    };
    setPreviewFormValues(testData);
    setPreviewErrors({});
    showToast('已填入全套仿真测试数据', 'info');
  };

  // Get field type visual pill
  const getFieldTypeVisual = (type: string) => {
    const item = COMPONENT_TYPES.find((c) => c.id === type) || {
      id: type,
      label: type,
      icon: Type,
    };
    const Icon = item.icon;
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff] font-medium whitespace-nowrap">
        <Icon className="w-3 h-3 text-[#409eff]" />
        <span>{item.label}</span>
      </span>
    );
  };

  // Group fields by section for runtime preview
  const groupedSections = useMemo(() => {
    const sections: Record<string, FormField[]> = {
      基础信息: [],
      业务参数: [],
      权责与审批: [],
      合规风控: [],
      扩展属性: [],
    };
    (currentForm?.fields || []).forEach((f) => {
      if (sections[f.section]) {
        sections[f.section].push(f);
      } else {
        sections['扩展属性'].push(f);
      }
    });
    return sections;
  }, [currentForm?.fields]);

  return (
    <div className="h-[calc(100vh-88px)] flex flex-col bg-[#f5f7fa] select-none p-3 gap-2.5 overflow-hidden font-sans">
      {/* TOP BANNER CARD */}
      <div className="bg-white rounded-lg border border-[#ebeef5] px-5 py-3.5 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#1890ff] text-white flex items-center justify-center font-bold shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#1f2733]">表单引擎 (字段与模型管理)</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#67c23a]"></span>
                企业级动态架构
              </span>
            </div>
            <p className="text-xs text-[#909399] mt-0.5">
              实现制度文件、知识工程、权责管控中所有表单字段的自定义配置与运行时渲染，支持全生命周期扩展
            </p>
          </div>
        </div>

        {/* 4 Header Action Buttons as per Design */}
        <div className="flex items-center gap-2.5">
          {/* AI Generate Button (Purple) */}
          <button
            type="button"
            onClick={handleOpenAiModal}
            className="h-8 px-3.5 rounded-md bg-[#7038e8] hover:bg-[#6029d5] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI 智能生成字段</span>
          </button>

          {/* Schema Spec Button */}
          <button
            type="button"
            onClick={handleOpenSchemaModal}
            className="h-8 px-3.5 rounded-md border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-[#303133] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-[#606266]" />
            <span>{'</>'} Schema 规范</span>
          </button>

          {/* Reset Defaults Button */}
          <button
            type="button"
            onClick={handleResetDefaults}
            className="h-8 px-3.5 rounded-md border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-[#303133] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#606266]" />
            <span>恢复默认</span>
          </button>

          {/* Run Preview Button (Blue) */}
          <button
            type="button"
            onClick={() => setPreviewModalOpen(true)}
            className="h-8 px-4 rounded-md bg-[#1890ff] hover:bg-[#1579d4] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>运行预览表单</span>
          </button>
        </div>
      </div>

      {/* MAIN TWO-PANE LAYOUT */}
      <div className="flex-1 flex gap-2.5 min-h-0 overflow-hidden">
        {/* LEFT PANEL: 业务模块与表单库 */}
        <div className="w-[280px] bg-white rounded-lg border border-[#ebeef5] flex flex-col shrink-0 overflow-hidden shadow-2xs">
          {/* Header */}
          <div className="p-3 border-b border-[#ebeef5] flex items-center justify-between bg-white">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1f2733]">
              <Folder className="w-4 h-4 text-[#1890ff]" />
              <span>业务模块与表单库</span>
            </div>
            <button
              type="button"
              onClick={() => setCreateModelModalOpen(true)}
              className="text-xs text-[#1890ff] hover:text-[#1579d4] font-medium flex items-center gap-0.5 cursor-pointer"
            >
              <span>+ 新建表单</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="p-2 border-b border-[#ebeef5] flex flex-wrap gap-1 bg-[#fafbfc]">
            {['全部表单', '协同工作', '流程资产', '流程设计', '流程运行', '流程挖掘', '权责管控', '风控合规', '组织系统'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#1890ff] text-white'
                    : 'bg-[#f4f4f5] text-[#606266] hover:bg-[#e9e9eb]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="p-2 border-b border-[#ebeef5]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索表单名、标识Key..."
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                className="w-full h-7 pl-8 pr-2 text-xs bg-[#f5f7fa] rounded border border-transparent focus:border-[#1890ff] focus:bg-white outline-none"
              />
              {modelSearch && (
                <button
                  type="button"
                  onClick={() => setModelSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#909399] hover:text-[#303133]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Form List Cards */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredForms.map((form) => {
              const isActive = form.formKey === activeFormKey;
              return (
                <div
                  key={form.formKey}
                  onClick={() => setActiveFormKey(form.formKey)}
                  className={`p-2.5 rounded-md border transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-[#ecf5ff] border-[#1890ff] shadow-xs'
                      : 'bg-white border-[#ebeef5] hover:border-[#b3d8ff] hover:bg-[#fafbfc]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span
                      className={`font-bold text-xs truncate ${
                        isActive ? 'text-[#1890ff]' : 'text-[#303133]'
                      }`}
                    >
                      {form.formName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#e6f7ff] text-[#1890ff] font-medium shrink-0">
                      {form.fields?.length || 0} 字段
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] mb-1">
                    <span className="font-mono text-[#606266] text-[10px] bg-[#f4f4f5] px-1 rounded">
                      {form.formKey}
                    </span>
                    <span className="text-[10px] px-1.5 rounded bg-[#f0f2f5] text-[#409eff]">
                      {form.moduleDomain}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#909399] line-clamp-1 leading-relaxed">
                    {form.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Bottom Summary Bar */}
          <div className="p-2.5 border-t border-[#ebeef5] bg-[#fafbfc] flex items-center justify-between text-[11px] text-[#909399]">
            <span>总计 {forms.length} 个业务表单</span>
            <span className="text-[#1890ff] font-medium">当前: {currentForm?.moduleDomain || '制度文件'}</span>
          </div>
        </div>

        {/* RIGHT MAIN WORKSPACE: ACTIVE FORM FIELD MANAGER */}
        <div className="flex-1 bg-white rounded-lg border border-[#ebeef5] flex flex-col min-w-0 overflow-hidden shadow-2xs">
          {/* Header Row */}
          <div className="p-3.5 border-b border-[#ebeef5] flex items-center justify-between gap-3 bg-white">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-[#1f2733] truncate">
                  {currentForm?.formName}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded border border-[#dcdfe6] text-[#606266] bg-[#fafbfc]">
                  {currentForm?.formKey}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#ecf5ff] text-[#409eff] font-medium">
                  {currentForm?.moduleDomain}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-[#f4f4f5] text-[#909399] font-mono">
                  {currentForm?.version}
                </span>
                {currentForm?.tag && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[#fdf6ec] text-[#e6a23c] border border-[#faecd8] font-medium">
                    {currentForm.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#909399] mt-1 truncate">
                {currentForm?.description} · 最后更新于 {currentForm?.updatedAt}
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddField}
              className="h-8 px-4 rounded-md bg-[#1890ff] hover:bg-[#1579d4] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加字段</span>
            </button>
          </div>

          {/* Section Tabs & Search Filter Row */}
          <div className="px-3.5 py-2 border-b border-[#ebeef5] flex flex-wrap items-center justify-between gap-2 bg-[#fafbfc]">
            {/* Section pills */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveSectionFilter('全部区块')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  activeSectionFilter === '全部区块'
                    ? 'bg-[#1890ff] text-white'
                    : 'bg-white border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa]'
                }`}
              >
                全部区块 ({sectionCounts.all})
              </button>

              <button
                type="button"
                onClick={() => setActiveSectionFilter('基础信息')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  activeSectionFilter === '基础信息'
                    ? 'bg-[#1890ff] text-white'
                    : 'bg-white border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa]'
                }`}
              >
                基础信息 ({sectionCounts.base})
              </button>

              <button
                type="button"
                onClick={() => setActiveSectionFilter('业务参数')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  activeSectionFilter === '业务参数'
                    ? 'bg-[#1890ff] text-white'
                    : 'bg-white border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa]'
                }`}
              >
                业务参数 ({sectionCounts.param})
              </button>

              <button
                type="button"
                onClick={() => setActiveSectionFilter('权责与审批')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  activeSectionFilter === '权责与审批'
                    ? 'bg-[#1890ff] text-white'
                    : 'bg-white border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa]'
                }`}
              >
                权责与审批 ({sectionCounts.duty})
              </button>

              <button
                type="button"
                onClick={() => setActiveSectionFilter('合规风控')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  activeSectionFilter === '合规风控'
                    ? 'bg-[#1890ff] text-white'
                    : 'bg-white border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa]'
                }`}
              >
                合规风控 ({sectionCounts.risk})
              </button>

              <button
                type="button"
                onClick={() => setActiveSectionFilter('扩展属性')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  activeSectionFilter === '扩展属性'
                    ? 'bg-[#1890ff] text-white'
                    : 'bg-white border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa]'
                }`}
              >
                扩展属性 ({sectionCounts.ext})
              </button>

              {/* Special condition buttons */}
              <button
                type="button"
                onClick={() => setOnlyRequiredFilter(!onlyRequiredFilter)}
                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ml-1.5 flex items-center gap-1 ${
                  onlyRequiredFilter
                    ? 'bg-[#fef0f0] text-[#f56c6c] border border-[#fde2e2]'
                    : 'bg-white border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa]'
                }`}
              >
                <span className="text-[#f56c6c] font-bold">*</span>
                <span>仅必填字段</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlyShowInListFilter(!onlyShowInListFilter)}
                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                  onlyShowInListFilter
                    ? 'bg-[#ecf5ff] text-[#1890ff] border border-[#d9ecff]'
                    : 'bg-white border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa]'
                }`}
              >
                <Eye className="w-3 h-3 text-[#1890ff]" />
                <span>仅列表展示</span>
              </button>
            </div>

            {/* Keyword Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="过滤字段Key、名称、类型..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-52 h-7 pl-8 pr-2 text-xs bg-white rounded border border-[#dcdfe6] focus:border-[#1890ff] outline-none"
              />
              {tableSearch && (
                <button
                  type="button"
                  onClick={() => setTableSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#909399] hover:text-[#303133]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* TABLE AREA */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#f8f9fb] text-[#606266] border-b border-[#ebeef5]">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">序号</th>
                  <th className="py-2.5 px-3 min-w-[140px]">字段标识 (Key)</th>
                  <th className="py-2.5 px-3 min-w-[150px]">显示名称 (Label)</th>
                  <th className="py-2.5 px-3 min-w-[110px]">组件类型</th>
                  <th className="py-2.5 px-3 w-20 text-center">布局占比</th>
                  <th className="py-2.5 px-3 w-24 text-center">所属区块</th>
                  <th className="py-2.5 px-3 w-20 text-center">必填约束</th>
                  <th className="py-2.5 px-3 w-20 text-center">列表展示</th>
                  <th className="py-2.5 px-3 min-w-[180px]">填写提示 / 选项池</th>
                  <th className="py-2.5 px-3 w-28 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebeef5] text-[#606266]">
                {filteredFields.map((field, idx) => {
                  const originalIdx = (currentForm?.fields || []).findIndex(
                    (f) => f.id === field.id
                  );
                  return (
                    <tr
                      key={field.id}
                      className="hover:bg-[#f5f7fa] transition-colors group"
                    >
                      {/* 序号 */}
                      <td className="py-2.5 px-3 text-center text-[#909399] font-mono">
                        {idx + 1}
                      </td>

                      {/* 字段标识 (Key) */}
                      <td className="py-2.5 px-3 font-mono text-xs text-[#1890ff]">
                        {field.fieldKey}
                      </td>

                      {/* 显示名称 (Label) */}
                      <td className="py-2.5 px-3 font-medium text-[#303133]">
                        <div className="flex items-center gap-1">
                          {field.required && <span className="text-[#f56c6c] font-bold">*</span>}
                          <span>{field.label}</span>
                        </div>
                      </td>

                      {/* 组件类型 */}
                      <td className="py-2.5 px-3">
                        {getFieldTypeVisual(field.type)}
                      </td>

                      {/* 布局占比 */}
                      <td className="py-2.5 px-3 text-center text-[11px] text-[#606266]">
                        {field.span === 24
                          ? '整行 (24)'
                          : field.span === 8
                          ? '1/3行 (8)'
                          : '半行 (12)'}
                      </td>

                      {/* 所属区块 */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[#f4f4f5] text-[#606266] font-medium">
                          {field.section}
                        </span>
                      </td>

                      {/* 必填约束 (Toggle Switch Red) */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleField(field, 'required')}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative inline-block ${
                            field.required ? 'bg-[#f56c6c]' : 'bg-[#dcdfe6]'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                              field.required ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* 列表展示 (Toggle Switch Blue) */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleField(field, 'showInList')}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative inline-block ${
                            field.showInList ? 'bg-[#1890ff]' : 'bg-[#dcdfe6]'
                          }`}
                        >
                          <span
                            className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                              field.showInList ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* 填写提示 / 选项池 */}
                      <td className="py-2.5 px-3 text-[11px] text-[#909399] max-w-xs truncate">
                        {field.options && field.options.length > 0 ? (
                          <span className="text-[#1890ff]">
                            {field.options.length} 个选项: {field.options.join(', ')}
                          </span>
                        ) : field.placeholder ? (
                          <span>{field.placeholder}</span>
                        ) : field.defaultValue !== undefined && field.defaultValue !== '' ? (
                          <span className="font-mono text-[#303133]">
                            默认: {String(field.defaultValue)}
                          </span>
                        ) : (
                          <span className="text-[#c0c4cc]">-</span>
                        )}
                      </td>

                      {/* 操作 Actions: Edit, Copy, Up, Down, Delete */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-[#1890ff]">
                          <button
                            type="button"
                            onClick={() => handleOpenEditField(field)}
                            className="p-1 rounded hover:bg-[#ecf5ff] cursor-pointer"
                            title="编辑字段"
                          >
                            <PenLine className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCloneField(field)}
                            className="p-1 rounded hover:bg-[#ecf5ff] cursor-pointer"
                            title="复制字段"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={originalIdx === 0}
                            onClick={() => handleMoveField(originalIdx, 'up')}
                            className="p-1 rounded hover:bg-[#ecf5ff] disabled:opacity-20 cursor-pointer text-[#606266]"
                            title="上移"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={originalIdx === (currentForm?.fields.length || 0) - 1}
                            onClick={() => handleMoveField(originalIdx, 'down')}
                            className="p-1 rounded hover:bg-[#ecf5ff] disabled:opacity-20 cursor-pointer text-[#606266]"
                            title="下移"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={field.isSystem}
                            onClick={() => handleDeleteField(field)}
                            className="p-1 rounded hover:bg-[#fef0f0] text-[#f56c6c] disabled:opacity-20 cursor-pointer"
                            title={field.isSystem ? '内置字段不可删除' : '删除字段'}
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

          {/* Table Bottom Status Bar */}
          <div className="px-4 py-2.5 border-t border-[#ebeef5] bg-[#fafbfc] flex items-center justify-between text-xs text-[#909399]">
            <div>
              当前展示 {filteredFields.length} / 共 {currentForm?.fields.length || 0} 个字段 · 必填项:{' '}
              {sectionCounts.required} 个 · 列表展示: {sectionCounts.showInList} 个
            </div>
            <div className="text-[11px] text-[#909399]">
              提示: 所有修改即时同步保存至表单引擎内核
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: AI 智能推荐生成字段 (Image 2) */}
      {/* ============================================================ */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#ebeef5] shadow-2xl w-full max-w-xl overflow-hidden animate-scaleIn flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#ebeef5] flex items-center justify-between bg-gradient-to-r from-[#7038e8] to-[#9055ff] text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-bold">AI 智能推荐生成字段</h3>
              </div>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Target Indicator */}
              <div className="text-xs text-[#606266]">
                当前目标表单: <span className="font-semibold text-[#1f2733]">{currentForm?.formName}</span>{' '}
                <span className="text-[#7038e8]">({currentForm?.moduleDomain})</span>
              </div>

              {/* Requirement Input */}
              <div className="space-y-1.5">
                <label className="block text-[#606266] font-medium">业务定制诉求与场景描述</label>
                <textarea
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="如: 我想在制度文件中增加法务合规审查结论、反洗钱合规评级、外聘律师事务所意见等扩展字段..."
                  className="w-full p-3 rounded-lg border border-[#dcdfe6] focus:border-[#7038e8] outline-none text-xs resize-none"
                />
              </div>

              {/* Generate Trigger Button */}
              <button
                type="button"
                disabled={aiLoading}
                onClick={handleRunAiGenerate}
                className="w-full h-9 rounded-lg bg-gradient-to-r from-[#7038e8] to-[#8b5cf6] hover:from-[#6029d5] hover:to-[#7c3aed] text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{aiLoading ? 'AI 正在智能分析并推导结构化字段...' : '开始智能推荐'}</span>
              </button>

              {/* Generated Fields Preview */}
              {aiGeneratedFields.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#ebeef5]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1f2733] flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-[#67c23a]" />
                      已生成 {aiGeneratedFields.length} 个推荐业务字段
                    </span>
                    <span className="text-[11px] text-[#909399]">勾选需要采纳的字段</span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto p-1">
                    {aiGeneratedFields.map((field, idx) => (
                      <label
                        key={idx}
                        className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          field.selected
                            ? 'bg-[#f7f2fe] border-[#d8b4fe]'
                            : 'bg-white border-[#ebeef5] hover:bg-[#fafbfc]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={field.selected}
                            onChange={(e) => {
                              const updated = [...aiGeneratedFields];
                              updated[idx].selected = e.target.checked;
                              setAiGeneratedFields(updated);
                            }}
                            className="accent-[#7038e8] w-4 h-4"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-medium text-[#303133]">
                              <span>{field.label}</span>
                              <span className="font-mono text-[10px] text-[#7038e8] bg-white px-1 rounded border border-[#e9d5ff]">
                                {field.fieldKey}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#909399] truncate">{field.placeholder || field.tooltip || '标准扩展业务属性'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f4f4f5] text-[#606266]">
                            {field.section}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ecf5ff] text-[#1890ff]">
                            {field.type}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-[#ebeef5] bg-[#fafbfc] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="h-8 px-4 rounded-md border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={aiGeneratedFields.filter((f) => f.selected).length === 0}
                onClick={handleAdoptAiFields}
                className="h-8 px-5 rounded-md bg-[#7038e8] hover:bg-[#6029d5] text-white font-medium cursor-pointer shadow-xs disabled:opacity-40"
              >
                采纳并追加至表单
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: 添加新表单字段 (Image 3) */}
      {/* ============================================================ */}
      {addFieldModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#ebeef5] shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn">
            {/* Header */}
            <div className="px-6 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-white">
              <h3 className="text-sm font-bold text-[#1f2733]">
                {editingFieldId ? '编辑表单字段' : '添加新表单字段'}
              </h3>
              <button
                type="button"
                onClick={() => setAddFieldModalOpen(false)}
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveFieldForm} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Field Key & Label */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#303133] font-medium mb-1">
                    <span className="text-[#f56c6c]">*</span> 字段英文标识 (Key)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="如: docLevel, approverUser"
                    value={fieldFormData.fieldKey}
                    onChange={(e) =>
                      setFieldFormData({ ...fieldFormData, fieldKey: e.target.value })
                    }
                    className="w-full h-8 px-3 rounded border border-[#dcdfe6] focus:border-[#1890ff] outline-none font-mono"
                  />
                  <span className="text-[10px] text-[#909399] mt-0.5 block">
                    仅支持英文字母、数字、下划线，作为系统数据字段Key
                  </span>
                </div>

                <div>
                  <label className="block text-[#303133] font-medium mb-1">
                    <span className="text-[#f56c6c]">*</span> 显示中文名称 (Label)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="如: 制度层级、审批决策人"
                    value={fieldFormData.label}
                    onChange={(e) =>
                      setFieldFormData({ ...fieldFormData, label: e.target.value })
                    }
                    className="w-full h-8 px-3 rounded border border-[#dcdfe6] focus:border-[#1890ff] outline-none"
                  />
                  <span className="text-[10px] text-[#909399] mt-0.5 block">
                    表单界面和数据列表表面呈现的中文名称
                  </span>
                </div>
              </div>

              {/* Component Types: 16 selectable grid buttons */}
              <div>
                <label className="block text-[#303133] font-medium mb-2">
                  <span className="text-[#f56c6c]">*</span> 组件类型 (Type)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COMPONENT_TYPES.map((comp) => {
                    const isSelected = fieldFormData.type === comp.id;
                    const Icon = comp.icon;
                    return (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() =>
                          setFieldFormData({
                            ...fieldFormData,
                            type: comp.id,
                            span: comp.id === 'textarea' || comp.id === 'richText' || comp.id === 'upload' ? 24 : 12,
                          })
                        }
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                          isSelected
                            ? 'bg-[#ecf5ff] border-[#1890ff] text-[#1890ff] shadow-2xs'
                            : 'bg-white border-[#ebeef5] hover:border-[#b3d8ff] text-[#303133]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-xs">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#1890ff]' : 'text-[#909399]'}`} />
                          <span>{comp.label}</span>
                        </div>
                        <span className="text-[10px] text-[#909399] line-clamp-1">
                          {comp.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Options Editor if select / multiSelect / radio / checkbox */}
              {['select', 'multiSelect', 'radio', 'checkbox'].includes(fieldFormData.type || '') && (
                <div className="p-3 bg-[#fafbfc] rounded-lg border border-[#ebeef5] space-y-1.5">
                  <label className="block text-[#303133] font-medium">
                    枚举候选选项池 (每行一个选项)
                  </label>
                  <textarea
                    rows={3}
                    value={rawOptionText}
                    onChange={(e) => setRawOptionText(e.target.value)}
                    placeholder="输入候选选项，每行一个&#10;选项一&#10;选项二"
                    className="w-full p-2.5 rounded border border-[#dcdfe6] focus:border-[#1890ff] outline-none bg-white text-xs font-mono resize-none"
                  />
                </div>
              )}

              {/* Span & Section Dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#303133] font-medium mb-1">
                    栅格排版宽度 (Span)
                  </label>
                  <select
                    value={fieldFormData.span || 12}
                    onChange={(e) =>
                      setFieldFormData({ ...fieldFormData, span: Number(e.target.value) })
                    }
                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#1890ff] outline-none bg-white"
                  >
                    <option value={12}>半行 50% (12 栅格 - 标准常规项，默认推荐)</option>
                    <option value={24}>整行 100% (24 栅格 - 宽屏描述及正文)</option>
                    <option value={8}>1/3行 33% (8 栅格 - 紧凑并排录入)</option>
                    <option value={6}>1/4行 25% (6 栅格 - 超紧凑四列)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#303133] font-medium mb-1">
                    所属表单区块 (Section)
                  </label>
                  <select
                    value={fieldFormData.section || '基础信息'}
                    onChange={(e) =>
                      setFieldFormData({ ...fieldFormData, section: e.target.value as any })
                    }
                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#1890ff] outline-none bg-white"
                  >
                    <option value="基础信息">基础信息</option>
                    <option value="业务参数">业务参数</option>
                    <option value="权责与审批">权责与审批</option>
                    <option value="合规风控">合规风控</option>
                    <option value="扩展属性">扩展属性</option>
                  </select>
                </div>
              </div>

              {/* Placeholder & Tooltip */}
              <div>
                <label className="block text-[#303133] font-medium mb-1">
                  输入占位提示文案 (Placeholder)
                </label>
                <input
                  type="text"
                  placeholder="如: 请输入制度全称..."
                  value={fieldFormData.placeholder || ''}
                  onChange={(e) =>
                    setFieldFormData({ ...fieldFormData, placeholder: e.target.value })
                  }
                  className="w-full h-8 px-3 rounded border border-[#dcdfe6] focus:border-[#1890ff] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#303133] font-medium mb-1">
                  填写帮助说明 (Help Text)
                </label>
                <input
                  type="text"
                  placeholder="如: 必须符合发文红头文件规范要求"
                  value={fieldFormData.tooltip || ''}
                  onChange={(e) =>
                    setFieldFormData({ ...fieldFormData, tooltip: e.target.value })
                  }
                  className="w-full h-8 px-3 rounded border border-[#dcdfe6] focus:border-[#1890ff] outline-none"
                />
              </div>

              {/* Checkboxes: Required & Show in List */}
              <div className="pt-2 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldFormData.required || false}
                    onChange={(e) =>
                      setFieldFormData({ ...fieldFormData, required: e.target.checked })
                    }
                    className="accent-[#f56c6c] w-4 h-4"
                  />
                  <span className="text-[#303133] font-medium">设为必填项 (Required)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldFormData.showInList ?? true}
                    onChange={(e) =>
                      setFieldFormData({ ...fieldFormData, showInList: e.target.checked })
                    }
                    className="accent-[#1890ff] w-4 h-4"
                  />
                  <span className="text-[#303133] font-medium">在数据表格列中展示 (Show in List)</span>
                </label>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#ebeef5]">
                <button
                  type="button"
                  onClick={() => setAddFieldModalOpen(false)}
                  className="h-8 px-4 rounded-md border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="h-8 px-5 rounded-md bg-[#1890ff] hover:bg-[#1579d4] text-white font-medium cursor-pointer shadow-xs"
                >
                  保存字段
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: 表单 JSON Schema 架构导入 / 导出 (Image 4) */}
      {/* ============================================================ */}
      {schemaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#ebeef5] shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden animate-scaleIn">
            <div className="px-6 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-[#1890ff]" />
                <h3 className="text-sm font-bold text-[#1f2733]">
                  表单 JSON Schema 架构导入 / 导出
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(false)}
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden space-y-3">
              <p className="text-xs text-[#606266]">
                可通过复制或直接编辑以下 JSON 规范进行快速批量导入或离线迁移:
              </p>

              {schemaError && (
                <div className="p-2 bg-[#fef0f0] border border-[#fde2e2] rounded text-xs text-[#f56c6c]">
                  {schemaError}
                </div>
              )}

              <div className="flex-1 min-h-[300px] overflow-hidden rounded-lg border border-[#333]">
                <textarea
                  value={schemaText}
                  onChange={(e) => setSchemaText(e.target.value)}
                  className="w-full h-full p-4 font-mono text-xs bg-[#0f172a] text-[#38bdf8] outline-none resize-none leading-relaxed selection:bg-[#334155]"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-[#ebeef5] bg-[#fafbfc] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(schemaText);
                  showToast('已复制完整 Schema JSON 到剪贴板', 'success');
                }}
                className="h-8 px-4 rounded-md border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-xs text-[#606266] flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>复制 JSON</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSchemaModalOpen(false)}
                  className="h-8 px-4 rounded-md border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa] text-xs cursor-pointer"
                >
                  关闭
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchemaModal}
                  className="h-8 px-4 rounded-md bg-[#1890ff] hover:bg-[#1579d4] text-white text-xs font-medium cursor-pointer shadow-xs"
                >
                  保存并导入 Schema
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: 表单动态运行时预览 (Image 5) */}
      {/* ============================================================ */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div
            className={`bg-white rounded-xl border border-[#ebeef5] shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
              previewDevice === 'mobile' ? 'w-[420px] h-[85vh]' : 'w-full max-w-4xl h-[90vh]'
            }`}
          >
            {/* Modal Header with Device and Mode Segmented Controls */}
            <div className="px-6 py-3 border-b border-[#ebeef5] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2 font-bold text-sm text-[#1f2733] truncate">
                <Eye className="w-4 h-4 text-[#1890ff]" />
                <span className="truncate">表单动态运行时预览 · {currentForm?.formName}</span>
              </div>

              {/* Segmented Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Device switch */}
                <div className="flex items-center bg-[#f0f2f5] p-0.5 rounded-md text-xs text-[#606266]">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('pc')}
                    className={`px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                      previewDevice === 'pc' ? 'bg-white font-bold text-[#1890ff] shadow-2xs' : ''
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>PC大屏</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${
                      previewDevice === 'mobile' ? 'bg-white font-bold text-[#1890ff] shadow-2xs' : ''
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>移动端</span>
                  </button>
                </div>

                {/* View Mode switch */}
                <div className="flex items-center bg-[#f0f2f5] p-0.5 rounded-md text-xs text-[#606266]">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('form')}
                    className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                      previewMode === 'form' ? 'bg-white font-bold text-[#1890ff] shadow-2xs' : ''
                    }`}
                  >
                    表单界面
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('json')}
                    className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                      previewMode === 'json' ? 'bg-white font-bold text-[#1890ff] shadow-2xs' : ''
                    }`}
                  >
                    采集数据 JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('schema')}
                    className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                      previewMode === 'schema' ? 'bg-white font-bold text-[#1890ff] shadow-2xs' : ''
                    }`}
                  >
                    架构 Schema
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="text-[#909399] hover:text-[#303133] p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Subheader Toolbar */}
            <div className="px-6 py-2 border-b border-[#ebeef5] bg-[#fafbfc] flex items-center justify-between text-xs text-[#606266] shrink-0">
              <div>包含 {currentForm?.fields.length || 0} 个配置字段，支持字段完整联动校验</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillTestData}
                  className="px-3 py-1 rounded border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-xs text-[#1890ff] cursor-pointer"
                >
                  一键填入测试数据
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewFormValues({});
                    setPreviewErrors({});
                    showToast('已清空表单输入数据', 'info');
                  }}
                  className="px-3 py-1 rounded border border-[#dcdfe6] bg-white hover:bg-[#f5f7fa] text-xs text-[#606266] cursor-pointer"
                >
                  清空表单
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fb]">
              {previewMode === 'form' && (
                <div className="space-y-6">
                  {Object.entries(groupedSections).map(([secName, secFields]) => {
                    if (secFields.length === 0) return null;
                    return (
                      <div
                        key={secName}
                        className="bg-white rounded-lg border border-[#ebeef5] p-5 shadow-2xs space-y-4"
                      >
                        {/* Section Header with blue bar */}
                        <div className="flex items-center gap-2 border-b border-[#ebeef5] pb-2.5">
                          <span className="w-1 h-3.5 bg-[#1890ff] rounded-full"></span>
                          <h4 className="text-xs font-bold text-[#1f2733]">{secName}</h4>
                        </div>

                        {/* Fields Grid */}
                        <div
                          className={`grid gap-4 ${
                            previewDevice === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'
                          }`}
                        >
                          {secFields.map((field) => {
                            const isFull =
                              previewDevice === 'mobile'
                                ? true
                                : field.span === 24 || field.type === 'textarea' || field.type === 'richText' || field.type === 'upload';
                            const val = previewFormValues[field.fieldKey] ?? '';
                            const err = previewErrors[field.fieldKey];

                            const setVal = (v: any) => {
                              setPreviewFormValues((prev) => ({ ...prev, [field.fieldKey]: v }));
                              if (previewErrors[field.fieldKey]) {
                                setPreviewErrors((prev) => {
                                  const copy = { ...prev };
                                  delete copy[field.fieldKey];
                                  return copy;
                                });
                              }
                            };

                            return (
                              <div
                                key={field.id}
                                className={`${isFull ? 'col-span-2' : 'col-span-1'} space-y-1.5`}
                              >
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-semibold text-[#303133] flex items-center gap-1">
                                    {field.required && (
                                      <span className="text-[#f56c6c] font-bold">*</span>
                                    )}
                                    <span>{field.label}</span>
                                    {field.tooltip && (
                                      <span
                                        title={field.tooltip}
                                        className="text-[#909399] cursor-help"
                                      >
                                        <HelpCircle className="w-3 h-3 inline" />
                                      </span>
                                    )}
                                  </label>
                                  <span className="font-mono text-[10px] text-[#909399]">
                                    {field.fieldKey}
                                  </span>
                                </div>

                                {/* Control Input */}
                                {field.type === 'input' && (
                                  <input
                                    type="text"
                                    value={val}
                                    placeholder={field.placeholder || `请输入${field.label}`}
                                    onChange={(e) => setVal(e.target.value)}
                                    className={`w-full h-8 px-3 text-xs rounded border outline-none bg-white ${
                                      err ? 'border-[#f56c6c]' : 'border-[#dcdfe6] focus:border-[#1890ff]'
                                    }`}
                                  />
                                )}

                                {field.type === 'textarea' && (
                                  <textarea
                                    rows={3}
                                    value={val}
                                    placeholder={field.placeholder || `请输入${field.label}`}
                                    onChange={(e) => setVal(e.target.value)}
                                    className={`w-full p-2.5 text-xs rounded border outline-none bg-white resize-none ${
                                      err ? 'border-[#f56c6c]' : 'border-[#dcdfe6] focus:border-[#1890ff]'
                                    }`}
                                  />
                                )}

                                {field.type === 'richText' && (
                                  <textarea
                                    rows={4}
                                    value={val}
                                    placeholder={field.placeholder || '输入或粘贴富文本条款正文...'}
                                    onChange={(e) => setVal(e.target.value)}
                                    className={`w-full p-2.5 text-xs rounded border outline-none bg-white font-mono ${
                                      err ? 'border-[#f56c6c]' : 'border-[#dcdfe6] focus:border-[#1890ff]'
                                    }`}
                                  />
                                )}

                                {field.type === 'select' && (
                                  <select
                                    value={val}
                                    onChange={(e) => setVal(e.target.value)}
                                    className={`w-full h-8 px-2.5 text-xs rounded border outline-none bg-white ${
                                      err ? 'border-[#f56c6c]' : 'border-[#dcdfe6] focus:border-[#1890ff]'
                                    }`}
                                  >
                                    <option value="">-- 请选择所属业务项 --</option>
                                    {(field.options || []).map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                {field.type === 'deptPicker' && (
                                  <select
                                    value={val}
                                    onChange={(e) => setVal(e.target.value)}
                                    className="w-full h-8 px-2.5 text-xs rounded border border-[#dcdfe6] focus:border-[#1890ff] outline-none bg-white"
                                  >
                                    <option value="">点击组织架构归口部门...</option>
                                    <option value="质量合规部">质量合规部</option>
                                    <option value="研发中心/软件部">研发中心/软件部</option>
                                    <option value="财务与资金管理中心">财务与资金管理中心</option>
                                    <option value="供应链采购部">供应链采购部</option>
                                    <option value="战略运营与总裁办">战略运营与总裁办</option>
                                  </select>
                                )}

                                {field.type === 'userPicker' && (
                                  <PersonSelectField
                                    value={val || ''}
                                    onChange={(newVal) => setVal(newVal)}
                                    placeholder={field.placeholder || '搜索或点选企业员工/审批人...'}
                                    modalTitle={`选择${field.label}`}
                                    modalDescription="支持手工输入中英文姓名或从组织架构部门挑选人员"
                                    className="w-full text-xs"
                                    showToast={showToast}
                                  />
                                )}

                                {field.type === 'date' && (
                                  <input
                                    type="date"
                                    value={val}
                                    onChange={(e) => setVal(e.target.value)}
                                    className="w-full h-8 px-3 text-xs rounded border border-[#dcdfe6] focus:border-[#1890ff] outline-none bg-white"
                                  />
                                )}

                                {field.type === 'switch' && (
                                  <div className="flex items-center gap-3 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setVal(!val)}
                                      className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative ${
                                        val ? 'bg-[#1890ff]' : 'bg-[#dcdfe6]'
                                      }`}
                                    >
                                      <span
                                        className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                                          val ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                    <span className="text-xs text-[#606266]">
                                      {val ? '开启' : '关闭'}
                                    </span>
                                  </div>
                                )}

                                {field.type === 'upload' && (
                                  <div className="p-3.5 border-2 border-dashed border-[#dcdfe6] rounded-lg bg-[#fafbfc] text-center hover:border-[#1890ff] transition-colors cursor-pointer">
                                    <Upload className="w-5 h-5 text-[#909399] mx-auto mb-1" />
                                    <p className="text-xs text-[#303133]">
                                      点击上传或拖拽红头附件材料
                                    </p>
                                    <span className="text-[10px] text-[#909399]">
                                      支持 PDF/DOCX，上限 50MB
                                    </span>
                                  </div>
                                )}

                                {err && (
                                  <p className="text-[11px] text-[#f56c6c] flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{err}</span>
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {previewMode === 'json' && (
                <div className="bg-[#0f172a] text-[#38bdf8] p-4 rounded-lg font-mono text-xs overflow-auto h-full">
                  <pre>{JSON.stringify(previewFormValues, null, 2)}</pre>
                </div>
              )}

              {previewMode === 'schema' && (
                <div className="bg-[#0f172a] text-[#a78bfa] p-4 rounded-lg font-mono text-xs overflow-auto h-full">
                  <pre>{JSON.stringify(currentForm, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-[#ebeef5] bg-white flex items-center justify-between shrink-0">
              <span className="text-xs text-[#909399]">
                模拟实时环境渲染，点击提交可模拟真实业务数据校验
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="h-8 px-4 rounded-md border border-[#dcdfe6] text-[#606266] text-xs hover:bg-[#f5f7fa] cursor-pointer"
                >
                  关闭
                </button>
                <button
                  type="button"
                  onClick={handleValidatePreview}
                  className="h-8 px-5 rounded-md bg-[#1890ff] hover:bg-[#1579d4] text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  提交测试验证
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: 创建新业务模块表单 (Image 6) */}
      {/* ============================================================ */}
      {createModelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#ebeef5] shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="px-6 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-white">
              <h3 className="text-sm font-bold text-[#1f2733]">创建新业务模块表单</h3>
              <button
                type="button"
                onClick={() => setCreateModelModalOpen(false)}
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateModel} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[#303133] font-medium mb-1">
                  <span className="text-[#f56c6c]">*</span> 表单英文唯一标识 (Form Key)
                </label>
                <input
                  type="text"
                  required
                  placeholder="如: form_custom_project, form_it_audit"
                  value={createModelData.formKey}
                  onChange={(e) =>
                    setCreateModelData({ ...createModelData, formKey: e.target.value })
                  }
                  className="w-full h-8 px-3 rounded border border-[#dcdfe6] focus:border-[#1890ff] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[#303133] font-medium mb-1">
                  <span className="text-[#f56c6c]">*</span> 表单中文全称 (Form Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="如: IT项目投资合规审批单"
                  value={createModelData.formName}
                  onChange={(e) =>
                    setCreateModelData({ ...createModelData, formName: e.target.value })
                  }
                  className="w-full h-8 px-3 rounded border border-[#dcdfe6] focus:border-[#1890ff] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#303133] font-medium mb-1">
                  <span className="text-[#f56c6c]">*</span> 所属业务模块域 (Module Domain)
                </label>
                <select
                  value={createModelData.moduleDomain}
                  onChange={(e) =>
                    setCreateModelData({ ...createModelData, moduleDomain: e.target.value })
                  }
                  className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#1890ff] outline-none bg-white"
                >
                  <option value="协同工作 (任务流转与流程培训)">协同工作 (任务流转与流程培训)</option>
                  <option value="流程资产 (主干架构与概览图谱)">流程资产 (主干架构与概览图谱)</option>
                  <option value="流程设计 (画板建模与废止归档)">流程设计 (画板建模与废止归档)</option>
                  <option value="流程运行 (工单流转与实例调度)">流程运行 (工单流转与实例调度)</option>
                  <option value="流程挖掘 (日志接入与挖掘分析)">流程挖掘 (日志接入与挖掘分析)</option>
                  <option value="权责管控 (权责清单与授权矩阵)">权责管控 (权责清单与授权矩阵)</option>
                  <option value="风控合规 (合规制度与KCP控制)">风控合规 (合规制度与KCP控制)</option>
                  <option value="组织系统 (组织架构与系统配置)">组织系统 (组织架构与系统配置)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#303133] font-medium mb-1">表单业务职责描述</label>
                <textarea
                  rows={3}
                  placeholder="阐明此表单的应用场景与管理边界..."
                  value={createModelData.description}
                  onChange={(e) =>
                    setCreateModelData({ ...createModelData, description: e.target.value })
                  }
                  className="w-full p-2.5 rounded border border-[#dcdfe6] focus:border-[#1890ff] outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[#303133] font-medium mb-1">初始字段模版</label>
                <select
                  value={createModelData.template}
                  onChange={(e) =>
                    setCreateModelData({ ...createModelData, template: e.target.value })
                  }
                  className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#1890ff] outline-none bg-white"
                >
                  <option value="空白表单 (预置编码、名称、备注3个基本项)">
                    空白表单 (预置编码、名称、备注3个基本项)
                  </option>
                  <option value="标准制度管理单据模版">标准制度管理单据模版</option>
                  <option value="风控与合规审查模版">风控与合规审查模版</option>
                  <option value="流程审批申请模版">流程审批申请模版</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#ebeef5]">
                <button
                  type="button"
                  onClick={() => setCreateModelModalOpen(false)}
                  className="h-8 px-4 rounded-md border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="h-8 px-5 rounded-md bg-[#1890ff] hover:bg-[#1579d4] text-white font-medium cursor-pointer shadow-xs"
                >
                  创建表单
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 6: 字段删除确认对话框 (替代 iframe 阻断的 window.confirm) */}
      {/* ============================================================ */}
      {deleteFieldConfirm.visible && deleteFieldConfirm.field && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#ebeef5] shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-[#ebeef5] flex items-center justify-between bg-[#fffaf8]">
              <div className="flex items-center gap-2.5 text-[#f56c6c]">
                <div className="w-8 h-8 rounded-full bg-[#fef0f0] border border-[#fde2e2] flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-[#f56c6c]" />
                </div>
                <h3 className="text-sm font-bold text-[#1f2733]">确认删除字段？</h3>
              </div>
              <button
                type="button"
                disabled={isDeletingField}
                onClick={() => setDeleteFieldConfirm({ visible: false, field: null })}
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 text-xs space-y-4">
              <p className="text-[#606266] leading-relaxed">
                您即将从当前表单模型 <span className="font-semibold text-[#1f2733]">【{currentForm?.formName}】</span> 中删除字段：
              </p>

              <div className="p-3.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#909399]">字段显示名称:</span>
                  <span className="font-bold text-[#1f2733] text-sm">{deleteFieldConfirm.field.label}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#909399]">字段键名 (Field Key):</span>
                  <code className="text-[#1890ff] font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    {deleteFieldConfirm.field.fieldKey}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#909399]">所属区块:</span>
                  <span className="text-[#606266]">{deleteFieldConfirm.field.section}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#909399]">控件类型:</span>
                  <span className="text-[#606266]">{deleteFieldConfirm.field.type}</span>
                </div>
              </div>

              <div className="p-3 bg-[#fef0f0] rounded-lg border border-[#fde2e2] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#f56c6c] shrink-0 mt-0.5" />
                <span className="text-[11px] text-[#f56c6c] leading-relaxed">
                  警告：删除字段后，该表单在流程运行、制度归档及前台录入中将不再渲染该字段。此操作不可逆，请谨慎确认。
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#ebeef5]">
                <button
                  type="button"
                  disabled={isDeletingField}
                  onClick={() => setDeleteFieldConfirm({ visible: false, field: null })}
                  className="h-8 px-4 rounded-md border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa] cursor-pointer transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={isDeletingField}
                  onClick={handleConfirmDeleteField}
                  className="h-8 px-5 rounded-md bg-[#f56c6c] hover:bg-[#e05656] text-white font-medium cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingField ? '正在删除...' : '确认删除字段'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 7: 恢复默认配置确认对话框 */}
      {/* ============================================================ */}
      {resetDefaultsConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#ebeef5] shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-[#ebeef5] flex items-center justify-between bg-[#fffcf5]">
              <div className="flex items-center gap-2.5 text-[#e6a23c]">
                <div className="w-8 h-8 rounded-full bg-[#fdf6ec] border border-[#faecd8] flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-[#e6a23c]" />
                </div>
                <h3 className="text-sm font-bold text-[#1f2733]">恢复系统出厂规范？</h3>
              </div>
              <button
                type="button"
                disabled={isResettingDefaults}
                onClick={() => setResetDefaultsConfirm(false)}
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 text-xs space-y-4">
              <p className="text-[#606266] leading-relaxed">
                确定要将所有表单模型与字段定义重置为系统出厂默认规范吗？所有自定义字段将被重置为官方预置标准。
              </p>

              <div className="p-3 bg-[#fdf6ec] rounded-lg border border-[#faecd8] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#e6a23c] shrink-0 mt-0.5" />
                <span className="text-[11px] text-[#e6a23c] leading-relaxed">
                  提示：该操作将恢复 10 大核心业务表单（制度、风控、流程资产等）的预置字段结构。
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#ebeef5]">
                <button
                  type="button"
                  disabled={isResettingDefaults}
                  onClick={() => setResetDefaultsConfirm(false)}
                  className="h-8 px-4 rounded-md border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa] cursor-pointer transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={isResettingDefaults}
                  onClick={handleConfirmResetDefaults}
                  className="h-8 px-5 rounded-md bg-[#e6a23c] hover:bg-[#d4922f] text-white font-medium cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isResettingDefaults ? '正在重置...' : '确认恢复出厂规范'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
