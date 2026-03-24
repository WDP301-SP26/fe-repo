import { APIError } from '@/lib/api-error';
import { getApiBaseUrl } from '@/lib/runtime-config';
import { useAuthStore } from '@/stores/authStore';

const API_URL = getApiBaseUrl();

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

  // If Content-Type is explicitly set to empty string, delete it
  // This is useful for FormData where the browser should set the boundary
  if (headers['Content-Type'] === '') {
    delete headers['Content-Type'];
  }

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
    const error = await response.json().catch(() => ({}));
    throw new APIError(response.status, {
      message: error.message || 'API request failed',
      code: error.code,
      provider: error.provider,
      retryable: error.retryable,
      reconnectRequired: error.reconnectRequired,
      details: error.details,
    });
  }

  if (response.status === 204) {
    return undefined as T;
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
  register: (data: any) =>
    fetchAPI<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: false,
    }),
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
  importStudents: (classId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchAPI<any>(`/api/classes/${classId}/import-students`, {
      method: 'POST',
      body: formData,
      headers: {
        // Let the browser set the boundary for multipart/form-data
        'Content-Type': '',
      },
    });
  },
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
  getIntegrationStatus: (groupId: string) =>
    fetchAPI<any>(`/api/groups/${groupId}/integration-status`),
  getGroupRepoCommits: (groupId: string, repoId: string) =>
    fetchAPI<any[]>(`/api/groups/${groupId}/repos/${repoId}/commits`),
};

// Topic API methods
export const topicAPI = {
  getTopics: (includeTaken = true) =>
    fetchAPI<any[]>(`/api/topics?includeTaken=${includeTaken}`),
  getAvailableTopics: () => fetchAPI<any[]>('/api/topics/available'),
  generateTopicIdea: (data: {
    mode: 'AUTO' | 'REFINE';
    seed_name?: string;
    project_domain?: string;
    team_context?: string;
    problem_space?: string;
    primary_actors_hint?: string;
  }) =>
    fetchAPI<any>('/api/topics/ai/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createAiTopic: (data: {
    topic_name: string;
    context: string;
    problem_statement: string;
    primary_actors: string;
    uniqueness_rationale: string;
  }) =>
    fetchAPI<any>('/api/topics/ai/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
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

export interface SemesterInfo {
  id: string;
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'UPCOMING' | 'ACTIVE' | 'CLOSED';
  current_week: number;
}

export interface CurrentWeekResponse {
  semester: SemesterInfo;
  can_override_week: boolean;
}

export interface LecturerComplianceSummary {
  semester: SemesterInfo | null;
  checkpoints: {
    week1_active: boolean;
    week2_active: boolean;
  };
  summary: {
    classes_total: number;
    classes_passing_week1: number;
    classes_passing_week2: number;
    students_without_group_total: number;
    groups_without_topic_total: number;
  };
  classes: Array<{
    class_id: string;
    class_code: string;
    class_name: string;
    semester: string;
    total_students: number;
    total_groups: number;
    students_without_group_count: number;
    groups_without_topic_count: number;
    week1_status: 'PASS' | 'FAIL';
    week2_status: 'PASS' | 'FAIL';
    groups: Array<{
      group_id: string;
      group_name: string;
      member_count: number;
      max_members: number;
      topic_name: string | null;
      has_finalized_topic: boolean;
      week1_status: 'PASS' | 'FAIL';
      week2_status: 'PASS' | 'FAIL';
    }>;
  }>;
}

export interface StudentWeeklyWarnings {
  semester: SemesterInfo | null;
  warnings: Array<{
    code: string;
    severity: 'warning';
    class_id: string;
    class_code: string;
    class_name: string;
    group_id?: string;
    group_name?: string;
    message: string;
  }>;
  classes: Array<{
    class_id: string;
    class_code: string;
    class_name: string;
    has_group: boolean;
    week1_status: 'PASS' | 'FAIL';
    groups: Array<{
      group_id: string;
      group_name: string;
      topic_name: string | null;
      has_finalized_topic: boolean;
      week2_status: 'PASS' | 'FAIL';
    }>;
  }>;
}

export const semesterAPI = {
  getSemesters: () => fetchAPI<SemesterInfo[]>('/api/semesters'),
  getCurrentSemester: () =>
    fetchAPI<SemesterInfo | null>('/api/semesters/current'),
  getCurrentWeek: () =>
    fetchAPI<CurrentWeekResponse | null>('/api/semesters/current-week'),
  getLecturerComplianceSummary: (classId?: string) =>
    fetchAPI<LecturerComplianceSummary>(
      `/api/semesters/current/compliance/lecturer-summary${classId ? `?classId=${encodeURIComponent(classId)}` : ''}`,
    ),
  getStudentWarnings: () =>
    fetchAPI<StudentWeeklyWarnings>(
      '/api/semesters/current/compliance/student-warning',
    ),
  setCurrentWeek: (semesterId: string, current_week: number) =>
    fetchAPI<{ semester: SemesterInfo; audit_recorded: boolean }>(
      `/api/semesters/${semesterId}/current-week`,
      {
        method: 'PATCH',
        body: JSON.stringify({ current_week }),
      },
    ),
};

export const adminSemesterAPI = {
  getSemesters: () => fetchAPI<any[]>('/api/admin/semesters'),
  createSemester: (data: {
    code: string;
    name: string;
    start_date: string;
    end_date: string;
    status?: 'UPCOMING' | 'ACTIVE' | 'CLOSED';
  }) =>
    fetchAPI<any>('/api/admin/semesters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSemester: (
    semesterId: string,
    data: Partial<{
      code: string;
      name: string;
      start_date: string;
      end_date: string;
      status: 'UPCOMING' | 'ACTIVE' | 'CLOSED';
    }>,
  ) =>
    fetchAPI<any>(`/api/admin/semesters/${semesterId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  importWorkbook: (
    semesterId: string,
    file: File,
    mode: 'validate' | 'import' = 'validate',
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchAPI<any>(
      `/api/admin/semesters/${semesterId}/import?mode=${mode}`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': '',
        },
      },
    );
  },
  getImportBatches: (semesterId: string) =>
    fetchAPI<any[]>(`/api/admin/semesters/${semesterId}/import-batches`),
};
