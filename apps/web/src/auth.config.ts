import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';

export const authConfig = {
  // session: { strategy: 'jwt' }, // session strategy is defined here or usually default 'jwt' if no adapter, but we want it explicit
  session: { strategy: 'jwt' },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Credentials({
      name: 'Backend Token',
      credentials: {
        token: { label: 'Token', type: 'text' },
        user: { label: 'User', type: 'text' },
      },
      async authorize(credentials) {
        if (credentials.token && credentials.user) {
          // Trust the token from our Backend
          const user = JSON.parse(credentials.user as string);
          return {
            id: user.id || 'uuid',
            name: user.full_name,
            email: user.email,
            image: user.avatar_url,
            accessToken: credentials.token,
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.accessToken) {
        // Pass access_token to session if needed
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user && (user as any).accessToken) {
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
  },
} satisfies NextAuthConfig;
