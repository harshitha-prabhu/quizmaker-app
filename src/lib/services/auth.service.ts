/**
 * Authentication Service
 * 
 * Handles password hashing, verification, and user database operations.
 */

import bcrypt from 'bcryptjs';
import type { D1Database } from '@cloudflare/workers-types';
import {
  executeQueryFirst,
  executeMutation,
  generateId,
} from '@/lib/d1-client';

/**
 * Password hashing configuration
 */
const SALT_ROUNDS = 10;

/**
 * User type definition
 */
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  username: string | null;
  email: string;
  password_hash: string;
  created_at: number;
  updated_at: number;
  last_login_at: number | null;
  is_active: number;
}

/**
 * User data without sensitive information
 */
export interface SafeUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string | null;
  email: string;
  created_at: number;
  updated_at: number;
  last_login_at: number | null;
  is_active: number;
}

/**
 * Hashes a password using bcrypt
 * 
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a password against a hash
 * 
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Creates a new user in the database
 * 
 * @param db - D1 database instance
 * @param userData - User registration data
 * @returns Created user (without password hash)
 */
export async function createUser(
  db: D1Database,
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
  }
): Promise<SafeUser> {
  const userId = generateId();
  const now = Math.floor(Date.now() / 1000);

  await executeMutation(
    db,
    'INSERT INTO users (id, first_name, last_name, email, password_hash, created_at, updated_at, is_active) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)',
    [
      userId,
      userData.firstName,
      userData.lastName,
      userData.email,
      userData.passwordHash,
      now,
      now,
      1, // is_active
    ]
  );

  const user = await getUserById(db, userId);
  if (!user) {
    throw new Error('Failed to create user');
  }

  return user;
}

/**
 * Gets a user by email
 * 
 * @param db - D1 database instance
 * @param email - User email
 * @returns User with password hash or null
 */
export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<User | null> {
  return executeQueryFirst<User>(
    db,
    'SELECT * FROM users WHERE email = ?1 AND is_active = 1',
    [email.toLowerCase()]
  );
}

/**
 * Gets a user by ID
 * 
 * @param db - D1 database instance
 * @param userId - User ID
 * @returns User without password hash or null
 */
export async function getUserById(
  db: D1Database,
  userId: string
): Promise<SafeUser | null> {
  const user = await executeQueryFirst<User>(
    db,
    'SELECT * FROM users WHERE id = ?1 AND is_active = 1',
    [userId]
  );

  if (!user) {
    return null;
  }

  // Remove password hash from returned user
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

/**
 * Updates user's last login timestamp
 * 
 * @param db - D1 database instance
 * @param userId - User ID
 */
export async function updateLastLogin(
  db: D1Database,
  userId: string
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await executeMutation(
    db,
    'UPDATE users SET last_login_at = ?1, updated_at = ?2 WHERE id = ?3',
    [now, now, userId]
  );
}

/**
 * Checks if an email already exists in the database
 * 
 * @param db - D1 database instance
 * @param email - Email to check
 * @returns True if email exists
 */
export async function emailExists(
  db: D1Database,
  email: string
): Promise<boolean> {
  const user = await executeQueryFirst<{ id: string }>(
    db,
    'SELECT id FROM users WHERE email = ?1',
    [email.toLowerCase()]
  );
  return user !== null;
}

