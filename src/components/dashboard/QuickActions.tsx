/**
 * Quick Actions Component
 * 
 * Displays quick action buttons for common tasks.
 */

'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, FileQuestion, Settings, LogOut } from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';

export function QuickActions() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await logoutUser();
      if (result.success) {
        toast.success('Logged out successfully');
        router.push('/login');
        router.refresh();
      } else {
        toast.error('Failed to log out. Please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An error occurred during logout.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and navigation options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button
            asChild
            className="h-auto flex-col items-start justify-start p-4 space-y-2"
            variant="outline"
          >
            <Link href="/quizzes/create">
              <PlusCircle className="h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold">Create New Quiz</div>
                <div className="text-xs text-muted-foreground">
                  Create a new MCQ quiz
                </div>
              </div>
            </Link>
          </Button>

          <Button
            asChild
            className="h-auto flex-col items-start justify-start p-4 space-y-2"
            variant="outline"
          >
            <Link href="/mcqs">
              <FileQuestion className="h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold">View MCQs</div>
                <div className="text-xs text-muted-foreground">
                  Browse available quizzes
                </div>
              </div>
            </Link>
          </Button>

          <Button
            asChild
            className="h-auto flex-col items-start justify-start p-4 space-y-2"
            variant="outline"
          >
            <Link href="/settings">
              <Settings className="h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold">Account Settings</div>
                <div className="text-xs text-muted-foreground">
                  Manage your account
                </div>
              </div>
            </Link>
          </Button>

          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-auto flex-col items-start justify-start p-4 space-y-2"
            variant="outline"
          >
            <LogOut className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </div>
              <div className="text-xs text-muted-foreground">
                Sign out of your account
              </div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

