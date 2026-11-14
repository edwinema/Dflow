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
  User,
} from 'lucide-react';
import { MENU_ROUTES } from './config/menuRoutes';
import { canAccessPath } from './utils/menuPermissions';
import { DashboardView } from './components/DashboardView';
import { FlowDesignView } from './components/FlowDesignView';
import { ApprovalCenterView } from './components/ApprovalCenterView';
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
import { AiModelConfigView } from './components/AiModelConfigView';
import { FlowTermsView } from './components/FlowTermsView';
import { MyResponsibleView } from './components/MyResponsibleView';
import { DutyBuildView } from './components/DutyBuildView';
import { DutyAuditView } from './components/DutyAuditView';
import { ProcessMiningView } from './components/ProcessMiningView';
import { ProcessLearningView } from './components/ProcessLearningView';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    localStorage.removeItem('dflow-token');
    const expire=()=>{setToken(null);setCurrentUser({});};
    window.addEventListener('session-expired',expire);
    fetch('/api/session').then(async r=>{
      const body=await r.json();
      if(r.ok&&body.status===1&&body.data){setCurrentUser(body.data);setToken('cookie-session');}
    }).catch(()=>{});
    return ()=>window.removeEventListener('session-expired',expire);
  }, []);

  const [currentPath, setCurrentPath] = useState<string>('/dashboard/index');
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>('arch_root');
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

  useEffect(() => {
    const onError = (event: Event) => showToast((event as CustomEvent).detail?.message || '权限不足', 'error');
    window.addEventListener('api-error', onError);
    return () => window.removeEventListener('api-error', onError);
  }, []);

  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  const [flows, setFlows] = useState<any[]>([]);
  const [dictBundle, setDictBundle] = useState<any>({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentUser, setCurrentUser] = useState<any>({
    userName: '流程管理员',
    jobTitle: '经理',
    deptName: '流程管理部',
    companyName: '苏州全元数字科技有限公司',
  });

  const [userAvatar, setUserAvatar] = useState<string>(() => {
    return localStorage.getItem('dflow_avatar_流程管理员') || localStorage.getItem('dflow_user_avatar') || '';
  });

  useEffect(() => {
    const handleAvatarChange = (e: any) => {
      if (e.detail?.avatar !== undefined) {
        setUserAvatar(e.detail.avatar);
      }
    };
    window.addEventListener('dflow_avatar_changed', handleAvatarChange);
    return () => window.removeEventListener('dflow_avatar_changed', handleAvatarChange);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`dflow_avatar_${currentUser.userName}`) || localStorage.getItem('dflow_user_avatar') || '';
    setUserAvatar(saved);
  }, [currentUser.userName]);

  useEffect(() => {
    if (token) {
      fetch('/api/session')
        .then((r) => r.json())
        .then((res) => {
          if (res.data) setCurrentUser(res.data);
        })
        .catch(() => {});
      fetch('/api/system/company')
        .then((r) => r.json())
        .then((res) => {
          if (res.data?.companyName) {
            setCurrentUser((prev: any) => ({ ...prev, companyName: res.data.companyName }));
          }
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

  const filteredMenuRoutes = useMemo(() => {
    return MENU_ROUTES.map((group) => {
      const validChildren = group.children.filter((child) => canAccessPath(child.path, currentUser));
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
      if (!allAllowedPaths.some(path => currentPath === path || currentPath.startsWith(path + '?'))) {
        const targetPath = allAllowedPaths[0];
        if (targetPath) {
          setCurrentPath(targetPath);
          const parentGroup = filteredMenuRoutes.find((g) => g.children.some((c) => c.path === targetPath || targetPath.startsWith(c.path+'?')));
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
      const authHeader = 'cookie-session';
      const body = await res.json();
      if (body.status === 1) {
        setLoginPass('');
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
      showToast('登录失败，请检查网络连接后重试', 'error');
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
    const aliases:Record<string,string>={'/build/verify':'/approval/pending?type=flow','/flowdoc/verify':'/approval/pending?type=duty','/sysdoc/audit':'/approval/pending?type=sysDoc','/risk/audit':'/approval/pending?type=risk'};
    const targetPath = aliases[path] || (!path || path === '/' ? '/dashboard/index' : path);
    if (!canAccessPath(targetPath, currentUser)) { showToast('您没有访问该页面的权限', 'error'); return; }
    if (extraParam) {
      if (targetPath.startsWith('/build/') || targetPath.startsWith('/property/')) {
        setSelectedFlowId(extraParam);
      } else if (targetPath === '/system/column' || targetPath === '/system/form') {
        setFormEngineActiveKey(extraParam);
      }
    } else {
      if (targetPath === '/build/design' || targetPath === '/property/overview') {
        setSelectedFlowId('arch_root');
      }
    }
    setCurrentPath(targetPath);
    setFullScreenMode('none');
    const matchedGroup =
      MENU_ROUTES.find((g) => g.children.some((c) => c.path === targetPath || targetPath.startsWith(c.path+'?'))) ||
      MENU_ROUTES.find((g) => {
        if (targetPath.startsWith('/task/') && g.id === 'workspace') return true;
        if (targetPath.startsWith('/property/') && (g.id === 'workspace' || g.id === 'property')) return true;
        if (targetPath.startsWith('/flowdoc/') && (g.id === 'duty' || g.id === 'governance')) return true;
        if (targetPath.startsWith('/sysdoc/') && g.id === 'governance') return true;
        if (targetPath.startsWith('/risk/') && g.id === 'governance') return true;
        if (targetPath.startsWith('/org/') && g.id === 'organization') return true;
        if (targetPath.startsWith('/system/') && g.id === 'settings') return true;
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
      const child = group.children.find((c) => c.path === currentPath || currentPath.startsWith(c.path+'?'));
      if (child) {
        return { parentTitle: group.title, childTitle: child.title };
      }
    }
    if (currentPath === '/flowdoc/manual' || currentPath === '/flowdoc/dutyList') return { parentTitle: '权责管控', childTitle: '权责手册' };
    if (currentPath === '/flowdoc/duty') return { parentTitle: '权责管控', childTitle: '权责建设' };
    if (currentPath === '/flowdoc/verify') return { parentTitle: '权责管控', childTitle: '权责审核' };
    if (currentPath.startsWith('/flowdoc/')) return { parentTitle: '权责管控', childTitle: '权责建设' };
    if (currentPath === '/sysdoc/indexview') return { parentTitle: '风控合规', childTitle: '制度查阅' };
    if (currentPath.startsWith('/sysdoc/')) return { parentTitle: '风控合规', childTitle: '制度文件库' };
    if (currentPath === '/risk/riskview') return { parentTitle: '风控合规', childTitle: '风险查阅' };
    if (currentPath.startsWith('/risk/')) return { parentTitle: '风控合规', childTitle: '风险合规库' };
    if (currentPath.startsWith('/task/')) return { parentTitle: '协同工作', childTitle: currentPath === '/task/learning' ? '流程培训' : currentPath === '/task/finishlist' ? '已完成任务' : '任务协作' };
    if (currentPath.startsWith('/org/')) return { parentTitle: '组织权限', childTitle: '部门组织' };
    if (currentPath.startsWith('/system/')) return { parentTitle: '系统设置', childTitle: currentPath === '/system/form' ? '表单引擎' : '系统设置' };
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
            <span className="text-lg font-semibold tracking-tight">全元流程管理平台 dflow</span>
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
            Copyright © 2026 全元数字科技版权所有
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
                  placeholder="请输入密码"
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
                  <span>记住账号</span>
                </label>
                <span className="text-[#909399]">请使用管理员分配的账号</span>
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
          onNavigate={(path) => {
            setCurrentPath(path);
            setFullScreenMode('none');
          }}
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
                {systemDisplayName || '全元流程管理平台'}
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-1 sidebar-transparent-scroll">
          {filteredMenuRoutes.map((group) => {
            const IconComp = group.icon;
            const isSingle = group.children.length === 1;
            const isExpanded = expandedMenuId === group.id;
            const hasActiveChild = group.children.some((c) => c.path === currentPath || currentPath.startsWith(c.path+'?'));

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
                    if (group.id === 'workspace') {
                      setSidebarCollapsed(false);
                      setExpandedMenuId(group.id);
                      const home = group.children.find((child) => child.path === '/dashboard/index');
                      handleNavigate(home?.path || group.children[0].path);
                      return;
                    }
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
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={currentUser.userName}
                  className="w-6 h-6 rounded-full object-cover border border-[#DCDFE6]"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#2F7BFE] text-white flex items-center justify-center font-bold text-[11px]">
                  {(currentUser.userName || '流').slice(0, 1)}
                </div>
              )}
              <span className="font-medium">{currentUser.userName || '流程管理员'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#909399]" />
            </button>
            {userDropdownOpen && (
              <div className="absolute right-0 top-10 w-72 bg-white rounded-lg border border-[#ebeef5] shadow-xl py-2 z-50 text-xs">
                <div className="px-3 pb-2 mb-1 border-b border-[#F0F2F5] flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#B3D8FF] flex items-center justify-center overflow-hidden shrink-0 text-white shadow-2xs">
                    {userAvatar ? (
                      <img src={userAvatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 fill-current text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-[#303133] truncate">
                      {currentUser.userName || '流程管理员'}
                    </div>
                    <div className="text-[11px] text-[#909399] mt-0.5 truncate">
                      {currentUser.jobTitle || '经理'} · {currentUser.deptName || '流程管理部'}
                    </div>
                    <div className="text-[10.5px] text-[#2F7BFE] mt-0.5 truncate font-medium">
                      {currentUser.companyName || '苏州全元数字科技有限公司'}
                    </div>
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
          {currentPath.startsWith('/approval/') ? (
            <ApprovalCenterView subPath={currentPath} onNavigate={handleNavigate} showToast={showToast} />
          ) : currentPath === '/dashboard/index' ? (
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
          ) : currentPath === '/flowdoc/duty' || currentPath === '/flowdoc/manual' || currentPath === '/flowdoc/dutyList' || currentPath === '/flowdoc/file' ? (
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
          ) : currentPath === '/system/models' ? (
            <AiModelConfigView showToast={showToast} onNavigate={handleNavigate} />
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
