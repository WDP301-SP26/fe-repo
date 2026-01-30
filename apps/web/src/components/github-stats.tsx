'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Code,
  GitCommit,
  GitPullRequest,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface GitHubStatsProps {
  groupId: string;
}

interface ContributorStat {
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  contributions: number;
  percentage: number;
  is_free_rider: boolean;
  weeks: {
    week: number;
    additions: number;
    deletions: number;
    commits: number;
  }[];
}

interface RepoStats {
  repo: string;
  language: string;
  stars: number;
  forks: number;
  open_issues: number;
  total_commits: number;
  total_prs: number;
  languages: {
    [key: string]: number;
  };
}

export function GitHubStats({ groupId }: GitHubStatsProps) {
  const [contributors, setContributors] = useState<ContributorStat[]>([]);
  const [repoStats, setRepoStats] = useState<RepoStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [contributorsRes, statsRes] = await Promise.all([
          fetch(`/api/github/repos/${groupId}/contributors`),
          fetch(`/api/github/repos/${groupId}/stats`),
        ]);

        const contributorsData = await contributorsRes.json();
        const statsData = await statsRes.json();

        setContributors(contributorsData);
        setRepoStats(statsData);
      } catch (error) {
        console.error('Failed to fetch GitHub stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [groupId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GitHub Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const freeRiders = contributors.filter((c) => c.is_free_rider);

  return (
    <div className="space-y-6">
      {/* Alert for free-riders */}
      {freeRiders.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">
                {freeRiders.length} Free-rider(s) Detected
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3">
              The following members have significantly low contributions
              (&lt;25% of average):
            </p>
            <div className="flex flex-wrap gap-2">
              {freeRiders.map((fr) => (
                <Badge key={fr.login} variant="destructive">
                  {fr.name} ({fr.contributions} commits, {fr.percentage}%)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repository Overview */}
      {repoStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Commits
              </CardTitle>
              <GitCommit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {repoStats.total_commits}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pull Requests
              </CardTitle>
              <GitPullRequest className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{repoStats.total_prs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{repoStats.open_issues}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Main Language
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{repoStats.language}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Contribution Breakdown</CardTitle>
          <CardDescription>
            Showing commit distribution across all team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {contributors
              .sort((a, b) => b.contributions - a.contributions)
              .map((contributor) => (
                <div key={contributor.login} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={contributor.avatar_url} />
                        <AvatarFallback>
                          {contributor.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {contributor.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contributor.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          contributor.is_free_rider ? 'destructive' : 'default'
                        }
                      >
                        {contributor.contributions} commits
                      </Badge>
                      <span className="text-sm font-medium">
                        {contributor.percentage}%
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={contributor.percentage}
                    className={
                      contributor.is_free_rider
                        ? '[&>div]:bg-destructive'
                        : '[&>div]:bg-primary'
                    }
                  />
                  {contributor.is_free_rider && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low activity - requires attention
                    </p>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Language Breakdown */}
      {repoStats && (
        <Card>
          <CardHeader>
            <CardTitle>Language Distribution</CardTitle>
            <CardDescription>
              Code composition by programming language
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(repoStats.languages)
                .sort(([, a], [, b]) => b - a)
                .map(([lang, percent]) => (
                  <div key={lang} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{lang}</span>
                      <span className="font-medium">{percent}%</span>
                    </div>
                    <Progress value={percent} />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
