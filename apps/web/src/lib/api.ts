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

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  student_id: string | null;
  role: 'STUDENT' | 'LECTURER' | 'ADMIN';
  is_email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAdminUserInput {
  email: string;
  full_name: string;
  student_id: string;
  password: string;
}

export interface UpdateAdminUserInput {
  full_name?: string;
  student_id?: string;
  password?: string;
}

export const userAPI = {
  getAllUsers: () => fetchAPI<AdminUser[]>('/api/users'),
  createUser: (data: CreateAdminUserInput) =>
    fetchAPI<AdminUser>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: UpdateAdminUserInput) =>
    fetchAPI<AdminUser>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    fetchAPI<void>(`/api/users/${id}`, {
      method: 'DELETE',
    }),
};

export type ChatMessageType = 'TEXT' | 'SYSTEM';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: ChatMessageType;
  client_id: string | null;
  read_by_recipient_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatConversation {
  id: string;
  semester_id: string;
  class_id: string;
  student_id: string | null;
  group_id: string | null;
  group_name: string | null;
  is_group_room: boolean;
  lecturer_id: string;
  status: 'ACTIVE' | 'CLOSED';
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
  last_message: ChatMessage | null;
  counterpart: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  } | null;
  class_code: string;
  semester_name: string;
  created_at: string;
  updated_at: string;
}

export interface GetOrCreateConversationInput {
  semester_id: string;
  class_id: string;
  student_id: string;
  lecturer_id: string;
}

export interface GetOrCreateGroupConversationInput {
  semester_id: string;
  class_id: string;
  group_id: string;
  lecturer_id?: string;
}

export interface SendChatMessageInput {
  content: string;
  type?: ChatMessageType;
  client_id?: string;
}

export interface ChatMessageListResponse {
  data: ChatMessage[];
  meta: {
    next_cursor: string | null;
    limit: number;
    has_more: boolean;
  };
}

export const chatAPI = {
  getOrCreateConversation: (data: GetOrCreateConversationInput) =>
    fetchAPI<ChatConversation>('/api/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getOrCreateGroupConversation: (data: GetOrCreateGroupConversationInput) =>
    fetchAPI<ChatConversation>('/api/chat/group-conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listConversations: () =>
    fetchAPI<{ data: ChatConversation[] }>('/api/chat/conversations'),
  listMessages: (
    conversationId: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ) => {
    const params = new URLSearchParams();
    if (options?.cursor) {
      params.set('cursor', options.cursor);
    }
    if (options?.limit) {
      params.set('limit', String(options.limit));
    }

    const query = params.toString();
    const endpoint = query
      ? `/api/chat/conversations/${conversationId}/messages?${query}`
      : `/api/chat/conversations/${conversationId}/messages`;

    return fetchAPI<ChatMessageListResponse>(endpoint);
  },
  sendMessage: (conversationId: string, data: SendChatMessageInput) =>
    fetchAPI<ChatMessage>(
      `/api/chat/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  markConversationRead: (conversationId: string) =>
    fetchAPI<{
      conversation_id: string;
      read_count: number;
      read_at: string;
    }>(`/api/chat/conversations/${conversationId}/read`, {
      method: 'PATCH',
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
  createGroup: (data: {
    class_id: string;
    name: string;
    project_name?: string;
    description?: string;
    semester?: string;
    github_repo_url?: string;
    jira_project_key?: string;
  }) =>
    fetchAPI<any>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getGroupDetails: (groupId: string) => fetchAPI<any>(`/api/groups/${groupId}`),
  getMyGroups: () => fetchAPI<any>('/api/groups'),
  getGroupsByClass: (classId: string) =>
    fetchAPI<any[]>(`/api/groups/class/${classId}`),
  getGroupMembers: (groupId: string) =>
    fetchAPI<
      Array<{
        id: string;
        full_name: string;
        email: string;
        avatar_url?: string;
        role_in_group: 'LEADER' | 'MEMBER' | 'MENTOR';
        joined_at: string;
      }>
    >(`/api/groups/${groupId}/members`),
  addMember: (
    groupId: string,
    data: {
      user_id: string;
      role_in_group?: 'LEADER' | 'MEMBER' | 'MENTOR';
    },
  ) =>
    fetchAPI<any[]>(`/api/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  joinGroup: (groupId: string) =>
    fetchAPI<any>(`/api/groups/${groupId}/join`, { method: 'POST' }),
  updateMember: (
    groupId: string,
    userId: string,
    data: { role_in_group: 'LEADER' | 'MEMBER' },
  ) =>
    fetchAPI<any[]>(`/api/groups/${groupId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  removeMember: (groupId: string, userId: string) =>
    fetchAPI<void>(`/api/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    }),
  reassignMembers: (
    sourceGroupId: string,
    data: {
      assignments: Array<{ user_id: string; target_group_id: string }>;
      archive_source?: boolean;
    },
  ) =>
    fetchAPI<{
      message: string;
      archived: boolean;
      reassigned_count: number;
      remaining_count: number;
    }>(`/api/groups/${sourceGroupId}/reassign-members`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateClassMemberCapacity: (
    classId: string,
    data: { max_students_per_group: number },
  ) =>
    fetchAPI<{
      class_id: string;
      previous_max_students_per_group: number;
      max_students_per_group: number;
    }>(`/api/groups/class/${classId}/member-capacity`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getUngroupedStudentsByClass: (classId: string) =>
    fetchAPI<{
      class_id: string;
      count: number;
      students: Array<{
        id: string;
        student_id: string | null;
        full_name: string | null;
        email: string;
      }>;
    }>(`/api/groups/class/${classId}/ungrouped-students`),
  updateGroup: (groupId: string, data: any) =>
    fetchAPI<any>(`/api/groups/${groupId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteGroup: (groupId: string) =>
    fetchAPI<void>(`/api/groups/${groupId}`, {
      method: 'DELETE',
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

export type DocumentStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'GRADED';

export interface DocumentSubmissionVersion {
  id: string;
  group_id: string;
  base_submission_id: string | null;
  version_number: number;
  submitted_by_id: string;
  title: string;
  document_url: string | null;
  reference: string | null;
  change_summary: string | null;
  status: DocumentStatus;
  score: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  submittedBy?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export const documentSubmissionAPI = {
  getAllSubmissions: () =>
    fetchAPI<DocumentSubmissionVersion[]>('/api/documents'),
  getGroupVersions: (groupId: string) =>
    fetchAPI<DocumentSubmissionVersion[]>(
      `/api/documents/group/${groupId}/versions`,
    ),
  getGroupSubmissions: (groupId: string) =>
    fetchAPI<DocumentSubmissionVersion[]>(`/api/documents/group/${groupId}`),
  saveDraftVersion: (
    groupId: string,
    data: {
      title: string;
      reference?: string;
      document_url?: string;
      change_summary?: string;
      base_submission_id?: string;
    },
  ) =>
    fetchAPI<DocumentSubmissionVersion>(
      `/api/documents/group/${groupId}/drafts`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  submitVersion: (submissionId: string) =>
    fetchAPI<DocumentSubmissionVersion>(
      `/api/documents/${submissionId}/submit`,
      {
        method: 'PATCH',
      },
    ),
  submitDocument: (
    groupId: string,
    data: {
      title: string;
      reference?: string;
      document_url?: string;
      change_summary?: string;
      base_submission_id?: string;
    },
  ) =>
    fetchAPI<DocumentSubmissionVersion>(`/api/documents/group/${groupId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  gradeDocument: (
    submissionId: string,
    data: {
      status: DocumentStatus;
      score?: number;
      feedback?: string;
    },
  ) =>
    fetchAPI<DocumentSubmissionVersion>(
      `/api/documents/${submissionId}/grade`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),
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

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskItem {
  id: string;
  key: string | null;
  jira_issue_key: string | null;
  group_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  assignee_name: string | null;
  jira_sync_status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  jira_sync_reason: string | null;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  data: TaskItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export const taskAPI = {
  listTasks: (params?: {
    group_id?: string;
    status?: TaskStatus;
    assignee_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();

    if (params?.group_id) {
      searchParams.set('group_id', params.group_id);
    }
    if (params?.status) {
      searchParams.set('status', params.status);
    }
    if (params?.assignee_id) {
      searchParams.set('assignee_id', params.assignee_id);
    }
    if (params?.search) {
      searchParams.set('search', params.search);
    }
    if (params?.page) {
      searchParams.set('page', String(params.page));
    }
    if (params?.limit) {
      searchParams.set('limit', String(params.limit));
    }

    const query = searchParams.toString();
    const endpoint = query ? `/api/tasks?${query}` : '/api/tasks';
    return fetchAPI<TaskListResponse>(endpoint);
  },
  createTask: (data: {
    group_id: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee_id?: string;
    due_at?: string;
  }) =>
    fetchAPI<TaskItem>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (
    taskId: string,
    data: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assignee_id?: string | null;
      title?: string;
      description?: string;
      due_at?: string | null;
    },
  ) =>
    fetchAPI<TaskItem>(`/api/tasks/${taskId}`, {
      method: 'PATCH',
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

export interface ReviewMilestoneInfo {
  code: 'REVIEW_1' | 'REVIEW_2' | 'REVIEW_3' | 'FINAL_SCORE';
  label: string;
  week_start: number;
  week_end: number;
  description?: string | null;
  checkpoint_number?: number;
}

export interface ClassCheckpointConfig {
  checkpoint_number: number;
  milestone_code: ReviewMilestoneInfo['code'];
  deadline_week: number;
  description: string | null;
}

export interface ClassCheckpointsResponse {
  class_id: string;
  semester: {
    id: string;
    code: string;
    name: string;
    current_week: number;
  };
  checkpoints: ClassCheckpointConfig[];
}

export interface GroupReviewSummary {
  group_id: string;
  group_name: string;
  topic_name: string | null;
  review_status: 'PENDING' | 'REVIEWED';
  members?: Array<{
    user_id: string;
    user_name: string | null;
  }>;
  scores: {
    task_progress_score: number | null;
    commit_contribution_score: number | null;
    review_milestone_score: number | null;
    total_score: number | null;
    auto_score?: number | null;
    final_score?: number | null;
    override_reason?: string | null;
  };
  lecturer_note: string | null;
  is_published?: boolean;
  scoring?: {
    formula: ReviewScoringFormula | null;
    config_snapshot: Record<string, unknown> | null;
    metrics: {
      total_problems: number;
      resolved_ratio: number | null;
      overdue_task_ratio: number | null;
      attendance_ratio: number | null;
    };
  };
  snapshot: {
    task_total: number;
    task_done: number;
    commit_total: number | null;
    commit_contributors: number | null;
    repository: string | null;
    captured_at: string | null;
  };
  warnings: string[];
  milestone: ReviewMilestoneInfo | null;
  review_sessions?: ReviewSessionTimelineItem[];
  review_session_summary?: ReviewSessionAggregate | null;
}

export type ReviewScoringFormula =
  | 'ATTENDANCE_ONLY'
  | 'PROBLEM_RESOLUTION_CONTRIBUTION'
  | 'ATTENDANCE_PROBLEM_CONTRIBUTION'
  | 'CUSTOM_SELECTION';

export type ReviewProblemStatus = 'not-done' | 'done' | 'archived';

export interface ReviewSessionProblem {
  id: string;
  title: string;
  status: ReviewProblemStatus;
  note: string | null;
}

export interface ReviewSessionAttendanceRecord {
  user_id: string;
  user_name: string | null;
  present: boolean;
}

export interface ReviewSessionAggregate {
  total_sessions: number;
  present_count: number;
  absent_count: number;
  contributor_count: number;
  latest_review_date: string | null;
  latest_note: string | null;
}

export interface ReviewSessionTimelineItem {
  id: string;
  title: string;
  review_date: string;
  review_day: string;
  milestone_code: ReviewMilestoneInfo['code'];
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  lecturer_note: string | null;
  what_done_since_last_review: string | null;
  next_plan_until_next_review: string | null;
  previous_problem_followup: string | null;
  attendance_ratio: number | null;
  attendance_records: ReviewSessionAttendanceRecord[];
  previous_session_id: string | null;
  current_problems: ReviewSessionProblem[];
  version_count?: number;
  latest_action?: 'CREATED' | 'UPDATED' | 'DELETED' | null;
}

export interface ReviewSessionHistoryItem {
  id: string;
  review_session_id: string | null;
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  version_number: number;
  actor_user_id: string | null;
  created_at: string;
  milestone_code: ReviewMilestoneInfo['code'];
  snapshot: Record<string, unknown>;
}

export interface LecturerReviewSummary {
  semester: SemesterInfo | null;
  summary: {
    classes_total: number;
    groups_total: number;
    reviewed_groups: number;
    groups_missing_task_evidence: number;
    groups_missing_commit_evidence: number;
  };
  classes: Array<{
    class_id: string;
    class_code: string;
    class_name: string;
    active_checkpoint: ReviewMilestoneInfo | null;
    checkpoint_configs: ClassCheckpointConfig[];
    groups: GroupReviewSummary[];
  }>;
}

export interface StudentReviewStatus {
  semester: SemesterInfo | null;
  groups: Array<
    {
      class_id: string;
      class_code: string;
      class_name: string;
    } & GroupReviewSummary
  >;
}

export interface StudentPublishedScoresResponse {
  semester: SemesterInfo | null;
  milestones: Array<{
    milestone: ReviewMilestoneInfo;
    groups: Array<{
      group_id: string;
      group_name: string;
      topic_name: string | null;
      scores: {
        task_progress_score: number | null;
        commit_contribution_score: number | null;
        review_milestone_score: number | null;
        total_score: number | null;
        auto_score?: number | null;
        final_score?: number | null;
        override_reason?: string | null;
      };
      lecturer_note: string | null;
      scoring?: GroupReviewSummary['scoring'];
      review_sessions?: ReviewSessionTimelineItem[];
    }>;
  }>;
}

export interface SemesterRosterLecturer {
  id: string;
  email: string;
  full_name: string | null;
  teaching_classes: Array<{
    class_id: string;
    class_code: string;
    class_name: string;
  }>;
  examiner_classes: Array<{
    class_id: string;
    class_code: string;
    class_name: string;
  }>;
}

export interface SemesterRosterStudent {
  id: string;
  email: string;
  full_name: string | null;
  student_id: string | null;
  class_id: string;
  class_code: string | null;
  class_name: string | null;
}

export interface SemesterRosterClass {
  id: string;
  code: string;
  name: string;
  lecturer_id: string | null;
  lecturer_name: string | null;
  student_count: number;
  enrollment_key?: string | null;
  examiner_assignments: Array<{
    lecturer_id: string;
    lecturer_name: string | null;
    lecturer_email: string | null;
  }>;
}

export interface SemesterRosterResponse {
  semester: SemesterInfo;
  summary: {
    classes_total: number;
    lecturers_total: number;
    students_total: number;
    assigned_classes_total: number;
    unassigned_classes_total: number;
    examiner_assignments_total: number;
    can_assign_examiners: boolean;
  };
  lecturers: SemesterRosterLecturer[];
  students: SemesterRosterStudent[];
  classes: SemesterRosterClass[];
}

export interface ExaminerAssignmentBoard {
  semester: SemesterInfo;
  gate: {
    current_week: number;
    can_assign: boolean;
    reason: string | null;
  };
  lecturers: Array<{
    id: string;
    email: string;
    full_name: string | null;
    teaching_classes: Array<{
      class_id: string;
      class_code: string;
      class_name: string;
    }>;
  }>;
  classes: Array<{
    id: string;
    code: string;
    name: string;
    lecturer_id: string | null;
    lecturer_name: string | null;
    examiner_assignments: Array<{
      lecturer_id: string;
      lecturer_name: string | null;
      lecturer_email: string | null;
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
  getCurrentReviewMilestone: (classId?: string) =>
    fetchAPI<{
      semester: SemesterInfo | null;
      milestone: ReviewMilestoneInfo | null;
    }>(
      `/api/semesters/current/review-milestone${classId ? `?classId=${encodeURIComponent(classId)}` : ''}`,
    ),
  getLecturerReviewSummary: (classId?: string) =>
    fetchAPI<LecturerReviewSummary>(
      `/api/semesters/current/reviews/lecturer-summary${classId ? `?classId=${encodeURIComponent(classId)}` : ''}`,
    ),
  getStudentReviewStatus: () =>
    fetchAPI<StudentReviewStatus>(
      '/api/semesters/current/reviews/student-status',
    ),
  getStudentPublishedScores: () =>
    fetchAPI<StudentPublishedScoresResponse>(
      '/api/semesters/current/reviews/student-scores',
    ),
  upsertCurrentGroupReview: (
    groupId: string,
    data: {
      task_progress_score?: number;
      commit_contribution_score?: number;
      review_milestone_score?: number;
      lecturer_note?: string;
      scoring_formula?: ReviewScoringFormula;
      selected_metrics?: string[];
      final_score?: number;
      override_reason?: string;
    },
  ) =>
    fetchAPI<{
      semester: SemesterInfo;
      milestone: ReviewMilestoneInfo | null;
      group: GroupReviewSummary;
    }>(`/api/semesters/groups/${groupId}/current-review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  createGroupReviewSession: (
    groupId: string,
    data: {
      milestone_code: ReviewMilestoneInfo['code'];
      review_date: string;
      title: string;
      status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
      lecturer_note?: string;
      what_done_since_last_review?: string;
      next_plan_until_next_review?: string;
      previous_problem_followup?: string;
      attendance_ratio?: number;
      attendance_records?: ReviewSessionAttendanceRecord[];
      current_problems?: ReviewSessionProblem[];
    },
  ) =>
    fetchAPI<ReviewSessionTimelineItem>(
      `/api/semesters/groups/${groupId}/review-sessions`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  getGroupReviewSessions: (groupId: string) =>
    fetchAPI<{
      semester: SemesterInfo | null;
      group: {
        group_id: string;
        group_name: string;
        class_id: string;
        class_code: string;
      } | null;
      sessions: ReviewSessionTimelineItem[];
    }>(`/api/semesters/groups/${groupId}/review-sessions`),
  updateGroupReviewSession: (
    groupId: string,
    sessionId: string,
    data: Partial<{
      milestone_code: ReviewMilestoneInfo['code'];
      review_date: string;
      title: string;
      status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
      lecturer_note: string;
      what_done_since_last_review: string;
      next_plan_until_next_review: string;
      previous_problem_followup: string;
      attendance_ratio: number | null;
      attendance_records: ReviewSessionAttendanceRecord[];
      current_problems: ReviewSessionProblem[];
    }>,
  ) =>
    fetchAPI<ReviewSessionTimelineItem>(
      `/api/semesters/groups/${groupId}/review-sessions/${sessionId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),
  deleteGroupReviewSession: (groupId: string, sessionId: string) =>
    fetchAPI<{ deleted: boolean }>(
      `/api/semesters/groups/${groupId}/review-sessions/${sessionId}`,
      {
        method: 'DELETE',
      },
    ),
  getGroupReviewSessionHistory: (
    groupId: string,
    milestoneCode?: ReviewMilestoneInfo['code'],
  ) =>
    fetchAPI<{
      semester: SemesterInfo | null;
      history: ReviewSessionHistoryItem[];
    }>(
      `/api/semesters/groups/${groupId}/review-session-history${milestoneCode ? `?milestone_code=${encodeURIComponent(milestoneCode)}` : ''}`,
    ),
  publishMilestoneReviews: (data: {
    milestone_code: ReviewMilestoneInfo['code'];
    class_id?: string;
  }) =>
    fetchAPI<{ updated_count: number }>(
      '/api/semesters/current/reviews/publish',
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
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

export const classCheckpointAPI = {
  getCheckpoints: (classId: string) =>
    fetchAPI<ClassCheckpointsResponse>(`/api/classes/${classId}/checkpoints`),
  upsertCheckpoints: (
    classId: string,
    checkpoints: Array<{
      checkpoint_number: number;
      deadline_week: number;
      description?: string;
    }>,
  ) =>
    fetchAPI<ClassCheckpointsResponse>(`/api/classes/${classId}/checkpoints`, {
      method: 'PUT',
      body: JSON.stringify({ checkpoints }),
    }),
};

export const adminSemesterAPI = {
  getSemesters: () => fetchAPI<any[]>('/api/admin/semesters'),
  getRoster: (semesterId: string) =>
    fetchAPI<SemesterRosterResponse>(
      `/api/admin/semesters/${semesterId}/roster`,
    ),
  listClasses: (semesterId: string) =>
    fetchAPI<{
      semester: SemesterInfo;
      classes: SemesterRosterClass[];
    }>(`/api/admin/semesters/${semesterId}/classes`),
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
  createClass: (
    semesterId: string,
    data: {
      code: string;
      name: string;
      enrollment_key?: string;
    },
  ) =>
    fetchAPI<SemesterRosterClass>(
      `/api/admin/semesters/${semesterId}/classes`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  updateClass: (
    semesterId: string,
    classId: string,
    data: {
      code?: string;
      name?: string;
      enrollment_key?: string;
    },
  ) =>
    fetchAPI<SemesterRosterClass>(
      `/api/admin/semesters/${semesterId}/classes/${classId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),
  deleteClass: (semesterId: string, classId: string) =>
    fetchAPI<void>(`/api/admin/semesters/${semesterId}/classes/${classId}`, {
      method: 'DELETE',
    }),
  generateClassGroups: (
    semesterId: string,
    classId: string,
    group_count?: number,
  ) =>
    fetchAPI<{
      class_id: string;
      class_code: string;
      desired_group_count: number;
      existing_group_count: number;
      created_group_count: number;
    }>(
      `/api/admin/semesters/${semesterId}/classes/${classId}/generate-groups`,
      {
        method: 'POST',
        body: JSON.stringify(group_count ? { group_count } : {}),
      },
    ),
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
  createLecturer: (
    semesterId: string,
    data: { email: string; full_name: string; password?: string },
  ) =>
    fetchAPI<AdminUser>(`/api/admin/semesters/${semesterId}/roster/lecturers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLecturer: (
    semesterId: string,
    lecturerId: string,
    data: { email?: string; full_name?: string; password?: string },
  ) =>
    fetchAPI<AdminUser>(
      `/api/admin/semesters/${semesterId}/roster/lecturers/${lecturerId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),
  deleteLecturer: (semesterId: string, lecturerId: string) =>
    fetchAPI<void>(
      `/api/admin/semesters/${semesterId}/roster/lecturers/${lecturerId}`,
      {
        method: 'DELETE',
      },
    ),
  createStudent: (
    semesterId: string,
    data: {
      email: string;
      full_name: string;
      student_id: string;
      class_id: string;
      password?: string;
    },
  ) =>
    fetchAPI<SemesterRosterStudent>(
      `/api/admin/semesters/${semesterId}/roster/students`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),
  updateStudent: (
    semesterId: string,
    studentId: string,
    data: {
      email?: string;
      full_name?: string;
      student_id?: string;
      class_id?: string;
      password?: string;
    },
  ) =>
    fetchAPI<SemesterRosterStudent>(
      `/api/admin/semesters/${semesterId}/roster/students/${studentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),
  deleteStudent: (semesterId: string, studentId: string) =>
    fetchAPI<void>(
      `/api/admin/semesters/${semesterId}/roster/students/${studentId}`,
      {
        method: 'DELETE',
      },
    ),
  updateTeachingAssignments: (
    semesterId: string,
    assignments: Array<{ class_id: string; lecturer_id: string }>,
  ) =>
    fetchAPI<SemesterRosterResponse>(
      `/api/admin/semesters/${semesterId}/teaching-assignments`,
      {
        method: 'PATCH',
        body: JSON.stringify({ assignments }),
      },
    ),
  getExaminerAssignments: (semesterId: string) =>
    fetchAPI<ExaminerAssignmentBoard>(
      `/api/admin/semesters/${semesterId}/examiner-assignments`,
    ),
  updateExaminerAssignments: (
    semesterId: string,
    assignments: Array<{ class_id: string; lecturer_ids: string[] }>,
  ) =>
    fetchAPI<ExaminerAssignmentBoard>(
      `/api/admin/semesters/${semesterId}/examiner-assignments`,
      {
        method: 'PATCH',
        body: JSON.stringify({ assignments }),
      },
    ),
};
