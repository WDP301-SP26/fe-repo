'use client';

import { LogoutButton } from '@/components/LogoutButton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';

interface Group {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  jira_project_key: string | null;
}

export default function LecturerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [groups, setGroups] = useState<Group[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    // Fetch MSW Mock Data
    const fetchData = async () => {
      try {
        // Delay to allow MSW service worker to activate on initial load
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log('Fetching groups and projects...');

        const [groupsRes, projectsRes] = await Promise.all([
          fetch('/api/groups'),
          fetch('/api/projects'),
        ]);

        if (groupsRes.ok) {
          const groupsData = await groupsRes.json();
          console.log('Groups fetched successfully:', groupsData);
          setGroups(groupsData);
        } else {
          console.error(
            'Failed to fetch groups:',
            groupsRes.status,
            groupsRes.statusText,
          );
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          console.log('Projects fetched successfully:', projectsData);
          setProjects(projectsData);
        } else {
          console.error(
            'Failed to fetch projects:',
            projectsRes.status,
            projectsRes.statusText,
          );
        }
      } catch (error) {
        console.error('Error fetching mock data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lecturer Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.full_name || 'Lecturer'}! Here's an overview of
          your assigned groups and projects.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Groups</CardTitle>
            <CardDescription>Groups you're managing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{groups.length}</div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Student Projects</CardTitle>
            <CardDescription>Click to view evaluation reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              {projects.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No projects found.
                </div>
              ) : (
                <div className="divide-y">
                  {projects.map((project: Project) => (
                    <a
                      key={project.id}
                      href={`/lecturer/projects/${project.id}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.jira_project_key}
                        </div>
                      </div>
                      <div className="text-primary text-sm font-medium">
                        View Report &rarr;
                      </div>
                    </a>
                  ))}
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

      <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 p-4 md:flex-row md:items-center">
        <div>
          <h3 className="font-semibold text-primary">🎓 Test Credentials</h3>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <strong>Email:</strong> lecturer1@fe.edu.vn
            </li>
            <li>
              <strong>Password:</strong> password123
            </li>
            <li className="text-muted-foreground">
              (For development only - mock authentication)
            </li>
          </ul>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
