import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Flame,
  Clock,
  Layers,
  ArrowUpDown,
  Filter,
  AlertTriangle,
  Info,
  Maximize2,
  TrendingUp,
  Sliders,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  Grid3X3,
} from 'lucide-react';

export interface MiningNode {
  id: string;
  system: string;
  name: string;
  role: string;
  avgDuration: string;
  throughput: number;
  health: 'normal' | 'warning' | 'critical';
  desc: string;
}

interface ProcessNodeHeatmapProps {
  nodes: MiningNode[];
  selectedNode: MiningNode | null;
  onSelectNode: (node: MiningNode) => void;
  datasetTitle: string;
  onJumpToDiagnosis?: () => void;
}

// Helper to parse duration string to decimal days
export const parseDurationToDays = (str: string): number => {
  if (!str) return 0;
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  if (str.includes('小时') || str.includes('h')) return +(num / 24).toFixed(2);
  if (str.includes('分') || str.includes('m')) return +(num / (24 * 60)).toFixed(2);
  return num;
};

// System badge colors
const SYSTEM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CRM: { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' },
  PLM: { bg: '#f5f3ff', text: '#6d28d9', border: '#c4b5fd' },
  PMS: { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
  ERP: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  APS: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  SRM: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  MES: { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
};

export const ProcessNodeHeatmap: React.FC<ProcessNodeHeatmapProps> = ({
  nodes,
  selectedNode,
  onSelectNode,
  datasetTitle,
  onJumpToDiagnosis,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [metricDimension, setMetricDimension] = useState<'duration' | 'bottleneck_index' | 'throughput'>('duration');
  const [sortOrder, setSortOrder] = useState<'flow_sequence' | 'duration_desc' | 'system'>('flow_sequence');
  const [activeView, setActiveView] = useState<'matrix' | 'bars'>('matrix');
  const [hoveredNode, setHoveredNode] = useState<MiningNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(860);

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setContainerWidth(Math.floor(entries[0].contentRect.width));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Processed nodes with computed metrics
  const processedNodes = useMemo(() => {
    const list = nodes.map((node, index) => {
      const days = parseDurationToDays(node.avgDuration);
      // Bottleneck Index: Duration (days) * Throughput (cases) normalized
      const bottleneckIndex = +(days * (node.throughput / 100)).toFixed(1);
      return {
        ...node,
        rawIndex: index,
        durationDays: days,
        bottleneckIndex,
      };
    });

    if (sortOrder === 'duration_desc') {
      return [...list].sort((a, b) => b.durationDays - a.durationDays);
    }
    if (sortOrder === 'system') {
      return [...list].sort((a, b) => a.system.localeCompare(b.system));
    }
    return list;
  }, [nodes, sortOrder]);

  // Max and min for scales
  const metricsBounds = useMemo(() => {
    const durations = processedNodes.map((n) => n.durationDays);
    const minDur = durations.length ? Math.min(...durations) : 0;
    const maxDur = durations.length ? Math.max(...durations) : 10;
    const avgDur = durations.length ? +(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : 0;

    const indices = processedNodes.map((n) => n.bottleneckIndex);
    const minIdx = indices.length ? Math.min(...indices) : 0;
    const maxIdx = indices.length ? Math.max(...indices) : 100;

    const throughputs = processedNodes.map((n) => n.throughput);
    const minThru = throughputs.length ? Math.min(...throughputs) : 0;
    const maxThru = throughputs.length ? Math.max(...throughputs) : 1000;

    return { minDur, maxDur, avgDur, minIdx, maxIdx, minThru, maxThru };
  }, [processedNodes]);

  // Color Scale Generator based on D3
  const getColorForNode = (node: (typeof processedNodes)[0]) => {
    if (metricDimension === 'duration') {
      // Piecewise 4-stop scale:
      // Green/Mint -> Light Warm Yellow -> Amber/Orange -> Deep Rich Crimson Red
      const { minDur, maxDur } = metricsBounds;
      const span = maxDur - minDur || 1;
      const t1 = minDur + span * 0.25;
      const t2 = minDur + span * 0.55;
      const t3 = minDur + span * 0.85;

      const colorScale = d3
        .scaleLinear<string>()
        .domain([minDur, t1, t2, t3, maxDur])
        .range(['#f0fdf4', '#fef9c3', '#fed7aa', '#f87171', '#991b1b'])
        .interpolate(d3.interpolateRgb);

      return colorScale(node.durationDays);
    } else if (metricDimension === 'bottleneck_index') {
      const colorScale = d3
        .scaleSequential(d3.interpolateYlOrRd)
        .domain([metricsBounds.minIdx, metricsBounds.maxIdx]);
      return colorScale(node.bottleneckIndex);
    } else {
      // Throughput dimension
      const colorScale = d3
        .scaleSequential(d3.interpolateBlues)
        .domain([metricsBounds.minThru, metricsBounds.maxThru]);
      return colorScale(node.throughput);
    }
  };

  // Determine text contrast color (dark or light)
  const getContrastTextColor = (bgColor: string) => {
    const rgb = d3.rgb(bgColor);
    // Relative luminance
    const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return yiq >= 148 ? '#1e293b' : '#ffffff';
  };

  // D3 Bar Chart Render (when activeView === 'bars')
  useEffect(() => {
    if (activeView !== 'bars' || !svgRef.current || processedNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 30, bottom: 90, left: 60 };
    const width = Math.max(containerWidth, 680) - margin.left - margin.right;
    const height = 360 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale
    const x = d3
      .scaleBand()
      .domain(processedNodes.map((d) => d.name))
      .range([0, width])
      .padding(0.28);

    // Y Scale
    const maxVal = d3.max(processedNodes, (d) => d.durationDays) || 10;
    const y = d3.scaleLinear().domain([0, maxVal * 1.15]).nice().range([height, 0]);

    // Gridlines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-dasharray', '2,2');

    // Axes
    const xAxis = g
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    xAxis
      .selectAll('text')
      .attr('transform', 'rotate(-25)')
      .style('text-anchor', 'end')
      .style('font-size', '11px')
      .style('font-weight', '500')
      .style('fill', '#475569');

    xAxis.select('.domain').attr('stroke', '#cbd5e1');

    const yAxis = g.append('g').call(
      d3
        .axisLeft(y)
        .ticks(6)
        .tickFormat((d) => `${d}天`)
    );
    yAxis.selectAll('text').style('font-size', '11px').style('fill', '#64748b');
    yAxis.select('.domain').attr('stroke', '#cbd5e1');

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#64748b')
      .text('平均停留时长 (天)');

    // Threshold baseline line (industry SLA benchmark = 2.5 days)
    const benchmarkY = y(2.5);
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', benchmarkY)
      .attr('y2', benchmarkY)
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3');

    g.append('text')
      .attr('x', width - 8)
      .attr('y', benchmarkY - 6)
      .attr('text-anchor', 'end')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('fill', '#d97706')
      .text('SLA 行业基线 (2.5天)');

    // Bars
    const bars = g
      .selectAll('.bar')
      .data(processedNodes)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.name) || 0)
      .attr('y', height)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', (d) => getColorForNode(d))
      .attr('stroke', (d) => (selectedNode?.id === d.id ? '#1e40af' : '#cbd5e1'))
      .attr('stroke-width', (d) => (selectedNode?.id === d.id ? 2.5 : 1))
      .style('cursor', 'pointer');

    // Animation
    bars
      .transition()
      .duration(700)
      .delay((_, i) => i * 40)
      .attr('y', (d) => y(d.durationDays))
      .attr('height', (d) => height - y(d.durationDays));

    // Value Labels on top of bars
    g.selectAll('.label')
      .data(processedNodes)
      .enter()
      .append('text')
      .attr('x', (d) => (x(d.name) || 0) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.durationDays) - 6)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '700')
      .style('fill', (d) => (d.durationDays > 3.5 ? '#b91c1c' : '#334155'))
      .text((d) => `${d.durationDays}d`);

    // Click & hover interactions
    bars
      .on('click', (_, d) => {
        onSelectNode(d);
      })
      .on('mouseenter', (event, d) => {
        const bounds = containerRef.current?.getBoundingClientRect();
        if (bounds) {
          setTooltipPos({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top - 10,
          });
        }
        setHoveredNode(d);
      })
      .on('mousemove', (event) => {
        const bounds = containerRef.current?.getBoundingClientRect();
        if (bounds) {
          setTooltipPos({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top - 10,
          });
        }
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      });
  }, [activeView, processedNodes, metricDimension, containerWidth, selectedNode]);

  // Bottleneck summary statistics
  const topBottleneckNode = useMemo(() => {
    if (!processedNodes.length) return null;
    return [...processedNodes].sort((a, b) => b.durationDays - a.durationDays)[0];
  }, [processedNodes]);

  const criticalCount = useMemo(() => {
    return processedNodes.filter((n) => n.durationDays >= 3.5).length;
  }, [processedNodes]);

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Control Strip & Metrics Banner */}
      <div className="bg-white rounded-xl border border-[#ebeef5] shadow-xs p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-xs">
              <Flame className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#1e293b]">
                  基于 D3.js 的流程节点停留时延性能瓶颈热力图
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  D3 动态色阶渲染
                </span>
              </div>
              <p className="text-xs text-[#64748b] mt-0.5">
                实时从挖掘事件日志中提取环节平均周转时长（Lead/Dwell Time），颜色越深代表瓶颈积压越严重
              </p>
            </div>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* View Switcher: Matrix vs D3 Bars */}
            <div className="flex items-center bg-[#f1f5f9] p-0.5 rounded-lg border border-[#e2e8f0]">
              <button
                onClick={() => setActiveView('matrix')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  activeView === 'matrix'
                    ? 'bg-white text-[#1677ff] shadow-xs'
                    : 'text-[#64748b] hover:text-[#1e293b]'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>热力色块矩阵</span>
              </button>
              <button
                onClick={() => setActiveView('bars')}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  activeView === 'bars'
                    ? 'bg-white text-[#1677ff] shadow-xs'
                    : 'text-[#64748b] hover:text-[#1e293b]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>D3柱状分布比对</span>
              </button>
            </div>

            {/* Dimension Selector */}
            <div className="flex items-center bg-[#f8fafc] px-2 py-1 rounded-lg border border-[#e2e8f0]">
              <span className="text-[#94a3b8] text-[11px] mr-1.5">热力维度:</span>
              <select
                value={metricDimension}
                onChange={(e) => setMetricDimension(e.target.value as any)}
                className="bg-transparent font-medium text-[#1e293b] outline-none cursor-pointer text-xs"
              >
                <option value="duration">⏱️ 平均停留耗时 (天)</option>
                <option value="bottleneck_index">🔥 综合瓶颈指数 (耗时×单量)</option>
                <option value="throughput">📊 节点吞吐单量 (笔)</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center bg-[#f8fafc] px-2 py-1 rounded-lg border border-[#e2e8f0]">
              <span className="text-[#94a3b8] text-[11px] mr-1.5">排序:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-transparent font-medium text-[#1e293b] outline-none cursor-pointer text-xs"
              >
                <option value="flow_sequence">按端到端流程时序</option>
                <option value="duration_desc">按停留耗时从高到低 (瓶颈优先)</option>
                <option value="system">按所属业务系统聚合</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPI Strip & D3 Gradient Legend */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          {/* Stat 1: Max Bottleneck */}
          <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/80 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-rose-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-rose-600 font-medium">全链路首要瓶颈节点</div>
              <div className="text-xs font-bold text-rose-900 truncate">
                {topBottleneckNode ? `${topBottleneckNode.name} (${topBottleneckNode.avgDuration})` : '--'}
              </div>
            </div>
          </div>

          {/* Stat 2: Average Lead Time */}
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-amber-600 font-medium">平均单节点停留时延</div>
              <div className="text-xs font-bold text-amber-900">
                {metricsBounds.avgDur} 天 <span className="text-[10px] font-normal text-amber-700">/ 节点</span>
              </div>
            </div>
          </div>

          {/* Stat 3: Severe Over-SLA Nodes */}
          <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200/80 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-indigo-500 text-white flex items-center justify-center shrink-0">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-indigo-600 font-medium">重度积压节点 (&gt;3.5天)</div>
              <div className="text-xs font-bold text-indigo-900">
                {criticalCount} 个环节 <span className="text-[10px] text-rose-600 font-semibold">(需即时优化)</span>
              </div>
            </div>
          </div>

          {/* D3 Continuous Color Gradient Legend */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-center">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mb-1">
              <span>🟢 顺畅 (&lt;1.5d)</span>
              <span>🟡 预警 (2.5d)</span>
              <span>🔴 极度瓶颈 (&gt;4.5d)</span>
            </div>
            <div
              className="h-2.5 rounded-full w-full shadow-inner"
              style={{
                background:
                  metricDimension === 'duration'
                    ? 'linear-gradient(to right, #f0fdf4 0%, #fef9c3 30%, #fed7aa 60%, #f87171 85%, #991b1b 100%)'
                    : metricDimension === 'bottleneck_index'
                    ? 'linear-gradient(to right, #ffffd4 0%, #fed976 25%, #feb24c 50%, #fd8d3c 75%, #bd0026 100%)'
                    : 'linear-gradient(to right, #f7fbff 0%, #c6dbef 35%, #6baed6 70%, #08519c 100%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Heatmap Visual Rendering Area */}
      {activeView === 'matrix' ? (
        <div className="bg-white rounded-xl border border-[#ebeef5] shadow-xs p-5 relative">
          <div className="flex items-center justify-between mb-3 text-xs text-[#64748b]">
            <div className="flex items-center gap-1.5 font-semibold text-[#1e293b]">
              <span>🔥 流程全节点停留热力矩阵</span>
              <span className="text-slate-400 font-normal">
                (共 {processedNodes.length} 个跨系统业务环节，点击任意色块可定位节点详情)
              </span>
            </div>
            <div className="text-[11px] text-[#94a3b8]">
              提示：背景颜色深度严格由 D3 插值器根据实际平均停留时间驱动
            </div>
          </div>

          {/* Heatmap Grid of Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {processedNodes.map((node) => {
              const bg = getColorForNode(node);
              const textColor = getContrastTextColor(bg);
              const isSelected = selectedNode?.id === node.id;
              const isSevere = node.durationDays >= 3.5;
              const sColor = SYSTEM_COLORS[node.system] || { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };

              return (
                <div
                  key={node.id}
                  onClick={() => onSelectNode(node)}
                  onMouseEnter={(e) => {
                    const bounds = containerRef.current?.getBoundingClientRect();
                    if (bounds) {
                      setTooltipPos({
                        x: e.clientX - bounds.left,
                        y: e.clientY - bounds.top - 10,
                      });
                    }
                    setHoveredNode(node);
                  }}
                  onMouseMove={(e) => {
                    const bounds = containerRef.current?.getBoundingClientRect();
                    if (bounds) {
                      setTooltipPos({
                        x: e.clientX - bounds.left,
                        y: e.clientY - bounds.top - 10,
                      });
                    }
                  }}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{
                    backgroundColor: bg,
                  }}
                  className={`rounded-xl p-4 transition-all duration-200 cursor-pointer relative border-2 shadow-xs hover:shadow-lg hover:-translate-y-0.5 ${
                    isSelected
                      ? 'border-[#1677ff] ring-3 ring-[#1677ff]/30 z-10 scale-[1.02]'
                      : isSevere
                      ? 'border-rose-400/80 hover:border-rose-600'
                      : 'border-black/5 hover:border-black/15'
                  }`}
                >
                  {/* Top Badge Strip */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-2xs"
                      style={{
                        backgroundColor: sColor.bg,
                        color: sColor.text,
                        border: `1px solid ${sColor.border}`,
                      }}
                    >
                      {node.system} 系统
                    </span>

                    {/* Duration Pill with D3 Color Indicator */}
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shadow-2xs"
                      style={{
                        backgroundColor: textColor === '#ffffff' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.75)',
                        color: textColor,
                      }}
                    >
                      <Clock className="w-3 h-3 opacity-80" />
                      <span>{node.avgDuration}</span>
                    </div>
                  </div>

                  {/* Node Name */}
                  <div
                    className="font-bold text-sm tracking-tight mb-2 line-clamp-1"
                    style={{ color: textColor }}
                    title={node.name}
                  >
                    {node.name}
                  </div>

                  {/* Role and Throughput */}
                  <div
                    className="flex items-center justify-between text-[11px] opacity-90 pt-1 border-t"
                    style={{
                      color: textColor,
                      borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                    }}
                  >
                    <span className="truncate max-w-[100px]">{node.role}</span>
                    <span className="font-mono font-semibold">{node.throughput} 笔</span>
                  </div>

                  {/* Bottleneck Warning Flag */}
                  {isSevere && (
                    <div
                      className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded flex items-center justify-between shadow-2xs"
                      style={{
                        backgroundColor: textColor === '#ffffff' ? 'rgba(0,0,0,0.35)' : '#fee2e2',
                        color: textColor === '#ffffff' ? '#ffffff' : '#991b1b',
                      }}
                    >
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-300 animate-pulse" />
                        瓶颈阻塞 (超基线 {Math.round(((node.durationDays - 2.5) / 2.5) * 100)}%)
                      </span>
                      <span>#{node.rawIndex + 1}</span>
                    </div>
                  )}

                  {!isSevere && node.durationDays >= 2.0 && (
                    <div
                      className="mt-2 text-[10px] font-medium px-2 py-0.5 rounded flex items-center justify-between"
                      style={{
                        backgroundColor: textColor === '#ffffff' ? 'rgba(0,0,0,0.2)' : '#fef9c3',
                        color: textColor === '#ffffff' ? '#ffffff' : '#854d0e',
                      }}
                    >
                      <span>正常周转排队</span>
                      <span>#{node.rawIndex + 1}</span>
                    </div>
                  )}

                  {!isSevere && node.durationDays < 2.0 && (
                    <div
                      className="mt-2 text-[10px] font-medium px-2 py-0.5 rounded flex items-center justify-between"
                      style={{
                        backgroundColor: textColor === '#ffffff' ? 'rgba(0,0,0,0.2)' : '#dcfce7',
                        color: textColor === '#ffffff' ? '#ffffff' : '#166534',
                      }}
                    >
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        时效优秀
                      </span>
                      <span>#{node.rawIndex + 1}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* D3 SVG Bar Chart View */
        <div className="bg-white rounded-xl border border-[#ebeef5] shadow-xs p-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-xs text-[#1e293b] flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#1677ff]" />
              <span>D3.js 节点停留耗时柱状对齐图 (横轴按时效瓶颈与SLA基线对齐)</span>
            </h4>
            <span className="text-[11px] text-[#64748b]">
              柱子高度与背景颜色深度均由 D3 比例尺实时驱动
            </span>
          </div>

          <div className="overflow-x-auto">
            <svg ref={svgRef} className="w-full select-none" />
          </div>
        </div>
      )}

      {/* Interactive Tooltip Card */}
      {hoveredNode && tooltipPos && (
        <div
          className="fixed z-50 pointer-events-none p-3.5 rounded-xl bg-slate-900/95 text-white shadow-2xl border border-slate-700 max-w-xs text-xs backdrop-blur-md"
          style={{
            left: `${tooltipPos.x + 20}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-sm text-white">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{hoveredNode.name}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {hoveredNode.system}
            </span>
          </div>

          <div className="space-y-1.5 text-slate-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">平均停留时长:</span>
              <span className="font-bold text-amber-300">{hoveredNode.avgDuration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">处理样本量:</span>
              <span className="font-mono text-white">{hoveredNode.throughput} 笔</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">经办角色岗位:</span>
              <span className="text-slate-200">{hoveredNode.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">行业基线偏离:</span>
              <span className={parseDurationToDays(hoveredNode.avgDuration) > 2.5 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {parseDurationToDays(hoveredNode.avgDuration) > 2.5
                  ? `+${Math.round(((parseDurationToDays(hoveredNode.avgDuration) - 2.5) / 2.5) * 100)}% (超时)`
                  : '达标 (处于绿色SLA区)'}
              </span>
            </div>
            <p className="pt-1.5 text-[10px] text-slate-400 border-t border-slate-800 leading-relaxed">
              {hoveredNode.desc}
            </p>
          </div>
        </div>
      )}

      {/* Selected Node Details Card with Quick Action */}
      {selectedNode && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1677ff] text-white">
                已选中热力节点
              </span>
              <span className="font-bold text-sm text-[#1e293b]">{selectedNode.name}</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border text-[#475569]">
                所属系统: {selectedNode.system}
              </span>
            </div>
            <div className="text-xs text-[#475569]">
              经办角色：<span className="font-medium text-[#1e293b]">{selectedNode.role}</span> ·
              平均周转周期：<span className="font-bold text-rose-600">{selectedNode.avgDuration}</span> ·
              累计处理：<span className="font-mono font-semibold text-[#1e293b]">{selectedNode.throughput} 笔</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onJumpToDiagnosis && (
              <button
                onClick={onJumpToDiagnosis}
                className="px-3.5 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#2563eb] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>跳转诊断与处方建议</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
