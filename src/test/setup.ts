/**
 * Jest Test Setup
 *
 * This file runs before all tests and sets up:
 * - @testing-library/jest-dom matchers
 * - MSW (Mock Service Worker) server (optional, can be mocked)
 * - localStorage/sessionStorage mocks
 * - Next.js router mocks
 */

import '@testing-library/jest-dom';

// Only import and setup MSW if it's not mocked
let server: { listen: (options: { onUnhandledRequest: string }) => void; resetHandlers: () => void; close: () => void } | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mswModule = require('../mocks/server');
  server = mswModule.server;

  // Establish API mocking before all tests
  beforeAll(() => {
    // Start MSW server to intercept network requests
    server?.listen({
      onUnhandledRequest: 'warn', // Warn about unhandled requests instead of erroring
    });
  });

  // Reset handlers after each test to prevent test interference
  afterEach(() => {
    server?.resetHandlers();
  });

  // Clean up after all tests
  afterAll(() => {
    server?.close();
  });
} catch {
  // MSW is mocked or not available - skip setup (this is expected for some tests)
  // Silently continue - no need to warn
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

// Assign mocks to global
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Clear storage before each test
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
}));

// Suppress expected console errors in tests
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  console.log = (...args: unknown[]) => {
    // Filter out API client debug logs in tests
    if (typeof args[0] === 'string' && args[0] === 'error') {
      return;
    }
    if (typeof args[0] === 'string' && args[0] === 'errorData') {
      return;
    }
    originalLog.call(console, ...args);
  };

  console.error = (...args: unknown[]) => {
    // Filter out expected errors from tests
    if (typeof args[0] === 'string') {
      // React/testing warnings
      if (
        args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Warning: useLayoutEffect') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.requestSubmit')
      ) {
        return;
      }
      // Expected token manager errors (testing error handling)
      if (args[0].includes('Error loading tokens')) {
        return;
      }
      // Expected API errors from tests
      if (args[0].includes('❌ API Error')) {
        return;
      }
    }
    // jsdom navigation warnings (expected in tests)
    if (typeof args[0] === 'object' && args[0] !== null && 'message' in args[0]) {
      const errorObj = args[0] as { message?: string };
      if (typeof errorObj.message === 'string' && errorObj.message.includes('Not implemented: navigation')) {
        return;
      }
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    // Filter out expected warnings
    if (typeof args[0] === 'string') {
      // MSW setup warnings (expected when MSW is mocked)
      if (args[0].includes('MSW not available')) {
        return;
      }
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});
