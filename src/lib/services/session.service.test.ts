/**
 * Unit tests for session service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as sessionService from './session.service';
import * as d1Client from '@/lib/d1-client';
import type { D1Database } from '@cloudflare/workers-types';

// Mock d1-client
vi.mock('@/lib/d1-client', () => ({
  executeQueryFirst: vi.fn(),
  executeMutation: vi.fn(),
  generateId: vi.fn(() => 'mock-session-id'),
}));

describe('session.service', () => {
  let mockDb: D1Database;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {} as D1Database;
    
    // Mock crypto.randomUUID for token generation
    global.crypto = {
      randomUUID: vi.fn(() => 'mock-token-123') as never,
    } as Crypto;
  });

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      const userId = 'user-123';
      const rememberMe = false;

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);

      const result = await sessionService.createSession(mockDb, userId, rememberMe);

      expect(d1Client.generateId).toHaveBeenCalled();
      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('INSERT INTO sessions'),
        expect.arrayContaining([
          'mock-session-id',
          userId,
          expect.any(String), // token
          expect.any(Number), // expiresAt
          expect.any(Number), // createdAt
        ])
      );
      expect(result.sessionId).toBe('mock-session-id');
      expect(result.token).toBeTruthy();
      expect(result.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should create a session with extended expiry when rememberMe is true', async () => {
      const userId = 'user-123';
      const rememberMe = true;

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);

      const result = await sessionService.createSession(mockDb, userId, rememberMe);

      // With rememberMe, expiry should be 30 days
      const expectedExpiry = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      expect(result.expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 10); // Allow 10s tolerance
      expect(result.expiresAt).toBeLessThanOrEqual(expectedExpiry + 10);
    });
  });

  describe('validateSession', () => {
    it('should validate a valid session', async () => {
      const token = 'valid-token-123';
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const mockSession = {
        id: 'session-123',
        user_id: 'user-123',
        expires_at: expiresAt,
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockSession);

      const result = await sessionService.validateSession(mockDb, token);

      expect(d1Client.executeQueryFirst).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('SELECT id, user_id, expires_at FROM sessions'),
        [token]
      );
      expect(result).not.toBeNull();
      expect(result?.sessionId).toBe('session-123');
      expect(result?.userId).toBe('user-123');
      expect(result?.expiresAt).toBe(expiresAt);
    });

    it('should return null for non-existent session', async () => {
      const token = 'invalid-token';

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await sessionService.validateSession(mockDb, token);

      expect(result).toBeNull();
    });

    it('should return null and delete expired session', async () => {
      const token = 'expired-token';
      const expiresAt = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const mockSession = {
        id: 'session-123',
        user_id: 'user-123',
        expires_at: expiresAt,
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockSession);
      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);

      const result = await sessionService.validateSession(mockDb, token);

      expect(result).toBeNull();
      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('DELETE FROM sessions WHERE id'),
        ['session-123']
      );
    });
  });

  describe('deleteSession', () => {
    it('should delete a session by ID', async () => {
      const sessionId = 'session-123';

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);

      await sessionService.deleteSession(mockDb, sessionId);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('DELETE FROM sessions WHERE id'),
        [sessionId]
      );
    });
  });

  describe('deleteSessionByToken', () => {
    it('should delete a session by token', async () => {
      const token = 'token-123';

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);

      await sessionService.deleteSessionByToken(mockDb, token);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('DELETE FROM sessions WHERE token'),
        [token]
      );
    });
  });

  describe('deleteAllUserSessions', () => {
    it('should delete all sessions for a user', async () => {
      const userId = 'user-123';

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);

      await sessionService.deleteAllUserSessions(mockDb, userId);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('DELETE FROM sessions WHERE user_id'),
        [userId]
      );
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete expired sessions and return count', async () => {
      const mockResult = {
        meta: {
          changes: 5,
        },
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue(mockResult as never);

      const result = await sessionService.cleanupExpiredSessions(mockDb);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('DELETE FROM sessions WHERE expires_at'),
        expect.arrayContaining([expect.any(Number)])
      );
      expect(result).toBe(5);
    });
  });

  describe('isSessionExpired', () => {
    it('should return false for future expiry', () => {
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      expect(sessionService.isSessionExpired(expiresAt)).toBe(false);
    });

    it('should return true for past expiry', () => {
      const expiresAt = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      expect(sessionService.isSessionExpired(expiresAt)).toBe(true);
    });
  });

  describe('calculateSessionExpiry', () => {
    it('should calculate standard expiry (24 hours)', () => {
      const rememberMe = false;
      const expiresAt = sessionService.calculateSessionExpiry(rememberMe);
      const expectedExpiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
      
      expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 10);
      expect(expiresAt).toBeLessThanOrEqual(expectedExpiry + 10);
    });

    it('should calculate extended expiry (30 days) when rememberMe is true', () => {
      const rememberMe = true;
      const expiresAt = sessionService.calculateSessionExpiry(rememberMe);
      const expectedExpiry = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      
      expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 10);
      expect(expiresAt).toBeLessThanOrEqual(expectedExpiry + 10);
    });
  });
});

