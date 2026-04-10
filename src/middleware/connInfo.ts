import { createMiddleware } from 'hono/factory';
import { getConnInfo } from 'hono/bun';
import { AppVariables } from '../types';

export const connInfoMiddleware = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  // getConnInfo only works when running through a real Bun.serve()
  let info;
  try {
    info = getConnInfo(c);
  } catch (e) {
    // info will be undefined
  }
  
  // Extract IP, prioritizing headers if behind a proxy, otherwise real ip
  const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() 
             || info?.remote?.address 
             || 'unknown';

  c.set('clientIp', ip);
  await next();
});
