/**
 * Jest Polyfills
 *
 * Global polyfills required for MSW and other browser APIs in Node.js environment
 */

import "whatwg-fetch";
import { TextEncoder, TextDecoder } from "util";
import { ReadableStream, TransformStream } from "stream/web";

// Add TextEncoder/TextDecoder to global
global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Add stream APIs
global.ReadableStream = ReadableStream as typeof global.ReadableStream;
global.TransformStream = TransformStream as typeof global.TransformStream;

// Add Response polyfill if needed
if (typeof global.Response === "undefined") {
  global.Response = Response as typeof global.Response;
}

// Add Request polyfill if needed
if (typeof global.Request === "undefined") {
  global.Request = Request as typeof global.Request;
}

// Add Headers polyfill if needed
if (typeof global.Headers === "undefined") {
  global.Headers = Headers as typeof global.Headers;
}
