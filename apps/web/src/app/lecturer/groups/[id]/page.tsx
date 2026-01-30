import { GitHubStats } from '@/components/github-stats';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertTriangle,
  ExternalLink,
  GitCommit,
  GitPullRequest,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Mock data - sẽ fetch từ API dựa trên id
  const group = {
    id,
    name: 'Group Alpha',
    project_name: 'E-Commerce Platform',
    description:
      'Building a full-stack e-commerce platform with React and Node.js',
    github_repo: 'https://github.com/org/ecommerce-platform',
    jira_project: 'ECOM',
    members: [
      {
        id: 'student-001',
        name: 'Nguyen Van A',
        email: 'studentA@fpt.edu.vn',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=studentA',
        commits: 89,
        prs: 12,
        is_active: true,
        last_commit: '2 hours ago',
        contribution_percent: 35,
      },
      {
        id: 'student-002',
        name: 'Tran Thi B',
        email: 'studentB@fpt.edu.vn',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=studentB',
        commits: 76,
        prs: 10,
        is_active: true,
        last_commit: '5 hours ago',
        contribution_percent: 30,
      },
      {
        id: 'student-003',
        name: 'Le Van C',
        email: 'studentC@fpt.edu.vn',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=studentC',
        commits: 58,
        prs: 8,
        is_active: true,
        last_commit: '1 day ago',
        contribution_percent: 23,
      },
      {
        id: 'student-004',
        name: 'Pham Thi D',
        email: 'studentD@fpt.edu.vn',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=studentD',
        commits: 11,
        prs: 2,
        is_active: false,
        last_commit: '2 weeks ago',
        contribution_percent: 4,
      },
      {
        id: 'student-005',
        name: 'Hoang Van E',
        email: 'studentE@fpt.edu.vn',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=studentE',
        commits: 20,
        prs: 3,
        is_active: false,
        last_commit: '1 week ago',
        contribution_percent: 8,
      },
    ],
    recent_activity: [
      {
        type: 'commit',
        author: 'Nguyen Van A',
        message: 'Add payment integration',
        time: '2 hours ago',
      },
      {
        type: 'pr',
        author: 'Tran Thi B',
        message: 'Feature: User authentication',
        time: '5 hours ago',
      },
      {
        type: 'commit',
        author: 'Le Van C',
        message: 'Fix: Product listing bug',
        time: '1 day ago',
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
          <p className="text-muted-foreground">{group.project_name}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {group.description}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href={group.github_repo}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              GitHub
            </a>
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            Jira: {group.jira_project}
          </Button>
        </div>
      </div>

      {/* GitHub Stats with Free-rider Detection */}
      <GitHubStats groupId={id} />

      {/* Members - Old View */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Contribution breakdown and activity status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.name}</p>
                      {!member.is_active && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last commit: {member.last_commit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <GitCommit className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{member.commits}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">commits</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{member.prs}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">PRs</p>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <div className="flex items-center gap-1 justify-end">
                      {member.contribution_percent >= 20 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-semibold">
                        {member.contribution_percent}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      contribution
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {group.recent_activity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                {activity.type === 'commit' ? (
                  <GitCommit className="h-5 w-5 text-muted-foreground mt-0.5" />
                ) : (
                  <GitPullRequest className="h-5 w-5 text-muted-foreground mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    by {activity.author} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
