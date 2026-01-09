/**
 * Quiz Service
 * 
 * Handles quiz database operations including CRUD operations.
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
 * Quiz type definition
 */
export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  created_by: string;
  created_at: number;
  updated_at: number;
  is_active: number;
}

/**
 * Quiz with question count (for listing)
 */
export interface QuizWithCount extends Quiz {
  question_count: number;
}

/**
 * Creates a new quiz in the database
 * 
 * @param db - D1 database instance
 * @param quizData - Quiz creation data
 * @returns Created quiz
 */
export async function createQuiz(
  db: D1Database,
  quizData: {
    title: string;
    description?: string;
    instructions?: string;
    createdBy: string;
  }
): Promise<Quiz> {
  const quizId = generateId();
  const now = Math.floor(Date.now() / 1000);

  await executeMutation(
    db,
    'INSERT INTO quizzes (id, title, description, instructions, created_by, created_at, updated_at, is_active) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)',
    [
      quizId,
      quizData.title,
      quizData.description || null,
      quizData.instructions || null,
      quizData.createdBy,
      now,
      now,
      1, // is_active
    ]
  );

  const quiz = await getQuizById(db, quizId);
  if (!quiz) {
    throw new Error('Failed to create quiz');
  }

  return quiz;
}

/**
 * Gets a quiz by ID
 * 
 * @param db - D1 database instance
 * @param quizId - Quiz ID
 * @returns Quiz or null
 */
export async function getQuizById(
  db: D1Database,
  quizId: string
): Promise<Quiz | null> {
  return executeQueryFirst<Quiz>(
    db,
    'SELECT * FROM quizzes WHERE id = ?1 AND is_active = 1',
    [quizId]
  );
}

/**
 * Gets all active quizzes with question count
 * 
 * @param db - D1 database instance
 * @returns Array of quizzes with question counts
 */
export async function getAllQuizzes(
  db: D1Database
): Promise<QuizWithCount[]> {
  return executeQuery<QuizWithCount>(
    db,
    `SELECT 
      q.*,
      COUNT(DISTINCT qu.id) as question_count
    FROM quizzes q
    LEFT JOIN questions qu ON q.id = qu.quiz_id
    WHERE q.is_active = 1
    GROUP BY q.id
    ORDER BY q.created_at DESC`
  );
}

/**
 * Gets all quizzes created by a specific user
 * 
 * @param db - D1 database instance
 * @param userId - User ID
 * @returns Array of quizzes with question counts
 */
export async function getQuizzesByUser(
  db: D1Database,
  userId: string
): Promise<QuizWithCount[]> {
  return executeQuery<QuizWithCount>(
    db,
    `SELECT 
      q.*,
      COUNT(DISTINCT qu.id) as question_count
    FROM quizzes q
    LEFT JOIN questions qu ON q.id = qu.quiz_id
    WHERE q.created_by = ?1 AND q.is_active = 1
    GROUP BY q.id
    ORDER BY q.created_at DESC`,
    [userId]
  );
}

/**
 * Updates a quiz in the database
 * 
 * @param db - D1 database instance
 * @param quizId - Quiz ID
 * @param quizData - Quiz update data
 * @returns Updated quiz
 */
export async function updateQuiz(
  db: D1Database,
  quizId: string,
  quizData: {
    title?: string;
    description?: string;
    instructions?: string;
  }
): Promise<Quiz> {
  const now = Math.floor(Date.now() / 1000);
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (quizData.title !== undefined) {
    updates.push(`title = ?${paramIndex++}`);
    params.push(quizData.title);
  }
  if (quizData.description !== undefined) {
    updates.push(`description = ?${paramIndex++}`);
    params.push(quizData.description || null);
  }
  if (quizData.instructions !== undefined) {
    updates.push(`instructions = ?${paramIndex++}`);
    params.push(quizData.instructions || null);
  }

  if (updates.length === 0) {
    // No updates, just return the existing quiz
    const quiz = await getQuizById(db, quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }
    return quiz;
  }

  updates.push(`updated_at = ?${paramIndex++}`);
  params.push(now);
  params.push(quizId); // For WHERE clause

  await executeMutation(
    db,
    `UPDATE quizzes SET ${updates.join(', ')} WHERE id = ?${paramIndex}`,
    params
  );

  const quiz = await getQuizById(db, quizId);
  if (!quiz) {
    throw new Error('Quiz not found');
  }

  return quiz;
}

/**
 * Deletes a quiz (soft delete by setting is_active = 0)
 * 
 * @param db - D1 database instance
 * @param quizId - Quiz ID
 */
export async function deleteQuiz(
  db: D1Database,
  quizId: string
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await executeMutation(
    db,
    'UPDATE quizzes SET is_active = 0, updated_at = ?1 WHERE id = ?2',
    [now, quizId]
  );
}

/**
 * Checks if a quiz exists and is active
 * 
 * @param db - D1 database instance
 * @param quizId - Quiz ID
 * @returns True if quiz exists and is active
 */
export async function quizExists(
  db: D1Database,
  quizId: string
): Promise<boolean> {
  const quiz = await getQuizById(db, quizId);
  return quiz !== null;
}

/**
 * Checks if a user is the creator of a quiz
 * 
 * @param db - D1 database instance
 * @param quizId - Quiz ID
 * @param userId - User ID
 * @returns True if user is the creator
 */
export async function isQuizOwner(
  db: D1Database,
  quizId: string,
  userId: string
): Promise<boolean> {
  const quiz = await getQuizById(db, quizId);
  return quiz !== null && quiz.created_by === userId;
}

