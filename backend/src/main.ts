import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { All, ArgumentsHost, Catch, Controller, ExceptionFilter, HttpException, Inject, Logger, Module, Req, Res, ServiceUnavailableException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response, json } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import { ZodError } from 'zod';
import { readFileSync } from 'node:fs';
import { Database } from './database';
import { AuthService } from './security/auth.service';
import { DomainService, registry } from './domain/domain.service';
import { NativeService } from './native.service';
import { emptyState } from './domain/state';
import { authorize } from './domain/validation';
import { buildOpenApi, validateContract } from './contracts';
import { readMigrations } from './migrations';

@Catch()
export class Errors implements ExceptionFilter {
  catch(error:any,host:ArgumentsHost) {
    const res=host.switchToHttp().getResponse<Response>();
    const req=host.switchToHttp().getRequest<Request>();
    const status=error instanceof HttpException?error.getStatus():error.type==='entity.parse.failed'?400:error.type==='entity.too.large'?413:error instanceof ZodError||error instanceof TypeError?400:
      ['23505','23503','23514'].includes(error.code)?409:['55P03','57014'].includes(error.code)?503:500;
    if(status===500) Logger.error({requestId:req.headers['x-request-id'],message:error.message},undefined,'API');
    const info=error instanceof HttpException?error.message:error instanceof ZodError?'请求参数格式错误':
      status===400?'请求参数类型错误':status===413?'请求体过大':status===409?'数据冲突或关联约束不满足':status===503?'数据库繁忙，请重试':'服务暂不可用';
    res.status(status).json({status:0,data:null,info,requestId:req.headers['x-request-id']});
  }
}

@Controller()
export class ApiController {
  constructor(@Inject(Database) private readonly db:Database,@Inject(AuthService) private readonly auth:AuthService,@Inject(DomainService) private readonly domain:DomainService) {}
  @All('{*path}')
  async handle(@Req() req:Request,@Res() res:Response) {
    if(req.method==='GET'&&req.path==='/health/live')return res.json({status:'ok'});
    if(req.method==='GET'&&req.path==='/health/ready') {
      const exists=await this.db.pool.query("SELECT to_regclass('schema_migrations') AS name");
      if(!exists.rows[0].name)throw new ServiceUnavailableException('数据库迁移未完成');
      const result=await this.db.pool.query('SELECT version,checksum FROM schema_migrations ORDER BY version');
      const expected=readMigrations('migrations');
      if(result.rows.length!==expected.length||expected.some((m,i)=>result.rows[i].version!==m.version||result.rows[i].checksum!==m.checksum))throw new ServiceUnavailableException('数据库迁移版本不匹配');
      return res.json({status:'ok'});
    }
    if(req.method==='POST'&&req.path==='/api/session') {
      validateContract(req.method,req.path,req.body);
      return res.json(await this.auth.login(req,res));
    }
    const actor=await this.auth.authenticate(req);
    validateContract(req.method,req.path,req.body);
    if(req.method==='GET'&&req.path==='/api/session')return res.json({status:1,data:actor,info:'ok'});
    if(req.method==='POST'&&req.path==='/api/app/site/logout')return res.json(await this.auth.logout(req,res));
    if(req.method==='GET'&&req.path==='/api/openapi.json')return res.json(openApi());
    const result=await this.domain.dispatch(req,actor);
    for(const [name,value] of Object.entries(result.headers))res.setHeader(name,value as string);
    res.status(result.code);
    return Buffer.isBuffer(result.body)?res.send(result.body):res.json(result.body);
  }
}

export function openApi() {
  const original=JSON.parse(readFileSync('docs/routes.json','utf8'));
  const actor={id:'',userId:'',userName:'',nickName:'',roles:[]};
  const all=[...original,...registry(emptyState(),actor).routes,{method:'POST',path:'/api/files'},{method:'POST',path:'/api/system/apis/debug'}];
  return buildOpenApi(all);
}

@Module({controllers:[ApiController],providers:[Database,AuthService,DomainService,NativeService]})
export class AppModule {}

export async function createApp() {
  if(!process.env.DATABASE_URL||!process.env.APP_ORIGIN)throw new Error('DATABASE_URL and APP_ORIGIN are required');
  const origin=new URL(process.env.APP_ORIGIN);
  if(process.env.NODE_ENV==='production'&&origin.protocol!=='https:')throw new Error('Production APP_ORIGIN must use HTTPS');
  for(const [name,fallback,max] of [['SESSION_HOURS','8',168],['DB_POOL_SIZE','10',100],['PORT','3001',65535]] as const) {
    const value=Number(process.env[name]||fallback);
    if(!Number.isInteger(value)||value<1||value>max)throw new Error(`${name} is out of range`);
  }
  const app=await NestFactory.create<NestExpressApplication>(AppModule,{bodyParser:false});
  if(process.env.TRUST_PROXY)app.set('trust proxy',process.env.TRUST_PROXY);
  app.use(helmet());
  app.use((req:Request,res:Response,next:()=>void)=>{
    const requestId=randomUUID();req.headers['x-request-id']=requestId;res.setHeader('X-Request-ID',requestId);
    const started=Date.now();
    res.on('finish',()=>Logger.log(JSON.stringify({requestId,method:req.method,path:req.path,status:res.statusCode,durationMs:Date.now()-started}),'HTTP'));
    next();
  });
  app.use(json({limit:'8mb'}));app.use(cookieParser());
  app.enableCors({origin:process.env.APP_ORIGIN,credentials:true});
  app.useGlobalFilters(new Errors());app.enableShutdownHooks();
  return app;
}
if(require.main===module)createApp().then(app=>app.listen(Number(process.env.PORT||3001),'0.0.0.0')).catch(e=>{Logger.error(e.message);process.exitCode=1;});
