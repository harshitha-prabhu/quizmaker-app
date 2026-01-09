# MCQ CRUD Operations - Product Requirements Document

## 1. Overview

This document outlines the requirements for implementing Multiple Choice Question (MCQ) quiz creation, management, taking, scoring, and results tracking in the QuizMaker application. This includes full CRUD operations for quizzes, questions, and choices, as well as quiz attempt tracking and scoring functionality.

## 2. Objectives

- Enable authenticated users to create, view, edit, and delete MCQ quizzes
- Support quiz structure with multiple questions and answer choices
- Allow users to take quizzes and submit answers
- Automatically calculate scores and display results
- Track quiz attempts and performance over time
- Provide a Dashboard as the central hub for quiz management and navigation
- Link MCQs page from Dashboard (initially as a stub, to be fully implemented later)

## 3. User Stories

### 3.1 Quiz Creation
- **As a** teacher/creator
- **I want to** create a new MCQ quiz with multiple questions
- **So that** I can assess student knowledge

### 3.2 Quiz Listing
- **As a** user
- **I want to** see all available quizzes on a dashboard
- **So that** I can browse and select quizzes to take

### 3.3 Quiz Editing
- **As a** quiz creator
- **I want to** edit my quizzes and questions
- **So that** I can update content and fix errors

### 3.4 Quiz Deletion
- **As a** quiz creator
- **I want to** delete quizzes I created
- **So that** I can remove outdated or incorrect quizzes

### 3.5 Quiz Taking
- **As a** learner
- **I want to** take a quiz and submit my answers
- **So that** I can test my knowledge and receive feedback

### 3.6 Results Viewing
- **As a** learner
- **I want to** see my quiz results and score
- **So that** I can understand my performance

### 3.7 Performance Tracking
- **As a** learner or teacher
- **I want to** view my attempt history
- **So that** I can track progress over time

## 4. Functional Requirements

### 4.1 Dashboard

**Note:** The Dashboard (`/dashboard`) is the primary landing page after authentication. It serves as the central hub for all user activities.

#### 4.1.1 Dashboard Overview
- **Primary Landing Page:** Users are redirected to Dashboard after successful login or registration
- **Dashboard Features:**
  - Welcome message with user's name
  - Quick access navigation to:
    - Create New Quiz / MCQ (for quiz creators)
    - View MCQs page (link to `/mcqs`)
    - Account settings
    - Logout
  - User progress summary (optional, future)
  - Recent activity (optional, future)

#### 4.1.2 MCQs Page (`/mcqs`)
- **Initial Implementation:** MCQs page will be created as a stub initially
  - Page exists and is accessible (no 404 errors)
  - Basic page structure with placeholder content
  - Navigation back to Dashboard
  - Authentication required to access
- **Future Implementation:** MCQs page will display:
  - List of all available quizzes in a table or card layout
  - Key information for each quiz:
    - Quiz title
    - Description (truncated if long)
    - Number of questions
    - Created date
    - Creator name (optional)
    - Total attempts count (optional)
  - "Create New Quiz / MCQ" button prominently displayed
  - Support empty state when no quizzes exist
  - Pagination or infinite scroll for large lists (future)

#### 4.1.3 Quiz Actions (Future - on MCQs Page)
- Each quiz row/card has an action menu with:
  - **View/Preview** - See quiz details
  - **Take Quiz** - Start quiz attempt
  - **Edit** - Edit quiz (only for creator)
  - **Delete** - Delete quiz (only for creator)
- Action menu only shows relevant options based on user role

### 4.2 Quiz Creation

#### 4.2.1 Quiz Metadata
- **Title** (required, max 200 characters)
- **Description** (optional, max 1000 characters)
- **Instructions** (optional, max 500 characters)

#### 4.2.2 Question Management
- Add multiple questions to a quiz
- Each question includes:
  - **Question Text** (required, max 1000 characters)
  - **Question Order** (auto-incremented, can be reordered)
  - **Points** (optional, default 1 point per question)

#### 4.2.3 Choice Management
- Each question supports up to 4 answer choices
- Each choice includes:
  - **Choice Text** (required, max 500 characters)
  - **Is Correct** (boolean, at least one must be marked correct)
  - **Choice Order** (A, B, C, D or 1, 2, 3, 4)
- Initially support single correct answer per question
- Future: Support multiple correct answers

#### 4.2.4 Creation Flow
1. User clicks "Create New Quiz / MCQ" from Dashboard or MCQs page
2. Form opens with quiz metadata fields
3. User adds questions one by one
4. For each question, user adds choices
5. User marks correct answer(s)
6. User can reorder questions (drag-and-drop or up/down buttons)
7. User can preview quiz before saving
8. On save, quiz is created with all questions and choices
9. User is redirected to Dashboard or quiz detail/edit page

### 4.3 Quiz Viewing/Preview

#### 4.3.1 Quiz Detail View
- Display quiz metadata (title, description, instructions)
- Show all questions with choices
- Display correct answers (for creator) or hide them (for learners)
- Show question count and total points
- Display creation date and creator information

#### 4.3.2 Preview Mode
- Preview quiz as it will appear to learners
- Hide correct answers
- Show "Start Quiz" button

### 4.4 Quiz Editing

#### 4.4.1 Edit Permissions
- Only quiz creator can edit their quizzes
- Other users see read-only view

#### 4.4.2 Edit Capabilities
- Edit quiz metadata (title, description, instructions)
- Add new questions
- Edit existing questions
- Delete questions
- Reorder questions
- Edit choices for each question
- Add/remove choices (maintain max 4 limit)
- Change correct answer(s)
- Save changes with validation

#### 4.4.3 Edit Validation
- At least one question required
- Each question must have at least 2 choices
- Each question must have at least one correct answer
- Maximum 4 choices per question

### 4.5 Quiz Deletion

#### 4.5.1 Deletion Permissions
- Only quiz creator can delete their quizzes
- Confirmation dialog before deletion

#### 4.5.2 Deletion Behavior
- Soft delete (mark as deleted) or hard delete
- If hard delete: Cascade delete all related data:
  - Questions
  - Choices
  - Attempts (or mark as orphaned)
- Show confirmation message
- Redirect to dashboard after deletion

### 4.6 Quiz Taking

#### 4.6.1 Quiz Attempt Flow
1. User clicks "Take Quiz" from dashboard or quiz detail
2. Quiz attempt is initialized (record created in attempts table)
3. Quiz questions are displayed one at a time or all at once
4. User selects answer for each question
5. User can navigate between questions (if multi-page)
6. User can change answers before submission
7. User clicks "Submit Quiz" button
8. Answers are validated (all questions answered, or allow partial)
9. Quiz is automatically graded
10. Results page is displayed

#### 4.6.2 Quiz Display
- Show quiz title and instructions
- Display questions in order
- Show all choices for each question (radio buttons for single answer)
- Allow user to select one answer per question
- Show progress indicator (e.g., "Question 3 of 10")
- Allow navigation between questions (if multi-page)
- Show timer (optional, future feature)

#### 4.6.3 Answer Submission
- Validate that all questions are answered (or allow partial submission)
- Show confirmation dialog before submission
- Disable form after submission to prevent double-submission
- Show loading state during submission

### 4.7 Scoring and Results

#### 4.7.1 Automatic Scoring
- Calculate score immediately upon submission
- For each question:
  - Check if selected answer matches correct answer
  - Award points if correct (default 1 point, or custom points)
  - Mark as correct/incorrect
- Calculate total score: Sum of points earned
- Calculate percentage: (Points earned / Total possible points) × 100
- Determine pass/fail status (optional, if passing threshold set)

#### 4.7.2 Results Display
- Show overall score (points earned / total points)
- Show percentage score
- Display pass/fail status (if applicable)
- Show breakdown by question:
  - Question text
  - User's selected answer
  - Correct answer
  - Points earned for that question
  - Visual indicator (✓ or ✗)
- Show summary statistics:
  - Number of correct answers
  - Number of incorrect answers
  - Total questions
- Display "Retake Quiz" button (if allowed)
- Display "Back to Dashboard" button

#### 4.7.3 Results Storage
- Store attempt record with:
  - User ID
  - Quiz ID
  - Score (points earned)
  - Total points possible
  - Percentage score
  - Timestamp
  - Time taken (if tracked)
- Store individual question responses:
  - Question ID
  - Selected choice ID(s)
  - Is correct
  - Points earned

### 4.8 Attempt History

#### 4.8.1 User Attempt History
- Display all quiz attempts by the current user
- Show for each attempt:
  - Quiz title
  - Date/time of attempt
  - Score (points and percentage)
  - Pass/fail status (if applicable)
  - Link to view detailed results
- Filter by quiz (optional)
- Sort by date (newest first)
- Show attempt number (e.g., "Attempt 1", "Attempt 2")

#### 4.8.2 Quiz Statistics (for Creator)
- View all attempts for quizzes they created
- Show aggregate statistics:
  - Total attempts
  - Average score
  - Highest score
  - Lowest score
  - Pass rate (if applicable)
- Show individual attempt details
- Export data (optional, future)

## 5. Data Model

### 5.1 Quizzes Table

```sql
CREATE TABLE quizzes (
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

CREATE INDEX idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX idx_quizzes_created_at ON quizzes(created_at);
CREATE INDEX idx_quizzes_is_active ON quizzes(is_active);
```

### 5.2 Questions Table

```sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,                     -- UUID or generated ID
  quiz_id TEXT NOT NULL,                   -- Foreign key to quizzes.id
  question_text TEXT NOT NULL,              -- The question text
  question_order INTEGER NOT NULL,          -- Order within quiz (1, 2, 3...)
  points INTEGER DEFAULT 1,                 -- Points for correct answer
  created_at INTEGER NOT NULL,              -- Unix timestamp
  updated_at INTEGER NOT NULL,              -- Unix timestamp
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_questions_quiz_order ON questions(quiz_id, question_order);
```

### 5.3 Choices Table

```sql
CREATE TABLE choices (
  id TEXT PRIMARY KEY,                     -- UUID or generated ID
  question_id TEXT NOT NULL,               -- Foreign key to questions.id
  choice_text TEXT NOT NULL,               -- The choice text
  choice_order INTEGER NOT NULL,           -- Order within question (1, 2, 3, 4)
  is_correct INTEGER DEFAULT 0,            -- 1 = correct, 0 = incorrect
  created_at INTEGER NOT NULL,             -- Unix timestamp
  updated_at INTEGER NOT NULL,             -- Unix timestamp
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE INDEX idx_choices_question_id ON choices(question_id);
CREATE INDEX idx_choices_question_order ON choices(question_id, choice_order);
```

### 5.4 Attempts Table

```sql
CREATE TABLE attempts (
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

CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_quiz_id ON attempts(quiz_id);
CREATE INDEX idx_attempts_submitted_at ON attempts(submitted_at);
```

### 5.5 Attempt Responses Table

```sql
CREATE TABLE attempt_responses (
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

CREATE INDEX idx_attempt_responses_attempt_id ON attempt_responses(attempt_id);
CREATE INDEX idx_attempt_responses_question_id ON attempt_responses(question_id);
```

## 6. Technical Specifications

### 6.1 Server Actions

#### 6.1.1 Quiz CRUD Actions
```typescript
// app/actions/quizzes.ts
'use server'

// Create quiz with questions and choices
export async function createQuiz(data: {
  title: string;
  description?: string;
  instructions?: string;
  questions: Array<{
    questionText: string;
    points?: number;
    choices: Array<{
      choiceText: string;
      isCorrect: boolean;
    }>;
  }>;
}) {
  // Validate input
  // Create quiz
  // Create questions
  // Create choices
  // Return quiz ID
}

// Get all quizzes (for dashboard)
export async function getAllQuizzes() {
  // Fetch all active quizzes
  // Include question count
  // Return list
}

// Get quiz by ID with full details
export async function getQuizById(quizId: string) {
  // Fetch quiz
  // Fetch questions with choices
  // Return complete quiz data
}

// Update quiz
export async function updateQuiz(quizId: string, data: {...}) {
  // Validate ownership
  // Update quiz metadata
  // Update/add/delete questions and choices
  // Return updated quiz
}

// Delete quiz
export async function deleteQuiz(quizId: string) {
  // Validate ownership
  // Delete quiz (cascade to questions, choices, attempts)
  // Return success
}
```

#### 6.1.2 Quiz Attempt Actions
```typescript
// app/actions/attempts.ts
'use server'

// Start quiz attempt
export async function startQuizAttempt(quizId: string) {
  // Create attempt record
  // Return attempt ID
}

// Submit quiz answers
export async function submitQuizAttempt(
  attemptId: string,
  responses: Array<{
    questionId: string;
    choiceId: string;
  }>
) {
  // Validate attempt exists and belongs to user
  // Grade answers
  // Calculate score
  // Save responses
  // Update attempt with score
  // Return results
}

// Get attempt results
export async function getAttemptResults(attemptId: string) {
  // Fetch attempt
  // Fetch responses with question/choice details
  // Return complete results
}

// Get user's attempt history
export async function getUserAttempts(userId: string) {
  // Fetch all attempts for user
  // Include quiz details
  // Return list
}
```

### 6.2 Validation Rules

#### 6.2.1 Quiz Validation
- Title: Required, 1-200 characters
- Description: Optional, max 1000 characters
- Instructions: Optional, max 500 characters
- At least one question required

#### 6.2.2 Question Validation
- Question text: Required, 1-1000 characters
- Points: Optional, default 1, must be positive integer
- At least 2 choices required
- Maximum 4 choices
- At least one correct answer required

#### 6.2.3 Choice Validation
- Choice text: Required, 1-500 characters
- Choice order: Must be unique within question (1-4)
- At least one choice must be marked correct per question

### 6.3 Scoring Algorithm

```typescript
function calculateScore(
  questions: Question[],
  responses: Map<questionId, choiceId>
): {
  score: number;
  totalPoints: number;
  percentage: number;
  questionResults: Array<{
    questionId: string;
    isCorrect: boolean;
    pointsEarned: number;
  }>;
} {
  let score = 0;
  let totalPoints = 0;
  const questionResults = [];

  for (const question of questions) {
    totalPoints += question.points;
    const selectedChoiceId = responses.get(question.id);
    const selectedChoice = question.choices.find(c => c.id === selectedChoiceId);
    
    if (selectedChoice && selectedChoice.isCorrect) {
      score += question.points;
      questionResults.push({
        questionId: question.id,
        isCorrect: true,
        pointsEarned: question.points
      });
    } else {
      questionResults.push({
        questionId: question.id,
        isCorrect: false,
        pointsEarned: 0
      });
    }
  }

  const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

  return { score, totalPoints, percentage, questionResults };
}
```

## 7. UI/UX Requirements

### 7.1 Dashboard (`/dashboard`)
- **Primary Landing Page:** Central hub for authenticated users
- Welcome section with user's name
- Quick action buttons:
  - "Create New Quiz / MCQ" button
  - Link to MCQs page
  - Account settings link
  - Logout button
- Responsive design (mobile-friendly)
- Loading states
- Error handling
- **Note:** Quiz listing will initially be on MCQs page, not Dashboard

### 7.1.1 MCQs Page (`/mcqs`) - Initial Stub
- Basic page structure
- Placeholder content: "MCQs page - Coming soon"
- Navigation back to Dashboard
- Authentication required
- **Future:** Will display full quiz listing with all features

### 7.2 Quiz Creation/Edit Form
- Multi-step or single-page form
- Dynamic question/choice addition
- Drag-and-drop reordering (optional)
- Real-time validation
- Preview mode
- Save draft functionality (optional, future)
- Auto-save (optional, future)

### 7.3 Quiz Taking Interface
- Clean, distraction-free layout
- Clear question numbering
- Progress indicator
- Navigation between questions (if multi-page)
- Review mode before submission
- Confirmation dialog on submit
- Loading states

### 7.4 Results Page
- Clear score display (large, prominent)
- Color-coded results (green for correct, red for incorrect)
- Expandable question breakdown
- Summary statistics
- Action buttons (retake, dashboard)
- Print-friendly layout (optional)

### 7.5 Attempt History
- Table or list view
- Sortable columns
- Filter by quiz
- Link to detailed results
- Statistics summary

## 8. Error Handling

### 8.1 Creation Errors
- Validation errors (display inline)
- Database errors
- Permission errors (not creator)
- Network errors

### 8.2 Attempt Errors
- Quiz not found
- Attempt already submitted
- Invalid question/choice IDs
- Missing answers (if required)

### 8.3 General Errors
- Unauthorized access
- Quiz deleted while taking
- Concurrent modification errors

## 9. Performance Considerations

### 9.1 Database Queries
- Use indexes on foreign keys
- Batch insert questions and choices
- Use transactions for atomic operations
- Optimize queries with JOINs where appropriate

### 9.2 Caching (Future)
- Cache quiz lists
- Cache quiz details
- Invalidate on updates

### 9.3 Pagination
- Paginate quiz lists for large datasets
- Paginate attempt history
- Lazy load question details

## 10. Testing Requirements

### 10.1 Unit Tests
- Scoring algorithm
- Validation functions
- Data transformation logic

### 10.2 Integration Tests
- Quiz creation flow
- Quiz editing flow
- Quiz deletion
- Quiz attempt flow
- Scoring calculation
- Results retrieval

### 10.3 E2E Tests
- Complete quiz creation and taking flow
- Multiple user scenarios
- Concurrent attempts

## 11. Implementation Phases & Todos

### Phase 1: Backend Database Migrations

#### 1.1 Quiz-Related Tables
- [ ] Create migration file for `quizzes` table
  - [ ] Define table structure with all required fields
  - [ ] Add indexes on `created_by`, `created_at`, and `is_active`
  - [ ] Set up foreign key to `users` table with CASCADE delete
- [ ] Create migration file for `questions` table
  - [ ] Define table structure with question fields
  - [ ] Add indexes on `quiz_id` and composite index on `(quiz_id, question_order)`
  - [ ] Set up foreign key to `quizzes` table with CASCADE delete
- [ ] Create migration file for `choices` table
  - [ ] Define table structure with choice fields
  - [ ] Add indexes on `question_id` and composite index on `(question_id, choice_order)`
  - [ ] Set up foreign key to `questions` table with CASCADE delete
- [ ] Create migration file for `attempts` table
  - [ ] Define table structure with attempt fields
  - [ ] Add indexes on `user_id`, `quiz_id`, and `submitted_at`
  - [ ] Set up foreign keys to `users` and `quizzes` tables with CASCADE delete
- [ ] Create migration file for `attempt_responses` table
  - [ ] Define table structure with response fields
  - [ ] Add indexes on `attempt_id` and `question_id`
  - [ ] Set up foreign keys with appropriate CASCADE/SET NULL behavior
- [ ] Test migrations locally using Wrangler
  - [ ] Verify all tables are created correctly
  - [ ] Verify all indexes are created
  - [ ] Verify foreign key constraints work
  - [ ] Test CASCADE delete behavior
- [ ] Document migration commands and process

#### 1.2 Database Utilities (if not already created)
- [ ] Ensure `lib/d1-client.ts` exists with helper functions
- [ ] Add any quiz-specific database utilities if needed
- [ ] Create TypeScript types for quiz-related database operations

### Phase 2: API & Services

#### 2.1 Quiz Services
- [ ] Create `lib/services/quiz.service.ts`
  - [ ] Implement `createQuiz` function
  - [ ] Implement `getQuizById` function
  - [ ] Implement `getAllQuizzes` function
  - [ ] Implement `updateQuiz` function
  - [ ] Implement `deleteQuiz` function
  - [ ] Implement `getQuizWithQuestions` function
  - [ ] Add ownership validation helpers
- [ ] Create `lib/services/question.service.ts`
  - [ ] Implement `createQuestion` function
  - [ ] Implement `updateQuestion` function
  - [ ] Implement `deleteQuestion` function
  - [ ] Implement `reorderQuestions` function
- [ ] Create `lib/services/choice.service.ts`
  - [ ] Implement `createChoice` function
  - [ ] Implement `updateChoice` function
  - [ ] Implement `deleteChoice` function
  - [ ] Implement batch operations for choices
- [ ] Create `lib/services/attempt.service.ts`
  - [ ] Implement `startAttempt` function
  - [ ] Implement `submitAttempt` function
  - [ ] Implement `calculateScore` function
  - [ ] Implement `getAttemptResults` function
  - [ ] Implement `getUserAttempts` function
  - [ ] Implement `getQuizAttempts` function (for creators)

#### 2.2 Server Actions
- [ ] Create `app/actions/quizzes.ts`
  - [ ] Implement `createQuiz` server action
    - [ ] Input validation using Zod schema
    - [ ] Validate user authentication
    - [ ] Create quiz record
    - [ ] Create questions and choices in batch
    - [ ] Return quiz ID or error
  - [ ] Implement `getAllQuizzes` server action
    - [ ] Fetch all active quizzes
    - [ ] Include question count
    - [ ] Return formatted list
  - [ ] Implement `getQuizById` server action
    - [ ] Fetch quiz with questions and choices
    - [ ] Return complete quiz data
  - [ ] Implement `updateQuiz` server action
    - [ ] Validate ownership
    - [ ] Update quiz metadata
    - [ ] Handle question/choice updates
    - [ ] Return updated quiz
  - [ ] Implement `deleteQuiz` server action
    - [ ] Validate ownership
    - [ ] Delete quiz (cascade handled by DB)
    - [ ] Return success/error
- [ ] Create `app/actions/attempts.ts`
  - [ ] Implement `startQuizAttempt` server action
    - [ ] Validate user authentication
    - [ ] Create attempt record
    - [ ] Return attempt ID
  - [ ] Implement `submitQuizAttempt` server action
    - [ ] Validate attempt ownership
    - [ ] Grade answers
    - [ ] Calculate score
    - [ ] Save responses
    - [ ] Return results
  - [ ] Implement `getAttemptResults` server action
    - [ ] Fetch attempt with responses
    - [ ] Return complete results
  - [ ] Implement `getUserAttempts` server action
    - [ ] Fetch user's attempt history
    - [ ] Include quiz details
    - [ ] Return formatted list

#### 2.3 Validation Schemas
- [ ] Create `lib/schemas/quiz.schema.ts`
  - [ ] Define `CreateQuizSchema` with Zod
  - [ ] Define `UpdateQuizSchema` with Zod
  - [ ] Define `QuestionSchema` with Zod
  - [ ] Define `ChoiceSchema` with Zod
  - [ ] Define `SubmitAttemptSchema` with Zod
  - [ ] Export TypeScript types from schemas

#### 2.4 Scoring Algorithm
- [ ] Implement scoring calculation function
  - [ ] Calculate points earned per question
  - [ ] Calculate total score
  - [ ] Calculate percentage
  - [ ] Return detailed results
- [ ] Add unit tests for scoring algorithm

### Phase 3: Frontend UI Development

#### 3.1 Dashboard Integration
- [ ] Update `/app/dashboard/page.tsx` (if not already created in auth phase)
  - [ ] Add "Create New Quiz / MCQ" button
  - [ ] Add link to MCQs page (`/mcqs`)
  - [ ] Ensure proper authentication check
- [ ] Create dashboard components
  - [ ] Create `components/dashboard/QuickActions.tsx`
  - [ ] Update welcome section if needed

#### 3.2 MCQs Page (Initial Stub)
- [ ] Create `/app/mcqs/page.tsx`
  - [ ] Implement authentication check (redirect to login if not authenticated)
  - [ ] Create basic page structure
  - [ ] Add placeholder content: "MCQs page - Coming soon"
  - [ ] Add navigation back to Dashboard
  - [ ] Ensure no 404 errors
  - [ ] Add loading states
  - [ ] Add error handling

#### 3.3 Quiz Creation Form (Future - After Stub)
- [ ] Create `/app/quizzes/create/page.tsx`
  - [ ] Build quiz creation form using Shadcn UI components
  - [ ] Integrate with `createQuiz` server action
  - [ ] Add dynamic question/choice addition
  - [ ] Add form validation
  - [ ] Add loading states
  - [ ] Implement redirect to Dashboard on success
- [ ] Create quiz form components
  - [ ] Create `components/quizzes/QuizForm.tsx`
  - [ ] Create `components/quizzes/QuestionForm.tsx`
  - [ ] Create `components/quizzes/ChoiceForm.tsx`

#### 3.4 Quiz Listing (Future - MCQs Page Full Implementation)
- [ ] Update `/app/mcqs/page.tsx` with full functionality
  - [ ] Fetch quizzes using `getAllQuizzes` server action
  - [ ] Display quizzes in table or card layout
  - [ ] Add action menu for each quiz
  - [ ] Add empty state
  - [ ] Add loading states
  - [ ] Add error handling
- [ ] Create quiz listing components
  - [ ] Create `components/quizzes/QuizList.tsx`
  - [ ] Create `components/quizzes/QuizCard.tsx` or `QuizTableRow.tsx`
  - [ ] Create `components/quizzes/QuizActionsMenu.tsx`

#### 3.5 Quiz Viewing/Editing (Future)
- [ ] Create `/app/quizzes/[id]/page.tsx`
  - [ ] Fetch quiz data
  - [ ] Display quiz details
  - [ ] Show edit controls for creator
  - [ ] Add "Take Quiz" button for learners
- [ ] Create quiz detail components
  - [ ] Create `components/quizzes/QuizDetail.tsx`
  - [ ] Create `components/quizzes/QuestionList.tsx`

#### 3.6 Quiz Taking Interface (Future)
- [ ] Create `/app/quizzes/[id]/take/page.tsx`
  - [ ] Initialize quiz attempt
  - [ ] Display questions and choices
  - [ ] Handle answer selection
  - [ ] Submit quiz attempt
  - [ ] Redirect to results page
- [ ] Create quiz taking components
  - [ ] Create `components/quizzes/QuizTakingForm.tsx`
  - [ ] Create `components/quizzes/QuestionDisplay.tsx`

#### 3.7 Results Display (Future)
- [ ] Create `/app/quizzes/[id]/results/[attemptId]/page.tsx`
  - [ ] Fetch attempt results
  - [ ] Display score and percentage
  - [ ] Show question-by-question breakdown
  - [ ] Add "Retake Quiz" button
  - [ ] Add "Back to Dashboard" button
- [ ] Create results components
  - [ ] Create `components/quizzes/ResultsDisplay.tsx`
  - [ ] Create `components/quizzes/QuestionResult.tsx`

### Phase 4: Testing & Deployment

#### 4.1 Unit Testing
- [ ] Write tests for quiz services
  - [ ] Test quiz creation
  - [ ] Test quiz retrieval
  - [ ] Test quiz updates
  - [ ] Test quiz deletion
  - [ ] Test ownership validation
- [ ] Write tests for question/choice services
  - [ ] Test question CRUD operations
  - [ ] Test choice CRUD operations
  - [ ] Test batch operations
- [ ] Write tests for attempt services
  - [ ] Test attempt creation
  - [ ] Test scoring calculation
  - [ ] Test results retrieval
- [ ] Write tests for validation schemas
  - [ ] Test quiz schema validation
  - [ ] Test question schema validation
  - [ ] Test choice schema validation

#### 4.2 Integration Testing
- [ ] Test complete quiz creation flow
  - [ ] Form submission
  - [ ] Database record creation
  - [ ] Questions and choices creation
  - [ ] Redirect to Dashboard
- [ ] Test quiz listing flow
  - [ ] Fetch quizzes
  - [ ] Display in UI
  - [ ] Handle empty state
- [ ] Test quiz taking flow
  - [ ] Start attempt
  - [ ] Submit answers
  - [ ] Calculate score
  - [ ] Display results
- [ ] Test quiz editing flow
  - [ ] Update quiz metadata
  - [ ] Update questions
  - [ ] Update choices
- [ ] Test quiz deletion flow
  - [ ] Delete quiz
  - [ ] Verify cascade deletion

#### 4.3 E2E Testing
- [ ] Test complete quiz creation and taking flow
- [ ] Test multiple user scenarios
- [ ] Test concurrent attempts
- [ ] Test ownership validation

#### 4.4 Deployment Preparation
- [ ] Review all code for production readiness
- [ ] Ensure all database migrations are ready
- [ ] Test database migrations on staging
- [ ] Verify all routes work correctly
- [ ] Test quiz flows in production-like environment
- [ ] Document deployment process

#### 4.5 Deployment
- [ ] Run database migrations on production D1 database
- [ ] Build application (`npm run build`)
- [ ] Deploy to Cloudflare Workers (`npm run deploy`)
- [ ] Verify deployment success
- [ ] Test quiz functionality in production
- [ ] Monitor for errors and issues

### Phase 5: Future Enhancements (Post-MVP)
- Multiple correct answers support
- Question reordering (drag-and-drop)
- Quiz templates
- Quiz duplication
- Bulk question import
- Rich text editor for questions
- Image support in questions/choices
- Time limits
- Random question order
- Question banks
- Adaptive quizzes
- Analytics and reporting
- Export/import quizzes
- Quiz sharing and collaboration

## 12. Dependencies

### 12.1 Required Packages
- `zod` - Validation schemas
- `uuid` - ID generation (or use D1's built-in)
- Form libraries (react-hook-form with shadcn/ui)
- Date formatting libraries (date-fns or similar)

### 12.2 Database
- Cloudflare D1 database
- Migration scripts for all tables
- Foreign key constraints and indexes

## 13. Success Criteria

### Initial Phase (Stub Implementation)
- MCQs page (`/mcqs`) exists and is accessible (no 404 errors)
- MCQs page requires authentication
- MCQs page has navigation back to Dashboard
- Dashboard has link to MCQs page
- All navigation flows work correctly

### Full Implementation (Future)
- Users can create quizzes with multiple questions and choices
- Users can view, edit, and delete their quizzes
- Quiz listing is displayed on MCQs page
- Users can take quizzes and submit answers
- Scores are calculated automatically and accurately
- Results are displayed clearly with breakdown
- Attempt history is tracked and viewable
- All CRUD operations work correctly
- Data integrity is maintained (foreign keys, cascades)
- Performance is acceptable for typical use cases

## 14. Future Enhancements

- Multiple correct answers per question
- Partial credit for answers
- Question types beyond MCQ (true/false, fill-in-blank, etc.)
- Question banks and randomization
- Time limits and timers
- Quiz scheduling and availability windows
- Quiz analytics and insights
- Export quiz results to CSV/PDF
- Quiz sharing and collaboration
- Question tagging and categorization
- AI-powered quiz generation (from AGENTS.md)
- Integration with learning management systems

