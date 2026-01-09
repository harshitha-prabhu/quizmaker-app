/**
 * Unit tests for authentication server actions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as authActions from './auth';
import * as authService from '@/lib/services/auth.service';
import * as sessionService from '@/lib/services/session.service';
import * as helpers from './helpers';
import type { D1Database } from '@cloudflare/workers-types';
import type { SafeUser } from '@/lib/services/auth.service';

// Mock next/headers
const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookies)),
}));

// Mock @opennextjs/cloudflare
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(),
}));

// Mock helpers
vi.mock('./helpers', () => ({
  getDb: vi.fn(),
  getCurrentUser: vi.fn(),
}));

// Mock services
vi.mock('@/lib/services/auth.service', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  createUser: vi.fn(),
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  emailExists: vi.fn(),
  updateLastLogin: vi.fn(),
}));

vi.mock('@/lib/services/session.service', () => ({
  createSession: vi.fn(),
  validateSession: vi.fn(),
  deleteSessionByToken: vi.fn(),
  SESSION_CONFIG: {
    COOKIE_NAME: 'session_token',
  },
}));

describe('auth server actions', () => {
  let mockDb: D1Database;
  const mockUser: SafeUser = {
    id: 'user-123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000),
    last_login_at: null,
    is_active: 1,
  };

  const mockUserWithPassword = {
    ...mockUser,
    password_hash: 'hashed_password_123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {} as D1Database;
    vi.mocked(helpers.getDb).mockResolvedValue(mockDb);
  });

  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      const formData = new FormData();
      formData.append('firstName', 'John');
      formData.append('lastName', 'Doe');
      formData.append('email', 'john.doe@example.com');
      formData.append('password', 'SecurePass123!');
      formData.append('confirmPassword', 'SecurePass123!');

      vi.mocked(authService.emailExists).mockResolvedValue(false);
      vi.mocked(authService.hashPassword).mockResolvedValue('hashed_password_123');
      vi.mocked(authService.createUser).mockResolvedValue(mockUser);
      vi.mocked(sessionService.createSession).mockResolvedValue({
        sessionId: 'session-123',
        token: 'session-token-123',
        expiresAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      });

      const result = await authActions.registerUser(formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockUser);
      }

      expect(authService.emailExists).toHaveBeenCalledWith(mockDb, 'john.doe@example.com');
      expect(authService.hashPassword).toHaveBeenCalledWith('SecurePass123!');
      expect(authService.createUser).toHaveBeenCalledWith(mockDb, {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        passwordHash: 'hashed_password_123',
      });
      expect(sessionService.createSession).toHaveBeenCalledWith(mockDb, 'user-123', false);
      expect(mockCookies.set).toHaveBeenCalledWith(
        'session_token',
        'session-token-123',
        expect.objectContaining({
          httpOnly: true,
          secure: false, // NODE_ENV is not 'production' in test
          sameSite: 'lax',
          path: '/',
        })
      );
    });

    it('should return error if email already exists', async () => {
      const formData = new FormData();
      formData.append('firstName', 'John');
      formData.append('lastName', 'Doe');
      formData.append('email', 'existing@example.com');
      formData.append('password', 'SecurePass123!');
      formData.append('confirmPassword', 'SecurePass123!');

      vi.mocked(authService.emailExists).mockResolvedValue(true);

      const result = await authActions.registerUser(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('An account with this email already exists');
      }

      expect(authService.createUser).not.toHaveBeenCalled();
      expect(sessionService.createSession).not.toHaveBeenCalled();
    });

    it('should return error for invalid form data', async () => {
      const formData = new FormData();
      formData.append('firstName', 'J'); // Too short
      formData.append('lastName', 'Doe');
      formData.append('email', 'invalid-email');
      formData.append('password', 'weak'); // Too weak
      formData.append('confirmPassword', 'weak');

      const result = await authActions.registerUser(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }

      expect(authService.emailExists).not.toHaveBeenCalled();
      expect(authService.createUser).not.toHaveBeenCalled();
    });

    it('should return error if password confirmation does not match', async () => {
      const formData = new FormData();
      formData.append('firstName', 'John');
      formData.append('lastName', 'Doe');
      formData.append('email', 'john.doe@example.com');
      formData.append('password', 'SecurePass123!');
      formData.append('confirmPassword', 'DifferentPass123!');

      const result = await authActions.registerUser(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }

      expect(authService.emailExists).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const formData = new FormData();
      formData.append('firstName', 'John');
      formData.append('lastName', 'Doe');
      formData.append('email', 'john.doe@example.com');
      formData.append('password', 'SecurePass123!');
      formData.append('confirmPassword', 'SecurePass123!');

      vi.mocked(authService.emailExists).mockResolvedValue(false);
      vi.mocked(authService.hashPassword).mockResolvedValue('hashed_password_123');
      vi.mocked(authService.createUser).mockRejectedValue(new Error('Database error'));

      const result = await authActions.registerUser(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Database error');
      }
    });
  });

  describe('loginUser', () => {
    it('should successfully log in a user', async () => {
      const formData = new FormData();
      formData.append('email', 'john.doe@example.com');
      formData.append('password', 'SecurePass123!');

      vi.mocked(authService.getUserByEmail).mockResolvedValue(mockUserWithPassword);
      vi.mocked(authService.verifyPassword).mockResolvedValue(true);
      vi.mocked(authService.updateLastLogin).mockResolvedValue(undefined);
      vi.mocked(sessionService.createSession).mockResolvedValue({
        sessionId: 'session-123',
        token: 'session-token-123',
        expiresAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      });

      const result = await authActions.loginUser(formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockUser);
        expect(result.data.password_hash).toBeUndefined();
      }

      expect(authService.getUserByEmail).toHaveBeenCalledWith(mockDb, 'john.doe@example.com');
      expect(authService.verifyPassword).toHaveBeenCalledWith('SecurePass123!', 'hashed_password_123');
      expect(authService.updateLastLogin).toHaveBeenCalledWith(mockDb, 'user-123');
      expect(sessionService.createSession).toHaveBeenCalledWith(mockDb, 'user-123', false);
      expect(mockCookies.set).toHaveBeenCalled();
    });

    it('should create extended session when rememberMe is checked', async () => {
      const formData = new FormData();
      formData.append('email', 'john.doe@example.com');
      formData.append('password', 'SecurePass123!');
      formData.append('rememberMe', 'on');

      vi.mocked(authService.getUserByEmail).mockResolvedValue(mockUserWithPassword);
      vi.mocked(authService.verifyPassword).mockResolvedValue(true);
      vi.mocked(authService.updateLastLogin).mockResolvedValue(undefined);
      vi.mocked(sessionService.createSession).mockResolvedValue({
        sessionId: 'session-123',
        token: 'session-token-123',
        expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      });

      const result = await authActions.loginUser(formData);

      expect(result.success).toBe(true);
      expect(sessionService.createSession).toHaveBeenCalledWith(mockDb, 'user-123', true);
    });

    it('should return error for invalid email', async () => {
      const formData = new FormData();
      formData.append('email', 'invalid-email');
      formData.append('password', 'SecurePass123!');

      const result = await authActions.loginUser(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }

      expect(authService.getUserByEmail).not.toHaveBeenCalled();
    });

    it('should return error if user does not exist', async () => {
      const formData = new FormData();
      formData.append('email', 'nonexistent@example.com');
      formData.append('password', 'SecurePass123!');

      vi.mocked(authService.getUserByEmail).mockResolvedValue(null);

      const result = await authActions.loginUser(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid email or password');
      }

      expect(authService.verifyPassword).not.toHaveBeenCalled();
      expect(sessionService.createSession).not.toHaveBeenCalled();
    });

    it('should return error for incorrect password', async () => {
      const formData = new FormData();
      formData.append('email', 'john.doe@example.com');
      formData.append('password', 'WrongPassword');

      vi.mocked(authService.getUserByEmail).mockResolvedValue(mockUserWithPassword);
      vi.mocked(authService.verifyPassword).mockResolvedValue(false);

      const result = await authActions.loginUser(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid email or password');
      }

      expect(sessionService.createSession).not.toHaveBeenCalled();
      expect(mockCookies.set).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const formData = new FormData();
      formData.append('email', 'john.doe@example.com');
      formData.append('password', 'SecurePass123!');

      vi.mocked(authService.getUserByEmail).mockRejectedValue(new Error('Database error'));

      const result = await authActions.loginUser(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Database error');
      }
    });
  });

  describe('logoutUser', () => {
    it('should successfully log out a user', async () => {
      mockCookies.get.mockReturnValue({ value: 'session-token-123' });
      vi.mocked(sessionService.deleteSessionByToken).mockResolvedValue(undefined);

      const result = await authActions.logoutUser();

      expect(result.success).toBe(true);
      expect(mockCookies.get).toHaveBeenCalledWith('session_token');
      expect(sessionService.deleteSessionByToken).toHaveBeenCalledWith(mockDb, 'session-token-123');
      expect(mockCookies.delete).toHaveBeenCalledWith('session_token');
    });

    it('should succeed even if no session token exists', async () => {
      mockCookies.get.mockReturnValue(undefined);

      const result = await authActions.logoutUser();

      expect(result.success).toBe(true);
      expect(sessionService.deleteSessionByToken).not.toHaveBeenCalled();
      expect(mockCookies.delete).toHaveBeenCalledWith('session_token');
    });

    it('should handle errors gracefully', async () => {
      mockCookies.get.mockReturnValue({ value: 'session-token-123' });
      vi.mocked(sessionService.deleteSessionByToken).mockRejectedValue(new Error('Database error'));

      const result = await authActions.logoutUser();

      expect(result.success).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      vi.mocked(helpers.getCurrentUser).mockResolvedValue(mockUser);

      const result = await authActions.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(helpers.getCurrentUser).toHaveBeenCalled();
    });

    it('should return null when not authenticated', async () => {
      vi.mocked(helpers.getCurrentUser).mockResolvedValue(null);

      const result = await authActions.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});

