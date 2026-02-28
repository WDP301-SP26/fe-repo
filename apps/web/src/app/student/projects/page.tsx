'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { authAPI, githubAPI } from '@/lib/api';
import {
  AlertCircle,
  ExternalLink,
  FolderGit2,
  Globe,
  Link as LinkIcon,
  Lock,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  updated_at: string;
}

export default function StudentProjectsPage() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isJiraLinked, setIsJiraLinked] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reposData, accounts] = await Promise.all([
          githubAPI.getRepositories(),
          authAPI.getLinkedAccounts(),
        ]);

        setRepos(reposData.repositories || []);
        setFilteredRepos(reposData.repositories || []);

        const hasJira = accounts.some(
          (acc: { provider: string }) => acc.provider === 'JIRA',
        );
        setIsJiraLinked(hasJira);
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredRepos(repos);
    } else {
      const lower = search.toLowerCase();
      setFilteredRepos(
        repos.filter((repo) => repo.name.toLowerCase().includes(lower)),
      );
    }
  }, [search, repos]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Select a GitHub repository to link with a Jira project for
            synchronization.
          </p>
        </div>
        {!loading && (
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search repositories..."
              className="pl-8 bg-background shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 text-destructive flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && !isJiraLinked && (
        <Alert
          variant="default"
          className="border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400"
        >
          <AlertCircle className="h-4 w-4" color="#2563eb" />
          <AlertTitle className="text-blue-700 dark:text-blue-400 font-semibold">
            Jira is not connected
          </AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <span className="text-blue-600/90 dark:text-blue-400/90">
              You need to connect your Atlassian Jira account before you can
              link projects.
            </span>
            <Button
              size="sm"
              asChild
              variant="outline"
              className="border-blue-500/30 hover:bg-blue-500/20 w-fit shrink-0"
            >
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/jira?redirect_uri=${process.env.NEXT_PUBLIC_FRONTEND_URL}/student/projects`}
              >
                Connect Jira
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 p-4 border-t">
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredRepos.length === 0 && !error ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <FolderGit2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">No Repositories Found</CardTitle>
          <CardDescription className="mt-2 max-w-sm">
            {search
              ? "We couldn't find any repositories matching your search."
              : "It looks like your GitHub account doesn't have any repositories yet."}
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRepos.map((repo) => (
            <Card
              key={repo.id}
              className="flex flex-col flex-1 transition-all hover:shadow-md border-border/80 group"
            >
              <CardHeader className="pb-3 flex-1">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <Badge
                    variant={repo.private ? 'secondary' : 'outline'}
                    className="flex items-center gap-1 w-fit"
                  >
                    {repo.private ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Globe className="h-3 w-3 text-primary" />
                    )}
                    {repo.private ? 'Private' : 'Public'}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-1 flex items-center gap-2 text-lg">
                  <Link
                    href={`/student/projects/${repo.full_name}`}
                    className="hover:underline hover:text-primary transition-colors cursor-pointer"
                  >
                    {repo.name}
                  </Link>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-primary ml-auto"
                    title="View on GitHub"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardTitle>
                <CardDescription className="line-clamp-1 mt-1 text-xs font-mono">
                  {repo.full_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4 pt-0 text-xs text-muted-foreground mt-auto">
                Last updated on {new Date(repo.updated_at).toLocaleDateString()}
              </CardContent>
              <CardFooter className="bg-muted/20 border-t p-4 flex gap-2">
                <Button
                  className="w-full group-hover:bg-primary"
                  variant="default"
                  size="sm"
                  disabled={!isJiraLinked}
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Link to Jira
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
