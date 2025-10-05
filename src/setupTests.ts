import '@testing-library/jest-dom';

// Polyfills for TextEncoder/TextDecoder used by some libraries (react-router, etc.)
// test-setup: allow some any usage
/* eslint-disable @typescript-eslint/no-explicit-any */
if (typeof (globalThis as any).TextEncoder === 'undefined') {
	(async () => {
		const util = await import('util');
		(globalThis as any).TextEncoder = util.TextEncoder;
		(globalThis as any).TextDecoder = util.TextDecoder;
	})();
}
/* eslint-enable @typescript-eslint/no-explicit-any */
