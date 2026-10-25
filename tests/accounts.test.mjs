import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifiedUser,validatePreferences,validateOtpRequest} from '../lib/accounts.mjs';

test('any verified account is admitted, while missing and unverified sessions are rejected',()=>{
  const a={id:'a',email:'first@example.com',emailVerified:true},b={id:'b',email:'second@example.com',emailVerified:true};
  assert.equal(verifiedUser({user:a}),a);assert.equal(verifiedUser({user:b}),b);
  assert.equal(verifiedUser(null),null);assert.equal(verifiedUser({user:{...a,emailVerified:false}}),null);
});
test('preferences validate language and always use the signed-in recipient',()=>{
  const input={hours:2,weekly:true,deadlineReminders:true,eventFallback:false,language:'en',email:'other@example.com',revision:1};
  assert.equal(validatePreferences(input,'me@example.com').email,'me@example.com');
  assert.equal(validatePreferences(input,'me@example.com').language,'en');
  assert.equal(validatePreferences({...input,language:undefined},'me@example.com').language,'zh');
  assert.throws(()=>validatePreferences({...input,language:'invalid'},'me@example.com'));
  assert.throws(()=>validatePreferences({...input,hours:NaN},'me@example.com'));
});
test('OTP requests allow new emails but reject other delivery purposes and malformed codes',()=>{
  assert.deepEqual(validateOtpRequest({email:' New@Example.com ',type:'sign-in'},false),{email:'new@example.com',type:'sign-in'});
  assert.deepEqual(validateOtpRequest({email:'new@example.com',otp:'123456'},true),{email:'new@example.com',otp:'123456'});
  assert.throws(()=>validateOtpRequest({email:'bad',type:'sign-in'},false));
  assert.throws(()=>validateOtpRequest({email:'new@example.com',type:'forget-password'},false));
  assert.throws(()=>validateOtpRequest({email:'new@example.com',otp:'12345'},true));
});
