const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  const config: RequestInit = {
    ...fetchOptions,
    credentials: requireAuth ? 'include' : 'omit', // Send cookies
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
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
  getLinkedAccounts: () => fetchAPI('/api/auth/linked-accounts'),
  unlinkProvider: (provider: 'GITHUB' | 'JIRA') =>
    fetchAPI(`/api/auth/unlink/${provider}`, { method: 'DELETE' }),
  logout: () =>
    fetchAPI('/api/auth/logout', { method: 'POST' }).catch(() => {
      // Logout endpoint doesn't exist yet in backend, but that's okay
      console.warn('Backend logout endpoint not implemented yet');
    }),
};
