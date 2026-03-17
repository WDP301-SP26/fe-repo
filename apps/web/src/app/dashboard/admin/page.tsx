import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Admin routing is now stable. This area is intentionally scoped down
          until the full admin workflow is implemented.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Release-safe admin fallback</CardTitle>
          <CardDescription>
            The admin role now lands on an existing route instead of a missing
            page.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use this page as the guarded entry point for future admin features.
        </CardContent>
      </Card>
    </div>
  );
}
