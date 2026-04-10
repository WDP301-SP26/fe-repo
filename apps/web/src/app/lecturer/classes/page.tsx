'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyClasses } from '@/hooks/use-api';
import { groupAPI } from '@/lib/api';
import { BookOpen, ChevronRight, Layers3, Users2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type LecturerClass = {
  id: string;
  code: string;
  name: string;
  semester: string;
  enrollment_key?: string | null;
};

type ClassWithGroupCount = LecturerClass & {
  groupsCount: number;
  groupsLoading: boolean;
  groupsError: boolean;
};

export default function LecturerClassesPage() {
  const router = useRouter();
  const { data: classes, isLoading, error } = useMyClasses();
  const [classesWithCounts, setClassesWithCounts] = useState<
    ClassWithGroupCount[]
  >([]);

  useEffect(() => {
    const myClasses = (classes ?? []) as LecturerClass[];
    if (myClasses.length === 0) {
      setClassesWithCounts([]);
      return;
    }

    setClassesWithCounts(
      myClasses.map((item) => ({
        ...item,
        groupsCount: 0,
        groupsLoading: true,
        groupsError: false,
      })),
    );

    myClasses.forEach((item) => {
      groupAPI
        .getGroupsByClass(item.id)
        .then((groups) => {
          setClassesWithCounts((current) =>
            current.map((row) =>
              row.id === item.id
                ? {
                    ...row,
                    groupsCount: groups?.length ?? 0,
                    groupsLoading: false,
                  }
                : row,
            ),
          );
        })
        .catch(() => {
          setClassesWithCounts((current) =>
            current.map((row) =>
              row.id === item.id
                ? {
                    ...row,
                    groupsCount: 0,
                    groupsLoading: false,
                    groupsError: true,
                  }
                : row,
            ),
          );
        });
    });
  }, [classes]);

  const totalGroups = useMemo(
    () => classesWithCounts.reduce((sum, item) => sum + item.groupsCount, 0),
    [classesWithCounts],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Classes</h1>
          <p className="mt-1 text-muted-foreground">
            This semester you are assigned to {classesWithCounts.length} class
            {classesWithCounts.length === 1 ? '' : 'es'}. Click a class to view
            its groups.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assigned Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{classesWithCounts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalGroups}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Navigation Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Class <span className="mx-1">-&gt;</span> Groups
            <span className="mx-1">-&gt;</span> Group details
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-40 w-full" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Failed to load classes.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && classesWithCounts.length === 0 && (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-50" />
            You are not assigned to any class in the current semester yet.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && classesWithCounts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classesWithCounts.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer transition-colors hover:border-primary hover:shadow-md"
              onClick={() => router.push(`/lecturer/classes/${item.id}`)}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">
                    {item.code} - {item.name}
                  </CardTitle>
                  <Badge variant="outline">{item.semester}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.enrollment_key ? (
                  <div className="rounded-md border bg-accent/40 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">
                      Enrollment key:{' '}
                    </span>
                    <span className="font-mono font-semibold select-all cursor-text">
                      {item.enrollment_key}
                    </span>
                  </div>
                ) : null}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Layers3 className="h-4 w-4" />
                  {item.groupsLoading
                    ? 'Loading groups...'
                    : item.groupsError
                      ? 'Cannot load groups'
                      : `${item.groupsCount} group${item.groupsCount === 1 ? '' : 's'}`}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users2 className="h-4 w-4" />
                  Click to open groups in this class
                </div>

                <Button className="w-full" variant="outline">
                  Open class groups
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
