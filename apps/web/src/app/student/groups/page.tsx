'use client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyGroups } from '@/hooks/use-api';
import {
  ArrowRight,
  Columns3,
  Github,
  Rocket,
  Search,
  Users,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

const PAGE_SIZE_OPTIONS = ['6', '9', '12'] as const;
const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'INACTIVE'] as const;

function parsePositiveInt(value: string | null, fallback = 1): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

function MyGroupsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, error, isLoading } = useMyGroups();
  const groups = data?.data || [];

  const getSearchState = () => {
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || 'ALL';
    const size = searchParams.get('size') || '6';
    const pageValue = parsePositiveInt(searchParams.get('page'), 1);

    return {
      q,
      status: STATUS_OPTIONS.includes(status as (typeof STATUS_OPTIONS)[number])
        ? status
        : 'ALL',
      size: PAGE_SIZE_OPTIONS.includes(
        size as (typeof PAGE_SIZE_OPTIONS)[number],
      )
        ? size
        : '6',
      pageValue,
    };
  };

  const initialState = getSearchState();
  const [searchTerm, setSearchTerm] = useState(initialState.q);
  const [statusFilter, setStatusFilter] = useState(initialState.status);
  const [page, setPage] = useState(initialState.pageValue);
  const [pageSize, setPageSize] = useState(initialState.size);

  const replaceQuery = (next: {
    q?: string;
    status?: string;
    size?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (next.q !== undefined) {
      if (next.q) {
        params.set('q', next.q);
      } else {
        params.delete('q');
      }
    }

    if (next.status !== undefined) {
      if (next.status && next.status !== 'ALL') {
        params.set('status', next.status);
      } else {
        params.delete('status');
      }
    }

    if (next.size !== undefined) {
      if (next.size && next.size !== '6') {
        params.set('size', next.size);
      } else {
        params.delete('size');
      }
    }

    if (next.page !== undefined) {
      if (next.page > 1) {
        params.set('page', String(next.page));
      } else {
        params.delete('page');
      }
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  useEffect(() => {
    const state = getSearchState();
    setSearchTerm(state.q);
    setStatusFilter(state.status);
    setPage(state.pageValue);
    setPageSize(state.size);
  }, [searchParams]);

  const filteredGroups = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return groups.filter((group: any) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        group.name?.toLowerCase().includes(normalizedSearch) ||
        group.project_name?.toLowerCase().includes(normalizedSearch) ||
        group.jira_project_key?.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        statusFilter === 'ALL' || (group.status || 'ACTIVE') === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [groups, searchTerm, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredGroups.length / Number(pageSize)),
  );
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (safePage !== page) {
      setPage(safePage);
      replaceQuery({ page: safePage });
    }
  }, [safePage, page]);

  const paginatedGroups = useMemo(() => {
    const start = (safePage - 1) * Number(pageSize);
    return filteredGroups.slice(start, start + Number(pageSize));
  }, [filteredGroups, safePage, pageSize]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Groups</h1>
        <p className="text-muted-foreground mt-1 text-lg">
          Your joined groups and project workspaces.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 text-destructive flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error.message}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
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
      ) : groups.length === 0 && !error ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <UsersRound className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">No Groups Yet</CardTitle>
          <CardDescription className="mt-2 max-w-sm">
            You haven&apos;t joined any groups yet. Go to your class page to
            join a group and start collaborating with your team.
          </CardDescription>
          <Button className="mt-6" asChild>
            <Link href="/student">
              <Rocket className="mr-2 h-4 w-4" />
              Go to Overview
            </Link>
          </Button>
        </Card>
      ) : (
        <>
          <Card className="border-border/60">
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchTerm(value);
                      setPage(1);
                      replaceQuery({ q: value, page: 1 });
                    }}
                    placeholder="Search by group, project, or Jira key"
                    className="pl-9"
                  />
                </div>

                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                    replaceQuery({ status: value, page: 1 });
                  }}
                >
                  <SelectTrigger className="w-full md:w-44">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={pageSize}
                  onValueChange={(value) => {
                    setPageSize(value);
                    setPage(1);
                    replaceQuery({ size: value, page: 1 });
                  }}
                >
                  <SelectTrigger className="w-full md:w-36">
                    <SelectValue placeholder="Page size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 / page</SelectItem>
                    <SelectItem value="9">9 / page</SelectItem>
                    <SelectItem value="12">12 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {paginatedGroups.length} of {filteredGroups.length}{' '}
                groups
              </div>
            </CardContent>
          </Card>

          {filteredGroups.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-10 text-center border-dashed border-2">
              <CardTitle className="text-xl">No Matching Groups</CardTitle>
              <CardDescription className="mt-2 max-w-sm">
                Try changing your search keywords or status filter.
              </CardDescription>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedGroups.map((group: any) => (
                  <Card
                    key={group.id}
                    className="flex flex-col flex-1 transition-all hover:shadow-md border-border/80 group"
                  >
                    <CardHeader className="pb-3 flex-1">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <Badge
                          variant={
                            group.status === 'ACTIVE' ? 'default' : 'secondary'
                          }
                          className="w-fit"
                        >
                          {group.status || 'ACTIVE'}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-1 text-lg">
                        {group.name}
                      </CardTitle>
                      {group.project_name && (
                        <CardDescription className="line-clamp-1 mt-1 text-xs">
                          Project: {group.project_name}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="pb-4 pt-0 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{group.members_count || 0} members</span>
                      </div>

                      <div className="flex gap-2">
                        {group.github_repo_url && (
                          <a
                            href={group.github_repo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Github className="h-3.5 w-3.5" />
                            GitHub
                          </a>
                        )}
                        {group.jira_project_key && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Columns3 className="h-3.5 w-3.5" />
                            {group.jira_project_key}
                          </span>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="bg-muted/20 border-t p-4">
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        size="sm"
                        asChild
                      >
                        <Link href={`/student/groups/${group.id}`}>
                          Enter Workspace
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              <div className="flex flex-col gap-3 border rounded-md p-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {safePage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const nextPage = Math.max(1, safePage - 1);
                      setPage(nextPage);
                      replaceQuery({ page: nextPage });
                    }}
                    disabled={safePage <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const nextPage = Math.min(totalPages, safePage + 1);
                      setPage(nextPage);
                      replaceQuery({ page: nextPage });
                    }}
                    disabled={safePage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function MyGroupsPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
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
      }
    >
      <MyGroupsPageContent />
    </Suspense>
  );
}
