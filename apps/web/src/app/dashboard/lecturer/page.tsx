import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LecturerDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lecturer Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your groups and students.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Groups</CardTitle>
            <CardDescription>Groups you're managing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">5</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
            <CardDescription>Currently ongoing projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">12</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Students</CardTitle>
            <CardDescription>Students under supervision</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">48</div>
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
            <button className="rounded-lg border p-4 text-left hover:bg-accent">
              <h3 className="font-semibold">View All Groups</h3>
              <p className="text-sm text-muted-foreground">
                See and manage your groups
              </p>
            </button>
            <button className="rounded-lg border p-4 text-left hover:bg-accent">
              <h3 className="font-semibold">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Check group performance and activity
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <h3 className="font-semibold text-primary">🎓 Test Credentials</h3>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            <strong>Email:</strong> lecturer@fpt.edu.vn
          </li>
          <li>
            <strong>Password:</strong> lecturer123
          </li>
          <li className="text-muted-foreground">
            (For development only - mock authentication)
          </li>
        </ul>
      </div>
    </div>
  );
}
