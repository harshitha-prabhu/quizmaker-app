/**
 * Question Service
 * 
 * Handles question database operations including CRUD operations.
 */

import type { D1Database } from '@cloudflare/workers-types';
import {
  executeQuery,
  executeQueryFirst,
  executeMutation,
  executeBatch,
  generateId,
} from '@/lib/d1-client';

/**
 * Question type definition
 */
export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_order: number;
  points: number;
  created_at: number;
  updated_at: number;
}

/**
 * Creates a new question in the database
 * 
 * @param db - D1 database instance
 * @param questionData - Question creation data
 * @returns Created question
 */
export async function createQuestion(
  db: D1Database,
  questionData: {
    quizId: string;
    questionText: string;
    questionOrder: number;
    points?: number;
  }
): Promise<Question> {
  const questionId = generateId();
  const now = Math.floor(Date.now() / 1000);

  await executeMutation(
    db,
    'INSERT INTO questions (id, quiz_id, question_text, question_order, points, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
    [
      questionId,
      questionData.quizId,
      questionData.questionText,
      questionData.questionOrder,
      questionData.points || 1,
      now,
      now,
    ]
  );

  const question = await getQuestionById(db, questionId);
  if (!question) {
    throw new Error('Failed to create question');
  }

  return question;
}

/**
 * Gets a question by ID
 * 
 * @param db - D1 database instance
 * @param questionId - Question ID
 * @returns Question or null
 */
export async function getQuestionById(
  db: D1Database,
  questionId: string
): Promise<Question | null> {
  return executeQueryFirst<Question>(
    db,
    'SELECT * FROM questions WHERE id = ?1',
    [questionId]
  );
}

/**
 * Gets all questions for a quiz, ordered by question_order
 * 
 * @param db - D1 database instance
 * @param quizId - Quiz ID
 * @returns Array of questions
 */
export async function getQuestionsByQuiz(
  db: D1Database,
  quizId: string
): Promise<Question[]> {
  return executeQuery<Question>(
    db,
    'SELECT * FROM questions WHERE quiz_id = ?1 ORDER BY question_order ASC',
    [quizId]
  );
}

/**
 * Updates a question in the database
 * 
 * @param db - D1 database instance
 * @param questionId - Question ID
 * @param questionData - Question update data
 * @returns Updated question
 */
export async function updateQuestion(
  db: D1Database,
  questionId: string,
  questionData: {
    questionText?: string;
    questionOrder?: number;
    points?: number;
  }
): Promise<Question> {
  const now = Math.floor(Date.now() / 1000);
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (questionData.questionText !== undefined) {
    updates.push(`question_text = ?${paramIndex++}`);
    params.push(questionData.questionText);
  }
  if (questionData.questionOrder !== undefined) {
    updates.push(`question_order = ?${paramIndex++}`);
    params.push(questionData.questionOrder);
  }
  if (questionData.points !== undefined) {
    updates.push(`points = ?${paramIndex++}`);
    params.push(questionData.points);
  }

  if (updates.length === 0) {
    // No updates, just return the existing question
    const question = await getQuestionById(db, questionId);
    if (!question) {
      throw new Error('Question not found');
    }
    return question;
  }

  updates.push(`updated_at = ?${paramIndex++}`);
  params.push(now);
  params.push(questionId); // For WHERE clause

  await executeMutation(
    db,
    `UPDATE questions SET ${updates.join(', ')} WHERE id = ?${paramIndex}`,
    params
  );

  const question = await getQuestionById(db, questionId);
  if (!question) {
    throw new Error('Question not found');
  }

  return question;
}

/**
 * Deletes a question from the database
 * 
 * @param db - D1 database instance
 * @param questionId - Question ID
 */
export async function deleteQuestion(
  db: D1Database,
  questionId: string
): Promise<void> {
  await executeMutation(
    db,
    'DELETE FROM questions WHERE id = ?1',
    [questionId]
  );
}

/**
 * Reorders questions for a quiz
 * Updates question_order for all questions in the quiz
 * 
 * @param db - D1 database instance
 * @param quizId - Quiz ID
 * @param questionOrders - Array of { questionId, order } pairs
 */
export async function reorderQuestions(
  db: D1Database,
  quizId: string,
  questionOrders: Array<{ questionId: string; order: number }>
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const queries = questionOrders.map(({ questionId, order }) => ({
    sql: 'UPDATE questions SET question_order = ?1, updated_at = ?2 WHERE id = ?3 AND quiz_id = ?4',
    params: [order, now, questionId, quizId],
  }));

  await executeBatch(db, queries);
}

/**
 * Creates multiple questions in a batch
 * 
 * @param db - D1 database instance
 * @param questions - Array of question data
 * @returns Array of created question IDs
 */
export async function createQuestionsBatch(
  db: D1Database,
  questions: Array<{
    quizId: string;
    questionText: string;
    questionOrder: number;
    points?: number;
  }>
): Promise<string[]> {
  const now = Math.floor(Date.now() / 1000);
  const questionIds: string[] = [];
  const queries = questions.map((questionData) => {
    const questionId = generateId();
    questionIds.push(questionId);
    return {
      sql: 'INSERT INTO questions (id, quiz_id, question_text, question_order, points, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
      params: [
        questionId,
        questionData.quizId,
        questionData.questionText,
        questionData.questionOrder,
        questionData.points || 1,
        now,
        now,
      ],
    };
  });

  await executeBatch(db, queries);
  return questionIds;
}

