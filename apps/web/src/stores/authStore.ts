import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setUser: (user: User | null, token?: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,
      setUser: (user, token = null) =>
        set({
          user,
          token: token || null,
          isAuthenticated: !!user,
          isInitialized: true,
        }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitialized: true,
        }),
      fetchUser: async () => {
        try {
          // Import here to avoid circular dependency
          const { authAPI } = await import('@/lib/api');
          const response = await authAPI.getCurrentUser();
          if (response) {
            set({
              user: response,
              isAuthenticated: true,
              isInitialized: true,
            });
          }
        } catch {
          set({ isAuthenticated: false, isInitialized: true });
        }
      },
    }),
    {
      name: 'auth-storage', // saves to localStorage
    },
  ),
);
