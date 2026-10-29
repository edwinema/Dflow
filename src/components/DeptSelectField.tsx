import React, { useState } from 'react';
import { Building2, ChevronDown, X } from 'lucide-react';
import { DeptSelectModal, DeptItem } from './DeptSelectModal';

export interface DeptSelectFieldProps {
  value?: string | string[];
  onChange: (value: string, selectedFirst?: DeptItem, allSelected?: DeptItem[], names?: string[]) => void;
  multiSelect?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  title?: string;
  modalTitle?: string;
  modalDescription?: string;
  showToast?: (msg: string, type?: any) => void;
}

export const DeptSelectField: React.FC<DeptSelectFieldProps> = ({
  value,
  onChange,
  multiSelect = true,
  placeholder = '请选择或输入部门/授权使用范围...',
  disabled = false,
  className = '',
  title = '选择部门与组织架构范围',
  modalTitle,
  modalDescription,
  showToast,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Normalize display names
  const displayNames = Array.isArray(value)
    ? value.filter(Boolean)
    : typeof value === 'string' && value.trim()
    ? value
        .split(/[,;，；\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const hasValue = displayNames.length > 0;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined, undefined, []);
  };

  const handleRemoveOne = (e: React.MouseEvent, nameToRemove: string) => {
    e.stopPropagation();
    const next = displayNames.filter((n) => n !== nameToRemove);
    onChange(next.join('、'), undefined, undefined, next);
  };

  return (
    <>
      <div
        onClick={() => {
          if (!disabled) setModalOpen(true);
        }}
        className={`w-full min-h-[34px] px-2.5 py-1 rounded-lg border border-[#dcdfe6] bg-white hover:border-[#1677ff] flex items-center justify-between gap-1.5 cursor-pointer text-xs transition-all select-none shadow-2xs group ${
          disabled ? 'opacity-60 cursor-not-allowed bg-[#f5f7fa]' : ''
        } ${className}`}
        title="点击打开组织架构部门与范围选择窗口 (支持手工输入与组织架构选择)"
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="w-5 h-5 rounded-full bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center shrink-0">
            <Building2 className="w-3 h-3" />
          </div>

          {hasValue ? (
            <div className="flex items-center gap-1 flex-wrap min-w-0 py-0.5">
              {displayNames.map((name, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 font-medium text-[#1e293b] truncate max-w-[170px] px-2 py-0.5 rounded-md bg-[#f1f5f9] border border-[#e2e8f0] text-[11px]"
                >
                  <span className="truncate">{name}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveOne(e, name)}
                      className="hover:text-[#ef4444] rounded-full transition-colors cursor-pointer text-[#94a3b8]"
                      title="移除此项"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[#9ca3af] truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-[#909399]">
          {hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="w-4 h-4 rounded-full hover:bg-[#f0f2f5] hover:text-[#ef4444] flex items-center justify-center cursor-pointer transition-colors"
              title="清空全部"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-[#909399] group-hover:text-[#1677ff] transition-colors" />
        </div>
      </div>

      {modalOpen && (
        <DeptSelectModal
          open={modalOpen}
          title={modalTitle || title}
          description={modalDescription}
          multiSelect={multiSelect}
          initialSelected={displayNames}
          onClose={() => setModalOpen(false)}
          onConfirm={(selected, names) => {
            if (multiSelect) {
              onChange(names.join('、'), selected[0], selected, names);
            } else {
              onChange(names[0] || '', selected[0], selected, names);
            }
          }}
          showToast={showToast}
        />
      )}
    </>
  );
};
