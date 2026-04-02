'use client';

import { LecturerReviewQuickPanel } from '@/components/lecturer-review-quick-panel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMyClasses } from '@/hooks/use-api';
import { semesterAPI } from '@/lib/api';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

const ALL_CLASSES = '__all_classes__';

type ClassOption = {
  id: string;
  label: string;
};

export default function LecturerReviewPointsPage() {
  const { data: classes } = useMyClasses();
  const [selectedClassId, setSelectedClassId] = useState<string>(ALL_CLASSES);

  const classId = selectedClassId === ALL_CLASSES ? undefined : selectedClassId;

  const {
    data: reviewSummary,
    isLoading: reviewLoading,
    mutate: mutateReviewSummary,
  } = useSWR(
    `/api/semesters/current/reviews/lecturer-summary${classId ? `?classId=${classId}` : ''}`,
    () => semesterAPI.getLecturerReviewSummary(classId),
  );

  const classOptions = useMemo<ClassOption[]>(
    () =>
      (classes ?? []).map(
        (item: { id: string; code: string; name: string }) => ({
          id: item.id,
          label: `${item.code} - ${item.name}`,
        }),
      ),
    [classes],
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

      <Card>
        <CardHeader>
          <CardTitle>Scope</CardTitle>
          <CardDescription>
            Choose a class to focus grading, or keep all classes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedClassId}
            onValueChange={(value) => setSelectedClassId(value)}
          >
            <SelectTrigger className="max-w-lg">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CLASSES}>All my classes</SelectItem>
              {classOptions.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <LecturerReviewQuickPanel
        summary={reviewSummary}
        isLoading={reviewLoading}
        classId={classId}
        onSaved={() => {
          void mutateReviewSummary();
        }}
      />
    </div>
  );
}
