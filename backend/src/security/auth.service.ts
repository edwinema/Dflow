import { Injectable, Inject, UnauthorizedException, ForbiddenException, HttpException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Request, Response } from 'express';
import { Database } from '../database';
import { Actor } from '../domain/types';
import { tokenHash, verifyPassword } from './password';

@Injectable()
export class AuthService {
  constructor(@Inject(Database) private readonly db: Database) {}
  private token(req: Request): string {
    return req.headers.authorization?.replace(/^Bearer /i, '') || req.cookies?.qp_session || '';
  }
  checkOrigin(req: Request) {
    if (['GET','HEAD','OPTIONS'].includes(req.method)) return;
    const origin = req.headers.origin;
    if ((origin && origin !== process.env.APP_ORIGIN) || (!origin && req.cookies?.qp_session && !req.headers.authorization)) {
      throw new ForbiddenException('请求来源不受信任');
    }
  }
  async throttle(key: string, maximum: number) {
    const { rows } = await this.db.pool.query(`INSERT INTO rate_limits(key,window_start,hits)
      VALUES($1,date_trunc('minute',now()),1) ON CONFLICT(key) DO UPDATE SET
      hits=CASE WHEN rate_limits.window_start=date_trunc('minute',now()) THEN rate_limits.hits+1 ELSE 1 END,
      window_start=date_trunc('minute',now()) RETURNING hits`, [key]);
    if (rows[0].hits > maximum) throw new HttpException('请求过于频繁，请稍后重试', 429);
  }
  async login(req: Request, res: Response) {
    this.checkOrigin(req);
    const { userId, password } = req.body || {};
    if (typeof userId !== 'string' || typeof password !== 'string' || userId.length > 200 || password.length > 256) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    await this.throttle(`login-ip:${req.ip}`, 20);
    await this.throttle(`login-user:${tokenHash(userId.toLowerCase())}`, 10);
    const { rows } = await this.db.pool.query(`SELECT u.id,u.payload,c.password_hash FROM users u
      JOIN credentials c ON c.user_id=u.id WHERE lower(u.payload->>'userName')=lower($1)`, [userId.trim()]);
    const user = rows[0];
    // Equal-cost KDF for unknown accounts reduces timing-based enumeration.
    const dummy = `${'0'.repeat(32)}:${'0'.repeat(128)}`;
    const valid = await verifyPassword(password, user?.password_hash || dummy);
    if (!user || user.payload.status !== '0' || !valid) throw new UnauthorizedException('用户名或密码错误');
    const token = randomBytes(32).toString('base64url');
    await this.db.pool.query(`INSERT INTO sessions(token_hash,user_id,expires_at)
      VALUES($1,$2,now()+make_interval(hours=>$3))`, [tokenHash(token), user.id, Number(process.env.SESSION_HOURS || 8)]);
    res.cookie('qp_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', path: '/', maxAge: Number(process.env.SESSION_HOURS || 8) * 3600000 });
    return { status: 1, data: await this.sessionActor(user.payload), info: 'ok' };
  }
  private async sessionActor(user: any): Promise<Actor> {
    const actor = this.actor(user);
    if (Array.isArray(user.menuPermissions)) return {...actor, menuPermissions: user.menuPermissions.filter((v:any)=>typeof v==='string')};
    const names = Array.isArray(user.roleNames) ? user.roleNames : [];
    const rows = (await this.db.pool.query('SELECT payload FROM organization_roles')).rows;
    const assigned = rows.map(row=>row.payload).filter((role:any)=>role.status==='0' && names.includes(role.roleName));
    if (assigned.length) actor.menuPermissions = [...new Set<string>(assigned.flatMap((role:any)=>Array.isArray(role.menuPermissions)?role.menuPermissions.filter((v:any)=>typeof v==='string'):[]))];
    return actor;
  }
  actor(user: any): Actor {
    return { id: user.id, userId: user.userName, userName: user.nickName || user.userName,
      nickName: user.nickName || user.userName, empNo: user.empNo, deptName: user.deptName,
      roles: user.accessRoles || ['viewer'] };
  }
  async authenticate(req: Request): Promise<Actor> {
    this.checkOrigin(req);
    const token = this.token(req);
    if (!token || token.length > 256) throw new UnauthorizedException('请登录');
    const { rows } = await this.db.pool.query(`SELECT u.payload FROM sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=$1 AND s.expires_at>now() AND u.payload->>'status'='0'`, [tokenHash(token)]);
    if (!rows[0]) throw new UnauthorizedException('登录已过期');
    const actor = await this.sessionActor(rows[0].payload);
    await this.throttle(`user:${actor.id}`, req.path.startsWith('/api/ai/') ? 20 : 300);
    return actor;
  }
  async logout(req: Request, res: Response) {
    this.checkOrigin(req);
    await this.db.pool.query('DELETE FROM sessions WHERE token_hash=$1', [tokenHash(this.token(req))]);
    res.clearCookie('qp_session', { path: '/' });
    return { status: 1, data: {}, info: 'ok' };
  }
}
