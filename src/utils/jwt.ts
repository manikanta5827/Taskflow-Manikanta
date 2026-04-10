import { sign, verify } from 'hono/jwt';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
}

function parseExpiry(expiryString: string): number {
  const match = expiryString.match(/^(\d+)(h|m|d|s)$/);
  if (!match) return 24 * 60 * 60; // default 24 hours
  const value = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 'h') return value * 60 * 60;
  if (unit === 'm') return value * 60;
  if (unit === 's') return value;
  if (unit === 'd') return value * 24 * 60 * 60;
  return 24 * 60 * 60;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  const expTime = parseExpiry(env.JWT_EXPIRY);
  const exp = Math.floor(Date.now() / 1000) + expTime;
  return sign({ ...payload, exp }, env.JWT_SECRET, 'HS256');
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  return (await verify(token, env.JWT_SECRET, 'HS256')) as unknown as JwtPayload;
}
