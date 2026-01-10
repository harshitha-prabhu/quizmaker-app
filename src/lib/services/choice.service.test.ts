/**
 * Unit tests for choice service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as choiceService from './choice.service';
import * as d1Client from '@/lib/d1-client';
import type { D1Database } from '@cloudflare/workers-types';

// Mock d1-client
vi.mock('@/lib/d1-client', () => ({
  executeQuery: vi.fn(),
  executeQueryFirst: vi.fn(),
  executeMutation: vi.fn(),
  executeBatch: vi.fn(),
  generateId: vi.fn((index?: number) => `mock-choice-id-${index ?? '123'}`),
}));

describe('choice.service', () => {
  let mockDb: D1Database;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {} as D1Database;
  });

  describe('createChoice', () => {
    it('should create a new choice successfully with correct answer', async () => {
      const choiceData = {
        questionId: 'question-123',
        choiceText: 'Answer A',
        choiceOrder: 1,
        isCorrect: true,
      };

      const mockChoice = {
        id: 'mock-choice-id-123',
        question_id: 'question-123',
        choice_text: 'Answer A',
        choice_order: 1,
        is_correct: 1,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockChoice);

      const result = await choiceService.createChoice(mockDb, choiceData);

      expect(d1Client.generateId).toHaveBeenCalled();
      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('INSERT INTO choices'),
        expect.arrayContaining([
          'mock-choice-id-123',
          'question-123',
          'Answer A',
          1, // choice_order
          1, // is_correct (true converted to 1)
        ])
      );
      expect(result.id).toBe('mock-choice-id-123');
      expect(result.choice_text).toBe('Answer A');
      expect(result.is_correct).toBe(1);
    });

    it('should create a choice with incorrect answer (isCorrect: false)', async () => {
      const choiceData = {
        questionId: 'question-123',
        choiceText: 'Wrong Answer',
        choiceOrder: 2,
        isCorrect: false,
      };

      const mockChoice = {
        id: 'mock-choice-id-123',
        question_id: 'question-123',
        choice_text: 'Wrong Answer',
        choice_order: 2,
        is_correct: 0,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockChoice);

      const result = await choiceService.createChoice(mockDb, choiceData);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('INSERT INTO choices'),
        expect.arrayContaining([0]) // is_correct (false converted to 0)
      );
      expect(result.is_correct).toBe(0);
    });

    it('should throw error if choice creation fails to retrieve created choice', async () => {
      const choiceData = {
        questionId: 'question-123',
        choiceText: 'Answer A',
        choiceOrder: 1,
        isCorrect: true,
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      await expect(choiceService.createChoice(mockDb, choiceData)).rejects.toThrow(
        'Failed to create choice'
      );
    });
  });

  describe('getChoiceById', () => {
    it('should retrieve a choice by ID', async () => {
      const choiceId = 'choice-123';
      const mockChoice = {
        id: 'choice-123',
        question_id: 'question-123',
        choice_text: 'Answer A',
        choice_order: 1,
        is_correct: 1,
        created_at: 1234567890,
        updated_at: 1234567890,
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockChoice);

      const result = await choiceService.getChoiceById(mockDb, choiceId);

      expect(d1Client.executeQueryFirst).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('SELECT * FROM choices WHERE id = ?1'),
        [choiceId]
      );
      expect(result).toEqual(mockChoice);
    });

    it('should return null if choice not found', async () => {
      const choiceId = 'nonexistent-choice';

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await choiceService.getChoiceById(mockDb, choiceId);

      expect(result).toBeNull();
    });
  });

  describe('getChoicesByQuestion', () => {
    it('should retrieve all choices for a question ordered by choice_order', async () => {
      const questionId = 'question-123';
      const mockChoices = [
        {
          id: 'choice-1',
          question_id: 'question-123',
          choice_text: 'Answer A',
          choice_order: 1,
          is_correct: 0,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
        {
          id: 'choice-2',
          question_id: 'question-123',
          choice_text: 'Answer B',
          choice_order: 2,
          is_correct: 1,
          created_at: 1234567891,
          updated_at: 1234567891,
        },
      ];

      vi.mocked(d1Client.executeQuery).mockResolvedValue(mockChoices);

      const result = await choiceService.getChoicesByQuestion(mockDb, questionId);

      expect(d1Client.executeQuery).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('SELECT * FROM choices WHERE question_id = ?1 ORDER BY choice_order ASC'),
        [questionId]
      );
      expect(result).toEqual(mockChoices);
      expect(result.length).toBe(2);
    });

    it('should return empty array when question has no choices', async () => {
      const questionId = 'question-no-choices';

      vi.mocked(d1Client.executeQuery).mockResolvedValue([]);

      const result = await choiceService.getChoicesByQuestion(mockDb, questionId);

      expect(result).toEqual([]);
    });
  });

  describe('updateChoice', () => {
    it('should update choice text successfully', async () => {
      const choiceId = 'choice-123';
      const updateData = {
        choiceText: 'Updated answer',
      };

      const mockUpdatedChoice = {
        id: 'choice-123',
        question_id: 'question-123',
        choice_text: 'Updated answer',
        choice_order: 1,
        is_correct: 0,
        created_at: 1234567890,
        updated_at: Math.floor(Date.now() / 1000),
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUpdatedChoice);

      const result = await choiceService.updateChoice(mockDb, choiceId, updateData);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('UPDATE choices SET choice_text = ?1'),
        expect.arrayContaining(['Updated answer', choiceId])
      );
      expect(result.choice_text).toBe('Updated answer');
    });

    it('should update choice order successfully', async () => {
      const choiceId = 'choice-123';
      const updateData = {
        choiceOrder: 3,
      };

      const mockUpdatedChoice = {
        id: 'choice-123',
        question_id: 'question-123',
        choice_text: 'Original text',
        choice_order: 3,
        is_correct: 0,
        created_at: 1234567890,
        updated_at: Math.floor(Date.now() / 1000),
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUpdatedChoice);

      const result = await choiceService.updateChoice(mockDb, choiceId, updateData);

      expect(result.choice_order).toBe(3);
    });

    it('should update isCorrect from false to true', async () => {
      const choiceId = 'choice-123';
      const updateData = {
        isCorrect: true,
      };

      const mockUpdatedChoice = {
        id: 'choice-123',
        question_id: 'question-123',
        choice_text: 'Answer',
        choice_order: 1,
        is_correct: 1,
        created_at: 1234567890,
        updated_at: Math.floor(Date.now() / 1000),
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUpdatedChoice);

      const result = await choiceService.updateChoice(mockDb, choiceId, updateData);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('UPDATE choices SET is_correct = ?1'),
        expect.arrayContaining([1, choiceId]) // true converted to 1
      );
      expect(result.is_correct).toBe(1);
    });

    it('should update isCorrect from true to false', async () => {
      const choiceId = 'choice-123';
      const updateData = {
        isCorrect: false,
      };

      const mockUpdatedChoice = {
        id: 'choice-123',
        question_id: 'question-123',
        choice_text: 'Answer',
        choice_order: 1,
        is_correct: 0,
        created_at: 1234567890,
        updated_at: Math.floor(Date.now() / 1000),
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUpdatedChoice);

      const result = await choiceService.updateChoice(mockDb, choiceId, updateData);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('UPDATE choices SET is_correct = ?1'),
        expect.arrayContaining([0, choiceId]) // false converted to 0
      );
      expect(result.is_correct).toBe(0);
    });

    it('should update multiple fields at once', async () => {
      const choiceId = 'choice-123';
      const updateData = {
        choiceText: 'New text',
        choiceOrder: 4,
        isCorrect: true,
      };

      const mockUpdatedChoice = {
        id: 'choice-123',
        question_id: 'question-123',
        choice_text: 'New text',
        choice_order: 4,
        is_correct: 1,
        created_at: 1234567890,
        updated_at: Math.floor(Date.now() / 1000),
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUpdatedChoice);

      const result = await choiceService.updateChoice(mockDb, choiceId, updateData);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('UPDATE choices SET'),
        expect.arrayContaining(['New text', 4, 1, choiceId])
      );
      expect(result.choice_text).toBe('New text');
      expect(result.choice_order).toBe(4);
      expect(result.is_correct).toBe(1);
    });

    it('should return existing choice when no updates provided', async () => {
      const choiceId = 'choice-123';
      const updateData = {};

      const mockChoice = {
        id: 'choice-123',
        question_id: 'question-123',
        choice_text: 'Original text',
        choice_order: 1,
        is_correct: 0,
        created_at: 1234567890,
        updated_at: 1234567890,
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockChoice);

      const result = await choiceService.updateChoice(mockDb, choiceId, updateData);

      expect(d1Client.executeMutation).not.toHaveBeenCalled();
      expect(result).toEqual(mockChoice);
    });

    it('should throw error if choice not found after update', async () => {
      const choiceId = 'nonexistent-choice';
      const updateData = {
        choiceText: 'New text',
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      await expect(choiceService.updateChoice(mockDb, choiceId, updateData)).rejects.toThrow(
        'Choice not found'
      );
    });
  });

  describe('deleteChoice', () => {
    it('should delete a choice from the database', async () => {
      const choiceId = 'choice-123';

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);

      await choiceService.deleteChoice(mockDb, choiceId);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('DELETE FROM choices WHERE id = ?1'),
        [choiceId]
      );
    });
  });

  describe('createChoicesBatch', () => {
    it('should create multiple choices in a batch', async () => {
      const choices = [
        {
          questionId: 'question-123',
          choiceText: 'Answer A',
          choiceOrder: 1,
          isCorrect: false,
        },
        {
          questionId: 'question-123',
          choiceText: 'Answer B',
          choiceOrder: 2,
          isCorrect: true,
        },
      ];

      vi.mocked(d1Client.generateId)
        .mockReturnValueOnce('choice-id-1')
        .mockReturnValueOnce('choice-id-2');
      vi.mocked(d1Client.executeBatch).mockResolvedValue({} as never);

      const result = await choiceService.createChoicesBatch(mockDb, choices);

      expect(d1Client.generateId).toHaveBeenCalledTimes(2);
      expect(d1Client.executeBatch).toHaveBeenCalledWith(
        mockDb,
        expect.arrayContaining([
          expect.objectContaining({
            sql: expect.stringContaining('INSERT INTO choices'),
            params: expect.arrayContaining([
              'choice-id-1',
              'question-123',
              'Answer A',
              1, // choice_order
              0, // is_correct (false)
            ]),
          }),
          expect.objectContaining({
            params: expect.arrayContaining([
              'choice-id-2',
              'question-123',
              'Answer B',
              2, // choice_order
              1, // is_correct (true)
            ]),
          }),
        ])
      );
      expect(result).toEqual(['choice-id-1', 'choice-id-2']);
    });

    it('should convert boolean isCorrect to integer in batch', async () => {
      const choices = [
        {
          questionId: 'question-123',
          choiceText: 'Answer A',
          choiceOrder: 1,
          isCorrect: true,
        },
        {
          questionId: 'question-123',
          choiceText: 'Answer B',
          choiceOrder: 2,
          isCorrect: false,
        },
      ];

      vi.mocked(d1Client.generateId)
        .mockReturnValueOnce('choice-id-1')
        .mockReturnValueOnce('choice-id-2');
      vi.mocked(d1Client.executeBatch).mockResolvedValue({} as never);

      await choiceService.createChoicesBatch(mockDb, choices);

      const callArgs = vi.mocked(d1Client.executeBatch).mock.calls[0];
      const queries = callArgs[1] as Array<{ params: unknown[] }>;
      expect(queries[0].params).toContain(1); // true -> 1
      expect(queries[1].params).toContain(0); // false -> 0
    });

    it('should return empty array when no choices provided', async () => {
      const choices: Array<{
        questionId: string;
        choiceText: string;
        choiceOrder: number;
        isCorrect: boolean;
      }> = [];

      vi.mocked(d1Client.executeBatch).mockResolvedValue({} as never);

      const result = await choiceService.createChoicesBatch(mockDb, choices);

      expect(d1Client.executeBatch).toHaveBeenCalledWith(mockDb, []);
      expect(result).toEqual([]);
    });
  });

  describe('deleteChoicesByQuestion', () => {
    it('should delete all choices for a question', async () => {
      const questionId = 'question-123';

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);

      await choiceService.deleteChoicesByQuestion(mockDb, questionId);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('DELETE FROM choices WHERE question_id = ?1'),
        [questionId]
      );
    });
  });
});

