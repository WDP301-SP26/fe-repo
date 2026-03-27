'use client';

import { LogoutButton } from '@/components/LogoutButton';
import { DemoWeekOverrideCard } from '@/components/demo-week-override-card';
import { LecturerReviewQuickPanel } from '@/components/lecturer-review-quick-panel';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useClasses } from '@/hooks/use-api';
import { semesterAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import useSWR from 'swr';
import { CreateClassModal } from './components/CreateClassModal';

export default function LecturerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: classes, error, isLoading } = useClasses();
  const {
    data: complianceSummary,
    isLoading: governanceLoading,
    mutate: mutateComplianceSummary,
  } = useSWR(
    user ? '/api/semesters/current/compliance/lecturer-summary' : null,
    () => semesterAPI.getLecturerComplianceSummary(),
  );
  const {
    data: reviewSummary,
    isLoading: reviewLoading,
    mutate: mutateReviewSummary,
  } = useSWR(
    user ? '/api/semesters/current/reviews/lecturer-summary' : null,
    () => semesterAPI.getLecturerReviewSummary(),
  );
  const currentSemester = complianceSummary?.semester;
  const currentWeek = currentSemester?.current_week;
  const classComplianceMap = new Map(
    complianceSummary?.classes?.map((item) => [item.class_id, item]) ?? [],
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lecturer Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.full_name || 'Lecturer'}! Manage your classes
            and groups here.
          </p>
        </div>
        <CreateClassModal />
      </div>

      <DemoWeekOverrideCard
        semester={currentSemester ?? null}
        onUpdated={async () => {
          await Promise.all([mutateComplianceSummary(), mutateReviewSummary()]);
        }}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Current Week</CardTitle>
            <CardDescription>Semester governance checkpoint</CardDescription>
          </CardHeader>
          <CardContent>
            {governanceLoading ? (
              <div className="text-4xl font-bold text-muted-foreground">
                ...
              </div>
            ) : (
              <>
                <div className="text-4xl font-bold">
                  {currentSemester?.current_week ?? '-'}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {currentSemester
                    ? `${currentSemester.code} - ${currentSemester.name}`
                    : 'No current semester configured'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Review Milestone</CardTitle>
            <CardDescription>Grouped week review window</CardDescription>
          </CardHeader>
          <CardContent>
            {reviewLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">
                ...
              </div>
            ) : reviewSummary?.milestone ? (
              <>
                <div className="text-2xl font-bold">
                  {reviewSummary.milestone.label}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Week {reviewSummary.milestone.week_start}-
                  {reviewSummary.milestone.week_end}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">No active review</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Grouped review windows start from week 3.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Week 1 Gate</CardTitle>
            <CardDescription>Students assigned into groups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {complianceSummary
                ? `${complianceSummary.summary.classes_passing_week1}/${complianceSummary.summary.classes_total}`
                : '...'}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {complianceSummary?.summary.students_without_group_total ?? 0}{' '}
              students still without a group
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Week 2 Gate</CardTitle>
            <CardDescription>Groups with finalized topics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {complianceSummary
                ? `${complianceSummary.summary.classes_passing_week2}/${complianceSummary.summary.classes_total}`
                : '...'}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {complianceSummary?.summary.groups_without_topic_total ?? 0}{' '}
              groups still without a finalized topic
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Review Coverage</CardTitle>
            <CardDescription>
              Review capture and evidence visibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {reviewSummary
                ? `${reviewSummary.summary.reviewed_groups}/${reviewSummary.summary.groups_total}`
                : '...'}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {reviewSummary?.summary.groups_missing_task_evidence ?? 0} groups
              missing task evidence,{' '}
              {reviewSummary?.summary.groups_missing_commit_evidence ?? 0}{' '}
              missing commit evidence
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Active Classes</CardTitle>
            <CardDescription>
              Click to view groups and manage topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              {isLoading && (
                <div className="p-4 text-center">Loading classes...</div>
              )}
              {error && (
                <div className="p-4 text-center text-red-500">
                  Failed to load classes.
                </div>
              )}
              {!isLoading && !error && (!classes || classes.length === 0) ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No classes created yet. Click "Create Class" above to start.
                </div>
              ) : (
                <div className="divide-y">
                  {classes?.map(
                    (c: {
                      id: string;
                      code: string;
                      name: string;
                      semester: string;
                      enrollment_key: string;
                    }) => {
                      const classCompliance = classComplianceMap.get(c.id);

                      return (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div>
                            <div className="font-bold text-lg">
                              {c.code} - {c.name}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Semester: {c.semester} | Enrollment Key:{' '}
                              <span className="font-mono font-semibold bg-accent px-2 py-0.5 rounded select-all cursor-text">
                                {c.enrollment_key}
                              </span>
                            </div>
                            {classCompliance && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Badge
                                  variant={
                                    currentWeek && currentWeek < 1
                                      ? 'outline'
                                      : classCompliance.week1_status === 'PASS'
                                        ? 'default'
                                        : 'destructive'
                                  }
                                  className={
                                    currentWeek === 1
                                      ? 'ring-2 ring-primary/30'
                                      : undefined
                                  }
                                >
                                  {currentWeek && currentWeek < 1
                                    ? 'Week 1 PENDING'
                                    : `Week 1 ${classCompliance.week1_status}${currentWeek === 1 ? ' (ACTIVE)' : ''}`}
                                </Badge>
                                <Badge
                                  variant={
                                    currentWeek && currentWeek < 2
                                      ? 'outline'
                                      : classCompliance.week2_status === 'PASS'
                                        ? 'default'
                                        : 'destructive'
                                  }
                                  className={
                                    currentWeek === 2
                                      ? 'ring-2 ring-primary/30'
                                      : undefined
                                  }
                                >
                                  {currentWeek && currentWeek < 2
                                    ? 'Week 2 PENDING'
                                    : `Week 2 ${classCompliance.week2_status}${currentWeek === 2 ? ' (ACTIVE)' : ''}`}
                                </Badge>
                                {classCompliance.students_without_group_count >
                                  0 && (
                                  <Badge variant="secondary">
                                    {
                                      classCompliance.students_without_group_count
                                    }{' '}
                                    student(s) missing group
                                  </Badge>
                                )}
                                {classCompliance.groups_without_topic_count >
                                  0 && (
                                  <Badge variant="secondary">
                                    {classCompliance.groups_without_topic_count}{' '}
                                    group(s) missing topic
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <Link
                            href={`/lecturer/classes/${c.id}`}
                            className="text-primary text-sm font-medium hover:underline p-2"
                          >
                            View 7 Groups &rarr;
                          </Link>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <LecturerReviewQuickPanel
            summary={reviewSummary}
            isLoading={reviewLoading}
            onSaved={() => {
              void mutateReviewSummary();
            }}
          />
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <a
              href="/lecturer/groups"
              className="rounded-lg border p-4 text-left hover:bg-accent block"
            >
              <h3 className="font-semibold">View All Groups</h3>
              <p className="text-sm text-muted-foreground">
                See and manage your groups
              </p>
            </a>
            <a
              href="/lecturer/analytics"
              className="rounded-lg border p-4 text-left hover:bg-accent block"
            >
              <h3 className="font-semibold">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Check group performance and activity
              </p>
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <LogoutButton />
      </div>
    </div>
  );
}
