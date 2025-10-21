/**
 * MSW Server Setup
 *
 * Configures Mock Service Worker for Node.js (Jest) environment
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW Server for Node.js testing environment
 *
 * This server intercepts network requests during tests and returns
 * mock responses defined in the handlers.
 *
 * Usage in tests:
 * - Started automatically via src/test/setup.ts before all tests
 * - Reset handlers after each test to prevent interference
 * - Closed after all tests complete
 *
 * To override handlers in specific tests:
 * ```ts
 * import { server } from '@/mocks/server';
 * import { http, HttpResponse } from 'msw';
 *
 * test('custom behavior', () => {
 *   server.use(
 *     http.get('/api/v1/custom', () => {
 *       return HttpResponse.json({ custom: 'data' });
 *     })
 *   );
 *   // Test code...
 * });
 * ```
 */
export const server = setupServer(...handlers);
