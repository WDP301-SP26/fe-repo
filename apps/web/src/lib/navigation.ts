import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BarChart3,
  FolderGit2,
  Home,
  Settings,
  Users,
  Users2,
} from 'lucide-react';

type RoleScope = 'student' | 'lecturer';

export interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export const studentMenuItems: MenuItem[] = [
  { title: 'Overview', url: '/student', icon: Home },
  { title: 'My Groups', url: '/student/groups', icon: Users },
  { title: 'My Projects', url: '/student/projects', icon: FolderGit2 },
  { title: 'Settings', url: '/student/settings', icon: Settings },
];

export const lecturerMenuItems: MenuItem[] = [
  { title: 'Overview', url: '/lecturer', icon: Home },
  { title: 'My Student Groups', url: '/lecturer/groups', icon: Users2 },
  { title: 'Analytics', url: '/lecturer/analytics', icon: BarChart3 },
  { title: 'Free-rider Alerts', url: '/lecturer/alerts', icon: AlertTriangle },
  { title: 'Settings', url: '/lecturer/settings', icon: Settings },
];

const roleLabels: Record<RoleScope, string> = {
  student: 'Student Workspace',
  lecturer: 'Lecturer Portal',
};

export function getRoleLabel(scope: RoleScope): string {
  return roleLabels[scope];
}

function isDynamicSegment(segment: string): boolean {
  return /^\d+$/.test(segment) || /^[0-9a-f-]{8,}$/i.test(segment);
}

function toTitleCase(text: string): string {
  return text
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function isActiveMenuItem(pathname: string, url: string): boolean {
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function buildNavigationLabel(
  scope: RoleScope,
  pathname: string,
): { rootLabel: string; pageLabel: string } {
  const rootLabel = getRoleLabel(scope);

  const menuItems = scope === 'student' ? studentMenuItems : lecturerMenuItems;
  const matchedMenu = menuItems.find((item) =>
    isActiveMenuItem(pathname, item.url),
  );
  if (matchedMenu) {
    return { rootLabel, pageLabel: matchedMenu.title };
  }

  const segments = pathname.split('/').filter(Boolean);
  const scopedSegments = segments
    .slice(1)
    .filter((segment) => !isDynamicSegment(segment));
  const fallback = scopedSegments.at(-1)
    ? toTitleCase(scopedSegments.at(-1)!)
    : 'Overview';

  return { rootLabel, pageLabel: fallback };
}
