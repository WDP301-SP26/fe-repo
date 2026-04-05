'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authAPI, fetchAPI, taskAPI, type TaskItem } from '@/lib/api';
import { isAPIError } from '@/lib/api-error';
import { getApiBaseUrl, getFrontendBaseUrl } from '@/lib/runtime-config';
import { useAuthStore } from '@/stores/authStore';
import {
  CheckCircle2,
  Columns3,
  ExternalLink,
  Github,
  LinkIcon,
  Loader2,
  Unlink,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

interface LinkedAccount {
  provider: string;
  provider_username: string | null;
  provider_email: string | null;
  created_at: string;
}

interface StudentGroupOption {
  id: string;
  name: string;
  project_name?: string | null;
  jira_project_key?: string | null;
  my_role_in_group?: string | null;
}

export default function StudentSettingsPage() {
  const { user } = useAuthStore();
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [taskTitle, setTaskTitle] = useState('Jira sync smoke test task');
  const [taskDescription, setTaskDescription] = useState(
    'Created from Student Settings page to verify Jira sync on web.',
  );
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskCreateError, setTaskCreateError] = useState<string | null>(null);
  const [createdTask, setCreatedTask] = useState<TaskItem | null>(null);

  const {
    data: linkedAccounts,
    isLoading: loadingAccounts,
    mutate: refreshAccounts,
  } = useSWR<LinkedAccount[]>('/api/auth/linked-accounts', () =>
    fetchAPI<LinkedAccount[]>('/api/auth/linked-accounts'),
  );

  const { data: myGroupsResponse, isLoading: loadingGroups } = useSWR(
    user ? '/api/groups' : null,
    () => fetchAPI<{ data: StudentGroupOption[] }>('/api/groups'),
  );

  const myGroups = useMemo<StudentGroupOption[]>(() => {
    const payload = myGroupsResponse as
      | { data?: StudentGroupOption[] }
      | StudentGroupOption[]
      | undefined;
    if (Array.isArray(payload)) {
      return payload;
    }

    return payload?.data ?? [];
  }, [myGroupsResponse]);

  useEffect(() => {
    if (selectedGroupId || myGroups.length === 0) {
      return;
    }

    const preferredGroup =
      myGroups.find(
        (group) => (group.my_role_in_group || '').toUpperCase() === 'LEADER',
      ) || myGroups[0];
    setSelectedGroupId(preferredGroup.id);
  }, [myGroups, selectedGroupId]);

  const apiUrl = getApiBaseUrl();
  const frontendUrl = getFrontendBaseUrl();

  const handleConnectGithub = () => {
    window.location.href = `${apiUrl}/api/auth/github?redirect_uri=${encodeURIComponent(`${frontendUrl}/student/settings/auth/callback`)}`;
  };

  const handleConnectJira = () => {
    window.location.href = `${apiUrl}/api/auth/jira?redirect_uri=${encodeURIComponent(`${frontendUrl}/student/settings/auth/callback`)}`;
  };

  const handleUnlink = async (provider: 'GITHUB' | 'JIRA') => {
    setUnlinking(provider);
    try {
      await authAPI.unlinkProvider(provider);
      await refreshAccounts();
    } catch (err) {
      console.error(`Failed to unlink ${provider}:`, err);
    } finally {
      setUnlinking(null);
    }
  };

  const githubAccount = linkedAccounts?.find((a) => a.provider === 'GITHUB');
  const jiraAccount = linkedAccounts?.find((a) => a.provider === 'JIRA');
  const selectedGroup =
    myGroups.find((group) => group.id === selectedGroupId) || null;

  const handleCreateSmokeTask = async () => {
    if (!selectedGroupId || !taskTitle.trim()) {
      return;
    }

    setIsCreatingTask(true);
    setTaskCreateError(null);
    setCreatedTask(null);
    try {
      const response = await taskAPI.createTask({
        group_id: selectedGroupId,
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        status: 'TODO',
        priority: 'MEDIUM',
      });
      setCreatedTask(response);
    } catch (error) {
      if (isAPIError(error)) {
        const prefix = error.code ? `[${error.code}] ` : '';
        setTaskCreateError(`${prefix}${error.message}`);
      } else {
        setTaskCreateError(
          error instanceof Error ? error.message : 'Failed to create task.',
        );
      }
    } finally {
      setIsCreatingTask(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and integrations.
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Full Name</span>
              <span className="font-medium">{user?.full_name || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Student ID</span>
              <span className="font-medium">
                {(user as any)?.student_id || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="font-medium capitalize">
                {user?.role?.toLowerCase() || '—'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Integrations
          </CardTitle>
          <CardDescription>
            Connect your accounts to enable workspace provisioning.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingAccounts ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* GitHub */}
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
                          className="underline font-medium"
                        >
                          @{githubAccount.provider_username}
                        </a>
                        <ExternalLink className="h-3 w-3" />
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not connected — required for repo provisioning.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {githubAccount && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlink('GITHUB')}
                      disabled={unlinking === 'GITHUB'}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {unlinking === 'GITHUB' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Unlink className="h-4 w-4" />
                      )}
                    </Button>
                  )}
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
              </div>

              {/* Jira */}
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
                        Not connected — optional for project management.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {jiraAccount && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlink('JIRA')}
                      disabled={unlinking === 'JIRA'}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {unlinking === 'JIRA' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Unlink className="h-4 w-4" />
                      )}
                    </Button>
                  )}
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
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task + Jira Smoke Test (Web)</CardTitle>
          <CardDescription>
            Quick test to create a student task and verify Jira sync response on
            web.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
            Only group leaders can create tasks. If Jira is linked to the
            selected group, backend will return Jira sync status and issue key.
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Group</label>
            <select
              value={selectedGroupId}
              onChange={(event) => setSelectedGroupId(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              disabled={loadingGroups || myGroups.length === 0}
            >
              {myGroups.length === 0 ? (
                <option value="">No joined groups</option>
              ) : null}
              {myGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                  {group.jira_project_key ? ` (${group.jira_project_key})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task title</label>
              <Input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Enter task title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Group role</label>
              <div className="rounded-md border bg-background px-3 py-2 text-sm">
                {selectedGroup?.my_role_in_group || 'N/A'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={taskDescription}
              onChange={(event) => setTaskDescription(event.target.value)}
              placeholder="Optional task description"
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <Button
            onClick={handleCreateSmokeTask}
            disabled={
              isCreatingTask ||
              !selectedGroupId ||
              taskTitle.trim().length === 0
            }
          >
            {isCreatingTask ? 'Creating task...' : 'Create test task'}
          </Button>

          {selectedGroup ? (
            <p className="text-xs text-muted-foreground">
              Selected group Jira key:{' '}
              <span className="font-semibold text-foreground">
                {selectedGroup.jira_project_key || 'Not linked'}
              </span>
            </p>
          ) : null}

          {taskCreateError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {taskCreateError}
            </div>
          ) : null}

          {createdTask ? (
            <div className="space-y-2 rounded-md border border-green-500/30 bg-green-500/5 p-3 text-sm">
              <div>
                Task created: <strong>{createdTask.title}</strong>
              </div>
              <div>
                Jira issue key:{' '}
                <strong>{createdTask.jira_issue_key || 'Not generated'}</strong>
              </div>
              <div>
                Jira sync status:{' '}
                <strong>{createdTask.jira_sync_status}</strong>
              </div>
              <div>
                Jira sync reason:{' '}
                <strong>{createdTask.jira_sync_reason || 'N/A'}</strong>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
