import { State } from './types';

// Each array is a separate PostgreSQL table; objects are named settings.
// Dynamic form, diagram and approval payloads deliberately retain their JSON structure.
export const collections = {
  archTypes: 'flow_architectures', flows: 'flow_models',
  flowAuditRecords: 'flow_audits', flowRepealRecords: 'flow_repeals',
  flowProcessTasks: 'execution_tasks', dutyTables: 'duty_definitions',
  dutyCategories: 'duty_categories', orgDepts: 'departments',
  orgUsers: 'users', orgPositions: 'positions', orgJobTitles: 'job_titles',
  orgRoles: 'organization_roles', buildProcessRoles: 'process_roles',
  roleCategoriesStore: 'role_categories', flowTerms: 'flow_terms',
  flowTermCategories: 'term_categories', formEngineSchemas: 'form_schemas',
  dutyManuals: 'duty_manuals', dutyAuditTasks: 'duty_audits', systemApis: 'api_definitions',
} as const;
export const settings = ['dictBundle', 'archRefsStore', 'flowRefsStore', 'companyAuthData'] as const;
export function emptyState(): State {
  return {
    ...Object.fromEntries(Object.keys(collections).map(k => [k, []])),
    dictBundle: { sysDoc: [], risk: [], sysDocTree: [], riskTree: [], flowRole: [], system: [], flowType: [], user: [], dept: [], execSystem: [], position: [], attachments: [], terms: [] },
    archRefsStore: {}, flowRefsStore: {}, companyAuthData: { companyName: '', license: { status: 'INACTIVE' } },
  };
}
