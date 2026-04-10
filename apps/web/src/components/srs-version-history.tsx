'use client';

import type { SrsVersion } from '@/lib/api';
import { SrsStatusBadge } from './srs-status-badge';

interface SrsVersionHistoryProps {
  versions: SrsVersion[];
  activeVersionId?: string;
  onSelect?: (version: SrsVersion) => void;
}

export function SrsVersionHistory({
  versions,
  activeVersionId,
  onSelect,
}: SrsVersionHistoryProps) {
  if (!versions.length) {
    return (
      <p className="text-sm text-muted-foreground">No versions created yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {versions.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onSelect?.(v)}
          className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
            v.id === activeVersionId
              ? 'border-primary bg-muted/30'
              : 'border-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">v{v.version_number}</span>
            <SrsStatusBadge status={v.status} />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {v.submittedBy?.full_name ?? 'Unknown'} &middot;{' '}
            {new Date(v.created_at).toLocaleDateString()}
          </div>
        </button>
      ))}
    </div>
  );
}
