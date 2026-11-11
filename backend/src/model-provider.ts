import { BadRequestException, ConflictException, ForbiddenException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';
import { Actor, Registry, State } from './domain/types';
function key() {
  const value=Buffer.from(process.env.MODEL_CONFIG_KEY||'','base64');
  if(value.length!==32)throw new ServiceUnavailableException('保存模型密钥前需配置 MODEL_CONFIG_KEY（32字节Base64）');
  return value;
}
function encrypt(value:string) {
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(),iv);
  const data=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
  return [iv,cipher.getAuthTag(),data].map(b=>b.toString('base64')).join('.');
}
function decrypt(value:string) {
  try {
    const [iv,tag,data]=value.split('.').map(v=>Buffer.from(v,'base64'));
    const cipher=createDecipheriv('aes-256-gcm',key(),iv);cipher.setAuthTag(tag);
    return Buffer.concat([cipher.update(data),cipher.final()]).toString('utf8');
  }catch {throw new ServiceUnavailableException('模型密钥解密失败，请检查 MODEL_CONFIG_KEY');}
}
export function modelEndpoint(baseUrl:string) {
  let url:URL;try {url=new URL(baseUrl);}catch {throw new BadRequestException('模型地址无效');}
  const allowed=(process.env.AI_ALLOWED_HOSTS||'api.openai.com,api.deepseek.com').split(',').map(v=>v.trim()).filter(Boolean);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!allowed.includes(url.hostname)||url.port&&url.port!=='443')throw new BadRequestException('模型端点必须为 AI_ALLOWED_HOSTS 允许的 HTTPS 主机');
  url.pathname=url.pathname.replace(/\/$/,'')+'/chat/completions';return url;
}
export async function generateWithModel(model:any,prompt:string,json=true,fetcher:typeof fetch=fetch) {
  const url=modelEndpoint(model.baseUrl);
  const secret=model.apiKey|| (model.encryptedApiKey?decrypt(model.encryptedApiKey):'');
  if(!secret)throw new ServiceUnavailableException('模型密钥尚未配置');
  try {
    const response=await fetcher(url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json',Authorization:`Bearer ${secret}`},
      body:JSON.stringify({model:model.modelId,messages:[{role:'user',content:prompt+(json?'\n仅返回有效 JSON，不使用 Markdown 代码块。':'')}],temperature:model.temperature??0.3,max_tokens:model.maxTokens??4096})});
    if(!response.ok)throw new Error('provider failed');
    // Bound provider output before parsing; redirects cannot forward the credential.
    const reader=response.body?.getReader();if(!reader)throw new Error('empty output');
    const chunks:Uint8Array[]=[];let size=0;
    while(true) {const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>1_000_000){await reader.cancel();throw new Error('output too large');}chunks.push(part.value);}
    const payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const content=payload.choices?.[0]?.message?.content;
    if(typeof content!=='string'||!content||content.length>100000)throw new Error('invalid output');
    return json?JSON.parse(content):content;
  }catch {throw new ServiceUnavailableException('模型连接失败或输出格式无效');}
}
export function registerModels(app:Registry,s:State,actor:Actor) {
  const models=()=>s.dictBundle.aiModels||(s.dictBundle.aiModels=[]);
  const safe=(row:any)=>{const {encryptedApiKey,apiKey,...rest}=row;return {...rest,hasApiKey:!!encryptedApiKey};};
  const target=(id:string)=>{const row=models().find((m:any)=>m.id===id);if(!row)throw new NotFoundException('模型不存在');return row;};
  const reply=(res:any,row?:any)=>res.json({status:1,data:row?safe(row):{list:models().map(safe),defaultModelId:models().find((m:any)=>m.isDefault)?.id,defaultModel:models().find((m:any)=>m.isDefault)?safe(models().find((m:any)=>m.isDefault)):undefined},list:models().map(safe),info:'ok'});
  const save=(body:any,old?:any)=>{
    const row={...old};
    for(const name of ['name','modelId','provider','providerType','baseUrl','contextLength','temperature','maxTokens','tags','description','enabled'])if(body[name]!==undefined)row[name]=body[name];
    for(const name of ['name','modelId','baseUrl'])if(typeof row[name]!=='string'||!row[name].trim())throw new BadRequestException('模型名称、标识符和端点不能为空');
    modelEndpoint(row.baseUrl);
    if(row.temperature!==undefined&&(typeof row.temperature!=='number'||row.temperature<0||row.temperature>2))throw new BadRequestException('温度必须在0到2之间');
    if(row.maxTokens!==undefined&&(!Number.isInteger(row.maxTokens)||row.maxTokens<1||row.maxTokens>32768))throw new BadRequestException('maxTokens必须在1到32768之间');
    if(body.apiKey) {if(typeof body.apiKey!=='string'||body.apiKey.length>2000)throw new BadRequestException('密钥格式无效');row.encryptedApiKey=encrypt(body.apiKey);}
    return row;
  };
  app.get('/api/system/models',(_req,res)=>{if(!actor.roles.includes('admin'))throw new ForbiddenException('需要管理员权限');return reply(res);});
  app.post('/api/system/models',(req,res)=>{const row={...save(req.body),id:randomUUID(),isDefault:false,status:'untested',latencyMs:null};models().push(row);return reply(res,row);});
  app.put('/api/system/models/:id',(req,res)=>{const row=target(req.params.id);Object.assign(row,save(req.body,row));return reply(res,row);});
  app.delete('/api/system/models/:id',(req,res)=>{const row=target(req.params.id);if(row.isDefault)throw new ConflictException('请先选择其他默认模型');models().splice(models().indexOf(row),1);return reply(res,row);});
  app.post('/api/system/models/:id/set-default',(req,res)=>{const row=target(req.params.id);models().forEach((m:any)=>m.isDefault=m.id===row.id);row.enabled=true;return reply(res,row);});
  app.post('/api/system/models/reset',()=>{throw new ConflictException('生产接口不允许重置为演示模型');});
}
