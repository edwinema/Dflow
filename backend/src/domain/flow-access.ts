import { Actor, State } from './types';
import { approvalIdentity } from './approval-identity';
export function ownsFlow(s:State,actor:Actor,flow:any):boolean {
  return Boolean(flow&&approvalIdentity(s,actor,flow.ownerId||flow.ownerName));
}
export function canEditFlow(s:State,actor:Actor,flow:any):boolean {
  if(actor.roles.includes('admin'))return true;
  if(!actor.roles.includes('editor')||!flow)return false;
  return ownsFlow(s,actor,flow)||(Array.isArray(flow.collaborators)&&flow.collaborators.some((u:any)=>approvalIdentity(s,actor,typeof u==='string'?u:u.userId||u.englishName||u.userName)));
}
