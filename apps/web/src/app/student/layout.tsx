import { RequireGithubWrapper } from '@/components/require-github-wrapper';
import { StudentSidebar } from '@/components/student-sidebar';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <StudentSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">Student Workspace</span>
          </div>
        </header>
        <RequireGithubWrapper>
          <main className="flex flex-1 flex-col gap-4 p-6 bg-muted/10 min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </RequireGithubWrapper>
      </SidebarInset>
    </SidebarProvider>
  );
}
