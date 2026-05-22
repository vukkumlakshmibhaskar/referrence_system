import { NextResponse } from 'next/server';
import { ROLES } from './src/lib/permissions';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/register',
    '/swagger',
    '/swagger.html',
    '/api-docs',
    '/_next',
    '/favicon.ico',
    '/public'
  ];

  const publicApiPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/send-otp',
    '/api/auth/verify-otp',
    '/api-docs',
    '/api/verify-referral',
    '/api/save-transaction'
  ];

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow public API paths
  if (publicApiPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for token in cookie or header
  const token = request.cookies.get('token')?.value || request.headers.get('authorization');
  const userCookie = request.cookies.get('user')?.value;

  // For protected API routes
  if (pathname.startsWith('/api/')) {
    if (!token || !userCookie) {
      return NextResponse.json({ error: 'Unauthorized', code: 'NO_AUTH' }, { status: 401 });
    }

    let user;
    try {
      user = JSON.parse(userCookie);
    } catch {
      return NextResponse.json({ error: 'Unauthorized', code: 'INVALID_USER' }, { status: 401 });
    }

    // API role-based access
    if (pathname.startsWith('/api/admin/') && user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden', code: 'ADMIN_ONLY' }, { status: 403 });
    }

    if (pathname.startsWith('/api/partner/') && user.role !== ROLES.PARTNER) {
      return NextResponse.json({ error: 'Forbidden', code: 'PARTNER_ONLY' }, { status: 403 });
    }

    return NextResponse.next();
  }

  // For page routes - check role-based access
  if (!token || !userCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let user;
  try {
    user = JSON.parse(userCookie);
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Page role-based access
  if (pathname.startsWith('/admin') && user.role !== ROLES.ADMIN) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/partner') && user.role !== ROLES.PARTNER) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};