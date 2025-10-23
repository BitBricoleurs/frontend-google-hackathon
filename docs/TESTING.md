# Testing Guide

This document provides comprehensive information about the testing setup for this Next.js frontend application.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Mock Data & Fixtures](#mock-data--fixtures)
- [MSW API Mocking](#msw-api-mocking)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

This project uses **Jest** and **React Testing Library** for testing, with **MSW (Mock Service Worker)** for API mocking. The testing setup is configured to work **without requiring a running backend**, making tests fast, reliable, and suitable for CI/CD environments.

### Key Features:
- ✅ **No backend dependency** - Tests run independently using MSW
- ✅ **Fast execution** - Tests complete in seconds
- ✅ **CI/CD ready** - GitHub Actions compatible
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Comprehensive mocks** - Realistic API responses

## Tech Stack

| Tool | Purpose | Version |
|------|---------|---------|
| Jest | Test runner | 30.x |
| @testing-library/react | Component testing | 16.x |
| @testing-library/user-event | User interaction simulation | 14.x |
| MSW | API mocking | 2.x |
| @swc/jest | Fast TypeScript compilation | 0.2.x |

## Getting Started

All dependencies are already installed. The testing infrastructure includes:

### Configuration Files:
- [`jest.config.js`](./jest.config.js) - Jest configuration
- [`src/test/setup.ts`](./src/test/setup.ts) - Global test setup
- [`src/test/polyfills.ts`](./src/test/polyfills.ts) - Node.js polyfills for browser APIs
- [`src/test/utils.tsx`](./src/test/utils.tsx) - Test utilities and custom render functions

### Mock Infrastructure:
- `src/mocks/handlers/` - MSW request handlers
- `src/mocks/data/` - Mock data fixtures
- `src/mocks/server.ts` - MSW server for Node.js

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (great for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci

# Run specific test file
npm test -- src/lib/__tests__/token-manager.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="TokenManager"
```

### Coverage Thresholds

Currently, coverage thresholds are not enforced, but the recommended targets are:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Test Structure

### Directory Organization

```
src/
├── lib/
│   ├── token-manager.ts
│   └── __tests__/
│       └── token-manager.test.ts      # Co-located with source
├── api/
│   ├── auth.ts
│   └── __tests__/
│       └── auth.test.ts
├── mocks/
│   ├── data/
│   │   ├── auth.fixtures.ts           # Mock data for auth
│   │   ├── users.fixtures.ts          # Mock data for users
│   │   └── queue.fixtures.ts          # Mock data for queue
│   ├── handlers/
│   │   ├── auth.handlers.ts           # MSW handlers for auth API
│   │   ├── users.handlers.ts          # MSW handlers for users API
│   │   ├── queue.handlers.ts          # MSW handlers for queue API
│   │   └── index.ts                   # Combined handlers
│   └── server.ts                      # MSW server setup
└── test/
    ├── polyfills.ts                   # Browser API polyfills
    ├── setup.ts                       # Global test setup
    └── utils.tsx                      # Test helpers
```

### Current Test Coverage

#### ✅ Implemented Tests:
1. **Token Manager** (`src/lib/__tests__/token-manager.test.ts`) - **49 tests**
   - Token storage (localStorage vs sessionStorage)
   - Remember Me functionality
   - Token validation and expiry
   - Token refresh logic
   - Storage switching
   - Error handling

#### 🚧 Planned Tests (Ready to Implement):
2. **API Client** - Token refresh interceptors, error handling
3. **Auth API** - Login, logout, password change
4. **Auth Context** - Complete authentication flow
5. **Users API** - CRUD operations with pagination
6. **Protected Routes** - Access control and redirects

## Writing Tests

### 1. Unit Tests (Utilities/Services)

**Example: Testing a utility function**

```typescript
// src/lib/__tests__/token-manager.test.ts
import { TokenManager } from '../token-manager';

describe('TokenManager', () => {
  let manager: TokenManager;

  beforeEach(() => {
    manager = TokenManager.getInstance();
    manager.clearTokens();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should store tokens in localStorage when rememberMe is true', () => {
    manager.setTokens('test-token', 900, true, 123);

    const stored = localStorage.getItem('auth-tokens');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.accessToken).toBe('test-token');
    expect(parsed.rememberMe).toBe(true);
  });
});
```

### 2. Integration Tests (API Calls with MSW)

**Example: Testing API with mocked responses**

```typescript
// src/api/__tests__/auth.test.ts
import { login } from '../auth';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

describe('Auth API', () => {
  it('should login successfully with valid credentials', async () => {
    const result = await login({
      employeeId: 'ADMIN001',
      password: 'Admin@123',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.user.role).toBe('ADMIN');
  });

  it('should handle login failure', async () => {
    // Override handler for this specific test
    server.use(
      http.post('/api/v1/auth/login', () => {
        return HttpResponse.json(
          { error: { message: 'Invalid credentials' } },
          { status: 401 }
        );
      })
    );

    await expect(
      login({ employeeId: 'WRONG', password: 'wrong' })
    ).rejects.toThrow('Invalid credentials');
  });
});
```

### 3. Component Tests (React Components)

**Example: Testing a React component**

```typescript
// src/components/auth/__tests__/protected-route.test.tsx
import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ProtectedRoute } from '../protected-route';

describe('ProtectedRoute', () => {
  it('should redirect unauthenticated users to login', () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
```

### 4. Testing with User Interactions

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should submit form on button click', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();

  render(<LoginForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText(/employee id/i), 'ADMIN001');
  await user.type(screen.getByLabelText(/password/i), 'password');
  await user.click(screen.getByRole('button', { name: /login/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    employeeId: 'ADMIN001',
    password: 'password',
  });
});
```

## Mock Data & Fixtures

### Authentication Fixtures

Located in [`src/mocks/data/auth.fixtures.ts`](./src/mocks/data/auth.fixtures.ts):

```typescript
import { mockUsers, mockCredentials, mockTokens } from '@/mocks/data/auth.fixtures';

// Example usage in tests:
const adminUser = mockUsers.admin;
const validCredentials = mockCredentials.validAdmin;
const accessToken = mockTokens.accessToken;
```

### Users Fixtures

Located in [`src/mocks/data/users.fixtures.ts`](./src/mocks/data/users.fixtures.ts):

```typescript
import {
  mockUsersList,
  mockPaginatedUsersPage1,
  filterUsers,
  paginateUsers
} from '@/mocks/data/users.fixtures';
```

### Queue Fixtures

Located in [`src/mocks/data/queue.fixtures.ts`](./src/mocks/data/queue.fixtures.ts):

```typescript
import {
  mockQueueCalls,
  mockQueueStats,
  calculateQueueStats
} from '@/mocks/data/queue.fixtures';
```

## MSW API Mocking

### How MSW Works

MSW intercepts network requests at the **network level** and returns mock responses. Your code uses the real API client - no axios mocks needed!

```
Your Code (api-client.ts)
    ↓ axios.post('/api/v1/auth/login', data)
    ↓
MSW Intercepts Request (in Node.js)
    ↓
Returns Mock Response from Handler
    ↓
Your Code Processes Response
    ✅ Test Passes
```

### Available Handlers

All handlers are in `src/mocks/handlers/`:

#### Auth Handlers ([`auth.handlers.ts`](./src/mocks/handlers/auth.handlers.ts))
- `POST /api/v1/auth/login` - Login with credentials
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout current device
- `POST /api/v1/auth/logout-all` - Logout all devices
- `PATCH /api/v1/auth/change-password` - Change password

#### Users Handlers ([`users.handlers.ts`](./src/mocks/handlers/users.handlers.ts))
- `GET /api/v1/users` - List users (with pagination/filters)
- `GET /api/v1/users/:id` - Get specific user
- `POST /api/v1/auth/register` - Create user
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Deactivate user
- `POST /api/v1/users/:id/reset-password` - Reset password

#### Queue Handlers ([`queue.handlers.ts`](./src/mocks/handlers/queue.handlers.ts))
- `GET /api/queue/calls` - Get all queue calls
- `POST /api/queue/calls` - Add call to queue
- `DELETE /api/queue/calls/:id` - Remove call
- `PATCH /api/queue/calls/:id` - Update call
- `GET /api/queue/stats` - Get queue statistics

### Overriding Handlers in Tests

```typescript
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

test('custom API behavior', () => {
  // Override handler for this test only
  server.use(
    http.get('/api/v1/custom', () => {
      return HttpResponse.json({ custom: 'data' });
    })
  );

  // Test code...
});

// Handler automatically resets after the test
```

### Testing Network Errors

```typescript
test('handles network error', async () => {
  server.use(
    http.post('/api/v1/auth/login', () => {
      return HttpResponse.error();
    })
  );

  await expect(login(credentials)).rejects.toThrow();
});
```

## Best Practices

### ✅ Do's

1. **Use MSW for all API tests** - Don't mock axios directly
2. **Reset state between tests** - Clear storage, reset managers
3. **Test behavior, not implementation** - Focus on user-facing functionality
4. **Use semantic queries** - `getByRole`, `getByLabelText` over `getByTestId`
5. **Test error states** - Don't only test happy paths
6. **Keep tests focused** - One concept per test
7. **Use descriptive test names** - `it('should X when Y')` format

### ❌ Don'ts

1. **Don't test implementation details** - Avoid testing internal state
2. **Don't mock what you don't own** - Use MSW instead of mocking axios
3. **Don't share state between tests** - Each test should be independent
4. **Don't skip cleanup** - Always clear state in `beforeEach`/`afterEach`
5. **Don't test third-party libraries** - Trust that Radix UI works

### Test Naming Convention

```typescript
describe('ComponentName or FeatureName', () => {
  describe('specific functionality', () => {
    it('should do X when Y happens', () => {
      // Arrange
      const data = setupTestData();

      // Act
      const result = performAction(data);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

## Troubleshooting

### Issue: MSW not intercepting requests

**Solution:** Ensure MSW server is started in `setup.ts`. For unit tests that don't need MSW, you can mock it:

```typescript
jest.mock('../../mocks/server', () => ({
  server: {
    listen: jest.fn(),
    resetHandlers: jest.fn(),
    close: jest.fn(),
  },
}));
```

### Issue: localStorage/sessionStorage not available

**Solution:** Already configured in `src/test/setup.ts`. Ensure you're importing from the test file.

### Issue: Next.js router not working in tests

**Solution:** Router is auto-mocked in `setup.ts`. For custom router behavior:

```typescript
import { useRouter } from 'next/navigation';

jest.mocked(useRouter).mockReturnValue({
  push: mockPush,
  // ... other methods
});
```

### Issue: Tests timing out

**Solution:** Check for:
1. Missing `await` on async operations
2. Infinite loops in components
3. Unresolved promises

Use `waitFor` from Testing Library:

```typescript
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### Issue: Coverage not generated

**Solution:** Run `npm run test:coverage` instead of `npm test`.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

**Note:** No backend services, Docker, or database setup required!

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Next Steps

To continue building the test suite:

1. **API Client Tests** - Test the interceptor logic and token refresh flow
2. **Auth Context Tests** - Test the authentication state management
3. **Component Tests** - Test LoginPage, ProtectedRoute, etc.
4. **Integration Tests** - Test complete user flows (login → dashboard → logout)

All the infrastructure is ready - just add more test files following the existing patterns!

---

**Questions?** Check the existing tests in `src/lib/__tests__/token-manager.test.ts` for reference examples.
