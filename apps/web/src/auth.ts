import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const config = {
  ...authConfig,
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
