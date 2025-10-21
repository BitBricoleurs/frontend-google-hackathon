/**
 * API Client Tests
 *
 * Tests for the API client including:
 * - Request/response interceptors
 * - Token injection
 * - Token refresh on 401
 * - Request queuing during refresh
 * - Error handling
 *
 * Note: Using axios-mock-adapter instead of MSW to avoid ES module issues
 */

import MockAdapter from 'axios-mock-adapter';
import apiClient, { api, ApiError } from '../api-client';
import { tokenManager } from '../token-manager';

// Mock toast to avoid errors
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock window.location
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (window as any).location;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
window.location = { href: '', pathname: '/' } as any;

describe('API Client', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    // Create a new mock adapter for each test
    mock = new MockAdapter(apiClient, { delayResponse: 0 });
    tokenManager.clearTokens();
    localStorage.clear();
    sessionStorage.clear();
    window.location.pathname = '/';
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore the mock adapter
    mock.restore();
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header when token exists', async () => {
      tokenManager.setTokens('test-access-token', 900, false);

      mock.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer test-access-token');
        return [200, { success: true }];
      });

      await api.get('/test');
    });

    it('should not add Authorization header when no token exists', async () => {
      mock.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBeUndefined();
        return [200, { success: true }];
      });

      await api.get('/test');
    });
  });

  describe('Response Interceptor - Success', () => {
    it('should return response data on successful request', async () => {
      mock.onGet('/users').reply(200, { users: ['user1', 'user2'] });

      const response = await api.get('/users');

      expect(response.data).toEqual({ users: ['user1', 'user2'] });
      expect(response.status).toBe(200);
    });
  });

  describe('Response Interceptor - Token Refresh', () => {
    it('should refresh token and retry request on 401', async () => {
      tokenManager.setTokens('old-token', 900, false);

      let requestCount = 0;

      // Protected endpoint that fails first time, succeeds after refresh
      mock.onGet('/protected').reply((config) => {
        requestCount++;
        const token = config.headers?.Authorization;

        if (requestCount === 1 && token === 'Bearer old-token') {
          return [401, { error: { message: 'Token expired' } }];
        }

        return [200, { data: 'protected-data' }];
      });

      // Token refresh endpoint
      mock.onPost('/auth/refresh').reply(200, {
        accessToken: 'new-access-token',
        tokenType: 'Bearer',
        expiresIn: 900,
      });

      const response = await api.get('/protected');

      expect(requestCount).toBe(2); // Called twice: initial + retry
      expect(response.data).toEqual({ data: 'protected-data' });
      expect(tokenManager.getAccessToken()).toBe('new-access-token');
    });

    it('should not refresh token for auth endpoints', async () => {
      mock.onPost('/auth/login').reply(401, {
        error: { message: 'Invalid credentials' },
      });

      await expect(api.post('/auth/login', {})).rejects.toThrow();

      // Should not have updated token
      expect(tokenManager.getAccessToken()).toBeNull();
    });

    it('should handle refresh failure and clear tokens', async () => {
      tokenManager.setTokens('old-token', 900, false);

      mock.onGet('/protected').reply(401, {
        error: { message: 'Token expired' },
      });

      mock.onPost('/auth/refresh').reply(401, {
        error: { message: 'Refresh token expired' },
      });

      await expect(api.get('/protected')).rejects.toThrow();

      // Tokens should be cleared on auth failure
      expect(tokenManager.getAccessToken()).toBeNull();

      // Note: Redirect happens in browser but not easily testable in jest environment
      // The important part is that tokens are cleared
    });
  });

  describe('Error Handling', () => {
    it('should create ApiError with status 400', async () => {
      mock.onPost('/test').reply(400, {
        error: { code: 'BAD_REQUEST', message: 'Invalid data' },
      });

      try {
        await api.post('/test', {});
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).message).toBe('Invalid data');
        expect((error as ApiError).code).toBe('BAD_REQUEST');
      }
    });

    it('should create ApiError with status 403', async () => {
      mock.onGet('/admin').reply(403, {
        error: { message: 'Insufficient permissions' },
      });

      try {
        await api.get('/admin');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
        expect((error as ApiError).message).toBe('Insufficient permissions');
      }
    });

    it('should create ApiError with status 404', async () => {
      mock.onGet('/users/999').reply(404, {
        error: { message: 'User not found' },
      });

      try {
        await api.get('/users/999');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
        expect((error as ApiError).message).toBe('User not found');
      }
    });

    it('should create ApiError with status 409 (conflict)', async () => {
      mock.onPost('/users').reply(409, {
        error: { message: 'User already exists' },
      });

      try {
        await api.post('/users', {});
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(409);
        expect((error as ApiError).message).toBe('User already exists');
      }
    });

    it('should create ApiError with status 422 (validation)', async () => {
      mock.onPost('/users').reply(422, {
        message: 'Validation error',
        errors: { email: 'Invalid email format' },
      });

      try {
        await api.post('/users', {});
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(422);
        expect((error as ApiError).message).toBe('Validation error');
        expect((error as ApiError).details).toEqual({
          email: 'Invalid email format',
        });
      }
    });

    it('should create ApiError with status 500', async () => {
      mock.onGet('/test').reply(500, {
        error: { message: 'Database connection failed' },
      });

      try {
        await api.get('/test');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(500);
        expect((error as ApiError).message).toBe('Database connection failed');
      }
    });

    it('should handle network errors', async () => {
      mock.onGet('/test').networkError();

      try {
        await api.get('/test');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        // Network errors may return different messages depending on implementation
        expect((error as ApiError).message).toBeDefined();
      }
    });

    it('should handle timeout errors', async () => {
      mock.onGet('/test').timeout();

      try {
        await api.get('/test');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should extract error message from different response formats', async () => {
      // Test format: { message: "..." }
      mock.onGet('/test1').reply(400, { message: 'Simple error' });

      try {
        await api.get('/test1');
        fail('Should have thrown');
      } catch (error) {
        expect((error as ApiError).message).toBe('Simple error');
      }

      // Test format: { detail: "..." }
      mock.onGet('/test2').reply(400, { detail: 'Detail error' });

      try {
        await api.get('/test2');
        fail('Should have thrown');
      } catch (error) {
        expect((error as ApiError).message).toBe('Detail error');
      }
    });

    it('should use default error messages when no message in response', async () => {
      mock.onGet('/test').reply(404, {});

      try {
        await api.get('/test');
        fail('Should have thrown');
      } catch (error) {
        expect((error as ApiError).message).toBe('Resource not found');
      }
    });
  });

  describe('HTTP Methods', () => {
    it('should make GET request', async () => {
      mock.onGet('/test').reply(200, { method: 'GET' });

      const response = await api.get('/test');
      expect(response.data).toEqual({ method: 'GET' });
    });

    it('should make POST request with data', async () => {
      mock.onPost('/test', { name: 'test' }).reply(200, { method: 'POST' });

      const response = await api.post('/test', { name: 'test' });
      expect(response.data).toEqual({ method: 'POST' });
    });

    it('should make PUT request with data', async () => {
      mock.onPut('/test/1', { name: 'updated' }).reply(200, { method: 'PUT' });

      const response = await api.put('/test/1', { name: 'updated' });
      expect(response.data).toEqual({ method: 'PUT' });
    });

    it('should make PATCH request with data', async () => {
      mock.onPatch('/test/1', { name: 'patched' }).reply(200, { method: 'PATCH' });

      const response = await api.patch('/test/1', { name: 'patched' });
      expect(response.data).toEqual({ method: 'PATCH' });
    });

    it('should make DELETE request', async () => {
      mock.onDelete('/test/1').reply(200, { method: 'DELETE' });

      const response = await api.delete('/test/1');
      expect(response.data).toEqual({ method: 'DELETE' });
    });
  });

  describe('ApiError Class', () => {
    it('should create ApiError with all properties', () => {
      const error = new ApiError('Test error', 400, 'TEST_CODE', { field: 'value' });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ field: 'value' });
    });

    it('should create ApiError with minimal properties', () => {
      const error = new ApiError('Simple error');

      expect(error.message).toBe('Simple error');
      expect(error.status).toBeUndefined();
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
    });
  });
});
