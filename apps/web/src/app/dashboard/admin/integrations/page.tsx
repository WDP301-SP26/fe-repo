import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
