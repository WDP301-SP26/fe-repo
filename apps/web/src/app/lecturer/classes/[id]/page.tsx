'use client';

import { CheckpointConfigPanel } from '@/components/checkpoint-config-panel';
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
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClassGroups } from '@/hooks/use-api';
import { groupAPI, semesterAPI } from '@/lib/api';
import { isAPIError } from '@/lib/api-error';
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  GitBranch,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UserMinus,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

type GroupMember = {
  id: string;
  full_name: string;
  role_in_group: 'LEADER' | 'MEMBER' | 'MENTOR';
  email: string;
  avatar_url?: string;
  joined_at: string;
};

type ClassGroup = {
  id: string;
  name: string;
  project_name?: string | null;
  topic?: { name?: string | null } | null;
  members_count?: number;
  members?: GroupMember[];
  status?: string;
  github_repo_url?: string | null;
};

type PendingCapacityConfirm = {
  sourceGroupId: string;
  targetGroupId: string;
  memberId: string;
  targetGroupName: string;
  currentCapacity: number;
  requiredCapacity: number;
};

type UngroupedStudent = {
  id: string;
  student_id: string | null;
  full_name: string | null;
  email: string;
};

function DraggableMemberCard({
  member,
  sourceGroupId,
  disabled,
}: {
  member: GroupMember;
  sourceGroupId: string;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${sourceGroupId}:${member.id}`,
      data: {
        memberId: member.id,
        sourceGroupId,
        role: member.role_in_group,
      },
      disabled,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-md border-2 border-border bg-background px-3 py-2 text-xs shadow-sm transition ${
        isDragging
          ? 'border-primary opacity-70 shadow-md ring-2 ring-primary/25'
          : 'opacity-100 hover:border-primary/60'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-grab'}`}
    >
      <div className="font-medium truncate">{member.full_name}</div>
      <div className="mt-1 flex items-center gap-2">
        <Badge
          variant={member.role_in_group === 'LEADER' ? 'default' : 'outline'}
        >
          {member.role_in_group}
        </Badge>
      </div>
    </div>
  );
}

function TargetGroupDropZone({
  group,
  disabled,
}: {
  group: ClassGroup;
  disabled: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: group.id, disabled });
  const memberCount = group.members_count ?? group.members?.length ?? 0;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 border-border bg-background p-3 shadow-sm transition-all ${
        isOver
          ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/25'
          : 'hover:border-primary/60 hover:bg-muted/30'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">{group.name}</p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Target</Badge>
          <Badge variant="outline">{memberCount} members</Badge>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Drop members here</p>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState('groups');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupToDeleteId, setGroupToDeleteId] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<ClassGroup | null>(null);
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
  const [pendingMemberActionId, setPendingMemberActionId] = useState<
    string | null
  >(null);
  const [isReassigning, setIsReassigning] = useState(false);
  const [reassignSourceGroupId, setReassignSourceGroupId] = useState<
    string | null
  >(null);
  const [pendingCapacityConfirm, setPendingCapacityConfirm] =
    useState<PendingCapacityConfirm | null>(null);
  const [classMemberLimit, setClassMemberLimit] = useState(5);
  const [draggingMemberName, setDraggingMemberName] = useState<string | null>(
    null,
  );
  const [draggingTargetGroupId, setDraggingTargetGroupId] = useState<
    string | null
  >(null);
  const [selectedTargetGroupId, setSelectedTargetGroupId] = useState<
    string | null
  >(null);
  const [selectedUngroupedStudentId, setSelectedUngroupedStudentId] = useState<
    string | null
  >(null);
  const [assignTargetGroupId, setAssignTargetGroupId] = useState<string | null>(
    null,
  );
  const [isAssigningUngrouped, setIsAssigningUngrouped] = useState(false);

  const typedGroups = useMemo(() => (groups ?? []) as ClassGroup[], [groups]);

  useEffect(() => {
    if (!typedGroups.length) {
      setReassignSourceGroupId(null);
      return;
    }

    if (
      !reassignSourceGroupId ||
      !typedGroups.some((group) => group.id === reassignSourceGroupId)
    ) {
      setReassignSourceGroupId(typedGroups[0].id);
    }
  }, [typedGroups, reassignSourceGroupId]);

  useEffect(() => {
    const availableTargets = typedGroups.filter(
      (group) => group.id !== reassignSourceGroupId,
    );

    if (!availableTargets.length) {
      setSelectedTargetGroupId(null);
      return;
    }

    if (
      !selectedTargetGroupId ||
      !availableTargets.some((group) => group.id === selectedTargetGroupId)
    ) {
      setSelectedTargetGroupId(availableTargets[0].id);
    }
  }, [typedGroups, reassignSourceGroupId, selectedTargetGroupId]);

  useEffect(() => {
    const maxMembersInAnyGroup = typedGroups.reduce((max, group) => {
      const count = group.members_count ?? group.members?.length ?? 0;
      return Math.max(max, count);
    }, 0);
    setClassMemberLimit((current) =>
      Math.max(current, maxMembersInAnyGroup, 5),
    );
  }, [typedGroups]);

  useEffect(() => {
    if (!typedGroups.length) {
      setAssignTargetGroupId(null);
      return;
    }

    if (
      !assignTargetGroupId ||
      !typedGroups.some((g) => g.id === assignTargetGroupId)
    ) {
      setAssignTargetGroupId(typedGroups[0].id);
    }
  }, [typedGroups, assignTargetGroupId]);

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
  const { data: editingMembers, mutate: mutateEditingMembers } = useSWR(
    editingGroup?.id ? `/api/groups/${editingGroup.id}/members` : null,
    () => groupAPI.getGroupMembers(editingGroup!.id),
  );
  const { data: reassignSourceMembers, mutate: mutateReassignSourceMembers } =
    useSWR(
      reassignSourceGroupId
        ? `/api/groups/${reassignSourceGroupId}/members`
        : null,
      () => groupAPI.getGroupMembers(reassignSourceGroupId!),
    );
  const { data: selectedTargetMembers, mutate: mutateSelectedTargetMembers } =
    useSWR(
      selectedTargetGroupId
        ? `/api/groups/${selectedTargetGroupId}/members`
        : null,
      () => groupAPI.getGroupMembers(selectedTargetGroupId!),
    );
  const { data: ungroupedStudentsData, mutate: mutateUngroupedStudents } =
    useSWR(
      classId ? `/api/groups/class/${classId}/ungrouped-students` : null,
      () => groupAPI.getUngroupedStudentsByClass(classId),
    );

  const refreshGroups = async () => {
    const refreshed = (await mutateGroups()) as ClassGroup[] | undefined;
    if (editingGroup) {
      const next = (refreshed ?? typedGroups).find(
        (group) => group.id === editingGroup.id,
      );
      setEditingGroup(next ?? null);
    }
  };

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
    } catch (fetchError: any) {
      toast.error('Failed to create group', {
        description: fetchError?.message ?? 'Unexpected error',
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const openEditDialog = (group: ClassGroup) => {
    setEditingGroup(group);
    setEditForm({
      name: group.name ?? '',
      project_name: group.project_name ?? '',
      description: '',
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
      await Promise.all([refreshGroups(), mutateReviewSummary()]);
      setEditingGroup(null);
    } catch (fetchError: any) {
      toast.error('Failed to update group', {
        description: fetchError?.message ?? 'Unexpected error',
      });
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const targetGroup = typedGroups.find((group) => group.id === groupId);
    const targetGroupMemberCount =
      targetGroup?.members_count ?? targetGroup?.members?.length ?? 0;

    if (targetGroupMemberCount > 0) {
      toast.error('Cannot delete group that already has members');
      return;
    }

    setGroupToDeleteId(groupId);
    try {
      await groupAPI.deleteGroup(groupId);
      toast.success('Group deleted successfully');
      await Promise.all([mutateGroups(), mutateReviewSummary()]);
    } catch (fetchError: any) {
      toast.error('Failed to delete group', {
        description: fetchError?.message ?? 'Unexpected error',
      });
    } finally {
      setGroupToDeleteId(null);
    }
  };

  const getLeaderCount = (members: GroupMember[]) =>
    members.filter((member) => member.role_in_group === 'LEADER').length;

  const handlePromoteLeader = async (memberId: string) => {
    if (!editingGroup?.id) return;
    setPendingMemberActionId(memberId);
    try {
      await groupAPI.updateMember(editingGroup.id, memberId, {
        role_in_group: 'LEADER',
      });
      toast.success('Leader role updated');
      await Promise.all([mutateEditingMembers(), refreshGroups()]);
    } catch (fetchError: any) {
      toast.error('Failed to update leader', {
        description: fetchError?.message ?? 'Unexpected error',
      });
    } finally {
      setPendingMemberActionId(null);
    }
  };

  const handleKickMember = async (member: GroupMember) => {
    if (!editingGroup?.id) return;
    const members = editingMembers ?? [];
    if (
      member.role_in_group === 'LEADER' &&
      getLeaderCount(members as GroupMember[]) <= 1
    ) {
      toast.error(
        'This is the last leader. Promote another member to LEADER before removing.',
      );
      return;
    }

    setPendingMemberActionId(member.id);
    try {
      await groupAPI.removeMember(editingGroup.id, member.id);
      toast.success('Member removed from group');
      await Promise.all([mutateEditingMembers(), refreshGroups()]);
    } catch (fetchError: any) {
      toast.error('Failed to remove member', {
        description: fetchError?.message ?? 'Unexpected error',
      });
    } finally {
      setPendingMemberActionId(null);
    }
  };

  const performReassign = async (
    sourceGroupId: string,
    targetGroupId: string,
    memberId: string,
  ) => {
    await groupAPI.reassignMembers(sourceGroupId, {
      assignments: [{ user_id: memberId, target_group_id: targetGroupId }],
    });
    await Promise.all([
      mutateEditingMembers(),
      mutateReassignSourceMembers(),
      mutateSelectedTargetMembers(),
      mutateUngroupedStudents(),
      refreshGroups(),
    ]);
  };

  const resetDragIndicator = () => {
    setDraggingMemberName(null);
    setDraggingTargetGroupId(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const payload = event.active.data.current as
      | { memberId?: string; sourceGroupId?: string }
      | undefined;
    const memberId = payload?.memberId;

    if (!memberId) {
      resetDragIndicator();
      return;
    }

    const member = (reassignSourceMembers ?? []).find((m) => m.id === memberId);
    setDraggingMemberName(member?.full_name ?? 'Selected member');
    setDraggingTargetGroupId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!event.over) {
      setDraggingTargetGroupId(null);
      return;
    }

    setDraggingTargetGroupId(String(event.over.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!event.over) {
      resetDragIndicator();
      return;
    }

    const targetGroupId = String(event.over.id);
    const payload = event.active.data.current as
      | { memberId?: string; sourceGroupId?: string; role?: string }
      | undefined;

    const sourceGroupId = payload?.sourceGroupId;
    const memberId = payload?.memberId;
    const role = payload?.role;

    if (!sourceGroupId || !memberId || sourceGroupId === targetGroupId) {
      resetDragIndicator();
      return;
    }

    const sourceMembers = (reassignSourceMembers ?? []) as GroupMember[];

    if (role === 'LEADER' && getLeaderCount(sourceMembers) <= 1) {
      toast.error(
        'Cannot move the last leader out of this group. Promote someone else first.',
      );
      resetDragIndicator();
      return;
    }

    setIsReassigning(true);
    try {
      await performReassign(sourceGroupId, targetGroupId, memberId);
      toast.success('Member moved successfully');
    } catch (fetchError: any) {
      if (
        isAPIError(fetchError) &&
        fetchError.code === 'TARGET_GROUP_WOULD_EXCEED_MAX'
      ) {
        const details = fetchError.details ?? {};
        const currentCapacity = Number(details.current_capacity) || 5;
        const requiredCapacity =
          Number(details.required_capacity) || currentCapacity + 1;
        const targetGroup = typedGroups.find(
          (group) => group.id === targetGroupId,
        );

        setPendingCapacityConfirm({
          sourceGroupId,
          targetGroupId,
          memberId,
          targetGroupName: targetGroup?.name ?? 'Target Group',
          currentCapacity,
          requiredCapacity,
        });
        return;
      }

      toast.error('Failed to move member', {
        description: fetchError?.message ?? 'Unexpected error',
      });
    } finally {
      setIsReassigning(false);
      resetDragIndicator();
    }
  };

  const activeEditingGroup = editingGroup
    ? typedGroups.find((group) => group.id === editingGroup.id)
    : null;
  const reassignSourceGroup = typedGroups.find(
    (group) => group.id === reassignSourceGroupId,
  );
  const reassignTargetGroups = typedGroups.filter(
    (group) => group.id !== reassignSourceGroupId,
  );
  const selectedTargetGroup = reassignTargetGroups.find(
    (group) => group.id === selectedTargetGroupId,
  );
  const draggingTargetGroupName = draggingTargetGroupId
    ? typedGroups.find((group) => group.id === draggingTargetGroupId)?.name
    : null;
  const ungroupedStudents =
    (ungroupedStudentsData?.students as UngroupedStudent[] | undefined) ?? [];
  const selectedUngroupedStudent = ungroupedStudents.find(
    (student) => student.id === selectedUngroupedStudentId,
  );

  const handleAssignUngroupedStudent = async () => {
    if (!selectedUngroupedStudentId || !assignTargetGroupId) {
      toast.error('Select a student and a target group first');
      return;
    }

    setIsAssigningUngrouped(true);
    try {
      await groupAPI.addMember(assignTargetGroupId, {
        user_id: selectedUngroupedStudentId,
        role_in_group: 'MEMBER',
      });
      toast.success('Student assigned to group');
      setSelectedUngroupedStudentId(null);

      await Promise.all([
        mutateUngroupedStudents(),
        mutateSelectedTargetMembers(),
        mutateReassignSourceMembers(),
        refreshGroups(),
      ]);
    } catch (fetchError: any) {
      toast.error('Failed to assign student', {
        description: fetchError?.message ?? 'Unexpected error',
      });
    } finally {
      setIsAssigningUngrouped(false);
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
          </div>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="review">Review Snapshot</TabsTrigger>
          <TabsTrigger value="checkpoint">Checkpoint Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-6">
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
              if (!open && !isUpdatingGroup && !isReassigning) {
                setEditingGroup(null);
              }
            }}
          >
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>Edit Group</DialogTitle>
                <DialogDescription>
                  Update group info and manage leader/member roles.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-3">
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

                <div className="space-y-3 rounded-lg border p-3">
                  <h3 className="text-sm font-semibold">
                    {activeEditingGroup?.name ?? 'Selected Group'} - Direct
                    Actions
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    If the current leader leaves, promote another member to
                    leader first, then remove that leader.
                  </p>

                  <div className="space-y-2">
                    {(editingMembers ?? []).map((member) => {
                      const normalizedMember = member as GroupMember;
                      const isLeader =
                        normalizedMember.role_in_group === 'LEADER';
                      const isLastLeader =
                        isLeader &&
                        getLeaderCount(
                          (editingMembers ?? []) as GroupMember[],
                        ) <= 1;
                      const busy =
                        pendingMemberActionId === normalizedMember.id;

                      return (
                        <div
                          key={normalizedMember.id}
                          className="flex items-center justify-between rounded border px-3 py-2"
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {normalizedMember.full_name}
                            </p>
                            <Badge
                              variant={isLeader ? 'default' : 'outline'}
                              className="mt-1"
                            >
                              {normalizedMember.role_in_group}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isLeader || busy || isReassigning}
                              onClick={() =>
                                handlePromoteLeader(normalizedMember.id)
                              }
                            >
                              Make Leader
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={
                                busy || isReassigning || Boolean(isLastLeader)
                              }
                              onClick={() => handleKickMember(member)}
                              title={
                                isLastLeader
                                  ? 'Promote another leader before removing this one'
                                  : undefined
                              }
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <UserMinus className="mr-1 h-4 w-4" />
                                  Kick
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditingGroup(null)}
                  disabled={isUpdatingGroup || isReassigning}
                >
                  Close
                </Button>
                <Button
                  onClick={handleUpdateGroup}
                  disabled={isUpdatingGroup || isReassigning}
                >
                  {isUpdatingGroup ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Group Info'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog
            open={Boolean(pendingCapacityConfirm)}
            onOpenChange={(open) => {
              if (!open && !isReassigning) {
                setPendingCapacityConfirm(null);
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Target group is full</AlertDialogTitle>
                <AlertDialogDescription>
                  {pendingCapacityConfirm
                    ? `${pendingCapacityConfirm.targetGroupName} is currently at ${pendingCapacityConfirm.currentCapacity}/${pendingCapacityConfirm.currentCapacity} members. Increase max size to ${pendingCapacityConfirm.requiredCapacity}/${pendingCapacityConfirm.requiredCapacity} members and continue moving this student?`
                    : ''}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isReassigning}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isReassigning || !pendingCapacityConfirm}
                  onClick={async () => {
                    if (!pendingCapacityConfirm) return;
                    setIsReassigning(true);
                    try {
                      await groupAPI.updateClassMemberCapacity(classId, {
                        max_students_per_group:
                          pendingCapacityConfirm.requiredCapacity,
                      });
                      setClassMemberLimit(
                        pendingCapacityConfirm.requiredCapacity,
                      );
                      await performReassign(
                        pendingCapacityConfirm.sourceGroupId,
                        pendingCapacityConfirm.targetGroupId,
                        pendingCapacityConfirm.memberId,
                      );
                      toast.success('Capacity increased and member moved');
                    } catch (fetchError: any) {
                      toast.error('Failed to increase capacity', {
                        description: fetchError?.message ?? 'Unexpected error',
                      });
                    } finally {
                      setIsReassigning(false);
                      setPendingCapacityConfirm(null);
                    }
                  }}
                >
                  {isReassigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Increase limit & move'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading && <p>Loading groups...</p>}
            {error && <p className="text-red-500">Failed to load groups.</p>}

            {typedGroups.map((group, index) => {
              const memberCount =
                group.members_count ?? group.members?.length ?? 0;

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
                        <div className="font-medium">
                          Members ({memberCount}/{classMemberLimit})
                        </div>
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
                      onClick={() =>
                        router.push(`/lecturer/groups/${group.id}`)
                      }
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
                            <AlertDialogTitle>
                              Delete this group?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Group <strong>{group.name}</strong> will be
                              removed, including memberships inside it. This
                              action cannot be undone.
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

          <Card className="border-2 border-border shadow-md">
            <CardHeader className="border-b bg-linear-to-r from-muted/70 to-muted/20">
              <CardTitle>Member Reassignment</CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag from the source panel and drop into a target group panel.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-col gap-2 md:max-w-sm">
                <p className="text-sm font-medium">Source group</p>
                <Select
                  value={reassignSourceGroupId ?? ''}
                  onValueChange={setReassignSourceGroupId}
                >
                  <SelectTrigger className="border-2 border-border">
                    <SelectValue placeholder="Select source group" />
                  </SelectTrigger>
                  <SelectContent>
                    {typedGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Drag members from the selected source group to a target group.
                </p>
              </div>

              {draggingMemberName && (
                <div className="rounded-lg border-2 border-primary/40 bg-primary/5 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Dragging</Badge>
                    <p className="text-sm font-medium">{draggingMemberName}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {draggingTargetGroupName
                      ? `Drop into: ${draggingTargetGroupName}`
                      : 'Drop into a target group'}
                  </p>
                </div>
              )}

              <DndContext
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragCancel={resetDragIndicator}
                onDragEnd={handleDragEnd}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border-2 border-border bg-card p-3 shadow-sm">
                    <div className="mb-3 flex items-center justify-between border-b pb-2">
                      <p className="font-semibold">
                        {reassignSourceGroup?.name ?? 'Source Group'}
                      </p>
                      <Badge variant="outline">
                        {(reassignSourceMembers ?? []).length} members
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {(reassignSourceMembers ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No active members in this source group.
                        </p>
                      ) : (
                        (reassignSourceMembers ?? []).map((member) => (
                          <DraggableMemberCard
                            key={`${reassignSourceGroupId}-${member.id}`}
                            member={member as GroupMember}
                            sourceGroupId={reassignSourceGroupId || ''}
                            disabled={isReassigning}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border-2 border-border bg-card p-3 shadow-sm">
                    <div className="border-b pb-2">
                      <p className="text-sm font-semibold">Target groups</p>
                    </div>
                    {reassignTargetGroups.length === 0 ? (
                      <div className="rounded-lg border-2 border-border p-3 text-xs text-muted-foreground">
                        No other group available as target.
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-2 md:grid-cols-2">
                          {reassignTargetGroups.map((group) => {
                            const memberCount =
                              group.members_count ?? group.members?.length ?? 0;
                            const selected = group.id === selectedTargetGroupId;

                            return (
                              <button
                                key={group.id}
                                type="button"
                                onClick={() =>
                                  setSelectedTargetGroupId(group.id)
                                }
                                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                  selected
                                    ? 'border-primary bg-primary/10 shadow-sm'
                                    : 'border-border bg-background hover:border-primary/50'
                                }`}
                              >
                                <p className="font-semibold">{group.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {memberCount} members
                                </p>
                              </button>
                            );
                          })}
                        </div>

                        {selectedTargetGroup ? (
                          <TargetGroupDropZone
                            group={selectedTargetGroup}
                            disabled={isReassigning}
                          />
                        ) : null}

                        {selectedTargetGroup ? (
                          <div className="rounded-lg border border-border bg-background p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-sm font-semibold">
                                Members in {selectedTargetGroup.name}
                              </p>
                              <Badge variant="outline">
                                {(selectedTargetMembers ?? []).length} members
                              </Badge>
                            </div>
                            {(selectedTargetMembers ?? []).length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                This target group has no active members.
                              </p>
                            ) : (
                              <div className="grid gap-2 md:grid-cols-2">
                                {(selectedTargetMembers ?? []).map((member) => (
                                  <div
                                    key={member.id}
                                    className="rounded border px-2 py-1 text-xs"
                                  >
                                    <p className="font-medium truncate">
                                      {member.full_name}
                                    </p>
                                    <div className="mt-1">
                                      <Badge
                                        variant={
                                          member.role_in_group === 'LEADER'
                                            ? 'default'
                                            : 'outline'
                                        }
                                      >
                                        {member.role_in_group}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </DndContext>
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-md">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle>Students Without Group</CardTitle>
              <p className="text-sm text-muted-foreground">
                Students below are enrolled in this class but not assigned to
                any active group.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm">
                <span className="font-medium">Ungrouped students</span>
                <Badge
                  variant={
                    ungroupedStudents.length ? 'destructive' : 'secondary'
                  }
                >
                  {ungroupedStudents.length}
                </Badge>
              </div>

              {ungroupedStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Great. All students in this class are already assigned to
                  groups.
                </p>
              ) : (
                <>
                  <div className="rounded-lg border border-border bg-background p-3 space-y-3">
                    <p className="text-sm font-medium">
                      Assign selected student
                    </p>
                    <div className="grid gap-2 md:grid-cols-[1fr_220px_auto]">
                      <div className="text-sm text-muted-foreground">
                        {selectedUngroupedStudent
                          ? `Selected: ${selectedUngroupedStudent.full_name ?? selectedUngroupedStudent.email}`
                          : 'Click a student below to select'}
                      </div>
                      <Select
                        value={assignTargetGroupId ?? ''}
                        onValueChange={setAssignTargetGroupId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose target group" />
                        </SelectTrigger>
                        <SelectContent>
                          {typedGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleAssignUngroupedStudent}
                        disabled={
                          isAssigningUngrouped ||
                          !selectedUngroupedStudentId ||
                          !assignTargetGroupId
                        }
                      >
                        {isAssigningUngrouped ? 'Assigning...' : 'Assign'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {ungroupedStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() =>
                          setSelectedUngroupedStudentId(student.id)
                        }
                        className={`flex w-full items-center justify-between rounded-lg border bg-background px-3 py-2 text-left transition ${
                          selectedUngroupedStudentId === student.id
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/60'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {student.full_name ?? student.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.student_id ?? 'No Student ID'} -{' '}
                            {student.email}
                          </p>
                        </div>
                        <Badge variant="destructive">UNGROUPED</Badge>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <LecturerReviewQuickPanel
            summary={reviewSummary}
            isLoading={reviewLoading}
            classId={classId}
            onSaved={() => {
              void mutateReviewSummary();
            }}
          />
        </TabsContent>

        <TabsContent value="checkpoint">
          <CheckpointConfigPanel classId={classId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
