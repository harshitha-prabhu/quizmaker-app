-- Migration: Create attempt_responses table
-- Description: Stores individual question responses for quiz attempts
-- Created: 2026-01-07
-- Depends on: 0006_create_attempts_table.sql, 0004_create_questions_table.sql, 0005_create_choices_table.sql

CREATE TABLE IF NOT EXISTS attempt_responses (
  id TEXT PRIMARY KEY,                     -- UUID or generated ID
  attempt_id TEXT NOT NULL,                -- Foreign key to attempts.id
  question_id TEXT NOT NULL,               -- Foreign key to questions.id
  choice_id TEXT,                          -- Foreign key to choices.id (selected answer)
  is_correct INTEGER NOT NULL,             -- 1 = correct, 0 = incorrect
  points_earned INTEGER NOT NULL,          -- Points earned for this question
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (choice_id) REFERENCES choices(id) ON DELETE SET NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_attempt_responses_attempt_id ON attempt_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_responses_question_id ON attempt_responses(question_id);

