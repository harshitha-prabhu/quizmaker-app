/**
 * Unit tests for D1 client utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { D1Database, D1Result } from '@cloudflare/workers-types';
import {
  getDatabase,
  generateId,
  executeQuery,
  executeQueryFirst,
  executeMutation,
  executeBatch,
} from './d1-client';
import type { CloudflareEnv } from '../../cloudflare-env';

describe('d1-client', () => {
  describe('getDatabase', () => {
    it('should return the database instance from environment', () => {
      const mockDb = {} as D1Database;
      const mockEnv = {
        quizmaker_demo_app_database: mockDb,
      } as CloudflareEnv;

      const result = getDatabase(mockEnv);

      expect(result).toBe(mockDb);
    });
  });

  describe('generateId', () => {
    it('should generate a UUID when crypto.randomUUID is available', () => {
      const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
      global.crypto = {
        randomUUID: vi.fn(() => mockUUID) as never,
      } as Crypto;

      const result = generateId();

      expect(result).toBe(mockUUID);
      expect(global.crypto.randomUUID).toHaveBeenCalled();
    });

    it('should fallback to timestamp-based ID when crypto is not available', () => {
      const originalCrypto = global.crypto;
      // @ts-expect-error - intentionally removing crypto for test
      delete global.crypto;

      const result = generateId();

      expect(result).toMatch(/^\d+-[a-z0-9]+$/);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(10);

      global.crypto = originalCrypto;
    });
  });

  describe('executeQuery', () => {
    let mockDb: D1Database;
    let mockStmt: any;

    beforeEach(() => {
      mockStmt = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [{ id: 1, name: 'Test' }] }),
      };

      mockDb = {
        prepare: vi.fn().mockReturnValue(mockStmt),
      } as unknown as D1Database;
    });

    it('should execute a query with positional placeholders', async () => {
      const sql = 'SELECT * FROM users WHERE id = ?1 AND name = ?2';
      const params = ['user-123', 'John'];

      const result = await executeQuery(mockDb, sql, params);

      expect(mockDb.prepare).toHaveBeenCalledWith(sql);
      expect(mockStmt.bind).toHaveBeenCalledWith('user-123', 'John');
      expect(mockStmt.all).toHaveBeenCalled();
      expect(result).toEqual([{ id: 1, name: 'Test' }]);
    });

    it('should execute a query with anonymous placeholders and normalize them', async () => {
      const sql = 'SELECT * FROM users WHERE id = ? AND name = ?';
      const params = ['user-123', 'John'];

      const result = await executeQuery(mockDb, sql, params);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT \* FROM users WHERE id = \?1 AND name = \?2/)
      );
      expect(mockStmt.bind).toHaveBeenCalledWith('user-123', 'John');
      expect(result).toEqual([{ id: 1, name: 'Test' }]);
    });

    it('should execute a query without parameters', async () => {
      const sql = 'SELECT * FROM users';

      const result = await executeQuery(mockDb, sql);

      expect(mockDb.prepare).toHaveBeenCalledWith(sql);
      expect(mockStmt.bind).not.toHaveBeenCalled();
      expect(mockStmt.all).toHaveBeenCalled();
      expect(result).toEqual([{ id: 1, name: 'Test' }]);
    });

    it('should return empty array when results are null', async () => {
      mockStmt.all = vi.fn().mockResolvedValue({ results: null });

      const result = await executeQuery(mockDb, 'SELECT * FROM users');

      expect(result).toEqual([]);
    });
  });

  describe('executeQueryFirst', () => {
    let mockDb: D1Database;

    beforeEach(() => {
      mockDb = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({
            results: [{ id: 1, name: 'Test' }],
          }),
        }),
      } as unknown as D1Database;
    });

    it('should return the first result', async () => {
      const result = await executeQueryFirst(mockDb, 'SELECT * FROM users WHERE id = ?1', ['1']);

      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('should return null when no results', async () => {
      const mockDbEmpty = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({ results: [] }),
        }),
      } as unknown as D1Database;

      const result = await executeQueryFirst(mockDbEmpty, 'SELECT * FROM users WHERE id = ?1', ['999']);

      expect(result).toBeNull();
    });
  });

  describe('executeMutation', () => {
    let mockDb: D1Database;
    let mockStmt: any;

    beforeEach(() => {
      mockStmt = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
      };

      mockDb = {
        prepare: vi.fn().mockReturnValue(mockStmt),
      } as unknown as D1Database;
    });

    it('should execute a mutation with parameters', async () => {
      const sql = 'INSERT INTO users (id, name) VALUES (?1, ?2)';
      const params = ['user-123', 'John'];

      const result = await executeMutation(mockDb, sql, params);

      expect(mockDb.prepare).toHaveBeenCalledWith(sql);
      expect(mockStmt.bind).toHaveBeenCalledWith('user-123', 'John');
      expect(mockStmt.run).toHaveBeenCalled();
      expect(result.meta.changes).toBe(1);
    });

    it('should execute a mutation without parameters', async () => {
      const sql = 'DELETE FROM sessions WHERE expires_at < ?1';
      const params = [1234567890];

      await executeMutation(mockDb, sql, params);

      expect(mockStmt.bind).toHaveBeenCalledWith(1234567890);
      expect(mockStmt.run).toHaveBeenCalled();
    });
  });

  describe('executeBatch', () => {
    let mockDb: D1Database;
    let mockStmt1: any;
    let mockStmt2: any;

    beforeEach(() => {
      mockStmt1 = {
        bind: vi.fn().mockReturnThis(),
      };
      mockStmt2 = {
        bind: vi.fn().mockReturnThis(),
      };

      mockDb = {
        prepare: vi.fn()
          .mockReturnValueOnce(mockStmt1)
          .mockReturnValueOnce(mockStmt2),
        batch: vi.fn().mockResolvedValue([
          { meta: { changes: 1 } },
          { meta: { changes: 1 } },
        ]),
      } as unknown as D1Database;
    });

    it('should execute a batch of queries', async () => {
      const queries = [
        { sql: 'INSERT INTO users (id, name) VALUES (?1, ?2)', params: ['user-1', 'John'] },
        { sql: 'INSERT INTO users (id, name) VALUES (?1, ?2)', params: ['user-2', 'Jane'] },
      ];

      const result = await executeBatch(mockDb, queries);

      expect(mockDb.prepare).toHaveBeenCalledTimes(2);
      expect(mockStmt1.bind).toHaveBeenCalledWith('user-1', 'John');
      expect(mockStmt2.bind).toHaveBeenCalledWith('user-2', 'Jane');
      expect(mockDb.batch).toHaveBeenCalledWith([mockStmt1, mockStmt2]);
      expect(result).toHaveLength(2);
      expect(result[0].meta.changes).toBe(1);
      expect(result[1].meta.changes).toBe(1);
    });

    it('should handle queries without parameters', async () => {
      const queries = [
        { sql: 'DELETE FROM sessions WHERE expires_at < ?1', params: [1234567890] },
        { sql: 'DELETE FROM temp_table' },
      ];

      await executeBatch(mockDb, queries);

      expect(mockStmt1.bind).toHaveBeenCalledWith(1234567890);
      expect(mockStmt2.bind).not.toHaveBeenCalled();
    });
  });
});

