-- Migration: Create users table
-- Description: Stores user account information for authentication
-- Created: 2026-01-07

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                    -- UUID or generated ID
  first_name TEXT NOT NULL,               -- User's first name
  last_name TEXT NOT NULL,                 -- User's last name
  username TEXT UNIQUE,                    -- Optional username
  email TEXT UNIQUE,                       -- Email address (if using email)
  password_hash TEXT NOT NULL,             -- Hashed password (bcrypt)
  created_at INTEGER NOT NULL,             -- Unix timestamp
  updated_at INTEGER NOT NULL,             -- Unix timestamp
  last_login_at INTEGER,                   -- Last login timestamp
  is_active INTEGER DEFAULT 1              -- 1 = active, 0 = inactive
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

