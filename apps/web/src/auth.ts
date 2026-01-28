import { CustomAdapter } from '@/lib/custom-adapter';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const config = {
  ...authConfig,
  adapter: CustomAdapter(),
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
