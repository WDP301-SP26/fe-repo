export const AUTH_ROUTES = ['/signin', '/signup'] as const;

export type AppRole = 'STUDENT' | 'LECTURER' | 'ADMIN';

export function normalizeRole(role?: string | null): AppRole | null {
  if (!role) {
    return null;
  }

  const normalizedRole = role.toUpperCase();
  if (
    normalizedRole === 'STUDENT' ||
    normalizedRole === 'LECTURER' ||
    normalizedRole === 'ADMIN'
  ) {
    return normalizedRole;
  }

  return null;
}

export function getDefaultRouteForRole(role?: string | null): string {
  const normalizedRole = normalizeRole(role);

  switch (normalizedRole) {
    case 'LECTURER':
      return '/lecturer';
    case 'ADMIN':
      return '/dashboard/admin';
    case 'STUDENT':
    default:
      return '/student';
  }
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

export function isProtectedRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/student') ||
    pathname.startsWith('/lecturer') ||
    pathname.startsWith('/dashboard')
  );
}
