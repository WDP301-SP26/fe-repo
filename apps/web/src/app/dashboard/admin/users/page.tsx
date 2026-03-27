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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminUser, userAPI } from '@/lib/api';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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

export default function AdminUsersPage() {
  const [createForm, setCreateForm] =
    useState<CreateFormState>(emptyCreateForm);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(emptyEditForm);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const {
    data: users,
    isLoading,
    mutate,
  } = useSWR<AdminUser[]>('/api/users', () => userAPI.getAllUsers());

  const sortedUsers = useMemo(
    () => [...(users ?? [])].sort((a, b) => a.email.localeCompare(b.email)),
    [users],
  );

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
      toast.success('User created');
      setCreateForm(emptyCreateForm);
      await mutate();
    } catch (error: any) {
      toast.error('Failed to create user', {
        description: error.message,
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
    } catch (error: any) {
      toast.error('Failed to update user', {
        description: error.message,
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
    } catch (error: any) {
      toast.error('Failed to delete user', {
        description: error.message,
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Create, update, delete, and review user accounts.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create User</CardTitle>
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
              Create user
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planned Controls</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Promote or demote user roles with policy checks.</p>
            <p>2. Search and filter by role, class, and account activity.</p>
            <p>3. Account lock/unlock and lifecycle governance workflows.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users...
            </div>
          ) : sortedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
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
                      <div className="flex justify-end gap-2">
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
                              <AlertDialogTitle>Delete user?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. User{' '}
                                <strong>{user.email}</strong> will be deleted.
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
