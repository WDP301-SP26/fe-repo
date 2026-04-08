'use client';

import {
  semesterAPI,
  type GroupReviewSummary,
  type LecturerReviewSummary,
  type ReviewScoringFormula,
  type ReviewSessionAttendanceRecord,
  type ReviewSessionProblem,
  type ReviewSessionTimelineItem,
} from '@/lib/api';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
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
import { DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

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
  attendance_records: ReviewSessionAttendanceRecord[];
  attendance_search: string;
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
  group: GroupReviewSummary,
  milestoneCode: SessionFormState['milestone_code'],
  session?: ReviewSessionTimelineItem,
): SessionFormState {
  const previousSession =
    session ??
    [...(group.review_sessions ?? [])].sort(
      (left, right) =>
        new Date(right.review_date).getTime() -
        new Date(left.review_date).getTime(),
    )[0];

  const attendanceRecords = session?.attendance_records?.length
    ? session.attendance_records
    : (group.members ?? []).map((member) => ({
        user_id: member.user_id,
        user_name: member.user_name,
        present: false,
      }));

  const carriedProblems =
    session?.current_problems ??
    previousSession?.current_problems?.filter(
      (problem) => problem.status === 'not-done',
    ) ??
    [];

  return {
    milestone_code: session?.milestone_code ?? milestoneCode,
    review_date: toLocalDateTimeValue(session?.review_date),
    title: session?.title ?? '',
    status: session?.status ?? 'SCHEDULED',
    lecturer_note: session?.lecturer_note ?? '',
    what_done_since_last_review: session?.what_done_since_last_review ?? '',
    next_plan_until_next_review: session?.next_plan_until_next_review ?? '',
    previous_problem_followup: session?.previous_problem_followup ?? '',
    attendance_ratio:
      session?.attendance_ratio !== null &&
      session?.attendance_ratio !== undefined
        ? session.attendance_ratio.toString()
        : '',
    attendance_records: attendanceRecords.map((record) => ({
      ...record,
      user_name: record.user_name ?? null,
      present: !!record.present,
    })),
    attendance_search: '',
    current_problems: carriedProblems.map((problem) => ({
      ...problem,
      note: problem.note ?? null,
    })),
  };
}

function ratio(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '-';
  return `${Math.round(numericValue * 100)}%`;
}

function score(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '-';
  return numericValue.toFixed(2);
}

function formatReviewDateTime(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function getReviewStatusBadgeClass(status: 'PENDING' | 'REVIEWED') {
  return status === 'REVIEWED'
    ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
    : 'border-amber-200 bg-amber-100 text-amber-800';
}

function getPublishBadgeClass(isPublished?: boolean) {
  return isPublished
    ? 'border-sky-200 bg-sky-100 text-sky-800'
    : 'border-amber-200 bg-amber-100 text-amber-800';
}

function getSessionStatusBadgeClass(
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED',
) {
  if (status === 'COMPLETED') {
    return 'border-emerald-200 bg-emerald-100 text-emerald-800';
  }
  if (status === 'CANCELLED') {
    return 'border-rose-200 bg-rose-100 text-rose-800';
  }
  return 'border-sky-200 bg-sky-100 text-sky-800';
}

function getFormulaLabel(value: ReviewScoringFormula) {
  return value.replaceAll('_', ' ');
}

function calculateAttendanceRatio(records: ReviewSessionAttendanceRecord[]) {
  if (!records.length) return 0;
  return Math.round(
    (records.filter((record) => record.present).length / records.length) * 100,
  );
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

export function LecturerReviewQuickPanel({
  summary,
  isLoading,
  onSaved,
}: LecturerReviewQuickPanelProps) {
  const [drafts, setDrafts] = useState<DraftState>(() => createDrafts(summary));
  const [publishingClassId, setPublishingClassId] = useState<string | null>(
    null,
  );
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [panelTab, setPanelTab] = useState<'review' | 'sessions'>('review');
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

  useEffect(() => {
    if (!classes.length) {
      setSelectedClassId('');
      return;
    }

    const preferredClass =
      classes.find((item) => item.class_id === selectedClassId) ?? classes[0];

    if (preferredClass.class_id !== selectedClassId) {
      setSelectedClassId(preferredClass.class_id);
    }
  }, [classes, selectedClassId]);

  const selectedClass = useMemo(
    () => classes.find((item) => item.class_id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  useEffect(() => {
    const groups = selectedClass?.groups ?? [];
    if (!groups.length) {
      setSelectedGroupId('');
      return;
    }

    const preferredGroup =
      groups.find((item) => item.group_id === selectedGroupId) ?? groups[0];

    if (preferredGroup.group_id !== selectedGroupId) {
      setSelectedGroupId(preferredGroup.group_id);
    }
  }, [selectedClass, selectedGroupId]);

  const selectedGroup = useMemo(
    () =>
      selectedClass?.groups.find(
        (group) => group.group_id === selectedGroupId,
      ) ?? null,
    [selectedClass, selectedGroupId],
  );

  const selectedCheckpoint = selectedClass?.active_checkpoint ?? null;
  const hasActiveMilestone = useMemo(
    () => classes.some((item) => item.active_checkpoint),
    [classes],
  );
  const activeDialogMilestone = dialogGroup?.milestone ?? null;
  const attendanceEditAllowed =
    !!sessionForm &&
    !!activeDialogMilestone &&
    sessionForm.milestone_code === activeDialogMilestone.code;
  const filteredAttendanceRecords = useMemo(() => {
    if (!sessionForm) {
      return [];
    }

    const keyword = sessionForm.attendance_search.trim().toLowerCase();
    if (!keyword) {
      return sessionForm.attendance_records;
    }

    return sessionForm.attendance_records.filter((record) =>
      (record.user_name ?? record.user_id).toLowerCase().includes(keyword),
    );
  }, [sessionForm]);

  const openSessionDialog = (
    group: GroupReviewSummary,
    session?: ReviewSessionTimelineItem,
  ) => {
    setDialogGroup(group);
    setEditingSession(session ?? null);
    setSessionForm(
      initialSessionForm(
        group,
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

  const updateSessionForm = (
    updater: (current: SessionFormState) => SessionFormState,
  ) => {
    setSessionForm((current) => (current ? updater(current) : current));
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

  const toggleAttendanceRecord = (userId: string) => {
    updateSessionForm((current) => ({
      ...current,
      attendance_records: current.attendance_records.map((record) =>
        record.user_id === userId
          ? { ...record, present: !record.present }
          : record,
      ),
    }));
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
      attendance_ratio: sessionForm.attendance_records.length
        ? Number(
            (
              sessionForm.attendance_records.filter((record) => record.present)
                .length / sessionForm.attendance_records.length
            ).toFixed(2),
          )
        : sessionForm.attendance_ratio !== ''
          ? Number(sessionForm.attendance_ratio)
          : undefined,
      attendance_records: sessionForm.attendance_records,
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Review Sessions & Scores</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Current checkpoint:{' '}
                <span className="font-medium text-foreground">
                  {selectedCheckpoint
                    ? `${selectedCheckpoint.label} · Week ${selectedCheckpoint.week_start}-${selectedCheckpoint.week_end}`
                    : 'No active checkpoint'}
                </span>
              </p>
            </div>
            {selectedClass ? (
              <Badge
                variant="outline"
                className="border-sky-200 bg-sky-50 text-sky-700"
              >
                {selectedClass.class_code}
              </Badge>
            ) : null}
          </div>
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Class
              </div>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem
                      key={classItem.class_id}
                      value={classItem.class_id}
                    >
                      {classItem.class_code} - {classItem.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Group
              </div>
              <Select
                value={selectedGroupId}
                onValueChange={setSelectedGroupId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {(selectedClass?.groups ?? []).map((group) => (
                    <SelectItem key={group.group_id} value={group.group_id}>
                      {group.group_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-1">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current checkpoint
              </div>
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm font-medium">
                {selectedCheckpoint
                  ? `${selectedCheckpoint.label} · Week ${selectedCheckpoint.week_start}-${selectedCheckpoint.week_end}`
                  : 'No active checkpoint this week.'}
              </div>
            </div>
          </div>

          {selectedClass ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">
                    {selectedClass.class_code} - {selectedClass.class_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Showing only one selected group at a time.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={
                        !selectedClass.active_checkpoint ||
                        !selectedClass.groups.length ||
                        selectedClass.groups.filter(
                          (group) => group.review_status === 'REVIEWED',
                        ).length !== selectedClass.groups.length ||
                        publishingClassId === selectedClass.class_id
                      }
                    >
                      {publishingClassId === selectedClass.class_id
                        ? 'Publishing...'
                        : 'Publish milestone scores'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Publish {selectedCheckpoint?.label ?? 'scores'}?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <span className="block">
                          Milestone:{' '}
                          <strong>{selectedCheckpoint?.label}</strong> (
                          {selectedCheckpoint?.code})
                        </span>
                        <span className="block">
                          Reviewed groups:{' '}
                          <strong>
                            {
                              selectedClass.groups.filter(
                                (group) => group.review_status === 'REVIEWED',
                              ).length
                            }
                          </strong>{' '}
                          / {selectedClass.groups.length}
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
                        onClick={() => publishClass(selectedClass.class_id)}
                        disabled={
                          !selectedClass.active_checkpoint ||
                          !selectedClass.groups.length
                        }
                      >
                        Confirm publish
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {selectedGroup ? (
                <Tabs
                  value={panelTab}
                  onValueChange={(value) =>
                    setPanelTab(value as 'review' | 'sessions')
                  }
                >
                  <TabsList>
                    <TabsTrigger value="review">Group review</TabsTrigger>
                    <TabsTrigger value="sessions">Review sessions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="review" className="mt-4">
                    {(() => {
                      const draft = getDraftForGroup(selectedGroup);
                      return (
                        <div className="space-y-4">
                          <Card>
                            <CardHeader className="space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <CardTitle className="text-lg">
                                    {selectedGroup.group_name}
                                  </CardTitle>
                                  <p className="text-xs text-muted-foreground">
                                    {selectedGroup.topic_name ||
                                      'No finalized topic yet'}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge
                                    variant="outline"
                                    className={getReviewStatusBadgeClass(
                                      selectedGroup.review_status,
                                    )}
                                  >
                                    {selectedGroup.review_status}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={getPublishBadgeClass(
                                      selectedGroup.is_published,
                                    )}
                                  >
                                    {selectedGroup.is_published
                                      ? 'Published'
                                      : 'Draft'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {selectedGroup.warnings.map((warning) => (
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
                                  value={`${selectedGroup.snapshot.task_done}/${selectedGroup.snapshot.task_total} done`}
                                />
                                <LabelValue
                                  label="Commit snapshot"
                                  value={`${selectedGroup.snapshot.commit_total ?? 'N/A'} commits / ${selectedGroup.snapshot.commit_contributors ?? 'N/A'} contributors`}
                                />
                                <LabelValue
                                  label="Repository"
                                  value={
                                    selectedGroup.snapshot.repository ||
                                    'No repo linked'
                                  }
                                />
                                <LabelValue
                                  label="Captured at"
                                  value={
                                    selectedGroup.snapshot.captured_at
                                      ? new Date(
                                          selectedGroup.snapshot.captured_at,
                                        ).toLocaleString()
                                      : 'No snapshot yet'
                                  }
                                />
                              </div>

                              <div className="rounded-md border p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <div className="font-medium">Scoring</div>
                                  <Badge variant="outline">
                                    {getFormulaLabel(
                                      selectedGroup.scoring?.formula ??
                                        'ATTENDANCE_PROBLEM_CONTRIBUTION',
                                    )}
                                  </Badge>
                                </div>
                                <div className="grid gap-2 text-sm md:grid-cols-2">
                                  <LabelValue
                                    label="Total problems"
                                    value={String(
                                      selectedGroup.scoring?.metrics
                                        .total_problems ?? 0,
                                    )}
                                  />
                                  <LabelValue
                                    label="Resolved ratio"
                                    value={ratio(
                                      selectedGroup.scoring?.metrics
                                        .resolved_ratio,
                                    )}
                                  />
                                  <LabelValue
                                    label="Overdue task ratio"
                                    value={ratio(
                                      selectedGroup.scoring?.metrics
                                        .overdue_task_ratio,
                                    )}
                                  />
                                  <LabelValue
                                    label="Attendance ratio"
                                    value={ratio(
                                      selectedGroup.scoring?.metrics
                                        .attendance_ratio,
                                    )}
                                  />
                                  <LabelValue
                                    label="Auto score"
                                    value={score(
                                      selectedGroup.scores.auto_score,
                                    )}
                                  />
                                  <LabelValue
                                    label="Final score"
                                    value={score(
                                      selectedGroup.scores.final_score,
                                    )}
                                  />
                                </div>
                                {selectedGroup.scores.override_reason ? (
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    Override reason:{' '}
                                    {selectedGroup.scores.override_reason}
                                  </p>
                                ) : null}
                              </div>

                              <div className="space-y-3 rounded-md border p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="font-medium">
                                    Checkpoint scoring
                                  </div>
                                  <Button variant="outline" size="sm" asChild>
                                    <Link
                                      href="/lecturer/review-scoring-guide"
                                      target="_blank"
                                    >
                                      Open scoring guide
                                    </Link>
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Enter all 3 component scores in range 0-10.
                                </p>
                                <div className="grid gap-3 md:grid-cols-3">
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">
                                      Task progress score (0-10)
                                    </div>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="10"
                                      step="0.1"
                                      placeholder="Task score"
                                      value={draft.task_progress_score}
                                      onChange={(event) =>
                                        setDraftField(
                                          selectedGroup.group_id,
                                          'task_progress_score',
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">
                                      Commit contribution score (0-10)
                                    </div>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="10"
                                      step="0.1"
                                      placeholder="Commit score"
                                      value={draft.commit_contribution_score}
                                      onChange={(event) =>
                                        setDraftField(
                                          selectedGroup.group_id,
                                          'commit_contribution_score',
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground">
                                      Milestone review score (0-10)
                                    </div>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="10"
                                      step="0.1"
                                      placeholder="Review score"
                                      value={draft.review_milestone_score}
                                      onChange={(event) =>
                                        setDraftField(
                                          selectedGroup.group_id,
                                          'review_milestone_score',
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                                <Select
                                  value={draft.scoring_formula}
                                  onValueChange={(value) =>
                                    setDraftField(
                                      selectedGroup.group_id,
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
                                {draft.scoring_formula ===
                                'CUSTOM_SELECTION' ? (
                                  <div className="grid gap-3 rounded-md border border-amber-300 bg-amber-50/50 p-3 md:grid-cols-2">
                                    {CUSTOM_METRICS.map((metric) => {
                                      const isSelected =
                                        draft.selected_metrics.includes(
                                          metric.key,
                                        );
                                      return (
                                        <label
                                          key={metric.key}
                                          className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm shadow-sm transition ${isSelected ? 'border-amber-400 bg-white ring-1 ring-amber-300' : 'border-amber-200 bg-white/70 hover:border-amber-300'}`}
                                        >
                                          <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() =>
                                              toggleMetric(
                                                selectedGroup.group_id,
                                                metric.key,
                                              )
                                            }
                                          />
                                          <span className="font-medium">
                                            {metric.label}
                                          </span>
                                        </label>
                                      );
                                    })}
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
                                        selectedGroup.group_id,
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
                                        selectedGroup.group_id,
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
                                      selectedGroup.group_id,
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
                                    onClick={() => saveDraft(selectedGroup)}
                                    disabled={draft.isSaving}
                                  >
                                    {draft.isSaving
                                      ? 'Saving...'
                                      : 'Save checkpoint draft'}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })()}
                  </TabsContent>

                  <TabsContent value="sessions" className="mt-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <CardTitle className="text-lg">
                              Review sessions
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              Timeline for {selectedGroup.group_name} only.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openSessionDialog(selectedGroup)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            New review session
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {selectedGroup.review_sessions?.length ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Milestone</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Attendance</TableHead>
                                <TableHead>Problems</TableHead>
                                <TableHead className="text-right">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedGroup.review_sessions.map((session) => {
                                const presentCount =
                                  session.attendance_records.filter(
                                    (record) => record.present,
                                  ).length;
                                const totalAttendance =
                                  session.attendance_records.length;
                                const openProblems =
                                  session.current_problems.filter(
                                    (problem) => problem.status === 'not-done',
                                  ).length;
                                return (
                                  <TableRow
                                    key={session.id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                      openSessionDialog(selectedGroup, session)
                                    }
                                  >
                                    <TableCell className="font-medium">
                                      {session.title}
                                    </TableCell>
                                    <TableCell>
                                      {session.milestone_code}
                                    </TableCell>
                                    <TableCell>
                                      {formatReviewDateTime(
                                        session.review_date,
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={getSessionStatusBadgeClass(
                                          session.status,
                                        )}
                                      >
                                        {session.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {presentCount}/{totalAttendance}
                                    </TableCell>
                                    <TableCell>{openProblems}</TableCell>
                                    <TableCell>
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            openSessionDialog(
                                              selectedGroup,
                                              session,
                                            );
                                          }}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              onClick={(event) =>
                                                event.stopPropagation()
                                              }
                                            >
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
                                                    selectedGroup.group_id,
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
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                            No review sessions recorded yet.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {sessionForm ? (
        <div className="mt-4 rounded-xl border bg-background p-4 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold">
              {editingSession ? 'Edit review session' : 'Create review session'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {dialogGroup?.group_name ?? 'Review session'}
            </p>
          </div>
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
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">
                      Review checkpoint
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sessionForm.milestone_code.replaceAll('_', ' ')}
                      {activeDialogMilestone
                        ? ` • Week ${activeDialogMilestone.week_start}-${activeDialogMilestone.week_end}`
                        : ''}
                    </div>
                  </div>
                  <Badge
                    variant={attendanceEditAllowed ? 'default' : 'secondary'}
                  >
                    {attendanceEditAllowed
                      ? 'Attendance editable'
                      : 'Outside active review window'}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <LabelValue
                    label="Attendance ratio"
                    value={`${calculateAttendanceRatio(sessionForm.attendance_records)}%`}
                  />
                  <LabelValue
                    label="Present"
                    value={String(
                      sessionForm.attendance_records.filter(
                        (record) => record.present,
                      ).length,
                    )}
                  />
                  <LabelValue
                    label="Total members"
                    value={String(sessionForm.attendance_records.length)}
                  />
                </div>
              </div>
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">Attendance</div>
                    <p className="text-xs text-muted-foreground">
                      Track attendance per student for this review session.
                    </p>
                  </div>
                  <div className="relative w-full md:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={sessionForm.attendance_search}
                      onChange={(event) =>
                        updateSessionForm((current) => ({
                          ...current,
                          attendance_search: event.target.value,
                        }))
                      }
                      className="pl-9"
                      placeholder="Search student name"
                    />
                  </div>
                </div>

                {sessionForm.attendance_records.length ? (
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-3">
                    {filteredAttendanceRecords.map((record) => (
                      <label
                        key={record.user_id}
                        className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        <span className="font-medium">
                          {record.user_name ?? record.user_id}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={record.present ? 'default' : 'secondary'}
                          >
                            {record.present ? 'Present' : 'Absent'}
                          </Badge>
                          <Checkbox
                            aria-label={`Attendance for ${record.user_name ?? record.user_id}`}
                            checked={record.present}
                            disabled={!attendanceEditAllowed}
                            onCheckedChange={() =>
                              toggleAttendanceRecord(record.user_id)
                            }
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    No group members were loaded for attendance tracking. You
                    can still save the review session, but attendance metrics
                    will remain empty.
                  </div>
                )}
              </div>
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
        </div>
      ) : null}
    </>
  );
}
