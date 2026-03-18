'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { groupAPI, topicAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import {
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import useSWR, { useSWRConfig } from 'swr';

export default function TopicLabPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const user = useAuthStore((state) => state.user);
  const { mutate } = useSWRConfig();

  const { data: group, isLoading } = useSWR(`/api/groups/${groupId}`, () =>
    groupAPI.getGroupDetails(groupId),
  );

  const isLeader =
    group?.members?.find((m: any) => m.id === user?.id)?.role_in_group ===
    'LEADER';

  const [mode, setMode] = useState<'AUTO' | 'REFINE'>('AUTO');
  const [seedTopicName, setSeedTopicName] = useState('');
  const [projectDomain, setProjectDomain] = useState('');
  const [teamContext, setTeamContext] = useState('');
  const [problemSpace, setProblemSpace] = useState('');
  const [actorsHint, setActorsHint] = useState('');

  const [draft, setDraft] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (mode === 'REFINE' && !seedTopicName.trim()) {
      toast.warning('Please provide a seed topic name for refine mode.');
      return;
    }

    setGenerating(true);
    try {
      const result = await topicAPI.generateTopicIdea({
        mode,
        seed_name: seedTopicName.trim() || undefined,
        project_domain: projectDomain.trim() || undefined,
        team_context: teamContext.trim() || undefined,
        problem_space: problemSpace.trim() || undefined,
        primary_actors_hint: actorsHint.trim() || undefined,
      });

      setDraft(result);
      toast.success('Draft generated. Review and edit before applying.');
    } catch (err: any) {
      toast.error('Failed to generate topic draft', {
        description: err.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAndApply = async () => {
    if (!draft?.topic_name) {
      toast.warning('Please generate a draft first.');
      return;
    }

    setSaving(true);
    try {
      const created = await topicAPI.createAiTopic({
        topic_name: draft.topic_name,
        context: draft.context,
        problem_statement: draft.problem_statement,
        primary_actors: draft.primary_actors,
        uniqueness_rationale: draft.uniqueness_rationale,
      });

      await groupAPI.updateGroup(groupId, { topic_id: created.id });
      await Promise.all([
        mutate(`/api/groups/${groupId}`),
        mutate('/api/topics/available'),
      ]);

      toast.success('Topic saved and applied to this group.');
      router.push(`/student/groups/${groupId}`);
    } catch (err: any) {
      toast.error('Failed to save/apply topic', {
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading topic lab...</div>;
  }

  if (!group) {
    return <div className="p-8 text-destructive">Group not found.</div>;
  }

  if (!isLeader) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert>
          <AlertTitle>Leader access required</AlertTitle>
          <AlertDescription>
            Only group leaders can use Topic Lab and apply AI-generated topics.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Topic Lab</h1>
          <p className="text-muted-foreground">
            AI-assisted ideation for group {group.name}. Create unique,
            structured topics.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Ideation Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant={mode === 'AUTO' ? 'default' : 'outline'}
              onClick={() => setMode('AUTO')}
            >
              AI Suggest New Topic
            </Button>
            <Button
              type="button"
              variant={mode === 'REFINE' ? 'default' : 'outline'}
              onClick={() => setMode('REFINE')}
            >
              AI Refine My Topic Name
            </Button>
          </div>

          {mode === 'REFINE' && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Seed topic name
              </label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Example: Smart attendance tracking"
                value={seedTopicName}
                onChange={(e) => setSeedTopicName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Project domain
            </label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Example: Education technology"
              value={projectDomain}
              onChange={(e) => setProjectDomain(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Team context
            </label>
            <textarea
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Example: Team of 5, 12-week capstone, web-first delivery"
              value={teamContext}
              onChange={(e) => setTeamContext(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Problem space
            </label>
            <textarea
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Describe the pain point this solution must solve"
              value={problemSpace}
              onChange={(e) => setProblemSpace(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Primary actors hint
            </label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Example: Team leader, student, lecturer"
              value={actorsHint}
              onChange={(e) => setActorsHint(e.target.value)}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="mr-2 h-4 w-4" />
            )}
            {generating ? 'Generating draft...' : 'Generate Topic Draft'}
          </Button>
        </CardContent>
      </Card>

      {draft && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Draft Review (Editable)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={draft.topic_name || ''}
              onChange={(e) =>
                setDraft((prev: any) => ({
                  ...prev,
                  topic_name: e.target.value,
                }))
              }
            />
            <textarea
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={draft.context || ''}
              onChange={(e) =>
                setDraft((prev: any) => ({ ...prev, context: e.target.value }))
              }
            />
            <textarea
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={draft.problem_statement || ''}
              onChange={(e) =>
                setDraft((prev: any) => ({
                  ...prev,
                  problem_statement: e.target.value,
                }))
              }
            />
            <textarea
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={draft.primary_actors || ''}
              onChange={(e) =>
                setDraft((prev: any) => ({
                  ...prev,
                  primary_actors: e.target.value,
                }))
              }
            />
            <textarea
              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={draft.uniqueness_rationale || ''}
              onChange={(e) =>
                setDraft((prev: any) => ({
                  ...prev,
                  uniqueness_rationale: e.target.value,
                }))
              }
            />

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSaveAndApply}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {saving ? 'Saving and applying...' : 'Save and Apply to Group'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
