/**
 * Session Service
 * 
 * Handles session token generation, validation, expiration, and cookie management.
 */

import { generateId, executeMutation, executeQueryFirst } from '@/lib/d1-client';
import type { D1Database } from '@cloudflare/workers-types';

/**
 * Session configuration constants
 */
export const SESSION_CONFIG = {
  DEFAULT_EXPIRY_HOURS: 24,
  REMEMBER_ME_EXPIRY_DAYS: 30,
  COOKIE_NAME: 'session_token',
} as const;

/**
 * Generates a secure session token using UUID
 */
export function generateSessionToken(): string {
  return generateId();
}

/**
 * Calculates session expiration timestamp
 * 
 * @param rememberMe - If true, extends session to 30 days, otherwise 24 hours
 * @returns Unix timestamp in seconds
 */
export function calculateSessionExpiry(rememberMe: boolean = false): number {
  const now = Math.floor(Date.now() / 1000);
  const expirySeconds = rememberMe
    ? SESSION_CONFIG.REMEMBER_ME_EXPIRY_DAYS * 24 * 60 * 60
    : SESSION_CONFIG.DEFAULT_EXPIRY_HOURS * 60 * 60;
  return now + expirySeconds;
}

/**
 * Checks if a session is expired
 * 
 * @param expiresAt - Session expiration timestamp
 * @returns True if session is expired
 */
export function isSessionExpired(expiresAt: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return expiresAt < now;
}

/**
 * Creates a new session in the database
 * 
 * @param db - D1 database instance
 * @param userId - User ID
 * @param rememberMe - Whether to extend session expiry
 * @returns Session ID and token
 */
export async function createSession(
  db: D1Database,
  userId: string,
  rememberMe: boolean = false
): Promise<{ sessionId: string; token: string; expiresAt: number }> {
  const sessionId = generateId();
  const token = generateSessionToken();
  const expiresAt = calculateSessionExpiry(rememberMe);
  const createdAt = Math.floor(Date.now() / 1000);

  await executeMutation(
    db,
    'INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?1, ?2, ?3, ?4, ?5)',
    [sessionId, userId, token, expiresAt, createdAt]
  );

  return { sessionId, token, expiresAt };
}

/**
 * Validates a session token and returns session data if valid
 * 
 * @param db - D1 database instance
 * @param token - Session token
 * @returns Session data or null if invalid/expired
 */
export async function validateSession(
  db: D1Database,
  token: string
): Promise<{ sessionId: string; userId: string; expiresAt: number } | null> {
  const session = await executeQueryFirst<{ id: string; user_id: string; expires_at: number }>(
    db,
    'SELECT id, user_id, expires_at FROM sessions WHERE token = ?1',
    [token]
  );

  if (!session) {
    return null;
  }

  // Check if session is expired
  if (isSessionExpired(session.expires_at)) {
    // Delete expired session
    await deleteSession(db, session.id);
    return null;
  }

  return {
    sessionId: session.id,
    userId: session.user_id,
    expiresAt: session.expires_at,
  };
}

/**
 * Deletes a session from the database
 * 
 * @param db - D1 database instance
 * @param sessionId - Session ID to delete
 */
export async function deleteSession(
  db: D1Database,
  sessionId: string
): Promise<void> {
  await executeMutation(
    db,
    'DELETE FROM sessions WHERE id = ?1',
    [sessionId]
  );
}

/**
 * Deletes a session by token
 * 
 * @param db - D1 database instance
 * @param token - Session token to delete
 */
export async function deleteSessionByToken(
  db: D1Database,
  token: string
): Promise<void> {
  await executeMutation(
    db,
    'DELETE FROM sessions WHERE token = ?1',
    [token]
  );
}

/**
 * Deletes all sessions for a user (useful for logout from all devices)
 * 
 * @param db - D1 database instance
 * @param userId - User ID
 */
export async function deleteAllUserSessions(
  db: D1Database,
  userId: string
): Promise<void> {
  await executeMutation(
    db,
    'DELETE FROM sessions WHERE user_id = ?1',
    [userId]
  );
}

/**
 * Cleans up expired sessions from the database
 * 
 * @param db - D1 database instance
 * @returns Number of sessions deleted
 */
export async function cleanupExpiredSessions(
  db: D1Database
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const result = await executeMutation(
    db,
    'DELETE FROM sessions WHERE expires_at < ?1',
    [now]
  );
  return result.meta.changes;
}

/**
 * Cookie management utilities
 */

/**
 * Creates a session cookie string
 * 
 * @param token - Session token
 * @param expiresAt - Expiration timestamp
 * @returns Cookie string
 */
export function createSessionCookie(token: string, expiresAt: number): string {
  const expires = new Date(expiresAt * 1000).toUTCString();
  return `${SESSION_CONFIG.COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`;
}

/**
 * Creates a cookie string to clear/delete a session
 * 
 * @returns Cookie string to clear session
 */
export function createClearSessionCookie(): string {
  return `${SESSION_CONFIG.COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Extracts session token from cookie header
 * 
 * @param cookieHeader - Cookie header string
 * @returns Session token or null
 */
export function extractSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const sessionCookie = cookies.find((c) =>
    c.startsWith(`${SESSION_CONFIG.COOKIE_NAME}=`)
  );

  if (!sessionCookie) {
    return null;
  }

  return sessionCookie.split('=')[1] || null;
}

