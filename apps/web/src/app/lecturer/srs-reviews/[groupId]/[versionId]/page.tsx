'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { srsAPI } from '@/lib/api';
import { useSrsDocument } from '@/hooks/use-api';
import { SrsMarkdownViewer } from '@/components/srs-markdown-viewer';
import { SrsReviewPanel } from '@/components/srs-review-panel';
import { SrsStatusBadge } from '@/components/srs-status-badge';
import { SrsVersionHistory } from '@/components/srs-version-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{ groupId: string; versionId: string }>;
}

export default function SrsReviewPage({ params }: PageProps) {
  const { groupId, versionId } = use(params);
  const router = useRouter();

  const {
    data: version,
    isLoading: versionLoading,
    mutate: mutateVersion,
  } = useSWR(`/api/srs/group/${groupId}/versions/${versionId}`, () =>
    srsAPI.getVersion(groupId, versionId),
  );

  const { data: doc, mutate: mutateDoc } = useSrsDocument(groupId);

  const handleReviewed = () => {
    void mutateVersion();
    void mutateDoc();
  };

  if (versionLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!version) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Version not found.</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/lecturer/srs-reviews">Back to submissions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/lecturer/srs-reviews" className="hover:underline">
          SRS Submissions
        </Link>
        <span>/</span>
        <span>v{version.version_number}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left panel — SRS content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>SRS v{version.version_number}</CardTitle>
                <SrsStatusBadge status={version.status} />
              </div>
            </CardHeader>
            <CardContent>
              <SrsMarkdownViewer content={version.content} />
            </CardContent>
          </Card>
        </div>

        {/* Right panel — metadata + review */}
        <div className="space-y-6">
          {/* Version metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Version Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted by</span>
                <span>{version.submittedBy?.full_name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted at</span>
                <span>
                  {version.submitted_at
                    ? new Date(version.submitted_at).toLocaleString()
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created at</span>
                <span>{new Date(version.created_at).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Review panel */}
          <SrsReviewPanel version={version} onReviewed={handleReviewed} />

          {/* Version history */}
          {doc?.versions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Version History</CardTitle>
              </CardHeader>
              <CardContent>
                <SrsVersionHistory
                  versions={doc.versions}
                  activeVersionId={versionId}
                  onSelect={(v) =>
                    router.push(`/lecturer/srs-reviews/${groupId}/${v.id}`)
                  }
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
