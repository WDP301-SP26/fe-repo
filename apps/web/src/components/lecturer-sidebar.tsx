'use client';

import { AlertTriangle, BarChart3, Home, Settings, Users2 } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const lecturerMenuItems = [
  {
    title: 'Overview',
    url: '/lecturer',
    icon: Home,
  },
  {
    title: 'My Groups',
    url: '/lecturer/groups',
    icon: Users2,
  },
  {
    title: 'Analytics',
    url: '/lecturer/analytics',
    icon: BarChart3,
  },
  {
    title: 'Free-rider Alerts',
    url: '/lecturer/alerts',
    icon: AlertTriangle,
  },
  {
    title: 'Settings',
    url: '/lecturer/settings',
    icon: Settings,
  },
];

export function LecturerSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Users2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Lecturer Portal</span>
            <span className="text-xs text-muted-foreground">
              SWP391 Manager
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {lecturerMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Managing 5 groups • 48 students
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
