import { useAuthStore } from '@/stores/authStore';
import useSWR from 'swr';
import { classAPI, groupAPI, notificationAPI, topicAPI } from '../lib/api';

// Classes
export function useClasses() {
  const token = useAuthStore((state) => state.token);
  return useSWR(token ? '/api/classes' : null, classAPI.getAllClasses);
}

export function useMyClasses() {
  const token = useAuthStore((state) => state.token);
  return useSWR(
    token ? '/api/classes/my-classes' : null,
    classAPI.getMyClasses,
  );
}

// Groups
export function useClassGroups(classId: string | null) {
  const token = useAuthStore((state) => state.token);
  return useSWR(token && classId ? `/api/groups/class/${classId}` : null, () =>
    groupAPI.getGroupsByClass(classId!),
  );
}

export function useMyGroups() {
  const token = useAuthStore((state) => state.token);
  return useSWR(token ? '/api/groups' : null, groupAPI.getMyGroups);
}

// Topics
export function useTopics() {
  const token = useAuthStore((state) => state.token);
  return useSWR(token ? '/api/topics' : null, topicAPI.getTopics);
}

// Notifications
export function useNotifications() {
  const token = useAuthStore((state) => state.token);
  return useSWR(
    token ? '/api/notifications' : null,
    notificationAPI.getNotifications,
    {
      refreshInterval: 30000, // Poll every 30s
    },
  );
}
