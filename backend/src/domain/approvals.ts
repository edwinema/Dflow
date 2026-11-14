import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { approvalIdentity } from './approval-identity';
import { Actor, DomainRequest, DomainResponse, Registry, State } from './types';

interface SourceRoute { method:string;path:string;handler:(req:DomainRequest,res:DomainResponse)=>any;flush:boolean }
export function registerApprovals(app:Registry,s:State,actor:Actor,routes:SourceRoute[],flush:()=>void) {
  const admin=actor.roles.includes('admin');
  const mine=(value:any)=>approvalIdentity(s,actor,value);
  const types=['flow','duty','sysDoc','risk'];
  const displayName=(id:any)=>s.orgUsers.find((u:any)=>u.id===id||u.userName===id)?.nickName||id;
  const sources=()=>[
    ...(s.flowAuditRecords||[]).map((r:any)=>({type:'flow',r})),
    ...(s.dutyAuditTasks||[]).map((r:any)=>({type:'duty',r})),
    ...['sysDoc','risk'].flatMap(type=>(s.dictBundle[type]||[]).filter((r:any)=>r.status&&r.status!=='draft').map((r:any)=>({type,r}))),
  ];
  const project=({type,r}:{type:string;r:any})=>{
    const chain=r.approvalLevels||r.levels||r.approvalFlow||[];
    const rawStatus=type==='flow'?r.auditStatus:r.status;
    const status=['待审核','审核中','pending'].includes(rawStatus)?'pending':['已审核','已通过','approved'].includes(rawStatus)?'approved':['已驳回','rejected'].includes(rawStatus)?'rejected':['已撤回','withdrawn'].includes(rawStatus)?'withdrawn':rawStatus;
    const current=type==='duty'?chain[r.currentLevelIndex||0]:chain[(r.currentLevel||1)-1];
    const approver=current?.approverId||current?.approverName||r.currentApprover||r.auditUser||'';
    const applicant=r.submitUserId||r.submitterId||r.applicantId||r.submitUser||r.submitter||r.creatorId||r.creator||r.createUser||r.applicant||r.applicantName||r.creatorName||'';
    const history=[...(r.history||[]),...(r.approvalHistory||[]),...chain.filter((n:any)=>['approved','rejected'].includes(n.status)).map((n:any)=>({operator:n.operator||n.auditor||n.approverId||n.approverName,action:n.status,time:n.auditTime||n.operateTime,opinion:n.opinion||n.auditRemark,nodeName:n.levelName}))];
    const processed=history.some((h:any)=>mine(h.operator||h.userId)&&!['提交送审','修订送审','重新送审'].includes(h.action));
    const cc=Array.isArray(r.ccUserIds)&&r.ccUserIds.some(mine);
    const applicantMine=mine(applicant);
    const participant=chain.some((n:any)=>mine(n.approverId||n.approverName));
    const visible=admin||applicantMine||participant||processed||cc;
    const canAct=status==='pending'&&(admin||mine(approver));
    const revision=createHash('sha256').update(JSON.stringify(r)).digest('hex');
    return {type,id:r.id,title:r.flowName||r.dutyName||r.name||r.title||r.docName||r.riskName||r.id,code:r.flowCode||r.dutyNo||r.code||r.docCode||r.riskCode||'',status,applicant:displayName(applicant),approver:displayName(approver),submittedAt:r.submitTime||r.applyTime||r.createTime||'',version:r.versionNo||r.version||'',summary:r.changeSummary||r.remark||r.description||'',history,steps:chain.map((n:any)=>({name:n.levelName||`第${n.level}级`,approver:n.approverName||n.approverId,status:n.status,opinion:n.opinion||n.auditRemark||''})),revision,canAct,canWithdraw:type==='flow'&&status==='pending'&&(admin||applicantMine),isMine:applicantMine,isPending:status==='pending'&&mine(approver),isProcessed:processed,isCc:cc,visible};
  };
  const all=()=>sources().map(project);
  const find=(type:string,id:string)=>{
    if(!types.includes(type))throw new BadRequestException('审批类型无效');
    const source=sources().find(x=>x.type===type&&String(x.r.id)===id);
    if(!source)throw new NotFoundException('审批不存在');
    const row=project(source);if(!row.visible)throw new ForbiddenException('无权查看该审批');return {source,row};
  };
  app.get('/api/approvals', (req,res)=>{
    const view=req.query.view||'pending';if(!['pending','processed','mine','cc','query'].includes(view))throw new BadRequestException('审批视图无效');
    const visible=all().filter(r=>r.visible);
    const accept=(r:any)=>view==='pending'?r.isPending:view==='processed'?r.isProcessed:view==='mine'?r.isMine:view==='cc'?r.isCc:true;
    let list=visible.filter(accept);
    const typeCounts=Object.fromEntries(types.map(type=>[type,list.filter(r=>r.type===type).length]));
    if(req.query.type&&req.query.type!=='all')list=list.filter(r=>r.type===req.query.type);
    if(req.query.status&&req.query.status!=='all')list=list.filter(r=>r.status===req.query.status);
    const q=String(req.query.keyword||'').trim().toLowerCase();if(q)list=list.filter(r=>[r.title,r.code,r.applicant,r.approver].some(v=>String(v).toLowerCase().includes(q)));
    list.sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt));
    const page=Math.max(1,Math.min(100000,Number(req.query.page)||1)),size=20;
    const counts={pending:visible.filter(r=>r.isPending).length,processed:visible.filter(r=>r.isProcessed).length,mine:visible.filter(r=>r.isMine).length,cc:visible.filter(r=>r.isCc).length,query:visible.length};
    const data=list.slice((page-1)*size,page*size).map(({visible,history,steps,...r})=>r);
    return res.json({status:1,data:{items:data,total:list.length,page,pageSize:size,counts,typeCounts,canQueryAll:admin},info:'ok'});
  });
  app.get('/api/approvals/:type/:id',(req,res)=>{const {row}=find(req.params.type,req.params.id);const {visible,...data}=row;return res.json({status:1,data,info:'ok'});});
  app.post('/api/approvals/:type/:id/action',async(req,res)=>{
    const {row}=find(req.params.type,req.params.id), action=req.body.action;
    if(!['approve','reject','withdraw'].includes(action))throw new BadRequestException('审批动作无效');
    if(action==='withdraw'?!row.canWithdraw:!row.canAct)throw new ForbiddenException('仅当前审批人或申请人可执行相应操作');
    if(row.revision!==req.body.revision)throw new ConflictException('审批已更新，请刷新后重试');
    const opinion=typeof req.body.opinion==='string'?req.body.opinion.trim():'';
    if(opinion.length>2000||(['reject','withdraw'].includes(action)&&!opinion))throw new BadRequestException('请填写原因，最多2000个字符');
    let path='',body:any={},params:any={};
    if(row.type==='flow'){path='/api/flow/audits/action';body={id:row.id,action,opinion};}
    else if(row.type==='duty'){path=`/api/flowdoc/audit/tasks/:id/${action}`;body={opinion,operator:actor.userName};params={id:row.id};}
    else {path='/api/dict/item';body={id:row.id,itemType:row.type,action,auditRemark:opinion};}
    const target=routes.find(r=>r.method==='POST'&&r.path===path);if(!target)throw new NotFoundException('审批处理接口不存在');
    let code=200,result:any;
    const proxy:DomainResponse={status(c){code=c;return proxy;},json(v){result=v;return v;},send(v){result=v;return v;},setHeader(){}};
    await target.handler({body,params,query:{}},proxy);if(code>=400||result?.status===0)throw new BadRequestException(result?.info||'审批处理失败');
    if(target.flush)flush();
    return res.json({status:1,data:find(req.params.type,req.params.id).row,info:'审批处理成功'});
  });
}
