'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTopics } from '@/hooks/use-api';
import { githubAPI, groupAPI, jiraAPI, reportAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import {
  ArrowLeft,
  BarChart,
  Bot,
  CheckCircle2,
  Columns3,
  ExternalLink,
  FileText,
  GitBranch,
  Github,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Rocket,
  Trash2,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR, { useSWRConfig } from 'swr';

interface GroupRepo {
  id: string;
  repo_url: string;
  repo_name: string;
  repo_owner: string;
  is_primary: boolean;
  created_at: string;
}

export default function GroupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const user = useAuthStore((state) => state.user);
  const { mutate } = useSWRConfig();

  const {
    data: group,
    error: groupError,
    isLoading: loadingGroup,
  } = useSWR(`/api/groups/${groupId}`, () => groupAPI.getGroupDetails(groupId));

  const { data: topics } = useTopics();

  // Fetch user's GitHub repos (for the picker)
  const { data: reposData, isLoading: loadingRepos } = useSWR(
    '/api/github/repos',
    () => githubAPI.getRepositories(),
  );

  // Fetch group's linked repos
  const { data: groupRepos, isLoading: loadingGroupRepos } = useSWR<
    GroupRepo[]
  >(`/api/groups/${groupId}/repos`, () => groupAPI.getGroupRepos(groupId));

  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isChangingTopic, setIsChangingTopic] = useState(false);

  // Repo linking state
  const [selectedRepoUrl, setSelectedRepoUrl] = useState<string>('');
  const [isLinkingRepo, setIsLinkingRepo] = useState(false);

  // Jira linking state
  const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);
  const [selectedJiraProjectKey, setSelectedJiraProjectKey] = useState('');
  const [isLinkingJira, setIsLinkingJira] = useState(false);

  // Analytics Report States
  const [reportResult, setReportResult] = useState<any>(null);
  const [reportType, setReportType] = useState<string>(''); // srs | assignments | commits
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string | null>(
    null,
  );
  const [assignmentsPage, setAssignmentsPage] = useState(1);

  const { data: jiraProjects, isLoading: loadingJiraProjects } = useSWR(
    isJiraModalOpen ? '/api/jira/projects' : null,
    () => jiraAPI.getProjects(),
  );

  // Create new repo state (from original code)
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);

  // AlertDialog state
  const [repoToRemove, setRepoToRemove] = useState<string | null>(null);

  const isLeader =
    group?.members?.find((m: any) => m.id === user?.id)?.role_in_group ===
    'LEADER';

  const handleProvisionWorkspace = async () => {
    if (!selectedTopic) {
      toast.warning('Please select a topic first.');
      return;
    }
    setIsProvisioning(true);
    try {
      await groupAPI.updateGroup(groupId, { topic_id: selectedTopic });
      toast.success('Workspace Provisioning triggered successfully!');
      mutate(`/api/groups/${groupId}`);
      setIsChangingTopic(false);
    } catch (err: any) {
      toast.error('Provisioning failed', {
        description: err.message,
      });
    } finally {
      setIsProvisioning(false);
    }
  };

  // Link an existing repo
  const handleLinkRepo = async () => {
    if (!selectedRepoUrl) return;
    const repos = reposData?.repositories || reposData || [];
    const selectedRepo = repos.find((r: any) => r.html_url === selectedRepoUrl);
    if (!selectedRepo) return;

    setIsLinkingRepo(true);
    try {
      await groupAPI.addGroupRepo(groupId, {
        repo_url: selectedRepo.html_url,
        repo_name: selectedRepo.name,
        repo_owner:
          selectedRepo.owner?.login ||
          selectedRepo.full_name?.split('/')[0] ||
          '',
      });
      toast.success('Repository linked successfully!');
      mutate(`/api/groups/${groupId}/repos`);
      setSelectedRepoUrl('');
    } catch (err: any) {
      toast.error('Failed to link repository', {
        description: err.message,
      });
    } finally {
      setIsLinkingRepo(false);
    }
  };

  // Create a new repo on GitHub and link it
  const handleCreateAndLinkRepo = async () => {
    if (!newRepoName.trim()) {
      toast.warning('Please enter a repository name.');
      return;
    }
    setIsCreatingRepo(true);
    try {
      const newRepo = await githubAPI.createRepo(
        newRepoName.trim(),
        newRepoDesc.trim(),
      );
      // Auto-link to group
      await groupAPI.addGroupRepo(groupId, {
        repo_url: newRepo.html_url,
        repo_name: newRepo.name,
        repo_owner: newRepo.owner?.login || '',
      });
      mutate(`/api/groups/${groupId}/repos`);
      mutate('/api/github/repos'); // Refresh repo list
      setNewRepoName('');
      setNewRepoDesc('');
      setShowCreateForm(false);
      toast.success(`Repository "${newRepo.name}" created and linked!`);
    } catch (err: any) {
      toast.error('Failed to create repo', {
        description: err.message,
      });
    } finally {
      setIsCreatingRepo(false);
    }
  };

  const handleLinkJiraProject = async () => {
    if (!selectedJiraProjectKey) return;
    setIsLinkingJira(true);
    try {
      await groupAPI.updateGroup(groupId, {
        jira_project_key: selectedJiraProjectKey,
      });
      toast.success('Jira project linked successfully!');
      mutate(`/api/groups/${groupId}`);
      setIsJiraModalOpen(false);
    } catch (err: any) {
      toast.error('Failed to link Jira project', {
        description: err.message,
      });
    } finally {
      setIsLinkingJira(false);
    }
  };

  const generateReport = async (type: string) => {
    setGeneratingReport(true);
    setReportError('');
    setReportResult(null);
    setReportType(type);
    setAssignmentsPage(1);
    try {
      if (type === 'srs') {
        const res = await reportAPI.generateSrs(groupId);
        setReportResult(res.markdown);
      } else if (type === 'assignments') {
        const res = await reportAPI.getAssignments(groupId);
        setReportResult(res);
      } else if (type === 'commits') {
        const res = await reportAPI.getCommitsStats(groupId);
        setReportResult(res);
      }
      setReportGeneratedAt(new Date().toISOString());
    } catch (err: any) {
      setReportError(
        err.message ||
          'Error generating report. Ensure Jira/GitHub is fully linked.',
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  const assignments =
    reportType === 'assignments' ? reportResult?.assignments || [] : [];
  const assignmentsPageSize = 8;
  const assignmentsTotalPages = Math.max(
    1,
    Math.ceil(assignments.length / assignmentsPageSize),
  );
  const safeAssignmentsPage = Math.min(assignmentsPage, assignmentsTotalPages);
  const assignmentsOnPage = useMemo(() => {
    const start = (safeAssignmentsPage - 1) * assignmentsPageSize;
    return assignments.slice(start, start + assignmentsPageSize);
  }, [assignments, safeAssignmentsPage]);

  const reportWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (!group?.jira_project_key) {
      warnings.push(
        'Jira project is not linked. Assignment data may be incomplete.',
      );
    }
    if (!groupRepos || groupRepos.length === 0) {
      warnings.push(
        'No GitHub repository is linked. Commit-based reports can be empty.',
      );
    }
    return warnings;
  }, [group?.jira_project_key, groupRepos]);

  // Remove a linked repo
  const handleRemoveRepo = async () => {
    if (!repoToRemove) return;
    try {
      await groupAPI.removeGroupRepo(groupId, repoToRemove);
      toast.success('Repository removed from group');
      mutate(`/api/groups/${groupId}/repos`);
    } catch (err: any) {
      toast.error('Failed to remove repository', {
        description: err.message,
      });
    } finally {
      setRepoToRemove(null);
    }
  };

  const renderTopicSelector = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Available Topics</label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          disabled={!isLeader || isProvisioning}
        >
          <option value="">-- Choose a Topic --</option>
          {topics?.map((topic: any) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          onClick={handleProvisionWorkspace}
          disabled={!isLeader || isProvisioning || !selectedTopic}
        >
          {isProvisioning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="mr-2 h-4 w-4" />
          )}
          {isProvisioning ? 'Provisioning...' : 'Initialize Workspace'}
        </Button>
        {isChangingTopic && (
          <Button
            variant="outline"
            onClick={() => setIsChangingTopic(false)}
            disabled={isProvisioning}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );

  const reposForPicker = reposData?.repositories || reposData || [];

  if (loadingGroup) return <div className="p-8">Loading group...</div>;
  if (!group || groupError)
    return <div className="p-8 text-red-500">Group not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{group.name} Settings</h1>
          <p className="text-muted-foreground">
            Manage your team and project workspace.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Project Workspace</CardTitle>
            <CardDescription>
              Select a topic to auto-create GitHub and Jira instances.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!group.topic || isChangingTopic ? (
              renderTopicSelector()
            ) : (
              <div className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <GitBranch className="h-5 w-5 text-primary" />
                      {group.topic.name}
                    </h3>
                    {isLeader && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setIsChangingTopic(true)}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" /> Change
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {group.topic.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center p-3 rounded border relative group/jira">
                    <Columns3 className="h-6 w-6 mb-1" />
                    <span className="text-xs font-medium">Jira Project</span>
                    <span className="text-xs text-muted-foreground text-center">
                      {group.jira_project_key || 'Pending'}
                    </span>
                    {isLeader && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute inset-x-2 bottom-2 max-h-8 opacity-0 group-hover/jira:opacity-100 transition-opacity text-[10px]"
                        onClick={() => setIsJiraModalOpen(true)}
                      >
                        {group.jira_project_key ? 'Change' : 'Link Jira'}
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col items-center p-3 rounded border">
                    <Github className="h-6 w-6 mb-1" />
                    <span className="text-xs font-medium">Repos</span>
                    <span className="text-xs text-muted-foreground">
                      {groupRepos?.length || 0} linked
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Team Members</CardTitle>
            <CardDescription>
              {group.members?.length || 0} / 5 members joined
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y border rounded-md">
              {group.members?.map((member: any) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between p-3 text-sm"
                >
                  <div>
                    <span className="font-medium">
                      {member.full_name || 'Unknown'}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {member.email}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${member.role_in_group === 'LEADER' ? 'bg-primary/20 text-primary' : 'bg-muted'}`}
                  >
                    {member.role_in_group}
                  </span>
                </li>
              ))}
              {(!group.members || group.members.length === 0) && (
                <li className="p-4 text-center text-muted-foreground text-sm">
                  No members yet.
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {isLeader && group.topic && (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Repositories
            </CardTitle>
            <CardDescription>
              Link existing repos or create new ones for your project (e.g., FE,
              BE, Mobile).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loadingGroupRepos ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : groupRepos && groupRepos.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Linked Repositories
                </h4>
                {groupRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <div className="min-w-0">
                        <a
                          href={repo.repo_url}
                          target="_blank"
                          className="font-medium text-sm hover:underline flex items-center gap-1"
                        >
                          {repo.repo_owner}/{repo.repo_name}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setRepoToRemove(repo.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No repositories linked yet.
              </p>
            )}

            <hr />

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Add Existing Repository</h4>
              {loadingRepos ? (
                <div className="flex items-center gap-2 py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading repos...
                  </span>
                </div>
              ) : Array.isArray(reposForPicker) && reposForPicker.length > 0 ? (
                <div className="flex gap-2">
                  <select
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedRepoUrl}
                    onChange={(e) => setSelectedRepoUrl(e.target.value)}
                    disabled={isLinkingRepo}
                  >
                    <option value="">-- Select a Repository --</option>
                    {reposForPicker.map((repo: any) => (
                      <option
                        key={repo.id || repo.html_url}
                        value={repo.html_url}
                      >
                        {repo.full_name || repo.name}{' '}
                        {repo.private ? '🔒' : '🌐'}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={handleLinkRepo}
                    disabled={!selectedRepoUrl || isLinkingRepo}
                  >
                    {isLinkingRepo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No repos found.{' '}
                  <a
                    href="/student/settings"
                    className="text-primary underline"
                  >
                    Connect GitHub
                  </a>{' '}
                  first.
                </p>
              )}
            </div>

            <hr />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Create New Repository</h4>
                {!showCreateForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="mr-1 h-3 w-3" /> New Repo
                  </Button>
                )}
              </div>
              {showCreateForm && (
                <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                  <div>
                    <label className="text-sm font-medium">
                      Repository Name *
                    </label>
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                      placeholder="e.g. group2-frontend"
                      value={newRepoName}
                      onChange={(e) => setNewRepoName(e.target.value)}
                      disabled={isCreatingRepo}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                      placeholder="e.g. Frontend app for hospitality service"
                      value={newRepoDesc}
                      onChange={(e) => setNewRepoDesc(e.target.value)}
                      disabled={isCreatingRepo}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-[#24292f] hover:bg-[#1b1f23] text-white"
                      onClick={handleCreateAndLinkRepo}
                      disabled={isCreatingRepo || !newRepoName.trim()}
                    >
                      {isCreatingRepo ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Github className="mr-2 h-4 w-4" />
                      )}
                      {isCreatingRepo
                        ? 'Creating on GitHub...'
                        : 'Create & Link Repo'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      disabled={isCreatingRepo}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isLeader && group.jira_project_key && (
        <Card className="shadow-sm border-primary/20 bg-primary/2">
          <CardHeader className="pb-4 border-b bg-muted/5 rounded-t-lg">
            <CardTitle className="text-xl flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" /> Group Analytics & Reports
            </CardTitle>
            <CardDescription>
              Generate comprehensive reports using your team's Jira tasks and
              GitHub statistics.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 mb-6">
              <Button
                onClick={() => generateReport('srs')}
                disabled={generatingReport}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <FileText className="w-4 h-4" /> Generate AI SRS Document
              </Button>
              <Button
                onClick={() => generateReport('assignments')}
                disabled={generatingReport}
                variant="outline"
                className="flex items-center gap-2 border-primary/50 text-primary hover:bg-primary/10"
              >
                <Users className="w-4 h-4" /> Task Assignment Overview
              </Button>
              <Button
                onClick={() => generateReport('commits')}
                disabled={generatingReport}
                variant="outline"
                className="flex items-center gap-2 border-green-600/50 text-green-700 hover:bg-green-600/10"
              >
                <BarChart className="w-4 h-4" /> Global Contributor Stats
              </Button>
            </div>

            {generatingReport && (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                <Bot className="w-8 h-8 mb-4 animate-bounce text-primary" />
                <p>
                  Analyzing project data across Jira and GitHub... Please wait.
                </p>
              </div>
            )}

            {reportError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 mt-4">
                {reportError}
              </div>
            )}

            {!generatingReport && reportResult && (
              <div className="mt-4 p-6 bg-background rounded-lg border shadow-inner max-h-[800px] overflow-y-auto">
                <Alert className="mb-5 border-primary/20 bg-primary/5">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Report Metadata</AlertTitle>
                  <AlertDescription>
                    <p>
                      Type: <strong>{reportType.toUpperCase()}</strong> |
                      Generated:{' '}
                      <strong>
                        {reportGeneratedAt
                          ? new Date(reportGeneratedAt).toLocaleString()
                          : 'Unknown'}
                      </strong>
                    </p>
                    <p>
                      Data sources: Jira{' '}
                      {group?.jira_project_key
                        ? `(${group.jira_project_key})`
                        : '(missing)'}{' '}
                      and GitHub ({groupRepos?.length || 0} repos)
                    </p>
                    {reportWarnings.length > 0 && (
                      <ul className="mt-2 list-disc pl-5">
                        {reportWarnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    )}
                  </AlertDescription>
                </Alert>

                {reportType === 'srs' && (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {reportResult}
                    </pre>
                  </div>
                )}
                {reportType === 'assignments' && (
                  <div className="space-y-4 w-full">
                    <h3 className="text-lg font-bold border-b pb-2">
                      Jira Assignments Summary
                    </h3>
                    <p>
                      Total Tasks: <strong>{reportResult.totalTasks}</strong>
                    </p>
                    <ul className="grid md:grid-cols-2 gap-4 mt-4">
                      {assignmentsOnPage.map((task: any) => (
                        <li
                          key={task.key}
                          className="p-3 border rounded-md flex justify-between items-center text-sm bg-muted/10 shadow-sm"
                        >
                          <div className="min-w-0 pr-4">
                            <span className="font-semibold shrink-0 text-primary">
                              {task.key}
                            </span>
                            <span className="ml-2 truncate hidden md:inline">
                              {task.summary}
                            </span>
                            <div className="text-muted-foreground text-xs mt-1">
                              {task.type}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-medium text-xs">
                              {task.assignee}
                            </div>
                            <div className="text-[10px] font-bold tracking-wider bg-muted border px-2 py-0.5 rounded-full mt-1 inline-block uppercase">
                              {task.status}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {assignments.length > assignmentsPageSize && (
                      <div className="mt-4 flex items-center justify-between border rounded-md p-3">
                        <p className="text-xs text-muted-foreground">
                          Page {safeAssignmentsPage} of {assignmentsTotalPages}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setAssignmentsPage((prev) =>
                                Math.max(1, prev - 1),
                              )
                            }
                            disabled={safeAssignmentsPage <= 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setAssignmentsPage((prev) =>
                                Math.min(assignmentsTotalPages, prev + 1),
                              )
                            }
                            disabled={
                              safeAssignmentsPage >= assignmentsTotalPages
                            }
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {reportType === 'commits' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold border-b pb-2">
                      GitHub Contributions across Repositories
                    </h3>
                    {reportResult.repositories?.map((repo: any) => (
                      <div key={repo.repository} className="space-y-4">
                        <h4 className="font-semibold text-primary">
                          {repo.repository}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {repo.contributors?.map((contributor: any) => (
                            <div
                              key={contributor.author}
                              className="p-4 border border-border shadow-sm rounded-lg bg-card flex flex-col items-center justify-center text-center"
                            >
                              {contributor.avatar_url ? (
                                <img
                                  src={contributor.avatar_url}
                                  className="w-12 h-12 rounded-full mb-3 shadow-sm border"
                                  alt={contributor.author}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full mb-3 bg-primary/20 flex items-center justify-center font-bold text-lg text-primary">
                                  {contributor.author?.[0]}
                                </div>
                              )}
                              <span className="font-bold text-sm">
                                {contributor.author}
                              </span>
                              <span className="text-xs font-semibold text-muted-foreground mb-2 mt-1 px-2 py-1 bg-muted rounded">
                                {contributor.commits} commits
                              </span>
                              <div className="flex gap-4 text-xs w-full justify-center mt-2 border-t pt-2">
                                <span className="text-green-600 font-bold flex flex-col">
                                  <span>+{contributor.lines_added}</span>{' '}
                                  <span className="text-[10px] text-muted-foreground font-normal">
                                    lines
                                  </span>
                                </span>
                                <span className="text-red-500 font-bold flex flex-col">
                                  <span>-{contributor.lines_deleted}</span>{' '}
                                  <span className="text-[10px] text-muted-foreground font-normal">
                                    lines
                                  </span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isJiraModalOpen} onOpenChange={setIsJiraModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Jira Project</DialogTitle>
            <DialogDescription>
              Select an existing Jira Project to link to this group.
            </DialogDescription>
          </DialogHeader>

          {loadingJiraProjects ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
              Loading your Jira projects...
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Available Jira Projects
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedJiraProjectKey}
                  onChange={(e) => setSelectedJiraProjectKey(e.target.value)}
                  disabled={isLinkingJira}
                >
                  <option value="">-- Choose a Jira Project --</option>
                  {jiraProjects?.map((project: any) => (
                    <option key={project.key} value={project.key}>
                      {project.name} ({project.key})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                className="w-full"
                disabled={!selectedJiraProjectKey || isLinkingJira}
                onClick={handleLinkJiraProject}
              >
                {isLinkingJira && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isLinkingJira ? 'Linking...' : 'Link Selected Project'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!repoToRemove}
        onOpenChange={(open) => !open && setRepoToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will un-link the repository from your group workspace. It
              won't delete the repository from GitHub.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemoveRepo}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
