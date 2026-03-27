'use client';

import { ImportStudentsDialog } from '@/components/import-students-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClassGroups } from '@/hooks/use-api';
import { ArrowLeft, GitBranch, Users } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function ClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const { data: groups, error, isLoading } = useClassGroups(classId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Class Details</h1>
            <p className="text-muted-foreground">
              Manage the groups and students for this class.
            </p>
          </div>
        </div>
        <ImportStudentsDialog
          classId={classId}
          onSuccess={() => window.location.reload()}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p>Loading groups...</p>}
        {error && <p className="text-red-500">Failed to load groups.</p>}

        {groups?.map((group: any, index: number) => {
          const memberCount =
            group.members_count ??
            group.membersCount ??
            group.members?.length ??
            0;

          return (
            <Card
              key={group.id}
              className="hover:border-primary transition-colors hover:shadow-md"
            >
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>{group.name}</span>
                  <span className="text-sm font-normal text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                    Group {index + 1}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Members ({memberCount}/5)</div>
                    {memberCount === 0 && (
                      <span className="text-muted-foreground text-xs italic">
                        Empty
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                  <div className="w-full">
                    <div className="font-medium">Topic Workspace</div>
                    {group.topic ? (
                      <div className="mt-1">
                        <p className="text-primary font-semibold">
                          {group.topic.name}
                        </p>
                        {group.github_repo_url ? (
                          <a
                            href={group.github_repo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-500 hover:underline block truncate mt-1"
                          >
                            {group.github_repo_url}
                          </a>
                        ) : (
                          <span className="text-xs text-orange-500 block mt-1">
                            Repo Pending Setup
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs italic mt-1">
                        Pending Selection
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t bg-muted/10">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/lecturer/groups/${group.id}`)}
                >
                  View Analytics & Commits
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
