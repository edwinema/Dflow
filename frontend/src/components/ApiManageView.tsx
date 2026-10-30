import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface ApiItem {
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

export const ApiManageView: React.FC<ApiManageViewProps> = ({ showToast }) => {
  const [apiList, setApiList] = useState<ApiItem[]>([]);
  const [searchName, setSearchName] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingApi, setEditingApi] = useState<Partial<ApiItem> | null>(null);
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugApi, setDebugApi] = useState<ApiItem | null>(null);
  const [debugHeaders, setDebugHeaders] = useState('{\n  "Authorization": "Bearer dflow-jwt-token-2026",\n  "Content-Type": "application/json"\n}');
  const [debugBody, setDebugBody] = useState('{\n  "page": 1,\n  "pageSize": 20\n}');
  const [debugResult, setDebugResult] = useState<any | null>(null);

  const fetchApis = async () => {
    try {
      const res = await fetch('/api/system/apis');
      const json = await res.json();
      if (json.status === 1 && json.data) {
        setApiList(json.data.list || []);
      }
    } catch (e) {
      console.error('Failed to fetch APIs', e);
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
      category: 'system',
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
      showToast('请填写必填项', 'warning');
      return;
    }
    const res = await fetch('/api/system/apis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingApi),
    });
    const json = await res.json();
    if (json.status === 1) {
      setApiList(json.list);
      setEditModalOpen(false);
      setEditingApi(null);
      showToast('API 已保存', 'success');
    }
  };

  const handleDeleteApi = async (id: number) => {
    const res = await fetch(`/api/system/apis/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.status === 1) {
      setApiList(json.list);
      showToast('API 已删除', 'success');
    }
  };

  const handleOpenDebug = (item: ApiItem) => {
    setDebugApi(item);
    setDebugResult(null);
    setDebugModalOpen(true);
  };

  const handleExecuteDebug = async () => {
    if (!debugApi) return;
    const res = await fetch('/api/system/apis/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiPath: debugApi.apiPath,
        method: debugApi.method,
      }),
    });
    const json = await res.json();
    if (json.status === 1 && json.debugResult) {
      setDebugResult(json.debugResult);
      showToast('测试调用成功', 'success');
    }
  };

  const filteredApis = apiList.filter((a) =>
    !searchName.trim() || a.apiName.toLowerCase().includes(searchName.trim().toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-4 bg-[#f5f7fa] select-none overflow-y-auto">
      <div className="bg-white rounded border border-[#ebeef5] shadow-xs flex flex-col overflow-hidden">
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-base font-bold text-[#1f2733] tracking-tight">API 管理</h2>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="h-8 px-4 rounded bg-[#409eff] hover:bg-[#3390ff] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建接口</span>
            </button>
          </div>
          <div className="h-[2px] bg-[#409eff] w-full" />
        </div>

        <div className="px-5 py-3 flex items-center gap-4 text-xs">
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="搜索接口名称..."
            className="h-8 w-64 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none text-xs text-[#303133]"
          />
        </div>

        <div className="p-5 pt-1 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#ebeef5] text-[#303133] font-semibold">
                <th className="py-3 px-4 w-20">API ID</th>
                <th className="py-3 px-4 w-44">接口名称</th>
                <th className="py-3 px-4">请求路径</th>
                <th className="py-3 px-4 w-28">请求方法</th>
                <th className="py-3 px-4 w-28">分类</th>
                <th className="py-3 px-4 w-24">状态</th>
                <th className="py-3 px-4 w-44">创建时间</th>
                <th className="py-3 px-4 w-32 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebeef5] text-[#606266]">
              {filteredApis.map((item) => (
                <tr key={item.id} className="hover:bg-[#fafbfc] transition-colors">
                  <td className="py-3 px-4 font-mono">{item.id}</td>
                  <td className="py-3 px-4 font-medium text-[#303133]">{item.apiName}</td>
                  <td className="py-3 px-4 font-mono text-[#409eff]">{item.apiPath}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      item.method === 'GET'
                        ? 'bg-[#f0f9eb] text-[#67c23a] border border-[#c2e7b0]'
                        : 'bg-[#fef0f0] text-[#f56c6c] border border-[#fbc4c4]'
                    }`}>
                      {item.method}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{item.category}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-[#f0f9eb] text-[#67c23a] border border-[#c2e7b0]">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{item.createTime}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="w-7 h-7 rounded bg-[#409eff] hover:bg-[#3390ff] text-white flex items-center justify-center cursor-pointer"
                      >
                        <PenLine className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteApi(item.id)}
                        className="w-7 h-7 rounded bg-[#f56c6c] hover:bg-[#e64242] text-white flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDebug(item)}
                        className="w-7 h-7 rounded bg-[#67c23a] hover:bg-[#5daf34] text-white flex items-center justify-center cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editModalOpen && editingApi && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#ebeef5] shadow-xl w-full max-w-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#f8f9fb]">
              <h3 className="text-sm font-bold text-[#1f2733]">编辑 API 信息</h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveApi} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[#606266] font-medium mb-1">接口名称</label>
                <input
                  type="text"
                  required
                  value={editingApi.apiName}
                  onChange={(e) => setEditingApi({ ...editingApi, apiName: e.target.value })}
                  className="w-full h-8 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#606266] font-medium mb-1">接口路径</label>
                <input
                  type="text"
                  required
                  value={editingApi.apiPath}
                  onChange={(e) => setEditingApi({ ...editingApi, apiPath: e.target.value })}
                  className="w-full h-8 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="h-8 px-4 rounded border border-[#dcdfe6] text-[#606266] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded bg-[#409eff] text-white font-medium cursor-pointer"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {debugModalOpen && debugApi && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#ebeef5] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-[#ebeef5] flex items-center justify-between bg-[#1f2d3d] text-white">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#409eff]" />
                <span className="font-bold text-sm">调试: {debugApi.apiName}</span>
              </div>
              <button
                type="button"
                onClick={() => setDebugModalOpen(false)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center gap-2 bg-[#f8f9fb] border-b border-[#ebeef5]">
              <span className="font-mono text-xs text-[#303133] flex-1 bg-white p-2 rounded border border-[#dcdfe6]">
                {debugApi.method} {debugApi.apiPath}
              </span>
              <button
                type="button"
                onClick={handleExecuteDebug}
                className="h-8 px-4 rounded bg-[#67c23a] text-white font-medium flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>发送请求</span>
              </button>
            </div>
            <div className="p-5 flex-1 overflow-auto bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs">
              <pre>{debugResult ? JSON.stringify(debugResult, null, 2) : '点击发送测试 API 返回结果...'}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
