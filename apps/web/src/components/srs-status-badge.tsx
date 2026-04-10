'use client';

import { Badge } from '@/components/ui/badge';
import type { SrsVersionStatus } from '@/lib/api';

const statusConfig: Record<
  SrsVersionStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  SUBMITTED: { label: 'Submitted', variant: 'default' },
  APPROVED: { label: 'Approved', variant: 'outline' },
  CHANGES_REQUESTED: { label: 'Changes Requested', variant: 'destructive' },
};

export function SrsStatusBadge({ status }: { status: SrsVersionStatus }) {
  const config = statusConfig[status] ?? statusConfig.DRAFT;

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
