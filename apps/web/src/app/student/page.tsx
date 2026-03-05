'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClasses, useMyClasses } from '@/hooks/use-api';
import { useAuthStore } from '@/stores/authStore';
import { CheckCircle2, FolderGit2, Home } from 'lucide-react';
import { JoinClassModal } from './components/JoinClassModal';

export default function StudentDashboardPage() {
  const { user } = useAuthStore();
  const { data: classes, error, isLoading } = useMyClasses();
  const { data: allClasses, isLoading: isAllClassesLoading } = useClasses();

  // Filter out classes the student is already in
  const myClassIds = new Set(classes?.map((c: any) => c.id) || []);
  const availableClasses = allClasses?.filter(
    (c: any) => !myClassIds.has(c.id),
  );

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
      </div>

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
          (!availableClasses || availableClasses.length === 0) ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
              <FolderGit2 className="h-10 w-10 text-muted-foreground/50" />
              <p>No new classes available to join right now.</p>
            </div>
          ) : (
            <div className="divide-y">
              {availableClasses?.map(
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
