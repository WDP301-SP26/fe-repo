import { http, HttpResponse } from 'msw';
import { validateCredentials } from '../data/users';

export const authHandlers = [
  // Mock signin endpoint (for login form)
  http.post('/api/auth/signin', async ({ request }) => {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };

    const user = validateCredentials(email, password);

    if (!user) {
      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return HttpResponse.json({
      success: true,
      user: userWithoutPassword,
      token: `mock-token-${user.id}`,
    });
  }),

  // Mock login endpoint (NextAuth callback)
  http.post('/api/auth/callback/credentials', async ({ request }) => {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };

    const user = validateCredentials(email, password);

    if (!user) {
      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return HttpResponse.json({
      user: userWithoutPassword,
      token: `mock-token-${user.id}`,
    });
  }),
];
