import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const ACCESS_COOKIE = 'love_access';
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 30;

export function passwordMatches(value: string): boolean {
  const password = process.env.LOVE_PASSWORD;
  if (!password || !value || value.length > 512) return false;
  const digest = (text: string) => createHash('sha256').update(text).digest();
  return timingSafeEqual(digest(value), digest(password));
}

function signature(payload: string, password: string) {
  return createHmac('sha256', password).update(`love-access:v1:${payload}`).digest('base64url');
}

export function createAccessToken(): string {
  const password = process.env.LOVE_PASSWORD;
  if (!password) throw new Error('Access is not configured');
  const expires = Math.floor(Date.now() / 1000) + ACCESS_MAX_AGE;
  const payload = `${expires}.${randomBytes(16).toString('base64url')}`;
  return `${payload}.${signature(payload, password)}`;
}

export function hasAccess(token: string | undefined): boolean {
  const password = process.env.LOVE_PASSWORD;
  if (!password || !token || token.length > 200) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [expiry, nonce, supplied] = parts;
  if (!/^\d{10}$/.test(expiry) || !/^[A-Za-z0-9_-]{22}$/.test(nonce) || !/^[A-Za-z0-9_-]{43}$/.test(supplied)) return false;
  const expires = Number(expiry), now = Math.floor(Date.now() / 1000);
  if (expires <= now || expires > now + ACCESS_MAX_AGE) return false;
  const expected = signature(`${expiry}.${nonce}`, password);
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}
