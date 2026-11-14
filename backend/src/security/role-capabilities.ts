export function effectiveRoles(user:any, roles:any[]): string[] {
  const direct=Array.isArray(user.accessRoles)?user.accessRoles:['viewer'];
  const names=Array.isArray(user.roleNames)?user.roleNames:[];
  const granted=roles.filter(role=>role.status==='0'&&names.includes(role.roleName)).flatMap(role=>Array.isArray(role.apiRoles)?role.apiRoles:[]).filter(value=>['editor','auditor','viewer','document_editor','risk_editor','duty_editor','approval_manager'].includes(value));
  const systemAdmin=roles.some(role=>role.status==='0'&&role.roleName==='系统管理员'&&names.includes(role.roleName)&&role.apiRoles?.includes('admin'));
  return [...new Set<string>([...direct,...granted,...(systemAdmin?['admin']:[])])];
}
