'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { groupAPI } from '@/lib/api';
import { useClasses } from '@/hooks/use-api';
import { GitBranch, Users, ChevronRight, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export default function GroupsPage() {
  const router = useRouter();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const [classesWithGroups, setClassesWithGroups] = useState<ClassWithGroups[]>(
    [],
  );

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

      {/* Classes + Groups */}
      {!classesLoading &&
        classesWithGroups.map((cls) => (
          <div key={cls.id} className="space-y-3">
            {/* Class header */}
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">
                  {cls.code} — {cls.name}
                </h2>
                <span className="text-xs text-muted-foreground">
                  Semester: {cls.semester}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-xs"
                onClick={() => router.push(`/lecturer/classes/${cls.id}`)}
              >
                View class <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            {/* Groups grid */}
            {cls.loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            )}
            {cls.error && (
              <p className="text-sm text-red-500 pl-8">
                Failed to load groups for this class.
              </p>
            )}
            {!cls.loading && !cls.error && cls.groups.length === 0 && (
              <p className="text-sm text-muted-foreground italic pl-8">
                No groups in this class yet.
              </p>
            )}
            {!cls.loading && !cls.error && cls.groups.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cls.groups.map((group: any, index: number) => (
                  <Card
                    key={group.id}
                    className="hover:border-primary hover:shadow-md transition-all cursor-pointer"
                    onClick={() => router.push(`/lecturer/groups/${group.id}`)}
                  >
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="flex justify-between items-start text-base">
                        <span className="font-semibold truncate">
                          {group.name}
                        </span>
                        <span className="text-xs font-normal text-muted-foreground bg-accent px-2 py-0.5 rounded-full shrink-0 ml-2">
                          #{index + 1}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2">
                      {/* Topic */}
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
                      {/* Members */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4 shrink-0" />
                        <span>{group.membersCount ?? 0} / 5 members</span>
                      </div>
                      {/* Integrations */}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {group.jira_project_key ? (
                          <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200 font-medium">
                            Jira ✓
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full border font-medium">
                            Jira –
                          </span>
                        )}
                        {group.github_repo_url ? (
                          <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200 font-medium">
                            GitHub ✓
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full border font-medium">
                            GitHub –
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}

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
