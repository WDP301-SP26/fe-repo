'use client';

import { LogoutButton } from '@/components/LogoutButton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useClasses } from '@/hooks/use-api';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { CreateClassModal } from './components/CreateClassModal';

export default function LecturerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: classes, error, isLoading } = useClasses();

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Classes</CardTitle>
            <CardDescription>Classes you're teaching</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-4xl font-bold text-muted-foreground">
                ...
              </div>
            ) : (
              <div className="text-4xl font-bold">{classes?.length || 0}</div>
            )}
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
                    }) => (
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
                        </div>
                        <Link
                          href={`/lecturer/classes/${c.id}`}
                          className="text-primary text-sm font-medium hover:underline p-2"
                        >
                          View 7 Groups &rarr;
                        </Link>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
