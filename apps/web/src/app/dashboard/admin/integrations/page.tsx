import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlugZap, ShieldAlert } from 'lucide-react';

export default function AdminIntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          System Integrations
        </h1>
        <p className="text-muted-foreground">
          Monitor external integration readiness and service health
          dependencies.
        </p>
      </div>

      <Alert className="border-amber-300/80 bg-amber-50/60 text-amber-900">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>No admin-level integration dashboard API yet</AlertTitle>
        <AlertDescription>
          Current backend integration endpoints are group-scoped, not a global
          admin aggregation endpoint.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PlugZap className="h-5 w-5" />
            Current Backend Coverage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start justify-between gap-3 rounded-md border p-3">
            <div>
              <p className="font-medium">Group integration status</p>
              <p className="text-muted-foreground">
                GET /groups/:id/integration-status
              </p>
            </div>
            <Badge>Available</Badge>
          </div>
          <div className="flex items-start justify-between gap-3 rounded-md border p-3">
            <div>
              <p className="font-medium">Group integration mappings</p>
              <p className="text-muted-foreground">
                GET /groups/:id/integrations
              </p>
            </div>
            <Badge>Available</Badge>
          </div>
          <div className="flex items-start justify-between gap-3 rounded-md border p-3">
            <div>
              <p className="font-medium">Admin-wide integration health board</p>
              <p className="text-muted-foreground">
                Requires aggregate admin endpoint and summary metrics.
              </p>
            </div>
            <Badge variant="secondary">Planned</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planned Controls</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Check GitHub/Jira linkage coverage by cohort.</p>
          <p>2. Verify AI provider configuration and usage status.</p>
          <p>3. Review secret management and environment consistency.</p>
        </CardContent>
      </Card>
    </div>
  );
}
