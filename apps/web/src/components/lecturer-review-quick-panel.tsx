'use client';

import {
  semesterAPI,
  type GroupReviewSummary,
  type LecturerReviewSummary,
  type ReviewScoringFormula,
  type ReviewSessionProblem,
  type ReviewSessionTimelineItem,
} from '@/lib/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { Checkbox } from './ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

type DraftState = Record<
  string,
  {
    task_progress_score: string;
    commit_contribution_score: string;
    review_milestone_score: string;
    lecturer_note: string;
    scoring_formula: ReviewScoringFormula;
    selected_metrics: string[];
    final_score: string;
    override_reason: string;
    isSaving?: boolean;
    error?: string | null;
  }
>;

type SessionFormState = {
  milestone_code: 'REVIEW_1' | 'REVIEW_2' | 'REVIEW_3' | 'FINAL_SCORE';
  review_date: string;
  title: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  lecturer_note: string;
  what_done_since_last_review: string;
  next_plan_until_next_review: string;
  previous_problem_followup: string;
  attendance_ratio: string;
  current_problems: ReviewSessionProblem[];
};

type DraftFieldKey = keyof DraftState[string];

const SCORING_FORMULA_OPTIONS: Array<{
  value: ReviewScoringFormula;
  label: string;
}> = [
  { value: 'ATTENDANCE_ONLY', label: 'Attendance only' },
  {
    value: 'PROBLEM_RESOLUTION_CONTRIBUTION',
    label: 'Problem resolution + contribution',
  },
  {
    value: 'ATTENDANCE_PROBLEM_CONTRIBUTION',
    label: 'Attendance + problem resolution + contribution',
  },
  { value: 'CUSTOM_SELECTION', label: 'Custom selection' },
];

const CUSTOM_METRICS = [
  { key: 'ATTENDANCE', label: 'Attendance' },
  { key: 'PROBLEM_RESOLUTION', label: 'Problem resolution' },
  { key: 'CONTRIBUTION', label: 'Contribution' },
  { key: 'TASK_DISCIPLINE', label: 'Task discipline' },
] as const;

interface LecturerReviewQuickPanelProps {
  summary?: LecturerReviewSummary;
  isLoading: boolean;
  onSaved?: () => void;
  classId?: string;
}

function createDrafts(summary?: LecturerReviewSummary): DraftState {
  const groups = summary?.classes.flatMap((item) => item.groups) ?? [];
  return Object.fromEntries(
    groups.map((group) => [
      group.group_id,
      {
        task_progress_score: group.scores.task_progress_score?.toString() ?? '',
        commit_contribution_score:
          group.scores.commit_contribution_score?.toString() ?? '',
        review_milestone_score:
          group.scores.review_milestone_score?.toString() ?? '',
        lecturer_note: group.lecturer_note ?? '',
        scoring_formula:
          group.scoring?.formula ?? 'ATTENDANCE_PROBLEM_CONTRIBUTION',
        selected_metrics:
          (group.scoring?.config_snapshot?.selected_metrics as
            | string[]
            | undefined) ?? [],
        final_score: group.scores.final_score?.toString() ?? '',
        override_reason: group.scores.override_reason ?? '',
        isSaving: false,
        error: null,
      },
    ]),
  );
}

function toLocalDateTimeValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function initialSessionForm(
  milestoneCode: SessionFormState['milestone_code'],
  session?: ReviewSessionTimelineItem,
): SessionFormState {
  return {
    milestone_code: session?.milestone_code ?? milestoneCode,
    review_date: toLocalDateTimeValue(session?.review_date),
    title: session?.title ?? '',
    status: session?.status ?? 'COMPLETED',
    lecturer_note: session?.lecturer_note ?? '',
    what_done_since_last_review: session?.what_done_since_last_review ?? '',
    next_plan_until_next_review: session?.next_plan_until_next_review ?? '',
    previous_problem_followup: session?.previous_problem_followup ?? '',
    attendance_ratio:
      session?.attendance_ratio !== null &&
      session?.attendance_ratio !== undefined
        ? session.attendance_ratio.toString()
        : '',
    current_problems:
      session?.current_problems?.map((problem) => ({
        ...problem,
        note: problem.note ?? null,
      })) ?? [],
  };
}

function ratio(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return `${Math.round(value * 100)}%`;
}

function score(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return value.toFixed(2);
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  );
}

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/20 p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function SessionTextBlock({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value || 'No details recorded.'}</div>
    </div>
  );
}

export function LecturerReviewQuickPanel({
  summary,
  isLoading,
  onSaved,
}: LecturerReviewQuickPanelProps) {
  const [drafts, setDrafts] = useState<DraftState>(() => createDrafts(summary));
  const [publishingClassId, setPublishingClassId] = useState<string | null>(
    null,
  );
  const [dialogGroup, setDialogGroup] = useState<GroupReviewSummary | null>(
    null,
  );
  const [editingSession, setEditingSession] =
    useState<ReviewSessionTimelineItem | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionFormState | null>(null);
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);

  useEffect(() => {
    setDrafts(createDrafts(summary));
  }, [summary]);

  const classes = summary?.classes ?? [];
  const hasActiveMilestone = useMemo(
    () => classes.some((item) => item.active_checkpoint),
    [classes],
  );

  const openSessionDialog = (
    group: GroupReviewSummary,
    session?: ReviewSessionTimelineItem,
  ) => {
    setDialogGroup(group);
    setEditingSession(session ?? null);
    setSessionForm(
      initialSessionForm(
        session?.milestone_code ?? group.milestone?.code ?? 'REVIEW_1',
        session,
      ),
    );
  };

  const closeSessionDialog = () => {
    setDialogGroup(null);
    setEditingSession(null);
    setSessionForm(null);
  };

  const setDraftField = <TField extends DraftFieldKey>(
    groupId: string,
    field: TField,
    value: DraftState[string][TField],
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

  const toggleMetric = (groupId: string, metric: string) => {
    const currentMetrics = drafts[groupId]?.selected_metrics ?? [];
    const nextMetrics = currentMetrics.includes(metric)
      ? currentMetrics.filter((item) => item !== metric)
      : [...currentMetrics, metric];
    setDraftField(groupId, 'selected_metrics', nextMetrics);
  };

  const getDraftForGroup = (group: GroupReviewSummary) =>
    drafts[group.group_id] ?? {
      task_progress_score: group.scores.task_progress_score?.toString() ?? '',
      commit_contribution_score:
        group.scores.commit_contribution_score?.toString() ?? '',
      review_milestone_score:
        group.scores.review_milestone_score?.toString() ?? '',
      lecturer_note: group.lecturer_note ?? '',
      scoring_formula:
        group.scoring?.formula ?? 'ATTENDANCE_PROBLEM_CONTRIBUTION',
      selected_metrics:
        (group.scoring?.config_snapshot?.selected_metrics as
          | string[]
          | undefined) ?? [],
      final_score: group.scores.final_score?.toString() ?? '',
      override_reason: group.scores.override_reason ?? '',
      isSaving: false,
      error: null,
    };

  const saveDraft = async (group: GroupReviewSummary) => {
    const draft = drafts[group.group_id];
    if (!draft) return;
    if (draft.final_score && !draft.override_reason.trim()) {
      setDraftField(
        group.group_id,
        'error',
        'Override reason is required when final score differs from auto score.',
      );
      return;
    }

    setDrafts((current) => ({
      ...current,
      [group.group_id]: {
        ...current[group.group_id],
        isSaving: true,
        error: null,
      },
    }));

    try {
      await semesterAPI.upsertCurrentGroupReview(group.group_id, {
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
        scoring_formula: draft.scoring_formula,
        selected_metrics:
          draft.scoring_formula === 'CUSTOM_SELECTION'
            ? draft.selected_metrics
            : undefined,
        final_score: draft.final_score ? Number(draft.final_score) : undefined,
        override_reason: draft.override_reason || undefined,
      });
      toast.success(`Saved review draft for ${group.group_name}.`);
      onSaved?.();
    } catch (error) {
      setDraftField(
        group.group_id,
        'error',
        error instanceof Error ? error.message : 'Failed to save review draft.',
      );
    } finally {
      setDrafts((current) => ({
        ...current,
        [group.group_id]: { ...current[group.group_id], isSaving: false },
      }));
    }
  };

  const publishClass = async (classId: string) => {
    const classItem = classes.find((item) => item.class_id === classId);
    if (!classItem?.active_checkpoint) return;
    setPublishingClassId(classId);
    try {
      const result = await semesterAPI.publishMilestoneReviews({
        milestone_code: classItem.active_checkpoint.code,
        class_id: classId,
      });
      toast.success(
        result.updated_count > 0
          ? `Published ${result.updated_count} review score(s) for ${classItem.class_code}.`
          : `No draft review score found for ${classItem.class_code}.`,
      );
      onSaved?.();
    } catch (error) {
      toast.error('Failed to publish milestone scores.', {
        description:
          error instanceof Error ? error.message : 'Unexpected error.',
      });
    } finally {
      setPublishingClassId(null);
    }
  };

  const submitSession = async () => {
    if (!dialogGroup || !sessionForm) return;
    if (!sessionForm.title.trim() || !sessionForm.review_date) {
      toast.error('Review date and title are required.');
      return;
    }

    setIsSubmittingSession(true);
    const payload = {
      milestone_code: sessionForm.milestone_code,
      review_date: new Date(sessionForm.review_date).toISOString(),
      title: sessionForm.title.trim(),
      status: sessionForm.status,
      lecturer_note: sessionForm.lecturer_note || undefined,
      what_done_since_last_review:
        sessionForm.what_done_since_last_review || undefined,
      next_plan_until_next_review:
        sessionForm.next_plan_until_next_review || undefined,
      previous_problem_followup:
        sessionForm.previous_problem_followup || undefined,
      attendance_ratio:
        sessionForm.attendance_ratio !== ''
          ? Number(sessionForm.attendance_ratio)
          : undefined,
      current_problems: sessionForm.current_problems
        .filter((problem) => problem.title.trim())
        .map((problem) => ({
          ...problem,
          title: problem.title.trim(),
          note: problem.note?.trim() || null,
        })),
    };

    try {
      if (editingSession) {
        await semesterAPI.updateGroupReviewSession(
          dialogGroup.group_id,
          editingSession.id,
          payload,
        );
        toast.success('Review session updated.');
      } else {
        await semesterAPI.createGroupReviewSession(
          dialogGroup.group_id,
          payload,
        );
        toast.success('Review session created.');
      }
      closeSessionDialog();
      onSaved?.();
    } catch (error) {
      toast.error('Failed to save review session.', {
        description:
          error instanceof Error ? error.message : 'Unexpected error.',
      });
    } finally {
      setIsSubmittingSession(false);
    }
  };

  const deleteSession = async (
    groupId: string,
    sessionId: string,
    title: string,
  ) => {
    try {
      await semesterAPI.deleteGroupReviewSession(groupId, sessionId);
      toast.success(`Deleted review session "${title}".`);
      onSaved?.();
    } catch (error) {
      toast.error('Failed to delete review session.', {
        description:
          error instanceof Error ? error.message : 'Unexpected error.',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Sessions & Scores</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Loading review checkpoint data...
        </CardContent>
      </Card>
    );
  }

  if (!hasActiveMilestone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Sessions & Scores</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No active checkpoint is configured for the current week.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Review Sessions & Scores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Classes"
              value={summary?.summary.classes_total ?? 0}
            />
            <StatCard
              label="Groups"
              value={summary?.summary.groups_total ?? 0}
            />
            <StatCard
              label="Reviewed"
              value={summary?.summary.reviewed_groups ?? 0}
            />
            <StatCard
              label="Missing Evidence"
              value={
                (summary?.summary.groups_missing_task_evidence ?? 0) +
                (summary?.summary.groups_missing_commit_evidence ?? 0)
              }
            />
          </div>

          {classes.map((classItem) => {
            const checkpoint = classItem.active_checkpoint;
            const reviewedCount = classItem.groups.filter(
              (group) => group.review_status === 'REVIEWED',
            ).length;
            const canPublish =
              !!checkpoint &&
              classItem.groups.length > 0 &&
              reviewedCount === classItem.groups.length &&
              publishingClassId !== classItem.class_id;

            return (
              <div key={classItem.class_id} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">
                      {classItem.class_code} - {classItem.class_name}
                    </h3>
                    {checkpoint ? (
                      <p className="text-sm text-muted-foreground">
                        {checkpoint.label} - Week {checkpoint.week_start} to{' '}
                        {checkpoint.week_end}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No active checkpoint this week.
                      </p>
                    )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={!canPublish}>
                        {publishingClassId === classItem.class_id
                          ? 'Publishing...'
                          : 'Publish milestone scores'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Publish {checkpoint?.label ?? 'scores'}?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <span className="block">
                            Milestone: <strong>{checkpoint?.label}</strong> (
                            {checkpoint?.code})
                          </span>
                          <span className="block">
                            Reviewed groups: <strong>{reviewedCount}</strong> /{' '}
                            {classItem.groups.length}
                          </span>
                          <span className="block text-destructive">
                            This is a finalize action. Published scores become
                            visible to students immediately.
                          </span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => publishClass(classItem.class_id)}
                          disabled={!canPublish}
                        >
                          Confirm publish
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {classItem.groups.map((group) => {
                    const draft = getDraftForGroup(group);
                    return (
                      <Card key={group.group_id}>
                        <CardHeader className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <CardTitle className="text-lg">
                                {group.group_name}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">
                                {group.topic_name || 'No finalized topic yet'}
                              </p>
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
                                variant={
                                  group.is_published ? 'default' : 'outline'
                                }
                              >
                                {group.is_published ? 'Published' : 'Draft'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {group.warnings.map((warning) => (
                              <Badge key={warning} variant="destructive">
                                {warning}
                              </Badge>
                            ))}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <LabelValue
                              label="Task snapshot"
                              value={`${group.snapshot.task_done}/${group.snapshot.task_total} done`}
                            />
                            <LabelValue
                              label="Commit snapshot"
                              value={`${group.snapshot.commit_total ?? 'N/A'} commits / ${group.snapshot.commit_contributors ?? 'N/A'} contributors`}
                            />
                            <LabelValue
                              label="Repository"
                              value={
                                group.snapshot.repository || 'No repo linked'
                              }
                            />
                            <LabelValue
                              label="Captured at"
                              value={
                                group.snapshot.captured_at
                                  ? new Date(
                                      group.snapshot.captured_at,
                                    ).toLocaleString()
                                  : 'No snapshot yet'
                              }
                            />
                          </div>

                          <div className="rounded-md border p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <div className="font-medium">Scoring</div>
                              <Badge variant="outline">
                                {group.scoring?.formula?.replaceAll('_', ' ') ??
                                  'AUTO'}
                              </Badge>
                            </div>
                            <div className="grid gap-2 text-sm md:grid-cols-2">
                              <LabelValue
                                label="Total problems"
                                value={String(
                                  group.scoring?.metrics.total_problems ?? 0,
                                )}
                              />
                              <LabelValue
                                label="Resolved ratio"
                                value={ratio(
                                  group.scoring?.metrics.resolved_ratio,
                                )}
                              />
                              <LabelValue
                                label="Overdue task ratio"
                                value={ratio(
                                  group.scoring?.metrics.overdue_task_ratio,
                                )}
                              />
                              <LabelValue
                                label="Attendance ratio"
                                value={ratio(
                                  group.scoring?.metrics.attendance_ratio,
                                )}
                              />
                              <LabelValue
                                label="Auto score"
                                value={score(group.scores.auto_score)}
                              />
                              <LabelValue
                                label="Final score"
                                value={score(group.scores.final_score)}
                              />
                            </div>
                            {group.scores.override_reason ? (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Override reason: {group.scores.override_reason}
                              </p>
                            ) : null}
                          </div>
                          <div className="space-y-3 rounded-md border p-3">
                            <div className="font-medium">
                              Checkpoint scoring
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                placeholder="Task score"
                                value={draft.task_progress_score}
                                onChange={(event) =>
                                  setDraftField(
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
                                step="0.1"
                                placeholder="Commit score"
                                value={draft.commit_contribution_score}
                                onChange={(event) =>
                                  setDraftField(
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
                                step="0.1"
                                placeholder="Review score"
                                value={draft.review_milestone_score}
                                onChange={(event) =>
                                  setDraftField(
                                    group.group_id,
                                    'review_milestone_score',
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                            <Select
                              value={draft.scoring_formula}
                              onValueChange={(value) =>
                                setDraftField(
                                  group.group_id,
                                  'scoring_formula',
                                  value as ReviewScoringFormula,
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select scoring formula" />
                              </SelectTrigger>
                              <SelectContent>
                                {SCORING_FORMULA_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {draft.scoring_formula === 'CUSTOM_SELECTION' ? (
                              <div className="grid gap-2 rounded-md border bg-muted/20 p-3 md:grid-cols-2">
                                {CUSTOM_METRICS.map((metric) => (
                                  <label
                                    key={metric.key}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <Checkbox
                                      checked={draft.selected_metrics.includes(
                                        metric.key,
                                      )}
                                      onCheckedChange={() =>
                                        toggleMetric(group.group_id, metric.key)
                                      }
                                    />
                                    <span>{metric.label}</span>
                                  </label>
                                ))}
                              </div>
                            ) : null}
                            <div className="grid gap-3 md:grid-cols-2">
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                placeholder="Optional final score override"
                                value={draft.final_score}
                                onChange={(event) =>
                                  setDraftField(
                                    group.group_id,
                                    'final_score',
                                    event.target.value,
                                  )
                                }
                              />
                              <Input
                                placeholder="Override reason (required if overriding)"
                                value={draft.override_reason}
                                onChange={(event) =>
                                  setDraftField(
                                    group.group_id,
                                    'override_reason',
                                    event.target.value,
                                  )
                                }
                              />
                            </div>
                            <TextArea
                              value={draft.lecturer_note}
                              onChange={(value) =>
                                setDraftField(
                                  group.group_id,
                                  'lecturer_note',
                                  value,
                                )
                              }
                              placeholder="Lecturer note"
                            />
                            {draft.error ? (
                              <p className="text-sm text-destructive">
                                {draft.error}
                              </p>
                            ) : null}
                            <div className="flex justify-end">
                              <Button
                                onClick={() => saveDraft(group)}
                                disabled={draft.isSaving}
                              >
                                {draft.isSaving
                                  ? 'Saving...'
                                  : 'Save checkpoint draft'}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3 rounded-md border p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">
                                  Review sessions
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Unlimited sessions before the checkpoint. One
                                  session per group per day.
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openSessionDialog(group)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                New review session
                              </Button>
                            </div>
                            {group.review_sessions?.length ? (
                              <div className="space-y-3">
                                {group.review_sessions.map((session) => (
                                  <div
                                    key={session.id}
                                    className="rounded-md border bg-background p-3"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div>
                                        <div className="font-medium">
                                          {session.title}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {new Date(
                                            session.review_date,
                                          ).toLocaleString()}{' '}
                                          • {session.milestone_code}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                          {session.status}
                                        </Badge>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() =>
                                            openSessionDialog(group, session)
                                          }
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="ghost">
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>
                                                Delete review session?
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This removes the active review
                                                session from the timeline but
                                                keeps version history in audit
                                                logs.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>
                                                Cancel
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() =>
                                                  deleteSession(
                                                    group.group_id,
                                                    session.id,
                                                    session.title,
                                                  )
                                                }
                                              >
                                                Delete
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </div>
                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                      <SessionTextBlock
                                        label="Done since last review"
                                        value={
                                          session.what_done_since_last_review
                                        }
                                      />
                                      <SessionTextBlock
                                        label="Next plan"
                                        value={
                                          session.next_plan_until_next_review
                                        }
                                      />
                                      <SessionTextBlock
                                        label="Previous problem follow-up"
                                        value={
                                          session.previous_problem_followup
                                        }
                                      />
                                      <SessionTextBlock
                                        label="Lecturer note"
                                        value={session.lecturer_note}
                                      />
                                    </div>
                                    <div className="mt-3 text-sm text-muted-foreground">
                                      Attendance ratio:{' '}
                                      <span className="font-medium text-foreground">
                                        {ratio(session.attendance_ratio)}
                                      </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {session.current_problems.length ? (
                                        session.current_problems.map(
                                          (problem) => (
                                            <div
                                              key={problem.id}
                                              className="rounded-md border px-3 py-2 text-xs"
                                            >
                                              <div className="font-medium">
                                                {problem.title}
                                              </div>
                                              <div className="mt-1 flex items-center gap-2">
                                                <Badge variant="outline">
                                                  {problem.status}
                                                </Badge>
                                                {problem.note ? (
                                                  <span className="text-muted-foreground">
                                                    {problem.note}
                                                  </span>
                                                ) : null}
                                              </div>
                                            </div>
                                          ),
                                        )
                                      ) : (
                                        <p className="text-xs text-muted-foreground">
                                          No active problems recorded.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                No review sessions recorded yet.
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog
        open={!!dialogGroup}
        onOpenChange={(open) => !open && closeSessionDialog()}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? 'Edit review session' : 'Create review session'}
            </DialogTitle>
          </DialogHeader>
          {sessionForm ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Select
                  value={sessionForm.milestone_code}
                  onValueChange={(value) =>
                    setSessionForm((current) =>
                      current
                        ? {
                            ...current,
                            milestone_code:
                              value as SessionFormState['milestone_code'],
                          }
                        : current,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Milestone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REVIEW_1">Review 1</SelectItem>
                    <SelectItem value="REVIEW_2">Review 2</SelectItem>
                    <SelectItem value="REVIEW_3">Review 3</SelectItem>
                    <SelectItem value="FINAL_SCORE">Final Score</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="datetime-local"
                  value={sessionForm.review_date}
                  onChange={(event) =>
                    setSessionForm((current) =>
                      current
                        ? { ...current, review_date: event.target.value }
                        : current,
                    )
                  }
                />
                <Input
                  value={sessionForm.title}
                  placeholder="Session title"
                  onChange={(event) =>
                    setSessionForm((current) =>
                      current
                        ? { ...current, title: event.target.value }
                        : current,
                    )
                  }
                />
                <Select
                  value={sessionForm.status}
                  onValueChange={(value) =>
                    setSessionForm((current) =>
                      current
                        ? {
                            ...current,
                            status: value as SessionFormState['status'],
                          }
                        : current,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                placeholder="Attendance ratio (0 to 1)"
                value={sessionForm.attendance_ratio}
                onChange={(event) =>
                  setSessionForm((current) =>
                    current
                      ? { ...current, attendance_ratio: event.target.value }
                      : current,
                  )
                }
              />
              <TextArea
                value={sessionForm.what_done_since_last_review}
                onChange={(value) =>
                  setSessionForm((current) =>
                    current
                      ? { ...current, what_done_since_last_review: value }
                      : current,
                  )
                }
                placeholder="Team progress since last review"
              />
              <TextArea
                value={sessionForm.next_plan_until_next_review}
                onChange={(value) =>
                  setSessionForm((current) =>
                    current
                      ? { ...current, next_plan_until_next_review: value }
                      : current,
                  )
                }
                placeholder="Next plan until next review"
              />
              <TextArea
                value={sessionForm.previous_problem_followup}
                onChange={(value) =>
                  setSessionForm((current) =>
                    current
                      ? { ...current, previous_problem_followup: value }
                      : current,
                  )
                }
                placeholder="Previous problem follow-up"
              />
              <TextArea
                value={sessionForm.lecturer_note}
                onChange={(value) =>
                  setSessionForm((current) =>
                    current ? { ...current, lecturer_note: value } : current,
                  )
                }
                placeholder="Lecturer note"
              />
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Current problems</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSessionForm((current) =>
                        current
                          ? {
                              ...current,
                              current_problems: [
                                ...current.current_problems,
                                {
                                  id: crypto.randomUUID(),
                                  title: '',
                                  status: 'not-done',
                                  note: '',
                                },
                              ],
                            }
                          : current,
                      )
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add problem
                  </Button>
                </div>
                {sessionForm.current_problems.length ? (
                  sessionForm.current_problems.map((problem, index) => (
                    <div
                      key={problem.id || `problem-${index}`}
                      className="grid gap-3 rounded-md border p-3 md:grid-cols-[1.5fr_180px_1fr_auto]"
                    >
                      <Input
                        value={problem.title}
                        placeholder="Problem title"
                        onChange={(event) =>
                          setSessionForm((current) =>
                            current
                              ? {
                                  ...current,
                                  current_problems:
                                    current.current_problems.map(
                                      (item, itemIndex) =>
                                        itemIndex === index
                                          ? {
                                              ...item,
                                              title: event.target.value,
                                            }
                                          : item,
                                    ),
                                }
                              : current,
                          )
                        }
                      />
                      <Select
                        value={problem.status}
                        onValueChange={(value) =>
                          setSessionForm((current) =>
                            current
                              ? {
                                  ...current,
                                  current_problems:
                                    current.current_problems.map(
                                      (item, itemIndex) =>
                                        itemIndex === index
                                          ? {
                                              ...item,
                                              status:
                                                value as ReviewSessionProblem['status'],
                                            }
                                          : item,
                                    ),
                                }
                              : current,
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not-done">Not done</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={problem.note ?? ''}
                        placeholder="Problem note"
                        onChange={(event) =>
                          setSessionForm((current) =>
                            current
                              ? {
                                  ...current,
                                  current_problems:
                                    current.current_problems.map(
                                      (item, itemIndex) =>
                                        itemIndex === index
                                          ? {
                                              ...item,
                                              note: event.target.value,
                                            }
                                          : item,
                                    ),
                                }
                              : current,
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setSessionForm((current) =>
                            current
                              ? {
                                  ...current,
                                  current_problems:
                                    current.current_problems.filter(
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                                }
                              : current,
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No problem rows yet.
                  </p>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={closeSessionDialog}>
              Cancel
            </Button>
            <Button onClick={submitSession} disabled={isSubmittingSession}>
              {isSubmittingSession ? 'Saving...' : 'Save review session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
