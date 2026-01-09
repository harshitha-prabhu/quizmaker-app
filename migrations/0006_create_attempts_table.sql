-- Migration: Create attempts table
-- Description: Stores quiz attempt records with scores
-- Created: 2026-01-07
-- Depends on: 0001_create_users_table.sql, 0003_create_quizzes_table.sql

CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,                     -- UUID or generated ID
  user_id TEXT NOT NULL,                   -- Foreign key to users.id
  quiz_id TEXT NOT NULL,                   -- Foreign key to quizzes.id
  score INTEGER NOT NULL,                  -- Points earned
  total_points INTEGER NOT NULL,           -- Total possible points
  percentage REAL NOT NULL,                -- Score percentage (0-100)
  started_at INTEGER NOT NULL,             -- When attempt started
  submitted_at INTEGER,                    -- When submitted (NULL if in progress)
  time_taken_seconds INTEGER,              -- Time taken in seconds (optional)
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_submitted_at ON attempts(submitted_at);

