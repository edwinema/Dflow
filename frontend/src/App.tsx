import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  RotateCcw,
  Plus,
  Eye,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Info,
  Lock,
} from 'lucide-react';
import { MENU_ROUTES } from './config/menuRoutes';
import { DashboardView } from './components/DashboardView';
import { FlowDesignView } from './components/FlowDesignView';
import { FlowVerifyView } from './components/FlowVerifyView';
import { PropertyOverviewView } from './components/PropertyOverviewView';
import { FlowRepealArchiveView } from './components/FlowRepealArchiveView';
import { DrawioDesigner } from './components/DrawioDesigner';
import { SysDocRiskModuleView } from './components/SysDocRiskModuleView';
import { FlowProcessView } from './components/FlowProcessView';
import { EnterpriseDataGrid } from './components/EnterpriseDataGrid';
import { DutyManageView } from './components/DutyManageView';
import { OrgManageView } from './components/OrgManageView';
import { ProcessRoleLibraryView } from './components/ProcessRoleLibraryView';
import { CompanyAuthManageView } from './components/CompanyAuthManageView';
import { ApiManageView } from './components/ApiManageView';
import { FormEngineView } from './components/FormEngineView';
import { FlowTermsView } from './components/FlowTermsView';
import { MyResponsibleView } from './components/MyResponsibleView';
import { DutyBuildView } from './components/DutyBuildView';
import { DutyAuditView } from './components/DutyAuditView';
import { ProcessMiningView } from './components/ProcessMiningView';
import { ProcessLearningView } from './components/ProcessLearningView';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem('dflow-token');
    if (saved) return saved;
    localStorage.setItem('dflow-token', 'dflow-jwt-token-2026');
    return 'dflow-jwt-token-2026';
  });

  const [currentPath, setCurrentPath] = useState<string>('/dashboard/index');
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>('flow_101');
  const [fullScreenMode, setFullScreenMode] = useState<'none' | 'designer' | 'viewer'>('none');
  const [activeDesignerFlowId, setActiveDesignerFlowId] = useState<string>('flow_101');

  const [systemDisplayName, setSystemDisplayName] = useState<string>(
    '测试环境'
  );
  const [systemLogo, setSystemLogo] = useState<string>('');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Accordion menu state: default expanded to workspace
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>('workspace');
  const [formEngineActiveKey, setFormEngineActiveKey] = useState<string>('form_sysdoc');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [toast, setToast] = useState<{
    msg: string;
    type: 'success' | 'warning' | 'error' | 'info';
  } | null>(null);

  const showToast = (
    msg: string,
    type: 'success' | 'warning' | 'error' | 'info' = 'success'
  ) => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast((prev) => (prev?.msg === msg ? null : prev));
    }, 2800);
  };

  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('123456');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  const [flows, setFlows] = useState<any[]>([]);
  const [dictBundle, setDictBundle] = useState<any>({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentUser, setCurrentUser] = useState<any>({
    userName: '流程管理员',
    jobTitle: '经理',
    deptName: '流程管理部',
    companyName: '测试集团有限公司',
  });

  useEffect(() => {
    if (token) {
      fetch('/api/session')
        .then((r) => r.json())
        .then((res) => {
          if (res.data) setCurrentUser(res.data);
        })
        .catch(() => {});
      fetch('/api/flow/fullSimpleModels')
        .then((r) => r.json())
        .then((res) => {
          if (res.data) setFlows(res.data);
        })
        .catch(() => {});
      fetch('/api/dict/bundle')
        .then((r) => r.json())
        .then((res) => {
          if (res.data) setDictBundle(res.data);
        })
        .catch(() => {});
      fetch('/api/system/company')
        .then((r) => r.json())
        .then((res) => {
          if (res.data) {
            if (res.data.systemDisplayName) setSystemDisplayName(res.data.systemDisplayName);
            if (res.data.systemLogo) setSystemLogo(res.data.systemLogo);
            if (res.data.companyName) {
              setCurrentUser((prev: any) => ({ ...prev, companyName: res.data.companyName }));
            }
          }
        })
        .catch(() => {});
    }
  }, [token, currentPath, fullScreenMode]);

  const isPathAllowed = (path: string, user: any): boolean => {
    if (!user) return true;
    const perms: string[] = user.menuPermissions || [];
    if (
      perms.includes('all') ||
      perms.includes('全部菜单') ||
      user.roleLabel === '超级管理员' ||
      (user.roleNames && user.roleNames.includes('超级管理员'))
    ) {
      return true;
    }
    if (perms.length === 0) return true;

    const pathKeyMap: Record<string, string[]> = {
      '/dashboard/index': ['collab', '协同工作', 'workspace', 'dashboard', '综合首页'],
      '/task/todolist': ['collab', '协同工作', 'workspace', 'task_todo', '待办任务'],
      '/task/finishlist': ['collab', '协同工作', 'workspace', 'task_finish', '已办任务'],
      '/task/learning': ['collab', '协同工作', 'workspace', 'task_learning', '流程培训'],
      '/property/verify': ['collab', '协同工作', 'workspace', '我的负责'],
      '/property/partake': ['collab', '协同工作', 'workspace', '我的参与'],
      '/property/overview': ['property', '流程资产', '架构全景'],
      '/property/integrate': ['property', '流程资产', '业务集成'],
      '/property/catalog': ['property', '流程资产', '目录清单'],
      '/build/design': ['design', '流程设计'],
      '/build/verify': ['design', '流程设计', '流程审核'],
      '/build/roles': ['design', '流程设计', '流程角色'],
      '/build/terms': ['design', '流程设计', '流程术语'],
      '/execute/process': ['execute', '流程运行', '流程实例运行'],
      '/mining/engine': ['mining', '流程挖掘', '流程挖掘诊断'],
      '/flowdoc/duty': ['duty', '权责管控', '权责清单与手册'],
      '/flowdoc/verify': ['duty', '权责管控', '权责审核'],
      '/sysdoc/index2': ['governance', '风控合规', 'sysdoc_lib', '制度文件库'],
      '/sysdoc/indexview': ['governance', '风控合规', 'sysdoc_query', '制度查阅', '/sysdoc/indexview'],
      '/risk/index': ['governance', '风控合规', 'risk_lib', '风险合规库'],
      '/risk/riskview': ['governance', '风控合规', 'risk_query', '风险查阅', '/risk/riskview'],
      '/build/repeal': ['governance', '风控合规', 'flow_obsolete', '流程废止归档'],
      '/org/dept': ['system', '组织系统', '部门组织'],
      '/org/user': ['system', '组织系统', '用户管理'],
      '/org/role': ['system', '组织系统', '权限管理'],
      '/system/column': ['system', '组织系统', '表单引擎'],
      '/system/company': ['system', '组织系统', '公司授权'],
      '/system/api': ['system', '组织系统', 'API管理'],
    };

    const keys = pathKeyMap[path] || [];
    return perms.some((p) => p === path || keys.includes(p));
  };

  const filteredMenuRoutes = useMemo(() => {
    return MENU_ROUTES.map((group) => {
      const validChildren = group.children.filter((child) => isPathAllowed(child.path, currentUser));
      return {
        ...group,
        children: validChildren,
      };
    }).filter((group) => group.children.length > 0);
  }, [currentUser]);

  // Route guard: auto redirect if user lands on an unauthorized menu
  useEffect(() => {
    if (filteredMenuRoutes.length > 0) {
      const allAllowedPaths = filteredMenuRoutes.flatMap((g) => g.children.map((c) => c.path));
      if (!allAllowedPaths.includes(currentPath)) {
        const targetPath = allAllowedPaths[0];
        if (targetPath) {
          setCurrentPath(targetPath);
          const parentGroup = filteredMenuRoutes.find((g) => g.children.some((c) => c.path === targetPath));
          if (parentGroup) setExpandedMenuId(parentGroup.id);
        }
      }
    }
  }, [filteredMenuRoutes, currentPath]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser.trim() || !loginPass.trim()) {
      showToast('请输入用户名和密码', 'warning');
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loginUser, password: loginPass }),
      });
      const authHeader = res.headers.get('Authorization') || 'dflow-jwt-token-2026';
      const body = await res.json();
      if (body.status === 1) {
        localStorage.setItem('dflow-token', authHeader);
        if (body.data) {
          setCurrentUser(body.data);
        }
        if (rememberMe) {
          localStorage.setItem('dflow-remember', JSON.stringify({ userId: loginUser }));
        }
        setToken(authHeader);
        setCurrentPath('/dashboard/index');
        setExpandedMenuId('workspace');
        showToast('登录成功', 'success');
      } else {
        showToast(body.info || '登录失败', 'error');
      }
    } catch {
      localStorage.setItem('dflow-token', 'dflow-jwt-token-2026');
      setToken('dflow-jwt-token-2026');
      setCurrentPath('/dashboard/index');
      setExpandedMenuId('workspace');
      showToast('登录成功', 'success');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/app/site/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('dflow-token');
    setToken(null);
    setCurrentPath('/dashboard/index');
    setExpandedMenuId('workspace');
    setUserDropdownOpen(false);
  };

  const refreshDictBundle = () => {
    fetch('/api/dict/bundle')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setDictBundle(res.data);
      })
      .catch(() => {});
  };

  const handleNavigate = (path: string, extraParam?: string) => {
    const targetPath = !path || path === '/' ? '/dashboard/index' : path;
    if (extraParam) {
      if (targetPath.startsWith('/build/')) {
        setSelectedFlowId(extraParam);
      } else if (targetPath === '/system/column' || targetPath === '/system/form') {
        setFormEngineActiveKey(extraParam);
      }
    }
    setCurrentPath(targetPath);
    setFullScreenMode('none');
    const matchedGroup =
      MENU_ROUTES.find((g) => g.children.some((c) => c.path === targetPath)) ||
      MENU_ROUTES.find((g) => {
        if (targetPath.startsWith('/task/') && g.id === 'workspace') return true;
        if (targetPath.startsWith('/property/') && (g.id === 'workspace' || g.id === 'property')) return true;
        if (targetPath.startsWith('/flowdoc/') && (g.id === 'duty' || g.id === 'governance')) return true;
        if (targetPath.startsWith('/sysdoc/') && g.id === 'governance') return true;
        if (targetPath.startsWith('/risk/') && g.id === 'governance') return true;
        if (targetPath.startsWith('/org/') && g.id === 'system') return true;
        if (targetPath.startsWith('/system/') && g.id === 'system') return true;
        if (targetPath.startsWith('/mining/') && g.id === 'mining') return true;
        return false;
      });
    if (matchedGroup) {
      setExpandedMenuId(matchedGroup.id);
    }
  };

  const handleEnterDesigner = (flowId: string) => {
    setActiveDesignerFlowId(flowId || 'flow_101');
    setFullScreenMode('designer');
  };

  const handleOpenViewer = (flowId: string) => {
    setActiveDesignerFlowId(flowId || 'flow_101');
    setFullScreenMode('viewer');
  };

  const resolveBreadcrumb = () => {
    for (const group of MENU_ROUTES) {
      const child = group.children.find((c) => c.path === currentPath);
      if (child) {
        return { parentTitle: group.title, childTitle: child.title };
      }
    }
    if (currentPath.startsWith('/flowdoc/')) return { parentTitle: '权责管控', childTitle: '权责清单与手册' };
    if (currentPath.startsWith('/sysdoc/')) return { parentTitle: '风控合规', childTitle: '制度文件库' };
    if (currentPath.startsWith('/risk/')) return { parentTitle: '风控合规', childTitle: '风险合规库' };
    if (currentPath.startsWith('/task/')) return { parentTitle: '协同工作', childTitle: currentPath === '/task/learning' ? '流程培训' : '待办任务' };
    if (currentPath.startsWith('/org/')) return { parentTitle: '组织系统', childTitle: '部门组织' };
    if (currentPath.startsWith('/system/')) return { parentTitle: '组织系统', childTitle: '系统设置' };
    if (currentPath.startsWith('/mining/')) return { parentTitle: '流程挖掘', childTitle: '流程挖掘诊断' };
    return { parentTitle: '协同工作', childTitle: '综合首页' };
  };

  if (!token) {
    return (
      <div className="min-h-screen flex bg-[#f5f7fa] select-none">
        <div className="hidden lg:flex lg:w-1/2 bg-[#1f2d3d] text-white p-14 flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#409eff] flex items-center justify-center font-bold text-lg">
              df
            </div>
            <span className="text-lg font-semibold tracking-tight">全源流程管理平台 dflow</span>
          </div>
          <div className="space-y-4 max-w-md">
            <h1 className="text-3xl font-bold leading-tight">企业数字化流程架构设计与资产运营中心</h1>
            <p className="text-sm text-[#bfcbd9] leading-relaxed">
              Enterprise Digital Process Management Platform
            </p>
            <p className="text-xs text-[#909399] leading-relaxed pt-2">
              基于 draw.io v32 引擎 · 流程端到端治理 · 关键控制点(KCP)合规
            </p>
          </div>
          <div className="text-xs text-[#909399]">
            Copyright © 2026 全源数字科技版权所有
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-[380px] bg-white rounded border border-[#ebeef5] p-8 shadow-xs">
            <h2 className="text-lg font-bold text-[#1f2733] mb-1">登录 dflow 平台</h2>
            <p className="text-xs text-[#909399] mb-6">请输入您的企业账号密码</p>
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#606266] mb-1.5 font-medium">账号</label>
                <input
                  type="text"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="admin"
                  className="w-full h-9 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#606266] mb-1.5 font-medium">密码</label>
                <input
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="123456"
                  className="w-full h-9 px-3 rounded border border-[#dcdfe6] focus:border-[#409eff] outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[#606266] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>记住密码</span>
                </label>
                <span className="text-[#909399]">初始化参考账号: admin / 123456</span>
              </div>
              <div className="text-[10px] text-[#909399] bg-[#f8fafc] p-2 rounded border border-[#e2e8f0] leading-relaxed">
                <span className="font-medium text-[#606266]">可复制使用的8大基准角色（密码统一 123456）：</span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 text-[9.5px]">
                  <span>• 超级管理: admin</span>
                  <span>• 流程总监: flow_admin</span>
                  <span>• 流程架构: zhangsan</span>
                  <span>• 合规风控: risk_officer</span>
                  <span>• 权责管理: duty_lead</span>
                  <span>• 业务总监: rd_director</span>
                  <span>• 业务执行: operator</span>
                  <span>• 内审监督: auditor</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full h-9 rounded bg-[#409eff] hover:bg-[#3390ff] text-white font-semibold transition-colors cursor-pointer"
              >
                {loginLoading ? '登录中...' : '立即登录'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (fullScreenMode === 'designer') {
    return (
      <>
        <DrawioDesigner
          flowId={activeDesignerFlowId}
          onBack={() => {
            setSelectedFlowId(activeDesignerFlowId);
            setCurrentPath('/build/design');
            setFullScreenMode('none');
          }}
          onOpenViewer={(fid) => handleOpenViewer(fid)}
          showToast={showToast}
        />
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded shadow-lg border bg-white flex items-center gap-2 text-xs font-medium">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#67c23a]" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-[#409eff]" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-[#f56c6c]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#e6a23c]" />
            )}
            <span>{toast.msg}</span>
          </div>
        )}
      </>
    );
  }

  if (fullScreenMode === 'viewer') {
    const viewFlow = flows.find((f) => f.id === activeDesignerFlowId) || flows[0];
    return (
      <div className="fixed inset-0 flex flex-col bg-[#f8f9fb]">
        <header className="h-11 bg-white border-b border-[#e4e7ed] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFullScreenMode('designer')}
              className="h-7 px-2.5 rounded border border-[#dcdfe6] text-xs text-[#606266] hover:text-[#409eff] flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回画板</span>
            </button>
            <span className="text-sm font-semibold text-[#1f2733]">
              只读画板 · {viewFlow?.label || '流程图'}
            </span>
          </div>
          <span className="text-xs text-[#909399]">Chromeless 只读预览模式</span>
        </header>
        <div className="flex-1">
          <iframe
            title="流程查阅器"
            src="/drawio/index.html?embed=1&proto=json&ui=min&lang=zh&dflowReadOnly=1&modified=0"
            onLoad={(e) => {
              const win = (e.target as HTMLIFrameElement).contentWindow;
              if (win && viewFlow?.xml) {
                setTimeout(() => {
                  win.postMessage(
                    JSON.stringify({ action: 'load', xml: viewFlow.xml, title: viewFlow.label }),
                    '*'
                  );
                }, 150);
              }
            }}
            className="w-full h-full border-0 block"
          />
        </div>
      </div>
    );
  }

  const { parentTitle, childTitle } = resolveBreadcrumb();

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#f5f7fa] select-none">
      {/* Left Sidebar */}
      <aside
        className={`bg-[#1f2d3d] text-[#bfcbd9] flex flex-col h-full shrink-0 transition-all duration-200 ${
          sidebarCollapsed ? 'w-16' : 'w-[210px]'
        }`}
      >
        <div
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="h-12 bg-[#1a2634] flex items-center justify-center px-4 border-b border-white/5 cursor-pointer shrink-0"
          title="点击折叠/展开侧边栏"
        >
          {sidebarCollapsed ? (
            <span className="text-white font-bold text-sm">df</span>
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate('/dashboard/index');
              }}
              className="flex items-center gap-2 min-w-0 max-w-full cursor-pointer hover:opacity-90 transition-opacity"
              title="点击返回综合首页"
            >
              {systemLogo ? (
                <img src={systemLogo} alt="Logo" className="h-5 max-w-[50px] object-contain shrink-0" />
              ) : null}
              <span className="text-white font-bold text-[15px] tracking-wide truncate">
                {systemDisplayName || '全源流程管理平台'}
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-1 sidebar-transparent-scroll">
          {filteredMenuRoutes.map((group) => {
            const IconComp = group.icon;
            const isSingle = group.children.length === 1;
            const isExpanded = expandedMenuId === group.id;
            const hasActiveChild = group.children.some((c) => c.path === currentPath);

            if (isSingle) {
              return (
                <button
                  key={group.id}
                  onClick={() => {
                    setExpandedMenuId(null);
                    handleNavigate(group.children[0].path);
                  }}
                  className={`w-full h-11 px-4 flex items-center gap-3 text-xs transition-colors cursor-pointer ${
                    hasActiveChild
                      ? 'bg-[#16202c] text-white font-medium'
                      : 'text-[#bfcbd9] hover:bg-[#263445] hover:text-white'
                  }`}
                >
                  <IconComp className="w-4 h-4 text-[#409eff] shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{group.title}</span>}
                </button>
              );
            }

            return (
              <div key={group.id}>
                <button
                  onClick={() => {
                    if (sidebarCollapsed) {
                      setSidebarCollapsed(false);
                      setExpandedMenuId(group.id);
                      if (group.children.length === 1) {
                        handleNavigate(group.children[0].path);
                      }
                      return;
                    }
                    if (group.children.length === 1) {
                      setExpandedMenuId(group.id);
                      handleNavigate(group.children[0].path);
                    } else {
                      setExpandedMenuId((prev) => (prev === group.id ? null : group.id));
                    }
                  }}
                  className={`w-full h-11 px-4 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    hasActiveChild
                      ? 'text-white font-medium bg-[#263445]/60'
                      : 'text-[#bfcbd9] hover:bg-[#263445] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComp className="w-4 h-4 text-[#409eff] shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{group.title}</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#909399] transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>
                {!sidebarCollapsed && isExpanded && (
                  <div className="bg-[#141e29] py-1">
                    {group.children.map((sub) => {
                      const isSubActive = currentPath === sub.path;
                      return (
                        <button
                          key={sub.path}
                          onClick={() => handleNavigate(sub.path)}
                          className={`w-full h-10 pl-11 pr-4 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            isSubActive
                              ? 'text-white bg-[#409eff] font-medium'
                              : 'text-[#bfcbd9] hover:text-white hover:bg-[#1f2d3d]/30'
                          }`}
                        >
                          <span className="truncate">{sub.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <header className="h-12 bg-white border-b border-[#ebeef5] px-4 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded hover:bg-[#f5f7fa] text-[#606266] cursor-pointer"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#909399]">{parentTitle}</span>
              <span className="text-[#c0c4cc]">/</span>
              <span className="text-[#409eff] font-medium">{childTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 text-xs text-[#303133] hover:text-[#409eff] cursor-pointer py-1"
            >
              <div className="w-6 h-6 rounded-full bg-[#2F7BFE] text-white flex items-center justify-center font-bold text-[11px]">
                {(currentUser.userName || '流').slice(0, 1)}
              </div>
              <span className="font-medium">{currentUser.userName || '流程管理员'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#909399]" />
            </button>
            {userDropdownOpen && (
              <div className="absolute right-0 top-10 w-72 bg-white rounded-lg border border-[#ebeef5] shadow-xl py-2 z-50 text-xs">
                <div className="px-3 pb-2 mb-1 border-b border-[#F0F2F5]">
                  <div className="font-bold text-sm text-[#303133]">
                    {currentUser.userName || '流程管理员'}
                  </div>
                  <div className="text-[11px] text-[#909399] mt-0.5">
                    {currentUser.jobTitle || '经理'} · {currentUser.deptName || '流程管理部'}
                  </div>
                  <div className="text-[10.5px] text-[#2F7BFE] mt-0.5 truncate font-medium">
                    {currentUser.companyName || '测试集团有限公司'}
                  </div>
                </div>
                <div className="px-3 py-2 border-b border-[#F0F2F5] bg-[#f9fafc]">
                  <div className="text-[10.5px] text-[#909399] font-medium mb-1.5 flex items-center justify-between">
                    <span>标准角色初始化参考账号：</span>
                    <span className="text-[9.5px] text-[#409eff]">责任人联动识别</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { name: '系统管理员', account: 'admin', role: '超级管理员', dept: '系统管理部' },
                      { name: '流程管理员', account: 'flow_admin', role: '流程管理总监', dept: '流程管理部' },
                      { name: '张三', account: 'zhangsan', role: '高级流程架构师', dept: '研发管理中心' },
                      { name: '王合规', account: 'risk_officer', role: '合规风控总监', dept: '法律合规与内控部' },
                      { name: '李权责', account: 'duty_lead', role: '权责核准主管', dept: '权责管理部' },
                      { name: '赵业务', account: 'rd_director', role: '业务中心总监', dept: '市场营销中心' },
                      { name: '孙执行', account: 'operator', role: '研发工程师', dept: '结构开发部' },
                      { name: '钱审计', account: 'auditor', role: '高级内审专家', dept: '集团审计监察部' },
                    ].map((acc) => (
                      <button
                        key={acc.account}
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/session', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: acc.account }),
                            });
                            const body = await res.json();
                            if (body.data) {
                              setCurrentUser(body.data);
                            }
                          } catch {
                            setCurrentUser((prev: any) => ({
                              ...prev,
                              userName: acc.name,
                              nickName: acc.name,
                              userId: acc.account,
                              jobTitle: acc.role,
                              deptName: acc.dept,
                            }));
                          }
                          setUserDropdownOpen(false);
                          showToast(`当前账号已切换为【${acc.name}】(${acc.role})`, 'info');
                        }}
                        className={`px-2 py-1 rounded text-[10px] border transition-colors cursor-pointer flex items-center justify-between w-[calc(50%-2px)] ${
                          currentUser.userName === acc.name || currentUser.userId === acc.account
                            ? 'bg-[#409eff] text-white border-[#409eff] font-medium'
                            : 'bg-white text-[#606266] border-[#dcdfe6] hover:border-[#409eff] hover:text-[#409eff]'
                        }`}
                        title={`${acc.name} · ${acc.role} (${acc.dept})`}
                      >
                        <span className="truncate">{acc.name}</span>
                        <span className="text-[9px] opacity-75">{acc.role.slice(0, 4)}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-1.5 text-left text-[#f56c6c] hover:bg-[#fef0f0] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>退出登录</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 min-h-0">
          <ErrorBoundary fallbackTitle="页面视图加载异常">
          {currentPath === '/dashboard/index' ? (
            <DashboardView currentUser={currentUser} onNavigate={handleNavigate} />
          ) : currentPath === '/property/verify' || currentPath === '/property/partake' || currentPath === '/property/catalog' ? (
            <MyResponsibleView
              subPath={currentPath}
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onEnterDesigner={handleEnterDesigner}
              showToast={showToast}
            />
          ) : currentPath.startsWith('/property/') ? (
            <PropertyOverviewView
              initialSelectedFlowId={selectedFlowId}
              mode={currentPath === '/property/integrate' ? 'integrate' : 'overview'}
              subPath={currentPath}
              currentUser={currentUser}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          ) : currentPath === '/build/repeal' ? (
            <FlowRepealArchiveView
              currentUser={currentUser}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          ) : currentPath === '/build/design' ? (
            <FlowDesignView
              initialSelectedFlowId={selectedFlowId}
              currentUser={currentUser}
              onEnterDesigner={handleEnterDesigner}
              onNavigate={handleNavigate}
              onSelectNodeId={(id) => {
                setSelectedFlowId((prev) => (prev === id ? prev : id));
              }}
              showToast={showToast}
            />
          ) : currentPath === '/build/verify' ? (
            <FlowVerifyView
              onNavigateToFlow={(flowId) => handleNavigate('/build/design', flowId)}
              onEnterDesigner={handleEnterDesigner}
              showToast={showToast}
            />
          ) : currentPath === '/task/learning' ? (
            <ProcessLearningView
              currentUser={currentUser}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          ) : currentPath === '/execute/process' || currentPath.startsWith('/task/') ? (
            <FlowProcessView
              subPath={currentPath}
              onNavigate={handleNavigate}
              onEnterDesigner={handleEnterDesigner}
              showToast={showToast}
            />
          ) : currentPath.startsWith('/sysdoc/') ? (
            <SysDocRiskModuleView
              moduleType="sysdoc"
              subPath={currentPath}
              currentUser={currentUser}
              dictBundle={dictBundle}
              onRefreshDict={refreshDictBundle}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          ) : currentPath.startsWith('/risk/') ? (
            <SysDocRiskModuleView
              moduleType="risk"
              subPath={currentPath}
              currentUser={currentUser}
              dictBundle={dictBundle}
              onRefreshDict={refreshDictBundle}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          ) : currentPath === '/flowdoc/verify' ? (
            <DutyAuditView
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          ) : currentPath === '/flowdoc/duty' || currentPath === '/flowdoc/dutyList' || currentPath === '/flowdoc/file' ? (
            <DutyBuildView
              subPath={currentPath}
              flows={flows}
              showToast={showToast}
              onNavigate={handleNavigate}
            />
          ) : currentPath.startsWith('/flowdoc/') ? (
            <DutyManageView
              subPath={currentPath}
              flows={flows}
              archTypes={dictBundle?.archTypes || []}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          ) : currentPath === '/build/roles' ? (
            <ProcessRoleLibraryView
              onNavigate={handleNavigate}
              onEnterDesigner={handleEnterDesigner}
              showToast={showToast}
            />
          ) : currentPath === '/build/terms' ? (
            <FlowTermsView showToast={showToast} />
          ) : currentPath.startsWith('/org/') ? (
            <OrgManageView
              subPath={currentPath}
              onNavigate={handleNavigate}
              showToast={showToast}
              onRefreshDict={refreshDictBundle}
            />
          ) : currentPath === '/system/company' ? (
            <CompanyAuthManageView
              onUpdateSystemDisplay={(name, logo) => {
                setSystemDisplayName(name);
                setSystemLogo(logo);
              }}
              onUpdateCompanyName={(newCompanyName) => {
                setCurrentUser((prev: any) => ({ ...prev, companyName: newCompanyName }));
              }}
              showToast={showToast}
            />
          ) : currentPath === '/system/api' ? (
            <ApiManageView showToast={showToast} />
          ) : currentPath === '/system/column' || currentPath === '/system/form' ? (
            <FormEngineView
              initialFormKey={formEngineActiveKey}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          ) : currentPath.startsWith('/mining/') || currentPath.startsWith('/knowproj/') ? (
            <ProcessMiningView
              subPath={currentPath}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          ) : (
            <div className="bg-white rounded border border-[#ebeef5] p-6 text-center text-xs text-[#909399]">
              模块加载中...
            </div>
          )}
          </ErrorBoundary>
        </main>
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded shadow-lg border border-[#ebeef5] bg-white flex items-center gap-2 text-xs font-medium">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#67c23a]" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-[#409eff]" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-[#f56c6c]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#e6a23c]" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
