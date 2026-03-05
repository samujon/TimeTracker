# Running Unit Tests

To run all unit tests in this project:

```
npm test
```

Or, for watch mode:

```
npm test -- --watch
```

- Test files are now located in the `tests/` directory:
	- `tests/components/` for component tests
	- `tests/hooks/` for hook tests
- Example tests are provided for `TimeTracker` (component) and `useTimer` (hook).

If you encounter dependency warnings due to React 19, tests may still run, but some features of React Testing Library may not be fully supported until official updates are released.
