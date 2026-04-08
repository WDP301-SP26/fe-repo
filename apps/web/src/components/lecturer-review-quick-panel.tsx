'use client';

import { semesterAPI, type LecturerReviewSummary } from '@/lib/api';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
} from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

type DraftState = Record<
  string,
  {
    task_progress_score: string;
    commit_contribution_score: string;
    review_milestone_score: string;
    lecturer_note: string;
    isSaving?: boolean;
    error?: string | null;
  }
>;

interface LecturerReviewQuickPanelProps {
  summary?: LecturerReviewSummary;
  isLoading: boolean;
  onSaved?: () => void;
  classId?: string;
}

function toDraft(summary?: LecturerReviewSummary): DraftState {
  const entries = summary?.classes.flatMap((item) => item.groups) ?? [];
  return Object.fromEntries(
    entries.map((group) => [
      group.group_id,
      {
        task_progress_score: group.scores.task_progress_score?.toString() ?? '',
        commit_contribution_score:
          group.scores.commit_contribution_score?.toString() ?? '',
        review_milestone_score:
          group.scores.review_milestone_score?.toString() ?? '',
        lecturer_note: group.lecturer_note ?? '',
        isSaving: false,
        error: null,
      },
    ]),
  );
}

export function LecturerReviewQuickPanel({
  summary,
  isLoading,
  onSaved,
  classId,
}: LecturerReviewQuickPanelProps) {
  const [drafts, setDrafts] = useState<DraftState>(() => toDraft(summary));
  const [publishingClassId, setPublishingClassId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setDrafts(toDraft(summary));
  }, [summary]);

  const handleChange = (
    groupId: string,
    field:
      | 'task_progress_score'
      | 'commit_contribution_score'
      | 'review_milestone_score'
      | 'lecturer_note',
    value: string,
  ) => {
    setDrafts((current) => ({
      ...current,
      [groupId]: {
        ...current[groupId],
        [field]: value,
        error: null,
      },
    }));
  };

  const handleSave = async (groupId: string) => {
    const draft = drafts[groupId];
    if (!draft) {
      return;
    }

    setDrafts((current) => ({
      ...current,
      [groupId]: {
        ...current[groupId],
        isSaving: true,
        error: null,
      },
    }));

    try {
      await semesterAPI.upsertCurrentGroupReview(groupId, {
        task_progress_score: draft.task_progress_score
          ? Number(draft.task_progress_score)
          : undefined,
        commit_contribution_score: draft.commit_contribution_score
          ? Number(draft.commit_contribution_score)
          : undefined,
        review_milestone_score: draft.review_milestone_score
          ? Number(draft.review_milestone_score)
          : undefined,
        lecturer_note: draft.lecturer_note || undefined,
      });
      setDrafts((current) => ({
        ...current,
        [groupId]: {
          ...current[groupId],
          isSaving: false,
          error: null,
        },
      }));
      onSaved?.();
    } catch (error) {
      setDrafts((current) => ({
        ...current,
        [groupId]: {
          ...current[groupId],
          isSaving: false,
          error:
            error instanceof Error ? error.message : 'Failed to save review.',
        },
      }));
    }
  };

  const handlePublishClass = async (classId: string) => {
    const classItem = summary?.classes.find((c) => c.class_id === classId);
    if (!classItem?.active_checkpoint) {
      return;
    }

    setPublishingClassId(classId);
    try {
      const result = await semesterAPI.publishMilestoneReviews({
        milestone_code: classItem.active_checkpoint.code,
        class_id: classId,
      });
      toast.success(
        result.updated_count > 0
          ? `Published ${result.updated_count} review(s) for ${classItem.class_code} — ${classItem.active_checkpoint.label}.`
          : `No draft review found to publish for ${classItem.class_code}.`,
      );
      onSaved?.();
    } catch (error) {
      toast.error('Failed to publish milestone reviews.', {
        description:
          error instanceof Error ? error.message : 'Unexpected error.',
      });
    } finally {
      setPublishingClassId(null);
    }
  };

  const hasAnyActiveMilestone = summary?.classes.some(
    (c) => c.active_checkpoint,
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Loading review milestone...
        </CardContent>
      </Card>
    );
  }

  if (!hasAnyActiveMilestone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No active checkpoint for any class. Review windows are configured per
          class in the checkpoint settings.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Classes</div>
            <div className="text-2xl font-semibold">
              {summary?.summary.classes_total ?? 0}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Groups</div>
            <div className="text-2xl font-semibold">
              {summary?.summary.groups_total ?? 0}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Reviewed</div>
            <div className="text-2xl font-semibold">
              {summary?.summary.reviewed_groups ?? 0}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">
              Missing Evidence
            </div>
            <div className="text-2xl font-semibold">
              {(summary?.summary.groups_missing_task_evidence ?? 0) +
                (summary?.summary.groups_missing_commit_evidence ?? 0)}
            </div>
          </div>
        </div>

        {summary?.classes.map((classItem) => {
          const checkpoint = classItem.active_checkpoint;
          const classGroups = classItem.groups;
          const classReviewedCount = classGroups.filter(
            (g) => g.review_status === 'REVIEWED',
          ).length;
          const allClassReviewed =
            classGroups.length > 0 && classReviewedCount === classGroups.length;
          const isPublishing = publishingClassId === classItem.class_id;
          const canPublishClass =
            !!checkpoint && allClassReviewed && !isPublishing;
          const classPublishBlocker = !checkpoint
            ? 'No active checkpoint for this class.'
            : classGroups.length === 0
              ? 'No groups in this class.'
              : !allClassReviewed
                ? 'Review every group before publishing.'
                : null;

          return (
            <div key={classItem.class_id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">
                    {classItem.class_code} - {classItem.class_name}
                  </h3>
                  {checkpoint && (
                    <p className="text-sm text-muted-foreground">
                      {checkpoint.label} — Week {checkpoint.week_start} to{' '}
                      {checkpoint.week_end}
                      {checkpoint.description && (
                        <span className="block mt-1 text-xs italic">
                          Requirements: {checkpoint.description}
                        </span>
                      )}
                    </p>
                  )}
                  {!checkpoint && (
                    <p className="text-xs text-muted-foreground">
                      No active checkpoint this week.
                    </p>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" disabled={!canPublishClass}>
                      {isPublishing ? 'Publishing...' : 'Publish'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Publish scores for {classItem.class_code}?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <span className="block">
                          Finalize scores for{' '}
                          <strong>
                            {checkpoint?.label} ({checkpoint?.code})
                          </strong>{' '}
                          in class {classItem.class_code}.
                        </span>
                        <span className="block">
                          Reviewed: <strong>{classReviewedCount}</strong> /{' '}
                          {classGroups.length} groups
                        </span>
                        {classPublishBlocker && (
                          <span className="block text-destructive">
                            {classPublishBlocker}
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handlePublishClass(classItem.class_id)}
                        disabled={!canPublishClass}
                      >
                        Confirm publish
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {classPublishBlocker && checkpoint && (
                <p className="text-sm text-muted-foreground">
                  {classPublishBlocker}
                </p>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                {classGroups.map((group) => {
                  const draft = drafts[group.group_id] ?? {
                    task_progress_score: '',
                    commit_contribution_score: '',
                    review_milestone_score: '',
                    lecturer_note: '',
                  };

                  return (
                    <div key={group.group_id} className="rounded-md border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold">
                            {group.group_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {group.topic_name || 'No finalized topic yet'}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={
                              group.review_status === 'REVIEWED'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {group.review_status}
                          </Badge>
                          <Badge
                            variant={group.is_published ? 'default' : 'outline'}
                          >
                            {group.is_published ? 'PUBLISHED' : 'DRAFT'}
                          </Badge>
                          {group.warnings.map((warning) => (
                            <Badge key={warning} variant="destructive">
                              {warning}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                        <div>
                          Task snapshot: {group.snapshot.task_done}/
                          {group.snapshot.task_total} done
                        </div>
                        <div>
                          Commit snapshot:{' '}
                          {group.snapshot.commit_total ?? 'N/A'} commits /{' '}
                          {group.snapshot.commit_contributors ?? 'N/A'}{' '}
                          contributors
                        </div>
                        {group.snapshot.repository ? (
                          <div>Repo: {group.snapshot.repository}</div>
                        ) : null}
                      </div>

                      {group.review_session_summary ? (
                        <div className="mt-4 rounded-md border bg-muted/30 p-3 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="font-semibold text-foreground">
                              Review day log
                            </div>
                            <div className="text-muted-foreground">
                              {group.review_session_summary.total_sessions}{' '}
                              sessions
                            </div>
                          </div>
                          <div className="mt-2 grid gap-2 sm:grid-cols-3 text-muted-foreground">
                            <div>
                              Present:{' '}
                              {group.review_session_summary.present_count}
                            </div>
                            <div>
                              Contributed:{' '}
                              {group.review_session_summary.contributor_count}
                            </div>
                            <div>
                              Absent:{' '}
                              {group.review_session_summary.absent_count}
                            </div>
                          </div>
                          {group.review_sessions?.length ? (
                            <div className="mt-3 space-y-2">
                              {group.review_sessions.map((session) => (
                                <div
                                  key={session.id}
                                  className="rounded-md border bg-background p-2"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="font-medium text-foreground">
                                      {session.title}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {new Date(
                                        session.review_date,
                                      ).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="mt-1 text-muted-foreground">
                                    {session.lecturer_note ||
                                      'No lecturer note yet.'}
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    {session.participant_reports.map(
                                      (report) => (
                                        <div
                                          key={report.user_id}
                                          className="flex flex-wrap items-center gap-2 rounded-sm border border-dashed px-2 py-1"
                                        >
                                          <span className="font-medium text-foreground">
                                            {report.user_name || report.user_id}
                                          </span>
                                          <Badge
                                            variant={
                                              report.present
                                                ? 'default'
                                                : 'secondary'
                                            }
                                          >
                                            {report.present
                                              ? 'PRESENT'
                                              : 'ABSENT'}
                                          </Badge>
                                          <Badge
                                            variant={
                                              report.did_contribute
                                                ? 'default'
                                                : 'outline'
                                            }
                                          >
                                            {report.did_contribute
                                              ? 'CONTRIBUTED'
                                              : 'NO CONTRIBUTION'}
                                          </Badge>
                                          {report.contribution_summary ? (
                                            <span className="text-muted-foreground">
                                              {report.contribution_summary}
                                            </span>
                                          ) : null}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-2 text-muted-foreground">
                              No review sessions recorded yet.
                            </div>
                          )}
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          placeholder="Task score"
                          value={draft.task_progress_score}
                          onChange={(event) =>
                            handleChange(
                              group.group_id,
                              'task_progress_score',
                              event.target.value,
                            )
                          }
                        />
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          placeholder="Commit score"
                          value={draft.commit_contribution_score}
                          onChange={(event) =>
                            handleChange(
                              group.group_id,
                              'commit_contribution_score',
                              event.target.value,
                            )
                          }
                        />
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          placeholder="Review score"
                          value={draft.review_milestone_score}
                          onChange={(event) =>
                            handleChange(
                              group.group_id,
                              'review_milestone_score',
                              event.target.value,
                            )
                          }
                        />
                      </div>

                      <textarea
                        className="mt-3 min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                        placeholder="Quick lecturer note"
                        value={draft.lecturer_note}
                        onChange={(event) =>
                          handleChange(
                            group.group_id,
                            'lecturer_note',
                            event.target.value,
                          )
                        }
                      />

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                          Current total:{' '}
                          <span className="font-semibold text-foreground">
                            {group.scores.total_score ?? '-'}
                          </span>
                        </div>
                        <Button
                          onClick={() => handleSave(group.group_id)}
                          disabled={draft.isSaving}
                        >
                          {draft.isSaving ? 'Saving...' : 'Save quick review'}
                        </Button>
                      </div>

                      {draft.error ? (
                        <div className="mt-2 text-sm text-destructive">
                          {draft.error}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
