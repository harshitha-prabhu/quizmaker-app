/**
 * Attempt Service
 * 
 * Handles quiz attempt database operations including scoring.
 */

import type { D1Database } from '@cloudflare/workers-types';
import {
  executeQuery,
  executeQueryFirst,
  executeMutation,
  executeBatch,
  generateId,
} from '@/lib/d1-client';
import * as questionService from './question.service';
import * as choiceService from './choice.service';

/**
 * Attempt type definition
 */
export interface Attempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_points: number;
  percentage: number;
  started_at: number;
  submitted_at: number | null;
  time_taken_seconds: number | null;
}

/**
 * Attempt response type definition
 */
export interface AttemptResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  choice_id: string | null;
  is_correct: number; // 1 = correct, 0 = incorrect
  points_earned: number;
}

/**
 * Question result for scoring
 */
export interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  selectedChoiceId: string | null;
  correctChoiceId: string | null;
}

/**
 * Scoring result
 */
export interface ScoringResult {
  score: number;
  totalPoints: number;
  percentage: number;
  questionResults: QuestionResult[];
}

/**
 * Starts a new quiz attempt
 * 
 * @param db - D1 database instance
 * @param attemptData - Attempt creation data
 * @returns Created attempt
 */
export async function startAttempt(
  db: D1Database,
  attemptData: {
    userId: string;
    quizId: string;
  }
): Promise<Attempt> {
  const attemptId = generateId();
  const now = Math.floor(Date.now() / 1000);

  // Get total points for the quiz
  const questions = await questionService.getQuestionsByQuiz(
    db,
    attemptData.quizId
  );
  
  // Validate that quiz has questions
  if (questions.length === 0) {
    throw new Error('Cannot start attempt: Quiz has no questions');
  }
  
  // Validate that all questions have at least one choice
  for (const question of questions) {
    const choices = await choiceService.getChoicesByQuestion(db, question.id);
    if (choices.length === 0) {
      throw new Error(
        `Cannot start attempt: Question "${question.question_text.substring(0, 50)}..." has no choices`
      );
    }
  }
  
  const totalPoints = questions.reduce(
    (sum, q) => sum + q.points,
    0
  );

  await executeMutation(
    db,
    'INSERT INTO attempts (id, user_id, quiz_id, score, total_points, percentage, started_at, submitted_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)',
    [
      attemptId,
      attemptData.userId,
      attemptData.quizId,
      0, // score (will be updated on submission)
      totalPoints,
      0, // percentage (will be updated on submission)
      now,
      null, // submitted_at (will be set on submission)
    ]
  );

  const attempt = await getAttemptById(db, attemptId);
  if (!attempt) {
    throw new Error('Failed to create attempt');
  }

  return attempt;
}

/**
 * Gets an attempt by ID
 * 
 * @param db - D1 database instance
 * @param attemptId - Attempt ID
 * @returns Attempt or null
 */
export async function getAttemptById(
  db: D1Database,
  attemptId: string
): Promise<Attempt | null> {
  return executeQueryFirst<Attempt>(
    db,
    'SELECT * FROM attempts WHERE id = ?1',
    [attemptId]
  );
}

/**
 * Gets all attempts for a user
 * 
 * @param db - D1 database instance
 * @param userId - User ID
 * @returns Array of attempts
 */
export async function getUserAttempts(
  db: D1Database,
  userId: string
): Promise<Attempt[]> {
  return executeQuery<Attempt>(
    db,
    'SELECT * FROM attempts WHERE user_id = ?1 ORDER BY started_at DESC',
    [userId]
  );
}

/**
 * Gets all attempts for a quiz
 * 
 * @param db - D1 database instance
 * @param quizId - Quiz ID
 * @returns Array of attempts
 */
export async function getQuizAttempts(
  db: D1Database,
  quizId: string
): Promise<Attempt[]> {
  return executeQuery<Attempt>(
    db,
    'SELECT * FROM attempts WHERE quiz_id = ?1 ORDER BY started_at DESC',
    [quizId]
  );
}

/**
 * Calculates the score for a quiz attempt
 * 
 * @param db - D1 database instance
 * @param quizId - Quiz ID
 * @param responses - Map of questionId to choiceId
 * @returns Scoring result
 */
export async function calculateScore(
  db: D1Database,
  quizId: string,
  responses: Map<string, string>
): Promise<ScoringResult> {
  // Get all questions for the quiz with their choices
  const questions = await questionService.getQuestionsByQuiz(db, quizId);
  const questionResults: QuestionResult[] = [];
  let score = 0;
  let totalPoints = 0;

  for (const question of questions) {
    totalPoints += question.points;
    const selectedChoiceId = responses.get(question.id);
    
    // Get all choices for this question
    const choices = await choiceService.getChoicesByQuestion(
      db,
      question.id
    );
    
    // Validate that question has choices
    if (choices.length === 0) {
      // Question has no choices - mark as incorrect
      questionResults.push({
        questionId: question.id,
        isCorrect: false,
        pointsEarned: 0,
        selectedChoiceId: selectedChoiceId || null,
        correctChoiceId: null,
      });
      continue;
    }
    
    // Find the selected choice
    const selectedChoice = selectedChoiceId
      ? choices.find((c) => c.id === selectedChoiceId)
      : null;
    
    // Find the correct choice(s)
    const correctChoices = choices.filter((c) => c.is_correct === 1);
    const correctChoiceId = correctChoices.length > 0 ? correctChoices[0].id : null;
    
    // Check if the selected choice is correct
    // If no choice selected, mark as incorrect
    const isCorrect =
      selectedChoice !== null && selectedChoice.is_correct === 1;
    
    // Calculate points earned
    const pointsEarned = isCorrect ? question.points : 0;
    score += pointsEarned;
    
    questionResults.push({
      questionId: question.id,
      isCorrect,
      pointsEarned,
      selectedChoiceId: selectedChoiceId || null,
      correctChoiceId,
    });
  }

  // Calculate percentage
  const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

  return {
    score,
    totalPoints,
    percentage,
    questionResults,
  };
}

/**
 * Submits a quiz attempt with responses
 * 
 * @param db - D1 database instance
 * @param attemptId - Attempt ID
 * @param responses - Array of question responses
 * @returns Updated attempt with scoring result
 */
export async function submitAttempt(
  db: D1Database,
  attemptId: string,
  responses: Array<{
    questionId: string;
    choiceId: string;
  }>
): Promise<{
  attempt: Attempt;
  scoringResult: ScoringResult;
}> {
  // Get the attempt
  const attempt = await getAttemptById(db, attemptId);
  if (!attempt) {
    throw new Error('Attempt not found');
  }

  if (attempt.submitted_at !== null) {
    throw new Error('Attempt has already been submitted');
  }

  // Convert responses to Map for scoring
  const responseMap = new Map<string, string>();
  responses.forEach((r) => {
    responseMap.set(r.questionId, r.choiceId);
  });

  // Calculate score
  const scoringResult = await calculateScore(
    db,
    attempt.quiz_id,
    responseMap
  );

  // Save attempt responses
  const now = Math.floor(Date.now() / 1000);
  const timeTaken = attempt.started_at
    ? now - attempt.started_at
    : null;

  // Create response records for all questions (including unanswered ones)
  const responseQueries = scoringResult.questionResults.map((result) => {
    const responseId = generateId();
    return {
      sql: 'INSERT INTO attempt_responses (id, attempt_id, question_id, choice_id, is_correct, points_earned) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
      params: [
        responseId,
        attemptId,
        result.questionId,
        result.selectedChoiceId,
        result.isCorrect ? 1 : 0,
        result.pointsEarned,
      ],
    };
  });

  await executeBatch(db, responseQueries);

  // Update attempt with score and submission time
  await executeMutation(
    db,
    'UPDATE attempts SET score = ?1, percentage = ?2, submitted_at = ?3, time_taken_seconds = ?4 WHERE id = ?5',
    [
      scoringResult.score,
      scoringResult.percentage,
      now,
      timeTaken,
      attemptId,
    ]
  );

  const updatedAttempt = await getAttemptById(db, attemptId);
  if (!updatedAttempt) {
    throw new Error('Failed to update attempt');
  }

  return {
    attempt: updatedAttempt,
    scoringResult,
  };
}

/**
 * Gets attempt responses for an attempt
 * 
 * @param db - D1 database instance
 * @param attemptId - Attempt ID
 * @returns Array of attempt responses
 */
export async function getAttemptResponses(
  db: D1Database,
  attemptId: string
): Promise<AttemptResponse[]> {
  return executeQuery<AttemptResponse>(
    db,
    'SELECT * FROM attempt_responses WHERE attempt_id = ?1',
    [attemptId]
  );
}

/**
 * Gets detailed attempt results including questions and choices
 * 
 * @param db - D1 database instance
 * @param attemptId - Attempt ID
 * @returns Detailed attempt results
 */
export async function getAttemptResults(
  db: D1Database,
  attemptId: string
): Promise<{
  attempt: Attempt;
  responses: AttemptResponse[];
  questionResults: QuestionResult[];
}> {
  const attempt = await getAttemptById(db, attemptId);
  if (!attempt) {
    throw new Error('Attempt not found');
  }

  const responses = await getAttemptResponses(db, attemptId);
  
  // Get question results
  const questionResults: QuestionResult[] = [];
  for (const response of responses) {
    const question = await questionService.getQuestionById(
      db,
      response.question_id
    );
    if (!question) continue;

    const choices = await choiceService.getChoicesByQuestion(
      db,
      response.question_id
    );
    const correctChoice = choices.find((c) => c.is_correct === 1);

    questionResults.push({
      questionId: response.question_id,
      isCorrect: response.is_correct === 1,
      pointsEarned: response.points_earned,
      selectedChoiceId: response.choice_id,
      correctChoiceId: correctChoice?.id || null,
    });
  }

  return {
    attempt,
    responses,
    questionResults,
  };
}

/**
 * Checks if a user owns an attempt
 * 
 * @param db - D1 database instance
 * @param attemptId - Attempt ID
 * @param userId - User ID
 * @returns True if user owns the attempt
 */
export async function isAttemptOwner(
  db: D1Database,
  attemptId: string,
  userId: string
): Promise<boolean> {
  const attempt = await getAttemptById(db, attemptId);
  return attempt !== null && attempt.user_id === userId;
}

