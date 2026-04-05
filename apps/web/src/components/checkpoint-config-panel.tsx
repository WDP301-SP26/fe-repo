'use client';

import {
  classCheckpointAPI,
  type ClassCheckpointConfig,
  type ClassCheckpointsResponse,
} from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

interface CheckpointConfigPanelProps {
  classId: string;
}

interface DraftCheckpoint {
  checkpoint_number: number;
  deadline_week: string;
  description: string;
}

function toDrafts(configs: ClassCheckpointConfig[]): DraftCheckpoint[] {
  return configs.map((cp) => ({
    checkpoint_number: cp.checkpoint_number,
    deadline_week: cp.deadline_week.toString(),
    description: cp.description ?? '',
  }));
}

export function CheckpointConfigPanel({ classId }: CheckpointConfigPanelProps) {
  const [data, setData] = useState<ClassCheckpointsResponse | null>(null);
  const [drafts, setDrafts] = useState<DraftCheckpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCheckpoints = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await classCheckpointAPI.getCheckpoints(classId);
      setData(result);
      setDrafts(toDrafts(result.checkpoints));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load checkpoints',
      );
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadCheckpoints();
  }, [loadCheckpoints]);

  const handleWeekChange = (index: number, value: string) => {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, deadline_week: value } : d)),
    );
  };

  const handleDescriptionChange = (index: number, value: string) => {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, description: value } : d)),
    );
  };

  const handleSave = async () => {
    // Validate ascending weeks
    const weeks = drafts.map((d) => Number(d.deadline_week));
    for (let i = 1; i < weeks.length; i++) {
      if (weeks[i] <= weeks[i - 1]) {
        toast.error(
          'Deadline weeks must be strictly ascending (Checkpoint 1 < 2 < 3).',
        );
        return;
      }
    }

    for (const w of weeks) {
      if (!Number.isInteger(w) || w < 1 || w > 15) {
        toast.error('Each deadline week must be an integer between 1 and 15.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const result = await classCheckpointAPI.upsertCheckpoints(
        classId,
        drafts.map((d) => ({
          checkpoint_number: d.checkpoint_number,
          deadline_week: Number(d.deadline_week),
          description: d.description || undefined,
        })),
      );
      setData(result);
      setDrafts(toDrafts(result.checkpoints));
      toast.success('Checkpoint configuration saved.');
    } catch (err) {
      toast.error('Failed to save checkpoints.', {
        description: err instanceof Error ? err.message : 'Unexpected error.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checkpoint Configuration</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Loading checkpoint configuration...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checkpoint Configuration</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Checkpoint Configuration</CardTitle>
            {data?.semester && (
              <p className="mt-1 text-sm text-muted-foreground">
                {data.semester.name} — Current week:{' '}
                <strong>{data.semester.current_week}</strong>
              </p>
            )}
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save configuration'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {drafts.map((draft, index) => (
          <div
            key={draft.checkpoint_number}
            className="rounded-md border p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold min-w-[100px]">
                Checkpoint {draft.checkpoint_number}
              </span>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">
                  Deadline week:
                </label>
                <Input
                  type="number"
                  min={1}
                  max={15}
                  className="w-20"
                  value={draft.deadline_week}
                  onChange={(e) => handleWeekChange(index, e.target.value)}
                />
              </div>
            </div>
            <textarea
              className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Requirement description — what students must deliver for this checkpoint"
              value={draft.description}
              onChange={(e) => handleDescriptionChange(index, e.target.value)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
