import { http, HttpResponse } from 'msw';
import {
  getContributorStats,
  mockGitHubCommits,
  mockGitHubContributors,
  mockGitHubPullRequests,
  mockGitHubStats,
} from '../data/github';

/**
 * GitHub API Mock Handlers
 * Matches real GitHub API structure
 */
export const githubHandlers = [
  // Get repository stats
  http.get('/api/github/repos/:groupId/stats', ({ params }) => {
    const { groupId } = params;
    const stats = mockGitHubStats[groupId as string];

    if (!stats) {
      return HttpResponse.json(
        { error: 'Repository not found' },
        { status: 404 },
      );
    }

    return HttpResponse.json(stats);
  }),

  // Get commits
  http.get('/api/github/repos/:groupId/commits', ({ params }) => {
    const { groupId } = params;
    const commits = mockGitHubCommits[groupId as string];

    if (!commits) {
      return HttpResponse.json(
        { error: 'Repository not found' },
        { status: 404 },
      );
    }

    return HttpResponse.json(commits);
  }),

  // Get contributors with stats
  http.get('/api/github/repos/:groupId/contributors', ({ params }) => {
    const { groupId } = params;
    const contributors = mockGitHubContributors[groupId as string];

    if (!contributors) {
      return HttpResponse.json(
        { error: 'Repository not found' },
        { status: 404 },
      );
    }

    const contributorStats = getContributorStats(contributors);
    return HttpResponse.json(contributorStats);
  }),

  // Get pull requests
  http.get('/api/github/repos/:groupId/pulls', ({ params }) => {
    const { groupId } = params;
    const prs = mockGitHubPullRequests[groupId as string];

    if (!prs) {
      return HttpResponse.json(
        { error: 'Repository not found' },
        { status: 404 },
      );
    }

    return HttpResponse.json(prs);
  }),
];
