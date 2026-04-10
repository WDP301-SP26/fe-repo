'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { srsAPI, type SrsVersion } from '@/lib/api';

interface SrsReviewPanelProps {
  version: SrsVersion;
  onReviewed: () => void;
}

export function SrsReviewPanel({ version, onReviewed }: SrsReviewPanelProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReview = async (status: 'APPROVED' | 'CHANGES_REQUESTED') => {
    setIsSubmitting(true);
    try {
      await srsAPI.reviewVersion(version.id, {
        status,
        feedback: feedback.trim() || undefined,
      });
      toast.success(
        status === 'APPROVED'
          ? 'SRS version approved'
          : 'Changes requested — draft restored for student',
      );
      onReviewed();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (version.status !== 'SUBMITTED') {
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <h4 className="text-sm font-semibold">Review</h4>
        {version.reviewed_by_id ? (
          <>
            <p className="text-sm text-muted-foreground">
              Reviewed by {version.reviewedBy?.full_name ?? 'Lecturer'} on{' '}
              {version.reviewed_at
                ? new Date(version.reviewed_at).toLocaleDateString()
                : '—'}
            </p>
            {version.feedback && (
              <div className="rounded bg-muted p-3 text-sm">
                {version.feedback}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            This version has not been submitted for review.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h4 className="text-sm font-semibold">Review this submission</h4>
      <textarea
        className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        rows={4}
        placeholder="Feedback (optional)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
      <div className="flex gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="flex-1"
              variant="default"
              disabled={isSubmitting}
            >
              Approve
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Approve SRS v{version.version_number}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the version as approved. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleReview('APPROVED')}>
                Approve
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="flex-1"
              variant="outline"
              disabled={isSubmitting}
            >
              Request Changes
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Request changes for SRS v{version.version_number}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                The version content will be restored as the group&apos;s draft
                so they can revise and resubmit.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleReview('CHANGES_REQUESTED')}
              >
                Request Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
