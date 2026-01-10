/**
 * Quiz Validation Schemas
 * 
 * Zod schemas for validating quiz-related input data.
 */

import { z } from 'zod';

/**
 * Choice validation schema
 */
export const ChoiceSchema = z.object({
  choiceText: z
    .string()
    .min(1, 'Choice text is required')
    .max(500, 'Choice text must be at most 500 characters')
    .trim(),
  isCorrect: z.boolean(),
});

/**
 * Question validation schema
 */
export const QuestionSchema = z.object({
  questionText: z
    .string()
    .min(1, 'Question text is required')
    .max(1000, 'Question text must be at most 1000 characters')
    .trim(),
  points: z.number().int().positive().default(1).optional(),
  choices: z
    .array(ChoiceSchema)
    .min(2, 'Each question must have at least 2 choices')
    .max(4, 'Each question can have at most 4 choices')
    .refine(
      (choices) => choices.some((choice) => choice.isCorrect),
      {
        message: 'At least one choice must be marked as correct',
        path: ['choices'],
      }
    ),
});

/**
 * Create quiz validation schema
 */
export const CreateQuizSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters')
    .trim(),
  description: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return undefined;
      return typeof val === 'string' ? val.trim() : val;
    },
    z
      .string()
      .max(1000, 'Description must be at most 1000 characters')
      .optional()
  ),
  instructions: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return undefined;
      return typeof val === 'string' ? val.trim() : val;
    },
    z
      .string()
      .max(500, 'Instructions must be at most 500 characters')
      .optional()
  ),
  questions: z
    .array(QuestionSchema)
    .min(1, 'At least one question is required'),
});

/**
 * Update quiz validation schema
 */
export const UpdateQuizSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters')
    .trim(),
  description: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return undefined;
      return typeof val === 'string' ? val.trim() : val;
    },
    z
      .string()
      .max(1000, 'Description must be at most 1000 characters')
      .optional()
  ),
  instructions: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return undefined;
      return typeof val === 'string' ? val.trim() : val;
    },
    z
      .string()
      .max(500, 'Instructions must be at most 500 characters')
      .optional()
  ),
  questions: z
    .array(QuestionSchema)
    .min(1, 'At least one question is required')
    .optional(),
});

/**
 * Submit quiz attempt validation schema
 */
export const SubmitAttemptSchema = z.object({
  attemptId: z.string().min(1, 'Attempt ID is required'),
  responses: z
    .array(
      z.object({
        questionId: z.string().min(1, 'Question ID is required'),
        choiceId: z.string().min(1, 'Choice ID is required'),
      })
    )
    .min(1, 'At least one response is required'),
});

/**
 * TypeScript types inferred from schemas
 */
export type Choice = z.infer<typeof ChoiceSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type CreateQuizInput = z.infer<typeof CreateQuizSchema>;
export type UpdateQuizInput = z.infer<typeof UpdateQuizSchema>;
export type SubmitAttemptInput = z.infer<typeof SubmitAttemptSchema>;

