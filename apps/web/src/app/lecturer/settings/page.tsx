'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { User } from 'lucide-react';

export default function LecturerSettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your profile settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your lecturer account information.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Full Name</span>
              <span className="font-medium">{user?.full_name || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="font-medium capitalize">
                {user?.role?.toLowerCase() || '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
