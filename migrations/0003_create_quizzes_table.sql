-- Migration: Create quizzes table
-- Description: Stores quiz metadata and information
-- Created: 2026-01-07
-- Depends on: 0001_create_users_table.sql

CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,                     -- UUID or generated ID
  title TEXT NOT NULL,                     -- Quiz title
  description TEXT,                         -- Quiz description
  instructions TEXT,                        -- Instructions for taking quiz
  created_by TEXT NOT NULL,                 -- Foreign key to users.id
  created_at INTEGER NOT NULL,              -- Unix timestamp
  updated_at INTEGER NOT NULL,              -- Unix timestamp
  is_active INTEGER DEFAULT 1,             -- 1 = active, 0 = deleted/inactive
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_active ON quizzes(is_active);

