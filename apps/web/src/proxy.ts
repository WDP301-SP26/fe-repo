import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isLecturerRoute = nextUrl.pathname.startsWith('/lecturer');
  const isStudentRoute = nextUrl.pathname.startsWith('/student');
  const isAuthRoute =
    nextUrl.pathname.startsWith('/signin') ||
    nextUrl.pathname.startsWith('/register');

  // Check authentication for protected routes
  if (!isAuthenticated && (isLecturerRoute || isStudentRoute)) {
    return Response.redirect(new URL('/signin', nextUrl));
  }

  if (isAuthenticated) {
    // If logged in, redirect away from auth pages
    if (isAuthRoute) {
      const redirectUrl = userRole === 'LECTURER' ? '/lecturer' : '/student';
      return Response.redirect(new URL(redirectUrl, nextUrl));
    }

    // Role-based protection
    if (isLecturerRoute && userRole !== 'LECTURER') {
      return Response.redirect(new URL('/student', nextUrl));
    }

    if (isStudentRoute && userRole !== 'STUDENT') {
      return Response.redirect(new URL('/lecturer', nextUrl));
    }
  }

  return;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
