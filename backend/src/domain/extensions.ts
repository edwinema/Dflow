import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Actor, Registry, State } from './types';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

export function modelActivities(xml: string): any[] {
  if(typeof xml!=='string'||/<!DOCTYPE|<!ENTITY/i.test(xml)||XMLValidator.validate(xml)!==true) throw new BadRequestException('流程 XML 无效');
  const data=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@',processEntities:false}).parse(xml);
  const result:any[]=[];
  const visit=(node:any)=>{
    if(!node||typeof node!=='object')return;
    if(typeof node['@dflowType']==='string'&&node['@dflowType'].startsWith('nodeActive')) {
      result.push({id:node['@id'],name:node['@name']||node['@label']||'流程活动',role:node['@roles']||'',kcp:node['@kcp']==='true'});
    }
    for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);
  };
  visit(data);return result;
}

export function registerExtensions(app: Registry, s: State, actor: Actor) {
  app.get('/api/system/apis',(_req,res)=>res.json({status:1,data:{list:s.systemApis,allTotal:s.systemApis.length,activeCount:s.systemApis.filter((a:any)=>a.status==='启用').length,totalCalls:null},info:'调用量统计尚未接入'}));
  app.post('/api/dict/tree',(req,res)=>{
    const {treeType,action,id,parentId,label}=req.body;
    if(!['sysDoc','risk'].includes(treeType))throw new BadRequestException('目录类型无效');
    const list=s.dictBundle[treeType==='risk'?'riskTree':'sysDocTree'];
    if (!Array.isArray(list)) throw new ConflictException('目录数据格式无效，请联系管理员');
    if (['create','rename','update'].includes(action) && (typeof label!=='string'||!label.trim()||label.trim().length>255)) throw new BadRequestException('目录名称须为1–255个字符');
    const target=list.find((r:any)=>r.id===id);
    let row:any;
    if(action==='create') {
      if(typeof label!=='string'||!label.trim())throw new BadRequestException('目录名称不能为空');
      if(parentId&&!list.some((r:any)=>r.id===parentId))throw new NotFoundException('父目录不存在');
      const parent=parentId||list.find((r:any)=>!r.parentId)?.id||'';
      if(list.some((r:any)=>r.parentId===parent&&r.label.toLowerCase()===label.trim().toLowerCase())) throw new ConflictException('同级目录名称已存在');
      row={id:randomUUID(),parentId:parent,label:label.trim()};list.push(row);
    } else {
      if(!target)throw new NotFoundException('目录不存在');
      if(action==='rename'||action==='update') {
        if(list.some((r:any)=>r.id!==id&&r.parentId===target.parentId&&r.label.toLowerCase()===label.trim().toLowerCase())) throw new ConflictException('同级目录名称已存在');
        target.label=label.trim();row=target;
      }
      else if(action==='delete') {
        if(!target.parentId)throw new ConflictException('根目录不能删除，可通过重命名修改名称');
        if(list.some((r:any)=>r.parentId===id)||s.dictBundle[treeType].some((r:any)=>r.folderId===id||r.classId===id||r.categoryId===id))throw new ConflictException('目录非空');
        list.splice(list.indexOf(target),1);row=target;
      } else throw new BadRequestException('目录动作无效');
    }
    res.json({status:1,data:row,bundle:s.dictBundle,info:'ok'});
  });
  app.post('/api/execute/tasks/assign',(req,res)=>{
    const flow=s.flows.find((f:any)=>f.id===req.body.modelId);
    if(!flow)throw new NotFoundException('流程不存在');
    if(flow.status!=='published')throw new ConflictException('只能执行已发布流程');
    const activities=modelActivities(flow.xml);
    if(!activities.length)throw new BadRequestException('流程没有可执行活动；压缩图请先在设计器中保存为 XML');
    const now=new Date().toISOString();
    const row={id:randomUUID(),taskName:req.body.taskName||flow.label,taskDesc:req.body.taskDesc||'',status:'进行中',
      assignee:req.body.assignee,modelId:flow.id,flowId:flow.id,flowCode:flow.flowNo,flowName:flow.label,archPath:flow.archName,versionNo:flow.versionNo,
      creator:actor.userName,createTime:now,submitTime:'',steps:activities.map((a,i)=>({id:randomUUID(),seq:i+1,stepName:a.name,roleName:a.role,
        status:i===0?'进行中':'待办',completionNote:'',relatedFiles:[],startTime:i===0?now:'',endTime:''}))};
    s.flowProcessTasks.unshift(row);res.json({status:1,data:row,list:s.flowProcessTasks,info:'ok'});
  });
  app.put('/api/execute/tasks/:id/step',(req,res)=>{
    const task=s.flowProcessTasks.find((t:any)=>t.id===req.params.id);
    if(!task)throw new NotFoundException('任务不存在');
    if(task.status==='已办结')throw new ConflictException('任务已办结');
    const step=task.steps.find((t:any)=>t.id===req.body.stepId);
    if(!step)throw new NotFoundException('步骤不存在');
    if(req.body.status&&!['待办','进行中','已办'].includes(req.body.status))throw new BadRequestException('步骤状态无效');
    for(const key of ['status','completionNote','relatedFiles','startTime','endTime'])if(req.body[key]!==undefined)step[key]=req.body[key];
    if(step.status==='已办')step.endTime=new Date().toISOString();
    res.json({status:1,data:task,list:s.flowProcessTasks,info:'ok'});
  });
  app.put('/api/execute/tasks/:id',(req,res)=>{
    const task=s.flowProcessTasks.find((t:any)=>t.id===req.params.id);
    if(!task)throw new NotFoundException('任务不存在');
    if(task.status==='已办结')throw new ConflictException('任务已办结');
    for(const key of ['taskName','taskDesc','assignee'])if(req.body[key]!==undefined)task[key]=req.body[key];
    res.json({status:1,data:task,list:s.flowProcessTasks,info:'ok'});
  });
  app.post('/api/execute/tasks/:id/submit',(req,res)=>{
    const task=s.flowProcessTasks.find((t:any)=>t.id===req.params.id);
    if(!task)throw new NotFoundException('任务不存在');
    if(task.status==='已办结'||!task.steps.length||task.steps.some((st:any)=>st.status!=='已办'))throw new ConflictException('所有步骤完成后才能办结');
    task.status='已办结';task.submitTime=new Date().toISOString();res.json({status:1,data:task,list:s.flowProcessTasks,info:'ok'});
  });
  app.get('/api/flow/models', (_req,res)=>res.json({status:1,data:s.flows,info:'ok'}));
  for (const [kind,key] of [['type','archTypes'],['model','flows']]) {
    app.delete(`/api/flow/${kind}`, (req,res)=>{
      const i = s[key].findIndex((row:any)=>row.id===req.query.id);
      if(i<0) throw new NotFoundException('记录不存在');
      s[key].splice(i,1);
      return res.json({status:1,info:'ok'});
    });
  }
  app.put('/api/flow/model', (req,res)=>{
    const row = s.flows.find((f:any)=>f.id===req.body.id);
    if(!row) throw new NotFoundException('流程不存在');
    for(const key of ['label','flowNo']) if(req.body[key]!==undefined) row[key]=req.body[key];
    return res.json({status:1,data:row,info:'ok'});
  });
  app.post('/api/flow/reorder',(req,res)=>{
    const {orderedItems}=req.body;
    if(!Array.isArray(orderedItems)||!orderedItems.length) throw new BadRequestException('orderedItems 不能为空');
    const seen = new Set();
    orderedItems.forEach((item:any,sort:number)=>{
      if(seen.has(item.id)) throw new BadRequestException('排序中存在重复节点');
      seen.add(item.id);
      const row=[...s.archTypes,...s.flows].find((r:any)=>r.id===item.id);
      if(!row) throw new NotFoundException('排序节点不存在');
      row.sort=sort;
    });
    for(const key of ['archTypes','flows']) s[key].sort((a:any,b:any)=>(a.sort??0)-(b.sort??0));
    return res.json({status:1,info:'ok'});
  });
  app.post('/api/system/apis',(req,res)=>{
    const data=req.body;
    if(typeof data.apiName!=='string'||typeof data.apiPath!=='string'||!data.apiPath.startsWith('/api/')) throw new BadRequestException('API 名称和本地路径不能为空');
    if(!['GET','POST','PUT','DELETE'].includes(data.method)) throw new BadRequestException('HTTP 方法无效');
    const existing=s.systemApis.find((r:any)=>r.id===data.id);
    const row={...data,id:existing?.id??randomUUID()};
    if(existing) Object.assign(existing,row); else s.systemApis.push(row);
    res.json({status:1,data:row,list:s.systemApis,info:'ok'});
  });
  app.delete('/api/system/apis/:id',(req,res)=>{
    const index=s.systemApis.findIndex((r:any)=>String(r.id)===req.params.id);
    if(index<0) throw new NotFoundException('API 不存在');
    s.systemApis.splice(index,1);res.json({status:1,list:s.systemApis,info:'ok'});
  });
  // Browser cannot trigger fixture resets against live data.
  for(const path of ['/api/org/depts/reset','/api/org/users/reset','/api/build/roles/reset',
    '/api/build/roles/reset-presets','/api/build/role-categories/reset','/api/system/forms/reset']) {
    app.post(path,()=>{throw new ConflictException('生产接口不允许重置为演示数据，请使用经过审核的数据迁移');});
  }
}
