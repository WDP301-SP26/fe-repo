'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { adminSemesterAPI } from '@/lib/api';
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

  const {
    data: semesters,
    isLoading: loadingSemesters,
    mutate: mutateSemesters,
  } = useSWR<Semester[]>('/api/admin/semesters', () =>
    adminSemesterAPI.getSemesters(),
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
      toast.success('Import complete');
      await mutateBatches();
    } catch (error: any) {
      toast.error('Import failed', {
        description: error.message,
      });
    } finally {
      setIsImporting(false);
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
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as SemesterStatus,
                }))
              }
            >
              <option value="UPCOMING">UPCOMING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="CLOSED">CLOSED</option>
            </select>
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
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={semester.status}
                    onChange={(e) =>
                      updateSemesterStatus(
                        semester.id,
                        e.target.value as SemesterStatus,
                      )
                    }
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
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
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedSemesterId}
              onChange={(e) => {
                setSelectedSemesterId(e.target.value);
                setPreview(null);
                setLatestImport(null);
              }}
            >
              <option value="">Select semester</option>
              {semesters?.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.code} - {semester.name} ({semester.status})
                </option>
              ))}
            </select>
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
    </div>
  );
}
