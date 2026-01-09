/**
 * Choice Service
 * 
 * Handles choice database operations including CRUD operations.
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
 * Choice type definition
 */
export interface Choice {
  id: string;
  question_id: string;
  choice_text: string;
  choice_order: number;
  is_correct: number; // 1 = correct, 0 = incorrect
  created_at: number;
  updated_at: number;
}

/**
 * Creates a new choice in the database
 * 
 * @param db - D1 database instance
 * @param choiceData - Choice creation data
 * @returns Created choice
 */
export async function createChoice(
  db: D1Database,
  choiceData: {
    questionId: string;
    choiceText: string;
    choiceOrder: number;
    isCorrect: boolean;
  }
): Promise<Choice> {
  const choiceId = generateId();
  const now = Math.floor(Date.now() / 1000);

  await executeMutation(
    db,
    'INSERT INTO choices (id, question_id, choice_text, choice_order, is_correct, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
    [
      choiceId,
      choiceData.questionId,
      choiceData.choiceText,
      choiceData.choiceOrder,
      choiceData.isCorrect ? 1 : 0,
      now,
      now,
    ]
  );

  const choice = await getChoiceById(db, choiceId);
  if (!choice) {
    throw new Error('Failed to create choice');
  }

  return choice;
}

/**
 * Gets a choice by ID
 * 
 * @param db - D1 database instance
 * @param choiceId - Choice ID
 * @returns Choice or null
 */
export async function getChoiceById(
  db: D1Database,
  choiceId: string
): Promise<Choice | null> {
  return executeQueryFirst<Choice>(
    db,
    'SELECT * FROM choices WHERE id = ?1',
    [choiceId]
  );
}

/**
 * Gets all choices for a question, ordered by choice_order
 * 
 * @param db - D1 database instance
 * @param questionId - Question ID
 * @returns Array of choices
 */
export async function getChoicesByQuestion(
  db: D1Database,
  questionId: string
): Promise<Choice[]> {
  return executeQuery<Choice>(
    db,
    'SELECT * FROM choices WHERE question_id = ?1 ORDER BY choice_order ASC',
    [questionId]
  );
}

/**
 * Updates a choice in the database
 * 
 * @param db - D1 database instance
 * @param choiceId - Choice ID
 * @param choiceData - Choice update data
 * @returns Updated choice
 */
export async function updateChoice(
  db: D1Database,
  choiceId: string,
  choiceData: {
    choiceText?: string;
    choiceOrder?: number;
    isCorrect?: boolean;
  }
): Promise<Choice> {
  const now = Math.floor(Date.now() / 1000);
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (choiceData.choiceText !== undefined) {
    updates.push(`choice_text = ?${paramIndex++}`);
    params.push(choiceData.choiceText);
  }
  if (choiceData.choiceOrder !== undefined) {
    updates.push(`choice_order = ?${paramIndex++}`);
    params.push(choiceData.choiceOrder);
  }
  if (choiceData.isCorrect !== undefined) {
    updates.push(`is_correct = ?${paramIndex++}`);
    params.push(choiceData.isCorrect ? 1 : 0);
  }

  if (updates.length === 0) {
    // No updates, just return the existing choice
    const choice = await getChoiceById(db, choiceId);
    if (!choice) {
      throw new Error('Choice not found');
    }
    return choice;
  }

  updates.push(`updated_at = ?${paramIndex++}`);
  params.push(now);
  params.push(choiceId); // For WHERE clause

  await executeMutation(
    db,
    `UPDATE choices SET ${updates.join(', ')} WHERE id = ?${paramIndex}`,
    params
  );

  const choice = await getChoiceById(db, choiceId);
  if (!choice) {
    throw new Error('Choice not found');
  }

  return choice;
}

/**
 * Deletes a choice from the database
 * 
 * @param db - D1 database instance
 * @param choiceId - Choice ID
 */
export async function deleteChoice(
  db: D1Database,
  choiceId: string
): Promise<void> {
  await executeMutation(
    db,
    'DELETE FROM choices WHERE id = ?1',
    [choiceId]
  );
}

/**
 * Creates multiple choices in a batch
 * 
 * @param db - D1 database instance
 * @param choices - Array of choice data
 * @returns Array of created choice IDs
 */
export async function createChoicesBatch(
  db: D1Database,
  choices: Array<{
    questionId: string;
    choiceText: string;
    choiceOrder: number;
    isCorrect: boolean;
  }>
): Promise<string[]> {
  const now = Math.floor(Date.now() / 1000);
  const choiceIds: string[] = [];
  const queries = choices.map((choiceData) => {
    const choiceId = generateId();
    choiceIds.push(choiceId);
    return {
      sql: 'INSERT INTO choices (id, question_id, choice_text, choice_order, is_correct, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
      params: [
        choiceId,
        choiceData.questionId,
        choiceData.choiceText,
        choiceData.choiceOrder,
        choiceData.isCorrect ? 1 : 0,
        now,
        now,
      ],
    };
  });

  await executeBatch(db, queries);
  return choiceIds;
}

/**
 * Deletes all choices for a question
 * 
 * @param db - D1 database instance
 * @param questionId - Question ID
 */
export async function deleteChoicesByQuestion(
  db: D1Database,
  questionId: string
): Promise<void> {
  await executeMutation(
    db,
    'DELETE FROM choices WHERE question_id = ?1',
    [questionId]
  );
}

