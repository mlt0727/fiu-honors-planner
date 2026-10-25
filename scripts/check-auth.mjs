import assert from 'node:assert/strict';
const base=new URL(process.argv[2]||'https://fiu-honors-planner.vercel.app').origin;
async function request(path,body,origin=base){const response=await fetch(`${base}/api/auth/${path}`,{method:body?'POST':'GET',headers:{origin,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()};}
assert.deepEqual(await request('ok'),{status:200,data:{ok:true}});
assert.equal((await request('get-session')).data,null);
const invalid=await request('sign-in/email-otp',{email:'qa-no-delivery@example.invalid',otp:'000000'});
assert.equal(invalid.status,400,JSON.stringify(invalid));assert.equal(invalid.data.code,'INVALID_OTP');
assert.equal((await request('email-otp/send-verification-otp',{email:'invalid',type:'sign-in'})).status,400);
assert.equal((await request('email-otp/send-verification-otp',{email:'qa-no-delivery@example.invalid',type:'forget-password'})).status,400);
assert.equal((await request('sign-in/email-otp',{email:'qa-no-delivery@example.invalid',otp:'000000'},'https://untrusted.example.invalid')).status,403);
assert.equal((await request('sign-up/email',{email:'qa-no-delivery@example.invalid',password:'short'})).status,405);
console.log('PASS: public OTP sign-in reaches provider validation, malformed delivery requests and cross-origin requests are blocked, password routes are disabled. No account created or email sent.');
