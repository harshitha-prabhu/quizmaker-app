-- Migration: Create questions table
-- Description: Stores quiz questions with order and points
-- Created: 2026-01-07
-- Depends on: 0003_create_quizzes_table.sql

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,                     -- UUID or generated ID
  quiz_id TEXT NOT NULL,                   -- Foreign key to quizzes.id
  question_text TEXT NOT NULL,              -- The question text
  question_order INTEGER NOT NULL,          -- Order within quiz (1, 2, 3...)
  points INTEGER DEFAULT 1,                 -- Points for correct answer
  created_at INTEGER NOT NULL,              -- Unix timestamp
  updated_at INTEGER NOT NULL,              -- Unix timestamp
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_order ON questions(quiz_id, question_order);

