-- Migration: Create sessions table
-- Description: Stores user session information for authentication
-- Created: 2026-01-07
-- Depends on: 0001_create_users_table.sql

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,                     -- Session ID (UUID)
  user_id TEXT NOT NULL,                   -- Foreign key to users.id
  token TEXT UNIQUE NOT NULL,              -- Session token
  expires_at INTEGER NOT NULL,             -- Expiration timestamp
  created_at INTEGER NOT NULL,             -- Creation timestamp
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

