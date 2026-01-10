/**
 * Unit tests for quiz service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as quizService from './quiz.service';
import * as d1Client from '@/lib/d1-client';
import type { D1Database } from '@cloudflare/workers-types';

// Mock d1-client
vi.mock('@/lib/d1-client', () => ({
  executeQuery: vi.fn(),
  executeQueryFirst: vi.fn(),
  executeMutation: vi.fn(),
  generateId: vi.fn(() => 'mock-quiz-id-123'),
}));

describe('quiz.service', () => {
  let mockDb: D1Database;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {} as D1Database;
  });

  describe('createQuiz', () => {
    it('should create a new quiz successfully with all fields', async () => {
      const quizData = {
        title: 'Test Quiz',
        description: 'Test Description',
        instructions: 'Test Instructions',
        createdBy: 'user-123',
      };

      const mockQuiz = {
        id: 'mock-quiz-id-123',
        title: 'Test Quiz',
        description: 'Test Description',
        instructions: 'Test Instructions',
        created_by: 'user-123',
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
        is_active: 1,
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockQuiz);

      const result = await quizService.createQuiz(mockDb, quizData);

      expect(d1Client.generateId).toHaveBeenCalled();
      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('INSERT INTO quizzes'),
        expect.arrayContaining([
          'mock-quiz-id-123',
          'Test Quiz',
          'Test Description',
          'Test Instructions',
          'user-123',
          1, // is_active
        ])
      );
      expect(result.id).toBe('mock-quiz-id-123');
      expect(result.title).toBe('Test Quiz');
      expect(result.description).toBe('Test Description');
      expect(result.instructions).toBe('Test Instructions');
      expect(result.created_by).toBe('user-123');
      expect(result.is_active).toBe(1);
    });

    it('should create a quiz with optional fields as null', async () => {
      const quizData = {
        title: 'Test Quiz',
        createdBy: 'user-123',
      };

      const mockQuiz = {
        id: 'mock-quiz-id-123',
        title: 'Test Quiz',
        description: null,
        instructions: null,
        created_by: 'user-123',
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
        is_active: 1,
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockQuiz);

      const result = await quizService.createQuiz(mockDb, quizData);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('INSERT INTO quizzes'),
        expect.arrayContaining([
          'mock-quiz-id-123',
          'Test Quiz',
          null, // description
          null, // instructions
          'user-123',
        ])
      );
      expect(result.description).toBeNull();
      expect(result.instructions).toBeNull();
    });

    it('should throw error if quiz creation fails to retrieve created quiz', async () => {
      const quizData = {
        title: 'Test Quiz',
        createdBy: 'user-123',
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      await expect(quizService.createQuiz(mockDb, quizData)).rejects.toThrow(
        'Failed to create quiz'
      );
    });
  });

  describe('getQuizById', () => {
    it('should retrieve an active quiz by ID', async () => {
      const quizId = 'quiz-123';
      const mockQuiz = {
        id: 'quiz-123',
        title: 'Test Quiz',
        description: 'Test Description',
        instructions: null,
        created_by: 'user-123',
        created_at: 1234567890,
        updated_at: 1234567890,
        is_active: 1,
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockQuiz);

      const result = await quizService.getQuizById(mockDb, quizId);

      expect(d1Client.executeQueryFirst).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('SELECT * FROM quizzes WHERE id = ?1 AND is_active = 1'),
        [quizId]
      );
      expect(result).toEqual(mockQuiz);
    });

    it('should return null if quiz not found', async () => {
      const quizId = 'nonexistent-quiz';

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await quizService.getQuizById(mockDb, quizId);

      expect(result).toBeNull();
    });

    it('should not return inactive quizzes', async () => {
      const quizId = 'inactive-quiz';

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await quizService.getQuizById(mockDb, quizId);

      expect(result).toBeNull();
    });
  });

  describe('getAllQuizzes', () => {
    it('should retrieve all active quizzes with question counts', async () => {
      const mockQuizzes = [
        {
          id: 'quiz-1',
          title: 'Quiz 1',
          description: null,
          instructions: null,
          created_by: 'user-1',
          created_at: 1234567890,
          updated_at: 1234567890,
          is_active: 1,
          question_count: 5,
        },
        {
          id: 'quiz-2',
          title: 'Quiz 2',
          description: 'Description',
          instructions: null,
          created_by: 'user-2',
          created_at: 1234567891,
          updated_at: 1234567891,
          is_active: 1,
          question_count: 3,
        },
      ];

      vi.mocked(d1Client.executeQuery).mockResolvedValue(mockQuizzes);

      const result = await quizService.getAllQuizzes(mockDb);

      expect(d1Client.executeQuery).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('SELECT')
      );
      expect(result).toEqual(mockQuizzes);
      expect(result[0].question_count).toBe(5);
      expect(result[1].question_count).toBe(3);
    });

    it('should return empty array when no quizzes exist', async () => {
      vi.mocked(d1Client.executeQuery).mockResolvedValue([]);

      const result = await quizService.getAllQuizzes(mockDb);

      expect(result).toEqual([]);
    });
  });

  describe('getQuizzesByUser', () => {
    it('should retrieve quizzes created by a specific user', async () => {
      const userId = 'user-123';
      const mockQuizzes = [
        {
          id: 'quiz-1',
          title: 'User Quiz 1',
          description: null,
          instructions: null,
          created_by: 'user-123',
          created_at: 1234567890,
          updated_at: 1234567890,
          is_active: 1,
          question_count: 2,
        },
      ];

      vi.mocked(d1Client.executeQuery).mockResolvedValue(mockQuizzes);

      const result = await quizService.getQuizzesByUser(mockDb, userId);

      expect(d1Client.executeQuery).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('WHERE q.created_by = ?1'),
        [userId]
      );
      expect(result).toEqual(mockQuizzes);
      expect(result[0].created_by).toBe('user-123');
    });

    it('should return empty array when user has no quizzes', async () => {
      const userId = 'user-no-quizzes';

      vi.mocked(d1Client.executeQuery).mockResolvedValue([]);

      const result = await quizService.getQuizzesByUser(mockDb, userId);

      expect(result).toEqual([]);
    });
  });

  describe('updateQuiz', () => {
    it('should update quiz title successfully', async () => {
      const quizId = 'quiz-123';
      const updateData = {
        title: 'Updated Title',
      };

      const mockUpdatedQuiz = {
        id: 'quiz-123',
        title: 'Updated Title',
        description: 'Original Description',
        instructions: null,
        created_by: 'user-123',
        created_at: 1234567890,
        updated_at: Math.floor(Date.now() / 1000),
        is_active: 1,
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUpdatedQuiz);

      const result = await quizService.updateQuiz(mockDb, quizId, updateData);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('UPDATE quizzes SET title = ?1'),
        expect.arrayContaining(['Updated Title', quizId])
      );
      expect(result.title).toBe('Updated Title');
    });

    it('should update quiz description to null when explicitly set to null', async () => {
      const quizId = 'quiz-123';
      const updateData = {
        description: null,
      };

      const mockUpdatedQuiz = {
        id: 'quiz-123',
        title: 'Original Title',
        description: null,
        instructions: null,
        created_by: 'user-123',
        created_at: 1234567890,
        updated_at: Math.floor(Date.now() / 1000),
        is_active: 1,
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUpdatedQuiz);

      const result = await quizService.updateQuiz(mockDb, quizId, updateData);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('UPDATE quizzes SET description = ?1'),
        expect.arrayContaining([null, quizId])
      );
      expect(result.description).toBeNull();
    });

    it('should update multiple fields at once', async () => {
      const quizId = 'quiz-123';
      const updateData = {
        title: 'New Title',
        description: 'New Description',
        instructions: 'New Instructions',
      };

      const mockUpdatedQuiz = {
        id: 'quiz-123',
        title: 'New Title',
        description: 'New Description',
        instructions: 'New Instructions',
        created_by: 'user-123',
        created_at: 1234567890,
        updated_at: Math.floor(Date.now() / 1000),
        is_active: 1,
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUpdatedQuiz);

      const result = await quizService.updateQuiz(mockDb, quizId, updateData);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('UPDATE quizzes SET'),
        expect.arrayContaining(['New Title', 'New Description', 'New Instructions', quizId])
      );
      expect(result.title).toBe('New Title');
      expect(result.description).toBe('New Description');
      expect(result.instructions).toBe('New Instructions');
    });

    it('should return existing quiz when no updates provided', async () => {
      const quizId = 'quiz-123';
      const updateData = {};

      const mockQuiz = {
        id: 'quiz-123',
        title: 'Original Title',
        description: null,
        instructions: null,
        created_by: 'user-123',
        created_at: 1234567890,
        updated_at: 1234567890,
        is_active: 1,
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockQuiz);

      const result = await quizService.updateQuiz(mockDb, quizId, updateData);

      expect(d1Client.executeMutation).not.toHaveBeenCalled();
      expect(d1Client.executeQueryFirst).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('SELECT * FROM quizzes WHERE id = ?1'),
        [quizId]
      );
      expect(result).toEqual(mockQuiz);
    });

    it('should throw error if quiz not found after update', async () => {
      const quizId = 'nonexistent-quiz';
      const updateData = {
        title: 'New Title',
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      await expect(quizService.updateQuiz(mockDb, quizId, updateData)).rejects.toThrow(
        'Quiz not found'
      );
    });
  });

  describe('deleteQuiz', () => {
    it('should soft delete a quiz by setting is_active to 0', async () => {
      const quizId = 'quiz-123';

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);

      await quizService.deleteQuiz(mockDb, quizId);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('UPDATE quizzes SET is_active = 0'),
        expect.arrayContaining([quizId])
      );
    });

    it('should update updated_at timestamp when deleting', async () => {
      const quizId = 'quiz-123';

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);

      await quizService.deleteQuiz(mockDb, quizId);

      const callArgs = vi.mocked(d1Client.executeMutation).mock.calls[0];
      expect(callArgs[1]).toContain('updated_at = ?1');
      expect(callArgs[2]).toHaveLength(2); // updated_at timestamp and quizId
    });
  });

  describe('quizExists', () => {
    it('should return true if quiz exists and is active', async () => {
      const quizId = 'quiz-123';
      const mockQuiz = {
        id: 'quiz-123',
        title: 'Test Quiz',
        description: null,
        instructions: null,
        created_by: 'user-123',
        created_at: 1234567890,
        updated_at: 1234567890,
        is_active: 1,
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockQuiz);

      const result = await quizService.quizExists(mockDb, quizId);

      expect(result).toBe(true);
    });

    it('should return false if quiz does not exist', async () => {
      const quizId = 'nonexistent-quiz';

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await quizService.quizExists(mockDb, quizId);

      expect(result).toBe(false);
    });

    it('should return false if quiz is inactive', async () => {
      const quizId = 'inactive-quiz';

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await quizService.quizExists(mockDb, quizId);

      expect(result).toBe(false);
    });
  });

  describe('isQuizOwner', () => {
    it('should return true if user is the creator of the quiz', async () => {
      const quizId = 'quiz-123';
      const userId = 'user-123';
      const mockQuiz = {
        id: 'quiz-123',
        title: 'Test Quiz',
        description: null,
        instructions: null,
        created_by: 'user-123',
        created_at: 1234567890,
        updated_at: 1234567890,
        is_active: 1,
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockQuiz);

      const result = await quizService.isQuizOwner(mockDb, quizId, userId);

      expect(result).toBe(true);
    });

    it('should return false if user is not the creator', async () => {
      const quizId = 'quiz-123';
      const userId = 'user-456';
      const mockQuiz = {
        id: 'quiz-123',
        title: 'Test Quiz',
        description: null,
        instructions: null,
        created_by: 'user-123',
        created_at: 1234567890,
        updated_at: 1234567890,
        is_active: 1,
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockQuiz);

      const result = await quizService.isQuizOwner(mockDb, quizId, userId);

      expect(result).toBe(false);
    });

    it('should return false if quiz does not exist', async () => {
      const quizId = 'nonexistent-quiz';
      const userId = 'user-123';

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await quizService.isQuizOwner(mockDb, quizId, userId);

      expect(result).toBe(false);
    });
  });
});

