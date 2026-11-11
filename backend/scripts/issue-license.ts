// Run ONLY on the license issuer's offline machine. Never copy its private key to the API server.
import { readFileSync, writeFileSync } from 'node:fs';
import { sign } from 'node:crypto';
import { licenseClaims } from '../src/licensing';
const [claimsFile,keyFile,outputFile]=process.argv.slice(2);
if(!claimsFile||!keyFile)throw new Error('Usage: tsx scripts/issue-license.ts claims.json private-key.pem [certificate.lic]');
const claims=licenseClaims.parse(JSON.parse(readFileSync(claimsFile,'utf8')));
if(Date.parse(claims.expireDate)<=Date.now())throw new Error('证书到期日必须在未来');
const payload=Buffer.from(JSON.stringify(claims)).toString('base64url');
const signature=sign('sha256',Buffer.from(payload),readFileSync(keyFile)).toString('base64url');
const licenseKey=`${payload}.${signature}`;
if(outputFile) {
  writeFileSync(outputFile,JSON.stringify({format:'dflow-license-v1',...claims,licenseKey},null,2)+'\n',{mode:0o600});
  console.log(`Certificate written: ${outputFile}`);
} else console.log(licenseKey);
