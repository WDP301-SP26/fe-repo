import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/', '/signin', '/signup', '/auth/callback'];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const authToken = request.cookies.get('auth_token');

  if (!authToken) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/lecturer/:path*',
    '/projects/:path*',
    '/settings/:path*',
  ],
};
