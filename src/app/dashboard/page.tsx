/**
 * Dashboard Page
 * 
 * Main landing page for authenticated users after login.
 * Displays welcome message, quick actions, and navigation.
 */

import { redirect } from 'next/navigation';

// Mark as dynamic since we use cookies for authentication
export const dynamic = 'force-dynamic';
import { getCurrentUser } from '@/app/actions/helpers';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  // Check authentication
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-8">
        {/* Welcome Section */}
        <WelcomeSection
          firstName={user.first_name}
          lastName={user.last_name}
        />

        {/* Quick Actions */}
        <QuickActions />

        {/* Additional Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Welcome to QuizMaker! Start creating quizzes or browse existing ones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Create a Quiz</h3>
                <p className="text-sm text-muted-foreground">
                  Click the &quot;Create New Quiz / MCQ&quot; button above to start creating
                  your first quiz with multiple choice questions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Browse Quizzes</h3>
                <p className="text-sm text-muted-foreground">
                  Visit the MCQs page to see all available quizzes and test your knowledge.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

