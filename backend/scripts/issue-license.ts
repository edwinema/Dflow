// Run ONLY on the license issuer's offline machine. Never copy its private key to the API server.
import { readFileSync } from 'node:fs';
import { sign } from 'node:crypto';
import { z } from 'zod';
const [claimsFile,keyFile]=process.argv.slice(2);
if(!claimsFile||!keyFile)throw new Error('Usage: tsx scripts/issue-license.ts claims.json private-key.pem');
const claims=z.object({companyName:z.string().min(1),machineCode:z.string().min(1),edition:z.string().min(1),authUsersCount:z.number().int().positive(),expireDate:z.string().datetime()}).parse(JSON.parse(readFileSync(claimsFile,'utf8')));
const payload=Buffer.from(JSON.stringify(claims)).toString('base64url');
const signature=sign('sha256',Buffer.from(payload),readFileSync(keyFile)).toString('base64url');
console.log(`${payload}.${signature}`);
