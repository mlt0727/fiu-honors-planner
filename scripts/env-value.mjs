import fs from 'node:fs';
import {randomBytes} from 'node:crypto';
process.loadEnvFile('.env.local');
const key=process.argv[2];
if(!['NEON_AUTH_COOKIE_SECRET','CRON_SECRET','OWNER_EMAIL'].includes(key))throw Error('Unsupported key');
let value=process.env[key];
if(!value){value=key==='OWNER_EMAIL'?'lingtongmeng0727@gmail.com':randomBytes(32).toString('base64url');fs.appendFileSync('.env.local',`\n${key}=${value}\n`);}
process.stdout.write(value);
