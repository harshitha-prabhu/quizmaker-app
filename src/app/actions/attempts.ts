/**
 * Attempt Server Actions
 * 
 * Server actions for quiz attempt operations.
 */

'use server';

import { getDb, getCurrentUser } from './helpers';
import * as attemptService from '@/lib/services/attempt.service';
import * as quizService from '@/lib/services/quiz.service';
import { SubmitAttemptSchema } from '@/lib/schemas/quiz.schema';
import type {
  Attempt,
  QuestionResult,
  ScoringResult,
} from '@/lib/services/attempt.service';

/**
 * Result type for attempt operations
 */
export type AttemptResult<T = Attempt> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Starts a new quiz attempt
 * 
 * @param quizId - Quiz ID
 * @returns Attempt creation result
 */
export async function startQuizAttempt(
  quizId: string
): Promise<AttemptResult<Attempt>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const db = await getDb();

    // Verify quiz exists
    const quizExists = await quizService.quizExists(db, quizId);
    if (!quizExists) {
      return { success: false, error: 'Quiz not found' };
    }

    // Create attempt
    const attempt = await attemptService.startAttempt(db, {
      userId: user.id,
      quizId,
    });

    return { success: true, data: attempt };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to start quiz attempt' };
  }
}

/**
 * Submits a quiz attempt with responses
 * 
 * @param formData - Attempt submission form data
 * @returns Submission result with scoring
 */
export async function submitQuizAttempt(
  formData: FormData
): Promise<
  AttemptResult<{
    attempt: Attempt;
    scoringResult: ScoringResult;
  }>
> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Parse and validate form data
    const rawData = {
      attemptId: formData.get('attemptId') as string,
      responses: JSON.parse(formData.get('responses') as string || '[]'),
    };

    const validatedData = SubmitAttemptSchema.parse(rawData);

    const db = await getDb();

    // Verify attempt ownership
    const isOwner = await attemptService.isAttemptOwner(
      db,
      validatedData.attemptId,
      user.id
    );
    if (!isOwner) {
      return {
        success: false,
        error: 'You do not have permission to submit this attempt',
      };
    }

    // Submit attempt
    const result = await attemptService.submitAttempt(
      db,
      validatedData.attemptId,
      validatedData.responses
    );

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to submit quiz attempt' };
  }
}

/**
 * Gets attempt results with detailed scoring
 * 
 * @param attemptId - Attempt ID
 * @returns Attempt results
 */
export async function getAttemptResults(
  attemptId: string
): Promise<
  AttemptResult<{
    attempt: Attempt;
    responses: attemptService.AttemptResponse[];
    questionResults: QuestionResult[];
  }>
> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const db = await getDb();

    // Verify attempt ownership
    const isOwner = await attemptService.isAttemptOwner(
      db,
      attemptId,
      user.id
    );
    if (!isOwner) {
      return {
        success: false,
        error: 'You do not have permission to view this attempt',
      };
    }

    // Get attempt results
    const results = await attemptService.getAttemptResults(db, attemptId);

    return { success: true, data: results };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch attempt results' };
  }
}

/**
 * Gets all attempts for the current user
 * 
 * @returns Array of user attempts
 */
export async function getUserAttempts(): Promise<AttemptResult<Attempt[]>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const db = await getDb();
    const attempts = await attemptService.getUserAttempts(db, user.id);

    return { success: true, data: attempts };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch attempts' };
  }
}

/**
 * Gets an attempt by ID
 * 
 * @param attemptId - Attempt ID
 * @returns Attempt or error
 */
export async function getAttemptById(
  attemptId: string
): Promise<AttemptResult<Attempt>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const db = await getDb();

    // Verify attempt ownership
    const isOwner = await attemptService.isAttemptOwner(
      db,
      attemptId,
      user.id
    );
    if (!isOwner) {
      return {
        success: false,
        error: 'You do not have permission to view this attempt',
      };
    }

    const attempt = await attemptService.getAttemptById(db, attemptId);
    if (!attempt) {
      return { success: false, error: 'Attempt not found' };
    }

    return { success: true, data: attempt };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to fetch attempt' };
  }
}

