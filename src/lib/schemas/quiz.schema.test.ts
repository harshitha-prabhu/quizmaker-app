/**
 * Unit tests for quiz validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  ChoiceSchema,
  QuestionSchema,
  CreateQuizSchema,
  UpdateQuizSchema,
} from './quiz.schema';

describe('quiz.schema', () => {
  describe('ChoiceSchema', () => {
    it('should validate a valid choice', () => {
      const validChoice = {
        choiceText: 'Answer A',
        isCorrect: true,
      };

      const result = ChoiceSchema.parse(validChoice);

      expect(result.choiceText).toBe('Answer A');
      expect(result.isCorrect).toBe(true);
    });

    it('should trim choice text', () => {
      const choice = {
        choiceText: '  Answer A  ',
        isCorrect: false,
      };

      const result = ChoiceSchema.parse(choice);

      expect(result.choiceText).toBe('Answer A');
    });

    it('should reject empty choice text', () => {
      const invalidChoice = {
        choiceText: '',
        isCorrect: true,
      };

      expect(() => ChoiceSchema.parse(invalidChoice)).toThrow();
    });

    it('should reject choice text that is too long', () => {
      const invalidChoice = {
        choiceText: 'A'.repeat(501),
        isCorrect: true,
      };

      expect(() => ChoiceSchema.parse(invalidChoice)).toThrow();
    });

    it('should accept choice text at max length', () => {
      const validChoice = {
        choiceText: 'A'.repeat(500),
        isCorrect: true,
      };

      const result = ChoiceSchema.parse(validChoice);

      expect(result.choiceText).toHaveLength(500);
    });

    it('should accept boolean isCorrect value', () => {
      const choice1 = { choiceText: 'Answer', isCorrect: true };
      const choice2 = { choiceText: 'Answer', isCorrect: false };

      expect(ChoiceSchema.parse(choice1).isCorrect).toBe(true);
      expect(ChoiceSchema.parse(choice2).isCorrect).toBe(false);
    });
  });

  describe('QuestionSchema', () => {
    it('should validate a valid question with correct choices', () => {
      const validQuestion = {
        questionText: 'What is 2+2?',
        points: 5,
        choices: [
          { choiceText: 'Answer A', isCorrect: false },
          { choiceText: 'Answer B', isCorrect: true },
        ],
      };

      const result = QuestionSchema.parse(validQuestion);

      expect(result.questionText).toBe('What is 2+2?');
      expect(result.points).toBe(5);
      expect(result.choices).toHaveLength(2);
      expect(result.choices[1].isCorrect).toBe(true);
    });

    it('should use default points value of 1 when not provided', () => {
      const question = {
        questionText: 'What is 2+2?',
        choices: [
          { choiceText: 'Answer A', isCorrect: false },
          { choiceText: 'Answer B', isCorrect: true },
        ],
      };

      const result = QuestionSchema.parse(question);

      expect(result.points).toBe(1);
    });

    it('should trim question text', () => {
      const question = {
        questionText: '  What is 2+2?  ',
        choices: [
          { choiceText: 'Answer A', isCorrect: false },
          { choiceText: 'Answer B', isCorrect: true },
        ],
      };

      const result = QuestionSchema.parse(question);

      expect(result.questionText).toBe('What is 2+2?');
    });

    it('should reject empty question text', () => {
      const invalidQuestion = {
        questionText: '',
        choices: [
          { choiceText: 'Answer A', isCorrect: true },
        ],
      };

      expect(() => QuestionSchema.parse(invalidQuestion)).toThrow();
    });

    it('should reject question text that is too long', () => {
      const invalidQuestion = {
        questionText: 'A'.repeat(1001),
        choices: [
          { choiceText: 'Answer A', isCorrect: true },
        ],
      };

      expect(() => QuestionSchema.parse(invalidQuestion)).toThrow();
    });

    it('should reject question with less than 2 choices', () => {
      const invalidQuestion = {
        questionText: 'What is 2+2?',
        choices: [
          { choiceText: 'Answer A', isCorrect: true },
        ],
      };

      expect(() => QuestionSchema.parse(invalidQuestion)).toThrow();
    });

    it('should reject question with more than 4 choices', () => {
      const invalidQuestion = {
        questionText: 'What is 2+2?',
        choices: [
          { choiceText: 'Answer A', isCorrect: false },
          { choiceText: 'Answer B', isCorrect: false },
          { choiceText: 'Answer C', isCorrect: false },
          { choiceText: 'Answer D', isCorrect: false },
          { choiceText: 'Answer E', isCorrect: true },
        ],
      };

      expect(() => QuestionSchema.parse(invalidQuestion)).toThrow();
    });

    it('should accept question with exactly 4 choices', () => {
      const validQuestion = {
        questionText: 'What is 2+2?',
        choices: [
          { choiceText: 'Answer A', isCorrect: false },
          { choiceText: 'Answer B', isCorrect: false },
          { choiceText: 'Answer C', isCorrect: false },
          { choiceText: 'Answer D', isCorrect: true },
        ],
      };

      const result = QuestionSchema.parse(validQuestion);

      expect(result.choices).toHaveLength(4);
    });

    it('should reject question with no correct answer', () => {
      const invalidQuestion = {
        questionText: 'What is 2+2?',
        choices: [
          { choiceText: 'Answer A', isCorrect: false },
          { choiceText: 'Answer B', isCorrect: false },
        ],
      };

      expect(() => QuestionSchema.parse(invalidQuestion)).toThrow();
    });

    it('should accept question with at least one correct answer', () => {
      const validQuestion = {
        questionText: 'What is 2+2?',
        choices: [
          { choiceText: 'Answer A', isCorrect: false },
          { choiceText: 'Answer B', isCorrect: true },
        ],
      };

      const result = QuestionSchema.parse(validQuestion);

      expect(result.choices.some((c) => c.isCorrect)).toBe(true);
    });

    it('should reject negative points', () => {
      const invalidQuestion = {
        questionText: 'What is 2+2?',
        points: -1,
        choices: [
          { choiceText: 'Answer A', isCorrect: false },
          { choiceText: 'Answer B', isCorrect: true },
        ],
      };

      expect(() => QuestionSchema.parse(invalidQuestion)).toThrow();
    });

    it('should reject zero points', () => {
      const invalidQuestion = {
        questionText: 'What is 2+2?',
        points: 0,
        choices: [
          { choiceText: 'Answer A', isCorrect: false },
          { choiceText: 'Answer B', isCorrect: true },
        ],
      };

      expect(() => QuestionSchema.parse(invalidQuestion)).toThrow();
    });

    it('should accept positive integer points', () => {
      const validQuestion = {
        questionText: 'What is 2+2?',
        points: 10,
        choices: [
          { choiceText: 'Answer A', isCorrect: false },
          { choiceText: 'Answer B', isCorrect: true },
        ],
      };

      const result = QuestionSchema.parse(validQuestion);

      expect(result.points).toBe(10);
    });
  });

  describe('CreateQuizSchema', () => {
    it('should validate a valid quiz with all fields', () => {
      const validQuiz = {
        title: 'Math Quiz',
        description: 'A quiz about math',
        instructions: 'Answer all questions',
        questions: [
          {
            questionText: 'What is 2+2?',
            points: 1,
            choices: [
              { choiceText: 'Answer A', isCorrect: false },
              { choiceText: 'Answer B', isCorrect: true },
            ],
          },
        ],
      };

      const result = CreateQuizSchema.parse(validQuiz);

      expect(result.title).toBe('Math Quiz');
      expect(result.description).toBe('A quiz about math');
      expect(result.instructions).toBe('Answer all questions');
      expect(result.questions).toHaveLength(1);
    });

    it('should validate a quiz with only required fields', () => {
      const validQuiz = {
        title: 'Math Quiz',
        questions: [
          {
            questionText: 'What is 2+2?',
            choices: [
              { choiceText: 'Answer A', isCorrect: false },
              { choiceText: 'Answer B', isCorrect: true },
            ],
          },
        ],
      };

      const result = CreateQuizSchema.parse(validQuiz);

      expect(result.title).toBe('Math Quiz');
      expect(result.description).toBeUndefined();
      expect(result.instructions).toBeUndefined();
    });

    it('should trim title', () => {
      const quiz = {
        title: '  Math Quiz  ',
        questions: [
          {
            questionText: 'What is 2+2?',
            choices: [
              { choiceText: 'Answer A', isCorrect: false },
              { choiceText: 'Answer B', isCorrect: true },
            ],
          },
        ],
      };

      const result = CreateQuizSchema.parse(quiz);

      expect(result.title).toBe('Math Quiz');
    });

    it('should reject empty title', () => {
      const invalidQuiz = {
        title: '',
        questions: [
          {
            questionText: 'What is 2+2?',
            choices: [
              { choiceText: 'Answer A', isCorrect: true },
            ],
          },
        ],
      };

      expect(() => CreateQuizSchema.parse(invalidQuiz)).toThrow();
    });

    it('should reject title that is too long', () => {
      const invalidQuiz = {
        title: 'A'.repeat(201),
        questions: [
          {
            questionText: 'What is 2+2?',
            choices: [
              { choiceText: 'Answer A', isCorrect: true },
            ],
          },
        ],
      };

      expect(() => CreateQuizSchema.parse(invalidQuiz)).toThrow();
    });

    it('should accept title at max length', () => {
      const validQuiz = {
        title: 'A'.repeat(200),
        questions: [
          {
            questionText: 'What is 2+2?',
            choices: [
              { choiceText: 'Answer A', isCorrect: false },
              { choiceText: 'Answer B', isCorrect: true },
            ],
          },
        ],
      };

      const result = CreateQuizSchema.parse(validQuiz);

      expect(result.title).toHaveLength(200);
    });

    it('should convert empty description to undefined', () => {
      const quiz = {
        title: 'Math Quiz',
        description: '',
        questions: [
          {
            questionText: 'What is 2+2?',
            choices: [
              { choiceText: 'Answer A', isCorrect: false },
              { choiceText: 'Answer B', isCorrect: true },
            ],
          },
        ],
      };

      const result = CreateQuizSchema.parse(quiz);

      expect(result.description).toBeUndefined();
    });

    it('should convert null description to undefined', () => {
      const quiz = {
        title: 'Math Quiz',
        description: null,
        questions: [
          {
            questionText: 'What is 2+2?',
            choices: [
              { choiceText: 'Answer A', isCorrect: false },
              { choiceText: 'Answer B', isCorrect: true },
            ],
          },
        ],
      };

      const result = CreateQuizSchema.parse(quiz);

      expect(result.description).toBeUndefined();
    });

    it('should reject description that is too long', () => {
      const invalidQuiz = {
        title: 'Math Quiz',
        description: 'A'.repeat(1001),
        questions: [
          {
            questionText: 'What is 2+2?',
            choices: [
              { choiceText: 'Answer A', isCorrect: true },
            ],
          },
        ],
      };

      expect(() => CreateQuizSchema.parse(invalidQuiz)).toThrow();
    });

    it('should reject instructions that is too long', () => {
      const invalidQuiz = {
        title: 'Math Quiz',
        instructions: 'A'.repeat(501),
        questions: [
          {
            questionText: 'What is 2+2?',
            choices: [
              { choiceText: 'Answer A', isCorrect: true },
            ],
          },
        ],
      };

      expect(() => CreateQuizSchema.parse(invalidQuiz)).toThrow();
    });

    it('should reject quiz with no questions', () => {
      const invalidQuiz = {
        title: 'Math Quiz',
        questions: [],
      };

      expect(() => CreateQuizSchema.parse(invalidQuiz)).toThrow();
    });

    it('should accept quiz with at least one question', () => {
      const validQuiz = {
        title: 'Math Quiz',
        questions: [
          {
            questionText: 'What is 2+2?',
            choices: [
              { choiceText: 'Answer A', isCorrect: false },
              { choiceText: 'Answer B', isCorrect: true },
            ],
          },
        ],
      };

      const result = CreateQuizSchema.parse(validQuiz);

      expect(result.questions).toHaveLength(1);
    });
  });

  describe('UpdateQuizSchema', () => {
    it('should validate a valid quiz update with all fields', () => {
      const validUpdate = {
        title: 'Updated Quiz',
        description: 'Updated description',
        instructions: 'Updated instructions',
        questions: [
          {
            questionText: 'What is 2+2?',
            choices: [
              { choiceText: 'Answer A', isCorrect: false },
              { choiceText: 'Answer B', isCorrect: true },
            ],
          },
        ],
      };

      const result = UpdateQuizSchema.parse(validUpdate);

      expect(result.title).toBe('Updated Quiz');
      expect(result.description).toBe('Updated description');
      expect(result.instructions).toBe('Updated instructions');
      expect(result.questions).toHaveLength(1);
    });

    it('should validate a quiz update with only title', () => {
      const validUpdate = {
        title: 'Updated Quiz',
      };

      const result = UpdateQuizSchema.parse(validUpdate);

      expect(result.title).toBe('Updated Quiz');
      expect(result.description).toBeUndefined();
      expect(result.instructions).toBeUndefined();
      expect(result.questions).toBeUndefined();
    });

    it('should make questions optional in update', () => {
      const validUpdate = {
        title: 'Updated Quiz',
      };

      const result = UpdateQuizSchema.parse(validUpdate);

      expect(result.questions).toBeUndefined();
    });

    it('should validate questions when provided in update', () => {
      const validUpdate = {
        title: 'Updated Quiz',
        questions: [
          {
            questionText: 'What is 2+2?',
            choices: [
              { choiceText: 'Answer A', isCorrect: false },
              { choiceText: 'Answer B', isCorrect: true },
            ],
          },
        ],
      };

      const result = UpdateQuizSchema.parse(validUpdate);

      expect(result.questions).toHaveLength(1);
    });

    it('should reject update with empty questions array', () => {
      const invalidUpdate = {
        title: 'Updated Quiz',
        questions: [],
      };

      expect(() => UpdateQuizSchema.parse(invalidUpdate)).toThrow();
    });

    it('should convert empty description to undefined in update', () => {
      const update = {
        title: 'Updated Quiz',
        description: '',
      };

      const result = UpdateQuizSchema.parse(update);

      expect(result.description).toBeUndefined();
    });

    it('should reject empty title in update', () => {
      const invalidUpdate = {
        title: '',
      };

      expect(() => UpdateQuizSchema.parse(invalidUpdate)).toThrow();
    });
  });
});

