import { readFileSync } from 'node:fs';
import { createPublicKey, verify } from 'node:crypto';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { z } from 'zod';

export const licenseClaims = z.object({
  companyName: z.string().trim().min(1).max(200),
  machineCode: z.string().trim().min(1).max(200),
  edition: z.string().trim().min(1).max(200),
  authUsersCount: z.number().int().positive().max(1000000),
  expireDate: z.string().datetime(),
});

export function licenseConfiguration() {
  const machineCode = process.env.MACHINE_ID?.trim() || '';
  let publicKey = process.env.LICENSE_PUBLIC_KEY?.replaceAll('\\n', '\n') || '';
  try {
    if (!publicKey && process.env.LICENSE_PUBLIC_KEY_FILE) publicKey = readFileSync(process.env.LICENSE_PUBLIC_KEY_FILE, 'utf8');
    createPublicKey(publicKey);
  } catch { publicKey = ''; }
  const ready = Boolean(machineCode && publicKey);
  return { machineCode, publicKey, ready,
    message: ready ? '' : '授权校验尚未就绪，请管理员配置服务器机器标识和签发方公钥后再导入证书。' };
}

export function verifyLicense(key: string) {
  const config = licenseConfiguration();
  if (!config.ready) throw new ServiceUnavailableException(config.message);
  if (typeof key !== 'string' || key.length > 10000 || !/^[\w-]+\.[\w-]+$/.test(key)) throw new BadRequestException('授权码格式无效，请导入签发工具生成的 .lic 证书');
  const [payload, signature] = key.split('.');
  let valid = false;
  try { valid = verify('sha256', Buffer.from(payload), config.publicKey, Buffer.from(signature, 'base64url')); } catch {}
  if (!valid) throw new BadRequestException('授权签名无效，请使用当前签发方生成的证书');
  let claims: z.infer<typeof licenseClaims>;
  try { claims = licenseClaims.parse(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))); }
  catch { throw new BadRequestException('授权内容无效'); }
  if (claims.machineCode !== config.machineCode) throw new BadRequestException('授权证书的机器标识与当前服务器不匹配');
  if (Date.parse(claims.expireDate) <= Date.now()) throw new BadRequestException('授权证书已过期，请重新签发');
  return claims;
}

export function companyLicenseView(company: any) {
  const { publicKey: _publicKey, ...configuration } = licenseConfiguration();
  const license = { ...company.license, status: 'INACTIVE', hardwareVerified: false };
  if (company.license?.licenseKey) {
    try {
      const claims = verifyLicense(company.license.licenseKey);
      Object.assign(license, claims, { status: 'ACTIVE', hardwareVerified: true });
    } catch (error) {
      license.status = Date.parse(company.license.expireDate) <= Date.now() ? 'EXPIRED' : 'INVALID';
      license.validationMessage = (error as Error).message;
    }
  }
  return { ...company, license, licenseConfiguration: configuration };
}
