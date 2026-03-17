import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import {
  getDefaultRouteForRole,
  isAuthRoute,
  isProtectedRoute,
  normalizeRole,
} from '@/lib/routes';

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const userRole = normalizeRole(req.auth?.user?.role);

  const isLecturerRoute = nextUrl.pathname.startsWith('/lecturer');
  const isStudentRoute = nextUrl.pathname.startsWith('/student');
  const isDashboardRoute = nextUrl.pathname.startsWith('/dashboard');
  const isCurrentAuthRoute = isAuthRoute(nextUrl.pathname);

  if (!isAuthenticated && isProtectedRoute(nextUrl.pathname)) {
    return Response.redirect(new URL('/signin', nextUrl));
  }

  if (isAuthenticated) {
    const defaultRoute = getDefaultRouteForRole(userRole);

    if (isCurrentAuthRoute) {
      return Response.redirect(new URL(defaultRoute, nextUrl));
    }

    if (isLecturerRoute && userRole !== 'LECTURER') {
      return Response.redirect(new URL(defaultRoute, nextUrl));
    }

    if (isStudentRoute && userRole !== 'STUDENT') {
      return Response.redirect(new URL(defaultRoute, nextUrl));
    }

    if (isDashboardRoute && userRole !== 'ADMIN') {
      return Response.redirect(new URL(defaultRoute, nextUrl));
    }
  }

  return;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
