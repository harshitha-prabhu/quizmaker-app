/**
 * Helper functions for server actions
 * 
 * Provides utilities for accessing database and session in server actions.
 */

import { cookies } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDatabase } from '@/lib/d1-client';
import * as authService from '@/lib/services/auth.service';
import * as sessionService from '@/lib/services/session.service';
import type { SafeUser } from '@/lib/services/auth.service';
import type { D1Database } from '@cloudflare/workers-types';

/**
 * Gets the database instance from the Cloudflare context
 * 
 * Uses getCloudflareContext() from @opennextjs/cloudflare to access
 * Cloudflare bindings (like D1 databases) in server actions.
 * 
 * @returns D1 database instance
 */
export async function getDb(): Promise<D1Database> {
  try {
    // Get Cloudflare context which provides access to bindings
    const { env } = getCloudflareContext();
    
    // Access the D1 database binding from the environment
    const db = getDatabase(env as CloudflareEnv);
    
    // Verify database connection by checking if it's accessible
    if (!db) {
      throw new Error('Database binding is null or undefined');
    }
    
    return db;
  } catch (error) {
    // If getCloudflareContext() fails, try fallback to globalThis.env
    // This might be needed in some edge cases or during development
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof globalThis !== 'undefined' && (globalThis as any).env) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const env = (globalThis as any).env as CloudflareEnv;
      const db = getDatabase(env);
      if (db) {
        return db;
      }
    }
    
    // If both methods fail, throw a descriptive error
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Database access: CloudflareEnv not found in runtime context. ` +
      `Error: ${errorMessage}. ` +
      `Make sure initOpenNextCloudflareForDev() is called in next.config.ts and the dev server is restarted.`
    );
  }
}

/**
 * Gets the current authenticated user from the session
 * 
 * @returns Current user or null if not authenticated
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(
      sessionService.SESSION_CONFIG.COOKIE_NAME
    )?.value;

    if (!token) {
      return null;
    }

    // Get database instance
    const db = await getDb();

    // Validate session
    const session = await sessionService.validateSession(db, token);
    if (!session) {
      return null;
    }

    // Get user
    const user = await authService.getUserById(db, session.userId);
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Gets the session token from cookies
 * 
 * @returns Session token or null
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return (
    cookieStore.get(sessionService.SESSION_CONFIG.COOKIE_NAME)?.value || null
  );
}

