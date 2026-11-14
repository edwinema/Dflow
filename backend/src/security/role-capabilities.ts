export function effectiveRoles(user:any, roles:any[]): string[] {
  const direct=Array.isArray(user.accessRoles)?user.accessRoles:['viewer'];
  const names=Array.isArray(user.roleNames)?user.roleNames:[];
  const granted=roles.filter(role=>role.status==='0'&&names.includes(role.roleName)).flatMap(role=>Array.isArray(role.apiRoles)?role.apiRoles:[]).filter(value=>['editor','auditor','viewer'].includes(value));
  return [...new Set<string>([...direct,...granted])];
}
