'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMyClasses } from '@/hooks/use-api';
import { useSrsLecturerSubmissions } from '@/hooks/use-api';
import { SrsStatusBadge } from '@/components/srs-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export default function LecturerSrsReviewsPage() {
  const [classFilter, setClassFilter] = useState<string | undefined>(undefined);
  const { data: classes } = useMyClasses();
  const { data: submissions, isLoading } =
    useSrsLecturerSubmissions(classFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SRS Submissions</h1>
        <p className="mt-1 text-muted-foreground">
          Review SRS documents submitted by student groups.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={classFilter ?? 'all'}
          onValueChange={(v) => setClassFilter(v === 'all' ? undefined : v)}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes?.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !submissions?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No SRS submissions pending review.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.srsDocument?.group?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      {s.srsDocument?.group?.class?.name ?? '—'}
                    </TableCell>
                    <TableCell>v{s.version_number}</TableCell>
                    <TableCell>{s.submittedBy?.full_name ?? '—'}</TableCell>
                    <TableCell>
                      {s.submitted_at
                        ? new Date(s.submitted_at).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <SrsStatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm">
                        <Link
                          href={`/lecturer/srs-reviews/${s.srsDocument?.group?.id}/${s.id}`}
                        >
                          Review
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
