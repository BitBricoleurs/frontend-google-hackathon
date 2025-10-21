/**
 * MSW Handlers Index
 *
 * Combines all API handlers for MSW server
 */

import { authHandlers } from './auth.handlers';
import { usersHandlers } from './users.handlers';
import { queueHandlers } from './queue.handlers';

/**
 * All API mock handlers
 * These will be used by the MSW server to intercept network requests
 */
export const handlers = [
  ...authHandlers,
  ...usersHandlers,
  ...queueHandlers,
];
