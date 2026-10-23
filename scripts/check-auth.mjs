import assert from 'node:assert/strict';

// Invalid credentials and a too-short password never create users or send email.
const base=new URL(process.argv[2]||'https://fiu-honors-planner.vercel.app').origin;
const owner=process.env.OWNER_EMAIL;
assert.ok(owner,'Set OWNER_EMAIL before running this check.');
async function request(path,body){
  const response=await fetch(`${base}/api/auth/${path}`,{method:body?'POST':'GET',headers:{origin:base,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  return {status:response.status,data:await response.json()};
}
assert.deepEqual(await request('ok'),{status:200,data:{ok:true}});
const login=await request('sign-in/email',{email:'qa-login@example.invalid',password:'Invalid-QA-credentials-123'});
assert.equal(login.status,401,`Sign-in must reach credential validation: ${JSON.stringify(login)}`);
assert.equal(login.data.code,'INVALID_EMAIL_OR_PASSWORD');
const signup=await request('sign-up/email',{email:owner,password:'short',name:'Auth validation check'});
assert.equal(signup.status,400,`Sign-up must reach password validation: ${JSON.stringify(signup)}`);
assert.equal(signup.data.code,'PASSWORD_TOO_SHORT');
const foreign=await request('sign-up/email',{email:'qa-login@example.invalid',password:'short',name:'Auth validation check'});
assert.equal(foreign.status,403,'Non-owner registration must stay blocked.');
console.log('Auth smoke check passed: production origin, login, signup validation, owner restriction. No user created or email sent.');
