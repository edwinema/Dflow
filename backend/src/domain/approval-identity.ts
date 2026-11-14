import { Actor, State } from './types';

/** Stable identities take precedence; ambiguous legacy display names never grant approval access. */
export function approvalIdentity(state: State, actor: Actor, value: unknown): boolean {
  if (typeof value !== 'string' || !value) return false;
  if (value === actor.id || value === actor.userId) return true;
  return value === actor.userName && state.orgUsers.filter((user: any) => user.nickName === value).length === 1;
}
export function assignedApprover(state: State, actor: Actor, step: any): boolean {
  return Boolean(step && approvalIdentity(state, actor, step.approverId || step.approverName));
}
