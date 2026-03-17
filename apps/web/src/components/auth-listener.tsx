'use client';

import { getDefaultRouteForRole } from '@/lib/routes';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function AuthListener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();

  const { fetchUser, isInitialized } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr && status === 'unauthenticated') {
      const decodedUser = decodeURIComponent(userStr);
      const parsedUser = JSON.parse(decodedUser);
      signIn('credentials', {
        token,
        user: decodedUser,
        redirect: false,
      }).then((result) => {
        if (result?.ok) {
          router.replace(getDefaultRouteForRole(parsedUser.role));
          router.refresh();
        }
      });
    } else if (!token && !isInitialized && status === 'unauthenticated') {
      // Try to hydrate session from httpOnly cookie
      fetchUser();
    }
  }, [searchParams, router, status, isInitialized, fetchUser]);

  return null;
}
