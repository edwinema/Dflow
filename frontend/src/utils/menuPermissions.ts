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
