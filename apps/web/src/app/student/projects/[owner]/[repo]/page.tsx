'use client';

import { ContributorsChart } from '@/components/charts/contributors-chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { githubAPI } from '@/lib/api';
import {
  ArrowLeft,
  ExternalLink,
  GitCommit,
  GitPullRequestDraft,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ContributorStat {
  author: string;
  avatar_url?: string;
  commits: number;
  lines_added: number;
  lines_deleted: number;
  net_change: number;
}

interface Commit {
  sha: string;
  author: string;
  avatar_url?: string;
  date: string;
  message: string;
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [stats, setStats] = useState<ContributorStat[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const [statsData, commitsData] = await Promise.all([
          githubAPI.getContributorStats(owner, repo),
          githubAPI.getCommits(owner, repo),
        ]);

        setStats(statsData || []);
        setCommits(commitsData || []);
      } catch (err: any) {
        console.error('Failed to fetch project details:', err);
        setError(err.message || 'Failed to load project statistics');
      } finally {
        setLoading(false);
      }
    };

    if (owner && repo) {
      fetchDetails();
    }
  }, [owner, repo]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href="/student/projects"
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 w-fit mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Projects
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {repo}
            </h1>
            <Badge variant="outline" className="h-6">
              {owner}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Detailed view of repository contributions and recent commit history.
          </p>
        </div>
        <Button variant="outline" asChild className="gap-2">
          <a
            href={`https://github.com/${owner}/${repo}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" /> View on GitHub
          </a>
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5 mt-4">
          <CardContent className="pt-6 text-destructive flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[450px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      ) : !error ? (
        <div className="flex flex-col gap-8">
          {/* Stats Analytics Section */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Commits
                </CardTitle>
                <GitCommit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.reduce((acc, cur) => acc + cur.commits, 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Lines Added
                </CardTitle>
                <GitPullRequestDraft className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  +
                  {stats
                    .reduce((acc, cur) => acc + cur.lines_added, 0)
                    .toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Contributors
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.length}</div>
              </CardContent>
            </Card>
          </div>

          <ContributorsChart data={stats} />

          {/* Commits Timeline Section */}
          <Card className="overflow-hidden border-border/80 shadow-sm">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <CardTitle className="flex items-center gap-2">
                <GitCommit className="h-5 w-5 text-primary" />
                Recent Commits
              </CardTitle>
              <CardDescription>
                Latest {commits.length} commits pushed to this repository
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[400px] overflow-y-auto rounded-md">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="w-[120px]">Author</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="w-[150px] text-right">
                        Date
                      </TableHead>
                      <TableHead className="w-[100px] text-right">
                        SHA
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commits.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center h-24 text-muted-foreground"
                        >
                          No commits found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      commits.map((commit) => (
                        <TableRow key={commit.sha} className="hover:bg-muted/5">
                          <TableCell className="font-medium whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {commit.avatar_url && (
                                <img
                                  src={commit.avatar_url}
                                  alt={commit.author}
                                  className="w-5 h-5 rounded-full"
                                />
                              )}
                              {commit.author}
                            </div>
                          </TableCell>
                          <TableCell
                            className="max-w-[300px] truncate"
                            title={commit.message}
                          >
                            {commit.message.split('\n')[0]}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs whitespace-nowrap">
                            {new Date(commit.date).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <a
                              href={`https://github.com/${owner}/${repo}/commit/${commit.sha}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Badge
                                variant="secondary"
                                className="font-mono text-[10px] px-1.5 cursor-pointer hover:bg-secondary/80 outline-none hover:shadow-sm"
                              >
                                {commit.sha.substring(0, 7)}
                              </Badge>
                            </a>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
