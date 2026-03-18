import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage user lifecycle, role assignment, and account status governance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planned Controls</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Search and filter users by role, class, and activity.</p>
          <p>2. Promote/demote roles with policy checks.</p>
          <p>3. Review account health and integration status.</p>
        </CardContent>
      </Card>
    </div>
  );
}
