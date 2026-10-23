import {createNeonAuth} from '@neondatabase/auth/next/server';
import {cache} from 'react';

export const auth=createNeonAuth({baseUrl:process.env.NEON_AUTH_BASE_URL!,cookies:{secret:process.env.NEON_AUTH_COOKIE_SECRET!}});
export const ownerSession=cache(async()=>{
  const {data}=await auth.getSession();
  const user=data?.user;
  if(!user||user.email?.toLowerCase()!==process.env.OWNER_EMAIL?.toLowerCase()||!user.emailVerified)return null;
  return user;
});
