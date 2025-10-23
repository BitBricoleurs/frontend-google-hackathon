# Guide: Adding New Tests

This guide walks you through creating tests for new features as you build them. Follow these step-by-step instructions to maintain comprehensive test coverage.

## 📋 Table of Contents

- [Quick Start Checklist](#quick-start-checklist)
- [Step-by-Step Guide](#step-by-step-guide)
- [Test Type Decision Tree](#test-type-decision-tree)
- [Detailed Examples](#detailed-examples)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

---

## Quick Start Checklist

When adding a new feature, follow this checklist:

- [ ] 1. **Identify what to test** - API, component, utility, or integration?
- [ ] 2. **Create mock data fixtures** (if API-dependent)
- [ ] 3. **Create/update MSW handlers** (if API-dependent)
- [ ] 4. **Write test file** in `__tests__` folder
- [ ] 5. **Run tests** - `npm test -- path/to/test.ts`
- [ ] 6. **Verify coverage** - `npm run test:coverage`
- [ ] 7. **Commit tests** with feature code

---

## Step-by-Step Guide

### Step 1: Determine What You're Testing

Ask yourself:

| Question | Answer | Test Type |
|----------|--------|-----------|
| Does it make API calls? | Yes | **API Test** (with MSW) |
| Is it a React component? | Yes | **Component Test** |
| Is it a utility/helper function? | Yes | **Unit Test** |
| Does it involve multiple layers? | Yes | **Integration Test** |

### Step 2: Create Mock Data Fixtures (If Needed)

**When:** You're testing something that uses API data

**Where:** `src/mocks/data/[feature].fixtures.ts`

#### Example: Adding Notification Feature

**File:** `src/mocks/data/notifications.fixtures.ts`

```typescript
/**
 * Notifications Mock Data Fixtures
 */

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: Date;
}

/**
 * Mock notifications list
 */
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: '1',
    message: 'New call assigned to you',
    type: 'info',
    isRead: false,
    createdAt: new Date('2024-10-20T10:00:00Z'),
  },
  {
    id: 'notif-2',
    userId: '1',
    message: 'System maintenance scheduled',
    type: 'warning',
    isRead: true,
    createdAt: new Date('2024-10-19T15:30:00Z'),
  },
];

/**
 * Mock unread notifications
 */
export const mockUnreadNotifications = mockNotifications.filter(
  (n) => !n.isRead
);

/**
 * Mock new notification to create
 */
export const mockNewNotification: Omit<Notification, 'id' | 'createdAt'> = {
  userId: '1',
  message: 'Test notification',
  type: 'info',
  isRead: false,
};

/**
 * Helper to filter notifications by type
 */
export function filterByType(
  notifications: Notification[],
  type: Notification['type']
): Notification[] {
  return notifications.filter((n) => n.type === type);
}
```

**Key Points:**
- Export mock data as constants
- Include edge cases (empty, error states)
- Add helper functions for common operations
- Use TypeScript interfaces for type safety

### Step 3: Create MSW Handlers (If API-Dependent)

**When:** Your feature makes HTTP requests

**Where:** `src/mocks/handlers/[feature].handlers.ts`

#### Example: Notification Handlers

**File:** `src/mocks/handlers/notifications.handlers.ts`

```typescript
/**
 * MSW Notification Handlers
 */

import { http, HttpResponse } from 'msw';
import {
  mockNotifications,
  mockNewNotification,
} from '../data/notifications.fixtures';
import type { Notification } from '../data/notifications.fixtures';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// In-memory store for testing
let notificationsStore = [...mockNotifications];

export const notificationsHandlers = [
  /**
   * GET /api/v1/notifications
   * Get all notifications for current user
   */
  http.get(`${API_BASE_URL}/api/v1/notifications`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Filter by query params
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

    let filtered = notificationsStore;
    if (unreadOnly) {
      filtered = filtered.filter((n) => !n.isRead);
    }

    return HttpResponse.json(
      { success: true, data: filtered },
      { status: 200 }
    );
  }),

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark notification as read
   */
  http.patch(
    `${API_BASE_URL}/api/v1/notifications/:id/read`,
    ({ request, params }) => {
      const authHeader = request.headers.get('Authorization');

      if (!authHeader) {
        return HttpResponse.json(
          { error: { message: 'Unauthorized' } },
          { status: 401 }
        );
      }

      const { id } = params;
      const notifIndex = notificationsStore.findIndex((n) => n.id === id);

      if (notifIndex === -1) {
        return HttpResponse.json(
          { error: { message: 'Notification not found' } },
          { status: 404 }
        );
      }

      notificationsStore[notifIndex].isRead = true;

      return HttpResponse.json(
        { success: true, data: notificationsStore[notifIndex] },
        { status: 200 }
      );
    }
  ),
];

/**
 * Helper to reset store (for testing)
 */
export function resetNotificationsStore() {
  notificationsStore = [...mockNotifications];
}
```

#### Step 3.1: Register Handlers

Add your handlers to the main handlers file:

**File:** `src/mocks/handlers/index.ts`

```typescript
import { authHandlers } from './auth.handlers';
import { usersHandlers } from './users.handlers';
import { queueHandlers } from './queue.handlers';
import { notificationsHandlers } from './notifications.handlers'; // Add this

export const handlers = [
  ...authHandlers,
  ...usersHandlers,
  ...queueHandlers,
  ...notificationsHandlers, // Add this
];
```

### Step 4: Write Your Test File

**Where:** Co-locate tests with source code in `__tests__` folder

#### Example 1: API/Service Test

**File:** `src/api/__tests__/notifications.test.ts`

```typescript
/**
 * Notifications API Tests
 */

import { getNotifications, markAsRead } from '../notifications';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockNotifications } from '@/mocks/data/notifications.fixtures';

describe('Notifications API', () => {
  describe('getNotifications', () => {
    it('should fetch all notifications', async () => {
      const result = await getNotifications();

      expect(result).toHaveLength(mockNotifications.length);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('message');
    });

    it('should fetch only unread notifications', async () => {
      const result = await getNotifications({ unreadOnly: true });

      expect(result.every((n) => !n.isRead)).toBe(true);
    });

    it('should handle unauthorized error', async () => {
      // Override handler for this test
      server.use(
        http.get('/api/v1/notifications', () => {
          return HttpResponse.json(
            { error: { message: 'Unauthorized' } },
            { status: 401 }
          );
        })
      );

      await expect(getNotifications()).rejects.toThrow('Unauthorized');
    });

    it('should handle network errors', async () => {
      server.use(
        http.get('/api/v1/notifications', () => {
          return HttpResponse.error();
        })
      );

      await expect(getNotifications()).rejects.toThrow();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notifId = mockNotifications[0].id;

      const result = await markAsRead(notifId);

      expect(result.isRead).toBe(true);
    });

    it('should handle non-existent notification', async () => {
      server.use(
        http.patch('/api/v1/notifications/:id/read', () => {
          return HttpResponse.json(
            { error: { message: 'Notification not found' } },
            { status: 404 }
          );
        })
      );

      await expect(markAsRead('invalid-id')).rejects.toThrow(
        'Notification not found'
      );
    });
  });
});
```

#### Example 2: Component Test

**File:** `src/components/notifications/__tests__/notification-list.test.tsx`

```typescript
/**
 * NotificationList Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { NotificationList } from '../notification-list';
import { mockNotifications } from '@/mocks/data/notifications.fixtures';

describe('NotificationList', () => {
  it('should render list of notifications', async () => {
    renderWithProviders(<NotificationList />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(mockNotifications[0].message)).toBeInTheDocument();
    });

    expect(screen.getByText(mockNotifications[1].message)).toBeInTheDocument();
  });

  it('should display loading state', () => {
    renderWithProviders(<NotificationList />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should mark notification as read on click', async () => {
    const user = userEvent.setup();

    renderWithProviders(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByText(mockNotifications[0].message)).toBeInTheDocument();
    });

    const unreadNotification = screen.getByText(mockNotifications[0].message);

    await user.click(unreadNotification);

    // Verify it's marked as read (e.g., style changed)
    await waitFor(() => {
      expect(unreadNotification).toHaveClass('notification-read');
    });
  });

  it('should filter to show only unread', async () => {
    const user = userEvent.setup();

    renderWithProviders(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByText(/all notifications/i)).toBeInTheDocument();
    });

    const unreadFilter = screen.getByRole('button', { name: /unread only/i });
    await user.click(unreadFilter);

    await waitFor(() => {
      const notifications = screen.getAllByRole('listitem');
      expect(notifications).toHaveLength(1); // Only 1 unread in mock data
    });
  });

  it('should display empty state when no notifications', async () => {
    // Override handler to return empty array
    server.use(
      http.get('/api/v1/notifications', () => {
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    renderWithProviders(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
    });
  });
});
```

#### Example 3: Utility/Hook Test

**File:** `src/hooks/__tests__/use-notifications.test.ts`

```typescript
/**
 * useNotifications Hook Tests
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useNotifications } from '../use-notifications';
import { AllProviders } from '@/test/utils';

describe('useNotifications', () => {
  it('should fetch notifications on mount', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: AllProviders,
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(2);
  });

  it('should mark notification as read', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: AllProviders,
    });

    await waitFor(() => {
      expect(result.current.notifications).toBeDefined();
    });

    const notifId = result.current.notifications![0].id;

    await result.current.markAsRead(notifId);

    await waitFor(() => {
      const notification = result.current.notifications!.find(
        (n) => n.id === notifId
      );
      expect(notification?.isRead).toBe(true);
    });
  });

  it('should refetch notifications', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: AllProviders,
    });

    await waitFor(() => {
      expect(result.current.notifications).toBeDefined();
    });

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });
  });
});
```

### Step 5: Run and Verify Tests

```bash
# Run your new tests
npm test -- src/api/__tests__/notifications.test.ts

# Run in watch mode while developing
npm run test:watch -- notifications

# Check coverage
npm run test:coverage -- --collectCoverageFrom=src/api/notifications.ts
```

**Expected Output:**
```
PASS  src/api/__tests__/notifications.test.ts
  Notifications API
    getNotifications
      ✓ should fetch all notifications (25ms)
      ✓ should fetch only unread notifications (15ms)
      ✓ should handle unauthorized error (10ms)
      ✓ should handle network errors (8ms)
    markAsRead
      ✓ should mark notification as read (12ms)
      ✓ should handle non-existent notification (9ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

---

## Test Type Decision Tree

```
                    START
                      |
          Does it render UI?
                /           \
              YES            NO
               |              |
        Component Test    Makes API calls?
               |           /          \
        Use Testing     YES           NO
         Library         |             |
               |     API Test      Utility Test
        renderWithProviders()        |
               |                  Pure Jest
        User interactions
        waitFor async updates
```

---

## Common Patterns

### Pattern 1: Testing with TanStack Query

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMyQuery } from '../useMyQuery';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

it('should fetch data', async () => {
  const { result } = renderHook(() => useMyQuery(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(result.current.data).toBeDefined();
});
```

### Pattern 2: Testing Forms

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should validate form and show errors', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();

  render(<MyForm onSubmit={onSubmit} />);

  // Submit without filling
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // Check validation errors
  expect(await screen.findByText(/required/i)).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();

  // Fill form correctly
  await user.type(screen.getByLabelText(/name/i), 'John');
  await user.type(screen.getByLabelText(/email/i), 'john@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // Should submit
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John',
      email: 'john@example.com',
    });
  });
});
```

### Pattern 3: Testing Context/State

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyProvider, useMyContext } from '../my-context';

function TestComponent() {
  const { value, increment } = useMyContext();

  return (
    <div>
      <span data-testid="value">{value}</span>
      <button onClick={increment}>Increment</button>
    </div>
  );
}

it('should update context value', async () => {
  const user = userEvent.setup();

  render(
    <MyProvider>
      <TestComponent />
    </MyProvider>
  );

  expect(screen.getByTestId('value')).toHaveTextContent('0');

  await user.click(screen.getByRole('button', { name: /increment/i }));

  expect(screen.getByTestId('value')).toHaveTextContent('1');
});
```

### Pattern 4: Testing Error Boundaries

```typescript
it('should render error boundary on component error', () => {
  // Suppress console.error for this test
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

  consoleSpy.mockRestore();
});
```

---

## Troubleshooting

### Problem: "MSW handler not being called"

**Symptoms:** Test passes but using wrong/default data

**Solutions:**
1. Check handler URL matches exactly (including base URL)
2. Ensure handler is added to `src/mocks/handlers/index.ts`
3. Verify request method (GET vs POST vs PATCH)
4. Add console.log in handler to debug
5. Check MSW server is started (`src/test/setup.ts`)

```typescript
// Debug: Add logging
http.get('/api/v1/my-endpoint', ({ request }) => {
  console.log('Handler called!', request.url);
  return HttpResponse.json({ data: 'test' });
});
```

### Problem: "Act warnings" in component tests

**Symptoms:** `Warning: An update to X inside a test was not wrapped in act(...)`

**Solutions:**
1. Use `waitFor` for async state updates
2. Use `findBy` instead of `getBy` for async elements
3. Ensure all promises are awaited

```typescript
// ❌ Bad
expect(screen.getByText('Loaded')).toBeInTheDocument();

// ✅ Good
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// ✅ Even better
expect(await screen.findByText('Loaded')).toBeInTheDocument();
```

### Problem: "Tests interfering with each other"

**Symptoms:** Tests pass individually but fail when run together

**Solutions:**
1. Reset stores in `beforeEach` or `afterEach`
2. Clear mocks between tests
3. Isolate test data

```typescript
import { resetNotificationsStore } from '@/mocks/handlers/notifications.handlers';

beforeEach(() => {
  resetNotificationsStore();
  localStorage.clear();
  jest.clearAllMocks();
});
```

### Problem: "Type errors in test files"

**Symptoms:** TypeScript complains about test syntax

**Solutions:**
1. Ensure `@types/jest` is installed
2. Check `tsconfig.json` includes test files
3. Use proper imports from `@testing-library/react`

```json
// tsconfig.json
{
  "include": ["src/**/*", "src/**/__tests__/**/*"]
}
```

---

## Next Feature Checklist

Use this template when adding a new feature:

```markdown
## Feature: [Feature Name]

### 1. Mock Data Created
- [ ] Created `src/mocks/data/[feature].fixtures.ts`
- [ ] Defined TypeScript interfaces
- [ ] Added mock data arrays
- [ ] Added helper functions

### 2. MSW Handlers Created
- [ ] Created `src/mocks/handlers/[feature].handlers.ts`
- [ ] Added GET endpoints
- [ ] Added POST/PATCH/DELETE endpoints (if applicable)
- [ ] Added error handling
- [ ] Registered in `src/mocks/handlers/index.ts`

### 3. Tests Written
- [ ] API tests (`src/api/__tests__/[feature].test.ts`)
- [ ] Component tests (`src/components/[feature]/__tests__/*.test.tsx`)
- [ ] Hook tests (if applicable)
- [ ] Integration tests (if applicable)

### 4. Test Coverage
- [ ] All tests passing
- [ ] Coverage > 70% for new code
- [ ] Edge cases tested
- [ ] Error states tested

### 5. Documentation
- [ ] Added JSDoc comments
- [ ] Updated TESTING.md if needed
- [ ] Added examples to ADDING_TESTS.md
```

---

## Quick Reference

### Essential Imports

```typescript
// Component Testing
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';

// API Testing
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

// Hook Testing
import { renderHook } from '@testing-library/react';

// Fixtures
import { mockData } from '@/mocks/data/feature.fixtures';
```

### Common Matchers

```typescript
// Existence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Visibility
expect(element).toBeVisible();
expect(element).not.toBeVisible();

// Values
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(array).toHaveLength(3);

// Async
await waitFor(() => expect(element).toBeInTheDocument());
expect(await screen.findByText('text')).toBeInTheDocument();

// Promises
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow('error');
```

---

**Happy Testing! 🎉**

For more examples, see the existing test files in the codebase.
