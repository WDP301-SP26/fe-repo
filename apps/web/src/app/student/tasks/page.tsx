'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  fetchAPI,
  taskAPI,
  type TaskItem,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/api';
import { isAPIError } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

interface StudentGroupOption {
  id: string;
  name: string;
  jira_project_key?: string | null;
  my_role_in_group?: string | null;
}

const STATUS_COLUMNS: Array<{ status: TaskStatus; title: string }> = [
  { status: 'TODO', title: 'To Do' },
  { status: 'IN_PROGRESS', title: 'In Progress' },
  { status: 'DONE', title: 'Done' },
  { status: 'BLOCKED', title: 'Archived' },
];

const PRIORITY_OPTIONS: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

function statusBadgeVariant(
  status: TaskStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'DONE') return 'default';
  if (status === 'BLOCKED') return 'destructive';
  if (status === 'IN_PROGRESS') return 'secondary';
  return 'outline';
}

function syncBadgeVariant(
  syncStatus: TaskItem['jira_sync_status'],
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (syncStatus === 'SUCCESS') return 'default';
  if (syncStatus === 'FAILED') return 'destructive';
  return 'secondary';
}

function statusLabel(status: TaskStatus): string {
  if (status === 'TODO') return 'To Do';
  if (status === 'IN_PROGRESS') return 'In Progress';
  if (status === 'DONE') return 'Done';
  return 'Archived';
}

function DraggableTaskCard({
  task,
  disabled,
}: {
  task: TaskItem;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `task:${task.id}`,
      data: {
        taskId: task.id,
      },
      disabled,
    });

  return (
    <div
      ref={setNodeRef}
      style={
        transform
          ? {
              transform: CSS.Translate.toString(transform),
            }
          : undefined
      }
      className={cn(
        'rounded-lg border bg-background p-3 shadow-sm transition',
        isDragging && 'opacity-60',
        disabled && 'opacity-70',
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold leading-tight">{task.title}</p>
          {task.description ? (
            <p className="text-xs text-muted-foreground">{task.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label="Drag task card"
          {...attributes}
          {...listeners}
          disabled={disabled}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant={statusBadgeVariant(task.status)}>
          {statusLabel(task.status)}
        </Badge>
        <Badge variant="outline">{task.priority}</Badge>
        <Badge variant={syncBadgeVariant(task.jira_sync_status)}>
          Jira {task.jira_sync_status}
        </Badge>
      </div>

      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <p>
          Issue key:{' '}
          <span className="font-semibold text-foreground">
            {task.jira_issue_key || 'N/A'}
          </span>
        </p>
        {task.jira_sync_reason ? (
          <p>
            Sync reason:{' '}
            <span className="font-semibold text-foreground">
              {task.jira_sync_reason}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function DroppableColumn({
  status,
  title,
  children,
}: {
  status: TaskStatus;
  title: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${status}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-72 rounded-xl border bg-card p-3',
        isOver && 'border-primary bg-primary/5',
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function StudentTasksPage() {
  const { user } = useAuthStore();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [isCreating, setIsCreating] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const { data: myGroupsResponse, isLoading: loadingGroups } = useSWR(
    user ? '/api/groups' : null,
    () => fetchAPI<{ data: StudentGroupOption[] }>('/api/groups'),
  );

  const myGroups = useMemo<StudentGroupOption[]>(() => {
    const payload = myGroupsResponse as
      | { data?: StudentGroupOption[] }
      | StudentGroupOption[]
      | undefined;

    if (Array.isArray(payload)) {
      return payload;
    }

    return payload?.data ?? [];
  }, [myGroupsResponse]);

  useEffect(() => {
    if (selectedGroupId || myGroups.length === 0) {
      return;
    }

    const preferredGroup =
      myGroups.find(
        (group) => (group.my_role_in_group || '').toUpperCase() === 'LEADER',
      ) || myGroups[0];

    setSelectedGroupId(preferredGroup.id);
  }, [myGroups, selectedGroupId]);

  const selectedGroup =
    myGroups.find((group) => group.id === selectedGroupId) || null;

  const {
    data: tasksResponse,
    isLoading: loadingTasks,
    mutate: mutateTasks,
  } = useSWR(
    selectedGroupId ? `/api/tasks?group_id=${selectedGroupId}&limit=100` : null,
    () =>
      taskAPI.listTasks({
        group_id: selectedGroupId,
        limit: 100,
      }),
  );

  const tasks = tasksResponse?.data ?? [];

  const buildUpdatePayload = (
    task: TaskItem,
    nextStatus: TaskStatus,
  ): {
    status: TaskStatus;
    assignee_id?: string;
  } => {
    const payload: {
      status: TaskStatus;
      assignee_id?: string;
    } = { status: nextStatus };

    // BE normalizes IN_PROGRESS to TODO when task has no assignee.
    if (nextStatus === 'IN_PROGRESS' && !task.assignee_id && user?.id) {
      payload.assignee_id = user.id;
    }

    return payload;
  };

  const tasksByStatus = useMemo<Record<TaskStatus, TaskItem[]>>(() => {
    return {
      TODO: tasks.filter((task) => task.status === 'TODO'),
      IN_PROGRESS: tasks.filter((task) => task.status === 'IN_PROGRESS'),
      BLOCKED: tasks.filter((task) => task.status === 'BLOCKED'),
      DONE: tasks.filter((task) => task.status === 'DONE'),
    };
  }, [tasks]);

  const createTask = async () => {
    if (!selectedGroupId || !title.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const createdTask = await taskAPI.createTask({
        group_id: selectedGroupId,
        title: title.trim(),
        description: description.trim() || undefined,
        status: 'TODO',
        priority,
      });

      setTitle('');
      setDescription('');
      setPriority('MEDIUM');

      await mutateTasks((current) => {
        if (!current) return current;
        return {
          ...current,
          data: [createdTask, ...current.data],
          meta: {
            ...current.meta,
            total: current.meta.total + 1,
          },
        };
      }, false);

      toast.success('Task created successfully.');
      void mutateTasks();
    } catch (error) {
      const message = isAPIError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Failed to create task.';

      toast.error('Failed to create task', {
        description: message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const moveTask = async (task: TaskItem, nextStatus: TaskStatus) => {
    if (task.status === nextStatus) {
      return;
    }

    const previousStatus = task.status;
    setUpdatingTaskId(task.id);

    await mutateTasks((current) => {
      if (!current) return current;
      return {
        ...current,
        data: current.data.map((item) =>
          item.id === task.id ? { ...item, status: nextStatus } : item,
        ),
      };
    }, false);

    try {
      const updated = await taskAPI.updateTask(
        task.id,
        buildUpdatePayload(task, nextStatus),
      );

      await mutateTasks((current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((item) =>
            item.id === updated.id ? updated : item,
          ),
        };
      }, false);

      toast.success(`Moved to ${statusLabel(nextStatus)}.`);
      void mutateTasks();
    } catch (error) {
      await mutateTasks((current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((item) =>
            item.id === task.id ? { ...item, status: previousStatus } : item,
          ),
        };
      }, false);

      const message = isAPIError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Failed to update task status.';

      toast.error('Cannot move task', {
        description: message,
      });
      void mutateTasks();
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (updatingTaskId) {
      return;
    }

    const taskId = event.active.data.current?.taskId as string | undefined;
    const overId = event.over?.id?.toString();

    if (!taskId || !overId || !overId.startsWith('column:')) {
      return;
    }

    const nextStatus = overId.replace('column:', '') as TaskStatus;
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    void moveTask(task, nextStatus);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">
          Create internal tasks and drag cards across columns. When Jira is
          linked, status updates are synchronized to Jira.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Task</CardTitle>
          <CardDescription>
            This screen is optimized for student demo flow. Team leader role is
            recommended for full create/update permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium">Group</label>
              <select
                value={selectedGroupId}
                onChange={(event) => setSelectedGroupId(event.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                disabled={loadingGroups || myGroups.length === 0}
              >
                {myGroups.length === 0 ? (
                  <option value="">No joined groups</option>
                ) : null}
                {myGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                    {group.jira_project_key
                      ? ` (${group.jira_project_key})`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Implement student dashboard API"
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium">Priority</label>
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Optional description for Jira sync payload"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={createTask}
              disabled={
                isCreating || !selectedGroupId || title.trim().length === 0
              }
            >
              {isCreating ? 'Creating...' : 'Create Task'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Group role:{' '}
              <span className="font-semibold text-foreground">
                {selectedGroup?.my_role_in_group || 'N/A'}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Jira key:{' '}
              <span className="font-semibold text-foreground">
                {selectedGroup?.jira_project_key || 'Not linked'}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
          {STATUS_COLUMNS.map((column) => (
            <DroppableColumn
              key={column.status}
              status={column.status}
              title={`${column.title} (${tasksByStatus[column.status].length})`}
            >
              {loadingTasks ? (
                <p className="text-xs text-muted-foreground">
                  Loading tasks...
                </p>
              ) : tasksByStatus[column.status].length === 0 ? (
                <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  Drop a task here
                </p>
              ) : (
                tasksByStatus[column.status].map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    disabled={updatingTaskId === task.id}
                  />
                ))
              )}
            </DroppableColumn>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
