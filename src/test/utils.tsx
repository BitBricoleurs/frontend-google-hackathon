/**
 * Test Utilities
 *
 * Custom render functions and test helpers that wrap components
 * with necessary providers (Auth, Query, etc.)
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/auth-context';

/**
 * Create a new QueryClient for each test
 * This prevents test interference via shared cache
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry failed queries in tests
        gcTime: Infinity, // Keep data in cache for debugging
      },
      mutations: {
        retry: false, // Don't retry failed mutations in tests
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress error logs in tests
    },
  });
}

/**
 * Wrapper component that provides all necessary context providers
 */
interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export function AllProviders({ children, queryClient }: AllProvidersProps) {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render function that wraps components with providers
 *
 * Usage:
 *   render(<MyComponent />, { wrapper: AllProviders })
 *   // Or use renderWithProviders for convenience
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, ...renderOptions } = options || {};

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders queryClient={queryClient}>{children}</AllProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: queryClient || createTestQueryClient(),
  };
}

/**
 * Custom render for components that only need QueryClient (no Auth)
 */
export function renderWithQueryClient(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, ...renderOptions } = options || {};
  const client = queryClient || createTestQueryClient();

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: client,
  };
}

/**
 * Wait for async operations to complete
 * Useful for waiting for state updates, API calls, etc.
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mock user data for tests
 */
export const mockUsers = {
  admin: {
    id: '1',
    employeeId: 'ADMIN001',
    name: 'John Admin',
    role: 'ADMIN' as const,
    isActive: true,
  },
  operator: {
    id: '2',
    employeeId: 'OPER001',
    name: 'Jane Operator',
    role: 'OPERATOR' as const,
    isActive: true,
  },
  inactive: {
    id: '3',
    employeeId: 'INACT001',
    name: 'Inactive User',
    role: 'OPERATOR' as const,
    isActive: false,
  },
};

/**
 * Mock token data
 */
export const mockTokens = {
  accessToken: 'mock-access-token-12345',
  refreshToken: 'mock-refresh-token-67890',
  expiredToken: 'mock-expired-token',
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
