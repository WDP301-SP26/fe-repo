import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Activity, AlertTriangle, GitBranch, Users } from 'lucide-react';

export default function LecturerGroupsPage() {
  // Mock data - sẽ fetch từ API
  const groups = [
    {
      id: 'group-001',
      name: 'Group Alpha',
      project_name: 'E-Commerce Platform',
      members_count: 5,
      active_members: 4,
      total_commits: 234,
      last_activity: '2 hours ago',
      has_alerts: true,
      github_repo: 'org/ecommerce-platform',
    },
    {
      id: 'group-002',
      name: 'Group Beta',
      project_name: 'Social Media Dashboard',
      members_count: 4,
      active_members: 4,
      total_commits: 189,
      last_activity: '1 day ago',
      has_alerts: false,
      github_repo: 'org/social-dashboard',
    },
    {
      id: 'group-003',
      name: 'Group Gamma',
      project_name: 'Task Management System',
      members_count: 5,
      active_members: 3,
      total_commits: 156,
      last_activity: '3 hours ago',
      has_alerts: true,
      github_repo: 'org/task-manager',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Groups</h1>
        <p className="text-muted-foreground">
          Manage and monitor all your assigned groups
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{group.name}</CardTitle>
                  <CardDescription>{group.project_name}</CardDescription>
                </div>
                {group.has_alerts && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Alert
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {group.active_members}/{group.members_count} active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span>{group.total_commits} commits</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Last activity: {group.last_activity}</span>
              </div>

              <Button asChild className="w-full">
                <a href={`/lecturer/groups/${group.id}`}>View Details</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
