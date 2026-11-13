import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROJECT_REF = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0];
const AUTH_COOKIE_PREFIX = `sb-${PROJECT_REF}-auth-token`;

export function proxy(request: NextRequest) {
  // @supabase/ssr puede fragmentar la cookie en `<nombre>.0`, `<nombre>.1`, ...
  const hasSession = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith(AUTH_COOKIE_PREFIX));

  if (hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/auth',
};
