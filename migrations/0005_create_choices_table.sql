-- Migration: Create choices table
-- Description: Stores answer choices for quiz questions
-- Created: 2026-01-07
-- Depends on: 0004_create_questions_table.sql

CREATE TABLE IF NOT EXISTS choices (
  id TEXT PRIMARY KEY,                     -- UUID or generated ID
  question_id TEXT NOT NULL,               -- Foreign key to questions.id
  choice_text TEXT NOT NULL,               -- The choice text
  choice_order INTEGER NOT NULL,           -- Order within question (1, 2, 3, 4)
  is_correct INTEGER DEFAULT 0,            -- 1 = correct, 0 = incorrect
  created_at INTEGER NOT NULL,             -- Unix timestamp
  updated_at INTEGER NOT NULL,             -- Unix timestamp
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_choices_question_id ON choices(question_id);
CREATE INDEX IF NOT EXISTS idx_choices_question_order ON choices(question_id, choice_order);

