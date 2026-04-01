'use client';

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminUser, userAPI } from '@/lib/api';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

interface CreateFormState {
  email: string;
  full_name: string;
  student_id: string;
  password: string;
}

interface EditFormState {
  full_name: string;
  student_id: string;
  password: string;
}

type UserRoleFilter = 'ALL' | AdminUser['role'];

const PAGE_SIZE = 10;

const emptyCreateForm: CreateFormState = {
  email: '',
  full_name: '',
  student_id: '',
  password: '',
};

const emptyEditForm: EditFormState = {
  full_name: '',
  student_id: '',
  password: '',
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected error';
}

function formatRangeLabel(total: number, currentPage: number) {
  if (total === 0) {
    return '0 users';
  }

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, total);
  return `${start}-${end} of ${total} users`;
}

export default function AdminUsersPage() {
  const [createForm, setCreateForm] =
    useState<CreateFormState>(emptyCreateForm);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: users,
    error,
    isLoading,
    mutate,
  } = useSWR<AdminUser[]>('/api/users', () => userAPI.getAllUsers());

  const sortedUsers = useMemo(
    () => [...(users ?? [])].sort((a, b) => a.email.localeCompare(b.email)),
    [users],
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    return sortedUsers.filter((user) => {
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        (user.full_name ?? '').toLowerCase().includes(normalizedSearch) ||
        (user.student_id ?? '').toLowerCase().includes(normalizedSearch);

      return matchesRole && matchesSearch;
    });
  }, [normalizedSearch, roleFilter, sortedUsers]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedSearch, roleFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredUsers]);

  const roleCounts = useMemo(() => {
    return sortedUsers.reduce(
      (acc, user) => {
        acc[user.role] += 1;
        return acc;
      },
      { STUDENT: 0, LECTURER: 0, ADMIN: 0 } satisfies Record<
        AdminUser['role'],
        number
      >,
    );
  }, [sortedUsers]);

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name ?? '',
      student_id: user.student_id ?? '',
      password: '',
    });
    setIsEditOpen(true);
  };

  const createUser = async () => {
    setIsCreating(true);
    try {
      await userAPI.createUser(createForm);
      toast.success('Student account created');
      setCreateForm(emptyCreateForm);
      await mutate();
    } catch (error) {
      toast.error('Failed to create student account', {
        description: getErrorMessage(error),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;

    const payload: {
      full_name?: string;
      student_id?: string;
      password?: string;
    } = {};

    if (editForm.full_name.trim() !== (editingUser.full_name ?? '')) {
      payload.full_name = editForm.full_name.trim();
    }
    if (editForm.student_id.trim() !== (editingUser.student_id ?? '')) {
      payload.student_id = editForm.student_id.trim();
    }
    if (editForm.password.trim()) {
      payload.password = editForm.password.trim();
    }

    if (Object.keys(payload).length === 0) {
      toast.info('No changes to update');
      return;
    }

    setIsUpdating(true);
    try {
      await userAPI.updateUser(editingUser.id, payload);
      toast.success('User updated');
      setIsEditOpen(false);
      setEditingUser(null);
      setEditForm(emptyEditForm);
      await mutate();
    } catch (error) {
      toast.error('Failed to update user', {
        description: getErrorMessage(error),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      await userAPI.deleteUser(userId);
      toast.success('User deleted');
      await mutate();
    } catch (error) {
      toast.error('Failed to delete user', {
        description: getErrorMessage(error),
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Student Management
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Create student accounts for the demo roster and browse all current
          users with search, filters, and client-side pagination.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Create Student Account</CardTitle>
            <CardDescription>
              This form creates student accounts only. Use the directory below
              to review all roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Email"
              type="email"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            <Input
              placeholder="Full name"
              value={createForm.full_name}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  full_name: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Student ID"
              value={createForm.student_id}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  student_id: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Password (min 6 chars)"
              type="password"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, password: e.target.value }))
              }
            />
            <Button
              onClick={createUser}
              disabled={
                isCreating ||
                !createForm.email ||
                !createForm.full_name ||
                !createForm.student_id ||
                createForm.password.length < 6
              }
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create student
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total users
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {sortedUsers.length}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Lecturers
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {roleCounts.LECTURER}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Students
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {roleCounts.STUDENT}
                </p>
              </div>
            </div>
            <p className="text-muted-foreground">
              This demo focuses on Students and Classes. Integrations are out of
              scope for the active admin walkthrough.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>User Directory</CardTitle>
              <p className="text-sm text-muted-foreground">
                Search and role filters apply before client-side pagination with
                10 rows per page.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search email, full name, student ID"
                  className="pl-9"
                />
              </div>
              <Select
                value={roleFilter}
                onValueChange={(value) =>
                  setRoleFilter(value as UserRoleFilter)
                }
              >
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="LECTURER">Lecturer</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Failed to load users</AlertTitle>
              <AlertDescription>{getErrorMessage(error)}</AlertDescription>
            </Alert>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-lg border border-dashed px-6 py-10 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-3 text-sm font-semibold">No matching users</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try clearing the search term or selecting another role filter.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Full name</TableHead>
                      <TableHead className="min-w-[220px]">Email</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || '-'}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.student_id || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(user)}
                            >
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={deletingUserId === user.id}
                                >
                                  {deletingUserId === user.id ? (
                                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                                  )}
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete user?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. User{' '}
                                    <strong>{user.email}</strong> will be
                                    deleted.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUser(user.id)}
                                  >
                                    Confirm delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>{formatRangeLabel(filteredUsers.length, currentPage)}</p>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <span className="min-w-[88px] text-center">
                    Page {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditingUser(null);
            setEditForm(emptyEditForm);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update supported profile fields for this user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Full name"
              value={editForm.full_name}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, full_name: e.target.value }))
              }
            />
            <Input
              placeholder="Student ID"
              value={editForm.student_id}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, student_id: e.target.value }))
              }
            />
            <Input
              placeholder="New password (optional)"
              type="password"
              value={editForm.password}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, password: e.target.value }))
              }
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateUser} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
