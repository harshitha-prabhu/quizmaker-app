/**
 * Unit tests for attempt service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as attemptService from './attempt.service';
import * as questionService from './question.service';
import * as choiceService from './choice.service';
import * as d1Client from '@/lib/d1-client';
import type { D1Database } from '@cloudflare/workers-types';

// Mock d1-client
vi.mock('@/lib/d1-client', () => ({
  executeQuery: vi.fn(),
  executeQueryFirst: vi.fn(),
  executeMutation: vi.fn(),
  executeBatch: vi.fn(),
  generateId: vi.fn((index?: number) => `mock-id-${index ?? '123'}`),
}));

// Mock question and choice services
vi.mock('./question.service', () => ({
  getQuestionsByQuiz: vi.fn(),
}));

vi.mock('./choice.service', () => ({
  getChoicesByQuestion: vi.fn(),
}));

describe('attempt.service', () => {
  let mockDb: D1Database;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {} as D1Database;
  });

  describe('calculateScore', () => {
    it('should calculate score correctly for all correct answers', async () => {
      const quizId = 'quiz-123';
      const responses = new Map<string, string>([
        ['question-1', 'choice-correct-1'],
        ['question-2', 'choice-correct-2'],
      ]);

      const mockQuestions = [
        {
          id: 'question-1',
          quiz_id: 'quiz-123',
          question_text: 'Question 1',
          question_order: 1,
          points: 1,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
        {
          id: 'question-2',
          quiz_id: 'quiz-123',
          question_text: 'Question 2',
          question_order: 2,
          points: 2,
          created_at: 1234567891,
          updated_at: 1234567891,
        },
      ];

      const mockChoices1 = [
        {
          id: 'choice-wrong-1',
          question_id: 'question-1',
          choice_text: 'Wrong',
          choice_order: 1,
          is_correct: 0,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
        {
          id: 'choice-correct-1',
          question_id: 'question-1',
          choice_text: 'Correct',
          choice_order: 2,
          is_correct: 1,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
      ];

      const mockChoices2 = [
        {
          id: 'choice-wrong-2',
          question_id: 'question-2',
          choice_text: 'Wrong',
          choice_order: 1,
          is_correct: 0,
          created_at: 1234567891,
          updated_at: 1234567891,
        },
        {
          id: 'choice-correct-2',
          question_id: 'question-2',
          choice_text: 'Correct',
          choice_order: 2,
          is_correct: 1,
          created_at: 1234567891,
          updated_at: 1234567891,
        },
      ];

      vi.mocked(questionService.getQuestionsByQuiz).mockResolvedValue(mockQuestions);
      vi.mocked(choiceService.getChoicesByQuestion)
        .mockResolvedValueOnce(mockChoices1)
        .mockResolvedValueOnce(mockChoices2);

      const result = await attemptService.calculateScore(mockDb, quizId, responses);

      expect(result.score).toBe(3); // 1 + 2
      expect(result.totalPoints).toBe(3); // 1 + 2
      expect(result.percentage).toBe(100);
      expect(result.questionResults).toHaveLength(2);
      expect(result.questionResults[0].isCorrect).toBe(true);
      expect(result.questionResults[0].pointsEarned).toBe(1);
      expect(result.questionResults[1].isCorrect).toBe(true);
      expect(result.questionResults[1].pointsEarned).toBe(2);
    });

    it('should calculate score correctly for all incorrect answers', async () => {
      const quizId = 'quiz-123';
      const responses = new Map<string, string>([
        ['question-1', 'choice-wrong-1'],
        ['question-2', 'choice-wrong-2'],
      ]);

      const mockQuestions = [
        {
          id: 'question-1',
          quiz_id: 'quiz-123',
          question_text: 'Question 1',
          question_order: 1,
          points: 1,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
        {
          id: 'question-2',
          quiz_id: 'quiz-123',
          question_text: 'Question 2',
          question_order: 2,
          points: 1,
          created_at: 1234567891,
          updated_at: 1234567891,
        },
      ];

      const mockChoices1 = [
        {
          id: 'choice-wrong-1',
          question_id: 'question-1',
          choice_text: 'Wrong',
          choice_order: 1,
          is_correct: 0,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
        {
          id: 'choice-correct-1',
          question_id: 'question-1',
          choice_text: 'Correct',
          choice_order: 2,
          is_correct: 1,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
      ];

      const mockChoices2 = [
        {
          id: 'choice-wrong-2',
          question_id: 'question-2',
          choice_text: 'Wrong',
          choice_order: 1,
          is_correct: 0,
          created_at: 1234567891,
          updated_at: 1234567891,
        },
        {
          id: 'choice-correct-2',
          question_id: 'question-2',
          choice_text: 'Correct',
          choice_order: 2,
          is_correct: 1,
          created_at: 1234567891,
          updated_at: 1234567891,
        },
      ];

      vi.mocked(questionService.getQuestionsByQuiz).mockResolvedValue(mockQuestions);
      vi.mocked(choiceService.getChoicesByQuestion)
        .mockResolvedValueOnce(mockChoices1)
        .mockResolvedValueOnce(mockChoices2);

      const result = await attemptService.calculateScore(mockDb, quizId, responses);

      expect(result.score).toBe(0);
      expect(result.totalPoints).toBe(2);
      expect(result.percentage).toBe(0);
      expect(result.questionResults[0].isCorrect).toBe(false);
      expect(result.questionResults[0].pointsEarned).toBe(0);
      expect(result.questionResults[1].isCorrect).toBe(false);
      expect(result.questionResults[1].pointsEarned).toBe(0);
    });

    it('should calculate score correctly for partial correct answers', async () => {
      const quizId = 'quiz-123';
      const responses = new Map<string, string>([
        ['question-1', 'choice-correct-1'], // correct
        ['question-2', 'choice-wrong-2'], // incorrect
      ]);

      const mockQuestions = [
        {
          id: 'question-1',
          quiz_id: 'quiz-123',
          question_text: 'Question 1',
          question_order: 1,
          points: 2,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
        {
          id: 'question-2',
          quiz_id: 'quiz-123',
          question_text: 'Question 2',
          question_order: 2,
          points: 3,
          created_at: 1234567891,
          updated_at: 1234567891,
        },
      ];

      const mockChoices1 = [
        {
          id: 'choice-wrong-1',
          question_id: 'question-1',
          choice_text: 'Wrong',
          choice_order: 1,
          is_correct: 0,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
        {
          id: 'choice-correct-1',
          question_id: 'question-1',
          choice_text: 'Correct',
          choice_order: 2,
          is_correct: 1,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
      ];

      const mockChoices2 = [
        {
          id: 'choice-wrong-2',
          question_id: 'question-2',
          choice_text: 'Wrong',
          choice_order: 1,
          is_correct: 0,
          created_at: 1234567891,
          updated_at: 1234567891,
        },
        {
          id: 'choice-correct-2',
          question_id: 'question-2',
          choice_text: 'Correct',
          choice_order: 2,
          is_correct: 1,
          created_at: 1234567891,
          updated_at: 1234567891,
        },
      ];

      vi.mocked(questionService.getQuestionsByQuiz).mockResolvedValue(mockQuestions);
      vi.mocked(choiceService.getChoicesByQuestion)
        .mockResolvedValueOnce(mockChoices1)
        .mockResolvedValueOnce(mockChoices2);

      const result = await attemptService.calculateScore(mockDb, quizId, responses);

      expect(result.score).toBe(2); // Only question 1 correct
      expect(result.totalPoints).toBe(5); // 2 + 3
      expect(result.percentage).toBe(40); // 2/5 * 100
      expect(result.questionResults[0].isCorrect).toBe(true);
      expect(result.questionResults[0].pointsEarned).toBe(2);
      expect(result.questionResults[1].isCorrect).toBe(false);
      expect(result.questionResults[1].pointsEarned).toBe(0);
    });

    it('should handle unanswered questions as incorrect', async () => {
      const quizId = 'quiz-123';
      const responses = new Map<string, string>([
        ['question-1', 'choice-correct-1'], // answered correctly
        // question-2 not answered
      ]);

      const mockQuestions = [
        {
          id: 'question-1',
          quiz_id: 'quiz-123',
          question_text: 'Question 1',
          question_order: 1,
          points: 1,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
        {
          id: 'question-2',
          quiz_id: 'quiz-123',
          question_text: 'Question 2',
          question_order: 2,
          points: 1,
          created_at: 1234567891,
          updated_at: 1234567891,
        },
      ];

      const mockChoices1 = [
        {
          id: 'choice-correct-1',
          question_id: 'question-1',
          choice_text: 'Correct',
          choice_order: 1,
          is_correct: 1,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
      ];

      const mockChoices2 = [
        {
          id: 'choice-correct-2',
          question_id: 'question-2',
          choice_text: 'Correct',
          choice_order: 1,
          is_correct: 1,
          created_at: 1234567891,
          updated_at: 1234567891,
        },
      ];

      vi.mocked(questionService.getQuestionsByQuiz).mockResolvedValue(mockQuestions);
      vi.mocked(choiceService.getChoicesByQuestion)
        .mockResolvedValueOnce(mockChoices1)
        .mockResolvedValueOnce(mockChoices2);

      const result = await attemptService.calculateScore(mockDb, quizId, responses);

      expect(result.score).toBe(1); // Only question 1 correct
      expect(result.totalPoints).toBe(2);
      expect(result.percentage).toBe(50);
      expect(result.questionResults[0].isCorrect).toBe(true);
      expect(result.questionResults[0].pointsEarned).toBe(1);
      expect(result.questionResults[1].isCorrect).toBe(false);
      expect(result.questionResults[1].pointsEarned).toBe(0);
      expect(result.questionResults[1].selectedChoiceId).toBeNull();
    });

    it('should handle questions with no choices', async () => {
      const quizId = 'quiz-123';
      const responses = new Map<string, string>([
        ['question-1', 'choice-1'],
      ]);

      const mockQuestions = [
        {
          id: 'question-1',
          quiz_id: 'quiz-123',
          question_text: 'Question 1',
          question_order: 1,
          points: 1,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
      ];

      vi.mocked(questionService.getQuestionsByQuiz).mockResolvedValue(mockQuestions);
      vi.mocked(choiceService.getChoicesByQuestion).mockResolvedValueOnce([]);

      const result = await attemptService.calculateScore(mockDb, quizId, responses);

      expect(result.score).toBe(0);
      expect(result.totalPoints).toBe(1);
      expect(result.percentage).toBe(0);
      expect(result.questionResults[0].isCorrect).toBe(false);
      expect(result.questionResults[0].pointsEarned).toBe(0);
      expect(result.questionResults[0].correctChoiceId).toBeNull();
    });

    it('should return 0 percentage when total points is 0', async () => {
      const quizId = 'quiz-123';
      const responses = new Map<string, string>();

      vi.mocked(questionService.getQuestionsByQuiz).mockResolvedValue([]);

      const result = await attemptService.calculateScore(mockDb, quizId, responses);

      expect(result.score).toBe(0);
      expect(result.totalPoints).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.questionResults).toEqual([]);
    });

    it('should identify correct choice ID in results', async () => {
      const quizId = 'quiz-123';
      const responses = new Map<string, string>([
        ['question-1', 'choice-wrong-1'],
      ]);

      const mockQuestions = [
        {
          id: 'question-1',
          quiz_id: 'quiz-123',
          question_text: 'Question 1',
          question_order: 1,
          points: 1,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
      ];

      const mockChoices = [
        {
          id: 'choice-wrong-1',
          question_id: 'question-1',
          choice_text: 'Wrong',
          choice_order: 1,
          is_correct: 0,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
        {
          id: 'choice-correct-1',
          question_id: 'question-1',
          choice_text: 'Correct',
          choice_order: 2,
          is_correct: 1,
          created_at: 1234567890,
          updated_at: 1234567890,
        },
      ];

      vi.mocked(questionService.getQuestionsByQuiz).mockResolvedValue(mockQuestions);
      vi.mocked(choiceService.getChoicesByQuestion).mockResolvedValueOnce(mockChoices);

      const result = await attemptService.calculateScore(mockDb, quizId, responses);

      expect(result.questionResults[0].selectedChoiceId).toBe('choice-wrong-1');
      expect(result.questionResults[0].correctChoiceId).toBe('choice-correct-1');
    });
  });

  describe('getAttemptById', () => {
    it('should retrieve an attempt by ID', async () => {
      const attemptId = 'attempt-123';
      const mockAttempt = {
        id: 'attempt-123',
        user_id: 'user-123',
        quiz_id: 'quiz-123',
        score: 5,
        total_points: 10,
        percentage: 50,
        started_at: 1234567890,
        submitted_at: 1234567900,
        time_taken_seconds: 10,
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockAttempt);

      const result = await attemptService.getAttemptById(mockDb, attemptId);

      expect(d1Client.executeQueryFirst).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('SELECT * FROM attempts WHERE id = ?1'),
        [attemptId]
      );
      expect(result).toEqual(mockAttempt);
    });

    it('should return null if attempt not found', async () => {
      const attemptId = 'nonexistent-attempt';

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await attemptService.getAttemptById(mockDb, attemptId);

      expect(result).toBeNull();
    });
  });

  describe('getAttemptResponses', () => {
    it('should retrieve all responses for an attempt', async () => {
      const attemptId = 'attempt-123';
      const mockResponses = [
        {
          id: 'response-1',
          attempt_id: 'attempt-123',
          question_id: 'question-1',
          choice_id: 'choice-1',
          is_correct: 1,
          points_earned: 1,
        },
        {
          id: 'response-2',
          attempt_id: 'attempt-123',
          question_id: 'question-2',
          choice_id: 'choice-2',
          is_correct: 0,
          points_earned: 0,
        },
      ];

      vi.mocked(d1Client.executeQuery).mockResolvedValue(mockResponses);

      const result = await attemptService.getAttemptResponses(mockDb, attemptId);

      expect(d1Client.executeQuery).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('SELECT * FROM attempt_responses WHERE attempt_id = ?1'),
        [attemptId]
      );
      expect(result).toEqual(mockResponses);
    });

    it('should return empty array when attempt has no responses', async () => {
      const attemptId = 'attempt-no-responses';

      vi.mocked(d1Client.executeQuery).mockResolvedValue([]);

      const result = await attemptService.getAttemptResponses(mockDb, attemptId);

      expect(result).toEqual([]);
    });
  });
});

