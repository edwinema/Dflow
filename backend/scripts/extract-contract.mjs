// One-time, reviewable migration tooling. Runtime never imports the prototype server.
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const source = fs.readFileSync('../legacy/prototype/server.ts', 'utf8');
const ast = ts.createSourceFile('../legacy/prototype/server.ts', source, ts.ScriptTarget.Latest, true);
const states = ['archTypes','flows','flowAuditRecords','flowRepealRecords','flowProcessTasks','dutyTables','dutyCategories','orgDepts','orgUsers','orgPositions','orgJobTitles','orgRoles','buildProcessRoles','roleCategoriesStore','flowTerms','flowTermCategories','formEngineSchemas','dutyManuals','dutyAuditTasks','systemApis','dictBundle','archRefsStore','flowRefsStore','companyAuthData'];
const helpers = new Set(['buildDefaultFlowXml','recalculateManualCounts','findDutyItem','getCategoryRoleCount','syncCategoryCounts']);
const excluded = p => p === '/api/session' || p.includes('/logout') || p.includes('/license/') || p.startsWith('/api/mining/') || (p.startsWith('/api/ai/') && p !== '/api/ai/flow-audit') || p === '/api/dict/doc/download' || p.endsWith('/publishVersionHistories') || p.endsWith('/reset');
const routes = [], bodies = [], functions = [], defaults = [];
const overridden=new Set(['POST /api/dict/tree','POST /api/execute/tasks/assign','PUT /api/execute/tasks/:id','PUT /api/execute/tasks/:id/step','POST /api/execute/tasks/:id/submit','GET /api/system/apis']);
for (const stmt of ast.statements) {
  if (ts.isVariableStatement(stmt)) {
    const name = stmt.declarationList.declarations[0].name.getText(ast);
    if (helpers.has(name)) functions.push(stmt.getText(ast));
    if (name === 'initialFormEngineSchemas') defaults.push(stmt.getText(ast).replace('const initial', 'export const initial'));
  }
  if (ts.isFunctionDeclaration(stmt) && helpers.has(stmt.name?.text)) functions.push(stmt.getText(ast));
  if (!ts.isExpressionStatement(stmt) || !ts.isCallExpression(stmt.expression)) continue;
  const call = stmt.expression;
  if (!ts.isPropertyAccessExpression(call.expression) || call.expression.expression.getText(ast) !== 'app') continue;
  const method = call.expression.name.text;
  if (!['get','post','put','delete'].includes(method) || !ts.isStringLiteral(call.arguments[0])) continue;
  const url = call.arguments[0].text;
  if (!url.startsWith('/api/')) continue;
  const line = ast.getLineAndCharacterOfPosition(stmt.getStart(ast)).line + 1;
  routes.push({ method: method.toUpperCase(), path: url, sourceLine: line, implementation: excluded(url) ? 'native service / explicit disabled reset' : 'transactional domain' });
  if (!excluded(url)&&!overridden.has(`${method.toUpperCase()} ${url}`)) bodies.push(stmt.getText(ast));
}
let code = functions.join('\n\n') + '\n\n' + bodies.join('\n\n');
code = code.replace(/Date\.now\(\)\.toString\(36\)/g, 'randomUUID()');
code = code.replace(/Math\.random\(\)\.toString\(36\)\.substring\(2, \d+\)/g, 'randomUUID()');
code = code.replace('`SH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`', '`SH-${randomUUID()}`');
code = code.replace(/ \|\| (archTypes|flows|formEngineSchemas)\[0\]/g, '');
code = code.replace("|| ['doc_01', 'doc_02']", '|| []').replace("|| ['doc_01']", '|| []');
code = code.replace(/password: password \|\| '123456'/g, 'password: password');
code = code.replaceAll("'2026-03-17 至 2029-03-16 (长期有效)'", "''");
code = code.replace(/Math\.floor\(100 \+ Math\.random\(\) \* 900\)/g, 'randomUUID()');
code = code.replace(/Math\.floor\(Math\.random\(\) \* 899 \+ 100\)/g, 'randomUUID()');
code = code.replace(/'00' \+ Math\.floor\(Math\.random\(\) \* 90 \+ 10\)/g, 'randomUUID()');
code = code.replace(/kcpCount: 2/g,'kcpCount: 0').replace(/activityCount: [45]/g,'activityCount: 0').replace(/boundDocsCount: 2/g,'boundDocsCount: 0');
code = code.replace(/\(deptId \|\| 'dept_01'\)/g, "(deptId || '')").replace(/: 'dept_01',/g, ": '',");
code = code.replace(/\(deptCode \|\| '0010'\)/g, "(deptCode || '')").replace(/: '0010',/g, ": '',");
code = code.replace(/\(deptName \|\| '系统管理部'\)/g, "(deptName || '')");
code = code.replace(/creator: '系统管理员'/g, 'creator: currentActiveUser.userName');
code = code.replace(/ownerName: '系统管理员'/g, 'ownerName: currentActiveUser.userName');
code = code.replace(/publishUserName: '系统管理员'/g, 'publishUserName: currentActiveUser.userName');
// Prevent attribute injection in XML generated from user input.
code = code.replace('steps.forEach((st, i) => {', `steps.forEach((raw, i) => {
    const escape = (v: string) => String(v).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    const st = { ...raw, title: escape(raw.title), role: escape(raw.role), desc: escape(raw.desc), out: escape(raw.out) };`);
// These defaults become startup templates only, never business sample rows.
fs.mkdirSync('src/domain', { recursive: true });
fs.writeFileSync('src/domain/form-defaults.ts', defaults.join('\n'));
fs.writeFileSync('src/domain/operations.ts', `// Migrated business rules. No process-global mutable data and no Express server.
import { randomUUID } from 'node:crypto';
import { Registry, State, Actor } from './types';
export function registerOperations(app: Registry, state: State, currentActiveUser: Actor) {
  let { ${states.join(', ')} } = state;
  const systemUsers = orgUsers.map((u: any) => ({ id: u.id, name: u.nickName || u.userName, userName: u.userName }));
  const DEFAULT_COLLAB_DEPTS = orgDepts.map((d: any) => d.deptName);
${code}
  return () => Object.assign(state, { ${states.join(', ')} });
}
`);
fs.mkdirSync('docs', {recursive: true});
fs.writeFileSync('docs/routes.json', JSON.stringify(routes, null, 2) + '\n');
const requests = [];
for (const file of fs.readdirSync('../src/components')) {
  if (!file.endsWith('.tsx')) continue;
  const body = fs.readFileSync(path.join('../src/components', file), 'utf8');
  const tree = ts.createSourceFile(file, body, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const walk = n => {
    if (ts.isCallExpression(n) && n.expression.getText(tree) === 'fetch') {
      const line = tree.getLineAndCharacterOfPosition(n.getStart(tree)).line + 1;
      requests.push({ file, line, request: n.getText(tree) });
    }
    ts.forEachChild(n, walk);
  };
  walk(tree);
}
fs.writeFileSync('docs/frontend-requests.json', JSON.stringify(requests, null, 2) + '\n');
console.log(`Extracted ${routes.length} routes and ${requests.length} frontend fetch calls.`);
