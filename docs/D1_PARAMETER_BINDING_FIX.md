# D1 Parameter Binding Fix

## Issue

**Error**: `D1_ERROR: Wrong number of parameter bindings for SQL query`

This error occurred when trying to register a new user. The issue was in the parameter binding normalization logic in `d1-client.ts`.

## Root Cause

The `normalizePlaceholders` function was double-normalizing SQL queries that already used positional placeholders (`?1`, `?2`, etc.):

1. SQL queries in `auth.service.ts` and `session.service.ts` already used positional placeholders: `?1`, `?2`, `?3`, etc.
2. The `normalizePlaceholders` function was replacing ALL `?` characters, including those in `?1`, `?2`, etc.
3. This turned `?1` into `?11`, `?2` into `?21`, etc.
4. This created a mismatch between the number of placeholders and the number of parameters being bound.

## Solution

### 1. Fixed `normalizePlaceholders` Function

Updated the function to:
- Detect if SQL already uses positional placeholders (`?1`, `?2`, etc.)
- Skip normalization if positional placeholders are already present
- Only normalize anonymous `?` placeholders
- Handle mixed cases (both positional and anonymous placeholders)

### 2. Improved Parameter Binding

Changed from chained `.bind()` calls to binding all parameters at once:
- **Before**: `stmt.bind(param1).bind(param2).bind(param3)`
- **After**: `stmt.bind(...params)` - binds all parameters in one call

This is the correct approach for D1 when using positional placeholders.

### 3. Updated Session Service Functions

Updated all session service functions to use the helper functions (`executeMutation`, `executeQueryFirst`) instead of direct database access for consistency:
- `createSession` - Now uses `executeMutation`
- `deleteSession` - Now uses `executeMutation`
- `deleteSessionByToken` - Now uses `executeMutation`
- `deleteAllUserSessions` - Now uses `executeMutation`
- `cleanupExpiredSessions` - Now uses `executeMutation`
- `validateSession` - Now uses `executeQueryFirst`

## Changes Made

### `src/lib/d1-client.ts`

1. **Updated `normalizePlaceholders` function**:
   - Checks for existing positional placeholders
   - Only normalizes anonymous `?` placeholders
   - Handles mixed cases correctly

2. **Updated `executeQuery` function**:
   - Changed to bind all parameters at once: `stmt.bind(...params)`
   - Improved error logging

3. **Updated `executeMutation` function**:
   - Changed to bind all parameters at once: `stmt.bind(...params)`
   - Improved error logging

4. **Updated `executeBatch` function**:
   - Changed to bind all parameters at once for each statement

### `src/lib/services/session.service.ts`

- Updated all database operations to use helper functions
- Removed direct database access patterns
- Ensures consistent parameter binding

## Testing

After these changes:
1. ✅ SQL with positional placeholders (`?1`, `?2`) is left unchanged
2. ✅ SQL with anonymous placeholders (`?`) is normalized correctly
3. ✅ Parameters are bound correctly using spread operator
4. ✅ All database operations use consistent helper functions

## Verification

To verify the fix works:
1. Try registering a new user
2. Check that the registration completes successfully
3. Verify that the user is created in the database
4. Verify that the session is created correctly

## Best Practices

1. **Always use positional placeholders** (`?1`, `?2`, etc.) in SQL queries
2. **Use helper functions** (`executeMutation`, `executeQuery`, etc.) instead of direct database access
3. **Bind all parameters at once** using the spread operator: `stmt.bind(...params)`
4. **Let the normalization function handle** any anonymous `?` placeholders automatically

