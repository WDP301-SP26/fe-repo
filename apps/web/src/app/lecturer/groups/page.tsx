'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useClasses } from '@/hooks/use-api';
import { groupAPI } from '@/lib/api';
import {
  BookOpen,
  ChevronRight,
  GitBranch,
  Link2,
  Search,
  Users,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

const PAGE_SIZE_OPTIONS = ['8', '12', '16'] as const;
const INTEGRATION_OPTIONS = ['ALL', 'READY', 'MISSING'] as const;

function parsePositiveInt(value: string | null, fallback = 1): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

interface Group {
  id: string;
  name: string;
  membersCount: number;
  topic?: { name: string };
  github_repo_url?: string;
  jira_project_key?: string;
}

interface ClassWithGroups {
  id: string;
  code: string;
  name: string;
  semester: string;
  groups: Group[];
  loading: boolean;
  error: boolean;
}

interface FlattenedGroup {
  id: string;
  name: string;
  membersCount: number;
  topic?: { name: string };
  github_repo_url?: string;
  jira_project_key?: string;
  classId: string;
  classCode: string;
  className: string;
  semester: string;
}

function GroupsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const [classesWithGroups, setClassesWithGroups] = useState<ClassWithGroups[]>(
    [],
  );

  const getSearchState = () => {
    const q = searchParams.get('q') || '';
    const classId = searchParams.get('classId') || 'ALL';
    const integration = searchParams.get('integration') || 'ALL';
    const size = searchParams.get('size') || '12';
    const pageValue = parsePositiveInt(searchParams.get('page'), 1);

    return {
      q,
      classId,
      integration: INTEGRATION_OPTIONS.includes(
        integration as (typeof INTEGRATION_OPTIONS)[number],
      )
        ? integration
        : 'ALL',
      size: PAGE_SIZE_OPTIONS.includes(
        size as (typeof PAGE_SIZE_OPTIONS)[number],
      )
        ? size
        : '12',
      pageValue,
    };
  };

  const initialState = getSearchState();
  const [searchTerm, setSearchTerm] = useState(initialState.q);
  const [integrationFilter, setIntegrationFilter] = useState(
    initialState.integration,
  );
  const [selectedClassId, setSelectedClassId] = useState(initialState.classId);
  const [page, setPage] = useState(initialState.pageValue);
  const [pageSize, setPageSize] = useState(initialState.size);

  const replaceQuery = (next: {
    q?: string;
    classId?: string;
    integration?: string;
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

    if (next.classId !== undefined) {
      if (next.classId && next.classId !== 'ALL') {
        params.set('classId', next.classId);
      } else {
        params.delete('classId');
      }
    }

    if (next.integration !== undefined) {
      if (next.integration && next.integration !== 'ALL') {
        params.set('integration', next.integration);
      } else {
        params.delete('integration');
      }
    }

    if (next.size !== undefined) {
      if (next.size && next.size !== '12') {
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
    setSelectedClassId(state.classId);
    setIntegrationFilter(state.integration);
    setPageSize(state.size);
    setPage(state.pageValue);
  }, [searchParams]);

  useEffect(() => {
    if (!classes || classes.length === 0) return;

    // Init state with loading placeholders
    setClassesWithGroups(
      classes.map((c: any) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        semester: c.semester,
        groups: [],
        loading: true,
        error: false,
      })),
    );

    // Fetch groups for each class in parallel
    classes.forEach((c: any) => {
      groupAPI
        .getGroupsByClass(c.id)
        .then((groups) => {
          setClassesWithGroups((prev) =>
            prev.map((item) =>
              item.id === c.id
                ? { ...item, groups: groups ?? [], loading: false }
                : item,
            ),
          );
        })
        .catch(() => {
          setClassesWithGroups((prev) =>
            prev.map((item) =>
              item.id === c.id
                ? { ...item, loading: false, error: true }
                : item,
            ),
          );
        });
    });
  }, [classes]);

  const totalGroups = classesWithGroups.reduce(
    (sum, c) => sum + c.groups.length,
    0,
  );

  const allGroups = useMemo<FlattenedGroup[]>(() => {
    return classesWithGroups.flatMap((cls) =>
      cls.groups.map((group: any) => ({
        ...group,
        membersCount: group.membersCount ?? group.members_count ?? 0,
        classId: cls.id,
        classCode: cls.code,
        className: cls.name,
        semester: cls.semester,
      })),
    );
  }, [classesWithGroups]);

  const filteredGroups = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return allGroups.filter((group) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        group.name?.toLowerCase().includes(normalizedSearch) ||
        group.topic?.name?.toLowerCase().includes(normalizedSearch) ||
        group.classCode?.toLowerCase().includes(normalizedSearch) ||
        group.jira_project_key?.toLowerCase().includes(normalizedSearch);

      const matchesClass =
        selectedClassId === 'ALL' || group.classId === selectedClassId;

      const hasAllIntegrations =
        !!group.github_repo_url && !!group.jira_project_key;
      const hasMissingIntegrations =
        !group.github_repo_url || !group.jira_project_key;

      const matchesIntegration =
        integrationFilter === 'ALL' ||
        (integrationFilter === 'READY' && hasAllIntegrations) ||
        (integrationFilter === 'MISSING' && hasMissingIntegrations);

      return matchesSearch && matchesClass && matchesIntegration;
    });
  }, [allGroups, integrationFilter, searchTerm, selectedClassId]);

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

  useEffect(() => {
    if (
      selectedClassId !== 'ALL' &&
      classesWithGroups.length > 0 &&
      !classesWithGroups.some((item) => item.id === selectedClassId)
    ) {
      setSelectedClassId('ALL');
      setPage(1);
      replaceQuery({ classId: 'ALL', page: 1 });
    }
  }, [classesWithGroups, selectedClassId]);

  const paginatedGroups = useMemo(() => {
    const start = (safePage - 1) * Number(pageSize);
    return filteredGroups.slice(start, start + Number(pageSize));
  }, [filteredGroups, safePage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Student Groups</h1>
          <p className="text-muted-foreground mt-1">
            All groups across your classes — click a group to view details,
            commits, and reports.
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div className="text-2xl font-bold text-foreground">
            {totalGroups}
          </div>
          <div>total groups</div>
        </div>
      </div>

      {/* Loading state */}
      {classesLoading && (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-32 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!classesLoading && classesWithGroups.length > 0 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by group, topic, class, or Jira key"
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchTerm(value);
                    setPage(1);
                    replaceQuery({ q: value, page: 1 });
                  }}
                />
              </div>

              <Select
                value={selectedClassId}
                onValueChange={(value) => {
                  setSelectedClassId(value);
                  setPage(1);
                  replaceQuery({ classId: value, page: 1 });
                }}
              >
                <SelectTrigger className="w-full lg:w-56">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All classes</SelectItem>
                  {classesWithGroups.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.code} - {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={integrationFilter}
                onValueChange={(value) => {
                  setIntegrationFilter(value);
                  setPage(1);
                  replaceQuery({ integration: value, page: 1 });
                }}
              >
                <SelectTrigger className="w-full lg:w-44">
                  <SelectValue placeholder="Integrations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All groups</SelectItem>
                  <SelectItem value="READY">Jira + GitHub ready</SelectItem>
                  <SelectItem value="MISSING">Missing integration</SelectItem>
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
                <SelectTrigger className="w-full lg:w-36">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 / page</SelectItem>
                  <SelectItem value="12">12 / page</SelectItem>
                  <SelectItem value="16">16 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {paginatedGroups.length} of {filteredGroups.length} groups
            </div>
          </CardContent>
        </Card>
      )}

      {!classesLoading &&
        filteredGroups.length === 0 &&
        classesWithGroups.length > 0 && (
          <div className="p-10 border rounded-lg text-center text-muted-foreground bg-muted/10">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No groups match your filters.</p>
            <p className="text-sm mt-1">
              Try broadening search terms or selecting another class.
            </p>
          </div>
        )}

      {!classesLoading && paginatedGroups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedGroups.map((group, index) => {
            const displayIndex = (safePage - 1) * Number(pageSize) + index + 1;
            const classLabel = `${group.classCode} - ${group.className}`;

            return (
              <Card
                key={group.id}
                className="hover:border-primary hover:shadow-md transition-all cursor-pointer"
                onClick={() => router.push(`/lecturer/groups/${group.id}`)}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="flex justify-between items-start text-base gap-2">
                    <span className="font-semibold truncate">{group.name}</span>
                    <span className="text-xs font-normal text-muted-foreground bg-accent px-2 py-0.5 rounded-full shrink-0">
                      #{displayIndex}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{classLabel}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {group.topic?.name ?? (
                        <span className="italic text-muted-foreground">
                          No topic selected
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>{group.membersCount} / 5 members</span>
                  </div>

                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge
                      variant={group.jira_project_key ? 'default' : 'secondary'}
                    >
                      Jira {group.jira_project_key ? '✓' : '–'}
                    </Badge>
                    <Badge
                      variant={group.github_repo_url ? 'default' : 'secondary'}
                    >
                      GitHub {group.github_repo_url ? '✓' : '–'}
                    </Badge>
                    {group.github_repo_url && group.jira_project_key && (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
                        <Link2 className="mr-1 h-3 w-3" /> Ready
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/lecturer/classes/${group.classId}`);
                    }}
                  >
                    View class <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!classesLoading && paginatedGroups.length > 0 && (
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
      )}

      {/* Empty state */}
      {!classesLoading && classesWithGroups.length === 0 && (
        <div className="p-12 border rounded-lg text-center text-muted-foreground bg-muted/10">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No classes found.</p>
          <p className="text-sm mt-1">
            Create a class first from the Dashboard to see groups here.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => router.push('/lecturer')}
          >
            Go to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}

export default function GroupsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      }
    >
      <GroupsPageContent />
    </Suspense>
  );
}
