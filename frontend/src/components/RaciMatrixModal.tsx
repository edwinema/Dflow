import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  Plus,
  Crosshair,
  Users,
  ShieldCheck,
  MessageSquare,
  Bell,
  Wrench,
} from 'lucide-react';

export interface RaciMatrixModalProps {
  open: boolean;
  onClose: () => void;
  flowTitle: string;
  cells: any[];
  flowRoles: { id: string; label: string; desc?: string }[];
  onUpdateNodeRaci: (
    cellId: string,
    raciPatch: {
      raciR: string[];
      raciA: string;
      raciC: string[];
      raciI: string[];
      roles: string[];
    }
  ) => void;
  onAddCustomRole: (roleName: string) => void;
  onHighlightNode: (cellId: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const RACI_DEFINITIONS = [
  {
    code: 'R',
    name: 'Responsible 执行人',
    rule: '必须至少 1 人',
    desc: '直接负责具体完成该项工作任务的角色。',
    badgeBg: 'bg-[#1677ff]',
    lightBg: 'bg-[#ecf5ff]',
    border: 'border-[#b3d8ff]',
    text: 'text-[#1677ff]',
    icon: Wrench,
  },
  {
    code: 'A',
    name: 'Accountable 责任人/终审',
    rule: '必须且只能有 1 人',
    desc: '对该项工作最终成果全面负责，拥有最高裁决与验收签字权的角色。',
    badgeBg: 'bg-[#d97706]',
    lightBg: 'bg-[#fffbeb]',
    border: 'border-[#fde68a]',
    text: 'text-[#d97706]',
    icon: ShieldCheck,
  },
  {
    code: 'C',
    name: 'Consulted 咨询人/会签',
    rule: '多方协同审查',
    desc: '在决策或执行前提供专业咨询、数据核算或合规支持的双向沟通角色。',
    badgeBg: 'bg-[#7c3aed]',
    lightBg: 'bg-[#f5f3ff]',
    border: 'border-[#ddd6fe]',
    text: 'text-[#7c3aed]',
    icon: MessageSquare,
  },
  {
    code: 'I',
    name: 'Informed 知情人/抄送',
    rule: '结果知会归档',
    desc: '任务执行完毕或决议下达后，单向获取进度通知或文档抄送的角色。',
    badgeBg: 'bg-[#059669]',
    lightBg: 'bg-[#ecfdf5]',
    border: 'border-[#a7f3d0]',
    text: 'text-[#059669]',
    icon: Bell,
  },
] as const;

export function normalizeNodeRaci(attrs: Record<string, any> = {}) {
  const raciR: string[] = Array.isArray(attrs.raciR)
    ? attrs.raciR
    : Array.isArray(attrs.roles)
    ? attrs.roles
    : [];
  const rawA = attrs.raciA;
  const raciA: string = Array.isArray(rawA)
    ? String(rawA[0] || '').trim()
    : String(rawA || '').trim();
  const raciC: string[] = Array.isArray(attrs.raciC) ? attrs.raciC : [];
  const raciI: string[] = Array.isArray(attrs.raciI) ? attrs.raciI : [];
  return { raciR, raciA, raciC, raciI };
}

export const RaciMatrixModal: React.FC<RaciMatrixModalProps> = ({
  open,
  onClose,
  flowTitle,
  cells,
  flowRoles,
  onUpdateNodeRaci,
  onAddCustomRole,
  onHighlightNode,
  showToast,
}) => {
  const [newRoleInput, setNewRoleInput] = useState('');

  const activityCells = useMemo(() => {
    return (cells || [])
      .filter((c) => {
        if (!c.vertex) return false;
        const t = String(c.attrs?.dflowType || '');
        return t.startsWith('nodeActive') || t.startsWith('evc');
      })
      .sort((a, b) => {
        const ax = a.geometry?.x ?? 0;
        const bx = b.geometry?.x ?? 0;
        if (Math.abs(ax - bx) > 40) return ax - bx;
        return (a.geometry?.y ?? 0) - (b.geometry?.y ?? 0);
      });
  }, [cells]);

  const allRoleColumns = useMemo(() => {
    const set = new Set<string>();
    (flowRoles || []).forEach((r) => {
      if (r.label) set.add(r.label);
    });
    (cells || []).forEach((c) => {
      if (!c.vertex) return;
      const t = String(c.attrs?.dflowType || '');
      if (t === 'nodeRoleName' || t === 'nodeVirtualRoleName') {
        const name = String(c.attrs?.name || c.value || '').trim();
        if (name) set.add(name);
      }
      const { raciR, raciA, raciC, raciI } = normalizeNodeRaci(c.attrs);
      raciR.forEach((r) => r && set.add(r));
      if (raciA) set.add(raciA);
      raciC.forEach((r) => r && set.add(r));
      raciI.forEach((r) => r && set.add(r));
    });
    return Array.from(set);
  }, [flowRoles, cells]);

  if (!open) return null;

  const handleToggleRoleCode = (cell: any, roleName: string, code: 'R' | 'A' | 'C' | 'I') => {
    const current = normalizeNodeRaci(cell.attrs);
    let nextR = [...current.raciR];
    let nextA = current.raciA;
    let nextC = [...current.raciC];
    let nextI = [...current.raciI];

    if (code === 'R') {
      if (nextR.includes(roleName)) {
        nextR = nextR.filter((r) => r !== roleName);
      } else {
        nextR.push(roleName);
      }
    } else if (code === 'A') {
      if (nextA === roleName) {
        nextA = '';
      } else {
        const prevA = nextA;
        nextA = roleName;
        if (prevA && prevA !== roleName) {
          showToast(
            `终审权已从 ${prevA} 转移到 ${roleName}`,
            'success'
          );
        }
      }
    } else if (code === 'C') {
      if (nextC.includes(roleName)) {
        nextC = nextC.filter((r) => r !== roleName);
      } else {
        nextC.push(roleName);
      }
    } else if (code === 'I') {
      if (nextI.includes(roleName)) {
        nextI = nextI.filter((r) => r !== roleName);
      } else {
        nextI.push(roleName);
      }
    }

    onUpdateNodeRaci(cell.id, {
      raciR: nextR,
      raciA: nextA,
      raciC: nextC,
      raciI: nextI,
      roles: nextR,
    });
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRoleInput.trim();
    if (!trimmed) return;
    onAddCustomRole(trimmed);
    setNewRoleInput('');
    showToast(`已添加新角色 ${trimmed} 到 RACI 矩阵`, 'success');
  };

  const handleExportCsv = () => {
    const headers = ['活动节点名称', ...allRoleColumns, 'R(负责)', 'A(终审)', 'C(咨询)', 'I(知会)', '合规状态'];
    const rows = activityCells.map((cell, idx) => {
      const title = String(cell.attrs?.name || cell.value || `节点 ${idx + 1}`).replace(/\n/g, ' ');
      const { raciR, raciA, raciC, raciI } = normalizeNodeRaci(cell.attrs);
      const roleCells = allRoleColumns.map((role) => {
        const codes: string[] = [];
        if (raciR.includes(role)) codes.push('R');
        if (raciA === role) codes.push('A');
        if (raciC.includes(role)) codes.push('C');
        if (raciI.includes(role)) codes.push('I');
        return codes.join('/');
      });
      const isCompliant = raciR.length >= 1 && Boolean(raciA);
      const statusText = isCompliant
        ? '合规通过'
        : `${raciR.length === 0 ? '缺少R(执行人) ' : ''}${!raciA ? '缺少A(终审人)' : ''}`.trim();
      return [
        title,
        ...roleCells,
        raciR.join('、'),
        raciA || '无',
        raciC.join('、'),
        raciI.join('、'),
        statusText,
      ];
    });

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowTitle || '流程'}_RACI职责矩阵.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('已导出 RACI 责任分配矩阵 CSV 文件', 'success');
  };

  const compliantCount = activityCells.filter((c) => {
    const { raciR, raciA } = normalizeNodeRaci(c.attrs);
    return raciR.length >= 1 && Boolean(raciA);
  }).length;

  return (
    <div
      className="fixed inset-0 z-[260] bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl max-h-[88vh] bg-white rounded-lg border border-[#e4e7ed] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-14 px-5 bg-[#f8f9fb] border-b border-[#e4e7ed] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#7c3aed] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              RACI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#1f2733]">
                  RACI 责任分配矩阵 · {flowTitle}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    compliantCount === activityCells.length && activityCells.length > 0
                      ? 'bg-[#f0f9eb] text-[#67c23a] border border-[#b3e19d]'
                      : 'bg-[#fdf6ec] text-[#e6a23c] border border-[#f5dab1]'
                  }`}
                >
                  合规度 {compliantCount} / {activityCells.length} 节点
                </span>
              </div>
              <p className="text-[11px] text-[#909399]">
                点击网格单元格快速配置 R / A / C / I 角色权能
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <form onSubmit={handleCreateRole} className="flex items-center gap-1.5">
              <input
                type="text"
                value={newRoleInput}
                onChange={(e) => setNewRoleInput(e.target.value)}
                placeholder="新增角色名称..."
                className="h-8 w-36 px-2.5 rounded border border-[#dcdfe6] bg-white text-xs outline-none focus:border-[#7c3aed]"
              />
              <button
                type="submit"
                className="h-8 px-2.5 rounded border border-[#ddd6fe] bg-[#f5f3ff] hover:bg-[#7c3aed] text-[#7c3aed] hover:text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>加角色</span>
              </button>
            </form>
            <button
              type="button"
              onClick={handleExportCsv}
              className="h-8 px-3.5 rounded bg-[#1677ff] hover:bg-[#409eff] text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出 RACI 矩阵 (.csv)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded hover:bg-[#ebeef5] flex items-center justify-center text-[#606266] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-3 bg-[#fcfcfd] border-b border-[#ebeef5] grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
          {RACI_DEFINITIONS.map((def) => {
            const IconComp = def.icon;
            return (
              <div
                key={def.code}
                className={`p-2.5 rounded-md border ${def.border} ${def.lightBg} flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded ${def.badgeBg} text-white font-bold text-xs flex items-center justify-center`}
                    >
                      {def.code}
                    </span>
                    <span className="text-xs font-bold text-[#1f2733]">{def.name}</span>
                  </div>
                  <IconComp className={`w-3.5 h-3.5 ${def.text} shrink-0`} />
                </div>
                <p className="text-[11px] text-[#606266] leading-snug">{def.desc}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/80 ${def.text}`}
                  >
                    规则: {def.rule}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-auto p-5">
          {activityCells.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-xs text-[#909399] space-y-2">
              <Users className="w-8 h-8 text-[#c0c4cc]" />
              <p>当前画布暂无活动业务节点</p>
            </div>
          ) : (
            <div className="border border-[#e4e7ed] rounded-md overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f5f7fa] border-b border-[#e4e7ed] text-[#303133]">
                    <th className="py-2.5 px-3 text-left font-semibold border-r border-[#e4e7ed] min-w-[180px] sticky left-0 bg-[#f5f7fa] z-10">
                      活动节点名称 ({activityCells.length})
                    </th>
                    {allRoleColumns.map((role) => (
                      <th
                        key={role}
                        className="py-2.5 px-2.5 text-center font-semibold border-r border-[#e4e7ed] min-w-[132px]"
                      >
                        <div className="truncate text-[#1f2733]">{role}</div>
                        <div className="text-[10px] font-normal text-[#909399] mt-0.5">
                          可配 R / A / C / I
                        </div>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-left font-semibold min-w-[190px] bg-[#f8f9fb]">
                      RACI 合规状态 &amp; 说明
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebeef5]">
                  {activityCells.map((cell, rowIdx) => {
                    const rawTitle = String(cell.attrs?.name || cell.value || `节点 ${rowIdx + 1}`);
                    const cleanTitle = rawTitle.replace(/\n/g, ' ');
                    const { raciR, raciA, raciC, raciI } = normalizeNodeRaci(cell.attrs);
                    const hasR = raciR.length >= 1;
                    const hasUniqueA = Boolean(raciA);
                    const isRowCompliant = hasR && hasUniqueA;
                    return (
                      <tr key={cell.id} className="hover:bg-[#f9fafc] transition-colors">
                        <td className="py-2.5 px-3 border-r border-[#ebeef5] font-medium text-[#1f2733] sticky left-0 bg-white z-10">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-5 h-5 rounded bg-[#ecf5ff] text-[#1677ff] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                                {String(rowIdx + 1).padStart(2, '0')}
                              </span>
                              <span className="truncate" title={cleanTitle}>
                                {cleanTitle}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                onHighlightNode(cell.id);
                                onClose();
                              }}
                              title="在画布中定位此节点"
                              className="p-1 rounded text-[#909399] hover:text-[#1677ff] hover:bg-[#ecf5ff] cursor-pointer shrink-0"
                            >
                              <Crosshair className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        {allRoleColumns.map((role) => {
                          const isR = raciR.includes(role);
                          const isA = raciA === role;
                          const isC = raciC.includes(role);
                          const isI = raciI.includes(role);
                          return (
                            <td
                              key={role}
                              className="py-2 px-2 border-r border-[#ebeef5] text-center"
                            >
                              <div className="inline-flex items-center gap-1 bg-[#f5f7fa] p-1 rounded border border-[#ebeef5]">
                                <button
                                  type="button"
                                  onClick={() => handleToggleRoleCode(cell, role, 'R')}
                                  title={`R - Responsible 执行人: ${role}`}
                                  className={`w-6 h-5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                    isR
                                      ? 'bg-[#1677ff] text-white shadow-xs'
                                      : 'text-[#909399] hover:bg-white hover:text-[#1677ff]'
                                  }`}
                                >
                                  R
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleRoleCode(cell, role, 'A')}
                                  title={`A - Accountable 终审人: ${role}`}
                                  className={`w-6 h-5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                    isA
                                      ? 'bg-[#d97706] text-white shadow-xs'
                                      : 'text-[#909399] hover:bg-white hover:text-[#d97706]'
                                  }`}
                                >
                                  A
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleRoleCode(cell, role, 'C')}
                                  title={`C - Consulted 咨询人: ${role}`}
                                  className={`w-6 h-5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                    isC
                                      ? 'bg-[#7c3aed] text-white shadow-xs'
                                      : 'text-[#909399] hover:bg-white hover:text-[#7c3aed]'
                                  }`}
                                >
                                  C
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleRoleCode(cell, role, 'I')}
                                  title={`I - Informed 知情人: ${role}`}
                                  className={`w-6 h-5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                    isI
                                      ? 'bg-[#059669] text-white shadow-xs'
                                      : 'text-[#909399] hover:bg-white hover:text-[#059669]'
                                  }`}
                                >
                                  I
                                </button>
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 bg-[#fcfcfd]">
                          {isRowCompliant ? (
                            <div className="flex items-center gap-1.5 text-[#67c23a]">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <div className="text-[11px] leading-tight">
                                <div className="font-semibold">合规配置</div>
                                <div className="text-[#909399]">
                                  终审 A: <span className="text-[#d97706] font-medium">{raciA}</span> | 经办 R({raciR.length})
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[#e6a23c]">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <div className="text-[11px] leading-tight">
                                {!hasR && <div>缺少 R(执行人)</div>}
                                {!hasUniqueA && <div>缺少 A(终审责任人)</div>}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="h-12 px-5 bg-[#f8f9fb] border-t border-[#e4e7ed] flex items-center justify-between text-xs text-[#606266] shrink-0">
          <div className="flex items-center gap-4">
            <span>
              <strong className="text-[#1677ff]">R</strong> 执行人 (Ownership)
            </span>
            <span>
              <strong className="text-[#d97706]">A</strong> 责任人 (唯一终裁)
            </span>
            <span>
              <strong className="text-[#7c3aed]">C</strong> 咨询顾问 (双向会签)
            </span>
            <span>
              <strong className="text-[#059669]">I</strong> 知会抄送 (结果通知)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-5 rounded bg-[#1677ff] hover:bg-[#409eff] text-white font-medium cursor-pointer"
          >
            完成并返回设计器
          </button>
        </div>
      </div>
    </div>
  );
};
