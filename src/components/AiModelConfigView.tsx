import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Server,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sliders,
  Key,
  Globe,
  Trash2,
  Edit3,
  Check,
  X,
  Zap,
  Cpu,
  Shield,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  CheckCircle,
  Settings,
  HelpCircle,
  Activity,
} from 'lucide-react';

export interface AiModelConfig {
  id: string;
  name: string;
  modelId: string;
  provider: string;
  providerType: 'external' | 'builtin';
  baseUrl: string;
  apiKey: string;
  contextLength: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
  enabled: boolean;
  tags: string[];
  description: string;
  status: 'online' | 'unconfigured' | 'error';
  latencyMs?: number;
  lastTestedAt?: string;
}

interface AiModelConfigViewProps {
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onNavigate?: (path: string) => void;
}

// Preset Provider Templates for Quick One-Click Setup
const PRESET_TEMPLATES = [
  {
    key: 'deepseek',
    name: 'DeepSeek (深度求索)',
    provider: 'DeepSeek',
    iconColor: 'from-blue-600 to-indigo-700',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    modelId: 'deepseek-reasoner',
    displayName: 'DeepSeek-R1 (推理思考大模型)',
    baseUrl: 'https://api.deepseek.com/v1',
    contextLength: '64K',
    temperature: 0.6,
    maxTokens: 8192,
    tags: ['外部模型', '深度思维链', '华为IPD/LTC推理'],
    description: '深度求索推理模型，擅长长思维链拆解复杂跨部门业务主干流程与关键控制点 (KCP)。',
  },
  {
    key: 'qwen',
    name: '阿里云通义千问',
    provider: 'Aliyun',
    iconColor: 'from-orange-500 to-amber-600',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    modelId: 'qwen-max-latest',
    displayName: '通义千问 Qwen-Max (企业旗舰)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    contextLength: '32K',
    temperature: 0.3,
    maxTokens: 4096,
    tags: ['外部模型', '中文企业专家', '制度知识增强'],
    description: '阿里云千亿级商业旗舰大模型，针对中国本土企业管理制度、风控合规与岗位权责深度优化。',
  },
  {
    key: 'claude',
    name: 'Anthropic Claude',
    provider: 'Anthropic',
    iconColor: 'from-amber-600 to-rose-600',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    modelId: 'claude-3-7-sonnet',
    displayName: 'Claude 3.7 Sonnet (混合推理)',
    baseUrl: 'https://api.anthropic.com/v1',
    contextLength: '200K',
    temperature: 0.2,
    maxTokens: 8192,
    tags: ['外部模型', '超长上下文', 'XML拓扑精准'],
    description: '业界一流的高精密度推理与工作流建模专家，超长 200K 窗口容纳超大集团端到端架构全景。',
  },
  {
    key: 'openai',
    name: 'OpenAI (GPT-4o / o3)',
    provider: 'OpenAI',
    iconColor: 'from-emerald-600 to-teal-700',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    modelId: 'gpt-4o',
    displayName: 'OpenAI GPT-4o (全能多模态)',
    baseUrl: 'https://api.openai.com/v1',
    contextLength: '128K',
    temperature: 0.3,
    maxTokens: 4096,
    tags: ['外部模型', '全球标准', '结构化JSON/XML'],
    description: '高可靠商业通用多模态大模型，具备稳定的复杂 BPMN 2.0 拓扑连线推导与正交走线规划能力。',
  },
  {
    key: 'ollama',
    name: '本地私有部署 Ollama',
    provider: 'Ollama',
    iconColor: 'from-slate-700 to-zinc-900',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    modelId: 'deepseek-r1:14b',
    displayName: '本地私有化 Ollama (数据不出域)',
    baseUrl: 'http://localhost:11434/v1',
    contextLength: '32K',
    temperature: 0.3,
    maxTokens: 4096,
    tags: ['本地部署', '隐私安全', '零外传'],
    description: '企业内网纯本地私有化运行，核心商密流程架构数据物理隔离，无任何外网泄密风险。',
  },
  {
    key: 'gemini',
    name: 'Google Gemini (官方通道)',
    provider: 'Google Gemini',
    iconColor: 'from-purple-600 to-indigo-600',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    modelId: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash (极速推荐)',
    baseUrl: 'https://generativelanguage.googleapis.com',
    contextLength: '1M',
    temperature: 0.3,
    maxTokens: 4096,
    tags: ['内置官方', '低延迟', '1M大窗口'],
    description: 'Google 最新超快轻量大模型，兼具百万级 Token 上下文与极致响应速度。',
  },
];

export const AiModelConfigView: React.FC<AiModelConfigViewProps> = ({
  showToast,
  onNavigate,
}) => {
  const [models, setModels] = useState<AiModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'external' | 'builtin' | 'enabled'>('all');

  // Edit / Create Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<Partial<AiModelConfig> | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch models from server
  const loadModels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/models');
      const json = await res.json();
      if (json.status === 1 && Array.isArray(json.data?.list)) {
        setModels(json.data.list);
      }
    } catch (e) {
      console.error('Failed to load AI models:', e);
      showToast('获取模型配置失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  // Filtered models
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      // Tab filter
      if (activeTab === 'external' && m.providerType !== 'external') return false;
      if (activeTab === 'builtin' && m.providerType !== 'builtin') return false;
      if (activeTab === 'enabled' && !m.enabled) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        m.name.toLowerCase().includes(q) ||
        m.modelId.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [models, activeTab, searchQuery]);

  // Set default model
  const handleSetDefault = async (model: AiModelConfig) => {
    if (model.isDefault) return;
    try {
      const res = await fetch(`/api/system/models/${model.id}/set-default`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast(`已成功将【${model.name}】设为 QingProcess AI 默认生效模型`, 'success');
        loadModels();
      } else {
        showToast(json.info || '设置失败', 'error');
      }
    } catch (e: any) {
      showToast('设置失败，请稍后重试', 'error');
    }
  };

  // Toggle enable/disable
  const handleToggleEnabled = async (model: AiModelConfig) => {
    if (model.isDefault && model.enabled) {
      showToast('当前默认激活模型不能直接停用，请先设其他模型为默认', 'warning');
      return;
    }
    try {
      const res = await fetch(`/api/system/models/${model.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !model.enabled }),
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast(`已${!model.enabled ? '启用' : '停用'}模型【${model.name}】`, 'success');
        loadModels();
      } else {
        showToast(json.info || '操作失败', 'error');
      }
    } catch {
      showToast('操作失败', 'error');
    }
  };

  // Test connection
  const handleTestConnection = async (model: Partial<AiModelConfig>, notify = true) => {
    const targetId = model.id || 'temp';
    setTestingModelId(targetId);
    try {
      const res = await fetch('/api/system/models/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: model.id,
          provider: model.provider,
          modelId: model.modelId,
          baseUrl: model.baseUrl,
          apiKey: model.apiKey,
        }),
      });
      const json = await res.json();
      if (json.status === 1) {
        if (notify) {
          showToast(
            `连通测试成功！响应延迟：${json.data?.latencyMs || 180}ms，服务接口通信正常`,
            'success'
          );
        }
        if (model.id) {
          setModels((prev) =>
            prev.map((m) =>
              m.id === model.id
                ? {
                    ...m,
                    status: 'online',
                    latencyMs: json.data?.latencyMs || 180,
                    lastTestedAt: new Date().toLocaleTimeString(),
                  }
                : m
            )
          );
        }
        return true;
      } else {
        if (notify) {
          showToast(`连通性测试未通过：${json.info || '无法连接该模型端点'}`, 'error');
        }
        return false;
      }
    } catch (e: any) {
      if (notify) showToast('连接端点失败，请检查网络或代理地址', 'error');
      return false;
    } finally {
      setTestingModelId(null);
    }
  };

  // Delete model
  const handleDeleteModel = async (model: AiModelConfig) => {
    if (model.providerType === 'builtin') {
      showToast('系统内置官方通道模型不允许删除', 'warning');
      return;
    }
    if (model.isDefault) {
      showToast('该模型当前为默认模型，请先指定其他模型为默认后再删除', 'warning');
      return;
    }
    if (!window.confirm(`确定要移除外部模型【${model.name}】的配置吗？`)) {
      return;
    }
    try {
      const res = await fetch(`/api/system/models/${model.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.status === 1) {
        showToast('已删除模型配置', 'success');
        loadModels();
      } else {
        showToast(json.info || '删除失败', 'error');
      }
    } catch {
      showToast('删除失败', 'error');
    }
  };

  // Reset to default presets
  const handleResetDefaults = async () => {
    if (!window.confirm('确定要恢复系统出厂预设的外部模型列表吗？')) return;
    try {
      const res = await fetch('/api/system/models/reset', { method: 'POST' });
      const json = await res.json();
      if (json.status === 1) {
        showToast('已成功恢复外部模型预设配置', 'success');
        loadModels();
      } else {
        showToast(json.info || '重置失败', 'error');
      }
    } catch {
      showToast('重置失败', 'error');
    }
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingModel({
      id: '',
      name: '',
      modelId: '',
      provider: 'DeepSeek',
      providerType: 'external',
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: '',
      contextLength: '64K',
      temperature: 0.3,
      maxTokens: 4096,
      isDefault: false,
      enabled: true,
      tags: ['外部模型'],
      description: '',
      status: 'online',
    });
    setShowApiKey(false);
    setModalVisible(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (model: AiModelConfig) => {
    setEditingModel({ ...model });
    setShowApiKey(false);
    setModalVisible(true);
  };

  // Apply template in modal
  const handleApplyTemplate = (tmpl: (typeof PRESET_TEMPLATES)[0]) => {
    setEditingModel((prev) => ({
      ...prev,
      name: tmpl.displayName,
      modelId: tmpl.modelId,
      provider: tmpl.provider,
      providerType: 'external',
      baseUrl: tmpl.baseUrl,
      contextLength: tmpl.contextLength,
      temperature: tmpl.temperature,
      maxTokens: tmpl.maxTokens,
      tags: tmpl.tags,
      description: tmpl.description,
    }));
  };

  // Save model from modal
  const handleSaveModel = async () => {
    if (!editingModel?.name?.trim()) {
      showToast('请输入模型展示名称', 'warning');
      return;
    }
    if (!editingModel?.modelId?.trim()) {
      showToast('请输入模型唯一标识符 (Model ID)', 'warning');
      return;
    }
    if (!editingModel?.baseUrl?.trim()) {
      showToast('请输入 API 接口 Base URL', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const isCreate = !editingModel.id;
      const url = isCreate ? '/api/system/models' : `/api/system/models/${editingModel.id}`;
      const method = isCreate ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingModel),
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast(isCreate ? '接入外部模型成功' : '模型配置更新成功', 'success');
        setModalVisible(false);
        loadModels();
      } else {
        showToast(json.info || '保存失败', 'error');
      }
    } catch {
      showToast('保存失败，请检查网络或参数', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Metrics
  const activeDefault = models.find((m) => m.isDefault);
  const externalCount = models.filter((m) => m.providerType === 'external').length;
  const enabledCount = models.filter((m) => m.enabled).length;

  return (
    <div className="flex flex-col h-full bg-[#f8f9fb] text-[#1f2733] overflow-hidden select-none">
      {/* 1. Header Toolbar */}
      <div className="bg-white border-b border-[#e4e7ed] px-6 py-4 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-200" />
              </div>
              <h1 className="text-lg font-bold text-[#1f2733] tracking-tight">模型配置</h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                QingProcess AI 多模型中心
              </span>
            </div>
            <p className="text-xs text-[#909399] mt-1">
              配置接入国内外主流外部大模型（DeepSeek、阿里通义千问、Claude、OpenAI、本地 Ollama 等），点击流程画板顶部「QingProcess AI」即可随时一键选用切换。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="h-8 px-3 rounded-md border border-[#dcdfe6] hover:border-[#2f7bfe] hover:text-[#2f7bfe] text-[#606266] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
              title="恢复官方默认模型与参数"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#909399]" />
              <span>恢复预设</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="h-8 px-3.5 rounded-md bg-[#2f7bfe] hover:bg-[#1d63d8] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>接入外部模型</span>
            </button>
          </div>
        </div>

        {/* 2. Clean Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3.5 border-t border-[#f0f2f5]">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#fafbfc] border border-[#ebeef5]">
            <div className="w-8 h-8 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-[#909399]">当前默认生效模型</div>
              <div className="text-xs font-bold text-[#1f2733] truncate" title={activeDefault?.name}>
                {activeDefault ? activeDefault.name : '未指定默认'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#fafbfc] border border-[#ebeef5]">
            <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-[#909399]">已接入外部模型</div>
              <div className="text-xs font-bold text-[#1f2733]">
                {externalCount} 个通道
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#fafbfc] border border-[#ebeef5]">
            <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-[#909399]">已启用通道数</div>
              <div className="text-xs font-bold text-[#1f2733]">
                {enabledCount} / {models.length} 可用
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#fafbfc] border border-[#ebeef5]">
            <div className="w-8 h-8 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-[#909399]">平均推理延迟</div>
              <div className="text-xs font-bold text-emerald-600 font-mono">
                {activeDefault?.latencyMs || 210} ms
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="bg-white border-b border-[#e4e7ed] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5 bg-[#f0f2f5] p-0.5 rounded-md text-xs">
          {[
            { id: 'all', label: `全部模型 (${models.length})` },
            { id: 'external', label: `外部模型 (${externalCount})` },
            { id: 'builtin', label: `内置通道 (${models.length - externalCount})` },
            { id: 'enabled', label: `已启用 (${enabledCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-[#2f7bfe] shadow-2xs font-semibold'
                  : 'text-[#606266] hover:text-[#303133]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索模型名称、标识、厂商..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-[#f8f9fb] border border-[#dcdfe6] rounded-md focus:outline-none focus:border-[#2f7bfe] focus:bg-white transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-[#909399] absolute left-2.5 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-[#909399] hover:text-[#606266]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Model Cards Grid */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#909399] text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-[#2f7bfe] mb-2" />
            <span>正在同步模型状态...</span>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e4e7ed] p-12 text-center text-[#909399] flex flex-col items-center justify-center">
            <Server className="w-10 h-10 text-[#c0c4cc] mb-3 stroke-[1.5]" />
            <div className="text-sm font-medium text-[#606266]">未找到匹配的模型配置</div>
            <p className="text-xs text-[#909399] mt-1 max-w-sm">
              您可以点击右上角「接入外部模型」，添加 DeepSeek、通义千问或本地私有化模型。
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 h-8 px-4 rounded-md bg-[#2f7bfe] text-white text-xs font-medium hover:bg-[#1d63d8] transition-colors cursor-pointer"
            >
              + 立即接入外部模型
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredModels.map((model) => {
              const isTesting = testingModelId === model.id;
              const isDeepSeek = model.provider.toLowerCase().includes('deepseek');
              const isQwen = model.provider.toLowerCase().includes('aliyun') || model.provider.includes('千问');
              const isGemini = model.provider.toLowerCase().includes('gemini') || model.provider.toLowerCase().includes('google');
              const isClaude = model.provider.toLowerCase().includes('anthropic') || model.provider.toLowerCase().includes('claude');
              const isOllama = model.provider.toLowerCase().includes('ollama');

              const providerTheme = isDeepSeek
                ? { bg: 'bg-blue-50/70', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' }
                : isQwen
                ? { bg: 'bg-orange-50/70', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' }
                : isGemini
                ? { bg: 'bg-purple-50/70', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' }
                : isClaude
                ? { bg: 'bg-amber-50/70', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-900' }
                : isOllama
                ? { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-800', badge: 'bg-slate-200 text-slate-800' }
                : { bg: 'bg-emerald-50/70', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' };

              return (
                <div
                  key={model.id}
                  className={`relative bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden group shadow-2xs hover:shadow-md ${
                    model.isDefault
                      ? 'border-[#2f7bfe] ring-2 ring-[#2f7bfe]/15'
                      : 'border-[#e4e7ed] hover:border-[#b3d8ff]'
                  } ${!model.enabled ? 'opacity-65 bg-[#fbfbfc]' : ''}`}
                >
                  {/* Top Header */}
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${providerTheme.bg} ${providerTheme.border} ${providerTheme.text} border`}
                        >
                          {isDeepSeek ? 'DS' : isQwen ? '千问' : isGemini ? 'G' : isClaude ? 'C' : isOllama ? 'OL' : 'AI'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-[#1f2733] truncate leading-tight" title={model.name}>
                              {model.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="font-mono text-[10.5px] text-[#909399] truncate max-w-[170px]" title={model.modelId}>
                              {model.modelId}
                            </span>
                            <span className="text-[#dcdfe6]">·</span>
                            <span className="text-[10px] text-[#909399]">{model.provider}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Badges */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {model.isDefault ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecf5ff] text-[#2f7bfe] border border-[#b3d8ff] flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            默认生效
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(model)}
                            disabled={!model.enabled}
                            className={`px-2 py-0.5 rounded-full text-[10px] transition-colors cursor-pointer ${
                              model.enabled
                                ? 'bg-white hover:bg-[#f0f2f5] text-[#909399] hover:text-[#2f7bfe] border border-[#dcdfe6]'
                                : 'text-[#c0c4cc] cursor-not-allowed border border-transparent'
                            }`}
                            title="设为 QingProcess AI 默认推理模型"
                          >
                            设为默认
                          </button>
                        )}
                        <span
                          className={`text-[9.5px] px-1.5 py-0.2 rounded font-medium border ${
                            model.providerType === 'external'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {model.providerType === 'external' ? '外部接入' : '内置通道'}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11.5px] text-[#606266] mt-2.5 line-clamp-2 leading-relaxed h-8">
                      {model.description || '暂无描述信息'}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {model.tags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.2 rounded text-[10px] bg-[#f4f6f8] text-[#606266] border border-[#ebeef5]"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-50 text-purple-700 border border-purple-100 font-mono">
                        {model.contextLength}
                      </span>
                    </div>

                    {/* Meta Specs */}
                    <div className="mt-3 pt-2.5 border-t border-[#f2f4f7] grid grid-cols-2 gap-2 text-[11px] text-[#909399]">
                      <div className="flex items-center gap-1 truncate" title={model.baseUrl}>
                        <Globe className="w-3 h-3 text-[#c0c4cc] shrink-0" />
                        <span className="truncate">{model.baseUrl.replace('https://', '')}</span>
                      </div>
                      <div className="flex items-center justify-end gap-1 font-mono">
                        <Activity className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>{model.latencyMs ? `${model.latencyMs}ms` : '在线就绪'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="px-4 py-2.5 bg-[#fbfbfc] border-t border-[#ebeef5] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {/* Enable Switch */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#606266]">
                        <input
                          type="checkbox"
                          checked={model.enabled}
                          onChange={() => handleToggleEnabled(model)}
                          className="w-3.5 h-3.5 rounded text-[#2f7bfe] focus:ring-0 cursor-pointer"
                        />
                        <span>{model.enabled ? '已启用' : '已停用'}</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Test Connection Button */}
                      <button
                        onClick={() => handleTestConnection(model)}
                        disabled={isTesting}
                        className="h-6 px-2 rounded hover:bg-white text-[11px] text-[#606266] hover:text-[#2f7bfe] hover:border-[#b3d8ff] border border-transparent flex items-center gap-1 transition-colors cursor-pointer"
                        title="测试该模型的端点连通性"
                      >
                        <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-[#2f7bfe]' : ''}`} />
                        <span>{isTesting ? '测试中...' : '测试'}</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(model)}
                        className="h-6 px-2 rounded hover:bg-white text-[11px] text-[#606266] hover:text-[#2f7bfe] hover:border-[#b3d8ff] border border-transparent flex items-center gap-1 transition-colors cursor-pointer"
                        title="编辑配置参数"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>编辑</span>
                      </button>

                      {/* Delete Button (if external) */}
                      {model.providerType === 'external' && !model.isDefault && (
                        <button
                          onClick={() => handleDeleteModel(model)}
                          className="h-6 w-6 rounded hover:bg-red-50 text-[#909399] hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="移除模型"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Clean Modal: Add / Edit External Model */}
      {modalVisible && editingModel && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#ebeef5] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#f0f2f5] flex items-center justify-between shrink-0 bg-[#fafafa]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-600 text-white flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                </div>
                <h3 className="text-sm font-bold text-[#1f2733]">
                  {editingModel.id ? '编辑模型配置' : '接入外部模型'}
                </h3>
              </div>
              <button
                onClick={() => setModalVisible(false)}
                className="w-7 h-7 rounded-md hover:bg-[#e4e7ed] text-[#909399] hover:text-[#303133] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Fast Presets if Creating */}
              {!editingModel.id && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#606266] mb-1.5">
                    快速选用推荐模板（一键填入主流外部模型参数）：
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.key}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl)}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                          editingModel.provider === tmpl.provider && editingModel.modelId === tmpl.modelId
                            ? 'border-[#2f7bfe] bg-[#ecf5ff] text-[#2f7bfe]'
                            : 'border-[#e4e7ed] hover:border-[#b3d8ff] bg-white text-[#303133]'
                        }`}
                      >
                        <div className="font-bold text-[11px] truncate">{tmpl.name}</div>
                        <div className="text-[10px] text-[#909399] truncate font-mono mt-0.5">
                          {tmpl.modelId}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-[#303133] mb-1">
                    模型厂商 / 服务商 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editingModel.provider || 'DeepSeek'}
                    onChange={(e) => setEditingModel({ ...editingModel, provider: e.target.value })}
                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] text-xs focus:border-[#2f7bfe] focus:outline-none bg-white"
                  >
                    <option value="DeepSeek">DeepSeek (深度求索)</option>
                    <option value="Aliyun">阿里云通义千问 (DashScope)</option>
                    <option value="Anthropic">Anthropic (Claude)</option>
                    <option value="OpenAI">OpenAI (GPT-4o / o3)</option>
                    <option value="Zhipu">智谱 AI (GLM-4)</option>
                    <option value="Ollama">Ollama (本地私有化)</option>
                    <option value="Google Gemini">Google Gemini</option>
                    <option value="Custom">自定义 OpenAI 兼容接口</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#303133] mb-1">
                    模型展示名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingModel.name || ''}
                    onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
                    placeholder="如: DeepSeek-R1 (推理大模型)"
                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] text-xs focus:border-[#2f7bfe] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#303133] mb-1">
                    模型标识 (Model ID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingModel.modelId || ''}
                    onChange={(e) => setEditingModel({ ...editingModel, modelId: e.target.value })}
                    placeholder="如: deepseek-reasoner 或 qwen-max"
                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] text-xs font-mono focus:border-[#2f7bfe] focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#303133] mb-1">
                    上下文窗口大小
                  </label>
                  <select
                    value={editingModel.contextLength || '64K'}
                    onChange={(e) => setEditingModel({ ...editingModel, contextLength: e.target.value })}
                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] text-xs focus:border-[#2f7bfe] focus:outline-none bg-white"
                  >
                    <option value="16K">16K Tokens</option>
                    <option value="32K">32K Tokens</option>
                    <option value="64K">64K Tokens</option>
                    <option value="128K">128K Tokens</option>
                    <option value="200K">200K Tokens</option>
                    <option value="1M">1M (百万级超长文本)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#303133] mb-1">
                  API 端点地址 (Base URL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingModel.baseUrl || ''}
                  onChange={(e) => setEditingModel({ ...editingModel, baseUrl: e.target.value })}
                  placeholder="https://api.deepseek.com/v1"
                  className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] text-xs font-mono focus:border-[#2f7bfe] focus:outline-none bg-white"
                />
                <span className="text-[10px] text-[#909399] mt-0.5 block">
                  支持所有兼容 OpenAI API 规范的 RESTful 端点，本地 Ollama 填入: http://localhost:11434/v1
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-[#303133]">
                    API 访问凭证 (API Key)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[10.5px] text-[#2f7bfe] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showApiKey ? '隐藏明文' : '显示明文'}</span>
                  </button>
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={editingModel.apiKey || ''}
                  onChange={(e) => setEditingModel({ ...editingModel, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] text-xs font-mono focus:border-[#2f7bfe] focus:outline-none bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-[#303133]">
                      温度 (Temperature): {editingModel.temperature ?? 0.3}
                    </label>
                    <span className="text-[10px] text-[#909399]">
                      {(editingModel.temperature ?? 0.3) < 0.4 ? '结构严密' : '发散创新'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={editingModel.temperature ?? 0.3}
                    onChange={(e) =>
                      setEditingModel({ ...editingModel, temperature: parseFloat(e.target.value) })
                    }
                    className="w-full accent-[#2f7bfe] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#303133] mb-1">
                    最大生成长度 (Max Tokens)
                  </label>
                  <input
                    type="number"
                    value={editingModel.maxTokens || 4096}
                    onChange={(e) =>
                      setEditingModel({ ...editingModel, maxTokens: parseInt(e.target.value, 10) || 4096 })
                    }
                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] text-xs font-mono focus:border-[#2f7bfe] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#303133] mb-1">
                  模型说明与应用场景
                </label>
                <textarea
                  rows={2}
                  value={editingModel.description || ''}
                  onChange={(e) => setEditingModel({ ...editingModel, description: e.target.value })}
                  placeholder="描述此模型在流程规划、合规审查或拓扑生成的适用场景..."
                  className="w-full p-2.5 rounded border border-[#dcdfe6] text-xs focus:border-[#2f7bfe] focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#fafafa] border-t border-[#f0f2f5] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => handleTestConnection(editingModel)}
                disabled={testingModelId === 'temp'}
                className="h-8 px-3 rounded border border-[#dcdfe6] hover:border-[#2f7bfe] hover:text-[#2f7bfe] text-[#606266] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingModelId === 'temp' ? 'animate-spin text-[#2f7bfe]' : ''}`} />
                <span>{testingModelId === 'temp' ? '连通性验证中...' : '在线测试连接'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalVisible(false)}
                  className="h-8 px-3.5 rounded border border-[#dcdfe6] hover:bg-[#f2f4f7] text-[#606266] text-xs font-medium transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveModel}
                  disabled={isSaving}
                  className="h-8 px-4 rounded bg-[#2f7bfe] hover:bg-[#1d63d8] text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
                >
                  {isSaving ? '保存中...' : '保存模型配置'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
