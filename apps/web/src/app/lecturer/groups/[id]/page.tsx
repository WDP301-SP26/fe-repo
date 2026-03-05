'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { groupAPI, reportAPI } from '@/lib/api';
import {
  ArrowLeft,
  BarChart,
  Bot,
  Calendar,
  ExternalLink,
  FileText,
  GitCommit,
  Github,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const {
    data: group,
    error: groupError,
    isLoading: groupLoading,
  } = useSWR(`/api/groups/${groupId}`, () => groupAPI.getGroupDetails(groupId));

  const {
    data: repos,
    error: reposError,
    isLoading: reposLoading,
  } = useSWR(`/api/groups/${groupId}/repos`, () =>
    groupAPI.getGroupRepos(groupId),
  );

  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);
  const [commits, setCommits] = useState<any[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [commitsError, setCommitsError] = useState('');

  // Analytics Report States
  const [reportResult, setReportResult] = useState<any>(null);
  const [reportType, setReportType] = useState<string>(''); // srs | assignments | commits
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState('');

  const generateReport = async (type: string) => {
    setGeneratingReport(true);
    setReportError('');
    setReportResult(null);
    setReportType(type);
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
    } catch (err: any) {
      setReportError(
        err.message ||
          'Error generating report. Ensure Jira/GitHub is fully linked.',
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  useEffect(() => {
    if (repos && repos.length > 0 && !activeRepoId) {
      setActiveRepoId(repos[0].id);
    }
  }, [repos, activeRepoId]);

  useEffect(() => {
    if (activeRepoId) {
      loadCommits(activeRepoId);
    }
  }, [activeRepoId]);

  const loadCommits = async (repoId: string) => {
    setCommitsLoading(true);
    setCommitsError('');
    try {
      const data = await groupAPI.getGroupRepoCommits(groupId, repoId);
      setCommits(data);
    } catch (err: any) {
      setCommitsError(err.message || 'Failed to fetch commits');
    } finally {
      setCommitsLoading(false);
    }
  };

  if (groupLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="p-8 text-red-500">Failed to load group details.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <p className="text-muted-foreground mt-1">
              Project Topic:{' '}
              <span className="font-medium text-primary">
                {group.topic?.name || 'Not selected'}
              </span>
            </p>
          </div>
          {group.jira_project_key && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://${group.jira_project_key}-team.atlassian.net/jira/software/projects/${group.jira_project_key}/boards/1`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Jira Workspace
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar: Repositories List */}
        <div className="md:col-span-1 border rounded-lg p-4 bg-muted/10 h-fit space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Github className="w-5 h-5" /> Imported Repositories
          </h2>
          {reposLoading && <Skeleton className="h-20 w-full" />}
          {reposError && (
            <p className="text-red-500 text-sm">Failed to load repos.</p>
          )}
          {repos?.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No repositories imported yet.
            </p>
          )}

          <div className="space-y-3">
            {repos?.map((repo: any) => (
              <Card
                key={repo.id}
                className={`cursor-pointer transition-colors shadow-sm hover:border-primary ${activeRepoId === repo.id ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setActiveRepoId(repo.id)}
              >
                <CardHeader className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                        <a
                          href={repo.repo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {repo.repo_name}
                        </a>
                        <ExternalLink className="h-3 w-3" />
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Owner: {repo.repo_owner}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Area: Commits Viewer */}
        <div className="md:col-span-2 space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <GitCommit className="h-5 w-5" /> Recent Commits
              </CardTitle>
              <CardDescription>
                Activity timeline for the selected repository
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!activeRepoId && !reposLoading && (
                <div className="p-12 text-center text-muted-foreground bg-muted/5">
                  Select a repository on the left to view its commits.
                </div>
              )}
              {activeRepoId && commitsLoading && (
                <div className="p-8 space-y-6">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              )}
              {activeRepoId && commitsError && (
                <div className="p-8 text-center text-red-500 bg-red-50">
                  {commitsError}
                </div>
              )}
              {activeRepoId &&
                !commitsLoading &&
                !commitsError &&
                commits.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground bg-muted/5">
                    No commits found in this repository or the access token
                    might have expired.
                  </div>
                )}
              {activeRepoId &&
                !commitsLoading &&
                !commitsError &&
                commits.length > 0 && (
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {commits.map((commit: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 hover:bg-muted/50 transition-colors flex gap-4 items-start group"
                      >
                        <div className="mt-1">
                          {commit.avatar_url ? (
                            <img
                              src={commit.avatar_url}
                              alt={commit.author}
                              className="w-10 h-10 rounded-full border shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex justify-center items-center text-sm font-bold text-primary border shadow-sm">
                              {commit.author?.substring(0, 2).toUpperCase() ||
                                'GH'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-4">
                            <p
                              className="text-sm font-semibold text-foreground truncate"
                              title={commit.message}
                            >
                              {commit.message}
                            </p>
                            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded border">
                              {commit.sha.substring(0, 7)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {commit.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(commit.date).toLocaleString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        </div>

        {/* AI & Analytics Reports Section */}
        <div className="md:col-span-3 space-y-4 pt-6 border-t">
          <Card className="shadow-sm border-primary/20 bg-primary/2">
            <CardHeader className="pb-4 border-b bg-muted/5 rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" /> AI Reports & Group
                Analytics
              </CardTitle>
              <CardDescription>
                Generate comprehensive reports using Jira tasks and GitHub
                statistics from your students project spaces.
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

              {/* Status and Results area */}
              {generatingReport && (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                  <Bot className="w-8 h-8 mb-4 animate-bounce text-primary" />
                  <p>
                    Analyzing project data across Jira and GitHub... Please
                    wait.
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
                        {reportResult.assignments?.map((task: any) => (
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
                      {(!reportResult.assignments ||
                        reportResult.assignments.length === 0) && (
                        <p className="text-muted-foreground italic">
                          No issues found on Jira.
                        </p>
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
                            {(!repo.contributors ||
                              repo.contributors.length === 0) && (
                              <p className="text-sm text-muted-foreground py-2 col-span-full">
                                No contributor stats found. (Note: Repository
                                might be empty or no code pushed yet)
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
