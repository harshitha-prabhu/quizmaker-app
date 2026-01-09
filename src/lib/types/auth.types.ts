/**
 * Authentication Types
 * 
 * Type definitions for authentication operations.
 */

import type { SafeUser } from '@/lib/services/auth.service';

/**
 * Error types for authentication
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Result type for authentication operations
 */
export type AuthResult<T = SafeUser> =
  | { success: true; data: T }
  | { success: false; error: string };

