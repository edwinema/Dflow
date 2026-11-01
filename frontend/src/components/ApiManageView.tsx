import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  PenLine,
  Trash2,
  Play,
  Copy,
  Check,
  Code2,
  X,
  Terminal,
  Send,
  Search,
  RotateCcw,
  Layers,
  Clock,
  Shield,
  Activity,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export interface ApiItem {
  id: number;
  apiName: string;
  apiPath: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  category: string;
  status: '启用' | '禁用';
  authType?: string;
  rateLimit?: string;
  description?: string;
  sampleResponse?: string;
  createTime: string;
}

interface ApiManageViewProps {
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const CATEGORY_TABS = [
  { key: 'all', label: '全部接口', icon: Layers },
  { key: 'collab', label: '协同工作', icon: Activity },
  { key: 'property', label: '流程资产', icon: Layers },
  { key: 'design', label: '流程设计', icon: Code2 },
  { key: 'execute', label: '流程运行', icon: Play },
  { key: 'mining', label: '流程挖掘', icon: Activity },
  { key: 'duty', label: '权责管控', icon: Shield },
  { key: 'risk', label: '风控合规', icon: Shield },
  { key: 'system', label: '组织系统', icon: Terminal },
];

const METHOD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: 'bg-[#f0f9eb]', text: 'text-[#67c23a]', border: 'border-[#c2e7b0]' },
  POST: { bg: 'bg-[#ecf5ff]', text: 'text-[#409eff]', border: 'border-[#b3d8ff]' },
  PUT: { bg: 'bg-[#fdf6ec]', text: 'text-[#e6a23c]', border: 'border-[#f5dab1]' },
  DELETE: { bg: 'bg-[#fef0f0]', text: 'text-[#f56c6c]', border: 'border-[#fbc4c4]' },
};

export const ApiManageView: React.FC<ApiManageViewProps> = ({ showToast }) => {
  const [apiList, setApiList] = useState<ApiItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Edit / Create Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingApi, setEditingApi] = useState<Partial<ApiItem> | null>(null);

  // Debug Modal
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugApi, setDebugApi] = useState<ApiItem | null>(null);
  const [debugParams, setDebugParams] = useState('{\n  "page": 1,\n  "pageSize": 20\n}');
  const [debugResult, setDebugResult] = useState<any | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  const fetchApis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/apis');
      const json = await res.json();
      if (json.status === 1 && json.data?.list) {
        setApiList(json.data.list);
      }
    } catch (e) {
      console.error('Failed to fetch APIs', e);
      showToast('获取 API 列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApis();
  }, []);

  const handleOpenCreate = () => {
    setEditingApi({
      id: undefined,
      apiName: '',
      apiPath: '/api/v1/',
      method: 'GET',
      category: activeCategory !== 'all' ? activeCategory : 'collab',
      status: '启用',
      authType: 'Bearer Token',
      rateLimit: '120次/分钟',
      description: '',
      sampleResponse: '{\n  "code": 200,\n  "message": "success",\n  "data": {}\n}',
    });
    setEditModalOpen(true);
  };

  const handleOpenEdit = (item: ApiItem) => {
    setEditingApi({ ...item });
    setEditModalOpen(true);
  };

  const handleSaveApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApi?.apiName?.trim() || !editingApi?.apiPath?.trim()) {
      showToast('请完整输入接口名称与请求路径', 'warning');
      return;
    }

    try {
      const isEdit = typeof editingApi.id === 'number';
      const url = isEdit ? `/api/system/apis/${editingApi.id}` : '/api/system/apis';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingApi),
      });
      const json = await res.json();
      if (json.status === 1) {
        if (json.list) setApiList(json.list);
        else fetchApis();
        setEditModalOpen(false);
        setEditingApi(null);
        showToast(json.info || 'API 接口已保存', 'success');
      } else {
        showToast(json.info || '保存失败', 'error');
      }
    } catch {
      showToast('保存接口异常', 'error');
    }
  };

  const handleDeleteApi = async (id: number) => {
    if (!window.confirm('确定要删除此 API 接口定义吗？')) return;
    try {
      const res = await fetch(`/api/system/apis/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.status === 1) {
        if (json.list) setApiList(json.list);
        else fetchApis();
        showToast('API 接口已删除', 'success');
      }
    } catch {
      showToast('删除失败', 'error');
    }
  };

  const handleResetApis = async () => {
    if (!window.confirm('确定要将所有接口恢复为系统预置出厂 API 规范吗？')) return;
    try {
      const res = await fetch('/api/system/apis/reset', { method: 'POST' });
      const json = await res.json();
      if (json.status === 1) {
        if (json.list) setApiList(json.list);
        else fetchApis();
        showToast('已成功重置为系统出厂 API 规范', 'success');
      }
    } catch {
      showToast('重置失败', 'error');
    }
  };

  const handleCopyCurl = (item: ApiItem) => {
    const curl = `curl -X ${item.method} "https://app.qingprocess.internal${item.apiPath}" \\
  -H "Authorization: Bearer dflow-jwt-token-2026" \\
  -H "Content-Type: application/json"`;

    navigator.clipboard.writeText(curl);
    setCopiedId(item.id);
    showToast(`已成功复制 cURL 调试命令到剪贴板`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenDebug = (item: ApiItem) => {
    setDebugApi(item);
    setDebugResult(null);
    setDebugParams(item.sampleResponse || '{\n  "page": 1,\n  "pageSize": 20\n}');
    setDebugModalOpen(true);
  };

  const handleExecuteDebug = async () => {
    if (!debugApi) return;
    setDebugLoading(true);
    try {
      let parsedBody = undefined;
      if (debugApi.method !== 'GET') {
        try {
          parsedBody = JSON.parse(debugParams);
        } catch {
          parsedBody = { raw: debugParams };
        }
      }

      const res = await fetch('/api/system/apis/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiPath: debugApi.apiPath,
          method: debugApi.method,
          body: parsedBody,
        }),
      });
      const json = await res.json();
      setDebugResult(json);
      showToast(`调用成功，响应耗时 ${json.latencyMs || 15}ms`, 'success');
    } catch (e: any) {
      setDebugResult({ status: 0, error: e.message || '网络或接口异常' });
      showToast('调试执行失败', 'error');
    } finally {
      setDebugLoading(false);
    }
  };

  // Filtered APIs
  const filteredApis = useMemo(() => {
    return apiList.filter((item) => {
      // Category filter
      if (activeCategory !== 'all') {
        if (item.category !== activeCategory) return false;
      }
      // Method filter
      if (selectedMethod !== 'ALL') {
        if (item.method !== selectedMethod) return false;
      }
      // Search keyword
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          item.apiName.toLowerCase().includes(q) ||
          item.apiPath.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [apiList, activeCategory, selectedMethod, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = apiList.length;
    const activeCount = apiList.filter((a) => a.status === '启用').length;
    const getCount = apiList.filter((a) => a.method === 'GET').length;
    const postCount = apiList.filter((a) => a.method === 'POST').length;
    return { total, activeCount, getCount, postCount };
  }, [apiList]);

  return (
    <div className="h-full flex flex-col p-4 bg-[#f5f7fa] select-none overflow-y-auto">
      <div className="bg-white rounded border border-[#ebeef5] shadow-xs flex flex-col overflow-hidden mb-4">
        {/* Header Title & Actions */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#2F7BFE]" />
                <h2 className="text-base font-bold text-[#1f2733] tracking-tight">
                  API 接口管理中心
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#f0f2f5] text-[#606266] font-mono">
                  v2.6 OpenAPI 3.0
                </span>
              </div>
              <p className="text-xs text-[#909399] mt-1">
                统一注册、管理并在线调试覆盖 8 大核心业务模块的 RESTful OpenAPI 规范与数据网关
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetApis}
                className="h-8 px-3 rounded border border-[#dcdfe6] hover:bg-[#f5f7fa] text-[#606266] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                title="恢复出厂预置15个核心API规范"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>恢复预置规范</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="h-8 px-4 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新建接口</span>
              </button>
            </div>
          </div>
          <div className="h-[2px] bg-[#2F7BFE] w-full" />
        </div>

        {/* 8 Module Category Tabs */}
        <div className="px-5 pt-1 pb-3 flex flex-wrap gap-1.5 border-b border-[#ebeef5] bg-[#fafbfc]">
          {CATEGORY_TABS.map((tab) => {
            const count =
              tab.key === 'all'
                ? apiList.length
                : apiList.filter((a) => a.category === tab.key).length;
            const isActive = activeCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#2F7BFE] text-white shadow-xs'
                    : 'bg-white border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#f0f2f5] text-[#909399]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Method Filters */}
        <div className="px-5 py-3 flex items-center justify-between gap-4 text-xs bg-white border-b border-[#ebeef5]">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-80">
              <Search className="w-3.5 h-3.5 text-[#909399] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索接口名称、路径 (如 /api/flow/...) 或描述..."
                className="h-8 w-full pl-9 pr-3 rounded border border-[#dcdfe6] focus:border-[#2F7BFE] outline-none text-xs text-[#303133]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#909399] hover:text-[#303133]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Method Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[#909399]">方法:</span>
              {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMethod(m)}
                  className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                    selectedMethod === m
                      ? 'bg-[#303133] text-white'
                      : 'bg-[#f0f2f5] text-[#606266] hover:bg-[#e4e7ed]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#909399]">
            <span>
              已展示: <b className="text-[#303133] font-mono">{filteredApis.length}</b> / {apiList.length} 个
            </span>
            <span>
              活跃启用: <b className="text-[#67c23a] font-mono">{stats.activeCount}</b>
            </span>
          </div>
        </div>

        {/* API Table */}
        <div className="p-5 pt-2 overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#909399]">正在加载接口元数据...</div>
          ) : filteredApis.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#909399]">
              未检索到符合条件的 API 接口
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#ebeef5] text-[#303133] font-semibold bg-[#fafbfc]">
                  <th className="py-3 px-3 w-16 text-center">序号</th>
                  <th className="py-3 px-4 w-48">接口名称</th>
                  <th className="py-3 px-4 w-28">请求方式</th>
                  <th className="py-3 px-4">请求路径</th>
                  <th className="py-3 px-4 w-28">所属模块</th>
                  <th className="py-3 px-4 w-28">限流频次</th>
                  <th className="py-3 px-4 w-20 text-center">状态</th>
                  <th className="py-3 px-4 w-40 text-center">快捷操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebeef5] text-[#606266]">
                {filteredApis.map((item, idx) => {
                  const mStyle = METHOD_COLORS[item.method] || METHOD_COLORS.GET;
                  const catLabel =
                    CATEGORY_TABS.find((c) => c.key === item.category)?.label || item.category;

                  return (
                    <tr key={item.id} className="hover:bg-[#fafbfc] transition-colors group">
                      <td className="py-3 px-3 text-center font-mono text-[#909399]">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#303133]">{item.apiName}</div>
                        {item.description && (
                          <div className="text-[11px] text-[#909399] truncate max-w-xs mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${mStyle.bg} ${mStyle.text} ${mStyle.border}`}
                        >
                          {item.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="text-[#2F7BFE] font-medium">{item.apiPath}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#f0f2f5] text-[#606266] text-[11px]">
                          {catLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#909399] text-[11px]">
                        {item.rateLimit || '60次/分钟'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            item.status === '启用'
                              ? 'bg-[#f0f9eb] text-[#67c23a] border border-[#c2e7b0]'
                              : 'bg-[#f4f4f5] text-[#909399] border border-[#e9e9eb]'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyCurl(item)}
                            className="h-7 px-2 rounded bg-white hover:bg-[#f5f7fa] border border-[#dcdfe6] text-[#606266] flex items-center gap-1 cursor-pointer transition-colors"
                            title="复制 cURL 调试命令"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-[#67c23a]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span className="text-[11px]">
                              {copiedId === item.id ? '已复制' : 'cURL'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDebug(item)}
                            className="h-7 px-2.5 rounded bg-[#67c23a] hover:bg-[#5daf34] text-white flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                            title="在线实时请求调试"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span className="text-[11px]">在线调试</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="w-7 h-7 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                            title="编辑接口定义"
                          >
                            <PenLine className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteApi(item.id)}
                            className="w-7 h-7 rounded bg-[#f56c6c] hover:bg-[#e64242] text-white flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                            title="删除接口"
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
          )}
        </div>
      </div>

      {/* Edit / Create API Modal */}
      {editModalOpen && editingApi && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#ebeef5] shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#f8f9fb]">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#2F7BFE]" />
                <h3 className="text-sm font-bold text-[#1f2733]">
                  {editingApi.id ? '编辑 API 接口规范' : '注册新 API 接口'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveApi} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#606266] font-medium mb-1">
                    <span className="text-[#f56c6c]">*</span> 接口中文名称
                  </label>
                  <input
                    type="text"
                    required
                    value={editingApi.apiName}
                    onChange={(e) => setEditingApi({ ...editingApi, apiName: e.target.value })}
                    placeholder="如: 流程版本历史与基线对比"
                    className="w-full h-8 px-3 rounded border border-[#dcdfe6] focus:border-[#2F7BFE] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#606266] font-medium mb-1">
                    <span className="text-[#f56c6c]">*</span> 请求方式 (HTTP Method)
                  </label>
                  <select
                    value={editingApi.method}
                    onChange={(e) =>
                      setEditingApi({ ...editingApi, method: e.target.value as any })
                    }
                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#2F7BFE] outline-none bg-white font-mono"
                  >
                    <option value="GET">GET (获取资源)</option>
                    <option value="POST">POST (提交/发起)</option>
                    <option value="PUT">PUT (更新/保存)</option>
                    <option value="DELETE">DELETE (删除资源)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#606266] font-medium mb-1">
                  <span className="text-[#f56c6c]">*</span> 请求绝对路径 (API Path)
                </label>
                <input
                  type="text"
                  required
                  value={editingApi.apiPath}
                  onChange={(e) => setEditingApi({ ...editingApi, apiPath: e.target.value })}
                  placeholder="/api/flow/..."
                  className="w-full h-8 px-3 rounded border border-[#dcdfe6] focus:border-[#2F7BFE] outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#606266] font-medium mb-1">所属一级业务模块</label>
                  <select
                    value={editingApi.category}
                    onChange={(e) => setEditingApi({ ...editingApi, category: e.target.value })}
                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#2F7BFE] outline-none bg-white"
                  >
                    <option value="collab">协同工作 (collab)</option>
                    <option value="property">流程资产 (property)</option>
                    <option value="design">流程设计 (design)</option>
                    <option value="execute">流程运行 (execute)</option>
                    <option value="mining">流程挖掘 (mining)</option>
                    <option value="duty">权责管控 (duty)</option>
                    <option value="risk">风控合规 (risk)</option>
                    <option value="system">组织系统 (system)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#606266] font-medium mb-1">认证鉴权方式</label>
                  <select
                    value={editingApi.authType || 'Bearer Token'}
                    onChange={(e) => setEditingApi({ ...editingApi, authType: e.target.value })}
                    className="w-full h-8 px-2.5 rounded border border-[#dcdfe6] focus:border-[#2F7BFE] outline-none bg-white"
                  >
                    <option value="Bearer Token">Bearer Token (JWT)</option>
                    <option value="API Key">API Key 授权头</option>
                    <option value="Public">公开无鉴权</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#606266] font-medium mb-1">限流阈值</label>
                  <input
                    type="text"
                    value={editingApi.rateLimit || '60次/分钟'}
                    onChange={(e) => setEditingApi({ ...editingApi, rateLimit: e.target.value })}
                    placeholder="如: 120次/分钟"
                    className="w-full h-8 px-3 rounded border border-[#dcdfe6] focus:border-[#2F7BFE] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#606266] font-medium mb-1">业务职责与调用说明</label>
                <textarea
                  rows={2}
                  value={editingApi.description || ''}
                  onChange={(e) => setEditingApi({ ...editingApi, description: e.target.value })}
                  placeholder="阐明此接口的主要输入参数、输出意图与前置鉴权权限..."
                  className="w-full p-2.5 rounded border border-[#dcdfe6] focus:border-[#2F7BFE] outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[#606266] font-medium mb-1">示例响应体 (JSON)</label>
                <textarea
                  rows={4}
                  value={editingApi.sampleResponse || ''}
                  onChange={(e) => setEditingApi({ ...editingApi, sampleResponse: e.target.value })}
                  placeholder="{\n  &quot;code&quot;: 200,\n  &quot;message&quot;: &quot;success&quot;\n}"
                  className="w-full p-2.5 rounded border border-[#dcdfe6] focus:border-[#2F7BFE] outline-none font-mono text-[11px] bg-[#fafbfc] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ebeef5]">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="h-8 px-4 rounded border border-[#dcdfe6] text-[#606266] hover:bg-[#f5f7fa] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white font-medium cursor-pointer shadow-xs"
                >
                  保存接口
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Online Debug Drawer / Modal */}
      {debugModalOpen && debugApi && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#ebeef5] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Debug Header */}
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#1f2d3d] text-white">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#409eff]" />
                <span className="font-bold text-sm">在线接口调试 · {debugApi.apiName}</span>
              </div>
              <button
                type="button"
                onClick={() => setDebugModalOpen(false)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Path & Execute Banner */}
            <div className="p-4 flex items-center gap-2 bg-[#f8f9fb] border-b border-[#ebeef5]">
              <span
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                  METHOD_COLORS[debugApi.method]?.bg || 'bg-[#f0f9eb]'
                } ${METHOD_COLORS[debugApi.method]?.text || 'text-[#67c23a]'} ${
                  METHOD_COLORS[debugApi.method]?.border || 'border-[#c2e7b0]'
                }`}
              >
                {debugApi.method}
              </span>
              <span className="font-mono text-xs text-[#303133] flex-1 bg-white p-2 rounded border border-[#dcdfe6]">
                {debugApi.apiPath}
              </span>
              <button
                type="button"
                disabled={debugLoading}
                onClick={handleExecuteDebug}
                className="h-8 px-4 rounded bg-[#67c23a] hover:bg-[#5daf34] text-white font-medium flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{debugLoading ? '执行中...' : '发送请求'}</span>
              </button>
            </div>

            {/* Request Payload Editor */}
            <div className="p-4 border-b border-[#ebeef5] bg-[#fafbfc]">
              <div className="flex items-center justify-between mb-1.5 text-xs text-[#606266] font-medium">
                <span>请求载荷 (Headers & Body JSON)</span>
                <span className="text-[11px] text-[#909399] font-mono">Authorization: Bearer ***</span>
              </div>
              <textarea
                rows={3}
                value={debugParams}
                onChange={(e) => setDebugParams(e.target.value)}
                className="w-full p-2.5 rounded border border-[#dcdfe6] focus:border-[#2F7BFE] outline-none font-mono text-xs bg-white resize-none"
              />
            </div>

            {/* Response Console */}
            <div className="p-4 flex-1 overflow-auto bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[11px]">
                <div className="flex items-center gap-3">
                  <span className="text-white/60">响应结果</span>
                  {debugResult && (
                    <span className="px-2 py-0.5 rounded bg-[#67c23a]/20 text-[#67c23a] font-bold">
                      {debugResult.httpStatus || 200} {debugResult.statusText || 'OK'}
                    </span>
                  )}
                </div>
                {debugResult?.latencyMs && (
                  <span className="text-white/50 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>耗时 {debugResult.latencyMs} ms</span>
                  </span>
                )}
              </div>

              <pre className="flex-1 overflow-auto text-[11.5px] leading-relaxed text-[#9cdcfe]">
                {debugResult
                  ? JSON.stringify(debugResult.data || debugResult, null, 2)
                  : '// 点击右上角「发送请求」执行网关连通性与数据测试'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
