import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  Plus,
  FolderTree,
  X,
  Check,
  Trash2,
  PenLine,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Info,
  AlertCircle,
  FileText,
  Tag,
} from 'lucide-react';

export interface FlowTerm {
  id: number;
  name: string;
  category: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TermCategory {
  id: string;
  name: string;
  description?: string;
  count?: number;
}

interface FlowTermsViewProps {
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const FlowTermsView: React.FC<FlowTermsViewProps> = ({ showToast }) => {
  // Query States
  const [searchName, setSearchName] = useState('');
  const [searchCategory, setSearchCategory] = useState('');

  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
    category: '',
  });

  // Table Data State
  const [terms, setTerms] = useState<FlowTerm[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpPage, setJumpPage] = useState('1');
  const [loading, setLoading] = useState(false);

  // Modal States
  const [editModal, setEditModal] = useState<{
    visible: boolean;
    isCreate: boolean;
    data: {
      id?: number;
      name: string;
      category: string;
      content: string;
    } | null;
  }>({
    visible: false,
    isCreate: true,
    data: null,
  });

  const [categoryModal, setCategoryModal] = useState<{
    visible: boolean;
    list: TermCategory[];
    newCategoryName: string;
    newCategoryDesc: string;
    editingId: string | null;
    editingName: string;
    editingDesc: string;
  }>({
    visible: false,
    list: [],
    newCategoryName: '',
    newCategoryDesc: '',
    editingId: null,
    editingName: '',
    editingDesc: '',
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean;
    term: FlowTerm | null;
  }>({
    visible: false,
    term: null,
  });

  // Fetch terms list
  const fetchTerms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (appliedFilters.name) params.set('name', appliedFilters.name);
      if (appliedFilters.category) params.set('category', appliedFilters.category);
      params.set('pageNum', String(pageNum));
      params.set('pageSize', String(pageSize));

      const res = await fetch(`/api/flow/terms?${params.toString()}`);
      const json = await res.json();
      if (json.status === 1) {
        setTerms(json.rows || []);
        setTotal(json.total || 0);
        if (json.categories) {
          setCategories(json.categories);
        }
      } else {
        showToast(json.info || '加载流程术语失败', 'error');
      }
    } catch {
      showToast('获取流程术语失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories list for category modal
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/flow/term-categories');
      const json = await res.json();
      if (json.status === 1) {
        setCategoryModal((prev) => ({
          ...prev,
          list: json.data || [],
        }));
        if (json.data) {
          setCategories(json.data.map((c: TermCategory) => c.name));
        }
      }
    } catch {
      console.error('Failed to fetch categories');
    }
  };

  useEffect(() => {
    fetchTerms();
  }, [appliedFilters, pageNum, pageSize]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Search and Reset
  const handleSearch = () => {
    setPageNum(1);
    setAppliedFilters({
      name: searchName.trim(),
      category: searchCategory,
    });
  };

  const handleReset = () => {
    setSearchName('');
    setSearchCategory('');
    setPageNum(1);
    setAppliedFilters({
      name: '',
      category: '',
    });
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const defaultCat = categories[0] || '产品研发类';
    setEditModal({
      visible: true,
      isCreate: true,
      data: {
        name: '',
        category: searchCategory || defaultCat,
        content: '',
      },
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (term: FlowTerm) => {
    setEditModal({
      visible: true,
      isCreate: false,
      data: {
        id: term.id,
        name: term.name,
        category: term.category,
        content: term.content,
      },
    });
  };

  // Save Term
  const handleSaveTerm = async () => {
    const { data, isCreate } = editModal;
    if (!data) return;
    if (!data.name.trim()) {
      showToast('请输入术语名称', 'warning');
      return;
    }
    if (!data.category.trim()) {
      showToast('请选择术语分类', 'warning');
      return;
    }
    if (!data.content.trim()) {
      showToast('请输入术语定义与内容', 'warning');
      return;
    }

    try {
      if (isCreate) {
        const res = await fetch('/api/flow/terms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.status === 1) {
          showToast('新增流程术语成功', 'success');
          setEditModal({ visible: false, isCreate: true, data: null });
          fetchTerms();
          fetchCategories();
        } else {
          showToast(json.info || '新增失败', 'error');
        }
      } else {
        const res = await fetch(`/api/flow/terms/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.status === 1) {
          showToast('修改流程术语成功', 'success');
          setEditModal({ visible: false, isCreate: false, data: null });
          fetchTerms();
          fetchCategories();
        } else {
          showToast(json.info || '修改失败', 'error');
        }
      }
    } catch {
      showToast('保存流程术语失败', 'error');
    }
  };

  // Delete Term
  const handleDeleteTerm = async () => {
    if (!deleteConfirm.term) return;
    try {
      const res = await fetch(`/api/flow/terms/${deleteConfirm.term.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast('删除流程术语成功', 'success');
        setDeleteConfirm({ visible: false, term: null });
        fetchTerms();
        fetchCategories();
      } else {
        showToast(json.info || '删除失败', 'error');
      }
    } catch {
      showToast('删除流程术语失败', 'error');
    }
  };

  // Category Management Handlers
  const handleOpenCategoryModal = () => {
    fetchCategories();
    setCategoryModal((prev) => ({
      ...prev,
      visible: true,
      newCategoryName: '',
      newCategoryDesc: '',
      editingId: null,
    }));
  };

  const handleAddCategory = async () => {
    const { newCategoryName, newCategoryDesc } = categoryModal;
    if (!newCategoryName.trim()) {
      showToast('请输入分类名称', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/flow/term-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim(),
        }),
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast('新增分类成功', 'success');
        setCategoryModal((prev) => ({
          ...prev,
          newCategoryName: '',
          newCategoryDesc: '',
        }));
        fetchCategories();
      } else {
        showToast(json.info || '新增分类失败', 'error');
      }
    } catch {
      showToast('新增分类失败', 'error');
    }
  };

  const handleSaveEditCategory = async (id: string) => {
    const { editingName, editingDesc } = categoryModal;
    if (!editingName.trim()) {
      showToast('分类名称不能为空', 'warning');
      return;
    }
    try {
      const res = await fetch(`/api/flow/term-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingName.trim(),
          description: editingDesc.trim(),
        }),
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast('修改分类成功', 'success');
        setCategoryModal((prev) => ({
          ...prev,
          editingId: null,
          editingName: '',
          editingDesc: '',
        }));
        fetchCategories();
        fetchTerms();
      } else {
        showToast(json.info || '修改分类失败', 'error');
      }
    } catch {
      showToast('修改分类失败', 'error');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除分类「${name}」吗？`)) return;
    try {
      const res = await fetch(`/api/flow/term-categories/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.status === 1) {
        showToast('删除分类成功', 'success');
        fetchCategories();
        fetchTerms();
      } else {
        showToast(json.info || '删除分类失败', 'error');
      }
    } catch {
      showToast('删除分类失败', 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="h-full flex flex-col space-y-3 select-none">
      {/* 1. Top Search and Action Bar (按照设计稿完美对齐) */}
      <div className="bg-white rounded border border-[#E4E7ED] p-3 shadow-2xs shrink-0 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-5 flex-wrap">
          {/* 术语名称 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#303133] shrink-0">术语名称</span>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="请输入"
              className="w-48 h-8 px-2.5 rounded border border-[#DCDFE6] text-xs placeholder:text-[#C0C4CC] focus:border-[#2F7BFE] outline-none transition-colors"
            />
          </div>

          {/* 分类 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#303133] shrink-0">分类</span>
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="w-44 h-8 px-2.5 rounded border border-[#DCDFE6] text-xs text-[#606266] focus:border-[#2F7BFE] outline-none bg-white cursor-pointer transition-colors"
            >
              <option value="">请选择</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 搜索与重置按钮 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSearch}
              className="h-8 px-3.5 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>搜索</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="h-8 px-3.5 rounded border border-[#DCDFE6] bg-white hover:border-[#2F7BFE] text-[#2F7BFE] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#2F7BFE]" />
              <span>重置</span>
            </button>
          </div>
        </div>

        {/* 新增术语 与 分类管理 */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="h-8 px-3.5 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>新增术语</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCategoryModal}
            className="h-8 px-3.5 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>分类管理</span>
          </button>
        </div>
      </div>

      {/* 2. Data Table (按照设计稿设计，包括 术语ID、名称、分类、内容、操作) */}
      <div className="bg-white rounded border border-[#E4E7ED] shadow-xs flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#F8FAFC] text-[#606266] font-semibold border-b border-[#E4E7ED] sticky top-0 z-10 select-none">
              <tr>
                <th className="py-3 px-4 w-24 text-center">术语ID</th>
                <th className="py-3 px-4 w-48">名称</th>
                <th className="py-3 px-4 w-44">分类</th>
                <th className="py-3 px-4">内容</th>
                <th className="py-3 px-4 w-36 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7ED] text-[#303133]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[#909399]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#2F7BFE] border-t-transparent rounded-full animate-spin" />
                      <span>正在加载术语数据...</span>
                    </div>
                  </td>
                </tr>
              ) : terms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[#909399]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <BookOpen className="w-8 h-8 text-[#C0C4CC]" />
                      <span>暂无匹配的流程术语数据</span>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="text-[#2F7BFE] hover:underline text-xs mt-1 cursor-pointer"
                      >
                        清空搜索条件
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                terms.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-[#F8FAFC] transition-colors group"
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-[#606266]">
                      {t.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#303133]">
                      {t.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#606266]">
                      {t.category}
                    </td>
                    <td className="py-3.5 px-4 text-[#303133] leading-relaxed">
                      {t.content}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(t)}
                          className="text-[#2F7BFE] hover:underline cursor-pointer font-medium"
                        >
                          编辑
                        </button>
                        <span className="text-[#DCDFE6]">|</span>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ visible: true, term: t })}
                          className="text-[#F56C6C] hover:underline cursor-pointer font-medium"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Bottom Pagination (对齐设计稿：共 X 条 | 10条/页 | < 1 > | 前往 1 页) */}
        <div className="px-5 py-3 border-t border-[#E4E7ED] bg-white flex items-center justify-end gap-3 text-xs text-[#606266] shrink-0">
          <span className="mr-1">共 {total} 条</span>

          <div className="flex items-center">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageNum(1);
              }}
              className="h-7 px-2 text-xs bg-white border border-[#DCDFE6] rounded outline-none cursor-pointer"
            >
              <option value={10}>10条/页</option>
              <option value={20}>20条/页</option>
              <option value={30}>30条/页</option>
              <option value={50}>50条/页</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pageNum <= 1}
              onClick={() => setPageNum((p) => Math.max(1, p - 1))}
              className={`w-7 h-7 rounded border flex items-center justify-center transition-colors ${
                pageNum <= 1
                  ? 'border-[#E4E7ED] text-[#C0C4CC] cursor-not-allowed bg-[#FAFAFA]'
                  : 'border-[#DCDFE6] hover:border-[#2F7BFE] text-[#606266] bg-white cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              className="w-7 h-7 rounded bg-[#2F7BFE] text-white flex items-center justify-center font-mono font-medium shadow-2xs"
            >
              {pageNum}
            </button>

            <button
              type="button"
              disabled={pageNum >= totalPages}
              onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))}
              className={`w-7 h-7 rounded border flex items-center justify-center transition-colors ${
                pageNum >= totalPages
                  ? 'border-[#E4E7ED] text-[#C0C4CC] cursor-not-allowed bg-[#FAFAFA]'
                  : 'border-[#DCDFE6] hover:border-[#2F7BFE] text-[#606266] bg-white cursor-pointer'
              }`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-1">
            <span>前往</span>
            <input
              type="text"
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const p = parseInt(jumpPage, 10);
                  if (p >= 1 && p <= totalPages) {
                    setPageNum(p);
                  }
                }
              }}
              className="w-10 h-7 text-center font-mono text-xs bg-white border border-[#DCDFE6] rounded outline-none"
            />
            <span>页</span>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 弹窗 1：新增 / 编辑流程术语 */}
      {/* ================================================================= */}
      {editModal.visible && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-xl border border-[#E4E7ED] overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-[#E4E7ED] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2F7BFE]" />
                <h3 className="font-bold text-sm text-[#303133]">
                  {editModal.isCreate ? '新增流程术语' : '编辑流程术语'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModal({ visible: false, isCreate: true, data: null })}
                className="text-[#909399] hover:text-[#303133]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* 术语名称 */}
              <div>
                <label className="block font-medium text-[#303133] mb-1">
                  术语名称 <span className="text-[#F56C6C]">*</span>
                </label>
                <input
                  type="text"
                  value={editModal.data?.name || ''}
                  onChange={(e) =>
                    setEditModal((prev) => ({
                      ...prev,
                      data: prev.data ? { ...prev.data, name: e.target.value } : null,
                    }))
                  }
                  placeholder="如: IPD / LTC / SQM"
                  className="w-full h-8 px-2.5 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] outline-none"
                />
              </div>

              {/* 术语分类 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-[#303133]">
                    所属分类 <span className="text-[#F56C6C]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenCategoryModal}
                    className="text-[#2F7BFE] hover:underline text-[11px]"
                  >
                    管理分类
                  </button>
                </div>
                <select
                  value={editModal.data?.category || ''}
                  onChange={(e) =>
                    setEditModal((prev) => ({
                      ...prev,
                      data: prev.data ? { ...prev.data, category: e.target.value } : null,
                    }))
                  }
                  className="w-full h-8 px-2 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] outline-none bg-white cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 内容 / 释义说明 */}
              <div>
                <label className="block font-medium text-[#303133] mb-1">
                  术语内容与释义 <span className="text-[#F56C6C]">*</span>
                </label>
                <textarea
                  rows={4}
                  value={editModal.data?.content || ''}
                  onChange={(e) =>
                    setEditModal((prev) => ({
                      ...prev,
                      data: prev.data ? { ...prev.data, content: e.target.value } : null,
                    }))
                  }
                  placeholder="如: Integrated Products Development (集成产品开发)，旨在通过跨部门团队协同缩短研发周期..."
                  className="w-full p-2.5 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#E4E7ED] bg-[#FAFAFA] flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditModal({ visible: false, isCreate: true, data: null })}
                className="px-4 h-8 rounded border border-[#DCDFE6] hover:bg-white text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveTerm}
                className="px-4 h-8 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white font-medium cursor-pointer shadow-xs"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 弹窗 2：分类管理 */}
      {/* ================================================================= */}
      {categoryModal.visible && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-xl border border-[#E4E7ED] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-[#E4E7ED] flex items-center justify-between bg-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-[#2F7BFE]" />
                <h3 className="font-bold text-sm text-[#303133]">流程术语分类管理</h3>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModal((prev) => ({ ...prev, visible: false }))}
                className="text-[#909399] hover:text-[#303133]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
              {/* 新增分类表单 */}
              <div className="p-3 bg-[#F8FAFC] border border-[#E4E7ED] rounded space-y-2">
                <span className="font-semibold text-[#303133] block">快速新增分类</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={categoryModal.newCategoryName}
                    onChange={(e) =>
                      setCategoryModal((prev) => ({
                        ...prev,
                        newCategoryName: e.target.value,
                      }))
                    }
                    placeholder="分类名称 (如: 信息技术类)"
                    className="flex-1 h-8 px-2.5 border border-[#DCDFE6] rounded bg-white outline-none focus:border-[#2F7BFE]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="h-8 px-3 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white font-medium cursor-pointer"
                  >
                    添加
                  </button>
                </div>
              </div>

              {/* 现有分类列表 */}
              <div className="border border-[#E4E7ED] rounded overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#FAFAFA] text-[#606266] font-semibold border-b border-[#E4E7ED]">
                    <tr>
                      <th className="p-2.5">分类名称</th>
                      <th className="p-2.5 text-center w-24">关联术语</th>
                      <th className="p-2.5 text-center w-28">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7ED]">
                    {categoryModal.list.map((cat) => {
                      const isEditing = categoryModal.editingId === cat.id;

                      return (
                        <tr key={cat.id} className="hover:bg-[#F5F7FA]">
                          <td className="p-2.5">
                            {isEditing ? (
                              <input
                                type="text"
                                value={categoryModal.editingName}
                                onChange={(e) =>
                                  setCategoryModal((prev) => ({
                                    ...prev,
                                    editingName: e.target.value,
                                  }))
                                }
                                className="h-7 px-2 border border-[#2F7BFE] rounded w-full outline-none bg-white"
                              />
                            ) : (
                              <span className="font-medium text-[#303133]">
                                {cat.name}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#F0F2F5] text-[#606266]">
                              {cat.count || 0} 个
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditCategory(cat.id)}
                                  className="text-[#67C23A] hover:underline cursor-pointer"
                                >
                                  保存
                                </button>
                                <span className="text-[#DCDFE6]">|</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCategoryModal((prev) => ({
                                      ...prev,
                                      editingId: null,
                                    }))
                                  }
                                  className="text-[#909399] hover:underline cursor-pointer"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCategoryModal((prev) => ({
                                      ...prev,
                                      editingId: cat.id,
                                      editingName: cat.name,
                                      editingDesc: cat.description || '',
                                    }))
                                  }
                                  className="text-[#2F7BFE] hover:underline cursor-pointer"
                                >
                                  编辑
                                </button>
                                <span className="text-[#DCDFE6]">|</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                  className="text-[#F56C6C] hover:underline cursor-pointer"
                                >
                                  删除
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#E4E7ED] bg-[#FAFAFA] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setCategoryModal((prev) => ({ ...prev, visible: false }))}
                className="px-4 h-8 rounded bg-[#2F7BFE] text-white text-xs font-medium cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 弹窗 3：删除确认 */}
      {/* ================================================================= */}
      {deleteConfirm.visible && deleteConfirm.term && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-lg shadow-xl border border-[#E4E7ED] overflow-hidden">
            <div className="p-5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FEF0F0] flex items-center justify-center text-[#F56C6C] shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 text-xs">
                <h3 className="font-bold text-sm text-[#303133]">
                  确认删除术语「{deleteConfirm.term.name}」？
                </h3>
                <p className="text-[#909399] mt-1.5 leading-relaxed">
                  删除后该术语将从术语库及相关流程引用中移除。
                </p>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#E4E7ED] bg-[#FAFAFA] flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ visible: false, term: null })}
                className="px-4 h-8 rounded border border-[#DCDFE6] hover:bg-white text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDeleteTerm}
                className="px-4 h-8 rounded bg-[#F56C6C] hover:bg-[#E64242] text-white font-medium cursor-pointer shadow-xs"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
