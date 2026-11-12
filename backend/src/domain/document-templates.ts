import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Actor, Registry, State } from './types';

export const documentContentSchema = z.object({
  headerTitle: z.string().max(500), officialNo: z.string().max(300),
  signatory: z.string().max(300), confidentiality: z.string().max(100),
  title: z.string().max(500), body: z.string().max(200000),
  footer: z.string().max(2000), watermark: z.string().max(200),
  headerColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#DC2626'),
  headerFontSize: z.number().int().min(20).max(48).default(28),
  bodyFontSize: z.number().int().min(12).max(24).default(16),
}).strict();
const templateSchema = z.object({ name: z.string().trim().min(1).max(100), content: documentContentSchema, revision: z.number().int().positive().optional() });
function parse<T>(schema:z.ZodType<T>,value:unknown):T {
  const result=schema.safeParse(value);
  if(!result.success)throw new BadRequestException('模板字段格式无效，请检查名称、正文长度、颜色和字号');
  return result.data;
}
export function validateDocumentContent(item: any) {
  if (item?.documentContent !== undefined) item.documentContent = parse(documentContentSchema,item.documentContent);
}
export function defaultDocumentTemplate() {
  return { id: 'standard-red-header', name: '标准红头制度模板', revision: 1, builtin: true,
    content: {headerTitle:'{{companyName}}文件',officialNo:'{{referenceNo}}',signatory:'',confidentiality:'内部公开',title:'{{title}}',
      body:'第一章 总则\n\n第一条【目的】\n请填写本制度的制定目的。\n\n第二条【适用范围】\n请填写适用范围。\n\n第二章 职责与要求\n\n第三条【职责分工】\n请填写各部门职责。\n\n第三章 附则\n\n第四条【生效与解释】\n请填写生效日期和解释部门。',
      footer:'{{companyName}}\n{{publishTime}}',watermark:'',headerColor:'#DC2626',headerFontSize:28,bodyFontSize:16}};
}
export function registerDocumentTemplates(app: Registry, s: State, actor: Actor) {
  const list = () => s.dictBundle.documentTemplates?.length ? s.dictBundle.documentTemplates : [defaultDocumentTemplate()];
  const find = (id: string) => {const row=list().find((r:any)=>r.id===id);if(!row)throw new NotFoundException('模板不存在');return row;};
  app.get('/api/dict/document-templates', (_req,res)=>res.json({status:1,data:list(),info:'ok'}));
  app.post('/api/dict/document-templates', (req,res)=>{
    const input=parse(templateSchema,req.body);
    if(list().some((r:any)=>r.name===input.name))throw new ConflictException('模板名称已存在');
    const row={id:randomUUID(),...input,revision:1,updatedAt:new Date().toISOString(),updatedBy:actor.userName};
    s.dictBundle.documentTemplates=[...list(),row];res.json({status:1,data:row,info:'模板已保存'});
  });
  app.put('/api/dict/document-templates/:id', (req,res)=>{
    const old=find(req.params.id),input=parse(templateSchema,req.body);
    if(input.revision!==old.revision)throw new ConflictException('模板已被其他人修改，请重新打开后编辑');
    if(list().some((r:any)=>r.id!==old.id&&r.name===input.name))throw new ConflictException('模板名称已存在');
    const row={id:old.id,...input,revision:old.revision+1,updatedAt:new Date().toISOString(),updatedBy:actor.userName};
    s.dictBundle.documentTemplates=list().map((r:any)=>r.id===old.id?row:r);res.json({status:1,data:row,info:'模板已更新'});
  });
  app.post('/api/dict/document-templates/:id/apply', (req,res)=>{
    const template=find(req.params.id),body=req.body;
    const fields:Record<string,string>={companyName:s.companyAuthData.companyName||'公司',docNo:String(body.docNo||''),referenceNo:String(body.referenceNo||body.docNo||''),title:String(body.title||'制度文件'),versionNo:String(body.versionNo||'V1.0'),ownerName:String(body.ownerName||''),publishTime:String(body.publishTime||new Date().toISOString().slice(0,10))};
    if(Object.values(fields).some(v=>v.length>1000))throw new BadRequestException('模板字段内容过长');
    const content=Object.fromEntries(Object.entries(template.content).map(([k,v])=>[k,typeof v==='string'?v.replace(/\{\{(companyName|docNo|referenceNo|title|versionNo|ownerName|publishTime)\}\}/g,(_m,key)=>fields[key]):v]));
    res.json({status:1,data:{documentTemplateId:template.id,documentTemplateRevision:template.revision,documentContent:documentContentSchema.parse(content)},info:'已应用模板，可继续修改正文'});
  });
}
