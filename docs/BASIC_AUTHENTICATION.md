# Basic Authentication - Product Requirements Document

## 1. Overview

This document outlines the requirements for implementing basic authentication functionality in the QuizMaker application. The authentication system will support user registration, login, logout, and session management to ensure only authenticated users can create quizzes or attempt quizzes.

## 2. Objectives

- Enable new users to register and create accounts
- Allow existing users to log in securely
- Implement session-based authentication
- Protect routes and features that require authentication
- Provide a foundation for future authentication enhancements (OAuth, SSO, etc.)

## 3. User Stories

### 3.1 Registration
- **As a** new user
- **I want to** create an account with my personal information
- **So that** I can access the quiz creation and taking features

### 3.2 Login
- **As an** existing user
- **I want to** log in with my credentials
- **So that** I can access my dashboard and quizzes

### 3.3 Logout
- **As an** authenticated user
- **I want to** log out of my account
- **So that** I can securely end my session

### 3.4 Access Control
- **As an** unauthenticated user
- **I should be** redirected to login when trying to access protected features
- **So that** only authorized users can create or take quizzes

## 4. Functional Requirements

### 4.1 User Registration

#### 4.1.1 Registration Form
- **Fields Required:**
  - First Name (text input, required)
  - Last Name (text input, required)
  - Username or Email (text input, required, unique)
  - Password (password input, required)
  - Confirm Password (password input, required)
- **Validation Rules:**
  - First Name: Minimum 2 characters, maximum 50 characters
  - Last Name: Minimum 2 characters, maximum 50 characters
  - Username/Email: Valid email format or unique username (3-30 characters, alphanumeric + underscore)
  - Password: Minimum 8 characters, at least one letter and one number
  - Confirm Password: Must match password field
- **Error Handling:**
  - Display validation errors inline
  - Show error if username/email already exists
  - Prevent duplicate account creation

#### 4.1.2 Registration Process
1. User fills out registration form
2. Client-side validation occurs
3. Form submission triggers server action
4. Server validates input and checks for existing user
5. Password is hashed using secure hashing algorithm (bcrypt or similar)
6. User record is created in database
7. User is automatically logged in and session is created
8. User is redirected to **Dashboard** (`/dashboard`)
9. Success message is displayed

### 4.2 User Login

#### 4.2.1 Login Form
- **Fields Required:**
  - Username or Email (text input, required)
  - Password (password input, required)
  - "Remember Me" checkbox (optional)
- **Validation:**
  - Both fields required
  - Show error for invalid credentials
  - Show error for non-existent user

#### 4.2.2 Login Process
1. User enters credentials
2. Form submission triggers server action
3. Server looks up user by username/email
4. Password is verified against stored hash
5. If valid, session is created
6. Session token/cookie is set
7. User is redirected to **Dashboard** (`/dashboard`)
8. If invalid, error message is displayed

### 4.3 Session Management

#### 4.3.1 Session Creation
- Generate secure session token (UUID or JWT)
- Store session in database with:
  - User ID
  - Session token
  - Expiration timestamp
  - Created timestamp
- Set HTTP-only cookie with session token
- Session expiration: 24 hours (configurable)
- "Remember Me" extends session to 30 days

#### 4.3.2 Session Validation
- Middleware checks for valid session on protected routes
- Verify session token exists and is not expired
- Verify user still exists and is active
- Refresh session expiration on activity (optional)

#### 4.3.3 Session Termination
- Logout action invalidates session in database
- Clear session cookie
- Redirect to login page

### 4.4 Logout

#### 4.4.1 Logout Functionality
- Logout button/action available in navigation
- Server action invalidates current session
- Clears session cookie
- Redirects to home/login page
- Success message displayed

## 5. Data Model

### 5.1 Users Table

```sql
CREATE TABLE users (
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### 5.2 Sessions Table

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,                     -- Session ID (UUID)
  user_id TEXT NOT NULL,                   -- Foreign key to users.id
  token TEXT UNIQUE NOT NULL,              -- Session token
  expires_at INTEGER NOT NULL,             -- Expiration timestamp
  created_at INTEGER NOT NULL,             -- Creation timestamp
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

## 6. Technical Specifications

### 6.1 Password Security

- **Hashing Algorithm:** Use bcrypt or Argon2
- **Salt Rounds:** Minimum 10 rounds for bcrypt
- **Password Storage:** Never store plain text passwords
- **Password Reset:** Not in initial version (future enhancement)

### 6.2 Session Security

- **Token Generation:** Cryptographically secure random token (UUID v4 or similar)
- **Cookie Settings:**
  - HttpOnly: true (prevent XSS)
  - Secure: true (HTTPS only in production)
  - SameSite: Lax or Strict
  - Path: /
- **Session Storage:** Database-backed sessions for security and scalability

### 6.3 Authentication Middleware

- **Protected Routes:** All routes except `/`, `/login`, `/register` require authentication
  - Protected routes include: `/dashboard`, `/mcqs`, `/quizzes/*`, and all other authenticated features
- **Redirect Logic:** 
  - Unauthenticated users attempting to access protected routes are redirected to `/login` with return URL
  - After successful login/registration, users are redirected to `/dashboard`
- **Route Protection:** Implement middleware at Next.js middleware level or route handlers

### 6.4 API/Server Actions

#### 6.4.1 Registration Server Action
```typescript
// app/actions/auth.ts
'use server'

export async function registerUser(formData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  // Validation
  // Check existing user
  // Hash password
  // Create user
  // Create session
  // Return success/error
}
```

#### 6.4.2 Login Server Action
```typescript
// app/actions/auth.ts
'use server'

export async function loginUser(credentials: {
  email: string;
  password: string;
  rememberMe?: boolean;
}) {
  // Find user
  // Verify password
  // Create session
  // Set cookie
  // Return success/error
}
```

#### 6.4.3 Logout Server Action
```typescript
// app/actions/auth.ts
'use server'

export async function logoutUser() {
  // Get session from cookie
  // Delete session from database
  // Clear cookie
  // Return success
}
```

#### 6.4.4 Get Current User
```typescript
// app/actions/auth.ts
'use server'

export async function getCurrentUser() {
  // Get session from cookie
  // Verify session
  // Return user data or null
}
```

## 7. UI/UX Requirements

### 7.1 Registration Page (`/register`)
- Clean, accessible form layout
- Real-time validation feedback
- Clear error messages
- Link to login page for existing users
- Loading state during submission
- Success state with redirect

### 7.2 Login Page (`/login`)
- Simple, focused login form
- Link to registration page for new users
- "Forgot Password" link (placeholder for future)
- Remember Me checkbox
- Loading state during submission
- Error messages for invalid credentials

### 7.3 Dashboard (`/dashboard`)
- **Primary Landing Page:** Dashboard is the first page users see after successful login or registration
- **Dashboard Features:**
  - Welcome message with user's name
  - Quick access to available quizzes
  - "Create New Quiz / MCQ" button (for quiz creators/admins)
  - Link to MCQs page (stub initially, will display quiz list later)
  - Account settings link
  - Logout button
  - User progress summary (optional, future)
- **Navigation:** Dashboard serves as the central hub for all authenticated activities

### 7.4 Navigation
- Show user's name when authenticated
- Logout button in navigation
- Hide login/register links when authenticated
- Show login/register links when not authenticated
- Dashboard link prominently displayed when authenticated

### 7.5 Protected Route Behavior
- Show loading state while checking authentication
- Smooth redirect to login with return URL
- After login, redirect to Dashboard (or preserved destination if applicable)
- Dashboard is always accessible to authenticated users

## 8. Error Handling

### 8.1 Registration Errors
- Email/username already exists
- Password validation failures
- Network/server errors
- Database errors

### 8.2 Login Errors
- Invalid credentials
- User not found
- Account inactive (future)
- Session creation failures

### 8.3 Session Errors
- Expired session
- Invalid session token
- User deleted/deactivated
- Database connection errors

## 9. Security Considerations

### 9.1 Password Security
- Never log passwords
- Use secure hashing algorithms
- Enforce password complexity rules
- Consider rate limiting on login attempts (future)

### 9.2 Session Security
- Use secure, random session tokens
- Implement session expiration
- Support session invalidation on logout
- Consider CSRF protection (Next.js built-in)

### 9.3 Data Protection
- Sanitize all user inputs
- Use parameterized queries (D1 prepared statements)
- Validate data types and formats
- Protect against SQL injection

## 10. Testing Requirements

### 10.1 Unit Tests
- Password hashing and verification
- Session token generation
- Input validation functions
- User creation logic

### 10.2 Integration Tests
- Registration flow end-to-end
- Login flow end-to-end
- Logout flow
- Session validation
- Protected route access

### 10.3 Security Tests
- Password strength validation
- Session expiration
- Invalid credential handling
- SQL injection prevention

## 11. Implementation Phases & Todos

### Phase 1: Backend Database Migrations

#### 1.1 Setup Database Schema
- [ ] Create migration file for `users` table
  - [ ] Define table structure with all required fields
  - [ ] Add indexes on `email` and `username`
  - [ ] Set up foreign key constraints
- [ ] Create migration file for `sessions` table
  - [ ] Define table structure with session fields
  - [ ] Add indexes on `token`, `user_id`, and `expires_at`
  - [ ] Set up foreign key to `users` table with CASCADE delete
- [ ] Test migrations locally using Wrangler
  - [ ] Verify tables are created correctly
  - [ ] Verify indexes are created
  - [ ] Verify foreign key constraints work
- [ ] Document migration commands and process

#### 1.2 Database Utilities
- [ ] Create `lib/d1-client.ts` with helper functions
  - [ ] Implement `executeQuery` with positional placeholder normalization
  - [ ] Implement `executeQueryFirst` for single-row queries
  - [ ] Implement `executeMutation` for INSERT/UPDATE/DELETE
  - [ ] Implement `executeBatch` for batch operations
  - [ ] Implement `generateId` for UUID generation
  - [ ] Add error handling and fallback mechanisms
- [ ] Create database connection utility
- [ ] Add TypeScript types for database operations

### Phase 2: API & Services

#### 2.1 Authentication Services
- [ ] Create `lib/services/auth.service.ts`
  - [ ] Implement `hashPassword` function using bcrypt
  - [ ] Implement `verifyPassword` function
  - [ ] Implement `createSession` function
  - [ ] Implement `validateSession` function
  - [ ] Implement `deleteSession` function
  - [ ] Implement `getUserByEmail` function
  - [ ] Implement `getUserById` function
  - [ ] Implement `createUser` function
- [ ] Create `lib/services/session.service.ts`
  - [ ] Implement session token generation
  - [ ] Implement session validation logic
  - [ ] Implement session expiration handling
  - [ ] Implement cookie management utilities

#### 2.2 Server Actions
- [ ] Create `app/actions/auth.ts`
  - [ ] Implement `registerUser` server action
    - [ ] Input validation using Zod schema
    - [ ] Check for existing user
    - [ ] Hash password
    - [ ] Create user record
    - [ ] Create session
    - [ ] Set session cookie
    - [ ] Return success/error
  - [ ] Implement `loginUser` server action
    - [ ] Input validation
    - [ ] Find user by email/username
    - [ ] Verify password
    - [ ] Create session
    - [ ] Set session cookie
    - [ ] Update last_login_at
    - [ ] Return success/error
  - [ ] Implement `logoutUser` server action
    - [ ] Get session from cookie
    - [ ] Delete session from database
    - [ ] Clear session cookie
    - [ ] Return success
  - [ ] Implement `getCurrentUser` server action
    - [ ] Get session from cookie
    - [ ] Validate session
    - [ ] Fetch user data
    - [ ] Return user or null
- [ ] Create authentication middleware
  - [ ] Create `middleware.ts` for route protection
  - [ ] Implement session validation in middleware
  - [ ] Implement redirect logic for unauthenticated users
  - [ ] Handle return URL preservation

#### 2.3 Validation Schemas
- [ ] Create `lib/schemas/auth.schema.ts`
  - [ ] Define `RegisterSchema` with Zod
  - [ ] Define `LoginSchema` with Zod
  - [ ] Export TypeScript types from schemas

### Phase 3: Frontend UI Development

#### 3.1 Authentication Pages
- [ ] Create `/app/login/page.tsx`
  - [ ] Build login form using Shadcn UI components
  - [ ] Integrate with `loginUser` server action
  - [ ] Add form validation and error handling
  - [ ] Add loading states
  - [ ] Add "Remember Me" checkbox
  - [ ] Add link to registration page
  - [ ] Implement redirect to Dashboard on success
- [ ] Create `/app/register/page.tsx`
  - [ ] Build registration form using Shadcn UI components
  - [ ] Integrate with `registerUser` server action
  - [ ] Add form validation and error handling
  - [ ] Add loading states
  - [ ] Add link to login page
  - [ ] Implement redirect to Dashboard on success
- [ ] Create authentication form components
  - [ ] Extract reusable form components
  - [ ] Create error message components
  - [ ] Create loading state components

#### 3.2 Dashboard Page
- [ ] Create `/app/dashboard/page.tsx`
  - [ ] Implement authentication check (redirect to login if not authenticated)
  - [ ] Fetch current user data
  - [ ] Create dashboard layout with:
    - [ ] Welcome section with user's name
    - [ ] "Create New Quiz / MCQ" button (links to quiz creation - stub for now)
    - [ ] Link to MCQs page (`/mcqs` - stub for now)
    - [ ] Account settings link (stub for now)
    - [ ] Logout button
  - [ ] Add loading states
  - [ ] Add error handling
- [ ] Create dashboard components
  - [ ] Create `components/dashboard/WelcomeSection.tsx`
  - [ ] Create `components/dashboard/QuickActions.tsx`
  - [ ] Create `components/dashboard/UserProgress.tsx` (optional, future)

#### 3.3 Navigation Components
- [ ] Create `components/navigation/Navbar.tsx`
  - [ ] Show user's name when authenticated
  - [ ] Show logout button when authenticated
  - [ ] Show login/register links when not authenticated
  - [ ] Hide login/register links when authenticated
  - [ ] Add Dashboard link prominently
- [ ] Update root layout to include navigation
- [ ] Add responsive design for mobile

#### 3.4 MCQs Page Stub
- [ ] Create `/app/mcqs/page.tsx`
  - [ ] Implement authentication check
  - [ ] Create basic page structure
  - [ ] Add placeholder content: "MCQs page - Coming soon"
  - [ ] Add navigation back to Dashboard
  - [ ] Ensure no 404 errors when navigating to this page

#### 3.5 Shared Components
- [ ] Create `components/ui` directory structure (if not exists)
- [ ] Ensure all Shadcn UI components are properly installed
- [ ] Create shared loading components
- [ ] Create shared error components

### Phase 4: Testing & Deployment

#### 4.1 Unit Testing
- [ ] Write tests for authentication services
  - [ ] Test password hashing
  - [ ] Test password verification
  - [ ] Test session creation
  - [ ] Test session validation
  - [ ] Test user creation
- [ ] Write tests for server actions
  - [ ] Test `registerUser` action
  - [ ] Test `loginUser` action
  - [ ] Test `logoutUser` action
  - [ ] Test `getCurrentUser` action
- [ ] Write tests for validation schemas
  - [ ] Test registration schema validation
  - [ ] Test login schema validation

#### 4.2 Integration Testing
- [ ] Test complete registration flow
  - [ ] Form submission
  - [ ] Database record creation
  - [ ] Session creation
  - [ ] Redirect to Dashboard
- [ ] Test complete login flow
  - [ ] Form submission
  - [ ] Session creation
  - [ ] Redirect to Dashboard
- [ ] Test logout flow
  - [ ] Session invalidation
  - [ ] Cookie clearing
  - [ ] Redirect to login
- [ ] Test protected route access
  - [ ] Unauthenticated access redirects to login
  - [ ] Authenticated access allows entry
  - [ ] Return URL preservation

#### 4.3 E2E Testing
- [ ] Test user registration end-to-end
- [ ] Test user login end-to-end
- [ ] Test navigation flow: Login → Dashboard → MCQs stub
- [ ] Test logout and re-authentication

#### 4.4 Deployment Preparation
- [ ] Review all code for production readiness
- [ ] Ensure environment variables are configured
- [ ] Test database migrations on staging
- [ ] Verify all routes work correctly
- [ ] Test authentication flows in production-like environment
- [ ] Document deployment process

#### 4.5 Deployment
- [ ] Run database migrations on production D1 database
- [ ] Build application (`npm run build`)
- [ ] Deploy to Cloudflare Workers (`npm run deploy`)
- [ ] Verify deployment success
- [ ] Test authentication flows in production
- [ ] Monitor for errors and issues

### Phase 5: Future Enhancements (Post-MVP)
- Password reset functionality
- Email verification
- Account activation/deactivation
- Rate limiting on login attempts
- Two-factor authentication (2FA)
- OAuth integration (Google, Microsoft)
- Single Sign-On (SSO)
- Role-based access control (RBAC)
- User profile management
- Activity logging

## 12. Dependencies

### 12.1 Required Packages
- `bcrypt` or `bcryptjs` - Password hashing
- `uuid` - Session token generation
- `zod` - Input validation schemas
- `next-auth` (optional, for future OAuth) - Not in initial version

### 12.2 Database
- Cloudflare D1 database
- Migration scripts for users and sessions tables

## 13. Success Criteria

- Users can successfully register new accounts
- Users can log in with valid credentials
- After successful registration/login, users are redirected to **Dashboard** (`/dashboard`)
- Users cannot access protected features without authentication
- Unauthenticated users are redirected to login page
- Sessions persist across page refreshes
- Users can log out and sessions are invalidated
- All passwords are securely hashed
- No plain text passwords stored in database
- Protected routes redirect unauthenticated users
- Dashboard is accessible and functional for authenticated users
- MCQs page stub exists and is accessible (no 404 errors)

## 14. Future Enhancements

- Password reset via email
- Email verification on registration
- Social login (OAuth providers)
- Multi-factor authentication
- Account management page
- User profile editing
- Activity history
- Session management (view/revoke active sessions)
- Remember device functionality
- Account deletion with data cleanup

