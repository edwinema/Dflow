import { z } from 'zod';

const text = z.string();
const id = text.min(1).max(200);
const userPassword = text.min(12, '密码长度必须为 12–256 个字符').max(256, '密码长度必须为 12–256 个字符');
const object = (properties: Record<string,z.ZodType>) => z.object(properties).passthrough();
const actor = object({id, userId:text, userName:text, nickName:text, roles:z.array(z.enum(['admin','editor','auditor','viewer']))});
const flow = object({id, label:text, parentId:text, xml:text.optional(), status:text.optional(), versionNo:text.optional()});
const ok = (data:z.ZodType) => object({status:z.literal(1), data, info:text.optional()});
const generic = object({status:z.literal(1), data:z.unknown().optional(), list:z.array(z.unknown()).optional(), info:text.optional()});
const flowFields = {id, label:text.optional(), parentId:text.optional(), flowNo:text.optional(), ownerName:text.optional(),
  status:text.optional(), versionNo:text.optional(), xml:text.optional(), description:text.optional()};

// Zod is the shared source for runtime validation, OpenAPI and generated browser types.
// Business-specific dynamic form fields remain extensible; these are not closed DTOs.
export const requests: Record<string,z.ZodType> = {
  'POST /api/session': object({userId:id,password:text.min(1).max(256)}),
  'POST /api/flow/model': object({label:text.trim().min(1),parentId:id,flowNo:text.optional()}),
  'PUT /api/flow/model': object({id,label:text.optional(),flowNo:text.optional()}),
  'PUT /api/flow/model/full': object(flowFields),
  'POST /api/flow/:id/xml': object({xml:text,title:text.optional()}),
  'POST /api/flow/type': object({label:text.trim().min(1),parentId:text.optional()}),
  'PUT /api/flow/type': object({id,label:text.optional(),parentId:text.optional()}),
  'POST /api/flow/model/publish': object({id}),
  'POST /api/flow/type/publish': object({id}),
  'POST /api/flow/model/copy': object({id}),
  'POST /api/flow/audits/apply': object({modelId:id}),
  'POST /api/flow/audits/action': object({id,action:z.enum(['approve','reject','withdraw']),opinion:text.optional()}),
  'POST /api/flow/repeal/apply': object({modelId:id,reason:text.trim().min(1)}),
  'POST /api/flow/repeal/action': object({id,action:z.enum(['approve','reject']),opinion:text.optional()}),
  'POST /api/execute/tasks/assign': object({modelId:id,assignee:id,taskName:text.optional(),taskDesc:text.optional()}),
  'PUT /api/execute/tasks/:id/step': object({stepId:id,status:z.enum(['待办','进行中','已办']).optional(),completionNote:text.optional(),relatedFiles:z.array(z.unknown()).optional()}),
  'POST /api/org/users': object({userName:id,nickName:text.trim().min(1),password:userPassword,accessRoles:z.array(z.enum(['admin','editor','auditor','viewer'])).optional()}),
  'POST /api/org/users/:id/reset-password': object({newPassword:userPassword}),
  'POST /api/flowdoc/manuals': object({manualName:text.trim().min(1),manualNo:text.trim().min(1),description:text.optional(),viewPermissions:z.array(text).optional()}),
  'POST /api/files': object({filename:text.min(1).max(255),contentType:text.max(120).optional(),base64:text.max(7_000_000)}),
  'POST /api/flow/model/upload-attachment': object({flowId:id,attNo:text.max(200).optional(),label:text.trim().min(1).max(255),category:text.max(200).optional(),fileSize:text.max(80).optional(),ownerName:text.max(200).optional(),fileId:text.max(100).optional()}),
  'POST /api/mining/import-logs': object({rawData:text.min(1).max(2_000_000),format:z.enum(['json','csv']).optional(),datasetKey:text.min(1).max(100).optional(),sourceSystem:text.optional(),title:text.optional()}),
  'POST /api/mining/switch-dataset': object({datasetKey:id}),
  'POST /api/system/apis': object({apiName:text.min(1),apiPath:text.startsWith('/api/'),method:z.enum(['GET','POST','PUT','DELETE']),id:z.union([text,z.number()]).optional()}),
  'POST /api/system/apis/debug': object({apiPath:text,method:z.literal('GET')}),
};
for (const path of ['/api/org/positions','/api/org/jobs','/api/org/job-titles']) {
  const fields: Record<string,z.ZodType> = path.endsWith('positions')
    ? {postCode:text.trim().min(1).max(500),postName:text.trim().min(1).max(500)}
    : {jobCode:text.trim().min(1).max(500),jobName:text.trim().min(1).max(500)};
  const properties: Record<string,z.ZodType> = {...fields,deptId:id.optional(),deptCode:text.optional(),deptName:text.optional(),rankLevel:text.optional(),jobSeries:text.optional(),sort:z.number().int().min(0).max(1000000).optional(),status:z.enum(['0','1','正常','停用']).optional(),remark:text.max(500).optional()};
  requests[`POST ${path}`] = object(properties);
  requests[`PUT ${path}/:id`] = object(Object.fromEntries(Object.entries(properties).map(([key,value])=>[key,value.optional()])));
  requests[`POST ${path}/batch-delete`] = object({ids:z.array(id).min(1).max(1000)});
  for(const suffix of ['import','import/preview']) requests[`POST ${path}/${suffix}`] = object({items:z.array(z.record(text,z.unknown())).min(1).max(1000).optional(),rawData:text.min(1).max(1000000).optional()}).refine(value=>value.items!==undefined||value.rawData!==undefined,'请选择CSV或传入导入记录');
}
const responses: Record<string,z.ZodType> = {
  'POST /api/session':ok(actor), 'GET /api/session':ok(actor),
  'GET /api/flow/fullSimpleModels':ok(z.array(flow)), 'GET /api/flow/models':ok(z.array(flow)),
  'POST /api/flow/model':ok(flow), 'PUT /api/flow/model':ok(flow),
  'GET /api/flow/:id/xml':ok(object({xml:text,title:text})),
  'POST /api/files':ok(object({id,filename:text,size:z.number().int().positive()})),
  'POST /api/flow/model/upload-attachment':ok(object({id,attNo:text,label:text,category:text,fileSize:text,ownerName:text,status:text,publishTime:text})),
};
export function findRequest(method:string,path:string) {
  return Object.entries(requests).find(([key])=>{
    const space=key.indexOf(' ');
    return key.slice(0,space)===method && new RegExp('^'+key.slice(space+1).replace(/:[^/]+/g,'[^/]+')+'/?$').test(path);
  })?.[1];
}
export function validateContract(method:string,path:string,body:unknown) {
  findRequest(method,path)?.parse(body);
}
function schema(value:z.ZodType) {
  const {$schema,...result}=z.toJSONSchema(value,{target:'draft-7'});
  return result;
}
export function buildOpenApi(routes:{method:string;path:string}[]) {
  const paths:any={};
  const errors=schema(object({status:z.literal(0),info:text,data:z.null().optional(),requestId:text.optional()}));
  for(const route of [...routes,{method:'GET',path:'/api/openapi.json'}].sort((a,b)=>`${a.path} ${a.method}`.localeCompare(`${b.path} ${b.method}`))) {
    const key=`${route.method} ${route.path}`;
    const path=route.path.replace(/:(\w+)/g,'{$1}');
    const login=key==='POST /api/session';
    const download=key==='GET /api/dict/doc/download';
    const raw=key==='GET /api/openapi.json';
    paths[path]||={};
    paths[path][route.method.toLowerCase()]={
      operationId:`${route.method.toLowerCase()}_${route.path.replace(/[^a-zA-Z0-9]/g,'_')}`,
      summary:key,
      description:'写操作校验 Origin；admin 可管理全部资源，组织/系统写操作限 admin；发布及审批需 auditor，其他写操作需 editor。动态表单字段可扩展，状态流转由业务规则另行校验。',
      'x-contract-mode':requests[key]||responses[key]?'typed':'extensible',
      security:login?[]:[{sessionCookie:[]}],
      parameters:[...route.path.matchAll(/:(\w+)/g)].map(m=>({name:m[1],in:'path',required:true,schema:{type:'string',minLength:1}})),
      ...(route.method==='GET'||route.method==='DELETE'?{}:{requestBody:{required:!!requests[key],content:{'application/json':{schema:schema(requests[key]||object({}))}}}}),
      responses:{200:{description:'成功',content:{[download?'application/octet-stream':'application/json']:{schema:download?{type:'string',format:'binary'}:raw?{type:'object'}:schema(responses[key]||generic)}}},
        ...Object.fromEntries([400,401,403,404,409,413,429,503].map(code=>[code,{description:({400:'参数错误',401:'登录失效',403:'权限或来源错误',404:'记录不存在',409:'状态或关联冲突',413:'请求过大',429:'限流',503:'服务未配置或数据库繁忙'} as any)[code],content:{'application/json':{schema:errors}}}]))},
    };
  }
  return {openapi:'3.1.0',info:{title:'QingProcess API',version:'1.1.0'},paths,
    components:{securitySchemes:{sessionCookie:{type:'apiKey',in:'cookie',name:'qp_session'}}}};
}
