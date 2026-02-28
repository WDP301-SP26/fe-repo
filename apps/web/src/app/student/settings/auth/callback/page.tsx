'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // We arrived here from the backend after a successful OAuth linking process.
    // Give it a brief moment so the user sees a confirmation spinner, then sweep them to the dashboard.
    const timer = setTimeout(() => {
      router.push('/student/projects');
      router.refresh();
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

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
