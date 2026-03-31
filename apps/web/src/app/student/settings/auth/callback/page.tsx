'use client';

import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function SettingsAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');

        // Fetch fresh user profile (cookie is sent automatically)
        const user = await authAPI.getCurrentUser();

        if (user) {
          setUser(user, token);
        }

        router.push('/student/settings');
        router.refresh();
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Failed to link account. Please try again.');
        setTimeout(() => {
          router.push('/student/settings');
        }, 2000);
      }
    };

    handleCallback();
  }, [router, searchParams, setUser]);

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <p className="text-destructive">{error}</p>
          <p className="text-muted-foreground">Redirecting back...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">
          Authorization Successful
        </h1>
        <p className="text-muted-foreground">
          Your account was linked successfully. Returning you to the
          workspace...
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Linking account...</p>
          </div>
        </div>
      }
    >
      <SettingsAuthCallbackContent />
    </Suspense>
  );
}
