'use client';

import { semesterAPI } from '@/lib/api';
import dynamic from 'next/dynamic';
import useSWR from 'swr';

const LecturerReviewQuickPanel = dynamic(
  () =>
    import('@/components/lecturer-review-quick-panel').then(
      (m) => m.LecturerReviewQuickPanel,
    ),
  { ssr: false },
);

export default function LecturerReviewPointsPage() {
  const {
    data: reviewSummary,
    isLoading: reviewLoading,
    mutate: mutateReviewSummary,
  } = useSWR('/api/semesters/current/reviews/lecturer-summary', () =>
    semesterAPI.getLecturerReviewSummary(),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Review Point Scoring</h1>
        <p className="text-muted-foreground mt-1">
          Grade student groups by milestone review points and publish checkpoint
          scores.
        </p>
      </div>

      <LecturerReviewQuickPanel
        summary={reviewSummary}
        isLoading={reviewLoading}
        onSaved={() => {
          void mutateReviewSummary();
        }}
      />
    </div>
  );
}
