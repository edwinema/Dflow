import React, { useState } from 'react';
import { User, Users, ChevronDown, X, Building2 } from 'lucide-react';
import { PersonSelectModal, PersonItem } from './PersonSelectModal';

export interface PersonSelectFieldProps {
  value?: string | string[];
  onChange: (value: string, person?: PersonItem, allPersons?: PersonItem[]) => void;
  multiSelect?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  title?: string;
  modalTitle?: string;
  modalDescription?: string;
  showToast?: (msg: string, type?: any) => void;
}

export const PersonSelectField: React.FC<PersonSelectFieldProps> = ({
  value,
  onChange,
  multiSelect = false,
  placeholder = '请选择或输入责任人...',
  disabled = false,
  className = '',
  title = '选择责任人',
  modalTitle,
  modalDescription,
  showToast,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const displayNames = Array.isArray(value) ? value : value ? [value] : [];
  const hasValue = displayNames.length > 0;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiSelect ? '' : '');
  };

  return (
    <>
      <div
        onClick={() => {
          if (!disabled) setModalOpen(true);
        }}
        className={`w-full min-h-[34px] px-2.5 py-1 rounded-lg border border-[#dcdfe6] bg-white hover:border-[#409eff] flex items-center justify-between gap-1.5 cursor-pointer text-xs transition-all select-none shadow-2xs group ${
          disabled ? 'opacity-60 cursor-not-allowed bg-[#f5f7fa]' : ''
        } ${className}`}
        title="点击打开责任人选择窗口 (支持手工输入与组织架构部门选择)"
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="w-5 h-5 rounded-full bg-[#ecf5ff] text-[#1677ff] flex items-center justify-center shrink-0">
            {multiSelect ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
          </div>

          {hasValue ? (
            <div className="flex items-center gap-1 flex-wrap min-w-0">
              {displayNames.map((name, i) => (
                <span
                  key={i}
                  className="font-medium text-[#1f2733] truncate max-w-[140px] px-1.5 py-0.2 rounded bg-[#f4f7fb] border border-[#e4e7ed] text-[11px]"
                >
                  {name}
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
              className="w-4 h-4 rounded-full hover:bg-[#f0f2f5] hover:text-[#f56c6c] flex items-center justify-center cursor-pointer transition-colors"
              title="清空"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-[#909399] group-hover:text-[#409eff] transition-colors" />
        </div>
      </div>

      {modalOpen && (
        <PersonSelectModal
          open={modalOpen}
          title={modalTitle || title}
          description={modalDescription}
          multiSelect={multiSelect}
          initialSelected={value}
          onClose={() => setModalOpen(false)}
          onConfirm={(selected, names) => {
            if (multiSelect) {
              onChange(names.join(','), selected[0], selected);
            } else {
              onChange(names[0] || '', selected[0], selected);
            }
          }}
          showToast={showToast}
        />
      )}
    </>
  );
};
