import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { GripVertical, RotateCcw } from 'lucide-react';

export interface TableColumnConfig {
  key: string;
  title: string | React.ReactNode;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  canDrag?: boolean;
  canResize?: boolean;
  className?: string;
}

export interface UseTableDnDAndResizeOptions {
  storageKey: string;
  columns: TableColumnConfig[];
}

export function useTableDnDAndResize({ storageKey, columns: initialColumns }: UseTableDnDAndResizeOptions) {
  // 1. Initial Column Widths
  const defaultWidths = useMemo(() => {
    const map: Record<string, number> = {};
    initialColumns.forEach((c) => {
      map[c.key] = c.defaultWidth;
    });
    return map;
  }, [initialColumns]);

  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_col_widths`);
      if (saved) {
        return { ...defaultWidths, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return { ...defaultWidths };
  });

  // 2. Initial Column Order
  const defaultOrder = useMemo(() => initialColumns.map((c) => c.key), [initialColumns]);

  const [colOrder, setColOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_col_order`);
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

  // Save to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_col_widths`, JSON.stringify(colWidths));
    } catch {
      // ignore
    }
  }, [colWidths, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_col_order`, JSON.stringify(colOrder));
    } catch {
      // ignore
    }
  }, [colOrder, storageKey]);

  // Compute final ordered columns respecting fixed positions
  const orderedColumns = useMemo(() => {
    const colMap = new Map<string, TableColumnConfig>(
      initialColumns.map((c) => [c.key, c])
    );

    const ordered: TableColumnConfig[] = [];
    colOrder.forEach((k) => {
      const c = colMap.get(k);
      if (c) ordered.push(c);
    });

    // Make sure any newly added columns in code are retained
    initialColumns.forEach((c) => {
      if (!ordered.some((o) => o.key === c.key)) {
        ordered.push(c);
      }
    });

    const leftFixed = ordered.filter((c) => c.fixed === 'left');
    const centerCols = ordered.filter((c) => !c.fixed);
    const rightFixed = ordered.filter((c) => c.fixed === 'right');

    return [...leftFixed, ...centerCols, ...rightFixed];
  }, [initialColumns, colOrder]);

  // 3. Drag and Drop Reordering State
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, key: string, col: TableColumnConfig) => {
    if (col.canDrag === false || col.fixed) {
      e.preventDefault();
      return;
    }
    setDraggingKey(key);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetKey: string, col: TableColumnConfig) => {
      e.preventDefault();
      if (!draggingKey || draggingKey === targetKey || col.fixed || col.canDrag === false) {
        return;
      }
      e.dataTransfer.dropEffect = 'move';
      const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const midPoint = targetRect.left + targetRect.width / 2;
      const pos = e.clientX < midPoint ? 'before' : 'after';
      setDragOverKey(targetKey);
      setDropPosition(pos);
    },
    [draggingKey]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverKey(null);
    setDropPosition(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetKey: string, col: TableColumnConfig) => {
      e.preventDefault();
      if (!draggingKey || draggingKey === targetKey || col.fixed || col.canDrag === false) {
        setDraggingKey(null);
        setDragOverKey(null);
        setDropPosition(null);
        return;
      }

      setColOrder((prev) => {
        const next = [...prev];
        const fromIdx = next.indexOf(draggingKey);
        const toIdx = next.indexOf(targetKey);
        if (fromIdx === -1 || toIdx === -1) return prev;

        next.splice(fromIdx, 1);
        const insertIdx = dropPosition === 'after' ? next.indexOf(targetKey) + 1 : next.indexOf(targetKey);
        next.splice(insertIdx, 0, draggingKey);
        return next;
      });

      setDraggingKey(null);
      setDragOverKey(null);
      setDropPosition(null);
    },
    [draggingKey, dropPosition]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingKey(null);
    setDragOverKey(null);
    setDropPosition(null);
  }, []);

  // 4. Border Drag-to-Resize Column Width State matching 变更记录 (EnterpriseDataGrid)
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [resizingKey, setResizingKey] = useState<string | null>(null);
  const [resizingWidth, setResizingWidth] = useState<number | null>(null);
  const [resizingInfo, setResizingInfo] = useState<{ key: string; guideX: number } | null>(null);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, col: TableColumnConfig) => {
      if (col.canResize === false) return;
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const containerRect = tableContainerRef.current?.getBoundingClientRect();
      const startWidth = colWidths[col.key] ?? col.defaultWidth;
      const minW = col.minWidth ?? 50;
      const maxW = col.maxWidth ?? 900;

      setResizingKey(col.key);
      setResizingWidth(startWidth);
      setResizingInfo({
        key: col.key,
        guideX: containerRect ? Math.max(0, e.clientX - containerRect.left) : 0,
      });

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const nextWidth = Math.min(maxW, Math.max(minW, startWidth + deltaX));
        setResizingWidth(nextWidth);
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
        setResizingKey(null);
        setResizingWidth(null);
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
    },
    [colWidths]
  );

  // Double-click resize handle to toggle default / expanded (matching 变更记录 EnterpriseDataGrid)
  const handleDoubleClickResize = useCallback(
    (e: React.MouseEvent, col: TableColumnConfig) => {
      e.preventDefault();
      e.stopPropagation();
      const defW = col.defaultWidth ?? 120;
      const current = colWidths[col.key] ?? defW;
      const expanded = Math.max(defW + 120, Math.round(defW * 1.45));
      const next = Math.abs(current - defW) < 10 ? expanded : defW;
      setColWidths((prev) => ({
        ...prev,
        [col.key]: next,
      }));
    },
    [colWidths]
  );

  // Total width of all columns for table-fixed layout
  const totalTableWidth = useMemo(() => {
    return orderedColumns.reduce((sum, col) => sum + (colWidths[col.key] ?? col.defaultWidth), 0);
  }, [orderedColumns, colWidths]);

  // Reset all column widths and order
  const resetColumns = useCallback(() => {
    setColWidths({ ...defaultWidths });
    setColOrder([...defaultOrder]);
    try {
      localStorage.removeItem(`${storageKey}_col_widths`);
      localStorage.removeItem(`${storageKey}_col_order`);
    } catch {
      // ignore
    }
  }, [defaultWidths, defaultOrder, storageKey]);

  return {
    columns: orderedColumns,
    colWidths,
    colOrder,
    totalTableWidth,
    tableContainerRef,
    resizingInfo,
    resizingKey,
    resizingWidth,
    draggingKey,
    dragOverKey,
    dropPosition,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleResizeStart,
    handleDoubleClickResize,
    resetColumns,
  };
}

// Full-height resize guide line spanning the entire table, matching 变更记录 (EnterpriseDataGrid)
export const TableResizeGuideLine: React.FC<{
  resizingInfo: { key: string; guideX: number } | null;
}> = ({ resizingInfo }) => {
  if (!resizingInfo) return null;
  return (
    <div
      style={{ left: `${resizingInfo.guideX}px` }}
      className="absolute top-0 bottom-0 w-[2px] bg-[#409eff] z-50 pointer-events-none shadow-[0_0_6px_rgba(64,158,255,0.6)]"
    />
  );
};

// Colgroup helper for strict table-fixed column sizing matching 变更记录 (EnterpriseDataGrid)
export const TableColGroup: React.FC<{
  columns: TableColumnConfig[];
  colWidths: Record<string, number>;
}> = ({ columns, colWidths }) => (
  <colgroup>
    {columns.map((col) => (
      <col
        key={col.key}
        style={{ width: `${colWidths[col.key] ?? col.defaultWidth}px` }}
      />
    ))}
  </colgroup>
);

// Reusable TH component for Draggable & Resizable Table Header matching 变更记录 (EnterpriseDataGrid)
interface TableHeaderCellProps {
  col: TableColumnConfig;
  width: number;
  isDragging?: boolean;
  isDragOver?: boolean;
  dropPosition?: 'before' | 'after' | null;
  isResizing?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onResizeStart?: (e: React.MouseEvent) => void;
  onDoubleClickResize?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({
  col,
  width,
  isDragging,
  isDragOver,
  dropPosition,
  isResizing,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onResizeStart,
  onDoubleClickResize,
  children,
}) => {
  const canDrag = col.canDrag !== false && !col.fixed;
  const canResize = col.canResize !== false;

  const alignClass =
    col.align === 'center'
      ? 'text-center justify-center'
      : col.align === 'right'
      ? 'text-right justify-end'
      : 'text-left justify-start';

  return (
    <th
      style={{
        width: `${width}px`,
        minWidth: `${col.minWidth ?? width}px`,
        maxWidth: col.maxWidth ? `${col.maxWidth}px` : undefined,
      }}
      draggable={canDrag}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`relative select-none border-b border-[#ebeef5] border-r border-[#ebeef5] transition-colors group ${
        isDragging
          ? 'opacity-40 bg-[#e6f7ff]'
          : isDragOver
          ? 'bg-[#ecf5ff]'
          : 'bg-[#f5f7fa] hover:bg-[#ebf1f8]'
      } ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${col.className || ''}`}
    >
      <div className={`flex items-center gap-1.5 px-3 py-2.5 h-full min-w-0 ${alignClass}`}>
        {canDrag && (
          <span title="拖拽调整列顺序" className="inline-flex shrink-0">
            <GripVertical className="w-3 h-3 text-[#c0c4cc] opacity-0 group-hover:opacity-100 cursor-grab shrink-0 transition-opacity" />
          </span>
        )}
        <span className="truncate font-semibold text-[#606266] group-hover:text-[#262626]">
          {children || col.title}
        </span>
      </div>

      {/* Right Border Resize Handle matching 变更记录 (EnterpriseDataGrid) */}
      {canResize && (
        <div
          data-resize-handle="true"
          onMouseDown={onResizeStart}
          onDoubleClick={onDoubleClickResize}
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
      )}
    </th>
  );
};
