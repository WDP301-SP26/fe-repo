/**
 * Mock GitHub API responses
 * Reference: https://docs.github.com/en/rest
 */

export interface GitHubCommit {
  sha: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  message: string;
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface GitHubContributor {
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  contributions: number;
  weeks: {
    week: number;
    additions: number;
    deletions: number;
    commits: number;
  }[];
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  created_at: string;
  merged_at?: string;
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface GitHubRepoStats {
  repo: string;
  language: string;
  stars: number;
  forks: number;
  open_issues: number;
  total_commits: number;
  total_prs: number;
  languages: {
    [key: string]: number; // percentage
  };
}

// Mock data for Group Alpha
export const mockGitHubStats: Record<string, GitHubRepoStats> = {
  'group-001': {
    repo: 'org/ecommerce-platform',
    language: 'TypeScript',
    stars: 12,
    forks: 3,
    open_issues: 8,
    total_commits: 234,
    total_prs: 24,
    languages: {
      TypeScript: 65,
      JavaScript: 20,
      CSS: 10,
      HTML: 5,
    },
  },
};

export const mockGitHubCommits: Record<string, GitHubCommit[]> = {
  'group-001': [
    {
      sha: 'abc123',
      author: {
        name: 'Nguyen Van A',
        email: 'studentA@fpt.edu.vn',
        date: '2026-01-30T10:30:00Z',
      },
      message: 'feat: Add payment integration with Stripe',
      stats: { additions: 156, deletions: 23, total: 179 },
    },
    {
      sha: 'def456',
      author: {
        name: 'Tran Thi B',
        email: 'studentB@fpt.edu.vn',
        date: '2026-01-30T08:15:00Z',
      },
      message: 'fix: Resolve authentication bug',
      stats: { additions: 45, deletions: 12, total: 57 },
    },
    {
      sha: 'ghi789',
      author: {
        name: 'Le Van C',
        email: 'studentC@fpt.edu.vn',
        date: '2026-01-29T16:45:00Z',
      },
      message: 'refactor: Improve database queries',
      stats: { additions: 89, deletions: 67, total: 156 },
    },
    // Pham Thi D - FREE RIDER (very few commits)
    {
      sha: 'jkl012',
      author: {
        name: 'Pham Thi D',
        email: 'studentD@fpt.edu.vn',
        date: '2026-01-15T10:00:00Z',
      },
      message: 'docs: Update README',
      stats: { additions: 5, deletions: 2, total: 7 },
    },
    // Hoang Van E - LOW CONTRIBUTOR
    {
      sha: 'mno345',
      author: {
        name: 'Hoang Van E',
        email: 'studentE@fpt.edu.vn',
        date: '2026-01-22T14:30:00Z',
      },
      message: 'style: Fix CSS formatting',
      stats: { additions: 12, deletions: 8, total: 20 },
    },
  ],
};

export const mockGitHubContributors: Record<string, GitHubContributor[]> = {
  'group-001': [
    {
      login: 'studentA',
      name: 'Nguyen Van A',
      email: 'studentA@fpt.edu.vn',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=studentA',
      contributions: 89,
      weeks: [
        { week: 1, additions: 450, deletions: 120, commits: 23 },
        { week: 2, additions: 380, deletions: 95, commits: 19 },
        { week: 3, additions: 520, deletions: 145, commits: 25 },
        { week: 4, additions: 410, deletions: 110, commits: 22 },
      ],
    },
    {
      login: 'studentB',
      name: 'Tran Thi B',
      email: 'studentB@fpt.edu.vn',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=studentB',
      contributions: 76,
      weeks: [
        { week: 1, additions: 390, deletions: 105, commits: 20 },
        { week: 2, additions: 340, deletions: 88, commits: 18 },
        { week: 3, additions: 425, deletions: 115, commits: 21 },
        { week: 4, additions: 355, deletions: 92, commits: 17 },
      ],
    },
    {
      login: 'studentC',
      name: 'Le Van C',
      email: 'studentC@fpt.edu.vn',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=studentC',
      contributions: 58,
      weeks: [
        { week: 1, additions: 280, deletions: 75, commits: 15 },
        { week: 2, additions: 250, deletions: 68, commits: 14 },
        { week: 3, additions: 310, deletions: 85, commits: 16 },
        { week: 4, additions: 265, deletions: 72, commits: 13 },
      ],
    },
    {
      login: 'studentD',
      name: 'Pham Thi D',
      email: 'studentD@fpt.edu.vn',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=studentD',
      contributions: 11, // FREE RIDER!
      weeks: [
        { week: 1, additions: 15, deletions: 5, commits: 3 },
        { week: 2, additions: 8, deletions: 2, commits: 2 },
        { week: 3, additions: 12, deletions: 4, commits: 3 },
        { week: 4, additions: 5, deletions: 2, commits: 3 },
      ],
    },
    {
      login: 'studentE',
      name: 'Hoang Van E',
      email: 'studentE@fpt.edu.vn',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=studentE',
      contributions: 20, // LOW CONTRIBUTOR
      weeks: [
        { week: 1, additions: 45, deletions: 12, commits: 5 },
        { week: 2, additions: 38, deletions: 10, commits: 5 },
        { week: 3, additions: 52, deletions: 14, commits: 6 },
        { week: 4, additions: 40, deletions: 11, commits: 4 },
      ],
    },
  ],
};

export const mockGitHubPullRequests: Record<string, GitHubPullRequest[]> = {
  'group-001': [
    {
      number: 24,
      title: 'Feature: Payment integration',
      state: 'merged',
      author: 'studentA',
      created_at: '2026-01-30T10:00:00Z',
      merged_at: '2026-01-30T14:30:00Z',
      additions: 456,
      deletions: 89,
      changed_files: 12,
    },
    {
      number: 23,
      title: 'Fix: Authentication bug',
      state: 'merged',
      author: 'studentB',
      created_at: '2026-01-29T15:00:00Z',
      merged_at: '2026-01-30T09:00:00Z',
      additions: 123,
      deletions: 45,
      changed_files: 5,
    },
    {
      number: 22,
      title: 'Refactor: Database layer',
      state: 'merged',
      author: 'studentC',
      created_at: '2026-01-28T11:00:00Z',
      merged_at: '2026-01-29T16:00:00Z',
      additions: 234,
      deletions: 167,
      changed_files: 8,
    },
    {
      number: 21,
      title: 'Feature: User profile page',
      state: 'open',
      author: 'studentA',
      created_at: '2026-01-30T16:00:00Z',
      additions: 189,
      deletions: 23,
      changed_files: 6,
    },
  ],
};

/**
 * Calculate free-rider threshold
 * Consider someone a free-rider if:
 * - Commits < 25% of average
 * - Last commit > 1 week ago
 */
export function detectFreeRiders(
  contributors: GitHubContributor[],
): GitHubContributor[] {
  const avgContributions =
    contributors.reduce((sum, c) => sum + c.contributions, 0) /
    contributors.length;
  const threshold = avgContributions * 0.25;

  return contributors.filter((c) => c.contributions < threshold);
}

/**
 * Get contributor stats for visualization
 */
export function getContributorStats(contributors: GitHubContributor[]) {
  const total = contributors.reduce((sum, c) => sum + c.contributions, 0);

  return contributors.map((c) => ({
    ...c,
    percentage: Math.round((c.contributions / total) * 100),
    is_free_rider: c.contributions < total / contributors.length / 4,
  }));
}
