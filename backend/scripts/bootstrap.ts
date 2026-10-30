import { Database } from '../src/database';
import { hashPassword } from '../src/security/password';
import { initialFormEngineSchemas } from '../src/domain/form-defaults';
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const name = process.env.BOOTSTRAP_USER || 'admin';
  const password = await hashPassword(process.env.BOOTSTRAP_PASSWORD || '');
  const db = new Database();
  try {
    await db.transaction(true, async c => {
      if ((await c.query('SELECT 1 FROM users LIMIT 1')).rowCount) throw new Error('Bootstrap only runs on an empty user table');
      const before = await db.load(c), state = structuredClone(before);
      state.orgUsers.push({ id:'u_admin', userName:name, nickName:'系统管理员', status:'0', accessRoles:['admin'], roleNames:['系统管理员'], deptId:'', deptName:'', empNo:'ADMIN' });
      state.archTypes.push({ id:'arch_root', parentId:'', label:'企业流程架构', level:'L0', archNo:'ROOT', versionNo:'V0' });
      state.formEngineSchemas = structuredClone(initialFormEngineSchemas);
      await db.save(c,before,state);
      await c.query('INSERT INTO credentials(user_id,password_hash) VALUES($1,$2)',['u_admin',password]);
    });
    console.log('Administrator and form templates created. No demonstration business data imported.');
  } finally { await db.onModuleDestroy(); }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
