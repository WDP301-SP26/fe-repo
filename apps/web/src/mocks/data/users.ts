export interface User {
  id: string;
  email: string;
  password: string; // For mock only - never store plaintext in production
  full_name: string;
  role: 'student' | 'lecturer' | 'admin';
  avatar_url?: string;
  github_username?: string;
  jira_account_id?: string;
}

export const mockUsers: User[] = [
  {
    id: 'lecturer-001',
    email: 'lecturer1@fpt.edu.vn',
    password: 'password123',
    full_name: 'Dr. Nguyen Van A',
    role: 'lecturer',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lecturer',
    github_username: 'lecturer-fpt',
  },
  {
    id: 'student-001',
    email: 'student1@fpt.edu.vn',
    password: 'password123',
    full_name: 'Tran Thi B',
    role: 'student',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
    github_username: 'student-fpt',
  },
  {
    id: 'admin-001',
    email: 'admin@fpt.edu.vn',
    password: 'password123',
    full_name: 'Admin System',
    role: 'admin',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  },
];

export function findUserByEmail(email: string): User | undefined {
  return mockUsers.find((user) => user.email === email);
}

export function validateCredentials(
  email: string,
  password: string,
): User | null {
  const user = findUserByEmail(email);
  if (user && user.password === password) {
    return user;
  }
  return null;
}
