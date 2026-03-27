'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { semesterAPI, type SemesterInfo } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const ENABLE_DEMO_WEEK_OVERRIDE =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_WEEK_OVERRIDE === 'true';
const DEMO_WEEK_OVERRIDE_ALLOWED_ROLES = (
  process.env.NEXT_PUBLIC_DEMO_WEEK_OVERRIDE_ALLOWED_ROLES || 'ADMIN,LECTURER'
)
  .split(',')
  .map((value) => value.trim().toUpperCase())
  .filter(Boolean);

interface DemoWeekOverrideCardProps {
  semester: SemesterInfo | null;
  onUpdated?: () => Promise<void> | void;
}

export function DemoWeekOverrideCard({
  semester,
  onUpdated,
}: DemoWeekOverrideCardProps) {
  const user = useAuthStore((state) => state.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string>(
    semester?.current_week ? String(semester.current_week) : '1',
  );

  const userRole = user?.role?.toUpperCase();
  const canOverride =
    !!userRole && DEMO_WEEK_OVERRIDE_ALLOWED_ROLES.includes(userRole);
  const isVisible = ENABLE_DEMO_WEEK_OVERRIDE && !!semester && canOverride;

  const weekOptions = useMemo(
    () => Array.from({ length: 10 }, (_, index) => String(index + 1)),
    [],
  );

  useEffect(() => {
    if (semester?.current_week) {
      setSelectedWeek(String(semester.current_week));
    }
  }, [semester?.current_week]);

  if (!isVisible || !semester) {
    return null;
  }

  const handleApply = async () => {
    setIsSubmitting(true);
    try {
      await semesterAPI.setCurrentWeek(semester.id, Number(selectedWeek));
      toast.success('Current week updated for demo.');
      await onUpdated?.();
    } catch (error: any) {
      toast.error('Failed to update current week', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-dashed border-amber-400/60 bg-amber-50/40">
      <CardHeader>
        <CardTitle className="text-base">Hidden Demo Control</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="text-sm text-muted-foreground md:flex-1">
          Override the current week for demo only. Every change is audited in
          the backend.
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={selectedWeek}
          onChange={(event) => setSelectedWeek(event.target.value)}
          disabled={isSubmitting}
        >
          {weekOptions.map((week) => (
            <option key={week} value={week}>
              Week {week}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={
            isSubmitting || Number(selectedWeek) === semester.current_week
          }
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Apply
        </Button>
      </CardContent>
    </Card>
  );
}
