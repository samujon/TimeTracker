require('@testing-library/jest-dom');

if (!window.matchMedia) {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: jest.fn().mockImplementation((query) => ({
			matches: query === '(prefers-color-scheme: dark)',
			media: query,
			onchange: null,
			addListener: jest.fn(),
			removeListener: jest.fn(),
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			dispatchEvent: jest.fn(),
		})),
	});
}
