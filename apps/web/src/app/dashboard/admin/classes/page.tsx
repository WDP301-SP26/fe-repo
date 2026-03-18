import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminClassesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Class Management</h1>
        <p className="text-muted-foreground">
          Oversee class provisioning, enrollment health, and group distribution
          quality.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planned Controls</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Track class setup and enrollment import quality.</p>
          <p>2. Detect under-populated groups and rebalance suggestions.</p>
          <p>3. Verify semester configuration and naming consistency.</p>
        </CardContent>
      </Card>
    </div>
  );
}
