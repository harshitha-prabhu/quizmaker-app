# MCQ CRUD Operations - Product Requirements Document

## 1. Overview

This document outlines the requirements for implementing Multiple Choice Question (MCQ) quiz creation, management, taking, scoring, and results tracking in the QuizMaker application. This includes full CRUD operations for quizzes, questions, and choices, as well as quiz attempt tracking and scoring functionality.

## 2. Objectives

- ✅ Enable authenticated users to create, view, edit, and delete MCQ quizzes
- ✅ Support quiz structure with multiple questions and answer choices
- ✅ Provide quiz preview functionality for instructors
- ✅ Implement compact icon-based UI for quiz actions
- ✅ Comprehensive unit test coverage (110 tests)
- 🚧 Allow users to take quizzes and submit answers (Future)
- 🚧 Automatically calculate scores and display results (Future)
- 🚧 Track quiz attempts and performance over time (Future)
- ✅ Provide a Dashboard as the central hub for quiz management and navigation
- ✅ MCQs page fully implemented with quiz listing and actions

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

#### 4.1.2 MCQs Page (`/mcqs`) ✅ **IMPLEMENTED**
- **Current Implementation:** MCQs page is fully functional
  - Page exists and is accessible (no 404 errors)
  - Fetches and displays all active quizzes using `getAllQuizzes` server action
  - Displays quizzes in a responsive card grid layout (1 column mobile, 2 tablet, 3 desktop)
  - Key information displayed for each quiz:
    - Quiz title (with line-clamp for long titles)
    - Description (truncated if long, line-clamp-2)
    - Number of questions (displayed as badge with icon)
    - Created date (formatted as "Month Day, Year")
    - Instructions (if available, truncated)
  - "Create New Quiz" button prominently displayed in header
  - Support empty state when no quizzes exist with helpful messaging
  - Navigation back to Dashboard
  - Authentication required to access
  - **UI Design:**
    - Compact icon-based action buttons (Preview, Edit, Delete)
    - Icons only (no text labels) for space efficiency
    - Hover tooltips for accessibility
    - Only quiz creators see Edit and Delete buttons
    - All users see Preview button
- **Future Enhancements:**
  - Pagination or infinite scroll for large lists
  - Filtering and sorting options
  - Search functionality
  - Creator name display (optional)
  - Total attempts count (optional)

#### 4.1.3 Quiz Actions ✅ **IMPLEMENTED**
- Each quiz card has icon-based action buttons:
  - **Preview** (Eye icon) - Preview quiz as students see it (all users)
  - **Edit** (Pencil icon) - Edit quiz (only for creator)
  - **Delete** (Trash icon) - Delete quiz with confirmation (only for creator)
- Actions are displayed as compact icon buttons side-by-side
- Only relevant actions shown based on user role (ownership check)
- All actions include proper ARIA labels and tooltips for accessibility

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

#### 4.3.2 Preview Mode ✅ **IMPLEMENTED**
- **Preview Page:** `/quizzes/[id]/preview`
- Preview quiz exactly as it will appear to learners
- **Features:**
  - Displays quiz title, description, and instructions
  - Shows all questions in order with their choices
  - **Instructor View:** Correct answers are highlighted in green for instructor reference
  - Visual indicators:
    - Green border and background for correct choices
    - CheckCircle icon for correct answers
    - "Correct Answer" badge on correct choices
    - Circle icon for incorrect choices
  - Question numbering and point values displayed
  - Preview banner indicating preview mode
  - Navigation back to MCQs page
  - Handles empty quizzes gracefully
- **Accessibility:**
  - Proper ARIA labels and semantic HTML
  - Clear visual hierarchy
  - Responsive design

### 4.4 Quiz Editing ✅ **IMPLEMENTED**

#### 4.4.1 Edit Permissions ✅ **IMPLEMENTED**
- Only quiz creator can edit their quizzes
- Ownership validation on server-side
- Non-owners are redirected to MCQs page if they attempt to access edit page
- Edit button only visible to quiz creators on MCQs page

#### 4.4.2 Edit Capabilities ✅ **IMPLEMENTED**
- **Edit Page:** `/quizzes/[id]/edit`
- Pre-filled form with existing quiz data
- Edit quiz metadata (title, description, instructions)
- Add new questions dynamically
- Edit existing questions (text, points, order)
- Delete questions (with validation to maintain at least one)
- Reorder questions (via question_order updates)
- Edit choices for each question
- Add/remove choices (maintains max 4 limit, min 2 limit)
- Change correct answer(s) by toggling isCorrect
- Save changes with full validation
- Redirects to MCQs page on successful update
- Toast notifications for success/error feedback

#### 4.4.3 Edit Validation ✅ **IMPLEMENTED**
- At least one question required (enforced by UpdateQuizSchema)
- Each question must have at least 2 choices (enforced by QuestionSchema)
- Each question must have at least one correct answer (enforced by QuestionSchema)
- Maximum 4 choices per question (enforced by QuestionSchema)
- All validation errors displayed inline with proper ARIA attributes

### 4.5 Quiz Deletion ✅ **IMPLEMENTED**

#### 4.5.1 Deletion Permissions ✅ **IMPLEMENTED**
- Only quiz creator can delete their quizzes
- Ownership validation on server-side
- Delete button only visible to quiz creators on MCQs page
- **Confirmation Dialog:** Required before deletion
  - Shows quiz title in confirmation message
  - Warns that action cannot be undone
  - Mentions that all questions and related data will be permanently deleted
  - Cancel and Delete buttons
  - Loading state during deletion

#### 4.5.2 Deletion Behavior ✅ **IMPLEMENTED**
- **Soft Delete:** Sets `is_active = 0` in database
- Cascade behavior handled by database foreign key constraints
- Related data (questions, choices) remain but are effectively hidden
- Attempts remain linked but quiz is no longer accessible
- **User Experience:**
  - Toast notification on successful deletion
  - Automatic page refresh to show updated quiz list
  - Error handling with user-friendly messages
  - Disabled button state during deletion to prevent double-submission

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

### 7.1 Accessibility & ARIA Compliance Requirements

#### 7.1.1 General Accessibility Standards
- **WCAG 2.1 Level AA Compliance:** All UI components must meet WCAG 2.1 Level AA standards
- **Keyboard Navigation:** All interactive elements must be fully keyboard accessible
- **Screen Reader Support:** Proper ARIA labels, roles, and descriptions for all interactive elements
- **Focus Management:** Clear focus indicators and logical tab order
- **Color Contrast:** Minimum 4.5:1 contrast ratio for text (WCAG AA standard)
- **Semantic HTML:** Use proper HTML5 semantic elements (header, nav, main, section, article, footer)
- **Form Labels:** All form inputs must have associated labels with proper `htmlFor` attributes
- **Error Messages:** Error messages must be associated with form fields using `aria-describedby` and `role="alert"`
- **Loading States:** Loading states must be announced to screen readers using `aria-live` regions
- **Button States:** Disabled buttons must have `aria-disabled="true"` and proper visual indicators

#### 7.1.2 ARIA Attributes Requirements
- **Form Fields:**
  - `aria-invalid="true"` when field has validation errors
  - `aria-describedby` linking to error message IDs
  - `aria-required="true"` for required fields
  - `aria-label` or `aria-labelledby` for fields without visible labels
- **Interactive Elements:**
  - `aria-label` for icon-only buttons
  - `aria-expanded` for collapsible sections
  - `aria-controls` linking controls to their controlled regions
  - `aria-live="polite"` for dynamic content updates
- **Navigation:**
  - `aria-current="page"` for current page in navigation
  - `aria-label` for navigation landmarks
- **Status Messages:**
  - `role="alert"` for important error/success messages
  - `role="status"` for informational messages
  - `aria-live` regions for dynamic content

#### 7.1.3 Keyboard Navigation Requirements
- **Tab Order:** Logical tab order following visual flow
- **Skip Links:** Skip to main content links for keyboard users
- **Keyboard Shortcuts:** Standard shortcuts (Enter to submit, Escape to close dialogs)
- **Focus Trapping:** Modal dialogs must trap focus within the dialog
- **Focus Restoration:** Focus returns to trigger element when dialogs close

### 7.2 Professional UI Design Requirements

#### 7.2.1 Color Scheme & Visual Design
- **Professional Color Palette:**
  - Primary colors: Professional blue tones (e.g., `oklch(0.488 0.243 264.376)` for primary actions)
  - Secondary colors: Neutral grays for backgrounds and borders
  - Accent colors: Subtle accent colors for highlights and emphasis
  - Success: Green tones for positive actions and success states
  - Warning: Amber/yellow tones for warnings
  - Error: Red tones for errors and destructive actions
- **Consistency:** All pages must use consistent color scheme matching login/registration pages
- **Visual Hierarchy:** Clear visual hierarchy using typography, spacing, and color
- **Spacing:** Consistent spacing system (4px, 8px, 16px, 24px, 32px, 48px)
- **Typography:** Professional font stack with proper font sizes and line heights
- **Shadows & Elevation:** Subtle shadows for cards and elevated elements
- **Borders:** Consistent border radius (0.625rem default) and border colors

#### 7.2.2 Component Design Patterns
- **Follow Login/Registration Patterns:** All new components must follow the same design patterns established in login and registration pages
- **Card-based Layout:** Use Card components for content sections
- **Button Styles:** Consistent button variants (primary, secondary, outline, ghost, destructive)
- **Icon-based Actions:** Use compact icon-only buttons for space efficiency
  - Icon buttons use `size="icon"` variant
  - Tooltips on hover for accessibility
  - Proper ARIA labels for screen readers
  - Side-by-side layout for multiple actions
- **Form Design:** Consistent form field styling with proper spacing and labels
- **Loading States:** Professional loading indicators (spinners, skeletons)
- **Empty States:** Well-designed empty states with helpful messaging and clear CTAs
- **Error States:** Clear error messages with actionable guidance

#### 7.2.3 Responsive Design
- **Mobile-First:** Design for mobile devices first, then enhance for larger screens
- **Breakpoints:** Consistent breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- **Touch Targets:** Minimum 44x44px touch targets for mobile
- **Responsive Typography:** Scalable typography that works across screen sizes
- **Flexible Layouts:** Grid and flexbox layouts that adapt to screen size

### 7.3 Dashboard (`/dashboard`)
- **Primary Landing Page:** Central hub for authenticated users
- Welcome section with user's name
- Quick action buttons:
  - "Create New Quiz / MCQ" button
  - Link to MCQs page
  - Account settings link
  - Logout button
- Responsive design (mobile-friendly)
- Loading states with proper ARIA announcements
- Error handling with accessible error messages
- **Note:** Quiz listing will initially be on MCQs page, not Dashboard
- **Accessibility:** Proper heading hierarchy, ARIA landmarks, keyboard navigation

### 7.3.1 MCQs Page (`/mcqs`) - Initial Stub
- Basic page structure with semantic HTML
- Placeholder content: "MCQs page - Coming soon"
- Navigation back to Dashboard with proper ARIA labels
- Authentication required
- Professional styling matching dashboard
- **Accessibility:** Proper page title, heading hierarchy, skip links
- **Future:** Will display full quiz listing with all features

### 7.4 Quiz Creation/Edit Form
- Multi-step or single-page form with clear progress indicators
- Dynamic question/choice addition with accessible controls
- Drag-and-drop reordering (optional, with keyboard alternatives)
- Real-time validation with accessible error messages
- Preview mode with proper ARIA announcements
- Save draft functionality (optional, future)
- Auto-save (optional, future)
- **Accessibility:**
  - All form fields properly labeled
  - Error messages associated with fields using `aria-describedby`
  - Required fields marked with `aria-required="true"`
  - Form validation announced to screen readers
  - Keyboard navigation for all form controls
  - Focus management during dynamic content changes
- **Professional Design:**
  - Clean, organized layout
  - Clear visual hierarchy
  - Consistent spacing and typography
  - Professional color scheme
  - Loading states during submission

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

### 10.1 Unit Tests ✅ **COMPLETED**
- [x] **Quiz Service Tests** (`quiz.service.test.ts` - 23 tests)
  - [x] Quiz creation (success, optional fields, error handling)
  - [x] Quiz retrieval (by ID, all quizzes, by user)
  - [x] Quiz updates (single field, multiple fields, no-op updates)
  - [x] Quiz deletion (soft delete, timestamp updates)
  - [x] Ownership validation (isQuizOwner, quizExists)
- [x] **Question Service Tests** (`question.service.test.ts` - 19 tests)
  - [x] Question CRUD operations
  - [x] Batch operations (createQuestionsBatch)
  - [x] Question reordering
  - [x] Default points handling
- [x] **Choice Service Tests** (`choice.service.test.ts` - 19 tests)
  - [x] Choice CRUD operations
  - [x] Batch operations (createChoicesBatch)
  - [x] Boolean to integer conversion (isCorrect)
  - [x] Delete choices by question
- [x] **Attempt Service Tests** (`attempt.service.test.ts` - 11 tests)
  - [x] Scoring calculation algorithm
    - [x] All correct answers
    - [x] All incorrect answers
    - [x] Partial correct answers
    - [x] Unanswered questions
    - [x] Questions with no choices
    - [x] Zero total points edge case
  - [x] Attempt retrieval
  - [x] Response retrieval
- [x] **Validation Schema Tests** (`quiz.schema.test.ts` - 38 tests)
  - [x] ChoiceSchema validation (text length, trimming, boolean values)
  - [x] QuestionSchema validation (text length, points, choices min/max, correct answer requirement)
  - [x] CreateQuizSchema validation (title, description, instructions, questions array)
  - [x] UpdateQuizSchema validation (optional fields, questions optional)
  - [x] Data transformation (trimming, null/undefined handling, defaults)
- **Test Coverage:** 110 unit tests, all passing
- **Testing Best Practices Applied:**
  - All external dependencies mocked
  - Tests run in isolation
  - Both success and error scenarios covered
  - Business logic validation verified
  - Data type conversions tested
  - No placeholder tests

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

#### 3.0 Professional UI & Accessibility Setup
- [ ] Update `globals.css` with professional color scheme
  - [ ] Define professional color palette matching login/registration pages
  - [ ] Ensure WCAG AA contrast ratios (minimum 4.5:1 for text)
  - [ ] Update CSS variables for consistent theming
- [ ] Create accessibility utilities (if needed)
  - [ ] Skip links component
  - [ ] ARIA live region component
  - [ ] Focus trap utilities

#### 3.1 Dashboard Integration
- [x] Update `/app/dashboard/page.tsx` (already created in auth phase)
  - [x] Add "Create New Quiz / MCQ" button
  - [x] Add link to MCQs page (`/mcqs`)
  - [x] Ensure proper authentication check
- [x] Create dashboard components
  - [x] Create `components/dashboard/QuickActions.tsx`
  - [x] Create `components/dashboard/WelcomeSection.tsx`
- [ ] Enhance dashboard with accessibility
  - [ ] Add proper ARIA landmarks
  - [ ] Ensure keyboard navigation
  - [ ] Add skip links
  - [ ] Verify color contrast

#### 3.2 MCQs Page (Initial Stub)
- [x] Create `/app/mcqs/page.tsx` (basic stub exists)
- [ ] Enhance MCQs page with professional UI and accessibility
  - [ ] Improve visual design to match professional standards
  - [ ] Add proper ARIA labels and roles
  - [ ] Ensure keyboard navigation
  - [ ] Add loading states with ARIA announcements
  - [ ] Add error handling with accessible messages
  - [ ] Improve placeholder content design

#### 3.3 Quiz Creation Form
- [ ] Create `/app/quizzes/create/page.tsx`
  - [ ] Build quiz creation form using Shadcn UI components
  - [ ] Follow login/registration page design patterns
  - [ ] Integrate with `createQuiz` server action
  - [ ] Add dynamic question/choice addition
  - [ ] Add comprehensive form validation
  - [ ] Add loading states with ARIA announcements
  - [ ] Implement redirect to Dashboard on success
  - [ ] **Accessibility Requirements:**
    - [ ] All form fields properly labeled with `htmlFor` and `id`
    - [ ] Error messages associated with fields using `aria-describedby`
    - [ ] Required fields marked with `aria-required="true"`
    - [ ] Invalid fields marked with `aria-invalid="true"`
    - [ ] Error messages have `role="alert"`
    - [ ] Keyboard navigation for all controls
    - [ ] Focus management during dynamic content changes
    - [ ] Loading states announced to screen readers
  - [ ] **Professional Design:**
    - [ ] Clean, organized layout matching login/registration pages
    - [ ] Consistent spacing and typography
    - [ ] Professional color scheme
    - [ ] Clear visual hierarchy
- [ ] Create quiz form components
  - [ ] Create `components/quizzes/QuizForm.tsx` with full accessibility
  - [ ] Create `components/quizzes/QuestionForm.tsx` with full accessibility
  - [ ] Create `components/quizzes/ChoiceForm.tsx` with full accessibility
  - [ ] All components must follow login/registration patterns

#### 3.4 Quiz Listing ✅ **COMPLETED**
- [x] Update `/app/mcqs/page.tsx` with full functionality
  - [x] Fetch quizzes using `getAllQuizzes` server action
  - [x] Display quizzes in responsive card grid layout
  - [x] Add icon-based action buttons for each quiz (Preview, Edit, Delete)
  - [x] Add empty state with helpful messaging
  - [x] Add error handling
  - [x] Ownership-based action visibility
  - [x] Compact icon-based UI design
- [x] Create quiz action components
  - [x] Create `components/quizzes/DeleteQuizButton.tsx` with confirmation dialog
  - [x] Icon buttons integrated directly in quiz cards

#### 3.5 Quiz Viewing/Editing ✅ **COMPLETED**
- [x] Create `/app/quizzes/[id]/preview/page.tsx`
  - [x] Fetch quiz data with questions and choices
  - [x] Display quiz details as students see them
  - [x] Highlight correct answers for instructor reference
  - [x] Preview banner indicating preview mode
  - [x] Navigation back to MCQs page
- [x] Create `/app/quizzes/[id]/edit/page.tsx`
  - [x] Fetch quiz data
  - [x] Pre-fill form with existing quiz data
  - [x] Display edit form with all quiz fields
  - [x] Show edit controls for creator only
  - [x] Ownership validation and redirect
- [x] Create quiz edit form component
  - [x] Create `components/quizzes/QuizEditForm.tsx` with full form functionality
  - [x] Reuses same form structure as create form
  - [x] Pre-populated with existing data

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

#### 4.1 Unit Testing ✅ **COMPLETED**
- [x] Write tests for quiz services (`quiz.service.test.ts` - 23 tests)
  - [x] Test quiz creation (success, optional fields, error handling)
  - [x] Test quiz retrieval (by ID, all quizzes, by user, inactive filtering)
  - [x] Test quiz updates (single field, multiple fields, null values, no-op)
  - [x] Test quiz deletion (soft delete, timestamp updates)
  - [x] Test ownership validation (isQuizOwner, quizExists)
- [x] Write tests for question/choice services
  - [x] Test question CRUD operations (`question.service.test.ts` - 19 tests)
  - [x] Test choice CRUD operations (`choice.service.test.ts` - 19 tests)
  - [x] Test batch operations (createQuestionsBatch, createChoicesBatch)
  - [x] Test data transformations (boolean to integer, default values)
- [x] Write tests for attempt services (`attempt.service.test.ts` - 11 tests)
  - [x] Test scoring calculation (all correct, all incorrect, partial, unanswered, edge cases)
  - [x] Test attempt retrieval (by ID, responses)
  - [x] Test results retrieval
- [x] Write tests for validation schemas (`quiz.schema.test.ts` - 38 tests)
  - [x] Test quiz schema validation (CreateQuizSchema, UpdateQuizSchema)
  - [x] Test question schema validation (text length, points, choices validation)
  - [x] Test choice schema validation (text length, boolean values)
  - [x] Test data transformations (trimming, null/undefined handling, defaults)
- **Total Test Coverage:** 110 unit tests, all passing
- **Testing Standards:** All tests follow vitest-testing.mdc rules
  - External dependencies mocked
  - Tests run in isolation
  - Both success and error scenarios covered
  - Business logic validation verified
  - No placeholder tests

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
  - [x] Update quiz metadata (unit tested)
  - [x] Update questions (unit tested)
  - [x] Update choices (unit tested)
  - [ ] Integration test for full edit flow (form submission to database)
- [ ] Test quiz deletion flow
  - [x] Delete quiz (unit tested - soft delete)
  - [x] Verify cascade behavior (unit tested)
  - [ ] Integration test for full deletion flow (UI confirmation to database)

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

## 14. Implementation Status

### ✅ Completed Features
- Quiz CRUD operations (Create, Read, Update, Delete)
- MCQs page with full quiz listing
- Quiz preview functionality for instructors
- Quiz editing with pre-filled forms
- Quiz deletion with confirmation dialog
- Ownership validation and permissions
- Compact icon-based UI design
- Comprehensive unit test coverage (110 tests)
- Responsive card-based layout
- Empty state handling
- Error handling and user feedback

### 🚧 In Progress / Future Features
- Quiz taking interface
- Scoring and results display
- Attempt history tracking
- Performance optimizations (pagination, caching)

## 15. Future Enhancements

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
- Drag-and-drop question reordering
- Quiz duplication/cloning
- Bulk question import

