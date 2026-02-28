'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { CheckCircle2, FolderGit2, Home } from 'lucide-react';

export default function StudentDashboardPage() {
  const { user } = useAuthStore();

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
            <p className="text-sm mb-2">
              Head over to <strong>My Projects</strong> to browse your
              repositories and link them to Jira.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
