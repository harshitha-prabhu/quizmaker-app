/**
 * Integration tests for authentication flows
 * 
 * These tests verify that authentication operations work together correctly,
 * including database interactions, session management, and cookie handling.
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

describe('Authentication Integration Tests', () => {
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

  describe('Complete Registration Flow', () => {
    it('should complete full registration flow: validation → user creation → session creation → cookie setting', async () => {
      const formData = new FormData();
      formData.append('firstName', 'John');
      formData.append('lastName', 'Doe');
      formData.append('email', 'john.doe@example.com');
      formData.append('password', 'SecurePass123!');
      formData.append('confirmPassword', 'SecurePass123!');

      // Setup mocks for complete flow
      vi.mocked(authService.emailExists).mockResolvedValue(false);
      vi.mocked(authService.hashPassword).mockResolvedValue('hashed_password_123');
      vi.mocked(authService.createUser).mockResolvedValue(mockUser);
      vi.mocked(sessionService.createSession).mockResolvedValue({
        sessionId: 'session-123',
        token: 'session-token-123',
        expiresAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      });

      const result = await authActions.registerUser(formData);

      // Verify success
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockUser);
      }

      // Verify flow sequence
      expect(authService.emailExists).toHaveBeenCalledWith(mockDb, 'john.doe@example.com');
      expect(authService.hashPassword).toHaveBeenCalledWith('SecurePass123!');
      expect(authService.createUser).toHaveBeenCalled();
      expect(sessionService.createSession).toHaveBeenCalledWith(mockDb, 'user-123', false);
      expect(mockCookies.set).toHaveBeenCalledWith(
        'session_token',
        'session-token-123',
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        })
      );
    });

    it('should prevent duplicate registration', async () => {
      const formData = new FormData();
      formData.append('firstName', 'John');
      formData.append('lastName', 'Doe');
      formData.append('email', 'existing@example.com');
      formData.append('password', 'SecurePass123!');
      formData.append('confirmPassword', 'SecurePass123!');

      vi.mocked(authService.emailExists).mockResolvedValue(true);

      const result = await authActions.registerUser(formData);

      expect(result.success).toBe(false);
      expect(authService.createUser).not.toHaveBeenCalled();
      expect(sessionService.createSession).not.toHaveBeenCalled();
      expect(mockCookies.set).not.toHaveBeenCalled();
    });
  });

  describe('Complete Login Flow', () => {
    it('should complete full login flow: user lookup → password verification → session creation → cookie setting → last login update', async () => {
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

      // Verify success
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockUser);
        expect(result.data.password_hash).toBeUndefined();
      }

      // Verify flow sequence
      expect(authService.getUserByEmail).toHaveBeenCalledWith(mockDb, 'john.doe@example.com');
      expect(authService.verifyPassword).toHaveBeenCalledWith('SecurePass123!', 'hashed_password_123');
      expect(authService.updateLastLogin).toHaveBeenCalledWith(mockDb, 'user-123');
      expect(sessionService.createSession).toHaveBeenCalledWith(mockDb, 'user-123', false);
      expect(mockCookies.set).toHaveBeenCalled();
    });

    it('should fail login with incorrect password', async () => {
      const formData = new FormData();
      formData.append('email', 'john.doe@example.com');
      formData.append('password', 'WrongPassword');

      vi.mocked(authService.getUserByEmail).mockResolvedValue(mockUserWithPassword);
      vi.mocked(authService.verifyPassword).mockResolvedValue(false);

      const result = await authActions.loginUser(formData);

      expect(result.success).toBe(false);
      expect(authService.updateLastLogin).not.toHaveBeenCalled();
      expect(sessionService.createSession).not.toHaveBeenCalled();
      expect(mockCookies.set).not.toHaveBeenCalled();
    });
  });

  describe('Session Management Flow', () => {
    it('should create and validate session after registration', async () => {
      const formData = new FormData();
      formData.append('firstName', 'John');
      formData.append('lastName', 'Doe');
      formData.append('email', 'john.doe@example.com');
      formData.append('password', 'SecurePass123!');
      formData.append('confirmPassword', 'SecurePass123!');

      const sessionToken = 'session-token-123';
      const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

      vi.mocked(authService.emailExists).mockResolvedValue(false);
      vi.mocked(authService.hashPassword).mockResolvedValue('hashed_password_123');
      vi.mocked(authService.createUser).mockResolvedValue(mockUser);
      vi.mocked(sessionService.createSession).mockResolvedValue({
        sessionId: 'session-123',
        token: sessionToken,
        expiresAt,
      });

      // Register user (creates session)
      const registerResult = await authActions.registerUser(formData);
      expect(registerResult.success).toBe(true);

      // Verify session cookie was set
      expect(mockCookies.set).toHaveBeenCalledWith(
        'session_token',
        sessionToken,
        expect.objectContaining({
          expires: new Date(expiresAt * 1000),
        })
      );
    });

    it('should create extended session with rememberMe', async () => {
      const formData = new FormData();
      formData.append('email', 'john.doe@example.com');
      formData.append('password', 'SecurePass123!');
      formData.append('rememberMe', 'on');

      const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days

      vi.mocked(authService.getUserByEmail).mockResolvedValue(mockUserWithPassword);
      vi.mocked(authService.verifyPassword).mockResolvedValue(true);
      vi.mocked(authService.updateLastLogin).mockResolvedValue(undefined);
      vi.mocked(sessionService.createSession).mockResolvedValue({
        sessionId: 'session-123',
        token: 'session-token-123',
        expiresAt,
      });

      const result = await authActions.loginUser(formData);

      expect(result.success).toBe(true);
      expect(sessionService.createSession).toHaveBeenCalledWith(mockDb, 'user-123', true);
      expect(mockCookies.set).toHaveBeenCalledWith(
        'session_token',
        'session-token-123',
        expect.objectContaining({
          expires: new Date(expiresAt * 1000),
        })
      );
    });
  });

  describe('Logout Flow', () => {
    it('should complete logout flow: session deletion → cookie clearing', async () => {
      const sessionToken = 'session-token-123';
      mockCookies.get.mockReturnValue({ value: sessionToken });
      vi.mocked(sessionService.deleteSessionByToken).mockResolvedValue(undefined);

      const result = await authActions.logoutUser();

      expect(result.success).toBe(true);
      expect(sessionService.deleteSessionByToken).toHaveBeenCalledWith(mockDb, sessionToken);
      expect(mockCookies.delete).toHaveBeenCalledWith('session_token');
    });

    it('should handle logout when no session exists', async () => {
      mockCookies.get.mockReturnValue(undefined);

      const result = await authActions.logoutUser();

      expect(result.success).toBe(true);
      expect(sessionService.deleteSessionByToken).not.toHaveBeenCalled();
      expect(mockCookies.delete).toHaveBeenCalledWith('session_token');
    });
  });

  describe('Get Current User Flow', () => {
    it('should retrieve current user after successful login', async () => {
      // First login
      const loginFormData = new FormData();
      loginFormData.append('email', 'john.doe@example.com');
      loginFormData.append('password', 'SecurePass123!');

      vi.mocked(authService.getUserByEmail).mockResolvedValue(mockUserWithPassword);
      vi.mocked(authService.verifyPassword).mockResolvedValue(true);
      vi.mocked(authService.updateLastLogin).mockResolvedValue(undefined);
      vi.mocked(sessionService.createSession).mockResolvedValue({
        sessionId: 'session-123',
        token: 'session-token-123',
        expiresAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      });

      const loginResult = await authActions.loginUser(loginFormData);
      expect(loginResult.success).toBe(true);

      // Then get current user
      vi.mocked(helpers.getCurrentUser).mockResolvedValue(mockUser);
      const currentUser = await authActions.getCurrentUser();

      expect(currentUser).toEqual(mockUser);
    });

    it('should return null when not authenticated', async () => {
      vi.mocked(helpers.getCurrentUser).mockResolvedValue(null);

      const currentUser = await authActions.getCurrentUser();

      expect(currentUser).toBeNull();
    });
  });

  describe('Error Handling in Flows', () => {
    it('should handle database errors during registration gracefully', async () => {
      const formData = new FormData();
      formData.append('firstName', 'John');
      formData.append('lastName', 'Doe');
      formData.append('email', 'john.doe@example.com');
      formData.append('password', 'SecurePass123!');
      formData.append('confirmPassword', 'SecurePass123!');

      vi.mocked(authService.emailExists).mockResolvedValue(false);
      vi.mocked(authService.hashPassword).mockResolvedValue('hashed_password_123');
      vi.mocked(authService.createUser).mockRejectedValue(new Error('Database connection failed'));

      const result = await authActions.registerUser(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Database connection failed');
      }
      expect(sessionService.createSession).not.toHaveBeenCalled();
    });

    it('should handle session creation errors during login gracefully', async () => {
      const formData = new FormData();
      formData.append('email', 'john.doe@example.com');
      formData.append('password', 'SecurePass123!');

      vi.mocked(authService.getUserByEmail).mockResolvedValue(mockUserWithPassword);
      vi.mocked(authService.verifyPassword).mockResolvedValue(true);
      vi.mocked(authService.updateLastLogin).mockResolvedValue(undefined);
      vi.mocked(sessionService.createSession).mockRejectedValue(new Error('Session creation failed'));

      const result = await authActions.loginUser(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Session creation failed');
      }
    });
  });
});

