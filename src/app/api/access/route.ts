import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, ACCESS_MAX_AGE, createAccessToken, passwordMatches } from '@/lib/access';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const respond = (status: number, error?: string) => NextResponse.json(
    error ? { error } : { ok: true },
    { status, headers: { 'Cache-Control': 'private, no-store' } },
  );
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  try {
    const source = new URL(origin || '');
    if (!['https:', 'http:'].includes(source.protocol) || source.host !== host) return respond(403, 'Давай попробуем ещё раз.');
  } catch { return respond(403, 'Давай попробуем ещё раз.'); }
  if (!request.headers.get('content-type')?.startsWith('application/json')) return respond(415, 'Давай попробуем ещё раз.');
  if (!process.env.LOVE_PASSWORD) return respond(503, 'Открытка пока закрыта. Попробуй чуть позже.');
  try {
    if (Number(request.headers.get('content-length')) > 2048) return respond(413, 'неа, попробуй ещё раз 🤭');
    const body = await request.text();
    if (body.length > 2048) return respond(413, 'неа, попробуй ещё раз 🤭');
    const data: unknown = JSON.parse(body);
    if (!data || typeof data !== 'object' || !('password' in data) || typeof data.password !== 'string' || !passwordMatches(data.password)) {
      return respond(401, 'неа, попробуй ещё раз 🤭');
    }
    const response = respond(200);
    response.cookies.set(ACCESS_COOKIE, createAccessToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_MAX_AGE,
    });
    return response;
  } catch {
    return respond(400, 'неа, попробуй ещё раз 🤭');
  }
}
