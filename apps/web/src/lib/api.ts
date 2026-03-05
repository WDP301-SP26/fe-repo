import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Attach token from authStore if available
  const token = useAuthStore.getState().token;
  if (requireAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...fetchOptions,
    credentials: requireAuth ? 'include' : 'omit', // Send cookies
    headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'API request failed' }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

// Auth API methods
export const authAPI = {
  getCurrentUser: () => fetchAPI<any>('/api/auth/me'),
  getLinkedAccounts: () =>
    fetchAPI<{ provider: string }[]>('/api/auth/linked-accounts'),
  unlinkProvider: (provider: 'GITHUB' | 'JIRA') =>
    fetchAPI(`/api/auth/unlink/${provider}`, { method: 'DELETE' }),
  logout: () =>
    fetchAPI('/api/auth/logout', { method: 'POST' }).catch(() => {
      // Logout endpoint doesn't exist yet in backend, but that's okay
      console.warn('Backend logout endpoint not implemented yet');
    }),
};

// GitHub API methods
export const githubAPI = {
  getRepositories: () => fetchAPI<any>('/api/github/repos'),
  createRepo: (name: string, description: string) =>
    fetchAPI<any>('/api/github/repos', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),
  getCommits: (owner: string, repo: string) =>
    fetchAPI<any>(`/api/github/repos/${owner}/${repo}/commits`),
  getContributorStats: (owner: string, repo: string) =>
    fetchAPI<any>(`/api/github/repos/${owner}/${repo}/contributors-stats`),
};

// Class API methods
export const classAPI = {
  createClass: (data: {
    code: string;
    name: string;
    semester?: string;
    studentEmails: string[];
  }) =>
    fetchAPI<any>('/api/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAllClasses: () => fetchAPI<any>('/api/classes'),
  getMyClasses: () => fetchAPI<any>('/api/classes/my-classes'),
  joinClass: (classId: string, enrollment_key: string) =>
    fetchAPI<any>(`/api/classes/${classId}/join`, {
      method: 'POST',
      body: JSON.stringify({ enrollment_key }),
    }),
};

// Group API methods
export const groupAPI = {
  getGroupDetails: (groupId: string) => fetchAPI<any>(`/api/groups/${groupId}`),
  getMyGroups: () => fetchAPI<any>('/api/groups'),
  getGroupsByClass: (classId: string) =>
    fetchAPI<any[]>(`/api/groups/class/${classId}`),
  joinGroup: (groupId: string) =>
    fetchAPI<any>(`/api/groups/${groupId}/join`, { method: 'POST' }),
  updateGroup: (groupId: string, data: any) =>
    fetchAPI<any>(`/api/groups/${groupId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getGroupRepos: (groupId: string) =>
    fetchAPI<any[]>(`/api/groups/${groupId}/repos`),
  addGroupRepo: (
    groupId: string,
    data: { repo_url: string; repo_name: string; repo_owner: string },
  ) =>
    fetchAPI<any>(`/api/groups/${groupId}/repos`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeGroupRepo: (groupId: string, repoId: string) =>
    fetchAPI<any>(`/api/groups/${groupId}/repos/${repoId}`, {
      method: 'DELETE',
    }),
  getGroupRepoCommits: (groupId: string, repoId: string) =>
    fetchAPI<any[]>(`/api/groups/${groupId}/repos/${repoId}/commits`),
};

// Topic API methods
export const topicAPI = {
  getTopics: () => fetchAPI<any[]>('/api/topics'),
};

// Notification API methods
export const notificationAPI = {
  getNotifications: () => fetchAPI<any[]>('/api/notifications'),
  markAsRead: (id: string) =>
    fetchAPI<any>(`/api/notifications/${id}/read`, { method: 'PUT' }),
};

// Report API methods
// Report API methods
export const reportAPI = {
  generateSrs: (groupId: string) =>
    fetchAPI<any>(`/api/reports/srs/${groupId}`, { method: 'POST' }),
  getAssignments: (groupId: string) =>
    fetchAPI<any>(`/api/reports/assignments/${groupId}`),
  getCommitsStats: (groupId: string) =>
    fetchAPI<any>(`/api/reports/commits/${groupId}`),
};

// Jira API methods
export const jiraAPI = {
  getProjects: () => fetchAPI<any[]>('/api/jira/projects'),
  linkProject: (data: {
    github_repo_full_name: string;
    jira_project_id: string;
  }) =>
    fetchAPI<any>('/api/jira/projects/link', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
