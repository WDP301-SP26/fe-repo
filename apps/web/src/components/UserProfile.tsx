'use client';

import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

export function UserProfile() {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    if (!user) {
      fetchUser();
    }
  }, [user, setUser]);

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      {user.avatar_url && (
        <img
          src={user.avatar_url}
          alt={user.full_name}
          className="w-8 h-8 rounded-full"
        />
      )}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{user.full_name}</span>
        <span className="text-xs text-gray-500">{user.email}</span>
      </div>
    </div>
  );
}
