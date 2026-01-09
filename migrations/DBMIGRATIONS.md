# Database Migrations

This directory contains SQL migration files for the QuizMaker application's Cloudflare D1 database.

## Migration Files

### Applied Migrations

1. **0001_create_users_table.sql** - Creates the `users` table for user accounts
   - Stores user information (name, email, username, password hash)
   - Includes indexes on `email` and `username` for fast lookups
   - Tracks user activity timestamps

2. **0002_create_sessions_table.sql** - Creates the `sessions` table for authentication
   - Stores session tokens and expiration times
   - Foreign key to `users` table with CASCADE delete
   - Includes indexes on `token`, `user_id`, and `expires_at`

3. **0003_create_quizzes_table.sql** - Creates the `quizzes` table for quiz metadata
   - Stores quiz information (title, description, instructions)
   - Foreign key to `users` table (created_by) with CASCADE delete
   - Includes indexes on `created_by`, `created_at`, and `is_active`
   - Tracks creation and update timestamps

4. **0004_create_questions_table.sql** - Creates the `questions` table for quiz questions
   - Stores question text, order, and points
   - Foreign key to `quizzes` table with CASCADE delete
   - Includes indexes on `quiz_id` and composite index on `(quiz_id, question_order)`

5. **0005_create_choices_table.sql** - Creates the `choices` table for answer choices
   - Stores choice text, order, and correctness flag
   - Foreign key to `questions` table with CASCADE delete
   - Includes indexes on `question_id` and composite index on `(question_id, choice_order)`

6. **0006_create_attempts_table.sql** - Creates the `attempts` table for quiz attempts
   - Stores attempt records with scores and timestamps
   - Foreign keys to `users` and `quizzes` tables with CASCADE delete
   - Includes indexes on `user_id`, `quiz_id`, and `submitted_at`

7. **0007_create_attempt_responses_table.sql** - Creates the `attempt_responses` table for individual responses
   - Stores question responses with correctness and points earned
   - Foreign keys to `attempts`, `questions`, and `choices` tables
   - Includes indexes on `attempt_id` and `question_id`

## Migration Commands

### List Migrations

```bash
# List migrations for local database
npx wrangler d1 migrations list quizmaker-demo-app-database

# List migrations for remote database
npx wrangler d1 migrations list quizmaker-demo-app-database --remote
```

### Apply Migrations

**⚠️ IMPORTANT: Only apply migrations to local database during development. Do NOT apply to remote/production database without proper review and approval.**

```bash
# Apply migrations to local database
npx wrangler d1 migrations apply quizmaker-demo-app-database --local

# Apply migrations to remote database (use with caution)
npx wrangler d1 migrations apply quizmaker-demo-app-database --remote
```

### Create New Migration

```bash
# Create a new migration file
npx wrangler d1 migrations create <migration_name> quizmaker-demo-app-database
```

This will create a new migration file in the `migrations/` directory with a timestamp prefix.

## Migration File Naming Convention

Migration files should follow this naming pattern:
- `0001_<descriptive_name>.sql`
- `0002_<descriptive_name>.sql`
- etc.

The numeric prefix ensures migrations are applied in the correct order.

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login_at INTEGER,
  is_active INTEGER DEFAULT 1
);
```

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_username` on `username`

### Sessions Table

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_sessions_token` on `token`
- `idx_sessions_user_id` on `user_id`
- `idx_sessions_expires_at` on `expires_at`

### Quizzes Table

```sql
CREATE TABLE quizzes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_quizzes_created_by` on `created_by`
- `idx_quizzes_created_at` on `created_at`
- `idx_quizzes_is_active` on `is_active`

### Questions Table

```sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  points INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_questions_quiz_id` on `quiz_id`
- `idx_questions_quiz_order` on `(quiz_id, question_order)`

### Choices Table

```sql
CREATE TABLE choices (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  choice_text TEXT NOT NULL,
  choice_order INTEGER NOT NULL,
  is_correct INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_choices_question_id` on `question_id`
- `idx_choices_question_order` on `(question_id, choice_order)`

### Attempts Table

```sql
CREATE TABLE attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  percentage REAL NOT NULL,
  started_at INTEGER NOT NULL,
  submitted_at INTEGER,
  time_taken_seconds INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_attempts_user_id` on `user_id`
- `idx_attempts_quiz_id` on `quiz_id`
- `idx_attempts_submitted_at` on `submitted_at`

### Attempt Responses Table

```sql
CREATE TABLE attempt_responses (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  choice_id TEXT,
  is_correct INTEGER NOT NULL,
  points_earned INTEGER NOT NULL,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (choice_id) REFERENCES choices(id) ON DELETE SET NULL
);
```

**Indexes:**
- `idx_attempt_responses_attempt_id` on `attempt_id`
- `idx_attempt_responses_question_id` on `question_id`

## Verification

After applying migrations, you can verify the schema:

```bash
# List all tables
npx wrangler d1 execute quizmaker-demo-app-database --local --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Check table schema
npx wrangler d1 execute quizmaker-demo-app-database --local --command "PRAGMA table_info(users);"
npx wrangler d1 execute quizmaker-demo-app-database --local --command "PRAGMA table_info(sessions);"
npx wrangler d1 execute quizmaker-demo-app-database --local --command "PRAGMA table_info(quizzes);"
npx wrangler d1 execute quizmaker-demo-app-database --local --command "PRAGMA table_info(questions);"
npx wrangler d1 execute quizmaker-demo-app-database --local --command "PRAGMA table_info(choices);"
npx wrangler d1 execute quizmaker-demo-app-database --local --command "PRAGMA table_info(attempts);"
npx wrangler d1 execute quizmaker-demo-app-database --local --command "PRAGMA table_info(attempt_responses);"

# Check indexes
npx wrangler d1 execute quizmaker-demo-app-database --local --command "SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name IN ('users', 'sessions', 'quizzes', 'questions', 'choices', 'attempts', 'attempt_responses');"

# Check foreign keys
npx wrangler d1 execute quizmaker-demo-app-database --local --command "PRAGMA foreign_key_list(sessions);"
npx wrangler d1 execute quizmaker-demo-app-database --local --command "PRAGMA foreign_key_list(quizzes);"
npx wrangler d1 execute quizmaker-demo-app-database --local --command "PRAGMA foreign_key_list(questions);"
npx wrangler d1 execute quizmaker-demo-app-database --local --command "PRAGMA foreign_key_list(choices);"
npx wrangler d1 execute quizmaker-demo-app-database --local --command "PRAGMA foreign_key_list(attempts);"
npx wrangler d1 execute quizmaker-demo-app-database --local --command "PRAGMA foreign_key_list(attempt_responses);"
```

## Best Practices

1. **Always test migrations locally first** before applying to remote
2. **Never modify existing migration files** - create new migrations for schema changes
3. **Use transactions** when possible for complex migrations
4. **Document breaking changes** in migration file comments
5. **Backup database** before applying migrations to production
6. **Review migration SQL** carefully before applying

## Troubleshooting

### Migration fails to apply

- Check that previous migrations have been applied
- Verify SQL syntax is correct
- Ensure no conflicting schema changes exist

### Foreign key constraint errors

- Ensure referenced tables exist
- Check that foreign key columns have matching types
- Verify CASCADE behavior is correct

### Index creation fails

- Check for duplicate index names
- Verify column names exist in the table
- Ensure index name follows naming convention

