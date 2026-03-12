import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { classAPI } from '@/lib/api';
import { Loader2, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';

export function CreateClassModal() {
  const { mutate } = useSWRConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    semester: 'SP26',
    student_emails: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const emails = formData.student_emails
        .split(/[\s,;]+/)
        .map((email) => email.trim())
        .filter((email) => email.includes('@'));

      const result = await classAPI.createClass({
        code: formData.code,
        name: formData.name,
        semester: formData.semester,
        studentEmails: emails,
      });

      toast.success('Class created successfully!', {
        description: `Enrollment Key: ${result.enrollment_key}`,
        duration: 10000,
      });
      mutate('/api/classes');
      setIsOpen(false);
      setFormData({ code: '', name: '', semester: 'SP26', student_emails: '' });
    } catch (error: any) {
      toast.error('Error creating class', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Class
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create New Class</SheetTitle>
          <SheetDescription>
            This action will generate an enrollment key and automatically create
            7 empty groups for your students.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="code">Class Code (e.g. SWP391)</Label>
            <Input
              id="code"
              required
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Class Name</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester">Semester</Label>
            <Input
              id="semester"
              required
              value={formData.semester}
              onChange={(e) =>
                setFormData({ ...formData, semester: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="student_emails">
              Student Emails (Copy/Paste from Excel or Google Sheets)
            </Label>
            <textarea
              id="student_emails"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={'student1@edu.vn\nstudent2@edu.vn\n...'}
              value={formData.student_emails}
              onChange={(e) =>
                setFormData({ ...formData, student_emails: e.target.value })
              }
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Creating...' : 'Create Class'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
