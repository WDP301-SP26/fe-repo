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
import type {
  ExaminerAssignmentBoard,
  SemesterRosterClass,
  SemesterRosterLecturer,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import type { ReactNode } from 'react';

function DraggableLecturer({
  lecturer,
  prefix,
}: {
  lecturer: {
    id: string;
    full_name: string | null;
    email: string;
    teaching_classes?: Array<{ class_code: string }>;
  };
  prefix: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${prefix}:${lecturer.id}`,
      data: { lecturerId: lecturer.id },
    });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'rounded-lg border bg-background p-3 text-sm shadow-sm',
        isDragging && 'opacity-60',
      )}
      style={
        transform
          ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            }
          : undefined
      }
    >
      <div className="font-medium">{lecturer.full_name || lecturer.email}</div>
      <div className="text-xs text-muted-foreground">{lecturer.email}</div>
      {lecturer.teaching_classes && lecturer.teaching_classes.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {lecturer.teaching_classes.map((item) => (
            <Badge
              key={`${lecturer.id}-${item.class_code}`}
              variant="secondary"
            >
              Teaches {item.class_code}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DroppableShell({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl border border-dashed p-3 transition-colors',
        isOver && 'border-primary bg-primary/5',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TeachingAssignmentBoard({
  lecturers,
  classes,
  onAssign,
  pendingClassId,
}: {
  lecturers: SemesterRosterLecturer[];
  classes: SemesterRosterClass[];
  onAssign: (classId: string, lecturerId: string) => void;
  pendingClassId?: string | null;
}) {
  const handleDragEnd = (event: DragEndEvent) => {
    const lecturerId = event.active.data.current?.lecturerId as
      | string
      | undefined;
    const overId = event.over?.id?.toString();
    if (!lecturerId || !overId?.startsWith('teaching-class:')) return;
    onAssign(overId.replace('teaching-class:', ''), lecturerId);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="border-2 border-slate-300 shadow-sm">
          <CardHeader>
            <CardTitle>Lecturer Pool</CardTitle>
            <CardDescription>
              Drag a lecturer card into a class tile to update teaching
              assignment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {lecturers.map((lecturer) => (
              <DraggableLecturer
                key={lecturer.id}
                lecturer={{
                  ...lecturer,
                  teaching_classes: lecturer.teaching_classes.map((item) => ({
                    class_code: item.class_code,
                  })),
                }}
                prefix="teaching-lecturer"
              />
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((classItem) => (
            <DroppableShell
              key={classItem.id}
              id={`teaching-class:${classItem.id}`}
              className={cn(
                'space-y-3 border-2 border-solid border-slate-300 bg-slate-50/40',
                pendingClassId === classItem.id && 'opacity-60',
              )}
            >
              <div>
                <div className="font-medium">{classItem.code}</div>
                <div className="text-sm text-muted-foreground">
                  {classItem.name}
                </div>
              </div>
              <div className="rounded-md border border-slate-300 bg-muted/50 p-3 text-sm">
                <div className="text-xs uppercase text-muted-foreground">
                  Current lecturer
                </div>
                <div className="mt-1 font-medium">
                  {classItem.lecturer_name || 'Unassigned'}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {classItem.student_count} students
              </div>
            </DroppableShell>
          ))}
        </div>
      </div>
    </DndContext>
  );
}

export function ExaminerAssignmentBoardView({
  board,
  onAssign,
  onRemove,
  pendingClassId,
}: {
  board: ExaminerAssignmentBoard;
  onAssign: (classId: string, lecturerId: string) => void;
  onRemove: (classId: string, lecturerId: string) => void;
  pendingClassId?: string | null;
}) {
  const handleDragEnd = (event: DragEndEvent) => {
    const lecturerId = event.active.data.current?.lecturerId as
      | string
      | undefined;
    const overId = event.over?.id?.toString();
    if (!lecturerId || !overId?.startsWith('examiner-class:')) return;
    onAssign(overId.replace('examiner-class:', ''), lecturerId);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Examiner Pool</CardTitle>
            <CardDescription>
              Drag a lecturer onto a class after week 10. Lecturer teaching the
              same class is blocked.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {board.lecturers.map((lecturer) => (
              <DraggableLecturer
                key={lecturer.id}
                lecturer={lecturer}
                prefix="examiner-lecturer"
              />
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {board.classes.map((classItem) => (
            <DroppableShell
              key={classItem.id}
              id={`examiner-class:${classItem.id}`}
              className={cn(
                'space-y-3',
                pendingClassId === classItem.id && 'opacity-60',
              )}
            >
              <div>
                <div className="font-medium">{classItem.code}</div>
                <div className="text-sm text-muted-foreground">
                  {classItem.name}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Teaching lecturer: {classItem.lecturer_name || 'Unassigned'}
              </div>
              <div className="flex flex-wrap gap-2">
                {classItem.examiner_assignments.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    No examiners assigned yet.
                  </span>
                ) : (
                  classItem.examiner_assignments.map((assignment) => (
                    <div
                      key={`${classItem.id}-${assignment.lecturer_id}`}
                      className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                    >
                      <span>
                        {assignment.lecturer_name || assignment.lecturer_email}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-auto p-0 text-xs"
                        onClick={() =>
                          onRemove(classItem.id, assignment.lecturer_id)
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </DroppableShell>
          ))}
        </div>
      </div>
    </DndContext>
  );
}
