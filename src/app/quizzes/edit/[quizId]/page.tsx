/**
 * Quiz Edit Page
 * 
 * Allows authenticated users to edit their MCQ quizzes.
 * Only quiz creators can edit their quizzes.
 */

import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/helpers';
import { getQuizById } from '@/app/actions/quizzes';
import { QuizEditForm } from '@/components/quizzes/QuizEditForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    quizId: string;
  }>;
}

export default async function QuizEditPage({ params }: PageProps) {
  // Await params in Next.js 15
  const { quizId } = await params;

  // Check authentication
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/quizzes/edit/' + quizId);
  }

  // Fetch quiz data
  const quizResult = await getQuizById(quizId);

  if (!quizResult.success || !quizResult.data) {
    notFound();
  }

  const quiz = quizResult.data;

  // Check ownership
  if (quiz.created_by !== user.id) {
    redirect('/mcqs');
  }

  // Transform quiz data to form format
  const formData = {
    title: quiz.title,
    description: quiz.description || '',
    instructions: quiz.instructions || '',
    questions: quiz.questions.map((question) => ({
      questionText: question.question_text,
      points: question.points,
      choices: question.choices
        .sort((a, b) => a.choice_order - b.choice_order)
        .map((choice) => ({
          choiceText: choice.choice_text,
          isCorrect: choice.is_correct === 1,
        })),
    })),
  };

  return <QuizEditForm quizId={quizId} initialData={formData} />;
}

