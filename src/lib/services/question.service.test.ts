/**
 * Unit tests for question service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as questionService from './question.service';
import * as d1Client from '@/lib/d1-client';
import type { D1Database } from '@cloudflare/workers-types';

// Mock d1-client
vi.mock('@/lib/d1-client', () => ({
  executeQuery: vi.fn(),
  executeQueryFirst: vi.fn(),
  executeMutation: vi.fn(),
  executeBatch: vi.fn(),
  generateId: vi.fn((index?: number) => `mock-question-id-${index ?? '123'}`),
}));

describe('question.service', () => {
  let mockDb: D1Database;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {} as D1Database;
  });

  describe('createQuestion', () => {
    it('should create a new question successfully with all fields', async () => {
      const questionData = {
        quizId: 'quiz-123',
        questionText: 'What is 2+2?',
        questionOrder: 1,
        points: 5,
      };

      const mockQuestion = {
        id: 'mock-question-id-123',
        quiz_id: 'quiz-123',
        question_text: 'What is 2+2?',
        question_order: 1,
        points: 5,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockQuestion);

      const result = await questionService.createQuestion(mockDb, questionData);

      expect(d1Client.generateId).toHaveBeenCalled();
      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('INSERT INTO questions'),
        expect.arrayContaining([
          'mock-question-id-123',
          'quiz-123',
          'What is 2+2?',
          1, // question_order
          5, // points
        ])
      );
      expect(result.id).toBe('mock-question-id-123');
      expect(result.question_text).toBe('What is 2+2?');
      expect(result.points).toBe(5);
    });

    it('should use default points value of 1 when not provided', async () => {
      const questionData = {
        quizId: 'quiz-123',
        questionText: 'What is 2+2?',
        questionOrder: 1,
      };

      const mockQuestion = {
        id: 'mock-question-id-123',
        quiz_id: 'quiz-123',
        question_text: 'What is 2+2?',
        question_order: 1,
        points: 1,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockQuestion);

      const result = await questionService.createQuestion(mockDb, questionData);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('INSERT INTO questions'),
        expect.arrayContaining([1]) // default points
      );
      expect(result.points).toBe(1);
    });

    it('should throw error if question creation fails to retrieve created question', async () => {
      const questionData = {
        quizId: 'quiz-123',
        questionText: 'What is 2+2?',
        questionOrder: 1,
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      await expect(questionService.createQuestion(mockDb, questionData)).rejects.toThrow(
        'Failed to create question'
      );
    });
  });

  describe('getQuestionById', () => {
    it('should retrieve a question by ID', async () => {
      const questionId = 'question-123';
      const mockQuestion = {
        id: 'question-123',
        quiz_id: 'quiz-123',
        question_text: 'What is 2+2?',
        question_order: 1,
        points: 1,
        created_at: 1234567890,
        updated_at: 1234567890,
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockQuestion);

      const result = await questionService.getQuestionById(mockDb, questionId);

      expect(d1Client.executeQueryFirst).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('SELECT * FROM questions WHERE id = ?1'),
        [questionId]
      );
      expect(result).toEqual(mockQuestion);
    });

    it('should return null if question not found', async () => {
      const questionId = 'nonexistent-question';

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await questionService.getQuestionById(mockDb, questionId);

      expect(result).toBeNull();
    });
  });

  describe('getQuestionsByQuiz', () => {
    it('should retrieve all questions for a quiz ordered by question_order', async () => {
      const quizId = 'quiz-123';
      const mockQuestions = [
        {
          id: 'question-1',
          quiz_id: 'quiz-123',
          question_text: 'First question',
          question_order: 1,
          points: 1,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
        {
          id: 'question-2',
          quiz_id: 'quiz-123',
          question_text: 'Second question',
          question_order: 2,
          points: 2,
          created_at: 1234567891,
          updated_at: 1234567891,
        },
      ];

      vi.mocked(d1Client.executeQuery).mockResolvedValue(mockQuestions);

      const result = await questionService.getQuestionsByQuiz(mockDb, quizId);

      expect(d1Client.executeQuery).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('SELECT * FROM questions WHERE quiz_id = ?1 ORDER BY question_order ASC'),
        [quizId]
      );
      expect(result).toEqual(mockQuestions);
      expect(result.length).toBe(2);
    });

    it('should return empty array when quiz has no questions', async () => {
      const quizId = 'quiz-no-questions';

      vi.mocked(d1Client.executeQuery).mockResolvedValue([]);

      const result = await questionService.getQuestionsByQuiz(mockDb, quizId);

      expect(result).toEqual([]);
    });
  });

  describe('updateQuestion', () => {
    it('should update question text successfully', async () => {
      const questionId = 'question-123';
      const updateData = {
        questionText: 'Updated question text',
      };

      const mockUpdatedQuestion = {
        id: 'question-123',
        quiz_id: 'quiz-123',
        question_text: 'Updated question text',
        question_order: 1,
        points: 1,
        created_at: 1234567890,
        updated_at: Math.floor(Date.now() / 1000),
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUpdatedQuestion);

      const result = await questionService.updateQuestion(mockDb, questionId, updateData);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('UPDATE questions SET question_text = ?1'),
        expect.arrayContaining(['Updated question text', questionId])
      );
      expect(result.question_text).toBe('Updated question text');
    });

    it('should update question order successfully', async () => {
      const questionId = 'question-123';
      const updateData = {
        questionOrder: 3,
      };

      const mockUpdatedQuestion = {
        id: 'question-123',
        quiz_id: 'quiz-123',
        question_text: 'Original text',
        question_order: 3,
        points: 1,
        created_at: 1234567890,
        updated_at: Math.floor(Date.now() / 1000),
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUpdatedQuestion);

      const result = await questionService.updateQuestion(mockDb, questionId, updateData);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('UPDATE questions SET question_order = ?1'),
        expect.arrayContaining([3, questionId])
      );
      expect(result.question_order).toBe(3);
    });

    it('should update points successfully', async () => {
      const questionId = 'question-123';
      const updateData = {
        points: 10,
      };

      const mockUpdatedQuestion = {
        id: 'question-123',
        quiz_id: 'quiz-123',
        question_text: 'Original text',
        question_order: 1,
        points: 10,
        created_at: 1234567890,
        updated_at: Math.floor(Date.now() / 1000),
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUpdatedQuestion);

      const result = await questionService.updateQuestion(mockDb, questionId, updateData);

      expect(result.points).toBe(10);
    });

    it('should update multiple fields at once', async () => {
      const questionId = 'question-123';
      const updateData = {
        questionText: 'New text',
        questionOrder: 5,
        points: 3,
      };

      const mockUpdatedQuestion = {
        id: 'question-123',
        quiz_id: 'quiz-123',
        question_text: 'New text',
        question_order: 5,
        points: 3,
        created_at: 1234567890,
        updated_at: Math.floor(Date.now() / 1000),
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUpdatedQuestion);

      const result = await questionService.updateQuestion(mockDb, questionId, updateData);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('UPDATE questions SET'),
        expect.arrayContaining(['New text', 5, 3, questionId])
      );
      expect(result.question_text).toBe('New text');
      expect(result.question_order).toBe(5);
      expect(result.points).toBe(3);
    });

    it('should return existing question when no updates provided', async () => {
      const questionId = 'question-123';
      const updateData = {};

      const mockQuestion = {
        id: 'question-123',
        quiz_id: 'quiz-123',
        question_text: 'Original text',
        question_order: 1,
        points: 1,
        created_at: 1234567890,
        updated_at: 1234567890,
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockQuestion);

      const result = await questionService.updateQuestion(mockDb, questionId, updateData);

      expect(d1Client.executeMutation).not.toHaveBeenCalled();
      expect(result).toEqual(mockQuestion);
    });

    it('should throw error if question not found after update', async () => {
      const questionId = 'nonexistent-question';
      const updateData = {
        questionText: 'New text',
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      await expect(questionService.updateQuestion(mockDb, questionId, updateData)).rejects.toThrow(
        'Question not found'
      );
    });
  });

  describe('deleteQuestion', () => {
    it('should delete a question from the database', async () => {
      const questionId = 'question-123';

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);

      await questionService.deleteQuestion(mockDb, questionId);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('DELETE FROM questions WHERE id = ?1'),
        [questionId]
      );
    });
  });

  describe('reorderQuestions', () => {
    it('should reorder multiple questions in a batch', async () => {
      const quizId = 'quiz-123';
      const questionOrders = [
        { questionId: 'question-1', order: 2 },
        { questionId: 'question-2', order: 1 },
        { questionId: 'question-3', order: 3 },
      ];

      vi.mocked(d1Client.executeBatch).mockResolvedValue({} as never);

      await questionService.reorderQuestions(mockDb, quizId, questionOrders);

      expect(d1Client.executeBatch).toHaveBeenCalledWith(
        mockDb,
        expect.arrayContaining([
          expect.objectContaining({
            sql: expect.stringContaining('UPDATE questions SET question_order = ?1'),
            params: expect.arrayContaining([2, 'question-1', quizId]),
          }),
          expect.objectContaining({
            params: expect.arrayContaining([1, 'question-2', quizId]),
          }),
          expect.objectContaining({
            params: expect.arrayContaining([3, 'question-3', quizId]),
          }),
        ])
      );
    });

    it('should update updated_at timestamp for all reordered questions', async () => {
      const quizId = 'quiz-123';
      const questionOrders = [
        { questionId: 'question-1', order: 1 },
      ];

      vi.mocked(d1Client.executeBatch).mockResolvedValue({} as never);

      await questionService.reorderQuestions(mockDb, quizId, questionOrders);

      const callArgs = vi.mocked(d1Client.executeBatch).mock.calls[0];
      const queries = callArgs[1] as Array<{ params: unknown[] }>;
      expect(queries[0].params).toHaveLength(4); // order, updated_at, questionId, quizId
    });
  });

  describe('createQuestionsBatch', () => {
    it('should create multiple questions in a batch', async () => {
      const questions = [
        {
          quizId: 'quiz-123',
          questionText: 'Question 1',
          questionOrder: 1,
          points: 1,
        },
        {
          quizId: 'quiz-123',
          questionText: 'Question 2',
          questionOrder: 2,
          points: 2,
        },
      ];

      vi.mocked(d1Client.generateId)
        .mockReturnValueOnce('question-id-1')
        .mockReturnValueOnce('question-id-2');
      vi.mocked(d1Client.executeBatch).mockResolvedValue({} as never);

      const result = await questionService.createQuestionsBatch(mockDb, questions);

      expect(d1Client.generateId).toHaveBeenCalledTimes(2);
      expect(d1Client.executeBatch).toHaveBeenCalledWith(
        mockDb,
        expect.arrayContaining([
          expect.objectContaining({
            sql: expect.stringContaining('INSERT INTO questions'),
            params: expect.arrayContaining([
              'question-id-1',
              'quiz-123',
              'Question 1',
              1, // question_order
              1, // points
            ]),
          }),
          expect.objectContaining({
            params: expect.arrayContaining([
              'question-id-2',
              'quiz-123',
              'Question 2',
              2, // question_order
              2, // points
            ]),
          }),
        ])
      );
      expect(result).toEqual(['question-id-1', 'question-id-2']);
    });

    it('should use default points value of 1 when not provided in batch', async () => {
      const questions = [
        {
          quizId: 'quiz-123',
          questionText: 'Question 1',
          questionOrder: 1,
        },
      ];

      vi.mocked(d1Client.generateId).mockReturnValueOnce('question-id-1');
      vi.mocked(d1Client.executeBatch).mockResolvedValue({} as never);

      await questionService.createQuestionsBatch(mockDb, questions);

      const callArgs = vi.mocked(d1Client.executeBatch).mock.calls[0];
      const queries = callArgs[1] as Array<{ params: unknown[] }>;
      expect(queries[0].params).toContain(1); // default points
    });

    it('should return empty array when no questions provided', async () => {
      const questions: Array<{
        quizId: string;
        questionText: string;
        questionOrder: number;
        points?: number;
      }> = [];

      vi.mocked(d1Client.executeBatch).mockResolvedValue({} as never);

      const result = await questionService.createQuestionsBatch(mockDb, questions);

      expect(d1Client.executeBatch).toHaveBeenCalledWith(mockDb, []);
      expect(result).toEqual([]);
    });
  });
});

