import { describe, expect, it } from '@jest/globals';
import {
  getDefaultRouteForRole,
  isAuthRoute,
  isProtectedRoute,
  normalizeRole,
} from './routes';

describe('routes helpers', () => {
  it('normalizes known roles and rejects invalid values', () => {
    expect(normalizeRole('student')).toBe('STUDENT');
    expect(normalizeRole('LECTURER')).toBe('LECTURER');
    expect(normalizeRole('admin')).toBe('ADMIN');
    expect(normalizeRole('guest')).toBeNull();
    expect(normalizeRole(undefined)).toBeNull();
  });

  it('maps default route for each role', () => {
    expect(getDefaultRouteForRole('STUDENT')).toBe('/student');
    expect(getDefaultRouteForRole('LECTURER')).toBe('/lecturer');
    expect(getDefaultRouteForRole('ADMIN')).toBe('/dashboard/admin');
    expect(getDefaultRouteForRole('UNKNOWN')).toBe('/student');
  });

  it('recognizes auth and protected routes', () => {
    expect(isAuthRoute('/signin')).toBe(true);
    expect(isAuthRoute('/signup/step-2')).toBe(true);
    expect(isAuthRoute('/student')).toBe(false);

    expect(isProtectedRoute('/student/groups')).toBe(true);
    expect(isProtectedRoute('/lecturer/groups')).toBe(true);
    expect(isProtectedRoute('/dashboard/admin')).toBe(true);
    expect(isProtectedRoute('/')).toBe(false);
  });
});
