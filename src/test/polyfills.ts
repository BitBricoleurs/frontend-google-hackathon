/**
 * Jest Polyfills
 *
 * Global polyfills required for MSW and other browser APIs in Node.js environment
 */

import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, TransformStream } from 'stream/web';

// Add TextEncoder/TextDecoder to global
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Add stream APIs
global.ReadableStream = ReadableStream as any;
global.TransformStream = TransformStream as any;

// Add Response polyfill if needed
if (typeof global.Response === 'undefined') {
  global.Response = Response as any;
}

// Add Request polyfill if needed
if (typeof global.Request === 'undefined') {
  global.Request = Request as any;
}

// Add Headers polyfill if needed
if (typeof global.Headers === 'undefined') {
  global.Headers = Headers as any;
}
