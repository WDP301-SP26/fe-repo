'use client';

import { NavUser } from '@/components/nav-user';
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
import { chatAPI } from '@/lib/api';
import { isActiveMenuItem, lecturerMenuItems } from '@/lib/navigation';
import { useAuthStore } from '@/stores/authStore';
import { MessageSquare, Users2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import useSWR from 'swr';

export function LecturerSidebar() {
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const { data: conversationResponse } = useSWR(
    user ? '/api/chat/conversations/sidebar' : null,
    chatAPI.listConversations,
    {
      refreshInterval: 4000,
      revalidateOnFocus: true,
    },
  );

  const hasUnreadMessages = useMemo(
    () =>
      (conversationResponse?.data || []).some(
        (conversation) => conversation.unread_count > 0,
      ),
    [conversationResponse],
  );

  const navItems = useMemo(() => {
    if (lecturerMenuItems.some((item) => item.url === '/lecturer/chat')) {
      return lecturerMenuItems;
    }

    return [
      ...lecturerMenuItems,
      { title: 'Chat', url: '/lecturer/chat', icon: MessageSquare },
    ];
  }, []);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Users2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight">
              Lecturer Portal
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              SWP391 Manager
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = isActiveMenuItem(pathname, item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="transition-colors hover:bg-muted"
                    >
                      <Link href={item.url}>
                        <span className="relative inline-flex">
                          <item.icon className="h-4 w-4" />
                          {item.url === '/lecturer/chat' &&
                          hasUnreadMessages ? (
                            <span className="absolute -right-2.5 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
                              !
                            </span>
                          ) : null}
                        </span>
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4 border-border/50">
        {user ? (
          <NavUser
            user={{
              name: user.full_name,
              email: user.email,
              avatar: user.avatar_url || '',
            }}
          />
        ) : (
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
