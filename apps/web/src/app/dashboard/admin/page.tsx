import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Control plane for role governance, class operations, and system
          integration health.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Role and account governance.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/admin/users"
              className="text-sm font-medium text-primary underline"
            >
              Open user controls
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class Management</CardTitle>
            <CardDescription>
              Class and group operational quality.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/admin/classes"
              className="text-sm font-medium text-primary underline"
            >
              Open class controls
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Integrations</CardTitle>
            <CardDescription>
              Dependencies and secret readiness.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/admin/integrations"
              className="text-sm font-medium text-primary underline"
            >
              Open integration controls
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
