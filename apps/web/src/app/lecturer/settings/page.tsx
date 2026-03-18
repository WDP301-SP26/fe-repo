'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { fetchAPI } from '@/lib/api';
import { getApiBaseUrl, getFrontendBaseUrl } from '@/lib/runtime-config';
import { useAuthStore } from '@/stores/authStore';
import {
  CheckCircle2,
  Columns3,
  ExternalLink,
  Github,
  LinkIcon,
  Loader2,
  User,
} from 'lucide-react';
import useSWR from 'swr';

interface LinkedAccount {
  provider: string;
  provider_username: string | null;
  provider_email: string | null;
  created_at: string;
}

export default function LecturerSettingsPage() {
  const { user } = useAuthStore();

  const { data: linkedAccounts, isLoading: loadingAccounts } = useSWR<
    LinkedAccount[]
  >('/api/auth/linked-accounts', () =>
    fetchAPI<LinkedAccount[]>('/api/auth/linked-accounts'),
  );

  const apiUrl = getApiBaseUrl();
  const frontendUrl = getFrontendBaseUrl();

  const handleConnectGithub = () => {
    window.location.href = `${apiUrl}/api/auth/github?redirect_uri=${frontendUrl}/lecturer/settings`;
  };

  const handleConnectJira = () => {
    window.location.href = `${apiUrl}/api/auth/jira?redirect_uri=${frontendUrl}/lecturer/settings`;
  };

  const githubAccount = linkedAccounts?.find((a) => a.provider === 'GITHUB');
  const jiraAccount = linkedAccounts?.find((a) => a.provider === 'JIRA');

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and tool integrations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your lecturer account information.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Full Name</span>
              <span className="font-medium">{user?.full_name || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="font-medium capitalize">
                {user?.role?.toLowerCase() || '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Integrations
          </CardTitle>
          <CardDescription>
            Connect accounts used by this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingAccounts ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${githubAccount ? 'bg-green-100' : 'bg-muted'}`}
                  >
                    <Github
                      className={`h-6 w-6 ${githubAccount ? 'text-green-600' : 'text-muted-foreground'}`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">GitHub</h3>
                    {githubAccount ? (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Connected as{' '}
                        <a
                          href={`https://github.com/${githubAccount.provider_username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="underline font-medium"
                        >
                          @{githubAccount.provider_username}
                        </a>
                        <ExternalLink className="h-3 w-3" />
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not connected.
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleConnectGithub}
                  variant={githubAccount ? 'outline' : 'default'}
                  className={
                    !githubAccount
                      ? 'bg-[#24292f] hover:bg-[#1b1f23] text-white'
                      : ''
                  }
                >
                  <Github className="mr-2 h-4 w-4" />
                  {githubAccount ? 'Re-link GitHub' : 'Connect GitHub'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${jiraAccount ? 'bg-blue-100' : 'bg-muted'}`}
                  >
                    <Columns3
                      className={`h-6 w-6 ${jiraAccount ? 'text-blue-600' : 'text-muted-foreground'}`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">Jira Software</h3>
                    {jiraAccount ? (
                      <p className="text-sm text-blue-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Connected as{' '}
                        {jiraAccount.provider_username ||
                          jiraAccount.provider_email}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not connected.
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant={jiraAccount ? 'outline' : 'default'}
                  onClick={handleConnectJira}
                  className={
                    !jiraAccount
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : ''
                  }
                >
                  <Columns3 className="mr-2 h-4 w-4" />
                  {jiraAccount ? 'Re-link Jira' : 'Connect Jira'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
