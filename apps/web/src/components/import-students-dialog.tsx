'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileUp,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { classAPI } from '@/lib/api';
import { toast } from 'sonner';

interface ImportFailedRow {
  row: number;
  email: string;
  reason: string;
}

interface ImportResponse {
  total: number;
  enrolled: number;
  created: number;
  already_enrolled: number;
  warnings: string[];
  failed: ImportFailedRow[];
}

interface ImportStudentsDialogProps {
  classId: string;
  onSuccess?: () => void;
}

export function ImportStudentsDialog({
  classId,
  onSuccess,
}: ImportStudentsDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [showFailed, setShowFailed] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);
    try {
      const resp = await classAPI.importStudents(classId, file);
      setResult(resp);
      toast.success('Import completed', {
        description: `Successfully enrolled ${resp.enrolled} students.`,
      });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error('Import failed', {
        description: error.message || 'Something went wrong while uploading.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileUp className="h-4 w-4" />
          Import Students
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Students from File</DialogTitle>
          <DialogDescription>
            Upload a CSV or XLSX file containing student emails. The system will
            automatically create accounts and enroll them in this class.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 overflow-y-auto">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="student-file">Select File (.csv, .xlsx)</Label>
            <Input
              id="student-file"
              type="file"
              accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>

          {result && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <div className="text-xs text-green-700 dark:text-green-400 font-medium">
                    Enrolled
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {result.enrolled}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                    New Accounts
                  </div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {result.created}
                  </div>
                </div>
              </div>

              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Total records found:
                  </span>
                  <span className="font-semibold">{result.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Already in class:
                  </span>
                  <span className="font-semibold">
                    {result.already_enrolled}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-red-500">
                    Failed:
                  </span>
                  <span className="font-semibold text-red-500">
                    {result.failed.length}
                  </span>
                </div>
              </div>

              {result.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-semibold mb-1">Warnings:</p>
                    <ul className="list-disc pl-3 space-y-1">
                      {result.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {result.failed.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowFailed(!showFailed)}
                    className="w-full flex items-center justify-between p-3 text-sm font-medium bg-muted/30 hover:bg-muted/50"
                  >
                    <span>View Failed Rows ({result.failed.length})</span>
                    {showFailed ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {showFailed && (
                    <div className="p-2 max-h-[150px] overflow-y-auto bg-muted/10 text-[10px]">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-1 px-1">Row</th>
                            <th className="pb-1 px-1">Email</th>
                            <th className="pb-1 px-1">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.failed.map((f, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-1 px-1">{f.row}</td>
                              <td className="py-1 px-1 truncate max-w-[120px]">
                                {f.email}
                              </td>
                              <td className="py-1 px-1 text-red-500">
                                {f.reason}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Start Import'
              )}
            </Button>
          ) : (
            <Button
              onClick={() => {
                setOpen(false);
                setResult(null);
                setFile(null);
              }}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
