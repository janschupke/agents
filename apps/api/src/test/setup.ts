// Jest setup file to filter expected console errors from test output

const originalError = console.error;
const originalWarn = console.warn;
const originalStderrWrite = process.stderr.write.bind(process.stderr);

// Patterns to filter out (expected test errors)
const errorFilters = [
  /Webhook verification failed/,
  /Invalid signature/,
  /Failed to update Clerk roles/,
  /Clerk API error/,
  /Error generating embedding/,
  /No embedding returned from OpenAI/,
  /API error/,
  /\[Nest\].*ERROR \[ClerkWebhookService\]/,
  /\[Nest\].*ERROR \[ClerkService\]/,
];

const warnFilters = [
  /Webhook verification failed/,
  /Invalid signature/,
];

// Override console.error to filter expected errors
console.error = (...args: unknown[]) => {
  const message = args.join(' ');
  
  // Check if this error should be filtered
  const shouldFilter = errorFilters.some((pattern) => pattern.test(message));
  
  if (!shouldFilter) {
    originalError(...args);
  }
};

// Override console.warn to filter expected warnings
console.warn = (...args: unknown[]) => {
  const message = args.join(' ');
  
  // Check if this warning should be filtered
  const shouldFilter = warnFilters.some((pattern) => pattern.test(message));
  
  if (!shouldFilter) {
    originalWarn(...args);
  }
};

// Override process.stderr.write to filter NestJS logger output
// Use type assertion to handle overloads properly
(process.stderr as { write: typeof originalStderrWrite }).write = (
  chunk: string | Uint8Array,
  encodingOrCb?: BufferEncoding | ((err?: Error | null) => void),
  cb?: (err?: Error | null) => void
) => {
  const message = typeof chunk === 'string' ? chunk : chunk.toString();
  
  // Check if this stderr output should be filtered
  const shouldFilter = errorFilters.some((pattern) => pattern.test(message));
  
  if (!shouldFilter) {
    // Handle different overloads
    if (typeof encodingOrCb === 'function') {
      return originalStderrWrite(chunk, encodingOrCb);
    }
    if (cb) {
      return originalStderrWrite(chunk, encodingOrCb as BufferEncoding, cb);
    }
    if (encodingOrCb) {
      return originalStderrWrite(chunk, encodingOrCb as BufferEncoding);
    }
    return originalStderrWrite(chunk);
  }
  
  // If filtered, call callback if provided
  if (typeof encodingOrCb === 'function') {
    encodingOrCb();
  } else if (cb) {
    cb();
  }
  
  return true;
};
