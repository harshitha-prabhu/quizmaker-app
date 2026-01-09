/**
 * D1 Database Client Utilities
 * 
 * Provides helper functions for interacting with Cloudflare D1 database.
 * Handles parameter binding normalization and provides safe query execution.
 */

import type { D1Database, D1Result } from '@cloudflare/workers-types';

/**
 * Normalizes SQL placeholders from anonymous `?` to positional `?1`, `?2`, etc.
 * This is required to avoid D1 binding errors in local development.
 * 
 * Only normalizes anonymous `?` placeholders. If the SQL already uses
 * positional placeholders (`?1`, `?2`, etc.), it leaves them unchanged.
 */
function normalizePlaceholders(sql: string): string {
  // Check if SQL already uses positional placeholders (like ?1, ?2, etc.)
  // If it does and has no anonymous ? placeholders, return as-is
  const hasPositionalPlaceholders = /\?\d+/.test(sql);
  const hasAnonymousPlaceholders = /\?(?!\d)/.test(sql);
  
  if (hasPositionalPlaceholders && !hasAnonymousPlaceholders) {
    // SQL already uses positional placeholders correctly, return as-is
    return sql;
  }
  
  if (!hasAnonymousPlaceholders) {
    // No placeholders at all, return as-is
    return sql;
  }
  
  // Normalize anonymous ? placeholders to ?1, ?2, etc.
  // We need to find the highest existing positional placeholder number
  // and continue from there
  let maxPlaceholder = 0;
  const positionalMatches = sql.matchAll(/\?(\d+)/g);
  for (const match of positionalMatches) {
    const num = parseInt(match[1], 10);
    if (num > maxPlaceholder) {
      maxPlaceholder = num;
    }
  }
  
  let placeholderIndex = maxPlaceholder + 1;
  return sql.replace(/\?(?!\d)/g, () => `?${placeholderIndex++}`);
}

/**
 * Gets the D1 database instance from the environment.
 * 
 * @param env - Cloudflare environment object
 * @returns D1 database instance
 */
export function getDatabase(env: CloudflareEnv): D1Database {
  return env.quizmaker_demo_app_database;
}

/**
 * Generates a unique ID using crypto.randomUUID().
 * Falls back to a timestamp-based ID if crypto is not available.
 * 
 * @returns A unique identifier string
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Executes a SELECT query and returns all results.
 * 
 * @param db - D1 database instance
 * @param sql - SQL query string with placeholders
 * @param params - Parameters to bind to the query
 * @returns Array of result rows
 */
export async function executeQuery<T = unknown>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const normalizedSql = normalizePlaceholders(sql);
    const stmt = db.prepare(normalizedSql);
    
    // Bind all parameters at once (D1 supports this)
    // If params array is empty, just query without binding
    const result = params.length > 0
      ? await stmt.bind(...params).all<T>()
      : await stmt.all<T>();
    
    return result.results || [];
  } catch (error) {
    const normalizedSql = normalizePlaceholders(sql);
    console.error('Error executing query:', error);
    console.error('Original SQL:', sql);
    console.error('Normalized SQL:', normalizedSql);
    console.error('Params:', params);
    console.error('Params count:', params.length);
    throw error;
  }
}

/**
 * Executes a SELECT query and returns the first result row.
 * Uses `all()` internally and returns the first row for better compatibility.
 * 
 * @param db - D1 database instance
 * @param sql - SQL query string with placeholders
 * @param params - Parameters to bind to the query
 * @returns First result row or null if no results
 */
export async function executeQueryFirst<T = unknown>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const results = await executeQuery<T>(db, sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Executes a mutation query (INSERT, UPDATE, DELETE) and returns the result.
 * 
 * @param db - D1 database instance
 * @param sql - SQL query string with placeholders
 * @param params - Parameters to bind to the query
 * @returns D1Result object with metadata about the operation
 */
export async function executeMutation(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<D1Result> {
  const normalizedSql = normalizePlaceholders(sql);
  try {
    const stmt = db.prepare(normalizedSql);
    
    // Bind all parameters at once (D1 supports this)
    // If params array is empty, just run without binding
    const result = params.length > 0
      ? await stmt.bind(...params).run()
      : await stmt.run();
    
    return result;
  } catch (error) {
    console.error('Error executing mutation:', error);
    console.error('Original SQL:', sql);
    console.error('Normalized SQL:', normalizedSql);
    console.error('Params:', params);
    console.error('Params count:', params.length);
    throw error;
  }
}

/**
 * Executes a batch of queries in a transaction.
 * 
 * @param db - D1 database instance
 * @param queries - Array of query objects with sql and params
 * @returns Array of D1Result objects
 */
export async function executeBatch(
  db: D1Database,
  queries: Array<{ sql: string; params?: unknown[] }>
): Promise<D1Result[]> {
  try {
    const normalizedQueries = queries.map(({ sql, params = [] }) => ({
      sql: normalizePlaceholders(sql),
      params,
    }));

    const stmts = normalizedQueries.map(({ sql, params }) => {
      const stmt = db.prepare(sql);
      return params.length > 0 ? stmt.bind(...params) : stmt;
    });

    const results = await db.batch(stmts);
    return results;
  } catch (error) {
    console.error('Error executing batch:', error);
    console.error('Queries:', queries);
    throw error;
  }
}

// Re-export D1Result type for convenience
export type { D1Result };

