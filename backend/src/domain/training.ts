import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Registry, State, Actor } from './types';

const text=z.string().max(10000), short=z.string().max(500), names=z.array(short).max(200).default([]);
const section=z.object({id:short.min(1),title:short.trim().min(1),time:short.default(''),type:short.default(''),content:text.default('')});
const question=z.object({id:short.min(1),type:z.enum(['scenario','choice','multi','judge']),score:z.number().int().min(1).max(100).default(10),isKcpMandatory:z.boolean().default(false),question:text.trim().min(1),scenarioContext:text.optional(),options:z.array(short.min(1)).min(2).max(8),correctIndex:z.number().int().min(0),explanation:text,relatedNode:short.default(''),relatedDocClause:short.default('')}).refine(q=>q.correctIndex<q.options.length,'答案超出选项范围');
const playbook=z.object({roleName:short,roleBadge:short.optional(),roleDesc:text,nodes:names,inputs:names,actions:names,outputs:names,handoverTo:short,goodSample:z.object({title:short,desc:text,preview:text}),badSample:z.object({title:short,desc:text,warning:text}),kcpCheckpoints:names});
const schema=z.object({title:short.trim().min(1),flowId:short.min(1),category:short.default('流程培训'),deptName:short.default(''),duration:short.default(''),importance:z.enum(['必修','选修','进阶']),targetAudience:short.default(''),targetDepts:names,targetPositions:names,targetRoles:names,deadlineDays:z.number().int().min(1).max(3650),summary:text.default(''),learningObjectives:z.array(short).max(100).default([]),sections:z.array(section).max(100),rolePlaybooks:z.array(playbook).max(100).default([]),passingScore:z.number().int().min(1).max(100),timeLimitMinutes:z.number().int().min(1).max(1440).default(30),maxAttempts:z.number().int().min(1).max(100).default(3),kcpAllMustCorrect:z.boolean().default(false),requirePracticalConfirmation:z.boolean().default(false),questions:z.array(question).max(200).default([]),practicalTask:z.object({taskName:short.min(1),requirement:text.min(1),reviewer:short.min(1)}).optional()});
function parse<T>(s:z.ZodType<T>,value:any):T {const r=s.safeParse(value);if(!r.success)throw new BadRequestException(r.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('；'));return r.data;}
export function registerTraining(app:Registry,s:State,actor:Actor) {
  const manager=actor.roles.some(r=>['admin','editor'].includes(r));
  const courses=()=>s.dictBundle.trainingCourses||[];
  const records=()=>s.dictBundle.trainingRecords||[];
  const user=s.orgUsers.find((u:any)=>u.id===actor.id)||{};
  const reviewer=(c:any)=>actor.roles.includes('admin')||[actor.id,actor.userId].includes(c.practicalTask?.reviewer);
  const eligible=(c:any)=>{
    const scoped=[...c.targetDepts,...c.targetPositions,...c.targetRoles];
    const dept=s.orgDepts.find((d:any)=>d.id===user.deptId);
    const positions=s.orgPositions.filter((p:any)=>[user.positionId,user.postId,...(user.positionIds||[])].includes(p.id)).flatMap((p:any)=>[p.id,p.name,p.positionName,p.postName]);
    const roles=s.buildProcessRoles.filter((r:any)=>(r.assignedUsers||[]).some((u:any)=>[actor.id,actor.userId].includes(typeof u==='string'?u:u.id||u.userId))).flatMap((r:any)=>[r.id,r.roleName]);
    const actual=[user.deptId,user.deptName,actor.deptName,dept?.deptName,dept?.deptCode,user.positionName,...positions,...roles,...(user.roleIds||[])];
    return !scoped.length||scoped.some(v=>actual.includes(v));
  };
  const find=(id:string)=>{const c=courses().find((c:any)=>c.id===id&&!c.archived);if(!c)throw new NotFoundException('课程不存在');if(!manager&&!eligible(c)&&!reviewer(c))throw new ForbiddenException('课程不在您的学习范围');return c;};
  const validRecord=(c:any,r:any)=>r.courseId===c.id&&r.courseRevision===c.revision;
  const myRecord=(c:any)=>records().find((r:any)=>validRecord(c,r)&&r.userId===actor.id);
  const record=(c:any)=>{
    let r=myRecord(c);if(r)return r;
    r={id:randomUUID(),courseId:c.id,courseRevision:c.revision,userId:actor.id,name:actor.userName,empNo:user.empNo||'',deptName:user.deptName||actor.deptName||'',positionName:user.positionName||'',completedSections:[],readStatus:'unread',examStatus:'untested',practiceConfirmed:false,weakPoints:[],lastStudyTime:new Date().toISOString()};
    s.dictBundle.trainingRecords=[...records(),r];return r;
  };
  const view=(c:any)=>{
    const r=myRecord(c), done=r?.completedSections||[];
    const read=c.sections.length>0&&c.sections.every((sec:any)=>done.includes(sec.id));
    const completed=read&&(!c.questions.length||r?.examStatus==='passed')&&(!c.practicalTask||r?.practiceConfirmed);
    const count=c.sections.length+(c.questions.length?1:0)+(c.practicalTask?1:0);
    const earned=done.filter((id:string)=>c.sections.some((sec:any)=>sec.id===id)).length+(r?.examStatus==='passed'&&c.questions.length?1:0)+(r?.practiceConfirmed&&c.practicalTask?1:0);
    return {...c,progress:count?Math.round(earned/count*100):0,status:completed?'completed':r?'in_progress':'not_started',lastStudyTime:r?.lastStudyTime,sections:c.sections.map((sec:any)=>({...sec,completed:done.includes(sec.id)})),records:records().filter((r:any)=>validRecord(c,r)&&(manager||r.userId===actor.id||reviewer(c))),canReview:reviewer(c),myRecord:r,kcpPoints:c.rolePlaybooks.reduce((n:number,p:any)=>n+p.kcpCheckpoints.length,0)};
  };
  const list=()=>courses().filter((c:any)=>!c.archived&&(manager||eligible(c)||reviewer(c))).map(view);
  const reply=(res:any,c?:any)=>res.json({status:1,data:c?view(c):list(),info:'ok'});
  const currentRevision=(c:any,body:any)=>{if(body.revision!==c.revision)throw new ConflictException('课程内容已更新，请重新打开课程学习');};
  const write=()=>{if(!manager)throw new ForbiddenException('需要课程管理权限');};
  app.get('/api/training/courses',(_req,res)=>res.json({status:1,data:{courses:list(),canManage:manager,options:{depts:s.orgDepts.map((d:any)=>d.deptName),positions:s.orgPositions.map((p:any)=>p.positionName||p.name||p.postName).filter(Boolean),roles:s.buildProcessRoles.map((r:any)=>r.roleName),users:s.orgUsers.filter((u:any)=>u.status==='0').map((u:any)=>({id:u.id,name:u.nickName||u.userName})),flows:s.flows.filter((f:any)=>f.status==='published').map((f:any)=>({id:f.id,label:f.label,versionNo:f.versionNo,flowNo:f.flowNo}))}},info:'ok'}));
  const save=(body:any,old?:any)=>{
    const data=parse(schema,body);
    if(!data.sections.length)throw new BadRequestException('请至少配置一个学习章节');
    for(const rows of [data.sections,data.questions])if(new Set(rows.map(r=>r.id)).size!==rows.length)throw new BadRequestException('章节或题目编号重复');
    if(data.practicalTask&&!s.orgUsers.some((u:any)=>u.status==='0'&&u.id===data.practicalTask?.reviewer))throw new BadRequestException('请选择有效的实操复核人');
    const flow=s.flows.find((f:any)=>f.id===data.flowId&&f.status==='published');
    if(!flow)throw new BadRequestException('请选择已批准发布的流程');
    const frozen=old&&old.flowId===flow.id?old.approvedVersion:undefined;
    return {...data,id:old?.id||randomUUID(),revision:(old?.revision||0)+1,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),updatedBy:actor.id,flowCode:flow.flowNo||flow.code||flow.id,approvedVersion:frozen||{versionNo:flow.versionNo,approvedAt:flow.publishTime||'',approver:flow.publishUserName||'',changeSummary:'绑定已发布流程版本',docRef:flow.label,xml:flow.xml||'',flowSnapshot:structuredClone(flow)}};
  };
  app.post('/api/training/courses',(req,res)=>{write();const c=save(req.body);s.dictBundle.trainingCourses=[c,...courses()];return reply(res,c);});
  app.put('/api/training/courses/:id',(req,res)=>{write();const old=find(req.params.id);if(req.body.revision!==old.revision)throw new ConflictException('课程已更新，请刷新后重试');const c=save(req.body,old);s.dictBundle.trainingCourses=courses().map((r:any)=>r.id===c.id?c:r);return reply(res,c);});
  app.delete('/api/training/courses/:id',(req,res)=>{write();const c=find(req.params.id);c.archived=true;return reply(res);});
  app.post('/api/training/courses/:id/sections/:sectionId/complete',(req,res)=>{
    const c=find(req.params.id);currentRevision(c,req.body);const sec=c.sections.find((v:any)=>v.id===req.params.sectionId);if(!sec)throw new NotFoundException('章节不存在');
    if(!sec.content.trim())throw new BadRequestException('章节尚未编写学习内容');
    const r=record(c);r.completedSections=[...new Set([...r.completedSections,sec.id])];r.readStatus=c.sections.every((v:any)=>r.completedSections.includes(v.id))?'read':'unread';r.lastStudyTime=new Date().toISOString();return reply(res,c);
  });
  app.post('/api/training/courses/:id/exam',(req,res)=>{
    const c=find(req.params.id);currentRevision(c,req.body);if(!c.questions.length)throw new BadRequestException('课程尚未配置考题');
    const r=record(c);if(r.readStatus!=='read')throw new BadRequestException('请先完成所有章节学习');
    const answers=parse(z.record(z.string(),z.number().int().min(0)),req.body.answers);
    if(c.questions.some((q:any)=>answers[q.id]===undefined||answers[q.id]>=q.options.length)||Object.keys(answers).some(id=>!c.questions.some((q:any)=>q.id===id)))throw new BadRequestException('请完整回答本课程全部题目');
    const wrong=c.questions.filter((q:any)=>answers[q.id]!==q.correctIndex);
    const total=c.questions.reduce((n:number,q:any)=>n+(q.score||10),0),lost=wrong.reduce((n:number,q:any)=>n+(q.score||10),0);r.score=Math.round((total-lost)/total*100);r.examStatus=r.score>=c.passingScore&&(!c.kcpAllMustCorrect||!wrong.some((q:any)=>q.isKcpMandatory))?'passed':'failed';r.weakPoints=wrong.map((q:any)=>q.relatedNode||q.question);r.lastStudyTime=new Date().toISOString();r.attempts=[...(r.attempts||[]),{answers,score:r.score,at:r.lastStudyTime}].slice(-100);
    return res.json({status:1,data:{course:view(c),score:r.score,passed:r.examStatus==='passed'},info:'ok'});
  });
  app.post('/api/training/courses/:id/practical',(req,res)=>{const c=find(req.params.id);currentRevision(c,req.body);if(!c.practicalTask)throw new BadRequestException('本课程无需实操');const r=record(c);if(r.readStatus!=='read'||(c.questions.length&&r.examStatus!=='passed'))throw new BadRequestException('请先完成学习并通过考核');r.evidence=parse(text.trim().min(1),req.body.evidence);r.practiceSubmittedAt=new Date().toISOString();r.practiceConfirmed=false;r.confirmedBy='';return reply(res,c);});
  app.post('/api/training/courses/:id/records/:userId/confirm',(req,res)=>{
    const c=find(req.params.id);currentRevision(c,req.body);if(!reviewer(c)||actor.id===req.params.userId)throw new ForbiddenException('仅指定复核人或管理员可确认他人的实操');
    const r=records().find((r:any)=>validRecord(c,r)&&r.userId===req.params.userId);if(!r?.evidence||r.readStatus!=='read'||(c.questions.length&&r.examStatus!=='passed'))throw new BadRequestException('学员尚未完成实操提交或考核');
    r.practiceConfirmed=true;r.confirmedBy=actor.userName;r.confirmedById=actor.id;r.confirmedAt=new Date().toISOString();return reply(res,c);
  });
}
