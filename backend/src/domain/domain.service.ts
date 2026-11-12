import { Injectable, Inject, BadRequestException, ConflictException, HttpException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { PoolClient } from 'pg';
import { createHash, randomUUID } from 'node:crypto';
import { Database } from '../database';
import { Actor, DomainRequest, DomainResponse, Handler, Registry, State } from './types';
import { registerFrontendSync } from './frontend-sync';
import { registerOrgCatalog } from './org-catalog';
import { registerDocumentTemplates } from './document-templates';
import { registerTraining } from './training';
import { registerOperations } from './operations';
import { registerExtensions, modelActivities } from './extensions';
import { authorize, prepare, assertInvariants, redact } from './validation';
import { hashPassword } from '../security/password';
import { registerModels, generateWithModel } from '../model-provider';
import { NativeService } from '../native.service';

export interface Route { method: string; path: string; handler: Handler; flush: boolean }
export function registry(state: State, actor: Actor) {
  const routes: Route[] = [];
  let needsFlush = true;
  const app = Object.fromEntries(['get','post','put','delete'].map(method => [method, (path:string,handler:Handler)=>{
    const previous=routes.findIndex(r=>r.method===method.toUpperCase()&&r.path===path);
    const route={method:method.toUpperCase(),path,handler,flush:needsFlush};
    if(previous>=0) routes[previous]=route; else routes.push(route);
  }])) as unknown as Registry;
  const flush = registerOperations(app,state,actor);
  needsFlush=false;
  registerExtensions(app,state,actor);
  registerFrontendSync(app,state,actor);
  registerOrgCatalog(app,state);
  registerDocumentTemplates(app,state,actor);
  registerTraining(app,state,actor);
  registerModels(app,state,actor);
  const assign=routes.find(r=>r.path==='/api/build/roles/:id/assign-users')!;
  routes.push({...assign,method:'POST',handler:(req,res)=>assign.handler({...req,body:{...req.body,users:req.body.assignedUsers??req.body.users}},res)});
  routes.push({...routes.find(r=>r.path==='/api/build/roles/import')!,path:'/api/build/roles/batch-import'});
  // Static paths must win over parameterized ones, independent of registration order.
  routes.sort((a,b)=>a.path.split(':').length-b.path.split(':').length);
  return {routes,flush};
}
export function match(routes: Route[], method: string, path: string) {
  for(const route of routes) {
    if(route.method!==method) continue;
    const names: string[]=[];
    const pattern=route.path.split('/').map(part=>{
      if(part.startsWith(':')) {names.push(part.slice(1));return '([^/]+)';}
      return part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    }).join('/');
    const found=new RegExp(`^${pattern}/?$`).exec(path);
    if(found) return {route,params:Object.fromEntries(names.map((name,i)=>[name,decodeURIComponent(found[i+1])]))};
  }
  return null;
}

@Injectable()
export class DomainService {
  private publicationTimer?: ReturnType<typeof setInterval>;
  onModuleInit() {
    this.publicationTimer=setInterval(()=>{void this.publishScheduled().catch(()=>{});},5000);
    this.publicationTimer.unref();
    void this.publishScheduled().catch(()=>{});
  }
  onModuleDestroy() {if(this.publicationTimer)clearInterval(this.publicationTimer);}
  async publishScheduled() {
    return this.db.transaction(true,async c=>{
      const state=await this.db.load(c),before=structuredClone(state);
      for(const row of state.flows)if(row.status==='scheduled'&&Date.parse(row.scheduledTime)<=Date.now()) {
        Object.assign(row,{status:'published',versionNo:row.targetVersion,publishTime:new Date().toISOString(),publishUserName:'定时发布服务'});
        await c.query('INSERT INTO publication_versions(target_type,target_id,version_no,snapshot,published_by) VALUES($1,$2,$3,$4,$5)',['flow',row.id,row.versionNo,row,'定时发布服务']);
        await c.query('INSERT INTO audit_log(request_id,actor_id,method,route,changed_entities) VALUES($1,$2,$3,$4,$5)',[randomUUID(),'system','SYSTEM','scheduled-publication',JSON.stringify(['flows'])]);
      }
      await this.db.save(c,before,state);
    });
  }

  constructor(@Inject(Database) private readonly db: Database, @Inject(NativeService) private readonly native: NativeService) {}
  async dispatch(request: Request, actor: Actor) {
    const method=request.method, path=request.path;
    authorize(method,path,actor,request.body);
    if(method==='POST'&&path==='/api/ai/flow-chat'&&request.body?.mode==='auto') {
      const message=String(request.body.message||'');
      const mode=/体检|规范|合规|审查|检查/.test(message)?'audit':/排版|整理|对齐|去重|拓扑/.test(message)?'optimize':/raci|职责|问责|矩阵/i.test(message)?'raci':/翻译|translate/i.test(message)?'translate':/语法|润色|动词/.test(message)?'grammar':/风格|配色|美化/.test(message)?'style':'generate';
      return this.dispatch({...request,body:{...request.body,mode}} as Request,actor);
    }
    if(method==='POST'&&path==='/api/system/apis/debug') {
      const allowed=['/api/flow/fulltypes','/api/flow/fullSimpleModels','/api/flow/models','/api/org/users','/api/system/forms'];
      if(request.body?.method!=='GET'||!allowed.includes(request.body?.apiPath)) throw new BadRequestException('仅支持白名单中的本地只读 API 调试');
      const started=Date.now();
      const result=await this.dispatch({...request,method:'GET',path:request.body.apiPath,body:{},query:{}} as Request,actor);
      return {code:200,headers:{},body:{status:1,info:'ok',debugResult:{status:result.code,statusCode:result.code,duration:Date.now()-started,response:result.body,body:JSON.stringify(result.body,null,2)}}};
    }
    if(method==='POST'&&path==='/api/ai/flow-chat'&&request.body?.mode==='audit') {
      const result=await this.dispatch({...request,path:'/api/ai/flow-audit'} as Request,actor);
      return {...result,body:{status:1,data:{reply:'结构规则检查完成。',action:'audit',mode:'audit',auditResult:result.body.data},info:'ok'}};
    }
    // Provider calls are outside database transactions and have bounded network timeouts.
    if(method==='POST'&&(this.native.isAi(path)||path==='/api/system/models/test')) {
      const configured=await this.db.transaction(false,async c=>{
        const state=await this.db.load(c),models=state.dictBundle.aiModels||[];
        if(path==='/api/system/models/test') {
          const saved=request.body?.id?models.find((m:any)=>m.id===request.body.id):undefined;
          if(request.body?.id&&!saved)throw new NotFoundException('模型不存在');
          return {...saved,...request.body,apiKey:request.body?.apiKey||undefined};
        }
        return models.find((m:any)=>m.isDefault&&m.enabled!==false);
      });
      if(path==='/api/system/models/test') {
        const started=Date.now();await generateWithModel(configured,'Reply with OK',false);
        return {code:200,headers:{},body:{status:1,data:{connected:true,latencyMs:Date.now()-started,testedAt:new Date().toISOString(),modelId:configured.modelId,provider:configured.provider},info:'连接验证成功'}};
      }
      return {code:200,headers:{},body:await this.native.ai(path,request.body||{},configured)};
    }
    const write=method!=='GET';
    return this.db.transaction(write,async client=>{
      // Re-check identity after acquiring the write lock (role/status changes may have queued ahead).
      const current=(await client.query('SELECT payload FROM users WHERE id=$1',[actor.id])).rows[0]?.payload;
      if(!current || current.status!=='0') throw new ForbiddenException('用户已停用');
      actor={...actor,roles:current.accessRoles||['viewer'],userName:current.nickName||current.userName};
      authorize(method,path,actor,request.body);
      const fingerprint=createHash('sha256').update(JSON.stringify([method,path,request.query,request.body||{}])).digest('hex');
      const receipt=typeof request.headers['idempotency-key']==='string'?request.headers['idempotency-key']:undefined;
      if(receipt && (receipt.length>200||!receipt.length)) throw new BadRequestException('幂等键长度无效');
      if(write&&receipt) {
        const prior=(await client.query('SELECT * FROM request_receipts WHERE actor_id=$1 AND key=$2',[actor.id,receipt])).rows[0];
        if(prior) {
          if(prior.fingerprint!==fingerprint) throw new ConflictException('幂等键已被其他请求使用');
          return prior.response;
        }
      }
      const state=await this.db.load(client), before=structuredClone(state);
      const {routes,flush}=registry(state,actor);
      const found=match(routes,method,path);
      const req: DomainRequest={body:structuredClone(request.body||{}),query:{...request.query},params:found?.params||{}};
      const response={code:200,headers:{} as Record<string,string>,body:undefined as any};
      prepare(method,found?.route.path||path,req,state,actor);
      await this.checkProtectedFields(req,method,found?.route.path||path,state,actor);
      if(await this.native.handle(client,method,path,req,state,actor,response)) {
        // Native handler populated response within the same transaction.
      } else {
        if(!found) throw new NotFoundException('API 不存在');
        const res: DomainResponse={status:(code)=>{response.code=code;return res;},
          json:value=>{response.body=value;return value;},send:value=>{response.body=value;return value;},
          setHeader:(key,value)=>{response.headers[key]=value;}};
        await found.route.handler(req,res);
        if(found.route.flush) flush();
      }
      if(response.code>=400 || response.body?.status===0) throw new HttpException(response.body?.info||'操作失败',response.code>=400?response.code:400);
      if(write) {
        await this.finishChanges(client,before,state,req,found?.route.path||path,actor);
        assertInvariants(state);
        await this.db.save(client,before,state);
        // Credential rows must be written after their user FK target exists.
        for(const row of state.orgUsers) {
          if(row._newPasswordHash) throw new Error('Credential leaked into payload');
        }
        await this.persistCredentials(client,req,found?.route.path||path,state);
        await client.query(`INSERT INTO audit_log(request_id,actor_id,method,route,changed_entities) VALUES($1,$2,$3,$4,$5)`,
          [request.headers['x-request-id'],actor.id,method,path,JSON.stringify(Object.keys(state).filter(k=>JSON.stringify(before[k])!==JSON.stringify(state[k])))]);
      }
      response.body=redact(response.body);
      if(write&&receipt) await client.query('INSERT INTO request_receipts(actor_id,key,fingerprint,response) VALUES($1,$2,$3,$4)',[actor.id,receipt,fingerprint,response]);
      return response;
    });
  }
  private async checkProtectedFields(req:DomainRequest,method:string,path:string,state:State,actor:Actor) {
    if(method==='GET') return;
    if(req.body.xml!==undefined) modelActivities(req.body.xml);
    if(path.startsWith('/api/flowdoc/manuals/')&&!path.endsWith('/archive')) {
      const manual=state.dutyManuals.find((m:any)=>m.id===req.params.id);
      if(manual?.archived)throw new ConflictException('归档手册只读，请先恢复');
    }
    if(path==='/api/flow/model/full'||path==='/api/flow/:id/xml'||path==='/api/flow/model') {
      const id=req.params.id||req.body.id;
      if(id&&state.flowAuditRecords.some((a:any)=>a.modelId===id&&a.auditStatus==='待审核'))throw new ConflictException('送审流程不能修改，请先撤回');
    }
    if(path==='/api/org/users/:id/reset-password'||path==='/api/org/users') {
      const password=req.body.newPassword??req.body.password;
      if(password!==undefined&&(typeof password!=='string'||password.length<6||password.length>32))throw new BadRequestException('密码长度必须为 6–32 个字符');
    }
    if(path==='/api/system/company') {
      const allowed=['companyName','systemDisplayName','systemLogo','loginTitleSuffix','copyrightText','watermarkEnabled'];
      if(Object.keys(req.body).some(k=>!allowed.includes(k)&&!['operator','submitter'].includes(k))) throw new BadRequestException('公司资料不能修改授权状态');
      if(state.companyAuthData.license?.licenseKey&&req.body.companyName!==undefined&&req.body.companyName!==state.companyAuthData.license.companyName) throw new BadRequestException('公司更名需导入匹配新名称的授权证书');
    }
    if(path.includes('/flow/model/full')||path.includes('/flow/type/full')) {
      const row=(path.includes('/model/')?state.flows:state.archTypes).find((r:any)=>r.id===req.body.id);
      for(const key of ['status','versionNo','publishTime','publishUserName']) {
        if(req.body[key]!==undefined&&req.body[key]!==row?.[key]) throw new ConflictException('请通过发布/审批接口修改发布状态');
      }
    }
    if(path==='/api/org/users'||path==='/api/org/users/:id') {
      if(req.body.accessRoles&&!req.body.accessRoles.every((r:string)=>['admin','editor','auditor','viewer'].includes(r))) throw new BadRequestException('未知权限角色');
    }
    if(path.startsWith('/api/flowdoc/manuals')&&req.body.status&&req.body.status!=='草稿'&&!actor.roles.some(r=>r==='admin'||r==='auditor')) throw new ForbiddenException('修改发布状态需要审批权限');
    if(path==='/api/dict/item'&&['approve','reject'].includes(req.body.action)&&!actor.roles.some(r=>r==='admin'||r==='auditor')) throw new ForbiddenException('需要审批权限');
  }
  private async finishChanges(c:PoolClient,before:State,state:State,req:DomainRequest,path:string,actor:Actor) {
    // Never persist a password in a business JSON document or include it in a response.
    for(const user of state.orgUsers) delete user.password;
    for(const flow of state.flows) {
      const old=before.flows.find((f:any)=>f.id===flow.id);
      if(!old) {delete flow.publishTime;delete flow.publishUserName;}
      if(old&&['published','scheduled'].includes(old.status)&&['/api/flow/model/full','/api/flow/:id/xml','/api/flow/model'].includes(path)&&JSON.stringify(old)!==JSON.stringify(flow)){flow.status='draft';delete flow.scheduledTime;delete flow.targetVersion;}
    }
    for(const arch of state.archTypes)if(!before.archTypes.some((a:any)=>a.id===arch.id)){delete arch.publishTime;delete arch.publishUserName;}
    if(path==='/api/flow/repeal/action'&&req.body.action==='reject') {
      const repeal=state.flowRepealRecords.find((r:any)=>r.id===req.body.id);
      if(repeal) {
        repeal.status='已驳回';repeal.stage='已驳回';
        const flow=state.flows.find((f:any)=>f.id===repeal.modelId);
        if(flow)flow.repealApplyStatus='已驳回';
      }
    }
    for(const audit of state.flowAuditRecords) {
      if(!before.flowAuditRecords.some((a:any)=>a.id===audit.id)) {
        const flow=state.flows.find((f:any)=>f.id===audit.modelId);
        const activities=modelActivities(flow.xml);
        audit.activityCount=activities.length;audit.kcpCount=activities.filter(a=>a.kcp).length;
        audit.boundDocsCount=state.flowRefsStore[flow.id]?.zdwj?.length||0;
        audit.snapshot=structuredClone(flow);
      }
    }
    if(req.body.accessRoles && path.startsWith('/api/org/users')) {
      const user=state.orgUsers.find((u:any)=>u.id===req.params.id||u.userName===req.body.userName);
      if(user) user.accessRoles=req.body.accessRoles;
    }
    if(!state.orgUsers.some((u:any)=>u.status==='0'&&u.accessRoles?.includes('admin'))) throw new ConflictException('必须保留至少一个启用的管理员');
    for(const user of state.orgUsers) {
      const old=before.orgUsers.find((u:any)=>u.id===user.id);
      if(old&&(old.status!==user.status||JSON.stringify(old.accessRoles)!==JSON.stringify(user.accessRoles))) await c.query('DELETE FROM sessions WHERE user_id=$1',[user.id]);
    }
    // Keep dictionary role selectors consistent with the role library after every mutation.
    for(const position of state.orgPositions) {
      const dept=state.orgDepts.find((d:any)=>d.id===position.deptId);
      if(dept)Object.assign(position,{deptName:dept.deptName,deptCode:dept.deptCode});
    }
    if(JSON.stringify(before.buildProcessRoles)!==JSON.stringify(state.buildProcessRoles)) {
      state.dictBundle.flowRole=state.buildProcessRoles.filter((r:any)=>r.status==='0').map((r:any)=>({id:r.id,label:r.roleName,classId:r.roleType?.includes('决策')?2:1,postNames:r.boundPositions,desc:r.remark}));
    }
    if(path==='/api/flow/repeal/apply') {
      const repeal=state.flowRepealRecords.find((r:any)=>!before.flowRepealRecords.some((old:any)=>old.id===r.id));
      if(repeal) for(const log of repeal.approvalLogs||[]) if(!log.time)log.operator='';
    }
    if(path==='/api/flow/repeal/action'&&req.body.action==='approve') {
      const repeal=state.flowRepealRecords.find((r:any)=>r.id===req.body.id);
      const flow=state.flows.find((f:any)=>f.id===repeal?.modelId);
      if(flow) flow.status='repealed';
    }
    for(const [kind,key] of [['arch','archTypes'],['flow','flows']]) {
      for(const row of state[key]) {
        const old=before[key].find((r:any)=>r.id===row.id);
        const published=kind==='arch'?path==='/api/flow/type/publish'&&req.body.id===row.id:
          row.status==='published'&&(old?.status!=='published'||old?.versionNo!==row.versionNo);
        if(!published) continue;
        row.status='published';
        row.publishTime=new Date().toISOString();row.publishUserName=actor.userName;
        await c.query(`INSERT INTO publication_versions(target_type,target_id,version_no,snapshot,published_by) VALUES($1,$2,$3,$4,$5)`,[kind,row.id,row.versionNo,row,actor.userName]);
      }
    }
  }
  private async persistCredentials(c:PoolClient,req:DomainRequest,path:string,state:State) {
    let id:string|undefined,password:string|undefined;
    if(path==='/api/org/users'&&req.body.password) {
      id=state.orgUsers.find((u:any)=>u.userName===req.body.userName.trim())?.id;password=req.body.password;
    } else if(path==='/api/org/users/:id/reset-password') {id=req.params.id;password=req.body.newPassword;}
    if(id&&password) {
      const hash=await hashPassword(password);
      await c.query(`INSERT INTO credentials(user_id,password_hash) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET password_hash=EXCLUDED.password_hash,updated_at=now()`,[id,hash]);
      await c.query('DELETE FROM sessions WHERE user_id=$1',[id]);
    }
  }
}
