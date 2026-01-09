/**
 * Authentication Server Actions
 * 
 * Server actions for user registration, login, logout, and session management.
 */

'use server';

import { cookies } from 'next/headers';
import { getDb, getCurrentUser as getCurrentUserService } from './helpers';
import * as authService from '@/lib/services/auth.service';
import * as sessionService from '@/lib/services/session.service';
import { RegisterSchema, LoginSchema } from '@/lib/schemas/auth.schema';
import type { SafeUser } from '@/lib/services/auth.service';
import type { AuthResult } from '@/lib/types/auth.types';

/**
 * Registers a new user and creates a session
 * 
 * @param formData - Registration form data
 * @returns Authentication result
 */
export async function registerUser(
  formData: FormData
): Promise<AuthResult> {
  try {
    // Parse and validate form data
    const rawData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    const validatedData = RegisterSchema.parse(rawData);

    // Get database instance
    const db = await getDb();

    // Check if email already exists
    const emailExists = await authService.emailExists(db, validatedData.email);
    if (emailExists) {
      return {
        success: false,
        error: 'An account with this email already exists',
      };
    }

    // Hash password
    const passwordHash = await authService.hashPassword(validatedData.password);

    // Create user
    const user = await authService.createUser(db, {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      passwordHash,
    });

    // Create session
    const { token, expiresAt } = await sessionService.createSession(
      db,
      user.id,
      false
    );

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(
      sessionService.SESSION_CONFIG.COOKIE_NAME,
      token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(expiresAt * 1000),
      }
    );

    return { success: true, data: user };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Registration failed' };
  }
}

/**
 * Logs in a user and creates a session
 * 
 * @param formData - Login form data
 * @returns Authentication result
 */
export async function loginUser(formData: FormData): Promise<AuthResult> {
  try {
    // Parse and validate form data
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      rememberMe: formData.get('rememberMe') === 'on' || formData.get('rememberMe') === 'true',
    };

    const validatedData = LoginSchema.parse(rawData);

    // Get database instance
    const db = await getDb();

    // Find user by email
    const user = await authService.getUserByEmail(db, validatedData.email);
    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Verify password
    const passwordValid = await authService.verifyPassword(
      validatedData.password,
      user.password_hash
    );

    if (!passwordValid) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Update last login
    await authService.updateLastLogin(db, user.id);

    // Create session
    const { token, expiresAt } = await sessionService.createSession(
      db,
      user.id,
      validatedData.rememberMe
    );

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(
      sessionService.SESSION_CONFIG.COOKIE_NAME,
      token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(expiresAt * 1000),
      }
    );

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safeUser } = user;
    return { success: true, data: safeUser };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Login failed' };
  }
}

/**
 * Logs out the current user and destroys their session
 * 
 * @returns Success status
 */
export async function logoutUser(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(
      sessionService.SESSION_CONFIG.COOKIE_NAME
    )?.value;

    if (token) {
      const db = await getDb();
      await sessionService.deleteSessionByToken(db, token);
    }

    // Clear session cookie
    cookieStore.delete(sessionService.SESSION_CONFIG.COOKIE_NAME);

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
}

/**
 * Gets the current authenticated user
 * 
 * @returns Current user or null
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  return getCurrentUserService();
}

