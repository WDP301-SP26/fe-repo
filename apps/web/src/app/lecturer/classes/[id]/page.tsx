'use client';

import { LecturerReviewQuickPanel } from '@/components/lecturer-review-quick-panel';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useClassGroups } from '@/hooks/use-api';
import { groupAPI, semesterAPI } from '@/lib/api';
import {
  ArrowLeft,
  GitBranch,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

export default function ClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const {
    data: groups,
    error,
    isLoading,
    mutate: mutateGroups,
  } = useClassGroups(classId);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupToDeleteId, setGroupToDeleteId] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '',
    project_name: '',
    description: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    project_name: '',
    description: '',
  });
  const {
    data: reviewSummary,
    isLoading: reviewLoading,
    mutate: mutateReviewSummary,
  } = useSWR(
    classId
      ? `/api/semesters/current/reviews/lecturer-summary?classId=${classId}`
      : null,
    () => semesterAPI.getLecturerReviewSummary(classId),
  );

  const handleCreateGroup = async () => {
    if (!createForm.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsCreatingGroup(true);
    try {
      await groupAPI.createGroup({
        class_id: classId,
        name: createForm.name.trim(),
        project_name: createForm.project_name.trim() || undefined,
        description: createForm.description.trim() || undefined,
      });

      toast.success('Group created successfully');
      setCreateForm({ name: '', project_name: '', description: '' });
      setIsCreateDialogOpen(false);
      await Promise.all([mutateGroups(), mutateReviewSummary()]);
    } catch (error: any) {
      toast.error('Failed to create group', {
        description: error?.message ?? 'Unexpected error',
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const openEditDialog = (group: any) => {
    setEditingGroup(group);
    setEditForm({
      name: group.name ?? '',
      project_name: group.project_name ?? '',
      description: group.description ?? '',
    });
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup?.id) return;
    if (!editForm.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsUpdatingGroup(true);
    try {
      await groupAPI.updateGroup(editingGroup.id, {
        name: editForm.name.trim(),
        project_name: editForm.project_name.trim() || null,
        description: editForm.description.trim() || null,
      });

      toast.success('Group updated successfully');
      setEditingGroup(null);
      await Promise.all([mutateGroups(), mutateReviewSummary()]);
    } catch (error: any) {
      toast.error('Failed to update group', {
        description: error?.message ?? 'Unexpected error',
      });
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const targetGroup = groups?.find((group: any) => group.id === groupId);
    const targetGroupMemberCount =
      targetGroup?.members_count ??
      targetGroup?.membersCount ??
      targetGroup?.members?.length ??
      0;

    if (targetGroupMemberCount > 0) {
      toast.error('Cannot delete group that already has members');
      return;
    }

    setGroupToDeleteId(groupId);
    try {
      await groupAPI.deleteGroup(groupId);
      toast.success('Group deleted successfully');
      await Promise.all([mutateGroups(), mutateReviewSummary()]);
    } catch (error: any) {
      toast.error('Failed to delete group', {
        description: error?.message ?? 'Unexpected error',
      });
    } finally {
      setGroupToDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Class Details</h1>
            <p className="text-muted-foreground">
              Manage the groups and students for this class.
            </p>
          </div>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!isCreatingGroup) {
            setIsCreateDialogOpen(open);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new group for this class. Students can join it later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Group name (required)"
              value={createForm.name}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <Input
              placeholder="Project name (optional)"
              value={createForm.project_name}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  project_name: event.target.value,
                }))
              }
            />
            <Input
              placeholder="Description (optional)"
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreatingGroup}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={isCreatingGroup}>
              {isCreatingGroup ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingGroup)}
        onOpenChange={(open) => {
          if (!open && !isUpdatingGroup) {
            setEditingGroup(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update group information for this class.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Group name (required)"
              value={editForm.name}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <Input
              placeholder="Project name (optional)"
              value={editForm.project_name}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  project_name: event.target.value,
                }))
              }
            />
            <Input
              placeholder="Description (optional)"
              value={editForm.description}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingGroup(null)}
              disabled={isUpdatingGroup}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateGroup} disabled={isUpdatingGroup}>
              {isUpdatingGroup ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LecturerReviewQuickPanel
        summary={reviewSummary}
        isLoading={reviewLoading}
        classId={classId}
        onSaved={() => {
          void mutateReviewSummary();
        }}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p>Loading groups...</p>}
        {error && <p className="text-red-500">Failed to load groups.</p>}

        {groups?.map((group: any, index: number) => {
          const memberCount =
            group.members_count ??
            group.membersCount ??
            group.members?.length ??
            0;

          return (
            <Card
              key={group.id}
              className="hover:border-primary transition-colors hover:shadow-md"
            >
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>{group.name}</span>
                  <span className="text-sm font-normal text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                    Group {index + 1}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Members ({memberCount}/5)</div>
                    {memberCount === 0 && (
                      <span className="text-muted-foreground text-xs italic">
                        Empty
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                  <div className="w-full">
                    <div className="font-medium">Topic Workspace</div>
                    {group.topic ? (
                      <div className="mt-1">
                        <p className="text-primary font-semibold">
                          {group.topic.name}
                        </p>
                        {group.github_repo_url ? (
                          <a
                            href={group.github_repo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-500 hover:underline block truncate mt-1"
                          >
                            {group.github_repo_url}
                          </a>
                        ) : (
                          <span className="text-xs text-orange-500 block mt-1">
                            Repo Pending Setup
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs italic mt-1">
                        Pending Selection
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t bg-muted/10 space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/lecturer/groups/${group.id}`)}
                >
                  View Analytics & Commits
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => openEditDialog(group)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        disabled={memberCount > 0}
                        title={
                          memberCount > 0
                            ? 'Group has members, deletion is disabled'
                            : undefined
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this group?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Group <strong>{group.name}</strong> will be removed,
                          including memberships inside it. This action cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          disabled={groupToDeleteId === group.id}
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteGroup(group.id)}
                          disabled={groupToDeleteId === group.id}
                        >
                          {groupToDeleteId === group.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Delete Group'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
