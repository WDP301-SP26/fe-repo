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

          // Return user object compatible with NextAuth User type
          return {
            id: user.id || 'uuid',
            name: user.full_name,
            email: user.email,
            image: user.avatar_url,
            accessToken: credentials.token as string,
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
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user && user.accessToken) {
        token.accessToken = user.accessToken;
      }
      return token;
    },
  },
} satisfies NextAuthConfig;
