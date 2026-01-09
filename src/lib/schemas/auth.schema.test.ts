/**
 * Unit tests for authentication validation schemas
 */

import { describe, it, expect } from 'vitest';
import { RegisterSchema, LoginSchema } from './auth.schema';

describe('RegisterSchema', () => {
  describe('valid input', () => {
    it('should validate correct registration data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      };

      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe('John');
        expect(result.data.lastName).toBe('Doe');
        expect(result.data.email).toBe('john.doe@example.com');
        expect(result.data.password).toBe('SecurePass123!');
      }
    });

    it('should normalize email to lowercase', () => {
      const data = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'JANE.SMITH@EXAMPLE.COM',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('jane.smith@example.com');
      }
    });
  });

  describe('validation errors', () => {
    it('should reject missing firstName', () => {
      const data = {
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing lastName', () => {
      const data = {
        firstName: 'John',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Short1!',
        confirmPassword: 'Short1!',
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject password without uppercase letter', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'securepass123!',
        confirmPassword: 'securepass123!',
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase letter', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SECUREPASS123!',
        confirmPassword: 'SECUREPASS123!',
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePass!',
        confirmPassword: 'SecurePass!',
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject password without special character', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject mismatched passwords', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'DifferentPass123!',
      };

      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('LoginSchema', () => {
  describe('valid input', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
        rememberMe: false,
      };

      const result = LoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john.doe@example.com');
        expect(result.data.password).toBe('SecurePass123!');
        expect(result.data.rememberMe).toBe(false);
      }
    });

    it('should validate login data with rememberMe true', () => {
      const validData = {
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
        rememberMe: true,
      };

      const result = LoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rememberMe).toBe(true);
      }
    });

    it('should normalize email to lowercase', () => {
      const data = {
        email: 'JOHN.DOE@EXAMPLE.COM',
        password: 'SecurePass123!',
        rememberMe: false,
      };

      const result = LoginSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john.doe@example.com');
      }
    });

    it('should default rememberMe to false when not provided', () => {
      const data = {
        email: 'john@example.com',
        password: 'SecurePass123!',
      };

      const result = LoginSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rememberMe).toBe(false);
      }
    });
  });

  describe('validation errors', () => {
    it('should reject missing email', () => {
      const data = {
        password: 'SecurePass123!',
      };

      const result = LoginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const data = {
        email: 'invalid-email',
        password: 'SecurePass123!',
      };

      const result = LoginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const data = {
        email: 'john@example.com',
      };

      const result = LoginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const data = {
        email: 'john@example.com',
        password: '',
      };

      const result = LoginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

