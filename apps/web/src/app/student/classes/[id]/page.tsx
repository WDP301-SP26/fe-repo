'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useClassGroups } from '@/hooks/use-api';
import { groupAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSWRConfig } from 'swr';

export default function StudentClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const user = useAuthStore((state) => state.user);

  const { data: groups, error, isLoading } = useClassGroups(classId);
  const { mutate } = useSWRConfig();
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const handleJoin = async (groupId: string) => {
    setJoiningId(groupId);
    try {
      await groupAPI.joinGroup(groupId);
      await mutate(`/api/groups/class/${classId}`);
    } catch (err: any) {
      alert(`Error joining group: ${err.message}`);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Class Groups</h1>
          <p className="text-muted-foreground">
            Select an empty group to become the Leader, or join an existing
            group. (Max 5 per group)
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p>Loading groups...</p>}
        {error && <p className="text-red-500">Failed to load groups.</p>}

        {groups?.map((group: any, index: number) => {
          const isMember = group.members?.some(
            (m: any) => m.user_id === user?.id,
          );
          const isFull = group.membersCount >= 5;

          return (
            <Card
              key={group.id}
              className={`transition-colors hover:shadow-md ${isMember ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`}
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
                    <div className="font-medium">
                      Members ({group.members_count || 0}/5)
                    </div>
                    {group.members_count === 0 && (
                      <span className="text-muted-foreground text-xs italic">
                        Empty - Join to become LEADER
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-4 px-4 border-t mt-4 flex justify-end">
                {isMember ? (
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    asChild
                  >
                    <Link href={`/student/groups/${group.id}`}>
                      Enter Workspace
                    </Link>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleJoin(group.id)}
                    disabled={joiningId === group.id || isFull}
                  >
                    {joiningId === group.id && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isFull ? 'Group Full' : 'Join Group'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
