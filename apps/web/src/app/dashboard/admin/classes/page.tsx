'use client';

import { DemoWeekOverrideCard } from '@/components/demo-week-override-card';
import {
  ExaminerAssignmentBoardView,
  TeachingAssignmentBoard,
} from '@/components/semester-assignment-boards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AdminUser,
  ExaminerAssignmentBoard,
  SemesterRosterResponse,
  adminSemesterAPI,
  semesterAPI,
} from '@/lib/api';
import { isAPIError } from '@/lib/api-error';
import {
  canAssignExaminer,
  getExaminerConflictMessage,
} from '@/lib/semester-roster-rules';
import { Loader2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

type SemesterStatus = 'UPCOMING' | 'ACTIVE' | 'CLOSED';

interface Semester {
  id: string;
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  status: SemesterStatus;
  current_week: number;
}

const emptyLecturerForm = {
  email: '',
  full_name: '',
  password: '',
};

const emptyStudentForm = {
  email: '',
  full_name: '',
  student_id: '',
  class_id: '',
  password: '',
};

function toErrorMessage(error: unknown) {
  if (isAPIError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return 'Unexpected error';
}

export default function AdminClassesPage() {
  const [form, setForm] = useState({
    code: '',
    name: '',
    start_date: '',
    end_date: '',
    status: 'UPCOMING' as SemesterStatus,
  });
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const [latestImport, setLatestImport] = useState<any | null>(null);
  const [lecturerForm, setLecturerForm] = useState(emptyLecturerForm);
  const [studentForm, setStudentForm] = useState(emptyStudentForm);
  const [editingLecturer, setEditingLecturer] = useState<AdminUser | null>(
    null,
  );
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editingLecturerForm, setEditingLecturerForm] =
    useState(emptyLecturerForm);
  const [editingStudentForm, setEditingStudentForm] =
    useState(emptyStudentForm);
  const [isSavingLecturer, setIsSavingLecturer] = useState(false);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [pendingTeachingClassId, setPendingTeachingClassId] = useState<
    string | null
  >(null);
  const [pendingExaminerClassId, setPendingExaminerClassId] = useState<
    string | null
  >(null);

  const {
    data: semesters,
    isLoading: loadingSemesters,
    mutate: mutateSemesters,
  } = useSWR<Semester[]>('/api/admin/semesters', () =>
    adminSemesterAPI.getSemesters(),
  );
  const { data: currentSemester, mutate: mutateCurrentSemester } = useSWR(
    '/api/semesters/current',
    () => semesterAPI.getCurrentSemester(),
  );
  const { data: roster, mutate: mutateRoster } = useSWR<SemesterRosterResponse>(
    selectedSemesterId
      ? `/api/admin/semesters/${selectedSemesterId}/roster`
      : null,
    () => adminSemesterAPI.getRoster(selectedSemesterId),
  );
  const { data: examinerBoard, mutate: mutateExaminerBoard } =
    useSWR<ExaminerAssignmentBoard>(
      selectedSemesterId
        ? `/api/admin/semesters/${selectedSemesterId}/examiner-assignments`
        : null,
      () => adminSemesterAPI.getExaminerAssignments(selectedSemesterId),
    );

  const { data: batches, mutate: mutateBatches } = useSWR<any[]>(
    selectedSemesterId
      ? `/api/admin/semesters/${selectedSemesterId}/import-batches`
      : null,
    () => adminSemesterAPI.getImportBatches(selectedSemesterId),
  );

  const selectedSemester = useMemo(
    () => semesters?.find((semester) => semester.id === selectedSemesterId),
    [selectedSemesterId, semesters],
  );
  const previewHasFailures = Boolean(preview?.summary?.rows?.failed);
  const previewReadyForImport = Boolean(preview?.readyForImport);
  const previewRows = preview?.rows ?? [];
  const previewLecturers = previewRows.filter(
    (row: any) => row.role === 'LECTURER',
  );
  const previewStudents = previewRows.filter(
    (row: any) => row.role === 'STUDENT',
  );

  const createSemester = async () => {
    setIsCreating(true);
    try {
      await adminSemesterAPI.createSemester(form);
      toast.success('Semester created');
      setForm({
        code: '',
        name: '',
        start_date: '',
        end_date: '',
        status: 'UPCOMING',
      });
      await mutateSemesters();
    } catch (error: any) {
      toast.error('Failed to create semester', {
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateSemesterStatus = async (
    semesterId: string,
    status: SemesterStatus,
  ) => {
    try {
      await adminSemesterAPI.updateSemester(semesterId, { status });
      toast.success('Semester status updated');
      await mutateSemesters();
    } catch (error: any) {
      toast.error('Failed to update semester', {
        description: error.message,
      });
    }
  };

  const validateImport = async () => {
    if (!selectedSemesterId || !file) return;
    setIsValidating(true);
    try {
      const response = await adminSemesterAPI.importWorkbook(
        selectedSemesterId,
        file,
        'validate',
      );
      setPreview(response);
      toast.success('Validation complete');
    } catch (error: any) {
      toast.error('Validation failed', {
        description: error.message,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const confirmImport = async () => {
    if (!selectedSemesterId || !file) return;
    setIsImporting(true);
    try {
      const response = await adminSemesterAPI.importWorkbook(
        selectedSemesterId,
        file,
        'import',
      );
      setLatestImport(response);
      setPreview(response);
      await Promise.all([
        mutateBatches(),
        mutateRoster(),
        mutateExaminerBoard(),
      ]);
      toast.success('Import complete');
    } catch (error: any) {
      toast.error('Import failed', {
        description: toErrorMessage(error),
      });
    } finally {
      setIsImporting(false);
    }
  };

  const createLecturer = async () => {
    if (!selectedSemesterId) return;
    setIsSavingLecturer(true);
    try {
      await adminSemesterAPI.createLecturer(selectedSemesterId, lecturerForm);
      setLecturerForm(emptyLecturerForm);
      await mutateRoster();
      toast.success('Lecturer created');
    } catch (error) {
      toast.error('Failed to create lecturer', {
        description: toErrorMessage(error),
      });
    } finally {
      setIsSavingLecturer(false);
    }
  };

  const createStudent = async () => {
    if (!selectedSemesterId) return;
    setIsSavingStudent(true);
    try {
      await adminSemesterAPI.createStudent(selectedSemesterId, studentForm);
      setStudentForm(emptyStudentForm);
      await mutateRoster();
      toast.success('Student added');
    } catch (error) {
      toast.error('Failed to create student', {
        description: toErrorMessage(error),
      });
    } finally {
      setIsSavingStudent(false);
    }
  };

  const assignTeachingLecturer = async (
    classId: string,
    lecturerId: string,
  ) => {
    if (!selectedSemesterId) return;
    setPendingTeachingClassId(classId);
    try {
      await adminSemesterAPI.updateTeachingAssignments(selectedSemesterId, [
        { class_id: classId, lecturer_id: lecturerId },
      ]);
      await Promise.all([mutateRoster(), mutateExaminerBoard()]);
      toast.success('Teaching assignment updated');
    } catch (error) {
      toast.error('Failed to update teaching assignment', {
        description: toErrorMessage(error),
      });
    } finally {
      setPendingTeachingClassId(null);
    }
  };

  const assignExaminer = async (classId: string, lecturerId: string) => {
    if (!selectedSemesterId || !examinerBoard) return;
    const targetClass = examinerBoard.classes.find(
      (item) => item.id === classId,
    );
    const lecturer = examinerBoard.lecturers.find(
      (item) => item.id === lecturerId,
    );

    if (!targetClass || !lecturer) return;
    if (!canAssignExaminer(lecturerId, targetClass.lecturer_id)) {
      toast.error('Examiner conflict', {
        description: getExaminerConflictMessage(
          lecturer.full_name || lecturer.email,
          targetClass.code,
        ),
      });
      return;
    }

    const nextLecturerIds = Array.from(
      new Set([
        ...targetClass.examiner_assignments.map((item) => item.lecturer_id),
        lecturerId,
      ]),
    );

    setPendingExaminerClassId(classId);
    try {
      await adminSemesterAPI.updateExaminerAssignments(selectedSemesterId, [
        { class_id: classId, lecturer_ids: nextLecturerIds },
      ]);
      await Promise.all([mutateExaminerBoard(), mutateRoster()]);
      toast.success('Examiner assignment updated');
    } catch (error) {
      toast.error('Failed to update examiner assignment', {
        description: toErrorMessage(error),
      });
    } finally {
      setPendingExaminerClassId(null);
    }
  };

  const removeExaminer = async (classId: string, lecturerId: string) => {
    if (!selectedSemesterId || !examinerBoard) return;
    const targetClass = examinerBoard.classes.find(
      (item) => item.id === classId,
    );
    if (!targetClass) return;

    setPendingExaminerClassId(classId);
    try {
      await adminSemesterAPI.updateExaminerAssignments(selectedSemesterId, [
        {
          class_id: classId,
          lecturer_ids: targetClass.examiner_assignments
            .map((item) => item.lecturer_id)
            .filter((id) => id !== lecturerId),
        },
      ]);
      await Promise.all([mutateExaminerBoard(), mutateRoster()]);
      toast.success('Examiner removed');
    } catch (error) {
      toast.error('Failed to remove examiner', {
        description: toErrorMessage(error),
      });
    } finally {
      setPendingExaminerClassId(null);
    }
  };

  const saveLecturerEdit = async () => {
    if (!selectedSemesterId || !editingLecturer) return;
    try {
      await adminSemesterAPI.updateLecturer(
        selectedSemesterId,
        editingLecturer.id,
        editingLecturerForm,
      );
      setEditingLecturer(null);
      await mutateRoster();
      toast.success('Lecturer updated');
    } catch (error) {
      toast.error('Failed to update lecturer', {
        description: toErrorMessage(error),
      });
    }
  };

  const saveStudentEdit = async () => {
    if (!selectedSemesterId || !editingStudent) return;
    try {
      await adminSemesterAPI.updateStudent(
        selectedSemesterId,
        editingStudent.id,
        editingStudentForm,
      );
      setEditingStudent(null);
      await mutateRoster();
      toast.success('Student updated');
    } catch (error) {
      toast.error('Failed to update student', {
        description: toErrorMessage(error),
      });
    }
  };

  const deleteLecturer = async (lecturerId: string) => {
    if (!selectedSemesterId) return;
    try {
      await adminSemesterAPI.deleteLecturer(selectedSemesterId, lecturerId);
      await mutateRoster();
      toast.success('Lecturer deleted');
    } catch (error) {
      toast.error('Failed to delete lecturer', {
        description: toErrorMessage(error),
      });
    }
  };

  const deleteStudent = async (studentId: string) => {
    if (!selectedSemesterId) return;
    try {
      await adminSemesterAPI.deleteStudent(selectedSemesterId, studentId);
      await mutateRoster();
      toast.success('Student removed from semester');
    } catch (error) {
      toast.error('Failed to remove student', {
        description: toErrorMessage(error),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Semester-first Import
        </h1>
        <p className="text-muted-foreground">
          Admin creates a semester first, then validates/imports one Excel/XLSX
          file that contains both lecturer and student rows.
        </p>
      </div>

      <DemoWeekOverrideCard
        semester={currentSemester ?? null}
        onUpdated={async () => {
          await Promise.all([mutateCurrentSemester(), mutateSemesters()]);
        }}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Semester</CardTitle>
            <CardDescription>
              Mandatory first step before any lecturer/student bulk import.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Code (e.g. SP26)"
              value={form.code}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, code: e.target.value }))
              }
            />
            <Input
              placeholder="Semester name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, start_date: e.target.value }))
                }
              />
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, end_date: e.target.value }))
                }
              />
            </div>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  status: value as SemesterStatus,
                }))
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPCOMING">UPCOMING</SelectItem>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="CLOSED">CLOSED</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={createSemester}
              disabled={
                isCreating ||
                !form.code ||
                !form.name ||
                !form.start_date ||
                !form.end_date
              }
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Semester
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Semester Inventory</CardTitle>
            <CardDescription>
              Manage status before opening import workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingSemesters ? (
              <p className="text-sm text-muted-foreground">
                Loading semesters...
              </p>
            ) : semesters?.length ? (
              semesters.map((semester) => (
                <div
                  key={semester.id}
                  className="rounded-lg border p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {semester.code} - {semester.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {semester.start_date} to {semester.end_date}
                    </p>
                  </div>
                  <Select
                    value={semester.status}
                    onValueChange={(value) =>
                      updateSemesterStatus(semester.id, value as SemesterStatus)
                    }
                  >
                    <SelectTrigger className="h-9 w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPCOMING">UPCOMING</SelectItem>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="CLOSED">CLOSED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No semesters created yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Wizard</CardTitle>
          <CardDescription>
            Flow: select semester - upload Excel/XLSX - validate - confirm
            import.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-4 text-sm">
            <p className="font-medium">Template contract</p>
            <p className="text-muted-foreground">
              Required columns: <code>semester_code</code>, <code>role</code>,{' '}
              <code>email</code>, <code>full_name</code>,{' '}
              <code>class_code</code>, <code>class_name</code>. Student rows
              also require <code>student_id</code>. The row{' '}
              <code>semester_code</code> must match the selected semester.
            </p>
            <Link
              href="/templates/semester-import-template.csv"
              className="mt-2 inline-block text-sm font-medium text-primary underline"
            >
              Download template sample
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]">
            <Select
              value={selectedSemesterId || undefined}
              onValueChange={(value) => {
                setSelectedSemesterId(value);
                setPreview(null);
                setLatestImport(null);
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters?.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
                    {semester.code} - {semester.name} ({semester.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Button
              variant="outline"
              disabled={
                !selectedSemesterId ||
                !file ||
                selectedSemester?.status === 'CLOSED' ||
                isValidating
              }
              onClick={validateImport}
            >
              {isValidating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Validate
            </Button>
            <Button
              disabled={
                !selectedSemesterId ||
                !file ||
                !preview ||
                !previewReadyForImport ||
                previewHasFailures ||
                selectedSemester?.status === 'CLOSED' ||
                isImporting
              }
              onClick={confirmImport}
            >
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Import
            </Button>
          </div>

          {selectedSemester?.status === 'CLOSED' && (
            <p className="text-sm text-amber-600">
              Selected semester is CLOSED. Import is blocked.
            </p>
          )}

          {preview && !previewReadyForImport && (
            <p className="text-sm text-red-600">
              Preview contains invalid rows. Fix all failed rows before confirm
              import.
            </p>
          )}

          {preview && (
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    Correlation ID: <strong>{preview.correlationId}</strong>
                  </p>
                  <p>
                    Rows: <strong>{preview.summary.rows.total}</strong>
                  </p>
                  <p>
                    Success: <strong>{preview.summary.rows.success}</strong>
                  </p>
                  <p>
                    Failed: <strong>{preview.summary.rows.failed}</strong>
                  </p>
                  <p>
                    Skipped: <strong>{preview.summary.rows.skipped}</strong>
                  </p>
                  <p>
                    Classes created/updated:{' '}
                    <strong>
                      {preview.summary.classes.created}/
                      {preview.summary.classes.updated}
                    </strong>
                  </p>
                  <p>
                    Lecturers created/updated:{' '}
                    <strong>
                      {preview.summary.lecturers.created}/
                      {preview.summary.lecturers.updated}
                    </strong>
                  </p>
                  <p>
                    Students created/updated:{' '}
                    <strong>
                      {preview.summary.students.created}/
                      {preview.summary.students.updated}
                    </strong>
                  </p>
                  <p>
                    Enrollments created/skipped:{' '}
                    <strong>
                      {preview.summary.enrollments.created}/
                      {preview.summary.enrollments.skipped}
                    </strong>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Row-level Validation Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-auto text-sm">
                  {preview.rows?.length ? (
                    preview.rows.map((row: any) => (
                      <div
                        key={`${row.row_number}-${row.email}-${row.class_code}`}
                        className="rounded border p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong>
                            Row {row.row_number} - {row.role}
                          </strong>
                          <span
                            className={
                              row.status === 'FAILED'
                                ? 'text-red-600'
                                : row.status === 'SKIPPED'
                                  ? 'text-amber-600'
                                  : 'text-green-600'
                            }
                          >
                            {row.status}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {row.email} - {row.class_code}
                        </p>
                        <p>{row.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No row output yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Import Batches</CardTitle>
          <CardDescription>
            Latest batch-level and row-level audit trail for the selected
            semester.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedSemesterId ? (
            <p className="text-sm text-muted-foreground">
              Select a semester to load import history.
            </p>
          ) : batches?.length ? (
            batches.map((batch) => (
              <div key={batch.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>
                    {batch.mode} - {batch.file_name}
                  </strong>
                  <span className="text-xs text-muted-foreground">
                    {batch.correlation_id}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(batch.created_at).toLocaleString()}
                </p>
                <p className="text-sm">
                  Rows: {batch.total_rows} | Success: {batch.success_rows} |
                  Failed: {batch.failed_rows}
                </p>
                {batch.rows?.length ? (
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {batch.rows.slice(0, 10).map((row: any) => (
                      <div key={row.id} className="rounded border p-2 text-sm">
                        Row {row.row_number} - {row.status} - {row.message}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No import history for this semester yet.
            </p>
          )}

          {latestImport && (
            <p className="text-sm text-green-700">
              Latest import completed with correlation ID{' '}
              <strong>{latestImport.correlationId}</strong>.
            </p>
          )}
        </CardContent>
      </Card>

      {selectedSemesterId && roster && (
        <Tabs defaultValue="roster" className="space-y-4">
          <TabsList>
            <TabsTrigger value="roster">Roster CRUD</TabsTrigger>
            <TabsTrigger value="preview">Preview Tables</TabsTrigger>
            <TabsTrigger value="teaching">Teaching Assignments</TabsTrigger>
            <TabsTrigger value="examiner">Examiner Board</TabsTrigger>
          </TabsList>

          <TabsContent value="roster" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Classes</CardTitle>
                </CardHeader>
                <CardContent>{roster.summary.classes_total}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lecturers</CardTitle>
                </CardHeader>
                <CardContent>{roster.summary.lecturers_total}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Students</CardTitle>
                </CardHeader>
                <CardContent>{roster.summary.students_total}</CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Lecturer CRUD</CardTitle>
                  <CardDescription>
                    Create lecturer accounts and maintain semester teaching
                    pool.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <Input
                      placeholder="Email"
                      value={lecturerForm.email}
                      onChange={(e) =>
                        setLecturerForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                    <Input
                      placeholder="Full name"
                      value={lecturerForm.full_name}
                      onChange={(e) =>
                        setLecturerForm((prev) => ({
                          ...prev,
                          full_name: e.target.value,
                        }))
                      }
                    />
                    <Input
                      placeholder="Password (optional)"
                      type="password"
                      value={lecturerForm.password}
                      onChange={(e) =>
                        setLecturerForm((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button
                    onClick={createLecturer}
                    disabled={
                      isSavingLecturer ||
                      !lecturerForm.email ||
                      !lecturerForm.full_name
                    }
                  >
                    {isSavingLecturer && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Lecturer
                  </Button>

                  <div className="space-y-3">
                    {roster.lecturers.map((lecturer) => (
                      <div
                        key={lecturer.id}
                        className="rounded-lg border p-3 text-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">
                              {lecturer.full_name || lecturer.email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {lecturer.email}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingLecturer({
                                  id: lecturer.id,
                                  email: lecturer.email,
                                  full_name: lecturer.full_name,
                                  role: 'LECTURER',
                                  student_id: null,
                                });
                                setEditingLecturerForm({
                                  email: lecturer.email,
                                  full_name: lecturer.full_name || '',
                                  password: '',
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteLecturer(lecturer.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {lecturer.teaching_classes.length > 0 ? (
                            lecturer.teaching_classes.map((item) => (
                              <Badge key={`${lecturer.id}-${item.class_id}`}>
                                {item.class_code}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">No teaching class</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student CRUD</CardTitle>
                  <CardDescription>
                    Maintain semester student roster and class enrollment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      placeholder="Email"
                      value={studentForm.email}
                      onChange={(e) =>
                        setStudentForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                    <Input
                      placeholder="Full name"
                      value={studentForm.full_name}
                      onChange={(e) =>
                        setStudentForm((prev) => ({
                          ...prev,
                          full_name: e.target.value,
                        }))
                      }
                    />
                    <Input
                      placeholder="Student ID"
                      value={studentForm.student_id}
                      onChange={(e) =>
                        setStudentForm((prev) => ({
                          ...prev,
                          student_id: e.target.value,
                        }))
                      }
                    />
                    <Select
                      value={studentForm.class_id}
                      onValueChange={(value) =>
                        setStudentForm((prev) => ({ ...prev, class_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Assign class" />
                      </SelectTrigger>
                      <SelectContent>
                        {roster.classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.code} - {classItem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={createStudent}
                    disabled={
                      isSavingStudent ||
                      !studentForm.email ||
                      !studentForm.full_name ||
                      !studentForm.student_id ||
                      !studentForm.class_id
                    }
                  >
                    {isSavingStudent && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Student
                  </Button>

                  <div className="space-y-3">
                    {roster.students.map((student) => (
                      <div
                        key={student.id}
                        className="rounded-lg border p-3 text-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">
                              {student.full_name || student.email}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {student.email} • {student.student_id || 'No ID'}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {student.class_code} - {student.class_name}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingStudent(student);
                                setEditingStudentForm({
                                  email: student.email,
                                  full_name: student.full_name || '',
                                  student_id: student.student_id || '',
                                  class_id: student.class_id,
                                  password: '',
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteStudent(student.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Lecturer Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {previewLecturers.length > 0 ? (
                    previewLecturers.map((row: any) => (
                      <div
                        key={`lecturer-${row.row_number}`}
                        className="rounded border p-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium">{row.email}</div>
                          <Badge
                            variant={
                              row.status === 'FAILED'
                                ? 'destructive'
                                : row.status === 'SUCCESS'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {row.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.class_code} • {row.message}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No lecturer preview rows yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {previewStudents.length > 0 ? (
                    previewStudents.map((row: any) => (
                      <div
                        key={`student-${row.row_number}`}
                        className="rounded border p-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium">{row.email}</div>
                          <Badge
                            variant={
                              row.status === 'FAILED'
                                ? 'destructive'
                                : row.status === 'SUCCESS'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {row.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.class_code} • {row.message}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No student preview rows yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teaching">
            <TeachingAssignmentBoard
              lecturers={roster.lecturers}
              classes={roster.classes}
              onAssign={assignTeachingLecturer}
              pendingClassId={pendingTeachingClassId}
            />
          </TabsContent>

          <TabsContent value="examiner">
            {examinerBoard && !examinerBoard.gate.can_assign ? (
              <Card>
                <CardHeader>
                  <CardTitle>Examiner Assignment Locked</CardTitle>
                  <CardDescription>Open after week 10 only.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Current week: {examinerBoard.gate.current_week}
                </CardContent>
              </Card>
            ) : examinerBoard ? (
              <ExaminerAssignmentBoardView
                board={examinerBoard}
                onAssign={assignExaminer}
                onRemove={removeExaminer}
                pendingClassId={pendingExaminerClassId}
              />
            ) : null}
          </TabsContent>
        </Tabs>
      )}

      <Dialog
        open={!!editingLecturer}
        onOpenChange={(open) => !open && setEditingLecturer(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lecturer</DialogTitle>
            <DialogDescription>
              Update lecturer account details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={editingLecturerForm.email}
              onChange={(e) =>
                setEditingLecturerForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="Email"
            />
            <Input
              value={editingLecturerForm.full_name}
              onChange={(e) =>
                setEditingLecturerForm((prev) => ({
                  ...prev,
                  full_name: e.target.value,
                }))
              }
              placeholder="Full name"
            />
            <Input
              type="password"
              value={editingLecturerForm.password}
              onChange={(e) =>
                setEditingLecturerForm((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              placeholder="New password (optional)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLecturer(null)}>
              Cancel
            </Button>
            <Button onClick={saveLecturerEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingStudent}
        onOpenChange={(open) => !open && setEditingStudent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student profile and semester class assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={editingStudentForm.email}
              onChange={(e) =>
                setEditingStudentForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="Email"
            />
            <Input
              value={editingStudentForm.full_name}
              onChange={(e) =>
                setEditingStudentForm((prev) => ({
                  ...prev,
                  full_name: e.target.value,
                }))
              }
              placeholder="Full name"
            />
            <Input
              value={editingStudentForm.student_id}
              onChange={(e) =>
                setEditingStudentForm((prev) => ({
                  ...prev,
                  student_id: e.target.value,
                }))
              }
              placeholder="Student ID"
            />
            <Select
              value={editingStudentForm.class_id}
              onValueChange={(value) =>
                setEditingStudentForm((prev) => ({ ...prev, class_id: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign class" />
              </SelectTrigger>
              <SelectContent>
                {roster?.classes.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.code} - {classItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="password"
              value={editingStudentForm.password}
              onChange={(e) =>
                setEditingStudentForm((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              placeholder="New password (optional)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStudent(null)}>
              Cancel
            </Button>
            <Button onClick={saveStudentEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
