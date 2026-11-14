/** Expand the previous combined menu grant without widening either new grant. */
export function normalizeMenuPermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((key): key is string => typeof key === 'string').flatMap(key =>
    key === 'system' || key === '组织系统' ? ['organization', 'settings'] : [key]
  ))];
}

/** Editing a single module must not retain an all-menus grant or remove other modules. */
export function toggleMenuPermission(value: unknown, moduleId: string, checked: boolean, moduleIds: string[]): string[] {
  const current = normalizeMenuPermissions(value);
  const explicit = current.filter(key => key !== 'all' && key !== '全部菜单');
  if (current.includes('all') || current.includes('全部菜单')) explicit.push(...moduleIds);
  return [...new Set(checked ? [...explicit, moduleId] : explicit.filter(key => key !== moduleId))];
}

/** Menu grants only narrow API capabilities; display names and “all menus” never grant admin access. */
export function canAccessPath(path: string, user: any): boolean {
  path = path.split('?')[0];
  if (!user?.id) return false;
  const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
  const admin = roles.includes('admin');
  if (admin) return true;
  if (path.startsWith('/org/') || path.startsWith('/system/')) return false;
  const editing = ['/build/', '/flowdoc/duty', '/sysdoc/index2', '/sysdoc/audit', '/risk/index', '/risk/audit'];
  const domainCapability=path.startsWith('/sysdoc/')?'document_editor':path.startsWith('/risk/')?'risk_editor':path.startsWith('/flowdoc/')?'duty_editor':'';
  if (editing.some(prefix=>path.startsWith(prefix)) && !roles.includes('editor') && !(domainCapability&&roles.includes(domainCapability))) return false;
  if (path.startsWith('/approval/')) return true;
  const perms = normalizeMenuPermissions(user.menuPermissions);
  // No configured menu grants: use the capability-filtered defaults, never admin pages.
  if (user.menuPermissions === undefined || perms.includes('all') || perms.includes('全部菜单')) return true;
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
      '/build/design': ['build', 'design', '流程设计'],
      '/build/verify': ['design', '流程设计', '流程审核'],
      '/build/roles': ['build', 'design', '流程设计', '流程角色'],
      '/build/terms': ['build', 'design', '流程设计', '流程术语'],
      '/execute/process': ['execute', '流程运行', '流程实例运行'],
      '/mining/engine': ['mining', '流程挖掘', '流程挖掘诊断'],
      '/flowdoc/duty': ['duty', '权责管控', '权责建设', '权责清单与手册'],
      '/flowdoc/manual': ['duty', '权责管控', '权责手册'],
      '/flowdoc/dutyList': ['duty', '权责管控', '权责手册'],
      '/flowdoc/verify': ['duty', '权责管控', '权责审核'],
      '/sysdoc/index2': ['risk', 'governance', '风控合规', 'sysdoc_lib', '制度文件库'],
      '/sysdoc/indexview': ['risk', 'governance', '风控合规', 'sysdoc_query', '制度查阅', '/sysdoc/indexview'],
      '/risk/index': ['risk', 'governance', '风控合规', 'risk_lib', '风险合规库'],
      '/risk/riskview': ['risk', 'governance', '风控合规', 'risk_query', '风险查阅', '/risk/riskview'],
      '/build/repeal': ['build', 'design', 'governance', '风控合规', 'flow_obsolete', '流程废止归档'],
      '/org/dept': ['organization', '组织权限', '部门组织'],
      '/org/user': ['organization', '组织权限', '用户管理'],
      '/org/role': ['organization', '组织权限', '权限管理'],
      '/system/column': ['settings', '系统设置', '表单引擎'],
      '/system/company': ['settings', '系统设置', '公司授权'],
      '/system/api': ['settings', '系统设置', 'API管理'],
      '/sysdoc/audit': ['risk', 'governance', '风控合规', 'sysdoc_lib', '制度文件库', '制度审批'],
      '/risk/audit': ['risk', 'governance', '风控合规', 'risk_lib', '风险合规库', '风险审批'],
      '/system/models': ['settings', '系统设置', '模型配置'],
    };

  const keys = pathKeyMap[path] || [];
  return perms.some(key=>key===path || keys.includes(key));
}
