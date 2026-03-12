import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { classAPI } from '@/lib/api';
import { KeyRound, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';

interface JoinClassModalProps {
  defaultClassId?: string;
  defaultClassName?: string;
}

export function JoinClassModal({
  defaultClassId,
  defaultClassName,
}: JoinClassModalProps) {
  const { mutate } = useSWRConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    classId: defaultClassId || '',
    enrollmentKey: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await classAPI.joinClass(formData.classId, formData.enrollmentKey);
      toast.success('Successfully joined the class!');
      mutate('/api/classes/my-classes'); // Refresh student's classes
      setIsOpen(false);
      setFormData({ classId: defaultClassId || '', enrollmentKey: '' });
    } catch (error: any) {
      toast.error('Error joining class', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <KeyRound className="mr-2 h-4 w-4" /> Join Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join a Class</DialogTitle>
          <DialogDescription>
            Enter the Class ID and the Enrollment Key provided by your Lecturer
            via Notification to join.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {defaultClassId ? (
            <div className="space-y-2">
              <Label>Class</Label>
              <div className="font-medium text-lg px-3 py-2 border rounded-md bg-muted/50">
                {defaultClassName || defaultClassId}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="classId">Class ID (UUID)</Label>
              <Input
                id="classId"
                required
                placeholder="e.g. 123e4567-e89b-12d3..."
                value={formData.classId}
                onChange={(e) =>
                  setFormData({ ...formData, classId: e.target.value })
                }
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="enrollmentKey">Enrollment Key</Label>
            <Input
              id="enrollmentKey"
              required
              placeholder="8-character Hex Key"
              value={formData.enrollmentKey}
              onChange={(e) =>
                setFormData({ ...formData, enrollmentKey: e.target.value })
              }
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Joining...' : 'Confirm'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
