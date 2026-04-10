import { useAuthStore } from '@/stores/authStore';
import useSWR from 'swr';
import {
  classAPI,
  groupAPI,
  notificationAPI,
  srsAPI,
  topicAPI,
} from '../lib/api';

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

// SRS
export function useSrsDocument(groupId: string | null) {
  const token = useAuthStore((state) => state.token);
  return useSWR(token && groupId ? `/api/srs/group/${groupId}` : null, () =>
    srsAPI.getDocument(groupId!),
  );
}

export function useSrsLecturerSubmissions(classId?: string) {
  const token = useAuthStore((state) => state.token);
  const key = classId
    ? `/api/srs/lecturer/submissions?classId=${classId}`
    : '/api/srs/lecturer/submissions';
  return useSWR(token ? key : null, () =>
    srsAPI.getLecturerSubmissions(classId),
  );
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
