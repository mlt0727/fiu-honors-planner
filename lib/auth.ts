import {createNeonAuth} from '@neondatabase/auth/next/server';
import {cache} from 'react';
import {verifiedUser} from './accounts.mjs';

export const auth=createNeonAuth({baseUrl:process.env.NEON_AUTH_BASE_URL!,cookies:{secret:process.env.NEON_AUTH_COOKIE_SECRET!}});
export const userSession=cache(async()=>{
  const {data}=await auth.getSession();
  return verifiedUser(data);
});
