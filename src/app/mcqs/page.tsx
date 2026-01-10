/**
 * MCQs Page
 * 
 * Displays all available quizzes with their details.
 * Enhanced with professional UI and full accessibility compliance.
 */

import { redirect } from 'next/navigation';

// Mark as dynamic since we use cookies for authentication
export const dynamic = 'force-dynamic';
import { getCurrentUser } from '@/app/actions/helpers';
import { getAllQuizzes } from '@/app/actions/quizzes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, FileQuestion, PlusCircle, Calendar, HelpCircle, Eye, Pencil } from 'lucide-react';
import { DeleteQuizButton } from '@/components/quizzes/DeleteQuizButton';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function MCQsPage() {
  // Check authentication
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/mcqs');
  }

  // Fetch all quizzes
  const quizzesResult = await getAllQuizzes();
  const quizzes = quizzesResult.success ? quizzesResult.data : [];

  return (
    <main className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">MCQs</h1>
            <p className="text-muted-foreground mt-1">
              Browse and manage multiple choice quizzes
            </p>
          </div>
          <Button asChild aria-label="Create a new quiz">
            <Link href="/quizzes/create">
              <PlusCircle className="h-4 w-4 mr-2" aria-hidden="true" />
              Create New Quiz
            </Link>
          </Button>
        </div>

        {/* Back to Dashboard */}
        <nav aria-label="Breadcrumb navigation">
          <Button variant="ghost" asChild>
            <Link href="/dashboard" aria-label="Go back to dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Back to Dashboard
            </Link>
          </Button>
        </nav>

        {/* Quizzes List */}
        {quizzes.length === 0 ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileQuestion
                  className="h-6 w-6 text-primary"
                  aria-hidden="true"
                />
                <CardTitle>No Quizzes Available</CardTitle>
              </div>
              <CardDescription>
                There are no quizzes available yet. Create your first quiz to get started!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="flex flex-col items-center justify-center py-16 text-center"
                role="status"
                aria-live="polite"
              >
                <div
                  className="rounded-full bg-primary/10 p-6 mb-6"
                  aria-hidden="true"
                >
                  <FileQuestion className="h-16 w-16 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-3">No Quizzes Found</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  Get started by creating your first quiz with multiple choice questions.
                </p>
                <div className="flex gap-3">
                  <Button asChild>
                    <Link href="/quizzes/create">Create Your First Quiz</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2 flex-1">
                        {quiz.title}
                      </CardTitle>
                      <Badge variant="secondary" className="shrink-0">
                        <HelpCircle className="h-3 w-3 mr-1" />
                        {quiz.question_count || 0}
                      </Badge>
                    </div>
                    {quiz.description && (
                      <CardDescription className="line-clamp-2 mt-2">
                        {quiz.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Created {formatDate(quiz.created_at)}</span>
                      </div>
                      {quiz.instructions && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {quiz.instructions}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Preview quiz: ${quiz.title}`}
                          title={`Preview quiz: ${quiz.title}`}
                        >
                          <Link href={`/quizzes/preview/${quiz.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {quiz.created_by === user.id && (
                          <>
                            <Button
                              asChild
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Edit quiz: ${quiz.title}`}
                              title={`Edit quiz: ${quiz.title}`}
                            >
                              <Link href={`/quizzes/edit/${quiz.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <DeleteQuizButton
                              quizId={quiz.id}
                              quizTitle={quiz.title}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

