'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClasses, useMyClasses } from '@/hooks/use-api';
import { semesterAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { AlertTriangle, CheckCircle2, FolderGit2, Home } from 'lucide-react';
import useSWR from 'swr';
import { JoinClassModal } from './components/JoinClassModal';

export default function StudentDashboardPage() {
  const { user } = useAuthStore();
  const { data: classes, error, isLoading } = useMyClasses();
  const { data: allClasses, isLoading: isAllClassesLoading } = useClasses();
  const { data: currentSemester } = useSWR('/api/semesters/current', () =>
    semesterAPI.getCurrentSemester(),
  );
  const { data: weeklyWarnings } = useSWR(
    user ? '/api/semesters/current/compliance/student-warning' : null,
    () => semesterAPI.getStudentWarnings(),
  );
  const { data: reviewStatus } = useSWR(
    user ? '/api/semesters/current/reviews/student-status' : null,
    () => semesterAPI.getStudentReviewStatus(),
  );

  // Filter out classes the student is already in
  const myClassIds = new Set(classes?.map((c: any) => c.id) || []);
  const availableClasses = allClasses?.filter(
    (c: any) => !myClassIds.has(c.id),
  );
  const currentSemesterCode = currentSemester?.code || null;
  const prioritizedAvailableClasses =
    currentSemesterCode && availableClasses
      ? [
          ...availableClasses.filter(
            (c: any) => c.semester === currentSemesterCode,
          ),
          ...availableClasses.filter(
            (c: any) => c.semester !== currentSemesterCode,
          ),
        ]
      : availableClasses;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Your GitHub account is successfully linked. You can now manage your
          projects and track contributions.
        </p>
        <p className="text-sm text-muted-foreground">
          Current semester:{' '}
          <span className="font-semibold text-foreground">
            {currentSemesterCode || 'Not configured yet'}
          </span>
          {currentSemester?.current_week ? (
            <span className="ml-2">
              • Week{' '}
              <span className="font-semibold text-foreground">
                {currentSemester.current_week}
              </span>
            </span>
          ) : null}
        </p>
      </div>

      {weeklyWarnings?.warnings?.length ? (
        <Card className="border-amber-300/70 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-5 w-5" />
              Week-based warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weeklyWarnings.warnings.map((warning) => (
              <div
                key={`${warning.code}-${warning.class_id}-${warning.group_id ?? 'nogroup'}`}
                className="rounded-md border border-amber-200 bg-white/70 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{warning.code}</Badge>
                  <span className="text-sm font-medium">
                    {warning.class_code} - {warning.class_name}
                  </span>
                  {warning.group_name ? (
                    <span className="text-xs text-muted-foreground">
                      Group: {warning.group_name}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {warning.message}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : currentSemester?.current_week ? (
        <Card className="border-emerald-300/70 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="text-emerald-900">
              Week-based warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-emerald-900">
            No active week-1 or week-2 compliance warnings for the current
            semester.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Current Review Milestone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reviewStatus?.milestone ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{reviewStatus.milestone.label}</Badge>
                <span className="text-sm text-muted-foreground">
                  Week {reviewStatus.milestone.week_start}-
                  {reviewStatus.milestone.week_end}
                </span>
              </div>
              {reviewStatus.groups.length ? (
                <div className="space-y-3">
                  {reviewStatus.groups.map((group) => (
                    <div
                      key={`${group.class_id}-${group.group_id}`}
                      className="rounded-md border p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {group.class_code} - {group.group_name}
                        </span>
                        <Badge
                          variant={
                            group.review_status === 'REVIEWED'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {group.review_status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {group.topic_name || 'Topic not finalized yet'}
                      </div>
                      {group.warnings.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {group.warnings.map((warning) => (
                            <Badge key={warning} variant="destructive">
                              {warning}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-emerald-700">
                          Review evidence is available for this milestone.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No joined group is mapped into the current review milestone
                  yet.
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              No grouped review milestone is active yet. Review checkpoints
              begin from week 3.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm border-l-4 border-l-primary transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              GitHub Status
            </CardTitle>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Connected</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready to sync commits
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Active Projects
            </CardTitle>
            <FolderGit2 className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Jira-GitHub linked projects
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm transition-all hover:shadow-md bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-primary">
              Getting Started
            </CardTitle>
            <Home className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Ask your Lecturer for the Class ID and Enrollment Key to access
              your groups.
            </p>
            <JoinClassModal />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">My Classes</h2>
        <div className="rounded-md border bg-card">
          {isLoading && (
            <div className="p-4 text-center">Loading classes...</div>
          )}
          {error && (
            <div className="p-4 text-center text-red-500">
              Failed to load classes.
            </div>
          )}
          {!isLoading && !error && (!classes || classes.length === 0) ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <FolderGit2 className="h-10 w-10 text-muted-foreground/50" />
              <p>You haven't joined any classes yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {classes?.map(
                (c: {
                  id: string;
                  code: string;
                  name: string;
                  semester: string;
                }) => (
                  <a
                    key={c.id}
                    href={`/student/classes/${c.id}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-lg">
                        {c.code} - {c.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Semester: {c.semester}
                      </div>
                    </div>
                    <div className="text-primary text-sm font-medium">
                      View & Join Groups &rarr;
                    </div>
                  </a>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Available Classes</h2>
        <div className="rounded-md border bg-card">
          {isAllClassesLoading && (
            <div className="p-4 text-center">Loading available classes...</div>
          )}
          {!isAllClassesLoading &&
          (!prioritizedAvailableClasses ||
            prioritizedAvailableClasses.length === 0) ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <FolderGit2 className="h-10 w-10 text-muted-foreground/50" />
              <p>No new classes available to join right now.</p>
            </div>
          ) : (
            <div className="divide-y">
              {prioritizedAvailableClasses?.map(
                (c: {
                  id: string;
                  code: string;
                  name: string;
                  semester: string;
                }) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-4 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-lg">
                        {c.code} - {c.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Semester: {c.semester}
                      </div>
                    </div>
                    <JoinClassModal
                      defaultClassId={c.id}
                      defaultClassName={`${c.code} - ${c.name}`}
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
