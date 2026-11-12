import { generateWithModel } from './model-provider';
import { Injectable, BadRequestException, ConflictException, NotFoundException, ServiceUnavailableException, ForbiddenException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { createHash, randomUUID } from 'node:crypto';
import { companyLicenseView, verifyLicense } from './licensing';
import { parse } from 'csv-parse/sync';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { Actor, DomainRequest, State } from './domain/types';
import { validateInput } from './domain/validation';

const text = z.string().min(1).max(20000);
const stepSchema=z.object({title:text,role:text,desc:z.string().max(10000),out:z.string().max(10000),judge:z.boolean().default(false),kcp:z.boolean().default(false)});
const fieldsSchema=z.array(z.object({fieldKey:z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),label:text,
  type:z.enum(['input','textarea','richText','number','currency','select','multiSelect','radio','checkbox','date','datetime','userPicker','deptPicker','switch','upload']),
  span:z.number().refine(v=>v===12||v===24).default(12),section:z.string().default('扩展属性'),required:z.boolean().default(false),
  showInList:z.boolean().default(true),options:z.array(z.string()).optional(),placeholder:z.string().optional()})).min(1).max(20);
const xmlEscape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
export function diagram(steps:z.infer<typeof stepSchema>[]) {
  const cells=['<mxCell id="0"/>','<mxCell id="1" parent="0"/>'];
  const nodes=[{title:'开始',role:'',desc:'',out:'',judge:false,kcp:false},...steps,{title:'结束',role:'',desc:'',out:'',judge:false,kcp:false}];
  nodes.forEach((s,i)=>{
    const type=i===0||i===nodes.length-1?'startEnd':s.judge?'nodeActiveJudge':'nodeActiveSerialRect';
    cells.push(`<UserObject id="n${i}" label="${xmlEscape(s.title)}" name="${xmlEscape(s.title)}" dflowType="${type}" roles="${xmlEscape(JSON.stringify([s.role]))}" desc="${xmlEscape(s.desc)}" out="${xmlEscape(s.out)}" kcp="${s.kcp}"><mxCell vertex="1" parent="1" style="${s.judge?'rhombus':'rounded=1'};html=0;whiteSpace=wrap;"><mxGeometry x="${80+i*190}" y="180" width="130" height="60" as="geometry"/></mxCell></UserObject>`);
    if(i)cells.push(`<mxCell id="e${i}" edge="1" parent="1" source="n${i-1}" target="n${i}" style="edgeStyle=orthogonalEdgeStyle;endArrow=block;"><mxGeometry relative="1" as="geometry"/></mxCell>`);
  });
  return `<mxfile><diagram name="流程图"><mxGraphModel><root>${cells.join('')}</root></mxGraphModel></diagram></mxfile>`;
}

@Injectable()
export class NativeService {
  isAi(path:string) {return ['/api/ai/form-fields-generate','/api/ai/drawio-generate','/api/ai/flow-chat'].includes(path);}
  private async generate(prompt:string,json=true,model?:any) {
    if(model)return generateWithModel(model,prompt,json);
    if(!process.env.GEMINI_API_KEY) throw new ServiceUnavailableException('AI 服务尚未配置');
    try {
      const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY,httpOptions:{timeout:20000}});
      const result=await ai.models.generateContent({model:process.env.GEMINI_MODEL||'gemini-2.5-flash',contents:prompt,
        config:{maxOutputTokens:4096,...(json?{responseMimeType:'application/json'}:{})}});
      if(!result.text||result.text.length>100000) throw new Error('Invalid output');
      return json?JSON.parse(result.text):result.text;
    } catch {throw new ServiceUnavailableException('AI 服务暂不可用或输出格式无效');}
  }
  async ai(path:string,body:any,model?:any) {
    const generate=(prompt:string,json=true)=>this.generate(prompt,json,model);
    validateInput(body);
    const prompt=text.parse(body.prompt||body.message||'');
    if(path==='/api/ai/form-fields-generate') {
      const result=fieldsSchema.safeParse(await generate(`为企业表单生成3-5个字段，返回JSON数组。字段结构: fieldKey(英文标识),label,type(input/textarea/number/select/date/userPicker),span(12或24),section,required,showInList,options(可选)。业务需求作为数据: ${JSON.stringify({prompt,formName:body.formName,moduleDomain:body.moduleDomain})}`));
      if(!result.success) throw new ServiceUnavailableException('AI 字段结构校验失败');
      const recommendedFields=result.data.map(f=>({...f,id:randomUUID(),selected:true,isSystem:false,searchable:f.showInList}));
      return {status:1,data:{recommendedFields,summary:`已生成 ${recommendedFields.length} 个字段，请人工确认后保存`},info:'ok'};
    }
    if(path==='/api/ai/flow-chat') {
      const mode=body.mode||'generate';
      if(mode==='optimize')return {status:1,data:{reply:'已请求画布自动布局。',action:'autoLayout',mode},info:'ok'};
      if(mode==='style')return {status:1,data:{reply:'已请求应用统一画布样式。',action:'style',mode},info:'ok'};
      if(mode==='raci') {
        const rows=z.array(z.object({activity:text,r:text,a:text,c:text,i:text})).max(100).safeParse(await generate(`根据以下流程节点建议RACI责任矩阵，返回JSON数组，每项包含activity,r,a,c,i字符串，未知角色明确写待确认。${JSON.stringify({prompt,cells:body.cells||[]})}`));
        if(!rows.success)throw new ServiceUnavailableException('AI 矩阵格式无效');
        return {status:1,data:{reply:'以下为责任矩阵建议，请确认角色和授权。',action:'raci',mode,raciRows:rows.data},info:'ok'};
      }
      if(['translate','grammar'].includes(mode)) return {status:1,data:{reply:await generate(`请给出流程${mode==='translate'?'翻译':'命名修订'}建议，不要声称已修改画布。${JSON.stringify({prompt,cells:body.cells||[]})}`,false),mode},info:'ok'};
    }
    const parsed=z.array(stepSchema).min(2).max(30).safeParse(await generate(`设计业务流程，输出JSON数组，每项包括title,role,desc,out字符串及judge,kcp布尔值。业务需求: ${JSON.stringify(prompt)}`));
    if(!parsed.success)throw new ServiceUnavailableException('AI 流程结构校验失败');
    const title=body.currentTitle||body.existingTitle||body.flowTitle||prompt.slice(0,80);
    return {status:1,data:{xml:diagram(parsed.data),title,steps:parsed.data,action:'loadXml',mode:'generate',
      reply:'已生成流程草案，请确认后保存。',summary:'已生成流程草案，请人工复核。',modelUsed:model?.modelId||process.env.GEMINI_MODEL||'gemini-2.5-flash'},info:'ok'};
  }

  async handle(c:PoolClient,method:string,path:string,req:DomainRequest,s:State,actor:Actor,response:any):Promise<boolean> {
    const ok=(data:any,extra:any={})=>{response.body={status:1,data,info:'ok',...extra};return true;};
    // Asset browsing uses immutable published content, independently of working drafts.
    if(method==='GET'&&req.query.view==='published'&&['/api/flow/fulltypes','/api/flow/fullSimpleModels'].includes(path)) {
      const kind=path.endsWith('fulltypes')?'arch':'flow';
      const current=kind==='arch'?s.archTypes:s.flows;
      const versions=(await c.query(`SELECT DISTINCT ON (target_id) target_id,snapshot,version_no,published_at,published_by FROM publication_versions WHERE target_type=$1 ORDER BY target_id,id DESC`,[kind])).rows;
      const result=versions.flatMap((v:any)=>{
        const row=current.find((r:any)=>r.id===v.target_id);
        if(!row||row.status==='repealed'||row.repealApplyStatus==='已废止归档')return [];
        if(kind==='flow'&&s.flowRepealRecords.some((r:any)=>r.modelId===row.id&&['已废止归档','已废止'].some(status=>r.stage===status||r.status===status)))return [];
        return [{...v.snapshot,...(Number.isFinite(v.snapshot.sortOrder??v.snapshot.sort)?{sortOrder:v.snapshot.sortOrder??v.snapshot.sort}:{}),status:'published',versionNo:v.version_no,publishTime:new Date(v.published_at).toISOString(),publishUserName:v.published_by,
          ...(row.repealApplyStatus?{repealApplyStatus:row.repealApplyStatus}:{})}];
      });
      // DISTINCT ON orders by database IDs; that order has no business meaning.
      // Respect published custom ordering, otherwise compare numbered labels naturally.
      result.sort((a:any,b:any)=>{
        const aOrder=Number.isFinite(a.sortOrder)?a.sortOrder:null;
        const bOrder=Number.isFinite(b.sortOrder)?b.sortOrder:null;
        if(aOrder!==null||bOrder!==null) {
          const difference=(aOrder??Number.MAX_SAFE_INTEGER)-(bOrder??Number.MAX_SAFE_INTEGER);
          if(difference)return difference;
        }
        return String(a.label||'').localeCompare(String(b.label||''),'zh-CN',{numeric:true})||String(a.id).localeCompare(String(b.id));
      });
      return ok(result);
    }
    if(method==='POST'&&path==='/api/flow/model/upload-attachment') {
      const input=z.object({flowId:z.string().min(1).max(200),attNo:z.string().trim().min(1).max(200).optional(),label:z.string().trim().min(1).max(255),category:z.string().trim().min(1).max(200).default('流程操作指引'),fileSize:z.string().trim().min(1).max(80).default('0 B'),ownerName:z.string().trim().min(1).max(200).default(actor.userName),fileId:z.string().uuid().optional()}).parse(req.body);
      const flow=(s.flows||[]).find((item:any)=>item.id===input.flowId);
      if(!flow) throw new NotFoundException('流程不存在');
      if(input.fileId && !(await c.query('SELECT 1 FROM files WHERE id=$1',[input.fileId])).rows.length) throw new NotFoundException('文件内容不存在');
      const id=`att_${randomUUID()}`;
      const attNo=input.attNo||`FJ-FLOW-${Math.floor(1000+Math.random()*9000)}`;
      const row=(await c.query(`INSERT INTO flow_attachments(id,flow_id,att_no,label,category,file_size,owner_name,owner_id,file_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,att_no AS "attNo",label,category,file_size AS "fileSize",owner_name AS "ownerName",status,publish_time AS "publishTime",file_id AS "fileId"`,
        [id,input.flowId,attNo,input.label,input.category,input.fileSize,input.ownerName,actor.id,input.fileId||null])).rows[0];
      s.dictBundle.attachments=Array.isArray(s.dictBundle.attachments)?s.dictBundle.attachments:[];
      const metadata={...row,publishTime:new Date(row.publishTime).toISOString()};
      s.dictBundle.attachments=[metadata,...s.dictBundle.attachments.filter((item:any)=>item.id!==id)];
      s.flowRefsStore[input.flowId]=s.flowRefsStore[input.flowId]||{};
      const refs=Array.isArray(s.flowRefsStore[input.flowId].xgfj)?s.flowRefsStore[input.flowId].xgfj:[];
      s.flowRefsStore[input.flowId].xgfj=[id,...refs.filter((ref:any)=>String(ref)!==id)];
      return ok(metadata,{refIds:s.flowRefsStore[input.flowId].xgfj,attachments:s.dictBundle.attachments});
    }
    if(method==='GET'&&path==='/api/flow/attachment/download') {
      const id=typeof req.query.id==='string'?req.query.id:undefined;
      const name=typeof req.query.name==='string'?req.query.name:undefined;
      const row=(await c.query(`SELECT a.label,a.att_no AS "attNo",a.file_id AS "fileId",a.category,a.publish_time AS "publishTime",f.filename,f.content_type AS "contentType",f.content
        FROM flow_attachments a LEFT JOIN files f ON f.id=a.file_id WHERE ($1::text IS NOT NULL AND a.id=$1) OR ($2::text IS NOT NULL AND a.label=$2) ORDER BY a.created_at DESC LIMIT 1`,[id||null,name||null])).rows[0];
      if(!row) throw new NotFoundException('附件不存在');
      if(!row.fileId || !row.content) throw new ConflictException('附件尚未上传文件内容');
      response.headers={'Content-Type':row.contentType||'application/octet-stream','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(row.filename||row.label)}`};
      response.body=Buffer.from(row.content);return true;
    }
    if(method==='GET'&&/\/publishVersionHistories$/.test(path)) {
      const type=path.includes('/type/')?'arch':'flow';
      const rows=(await c.query(`SELECT version_no AS "versionNo",published_by AS "publishUserName",published_at AS "publishTime",'生产发布' AS "publishType" FROM publication_versions WHERE target_type=$1 AND target_id=$2 ORDER BY id DESC`,[type,req.query.id])).rows;
      return ok(rows.map((row:any)=>({...row,publishTime:new Date(row.publishTime).toISOString()})));
    }
    if(method==='GET'&&['/api/system/company','/api/system/license'].includes(path)) return ok(companyLicenseView(s.companyAuthData));
    if(method==='POST'&&path==='/api/system/license/generate-code') throw new ForbiddenException('请下载授权申请文件，在本机离线签发工具中生成 .lic 证书；应用服务器不持有签名私钥');
    if(method==='POST'&&path==='/api/system/license/activate') {
      const key=z.string().trim().max(10000).parse(req.body.licenseKey);
      const claims=verifyLicense(key);
      if(req.body.companyName?.trim()!==claims.companyName)throw new BadRequestException('公司名称与授权证书不一致；公司更名后需重新签发证书');
      const now=new Date().toISOString();
      const auditLogs=[{id:randomUUID(),event:'更新商业授权',status:'成功',detail:`${claims.companyName} · ${claims.edition} · ${claims.authUsersCount} 用户`,time:now,operator:actor.userName},...(s.companyAuthData.license?.auditLogs||[])].slice(0,100);
      s.companyAuthData={...s.companyAuthData,companyName:claims.companyName,authUsersCount:claims.authUsersCount,expireTime:claims.expireDate,createTime:now,
        license:{...claims,licenseKey:key,status:'ACTIVE',hardwareVerified:true,lastUpdateTime:now,auditLogs}};
      return ok(companyLicenseView(s.companyAuthData));
    }
    if(method==='POST'&&path==='/api/files') {
      const input=z.object({filename:z.string().min(1).max(255),contentType:z.string().max(120).default('application/octet-stream'),base64:z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/).max(7_000_000)}).parse(req.body);
      const bytes=Buffer.from(input.base64,'base64');
      if(!bytes.length||bytes.length>5242880)throw new BadRequestException('文件大小必须为 1B–5MB');
      const id=randomUUID();
      await c.query('INSERT INTO files(id,filename,content_type,content,owner_id,sha256) VALUES($1,$2,$3,$4,$5,$6)',[id,input.filename,input.contentType,bytes,actor.id,createHash('sha256').update(bytes).digest('hex')]);
      return ok({id,filename:input.filename,size:bytes.length});
    }
    if(method==='GET'&&path==='/api/dict/doc/download') {
      const doc=s.dictBundle.sysDoc.find((d:any)=>d.id===req.query.id||d.label===req.query.name);
      if(!doc?.fileId)throw new NotFoundException('该制度尚未上传正式文件');
      const file=(await c.query('SELECT * FROM files WHERE id=$1',[doc.fileId])).rows[0];
      if(!file)throw new NotFoundException('文件不存在');
      response.headers={'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`};
      response.body=Buffer.from(file.content);return true;
    }
    if(!path.startsWith('/api/mining/'))return false;
    if(method==='POST'&&path==='/api/mining/extract')throw new ServiceUnavailableException('尚未配置业务系统连接器，请通过日志导入接口接入真实事件');
    if(method==='POST'&&path==='/api/mining/ai-diagnose') {
      // A grounded, deterministic report; no fabricated AI scores or external I/O inside transactions.
      const data=await this.overview(c,actor.id,req.body.datasetKey);
      const ds=data.dataset;
      return ok({report:`### 真实事件统计\n- 案例数：${ds.caseCount}\n- 事件数：${ds.eventCount}\n- 平均周期：${ds.avgLeadTime}\n\n未配置业务基线，无法判断断点或计算行业偏离率。请结合节点流转次数核对缺失事件。`,modelUsed:'event-statistics',summary:'报告基于已导入事件；不含推测性根因或收益预测',score:null,benchmarkDeviation:'未配置基线'});
    }
    if(method==='GET'&&path==='/api/mining/overview')return ok(await this.overview(c,actor.id));
    if(method==='POST'&&path==='/api/mining/switch-dataset') {
      const key=text.parse(req.body.datasetKey);
      if(!(await c.query('SELECT 1 FROM mining_datasets WHERE key=$1',[key])).rowCount)throw new NotFoundException('数据集不存在');
      await c.query('INSERT INTO mining_preferences(user_id,dataset_key) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET dataset_key=EXCLUDED.dataset_key',[actor.id,key]);
      return ok((await this.overview(c,actor.id,key)).dataset);
    }
    if(method==='POST'&&path==='/api/mining/import-logs') {
      const raw=z.string().min(1).max(2_000_000).parse(req.body.rawData);
      let rows:any[];
      try {rows=req.body.format==='json'||raw.trim().startsWith('[')?JSON.parse(raw):parse(raw,{columns:true,skip_empty_lines:true,bom:true,trim:true,max_record_size:100000});}
      catch {throw new BadRequestException('日志必须为带表头的 CSV 或 JSON 数组');}
      if(!Array.isArray(rows)||!rows.length||rows.length>10000)throw new BadRequestException('日志批次必须包含 1–10000 行');
      const events=rows.map((r:any,i:number)=>{
        const caseId=r.caseId??r.CaseId,activity=r.activity??r.Activity,time=r.timestamp??r.Timestamp??r.time;
        if(typeof caseId!=='string'||!caseId.trim()||typeof activity!=='string'||!activity.trim()||typeof time!=='string'||!Number.isFinite(Date.parse(time)))throw new BadRequestException(`第 ${i+1} 行缺少 CaseId、Activity 或有效 Timestamp`);
        return {caseId,activity,time:new Date(time).toISOString(),system:String(r.sourceSystem??r.SourceSystem??req.body.sourceSystem??'import'),operator:String(r.operator??r.Operator??''),payload:r};
      });
      const key=z.string().min(1).max(100).parse(req.body.datasetKey||'imported');
      await c.query('INSERT INTO mining_datasets(key,title) VALUES($1,$2) ON CONFLICT DO NOTHING',[key,req.body.title||'导入日志']);
      let count=0;
      for(const e of events) {
        const id=createHash('sha256').update(JSON.stringify([key,e.caseId,e.activity,e.time,e.system,e.operator])).digest('hex');
        count+=(await c.query(`INSERT INTO mining_events(id,dataset_key,case_id,activity,event_time,source_system,operator,payload) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,[id,key,e.caseId,e.activity,e.time,e.system,e.operator,e.payload])).rowCount||0;
      }
      await c.query('INSERT INTO mining_preferences(user_id,dataset_key) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET dataset_key=EXCLUDED.dataset_key',[actor.id,key]);
      return ok({importedRows:count,duplicateRows:events.length-count,mappedFields:['CaseId','Activity','Timestamp','SourceSystem','Operator'],status:'success',samplePreview:events.slice(0,5)});
    }
    return false;
  }

  async overview(c:PoolClient,userId:string,requested?:string) {
    const datasets=(await c.query('SELECT * FROM mining_datasets ORDER BY created_at')).rows;
    const pref=(await c.query('SELECT dataset_key FROM mining_preferences WHERE user_id=$1',[userId])).rows[0];
    const key=requested||pref?.dataset_key||datasets[0]?.key||'';
    if(requested&&!datasets.some(d=>d.key===requested))throw new NotFoundException('数据集不存在');
    const counts=(await c.query(`SELECT count(*)::int AS events,count(DISTINCT case_id)::int AS cases FROM mining_events WHERE dataset_key=$1`,[key])).rows[0];
    const duration=(await c.query(`SELECT COALESCE(avg(seconds),0) AS seconds FROM (SELECT extract(epoch FROM(max(event_time)-min(event_time))) AS seconds FROM mining_events WHERE dataset_key=$1 GROUP BY case_id) t`,[key])).rows[0];
    const nodes=(await c.query(`SELECT activity AS id,activity AS name,source_system AS system,count(*)::int AS throughput FROM mining_events WHERE dataset_key=$1 GROUP BY activity,source_system`,[key])).rows.map(n=>({...n,id:`${n.system}:${n.id}`,health:'normal',avgDuration:'未计算',role:'',desc:''}));
    const edges=(await c.query(`WITH transitions AS (SELECT source_system||':'||activity AS source,lead(source_system||':'||activity) OVER(PARTITION BY case_id ORDER BY event_time,id) AS target FROM mining_events WHERE dataset_key=$1) SELECT source AS "from",target AS "to",count(*)::int AS count FROM transitions WHERE target IS NOT NULL GROUP BY source,target`,[key])).rows.map(e=>({...e,status:'normal',leadTime:'',label:String(e.count)}));
    const systems=(await c.query(`SELECT source_system AS id,source_system AS name,count(*)::int AS "syncRecords",max(event_time) AS "lastSync" FROM mining_events GROUP BY source_system`)).rows.map(s=>({...s,status:'imported',primaryKeys:['CaseId'],latency:'—'}));
    const dataset={key,title:datasets.find(d=>d.key===key)?.title||'尚未导入日志',domain:'',caseCount:counts.cases,eventCount:counts.events,
      involvedSystems:[...new Set(nodes.map(n=>n.system))],avgLeadTime:`${(Number(duration.seconds)/86400).toFixed(2)} 天`,benchmarkDeviation:'未配置',happyPathRatio:'未定义',nodes,edges,diagnostics:[]};
    return {activeKey:key,systems,dataset,datasetsList:datasets.map(d=>({key:d.key,title:d.title,domain:d.domain})),timestamp:new Date().toISOString()};
  }
}
