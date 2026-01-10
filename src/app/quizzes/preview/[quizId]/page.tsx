/**
 * Quiz Preview Page
 * 
 * Displays a quiz in preview mode, showing how it appears to students.
 * Enhanced with professional UI and full accessibility compliance.
 */

import { redirect, notFound } from 'next/navigation';

// Mark as dynamic since we use cookies for authentication
export const dynamic = 'force-dynamic';
import { getCurrentUser } from '@/app/actions/helpers';
import { getQuizById } from '@/app/actions/quizzes';
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
import { ArrowLeft, Eye, CheckCircle2, Circle } from 'lucide-react';

interface PageProps {
  params: Promise<{
    quizId: string;
  }>;
}

export default async function QuizPreviewPage({ params }: PageProps) {
  // Await params in Next.js 15
  const { quizId } = await params;

  // Check authentication
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/quizzes/preview/' + quizId);
  }

  // Fetch quiz data
  const quizResult = await getQuizById(quizId);

  if (!quizResult.success || !quizResult.data) {
    notFound();
  }

  const quiz = quizResult.data;

  return (
    <main className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Preview Banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-primary">Preview Mode</p>
                <p className="text-sm text-muted-foreground">
                  This is how your quiz appears to students. Answers are highlighted for your reference.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Navigation */}
        <nav aria-label="Breadcrumb navigation">
          <Button variant="ghost" asChild>
            <Link href="/mcqs" aria-label="Go back to MCQs page">
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Back to MCQs
            </Link>
          </Button>
        </nav>

        {/* Quiz Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{quiz.title}</CardTitle>
            {quiz.description && (
              <CardDescription className="text-base mt-2">
                {quiz.description}
              </CardDescription>
            )}
          </CardHeader>
          {quiz.instructions && (
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Instructions</h3>
                <p className="text-sm whitespace-pre-wrap">{quiz.instructions}</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Questions */}
        {quiz.questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                This quiz has no questions yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {quiz.questions.map((question, questionIndex) => {
              return (
                <Card key={question.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl">
                          Question {questionIndex + 1}
                          {question.points > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {question.points} {question.points === 1 ? 'point' : 'points'}
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-base font-medium">{question.question_text}</p>

                    <div className="space-y-2">
                      {question.choices.map((choice, choiceIndex) => {
                        const isCorrect = choice.is_correct === 1;
                        return (
                          <div
                            key={choice.id}
                            className={`
                              flex items-start gap-3 p-3 rounded-lg border-2 transition-colors
                              ${isCorrect
                                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                : 'border-border bg-background'
                              }
                            `}
                          >
                            <div className="mt-0.5">
                              {isCorrect ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <label className="text-sm font-medium cursor-default">
                                {String.fromCharCode(65 + choiceIndex)}. {choice.choice_text}
                              </label>
                              {isCorrect && (
                                <Badge variant="outline" className="ml-2 border-green-600 text-green-700">
                                  Correct Answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" asChild>
            <Link href="/mcqs">Back to MCQs</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

