import '@testing-library/jest-dom';

// Polyfills for TextEncoder/TextDecoder used by some libraries (react-router, etc.)
// Make sure they are defined synchronously for the test runtime
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
if (typeof (globalThis as any).TextEncoder === 'undefined') {
	// require is available in the test environment
		const util = require('util');
	(globalThis as any).TextEncoder = util.TextEncoder;
	(globalThis as any).TextDecoder = util.TextDecoder;
}
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
