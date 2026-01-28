import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== '/signin') {
    const newUrl = new URL('/signin', req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
  return; // Explicit return to satisfy TS7030
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|signin).*)'],
};
