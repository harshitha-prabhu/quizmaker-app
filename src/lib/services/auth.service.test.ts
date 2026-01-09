/**
 * Unit tests for authentication service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as authService from './auth.service';
import * as d1Client from '@/lib/d1-client';
import type { D1Database } from '@cloudflare/workers-types';

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock d1-client
vi.mock('@/lib/d1-client', () => ({
  executeQueryFirst: vi.fn(),
  executeMutation: vi.fn(),
  generateId: vi.fn(() => 'mock-id-123'),
}));

import bcrypt from 'bcryptjs';

describe('auth.service', () => {
  let mockDb: D1Database;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {} as D1Database;
  });

  describe('hashPassword', () => {
    it('should hash a password using bcrypt', async () => {
      const password = 'SecurePass123!';
      const hashedPassword = 'hashed_password_123';
      
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);

      const result = await authService.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'SecurePass123!';
      const hash = 'hashed_password_123';
      
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await authService.verifyPassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'WrongPassword';
      const hash = 'hashed_password_123';
      
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await authService.verifyPassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_password_123',
      };

      const mockUser = {
        id: 'mock-id-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password_hash: 'hashed_password_123',
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
        last_login_at: null,
        is_active: 1,
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUser);

      const result = await authService.createUser(mockDb, userData);

      expect(d1Client.generateId).toHaveBeenCalled();
      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          'mock-id-123',
          'John',
          'Doe',
          'john@example.com',
          'hashed_password_123',
        ])
      );
      expect(result.id).toBe('mock-id-123');
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
      expect(result.email).toBe('john@example.com');
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should throw error if user creation fails', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_password_123',
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      await expect(authService.createUser(mockDb, userData)).rejects.toThrow(
        'Failed to create user'
      );
    });
  });

  describe('getUserByEmail', () => {
    it('should retrieve a user by email', async () => {
      const email = 'john@example.com';
      const mockUser = {
        id: 'user-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password_hash: 'hashed_password',
        created_at: 1234567890,
        updated_at: 1234567890,
        last_login_at: null,
        is_active: 1,
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUser);

      const result = await authService.getUserByEmail(mockDb, email);

      expect(d1Client.executeQueryFirst).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('SELECT * FROM users WHERE email'),
        [email.toLowerCase()]
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      const email = 'nonexistent@example.com';

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await authService.getUserByEmail(mockDb, email);

      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should retrieve a user by ID without password hash', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: 'user-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password_hash: 'hashed_password',
        created_at: 1234567890,
        updated_at: 1234567890,
        last_login_at: null,
        is_active: 1,
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUser);

      const result = await authService.getUserById(mockDb, userId);

      expect(d1Client.executeQueryFirst).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('SELECT * FROM users WHERE id'),
        [userId]
      );
      expect(result).not.toHaveProperty('password_hash');
      expect(result?.id).toBe('user-123');
      expect(result?.email).toBe('john@example.com');
    });

    it('should return null if user not found', async () => {
      const userId = 'nonexistent-id';

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await authService.getUserById(mockDb, userId);

      expect(result).toBeNull();
    });
  });

  describe('updateLastLogin', () => {
    it('should update user last login timestamp', async () => {
      const userId = 'user-123';

      vi.mocked(d1Client.executeMutation).mockResolvedValue({} as never);

      await authService.updateLastLogin(mockDb, userId);

      expect(d1Client.executeMutation).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('UPDATE users SET last_login_at'),
        expect.arrayContaining([userId])
      );
    });
  });

  describe('emailExists', () => {
    it('should return true if email exists', async () => {
      const email = 'john@example.com';
      const mockUser = { id: 'user-123' };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUser);

      const result = await authService.emailExists(mockDb, email);

      expect(d1Client.executeQueryFirst).toHaveBeenCalledWith(
        mockDb,
        expect.stringContaining('SELECT id FROM users WHERE email'),
        [email.toLowerCase()]
      );
      expect(result).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      const email = 'nonexistent@example.com';

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await authService.emailExists(mockDb, email);

      expect(result).toBe(false);
    });
  });
});

