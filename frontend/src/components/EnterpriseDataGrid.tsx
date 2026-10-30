import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Pin,
  PinOff,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
  RotateCcw,
} from 'lucide-react';

export interface DataGridColumn<T = any> {
  key: string;
  label?: React.ReactNode;
  title?: string;
  defaultWidth?: number;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  frozen?: 'left' | 'right';
  sortable?: boolean;
  render?: (row: T, rowIndex: number) => React.ReactNode;
  tooltipText?: (row: T, rowIndex: number) => string | undefined;
  cellClassName?: string;
}

export interface EnterpriseDataGridProps<T = any> {
  storageKey: string;
  columns: DataGridColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  loading?: boolean;
  emptyText?: string;
  maxHeight?: string;
  minHeight?: string;
  toolbarTitle?: React.ReactNode;
  toolbarExtra?: React.ReactNode;
  showToolbar?: boolean;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  defaultPageSize?: number;
}

export function EnterpriseDataGrid<T = any>({
  storageKey,
  columns: initialColumns,
  data,
  rowKey,
  loading = false,
  emptyText = '暂无数据',
  maxHeight = 'calc(100vh - 255px)',
  minHeight = '320px',
  toolbarTitle,
  toolbarExtra,
  showToolbar = true,
  onRowClick,
  selectedKeys,
}: EnterpriseDataGridProps<T>) {
  const defaultWidths = useMemo(() => {
    const map: Record<string, number> = {};
    initialColumns.forEach((c) => {
      map[c.key] = c.defaultWidth ?? c.width ?? 120;
    });
    return map;
  }, [initialColumns]);

  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_widths`);
      if (saved) {
        return { ...defaultWidths, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return { ...defaultWidths };
  });

  const defaultFixed = useMemo(() => {
    const map: Record<string, 'left' | 'right' | undefined> = {};
    initialColumns.forEach((c) => {
      map[c.key] = c.fixed ?? c.frozen;
    });
    return map;
  }, [initialColumns]);

  const [colFixed, setColFixed] = useState<Record<string, 'left' | 'right' | undefined>>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_fixed`);
      if (saved) {
        return { ...defaultFixed, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return { ...defaultFixed };
  });

  const defaultOrder = useMemo(() => initialColumns.map((c) => c.key), [initialColumns]);
  const [colOrder, setColOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_order`);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length === initialColumns.length &&
          initialColumns.every((c) => parsed.includes(c.key))
        ) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return defaultOrder;
  });

  const [density, setDensity] = useState<'compact' | 'standard' | 'relaxed'>('standard');

  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_widths`, JSON.stringify(colWidths));
    } catch {
      // ignore
    }
  }, [colWidths, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_fixed`, JSON.stringify(colFixed));
    } catch {
      // ignore
    }
  }, [colFixed, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_order`, JSON.stringify(colOrder));
    } catch {
      // ignore
    }
  }, [colOrder, storageKey]);

  const orderedColumns = useMemo(() => {
    const colMap = new Map<string, DataGridColumn<T>>(
      initialColumns.map((c) => [c.key, c] as [string, DataGridColumn<T>])
    );
    const ordered: DataGridColumn<T>[] = [];
    colOrder.forEach((k) => {
      const found = colMap.get(k);
      if (found) ordered.push(found);
    });
    initialColumns.forEach((c) => {
      if (!ordered.some((o) => o.key === c.key)) {
        ordered.push(c);
      }
    });
    const leftCols = ordered.filter((c) => colFixed[c.key] === 'left');
    const centerCols = ordered.filter((c) => !colFixed[c.key]);
    const rightCols = ordered.filter((c) => colFixed[c.key] === 'right');
    return [...leftCols, ...centerCols, ...rightCols];
  }, [initialColumns, colOrder, colFixed]);

  const { leftOffsets, rightOffsets, lastLeftKey, firstRightKey, totalWidth } = useMemo(() => {
    const lefts: Record<string, number> = {};
    const rights: Record<string, number> = {};
    let leftAcc = 0;
    let lastLeft: string | null = null;
    for (const col of orderedColumns) {
      const w = colWidths[col.key] || col.defaultWidth || col.width || 120;
      if (colFixed[col.key] === 'left') {
        lefts[col.key] = leftAcc;
        leftAcc += w;
        lastLeft = col.key;
      }
    }
    let rightAcc = 0;
    let firstRight: string | null = null;
    for (let i = orderedColumns.length - 1; i >= 0; i--) {
      const col = orderedColumns[i];
      const w = colWidths[col.key] || col.defaultWidth || col.width || 120;
      if (colFixed[col.key] === 'right') {
        rights[col.key] = rightAcc;
        rightAcc += w;
        firstRight = col.key;
      }
    }
    const total = orderedColumns.reduce(
      (sum, col) => sum + (colWidths[col.key] || col.defaultWidth || col.width || 120),
      0
    );
    return {
      leftOffsets: lefts,
      rightOffsets: rights,
      lastLeftKey: lastLeft,
      firstRightKey: firstRight,
      totalWidth: total,
    };
  }, [orderedColumns, colWidths, colFixed]);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState({
    isScrolledLeft: false,
    isScrolledRight: false,
  });

  const updateScrollShadows = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isLeft = el.scrollLeft > 2;
    const isRight = el.scrollWidth - el.clientWidth - el.scrollLeft > 2;
    setScrollState((prev) =>
      prev.isScrolledLeft === isLeft && prev.isScrolledRight === isRight
        ? prev
        : { isScrolledLeft: isLeft, isScrolledRight: isRight }
    );
  };

  useEffect(() => {
    updateScrollShadows();
    window.addEventListener('resize', updateScrollShadows);
    return () => window.removeEventListener('resize', updateScrollShadows);
  }, [totalWidth, data.length]);

  const [resizingInfo, setResizingInfo] = useState<{
    key: string;
    guideX: number;
  } | null>(null);

  const handleStartResize = (e: React.MouseEvent, col: DataGridColumn<T>) => {
    e.preventDefault();
    e.stopPropagation();
    const containerRect = scrollContainerRef.current?.getBoundingClientRect();
    const startX = e.clientX;
    const startWidth = colWidths[col.key] || col.defaultWidth || col.width || 120;
    const minW = col.minWidth ?? 65;
    const maxW = col.maxWidth ?? 900;
    setResizingInfo({
      key: col.key,
      guideX: containerRect ? e.clientX - containerRect.left : 0,
    });
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const nextWidth = Math.min(maxW, Math.max(minW, startWidth + deltaX));
      setColWidths((prev) => ({
        ...prev,
        [col.key]: nextWidth,
      }));
      if (containerRect) {
        setResizingInfo({
          key: col.key,
          guideX: Math.max(0, Math.min(containerRect.width, moveEvent.clientX - containerRect.left)),
        });
      }
    };
    const handleMouseUp = () => {
      setResizingInfo(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClickResize = (e: React.MouseEvent, col: DataGridColumn<T>) => {
    e.preventDefault();
    e.stopPropagation();
    const defW = col.defaultWidth ?? col.width ?? 120;
    const current = colWidths[col.key] ?? defW;
    const expanded = Math.max(defW + 120, Math.round(defW * 1.45));
    const next = Math.abs(current - defW) < 10 ? expanded : defW;
    setColWidths((prev) => ({
      ...prev,
      [col.key]: next,
    }));
  };

  const [draggingColKey, setDraggingColKey] = useState<string | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);

  const handleColDragStart = (e: React.DragEvent, key: string) => {
    setDraggingColKey(key);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  };

  const handleColDragOver = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggingColKey || draggingColKey === targetKey) return;
    setDragOverColKey(targetKey);
  };

  const handleColDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    const sourceKey = draggingColKey || e.dataTransfer.getData('text/plain');
    setDraggingColKey(null);
    setDragOverColKey(null);
    if (!sourceKey || sourceKey === targetKey) return;
    setColOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(sourceKey);
      const toIdx = next.indexOf(targetKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, sourceKey);
      return next;
    });
  };

  const togglePinColumn = (e: React.MouseEvent, col: DataGridColumn<T>) => {
    e.stopPropagation();
    setColFixed((prev) => {
      const current = prev[col.key];
      let nextFixed: 'left' | 'right' | undefined;
      if (current === 'left') {
        nextFixed = undefined;
      } else if (current === 'right') {
        nextFixed = undefined;
      } else {
        nextFixed = col.key === 'actions' ? 'right' : 'left';
      }
      return {
        ...prev,
        [col.key]: nextFixed,
      };
    });
  };

  const [isGrabScrolling, setIsGrabScrolling] = useState(false);
  const grabStartRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  const handleBodyMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('a') ||
      target.closest('[data-resize-handle="true"]')
    ) {
      return;
    }
    if (e.button !== 0 || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    grabStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      left: container.scrollLeft,
      top: container.scrollTop,
    };
    const handleMove = (moveEvent: MouseEvent) => {
      if (!grabStartRef.current || !scrollContainerRef.current) return;
      const dx = moveEvent.clientX - grabStartRef.current.x;
      const dy = moveEvent.clientY - grabStartRef.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        setIsGrabScrolling(true);
        scrollContainerRef.current.scrollLeft = grabStartRef.current.left - dx;
        scrollContainerRef.current.scrollTop = grabStartRef.current.top - dy;
      }
    };
    const handleUp = () => {
      grabStartRef.current = null;
      setIsGrabScrolling(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const handleResetAll = () => {
    setColWidths({ ...defaultWidths });
    setColFixed({ ...defaultFixed });
    setColOrder([...defaultOrder]);
    try {
      localStorage.removeItem(`${storageKey}_widths`);
      localStorage.removeItem(`${storageKey}_fixed`);
      localStorage.removeItem(`${storageKey}_order`);
    } catch {
      // ignore
    }
  };

  const scrollByOffset = (deltaX: number) => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: deltaX, behavior: 'smooth' });
  };

  const [hoverTooltip, setHoverTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const cellPaddingClass =
    density === 'compact'
      ? 'py-2 px-2.5'
      : density === 'relaxed'
      ? 'py-4 px-3.5'
      : 'py-3 px-3';
  const headerPaddingClass =
    density === 'compact'
      ? 'py-2 px-2.5'
      : density === 'relaxed'
      ? 'py-3.5 px-3.5'
      : 'py-2.5 px-3';

  return (
    <div className="flex flex-col min-h-0 w-full">
      {showToolbar && (
        <div className="mb-2.5 px-3 py-2 rounded bg-[#f8f9fb] border border-[#e4e7ed] flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            {toolbarTitle && <div className="font-medium text-[#303133]">{toolbarTitle}</div>}
            <div className="flex items-center gap-1.5 text-[11px] text-[#606266] bg-white px-2.5 py-1 rounded border border-[#ebeef5]">
              <Pin className="w-3 h-3 text-[#409eff] shrink-0" />
              <span>
                冻结列：左侧{' '}
                <strong className="text-[#409eff]">
                  {orderedColumns.filter((c) => colFixed[c.key] === 'left').length}
                </strong>{' '}
                | 右侧{' '}
                <strong className="text-[#409eff]">
                  {orderedColumns.filter((c) => colFixed[c.key] === 'right').length}
                </strong>{' '}
                列
              </span>
              <span className="text-[#c0c4cc] mx-1">|</span>
              <MoveHorizontal className="w-3 h-3 text-[#409eff] shrink-0" />
              <span>支持拖拽表头重排 & 边框拖拽调宽</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {toolbarExtra}
            <div className="flex items-center rounded border border-[#dcdfe6] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => scrollByOffset(-280)}
                title="向左滚动"
                className="h-7 px-2 hover:bg-[#ecf5ff] text-[#606266] hover:text-[#409eff] flex items-center cursor-pointer transition-colors border-r border-[#ebeef5]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollByOffset(280)}
                title="向右滚动"
                className="h-7 px-2 hover:bg-[#ecf5ff] text-[#606266] hover:text-[#409eff] flex items-center cursor-pointer transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="hidden sm:flex items-center rounded border border-[#dcdfe6] bg-white overflow-hidden text-[11px]">
              {(
                [
                  { key: 'compact', label: '紧凑' },
                  { key: 'standard', label: '标准' },
                  { key: 'relaxed', label: '宽松' },
                ] as const
              ).map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDensity(d.key)}
                  className={`h-7 px-2 cursor-pointer transition-colors ${
                    density === d.key
                      ? 'bg-[#409eff] text-white font-medium'
                      : 'text-[#606266] hover:bg-[#f5f7fa]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleResetAll}
              title="重置表格宽度与布局"
              className="h-7 px-2.5 rounded border border-[#dcdfe6] bg-white hover:border-[#409eff] hover:text-[#409eff] text-[#606266] text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>重置布局</span>
            </button>
          </div>
        </div>
      )}

      <div className="relative flex-1 min-h-0 flex flex-col border border-[#dcdfe6] rounded bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {resizingInfo && (
          <div
            style={{ left: `${resizingInfo.guideX}px` }}
            className="absolute top-0 bottom-0 w-[2px] bg-[#409eff] z-50 pointer-events-none shadow-[0_0_6px_rgba(64,158,255,0.6)]"
          />
        )}
        <div
          ref={scrollContainerRef}
          onScroll={() => {
            updateScrollShadows();
            if (hoverTooltip) setHoverTooltip(null);
          }}
          onMouseDown={handleBodyMouseDown}
          style={{ maxHeight, minHeight }}
          className={`w-full flex-1 overflow-auto relative ${
            isGrabScrolling ? 'cursor-grabbing select-none' : ''
          }`}
        >
          <table
            style={{ width: `${totalWidth}px`, minWidth: '100%' }}
            className="border-separate border-spacing-0 text-xs table-fixed"
          >
            <colgroup>
              {orderedColumns.map((col) => (
                <col
                  key={col.key}
                  style={{ width: `${colWidths[col.key] || col.defaultWidth || col.width || 120}px` }}
                />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-30">
              <tr className="bg-[#f5f7fa] text-[#606266]">
                {orderedColumns.map((col, colIdx) => {
                  const fixedSide = colFixed[col.key];
                  const isLastLeft = col.key === lastLeftKey;
                  const isFirstRight = col.key === firstRightKey;
                  const isResizing = resizingInfo?.key === col.key;
                  const isDragOver = dragOverColKey === col.key;
                  const stickyStyle: React.CSSProperties =
                    fixedSide === 'left'
                      ? {
                          position: 'sticky',
                          left: `${leftOffsets[col.key] ?? 0}px`,
                          zIndex: 35,
                        }
                      : fixedSide === 'right'
                      ? {
                          position: 'sticky',
                          right: `${rightOffsets[col.key] ?? 0}px`,
                          zIndex: 35,
                        }
                      : {};

                  const alignClass =
                    col.align === 'center'
                      ? 'text-center justify-center'
                      : col.align === 'right'
                      ? 'text-right justify-end'
                      : 'text-left justify-start';

                  return (
                    <th
                      key={col.key}
                      draggable
                      onDragStart={(e) => handleColDragStart(e, col.key)}
                      onDragOver={(e) => handleColDragOver(e, col.key)}
                      onDragLeave={() => setDragOverColKey(null)}
                      onDrop={(e) => handleColDrop(e, col.key)}
                      style={stickyStyle}
                      className={`${headerPaddingClass} font-semibold select-none relative group border-b border-[#dcdfe6] ${
                        colIdx < orderedColumns.length - 1 ? 'border-r border-[#dcdfe6]' : ''
                      } ${
                        fixedSide
                          ? 'bg-[#eef3fb] text-[#1f2733]'
                          : isDragOver
                          ? 'bg-[#ecf5ff]'
                          : 'bg-[#f5f7fa]'
                      } ${
                        isLastLeft && scrollState.isScrolledLeft
                          ? 'shadow-[4px_0_8px_-2px_rgba(0,0,0,0.14)]'
                          : ''
                      } ${
                        isFirstRight && scrollState.isScrolledRight
                          ? 'shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.14)] border-l border-[#dcdfe6]'
                          : ''
                      }`}
                    >
                      <div className={`flex items-center gap-1 min-w-0 ${alignClass}`}>
                        <span title="拖拽调整列顺序" className="inline-flex shrink-0">
                          <GripVertical className="w-3 h-3 text-[#c0c4cc] opacity-0 group-hover:opacity-100 cursor-grab shrink-0 transition-opacity" />
                        </span>
                        <span
                          className="truncate"
                          title={typeof col.label === 'string' ? col.label : col.title || ''}
                        >
                          {col.label ?? col.title ?? ''}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => togglePinColumn(e, col)}
                          title={
                            fixedSide
                              ? '点击取消冻结'
                              : '点击冻结此列'
                          }
                          className={`p-0.5 rounded transition-opacity shrink-0 cursor-pointer ${
                            fixedSide
                              ? 'text-[#409eff] opacity-100 hover:bg-[#d9ecff]'
                              : 'text-[#909399] opacity-0 group-hover:opacity-100 hover:text-[#409eff] hover:bg-[#e4e7ed]/50'
                          }`}
                        >
                          {fixedSide ? (
                            <Pin className="w-3 h-3" />
                          ) : (
                            <PinOff className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div
                        data-resize-handle="true"
                        onMouseDown={(e) => handleStartResize(e, col)}
                        onDoubleClick={(e) => handleDoubleClickResize(e, col)}
                        title="拖拽调整列宽，双击自适应展开"
                        className="absolute top-0 -right-[4px] bottom-0 w-[8px] cursor-col-resize z-40 flex items-center justify-center group/resize"
                      >
                        <div
                          className={`w-[2px] h-full transition-colors ${
                            isResizing
                              ? 'bg-[#409eff]'
                              : 'bg-transparent group-hover/resize:bg-[#409eff]'
                          }`}
                        />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="text-[#606266]">
              {loading ? (
                <tr>
                  <td
                    colSpan={orderedColumns.length}
                    className="py-16 text-center text-[#909399] border-b border-[#ebeef5]"
                  >
                    数据加载中...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={orderedColumns.length}
                    className="py-16 text-center text-[#909399] border-b border-[#ebeef5]"
                  >
                    {emptyText}
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => {
                  const rKey = rowKey(row, rowIndex);
                  const isEven = rowIndex % 2 === 1;
                  const isSelected = !!selectedKeys?.includes(rKey);
                  return (
                    <tr
                      key={rKey}
                      onClick={() => onRowClick?.(row)}
                      className={`group/row transition-colors ${
                        isSelected
                          ? 'bg-[#ecf5ff] text-[#1f2733]'
                          : isEven
                          ? 'bg-[#fcfcfd]'
                          : 'bg-white'
                      } hover:bg-[#ecf5ff]/80 ${onRowClick ? 'cursor-pointer' : ''}`}
                    >
                      {orderedColumns.map((col, colIdx) => {
                        const fixedSide = colFixed[col.key];
                        const isLastLeft = col.key === lastLeftKey;
                        const isFirstRight = col.key === firstRightKey;
                        const stickyStyle: React.CSSProperties =
                          fixedSide === 'left'
                            ? {
                                position: 'sticky',
                                left: `${leftOffsets[col.key] ?? 0}px`,
                                zIndex: 15,
                              }
                            : fixedSide === 'right'
                            ? {
                                position: 'sticky',
                                right: `${rightOffsets[col.key] ?? 0}px`,
                                zIndex: 15,
                              }
                            : {};
                        const alignClass =
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left';

                        const rawTooltip = col.tooltipText
                          ? col.tooltipText(row, rowIndex)
                          : typeof (row as any)?.[col.key] === 'string' ||
                            typeof (row as any)?.[col.key] === 'number'
                          ? String((row as any)[col.key])
                          : undefined;

                        const cellContent = col.render
                          ? col.render(row, rowIndex)
                          : (row as any)?.[col.key] ?? '-';

                        return (
                          <td
                            key={col.key}
                            style={stickyStyle}
                            onMouseEnter={(e) => {
                              if (!rawTooltip || rawTooltip.length < 10) return;
                              const rect = (
                                e.currentTarget as HTMLElement
                              ).getBoundingClientRect();
                              setHoverTooltip({
                                text: rawTooltip,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                              });
                            }}
                            onMouseLeave={() => {
                              if (hoverTooltip) setHoverTooltip(null);
                            }}
                            className={`${cellPaddingClass} ${alignClass} border-b border-[#ebeef5] ${
                              colIdx === 0 && isSelected ? 'border-l-4 border-l-[#409eff]' : ''
                            } ${
                              colIdx < orderedColumns.length - 1
                                ? 'border-r border-[#ebeef5]'
                                : ''
                            } ${
                              isSelected
                                ? 'bg-[#ecf5ff] group-hover/row:bg-[#d9ecff]'
                                : fixedSide
                                ? isEven
                                  ? 'bg-[#f8fafe] group-hover/row:bg-[#ecf5ff]'
                                  : 'bg-white group-hover/row:bg-[#ecf5ff]'
                                : ''
                            } ${
                              isLastLeft && scrollState.isScrolledLeft
                                ? 'shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)]'
                                : ''
                            } ${
                              isFirstRight && scrollState.isScrolledRight
                                ? 'shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.12)] border-l border-[#ebeef5]'
                                : ''
                            } relative ${col.cellClassName || ''}`}
                          >
                            <div className="truncate whitespace-nowrap">{cellContent}</div>
                            <div
                              data-resize-handle="true"
                              onMouseDown={(e) => handleStartResize(e, col)}
                              onDoubleClick={(e) => handleDoubleClickResize(e, col)}
                              className="absolute top-0 -right-[4px] bottom-0 w-[8px] cursor-col-resize z-20 hover:bg-[#409eff]/35"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-3.5 py-2 bg-[#fafafa] border-t border-[#ebeef5] flex items-center justify-between text-[11px] text-[#909399] shrink-0">
          <div className="flex items-center gap-4">
            <span>
              共显示数据：<strong className="text-[#303133] font-mono-tabular">{data.length}</strong> 条
            </span>
            <span className="hidden md:inline">
              表格总宽度：<span className="font-mono-tabular">{totalWidth}px</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>滚动或拖拽体验企业级冻结视图</span>
          </div>
        </div>
      </div>

      {hoverTooltip && (
        <div
          style={{
            position: 'fixed',
            left: `${Math.min(
              Math.max(180, hoverTooltip.x),
              typeof window !== 'undefined' ? window.innerWidth - 220 : 1000
            )}px`,
            top: `${Math.max(48, hoverTooltip.y - 8)}px`,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-[9999] pointer-events-none max-w-md px-3 py-2 rounded bg-[#303133]/95 text-white text-xs leading-relaxed shadow-lg break-words"
        >
          {hoverTooltip.text}
          <div className="w-2 h-2 bg-[#303133]/95 rotate-45 mx-auto -mb-3 mt-1" />
        </div>
      )}
    </div>
  );
}
