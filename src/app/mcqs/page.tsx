/**
 * MCQs Page (Stub)
 * 
 * Placeholder page for MCQs listing. Will be fully implemented later.
 */

import { redirect } from 'next/navigation';

// Mark as dynamic since we use cookies for authentication
export const dynamic = 'force-dynamic';
import { getCurrentUser } from '@/app/actions/helpers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export default async function MCQsPage() {
  // Check authentication
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/mcqs');
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-6">
        {/* Back to Dashboard */}
        <Button variant="ghost" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Placeholder Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileQuestion className="h-6 w-6" />
              <CardTitle>MCQs Page</CardTitle>
            </div>
            <CardDescription>
              This page will display all available quizzes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
              <p className="text-muted-foreground max-w-md">
                The MCQs page is under development. This page will display all
                available quizzes that you can take or manage.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

