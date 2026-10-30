import { randomBytes, scrypt as derive, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { BadRequestException } from '@nestjs/common';
const scrypt = promisify(derive);
export async function hashPassword(password: string) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 256) {
    throw new BadRequestException('密码长度必须为 12–256 个字符');
  }
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password: string, hash: string) {
  const [salt, encoded] = hash.split(':');
  const expected = Buffer.from(encoded || '', 'hex');
  if (expected.length !== 64 || typeof password !== 'string' || password.length > 256) return false;
  const key = await scrypt(password, salt, 64) as Buffer;
  return timingSafeEqual(expected, key);
}
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
