'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function AuthListener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr && status === 'unauthenticated') {
      const decodedUser = decodeURIComponent(userStr);

      // Sign in using the Credentials provider configured in auth.ts
      signIn('credentials', {
        token,
        user: decodedUser,
        redirect: false,
      }).then((result) => {
        if (result?.ok) {
          // Clean up URL
          router.replace('/');
          // Force reload to update session state across the app if needed
          router.refresh();
        } else {
          console.error('Failed to sign in with token', result?.error);
        }
      });
    }
  }, [searchParams, router, status]);

  return null;
}
