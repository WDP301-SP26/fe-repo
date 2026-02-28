'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { authAPI } from '@/lib/api';
import { Github, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function RequireGithubWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLinked, setIsLinked] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkLinkedAccounts = async () => {
      try {
        const accounts = await authAPI.getLinkedAccounts();
        const hasGithub = accounts.some((acc) => acc.provider === 'GITHUB');
        setIsLinked(hasGithub);
      } catch (err) {
        console.error('Failed to check linked accounts:', err);
        setError('Could not verify account status. Please try refreshing.');
        setIsLinked(false);
      }
    };

    checkLinkedAccounts();
  }, []);

  if (isLinked === null) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLinked) {
    const githubConnectUrl = `${
      process.env.NEXT_PUBLIC_API_URL
    }/api/auth/github?redirect_uri=${process.env.NEXT_PUBLIC_FRONTEND_URL}/student/settings`;

    return (
      <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full shadow-lg border-primary/20">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Github className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Action Required
            </CardTitle>
            <CardDescription className="text-base mt-2">
              You must link your GitHub account to access the Student Workspace
              and synchronize your projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 mt-6">
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button asChild size="lg" className="w-full font-semibold">
              <a href={githubConnectUrl}>
                <Github className="mr-2 h-5 w-5" />
                Connect GitHub Now
              </a>
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-2">
              By connecting, you allow Jira-GitHub Manager to read your profile
              and repository statistics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If linked, render the actual page content
  return <>{children}</>;
}
