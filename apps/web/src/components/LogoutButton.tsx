'use client';

import { Button } from '@/components/ui/button';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint (will fail gracefully if not implemented)
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless
      logout();

      // Redirect to login
      router.push('/signin');
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className="text-red-600 hover:text-red-800 hover:bg-red-50"
    >
      Logout
    </Button>
  );
}
