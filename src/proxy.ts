import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, hasAccess } from '@/lib/access';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const publicAsset = /^\/fonts\/font-[0-7]\.ttf$/.test(path) ||
    (path.startsWith('/_next/static/') && !path.includes('%') && !path.includes('..'));
  if (publicAsset) return NextResponse.next();
  const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'Vary': 'Cookie' };
  if (path === '/' || path === '/api/access') return NextResponse.next({ headers });
  if (!hasAccess(request.cookies.get(ACCESS_COOKIE)?.value)) {
    return new NextResponse(null, { status: 401, headers });
  }
  return NextResponse.next({ headers });
}

export const config = { matcher: '/:path*' };
