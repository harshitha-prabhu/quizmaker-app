/**
 * Quiz Server Actions
 * 
 * Server actions for quiz CRUD operations.
 */

'use server';

import { getDb, getCurrentUser } from './helpers';
import * as quizService from '@/lib/services/quiz.service';
import * as questionService from '@/lib/services/question.service';
import * as choiceService from '@/lib/services/choice.service';
import { CreateQuizSchema, UpdateQuizSchema } from '@/lib/schemas/quiz.schema';
import type { Quiz, QuizWithCount } from '@/lib/services/quiz.service';

/**
 * Result type for quiz operations
 */
export type QuizResult<T = Quiz> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Creates a new quiz with questions and choices
 * 
 * @param formData - Quiz creation form data
 * @returns Quiz creation result
 */
export async function createQuiz(
  formData: FormData
): Promise<QuizResult<Quiz>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Parse and validate form data
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string | null,
      instructions: formData.get('instructions') as string | null,
      questions: JSON.parse(formData.get('questions') as string || '[]'),
    };

    const validatedData = CreateQuizSchema.parse(rawData);

    // Get database instance
    const db = await getDb();

    // Create quiz
    const quiz = await quizService.createQuiz(db, {
      title: validatedData.title,
      description: validatedData.description,
      instructions: validatedData.instructions,
      createdBy: user.id,
    });

    // Create all questions in batch
    const questions = validatedData.questions.map((q, index) => ({
      quizId: quiz.id,
      questionText: q.questionText,
      questionOrder: index + 1,
      points: q.points || 1,
    }));

    const createdQuestionIds = await questionService.createQuestionsBatch(
      db,
      questions
    );

    // Map choices to created question IDs
    const choicesToCreate: Array<{
      questionId: string;
      choiceText: string;
      choiceOrder: number;
      isCorrect: boolean;
    }> = [];

    validatedData.questions.forEach((questionData, questionIndex) => {
      const questionId = createdQuestionIds[questionIndex];
      questionData.choices.forEach((choice, choiceIndex) => {
        choicesToCreate.push({
          questionId,
          choiceText: choice.choiceText,
          choiceOrder: choiceIndex + 1,
          isCorrect: choice.isCorrect,
        });
      });
    });

    // Create all choices in batch
    await choiceService.createChoicesBatch(db, choicesToCreate);

    // Return the created quiz
    const createdQuiz = await quizService.getQuizById(db, quiz.id);
    if (!createdQuiz) {
      return { success: false, error: 'Failed to retrieve created quiz' };
    }

    return { success: true, data: createdQuiz };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create quiz' };
  }
}

/**
 * Gets all active quizzes
 * 
 * @returns Array of quizzes with question counts
 */
export async function getAllQuizzes(): Promise<QuizResult<QuizWithCount[]>> {
  try {
    const db = await getDb();
    const quizzes = await quizService.getAllQuizzes(db);
    return { success: true, data: quizzes };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch quizzes' };
  }
}

/**
 * Gets a quiz by ID with all questions and choices
 * 
 * @param quizId - Quiz ID
 * @returns Quiz with questions and choices
 */
export async function getQuizById(quizId: string): Promise<
  QuizResult<Quiz & {
    questions: Array<questionService.Question & {
      choices: choiceService.Choice[];
    }>;
  }>
> {
  try {
    const db = await getDb();
    
    // Get quiz
    const quiz = await quizService.getQuizById(db, quizId);
    if (!quiz) {
      return { success: false, error: 'Quiz not found' };
    }

    // Get questions
    const questions = await questionService.getQuestionsByQuiz(db, quizId);

    // Get choices for each question
    const questionsWithChoices = await Promise.all(
      questions.map(async (question) => {
        const choices = await choiceService.getChoicesByQuestion(
          db,
          question.id
        );
        return { ...question, choices };
      })
    );

    return {
      success: true,
      data: { ...quiz, questions: questionsWithChoices },
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch quiz' };
  }
}

/**
 * Updates a quiz
 * 
 * @param quizId - Quiz ID
 * @param formData - Quiz update form data
 * @returns Update result
 */
export async function updateQuiz(
  quizId: string,
  formData: FormData
): Promise<QuizResult<Quiz>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const db = await getDb();

    // Check ownership
    const isOwner = await quizService.isQuizOwner(db, quizId, user.id);
    if (!isOwner) {
      return { success: false, error: 'You do not have permission to edit this quiz' };
    }

    // Parse and validate form data
    const rawData = {
      title: formData.get('title') as string | null,
      description: formData.get('description') as string | null,
      instructions: formData.get('instructions') as string | null,
      questions: formData.get('questions')
        ? JSON.parse(formData.get('questions') as string)
        : undefined,
    };

    const validatedData = UpdateQuizSchema.parse(rawData);

    // Update quiz metadata if provided
    if (validatedData.title || validatedData.description !== undefined || validatedData.instructions !== undefined) {
      await quizService.updateQuiz(db, quizId, {
        title: validatedData.title,
        description: validatedData.description,
        instructions: validatedData.instructions,
      });
    }

    // Update questions if provided
    if (validatedData.questions) {
      // Delete existing questions (cascade will delete choices)
      const existingQuestions = await questionService.getQuestionsByQuiz(
        db,
        quizId
      );
      for (const question of existingQuestions) {
        await questionService.deleteQuestion(db, question.id);
      }

      // Create new questions and choices
      const questions = validatedData.questions.map((q, index) => ({
        quizId,
        questionText: q.questionText,
        questionOrder: index + 1,
        points: q.points || 1,
      }));

      const createdQuestionIds = await questionService.createQuestionsBatch(
        db,
        questions
      );

      const choicesToCreate: Array<{
        questionId: string;
        choiceText: string;
        choiceOrder: number;
        isCorrect: boolean;
      }> = [];

      validatedData.questions.forEach((questionData, questionIndex) => {
        const questionId = createdQuestionIds[questionIndex];
        questionData.choices.forEach((choice, choiceIndex) => {
          choicesToCreate.push({
            questionId,
            choiceText: choice.choiceText,
            choiceOrder: choiceIndex + 1,
            isCorrect: choice.isCorrect,
          });
        });
      });

      await choiceService.createChoicesBatch(db, choicesToCreate);
    }

    const updatedQuiz = await quizService.getQuizById(db, quizId);
    if (!updatedQuiz) {
      return { success: false, error: 'Failed to retrieve updated quiz' };
    }

    return { success: true, data: updatedQuiz };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update quiz' };
  }
}

/**
 * Deletes a quiz
 * 
 * @param quizId - Quiz ID
 * @returns Deletion result
 */
export async function deleteQuiz(
  quizId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const db = await getDb();

    // Check ownership
    const isOwner = await quizService.isQuizOwner(db, quizId, user.id);
    if (!isOwner) {
      return { success: false, error: 'You do not have permission to delete this quiz' };
    }

    // Delete quiz (soft delete)
    await quizService.deleteQuiz(db, quizId);

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to delete quiz' };
  }
}

/**
 * Gets all quizzes created by the current user
 * 
 * @returns Array of user's quizzes
 */
export async function getMyQuizzes(): Promise<QuizResult<QuizWithCount[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const db = await getDb();
    const quizzes = await quizService.getQuizzesByUser(db, user.id);
    return { success: true, data: quizzes };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch quizzes' };
  }
}

